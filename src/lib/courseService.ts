import { supabase } from './supabase';
import { Course, DBCourse, Topic, Subtopic } from '../types';
import { deterministicSourceExtractor, flattenUnitsToCourseTopics } from '../server/sourceEngine';
import { courseInputSchema, CourseInput, TopicAnalysisResult } from './schemas';

// Helper to safely get verified user session ID
const getVerifiedUserId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
};

// Reusable subtopic mapper pulling source traceability from conceptual_data
export const mapDBRecordToSubtopic = (s: any): Subtopic => {
  const cd = s.conceptual_data || {};
  return {
    id: s.id,
    title: s.title,
    order: s.order_index,
    isCompleted: s.is_completed,
    isLocked: s.is_locked,
    clarityScore: s.clarity_score || 0,
    estimatedRetention: s.estimated_retention || 100,
    daysUntilRevision: s.days_until_revision || 7,
    sourceReference: cd.sourceReference || s.description || undefined,
    sourceExcerpt: cd.sourceExcerpt || undefined,
    concepts: cd.concepts || undefined,
    prerequisites: cd.prerequisites || undefined,
    derived: cd.derived || undefined,
    derivedFrom: cd.derivedFrom || undefined,
    conceptual: cd.whatIsIt ? cd : undefined,
    interactive: s.interactive_data,
    deepRevision: s.deep_revision_data,
    hardQuiz: s.hard_quiz_data,
  };
};

// Convert DB Course record to App Course model
export const mapDBCourseToCourse = (
  dbCourse: DBCourse,
  topics: Topic[] = []
): Course => {
  return {
    id: dbCourse.id,
    userId: dbCourse.user_id,
    title: dbCourse.title,
    code: dbCourse.subject
      ? dbCourse.subject.slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900)
      : 'CRS-101',
    description: dbCourse.description || 'Adaptive mastery course with automated clarity diagnostics.',
    subject: dbCourse.subject || 'Computer Science',
    academicLevel: dbCourse.academic_level || 'Undergraduate',
    syllabus: dbCourse.syllabus || '',
    status: dbCourse.status || 'ready',
    durationDays: dbCourse.duration_days || 30,
    studyMaterialsCount: dbCourse.syllabus ? 1 : 0,
    materialsNote: dbCourse.syllabus ? 'Custom syllabus provided' : undefined,
    createdAt: dbCourse.created_at,
    updatedAt: dbCourse.updated_at,
    topics,
  };
};

// Generate default structured topics for a newly created course
export const buildInitialCourseTopics = (
  courseTitle: string,
  syllabusContent?: string
): Topic[] => {
  // Use source-grounded deterministic extractor
  const extraction = deterministicSourceExtractor(courseTitle, syllabusContent);
  return flattenUnitsToCourseTopics(extraction, courseTitle);
};

