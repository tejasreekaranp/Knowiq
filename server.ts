import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { generateDynamicSubtopicContent, generateFallbackSyllabus } from './src/server/contentGenerator';
import {
  extractCourseSource,
  flattenUnitsToCourseTopics,
  generateSourceGroundedContent,
  diagnoseSubtopicClarity,
  deterministicSourceExtractor,
} from './src/server/sourceEngine';
import {
  subtopicContentRequestSchema,
  diagnoseClarityRequestSchema,
  generateRevisionRequestSchema,
  geminiSubtopicContentSchema,
  geminiDiagnoseClaritySchema,
  topicAnalysisRequestSchema,
  conceptualClarityRequestSchema,
  interactiveQuestionSchema,
  generateQuestionRequestSchema,
  answerEvaluationRequestSchema,
} from './src/lib/schemas';
import { runTopicAnalysisPipeline } from './src/server/topicEngine';
import {
  generateConceptualClarity,
  generateInteractiveQuestion,
  evaluateAnswer,
  calculateWeightedClarity,
} from './src/server/learningEngine';

dotenv.config();

const app = express();
const PORT = 3000;

// Security Middleware: Headers & Body limit
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '2mb' }));

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory cache to conserve quota and deliver instantaneous responses
const aiResponseCache = new Map<string, string>();
let quotaCooldownUntil = 0;
let demandCooldownUntil = 0;

// Resilient Gemini caller with backoff retry, caching, and circuit breaker
async function callGeminiWithRetry(
  ai: GoogleGenAI | null,
  prompt: string,
  options?: { responseMimeType?: string }
): Promise<string | null> {
  if (!ai) return null;

  // Check in-memory cache first to avoid unnecessary API calls and conserve quota
  const cacheKey = `${options?.responseMimeType || 'text'}:${prompt.slice(0, 200)}:${prompt.length}`;
  if (aiResponseCache.has(cacheKey)) {
    return aiResponseCache.get(cacheKey)!;
  }

  // Circuit breaker: if quota was exhausted or model in 503 demand cooldown, gracefully fallback
  const now = Date.now();
  if (now < quotaCooldownUntil || now < demandCooldownUntil) {
    return null;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Model call timeout')), 25000)
    );
    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: options?.responseMimeType ? { responseMimeType: options.responseMimeType } : undefined,
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    if (response && response.text) {
      aiResponseCache.set(cacheKey, response.text);
      return response.text;
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    const isQuotaExhausted = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
    const isHighDemand = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');

    if (isQuotaExhausted) {
      // 60-second cooldown so subsequent requests don't repeatedly fail with 429
      quotaCooldownUntil = Date.now() + 60_000;
    } else if (isHighDemand) {
      // 15-second cooldown for temporary 503 spikes
      demandCooldownUntil = Date.now() + 15_000;
    }
  }
  return null;
}

// Safely parse JSON that may have code fences or formatting quirks
function safeJsonParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Source Extraction Preview (Before creating/saving course)
app.post('/api/ai/extract-preview', async (req, res) => {
  const { courseName, subject, academicLevel } = req.body;
  const syllabusText = req.body.syllabusText || req.body.syllabus;
  const materialsSummary = req.body.materialsSummary || req.body.materials;
  try {
    const ai = getGeminiClient();
    const extraction = await extractCourseSource(ai, callGeminiWithRetry, {
      courseName,
      subject,
      academicLevel,
      syllabusText,
      materialsSummary,
    });
    res.json(extraction);
  } catch (err: any) {
    const fallback = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
    res.json(fallback);
  }
});

// 2. Generate Course Syllabus & Topics (Source-First Decomposition)
app.post('/api/ai/syllabus', async (req, res) => {
  const { courseName, subject, academicLevel, durationDays = 30 } = req.body;
  const syllabusText = req.body.syllabusText || req.body.syllabus;
  const materialsSummary = req.body.materialsSummary || req.body.materials;
  try {
    const ai = getGeminiClient();
    const extraction = await extractCourseSource(ai, callGeminiWithRetry, {
      courseName,
      subject,
      academicLevel,
      syllabusText,
      materialsSummary,
    });

    const topics = flattenUnitsToCourseTopics(extraction, courseName);
    return res.json({ topics, extraction });
  } catch (err: any) {
    console.warn('[Syllabus] Error during extraction, using deterministic fallback:', err);
    const fallbackExtraction = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
    const topics = flattenUnitsToCourseTopics(fallbackExtraction, courseName);
    res.json({ topics, extraction: fallbackExtraction });
  }
});

