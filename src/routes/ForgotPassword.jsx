import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const isDev = import.meta.env.DEV;

export function ForgotPassword() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('request'); // 'request' → 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setError('');
    setSubmitting(true);
    try {
      // Always succeeds (generic response) so we don't reveal whether the email
      // is registered. Move to the code step regardless.
      await api('/auth/forgot', { method: 'POST', body: { email: email.trim() } });
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Enter the 6-digit code.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { user } = await api('/auth/reset', {
        method: 'POST',
        body: { email: email.trim(), code: code.trim(), password },
      });
      setUser(user); // reset also logs us in
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'reset') {
    return (
      <div className="max-w-6xl mx-auto px-5 py-16">
        <form className="auth-card" onSubmit={submitReset} noValidate>
          <span className="eyebrow">Reset password</span>
          <h1 className="text-3xl mt-2 mb-2">Choose a new password</h1>
          <p className="text-sm text-ink-soft mb-6">
            If an account exists for <strong>{email}</strong>, we sent it a 6-digit code.
            Enter it with your new password.
          </p>

          {error && <p className="field-error mb-4">{error}</p>}

          <div className="mb-4">
            <label className="label" htmlFor="code">Verification code</label>
            <input id="code" className="input tracking-[0.4em] text-center font-mono" inputMode="numeric"
                   maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                   placeholder="000000" />
          </div>

          <div className="mb-4">
            <label className="label" htmlFor="password">New password</label>
            <input id="password" className="input" type="password" autoComplete="new-password"
                   value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>

          <div className="mb-6">
            <label className="label" htmlFor="confirm">Confirm new password</label>
            <input id="confirm" className="input" type="password" autoComplete="new-password"
                   value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your new password" />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>

          {isDev && (
            <p className="form-note mt-5">
              Dev mode: the code is printed in the API server console (no email is sent).
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-16">
      <form className="auth-card" onSubmit={submitRequest} noValidate>
        <span className="eyebrow">Forgot password</span>
        <h1 className="text-3xl mt-2 mb-2">Reset your password</h1>
        <p className="text-sm text-ink-soft mb-6">
          Enter your email and we'll send you a code to set a new password.
        </p>

        {error && <p className="field-error mb-4">{error}</p>}

        <div className="mb-6">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email"
                 value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset code'}
        </button>

        <p className="text-sm text-ink-soft mt-5 text-center">
          Remembered it? <Link to="/login" className="text-grape font-semibold">Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}
