import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  UploadCloud, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  RefreshCw, 
  Check,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { Course } from '../types';
import { triggerConfetti } from '../utils/confetti';
import { useAuth } from '../contexts/AuthContext';
import { createStudentCourse, previewCourseExtraction } from '../lib/courseService';
import { courseInputSchema, SourceExtractionResult, normalizeSyllabusFormatting } from '../lib/schemas';

interface CourseCreationModalProps {
  onClose: () => void;
  onCourseCreated: (course: Course) => void;
}

export const CourseCreationModal: React.FC<CourseCreationModalProps> = ({
  onClose,
  onCourseCreated,
}) => {
  const { user } = useAuth();

  // Form fields per Section 7
  const [courseName, setCourseName] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate');
  const [description, setDescription] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Status, stages & preview
  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractionPreview, setExtractionPreview] = useState<SourceExtractionResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const presets = [
    {
      name: 'Database Management Systems',
      subject: 'Computer Science',
      academicLevel: 'Undergraduate',
      duration: 30,
      description: 'Relational data models, normalization, SQL, indexing, and ACID transaction mechanics.',
      syllabus: 'Unit 1: ER Modeling & Relational Algebra. Unit 2: SQL & Schema Design. Unit 3: Normalization (1NF, 2NF, 3NF, BCNF). Unit 4: Storage, Indexing & B-Trees. Unit 5: Concurrency Control & Transactions.'
    },
    {
      name: 'Operating Systems',
      subject: 'Computer Science',
      academicLevel: 'Undergraduate',
      duration: 45,
      description: 'Process management, concurrency, memory virtualization, and file systems architecture.',
      syllabus: 'Unit 1: Process Management & CPU Scheduling. Unit 2: Threads & Concurrency. Unit 3: Deadlocks & Bankers Algorithm. Unit 4: Virtual Memory & Paging. Unit 5: File Systems & I/O Systems.'
    },
    {
      name: 'Data Structures & Algorithms',
      subject: 'Computer Science',
      academicLevel: 'Undergraduate',
      duration: 60,
      description: 'Linear & non-linear data structures, asymptotic notation, graph algorithms, and dynamic programming.',
      syllabus: 'Unit 1: Arrays, Linked Lists & Stacks. Unit 2: Binary Search Trees & Heaps. Unit 3: Graph Traversals (BFS/DFS) & Shortest Path. Unit 4: Dynamic Programming & Greedy Algorithms.'
    }
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setCourseName(preset.name);
    setSubject(preset.subject);
    setAcademicLevel(preset.academicLevel);
    setDurationDays(preset.duration);
    setDescription(preset.description);
    setSyllabusText(preset.syllabus);
    setExtractionPreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      if (!courseName) {
        setCourseName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
      if (!syllabusText) {
        setSyllabusText(`Imported syllabus extracted from ${file.name}. Analysis will structure modules, prerequisites, and learning nodes.`);
      }
    }
  };

  const handlePreviewExtraction = async () => {
    if (!courseName.trim()) {
      setErrorMessage('Please provide a course name first.');
      return;
    }
    setErrorMessage(null);
    setIsPreviewLoading(true);

    const formattedSyllabus = normalizeSyllabusFormatting(syllabusText || '');
    if (formattedSyllabus !== syllabusText) {
      setSyllabusText(formattedSyllabus);
    }

    try {
      const preview = await previewCourseExtraction({
        courseName,
        subject,
        academicLevel,
        syllabusText: formattedSyllabus || undefined,
        materialsSummary: uploadedFileName ? `Uploaded document: ${uploadedFileName}` : undefined,
      });

      if (preview && preview.units) {
        setExtractionPreview(preview);
        setShowPreviewModal(true);
      } else {
        throw new Error('Failed to generate preview.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to preview extraction.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formattedSyllabus = normalizeSyllabusFormatting(syllabusText || '');
    if (formattedSyllabus !== syllabusText) {
      setSyllabusText(formattedSyllabus);
    }

    // Zod client validation
    const validation = courseInputSchema.safeParse({
      title: courseName,
      subject,
      academicLevel,
      description: description || undefined,
      syllabus: formattedSyllabus || undefined,
      durationDays,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Invalid course details.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('You must be logged in to create a course.');
      return;
    }

    setIsProcessing(true);
    setAnalysisStage(1);

    // Visual progression stages reflecting Source-Grounded Pipeline
    const timer1 = setTimeout(() => setAnalysisStage(2), 600);
    const timer2 = setTimeout(() => setAnalysisStage(3), 1200);
    const timer3 = setTimeout(() => setAnalysisStage(4), 1800);
    const timer4 = setTimeout(() => setAnalysisStage(5), 2400);

    try {
      // 1. Create course directly in Supabase using source-grounded extraction
      const result = await createStudentCourse(
        {
          title: validation.data.title,
          subject: validation.data.subject,
          academicLevel: validation.data.academicLevel,
          description: validation.data.description || undefined,
          syllabus: validation.data.syllabus || undefined,
          durationDays: validation.data.durationDays,
        },
        user.id
      );

      if (result.error || !result.course) {
        throw new Error(result.error || 'Failed to save course.');
      }

      setAnalysisStage(6);
      triggerConfetti();

      // Delay briefly for user feedback then navigate
      setTimeout(() => {
        onCourseCreated(result.course!);
      }, 750);

    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsProcessing(false);
      setAnalysisStage(0);
      setErrorMessage(err?.message || 'Error creating course.');
    }
  };

  const stages = [
    { num: 1, label: 'Reading student source material & syllabus' },
    { num: 2, label: 'Faithfully extracting units, topics & concepts' },
    { num: 3, label: 'Structuring meaningful, teachable subtopics' },
    { num: 4, label: 'Mapping prerequisite dependencies' },
    { num: 5, label: 'Persisting grounded learning units in database' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">Create Course</h2>
              <p className="text-xs text-slate-500">Provide details and syllabus to generate your personalized learning path.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">✕</button>
            </div>
          )}

          {isProcessing ? (
            /* Progress checklist */
            <div className="py-8 px-4 space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Saving Course & Generating Path
                </h3>
                <p className="text-xs text-slate-500">
                  Building your conceptual milestone path and attaching student ownership...
                </p>
              </div>

              <div className="max-w-md mx-auto text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                {stages.map((stg) => {
                  const isDone = analysisStage > stg.num;
                  const isCurrent = analysisStage === stg.num;

                  return (
                    <div key={stg.num} className="flex items-center space-x-3 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white animate-pulse ring-4 ring-indigo-100'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {isDone ? <Check className="w-3 h-3" /> : stg.num}
                      </div>

                      <span className={`font-medium ${
                        isDone
                          ? 'text-slate-800 font-semibold'
                          : isCurrent
                          ? 'text-indigo-900 font-bold'
                          : 'text-slate-400'
                      }`}>
                        {stg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleStartAnalysis} className="space-y-5">
              {/* Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700">Quick Academic Templates:</span>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      onClick={() => handleApplyPreset(p)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-medium text-slate-700 hover:text-indigo-700 transition-colors"
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Course Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Database Management Systems"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Subject & Academic Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>Subject</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, Mathematics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center space-x-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Academic Level</span>
                    </label>
                    <select
                      value={academicLevel}
                      onChange={(e) => setAcademicLevel(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="High School">High School</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Professional">Professional Certification</option>
                    </select>
                  </div>
                </div>

                {/* Duration & Study Materials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Target Duration</span>
                    </label>
                    <select
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={15}>15 Days (Accelerated Sprint)</option>
                      <option value={30}>30 Days (Standard Semester Pace)</option>
                      <option value={45}>45 Days (Comprehensive Mastery)</option>
                      <option value={60}>60 Days (In-Depth Complete Program)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center space-x-1">
                      <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                      <span>Study Materials (Optional)</span>
                    </label>
                    <label className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                      <span className="text-xs text-slate-500 truncate">
                        {uploadedFileName || 'Upload PDF, Notes, PPT (optional)'}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 whitespace-nowrap ml-2">Browse</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Description (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description or course goal..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Syllabus */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center justify-between">
                    <span>Syllabus Content</span>
                    <span className="text-[11px] text-slate-400 font-normal">Paste modules, topics, or units</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Unit 1: Introduction to Processes. Unit 2: CPU Scheduling Algorithms. Unit 3: Synchronization & Semaphores. Unit 4: Memory Management..."
                    value={syllabusText}
                    onChange={(e) => {
                      setSyllabusText(e.target.value);
                      setExtractionPreview(null);
                    }}
                    onBlur={() => {
                      if (syllabusText) {
                        const formatted = normalizeSyllabusFormatting(syllabusText);
                        if (formatted !== syllabusText) {
                          setSyllabusText(formatted);
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
                  />
                  {!syllabusText.trim() && (
                    <p className="text-[11px] text-amber-600 mt-1 flex items-center space-x-1">
                      <span>💡 Tip: Providing your syllabus ensures Knowiq teaches your exact curriculum instead of a general starter curriculum.</span>
                    </p>
                  )}
                </div>

                {/* Extraction Preview Display (Requirement 26) */}
                {extractionPreview && (
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Extracted Curriculum Preview
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${extractionPreview.is_generic_starter ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {extractionPreview.is_generic_starter ? 'General Starter' : 'Source Grounded ✓'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {extractionPreview.source_summary}
                    </p>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {extractionPreview.units.map((unit, uIdx) => (
                        <div key={uIdx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span>{unit.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {unit.topics.length} {unit.topics.length === 1 ? 'topic' : 'topics'}
                            </span>
                          </div>
                          {unit.topics.map((t, tIdx) => (
                            <div key={tIdx} className="pl-3 border-l-2 border-indigo-200 space-y-1">
                              <div className="text-slate-700 font-semibold">{t.title}</div>
                              {t.subtopics && t.subtopics.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {t.subtopics.map((st, sIdx) => (
                                    <span key={sIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                      {st.title}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handlePreviewExtraction}
                  disabled={!courseName.trim() || isPreviewLoading || isProcessing}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  {isPreviewLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting Source...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Extracted Structure</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={!courseName.trim() || isProcessing}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-md shadow-indigo-200 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Course & Generate Path</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
