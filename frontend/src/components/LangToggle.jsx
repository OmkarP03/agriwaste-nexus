import React, { useState } from 'react';
import { useLang } from '../context/LangContext';

// No flag emoji: Windows renders regional-indicator pairs as bare
// letters ("GB"), which looks like a broken glyph. A globe plus the
// language's own name is clearer and works on every platform.
const LANGS = [
  { code: 'en', short: 'EN', full: 'English' },
  { code: 'hi', short: 'हि', full: 'हिंदी' },
  { code: 'mr', short: 'मर', full: 'मराठी' },
];

export default function LangToggle() {
  const { lang, changeLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGS.find(l => l.code === lang) || LANGS[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.full}. Change language`}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 13px',
          background: 'var(--surface)',
          color: 'var(--green-800)',
          border: '1.5px solid var(--line)',
          borderRadius: 'var(--radius-pill)',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 700,
          fontFamily: 'var(--font-text)',
          transition: 'border-color 0.18s, background 0.18s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-400)'; e.currentTarget.style.background = 'var(--green-50)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--surface)'; }}
      >
        <span aria-hidden="true" style={{ fontSize: '0.9rem' }}>🌐</span>
        <span>{current.short}</span>
        <span aria-hidden="true" style={{ fontSize: '0.55rem', opacity: 0.55 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 298 }} onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label="Language"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 299,
              overflow: 'hidden',
              minWidth: 168,
            }}
          >
            <div style={{
              padding: '9px 14px',
              fontSize: '0.64rem',
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 700,
              borderBottom: '1px solid var(--line-soft)',
            }}>
              Language / भाषा
            </div>

            {LANGS.map(l => {
              const active = lang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { changeLang(l.code); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    background: active ? 'var(--green-50)' : 'transparent',
                    border: 'none',
                    borderLeft: `3px solid ${active ? 'var(--green-600)' : 'transparent'}`,
                    cursor: 'pointer',
                    fontSize: '0.87rem',
                    fontFamily: 'var(--font-text)',
                    color: active ? 'var(--green-800)' : 'var(--gray-700)',
                    fontWeight: active ? 700 : 500,
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 800,
                    width: 26, textAlign: 'center',
                    color: active ? 'var(--green-700)' : 'var(--ink-soft)',
                  }}>
                    {l.short}
                  </span>
                  <span>{l.full}</span>
                  {active && <span style={{ marginLeft: 'auto', color: 'var(--green-600)' }} aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
