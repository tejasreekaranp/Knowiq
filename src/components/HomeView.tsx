import React from 'react';
import { 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Play, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Layers, 
  PlusCircle, 
  ArrowRight,
  GraduationCap,
  Calendar,
  Info,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { Course, Topic, Subtopic, SmartNotification } from '../types';

interface HomeViewProps {
  courses: Course[];
  currentCourse: Course | null;
  onSelectCourse: (course: Course) => void;
  onOpenCreateCourse: () => void;
  onViewCourseDetails: (courseId: string) => void;
  studentName: string;
  streakDays: number;
  xp: number;
  todayProgress: { completed: number; target: number };
  notifications: SmartNotification[];
  onOpenSubtopic: (topic: Topic, subtopic: Subtopic) => void;
  onStartLearning?: (course: Course, topic?: Topic, subtopic?: Subtopic) => void;
  onOpenEditCourse: () => void;
  onNavigateTab: (tab: 'home' | 'learn-space' | 'spaced-revision' | 'badges') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  courses,
  currentCourse,
  onSelectCourse,
  onOpenCreateCourse,
  onViewCourseDetails,
  studentName,
  streakDays,
  xp,
  todayProgress,
  notifications,
  onOpenSubtopic,
  onStartLearning,
  onOpenEditCourse,
  onNavigateTab,
}) => {
  // Empty State per Section 10: "If the student has no courses: Show a useful empty state"
  if (!courses || courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-indigo-100/70 text-indigo-600 flex items-center justify-center mx-auto shadow-inner border border-indigo-200/50">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Welcome to KnowIQ, {studentName}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              You haven't created a course yet. Create your first course and let Knowiq build your personalized learning path.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenCreateCourse}
              className="inline-flex items-center space-x-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Course</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <span className="block text-xs font-bold text-indigo-700 mb-1">1. Custom Syllabus</span>
              <p className="text-[11px] text-slate-500">Paste any university curriculum or textbook table of contents.</p>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <span className="block text-xs font-bold text-indigo-700 mb-1">2. 4-Step Clarity Loop</span>
              <p className="text-[11px] text-slate-500">Master concepts progressively with interactive practice and hard quizzes.</p>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <span className="block text-xs font-bold text-indigo-700 mb-1">3. Spaced Retention</span>
              <p className="text-[11px] text-slate-500">Automated revision drills schedule review before you forget.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeCourse = currentCourse || courses[0];

  // Find next active subtopic
  let currentActiveTopic: Topic | null = null;
  let currentActiveSubtopic: Subtopic | null = null;

  if (activeCourse?.topics) {
    for (const t of activeCourse.topics) {
      for (const st of t.subtopics || []) {
        if (!st.isCompleted && !st.isLocked) {
          currentActiveTopic = t;
          currentActiveSubtopic = st;
          break;
        }
      }
      if (currentActiveSubtopic) break;
    }

    if (!currentActiveSubtopic && activeCourse.topics.length > 0) {
      currentActiveTopic = activeCourse.topics[0];
      currentActiveSubtopic = currentActiveTopic.subtopics?.[0] || null;
    }
  }

  const latestNotif = notifications[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      
      {/* Personalized Welcome & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            Welcome back, {studentName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your personalized mastery paths and retention diagnostics.
          </p>
        </div>

        <button
          onClick={onOpenCreateCourse}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-100 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Create Course</span>
        </button>
      </div>

      {/* DYNAMIC COURSES SECTION per Section 9 & 20 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 font-display">Your Courses</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => {
            const isSelected = activeCourse && c.id === activeCourse.id;
            const completedSubs = (c.topics || []).reduce(
              (acc, t) => acc + (t.subtopics || []).filter((s) => s.isCompleted).length,
              0
            );
            const totalSubs = (c.topics || []).reduce(
              (acc, t) => acc + (t.subtopics?.length || 0),
              0
            );
            const hasStarted = completedSubs > 0;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {c.subject || 'Computer Science'}
                    </span>
                    {/* Status badge: Section 20 - "Ready to start" instead of fake progress */}
                    {hasStarted ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {completedSubs}/{totalSubs} Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Ready to start
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.academicLevel || 'Undergraduate'}</span>
                      <span>•</span>
                      <span>{c.topics?.length || 0} topics</span>
                    </p>
                  </div>

                  {c.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onViewCourseDetails(c.id)}
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      if (onStartLearning) {
                        onStartLearning(c);
                      } else {
                        onSelectCourse(c);
                        onViewCourseDetails(c.id);
                      }
                    }}
                    className={`inline-flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <span>{hasStarted ? 'Continue Learning' : 'Start Learning'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Intelligent Notification Banner */}
      {latestNotif && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{latestNotif.title}</span>
                <span className="text-[10px] text-slate-400">• {latestNotif.timestamp}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-0.5 max-w-2xl leading-relaxed">
                {latestNotif.message}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (currentActiveTopic && currentActiveSubtopic) {
                onOpenSubtopic(currentActiveTopic, currentActiveSubtopic);
              }
            }}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-sm shadow-indigo-400/30 flex items-center space-x-1.5 transition-all hover:translate-x-0.5 self-end sm:self-center"
          >
            <span>{latestNotif.actionText}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Course Command Bar */}
      {activeCourse && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Focused Course</span>
                <button
                  onClick={() => onViewCourseDetails(activeCourse.id)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                >
                  [View Details]
                </button>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                {activeCourse.title}
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl line-clamp-2">
                {activeCourse.description}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Today's Goal</span>
                <div className="text-sm font-bold text-slate-800">{todayProgress.completed} / {todayProgress.target}</div>
              </div>

              <div 
                onClick={() => onNavigateTab('badges')}
                className="bg-orange-50/80 border border-orange-200 px-3 py-2 rounded-xl text-center min-w-[90px] cursor-pointer hover:bg-orange-100/80 transition-colors"
              >
                <div className="flex items-center justify-center space-x-1 text-orange-600">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Streak</span>
                </div>
                <div className="text-sm font-bold text-orange-800">{streakDays} Days</div>
              </div>

              <div 
                onClick={() => onNavigateTab('badges')}
                className="bg-indigo-50/80 border border-indigo-200 px-3 py-2 rounded-xl text-center min-w-[90px] cursor-pointer hover:bg-indigo-100/80 transition-colors"
              >
                <div className="flex items-center justify-center space-x-1 text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Total XP</span>
                </div>
                <div className="text-sm font-bold text-indigo-800">{xp.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Active Subtopic Quick Launch Hero */}
          {currentActiveTopic && currentActiveSubtopic && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/80">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                  Next Up in Learning Loop
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {currentActiveSubtopic.title}
                </div>
                <div className="text-xs text-slate-500 flex items-center space-x-2">
                  <span>{currentActiveTopic.title}</span>
                  <span>•</span>
                  <span>4-Step Clarity Loop Ready</span>
                </div>
              </div>

              <button
                onClick={() => onOpenSubtopic(currentActiveTopic!, currentActiveSubtopic!)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm shadow-indigo-200 transition-all hover:scale-[1.02]"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Resume Learning</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Section: Today's Learning Path */}
      {activeCourse && activeCourse.topics && activeCourse.topics.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Today's Learning Path</h2>
              <p className="text-xs text-slate-500">
                Structured progressive mastery tree: unlock subtopics sequentially as your clarity grows.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('spaced-revision')}
              className="hidden sm:flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Spaced Revision Queue</span>
            </button>
          </div>

          {/* Milestone Node Progression Tree */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3.5 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
            {activeCourse.topics.map((t, idx) => {
              const hasSubtopics = t.subtopics && t.subtopics.length > 0;
              const completedCount = (t.subtopics || []).filter((st) => st.isCompleted).length;
              const isFullyCompleted = t.isCompleted || (hasSubtopics && completedCount === t.subtopics.length);
              const isUnlocked = !t.isLocked;

              return (
                <div key={t.id} className="relative">
                  {/* Milestone Node Badge */}
                  <div 
                    className={`absolute -left-6 sm:-left-8 top-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-slate-50 transition-all ${
                      isFullyCompleted
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isUnlocked
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-indigo-50 ring-8'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isFullyCompleted ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    ) : isUnlocked ? (
                      <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  {/* Topic Container Card */}
                  <div className={`rounded-2xl border transition-all ${
                    isUnlocked
                      ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      : 'bg-slate-100/60 border-slate-200/80 opacity-75'
                  }`}>
                    <div className="p-4 sm:p-5 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Topic {idx + 1}
                          </span>
                          {isFullyCompleted && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Completed ✓
                            </span>
                          )}
                          {!isFullyCompleted && isUnlocked && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                              In Progress ({completedCount} / {t.subtopics?.length || 0})
                            </span>
                          )}
                          {!isUnlocked && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                              Locked 🔒
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 font-display">
                          {isFullyCompleted ? '✓ ' : isUnlocked ? '🔓 ' : '🔒 '}
                          {t.title}
                        </h3>
                        
                        <div className="text-xs text-slate-500 flex items-center space-x-2">
                          <span>{t.subtopics?.length || 0} subtopics</span>
                          <span>•</span>
                          <span>
                            {isUnlocked 
                              ? 'Interactive exercises & Hard quiz ready' 
                              : 'Prerequisites required to unlock'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subtopics Listing */}
                    {hasSubtopics && isUnlocked && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4 rounded-b-2xl space-y-2">
                        {t.subtopics.map((st) => {
                          const isSubCompleted = st.isCompleted;
                          const isSubLocked = st.isLocked;

                          return (
                            <div
                              key={st.id}
                              onClick={() => {
                                if (!isSubLocked) onOpenSubtopic(t, st);
                              }}
                              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                isSubLocked
                                  ? 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:shadow-2xs cursor-pointer group'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  isSubCompleted
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isSubLocked
                                    ? 'bg-slate-200 text-slate-400'
                                    : 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                                }`}>
                                  {isSubCompleted ? '✓' : isSubLocked ? '🔒' : '▶'}
                                </div>
                                <span className={`text-xs font-semibold ${isSubCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                  {st.title}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                {st.clarityScore !== undefined && st.clarityScore > 0 && (
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    {st.clarityScore}% Clarity
                                  </span>
                                )}
                                {!isSubLocked && (
                                  <span className="text-[11px] text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                                    Study <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
