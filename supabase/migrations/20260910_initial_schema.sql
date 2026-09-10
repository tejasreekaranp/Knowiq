-- KnowIQ Initial Database Schema & RLS Setup
-- Migration: 20260910_initial_schema.sql

-- 1. PROFILES TABLE (Linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. COURSES TABLE (User-owned courses)
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  subject text,
  academic_level text default 'Undergraduate',
  syllabus text,
  status text default 'ready' check (status in ('draft', 'analyzing', 'ready', 'error')),
  duration_days integer default 30,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. COURSE_TOPICS TABLE (Structural hierarchy for topics)
create table if not exists public.course_topics (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  order_index integer not null default 1,
  is_completed boolean default false not null,
  is_locked boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SUBTOPICS TABLE (4-step clarity & learning units)
create table if not exists public.subtopics (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references public.course_topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  order_index integer not null default 1,
  is_completed boolean default false not null,
  is_locked boolean default false not null,
  clarity_score integer default 0,
  estimated_retention integer default 100,
  days_until_revision integer default 7,
  conceptual_data jsonb,
  interactive_data jsonb,
  deep_revision_data jsonb,
  hard_quiz_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_topics enable row level security;
alter table public.subtopics enable row level security;

-- PROFILES RLS
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- COURSES RLS (Student A can only access Student A's courses)
create policy "Users can view own courses"
  on public.courses for select
  using (auth.uid() = user_id);

create policy "Users can insert own courses"
  on public.courses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own courses"
  on public.courses for update
  using (auth.uid() = user_id);

create policy "Users can delete own courses"
  on public.courses for delete
  using (auth.uid() = user_id);

-- COURSE TOPICS RLS
create policy "Users can view own course topics"
  on public.course_topics for select
  using (auth.uid() = user_id);

create policy "Users can insert own course topics"
  on public.course_topics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own course topics"
  on public.course_topics for update
  using (auth.uid() = user_id);

create policy "Users can delete own course topics"
  on public.course_topics for delete
  using (auth.uid() = user_id);

-- SUBTOPICS RLS
create policy "Users can view own subtopics"
  on public.subtopics for select
  using (auth.uid() = user_id);

create policy "Users can insert own subtopics"
  on public.subtopics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subtopics"
  on public.subtopics for update
  using (auth.uid() = user_id);

create policy "Users can delete own subtopics"
  on public.subtopics for delete
  using (auth.uid() = user_id);

-- 6. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if already exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
