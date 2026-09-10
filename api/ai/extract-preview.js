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
function normalizeSyllabusFormatting(text) {
  if (!text) return "";
  return text.replace(/([^\r\n])\s*((?:UNIT|MODULE|CHAPTER|PART|SECTION)\s*[-:]?\s*[0-9A-Za-zIVXLCDM]+)/gi, "$1\n$2").trim();
}
function formatTopicTitle(raw) {
  const cleaned = raw.replace(/^(?:[\*\-\•\>]|\d+[\.\)])\s*/, "").replace(/[;,]+$/, "").trim();
  if (!cleaned) return "";
  const hasLower = /[a-z]/.test(cleaned);
  const hasUpper = /[A-Z]/.test(cleaned);
  if (hasLower && hasUpper) {
    return cleaned;
  }
  if (!hasLower && hasUpper && cleaned.length <= 5) {
    return cleaned;
  }
  const smallWords = /* @__PURE__ */ new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "of", "in", "with"]);
  return cleaned.split(/\s+/).map((word, idx) => {
    if (word.length <= 5 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
      return word;
    }
    const lower = word.toLowerCase();
    if (idx > 0 && smallWords.has(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(" ");
}
function splitByCommaOrSemicolon(text) {
  const parts = [];
  let current = "";
  let parenDepth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "(" || char === "[" || char === "{") {
      parenDepth++;
      current += char;
    } else if (char === ")" || char === "]" || char === "}") {
      if (parenDepth > 0) parenDepth--;
      current += char;
    } else if ((char === "," || char === ";") && parenDepth === 0) {
      if (current.trim().length >= 2) {
        parts.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim().length >= 2) {
    parts.push(current.trim());
  }
  return parts;
}
function parseCandidateTopicStrings(rawText) {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => {
    const lower = l.toLowerCase();
    return l.length > 0 && !lower.startsWith("textbook") && !lower.startsWith("reference") && !lower.startsWith("prescribed book") && !lower.startsWith("prerequisite");
  });
  const topics = [];
  for (const line of lines) {
    const cleaned = line.replace(/^(?:[\*\-\•\>]|\d+[\.\)])\s*/, "").trim();
    if (!cleaned) continue;
    const parts = splitByCommaOrSemicolon(cleaned);
    for (const part of parts) {
      if (part.length >= 2) {
        topics.push(part);
      }
    }
  }
  return topics;
}
function convertCandidateToExtractedTopic(rawCandidate, unitRef, _orderIdx) {
  const trimmed = rawCandidate.trim();
  const parenMatch = trimmed.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch && parenMatch[1].trim().length >= 2) {
    const mainTitle = formatTopicTitle(parenMatch[1]);
    const subRaw = parenMatch[2].split(/[,;]/).map((s) => s.trim()).filter((s) => s.length >= 2);
    const subtopics = subRaw.map((st, sIdx) => ({
      title: formatTopicTitle(st),
      source_reference: `${unitRef} \u2192 ${mainTitle} \u2192 ${formatTopicTitle(st)}`,
      source_excerpt: st,
      concepts: extractConceptsFromTitle(st),
      prerequisites: sIdx > 0 ? [formatTopicTitle(subRaw[sIdx - 1])] : [],
      derived: false,
      derived_from: []
    }));
    return {
      title: mainTitle,
      source_reference: `${unitRef} \u2192 ${mainTitle}`,
      source_excerpt: trimmed,
      subtopics
    };
  }
  const cleanTitle = formatTopicTitle(trimmed);
  return {
    title: cleanTitle,
    source_reference: `${unitRef} \u2192 ${cleanTitle}`,
    source_excerpt: trimmed,
    subtopics: []
  };
}
function deterministicSourceExtractor(courseName, syllabusText, materialsSummary) {
  const cleanName = (courseName || "Course").trim();
  const rawText = normalizeSyllabusFormatting((syllabusText || materialsSummary || "").trim());
  if (!rawText || rawText.length < 10) {
    return createStarterCurriculum(cleanName);
  }
  const unitLineRegex = /(?:^|\n)[ \t]*(?:UNIT|MODULE|CHAPTER|PART|SECTION)\s*[-:]?\s*([0-9A-Za-zIVXLCDM]+)(?:[ \t]*[:\-\.][ \t]*([^\r\n]*)|[ \t]*([^\r\n]*))/gi;
  const unitMatches = Array.from(rawText.matchAll(unitLineRegex));
  if (unitMatches.length >= 1) {
    const units = [];
    for (let i = 0; i < unitMatches.length; i++) {
      const match = unitMatches[i];
      const unitNum = match[1].trim();
      const headerText = (match[2] || match[3] || "").trim();
      const startIndex = match.index + match[0].length;
      const endIndex = i + 1 < unitMatches.length ? unitMatches[i + 1].index : rawText.length;
      const sectionBody = rawText.slice(startIndex, endIndex).trim();
      let unitTitle = `Unit ${unitNum}`;
      const headerCandidates = [];
      if (headerText) {
        if (headerText.includes(",") || headerText.includes(";")) {
          const dashIdx = headerText.search(/[:\-]/);
          if (dashIdx > 0 && dashIdx < 40) {
            const prefix = headerText.slice(0, dashIdx).trim();
            const rest = headerText.slice(dashIdx + 1).trim();
            if (prefix.length >= 2) {
              unitTitle = `Unit ${unitNum}: ${formatTopicTitle(prefix)}`;
            }
            headerCandidates.push(...parseCandidateTopicStrings(rest));
          } else {
            headerCandidates.push(...parseCandidateTopicStrings(headerText));
          }
        } else {
          unitTitle = `Unit ${unitNum}: ${formatTopicTitle(headerText)}`;
        }
      }
      const bodyCandidates = parseCandidateTopicStrings(sectionBody);
      const allCandidates = [...headerCandidates, ...bodyCandidates];
      const topics = [];
      if (allCandidates.length === 0) {
        topics.push({
          title: formatTopicTitle(headerText || `Unit ${unitNum} Core`),
          source_reference: `Unit ${unitNum}`,
          source_excerpt: sectionBody.slice(0, 200) || unitTitle,
          subtopics: []
        });
      } else {
        allCandidates.forEach((cand, idx) => {
          topics.push(convertCandidateToExtractedTopic(cand, `Unit ${unitNum}`, idx));
        });
      }
      units.push({
        title: unitTitle,
        source_reference: `Unit ${unitNum}`,
        topics
      });
    }
    return {
      source_summary: `Faithfully extracted ${units.length} unit(s) and ${units.reduce((acc, u) => acc + u.topics.length, 0)} topic(s) directly from student syllabus.`,
      is_generic_starter: false,
      units
    };
  }
  return parseUnstructuredSource(cleanName, rawText);
}
function parseUnstructuredSource(courseName, text) {
  const candidateTopics = parseCandidateTopicStrings(text);
  const topics = [];
  if (candidateTopics.length === 0) {
    topics.push({
      title: formatTopicTitle(courseName),
      source_reference: "Curriculum",
      source_excerpt: text.slice(0, 200),
      subtopics: []
    });
  } else {
    candidateTopics.forEach((cand, idx) => {
      topics.push(convertCandidateToExtractedTopic(cand, "Curriculum", idx));
    });
  }
  return {
    source_summary: `Structured ${topics.length} topics directly from student syllabus for ${courseName}.`,
    is_generic_starter: false,
    units: [
      {
        title: courseName,
        source_reference: "Curriculum",
        topics
      }
    ]
  };
}
function createStarterCurriculum(courseName) {
  const cLower = courseName.toLowerCase();
  const starterNote = `No custom syllabus was provided. Created a general starter curriculum for "${courseName}". You can edit the syllabus at any time to ground it in your exact course material.`;
  if (cLower.includes("operat") || cLower.includes("os")) {
    return {
      source_summary: starterNote,
      is_generic_starter: true,
      units: [
        {
          title: "Unit 1: Process Management & CPU Scheduling",
          source_reference: "General Starter Curriculum",
          topics: [
            {
              title: "Process Management",
              source_reference: "Starter 1.1",
              source_excerpt: "Process models, states, PCB, context switching",
              subtopics: [
                {
                  title: "Process Concept, States & PCB",
                  source_reference: "Starter 1.1.1",
                  source_excerpt: "Process states, PCB tracking, context switch overhead",
                  concepts: ["Process Control Block", "Process States", "Context Switching"],
                  prerequisites: [],
                  derived: true,
                  derived_from: ["Operating Systems Fundamentals"]
                },
                {
                  title: "CPU Scheduling Algorithms (FCFS, SJF, Round Robin)",
                  source_reference: "Starter 1.1.2",
                  source_excerpt: "CPU scheduling criteria, preemptive vs non-preemptive",
                  concepts: ["Round Robin", "Time Quantum", "Convoy Effect", "Shortest Job First"],
                  prerequisites: ["Process Concept, States & PCB"],
                  derived: true,
                  derived_from: ["Process Management"]
                }
              ]
            }
          ]
        },
        {
          title: "Unit 2: Memory Management",
          source_reference: "General Starter Curriculum",
          topics: [
            {
              title: "Virtual Memory & Paging",
              source_reference: "Starter 2.1",
              source_excerpt: "Address spaces, page tables, TLB, page replacement",
              subtopics: [
                {
                  title: "Paging & Address Translation",
                  source_reference: "Starter 2.1.1",
                  source_excerpt: "Logical vs physical address, frame allocation",
                  concepts: ["Logical Address", "Physical Frame", "Page Offset"],
                  prerequisites: [],
                  derived: true,
                  derived_from: ["Memory Architecture"]
                },
                {
                  title: "Page Tables & TLB Mechanics",
                  source_reference: "Starter 2.1.2",
                  source_excerpt: "Multi-level page tables, TLB hit ratio and miss penalty",
                  concepts: ["Page Tables", "TLB", "Translation Lookaside Buffer", "Address Translation"],
                  prerequisites: ["Paging & Address Translation"],
                  derived: true,
                  derived_from: ["Virtual Memory"]
                }
              ]
            }
          ]
        }
      ]
    };
  }
  if (cLower.includes("calculus") || cLower.includes("math")) {
    return {
      source_summary: starterNote,
      is_generic_starter: true,
      units: [
        {
          title: "Unit 1: Limits & Continuity",
          source_reference: "General Starter Curriculum",
          topics: [
            {
              title: "Foundations of Limits",
              source_reference: "Starter 1.1",
              source_excerpt: "Definition of limits, one-sided limits, continuity",
              subtopics: [
                {
                  title: "Limit Concept & Evaluation",
                  source_reference: "Starter 1.1.1",
                  source_excerpt: "Evaluating limits algebraically and graphically",
                  concepts: ["Limit Laws", "Indeterminate Forms", "Approaching Values"],
                  prerequisites: [],
                  derived: true,
                  derived_from: ["Precalculus Algebra"]
                },
                {
                  title: "Continuity & Intermediate Value Theorem",
                  source_reference: "Starter 1.1.2",
                  source_excerpt: "Points of discontinuity and IVT application",
                  concepts: ["Continuous Functions", "Removable Discontinuity", "IVT"],
                  prerequisites: ["Limit Concept & Evaluation"],
                  derived: true,
                  derived_from: ["Limits"]
                }
              ]
            }
          ]
        },
        {
          title: "Unit 2: Derivatives & Differentiation Rules",
          source_reference: "General Starter Curriculum",
          topics: [
            {
              title: "Differential Calculus",
              source_reference: "Starter 2.1",
              source_excerpt: "Power rule, product rule, quotient rule, chain rule",
              subtopics: [
                {
                  title: "Fundamental Derivative Rules",
                  source_reference: "Starter 2.1.1",
                  source_excerpt: "Power, product, and quotient rules",
                  concepts: ["Instantaneous Rate of Change", "Tangent Slope", "Power Rule"],
                  prerequisites: ["Continuity & Intermediate Value Theorem"],
                  derived: true,
                  derived_from: ["Differential Calculus"]
                },
                {
                  title: "Chain Rule for Composite Functions",
                  source_reference: "Starter 2.1.2",
                  source_excerpt: "Differentiating outer and inner functions",
                  concepts: ["Composite Functions", "Chain Rule", "Inner Derivative"],
                  prerequisites: ["Fundamental Derivative Rules"],
                  derived: true,
                  derived_from: ["Derivatives"]
                }
              ]
            }
          ]
        }
      ]
    };
  }
  return {
    source_summary: starterNote,
    is_generic_starter: true,
    units: [
      {
        title: `Unit 1: Core Foundations of ${courseName}`,
        source_reference: "General Starter Curriculum",
        topics: [
          {
            title: `Foundations of ${courseName}`,
            source_reference: "Starter 1.1",
            source_excerpt: `Foundational principles and terminology of ${courseName}`,
            subtopics: [
              {
                title: `${courseName} Principles & Core Concepts`,
                source_reference: "Starter 1.1.1",
                source_excerpt: `Essential vocabulary, definitions, and model assumptions in ${courseName}`,
                concepts: [`${courseName} Basics`, "Definitions", "Core Models"],
                prerequisites: [],
                derived: true,
                derived_from: ["Subject Overview"]
              },
              {
                title: `Structural Models & Methodology`,
                source_reference: "Starter 1.1.2",
                source_excerpt: `Analytical methods and structural patterns in ${courseName}`,
                concepts: ["Framework Analysis", "Methodology", "Problem Solving"],
                prerequisites: [`${courseName} Principles & Core Concepts`],
                derived: true,
                derived_from: ["Foundations"]
              }
            ]
          }
        ]
      },
      {
        title: `Unit 2: Advanced Applications & Techniques`,
        source_reference: "General Starter Curriculum",
        topics: [
          {
            title: `Applied ${courseName}`,
            source_reference: "Starter 2.1",
            source_excerpt: `Case studies and complex operations in ${courseName}`,
            subtopics: [
              {
                title: `Operational Techniques & Mechanics`,
                source_reference: "Starter 2.1.1",
                source_excerpt: `Step-by-step procedures and execution rules in ${courseName}`,
                concepts: ["Procedures", "Execution Rules", "Verification"],
                prerequisites: [`Structural Models & Methodology`],
                derived: true,
                derived_from: ["Applications"]
              },
              {
                title: `Analysis, Optimization & Best Practices`,
                source_reference: "Starter 2.1.2",
                source_excerpt: `Edge cases, trade-offs, and critical evaluation in ${courseName}`,
                concepts: ["Trade-offs", "Critical Evaluation", "Optimization"],
                prerequisites: [`Operational Techniques & Mechanics`],
                derived: true,
                derived_from: ["Advanced Topics"]
              }
            ]
          }
        ]
      }
    ]
  };
}
function extractConceptsFromTitle(title) {
  const cleaned = title.replace(/^(?:Unit|Module|Chapter)\s*\d+[:\-\s]*/i, "").trim();
  const tokens = cleaned.split(/[\s,&/()]+/).map((t) => t.trim()).filter((t) => t.length > 2 && !["and", "for", "the", "with", "part", "core", "theory"].includes(t.toLowerCase()));
  const concepts = [cleaned];
  for (const token of tokens) {
    if (!concepts.includes(token)) {
      concepts.push(token);
    }
  }
  return concepts.slice(0, 5);
}
async function extractCourseSource(ai, callGeminiFn, params) {
  const { courseName, subject, academicLevel, syllabusText, materialsSummary } = params;
  if ((!syllabusText || syllabusText.trim().length < 10) && (!materialsSummary || materialsSummary.trim().length < 10)) {
    return createStarterCurriculum(courseName);
  }
  const rawInput = [
    syllabusText ? `STUDENT SYLLABUS:
${normalizeSyllabusFormatting(syllabusText)}` : "",
    materialsSummary ? `UPLOADED NOTES / STUDY MATERIALS:
${normalizeSyllabusFormatting(materialsSummary)}` : ""
  ].filter(Boolean).join("\n\n");
  if (ai) {
    const prompt = `You are the KnowIQ Source-Grounded Curriculum Architect.
Your PRIMARY AND ABSOLUTE RESPONSIBILITY is to faithfully extract and structure WHAT THE STUDENT ACTUALLY PROVIDED.

COURSE NAME: "${courseName}"
SUBJECT: "${subject || "General"}"
ACADEMIC LEVEL: "${academicLevel || "Undergraduate"}"

STUDENT PROVIDED SOURCE:
"""
${rawInput}
"""

CRITICAL SYLLABUS DECOMPOSITION RULES:
1. CONDITIONAL UNIT BREAKDOWN:
   - Break the syllabus into units ONLY IF the student input explicitly contains unit markers (e.g. "UNIT-1", "Unit 1", "UNIT I", "MODULE 1", "CHAPTER 1", "PART 1").
   - If the student input does NOT contain explicit unit headers, DO NOT invent fake units like "Unit 1" or "Unit 2". In that case, return EXACTLY 1 unit with title set to "${courseName}" and source_reference "Curriculum".

2. COMMA = INDIVIDUAL TOPIC (CRITICAL RULE):
   - In syllabus outlines, EACH COMMA (",") OR SEMICOLON (";") SEPARATES AN INDIVIDUAL TOPIC!
   - NEVER combine a comma-separated list into a single topic.
   - For example, if a line or unit says:
     "probability notion, the axioms of probability, inference in temporal models, hidden markov models"
     You MUST output 4 separate topic objects:
     - Topic 1: "Probability Notion"
     - Topic 2: "The Axioms of Probability"
     - Topic 3: "Inference in Temporal Models"
     - Topic 4: "Hidden Markov Models"
   - Every single comma-separated topic must be preserved faithfully in sequence.

3. SUBTOPICS RULE:
   - If a topic item has explicit sub-items in parentheses or colons, extract those as subtopics.
   - If a topic is focused (e.g. "The Axioms of Probability"), provide 0 to 2 subtopics or leave subtopics as [].
   - Do NOT force artificial subtopics on focused concepts.

4. TRACEABILITY:
   - For every unit and topic, provide "source_reference" (e.g. "Unit 1" or "Curriculum") and "source_excerpt" (short quote or phrase from student text).
   - If subtopics exist, provide "concepts" (array of key terms) and "prerequisites".

Output strictly valid JSON conforming to this schema:
{
  "source_summary": "Faithful extraction summary describing what was extracted from the student input",
  "is_generic_starter": false,
  "units": [
    {
      "title": "Unit 1: Title (or '${courseName}' if no units in source)",
      "source_reference": "Unit 1",
      "topics": [
        {
          "title": "Topic Title",
          "source_reference": "Unit 1 -> Topic Title",
          "source_excerpt": "Excerpt from source",
          "subtopics": [
            {
              "title": "Subtopic Title",
              "source_reference": "Unit 1 -> Section 1.1",
              "source_excerpt": "Excerpt from source",
              "concepts": ["Concept 1"],
              "prerequisites": [],
              "derived": false,
              "derived_from": []
            }
          ]
        }
      ]
    }
  ]
}
Output ONLY valid JSON.`;
    try {
      const raw = await callGeminiFn(ai, prompt, { responseMimeType: "application/json" });
      const parsed = safeJsonParse(raw);
      const validation = sourceExtractionSchema.safeParse(parsed);
      if (validation.success && validation.data.units.length > 0) {
        return validation.data;
      }
    } catch (err) {
      console.warn("[sourceEngine] Gemini extraction error, falling back to deterministic parser:", err);
    }
  }
  return deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
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

// src/api-handlers/ai/extract-preview.ts
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
    const { courseName, subject, academicLevel } = rawBody;
    const syllabusText = rawBody.syllabusText || rawBody.syllabus;
    const materialsSummary = rawBody.materialsSummary || rawBody.materials;
    try {
      const ai = getGeminiClient();
      const extraction = await extractCourseSource(ai, callGeminiWithRetry, {
        courseName,
        subject,
        academicLevel,
        syllabusText,
        materialsSummary
      });
      return res.status(200).json(extraction);
    } catch (engineErr) {
      console.warn("[extract-preview] Falling back to deterministic extractor:", engineErr);
      const fallback = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
      return res.status(200).json(fallback);
    }
  } catch (fatalError) {
    console.error("[extract-preview] Fatal handler error:", fatalError);
    return res.status(500).json({ error: "Failed to extract syllabus preview" });
  }
}
export {
  handler as default
};
