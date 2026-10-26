import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../utils/apiRoot';
import SectionHead from '../components/SectionHead';

/**
 * District credit pooling.
 *
 * A couple of acres produces about a dozen credits a season, and nobody
 * buys a dozen credits. Farmers in the same district can register
 * interest in one lot here so the volume is worth a buyer's time.
 *
 * Joining records an interest inside this app. It is not a registration
 * with Verra, Gold Standard or any other carbon standard, and the card
 * says so plainly rather than implying otherwise.
 */
export default function CreditPoolCard() {
  const { user } = useAuth();
  const [state, setState]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    let alive = true;
    axios.get(`${API}/pools`)
      .then(res => { if (alive) setState(res.data); })
      .catch(err => { console.error('pools:', err); if (alive) setState(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  async function act(path) {
    setBusy(true);
    setError('');
    try {
      const res = await axios.post(`${API}/pools/${path}`, {});
      setState(s => ({ ...s, ...res.data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the pool');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner" /> Loading your district pool…</div>;
  }

  if (!state || !state.district) {
    return (
      <div className="bench-empty">
        <span aria-hidden="true">📍</span>{' '}
        {state?.message || 'Add your district to your profile to see the pool for your area.'}
      </div>
    );
  }

  const pool = state.pool;
  const mine = state.mine;
  const joined = pool?.joined;

  return (
    <div className="pool">
      <div className="pool-head">
        <div>
          <div className="pool-title">{state.district} district pool</div>
          <div className="pool-season">Season {state.season}</div>
        </div>
        {joined && <span className="pill pill-accepted">✓ You are in this pool</span>}
      </div>

      {pool ? (
        <>
          <div className="pool-bar" role="img"
            aria-label={`${pool.totalCredits} of ${pool.targetCredits} credits pooled`}>
            <div className="pool-fill" style={{ width: `${pool.progress}%` }} />
          </div>
          <div className="pool-stats">
            <span><strong>{pool.totalCredits}</strong> of {pool.targetCredits} credits pooled</span>
            <span>{pool.memberCount} {pool.memberCount === 1 ? 'farm' : 'farms'}</span>
            <span>{pool.totalCo2} t CO₂</span>
          </div>

          {pool.members.length > 0 && (
            <ul className="pool-members">
              {pool.members.slice(0, 8).map((m, i) => (
                <li key={i} className={m.isMe ? 'me' : ''}>
                  <span className="pm-name">{m.isMe ? 'You' : m.name}</span>
                  {m.village && <span className="pm-village">{m.village}</span>}
                  <span className="pm-credits">{m.credits} credits</span>
                </li>
              ))}
              {pool.members.length > 8 && (
                <li className="pm-more">+ {pool.members.length - 8} more</li>
              )}
            </ul>
          )}
        </>
      ) : (
        <p className="pool-empty">
          No pool has been started in {state.district} for this season. Joining starts
          one, and neighbouring farms can add theirs to it.
        </p>
      )}

      {mine && (
        <p className="pool-mine">
          You would bring <strong>{mine.credits} credits</strong> ({mine.co2} t CO₂) from{' '}
          {mine.calculations} saved {mine.calculations === 1 ? 'calculation' : 'calculations'}.
        </p>
      )}

      {error && <div className="alert alert-warning" style={{ marginTop: 10 }}>⚠️ {error}</div>}

      {user && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {joined ? (
            <>
              <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => act('join')}>
                🔄 Refresh my credits
              </button>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act('leave')}>
                Leave pool
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act('join')}>
              {busy ? 'Joining…' : '🤝 Join the district pool'}
            </button>
          )}
        </div>
      )}

      <p className="bench-basis">
        Joining records your interest inside AgriWaste Nexus so a district can approach
        buyers as one lot. It does not register credits with Verra, Gold Standard or any
        other carbon standard, and no credits are issued or sold here.
      </p>
    </div>
  );
}

export function CreditPoolSection() {
  return (
    <>
      <SectionHead
        icon="🤝"
        title="District credit pool"
        sub="Smallholder credits reach a sellable volume when a district goes together"
      />
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-body">
          <CreditPoolCard />
        </div>
      </div>
    </>
  );
}