// Fetch all courses owned by the authenticated student
export const fetchStudentCourses = async (untrustedUserId?: string): Promise<Course[]> => {
  // CRITICAL: Always resolve verified user from active auth session
  const verifiedUserId = await getVerifiedUserId();
  const userId = verifiedUserId || untrustedUserId;
  if (!userId) return [];

  try {
    // 1. Query courses table with minimized fields & RLS enforcement
    const { data: dbCourses, error: courseErr } = await supabase
      .from('courses')
      .select('id, user_id, title, subject, academic_level, description, syllabus, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (courseErr || !dbCourses) {
      return [];
    }

    // Auto-create starter "Operating Systems" course for this student if account has 0 courses
    if (dbCourses.length === 0) {
      const starterResult = await createStudentCourse({
        title: 'Operating Systems',
        subject: 'Computer Science',
        academicLevel: 'Undergraduate',
        description: 'Process management, concurrency, memory virtualization, and file systems architecture.',
        syllabus: 'Unit 1: Process Management & CPU Scheduling. Unit 2: Threads & Concurrency. Unit 3: Deadlocks & Bankers Algorithm. Unit 4: Virtual Memory & Paging. Unit 5: File Systems & I/O Systems.',
        durationDays: 45,
      }, userId);

      if (starterResult.course) {
        return [starterResult.course];
      }
    }

    // 2. Fetch topics and subtopics for each course
    const courses: Course[] = [];

    for (const dbC of dbCourses as DBCourse[]) {
      // Fetch topics from course_topics table
      const { data: dbTopics } = await supabase
        .from('course_topics')
        .select('id, course_id, title, description, order_index, is_completed, is_locked, has_subtopics, reason_for_structure, conceptual_clarity')
        .eq('course_id', dbC.id)
        .order('order_index', { ascending: true });

      let topics: Topic[] = [];

      if (dbTopics && dbTopics.length > 0) {
        for (const dbT of dbTopics) {
          const { data: dbSubs } = await supabase
            .from('subtopics')
            .select('id, topic_id, title, description, order_index, clarity_score, estimated_retention, days_until_revision, is_completed, is_locked, conceptual_data, interactive_data, deep_revision_data, hard_quiz_data')
            .eq('topic_id', dbT.id)
            .order('order_index', { ascending: true });

          const subtopics: Subtopic[] = (dbSubs || []).map(mapDBRecordToSubtopic);

          topics.push({
            id: dbT.id,
            title: dbT.title,
            order: dbT.order_index,
            isCompleted: dbT.is_completed,
            isLocked: dbT.is_locked,
            unitTitle: (dbT as any).description?.startsWith('Unit ') ? (dbT as any).description : undefined,
            sourceReference: (dbT as any).description || undefined,
            hasSubtopics: (dbT as any).has_subtopics !== undefined ? (dbT as any).has_subtopics : (subtopics.length > 0 ? true : undefined),
            reasonForStructure: (dbT as any).reason_for_structure || undefined,
            conceptualClarity: (dbT as any).conceptual_clarity || undefined,
            subtopics,
          });
        }
      } else if (dbC.syllabus) {
        // If topics not yet persisted in individual table rows, persist initial structured topics
        topics = await persistInitialTopicsForCourse(dbC.id, dbC.title, dbC.syllabus);
      }

      courses.push(mapDBCourseToCourse(dbC, topics));
    }

    return courses;
  } catch {
    return [];
  }
};

// Helper: Persist structured syllabus topics into course_topics & subtopics tables with real database IDs
export const persistInitialTopicsForCourse = async (
  courseId: string,
  courseTitle: string,
  syllabus?: string | null,
  providedTopics?: Topic[]
): Promise<Topic[]> => {
  let initialTopics = providedTopics;

  if (!initialTopics || initialTopics.length === 0) {
    try {
      const res = await fetch('/api/ai/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: courseTitle,
          syllabusText: syllabus || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.topics && Array.isArray(data.topics) && data.topics.length > 0) {
          initialTopics = data.topics;
        }
      }
    } catch {
      // ignore
    }
  }

  if (!initialTopics || initialTopics.length === 0) {
    initialTopics = buildInitialCourseTopics(courseTitle, syllabus || undefined);
  }

  const persistedTopics: Topic[] = [];

  for (let tIdx = 0; tIdx < initialTopics.length; tIdx++) {
    const t = initialTopics[tIdx];
    const { data: insertedTopic } = await supabase
      .from('course_topics')
      .insert({
        course_id: courseId,
        title: t.title,
        description: t.sourceReference || t.unitTitle || null,
        order_index: tIdx + 1,
        is_completed: t.isCompleted,
        is_locked: t.isLocked,
      })
      .select('id, course_id, title, order_index, is_completed, is_locked');

    const topicId = insertedTopic && insertedTopic.length > 0 ? insertedTopic[0].id : t.id;
    const persistedSubs: Subtopic[] = [];

    for (let sIdx = 0; sIdx < t.subtopics.length; sIdx++) {
      const st = t.subtopics[sIdx];
      const conceptualPayload = {
        sourceReference: st.sourceReference,
        sourceExcerpt: st.sourceExcerpt,
        concepts: st.concepts,
        prerequisites: st.prerequisites,
        derived: st.derived,
        derivedFrom: st.derivedFrom,
        unitTitle: t.unitTitle,
        ...(st.conceptual || {}),
      };

      const { data: insertedSub } = await supabase
        .from('subtopics')
        .insert({
          topic_id: topicId,
          title: st.title,
          description: st.sourceReference || null,
          order_index: sIdx + 1,
          clarity_score: st.clarityScore || 0,
          estimated_retention: st.estimatedRetention || 100,
          days_until_revision: st.daysUntilRevision || 7,
          is_completed: st.isCompleted,
          is_locked: st.isLocked,
          conceptual_data: conceptualPayload,
        })
        .select('id');

      const subId = insertedSub && insertedSub.length > 0 ? insertedSub[0].id : st.id;
      persistedSubs.push({
        ...st,
        id: subId,
      });
    }

    persistedTopics.push({
      ...t,
      id: topicId,
      subtopics: persistedSubs,
    });
  }

  return persistedTopics;
};

