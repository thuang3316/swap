// Shared account + email-verification helpers, used by both the auth routes
// (signup/verify) and the profile-edit route (/api/me/profile). Centralizes the
// password blocklist and the verification-code lifecycle so they stay in sync.
import crypto from 'node:crypto';
import { sql } from './db.js';
import { deliverCode } from './email.js';

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_VERIFY_ATTEMPTS = 5; // wrong guesses before a code is invalidated

export const hashCode = (c) => crypto.createHash('sha256').update(c).digest('hex');
export const genCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

// Reject the most common breached passwords (these trigger browser
// leaked-password warnings and are trivially guessable). A small blocklist is
// proportionate for v1; a full Have I Been Pwned k-anonymity check is a future option.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd', '123456', '1234567', '12345678',
  '123456789', '1234567890', '12345', '123123', '111111', '000000', 'qwerty', 'qwerty123',
  'abc123', 'letmein', 'admin', 'welcome', 'iloveyou', 'monkey', 'dragon', 'sunshine',
  'princess', 'football', 'baseball', 'starwars', 'whatever', 'trustno1',
]);
export const isCommonPassword = (pw) => COMMON_PASSWORDS.has(pw.toLowerCase());

// Issue a fresh code for an email and deliver it. `purpose` is 'signup' (verify
// a new account) or 'reset' (password reset) — kept separate so the two flows
// never consume each other's codes. In dev (or with no RESEND_API_KEY)
// deliverCode just logs the code to the server console.
export async function createAndSendCode(email, purpose = 'signup') {
  const code = genCode();
  const expires = new Date(Date.now() + CODE_TTL_MS);
  await sql`INSERT INTO email_verifications (email, code, expires_at, purpose) VALUES (${email}, ${hashCode(code)}, ${expires}, ${purpose})`;
  await deliverCode(email, code, purpose);
}

// Check a submitted code against the newest unexpired code for (email, purpose),
// bounding brute force. Shared by /verify and /reset so both stay in sync.
// Returns { ok: true } when it matches (the caller performs its action and
// should then delete the consumed codes), or { ok: false, status, error }.
export async function checkCode(email, code, purpose) {
  const [pending] = await sql`
    SELECT id, code, attempts FROM email_verifications
    WHERE email = ${email} AND purpose = ${purpose} AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1`;
  if (!pending) return { ok: false, status: 400, error: 'Invalid or expired code' };

  if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
    await sql`DELETE FROM email_verifications WHERE email = ${email} AND purpose = ${purpose}`;
    return { ok: false, status: 429, error: 'Too many incorrect attempts — please request a new code' };
  }
  if (pending.code !== hashCode(code)) {
    await sql`UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ${pending.id}`;
    return { ok: false, status: 400, error: 'Invalid or expired code' };
  }
  return { ok: true };
}
