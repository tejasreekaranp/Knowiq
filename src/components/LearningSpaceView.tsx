import React, { useState } from 'react';
import { 
  Search, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  RefreshCw, 
  HelpCircle, 
  ArrowRight,
  Code,
  FileText,
  Check,
  X
} from 'lucide-react';
import { Course, Topic, Subtopic } from '../types';
import { triggerConfetti } from '../utils/confetti';

interface LearningSpaceViewProps {
  course: Course | null;
  onOpenSubtopic: (topic: Topic, subtopic: Subtopic) => void;
  onOpenCreateCourse?: () => void;
}

export const LearningSpaceView: React.FC<LearningSpaceViewProps> = ({
  course,
  onOpenSubtopic,
  onOpenCreateCourse,
}) => {
  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-display">No Course Selected</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Create a course or select one from your dashboard to practice custom revision sessions.
        </p>
        {onOpenCreateCourse && (
          <button
            onClick={onOpenCreateCourse}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Create a Course
          </button>
        )}
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() =>
    (course.topics || []).slice(0, 2).map((t) => t.id)
  );
  const [revisionType, setRevisionType] = useState<'Objective' | 'Descriptive' | 'Coding' | 'Mixed'>('Mixed');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active revision session state
  const [isGenerating, setIsGenerating] = useState(false);
  const [revisionSession, setRevisionSession] = useState<{
    title: string;
    questions: any[];
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter completed topics only (per user directive: "contains ONLY completed/learned material")
  const completedTopics = course.topics.filter(
    (t) => t.isCompleted || t.subtopics.some((st) => st.isCompleted)
  );

  const toggleTopicSelection = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTopicIds.length === completedTopics.length) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(completedTopics.map((t) => t.id));
    }
  };

  const handleGenerateRevision = async () => {
    if (selectedTopicIds.length === 0) return;
    setIsGenerating(true);
    setIsSubmitted(false);
    setAnswers({});

    const selectedTitles = completedTopics
      .filter((t) => selectedTopicIds.includes(t.id))
      .map((t) => t.title);

    try {
      const res = await fetch('/api/ai/generate-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitles: selectedTitles,
          revisionType,
          difficulty,
          questionCount,
        }),
      });
      const data = await res.json();
      setRevisionSession(data);
      triggerConfetti();
    } catch {
      // Graceful fallback revision session
      setRevisionSession({
        title: `Adaptive Revision: ${selectedTitles.slice(0, 2).join(' & ') || 'General Review'}`,
        questions: [
          {
            id: 'rev-fb-1',
            question: `What fundamental invariant must be preserved across operations in ${selectedTitles[0] || 'relational databases'}?`,
            options: ['Consistency & Referential Integrity', 'Random Key Allocation', 'Unrestricted Duplicate Tuples', 'Disabled Constraints'],
            correctIndex: 0,
            explanation: 'Preserving consistency and referential constraints ensures data integrity.'
          },
          {
            id: 'rev-fb-2',
            question: `Which normal form specifically addresses and removes transitive functional dependencies?`,
            options: ['Third Normal Form (3NF)', 'First Normal Form (1NF)', 'Second Normal Form (2NF)', '4NF'],
            correctIndex: 0,
            explanation: '3NF requires that no non-prime attribute is transitively dependent on any candidate key.'
          },
          {
            id: 'rev-fb-3',
            question: `In ACID transactions, what property ensures that all transaction effects survive system crashes?`,
            options: ['Durability', 'Atomicity', 'Isolation', 'Consistency'],
            correctIndex: 0,
            explanation: 'Durability guarantees that committed transactions are permanently recorded in non-volatile storage.'
          }
        ]
      });
      triggerConfetti();
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateScore = () => {
    if (!revisionSession) return 0;
    let correct = 0;
    revisionSession.questions.forEach((q, idx) => {
      if (answers[q.id || idx] === q.correctIndex) correct++;
    });
    return Math.round((correct / revisionSession.questions.length) * 100);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center space-x-2 text-indigo-600">
          <Layers className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Vault of Learned Concepts</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
          Learning Space
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Contains strictly completed and learned materials. Select topics across modules to generate custom multi-topic revision drills, mixed objective exams, and coding checks.
        </p>
      </div>

      {/* Main Grid: Topic Selector on Left, Revision Generator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Completed Topics Library */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-slate-900 font-display">
                Completed Syllabus Topics
              </div>
              <button
                onClick={handleSelectAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                {selectedTopicIds.length === completedTopics.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search learned topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Completed Topics Tree */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {completedTopics.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No completed topics yet. Finish a subtopic in Today's Path first!
                </div>
              ) : (
                completedTopics
                  .filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((t) => {
                    const isSelected = selectedTopicIds.includes(t.id);
                    const completedSubs = t.subtopics.filter((st) => st.isCompleted);

                    return (
                      <div
                        key={t.id}
                        className={`rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-50/40 border-indigo-200 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div 
                          onClick={() => toggleTopicSelection(t.id)}
                          className="p-3 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-indigo-600">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 fill-indigo-600 text-white" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{t.title}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {completedSubs.length} of {t.subtopics.length} subtopics learned
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Completed Subtopics list */}
                        {completedSubs.length > 0 && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-100 pl-10 space-y-1">
                            {completedSubs.map((st) => (
                              <div
                                key={st.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenSubtopic(t, st);
                                }}
                                className="text-[11px] text-slate-600 hover:text-indigo-600 cursor-pointer flex items-center justify-between group"
                              >
                                <span className="truncate">✓ {st.title}</span>
                                <span className="text-[10px] text-slate-400 group-hover:text-indigo-600">Review →</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Revision Generator Configuration */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Generator Parameters
              </span>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Create Adaptive Revision Test
              </h2>
              <p className="text-xs text-slate-500">
                Generate tailored recall exams and practice scenarios across your selected topics.
              </p>
            </div>

            {/* Selected topics pill display */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Selected Topics ({selectedTopicIds.length}):</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTopicIds.length === 0 ? (
                  <span className="text-xs text-rose-500 font-medium">Please check at least one topic on the left</span>
                ) : (
                  completedTopics
                    .filter((t) => selectedTopicIds.includes(t.id))
                    .map((t) => (
                      <span key={t.id} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                        {t.title}
                      </span>
                    ))
                )}
              </div>
            </div>

            {/* Revision Type */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Revision Type:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Objective', 'Descriptive', 'Coding', 'Mixed'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setRevisionType(type)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      revisionType === type
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Difficulty Level:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      difficulty === lvl
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Question Count:</span>
              <div className="flex gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      questionCount === num
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              disabled={selectedTopicIds.length === 0 || isGenerating}
              onClick={handleGenerateRevision}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-indigo-200 transition-all hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Custom Test...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>[Generate Revision]</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Revision Interactive Session */}
      {revisionSession && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                Active Revision Session • {revisionType} ({difficulty})
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {revisionSession.title}
              </h3>
            </div>

            {isSubmitted && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-bold text-xs">
                <span>Score: {calculateScore()}%</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {revisionSession.questions.map((q: any, qIdx: number) => {
              const selected = answers[q.id || qIdx];
              const isCorrect = selected === q.correctIndex;

              return (
                <div key={q.id || qIdx} className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700">Question {qIdx + 1}</span>
                    {isSubmitted && (
                      <span className={`text-xs font-bold flex items-center space-x-1 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                    {q.question}
                  </p>

                  {/* Options if provided */}
                  {q.options && (
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt: string, optIdx: number) => (
                        <button
                          key={optIdx}
                          disabled={isSubmitted}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id || qIdx]: optIdx }))}
                          className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all ${
                            isSubmitted
                              ? optIdx === q.correctIndex
                                ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-bold'
                                : selected === optIdx
                                ? 'bg-rose-100/70 border-rose-400 text-rose-950'
                                : 'bg-white border-slate-200 text-slate-500 opacity-60'
                              : selected === optIdx
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Explanation if submitted */}
                  {isSubmitted && q.explanation && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-indigo-900">Analysis & Rubric:</span>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setRevisionSession(null)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Dismiss Session
            </button>

            {!isSubmitted ? (
              <button
                onClick={() => setIsSubmitted(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm"
              >
                Submit Answers & View Grade
              </button>
            ) : (
              <button
                onClick={handleGenerateRevision}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Generate Another Practice Set</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
