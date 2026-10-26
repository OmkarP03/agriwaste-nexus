import React from 'react';

/**
 * Compact KPI tile: icon, label, large number, unit, optional note.
 */
export default function KpiCard({ icon, tone = 'green', label, value, unit, note, noteTone }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span className={`kpi-icon ${tone}`} aria-hidden="true">{icon}</span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {note && <div className={`kpi-note${noteTone ? ' ' + noteTone : ''}`}>{note}</div>}
    </div>
  );
}
