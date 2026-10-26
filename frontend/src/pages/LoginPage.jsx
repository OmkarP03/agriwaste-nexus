import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatBot from '../components/ChatBot';
import AuthLayout from '../components/AuthLayout';
import { useLang } from '../context/LangContext';

const STATS = [
  { value: '500 MT', label: 'Crop residue yearly' },
  { value: '₹15K+',  label: 'Farmer income / acre' },
  { value: '60%',    label: 'Residue burned openly' },
];

export default function LoginPage({ onSwitch, onSuccess }) {
  const { t } = useLang();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError('Please fill all fields.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(form);
      if (result.success) onSuccess();
      else setError(result.error);
    } catch (err) {
      setError('Login failed');
    }
    setLoading(false);
  }

  async function demoLogin(role) {
    setLoading(true);

    const creds = role === 'farmer'
      ? { email: 'farmer@demo.com', password: '123456789' }
      : { email: 'buyer@demo.com', password: '123456789' };

    const result = await login(creds);

    if (result.success) onSuccess();
    else setError(result.error);

    setLoading(false);
  }

  return (
    <>
      <AuthLayout
        headline="Turn farm waste into clean energy and income"
        sub="Calculate your crop residue, estimate biogas and biochar, earn carbon credits and sell surplus to verified buyers."
        aside={
          <>
            <div className="auth-stats">
              {STATS.map(s => (
                <div className="auth-stat" key={s.label}>
                  <div className="as-value">{s.value}</div>
                  <div className="as-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="auth-quote">
              “Every tonne of residue you recover instead of burning is cleaner air
              for your village — and extra income for your farm.”
            </div>
          </>
        }
      >
        <div className="auth-box">
          <h2 className="auth-title">{t('welcomeBackAuth')}</h2>
          <p className="auth-subtitle">{t('loginSubtitle')}</p>

          {error && <div className="auth-error" role="alert">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">{t('emailAddress')}</label>
              <div className="field-wrap">
                <span className="field-icon" aria-hidden="true">✉️</span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="yourname@email.com"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">{t('password')}</label>
              <div className="pass-wrap">
                <span className="field-icon" aria-hidden="true">🔒</span>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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

            <div style={{ textAlign: 'right', marginBottom: 18 }}>
              <button type="button" className="auth-link" onClick={() => onSwitch('forgot')}>
                {t('forgotPassword')}
              </button>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : t('loginBtn')}
            </button>
          </form>

          <div className="auth-divider"><span>{t('orTryDemo')}</span></div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="demo-btn farmer" onClick={() => demoLogin('farmer')} disabled={loading}>
              {t('demoFarmer')}
            </button>
            <button className="demo-btn buyer" onClick={() => demoLogin('buyer')} disabled={loading}>
              {t('demoBuyer')}
            </button>
          </div>

          <p className="auth-switch">
            {t('noAccount')}{' '}
            <button className="auth-link" onClick={() => onSwitch('register')}>
              {t('registerHere')}
            </button>
          </p>
        </div>
      </AuthLayout>

      <ChatBot />
    </>
  );
}
