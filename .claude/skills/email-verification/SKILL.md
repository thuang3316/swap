---
name: email-verification
description: Use when building the signup email-verification flow — generating and emailing a verification code, storing/expiring it, and verifying it before account creation. The repo owner has not built this before, so explain the flow and keep it simple; covers a Resend-based email path and a local-dev mock.
---

# Email verification on signup

Goal: prove the user controls the email they signed up with, before the account becomes usable. Same email can't be used twice (enforced by the unique constraint in `neon-postgres-schema`).

## The flow (mental model)

1. User submits email (+ desired username/password) on the Sign-up form.
2. Server checks the email isn't already a verified user → generates a **6-digit code** → stores it in `email_verifications` with a short **expiry** (e.g. 10 min) → **emails the code**.
3. User receives the email, enters the code in the UI.
4. Server looks up the code for that email, checks it matches and isn't expired → creates the user (`email_verified = true`) and logs them in (issue cookie, see `auth-jwt-cookies`).
5. Clean up used/expired codes.

Two valid sequencings:
- **Verify-before-create** (recommended): hold the signup details until the code is confirmed, then INSERT the user. Avoids unverified rows.
- **Create-then-verify**: INSERT user with `email_verified=false`, flip it true on success. Simpler state machine; needs a sweep for stale unverified accounts.

## Sending the email — Resend (suggested)

Resend has a generous free tier and a tiny API. Sign up, verify a sending domain (or use their onboarding `onboarding@resend.dev` for testing), put `RESEND_API_KEY` in env.

```js
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCode(email, code) {
  await resend.emails.send({
    from: 'Marketplace <noreply@yourdomain.com>', // or onboarding@resend.dev while testing
    to: email,
    subject: 'Your verification code',
    html: `<p>Your code is <strong style="font-size:20px">${code}</strong>. It expires in 10 minutes.</p>`,
  });
}
```

Alternatives: SendGrid, Postmark, Mailgun, or Nodemailer + SMTP — same flow, different `send` call.

## Local-dev mock (don't fight email while building the form)

While developing the signup UX, skip real email: log the code to the server console (or return it in the response **only when `NODE_ENV !== 'production'`**). This lets you build and test routes 2/3 without an email provider, then swap in Resend.

```js
async function deliverCode(email, code) {
  if (process.env.NODE_ENV === 'production') return sendCode(email, code);
  console.log(`[dev] verification code for ${email}: ${code}`);
}
```

## Code generation & storage

```js
import crypto from 'node:crypto';
const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0'); // 000000–999999

// store a HASH of the code (so a DB leak doesn't reveal live codes), with expiry
const codeHash = crypto.createHash('sha256').update(code).digest('hex');
// INSERT INTO email_verifications (email, code, expires_at)
//   VALUES (${email}, ${codeHash}, now() + interval '10 minutes')
```

## Verify endpoint

```js
// POST /api/auth/verify  { email, code }
const hash = crypto.createHash('sha256').update(code).digest('hex');
const [row] = await sql`
  SELECT * FROM email_verifications
  WHERE email = ${email} AND code = ${hash} AND expires_at > now()
  ORDER BY created_at DESC LIMIT 1`;
if (!row) return res.status(400).json({ error: 'Invalid or expired code' });
// create the user (or flip email_verified), then:
await sql`DELETE FROM email_verifications WHERE email = ${email}`;
issue(res, user); // log them in
```

## Hardening (good to have)

- **Rate-limit** code requests per email/IP so it can't be used to spam-send.
- **Expire & sweep** old codes (the `expires_at` check handles use; a periodic delete keeps the table small).
- **Don't reveal** whether an email already exists in error messages beyond what's necessary.
- Limit verify attempts per code to deter brute force (6 digits = 1M space; with 10-min expiry + a few attempts it's fine).

Related: [[auth-jwt-cookies]], [[neon-postgres-schema]], [[express-vercel-api]].
