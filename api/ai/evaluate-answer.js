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

// src/server/learningEngine.ts
function evaluateAnswer(params) {
  const { question, selectedIndex, confidence } = params;
  const isCorrect = selectedIndex === question.correctIndex;
  let didacticFeedback = "";
  let coreConceptReinforced = question.targetConcept || "Core Principle";
  let clarityShift = 0;
  let adaptiveAction = "advance";
  let reason = "";
  let nextStepLabel = "";
  if (isCorrect) {
    clarityShift = confidence === "high" ? 15 : 10;
    coreConceptReinforced = question.options[question.correctIndex];
    didacticFeedback = `Exactly right! ${question.explanation}`;
    if (confidence === "high") {
      adaptiveAction = "advance";
      reason = "You answered correctly with high confidence. You have mastered this concept and are ready for advanced topics.";
      nextStepLabel = "Proceed to Next Concept";
    } else {
      adaptiveAction = "reinforce";
      reason = "You arrived at the correct answer, but lower confidence suggests reinforcing the underlying invariant before moving forward.";
      nextStepLabel = "Review Key Invariant & Continue";
    }
  } else {
    clarityShift = -10;
    const whyWrong = question.whyWrongMap?.[selectedIndex] || "This choice misapplies the boundary conditions of the concept.";
    didacticFeedback = `Not quite. ${whyWrong}

Key Rule: ${question.explanation}`;
    if (confidence === "high") {
      adaptiveAction = "investigate_misconception";
      reason = "You answered incorrectly with high confidence, indicating an active misconception. Reviewing the distinction will quickly clear up this confusion.";
      nextStepLabel = "Review Common Misconception";
    } else {
      adaptiveAction = "simplify_and_reteach";
      reason = "You were uncertain and selected an incorrect option. Reviewing the core intuition will make the mechanism intuitive.";
      nextStepLabel = "Revisit Intuitive Overview";
    }
  }
  return {
    isCorrect,
    didacticFeedback,
    coreConceptReinforced,
    clarityShift,
    adaptiveRecommendation: {
      action: adaptiveAction,
      reason,
      nextStepLabel
    }
  };
}

// src/api-handlers/ai/evaluate-answer.ts
function handler(req, res) {
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
    const validation = answerEvaluationRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid answer evaluation request parameters",
        details: validation.error.issues[0]?.message
      });
    }
    const result = evaluateAnswer(validation.data);
    return res.status(200).json(result);
  } catch (fatalError) {
    console.error("[evaluate-answer] Fatal handler error:", fatalError);
    return res.status(500).json({ error: "Failed to evaluate answer" });
  }
}
export {
  handler as default
};
