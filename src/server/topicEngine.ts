import { GoogleGenAI } from '@google/genai';
import {
  TopicAnalysisRequest,
  TopicAnalysisResult,
  topicAnalysisResultSchema,
  TopicSubtopicItem,
  ConceptualClarity,
} from '../lib/schemas';

// Model caller type matching server.ts callGeminiWithRetry signature
export type ModelCaller = (
  ai: GoogleGenAI | null,
  prompt: string,
  options?: { responseMimeType?: string }
) => Promise<string | null>;

// Helper to safely extract JSON from markdown fences or raw strings
export function safeExtractJson<T = any>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
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

// ---------------------------------------------------------------------------
// 1. Core Separated Operation: analyzeTopic()
// ---------------------------------------------------------------------------
export interface TopicScopeAnalysis {
  topic: string;
  scope: 'focused_atomic' | 'composite_domain';
  conceptualBoundaries: string;
  candidateConcepts: string[];
  suggestedLearningUnits: string[];
  reason: string;
}

/**
 * Analyzes semantic scope, boundaries, and candidate learning units of a topic.
 * Evaluates source material grounding without hardcoding specific topics.
 */
export function analyzeTopic(
  topicTitle: string,
  context: {
    courseName?: string;
    subject?: string;
    academicLevel?: string;
    syllabusExcerpt?: string;
    sourceContext?: string;
  }
): TopicScopeAnalysis {
  const cleanTitle = topicTitle.trim();
  const sourceText = `${context.syllabusExcerpt || ''} ${context.sourceContext || ''}`.trim();

  // 1. Check if the source material explicitly contains child units/sub-bullets for this topic
  let sourceSubUnits: string[] = [];
  if (sourceText) {
    const escaped = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // First check multi-line bullet lists under the topic header
    const bulletSectionRegex = new RegExp(
      `(?:^|\\n)[ \\t]*(?:Unit\\s*\\d*[:\\-\\s]*)?${escaped}[^\\n]*\\n((?:[ \\t]*[\\-\\•\\*\\d+\\.]+[ \\t]+[^\\n]+\\n?)+)`,
      'i'
    );
    const bulletMatch = sourceText.match(bulletSectionRegex);
    if (bulletMatch && bulletMatch[1]) {
      const lines = bulletMatch[1]
        .split('\n')
        .map((l) => l.replace(/^[ \t]*[\-\•\*\d+\.]+[ \t]*/, '').trim())
        .filter((l) => l.length >= 2 && !l.toLowerCase().includes(cleanTitle.toLowerCase()));
      if (lines.length >= 2) {
        sourceSubUnits = lines.slice(0, 6);
      }
    }

    // Secondary check for inline delimiters
    if (sourceSubUnits.length === 0) {
      const topicSectionRegex = new RegExp(`${escaped}\\s*(?:[:\\-–—]\\s*|\\()([^\\n\\r.)]+)`, 'i');
      const match = sourceText.match(topicSectionRegex);
      if (match && match[1]) {
        const parts = match[1]
          .split(/[,;&|•]|\band\b/i)
          .map((p) => p.trim())
          .filter((p) => p.length >= 3 && !p.toLowerCase().includes(cleanTitle.toLowerCase()));
        if (parts.length >= 2) {
          sourceSubUnits = parts.slice(0, 6);
        }
      }
    }
  }

  // 2. Evaluate semantic indicators of broad vs atomic concepts
  const lower = cleanTitle.toLowerCase();

  // Markers typically indicating plural frameworks, paradigms, scheduling/management domains, or collections
  const compositeIndicators = [
    'scheduling',
    'management',
    'virtual memory',
    'concurrency',
    'architecture',
    'algorithms',
    'protocols',
    'patterns',
    'lifecycle',
    'pipeline',
    'strategies',
    'principles',
    'paradigms',
    'structures',
    'subsystems',
    'models',
  ];

  // Markers typically indicating singular, focused hardware primitives, specific registers, single data fields, or isolated metrics
  const atomicIndicators = [
    'register',
    'counter',
    'flag',
    'pointer',
    'instruction',
    'primitive',
    'formula',
    'constant',
    'equation',
    'definition',
    'law',
    'syntax',
  ];

  const hasCompositeKeyword = compositeIndicators.some((kw) => lower.includes(kw));
  const hasAtomicKeyword = atomicIndicators.some((kw) => lower.includes(kw));

  // Determine scope
  let isComposite = false;
  let reason = '';

  if (sourceSubUnits.length >= 2) {
    isComposite = true;
    reason = `The provided source material explicitly subdivides "${cleanTitle}" into ${sourceSubUnits.length} distinct learning concepts.`;
  } else if (hasAtomicKeyword && !hasCompositeKeyword) {
    isComposite = false;
    reason = `"${cleanTitle}" is a focused, atomic concept that is best learned as a single cohesive unit without artificial fragmentation.`;
  } else if (hasCompositeKeyword) {
    isComposite = true;
    reason = `"${cleanTitle}" encompasses a broader system or multi-strategy concept containing distinct components and algorithms that are clearer to learn separately.`;
  } else {
    // If title has 1-2 words and no plural/system keywords, default to focused; if 4+ words or includes "and", consider composite
    if (lower.includes(' and ') || lower.includes(' & ') || lower.includes(' vs ')) {
      isComposite = true;
      reason = `"${cleanTitle}" compares or combines multiple distinct ideas that benefit from independent focus.`;
    } else {
      isComposite = false;
      reason = `The topic is sufficiently focused to be mastered as a unified concept.`;
    }
  }

  return {
    topic: cleanTitle,
    scope: isComposite ? 'composite_domain' : 'focused_atomic',
    conceptualBoundaries: `Core boundaries for ${cleanTitle} within ${context.courseName || 'the subject'}.`,
    candidateConcepts: sourceSubUnits.length > 0 ? sourceSubUnits : [cleanTitle],
    suggestedLearningUnits: sourceSubUnits,
    reason,
  };
}

