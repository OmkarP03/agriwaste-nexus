import React from 'react';

/**
 * Consistent section heading used across the app.
 * Keeps vertical rhythm and visual hierarchy uniform.
 */
export default function SectionHead({ icon, title, sub, action, id }) {
  return (
    <div className="section-head">
      <div>
        <h3 id={id}>
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </h3>
        {sub && <div className="section-sub">{sub}</div>}
      </div>
      {action}
    </div>
  );
}
