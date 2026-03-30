ALTER TABLE assignments
  ALTER COLUMN class_id DROP NOT NULL;

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS grade_level TEXT NOT NULL DEFAULT 'Grade 8',
  ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  grade_level TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  spine_color TEXT NOT NULL DEFAULT '#2563EB',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  height TEXT NOT NULL DEFAULT 'h36',
  spine_pattern TEXT NOT NULL DEFAULT 'plain',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  grade_level TEXT,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'audio',
  duration TEXT NOT NULL DEFAULT '05:00',
  views TEXT NOT NULL DEFAULT '0',
  published_on DATE NOT NULL DEFAULT CURRENT_DATE,
  author TEXT NOT NULL DEFAULT 'Kitabu',
  thumbnail_url TEXT,
  media_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_school_grade_teacher
  ON assignments (school_id, grade_level, teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_student
  ON submissions (assignment_id, student_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_assignment_student_unique
  ON submissions (assignment_id, student_id);

CREATE INDEX IF NOT EXISTS idx_library_books_scope
  ON library_books (school_id, grade_level, is_active, position);

CREATE INDEX IF NOT EXISTS idx_learning_podcasts_scope
  ON learning_podcasts (school_id, grade_level, is_active, position);

INSERT INTO library_books (
  id,
  school_id,
  grade_level,
  title,
  author,
  spine_color,
  text_color,
  height,
  spine_pattern,
  position,
  is_active
)
SELECT
  v.id,
  NULL,
  v.grade_level,
  v.title,
  v.author,
  v.spine_color,
  v.text_color,
  v.height,
  v.spine_pattern,
  v.position,
  TRUE
FROM (
  VALUES
    ('81000000-0000-0000-0000-000000000001'::uuid, 'Grade 8', 'The River Between', 'Ngugi wa Thiong''o', '#2563EB', '#FFFFFF', 'h36', 'plain', 1),
    ('81000000-0000-0000-0000-000000000002'::uuid, 'Grade 8', 'Kenya Science Revision', 'Kitabu Learning', '#059669', '#F8FAFC', 'h32', 'banded', 2),
    ('81000000-0000-0000-0000-000000000003'::uuid, 'Grade 8', 'CBC Mathematics Practice', 'Kitabu Learning', '#7C3AED', '#FFFFFF', 'h40', 'striped', 3),
    ('81000000-0000-0000-0000-000000000004'::uuid, 'Grade 7', 'Stories From East Africa', 'Kitabu Learning', '#EA580C', '#FFF7ED', 'h36', 'plain', 4)
) AS v(id, grade_level, title, author, spine_color, text_color, height, spine_pattern, position)
WHERE NOT EXISTS (
  SELECT 1
  FROM library_books existing
  WHERE existing.id = v.id
);

INSERT INTO learning_podcasts (
  id,
  school_id,
  grade_level,
  title,
  subject,
  type,
  duration,
  views,
  published_on,
  author,
  thumbnail_url,
  media_url,
  position,
  is_active
)
SELECT
  v.id,
  NULL,
  v.grade_level,
  v.title,
  v.subject,
  v.type,
  v.duration,
  v.views,
  v.published_on,
  v.author,
  v.thumbnail_url,
  v.media_url,
  v.position,
  TRUE
FROM (
  VALUES
    ('82000000-0000-0000-0000-000000000001'::uuid, 'Grade 8', 'Fractions in real life', 'Mathematics', 'audio', '08:20', '1.2k', CURRENT_DATE, 'Teacher Amina', 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=300&h=300&fit=crop', 'https://kitabu.ai/podcasts/fractions', 1),
    ('82000000-0000-0000-0000-000000000002'::uuid, 'Grade 8', 'Energy around us', 'Science', 'video', '12:05', '980', CURRENT_DATE, 'Teacher Brian', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&h=300&fit=crop', 'https://kitabu.ai/podcasts/energy', 2),
    ('82000000-0000-0000-0000-000000000003'::uuid, 'Grade 7', 'Better composition openings', 'English', 'audio', '06:40', '640', CURRENT_DATE, 'Teacher Njeri', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=300&fit=crop', 'https://kitabu.ai/podcasts/composition-openings', 3)
) AS v(id, grade_level, title, subject, type, duration, views, published_on, author, thumbnail_url, media_url, position)
WHERE NOT EXISTS (
  SELECT 1
  FROM learning_podcasts existing
  WHERE existing.id = v.id
);
