DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_ksh');
  END IF;
END $$;

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS school_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type discount_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banner_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_label TEXT,
  cta_target TEXT NOT NULL DEFAULT 'ask_tutor',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS principal TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES school_discounts(id) ON DELETE SET NULL;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS assigned_plan_id UUID REFERENCES subscription_plans(id) ON DELETE RESTRICT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'not_specified',
  ADD COLUMN IF NOT EXISTS grade_level TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET onboarding_completed = TRUE
WHERE onboarding_completed = FALSE;

UPDATE schools
SET assigned_plan_id = (
  SELECT id
  FROM subscription_plans
  WHERE code = 'monthly'
  LIMIT 1
)
WHERE assigned_plan_id IS NULL;

ALTER TABLE schools
  ALTER COLUMN assigned_plan_id SET NOT NULL;

INSERT INTO subscription_plans (
  id,
  code,
  name,
  billing_cycle,
  price_ksh_cents,
  is_pro,
  is_hidden
)
VALUES (
  '30000000-0000-0000-0000-000000000099',
  'trial_monthly_1bob',
  'Try for 1 Bob',
  'monthly',
  100,
  TRUE,
  TRUE
)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  billing_cycle = EXCLUDED.billing_cycle,
  price_ksh_cents = EXCLUDED.price_ksh_cents,
  is_pro = EXCLUDED.is_pro,
  is_hidden = EXCLUDED.is_hidden;

CREATE INDEX IF NOT EXISTS idx_schools_assigned_plan_id ON schools(assigned_plan_id);
CREATE INDEX IF NOT EXISTS idx_schools_discount_id ON schools(discount_id);
CREATE INDEX IF NOT EXISTS idx_banner_announcements_active_window
  ON banner_announcements(is_active, starts_at, ends_at);