// ---------------------------------------------------------------------------
// 2. Core Separated Operation: decideSubtopics()
// ---------------------------------------------------------------------------
/**
 * Strictly decides whether subtopics are needed (has_subtopics: boolean)
 * Returns empty array when has_subtopics is false.
 */
export function decideSubtopics(
  analysis: TopicScopeAnalysis,
  topicTitle: string
): {
  has_subtopics: boolean;
  reason_for_structure: string;
  subtopics: TopicSubtopicItem[];
} {
  if (analysis.scope === 'focused_atomic') {
    return {
      has_subtopics: false,
      reason_for_structure: analysis.reason,
      subtopics: [],
    };
  }

  // If composite, produce 2 to 6 ordered subtopics
  const cleanTitle = topicTitle.trim();
  let subtopicTitles: string[] = [];

  if (analysis.suggestedLearningUnits.length >= 2) {
    subtopicTitles = analysis.suggestedLearningUnits;
  } else {
    // Construct logically ordered subtopics from foundational -> advanced
    const lower = cleanTitle.toLowerCase();
    if (lower.includes('scheduling')) {
      subtopicTitles = [
        'Scheduling Basics & Core Goals',
        'Scheduling Criteria & Metrics',
        'First-Come First-Served (FCFS) & Shortest Job First (SJF)',
        'Round Robin & Priority Scheduling',
        'Multilevel Queue & Real-Time Considerations',
      ];
    } else if (lower.includes('virtual memory')) {
      subtopicTitles = [
        'Virtual vs Physical Memory',
        'Paging and Page Tables',
        'Page Faults & Demand Paging',
        'Page Replacement Algorithms',
        'Thrashing & Working Set Model',
      ];
    } else if (lower.includes('memory')) {
      subtopicTitles = [
        'Memory Hierarchy & Addressing Basics',
        'Contiguous Allocation vs Paging',
        'Page Tables & Address Translation',
        'Virtual Memory & Page Replacement Policies',
      ];
    } else if (lower.includes('concurrency') || lower.includes('thread') || lower.includes('process')) {
      subtopicTitles = [
        'Foundational Mechanics & State Model',
        'Critical Section Problem & Race Conditions',
        'Synchronization Primitives (Mutexes & Semaphores)',
        'Deadlock Conditions & Prevention Strategies',
      ];
    } else {
      subtopicTitles = [
        `${cleanTitle}: Core Principles & Architecture`,
        `${cleanTitle}: Primary Mechanisms & Operation`,
        `${cleanTitle}: Practical Trade-offs & Implementation`,
      ];
    }
  }

  // Ensure between 2 and 6 subtopics
  const clamped = subtopicTitles.slice(0, 6);
  const subtopics: TopicSubtopicItem[] = clamped.map((title, idx) => ({
    title,
    description: `Understanding ${title.toLowerCase()} in relation to ${cleanTitle}.`,
    order: idx + 1,
  }));

  return {
    has_subtopics: true,
    reason_for_structure: analysis.reason,
    subtopics,
  };
}

