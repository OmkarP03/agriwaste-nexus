import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SectionHead from '../components/SectionHead';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import KpiCard from '../components/KpiCard';
import { IMG } from '../utils/media';
import { API } from '../utils/apiRoot';
import RequestThread from '../components/RequestThread';
import { inr } from '../utils/media';

export default function FarmerRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');
  const [openThread, setOpenThread] = useState(null);
  const [accepting, setAccepting]   = useState(null);   // request being answered
  const [acceptQty, setAcceptQty]   = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [acceptPrice, setAcceptPrice] = useState('');
  const [countering, setCountering]   = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterError, setCounterError] = useState('');

  useEffect(() => { loadRequests(); /* eslint-disable-next-line */ }, []);

  function showMsg(m) { setToast(m); setTimeout(() => setToast(''), 3000); }

  async function loadRequests() {
    setLoading(true);
    try {
      // by account id — matching on farmerName let farmers who share a
      // name see and answer each other's requests
      const res = await axios.get(`${API}/requests/farmer/${user._id}`);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  // What a request is currently worth per ton: the farmer's counter if
  // they made one, otherwise the buyer's offer, otherwise the listed price.
  function livePrice(r) {
    return r.agreedPricePerTon ?? r.counterPricePerTon ?? r.offeredPricePerTon ?? r.listedPricePerTon ?? null;
  }

  async function updateStatus(id, status, quantity, pricePerTon) {
    try {
      const body = { status, quantity };
      if (pricePerTon !== undefined && Number(pricePerTon) > 0) {
        body.pricePerTon = Number(pricePerTon);
      }
      await axios.put(`${API}/requests/${id}/status`, body);
      showMsg(`✅ Request ${status}`);
      setAccepting(null);
      setAcceptError('');
      loadRequests();
    } catch (err) {
      const message = err.response?.data?.message || 'Could not update the request';
      if (status === 'accepted') setAcceptError(message);
      else showMsg(`❌ ${message}`);
    }
  }

  function startAccept(r) {
    setAccepting(r._id);
    setCountering(null);
    setAcceptQty(String(r.quantity ?? ''));
    setAcceptPrice(String(livePrice(r) ?? ''));
    setAcceptError('');
  }

  function startCounter(r) {
    setCountering(r._id);
    setAccepting(null);
    setCounterPrice(String(livePrice(r) ?? ''));
    setCounterError('');
  }

  async function sendCounter(id) {
    setCounterError('');
    try {
      await axios.put(`${API}/requests/${id}/counter`, {
        counterPricePerTon: Number(counterPrice),
      });
      setCountering(null);
      showMsg('💰 Counter-offer sent to the buyer');
      loadRequests();
    } catch (err) {
      setCounterError(err.response?.data?.message || 'Could not send the counter-offer');
    }
  }

  const count = (s) => requests.filter(r => r.status === s).length;

  return (
    <div>
      {toast && (
        <div className="alert alert-success" role="status"
          style={{ position: 'fixed', top: 84, right: 20, zIndex: 9999, maxWidth: 360, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      <SectionHead icon="📨" title="Purchase Requests" sub="Buyers interested in the waste you listed" />

      {requests.length > 0 && (
        <div className="kpi-grid" style={{ marginBottom: 22 }}>
          <KpiCard icon="📨" tone="green" label="Total" value={requests.length} />
          <KpiCard icon="⏳" tone="amber" label="Pending" value={count('pending')} />
          <KpiCard icon="✅" tone="green" label="Accepted" value={count('accepted')} />
          <KpiCard icon="★"  tone="earth" label="Completed" value={count('completed')} />
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading requests…</div>
      ) : requests.length === 0 ? (
        <EmptyState
          emoji="📨"
          title="No purchase requests yet"
          description="When a buyer sends a request for one of your marketplace listings, it will appear here for you to accept or decline."
          image={IMG.marketplace}
        />
      ) : (
        <div className="stack">
          {requests.map(r => (
            <div className="card" key={r._id}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <h4 style={{ fontSize: '1rem' }}>{r.buyerName}</h4>
                      <StatusPill status={r.status} />
                    </div>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>
                      📦 asked for <strong style={{ color: 'var(--ink)' }}>{r.quantity} tons</strong>
                      {r.acceptedQuantity !== undefined && r.acceptedQuantity !== null && (
                        <> · ✅ agreed <strong style={{ color: 'var(--green-700)' }}>{r.acceptedQuantity} tons</strong></>
                      )}
                      {r.createdAt && <> · 📅 {new Date(r.createdAt).toLocaleDateString('en-IN')}</>}
                    </div>

                    {/* Where the price stands */}
                    {livePrice(r) !== null && (
                      <div className="price-line">
                        {r.agreedPricePerTon ? (
                          <span className="price-now">✅ Agreed {inr(r.agreedPricePerTon)}/ton</span>
                        ) : r.counterPricePerTon ? (
                          <span className="price-now">💰 You countered {inr(r.counterPricePerTon)}/ton</span>
                        ) : (
                          <span className="price-now">💰 Offered {inr(r.offeredPricePerTon ?? r.listedPricePerTon)}/ton</span>
                        )}
                        {r.listedPricePerTon > 0 &&
                          r.offeredPricePerTon > 0 &&
                          r.offeredPricePerTon !== r.listedPricePerTon && (
                          <span className="price-was">listed {inr(r.listedPricePerTon)}/ton</span>
                        )}
                        {Number(r.acceptedQuantity ?? r.quantity) > 0 && livePrice(r) > 0 && (
                          <span className="price-total">
                            ≈ {inr(Number(r.acceptedQuantity ?? r.quantity) * livePrice(r))} total
                          </span>
                        )}
                      </div>
                    )}
                    {r.message && (
                      <p style={{ fontSize: '0.84rem', color: 'var(--gray-700)', marginTop: 8, lineHeight: 1.55 }}>
                        “{r.message}”
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.status === 'pending' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => startAccept(r)}>
                          ✅ Accept
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => startCounter(r)}>
                          💰 Counter price
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(r._id, 'rejected')}>
                          ✕ Reject
                        </button>
                      </>
                    )}
                    {r.status === 'accepted' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus(r._id, 'completed')}>
                        ★ Complete Deal
                      </button>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setOpenThread(openThread === r._id ? null : r._id)}
                      aria-expanded={openThread === r._id}
                    >
                      💬 {openThread === r._id ? 'Hide' : 'Messages'}
                    </button>
                  </div>
                </div>

                {/* Accept for a quantity you can actually supply */}
                {accepting === r._id && (
                  <div className="accept-box">
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ maxWidth: 200 }}>
                        <label htmlFor={`qty-${r._id}`}>Accept how many tons?</label>
                        <input
                          id={`qty-${r._id}`}
                          type="number" min="0.1" step="0.1"
                          value={acceptQty}
                          onChange={e => { setAcceptQty(e.target.value); setAcceptError(''); }}
                        />
                      </div>
                      <div className="form-group" style={{ maxWidth: 200 }}>
                        <label htmlFor={`price-${r._id}`}>Price per ton (₹)</label>
                        <input
                          id={`price-${r._id}`}
                          type="number" min="0" step="50"
                          value={acceptPrice}
                          onChange={e => { setAcceptPrice(e.target.value); setAcceptError(''); }}
                        />
                      </div>
                    </div>
                    <p className="muted" style={{ fontSize: '0.79rem' }}>
                      {r.buyerName} asked for <strong>{r.quantity} tons</strong>. Accept less if that's
                      all you can supply — the buyer is told the agreed figure.
                    </p>
                    {acceptError && (
                      <div className="alert alert-warning" style={{ marginBottom: 10 }}>⚠️ {acceptError}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => updateStatus(r._id, 'accepted', Number(acceptQty), acceptPrice)}
                        disabled={!(Number(acceptQty) > 0)}
                      >
                        Confirm{Number(acceptQty) > 0 ? ` ${acceptQty} tons` : ''}
                        {Number(acceptPrice) > 0 ? ` at ${inr(acceptPrice)}/ton` : ''}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setAccepting(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {countering === r._id && (
                  <div className="accept-box">
                    <div className="form-group" style={{ maxWidth: 220 }}>
                      <label htmlFor={`counter-${r._id}`}>Your price per ton (₹)</label>
                      <input
                        id={`counter-${r._id}`}
                        type="number" min="1" step="50"
                        value={counterPrice}
                        onChange={e => { setCounterPrice(e.target.value); setCounterError(''); }}
                      />
                    </div>
                    <p className="muted" style={{ fontSize: '0.79rem' }}>
                      The buyer is told your price and can accept it or keep talking in
                      the message thread. The request stays pending until you accept it.
                    </p>
                    {counterError && (
                      <div className="alert alert-warning" style={{ marginBottom: 10 }}>⚠️ {counterError}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => sendCounter(r._id)}
                        disabled={!(Number(counterPrice) > 0)}
                      >
                        Send counter-offer
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setCountering(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {openThread === r._id && (
                  <RequestThread requestId={r._id} me="farmer" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
