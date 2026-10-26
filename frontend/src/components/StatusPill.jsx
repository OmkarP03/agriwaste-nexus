import React from 'react';

const MAP = {
  available: { cls: 'pill-available', icon: '●', label: 'Available' },
  reserved:  { cls: 'pill-reserved',  icon: '◐', label: 'Reserved' },
  sold:      { cls: 'pill-sold',      icon: '■', label: 'Sold' },
  pending:   { cls: 'pill-pending',   icon: '◷', label: 'Pending' },
  accepted:  { cls: 'pill-accepted',  icon: '✓', label: 'Accepted' },
  rejected:  { cls: 'pill-rejected',  icon: '✕', label: 'Rejected' },
  completed: { cls: 'pill-completed', icon: '★', label: 'Completed' },
};

/**
 * Status is shown with a shape/letter AND a colour, so it never
 * relies on colour alone.
 */
export default function StatusPill({ status }) {
  const key = String(status || '').toLowerCase();
  const s = MAP[key] || { cls: 'pill-neutral', icon: '•', label: status || 'Unknown' };
  return (
    <span className={`pill ${s.cls}`}>
      <span aria-hidden="true">{s.icon}</span>
      {s.label}
    </span>
  );
}
