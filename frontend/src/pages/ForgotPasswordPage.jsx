import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const STEP_LABEL = {
  1: 'Enter your registered email address',
  2: 'Enter the 6-digit code',
  3: 'Choose a new password',
};

export default function ForgotPasswordPage({ onSwitch }) {
  const { requestPasswordReset, verifyResetOtp, resetPassword } = useAuth();

  const [step, setStep]         = useState(1);
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [newPass, setNewPass]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);

  const [resetToken, setResetToken] = useState('');
  const [demoCode, setDemoCode]     = useState('');
  const [emailSent, setEmailSent]   = useState(false);

  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown for the "resend code" button
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleRequest(e) {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    const result = await requestPasswordReset(email.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      if (result.retryAfter) setCooldown(result.retryAfter);
      return;
    }

    setDemoCode(result.demoCode || '');
    setEmailSent(Boolean(result.emailSent));
    setNotice(result.message || '');
    setCooldown(60);
    setOtp('');
    setStep(2);
  }

  async function handleVerify(e) {
    if (e) e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyResetOtp({ email: email.trim(), otp: otp.trim() });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setResetToken(result.resetToken);
    setNotice('');
    setStep(3);
  }

  async function handleReset(e) {
    if (e) e.preventDefault();
    if (!newPass || newPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await resetPassword({ resetToken, newPassword: newPass });
    setLoading(false);

    if (result.success) setSuccess(true);
    else setError(result.error);
  }

  // ── Done ──────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout
        headline="Back in, safely"
        sub="Your password has been updated. Sign in to pick up where you left off."
      >
          <div className="auth-box" style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: '3.4rem', marginBottom: 12 }} aria-hidden="true">✅</div>
            <h2 className="auth-title">Password updated</h2>
            <p className="auth-subtitle" style={{ marginBottom: 22 }}>
              Sign in with your new password.
            </p>
            <button className="auth-btn" onClick={() => onSwitch('login')}>
              Go to Login →
            </button>
          </div>
      </AuthLayout>
    );
  }

  // ── Flow ──────────────────────────────────────────────────
  return (
    <AuthLayout
      headline="Reset your password"
      sub="We'll send a short code to the email address on your AgriWaste Nexus account, then you can choose a new password."
      aside={
        <div className="auth-quote">
          The code is checked on our server and expires after 10 minutes, so nobody
          else can use it to reach your farm data.
        </div>
      }
    >
        <div className="auth-box" style={{ maxWidth: 450 }}>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: '2.6rem' }} aria-hidden="true">🔑</span>
            <h2 className="auth-title" style={{ marginTop: 6 }}>Forgot password</h2>
            <p className="auth-subtitle">{STEP_LABEL[step]}</p>
          </div>

          {/* Step indicator */}
          <div className="reg-steps" style={{ marginBottom: 20 }}>
            {[
              { n: 1, label: 'Email' },
              { n: 2, label: 'Code' },
              { n: 3, label: 'New password' },
            ].map(s => (
              <div
                key={s.n}
                className={`reg-step ${step === s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}`}
              >
                <div className="rs-circle">{step > s.n ? '✓' : s.n}</div>
                <div className="rs-label">{s.label}</div>
              </div>
            ))}
          </div>

          {error && <div className="auth-error" role="alert">⚠️ {error}</div>}

          {/* ── Step 1 — email ── */}
          {step === 1 && (
            <form onSubmit={handleRequest}>
              <div className="auth-field">
                <label htmlFor="fp-email">Registered email address</label>
                <div className="field-wrap">
                <span className="field-icon" aria-hidden="true">✉️</span>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                />
                </div>
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : '📩 Send reset code'}
              </button>
            </form>
          )}

          {/* ── Step 2 — code ── */}
          {step === 2 && (
            <form onSubmit={handleVerify}>
              {demoCode && (
                <div className="alert alert-warning" style={{ display: 'block' }}>
                  <strong>Demo mode — email delivery is not configured.</strong>
                  <div style={{
                    fontSize: '1.7rem', fontWeight: 800, letterSpacing: 8,
                    textAlign: 'center', margin: '10px 0 4px', fontFamily: 'Syne, sans-serif',
                  }}>
                    {demoCode}
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    The server generated this code and will verify it. Set SMTP details in
                    the backend <code>.env</code> to email it instead.
                  </div>
                </div>
              )}

              {emailSent && notice && (
                <div className="alert alert-info">📧 {notice}</div>
              )}

              <div className="auth-field">
                <label htmlFor="fp-otp">6-digit code</label>
                <input
                  id="fp-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="000000"
                  maxLength={6}
                  style={{ letterSpacing: 10, fontSize: '1.3rem', textAlign: 'center', fontWeight: 700 }}
                />
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: 14 }}>
                Sent for <strong>{email}</strong> · expires in 10 minutes.{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => { setStep(1); setError(''); setNotice(''); setDemoCode(''); }}
                >
                  Change email
                </button>
              </p>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : '✅ Verify code'}
              </button>

              <button
                type="button"
                className="auth-btn-outline"
                style={{ width: '100%', marginTop: 10 }}
                disabled={loading || cooldown > 0}
                onClick={handleRequest}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : '↻ Resend code'}
              </button>
            </form>
          )}

          {/* ── Step 3 — new password ── */}
          {step === 3 && (
            <form onSubmit={handleReset}>
              <div className="auth-field">
                <label htmlFor="fp-new">New password</label>
                <div className="pass-wrap">
                  <input
                    id="fp-new"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setError(''); }}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    className="pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="fp-confirm">Confirm new password</label>
                <input
                  id="fp-confirm"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Re-enter password"
                />
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : '🔐 Reset password'}
              </button>
            </form>
          )}

          <p className="auth-switch" style={{ marginTop: 16 }}>
            Remember your password?{' '}
            <button className="auth-link" onClick={() => onSwitch('login')}>Back to Login</button>
          </p>

        </div>
    </AuthLayout>
  );
}
