import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../utils/apiRoot';

/**
 * Saved fields, so crop / area / yield are entered once rather than on
 * every visit to every calculator.
 */
export default function PlotPicker({ form, onLoad }) {
  const [plots, setPlots] = useState([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await axios.get(`${API}/plots`);
      setPlots(res.data.plots || []);
    } catch { /* signed out or offline — the calculator still works */ }
  }

  async function save(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setMsg('');
    try {
      const res = await axios.post(`${API}/plots`, { ...form, name: name.trim() });
      setMsg(res.data.updated ? `Updated “${name.trim()}”` : `Saved “${name.trim()}”`);
      setName('');
      setOpen(false);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not save that plot.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(plot) {
    if (!window.confirm(`Delete the saved plot “${plot.name}”?`)) return;
    try {
      await axios.delete(`${API}/plots/${plot._id}`);
      load();
    } catch { /* ignore */ }
  }

  return (
    <div className="plot-bar">
      <div className="plot-bar-head">
        <span className="label" style={{ margin: 0 }}>Saved plots</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(!open)}>
          {open ? '✕ Cancel' : '＋ Save this field'}
        </button>
      </div>

      {plots.length === 0 && !open && (
        <p className="muted" style={{ fontSize: '0.78rem', margin: 0 }}>
          Save a field once and load it into any calculator later.
        </p>
      )}

      {plots.length > 0 && (
        <div className="chip-row">
          {plots.map(p => (
            <span className="plot-chip" key={p._id}>
              <button type="button" onClick={() => onLoad(p)} title={`Load ${p.name}`}>
                <strong>{p.name}</strong>
                <span className="muted"> · {p.cropType}, {p.area} {p.unit}</span>
              </button>
              <button
                type="button"
                className="plot-chip-x"
                onClick={() => remove(p)}
                aria-label={`Delete ${p.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="plot-save">
          <label className="sr-only" htmlFor="plot-name">Plot name</label>
          <input
            id="plot-name"
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              // Enter saves the plot — it must not submit the calculator
              if (e.key === 'Enter') { e.preventDefault(); save(); }
            }}
            placeholder="e.g. North field"
            maxLength={60}
          />
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <span className="muted" style={{ fontSize: '0.76rem' }}>
            {form.cropType}, {form.area} {form.unit}, {form.yieldPerAcre} t/{form.unit === 'hectares' ? 'ha' : 'acre'}
          </span>
        </div>
      )}

      {msg && <div className="muted" style={{ fontSize: '0.78rem' }}>{msg}</div>}
    </div>
  );
}
