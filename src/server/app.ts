import express from 'express';
import dotenv from 'dotenv';
import { generateDynamicSubtopicContent } from './contentGenerator';
import {
  extractCourseSource,
  flattenUnitsToCourseTopics,
  generateSourceGroundedContent,
  diagnoseSubtopicClarity,
  deterministicSourceExtractor,
} from './sourceEngine';
import {
  subtopicContentRequestSchema,
  diagnoseClarityRequestSchema,
  generateRevisionRequestSchema,
  topicAnalysisRequestSchema,
  conceptualClarityRequestSchema,
  generateQuestionRequestSchema,
  answerEvaluationRequestSchema,
} from '../lib/schemas';
import { runTopicAnalysisPipeline } from './topicEngine';
import {
  generateConceptualClarity,
  generateInteractiveQuestion,
  evaluateAnswer,
} from './learningEngine';

dotenv.config();

const app = express();

// Security Middleware: Headers & Body limit
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '2mb' }));

// Request Logging Middleware (without logging sensitive bodies or credentials)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const url = req.originalUrl || req.url;
    if (url.startsWith('/api') || url.startsWith('/health')) {
      console.log(`[API ${new Date().toISOString()}] ${req.method} ${url} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

import { getGeminiClient, callGeminiWithRetry } from './gemini';

// Create dedicated API router for all endpoints
const apiRouter = express.Router();

// Health check endpoint (matches both GET /api/health and GET /health)
apiRouter.get('/health', (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: 'knowiq-api',
  });
});

// 1. Source Extraction Preview (Before creating/saving course)
apiRouter.post('/ai/extract-preview', async (req, res) => {
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
    return res.status(200).json(extraction);
  } catch (err: any) {
    console.warn('[extract-preview] Falling back to deterministic extractor:', err);
    const fallback = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
    return res.status(200).json(fallback);
  }
});

// 2. Generate Course Syllabus & Topics (Source-First Decomposition)
apiRouter.post('/ai/syllabus', async (req, res) => {
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

    const topics = flattenUnitsToCourseTopics(extraction, courseName);
    return res.status(200).json({ topics, extraction });
  } catch (err: any) {
    console.warn('[Syllabus] Error during extraction, using deterministic fallback:', err);
    const fallbackExtraction = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
    const topics = flattenUnitsToCourseTopics(fallbackExtraction, courseName);
    return res.status(200).json({ topics, extraction: fallbackExtraction });
  }
});

// 2b. Topic Analysis & Conceptual Clarity Engine (Selective Decomposition & Medium-Length Clarity)
apiRouter.post('/ai/analyze-topic', async (req, res) => {
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
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[analyze-topic] Pipeline failed:', err);
    return res.status(500).json({ error: 'Failed to analyze topic' });
  }
});

// 2c. Conceptual Clarity Engine (Source-Grounded 3-6 Paragraph Explanation with Mechanisms & Examples)
apiRouter.post('/ai/conceptual-clarity', async (req, res) => {
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
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[conceptual-clarity] Generation failed, using fallback:', err);
    const fallback = await generateConceptualClarity(null, null, requestValidation.data);
    return res.status(200).json(fallback);
  }
});

// 2d. Interactive Didactic Question Engine (Checks Understanding of specific concept being taught)
apiRouter.post('/ai/interactive-question', async (req, res) => {
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
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[interactive-question] Generation failed, using fallback:', err);
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
    return res.status(200).json(fallback);
  }
});

// 2e. Answer Evaluation & Didactic Feedback Engine (Explains WHY and recommends adaptive action)
apiRouter.post('/ai/evaluate-answer', (req, res) => {
  const requestValidation = answerEvaluationRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: 'Invalid answer evaluation request parameters',
      details: requestValidation.error.issues[0]?.message,
    });
  }

  try {
    const result = evaluateAnswer(requestValidation.data);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[evaluate-answer] Evaluation failed:', err);
    return res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// 3. Generate Full 4-Step Subtopic Learning Content (Source-Grounded)
apiRouter.post('/ai/subtopic-content', async (req, res) => {
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
    return res.status(200).json(content);
  } catch (err: any) {
    console.error('[subtopic-content] Generation failed, using dynamic packet:', err);
    const fallback = generateDynamicSubtopicContent(
      requestValidation.data.courseName,
      requestValidation.data.topicTitle,
      requestValidation.data.subtopicTitle,
      requestValidation.data.existingClarity
    );
    return res.status(200).json(fallback);
  }
});

// 4. Diagnose Clarity Engine (Adaptive Cognitive Misconception Detection)
apiRouter.post('/ai/diagnose-clarity', async (req, res) => {
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
    return res.status(200).json(diagnostic);
  } catch (err: any) {
    console.error('[diagnose-clarity] Diagnosis failed, using dynamic diagnostic:', err);
    const diagnostic = await diagnoseSubtopicClarity(null, callGeminiWithRetry, requestValidation.data);
    return res.status(200).json(diagnostic);
  }
});

// 5. Learning Space Custom Revision Generator
apiRouter.post('/ai/generate-revision', async (req, res) => {
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
      if (raw) {
        let text = raw.trim();
        if (text.startsWith('```json')) {
          text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
          text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        try {
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return res.status(200).json(parsed);
          }
        } catch {
          // Fall through to default mock questions
        }
      }
    }

    // High quality deterministic fallback revision test
    return res.status(200).json({
      title: `Curated Revision: ${topicTitles.slice(0, 2).join(' & ')}`,
      questions: [
        {
          id: 'rev-1',
          question: `In relational database design, what is the primary objective of BCNF (Boyce-Codd Normal Form) over 3NF?`,
          options: [
            'Eliminate all functional dependencies where the determinant is not a superkey',
            'Allow transitive dependencies for faster index lookups',
            'Permit multivalued dependencies without creating bridge tables',
            'Force all non-key attributes to depend partially on composite keys'
          ],
          correctIndex: 0,
          explanation: 'BCNF strictly requires every non-trivial functional dependency X -> Y to have X as a superkey, eliminating residual anomalies that can persist in 3NF.'
        },
        {
          id: 'rev-2',
          question: `Which scenario represents an unrecoverable schedule in transaction processing?`,
          options: [
            'A transaction commits after reading dirty data from a transaction that later aborts',
            'Two transactions acquire shared locks on the same data item simultaneously',
            'A transaction rolls back before writing dirty pages to the write-ahead log',
            'A transaction waits in the lock manager queue due to strict two-phase locking'
          ],
          correctIndex: 0,
          explanation: 'Reading dirty data from an uncommitted transaction and committing before it aborts violates recoverability since the commit cannot be rolled back.'
        },
        {
          id: 'rev-3',
          question: `Why do B+ Tree indices store all record pointers in leaf nodes rather than internal nodes?`,
          options: [
            'Leaf nodes can be linked sequentially for fast range scans and higher branching factors',
            'Internal nodes cannot store numerical key comparisons',
            'It minimizes RAM consumption by eliminating tree rebalancing entirely',
            'It prevents hash collisions during point queries'
          ],
          correctIndex: 0,
          explanation: 'Keeping data pointers only in leaf nodes allows internal nodes to store more index keys, maximizing fan-out, and enables linked leaf pointers for O(log N) range queries.'
        }
      ]
    });
  } catch (err: any) {
    console.error('[generate-revision] Revision generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate revision test' });
  }
});

// Mount the apiRouter on both '/api' and '/' so that rewrites or direct paths both work
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch-all 404 handler for API routes that do not exist
app.use('/api/*', (req, res) => {
  return res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404,
  });
});

export { app, getGeminiClient, callGeminiWithRetry };
export default app;