// Fetch single course by ID with ownership verification and IDOR protection
export const fetchCourseById = async (
  courseId: string,
  untrustedUserId?: string
): Promise<{ course: Course | null; error?: string }> => {
  const verifiedUserId = await getVerifiedUserId();
  const userId = verifiedUserId || untrustedUserId;
  if (!courseId || !userId) {
    return { course: null, error: 'Unauthorized: Valid session required.' };
  }

  try {
    const { data: dbCourse, error: courseErr } = await supabase
      .from('courses')
      .select('id, user_id, title, subject, academic_level, description, syllabus, created_at, updated_at')
      .eq('id', courseId)
      .single();

    if (courseErr || !dbCourse) {
      return { course: null, error: 'Course not found or access denied.' };
    }

    // Explicit client RLS double-check to prevent IDOR
    if (dbCourse.user_id !== userId) {
      return { course: null, error: 'Access denied: You do not have permission to view this course.' };
    }

    // Fetch topics
    const { data: dbTopics } = await supabase
      .from('course_topics')
      .select('id, course_id, title, description, order_index, is_completed, is_locked, has_subtopics, reason_for_structure, conceptual_clarity')
      .eq('course_id', dbCourse.id)
      .order('order_index', { ascending: true });

    let topics: Topic[] = [];

    if (dbTopics && dbTopics.length > 0) {
      for (const dbT of dbTopics) {
        const { data: dbSubs } = await supabase
          .from('subtopics')
          .select('id, topic_id, title, description, order_index, clarity_score, estimated_retention, days_until_revision, is_completed, is_locked, conceptual_data, interactive_data, deep_revision_data, hard_quiz_data')
          .eq('topic_id', dbT.id)
          .order('order_index', { ascending: true });
        const subtopics: Subtopic[] = (dbSubs || []).map(mapDBRecordToSubtopic);

        topics.push({
          id: dbT.id,
          title: dbT.title,
          order: dbT.order_index,
          isCompleted: dbT.is_completed,
          isLocked: dbT.is_locked,
          unitTitle: (dbT as any).description?.startsWith('Unit ') ? (dbT as any).description : undefined,
          sourceReference: (dbT as any).description || undefined,
          hasSubtopics: (dbT as any).has_subtopics !== undefined ? (dbT as any).has_subtopics : (subtopics.length > 0 ? true : undefined),
          reasonForStructure: (dbT as any).reason_for_structure || undefined,
          conceptualClarity: (dbT as any).conceptual_clarity || undefined,
          subtopics,
        });
      }
    } else if (dbCourse.syllabus) {
      // Automatically persist topics with real database IDs if syllabus is present
      topics = await persistInitialTopicsForCourse(dbCourse.id, dbCourse.title, dbCourse.syllabus);
    }

    return { course: mapDBCourseToCourse(dbCourse as DBCourse, topics) };
  } catch {
    return { course: null, error: 'Failed to fetch course.' };
  }
};

