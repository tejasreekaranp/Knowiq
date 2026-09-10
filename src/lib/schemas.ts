import { z } from 'zod';

// ==========================================
// 1. Client & Server Input Validation Schemas
// ==========================================

export const courseInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { message: 'Course name must be at least 2 characters' })
    .max(120, { message: 'Course name cannot exceed 120 characters' }),
  subject: z
    .string()
    .trim()
    .min(2, { message: 'Subject must be at least 2 characters' })
    .max(80, { message: 'Subject cannot exceed 80 characters' }),
  academicLevel: z
    .string()
    .trim()
    .min(2)
    .max(50),
  description: z.string().trim().max(1000).optional().default(''),
  syllabus: z.string().trim().max(25000).optional().default(''),
  durationDays: z.number().int().min(1).max(365).optional().default(30),
});

export type CourseInput = z.infer<typeof courseInputSchema>;

// Subtopic learning content request schema (source-grounded)
export const subtopicContentRequestSchema = z.object({
  courseName: z.string().trim().min(1).max(120),
  topicTitle: z.string().trim().min(1).max(120),
  subtopicTitle: z.string().trim().min(1).max(120),
  existingClarity: z.number().min(0).max(100).optional().default(50),
  sourceReference: z.string().optional(),
  sourceExcerpt: z.string().optional(),
  concepts: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  courseSyllabus: z.string().optional(),
  academicLevel: z.string().optional(),
});

// Diagnose clarity request schema (grounded in subtopic concepts)
export const diagnoseClarityRequestSchema = z.object({
  courseName: z.string().trim().optional(),
  topicTitle: z.string().trim().optional(),
  subtopicTitle: z.string().trim().min(1).max(150),
  concepts: z.array(z.string()).optional(),
  sourceReference: z.string().optional(),
  sourceExcerpt: z.string().optional(),
  questions: z
    .array(
      z.object({
        id: z.string().max(50),
        question: z.string().max(1000),
        options: z.array(z.string().max(500)),
        correctIndex: z.number().int().min(0).max(10),
        category: z.enum(['conceptual', 'recall', 'application', 'differentiation']).optional(),
        explanation: z.string().optional(),
      })
    )
    .min(1)
    .max(10),
  userAnswers: z.record(z.string(), z.union([z.string(), z.number()])),
});

// Source Extraction & Decomposition Schemas
export const extractedSubtopicSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(''),
  source_excerpt: z.string().optional().default(''),
  concepts: z.array(z.string()).optional().default([]),
  prerequisites: z.array(z.string()).optional().default([]),
  derived: z.boolean().optional().default(false),
  derived_from: z.array(z.string()).optional().default([]),
});

export const extractedTopicSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(''),
  source_excerpt: z.string().optional().default(''),
  subtopics: z.array(extractedSubtopicSchema).optional().default([]),
});

export const extractedUnitSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(''),
  topics: z.array(extractedTopicSchema).min(1),
});

export const sourceExtractionSchema = z.object({
  source_summary: z.string(),
  is_generic_starter: z.boolean().optional().default(false),
  units: z.array(extractedUnitSchema).min(1),
});

export type ExtractedSubtopic = z.infer<typeof extractedSubtopicSchema>;
export type ExtractedTopic = z.infer<typeof extractedTopicSchema>;
export type ExtractedUnit = z.infer<typeof extractedUnitSchema>;
export type SourceExtractionResult = z.infer<typeof sourceExtractionSchema>;

// Custom revision generator request schema
export const generateRevisionRequestSchema = z.object({
  topicTitles: z.array(z.string().trim().max(120)).min(1).max(15),
  revisionType: z.string().trim().max(50).default('Mixed'),
  difficulty: z.string().trim().max(50).default('Medium'),
  questionCount: z.number().int().min(1).max(15).default(5),
});

// ==========================================
// 2. AI Response Validation Schemas
// ==========================================

