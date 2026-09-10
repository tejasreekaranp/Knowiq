// src/lib/schemas.ts
import { z } from "zod";
var courseInputSchema = z.object({
  title: z.string().trim().min(2, { message: "Course name must be at least 2 characters" }).max(120, { message: "Course name cannot exceed 120 characters" }),
  subject: z.string().trim().min(2, { message: "Subject must be at least 2 characters" }).max(80, { message: "Subject cannot exceed 80 characters" }),
  academicLevel: z.string().trim().min(2).max(50),
  description: z.string().trim().max(1e3).optional().default(""),
  syllabus: z.string().trim().max(25e3).optional().default(""),
  durationDays: z.number().int().min(1).max(365).optional().default(30)
});
var subtopicContentRequestSchema = z.object({
  courseName: z.string().trim().min(1).max(120),
  topicTitle: z.string().trim().min(1).max(120),
  subtopicTitle: z.string().trim().min(1).max(120),
  existingClarity: z.number().min(0).max(100).optional().default(50),
  sourceReference: z.string().optional(),
  sourceExcerpt: z.string().optional(),
  concepts: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  courseSyllabus: z.string().optional(),
  academicLevel: z.string().optional()
});
var diagnoseClarityRequestSchema = z.object({
  courseName: z.string().trim().optional(),
  topicTitle: z.string().trim().optional(),
  subtopicTitle: z.string().trim().min(1).max(150),
  concepts: z.array(z.string()).optional(),
  sourceReference: z.string().optional(),
  sourceExcerpt: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string().max(50),
      question: z.string().max(1e3),
      options: z.array(z.string().max(500)),
      correctIndex: z.number().int().min(0).max(10),
      category: z.enum(["conceptual", "recall", "application", "differentiation"]).optional(),
      explanation: z.string().optional()
    })
  ).min(1).max(10),
  userAnswers: z.record(z.string(), z.union([z.string(), z.number()]))
});
var extractedSubtopicSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(""),
  source_excerpt: z.string().optional().default(""),
  concepts: z.array(z.string()).optional().default([]),
  prerequisites: z.array(z.string()).optional().default([]),
  derived: z.boolean().optional().default(false),
  derived_from: z.array(z.string()).optional().default([])
});
var extractedTopicSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(""),
  source_excerpt: z.string().optional().default(""),
  subtopics: z.array(extractedSubtopicSchema).optional().default([])
});
var extractedUnitSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(""),
  topics: z.array(extractedTopicSchema).min(1)
});
var sourceExtractionSchema = z.object({
  source_summary: z.string(),
  is_generic_starter: z.boolean().optional().default(false),
  units: z.array(extractedUnitSchema).min(1)
});
var generateRevisionRequestSchema = z.object({
  topicTitles: z.array(z.string().trim().max(120)).min(1).max(15),
  revisionType: z.string().trim().max(50).default("Mixed"),
  difficulty: z.string().trim().max(50).default("Medium"),
  questionCount: z.number().int().min(1).max(15).default(5)
});
var geminiSubtopicContentSchema = z.object({
  conceptual: z.object({
    quick: z.string(),
    standard: z.string(),
    deep: z.string(),
    expert: z.string(),
    whatIsIt: z.string(),
    whyExists: z.string(),
    problemSolved: z.string(),
    keyTakeaway: z.string()
  }),
  interactive: z.object({
    fillBlank: z.object({
      question: z.string(),
      preText: z.string(),
      missingWord: z.string(),
      postText: z.string(),
      options: z.array(z.string()),
      hint: z.string(),
      explanation: z.string()
    }),
    matching: z.array(
      z.object({
        id: z.string(),
        term: z.string(),
        definition: z.string()
      })
    ),
    ordering: z.object({
      title: z.string(),
      instruction: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
          correctOrder: z.number()
        })
      )
    })
  }),
  deepRevision: z.object({
    detailedNotes: z.array(z.string()),
    comparisonTable: z.object({
      title: z.string(),
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string()))
    }),
    commonPitfalls: z.array(z.string()),
    mentalModelOrMnemonic: z.string()
  }),
  hardQuiz: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      category: z.string().optional(),
      explanation: z.string()
    })
  ),
  externalResources: z.array(
    z.object({
      type: z.string(),
      title: z.string(),
      source: z.string(),
      description: z.string(),
      url: z.string(),
      tag: z.string().optional()
    })
  ).optional().default([])
});
var geminiDiagnoseClaritySchema = z.object({
  detectedIssue: z.string(),
  nextAction: z.string().optional(),
  remediationContent: z.object({
    comparisonExplanation: z.string(),
    followUpQuestion: z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string()
    })
  })
});
var topicAnalysisRequestSchema = z.object({
  topicTitle: z.string().trim().min(1, "Topic title cannot be empty").max(150),
  courseName: z.string().trim().optional().default("Course"),
  subject: z.string().trim().optional().default("General"),
  academicLevel: z.string().trim().optional().default("Undergraduate"),
  syllabusExcerpt: z.string().optional().default(""),
  sourceContext: z.string().optional().default("")
});
var topicSubtopicItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  order: z.number().int().min(1)
});
var keyConceptItemSchema = z.union([
  z.object({
    term: z.string().min(1),
    explanation: z.string().min(1)
  }),
  z.string().transform((str) => ({
    term: str,
    explanation: `Core mechanism and definition of ${str}.`
  }))
]);
var conceptualExampleItemSchema = z.union([
  z.object({
    title: z.string().min(1),
    explanation: z.string().min(1)
  }),
  z.string().transform((str) => ({
    title: "Practical Example",
    explanation: str
  }))
]);
var commonConfusionItemSchema = z.union([
  z.object({
    confusion: z.string().min(1),
    clarification: z.string().min(1)
  }),
  z.string().transform((str) => ({
    confusion: str,
    clarification: "Understand the underlying mechanism and boundary invariants to avoid this misconception."
  }))
]);
var conceptualClaritySchema = z.object({
  summary: z.string().min(1),
  explanation: z.string().min(1),
  key_concepts: z.array(keyConceptItemSchema).default([]),
  examples: z.array(conceptualExampleItemSchema).default([]),
  analogy: z.string().nullable().default(null),
  common_confusions: z.array(commonConfusionItemSchema).default([]),
  key_takeaways: z.array(z.string()).default([])
});
var topicAnalysisResultSchema = z.object({
  topic: z.string().min(1),
  has_subtopics: z.boolean(),
  reason_for_structure: z.string().min(1),
  subtopics: z.array(topicSubtopicItemSchema).default([]),
  conceptual_clarity: conceptualClaritySchema
}).refine((data) => {
  if (!data.has_subtopics) {
    return !data.subtopics || data.subtopics.length === 0;
  }
  return true;
}, {
  message: "When has_subtopics is false, subtopics must be empty.",
  path: ["subtopics"]
});
var conceptualClarityRequestSchema = z.object({
  courseName: z.string().trim().default("Course"),
  topicTitle: z.string().trim().min(1),
  subtopicTitle: z.string().trim().optional(),
  unitTitle: z.string().optional(),
  concepts: z.array(z.string()).optional(),
  sourceExcerpt: z.string().optional(),
  syllabusExcerpt: z.string().optional(),
  academicLevel: z.string().default("Undergraduate"),
  existingClarity: z.number().optional().default(50)
});
var generateQuestionRequestSchema = z.object({
  courseName: z.string().default("Course"),
  topicTitle: z.string().min(1),
  subtopicTitle: z.string().optional(),
  clarity: conceptualClaritySchema.optional(),
  academicLevel: z.string().default("Undergraduate")
});
var interactiveQuestionSchema = z.object({
  id: z.string().default(() => "q_" + Math.random().toString(36).substring(2, 9)),
  question: z.string().min(1),
  questionType: z.enum([
    "conceptual",
    "recall",
    "differentiation",
    "application",
    "reasoning",
    "scenario",
    "sequencing",
    "prediction",
    "error_identification"
  ]).default("conceptual"),
  scenario: z.string().optional(),
  options: z.array(z.string()).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
  whyWrongMap: z.record(z.string(), z.string()).optional(),
  targetConcept: z.string().optional()
});
var answerEvaluationRequestSchema = z.object({
  courseName: z.string().optional(),
  topicTitle: z.string().optional().default("Topic"),
  subtopicTitle: z.string().optional(),
  question: z.union([
    interactiveQuestionSchema,
    z.object({
      id: z.string().optional(),
      question: z.string(),
      questionType: z.string().optional(),
      options: z.array(z.string()),
      correctIndex: z.number().int(),
      explanation: z.string().optional().default(""),
      whyWrongMap: z.record(z.string(), z.string()).optional(),
      targetConcept: z.string().optional()
    })
  ]),
  selectedIndex: z.number().int().optional(),
  userSelectedIndex: z.number().int().optional(),
  confidence: z.enum(["low", "medium", "high"]).default("medium")
}).transform((data) => ({
  courseName: data.courseName,
  topicTitle: data.topicTitle || "Topic",
  subtopicTitle: data.subtopicTitle,
  question: {
    id: data.question.id || "q_1",
    question: data.question.question,
    questionType: data.question.questionType || "conceptual",
    options: data.question.options,
    correctIndex: data.question.correctIndex,
    explanation: data.question.explanation || "",
    whyWrongMap: data.question.whyWrongMap,
    targetConcept: data.question.targetConcept
  },
  selectedIndex: data.selectedIndex ?? data.userSelectedIndex ?? 0,
  confidence: data.confidence
}));
var answerEvaluationResultSchema = z.object({
  isCorrect: z.boolean(),
  didacticFeedback: z.string(),
  coreConceptReinforced: z.string(),
  clarityShift: z.number(),
  adaptiveRecommendation: z.object({
    action: z.enum(["advance", "reinforce", "investigate_misconception", "simplify_and_reteach", "prerequisite_gap"]),
    reason: z.string(),
    nextStepLabel: z.string()
  })
});

