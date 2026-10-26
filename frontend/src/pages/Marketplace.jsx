import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SectionHead from '../components/SectionHead';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import { IMG, bgImage, OVERLAY_MID, CROP_EMOJI, inr } from '../utils/media';
import { API } from '../utils/apiRoot';
import ImageUploader from '../components/ImageUploader';
import VoiceInput from '../components/VoiceInput';


const TYPE_COLOR = {
  'Biogas Plant':  'linear-gradient(135deg,#174A27,#2C7A3F)',
  'Biochar Mfr':   'linear-gradient(135deg,#6b4630,#8B5E3C)',
  'Biomass Power': 'linear-gradient(135deg,#c97f12,#F5A623)',
  'Compost':       'linear-gradient(135deg,#1b4f9c,#2563eb)',
  'Other':         'linear-gradient(135deg,#3f4a41,#667066)',
};
const typeColor = t => TYPE_COLOR[t] || TYPE_COLOR.Other;

const CROPS = ['rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'soybean'];

export default function Marketplace() {
  const { user } = useAuth();
  const API_URL = `${API}/marketplace`;

  const [tab, setTab]                 = useState('listings');
  const [listings, setListings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [buyers, setBuyers]           = useState([]);
  const [buyersLoading, setBuyersLoading] = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [toast, setToast]             = useState('');
  const [search, setSearch]           = useState('');
  const [cropFilter, setCropFilter]   = useState('all');
  const [wasteFilter, setWasteFilter] = useState('all');
  const [locFilter, setLocFilter]     = useState('all');
  const [selectedListing, setSelectedListing] = useState(null);
  const [sending, setSending]         = useState(false);
  const [offer, setOffer]             = useState({ quantity: '', pricePerTon: '', message: '' });

  // Only buyers (and admins, who need to see what a buyer sees) get the
  // purchase actions on a listing card.
  const canBuy = user?.role !== 'farmer';

  const [form, setForm] = useState({
    farmerName: '', location: '', cropType: 'rice', wasteType: '',
    quantity: '', pricePerTon: '', contact: '', description: '',
    images: [], listingDays: 90,
  });
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const id = setTimeout(() => {
      axios.get(`${API_URL}/search?search=${encodeURIComponent(search)}`)
        .then(res => { if (alive) setListings(res.data.listings || []); })
        .catch(err => { console.error('Error fetching listings:', err); if (alive) setListings([]); })
        .finally(() => { if (alive) setLoading(false); });
    }, 250);
    return () => { alive = false; clearTimeout(id); };
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (!selectedListing) return;
    setOffer({
      quantity: String(selectedListing.quantityRemaining ?? selectedListing.quantity ?? ''),
      pricePerTon: String(selectedListing.pricePerTon ?? ''),
      message: '',
    });
  }, [selectedListing]);

  // Buyers are real accounts now — anyone who signed up with the buyer
  // role and has been verified by an admin.
  useEffect(() => {
    let alive = true;
    axios.get(`${API}/buyers`)
      .then(res => { if (alive) setBuyers(res.data.buyers || []); })
      .catch(err => { console.error('Error fetching buyers:', err); if (alive) setBuyers([]); })
      .finally(() => { if (alive) setBuyersLoading(false); });
    return () => { alive = false; };
  }, []);

  async function fetchListings() {
    try {
      const response = await axios.get(`${API_URL}/search?search=${encodeURIComponent(search)}`);
      setListings(response.data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  }

  // ── Filter options built from the live data ─────────────
  const wasteTypes = useMemo(
    () => Array.from(new Set(listings.map(l => l.wasteType).filter(Boolean))).sort(),
    [listings]
  );
  const locations = useMemo(
    () => Array.from(new Set(listings.map(l => l.location).filter(Boolean))).sort(),
    [listings]
  );

  const shown = useMemo(() => listings.filter(l => {
    if (cropFilter !== 'all' && l.cropType !== cropFilter) return false;
    if (wasteFilter !== 'all' && l.wasteType !== wasteFilter) return false;
    if (locFilter !== 'all' && l.location !== locFilter) return false;
    return true;
  }), [listings, cropFilter, wasteFilter, locFilter]);

  const hasFilter = cropFilter !== 'all' || wasteFilter !== 'all' || locFilter !== 'all' || search;

  function clearFilters() {
    setCropFilter('all'); setWasteFilter('all'); setLocFilter('all'); setSearch('');
  }

  function showMsg(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }
  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handlePost(e) {
    e.preventDefault();
    if (!form.farmerName || !form.quantity) return;
    try {
      await axios.post(`${API_URL}/listings`, {
        ...form,
        farmerName: user.name,
      });
      await fetchListings();
      setForm({ farmerName: '', location: '', cropType: 'rice', wasteType: '', quantity: '', pricePerTon: '', contact: '', description: '', images: [], listingDays: 90 });
      setShowForm(false);
      showMsg('✅ Listing published to the marketplace');
    } catch (error) {
      console.error(error);
      showMsg('❌ Failed to save listing');
    }
  }

  async function sendRequest(listing) {
    setSending(true);
    try {
      // buyerId and the farmer's account id are taken from the token and
      // the listing server-side, so they can't be spoofed from here.
      await axios.post(`${API}/requests`, {
        listingId: listing._id,
        buyerName: user.name,
        quantity: Number(offer.quantity) || listing.quantity,
        offeredPricePerTon: Number(offer.pricePerTon) || undefined,
        message: offer.message.trim() || 'Interested in purchasing this waste.',
      });
      setSelectedListing(null);
      showMsg('✅ Purchase request sent successfully');
    } catch (err) {
      console.log(err);
      showMsg('❌ Failed to send request');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {toast && (
        <div
          className="alert alert-success"
          role="status"
          style={{ position: 'fixed', top: 84, right: 20, zIndex: 9999, maxWidth: 380, boxShadow: 'var(--shadow-lg)' }}
        >
          {toast}
        </div>
      )}

      {/* Banner */}
      <section
        className="img-banner"
        style={{ ...bgImage(IMG.marketplace, OVERLAY_MID), marginBottom: 22 }}
      >
        <h3>Farm Waste Marketplace</h3>
        <p>
          Connect farmers with biogas, biochar, biomass and compost buyers across Maharashtra.
          List surplus residue, compare prices and send purchase requests in a few clicks.
        </p>
      </section>

      <div className="tabs" role="tablist">
        <button
          role="tab" aria-selected={tab === 'listings'}
          className={`tab-btn ${tab === 'listings' ? 'active' : ''}`}
          onClick={() => setTab('listings')}
        >
          🌾 Farmer Listings ({listings.length})
        </button>
        <button
          role="tab" aria-selected={tab === 'buyers'}
          className={`tab-btn ${tab === 'buyers' ? 'active' : ''}`}
          onClick={() => setTab('buyers')}
        >
          🏭 Buyers &amp; Plants ({buyers.length})
        </button>
      </div>

      {/* ══════════════ LISTINGS ══════════════ */}
      {tab === 'listings' && (
        <div>
          <div className="filter-bar">
            <div className="search-field">
              <span className="sf-icon" aria-hidden="true">🔍</span>
              <label className="sr-only" htmlFor="mp-search">Search listings</label>
              <input
                id="mp-search"
                className="input"
                type="search"
                placeholder="Search farmer, farmer ID, crop or location…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <VoiceInput label="Search by voice" onResult={v => setSearch(v)} />
            </div>

            <label className="sr-only" htmlFor="mp-crop">Filter by crop</label>
            <select id="mp-crop" className="input" value={cropFilter} onChange={e => setCropFilter(e.target.value)}>
              <option value="all">All crops</option>
              {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>

            <label className="sr-only" htmlFor="mp-waste">Filter by waste type</label>
            <select id="mp-waste" className="input" value={wasteFilter} onChange={e => setWasteFilter(e.target.value)}>
              <option value="all">All waste types</option>
              {wasteTypes.map(w => <option key={w} value={w}>{w}</option>)}
            </select>

            <label className="sr-only" htmlFor="mp-loc">Filter by location</label>
            <select id="mp-loc" className="input" value={locFilter} onChange={e => setLocFilter(e.target.value)}>
              <option value="all">All locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {hasFilter && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                ✕ Clear filters
              </button>
            )}
          </div>

          <SectionHead
            icon="🌾"
            title="Available Farm Waste"
            sub={`${shown.length} listing${shown.length === 1 ? '' : 's'}${hasFilter ? ' matching your filters' : ' from farmers across Maharashtra'}`}
            action={
              <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? '✕ Cancel' : '+ List Your Waste'}
              </button>
            }
          />

          {showForm && (
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="card-header">
                <div className="card-icon green" aria-hidden="true">📝</div>
                <div>
                  <div className="card-title">Post New Listing</div>
                  <div className="card-subtitle">Buyers will see this immediately</div>
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={handlePost}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="l-name">Your Name *</label>
                      <input id="l-name" name="farmerName" value={form.farmerName} onChange={handleChange} placeholder="Farmer name" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="l-loc">Location</label>
                      <input id="l-loc" name="location" value={form.location} onChange={handleChange} placeholder="Village, District" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="l-crop">Crop Type</label>
                      <select id="l-crop" name="cropType" value={form.cropType} onChange={handleChange}>
                        {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="l-waste">Waste Type</label>
                      <input id="l-waste" name="wasteType" value={form.wasteType} onChange={handleChange} placeholder="e.g. Rice Straw" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="l-qty">Quantity (tons) *</label>
                      <input id="l-qty" type="number" min="0" step="0.1" name="quantity" value={form.quantity} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="l-price">Price per Ton (₹)</label>
                      <input id="l-price" type="number" min="0" name="pricePerTon" value={form.pricePerTon} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="l-contact">Contact</label>
                      <input id="l-contact" name="contact" value={form.contact} onChange={handleChange} placeholder="+91-…" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="l-desc">Description</label>
                      <input id="l-desc" name="description" value={form.description} onChange={handleChange} placeholder="Condition, delivery radius…" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="l-days">Keep listed for</label>
                      <select id="l-days" name="listingDays" value={form.listingDays} onChange={handleChange}>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                        <option value={180}>6 months</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <ImageUploader
                      images={form.images}
                      onChange={images => setForm(f => ({ ...f, images }))}
                      label="Photos of the residue"
                    />
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="submit" className="btn btn-primary">Post Listing</button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading"><div className="spinner" /> Loading listings…</div>
          ) : shown.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title={hasFilter ? 'No listings match your filters' : 'No listings yet'}
              description={
                hasFilter
                  ? 'Try a different crop, waste type or location — or clear the filters.'
                  : 'Be the first to list farm waste on the marketplace.'
              }
              actionLabel={hasFilter ? 'Clear filters' : '+ List Your Waste'}
              onAction={hasFilter ? clearFilters : () => setShowForm(true)}
              image={IMG.marketplace}
            />
          ) : (
            <div className="marketplace-grid">
              {shown.map(l => (
                <article className="listing-card" key={l._id}>
                  <div className="listing-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '1.3rem' }} aria-hidden="true">{CROP_EMOJI[l.cropType] || '🌿'}</span>
                        <div style={{ fontFamily: 'Syne', fontWeight: 700, marginTop: 3 }}>
                          {l.wasteType || l.cropType}
                        </div>
                      </div>
                      <span className="listing-tag">{l.cropType}</span>
                    </div>
                  </div>

                  {l.images?.length > 0 && (
                    <button
                      type="button"
                      className="listing-photo"
                      onClick={() => setLightbox({ images: l.images, title: l.wasteType || l.cropType })}
                      aria-label={`View photos of ${l.wasteType || l.cropType}`}
                    >
                      <img src={l.images[0]} alt="" />
                      {l.images.length > 1 && <span className="photo-count">+{l.images.length - 1}</span>}
                    </button>
                  )}

                  <div className="listing-body">
                    <div className="listing-price">
                      {inr(l.pricePerTon)}
                      <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--ink-soft)' }}> / ton</span>
                    </div>
                    <div className="listing-stat"><span>👨‍🌾 Farmer</span><strong>{l.farmerName}</strong></div>
                    <div className="listing-stat"><span>📍 Location</span><strong>{l.location || '—'}</strong></div>
                    <div className="listing-stat">
                      <span>📦 Available</span>
                      <strong>
                        {l.quantityRemaining ?? l.quantity} tons
                        {l.quantityRemaining !== undefined && l.quantityRemaining < l.quantity && (
                          <span className="muted" style={{ fontWeight: 400 }}> of {l.quantity}</span>
                        )}
                      </strong>
                    </div>
                    {l.expiresAt && (
                      <div className="listing-stat">
                        <span>⏳ Listed until</span>
                        <strong>{new Date(l.expiresAt).toLocaleDateString('en-IN')}</strong>
                      </div>
                    )}
                    {l.description && (
                      <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.45 }}>
                        {l.description}
                      </p>
                    )}
                  </div>

                  {/* View / Call are buyer actions. A farmer browsing the
                      marketplace is looking at other farmers' residue, not
                      buying it, so the footer is left off their view —
                      their own listings live under My Listings. */}
                  {canBuy && (
                    <div className="listing-footer">
                      <StatusPill status={l.status || 'available'} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedListing(l)}
                          aria-label={`View details of ${l.wasteType || l.cropType} listed by ${l.farmerName}`}
                        >
                          View
                        </button>
                        {l.contact && (
                          <a href={`tel:${l.contact}`} className="btn btn-outline btn-sm" aria-label={`Call ${l.farmerName}`}>
                            📞 Call
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ BUYERS ══════════════ */}
      {tab === 'buyers' && (
        <div>
          <SectionHead
            icon="🏭"
            title="Buyers &amp; Processing Plants"
            sub="Buyer accounts on AgriWaste Nexus that accept agricultural residue"
          />

          {buyersLoading ? (
            <div className="skeleton-grid" aria-live="polite" aria-busy="true">
              {[0, 1, 2].map(i => <div className="skeleton-card" key={i} />)}
            </div>
          ) : buyers.length === 0 ? (
            <EmptyState
              icon="🏭"
              title="No buyers listed yet"
              body="Buyers appear here once they create a buyer account and an administrator confirms their details. Until then, farmers and buyers can still trade through listings."
            />
          ) : (
            <div className="marketplace-grid">
              {buyers.map(b => {
                const title = b.companyName || b.name;
                const place = [b.village, b.district].filter(Boolean).join(', ');
                return (
                  <article className="listing-card" key={b._id}>
                    <div className="listing-header" style={{ background: typeColor(b.buyerType) }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{title}</div>
                      <div style={{ fontSize: '0.73rem', opacity: 0.85, marginTop: 2 }}>
                        {b.buyerType || 'Buyer'}
                      </div>
                    </div>
                    <div className="listing-body">
                      {/* "Verified" here means an AgriWaste Nexus administrator
                          confirmed the account details — nothing more. */}
                      {b.verified && (
                        <div className="verified-chip" title="Account details confirmed by an AgriWaste Nexus administrator">
                          <span aria-hidden="true">✓</span> Account verified by AgriWaste Nexus
                        </div>
                      )}
                      {place && <div className="listing-stat"><span>📍 Location</span><strong>{place}</strong></div>}
                      {b.capacityTonsPerDay > 0 && (
                        <div className="listing-stat">
                          <span>⚙️ Capacity</span><strong>{b.capacityTonsPerDay} T/day</strong>
                        </div>
                      )}
                      {Array.isArray(b.acceptedWaste) && b.acceptedWaste.length > 0 && (
                        <div className="listing-stat">
                          <span>♻️ Accepts</span><strong>{b.acceptedWaste.join(', ')}</strong>
                        </div>
                      )}
                      {!b.capacityTonsPerDay && !(b.acceptedWaste || []).length && (
                        <p className="muted-note">
                          This buyer has not added their intake capacity or the residue they
                          take yet. Call to ask what they need.
                        </p>
                      )}
                    </div>
                    <div className="listing-footer">
                      {b.mobile
                        ? <a href={`tel:${b.mobile}`} className="btn btn-primary btn-sm" aria-label={`Call ${title}`}>📞 Call</a>
                        : <span className="muted-note">No phone on file</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ PHOTO LIGHTBOX ══════════════ */}
      {lightbox && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Photos of ${lightbox.title}`}
          onClick={e => { if (e.target === e.currentTarget) setLightbox(null); }}
        >
          <div className="modal-panel" style={{ width: 720 }}>
            <div className="modal-head">
              <h3>{lightbox.title}</h3>
              <button className="icon-btn" onClick={() => setLightbox(null)} aria-label="Close photos">
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="gallery">
                {lightbox.images.map((src, i) => (
                  <img key={i} src={src} alt={`Photo ${i + 1} of ${lightbox.title}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ DETAIL MODAL ══════════════ */}
      {selectedListing && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Waste listing details"
          onClick={e => { if (e.target === e.currentTarget) setSelectedListing(null); }}
        >
          <div className="modal-panel">
            <div className="modal-head">
              <h3>
                <span aria-hidden="true">{CROP_EMOJI[selectedListing.cropType] || '🌾'}</span>{' '}
                {selectedListing.wasteType || selectedListing.cropType}
              </h3>
              <button className="icon-btn" onClick={() => setSelectedListing(null)} aria-label="Close details">
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="modal-body">
              {selectedListing.images?.length > 0 && (
                <div className="gallery" style={{ marginBottom: 16 }}>
                  {selectedListing.images.map((src, i) => (
                    <img key={i} src={src} alt={`Photo ${i + 1} of the residue on offer`} />
                  ))}
                </div>
              )}

              <div className="result-block">
                <h4>Listing</h4>
                <div className="result-row"><span className="key">Farmer Name</span><span className="val">{selectedListing.farmerName}</span></div>
                <div className="result-row"><span className="key">Farmer ID</span><span className="val">{selectedListing.farmerId}</span></div>
                <div className="result-row"><span className="key">Location</span><span className="val">{selectedListing.location || '—'}</span></div>
                <div className="result-row"><span className="key">Crop</span><span className="val">{selectedListing.cropType}</span></div>
                <div className="result-row"><span className="key">Waste Type</span><span className="val">{selectedListing.wasteType || '—'}</span></div>
                <div className="result-row">
                  <span className="key">Still available</span>
                  <span className="val green">
                    {selectedListing.quantityRemaining ?? selectedListing.quantity} of {selectedListing.quantity} tons
                  </span>
                </div>
                <div className="result-row"><span className="key">Price</span><span className="val green">{inr(selectedListing.pricePerTon)} / ton</span></div>
                <div className="result-row"><span className="key">Contact</span><span className="val">{selectedListing.contact || '—'}</span></div>
                <div className="result-row">
                  <span className="key">Status</span>
                  <span className="val"><StatusPill status={selectedListing.status || 'available'} /></span>
                </div>
              </div>

              {selectedListing.description && (
                <p style={{ fontSize: '0.84rem', color: 'var(--gray-700)', marginTop: 14, lineHeight: 1.6 }}>
                  {selectedListing.description}
                </p>
              )}

              {/* Your offer — the farmer can accept it or counter */}
              <div className="result-block" style={{ marginTop: 16 }}>
                <h4>Your offer</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="offer-qty">Quantity (tons)</label>
                    <input
                      id="offer-qty" type="number" min="0.1" step="0.1"
                      max={selectedListing.quantityRemaining ?? selectedListing.quantity}
                      value={offer.quantity}
                      onChange={e => setOffer(o => ({ ...o, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="offer-price">Price per ton (₹)</label>
                    <input
                      id="offer-price" type="number" min="0" step="50"
                      value={offer.pricePerTon}
                      onChange={e => setOffer(o => ({ ...o, pricePerTon: e.target.value }))}
                    />
                    <small className="field-hint">
                      Listed at {inr(selectedListing.pricePerTon)}/ton. Offer a different
                      figure if you want to — the farmer can counter.
                    </small>
                  </div>
                  <div className="form-group form-group-wide">
                    <label htmlFor="offer-msg">Message to the farmer (optional)</label>
                    <input
                      id="offer-msg"
                      value={offer.message}
                      onChange={e => setOffer(o => ({ ...o, message: e.target.value }))}
                      placeholder="When you can collect, how you will transport it…"
                    />
                  </div>
                </div>
                {Number(offer.quantity) > 0 && Number(offer.pricePerTon) > 0 && (
                  <p className="offer-total">
                    Your offer works out to{' '}
                    <strong>{inr(Number(offer.quantity) * Number(offer.pricePerTon))}</strong> in total.
                  </p>
                )}
              </div>
            </div>

            <div className="modal-foot">
              {selectedListing.contact && (
                <a href={`tel:${selectedListing.contact}`} className="btn btn-outline">📞 Call Farmer</a>
              )}
              <button
                className="btn btn-primary"
                disabled={sending || !(Number(offer.quantity) > 0)}
                onClick={() => sendRequest(selectedListing)}
              >
                {sending ? 'Sending…' : '📨 Send Request'}
              </button>
              <button className="btn btn-ghost push" onClick={() => setSelectedListing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
