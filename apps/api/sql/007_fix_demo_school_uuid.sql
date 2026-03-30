DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM schools
    WHERE id = '11111111-1111-1111-1111-111111111111'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM schools
      WHERE id = '11111111-1111-4111-8111-111111111111'
    ) THEN
      UPDATE schools
      SET slug = slug || '-legacy-invalid-id'
      WHERE id = '11111111-1111-1111-1111-111111111111'
        AND slug = 'kitabu-demo-school';

    INSERT INTO schools (
      id,
      name,
      slug,
      status,
      created_at,
      location,
      principal,
      phone,
      email,
      discount_id,
      assigned_plan_id
    )
    SELECT
      '11111111-1111-4111-8111-111111111111',
      name,
      'kitabu-demo-school',
      status,
      created_at,
      location,
      principal,
      phone,
      email,
      discount_id,
      assigned_plan_id
    FROM schools
    WHERE id = '11111111-1111-1111-1111-111111111111';
    END IF;

    UPDATE users
    SET school_id = '11111111-1111-4111-8111-111111111111'
    WHERE school_id = '11111111-1111-1111-1111-111111111111';

    UPDATE classes
    SET school_id = '11111111-1111-4111-8111-111111111111'
    WHERE school_id = '11111111-1111-1111-1111-111111111111';

    UPDATE assignments
    SET school_id = '11111111-1111-4111-8111-111111111111'
    WHERE school_id = '11111111-1111-1111-1111-111111111111';

    UPDATE ai_usage_events
    SET school_id = '11111111-1111-4111-8111-111111111111'
    WHERE school_id = '11111111-1111-1111-1111-111111111111';

    UPDATE audit_logs
    SET school_id = '11111111-1111-4111-8111-111111111111'
    WHERE school_id = '11111111-1111-1111-1111-111111111111';

    DELETE FROM schools
    WHERE id = '11111111-1111-1111-1111-111111111111';
  END IF;
END $$;
