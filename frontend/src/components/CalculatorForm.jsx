import React, { useState } from 'react';
import { runLocalCalculation } from '../utils/api';
import { API_ROOT } from '../utils/apiRoot';
import PlotPicker from './PlotPicker';
import VoiceInput from './VoiceInput';
import { useLang } from '../context/LangContext';

const CROPS = ['rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'soybean'];

export default function CalculatorForm({
  onResults,
  title,
  subtitle,
  submitLabel,
}) {
  const { t } = useLang();
  const [form, setForm] = useState({ cropType: 'rice', area: 2, yieldPerAcre: 3, unit: 'acres' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let result;
      try {
        const res = await fetch(`${API_ROOT}/api/calculator/full`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, area: +form.area, yieldPerAcre: +form.yieldPerAcre }),
        });
        if (!res.ok) throw new Error('Backend unavailable');
        const data = await res.json();
        result = data.result;
      } catch {
        // Fallback: run calculation locally in the browser
        result = runLocalCalculation({ ...form, area: +form.area, yieldPerAcre: +form.yieldPerAcre });
      }
      onResults(result, form);
    } catch (err) {
      setError(t('calcFailed'));
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setForm({ cropType: 'rice', area: 2, yieldPerAcre: 3, unit: 'acres' });
  }

  // Load a saved field straight into the form
  function loadPlot(plot) {
    setForm({
      cropType: plot.cropType,
      area: plot.area,
      unit: plot.unit || 'acres',
      yieldPerAcre: plot.yieldPerAcre,
    });
    setError('');
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon green" aria-hidden="true">🌾</div>
        <div>
          <div className="card-title">{title || t('farmDetails')}</div>
          <div className="card-subtitle">{subtitle || t('farmDetailsSubtitle')}</div>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm push"
          onClick={loadSample}
        >
          {t('loadSampleData')}
        </button>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-warning" role="alert">
            <span aria-hidden="true">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="cropType">{t('cropType')}</label>
              <select id="cropType" name="cropType" value={form.cropType} onChange={handleChange}>
                {CROPS.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="area">{t('landArea')}</label>
              <input
                id="area" type="number" name="area" value={form.area}
                min="0.1" step="0.1" onChange={handleChange} required
              />
              <VoiceInput
                numeric
                label="Say your land area"
                onResult={v => setForm(f => ({ ...f, area: v }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">{t('areaUnit')}</label>
              <select id="unit" name="unit" value={form.unit} onChange={handleChange}>
                <option value="acres">{t('acres')}</option>
                <option value="hectares">{t('hectares')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="yieldPerAcre">
                {form.unit === 'hectares' ? t('yieldPerHectare') : t('yieldPerAcre')}
              </label>
              <input
                id="yieldPerAcre" type="number" name="yieldPerAcre" value={form.yieldPerAcre}
                min="0.1" step="0.1" onChange={handleChange} required
              />
              <VoiceInput
                numeric
                label="Say your yield per acre"
                onResult={v => setForm(f => ({ ...f, yieldPerAcre: v }))}
              />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><span className="auth-spinner" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} /> {t('calculating')}</>
                : <><span aria-hidden="true">🔬</span> {submitLabel || t('calculateNow')}</>}
            </button>
          </div>
        </form>

        {/* Outside the form above — a nested <form> is invalid HTML and
            the browser drops it, which would make Save run the calculator. */}
        <PlotPicker form={form} onLoad={loadPlot} />
      </div>
    </div>
  );
}
