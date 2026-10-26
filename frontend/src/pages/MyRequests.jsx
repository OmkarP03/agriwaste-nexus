import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../utils/apiRoot';
import RequestThread from '../components/RequestThread';
import SectionHead from '../components/SectionHead';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import KpiCard from '../components/KpiCard';
import { IMG, inr } from '../utils/media';

export default function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [openThread, setOpenThread] = useState(null);

  useEffect(() => { loadRequests(); /* eslint-disable-next-line */ }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/requests/buyer/${user._id}`);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  // What the request is worth per ton right now
  const livePrice = (r) =>
    r.agreedPricePerTon ?? r.counterPricePerTon ?? r.offeredPricePerTon ?? r.listedPricePerTon ?? null;

  const count = (s) => requests.filter(r => r.status === s).length;
  const totalQty = requests.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

  return (
    <div>
      <SectionHead icon="📨" title="My Requests" sub="Purchase requests you have sent to farmers" />

      {requests.length > 0 && (
        <div className="kpi-grid" style={{ marginBottom: 22 }}>
          <KpiCard icon="📨" tone="green" label="Total Sent" value={requests.length} />
          <KpiCard icon="⏳" tone="amber" label="Pending" value={count('pending')} />
          <KpiCard icon="✅" tone="green" label="Accepted" value={count('accepted')} />
          <KpiCard icon="🌾" tone="amber" label="Quantity Requested" value={totalQty} unit="tons" />
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading your requests…</div>
      ) : requests.length === 0 ? (
        <EmptyState
          emoji="📨"
          title="No requests sent yet"
          description="Browse the marketplace and send a purchase request to a farmer — it will show up here so you can track the response."
          image={IMG.marketplace}
        />
      ) : (
        <div className="stack">
          {requests.map(r => (
            <div className="card" key={r._id}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
                      <h4 style={{ fontSize: '1rem' }}>{r.farmerName}</h4>
                      <StatusPill status={r.status} />
                    </div>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>
                      📦 asked for <strong style={{ color: 'var(--ink)' }}>{r.quantity} tons</strong>
                      {r.acceptedQuantity !== undefined && r.acceptedQuantity !== null && (
                        <> · ✅ agreed <strong style={{ color: 'var(--green-700)' }}>{r.acceptedQuantity} tons</strong></>
                      )}
                      {r.createdAt && <> · 📅 {new Date(r.createdAt).toLocaleDateString('en-IN')}</>}
                    </div>

                    {livePrice(r) !== null && (
                      <div className="price-line">
                        {r.agreedPricePerTon ? (
                          <span className="price-now">✅ Agreed {inr(r.agreedPricePerTon)}/ton</span>
                        ) : r.counterPricePerTon ? (
                          <span className="price-now price-counter">
                            💰 {r.farmerName} countered {inr(r.counterPricePerTon)}/ton
                          </span>
                        ) : (
                          <span className="price-now">💰 You offered {inr(r.offeredPricePerTon ?? r.listedPricePerTon)}/ton</span>
                        )}
                        {r.counterPricePerTon > 0 && r.offeredPricePerTon > 0 && !r.agreedPricePerTon && (
                          <span className="price-was">you offered {inr(r.offeredPricePerTon)}/ton</span>
                        )}
                        {Number(r.acceptedQuantity ?? r.quantity) > 0 && livePrice(r) > 0 && (
                          <span className="price-total">
                            ≈ {inr(Number(r.acceptedQuantity ?? r.quantity) * livePrice(r))} total
                          </span>
                        )}
                      </div>
                    )}

                    {r.counterPricePerTon > 0 && r.status === 'pending' && (
                      <p className="muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
                        Reply in the message thread to accept or discuss this price — the
                        farmer confirms the deal from their side.
                      </p>
                    )}
                  </div>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setOpenThread(openThread === r._id ? null : r._id)}
                    aria-expanded={openThread === r._id}
                  >
                    💬 {openThread === r._id ? 'Hide' : 'Messages'}
                  </button>
                </div>

                {openThread === r._id && (
                  <RequestThread requestId={r._id} me="buyer" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