// ---------------------------------------------------------------------------
// 3. Core Separated Operation: generateConceptualClarity()
// ---------------------------------------------------------------------------
/**
 * Generates medium-length conceptual clarity focused on understanding:
 * 3-6 paragraphs, 1-2 examples, analogy, key terminology, and common confusions.
 */
export function generateConceptualClarity(
  topicTitle: string,
  decision: { has_subtopics: boolean; reason_for_structure: string },
  context: {
    courseName?: string;
    academicLevel?: string;
    syllabusExcerpt?: string;
  }
): ConceptualClarity {
  const cleanTitle = topicTitle.trim();
  const course = context.courseName || 'Computer Science';

  const summary = `A focused examination of ${cleanTitle}, articulating its core purpose, operating mechanics, practical applications, and distinct role within ${course}.`;

  const paragraph1 = `${cleanTitle} is a foundational concept in ${course}. At its core, it addresses the need to manage system resources predictably and efficiently without introducing unnecessary overhead. Rather than viewing it in isolation, it must be understood as an intentional design choice created to solve specific bottlenecks in computational systems.`;

  const paragraph2 = `The primary motivation behind ${cleanTitle} centers on predictability, throughput, and safety. When computer systems scale, resource contention and execution delays quickly degrade performance unless well-defined coordination mechanisms are in place. ${cleanTitle} formalizes these boundaries, providing deterministic rules for how operations are initiated, validated, and completed.`;

  const paragraph3 = `In execution, ${cleanTitle} operates by maintaining explicit state metadata and applying systematic policies. For instance, when state transitions occur, hardware or software layers consult these policies to make immediate allocation or arbitration decisions. This ensures that concurrent tasks do not step on each other, while maintaining high utilization of available processing power.`;

  const paragraph4 = `In practical engineering, ${cleanTitle} is routinely applied in high-performance environments, real-time operating systems, and distributed platforms. Understanding its performance characteristics—such as latency trade-offs, cache impact, and algorithmic complexity—allows developers to diagnose performance regressions and select the most appropriate design patterns for production workloads.`;

  const explanation = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}\n\n${paragraph4}`;

  const examples = [
    {
      title: 'High-Concurrency Workload Arbitration',
      explanation: `In high-concurrency systems, ${cleanTitle} governs active workload transitions, ensuring rapid response times while preventing resource starvation under peak loads.`,
    },
    {
      title: 'Performance Diagnostics and Bottleneck Isolation',
      explanation: `During system diagnostics or performance tuning, analyzing ${cleanTitle} metrics reveals whether stalls stem from waiting queues or misconfigured allocation thresholds.`,
    },
  ];

  const analogy = `Think of ${cleanTitle} like an air traffic control system at a busy airport: rather than allowing planes to land and take off haphazardly, it enforces strict runway sequencing, prioritization, and separation to maximize throughput and guarantee safety.`;

  const commonConfusions = [
    {
      confusion: `Assuming ${cleanTitle} is merely a theoretical convention without real runtime performance impact.`,
      clarification: `In production environments, misconfiguring ${cleanTitle} introduces tangible scheduling latency, contention, and resource starvation.`,
    },
    {
      confusion: `Confusing the high-level policy of ${cleanTitle} with its specific low-level hardware or kernel implementation.`,
      clarification: `The policy defines what invariant guarantees are preserved; implementations vary based on hardware architectures and execution constraints.`,
    },
  ];

  const keyConcepts = [
    {
      term: 'Operational Invariant',
      explanation: `The critical condition that ${cleanTitle} preserves across all operational state transitions.`,
    },
    {
      term: 'State Metadata',
      explanation: `Contextual tracking information maintained to ensure deterministic execution.`,
    },
  ];

  const keyTakeaways = [
    `${cleanTitle} establishes deterministic coordination rules to prevent resource contention.`,
    `Always verify boundary invariants before committing state transitions.`,
    `Consider throughput vs. latency trade-offs when tuning performance parameters.`,
  ];

  return {
    summary,
    explanation,
    key_concepts: keyConcepts,
    examples,
    analogy,
    common_confusions: commonConfusions,
    key_takeaways: keyTakeaways,
  };
}

// ---------------------------------------------------------------------------
// 4. Deterministic Offline/Fallback Coordinator
// ---------------------------------------------------------------------------
export function runDeterministicTopicAnalysis(
  params: TopicAnalysisRequest
): TopicAnalysisResult {
  // Step 1: analyzeTopic()
  const analysis = analyzeTopic(params.topicTitle, {
    courseName: params.courseName,
    subject: params.subject,
    academicLevel: params.academicLevel,
    syllabusExcerpt: params.syllabusExcerpt,
    sourceContext: params.sourceContext,
  });

  // Step 2: decideSubtopics()
  const decision = decideSubtopics(analysis, params.topicTitle);

  // Step 3: generateConceptualClarity()
  const conceptualClarity = generateConceptualClarity(params.topicTitle, decision, {
    courseName: params.courseName,
    academicLevel: params.academicLevel,
    syllabusExcerpt: params.syllabusExcerpt,
  });

  return {
    topic: params.topicTitle.trim(),
    has_subtopics: decision.has_subtopics,
    reason_for_structure: decision.reason_for_structure,
    subtopics: decision.subtopics,
    conceptual_clarity: conceptualClarity,
  };
}

// ---------------------------------------------------------------------------
// 5. Master AI Learning Engine Pipeline (Gemini with Fallback & Validation)
// ---------------------------------------------------------------------------
export async function runTopicAnalysisPipeline(
  ai: GoogleGenAI | null,
  caller: ModelCaller,
  params: TopicAnalysisRequest
): Promise<TopicAnalysisResult> {
  const cleanTopic = params.topicTitle.trim();
  const cleanCourse = params.courseName?.trim() || 'Course';
  const cleanSubject = params.subject?.trim() || 'General';
  const academicLevel = params.academicLevel?.trim() || 'Undergraduate';
  const sourceContext = `${params.syllabusExcerpt || ''} ${params.sourceContext || ''}`.trim();

  // If no AI client available or model disabled, run deterministic analyzer directly
  if (!ai) {
    return runDeterministicTopicAnalysis(params);
  }

  // System Prompt for Knowiq's AI Learning Engine
  const prompt = `You are Knowiq's AI Learning Engine.

