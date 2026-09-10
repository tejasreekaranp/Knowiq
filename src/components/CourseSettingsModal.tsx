import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Save, 
  BookOpen, 
  Edit3, 
  Layers, 
  UploadCloud, 
  AlertCircle,
  Check
} from 'lucide-react';
import { Course, Topic } from '../types';

interface CourseSettingsModalProps {
  course: Course;
  onClose: () => void;
  onUpdateCourse: (updatedCourse: Course) => void;
  initialMode?: 'edit' | 'add-topic';
}

export const CourseSettingsModal: React.FC<CourseSettingsModalProps> = ({
  course,
  onClose,
  onUpdateCourse,
  initialMode = 'edit',
}) => {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [durationDays, setDurationDays] = useState(course.durationDays);
  const [topics, setTopics] = useState<Topic[]>(course.topics);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newSubtopicTitles, setNewSubtopicTitles] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddTopic = () => {
    if (!newTopicTitle.trim()) return;
    const subtopicList = newSubtopicTitles
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newTopic: Topic = {
      id: `top-${Date.now()}`,
      title: newTopicTitle.trim(),
      order: topics.length + 1,
      isCompleted: false,
      isLocked: false,
      subtopics: subtopicList.map((stName, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: stName,
        order: idx + 1,
        isCompleted: false,
        isLocked: false,
        estimatedRetention: 100,
        daysUntilRevision: 7,
      })),
    };

    setTopics([...topics, newTopic]);
    setNewTopicTitle('');
    setNewSubtopicTitles('');
  };

  const handleDeleteTopic = (topicId: string) => {
    setTopics(topics.filter((t) => t.id !== topicId));
  };

  const handleSave = () => {
    const updated: Course = {
      ...course,
      title,
      description,
      durationDays,
      topics,
    };
    onUpdateCourse(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 font-display">
              Course Setup & Syllabus Editor
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* General info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Course Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Target Duration (Days)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Replace Study Materials
                </label>
                <label className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 text-xs text-slate-500">
                  <span>Upload updated notes/PDF</span>
                  <span className="font-bold text-indigo-600 ml-2">Browse</span>
                  <input type="file" className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Manage Topics / Syllabus Structure */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Manage Syllabus Topics ({topics.length})
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {topics.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      {idx + 1}. {t.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t.subtopics.length} subtopics
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTopic(t.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete topic from syllabus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new syllabus topic form */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
              <span className="text-xs font-bold text-indigo-900">Add New Syllabus Topic:</span>
              <input
                type="text"
                placeholder="Topic Title (e.g., Query Optimization & Indexing)"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="Subtopics, comma separated (e.g., B+ Trees, Cost Estimation, Heuristics)"
                value={newSubtopicTitles}
                onChange={(e) => setNewSubtopicTitles(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <button
                disabled={!newTopicTitle.trim()}
                onClick={handleAddTopic}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Syllabus</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-sm"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Course Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
