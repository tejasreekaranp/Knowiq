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

// src/server/sourceEngine.ts
function safeJsonParse(str) {
  if (!str) return null;
  try {
    const cleaned = str.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
async function diagnoseSubtopicClarity(ai, callGeminiFn, params) {
  const { subtopicTitle, topicTitle, courseName, concepts = [], questions, userAnswers } = params;
  let correctCount = 0;
  const categoryTotals = {
    conceptual: { total: 0, correct: 0 },
    recall: { total: 0, correct: 0 },
    application: { total: 0, correct: 0 },
    differentiation: { total: 0, correct: 0 }
  };
  const questionDetails = questions.map((q, i) => {
    const userSelected = userAnswers[q.id] ?? userAnswers[i];
    const isCorrect = userSelected === q.correctIndex;
    if (isCorrect) correctCount++;
    const cat = q.category || "conceptual";
    if (categoryTotals[cat]) {
      categoryTotals[cat].total += 1;
      if (isCorrect) categoryTotals[cat].correct += 1;
    }
    return {
      question: q.question,
      options: q.options,
      userAnswer: q.options?.[userSelected] || "None",
      correctAnswer: q.options?.[q.correctIndex] || "None",
      isCorrect,
      category: cat,
      explanation: q.explanation
    };
  });
  const getPct = (cat, fallback) => {
    const item = categoryTotals[cat];
    if (!item || item.total === 0) return fallback;
    return Math.round(item.correct / item.total * 100);
  };
  const conceptualScore = getPct("conceptual", correctCount >= 4 ? 90 : 65);
  const recallScore = getPct("recall", correctCount >= 4 ? 85 : 60);
  const applicationScore = getPct("application", correctCount >= 4 ? 80 : 45);
  const differentiationScore = getPct("differentiation", correctCount >= 4 ? 75 : 40);
  const overallClarity = Math.round(
    0.3 * conceptualScore + 0.2 * recallScore + 0.3 * applicationScore + 0.2 * differentiationScore
  );
  if (ai) {
    const prompt = `You are the KnowIQ Cognitive Clarity Diagnostic Engine.
Evaluate the student's performance specifically on Subtopic: "${subtopicTitle}".
Parent Topic: "${topicTitle || ""}"
Course: "${courseName || ""}"
Key Concepts: ${concepts.join(", ") || subtopicTitle}

STUDENT'S QUIZ RESULTS:
${JSON.stringify(questionDetails, null, 2)}

Overall Clarity Score: ${overallClarity}%
Category Breakdown:
- Conceptual: ${conceptualScore}%
- Recall: ${recallScore}%
- Application: ${applicationScore}%
- Differentiation: ${differentiationScore}%

CRITICAL PRINCIPLES (PRINCIPLES 19, 20, 36):
1. GROUNDED IN ${subtopicTitle}:
   - The diagnosis must diagnose the EXACT misconception about "${subtopicTitle}" and its concepts (${concepts.join(", ")}).
   - If the student made errors, pinpoint what specific conceptual distinction they confused (e.g., if learning Page Tables: "Confuses page number with frame number during address translation"; if learning Chain Rule: "Differentiates the outer function but forgets to multiply by the inner derivative").
   - NEVER generate generic feedback or refer to unrelated subjects.
2. REMEDIATION & FOLLOW-UP CHECK:
   - Provide a crystal-clear remediation explanation addressing the detected gap in "${subtopicTitle}".
   - Provide a follow-up multiple-choice question testing THAT EXACT CONCEPT in "${subtopicTitle}".

Output strictly valid JSON conforming to this schema:
{
  "detectedIssue": "Specific diagnostic diagnosis of the student's cognitive grasp or exact misconception in ${subtopicTitle}",
  "nextAction": "Prescribed adaptive action for reteaching or advancing in ${subtopicTitle}",
  "remediationContent": {
    "comparisonExplanation": "Targeted remediation explaining the key distinction or invariant in ${subtopicTitle}",
    "followUpQuestion": {
      "question": "Follow-up verification question testing the misunderstood concept in ${subtopicTitle}",
      "options": ["Option A (Correct)", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why Option A is correct based on ${subtopicTitle} principles"
    }
  }
}
Output strictly valid JSON.`;
    try {
      const raw = await callGeminiFn(ai, prompt, { responseMimeType: "application/json" });
      const parsed = safeJsonParse(raw);
      const validation = geminiDiagnoseClaritySchema.safeParse(parsed);
      if (validation.success) {
        return {
          overallClarity,
          conceptualScore,
          recallScore,
          applicationScore,
          differentiationScore,
          detectedIssue: validation.data.detectedIssue,
          nextAction: validation.data.nextAction || "Review targeted remediation drill.",
          remediationContent: validation.data.remediationContent
        };
      }
    } catch (err) {
      console.warn("[sourceEngine] Gemini diagnose error, falling back to deterministic diagnosis:", err);
    }
  }
  const primaryConcept = concepts[0] || subtopicTitle;
  let detectedIssue = "";
  let nextAction = "";
  if (overallClarity >= 80) {
    detectedIssue = `Excellent conceptual grasp of ${subtopicTitle}. The student accurately applied the core rules of ${primaryConcept} across both definitions and application scenarios.`;
    nextAction = `Promote ${subtopicTitle} to the Spaced Revision queue and unlock the next sequential learning unit.`;
  } else if (differentiationScore < 60) {
    detectedIssue = `Student understands the basic definition of ${subtopicTitle}, but struggles with differentiation and boundary conditions involving ${primaryConcept}.`;
    nextAction = `Reinforce with the targeted side-by-side distinction drill below, then verify retention.`;
  } else {
    detectedIssue = `Student experienced confusion on practical application scenarios in ${subtopicTitle}, particularly when evaluating complex states of ${primaryConcept}.`;
    nextAction = `Review the core invariant rules of ${primaryConcept} and execute the follow-up verification check.`;
  }
  return {
    overallClarity,
    conceptualScore,
    recallScore,
    applicationScore,
    differentiationScore,
    detectedIssue,
    nextAction,
    remediationContent: {
      comparisonExplanation: `Core distinction for ${subtopicTitle}: Invariants governing ${primaryConcept} must hold across all valid states. Ensure that preconditions are verified before executing transformations.`,
      followUpQuestion: {
        question: `In ${subtopicTitle}, what condition guarantees the invariant correctness of ${primaryConcept}?`,
        options: [
          `Satisfying verified boundary preconditions and adhering to formal ${subtopicTitle} rules`,
          `Allowing unconstrained state mutations without validation`,
          `Bypassing error checking during execution`,
          `Assuming that all inputs produce identical outputs regardless of context`
        ],
        correctIndex: 0,
        explanation: `Preserving verified preconditions and following the formal rules of ${subtopicTitle} guarantees correctness for ${primaryConcept}.`
      }
    }
  };
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

// src/api-handlers/ai/diagnose-clarity.ts
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
    const validation = diagnoseClarityRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid quiz response parameters",
        details: validation.error.issues[0]?.message
      });
    }
    try {
      const ai = getGeminiClient();
      const diagnostic = await diagnoseSubtopicClarity(ai, callGeminiWithRetry, validation.data);
      return res.status(200).json(diagnostic);
    } catch (engineErr) {
      console.warn("[diagnose-clarity] AI diagnosis failed, falling back:", engineErr);
      const diagnostic = await diagnoseSubtopicClarity(null, callGeminiWithRetry, validation.data);
      return res.status(200).json(diagnostic);
    }
  } catch (fatalError) {
    console.error("[diagnose-clarity] Fatal handler error:", fatalError);
    return res.status(500).json({ error: "Failed to diagnose clarity" });
  }
}
export {
  handler as default
};
