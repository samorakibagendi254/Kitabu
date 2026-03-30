CREATE TABLE IF NOT EXISTS curriculum_strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  number TEXT,
  title TEXT NOT NULL,
  sub_title TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (grade_level, subject_id, position)
);

CREATE TABLE IF NOT EXISTS curriculum_sub_strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strand_id UUID NOT NULL REFERENCES curriculum_strands(id) ON DELETE CASCADE,
  number TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'knowledge',
  description TEXT,
  position INTEGER NOT NULL,
  outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  inquiry_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  lesson_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (strand_id, position)
);

CREATE TABLE IF NOT EXISTS user_curriculum_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_strand_id UUID NOT NULL REFERENCES curriculum_sub_strands(id) ON DELETE CASCADE,
  quiz_score NUMERIC(5,2),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, sub_strand_id)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_strands_grade_subject
  ON curriculum_strands (grade_level, subject_id, position);

CREATE INDEX IF NOT EXISTS idx_curriculum_sub_strands_strand
  ON curriculum_sub_strands (strand_id, position);

CREATE INDEX IF NOT EXISTS idx_user_curriculum_progress_user
  ON user_curriculum_progress (user_id, completed_at DESC);