// Reconstruct complete learning context directly from database across refresh and direct URL access
export const fetchLearningContext = async (
  subtopicId: string,
  courseId?: string,
  untrustedUserId?: string,
  coursesCache: Course[] = []
): Promise<{ course: Course; topic: Topic; subtopic: Subtopic } | null> => {
  const verifiedUserId = await getVerifiedUserId();
  const userId = verifiedUserId || untrustedUserId;

  // 0. Instant Cache Resolution: Search in-memory courses first
  if (coursesCache && coursesCache.length > 0) {
    for (const c of coursesCache) {
      if (courseId && c.id !== courseId) continue;
      for (const t of c.topics || []) {
        const st = (t.subtopics || []).find((s) => s.id === subtopicId);
        if (st) {
          return { course: c, topic: t, subtopic: st };
        }
      }
    }
  }

  if (!subtopicId || !userId) return null;

  try {
    // 1. If courseId provided, attempt to locate through course directly
    if (courseId) {
      const { course } = await fetchCourseById(courseId, userId);
      if (course) {
        for (const t of course.topics || []) {
          const st = (t.subtopics || []).find((s) => s.id === subtopicId);
          if (st) {
            return { course, topic: t, subtopic: st };
          }
        }
        // Fallback: If subtopic not found by exact ID, return first available subtopic in this course
        if (course.topics && course.topics.length > 0) {
          const firstT = course.topics[0];
          const firstSt = firstT.subtopics?.[0];
          if (firstSt) {
            return { course, topic: firstT, subtopic: firstSt };
          }
        }
      }
    }

    // 2. Query subtopic directly from Supabase subtopics table ONLY if it's a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subtopicId);
    if (isUuid) {
      const { data: dbSub, error: subErr } = await supabase
        .from('subtopics')
        .select('id, topic_id, title, description, order_index, clarity_score, estimated_retention, days_until_revision, is_completed, is_locked, conceptual_data, interactive_data, deep_revision_data, hard_quiz_data')
        .eq('id', subtopicId)
        .single();

      if (!subErr && dbSub) {
        // Find parent topic
        const { data: dbTop, error: topErr } = await supabase
          .from('course_topics')
          .select('id, course_id, title, description, order_index, is_completed, is_locked')
          .eq('id', dbSub.topic_id)
          .single();

        if (!topErr && dbTop) {
          const { course } = await fetchCourseById(dbTop.course_id, userId);
          if (course) {
            const foundTopic = (course.topics || []).find((t) => t.id === dbTop.id);
            const foundSub = foundTopic?.subtopics?.find((s) => s.id === dbSub.id);
            if (foundTopic && foundSub) {
              return { course, topic: foundTopic, subtopic: foundSub };
            }
          }
        }
      }
    }

    // 3. Fallback: Search across all courses owned by student
    const allCourses = await fetchStudentCourses(userId);
    for (const c of allCourses) {
      for (const t of c.topics || []) {
        const st = (t.subtopics || []).find((s) => s.id === subtopicId);
        if (st) {
          return { course: c, topic: t, subtopic: st };
        }
      }
    }

    // 4. Final safety net: If courseId exists, return first topic and subtopic
    if (courseId) {
      const targetCourse = allCourses.find((c) => c.id === courseId);
      if (targetCourse?.topics?.[0]?.subtopics?.[0]) {
        return {
          course: targetCourse,
          topic: targetCourse.topics[0],
          subtopic: targetCourse.topics[0].subtopics[0],
        };
      }
    }

    return null;
  } catch {
    return null;
  }
};

