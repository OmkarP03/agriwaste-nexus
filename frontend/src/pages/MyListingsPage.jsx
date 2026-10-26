import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../utils/apiRoot';
import SectionHead from '../components/SectionHead';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import KpiCard from '../components/KpiCard';
import { IMG, CROP_EMOJI, inr } from '../utils/media';
import ImageUploader from '../components/ImageUploader';

export default function MyListingsPage() {
  const { user } = useAuth();
  const API_URL = `${API}/marketplace`;

  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData]   = useState({});
  const [toast, setToast]         = useState('');

  useEffect(() => { loadListings(); /* eslint-disable-next-line */ }, []);

  function showMsg(m) { setToast(m); setTimeout(() => setToast(''), 3000); }

  async function loadListings() {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/user/${user._id}`);
      setListings(response.data.listings || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteListing(id) {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/listings/${id}`);
      showMsg('🗑 Listing deleted');
      loadListings();
    } catch (err) { console.log(err); }
  }

  async function updateStatus(id, status) {
    try {
      await axios.put(`${API_URL}/listings/${id}/status`, { status });
      loadListings();
    } catch (err) { console.log(err); }
  }

  async function saveEdit(id) {
    try {
      await axios.put(`${API_URL}/listings/${id}`, editData);
      setEditingId(null);
      showMsg('💾 Listing updated');
      loadListings();
    } catch (err) { console.log(err); }
  }

  const totalQty = listings.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const soldQty = listings.reduce(
    (s, l) => s + (Number(l.quantity || 0) - Number(l.quantityRemaining ?? l.quantity ?? 0)), 0
  );
  const available = listings.filter(l => l.status === 'available').length;
  const expected = listings.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.pricePerTon) || 0), 0);

  return (
    <div>
      {toast && (
        <div className="alert alert-success" role="status"
          style={{ position: 'fixed', top: 84, right: 20, zIndex: 9999, maxWidth: 360, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      <SectionHead icon="📋" title="My Listings" sub="Farm waste you have published to the marketplace" />

      {listings.length > 0 && (
        <div className="kpi-grid" style={{ marginBottom: 22 }}>
          <KpiCard icon="📋" tone="green" label="Total Listings" value={listings.length} />
          <KpiCard icon="🟢" tone="green" label="Available" value={available} />
          <KpiCard icon="🌾" tone="amber" label="Quantity Listed" value={totalQty} unit="tons" />
          <KpiCard icon="🤝" tone="green" label="Committed" value={soldQty.toFixed(1)} unit="tons"
            note="accepted by buyers" />
          <KpiCard icon="💰" tone="amber" label="Expected Revenue" value={inr(expected)} noteTone="gold" />
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading your listings…</div>
      ) : listings.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="No listings yet"
          description="Post your surplus crop residue on the marketplace and buyers nearby will be able to send you purchase requests."
          image={IMG.marketplace}
        />
      ) : (
        <div className="marketplace-grid">
          {listings.map(listing => (
            <article className="listing-card" key={listing._id}>
              {listing.images?.length > 0 && (
                <div className="listing-photo" aria-hidden="true">
                  <img src={listing.images[0]} alt="" />
                  {listing.images.length > 1 && <span className="photo-count">+{listing.images.length - 1}</span>}
                </div>
              )}

              <div className="listing-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '1.25rem' }} aria-hidden="true">{CROP_EMOJI[listing.cropType] || '🌿'}</span>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, marginTop: 3 }}>
                      {listing.wasteType || listing.cropType}
                    </div>
                  </div>
                  <span className="listing-tag">{listing.cropType}</span>
                </div>
              </div>

              <div className="listing-body">
                <div className="listing-price">
                  {inr(listing.pricePerTon)}
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--ink-soft)' }}> / ton</span>
                </div>
                <div className="listing-stat">
                  <span>📦 Available</span>
                  <strong>
                    {listing.quantityRemaining ?? listing.quantity} tons
                    {listing.quantityRemaining !== undefined && listing.quantityRemaining < listing.quantity && (
                      <span className="muted" style={{ fontWeight: 400 }}> of {listing.quantity}</span>
                    )}
                  </strong>
                </div>
                {listing.expiresAt && (
                  <div className="listing-stat">
                    <span>⏳ Listed until</span>
                    <strong style={new Date(listing.expiresAt) < new Date() ? { color: 'var(--red-600)' } : undefined}>
                      {new Date(listing.expiresAt).toLocaleDateString('en-IN')}
                      {new Date(listing.expiresAt) < new Date() && ' · expired'}
                    </strong>
                  </div>
                )}
                <div className="listing-stat"><span>📍 Location</span><strong>{listing.location || '—'}</strong></div>
                {listing.description && (
                  <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.45 }}>
                    {listing.description}
                  </p>
                )}

                {editingId === listing._id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="form-group">
                        <label htmlFor={`q-${listing._id}`}>Quantity (tons)</label>
                        <input
                          id={`q-${listing._id}`} type="number" min="0" step="0.1"
                          value={editData.quantity}
                          onChange={e => setEditData({ ...editData, quantity: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`p-${listing._id}`}>Price / ton (₹)</label>
                        <input
                          id={`p-${listing._id}`} type="number" min="0"
                          value={editData.pricePerTon}
                          onChange={e => setEditData({ ...editData, pricePerTon: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: 12 }}>
                      <label htmlFor={`d-${listing._id}`}>Description</label>
                      <textarea
                        id={`d-${listing._id}`} rows={3}
                        value={editData.description}
                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`x-${listing._id}`}>Extend listing by</label>
                      <select
                        id={`x-${listing._id}`}
                        value={editData.listingDays}
                        onChange={e => setEditData({ ...editData, listingDays: Number(e.target.value) })}
                      >
                        <option value={30}>30 days from now</option>
                        <option value={60}>60 days from now</option>
                        <option value={90}>90 days from now</option>
                        <option value={180}>6 months from now</option>
                      </select>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <ImageUploader
                        images={editData.images || []}
                        onChange={images => setEditData({ ...editData, images })}
                        label="Photos"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => saveEdit(listing._id)}>💾 Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="listing-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StatusPill status={listing.status} />
                  <label className="sr-only" htmlFor={`s-${listing._id}`}>Change listing status</label>
                  <select
                    id={`s-${listing._id}`}
                    className="input"
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '0.78rem' }}
                    value={listing.status}
                    onChange={e => updateStatus(listing._id, e.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setEditingId(editingId === listing._id ? null : listing._id);
                      setEditData({
                        quantity: listing.quantity,
                        pricePerTon: listing.pricePerTon,
                        description: listing.description || '',
                        images: listing.images || [],
                        listingDays: 90,
                      });
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteListing(listing._id)}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
