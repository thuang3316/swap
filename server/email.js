// Email delivery for verification codes. Dev-mock first: when not in production
// (or no RESEND_API_KEY), the code is logged to the server console so signup
// can be built/tested without an email provider. See .claude/skills/email-verification.
import { Resend } from 'resend';

const isProd = process.env.NODE_ENV === 'production';

// The verified sender. Must be an address on a domain you've verified in Resend
// (e.g. "Swap <noreply@mail.hereweswap.com>"). Set EMAIL_FROM in prod; the
// resend.dev fallback only delivers to the Resend account owner, so it's for
// local/testing only.
const FROM = process.env.EMAIL_FROM || 'Swap <onboarding@resend.dev>';

// purpose: 'signup' (verify a new account) or 'reset' (password reset) — only
// changes the wording of the email; the delivery path is identical.
export async function deliverCode(email, code, purpose = 'signup') {
  // Dev (or any non-prod): log the code to the server console so the flows can
  // be built/tested without an email provider.
  if (!isProd) {
    console.log(`\n[dev] ${purpose} code for ${email}: ${code}\n`);
    return;
  }
  // Production must actually send. If the key is missing, fail loudly rather
  // than silently console-logging and returning 200 (which would make the flow
  // look successful while no email is ever delivered).
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set — cannot send verification email in production.');
  }
  const subject =
    purpose === 'reset' ? 'Reset your Swap password' : 'Your Swap verification code';
  const intro =
    purpose === 'reset'
      ? 'Use this code to reset your Swap password'
      : 'Your verification code';
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html: `<p>${intro}: <strong style="font-size:20px">${code}</strong>.</p>
           <p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}