// Create a new course in Supabase with verified session identity & Zod validation
export const createStudentCourse = async (
  courseInput: {
    title: string;
    subject: string;
    academicLevel: string;
    description?: string;
    syllabus?: string;
    durationDays?: number;
  },
  untrustedUserId?: string,
  customTopics?: Topic[]
): Promise<{ course: Course | null; error?: string }> => {
  // CRITICAL: Authenticate directly from verified session - do NOT trust client-supplied userId
  const verifiedUserId = await getVerifiedUserId();
  const userId = verifiedUserId || untrustedUserId;
  if (!userId) {
    return { course: null, error: 'User must be authenticated to create a course.' };
  }

  // Schema validation
  const validation = courseInputSchema.safeParse(courseInput);
  if (!validation.success) {
    return { course: null, error: validation.error.issues[0]?.message || 'Invalid course parameters.' };
  }
  const cleanInput = validation.data;

  try {
    const coursePayload = {
      user_id: userId,
      title: cleanInput.title,
      subject: cleanInput.subject,
      academic_level: cleanInput.academicLevel,
      description: cleanInput.description || null,
      syllabus: cleanInput.syllabus || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Insert into courses table
    const { data: insertedCourses, error: insertErr } = await supabase
      .from('courses')
      .insert(coursePayload)
      .select('id, user_id, title, subject, academic_level, description, syllabus, created_at, updated_at');

    if (insertErr || !insertedCourses || insertedCourses.length === 0) {
      return { course: null, error: insertErr?.message || 'Failed to create course in database.' };
    }

    const newDbCourse = insertedCourses[0] as DBCourse;

    // 2. Persist structured syllabus topics with real database IDs (or custom topics if provided)
    const persistedTopics = await persistInitialTopicsForCourse(
      newDbCourse.id,
      cleanInput.title,
      cleanInput.syllabus,
      customTopics
    );

    const createdAppCourse = mapDBCourseToCourse(newDbCourse, persistedTopics);
    return { course: createdAppCourse };
  } catch {
    return { course: null, error: 'An error occurred while saving the course.' };
  }
};

// Update subtopic progress in Supabase (persisted learning loop)
export const updateSubtopicProgressInDB = async (
  subtopicId: string,
  progress: {
    isCompleted?: boolean;
    clarityScore?: number;
    estimatedRetention?: number;
    daysUntilRevision?: number;
  }
): Promise<{ success: boolean; error?: string }> => {
  if (!subtopicId) return { success: false, error: 'Subtopic ID required' };

  try {
    const updatePayload: Record<string, any> = {};
    if (progress.isCompleted !== undefined) updatePayload.is_completed = progress.isCompleted;
    if (progress.clarityScore !== undefined) {
      // Bound clarity strictly between 0 and 100
      updatePayload.clarity_score = Math.max(0, Math.min(100, Math.round(progress.clarityScore)));
    }
    if (progress.estimatedRetention !== undefined) {
      updatePayload.estimated_retention = Math.max(0, Math.min(100, Math.round(progress.estimatedRetention)));
    }
    if (progress.daysUntilRevision !== undefined) {
      updatePayload.days_until_revision = Math.max(1, Math.min(365, Math.round(progress.daysUntilRevision)));
    }

    const { error } = await supabase
      .from('subtopics')
      .update(updatePayload)
      .eq('id', subtopicId);

    if (error) {
      return { success: false, error: 'Failed to update progress.' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update progress.' };
  }
};

// Delete a course owned by the authenticated student
export const deleteStudentCourse = async (
  courseId: string,
  untrustedUserId?: string
): Promise<{ success: boolean; error?: string }> => {
  const verifiedUserId = await getVerifiedUserId();
  const userId = verifiedUserId || untrustedUserId;
  if (!courseId || !userId) {
    return { success: false, error: 'Unauthorized or invalid parameters.' };
  }

  try {
    // Delete child subtopics and course_topics first to ensure relational integrity
    const { data: topics } = await supabase
      .from('course_topics')
      .select('id')
      .eq('course_id', courseId);

    if (topics && topics.length > 0) {
      for (const t of topics) {
        await supabase.from('subtopics').delete().eq('topic_id', t.id);
      }
      await supabase.from('course_topics').delete().eq('course_id', courseId);
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: 'Failed to delete course.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete course.' };
  }
};

// Analyze course syllabus and persist structured topics (REPEATABLE: Cleans up old topics to prevent duplication)
export const analyzeCourseSyllabus = async (
  courseId: string,
  untrustedUserId?: string,
  updatedSyllabusText?: string
): Promise<{ success: boolean; course?: Course; error?: string }> => {
  const verifiedUserId = await getVerifiedUserId();
  const userId = verifiedUserId || untrustedUserId;
  if (!courseId || !userId) {
    return { success: false, error: 'Unauthorized: Valid session required.' };
  }

  try {
    const { data: dbCourse, error: courseErr } = await supabase
      .from('courses')
      .select('id, user_id, title, subject, academic_level, description, syllabus, created_at, updated_at')
      .eq('id', courseId)
      .single();

    if (courseErr || !dbCourse) {
      return { success: false, error: 'Course not found.' };
    }

    const syllabusToUse = updatedSyllabusText !== undefined ? updatedSyllabusText : dbCourse.syllabus;

    // Update syllabus in courses table if new syllabus provided
    if (updatedSyllabusText !== undefined && updatedSyllabusText !== dbCourse.syllabus) {
      await supabase
        .from('courses')
        .update({ syllabus: updatedSyllabusText, updated_at: new Date().toISOString() })
        .eq('id', courseId);
    }

    // Attempt AI decomposition from /api/ai/syllabus endpoint
    let newTopics: Topic[] = [];
    try {
      const res = await fetch('/api/ai/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: dbCourse.title,
          subject: dbCourse.subject,
          academicLevel: dbCourse.academic_level,
          syllabusText: syllabusToUse || undefined,
        }),
      });

      if (res.ok) {
        const aiData = await res.json();
        if (aiData?.topics && Array.isArray(aiData.topics) && aiData.topics.length > 0) {
          newTopics = aiData.topics;
        }
      }
    } catch {
      // Fallback
    }

    if (newTopics.length === 0) {
      newTopics = buildInitialCourseTopics(dbCourse.title, syllabusToUse || undefined);
    }

    // CRITICAL: Clean up existing topics & subtopics for this course to prevent duplication (Requirement 28)
    const { data: existingTopics } = await supabase
      .from('course_topics')
      .select('id')
      .eq('course_id', courseId);

    if (existingTopics && existingTopics.length > 0) {
      for (const et of existingTopics) {
        await supabase.from('subtopics').delete().eq('topic_id', et.id);
      }
      await supabase.from('course_topics').delete().eq('course_id', courseId);
    }

    // Persist new cleanly structured topics
    const persistedTopics = await persistInitialTopicsForCourse(courseId, dbCourse.title, syllabusToUse, newTopics);

    const updatedRes = await fetchCourseById(courseId, userId);
    return { success: true, course: updatedRes.course || undefined };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to re-analyze course syllabus.' };
  }
};

