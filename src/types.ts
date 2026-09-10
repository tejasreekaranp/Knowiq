export type ExplanationDepth = 'quick' | 'standard' | 'deep' | 'expert';

export interface ConceptualExplanation {
  quick: string;
  standard: string;
  deep: string;
  expert: string;
  whatIsIt: string;
  whyExists: string;
  problemSolved: string;
  keyTakeaway: string;
}

export interface InteractiveExercises {
  fillBlank: {
    question: string;
    preText: string;
    missingWord: string;
    postText: string;
    options: string[];
    hint: string;
    explanation: string;
  };
  matching: {
    id: string;
    term: string;
    definition: string;
  }[];
  ordering: {
    title: string;
    instruction: string;
    items: { id: string; text: string; correctOrder: number }[];
  };
}

export interface DeepRevisionNotes {
  detailedNotes: string[];
  comparisonTable?: {
    title: string;
    headers: string[];
    rows: string[][];
  };
  commonPitfalls: string[];
  mentalModelOrMnemonic: string;
}

export interface HardQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: 'conceptual' | 'recall' | 'application' | 'differentiation';
  explanation: string;
  whyWrongMap?: { [key: number]: string };
}

export interface ExternalResource {
  type: 'video' | 'article' | 'reference';
  title: string;
  source: string;
  description: string;
  url: string;
  tag: string;
}

export interface ClarityDiagnostic {
  overallClarity: number;
  conceptualScore: number;
  recallScore: number;
  applicationScore: number;
  differentiationScore: number;
  detectedIssue: string;
  nextAction: string;
  remediationContent: {
    comparisonExplanation: string;
    followUpQuestion: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
  };
}

export interface Subtopic {
  id: string;
  title: string;
  order: number;
  isCompleted: boolean;
  isLocked: boolean;
  clarityScore?: number;
  lastRevisedDate?: string;
  estimatedRetention?: number; // 0 - 100%
  daysUntilRevision?: number;
  sourceReference?: string;
  sourceExcerpt?: string;
  concepts?: string[];
  prerequisites?: string[];
  derived?: boolean;
  derivedFrom?: string[];
  conceptual?: ConceptualExplanation;
  interactive?: InteractiveExercises;
  deepRevision?: DeepRevisionNotes;
  hardQuiz?: HardQuizQuestion[];
  externalResources?: ExternalResource[];
}

export interface ConceptualKeyConcept {
  term: string;
  explanation: string;
}

export interface ConceptualExample {
  title: string;
  explanation: string;
}

export interface ConceptualConfusion {
  confusion: string;
  clarification: string;
}

export interface TopicConceptualClarity {
  summary: string;
  explanation: string;
  key_concepts?: ConceptualKeyConcept[];
  examples: Array<ConceptualExample | string>;
  analogy: string | null;
  common_confusions: Array<ConceptualConfusion | string>;
  key_takeaways?: string[];
}

export type QuestionType =
  | 'conceptual'
  | 'recall'
  | 'differentiation'
  | 'application'
  | 'reasoning'
  | 'scenario'
  | 'sequencing'
  | 'prediction'
  | 'error_identification';

export interface DidacticQuestion {
  id: string;
  question: string;
  questionType?: QuestionType;
  scenario?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  whyWrongMap?: Record<number | string, string>;
  targetConcept?: string;
}

export type AdaptiveAction =
  | 'advance'
  | 'reinforce'
  | 'investigate_misconception'
  | 'simplify_and_reteach'
  | 'prerequisite_gap';

export interface AdaptiveRecommendation {
  action: AdaptiveAction;
  reason: string;
  nextStepLabel: string;
}

export interface AnswerEvaluationResult {
  isCorrect: boolean;
  didacticFeedback: string;
  coreConceptReinforced: string;
  clarityShift: number;
  adaptiveRecommendation: AdaptiveRecommendation;
}

export interface Topic {
  id: string;
  title: string;
  order: number;
  isCompleted: boolean;
  isLocked: boolean;
  unitTitle?: string;
  sourceReference?: string;
  sourceExcerpt?: string;
  hasSubtopics?: boolean;
  reasonForStructure?: string;
  conceptualClarity?: TopicConceptualClarity;
  subtopics: Subtopic[];
}

export interface CourseSourceAnalysis {
  sourceSummary: string;
  isGenericStarter: boolean;
  unitsCount: number;
  topicsCount: number;
  subtopicsCount: number;
  conceptsCount: number;
  units: {
    title: string;
    sourceReference: string;
    topics: {
      title: string;
      sourceReference: string;
      subtopics: {
        title: string;
        sourceReference: string;
        concepts: string[];
        prerequisites?: string[];
      }[];
    }[];
  }[];
}

export type CourseStatus = 'draft' | 'analyzing' | 'ready' | 'error';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role?: 'student' | 'faculty';
  created_at: string;
  updated_at: string;
}

export interface DBCourse {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  academic_level?: string | null;
  syllabus?: string | null;
  status: CourseStatus;
  duration_days: number;
  created_at: string;
  updated_at: string;
}

export interface DBTopic {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  order_index: number;
  is_completed: boolean;
  is_locked: boolean;
  description?: string | null;
  has_subtopics?: boolean;
  reason_for_structure?: string;
  conceptual_clarity?: any;
  created_at: string;
}

export interface DBSubtopic {
  id: string;
  topic_id: string;
  user_id: string;
  title: string;
  order_index: number;
  is_completed: boolean;
  is_locked: boolean;
  clarity_score?: number;
  estimated_retention?: number;
  days_until_revision?: number;
  conceptual_data?: any;
  interactive_data?: any;
  deep_revision_data?: any;
  hard_quiz_data?: any;
  created_at: string;
}

export interface Course {
  id: string;
  userId?: string;
  title: string;
  code: string;
  durationDays: number;
  description: string;
  subject?: string;
  academicLevel?: string;
  syllabus?: string;
  status?: CourseStatus;
  studyMaterialsCount: number;
  materialsNote?: string;
  createdAt: string;
  updatedAt?: string;
  topics: Topic[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface StudentState {
  xp: number;
  streakDays: number;
  streakHistory: { day: string; date: string; completed: boolean }[];
  todayProgress: {
    completed: number;
    target: number;
  };
  badges: Badge[];
}

export interface SmartNotification {
  id: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  title: string;
  message: string;
  actionText: string;
  topicId?: string;
  subtopicId?: string;
  isRead: boolean;
  timestamp: string;
}

export interface FacultyStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  progressPercent: number;
  averageClarity: number;
  streak: number;
  lastActive: string;
  weakTopic: string;
}

export interface FacultyClass {
  id: string;
  name: string;
  code: string;
  semester: string;
  studentCount: number;
  averageClarity: number;
  overallProgress: number;
  students: FacultyStudent[];
  weakTopics: {
    topic: string;
    clarity: number;
    issue: string;
    affectedStudentsCount: number;
  }[];
  topicProgress: {
    topic: string;
    completedPercent: number;
    averageClarity: number;
  }[];
}
