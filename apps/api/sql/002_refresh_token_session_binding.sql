ALTER TABLE refresh_tokens
ADD COLUMN IF NOT EXISTS session_id TEXT;

ALTER TABLE refresh_tokens
ADD COLUMN IF NOT EXISTS session_binding_hash TEXT;

ALTER TABLE refresh_tokens
ADD COLUMN IF NOT EXISTS device_label TEXT;

UPDATE refresh_tokens
SET session_id = COALESCE(session_id, encode(gen_random_bytes(16), 'hex')),
    session_binding_hash = COALESCE(NULLIF(session_binding_hash, ''), token_hash)
WHERE session_id IS NULL
   OR session_binding_hash IS NULL
   OR session_binding_hash = '';

ALTER TABLE refresh_tokens
ALTER COLUMN session_id SET NOT NULL;

ALTER TABLE refresh_tokens
ALTER COLUMN session_binding_hash SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_session
ON refresh_tokens (user_id, session_id);