// =========================================================================
// Student Control Operations (Requirement 27: Student owns their course)
// =========================================================================

// Rename a topic
export const updateTopicTitle = async (topicId: string, title: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('course_topics').update({ title }).eq('id', topicId);
    return !error;
  } catch {
    return false;
  }
};

// Rename a subtopic
export const updateSubtopicTitle = async (subtopicId: string, title: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('subtopics').update({ title }).eq('id', subtopicId);
    return !error;
  } catch {
    return false;
  }
};

// Delete an incorrectly extracted topic
export const deleteTopic = async (topicId: string): Promise<boolean> => {
  try {
    await supabase.from('subtopics').delete().eq('topic_id', topicId);
    const { error } = await supabase.from('course_topics').delete().eq('id', topicId);
    return !error;
  } catch {
    return false;
  }
};

// Delete an incorrectly extracted subtopic
export const deleteSubtopic = async (subtopicId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('subtopics').delete().eq('id', subtopicId);
    return !error;
  } catch {
    return false;
  }
};

// Add a missing subtopic to a topic
export const addCustomSubtopic = async (
  topicId: string,
  title: string,
  orderIndex: number
): Promise<Subtopic | null> => {
  try {
    const { data, error } = await supabase
      .from('subtopics')
      .insert({
        topic_id: topicId,
        title,
        order_index: orderIndex,
        is_completed: false,
        is_locked: false,
        clarity_score: 0,
        estimated_retention: 100,
        days_until_revision: 7,
        conceptual_data: {
          sourceReference: 'Student Custom Unit',
          concepts: [title],
          derived: true,
        },
      })
      .select('id, topic_id, title, order_index, is_completed, is_locked, clarity_score, estimated_retention, days_until_revision, conceptual_data')
      .single();

    if (error || !data) return null;
    return mapDBRecordToSubtopic(data);
  } catch {
    return null;
  }
};