// 2b. Topic Analysis & Conceptual Clarity Engine (Selective Decomposition & Medium-Length Clarity)
app.post('/api/ai/analyze-topic', async (req, res) => {
  const requestValidation = topicAnalysisRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: 'Invalid topic analysis request parameters',
      details: requestValidation.error.issues[0]?.message,
    });
  }

  try {
    const ai = getGeminiClient();
    const result = await runTopicAnalysisPipeline(ai, callGeminiWithRetry, requestValidation.data);
    return res.json(result);
  } catch (err: any) {
    console.error('[analyze-topic] Pipeline failed:', err);
    return res.status(500).json({ error: 'Failed to analyze topic' });
  }
});

// 2c. Conceptual Clarity Engine (Source-Grounded 3-6 Paragraph Explanation with Mechanisms & Examples)
app.post('/api/ai/conceptual-clarity', async (req, res) => {
  const requestValidation = conceptualClarityRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: 'Invalid conceptual clarity request parameters',
      details: requestValidation.error.issues[0]?.message,
    });
  }

  try {
    const ai = getGeminiClient();
    const result = await generateConceptualClarity(ai, callGeminiWithRetry, requestValidation.data);
    return res.json(result);
  } catch (err: any) {
    console.error('[conceptual-clarity] Generation failed:', err);
    const fallback = await generateConceptualClarity(null, null, requestValidation.data);
    return res.json(fallback);
  }
});

// 2d. Interactive Didactic Question Engine (Checks Understanding of specific concept being taught)
app.post('/api/ai/interactive-question', async (req, res) => {
  const requestValidation = generateQuestionRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: 'Invalid interactive question request parameters',
      details: requestValidation.error.issues[0]?.message,
    });
  }

  try {
    const ai = getGeminiClient();
    const clarity = requestValidation.data.clarity || await generateConceptualClarity(ai, callGeminiWithRetry, {
      courseName: requestValidation.data.courseName,
      topicTitle: requestValidation.data.topicTitle,
      subtopicTitle: requestValidation.data.subtopicTitle,
      academicLevel: requestValidation.data.academicLevel,
    });
    const result = await generateInteractiveQuestion(ai, callGeminiWithRetry, {
      courseName: requestValidation.data.courseName,
      topicTitle: requestValidation.data.topicTitle,
      subtopicTitle: requestValidation.data.subtopicTitle,
      clarity,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('[interactive-question] Generation failed:', err);
    const fallbackClarity = await generateConceptualClarity(null, null, {
      courseName: requestValidation.data.courseName,
      topicTitle: requestValidation.data.topicTitle,
      subtopicTitle: requestValidation.data.subtopicTitle,
      academicLevel: requestValidation.data.academicLevel,
    });
    const fallback = await generateInteractiveQuestion(null, null, {
      courseName: requestValidation.data.courseName,
      topicTitle: requestValidation.data.topicTitle,
      subtopicTitle: requestValidation.data.subtopicTitle,
      clarity: fallbackClarity,
    });
    return res.json(fallback);
  }
});

// 2e. Answer Evaluation & Didactic Feedback Engine (Explains WHY and recommends adaptive action)
app.post('/api/ai/evaluate-answer', (req, res) => {
  const requestValidation = answerEvaluationRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: 'Invalid answer evaluation request parameters',
      details: requestValidation.error.issues[0]?.message,
    });
  }

  try {
    const result = evaluateAnswer(requestValidation.data);
    return res.json(result);
  } catch (err: any) {
    console.error('[evaluate-answer] Evaluation failed:', err);
    return res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// 3. Generate Full 4-Step Subtopic Learning Content (Source-Grounded)
app.post('/api/ai/subtopic-content', async (req, res) => {
  const requestValidation = subtopicContentRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: 'Invalid request parameters',
      details: requestValidation.error.issues[0]?.message,
    });
  }

  try {
    const ai = getGeminiClient();
    const content = await generateSourceGroundedContent(ai, callGeminiWithRetry, requestValidation.data);
    return res.json(content);
  } catch (err: any) {
    console.error('[subtopic-content] Generation failed, using dynamic packet:', err);
    const fallback = generateDynamicSubtopicContent(
      requestValidation.data.courseName,
      requestValidation.data.topicTitle,
      requestValidation.data.subtopicTitle,
      requestValidation.data.existingClarity
    );
    res.json(fallback);
  }
});

