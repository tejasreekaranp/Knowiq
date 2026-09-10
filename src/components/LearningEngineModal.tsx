import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  ChevronRight, 
  ArrowLeft, 
  BookOpen, 
  Lightbulb, 
  AlertCircle, 
  ExternalLink, 
  Volume2, 
  Copy, 
  Check, 
  Shuffle, 
  CheckCheck,
  RefreshCw,
  Trophy,
  Activity,
  Compass
} from 'lucide-react';
import { 
  Topic, 
  Subtopic, 
  ExplanationDepth, 
  ClarityDiagnostic 
} from '../types';
import { sanitizeUrl } from '../lib/schemas';
import { triggerConfetti } from '../utils/confetti';

interface LearningEngineModalProps {
  topic: Topic;
  subtopic: Subtopic;
  courseTitle: string;
  onClose: () => void;
  onCompleteSubtopic: (subtopicId: string, newClarity: number, xpEarned: number) => void;
  nextTopic?: Topic | null;
  nextSubtopic?: Subtopic | null;
  onNextSubtopic?: (nextTopic: Topic, nextSubtopic: Subtopic) => void;
}

export const LearningEngineModal: React.FC<LearningEngineModalProps> = ({
  topic,
  subtopic,
  courseTitle,
  onClose,
  onCompleteSubtopic,
  nextTopic,
  nextSubtopic,
  onNextSubtopic,
}) => {
  // Step state: 1: Conceptual, 2: Interactive, 3: Deep Revision, 4: Hard Quiz, 5: Clarity Result
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [depth, setDepth] = useState<ExplanationDepth>('standard');
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Content state (either from subtopic or fetched via AI)
  const [content, setContent] = useState<any>(subtopic.conceptual ? {
    conceptual: subtopic.conceptual,
    interactive: subtopic.interactive,
    deepRevision: subtopic.deepRevision,
    hardQuiz: subtopic.hardQuiz,
    externalResources: subtopic.externalResources
  } : null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Interactive exercise states
  // Exercise 1: Fill blank
  const [fillSelected, setFillSelected] = useState<string | null>(null);
  const [fillFeedback, setFillFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // Exercise 2: Matching
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({}); // termId -> defId
  const [matchingStatus, setMatchingStatus] = useState<Record<string, boolean>>({});

  // Exercise 3: Ordering
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderVerified, setOrderVerified] = useState(false);
  const [orderCorrect, setOrderCorrect] = useState(false);

  // Hard Quiz states
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Diagnostic state
  const [diagnostic, setDiagnostic] = useState<ClarityDiagnostic | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState<number | null>(null);
  const [followUpChecked, setFollowUpChecked] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Didactic "Check Your Understanding" state in Step 1
  const [checkAnswer, setCheckAnswer] = useState<number | null>(null);
  const [checkFeedback, setCheckFeedback] = useState<any | null>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);

  // Fetch or populate subtopic content
  useEffect(() => {
    setStep(1);
    setQuizAnswers({});
    setDiagnostic(null);
    setFollowUpAnswer(null);
    setFollowUpChecked(false);
    setFillSelected(null);
    setFillFeedback('idle');
    setMatches({});
    setMatchingStatus({});
    setOrderVerified(false);
    setOrderCorrect(false);
    setCheckAnswer(null);
    setCheckFeedback(null);
    setIsCheckingAnswer(false);

    if (topic.hasSubtopics === false && topic.conceptualClarity && !subtopic.conceptual) {
      const clarity = topic.conceptualClarity;
      const paragraphs = clarity.explanation.split('\n\n');
      const fallbackPacket = {
        conceptual: {
          quick: clarity.summary,
          standard: clarity.explanation,
          deep: `${clarity.explanation}\n\nConcrete Real-World Applications:\n${Array.isArray(clarity.examples) ? clarity.examples.map((e: any) => typeof e === 'string' ? e : `• ${e.title}: ${e.explanation}`).join('\n\n') : ''}`,
          expert: `${clarity.explanation}\n\nCommon Misconceptions & Edge Cases:\n${Array.isArray(clarity.common_confusions) ? clarity.common_confusions.map((c: any) => typeof c === 'string' ? c : `• ${c.confusion}: ${c.clarification}`).join('\n\n') : ''}`,
          whatIsIt: clarity.summary,
          whyExists: paragraphs[1] || clarity.summary,
          problemSolved: paragraphs[0] || clarity.summary,
          keyTakeaway: Array.isArray(clarity.key_takeaways) && clarity.key_takeaways[0] ? clarity.key_takeaways[0] : clarity.summary,
          analogy: clarity.analogy,
          examples: clarity.examples,
          common_confusions: clarity.common_confusions,
          key_concepts: clarity.key_concepts,
          key_takeaways: clarity.key_takeaways,
          summary: clarity.summary,
          explanation: clarity.explanation,
        },
        interactive: {
          fillBlank: {
            question: `Fill in the blank regarding ${topic.title}:`,
            preText: `${topic.title} operates to maintain`,
            missingWord: 'predictability',
            postText: 'and efficiency across system operations.',
            options: ['predictability', 'randomness', 'duplication', 'fragmentation'],
            hint: 'Core invariant in computational systems design',
            explanation: 'Ensuring predictable execution minimizes latency and resource contention.',
          },
          matching: [
            { id: 'm1', term: 'Core Purpose', definition: clarity.summary },
            { id: 'm2', term: 'Runtime Principle', definition: paragraphs[2] || clarity.summary },
            { id: 'm3', term: 'Primary Advantage', definition: clarity.examples[0] || 'High efficiency and safety' },
          ],
          ordering: {
            title: `Execution Stages for ${topic.title}`,
            instruction: 'Arrange the sequence in logical order from initiation to validation:',
            items: [
              { id: 'o1', text: '1. Request initiation and boundary validation', correctOrder: 1 },
              { id: 'o2', text: '2. Policy evaluation and resource coordination', correctOrder: 2 },
              { id: 'o3', text: '3. State transition execution and invariant preservation', correctOrder: 3 },
            ],
          },
        },
        deepRevision: {
          detailedNotes: [
            `Summary: ${clarity.summary}`,
            ...paragraphs,
            ...(clarity.analogy ? [`Analogy: ${clarity.analogy}`] : []),
          ],
          comparisonTable: {
            title: `${topic.title} Architectural Comparison`,
            headers: ['Dimension', `${topic.title} Mechanism`, 'Naive Alternative'],
            rows: [
              ['Primary Focus', 'Controlled, predictable execution', 'Ad-hoc uncoordinated access'],
              ['Overhead', 'Minimal metadata accounting', 'High contention and race conditions'],
              ['Safety / Correctness', 'Guaranteed state consistency', 'Prone to deadlocks / corruption'],
            ],
          },
          commonPitfalls: clarity.common_confusions,
          mentalModelOrMnemonic: clarity.analogy || `${topic.title}: Coordinated Boundaries First`,
        },
        hardQuiz: [
          {
            id: 'q1',
            question: `What is the primary motivation behind ${topic.title}?`,
            options: [
              'To eliminate all memory requirements',
              'To ensure predictable, coordinated resource utilization without high overhead',
              'To replace hardware control entirely with user-level routines',
              'To bypass system protection boundaries',
            ],
            correctIndex: 1,
            category: 'conceptual',
            explanation: `${topic.title} is designed to balance throughput, latency, and safety without unreasonable overhead.`,
          },
          {
            id: 'q2',
            question: `Which of the following describes a common misconception regarding ${topic.title}?`,
            options: [
              clarity.common_confusions[0] || 'Assuming it has zero performance overhead',
              'Recognizing that it requires explicit coordination',
              'Understanding that state transitions must be guarded',
              'Applying systematic policies during resource contention',
            ],
            correctIndex: 0,
            category: 'differentiation',
            explanation: 'Awareness of runtime trade-offs prevents flawed assumptions during systems engineering.',
          },
          {
            id: 'q3',
            question: `In a production environment, when should ${topic.title} parameters be inspected?`,
            options: [
              'Only during compiler optimization passes',
              'When investigating resource stalls, latency spikes, or contention regressions',
              'Never, because runtime behavior cannot be observed',
              'Exclusively when rebooting the host machine',
            ],
            correctIndex: 1,
            category: 'application',
            explanation: 'Metrics related to this concept provide immediate diagnostic signal for performance anomalies.',
          },
        ],
        externalResources: [],
      };
      setContent(fallbackPacket);
      initializeInteractiveState(fallbackPacket.interactive);
      return;
    }

    if (!subtopic.conceptual) {
      setContent(null);
      fetchSubtopicContent();
    } else {
      setContent({
        conceptual: subtopic.conceptual,
        interactive: subtopic.interactive,
        deepRevision: subtopic.deepRevision,
        hardQuiz: subtopic.hardQuiz,
        externalResources: subtopic.externalResources
      });
      initializeInteractiveState(subtopic.interactive);
    }
  }, [subtopic.id]);

  const fetchSubtopicContent = async () => {
    setIsLoadingContent(true);
    setContentError(null);
    try {
      const res = await fetch('/api/ai/subtopic-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: courseTitle,
          topicTitle: topic.title,
          subtopicTitle: subtopic.title,
          existingClarity: subtopic.clarityScore || 50,
          sourceReference: subtopic.sourceReference,
          sourceExcerpt: subtopic.sourceExcerpt,
          concepts: subtopic.concepts,
          prerequisites: subtopic.prerequisites,
        }),
      });
      if (!res.ok) {
        console.error(`[LearningEngineModal] /api/ai/subtopic-content failed with status ${res.status}`);
        if (res.status === 404) {
          throw new Error('Learning service is temporarily unavailable. Please verify connection and retry.');
        } else if (res.status === 429) {
          throw new Error('AI generation capacity is temporarily high. Please wait a few seconds and retry.');
        } else if (res.status >= 500) {
          throw new Error('The learning service encountered a temporary issue while synthesizing content. Click below to retry.');
        } else {
          throw new Error('Learning service is unavailable. Please try again.');
        }
      }
      const data = await res.json();
      if (data && data.conceptual) {
        setContent(data);
        initializeInteractiveState(data.interactive);
      } else {
        throw new Error('Incomplete content response received from learning service.');
      }
    } catch (err: any) {
      setContentError(err?.message || 'Learning service is unavailable. Please try again.');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const initializeInteractiveState = (interactive: any) => {
    if (interactive?.ordering?.items) {
      // Shuffle initial order for student exercise
      const shuffled = [...interactive.ordering.items].sort(() => Math.random() - 0.5);
      setOrderItems(shuffled);
    }
  };

  // Text-to-speech helper
  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Move ordering item
  const moveOrderItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderItems.length) return;
    const newItems = [...orderItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setOrderItems(newItems);
    setOrderVerified(false);
  };

  const verifyOrder = () => {
    const isCorrect = orderItems.every((item, idx) => item.correctOrder === idx + 1);
    setOrderVerified(true);
    setOrderCorrect(isCorrect);
  };

  // Matching handler
  const handleSelectTerm = (id: string) => {
    setSelectedTerm(id);
  };

  const handleSelectDefinition = (termId: string) => {
    if (!selectedTerm) return;
    const isMatch = selectedTerm === termId;
    setMatches((prev) => ({ ...prev, [selectedTerm]: termId }));
    setMatchingStatus((prev) => ({ ...prev, [selectedTerm]: isMatch }));
    setSelectedTerm(null);
  };

  // Check Your Understanding handler in Step 1
  const handleCheckUnderstanding = async (selectedIdx: number, q: any) => {
    setCheckAnswer(selectedIdx);
    setIsCheckingAnswer(true);
    try {
      const res = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: courseTitle,
          topicTitle: topic.title,
          subtopicTitle: subtopic.title,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          userSelectedIndex: selectedIdx,
          confidence: 'high',
          whyWrongMap: q.whyWrongMap,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCheckFeedback(data);
      } else {
        throw new Error('Eval request failed');
      }
    } catch {
      const isCorrect = selectedIdx === q.correctIndex;
      const whyWrong = q.whyWrongMap?.[selectedIdx];
      setCheckFeedback({
        isCorrect,
        feedback: isCorrect
          ? (q.explanation || 'Excellent reasoning! You correctly identified the core operational mechanism.')
          : (whyWrong || q.explanation || 'Not quite. Notice how the operational invariant must be maintained.'),
        reinforcement: isCorrect
          ? 'Key principle confirmed: You demonstrated solid understanding of this foundational mechanism.'
          : 'Conceptual clarification: Focus on the distinction between the mechanism and adjacent concepts.',
        adaptiveRecommendation: isCorrect ? 'Ready to advance to Interactive Exercises' : 'Review the explanation and try again',
        suggestedNextDifficulty: isCorrect ? 'Hard' : 'Medium',
      });
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  // Quiz submission & diagnostic
  const handleQuizSubmit = async () => {
    if (!content?.hardQuiz) return;
    setIsSubmittingQuiz(true);
    try {
      const res = await fetch('/api/ai/diagnose-clarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtopicTitle: subtopic.title,
          topicTitle: topic.title,
          concepts: subtopic.concepts,
          questions: content.hardQuiz,
          userAnswers: quizAnswers,
        }),
      });
      if (!res.ok) {
        console.error(`[LearningEngineModal] /api/ai/diagnose-clarity failed with status ${res.status}`);
        throw new Error(`Diagnostic failed with status ${res.status}`);
      }
      const data: ClarityDiagnostic = await res.json();
      setDiagnostic(data);
      setStep(5);
      triggerConfetti();
      onCompleteSubtopic(subtopic.id, data.overallClarity, 85);
    } catch {
      // Client-side fallback diagnosis so student is never blocked
      let correct = 0;
      content.hardQuiz.forEach((q, idx) => {
        if (quizAnswers[q.id] === q.correctIndex || quizAnswers[idx] === q.correctIndex) {
          correct++;
        }
      });
      const pct = Math.round((correct / (content.hardQuiz.length || 5)) * 100);
      const fallbackDiag: ClarityDiagnostic = {
        overallClarity: pct,
        conceptualScore: pct >= 80 ? 90 : 65,
        recallScore: pct >= 80 ? 85 : 60,
        applicationScore: pct >= 80 ? 80 : 50,
        differentiationScore: pct >= 80 ? 75 : 45,
        detectedIssue: `Completed clarity assessment for ${subtopic.title} with ${correct}/${content.hardQuiz.length} correct.`,
        nextAction: pct >= 80 ? 'Promote to Spaced Revision queue.' : 'Review comparison points and interactive exercises.',
        remediationContent: {
          comparisonExplanation: `Focus on the core invariants of ${subtopic.title} to resolve edge-case ambiguity.`,
          followUpQuestion: {
            question: `What is the key principle governing ${subtopic.title}?`,
            options: ['Invariant and dependency preservation', 'Arbitrary state randomization', 'Unbounded duplication', 'Bypassing constraints'],
            correctIndex: 0,
            explanation: 'Preserving invariants ensures consistent state transitions.'
          }
        }
      };
      setDiagnostic(fallbackDiag);
      setStep(5);
      triggerConfetti();
      onCompleteSubtopic(subtopic.id, pct, 80);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const conceptual = content?.conceptual;
  const interactive = content?.interactive;
  const deepRevision = content?.deepRevision;
  const hardQuiz = content?.hardQuiz;
  const externalResources = content?.externalResources;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {step < 5 ? step : <CheckCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                <span>{topic.title}</span>
                <span>•</span>
                <span className="text-indigo-600 font-semibold">{courseTitle}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                {subtopic.title}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {subtopic.sourceReference && (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-md">
                    Grounded: {subtopic.sourceReference}
                  </span>
                )}
                {subtopic.concepts && subtopic.concepts.length > 0 && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    Concepts: {subtopic.concepts.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {subtopic.clarityScore !== undefined && (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>Clarity: {diagnostic ? diagnostic.overallClarity : subtopic.clarityScore}%</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progression Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-max text-xs">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center space-x-1.5 font-medium px-2.5 py-1 rounded-lg transition-colors ${
                step === 1 ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>1. Conceptual Clarity</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            
            <button
              onClick={() => setStep(2)}
              className={`flex items-center space-x-1.5 font-medium px-2.5 py-1 rounded-lg transition-colors ${
                step === 2 ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>2. Interactive Exercises</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <button
              onClick={() => setStep(3)}
              className={`flex items-center space-x-1.5 font-medium px-2.5 py-1 rounded-lg transition-colors ${
                step === 3 ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>3. Deep Revision</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <button
              onClick={() => setStep(4)}
              className={`flex items-center space-x-1.5 font-medium px-2.5 py-1 rounded-lg transition-colors ${
                step === 4 ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">4</span>
              <span>4. Hard Quiz (5 Qs)</span>
            </button>

            {diagnostic && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <button
                  onClick={() => setStep(5)}
                  className={`flex items-center space-x-1.5 font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    step === 5 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Clarity Diagnostics</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoadingContent ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Synthesizing Adaptive Learning Packet...</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Deconstructing {subtopic.title} into progressive flashcard concepts, interactive drills, and diagnostic questions.
              </p>
            </div>
          ) : !content || !content.conceptual ? (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Learning Content Unavailable</h3>
              <p className="text-xs text-slate-500">
                {contentError || 'The learning packet could not be retrieved. Click below to retry immediately.'}
              </p>
              <button
                onClick={fetchSubtopicContent}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Generation</span>
              </button>
            </div>
          ) : (
            <>
              {/* ================= STEP 1: CONCEPTUAL CLARITY ================= */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Depth Controller */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-slate-700">Explanation Depth:</span>
                    </div>

                    <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                      {(['quick', 'standard'] as ExplanationDepth[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setDepth(level)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                            depth === level
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Flashcard Main Box */}
                  <div className="bg-gradient-to-b from-white to-indigo-50/20 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          Flashcard Insight • {depth.toUpperCase()}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
                          {subtopic.title}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleSpeak(conceptual?.[depth] || '')}
                          className={`p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors ${
                            speaking ? 'bg-indigo-50 text-indigo-600 border-indigo-200 animate-pulse' : ''
                          }`}
                          title="Listen to explanation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(conceptual?.[depth] || '')}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                          title="Copy explanation"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Active Depth Paragraph */}
                    <div className="text-slate-700 text-sm sm:text-base leading-relaxed bg-white/80 p-4 rounded-xl border border-slate-100 shadow-2xs">
                      {conceptual?.[depth]}
                    </div>

                    {/* Essential Core Questions Answered */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide flex items-center space-x-1">
                          <HelpCircle className="w-3 h-3" />
                          <span>What is it?</span>
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {conceptual?.whatIsIt}
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                        <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wide flex items-center space-x-1">
                          <Compass className="w-3 h-3" />
                          <span>Why does it exist?</span>
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {conceptual?.whyExists}
                        </p>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Problem it solves</span>
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {conceptual?.problemSolved}
                        </p>
                      </div>
                    </div>

                    {/* Key Takeaway Banner */}
                    {conceptual?.keyTakeaway && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-center space-x-3 text-xs text-amber-900">
                        <Trophy className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold">Core Memory Anchor: </span>
                          <span>{conceptual.keyTakeaway}</span>
                        </div>
                      </div>
                    )}

                    {/* Intuitive Analogy if available */}
                    {conceptual?.analogy && (
                      <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-purple-950">
                        <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-purple-900 block mb-0.5">Intuitive Analogy:</span>
                          <span className="leading-relaxed">{conceptual.analogy}</span>
                        </div>
                      </div>
                    )}
                                    {/* Key Concepts and Terminology */}
                    {conceptual?.key_concepts && conceptual.key_concepts.length > 0 && (
                      <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          <span>Core Terminology & Concept Definitions</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {conceptual.key_concepts.map((kc: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs space-y-1">
                              <span className="text-xs font-bold text-indigo-700 block">{kc.term}</span>
                              <p className="text-xs text-slate-600 leading-relaxed">{kc.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Worked Examples and Practical Demonstrations */}
                    {conceptual?.examples && conceptual.examples.length > 0 && (
                      <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 uppercase tracking-wide">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span>Concrete Examples & Practical Walkthroughs</span>
                        </div>
                        <div className="space-y-2.5">
                          {conceptual.examples.map((ex: any, idx: number) => {
                            const isObj = typeof ex === 'object' && ex !== null;
                            const title = isObj ? ex.title : `Example ${idx + 1}`;
                            const explanation = isObj ? ex.explanation : String(ex);
                            return (
                              <div key={idx} className="bg-white p-3.5 rounded-lg border border-indigo-100/80 shadow-2xs space-y-1">
                                <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">{idx + 1}</span>
                                  <span>{title}</span>
                                </span>
                                <p className="text-xs text-slate-700 leading-relaxed pl-5 font-mono whitespace-pre-line bg-slate-50 p-2 rounded-md border border-slate-100">{explanation}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Common Misconceptions to avoid */}
                    {conceptual?.common_confusions && conceptual.common_confusions.length > 0 && (
                      <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-4 space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-bold text-rose-900 uppercase tracking-wide">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Common Misconceptions & Distinctions Clarified</span>
                        </div>
                        <div className="space-y-2.5">
                          {conceptual.common_confusions.map((c: any, idx: number) => {
                            const isObj = typeof c === 'object' && c !== null;
                            const confusion = isObj ? c.confusion : String(c);
                            const clarification = isObj ? c.clarification : null;
                            return (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-rose-100/90 shadow-2xs space-y-1.5 text-xs">
                                <div className="flex items-start space-x-2 text-rose-800">
                                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] shrink-0 uppercase">Misconception</span>
                                  <span className="font-semibold">{confusion}</span>
                                </div>
                                {clarification && (
                                  <div className="flex items-start space-x-2 text-emerald-800 pl-2 border-l-2 border-emerald-400">
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px] shrink-0 uppercase">Clarification</span>
                                    <span className="text-slate-700 leading-relaxed">{clarification}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Key Takeaways for Retention */}
                    {conceptual?.key_takeaways && conceptual.key_takeaways.length > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900 uppercase tracking-wide">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Key Takeaways for Retention</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 pl-1">
                          {conceptual.key_takeaways.map((takeaway: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span className="leading-relaxed">{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Check Your Understanding - Didactic Interactive Question */}
                  {content?.hardQuiz && content.hardQuiz.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Check Your Understanding</span>
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">Quick Check</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                        {content.hardQuiz[0].question}
                      </p>
                      <div className="space-y-2">
                        {content.hardQuiz[0].options.map((opt: string, optIdx: number) => {
                          const isSelected = checkAnswer === optIdx;
                          const isSubmitted = checkFeedback !== null;
                          const isCorrect = optIdx === content.hardQuiz[0].correctIndex;
                          let btnStyle = 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700';
                          if (isSubmitted) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                            } else if (isSelected) {
                              btnStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                            } else {
                              btnStyle = 'bg-white/60 border-slate-200 text-slate-400 opacity-60';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold';
                          }
                          return (
                            <button
                              key={optIdx}
                              onClick={() => !checkFeedback && handleCheckUnderstanding(optIdx, content.hardQuiz[0])}
                              disabled={isCheckingAnswer || isSubmitted}
                              className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-start space-x-2.5 ${btnStyle} cursor-pointer`}
                            >
                              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 leading-relaxed">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {isCheckingAnswer && (
                        <div className="flex items-center space-x-2 text-xs text-indigo-600 font-medium py-1">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluating understanding...</span>
                        </div>
                      )}

                      {checkFeedback && (
                        <div className={`p-3.5 rounded-lg border text-xs space-y-2 animate-in fade-in duration-150 ${
                          checkFeedback.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}>
                          <div className="flex items-center space-x-1.5 font-bold">
                            {checkFeedback.isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="text-emerald-800">Correct!</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span className="text-rose-800">Didactic Clarification</span>
                              </>
                            )}
                          </div>
                          <p className="leading-relaxed text-slate-700">{checkFeedback.feedback}</p>
                          {checkFeedback.reinforcement && (
                            <div className="text-[11px] font-semibold text-indigo-800 bg-indigo-50/70 p-2 rounded border border-indigo-100">
                              💡 {checkFeedback.reinforcement}
                            </div>
                          )}
                          {checkFeedback.adaptiveRecommendation && (
                            <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                              <span>Next Adaptive Action:</span>
                              <span className="font-semibold text-slate-700">{checkFeedback.adaptiveRecommendation}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation next */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-sm shadow-indigo-200 transition-all hover:translate-x-0.5"
                    >
                      <span>Proceed to Interactive Exercises</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: INTERACTIVE LEARNING ================= */}
              {step === 2 && interactive && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Engage with concepts directly: fill in blanks, match definitions, and arrange logical sequences.</span>
                  </div>

                  {/* 1. Fill in the Blanks */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Exercise 1: Fill the Missing Concept</span>
                      <span className="text-[11px] text-slate-400">Step 1 of 3</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-medium">{interactive.fillBlank.question}</p>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base leading-relaxed text-slate-800">
                      <span>{interactive.fillBlank.preText} </span>
                      <span className={`inline-block px-3 py-1 font-bold rounded-lg border transition-all ${
                        fillFeedback === 'correct' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : fillFeedback === 'incorrect'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : fillSelected
                          ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                          : 'bg-white text-slate-400 border-dashed border-slate-300'
                      }`}>
                        {fillSelected || '[ Select Missing Term ]'}
                      </span>
                      <span> {interactive.fillBlank.postText}</span>
                    </div>

                    {/* Options */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {interactive.fillBlank.options.map((option: string) => (
                        <button
                          key={option}
                          onClick={() => {
                            setFillSelected(option);
                            const isCorr = option.toLowerCase() === interactive.fillBlank.missingWord.toLowerCase();
                            setFillFeedback(isCorr ? 'correct' : 'incorrect');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            fillSelected === option
                              ? fillFeedback === 'correct'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {fillFeedback !== 'idle' && (
                      <div className={`p-3 rounded-xl text-xs ${
                        fillFeedback === 'correct' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <div className="font-bold">{fillFeedback === 'correct' ? '✓ Correct Understanding!' : '✕ Not quite right:'}</div>
                        <div>{interactive.fillBlank.explanation}</div>
                      </div>
                    )}
                  </div>

                  {/* 2. Matching Exercise */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Exercise 2: Concept Matching</span>
                      <span className="text-[11px] text-slate-400">Step 2 of 3</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Click a term on the left, then click its corresponding definition on the right.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Terms */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Terms</span>
                        {interactive.matching.map((item: any) => {
                          const isMatched = matches[item.id] !== undefined;
                          const isSuccess = matchingStatus[item.id] === true;
                          const isSelected = selectedTerm === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectTerm(item.id)}
                              className={`w-full text-left p-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : isMatched
                                  ? isSuccess
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                    : 'bg-rose-50 text-rose-900 border-rose-200'
                                  : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-200'
                              }`}
                            >
                              <span>{item.term}</span>
                              {isMatched && (
                                <span className="text-[10px] font-bold">
                                  {isSuccess ? '✓ Matched' : '✕ Retry'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right: Definitions */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Definitions</span>
                        {interactive.matching.map((item: any) => {
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectDefinition(item.id)}
                              className="w-full text-left p-3 rounded-xl text-xs text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                              {item.definition}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3. Ordering Exercise */}
                  {orderItems.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Exercise 3: Logical Ordering</span>
                        <span className="text-[11px] text-slate-400">Step 3 of 3</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{interactive.ordering.instruction}</p>

                      <div className="space-y-2">
                        {orderItems.map((item: any, idx: number) => (
                          <div 
                            key={item.id} 
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                              orderVerified
                                ? orderCorrect
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-medium'
                                  : 'bg-amber-50 border-amber-200 text-amber-950 font-medium'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                {idx + 1}
                              </span>
                              <span>{item.text}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => moveOrderItem(idx, 'up')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-[10px] font-bold"
                              >
                                ↑ Up
                              </button>
                              <button
                                disabled={idx === orderItems.length - 1}
                                onClick={() => moveOrderItem(idx, 'down')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-[10px] font-bold"
                              >
                                ↓ Down
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={verifyOrder}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                        >
                          Verify Sequence
                        </button>
                        {orderVerified && (
                          <span className={`text-xs font-bold ${orderCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {orderCorrect ? '✓ Sequence is 100% accurate!' : 'Sequence needs adjustments. Check prerequisites.'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Conceptual</span>
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-sm shadow-indigo-200"
                    >
                      <span>Proceed to Deep Revision</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: DEEP REVISION ================= */}
              {step === 3 && deepRevision && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold font-display">Deep Architectural Notes & Mechanics</h3>
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed list-disc list-inside">
                      {deepRevision.detailedNotes.map((note: string, idx: number) => (
                        <li key={idx} className="pl-1"><span className="text-white">{note}</span></li>
                      ))}
                    </ul>
                  </div>

                  {/* Comparison Table */}
                  {deepRevision.comparisonTable && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs sm:text-sm text-slate-900">
                        {deepRevision.comparisonTable.title}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/70 text-slate-600 uppercase tracking-wider font-semibold">
                            <tr>
                              {deepRevision.comparisonTable.headers.map((h: string, idx: number) => (
                                <th key={idx} className="px-4 py-2.5">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {deepRevision.comparisonTable.rows.map((row: string[], rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-slate-50/80">
                                {row.map((cell: string, cIdx: number) => (
                                  <td key={cIdx} className={`px-4 py-3 ${cIdx === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Common Pitfalls & Mnemonic */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Common Pitfalls & Traps</span>
                      </span>
                      <ul className="text-xs text-rose-950 space-y-1.5 list-disc list-inside">
                        {deepRevision.commonPitfalls.map((pitfall: string, pIdx: number) => (
                          <li key={pIdx}>{pitfall}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
                        <Brain className="w-4 h-4 text-emerald-600" />
                        <span>Mental Model / Mnemonic</span>
                      </span>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        {deepRevision.mentalModelOrMnemonic}
                      </p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Exercises</span>
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-sm shadow-indigo-200"
                    >
                      <span>Take Hard Quiz (5 Questions)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: HARD QUIZ ================= */}
              {step === 4 && hardQuiz && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-amber-600" />
                      <span><strong>5 Rigorous Questions:</strong> The Clarity Engine evaluates your exact understanding across Recall, Concept, Application, and Differentiation.</span>
                    </div>
                    <span className="font-bold text-amber-800">{Object.keys(quizAnswers).length} / 5 Answered</span>
                  </div>

                  <div className="space-y-5">
                    {hardQuiz.map((q: any, idx: number) => {
                      const selectedOpt = quizAnswers[q.id];
                      return (
                        <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Question {idx + 1} of 5
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {q.category}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                            {q.question}
                          </p>

                          <div className="space-y-2 pt-1">
                            {q.options.map((opt: string, optIdx: number) => (
                              <button
                                key={optIdx}
                                onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all flex items-start space-x-3 ${
                                  selectedOpt === optIdx
                                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-semibold shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                  selectedOpt === optIdx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Notes</span>
                    </button>

                    <button
                      disabled={Object.keys(quizAnswers).length < 5 || isSubmittingQuiz}
                      onClick={handleQuizSubmit}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-indigo-200 transition-all"
                    >
                      {isSubmittingQuiz ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Analyzing Clarity Engine...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Submit & Analyze Clarity</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 5: CLARITY ENGINE DIAGNOSTIC ================= */}
              {step === 5 && diagnostic && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Top Score Banner */}
                  <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                          Clarity Engine Diagnostic
                        </span>
                        <h3 className="text-xl sm:text-2xl font-bold font-display mt-1">
                          Subtopic Assessment Complete ✓
                        </h3>
                        <p className="text-xs text-slate-300">
                          Clarity score updated for <strong>{subtopic.title}</strong>
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 self-start sm:self-auto">
                        <Activity className="w-6 h-6 text-emerald-400" />
                        <div>
                          <div className="text-2xl font-bold text-emerald-400 leading-none">
                            {diagnostic.overallClarity}%
                          </div>
                          <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                            Clarity Achieved
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4 Dimension Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-[10px] uppercase text-slate-400 font-semibold">Conceptual</span>
                        <div className="text-lg font-bold text-white mt-0.5">{diagnostic.conceptualScore}%</div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${diagnostic.conceptualScore}%` }} />
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-[10px] uppercase text-slate-400 font-semibold">Recall</span>
                        <div className="text-lg font-bold text-white mt-0.5">{diagnostic.recallScore}%</div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${diagnostic.recallScore}%` }} />
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-[10px] uppercase text-slate-400 font-semibold">Application</span>
                        <div className="text-lg font-bold text-white mt-0.5">{diagnostic.applicationScore}%</div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${diagnostic.applicationScore}%` }} />
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-[10px] uppercase text-slate-400 font-semibold">Differentiation</span>
                        <div className="text-lg font-bold text-white mt-0.5">{diagnostic.differentiationScore}%</div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${diagnostic.differentiationScore}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* The AI "WHY" Diagnostic - Exactly as specified by user */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wide">
                      <Brain className="w-4 h-4" />
                      <span>Cognitive Diagnostic Diagnosis</span>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-950 space-y-1">
                      <div className="font-bold text-amber-900">Detected Understanding Pattern:</div>
                      <p className="leading-relaxed">{diagnostic.detectedIssue}</p>
                    </div>

                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 text-xs sm:text-sm text-indigo-950 space-y-1">
                      <div className="font-bold text-indigo-900">Prescribed Adaptive Action:</div>
                      <p className="leading-relaxed">{diagnostic.nextAction}</p>
                    </div>
                  </div>

                  {/* Remediation Drill Box */}
                  {diagnostic.remediationContent && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                      <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Adaptive Remediation & Check</span>
                      </div>

                      <p className="text-xs text-slate-700 bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                        {diagnostic.remediationContent.comparisonExplanation}
                      </p>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="text-xs font-bold text-slate-800">
                          Follow-up Clarity Check: {diagnostic.remediationContent.followUpQuestion.question}
                        </div>

                        <div className="space-y-1.5">
                          {diagnostic.remediationContent.followUpQuestion.options.map((opt: string, optIdx: number) => (
                            <button
                              key={optIdx}
                              onClick={() => {
                                setFollowUpAnswer(optIdx);
                                setFollowUpChecked(true);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg text-xs border transition-all ${
                                followUpChecked
                                  ? optIdx === diagnostic.remediationContent.followUpQuestion.correctIndex
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                    : followUpAnswer === optIdx
                                    ? 'bg-rose-50 text-rose-900 border-rose-300'
                                    : 'bg-white text-slate-600 border-slate-200 opacity-60'
                                  : followUpAnswer === optIdx
                                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span>{opt}</span>
                            </button>
                          ))}
                        </div>

                        {followUpChecked && (
                          <div className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                            ✓ {diagnostic.remediationContent.followUpQuestion.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* External Resources Recommended based on student gap */}
                  {externalResources && externalResources.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                          <ExternalLink className="w-4 h-4 text-indigo-600" />
                          <span>Curated Resources for Your Gaps</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Targeted reinforcement</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {externalResources.map((res: any, rIdx: number) => (
                          <a
                            key={rIdx}
                            href={sanitizeUrl(res.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex flex-col justify-between group"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                {res.type} • {res.source}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 line-clamp-2">
                                {res.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2">
                                {res.description}
                              </p>
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-indigo-600 flex items-center space-x-1">
                              <span>Open Resource</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Review Conceptual Flashcard</span>
                    </button>

                    {nextSubtopic && nextTopic && onNextSubtopic ? (
                      <button
                        onClick={() => onNextSubtopic(nextTopic, nextSubtopic)}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-indigo-200 cursor-pointer transition-transform hover:scale-[1.02]"
                      >
                        <span>Next Lesson: {nextSubtopic.title}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-emerald-200 cursor-pointer"
                      >
                        <span>Continue Learning Path</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