export const geminiSubtopicContentSchema = z.object({
  conceptual: z.object({
    quick: z.string(),
    standard: z.string(),
    deep: z.string(),
    expert: z.string(),
    whatIsIt: z.string(),
    whyExists: z.string(),
    problemSolved: z.string(),
    keyTakeaway: z.string(),
  }),
  interactive: z.object({
    fillBlank: z.object({
      question: z.string(),
      preText: z.string(),
      missingWord: z.string(),
      postText: z.string(),
      options: z.array(z.string()),
      hint: z.string(),
      explanation: z.string(),
    }),
    matching: z.array(
      z.object({
        id: z.string(),
        term: z.string(),
        definition: z.string(),
      })
    ),
    ordering: z.object({
      title: z.string(),
      instruction: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
          correctOrder: z.number(),
        })
      ),
    }),
  }),
  deepRevision: z.object({
    detailedNotes: z.array(z.string()),
    comparisonTable: z.object({
      title: z.string(),
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    }),
    commonPitfalls: z.array(z.string()),
    mentalModelOrMnemonic: z.string(),
  }),
  hardQuiz: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      category: z.string().optional(),
      explanation: z.string(),
    })
  ),
  externalResources: z
    .array(
      z.object({
        type: z.string(),
        title: z.string(),
        source: z.string(),
        description: z.string(),
        url: z.string(),
        tag: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const geminiDiagnoseClaritySchema = z.object({
  detectedIssue: z.string(),
  nextAction: z.string().optional(),
  remediationContent: z.object({
    comparisonExplanation: z.string(),
    followUpQuestion: z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
    }),
  }),
});

// ==========================================
// 3. Topic Analysis & Conceptual Clarity Schemas
// ==========================================

export const topicAnalysisRequestSchema = z.object({
  topicTitle: z.string().trim().min(1, 'Topic title cannot be empty').max(150),
  courseName: z.string().trim().optional().default('Course'),
  subject: z.string().trim().optional().default('General'),
  academicLevel: z.string().trim().optional().default('Undergraduate'),
  syllabusExcerpt: z.string().optional().default(''),
  sourceContext: z.string().optional().default(''),
});

export type TopicAnalysisRequest = z.infer<typeof topicAnalysisRequestSchema>;

export const topicSubtopicItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  order: z.number().int().min(1),
});

export type TopicSubtopicItem = z.infer<typeof topicSubtopicItemSchema>;

export const keyConceptItemSchema = z.union([
  z.object({
    term: z.string().min(1),
    explanation: z.string().min(1),
  }),
  z.string().transform((str) => ({
    term: str,
    explanation: `Core mechanism and definition of ${str}.`,
  })),
]);

export const conceptualExampleItemSchema = z.union([
  z.object({
    title: z.string().min(1),
    explanation: z.string().min(1),
  }),
  z.string().transform((str) => ({
    title: 'Practical Example',
    explanation: str,
  })),
]);

export const commonConfusionItemSchema = z.union([
  z.object({
    confusion: z.string().min(1),
    clarification: z.string().min(1),
  }),
  z.string().transform((str) => ({
    confusion: str,
    clarification: 'Understand the underlying mechanism and boundary invariants to avoid this misconception.',
  })),
]);

export const conceptualClaritySchema = z.object({
  summary: z.string().min(1),
  explanation: z.string().min(1),
  key_concepts: z.array(keyConceptItemSchema).default([]),
  examples: z.array(conceptualExampleItemSchema).default([]),
  analogy: z.string().nullable().default(null),
  common_confusions: z.array(commonConfusionItemSchema).default([]),
  key_takeaways: z.array(z.string()).default([]),
});

export type ConceptualClarity = z.infer<typeof conceptualClaritySchema>;

export const topicAnalysisResultSchema = z.object({
  topic: z.string().min(1),
  has_subtopics: z.boolean(),
  reason_for_structure: z.string().min(1),
  subtopics: z.array(topicSubtopicItemSchema).default([]),
  conceptual_clarity: conceptualClaritySchema,
}).refine((data) => {
  if (!data.has_subtopics) {
    return !data.subtopics || data.subtopics.length === 0;
  }
  return true;
}, {
  message: 'When has_subtopics is false, subtopics must be empty.',
  path: ['subtopics'],
});

export type TopicAnalysisResult = z.infer<typeof topicAnalysisResultSchema>;

// Focused Subtopic Conceptual Clarity Request
export const conceptualClarityRequestSchema = z.object({
  courseName: z.string().trim().default('Course'),
  topicTitle: z.string().trim().min(1),
  subtopicTitle: z.string().trim().optional(),
  unitTitle: z.string().optional(),
  concepts: z.array(z.string()).optional(),
  sourceExcerpt: z.string().optional(),
  syllabusExcerpt: z.string().optional(),
  academicLevel: z.string().default('Undergraduate'),
  existingClarity: z.number().optional().default(50),
});

