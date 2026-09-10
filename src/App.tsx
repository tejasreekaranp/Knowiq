import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Course, Topic, Subtopic, StudentState, SmartNotification } from './types';
import { initialStudentState, initialNotifications } from './data/mockData';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthView } from './components/AuthView';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CourseDetailsView } from './components/CourseDetailsView';
import { LearningSpaceView } from './components/LearningSpaceView';
import { SpacedRevisionView } from './components/SpacedRevisionView';
import { BadgesStreakView } from './components/BadgesStreakView';
import { FacultyView } from './components/FacultyView';
import { LearningEngineModal } from './components/LearningEngineModal';
import { CourseCreationModal } from './components/CourseCreationModal';
import { CourseSettingsModal } from './components/CourseSettingsModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { triggerConfetti } from './utils/confetti';
import { 
  fetchStudentCourses, 
  deleteStudentCourse, 
  updateSubtopicProgressInDB,
  fetchLearningContext,
  buildInitialCourseTopics
} from './lib/courseService';
import { parseCurrentRoute, navigateTo } from './utils/router';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

function KnowIQApp() {
  const { user, profile, userRole, isLoading: isAuthLoading } = useAuth();

  // Dynamic courses from Supabase
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState<boolean>(true);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);

  // Dynamic route / view: /course/[courseId]
  const [activeCourseDetailsId, setActiveCourseDetailsId] = useState<string | null>(null);

  // Student gamification state & notifications
  const [student, setStudent] = useState<StudentState>(initialStudentState);
  const [activeTab, setActiveTab] = useState<'home' | 'learn-space' | 'spaced-revision' | 'badges'>('home');
  const [notifications, setNotifications] = useState<SmartNotification[]>(initialNotifications);

  // Learning state and URL persistence
  const [learningTarget, setLearningTarget] = useState<{ course: Course; topic: Topic; subtopic: Subtopic } | null>(null);
  const learningTargetRef = useRef<{ course: Course; topic: Topic; subtopic: Subtopic } | null>(null);
  learningTargetRef.current = learningTarget;

  const [learningRouteInfo, setLearningRouteInfo] = useState<{ courseId?: string; subtopicId: string } | null>(null);
  const [isLearningLoading, setIsLearningLoading] = useState<boolean>(false);
  const [learningError, setLearningError] = useState<string | null>(null);

  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState<boolean>(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);

  // Load student's courses from Supabase
  const loadCourses = useCallback(async (userId: string) => {
    setIsCoursesLoading(true);
    try {
      const studentCourses = await fetchStudentCourses(userId);
      setCourses(studentCourses);
      if (studentCourses.length > 0) {
        // Keep current selected course if still present, else first
        setCurrentCourseId((prev) => {
          if (prev && studentCourses.some((c) => c.id === prev)) {
            return prev;
          }
          return studentCourses[0].id;
        });
      } else {
        setCurrentCourseId(null);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadCourses(user.id);
    } else {
      setCourses([]);
      setCurrentCourseId(null);
      setActiveCourseDetailsId(null);
      setIsCoursesLoading(false);
    }
  }, [user?.id, loadCourses]);

  // Active course reference
  const currentCourse = courses.find((c) => c.id === currentCourseId) || (courses.length > 0 ? courses[0] : null);

  // HTML5 History & URL route synchronization (/course/:courseId, /course/:courseId/learn/:subtopicId, /learn/:subtopicId)
  useEffect(() => {
    const handleRouteChange = () => {
      const route = parseCurrentRoute();
      if (route.type === 'learning') {
        setLearningRouteInfo({ courseId: route.courseId, subtopicId: route.subtopicId });
        if (route.courseId) {
          setActiveCourseDetailsId(route.courseId);
          setCurrentCourseId(route.courseId);
        }
      } else if (route.type === 'course-details') {
        setLearningRouteInfo(null);
        setLearningTarget(null);
        setActiveCourseDetailsId(route.courseId);
        setCurrentCourseId(route.courseId);
      } else if (route.type === 'tab') {
        setLearningRouteInfo(null);
        setLearningTarget(null);
        setActiveCourseDetailsId(null);
        setActiveTab(route.tab);
      } else if (route.type === 'home') {
        setLearningRouteInfo(null);
        setLearningTarget(null);
        setActiveCourseDetailsId(null);
        setActiveTab('home');
      }
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('app-route-change', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('app-route-change', handleRouteChange);
    };
  }, []);

  // Reconstruct learning session from Supabase across page reloads and direct URL access
  useEffect(() => {
    if (!learningRouteInfo || !user?.id) return;

    if (learningTargetRef.current && learningTargetRef.current.subtopic.id === learningRouteInfo.subtopicId) {
      return;
    }

    let isMounted = true;
    setIsLearningLoading(true);
    setLearningError(null);

    fetchLearningContext(learningRouteInfo.subtopicId, learningRouteInfo.courseId, user.id, courses)
      .then((context) => {
        if (!isMounted) return;
        if (context) {
          setCurrentCourseId(context.course.id);
          setActiveCourseDetailsId(context.course.id);
          const targetObj = {
            course: context.course,
            topic: context.topic,
            subtopic: context.subtopic,
          };
          learningTargetRef.current = targetObj;
          setLearningTarget(targetObj);
          setCourses((prev) => {
            const exists = prev.some((c) => c.id === context.course.id);
            if (!exists) {
              return [context.course, ...prev];
            }
            return prev.map((c) => (c.id === context.course.id ? context.course : c));
          });
        } else {
          setLearningError('Learning unit not found. It may have been modified or moved.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setLearningError(err?.message || 'Failed to load learning session.');
      })
      .finally(() => {
        if (isMounted) setIsLearningLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [learningRouteInfo, user?.id]);

  // Compute next lesson for seamless path continuation
  const { nextTopic, nextSubtopic } = useMemo(() => {
    const courseToUse = learningTarget?.course || currentCourse;
    if (!learningTarget || !courseToUse?.topics) {
      return { nextTopic: null, nextSubtopic: null };
    }
    const currentTopicIndex = courseToUse.topics.findIndex((t) => t.id === learningTarget.topic.id);
    if (currentTopicIndex === -1) return { nextTopic: null, nextSubtopic: null };

    const currTopic = courseToUse.topics[currentTopicIndex];
    const currentSubIndex = (currTopic.subtopics || []).findIndex((s) => s.id === learningTarget.subtopic.id);

    // Look for next subtopic in same topic
    if (currentSubIndex !== -1 && currentSubIndex + 1 < (currTopic.subtopics || []).length) {
      return {
        nextTopic: currTopic,
        nextSubtopic: currTopic.subtopics[currentSubIndex + 1],
      };
    }

    // Look for first subtopic in next topic
    if (currentTopicIndex + 1 < courseToUse.topics.length) {
      const nextT = courseToUse.topics[currentTopicIndex + 1];
      if (nextT.subtopics && nextT.subtopics.length > 0) {
        return {
          nextTopic: nextT,
          nextSubtopic: nextT.subtopics[0],
        };
      }
    }

    return { nextTopic: null, nextSubtopic: null };
  }, [learningTarget, currentCourse]);

  // Unified start learning handler
  const handleStartLearning = (selectedCourse: Course, topic?: Topic, subtopic?: Subtopic) => {
    let targetCourse = selectedCourse;
    if (!targetCourse.topics || targetCourse.topics.length === 0 || !targetCourse.topics[0]?.subtopics || targetCourse.topics[0].subtopics.length === 0) {
      const fallbackTopics = buildInitialCourseTopics(targetCourse.title, targetCourse.syllabus);
      targetCourse = { ...targetCourse, topics: fallbackTopics };
    }

    setCurrentCourseId(targetCourse.id);
    setActiveCourseDetailsId(targetCourse.id);
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === targetCourse.id);
      if (!exists) return [targetCourse, ...prev];
      return prev.map((c) => (c.id === targetCourse.id ? targetCourse : c));
    });

    let targetTopic = topic;
    let targetSubtopic = subtopic;

    if (!targetTopic || !targetSubtopic) {
      // Find first incomplete subtopic
      for (const t of targetCourse.topics || []) {
        for (const st of t.subtopics || []) {
          if (!st.isCompleted && !st.isLocked) {
            targetTopic = t;
            targetSubtopic = st;
            break;
          }
        }
        if (targetSubtopic) break;
      }
    }

    // Fallback to first available subtopic
    if (!targetTopic && targetCourse.topics && targetCourse.topics.length > 0) {
      targetTopic = targetCourse.topics[0];
      targetSubtopic = targetCourse.topics[0].subtopics?.[0];
    }
    if (targetTopic && !targetSubtopic && targetTopic.subtopics && targetTopic.subtopics.length > 0) {
      targetSubtopic = targetTopic.subtopics[0];
    }

    // Direct topic learning for focused concept (hasSubtopics === false)
    if (targetTopic && (!targetSubtopic || targetTopic.hasSubtopics === false)) {
      const virtualSubtopic: Subtopic = targetSubtopic || {
        id: targetTopic.id,
        title: targetTopic.title,
        order: targetTopic.order,
        isCompleted: targetTopic.isCompleted,
        isLocked: targetTopic.isLocked,
        clarityScore: 0,
        estimatedRetention: 100,
        daysUntilRevision: 7,
        sourceReference: targetTopic.sourceReference || 'Core Topic',
        concepts: [targetTopic.title],
      };
      const targetObj = {
        course: targetCourse,
        topic: targetTopic,
        subtopic: virtualSubtopic,
      };
      learningTargetRef.current = targetObj;
      setLearningTarget(targetObj);
      setLearningRouteInfo({
        courseId: targetCourse.id,
        subtopicId: virtualSubtopic.id,
      });
      navigateTo(`/course/${targetCourse.id}/learn/${virtualSubtopic.id}`);
      return;
    }

    if (targetTopic && targetSubtopic) {
      const targetObj = {
        course: targetCourse,
        topic: targetTopic,
        subtopic: targetSubtopic,
      };
      learningTargetRef.current = targetObj;
      setLearningTarget(targetObj);
      setLearningRouteInfo({
        courseId: targetCourse.id,
        subtopicId: targetSubtopic.id,
      });
      navigateTo(`/course/${targetCourse.id}/learn/${targetSubtopic.id}`);
    } else {
      setActiveCourseDetailsId(targetCourse.id);
      navigateTo(`/course/${targetCourse.id}`);
    }
  };

  const handleCloseLearning = () => {
    setLearningTarget(null);
    learningTargetRef.current = null;
    setLearningRouteInfo(null);
    if (activeCourseDetailsId || currentCourseId) {
      const cId = activeCourseDetailsId || currentCourseId;
      navigateTo(`/course/${cId}`);
    } else {
      navigateTo('/');
    }
  };

  // Student name resolution
  const studentName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Student');

  // Course handlers
  const handleSelectCourse = (course: Course) => {
    setCurrentCourseId(course.id);
  };

  const handleCourseCreated = (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev.filter((c) => c.id !== newCourse.id)]);
    setCurrentCourseId(newCourse.id);
    setIsCreateCourseOpen(false);
    // Navigate directly to the newly created course details per Section 8 & 11
    setActiveCourseDetailsId(newCourse.id);
    navigateTo(`/course/${newCourse.id}`);
    triggerConfetti();
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!user?.id) return;
    try {
      await deleteStudentCourse(courseId, user.id);
      const remaining = courses.filter((c) => c.id !== courseId);
      setCourses(remaining);
      if (remaining.length > 0) {
        setCurrentCourseId(remaining[0].id);
      } else {
        setCurrentCourseId(null);
      }
      if (activeCourseDetailsId === courseId) {
        setActiveCourseDetailsId(null);
        navigateTo('/');
      }
    } catch (err) {
      console.error('Delete course error:', err);
    }
  };

  // Learning loop completion with bounded calculations and DB persistence
  const handleCompleteSubtopic = (subtopicId: string, newClarity: number, xpEarned: number) => {
    if (!currentCourse) return;

    // Security: Bound clarity score between 0 and 100
    const safeClarity = Math.max(0, Math.min(100, Math.round(newClarity)));
    // Security: Bound XP award to maximum legitimate cap (max 50 XP per subtopic completion)
    const safeXp = Math.max(0, Math.min(50, Math.round(xpEarned)));

    // Persist progress to Supabase with RLS ownership validation
    updateSubtopicProgressInDB(subtopicId, {
      isCompleted: true,
      clarityScore: safeClarity,
      estimatedRetention: 95,
      daysUntilRevision: 7,
    });

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== currentCourse.id) return c;
        const updatedTopics = c.topics.map((t) => {
          const updatedSubs = t.subtopics.map((st) => {
            if (st.id === subtopicId) {
              return {
                ...st,
                isCompleted: true,
                clarityScore: safeClarity,
                estimatedRetention: 95,
                daysUntilRevision: 7,
              };
            }
            return st;
          });
          const allDone = updatedSubs.every((s) => s.isCompleted);
          return {
            ...t,
            subtopics: updatedSubs,
            isCompleted: allDone,
          };
        });

        // Unlock next topic if current is completed
        for (let i = 0; i < updatedTopics.length - 1; i++) {
          if (updatedTopics[i].isCompleted && updatedTopics[i + 1].isLocked) {
            updatedTopics[i + 1] = {
              ...updatedTopics[i + 1],
              isLocked: false,
              isUnlocked: true,
              subtopics: updatedTopics[i + 1].subtopics.map((st, sIdx) =>
                sIdx === 0 ? { ...st, isLocked: false } : st
              ),
            };
          }
        }

        return { ...c, topics: updatedTopics };
      })
    );

    // Award XP within bounded limit
    setStudent((prev) => ({
      ...prev,
      xp: prev.xp + safeXp,
      todayCompleted: Math.min(prev.todayTarget, prev.todayCompleted + 1),
    }));
  };

  // Retention update after spaced revision drill
  const handleUpdateRetention = (subtopicId: string, newRetention: number, newDays: number) => {
    const safeRetention = Math.max(0, Math.min(100, Math.round(newRetention)));
    const safeDays = Math.max(1, Math.min(365, Math.round(newDays)));

    // Persist to database
    updateSubtopicProgressInDB(subtopicId, {
      estimatedRetention: safeRetention,
      daysUntilRevision: safeDays,
    });

    setCourses((prev) =>
      prev.map((c) => {
        const updatedTopics = c.topics.map((t) => ({
          ...t,
          subtopics: t.subtopics.map((st) =>
            st.id === subtopicId
              ? { ...st, estimatedRetention: safeRetention, daysUntilRevision: safeDays }
              : st
          ),
        }));
        return { ...c, topics: updatedTopics };
      })
    );

    setStudent((prev) => ({
      ...prev,
      xp: prev.xp + 15,
      streakDays: Math.min(prev.streakDays + 1, 365),
    }));
  };

  // Notification action handler
  const handleNotificationAction = (notification: SmartNotification) => {
    setIsNotificationDrawerOpen(false);
    if (notification.timeOfDay === 'afternoon') {
      setActiveTab('spaced-revision');
    } else if (notification.timeOfDay === 'evening' && currentCourse?.topics?.[0]?.subtopics?.[0]) {
      setLearningTarget({
        topic: currentCourse.topics[0],
        subtopic: currentCourse.topics[0].subtopics[0],
      });
    } else {
      setActiveTab('home');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 1. Initial Authentication Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 mb-4 animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-100" />
        </div>
        <div className="flex items-center space-x-2 text-slate-600 text-xs font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Verifying KnowIQ Session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Sign In / Sign Up Form
  if (!user) {
    return <AuthView initialMode="login" />;
  }

  // 3. Authenticated: Render Main Application
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navbar */}
      <Navbar
        currentCourse={currentCourse}
        courses={courses}
        onSelectCourse={handleSelectCourse}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveCourseDetailsId(null);
          setActiveTab(tab);
          navigateTo(tab === 'home' ? '/' : `/${tab}`);
        }}
        userRole={userRole}
        xp={student.xp}
        streakDays={student.streakDays}
        todayProgress={{ completed: student.todayCompleted, target: student.todayTarget }}
        onOpenCreateCourse={() => setIsCreateCourseOpen(true)}
        onOpenEditCourse={() => {
          if (currentCourse) setIsEditCourseOpen(true);
        }}
        onOpenAddSyllabus={() => {
          if (currentCourse) setIsEditCourseOpen(true);
        }}
        onDeleteCourse={handleDeleteCourse}
        onToggleNotifications={() => setIsNotificationDrawerOpen(!isNotificationDrawerOpen)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {userRole === 'faculty' ? (
          <FacultyView />
        ) : activeCourseDetailsId ? (
          /* Dynamic Course Details View (/course/[courseId]) */
          <CourseDetailsView
            courseId={activeCourseDetailsId}
            onBackToHome={() => {
              setActiveCourseDetailsId(null);
              navigateTo('/');
            }}
            onStartLearning={(selectedCourse, topic, subtopic) => {
              handleStartLearning(selectedCourse, topic, subtopic);
            }}
            onCourseDeleted={(deletedId) => {
              handleDeleteCourse(deletedId);
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                courses={courses}
                currentCourse={currentCourse}
                onSelectCourse={handleSelectCourse}
                onOpenCreateCourse={() => setIsCreateCourseOpen(true)}
                onViewCourseDetails={(cId) => {
                  setActiveCourseDetailsId(cId);
                  navigateTo(`/course/${cId}`);
                }}
                studentName={studentName}
                streakDays={student.streakDays}
                xp={student.xp}
                todayProgress={{ completed: student.todayCompleted, target: student.todayTarget }}
                notifications={notifications}
                onOpenSubtopic={(topic, subtopic) => {
                  const targetCourse = currentCourse || (courses.length > 0 ? courses[0] : null);
                  if (targetCourse) {
                    handleStartLearning(targetCourse, topic, subtopic);
                  }
                }}
                onStartLearning={(course, topic, subtopic) => {
                  handleStartLearning(course, topic, subtopic);
                }}
                onOpenEditCourse={() => {
                  if (currentCourse) setIsEditCourseOpen(true);
                }}
                onNavigateTab={(tab) => {
                  setActiveCourseDetailsId(null);
                  setActiveTab(tab);
                  navigateTo(tab === 'home' ? '/' : `/${tab}`);
                }}
              />
            )}

            {activeTab === 'learn-space' && (
              <LearningSpaceView
                course={currentCourse}
                onOpenSubtopic={(topic, subtopic) => {
                  if (currentCourse) {
                    handleStartLearning(currentCourse, topic, subtopic);
                  }
                }}
                onOpenCreateCourse={() => setIsCreateCourseOpen(true)}
              />
            )}

            {activeTab === 'spaced-revision' && (
              <SpacedRevisionView
                course={currentCourse}
                onUpdateRetention={handleUpdateRetention}
                onOpenCreateCourse={() => setIsCreateCourseOpen(true)}
              />
            )}

            {activeTab === 'badges' && (
              <BadgesStreakView student={student} />
            )}
          </>
        )}
      </main>

      {/* 4-Step Clarity Learning Engine Modal */}
      {learningTarget && (
        <LearningEngineModal
          topic={learningTarget.topic}
          subtopic={learningTarget.subtopic}
          courseTitle={learningTarget.course.title}
          onClose={handleCloseLearning}
          onCompleteSubtopic={handleCompleteSubtopic}
          nextTopic={nextTopic}
          nextSubtopic={nextSubtopic}
          onNextSubtopic={(nT, nSt) => handleStartLearning(learningTarget.course, nT, nSt)}
        />
      )}

      {/* Learning Context Loading Screen */}
      {isLearningLoading && !learningTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Loading AI Teacher...
              </h3>
              <p className="text-xs text-slate-500">
                Reconstructing your curriculum milestone from database
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Learning Context Error Screen */}
      {learningError && !learningTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Learning Session Unavailable
              </h3>
              <p className="text-xs text-slate-500">{learningError}</p>
            </div>
            <div className="pt-2 flex justify-center space-x-3">
              <button
                onClick={() => {
                  setLearningError(null);
                  setLearningRouteInfo(null);
                  navigateTo('/');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Creation Modal */}
      {isCreateCourseOpen && (
        <CourseCreationModal
          onClose={() => setIsCreateCourseOpen(false)}
          onCourseCreated={handleCourseCreated}
        />
      )}

      {/* Course Settings & Syllabus Editor Modal */}
      {isEditCourseOpen && currentCourse && (
        <CourseSettingsModal
          course={currentCourse}
          onClose={() => setIsEditCourseOpen(false)}
          onUpdateCourse={handleUpdateCourse}
        />
      )}

      {/* Smart Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onActionClick={handleNotificationAction}
        onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <KnowIQApp />
    </AuthProvider>
  );
}
