import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Calendar, 
  GraduationCap, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText,
  Trash2,
  ChevronRight,
  BookOpen,
  Edit2,
  Plus,
  Tag,
  Check,
  X
} from 'lucide-react';
import { Course, Topic, Subtopic } from '../types';
import { 
  fetchCourseById, 
  deleteStudentCourse, 
  analyzeCourseSyllabus, 
  buildInitialCourseTopics,
  updateTopicTitle,
  updateSubtopicTitle,
  deleteTopic,
  deleteSubtopic,
  addCustomSubtopic,
  analyzeAndPersistTopic,
} from '../lib/courseService';
import { useAuth } from '../contexts/AuthContext';

interface CourseDetailsViewProps {
  courseId: string;
  onBackToHome: () => void;
  onStartLearning: (course: Course, topic?: Topic, subtopic?: Subtopic) => void;
  onCourseDeleted: (courseId: string) => void;
}

export const CourseDetailsView: React.FC<CourseDetailsViewProps> = ({
  courseId,
  onBackToHome,
  onStartLearning,
  onCourseDeleted,
}) => {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Edit Syllabus & Re-analyze state
  const [isEditSyllabusOpen, setIsEditSyllabusOpen] = useState(false);
  const [editedSyllabusText, setEditedSyllabusText] = useState('');
  
  // Student controls state
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicText, setEditingTopicText] = useState('');
  const [editingSubtopicId, setEditingSubtopicId] = useState<string | null>(null);
  const [editingSubtopicText, setEditingSubtopicText] = useState('');
  const [addingSubtopicToTopicId, setAddingSubtopicToTopicId] = useState<string | null>(null);
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');
  const [analyzingTopicId, setAnalyzingTopicId] = useState<string | null>(null);

  const handleAnalyzeSingleTopic = async (targetTopic: Topic) => {
    if (!course) return;
    setAnalyzingTopicId(targetTopic.id);
    try {
      const res = await analyzeAndPersistTopic(course.id, targetTopic.id, targetTopic.title, {
        courseName: course.title,
        subject: course.subject,
        academicLevel: course.academicLevel,
        syllabusExcerpt: course.syllabus,
      });
      if (res.topic) {
        setCourse((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            topics: prev.topics.map((t) => (t.id === targetTopic.id ? { ...t, ...res.topic } : t)),
          };
        });
      }
    } finally {
      setAnalyzingTopicId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadCourse() {
      if (!user?.id) return;
      setIsLoading(true);
      setError(null);

      const res = await fetchCourseById(courseId, user.id);
      if (!isMounted) return;

      if (res.course) {
        let loadedCourse = res.course;
        if (!loadedCourse.topics || loadedCourse.topics.length === 0) {
          const fallbackTopics = buildInitialCourseTopics(loadedCourse.title, loadedCourse.syllabus);
          loadedCourse = { ...loadedCourse, topics: fallbackTopics };
        }
        setCourse(loadedCourse);
      } else {
        setError(res.error || 'Course not found or you do not have permission to view it.');
      }
      setIsLoading(false);
    }

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId, user?.id]);

  const handleDelete = async () => {
    if (!course || !user?.id) return;
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) return;

    setIsDeleting(true);
    const res = await deleteStudentCourse(course.id, user.id);
    if (res.success) {
      onCourseDeleted(course.id);
    } else {
      alert(res.error || 'Failed to delete course');
      setIsDeleting(false);
    }
  };

  const handleAnalyzeCourse = async () => {
    if (!course || !user?.id) return;
    setIsAnalyzing(true);
    const res = await analyzeCourseSyllabus(course.id, user.id);
    if (res.success && res.course) {
      setCourse(res.course);
    } else {
      alert(res.error || 'Failed to analyze course syllabus.');
    }
    setIsAnalyzing(false);
  };

  const handleOpenEditSyllabus = () => {
    setEditedSyllabusText(course?.syllabus || '');
    setIsEditSyllabusOpen(true);
  };

  const handleReanalyzeSyllabus = async () => {
    if (!course || !user?.id) return;
    setIsAnalyzing(true);
    const res = await analyzeCourseSyllabus(course.id, user.id, editedSyllabusText);
    if (res.success && res.course) {
      setCourse(res.course);
      setIsEditSyllabusOpen(false);
    } else {
      alert(res.error || 'Failed to re-analyze course syllabus.');
    }
    setIsAnalyzing(false);
  };

  const handleSaveTopicName = async (topicId: string) => {
    if (!editingTopicText.trim()) return;
    const ok = await updateTopicTitle(topicId, editingTopicText.trim());
    if (ok && course) {
      setCourse({
        ...course,
        topics: course.topics.map((t) => (t.id === topicId ? { ...t, title: editingTopicText.trim() } : t)),
      });
    }
    setEditingTopicId(null);
  };

  const handleDeleteTopicClick = async (topicId: string) => {
    if (!confirm('Are you sure you want to remove this topic and all its learning units?')) return;
    const ok = await deleteTopic(topicId);
    if (ok && course) {
      setCourse({
        ...course,
        topics: course.topics.filter((t) => t.id !== topicId),
      });
    }
  };

  const handleSaveSubtopicName = async (subtopicId: string) => {
    if (!editingSubtopicText.trim()) return;
    const ok = await updateSubtopicTitle(subtopicId, editingSubtopicText.trim());
    if (ok && course) {
      setCourse({
        ...course,
        topics: course.topics.map((t) => ({
          ...t,
          subtopics: t.subtopics.map((st) => (st.id === subtopicId ? { ...st, title: editingSubtopicText.trim() } : st)),
        })),
      });
    }
    setEditingSubtopicId(null);
  };

  const handleDeleteSubtopicClick = async (topicId: string, subtopicId: string) => {
    if (!confirm('Are you sure you want to remove this learning unit?')) return;
    const ok = await deleteSubtopic(subtopicId);
    if (ok && course) {
      setCourse({
        ...course,
        topics: course.topics.map((t) =>
          t.id === topicId ? { ...t, subtopics: t.subtopics.filter((st) => st.id !== subtopicId) } : t
        ),
      });
    }
  };

  const handleAddSubtopicClick = async (topicId: string) => {
    if (!newSubtopicTitle.trim()) return;
    const parentTopic = course?.topics.find((t) => t.id === topicId);
    const orderIndex = (parentTopic?.subtopics.length || 0) + 1;
    const createdSub = await addCustomSubtopic(topicId, newSubtopicTitle.trim(), orderIndex);
    if (createdSub && course) {
      setCourse({
        ...course,
        topics: course.topics.map((t) =>
          t.id === topicId ? { ...t, subtopics: [...t.subtopics, createdSub] } : t
        ),
      });
      setNewSubtopicTitle('');
      setAddingSubtopicToTopicId(null);
    }
  };

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="h-8 w-2/3 bg-slate-200 rounded-lg" />
          <div className="h-4 w-1/3 bg-slate-200 rounded-lg" />
          <div className="h-20 w-full bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // Unauthorized or Not Found state
  if (error || !course) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Course Access Restricted</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {error || 'This course could not be located in your account. You can only view courses that you own.'}
        </p>
        <div className="pt-2">
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Return to My Courses
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(course.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const totalSubtopics = (course.topics || []).reduce((acc, t) => acc + (t.subtopics?.length || 0), 0);
  const completedSubtopics = (course.topics || []).reduce(
    (acc, t) => acc + (t.subtopics || []).filter((s) => s.isCompleted).length,
    0
  );

  // Find next learning target
  let nextTargetTopic: Topic | null = null;
  let nextTargetSubtopic: Subtopic | null = null;

  if (course.topics && course.topics.length > 0) {
    for (const t of course.topics) {
      for (const st of t.subtopics || []) {
        if (!st.isCompleted && !st.isLocked) {
          nextTargetTopic = t;
          nextTargetSubtopic = st;
          break;
        }
      }
      if (nextTargetSubtopic) break;
    }

    if (!nextTargetSubtopic && course.topics[0]?.subtopics?.[0]) {
      nextTargetTopic = course.topics[0];
      nextTargetSubtopic = course.topics[0].subtopics[0];
    }
  }

  const handleStartLearningClick = () => {
    let activeCourse = course;
    if (!activeCourse) return;

    if (!activeCourse.topics || activeCourse.topics.length === 0 || !activeCourse.topics[0]?.subtopics || activeCourse.topics[0].subtopics.length === 0) {
      const fallbackTopics = buildInitialCourseTopics(activeCourse.title, activeCourse.syllabus);
      activeCourse = { ...activeCourse, topics: fallbackTopics };
      setCourse(activeCourse);
    }

    const firstTopic = activeCourse.topics[0];
    const firstSub = firstTopic?.subtopics?.[0];

    const targetT = nextTargetTopic || firstTopic;
    const targetS = nextTargetSubtopic || firstSub;

    if (targetT && targetS) {
      onStartLearning(activeCourse, targetT, targetS);
    } else {
      onStartLearning(activeCourse);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Navigation Breadcrumb */}
      <button
        onClick={onBackToHome}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Courses</span>
      </button>

      {/* Primary Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                {course.subject || 'Computer Science'}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{course.academicLevel || 'Undergraduate'}</span>
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {completedSubtopics > 0 ? `${completedSubtopics}/${totalSubtopics} Milestones Completed` : 'Ready to Start'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              {course.title}
            </h1>

            <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {formattedDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{(course.topics || []).length} Topics ({totalSubtopics} Milestones)</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 self-start">
            <button
              id="start-learning-header-btn"
              onClick={handleStartLearningClick}
              disabled={isAnalyzing}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-75"
            >
              {isAnalyzing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>{completedSubtopics > 0 ? 'Continue Learning' : 'Start Learning'}</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Delete Course"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Next Learning Focus Banner */}
        {nextTargetTopic && nextTargetSubtopic && (
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Recommended Next Milestone
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {nextTargetTopic.title} • {nextTargetSubtopic.title}
              </p>
            </div>
            <button
              onClick={() => onStartLearning(course, nextTargetTopic!, nextTargetSubtopic!)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
            >
              <span>Launch AI Teacher</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Description */}
        {course.description && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Course Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {course.description}
            </p>
          </div>
        )}

        {/* Syllabus Section */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Syllabus & Curriculum Overview</span>
            </h3>
            <button
              onClick={handleOpenEditSyllabus}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Syllabus & Re-analyze</span>
            </button>
          </div>

          {course.syllabus ? (
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
              {course.syllabus}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
              Structured learning path loaded from curriculum repository for {course.title}.
            </p>
          )}
        </div>
      </div>

      {/* Edit Syllabus & Re-analyze Modal */}
      {isEditSyllabusOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col space-y-4 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Edit Syllabus & Re-analyze Course
                </h3>
              </div>
              <button
                onClick={() => setIsEditSyllabusOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Update your course syllabus below. Knowiq will faithfully extract your new topics and subtopics and cleanly update your learning hierarchy without creating duplicates.
            </p>

            <textarea
              rows={8}
              value={editedSyllabusText}
              onChange={(e) => setEditedSyllabusText(e.target.value)}
              placeholder="Paste or edit your syllabus units and topics here..."
              className="w-full text-xs sm:text-sm p-3 font-mono bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditSyllabusOpen(false)}
                disabled={isAnalyzing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReanalyzeSyllabus}
                disabled={isAnalyzing || !editedSyllabusText.trim()}
                className="inline-flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Re-analyzing Source...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Re-analyze & Update Course</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Curriculum & Milestone Hierarchy
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {(course.topics || []).length} units
          </span>
        </div>

        {/* Empty Topics handling */}
        {(!course.topics || course.topics.length === 0) ? (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Curriculum Needs Structuring
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your course hasn't been organized into a learning path yet.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleAnalyzeCourse}
                disabled={isAnalyzing}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing Course Syllabus...' : 'Analyze Course'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {course.topics.map((topic, idx) => (
              <div
                key={topic.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3"
              >
                {/* Topic Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md shrink-0">
                      {topic.unitTitle && /^(unit|module|chapter|part)\b/i.test(topic.unitTitle)
                        ? topic.unitTitle
                        : topic.sourceReference && /^(unit|module|chapter|part)\b/i.test(topic.sourceReference)
                        ? topic.sourceReference
                        : `Topic ${idx + 1}`}
                    </span>
                    
                    {editingTopicId === topic.id ? (
                      <div className="flex items-center space-x-1.5 flex-1 max-w-md">
                        <input
                          type="text"
                          value={editingTopicText}
                          onChange={(e) => setEditingTopicText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTopicName(topic.id)}
                          autoFocus
                          className="text-sm font-bold text-slate-900 border border-indigo-300 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleSaveTopicName(topic.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTopicId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {topic.title}
                      </h4>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
                    {topic.hasSubtopics === false ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Single Concept
                      </span>
                    ) : topic.hasSubtopics === true ? (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {topic.subtopics?.length || 0} Subtopics
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAnalyzeSingleTopic(topic)}
                        disabled={analyzingTopicId === topic.id}
                        className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center space-x-1 transition-colors cursor-pointer disabled:opacity-60"
                        title="Analyze topic structure with AI"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>{analyzingTopicId === topic.id ? 'Analyzing...' : 'Analyze Structure'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingTopicId(topic.id);
                        setEditingTopicText(topic.title);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Rename Topic"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAddingSubtopicToTopicId(topic.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Add Learning Unit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopicClick(topic.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reason for Structure if available */}
                {topic.reasonForStructure && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50/60 border border-slate-100 px-3 py-1.5 rounded-lg">
                    💡 {topic.reasonForStructure}
                  </p>
                )}

                {/* Conceptual Overview for Parent Topic with Subtopics */}
                {topic.hasSubtopics !== false && topic.conceptualClarity?.summary && (
                  <div className="text-xs text-slate-600 bg-indigo-50/30 border border-indigo-100/60 p-2.5 rounded-xl">
                    <span className="font-bold text-indigo-900">Topic Overview: </span>
                    {topic.conceptualClarity.summary}
                  </div>
                )}

                {/* Direct Topic Learning Card for Focused Concepts (hasSubtopics === false or empty subtopics) */}
                {(topic.hasSubtopics === false || (!topic.subtopics || topic.subtopics.length === 0)) && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50/50 via-teal-50/20 to-white border border-emerald-200/80 rounded-xl">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <h5 className="text-xs font-bold text-slate-900">
                            {topic.title}
                          </h5>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-1.5 py-0.2 rounded">
                            Direct Mastery
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {topic.conceptualClarity?.summary || 'This topic is focused as a single concept. Dive directly into its conceptual clarity, key terminology, and mastery check.'}
                        </p>
                      </div>
                      <button
                        onClick={() => onStartLearning(course, topic)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Learning Concept</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Subtopics List (Only shown when hasSubtopics is true or not explicitly false) */}
                {topic.hasSubtopics !== false && topic.subtopics && topic.subtopics.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 gap-2">
                    {topic.subtopics.map((st) => {
                      const isTarget = nextTargetSubtopic?.id === st.id;
                      return (
                        <div
                          key={st.id}
                          className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            st.isCompleted
                              ? 'bg-slate-50/80 border-slate-200'
                              : isTarget
                              ? 'bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-500/10'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                            {st.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                            ) : (
                              <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 sm:mt-0 ${isTarget ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                            )}
                            
                            <div className="min-w-0 flex-1">
                              {editingSubtopicId === st.id ? (
                                <div className="flex items-center space-x-1.5 max-w-sm">
                                  <input
                                    type="text"
                                    value={editingSubtopicText}
                                    onChange={(e) => setEditingSubtopicText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSubtopicName(st.id)}
                                    autoFocus
                                    className="text-xs font-semibold text-slate-900 border border-indigo-300 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <button
                                    onClick={() => handleSaveSubtopicName(st.id)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Save"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSubtopicId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`text-xs font-semibold truncate ${st.isCompleted ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                                      {st.title}
                                    </span>
                                    {st.sourceReference && (
                                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded">
                                        {st.sourceReference}
                                      </span>
                                    )}
                                  </div>

                                  {/* Concepts badges */}
                                  {st.concepts && st.concepts.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                      {st.concepts.slice(0, 4).map((c, cIdx) => (
                                        <span
                                          key={cIdx}
                                          className="text-[9px] font-semibold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-1.5 py-0.2 rounded"
                                        >
                                          {c}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                                    <span>Clarity: {st.clarityScore}%</span>
                                    <span>•</span>
                                    <span>Retention: {st.estimatedRetention}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                            <button
                              onClick={() => {
                                setEditingSubtopicId(st.id);
                                setEditingSubtopicText(st.title);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Rename Learning Unit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubtopicClick(topic.id, st.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Learning Unit"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => onStartLearning(course, topic, st)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer ${
                                st.isCompleted
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : isTarget
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{st.isCompleted ? 'Review' : 'Start Learning'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Add Subtopic Form */}
                {addingSubtopicToTopicId === topic.id && (
                  <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Enter new learning unit title..."
                      value={newSubtopicTitle}
                      onChange={(e) => setNewSubtopicTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtopicClick(topic.id)}
                      autoFocus
                      className="text-xs p-2 border border-indigo-200 rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleAddSubtopicClick(topic.id)}
                      disabled={!newSubtopicTitle.trim()}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setAddingSubtopicToTopicId(null);
                        setNewSubtopicTitle('');
                      }}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