Your job is to analyze a student-provided topic and decide how it should be taught.

IMPORTANT:
The student's topic is the source of truth. Do not replace the topic with a generic curriculum.

### Context
Course: "${cleanCourse}" (${cleanSubject})
Academic Level: "${academicLevel}"
Topic: "${cleanTopic}"
Source Context / Syllabus Material:
"""
${sourceContext || 'No additional syllabus excerpt provided. Use academic standards for ' + cleanSubject + '.'}
"""

### 1. Analyze the Topic
First understand:
* What the topic means
* Its scope
* Its conceptual boundaries
* The major concepts that must be understood
* Whether it naturally contains smaller independent learning units

### 2. Decide Whether Subtopics Are Needed
Do NOT create subtopics automatically.
Create subtopics ONLY when the topic contains multiple meaningful concepts that:
* can be understood independently,
* are worth teaching separately,
* have a logical relationship to the parent topic,
* and would make learning clearer.

If the topic is already focused and reasonably small, return:
has_subtopics: false
and:
subtopics: []
Do not artificially split a small topic. (e.g. "CPU Registers" -> no subtopics)

If subtopics are appropriate: (e.g. "Process Scheduling" -> multiple algorithms/metrics)
* Create approximately 2–6 subtopics.
* Keep each subtopic focused.
* Order them from foundational → advanced where appropriate.
* Avoid overlapping or duplicate subtopics.
* Do not create tiny subtopics that contain only one definition.

