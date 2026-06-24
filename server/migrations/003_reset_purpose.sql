-- Step 9 hardening: password-reset flow. Reset codes live in the same
-- email_verifications table as signup codes, distinguished by `purpose` so the
-- two flows never read each other's codes. Existing rows default to 'signup'.
ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'signup' CHECK (purpose IN ('signup', 'reset'));