// src/server/topicEngine.ts
function safeExtractJson(raw) {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  }
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
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
function analyzeTopic(topicTitle, context) {
  const cleanTitle = topicTitle.trim();
  const sourceText = `${context.syllabusExcerpt || ""} ${context.sourceContext || ""}`.trim();
  let sourceSubUnits = [];
  if (sourceText) {
    const escaped = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const bulletSectionRegex = new RegExp(
      `(?:^|\\n)[ \\t]*(?:Unit\\s*\\d*[:\\-\\s]*)?${escaped}[^\\n]*\\n((?:[ \\t]*[\\-\\\u2022\\*\\d+\\.]+[ \\t]+[^\\n]+\\n?)+)`,
      "i"
    );
    const bulletMatch = sourceText.match(bulletSectionRegex);
    if (bulletMatch && bulletMatch[1]) {
      const lines = bulletMatch[1].split("\n").map((l) => l.replace(/^[ \t]*[\-\•\*\d+\.]+[ \t]*/, "").trim()).filter((l) => l.length >= 2 && !l.toLowerCase().includes(cleanTitle.toLowerCase()));
      if (lines.length >= 2) {
        sourceSubUnits = lines.slice(0, 6);
      }
    }
    if (sourceSubUnits.length === 0) {
      const topicSectionRegex = new RegExp(`${escaped}\\s*(?:[:\\-\u2013\u2014]\\s*|\\()([^\\n\\r.)]+)`, "i");
      const match = sourceText.match(topicSectionRegex);
      if (match && match[1]) {
        const parts = match[1].split(/[,;&|•]|\band\b/i).map((p) => p.trim()).filter((p) => p.length >= 3 && !p.toLowerCase().includes(cleanTitle.toLowerCase()));
        if (parts.length >= 2) {
          sourceSubUnits = parts.slice(0, 6);
        }
      }
    }
  }
  const lower = cleanTitle.toLowerCase();
  const compositeIndicators = [
    "scheduling",
    "management",
    "virtual memory",
    "concurrency",
    "architecture",
    "algorithms",
    "protocols",
    "patterns",
    "lifecycle",
    "pipeline",
    "strategies",
    "principles",
    "paradigms",
    "structures",
    "subsystems",
    "models"
  ];
  const atomicIndicators = [
    "register",
    "counter",
    "flag",
    "pointer",
    "instruction",
    "primitive",
    "formula",
    "constant",
    "equation",
    "definition",
    "law",
    "syntax"
  ];
  const hasCompositeKeyword = compositeIndicators.some((kw) => lower.includes(kw));
  const hasAtomicKeyword = atomicIndicators.some((kw) => lower.includes(kw));
  let isComposite = false;
  let reason = "";
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
    if (lower.includes(" and ") || lower.includes(" & ") || lower.includes(" vs ")) {
      isComposite = true;
      reason = `"${cleanTitle}" compares or combines multiple distinct ideas that benefit from independent focus.`;
    } else {
      isComposite = false;
      reason = `The topic is sufficiently focused to be mastered as a unified concept.`;
    }
  }
  return {
    topic: cleanTitle,
    scope: isComposite ? "composite_domain" : "focused_atomic",
    conceptualBoundaries: `Core boundaries for ${cleanTitle} within ${context.courseName || "the subject"}.`,
    candidateConcepts: sourceSubUnits.length > 0 ? sourceSubUnits : [cleanTitle],
    suggestedLearningUnits: sourceSubUnits,
    reason
  };
}
function decideSubtopics(analysis, topicTitle) {
  if (analysis.scope === "focused_atomic") {
    return {
      has_subtopics: false,
      reason_for_structure: analysis.reason,
      subtopics: []
    };
  }
  const cleanTitle = topicTitle.trim();
  let subtopicTitles = [];
  if (analysis.suggestedLearningUnits.length >= 2) {
    subtopicTitles = analysis.suggestedLearningUnits;
  } else {
    const lower = cleanTitle.toLowerCase();
    if (lower.includes("scheduling")) {
      subtopicTitles = [
        "Scheduling Basics & Core Goals",
        "Scheduling Criteria & Metrics",
        "First-Come First-Served (FCFS) & Shortest Job First (SJF)",
        "Round Robin & Priority Scheduling",
        "Multilevel Queue & Real-Time Considerations"
      ];
    } else if (lower.includes("virtual memory")) {
      subtopicTitles = [
        "Virtual vs Physical Memory",
        "Paging and Page Tables",
        "Page Faults & Demand Paging",
        "Page Replacement Algorithms",
        "Thrashing & Working Set Model"
      ];
    } else if (lower.includes("memory")) {
      subtopicTitles = [
        "Memory Hierarchy & Addressing Basics",
        "Contiguous Allocation vs Paging",
        "Page Tables & Address Translation",
        "Virtual Memory & Page Replacement Policies"
      ];
    } else if (lower.includes("concurrency") || lower.includes("thread") || lower.includes("process")) {
      subtopicTitles = [
        "Foundational Mechanics & State Model",
        "Critical Section Problem & Race Conditions",
        "Synchronization Primitives (Mutexes & Semaphores)",
        "Deadlock Conditions & Prevention Strategies"
      ];
    } else {
      subtopicTitles = [
        `${cleanTitle}: Core Principles & Architecture`,
        `${cleanTitle}: Primary Mechanisms & Operation`,
        `${cleanTitle}: Practical Trade-offs & Implementation`
      ];
    }
  }
  const clamped = subtopicTitles.slice(0, 6);
  const subtopics = clamped.map((title, idx) => ({
    title,
    description: `Understanding ${title.toLowerCase()} in relation to ${cleanTitle}.`,
    order: idx + 1
  }));
  return {
    has_subtopics: true,
    reason_for_structure: analysis.reason,
    subtopics
  };
}
function generateConceptualClarity(topicTitle, decision, context) {
  const cleanTitle = topicTitle.trim();
  const course = context.courseName || "Computer Science";
  const summary = `A focused examination of ${cleanTitle}, articulating its core purpose, operating mechanics, practical applications, and distinct role within ${course}.`;
  const paragraph1 = `${cleanTitle} is a foundational concept in ${course}. At its core, it addresses the need to manage system resources predictably and efficiently without introducing unnecessary overhead. Rather than viewing it in isolation, it must be understood as an intentional design choice created to solve specific bottlenecks in computational systems.`;
  const paragraph2 = `The primary motivation behind ${cleanTitle} centers on predictability, throughput, and safety. When computer systems scale, resource contention and execution delays quickly degrade performance unless well-defined coordination mechanisms are in place. ${cleanTitle} formalizes these boundaries, providing deterministic rules for how operations are initiated, validated, and completed.`;
  const paragraph3 = `In execution, ${cleanTitle} operates by maintaining explicit state metadata and applying systematic policies. For instance, when state transitions occur, hardware or software layers consult these policies to make immediate allocation or arbitration decisions. This ensures that concurrent tasks do not step on each other, while maintaining high utilization of available processing power.`;
  const paragraph4 = `In practical engineering, ${cleanTitle} is routinely applied in high-performance environments, real-time operating systems, and distributed platforms. Understanding its performance characteristics\u2014such as latency trade-offs, cache impact, and algorithmic complexity\u2014allows developers to diagnose performance regressions and select the most appropriate design patterns for production workloads.`;
  const explanation = `${paragraph1}

${paragraph2}

${paragraph3}

${paragraph4}`;
  const examples = [
    {
      title: "High-Concurrency Workload Arbitration",
      explanation: `In high-concurrency systems, ${cleanTitle} governs active workload transitions, ensuring rapid response times while preventing resource starvation under peak loads.`
    },
    {
      title: "Performance Diagnostics and Bottleneck Isolation",
      explanation: `During system diagnostics or performance tuning, analyzing ${cleanTitle} metrics reveals whether stalls stem from waiting queues or misconfigured allocation thresholds.`
    }
  ];
  const analogy = `Think of ${cleanTitle} like an air traffic control system at a busy airport: rather than allowing planes to land and take off haphazardly, it enforces strict runway sequencing, prioritization, and separation to maximize throughput and guarantee safety.`;
  const commonConfusions = [
    {
      confusion: `Assuming ${cleanTitle} is merely a theoretical convention without real runtime performance impact.`,
      clarification: `In production environments, misconfiguring ${cleanTitle} introduces tangible scheduling latency, contention, and resource starvation.`
    },
    {
      confusion: `Confusing the high-level policy of ${cleanTitle} with its specific low-level hardware or kernel implementation.`,
      clarification: `The policy defines what invariant guarantees are preserved; implementations vary based on hardware architectures and execution constraints.`
    }
  ];
  const keyConcepts = [
    {
      term: "Operational Invariant",
      explanation: `The critical condition that ${cleanTitle} preserves across all operational state transitions.`
    },
    {
      term: "State Metadata",
      explanation: `Contextual tracking information maintained to ensure deterministic execution.`
    }
  ];
  const keyTakeaways = [
    `${cleanTitle} establishes deterministic coordination rules to prevent resource contention.`,
    `Always verify boundary invariants before committing state transitions.`,
    `Consider throughput vs. latency trade-offs when tuning performance parameters.`
  ];
  return {
    summary,
    explanation,
    key_concepts: keyConcepts,
    examples,
    analogy,
    common_confusions: commonConfusions,
    key_takeaways: keyTakeaways
  };
}
function runDeterministicTopicAnalysis(params) {
  const analysis = analyzeTopic(params.topicTitle, {
    courseName: params.courseName,
    subject: params.subject,
    academicLevel: params.academicLevel,
    syllabusExcerpt: params.syllabusExcerpt,
    sourceContext: params.sourceContext
  });
  const decision = decideSubtopics(analysis, params.topicTitle);
  const conceptualClarity = generateConceptualClarity(params.topicTitle, decision, {
    courseName: params.courseName,
    academicLevel: params.academicLevel,
    syllabusExcerpt: params.syllabusExcerpt
  });
  return {
    topic: params.topicTitle.trim(),
    has_subtopics: decision.has_subtopics,
    reason_for_structure: decision.reason_for_structure,
    subtopics: decision.subtopics,
    conceptual_clarity: conceptualClarity
  };
}
async function runTopicAnalysisPipeline(ai, caller, params) {
  const cleanTopic = params.topicTitle.trim();
  const cleanCourse = params.courseName?.trim() || "Course";
  const cleanSubject = params.subject?.trim() || "General";
  const academicLevel = params.academicLevel?.trim() || "Undergraduate";
  const sourceContext = `${params.syllabusExcerpt || ""} ${params.sourceContext || ""}`.trim();
  if (!ai) {
    return runDeterministicTopicAnalysis(params);
  }
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
${sourceContext || "No additional syllabus excerpt provided. Use academic standards for " + cleanSubject + "."}
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
* Create approximately 2\u20136 subtopics.
* Keep each subtopic focused.
* Order them from foundational \u2192 advanced where appropriate.
* Avoid overlapping or duplicate subtopics.
* Do not create tiny subtopics that contain only one definition.

### 3. Conceptual Clarity
Generate MEDIUM LENGTH conceptual clarity content for the topic.
Target:
* approximately 3\u20136 short paragraphs
* 1\u20132 useful examples where appropriate
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
    const rawResult = await caller(ai, prompt, { responseMimeType: "application/json" });
    const parsed = safeExtractJson(rawResult);
    if (parsed) {
      const validation = topicAnalysisResultSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      } else {
        console.warn("[topicEngine] AI output schema mismatch:", validation.error.format());
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
    console.error("[topicEngine] Gemini analysis error, invoking fallback:", err);
  }
  return runDeterministicTopicAnalysis(params);
}