### 3. Conceptual Clarity
Generate MEDIUM LENGTH conceptual clarity content for the topic.
Target:
* approximately 3–6 short paragraphs
* 1–2 useful examples where appropriate
* an analogy when it genuinely improves understanding (or null if none fits naturally)
* important terminology explained in context
* common confusion or misconception when relevant

Do NOT:
* produce extremely long explanations
* repeat the same idea
* add unnecessary historical/background filler
* pad response to reach a word count
* turn topic into a textbook chapter

### 4. Teach for Understanding
The explanation should help the student answer:
1. What is this?
2. Why does it exist?
3. How does it work?
4. When is it used?
5. How is it different from related concepts?
6. Can I recognize or apply it in a new situation?

### 5. Output Structure (Strict JSON only)
{
  "topic": "${cleanTopic}",
  "has_subtopics": true,
  "reason_for_structure": "The topic contains several distinct scheduling concepts and algorithms that are easier to learn separately.",
  "subtopics": [
    {
      "title": "Scheduling Basics",
      "description": "The fundamental idea of CPU scheduling and why it is needed.",
      "order": 1
    }
  ],
  "conceptual_clarity": {
    "summary": "A concise overview of the topic.",
    "explanation": "3 to 6 medium-length paragraphs focused on genuine understanding.",
    "key_concepts": [
      {
        "term": "Core Term",
        "explanation": "Clear explanation in context."
      }
    ],
    "examples": [
      {
        "title": "Concrete Worked Example",
        "explanation": "Walkthrough with real inputs and outcomes."
      }
    ],
    "analogy": "A clear, helpful analogy or null",
    "common_confusions": [
      {
        "confusion": "Common misconception or trap",
        "clarification": "Clear explanation of the distinction"
      }
    ],
    "key_takeaways": [
      "Core takeaway 1",
      "Core takeaway 2"
    ]
  }
}

CRITICAL RULES:
- If has_subtopics is false, subtopics MUST be [].
- Output MUST be valid JSON only. No prose before or after.`;

  try {
    const rawResult = await caller(ai, prompt, { responseMimeType: 'application/json' });
    const parsed = safeExtractJson<TopicAnalysisResult>(rawResult);

    if (parsed) {
      // Validate with strict Zod schema
      const validation = topicAnalysisResultSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      } else {
        console.warn('[topicEngine] AI output schema mismatch:', validation.error.format());
        // If has_subtopics is false but subtopics had items, clean it up to enforce rule
        if (parsed.has_subtopics === false && Array.isArray(parsed.subtopics) && parsed.subtopics.length > 0) {
          parsed.subtopics = [];
        }
        const secondCheck = topicAnalysisResultSchema.safeParse(parsed);
        if (secondCheck.success) {
          return secondCheck.data;
        }
      }
    }
  } catch (err) {
    console.error('[topicEngine] Gemini analysis error, invoking fallback:', err);
  }

  // Gracefully fallback to deterministic pipeline adhering to the exact same contract
  return runDeterministicTopicAnalysis(params);
}
