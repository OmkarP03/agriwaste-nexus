import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../utils/apiRoot';
import SectionHead from '../components/SectionHead';
import { inr } from '../utils/media';

/**
 * How this farm compares with its neighbours.
 *
 * "24 tons of CO2 avoided" is a number without a reference point. The
 * same figure next to the district average is the line that makes a
 * farmer come back. Everything here comes from calculations users of
 * this app saved — the component says so rather than implying it is a
 * district-wide survey.
 */
export default function DistrictBenchmark({ district }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const qs = district ? `?district=${encodeURIComponent(district)}` : '';
    axios.get(`${API}/stats/district${qs}`)
      .then(res => { if (alive) setData(res.data); })
      .catch(err => { console.error('district stats:', err); if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [district]);

  if (loading) {
    return (
      <div className="loading" aria-live="polite">
        <div className="spinner" /> Comparing with your district…
      </div>
    );
  }

  // No district on the profile, or nobody to compare with yet
  if (!data || !data.district || !data.farms) {
    return (
      <div className="bench-empty">
        <span aria-hidden="true">📍</span>{' '}
        {data && data.message
          ? data.message
          : 'Not enough saved calculations in your district yet to compare. Yours will be counted as neighbours join.'}
      </div>
    );
  }

  const you = data.you;
  const avg = data.averages;
  const scale = Math.max(data.best || 0, you ? you.co2 : 0, avg.co2) || 1;
  const pct = (v) => Math.max(2, Math.round((v / scale) * 100));

  return (
    <div className="bench">
      <div className="bench-bars">
        {you && (
          <div className="bench-row">
            <span className="bench-label">You</span>
            <div className="bench-track">
              <div className="bench-fill you" style={{ width: `${pct(you.co2)}%` }} />
            </div>
            <span className="bench-num">{you.co2} t</span>
          </div>
        )}
        <div className="bench-row">
          <span className="bench-label">District average</span>
          <div className="bench-track">
            <div className="bench-fill avg" style={{ width: `${pct(avg.co2)}%` }} />
          </div>
          <span className="bench-num">{avg.co2} t</span>
        </div>
        <div className="bench-row">
          <span className="bench-label">Best in district</span>
          <div className="bench-track">
            <div className="bench-fill best" style={{ width: `${pct(data.best)}%` }} />
          </div>
          <span className="bench-num">{data.best} t</span>
        </div>
      </div>

      <p className="bench-verdict">
        {you && you.percentile !== null && you.percentile !== undefined ? (
          <>
            Your {you.co2} t of CO₂ avoided is ahead of <strong>{you.percentile}%</strong> of the{' '}
            {data.farms} farms with saved calculations in {data.district}.
          </>
        ) : you ? (
          <>You are the first farm in {data.district} with a saved calculation.</>
        ) : (
          <>
            {data.farms} farms in {data.district} have saved calculations, avoiding{' '}
            <strong>{data.totals.co2} t</strong> of CO₂ between them. Save a calculation to
            see where you stand.
          </>
        )}
      </p>

      <div className="bench-foot">
        <span>🌍 {data.totals.co2} t CO₂ district total</span>
        <span>🏅 {data.totals.credits} credits</span>
        <span>💰 {inr(data.totals.income)} potential value</span>
      </div>

      <p className="bench-basis">{data.basis}</p>
    </div>
  );
}

export function DistrictBenchmarkSection({ district }) {
  return (
    <>
      <SectionHead
        icon="📍"
        title="How you compare locally"
        sub="Your impact next to other AgriWaste Nexus farms in your district"
      />
      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-body">
          <DistrictBenchmark district={district} />
        </div>
      </div>
    </>
  );
}
