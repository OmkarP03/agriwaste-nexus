import React from 'react';

/**
 * Header block at the top of a tool page: title, one-line
 * description and optional steps/meta on the right.
 */
export default function PageIntro({ icon, tone = 'green', title, description, meta }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span className={`card-icon ${tone}`} aria-hidden="true" style={{ width: 44, height: 44, fontSize: '1.3rem' }}>
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3 style={{ fontSize: '1.05rem' }}>{title}</h3>
          <p className="muted" style={{ fontSize: '0.82rem', marginTop: 3, lineHeight: 1.5 }}>{description}</p>
        </div>
        {meta}
      </div>
    </div>
  );
}