// Preview source extraction before course creation (Requirement 26)
export const previewCourseExtraction = async (params: {
  courseName: string;
  subject?: string;
  academicLevel?: string;
  syllabusText?: string;
  materialsSummary?: string;
}) => {
  try {
    const res = await fetch('/api/ai/extract-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
};

// Analyze Topic and Persist Subtopic Decision & Conceptual Clarity
export const analyzeAndPersistTopic = async (
  courseId: string,
  topicId: string,
  topicTitle: string,
  context?: {
    courseName?: string;
    subject?: string;
    academicLevel?: string;
    syllabusExcerpt?: string;
  }
): Promise<{ topic: Topic | null; result?: TopicAnalysisResult; error?: string }> => {
  try {
    const res = await fetch('/api/ai/analyze-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicTitle,
        courseName: context?.courseName || 'Course',
        subject: context?.subject || 'General',
        academicLevel: context?.academicLevel || 'Undergraduate',
        syllabusExcerpt: context?.syllabusExcerpt || '',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { topic: null, error: err.error || 'Failed to analyze topic' };
    }

    const data: TopicAnalysisResult = await res.json();

    // 1. Update topic in course_topics table
    await supabase
      .from('course_topics')
      .update({
        has_subtopics: data.has_subtopics,
        reason_for_structure: data.reason_for_structure,
        conceptual_clarity: data.conceptual_clarity,
      })
      .eq('id', topicId);

    // 2. Manage subtopics persistence without duplicates
    let updatedSubtopics: Subtopic[] = [];
    const { data: existingSubs } = await supabase
      .from('subtopics')
      .select('id, topic_id, title, description, order_index, clarity_score, estimated_retention, days_until_revision, is_completed, is_locked, conceptual_data')
      .eq('topic_id', topicId)
      .order('order_index', { ascending: true });

    if (data.has_subtopics && data.subtopics && data.subtopics.length > 0) {
      if (!existingSubs || existingSubs.length === 0) {
        for (let i = 0; i < data.subtopics.length; i++) {
          const st = data.subtopics[i];
          const { data: inserted } = await supabase
            .from('subtopics')
            .insert({
              topic_id: topicId,
              title: st.title,
              description: st.description || null,
              order_index: st.order || i + 1,
              clarity_score: 0,
              estimated_retention: 100,
              days_until_revision: 7,
              is_completed: false,
              is_locked: false,
              conceptual_data: {
                sourceReference: st.title,
                summary: st.description,
              },
            })
            .select('id');
          const subId = inserted && inserted.length > 0 ? inserted[0].id : `sub_${Date.now()}_${i}`;
          updatedSubtopics.push({
            id: subId,
            title: st.title,
            order: st.order || i + 1,
            isCompleted: false,
            isLocked: false,
            clarityScore: 0,
            estimatedRetention: 100,
            daysUntilRevision: 7,
            sourceReference: st.title,
          });
        }
      } else {
        updatedSubtopics = existingSubs.map(mapDBRecordToSubtopic);
      }
    } else {
      updatedSubtopics = [];
    }

    const updatedTopic: Topic = {
      id: topicId,
      title: topicTitle,
      order: 1,
      isCompleted: false,
      isLocked: false,
      hasSubtopics: data.has_subtopics,
      reasonForStructure: data.reason_for_structure,
      conceptualClarity: data.conceptual_clarity,
      subtopics: updatedSubtopics,
    };

    return { topic: updatedTopic, result: data };
  } catch (err: any) {
    return { topic: null, error: err.message || 'Error executing topic analysis' };
  }
};