export type ConceptualClarityRequest = z.infer<typeof conceptualClarityRequestSchema>;

// Request for generating an interactive question
export const generateQuestionRequestSchema = z.object({
  courseName: z.string().default('Course'),
  topicTitle: z.string().min(1),
  subtopicTitle: z.string().optional(),
  clarity: conceptualClaritySchema.optional(),
  academicLevel: z.string().default('Undergraduate'),
});

export type GenerateQuestionRequest = z.infer<typeof generateQuestionRequestSchema>;

// Didactic Interactive Learning Question
export const interactiveQuestionSchema = z.object({
  id: z.string().default(() => 'q_' + Math.random().toString(36).substring(2, 9)),
  question: z.string().min(1),
  questionType: z.enum([
    'conceptual',
    'recall',
    'differentiation',
    'application',
    'reasoning',
    'scenario',
    'sequencing',
    'prediction',
    'error_identification'
  ]).default('conceptual'),
  scenario: z.string().optional(),
  options: z.array(z.string()).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
  whyWrongMap: z.record(z.string(), z.string()).optional(),
  targetConcept: z.string().optional(),
});

export type InteractiveQuestion = z.infer<typeof interactiveQuestionSchema>;

// Answer Evaluation & Didactic Feedback Schema
export const answerEvaluationRequestSchema = z.object({
  courseName: z.string().optional(),
  topicTitle: z.string().optional().default('Topic'),
  subtopicTitle: z.string().optional(),
  question: z.union([
    interactiveQuestionSchema,
    z.object({
      id: z.string().optional(),
      question: z.string(),
      questionType: z.string().optional(),
      options: z.array(z.string()),
      correctIndex: z.number().int(),
      explanation: z.string().optional().default(''),
      whyWrongMap: z.record(z.string(), z.string()).optional(),
      targetConcept: z.string().optional(),
    }),
  ]),
  selectedIndex: z.number().int().optional(),
  userSelectedIndex: z.number().int().optional(),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
}).transform((data) => ({
  courseName: data.courseName,
  topicTitle: data.topicTitle || 'Topic',
  subtopicTitle: data.subtopicTitle,
  question: {
    id: data.question.id || 'q_1',
    question: data.question.question,
    questionType: ((data.question as any).questionType as any) || 'conceptual',
    options: data.question.options,
    correctIndex: data.question.correctIndex,
    explanation: data.question.explanation || '',
    whyWrongMap: data.question.whyWrongMap,
    targetConcept: data.question.targetConcept,
  },
  selectedIndex: data.selectedIndex ?? data.userSelectedIndex ?? 0,
  confidence: data.confidence,
}));

export type AnswerEvaluationRequest = z.infer<typeof answerEvaluationRequestSchema>;

export const answerEvaluationResultSchema = z.object({
  isCorrect: z.boolean(),
  didacticFeedback: z.string(),
  coreConceptReinforced: z.string(),
  clarityShift: z.number(),
  adaptiveRecommendation: z.object({
    action: z.enum(['advance', 'reinforce', 'investigate_misconception', 'simplify_and_reteach', 'prerequisite_gap']),
    reason: z.string(),
    nextStepLabel: z.string(),
  }),
});

export type AnswerEvaluationResult = z.infer<typeof answerEvaluationResultSchema>;

// ==========================================
// 3. Link & URL Sanitizer Utility
// ==========================================

export const sanitizeUrl = (rawUrl?: string | null): string => {
  if (!rawUrl || typeof rawUrl !== 'string') return '#';
  const trimmed = rawUrl.trim();
  // Strictly allow only http and https schemes to prevent javascript: or data: injection
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return '#';
  } catch {
    // Relative safe paths
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
    return '#';
  }
};

export function normalizeSyllabusFormatting(text: string): string {
  if (!text) return '';
  return text
    // Insert a newline before UNIT, MODULE, CHAPTER, PART, SECTION when glued to previous text without a newline
    .replace(/([^\r\n])\s*((?:UNIT|MODULE|CHAPTER|PART|SECTION)\s*[-:]?\s*[0-9A-Za-zIVXLCDM]+)/gi, '$1\n$2')
    .trim();
}
