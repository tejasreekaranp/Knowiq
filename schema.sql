-- KnowIQ Database Schema Reference
-- Compatible with Supabase PostgreSQL

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  academic_level TEXT DEFAULT 'Undergraduate',
  syllabus TEXT,
  status TEXT DEFAULT 'ready' CHECK (status IN ('draft', 'analyzing', 'ready', 'error')),
  duration_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Course Topics
CREATE TABLE IF NOT EXISTS public.course_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subtopics
CREATE TABLE IF NOT EXISTS public.subtopics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.course_topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  clarity_score INTEGER DEFAULT 0,
  estimated_retention INTEGER DEFAULT 100,
  days_until_revision INTEGER DEFAULT 7,
  conceptual_data JSONB,
  interactive_data JSONB,
  deep_revision_data JSONB,
  hard_quiz_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users view own courses" ON public.courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own courses" ON public.courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own courses" ON public.courses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own topics" ON public.course_topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own topics" ON public.course_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own topics" ON public.course_topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own topics" ON public.course_topics FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own subtopics" ON public.subtopics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subtopics" ON public.subtopics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subtopics" ON public.subtopics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own subtopics" ON public.subtopics FOR DELETE USING (auth.uid() = user_id);
