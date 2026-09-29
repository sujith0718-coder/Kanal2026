-- StudyAI — Adaptive Academic Planner Database Schema
-- Compatible with Supabase PostgreSQL & Row Level Security (RLS)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE difficulty_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE mastery_status AS ENUM ('UNKNOWN', 'LOW', 'MEDIUM', 'HIGH');
CREATE TYPE verification_status AS ENUM ('UNVERIFIED', 'VERIFIED', 'NEEDS_REVIEW');
CREATE TYPE document_processing_state AS ENUM ('uploaded', 'processing', 'processed', 'failed');
CREATE TYPE energy_time_block AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT');
CREATE TYPE session_status AS ENUM ('PLANNED', 'COMPLETED', 'MISSED', 'SKIPPED');
CREATE TYPE plan_trigger AS ENUM ('INITIAL_PLAN', 'SESSION_MISSED', 'ACADEMIC_CHANGE', 'MANUAL_REPLAN');
CREATE TYPE change_type AS ENUM ('MOVED', 'SPLIT', 'DEFERRED', 'PROTECTED', 'REMOVED');
CREATE TYPE plan_status AS ENUM ('ACTIVE', 'ARCHIVED');

-- 3. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  daily_capacity_minutes INT NOT NULL DEFAULT 240, -- 4 hours default
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT,
  difficulty difficulty_level NOT NULL DEFAULT 'MEDIUM',
  estimated_mastery INT NOT NULL DEFAULT 0, -- 0 to 100
  mastery_status mastery_status NOT NULL DEFAULT 'UNKNOWN',
  estimated_minutes_required INT NOT NULL DEFAULT 90,
  completed_minutes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  processing_state document_processing_state NOT NULL DEFAULT 'uploaded',
  extracted_exams_count INT DEFAULT 0,
  extracted_topics_count INT DEFAULT 0,
  extracted_events_count INT DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  source_page INT,
  confidence FLOAT DEFAULT 1.0,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ACADEMIC EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.academic_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'EXAM',
  date DATE NOT NULL,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ENERGY PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.energy_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  time_block energy_time_block NOT NULL,
  energy_level difficulty_level NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PLAN VERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.plan_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  trigger plan_trigger NOT NULL DEFAULT 'INITIAL_PLAN',
  status plan_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  energy_requirement difficulty_level NOT NULL DEFAULT 'MEDIUM',
  status session_status NOT NULL DEFAULT 'PLANNED',
  actual_duration INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. PLAN CHANGES TABLE
CREATE TABLE IF NOT EXISTS public.plan_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  change_type change_type NOT NULL,
  description TEXT NOT NULL,
  old_session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
  new_session_ids JSONB,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MASTERY STATES TABLE
CREATE TABLE IF NOT EXISTS public.mastery_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  status mastery_status NOT NULL DEFAULT 'UNKNOWN',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 15. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  study_session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT
);

-- 17. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INT NOT NULL,
  correct_answers_count INT NOT NULL,
  total_questions INT NOT NULL,
  user_answers JSONB NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON public.exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON public.exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON public.study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_plan_version ON public.study_sessions(plan_version_id);
CREATE INDEX IF NOT EXISTS idx_plan_versions_user_id ON public.plan_versions(user_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Users can access only their own data)
CREATE POLICY "Users can access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can access own subjects" ON public.subjects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access topics of their subjects" ON public.topics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = topics.subject_id AND subjects.user_id = auth.uid())
);
CREATE POLICY "Users can access own documents" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own exams" ON public.exams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = exams.subject_id AND subjects.user_id = auth.uid())
);
CREATE POLICY "Users can access own academic events" ON public.academic_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own availability" ON public.availability FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own energy preferences" ON public.energy_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own plan versions" ON public.plan_versions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own study sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own plan changes" ON public.plan_changes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.plan_versions WHERE plan_versions.id = plan_changes.plan_version_id AND plan_versions.user_id = auth.uid())
);
CREATE POLICY "Users can access own mastery states" ON public.mastery_states FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own quiz attempts" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);