// src/server/gemini.ts
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
var geminiClient = null;
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}
var aiResponseCache = /* @__PURE__ */ new Map();
var quotaCooldownUntil = 0;
var demandCooldownUntil = 0;
async function callGeminiWithRetry(ai, prompt, options) {
  if (!ai) return null;
  const cacheKey = `${options?.responseMimeType || "text"}:${prompt.slice(0, 200)}:${prompt.length}`;
  if (aiResponseCache.has(cacheKey)) {
    return aiResponseCache.get(cacheKey);
  }
  const now = Date.now();
  if (now < quotaCooldownUntil || now < demandCooldownUntil) {
    return null;
  }
  try {
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Model call timeout")), 25e3)
    );
    const callPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: options?.responseMimeType ? { responseMimeType: options.responseMimeType } : void 0
    });
    const response = await Promise.race([callPromise, timeoutPromise]);
    if (response && response.text) {
      aiResponseCache.set(cacheKey, response.text);
      return response.text;
    }
  } catch (err) {
    const msg = String(err?.message || err);
    console.warn("[callGeminiWithRetry] Gemini error:", msg);
    const isQuotaExhausted = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
    const isHighDemand = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand");
    if (isQuotaExhausted) {
      quotaCooldownUntil = Date.now() + 6e4;
    } else if (isHighDemand) {
      demandCooldownUntil = Date.now() + 15e3;
    }
  }
  return null;
}

// src/api-handlers/ai/analyze-topic.ts
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const validation = topicAnalysisRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid topic analysis request parameters",
        details: validation.error.issues[0]?.message
      });
    }
    const ai = getGeminiClient();
    const result = await runTopicAnalysisPipeline(ai, callGeminiWithRetry, validation.data);
    return res.status(200).json(result);
  } catch (fatalError) {
    console.error("[analyze-topic] Fatal handler error:", fatalError);
    return res.status(500).json({ error: "Failed to analyze topic" });
  }
}
export {
  handler as default
};