// 4. Diagnose Clarity Engine (Adaptive Cognitive Misconception Detection)
app.post('/api/ai/diagnose-clarity', async (req, res) => {
  const requestValidation = diagnoseClarityRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: 'Invalid quiz response parameters',
      details: requestValidation.error.issues[0]?.message,
    });
  }

  try {
    const ai = getGeminiClient();
    const diagnostic = await diagnoseSubtopicClarity(ai, callGeminiWithRetry, requestValidation.data);
    return res.json(diagnostic);
  } catch (err: any) {
    console.error('[diagnose-clarity] Diagnosis failed, using dynamic diagnostic:', err);
    const diagnostic = await diagnoseSubtopicClarity(null, callGeminiWithRetry, requestValidation.data);
    res.json(diagnostic);
  }
});

// 4. Learning Space Custom Revision Generator
app.post('/api/ai/generate-revision', async (req, res) => {
  const reqVal = generateRevisionRequestSchema.safeParse(req.body);
  const { topicTitles, revisionType, difficulty, questionCount } = reqVal.success
    ? reqVal.data
    : { topicTitles: ['Database Systems'], revisionType: 'Mixed', difficulty: 'Medium', questionCount: 5 };

  try {
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are an adaptive exam generator.
Selected Topics: ${JSON.stringify(topicTitles)}
Revision Type: ${revisionType} (e.g. Objective, Descriptive, Coding, Mixed)
Difficulty Level: ${difficulty} (Easy, Medium, Hard)
Question Count: ${questionCount}

Generate a high-yield adaptive revision test.
For each question provide:
- "id": string
- "question": string
- "options": array of 4 string choices (if objective/mixed), or null if purely descriptive
- "correctIndex": number (0-3)
- "explanation": string detailed explanation or rubric solution

Output strictly JSON:
{
  "title": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": number,
      "explanation": "string"
    }
  ]
}`;

      const raw = await callGeminiWithRetry(ai, prompt, { responseMimeType: 'application/json' });
      const parsed = safeJsonParse(raw);
      if (parsed?.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return res.json(parsed);
      }
    }

    // High demand 503 or offline fallback
    return res.json({
      title: `Custom Revision: ${topicTitles.slice(0, 2).join(' & ')}`,
      questions: [
        {
          id: 'rev-1',
          question: `In the context of ${topicTitles[0] || 'Database Systems'}, what is the primary guarantee of serializability?`,
          options: [
            'Equivalence to some serial execution of transactions',
            'All queries run in parallel without locks',
            'No transactions can ever abort',
            'Tables are read-only'
          ],
          correctIndex: 0,
          explanation: 'A concurrent schedule is serializable if its outcome is computationally equivalent to a serial schedule.'
        },
        {
          id: 'rev-2',
          question: `Which constraint ensures that a foreign key value matches an existing primary key or is NULL?`,
          options: [
            'Referential Integrity Constraint',
            'Entity Integrity Constraint',
            'Domain Constraint',
            'Key Constraint'
          ],
          correctIndex: 0,
          explanation: 'Referential integrity governs foreign key relationships between child and parent tables.'
        },
        {
          id: 'rev-3',
          question: `When decomposing a relation into BCNF, what might be sacrificed compared to 3NF?`,
          options: [
            'Dependency preservation',
            'Lossless-join property',
            'Primary key uniqueness',
            'Table creation capability'
          ],
          correctIndex: 0,
          explanation: 'BCNF is strictly stronger but does not always preserve all functional dependencies.'
        },
        {
          id: 'rev-4',
          question: `Which normal form eliminates partial dependencies on composite candidate keys?`,
          options: ['Second Normal Form (2NF)', 'First Normal Form (1NF)', 'Third Normal Form (3NF)', '5NF'],
          correctIndex: 0,
          explanation: '2NF specifically mandates that every non-prime attribute must depend on the whole candidate key.'
        },
        {
          id: 'rev-5',
          question: `Under Two-Phase Locking (2PL), once a transaction releases any lock, what phase does it enter?`,
          options: ['Shrinking Phase', 'Growing Phase', 'Validation Phase', 'Commit Phase'],
          correctIndex: 0,
          explanation: 'In 2PL, after acquiring all locks (growing phase), the first lock release transitions the transaction to the shrinking phase where no new locks can be acquired.'
        }
      ]
    });
  } catch {
    res.json({
      title: `Revision Test: ${topicTitles[0] || 'Core Review'}`,
      questions: [
        {
          id: 'rev-err-1',
          question: `What is the core condition for relational data integrity?`,
          options: ['Entity and referential integrity constraints', 'Random data typing', 'No primary keys', 'Single table flat design'],
          correctIndex: 0,
          explanation: 'Entity and referential constraints maintain the structural integrity of relational databases.'
        }
      ]
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KnowIQ Adaptive Learning Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
