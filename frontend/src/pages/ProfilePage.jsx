import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../utils/apiRoot';
import SectionHead from '../components/SectionHead';
import EmptyState from '../components/EmptyState';
import KpiCard from '../components/KpiCard';
import { IMG, bgImage, OVERLAY_MID, inr } from '../utils/media';
import { downloadSeasonReport } from '../utils/report';

const CROPS = ['rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'soybean'];
const BUYER_TYPES = ['Biogas Plant', 'Biochar Mfr', 'Biomass Power', 'Compost', 'Other'];
const DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana',
  'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna',
  'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal',
];

export default function ProfilePage({ setPage }) {
  const { user, updateProfile, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [calcs, setCalcs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: user?.name || '',
    village: user?.village || '',
    district: user?.district || '',
    cropType: user?.cropType || 'rice',
    landArea: user?.landArea || '',
    companyName: user?.companyName || '',
    buyerType: user?.buyerType || '',
    capacityTonsPerDay: user?.capacityTonsPerDay ?? '',
    acceptedWaste: (user?.acceptedWaste || []).join(', '),
  });

  const isFarmer = user?.role === 'farmer';
  const isBuyer  = user?.role === 'buyer';

  const [savingPrefs, setSavingPrefs] = useState(false);
  const notifyByPhone = user?.notifyByPhone !== false;

  // The toggle saves on its own — a preference shouldn't need a Save button
  async function togglePhoneAlerts() {
    setSavingPrefs(true);
    const result = await updateProfile({ notifyByPhone: !notifyByPhone });
    if (!result.success) setError(result.error);
    setSavingPrefs(false);
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setError('');

    // Buyer-only fields live behind their own route, which cannot
    // self-verify an account.
    if (isBuyer) {
      try {
        await axios.put(`${API}/buyers/me`, {
          companyName: form.companyName,
          buyerType: form.buyerType || undefined,
          capacityTonsPerDay: form.capacityTonsPerDay,
          acceptedWaste: form.acceptedWaste,
          district: form.district,
          village: form.village,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Could not save your buyer details');
        return;
      }
    }

    const { companyName, buyerType, capacityTonsPerDay, acceptedWaste, ...core } = form;
    const result = await updateProfile(core);
    if (result.success) {
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(result.error);
    }
  }

  useEffect(() => {
    let alive = true;
    async function loadCalculations() {
      if (!user?._id) { setLoading(false); return; }
      try {
        const response = await axios.get(`${API}/calculations/user/${user._id}`);
        if (alive) setCalcs(response.data.calculations || []);
      } catch (err) {
        console.log(err);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadCalculations();
    return () => { alive = false; };
  }, [user]);

  const stats = useMemo(() => {
    const sum = (fn) => calcs.reduce((a, c) => a + (Number(fn(c)) || 0), 0);
    return {
      residue: sum(c => c.result?.waste?.residueGenerated),
      co2:     sum(c => c.result?.waste?.co2Avoided),
      credits: sum(c => c.result?.credits?.carbonCredits),
      income:  sum(c => c.result?.credits?.totalIncome),
    };
  }, [calcs]);

  return (
    <div>

      {/* ── Profile header ─────────────────────────────── */}
      <section
        className="img-banner"
        style={{ ...bgImage(IMG.field, OVERLAY_MID), marginBottom: 22 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div
            aria-hidden="true"
            style={{
              width: 70, height: 70, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', flexShrink: 0,
            }}
          >
            {isFarmer ? '🧑‍🌾' : user?.role === 'admin' ? '👑' : '🏭'}
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.35rem', margin: 0 }}>{user?.name}</h3>
              <span className="id-verified">
                {isFarmer ? '🌾 Farmer' : user?.role === 'admin' ? '👑 Admin' : '🏭 Buyer'}
              </span>
            </div>
            <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.85)', marginTop: 5 }}>
              {user?.village && `📍 ${user.village}`}{user?.district && `${user?.village ? ', ' : '📍 '}${user.district}`}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', marginTop: 2 }}>
              📧 {user?.email} &nbsp;·&nbsp; 📱 +91 {user?.mobile}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-on-dark" onClick={() => { setTab('profile'); setEditing(true); }}>
              ✏️ Edit Profile
            </button>
            <button className="btn btn-on-dark" onClick={logout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </section>

      {/* ── Sustainability statistics ──────────────────── */}
      {isFarmer && (
        <>
          <SectionHead
            icon="📈"
            title="Sustainability Statistics"
            sub="Totals across every analysis saved to your account"
            action={
              <button
                className="btn btn-outline btn-sm"
                disabled={calcs.length === 0}
                onClick={() => downloadSeasonReport({ user, calcs })}
                title={calcs.length === 0 ? 'Run a calculation first' : 'Download a one-page summary'}
              >
                📄 Download season report
              </button>
            }
          />
          <div className="kpi-grid" style={{ marginBottom: 22 }}>
            <KpiCard icon="🌾" tone="green" label="Total Residue" value={stats.residue.toFixed(2)} unit="tons" />
            <KpiCard icon="🌍" tone="amber" label="CO₂ Avoided" value={stats.co2.toFixed(2)} unit="tons" noteTone="up" />
            <KpiCard icon="🏅" tone="green" label="Carbon Credits" value={stats.credits.toFixed(2)} unit="credits" />
            <KpiCard icon="📊" tone="earth" label="Calculations" value={calcs.length} unit="total" />
          </div>
        </>
      )}

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="tabs" role="tablist">
        <button
          role="tab" aria-selected={tab === 'profile'}
          className={`tab-btn ${tab === 'profile' ? 'active' : ''}`}
          onClick={() => setTab('profile')}
        >
          👤 Profile Details
        </button>
        {isFarmer && (
          <button
            role="tab" aria-selected={tab === 'history'}
            className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            📊 Calculation History ({calcs.length})
          </button>
        )}
      </div>

      {/* ── Profile tab ────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon green" aria-hidden="true">👤</div>
            <div>
              <div className="card-title">{editing ? 'Edit Your Details' : 'Personal & Farm Information'}</div>
              <div className="card-subtitle">
                {editing ? 'Changes are saved to your account' : 'Details you provided when registering'}
              </div>
            </div>
            {!editing && (
              <button className="btn btn-outline btn-sm push" onClick={() => setEditing(true)}>
                ✏️ Edit
              </button>
            )}
          </div>

          <div className="card-body">
            {saved && <div className="alert alert-success" role="status">✅ Profile updated successfully</div>}
            {error && <div className="alert alert-warning" role="alert">⚠️ {error}</div>}

            {!editing ? (
              <div className="results-grid">
                <div className="result-block">
                  <h4>Account</h4>
                  <div className="result-row"><span className="key">Full Name</span><span className="val">{user?.name}</span></div>
                  <div className="result-row"><span className="key">Email</span><span className="val">{user?.email}</span></div>
                  <div className="result-row"><span className="key">Mobile</span><span className="val">+91 {user?.mobile}</span></div>
                  <div className="result-row">
                    <span className="key">Role</span>
                    <span className="val">{isFarmer ? '🧑‍🌾 Farmer' : user?.role === 'admin' ? '👑 Admin' : '🏭 Buyer'}</span>
                  </div>
                  <div className="result-row">
                    <span className="key">Member Since</span>
                    <span className="val">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </div>
                </div>

                {isBuyer && (
                  <div className="result-block">
                    <h4>Business Information</h4>
                    <div className="result-row"><span className="key">Company</span><span className="val">{user?.companyName || '—'}</span></div>
                    <div className="result-row"><span className="key">Type</span><span className="val">{user?.buyerType || '—'}</span></div>
                    <div className="result-row"><span className="key">District</span><span className="val">{user?.district || '—'}</span></div>
                    <div className="result-row">
                      <span className="key">Capacity</span>
                      <span className="val">{user?.capacityTonsPerDay ? `${user.capacityTonsPerDay} tons/day` : '—'}</span>
                    </div>
                    <div className="result-row">
                      <span className="key">Accepts</span>
                      <span className="val">{(user?.acceptedWaste || []).join(', ') || '—'}</span>
                    </div>
                    <div className="result-row">
                      <span className="key">Listing status</span>
                      <span className="val">
                        {user?.verified
                          ? '✓ Verified — shown in the buyer directory'
                          : 'Awaiting review — not shown in the directory yet'}
                      </span>
                    </div>
                  </div>
                )}

                {isFarmer && (
                  <div className="result-block">
                    <h4>Farm Information</h4>
                    <div className="result-row"><span className="key">Village</span><span className="val">{user?.village || '—'}</span></div>
                    <div className="result-row"><span className="key">District</span><span className="val">{user?.district || '—'}</span></div>
                    <div className="result-row">
                      <span className="key">Main Crop</span>
                      <span className="val">
                        {user?.cropType ? user.cropType.charAt(0).toUpperCase() + user.cropType.slice(1) : '—'}
                      </span>
                    </div>
                    <div className="result-row">
                      <span className="key">Land Area</span>
                      <span className="val">{user?.landArea ? `${user.landArea} acres` : '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="p-name">Full Name</label>
                    <input id="p-name" name="name" value={form.name} onChange={handleChange} />
                  </div>

                  {isBuyer && (
                    <>
                      <div className="form-group">
                        <label htmlFor="p-company">Company / Plant name</label>
                        <input id="p-company" name="companyName" value={form.companyName} onChange={handleChange} placeholder="Shown to farmers in the directory" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="p-btype">Business type</label>
                        <select id="p-btype" name="buyerType" value={form.buyerType} onChange={handleChange}>
                          <option value="">Select type</option>
                          {BUYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="p-bdistrict">District</label>
                        <select id="p-bdistrict" name="district" value={form.district} onChange={handleChange}>
                          <option value="">Select district</option>
                          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="p-cap">Intake capacity (tons/day)</label>
                        <input id="p-cap" type="number" min="0" step="0.5" name="capacityTonsPerDay" value={form.capacityTonsPerDay} onChange={handleChange} />
                      </div>
                      <div className="form-group form-group-wide">
                        <label htmlFor="p-waste">Residue you accept</label>
                        <input id="p-waste" name="acceptedWaste" value={form.acceptedWaste} onChange={handleChange} placeholder="rice, wheat, cotton" />
                        <small className="field-hint">Separate each crop with a comma.</small>
                      </div>
                    </>
                  )}

                  {isFarmer && (
                    <>
                      <div className="form-group">
                        <label htmlFor="p-village">Village</label>
                        <input id="p-village" name="village" value={form.village} onChange={handleChange} placeholder="Village / Town" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="p-district">District</label>
                        <select id="p-district" name="district" value={form.district} onChange={handleChange}>
                          <option value="">Select district</option>
                          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="p-crop">Main Crop</label>
                        <select id="p-crop" name="cropType" value={form.cropType} onChange={handleChange}>
                          {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="p-land">Land Area (acres)</label>
                        <input id="p-land" type="number" min="0" step="0.1" name="landArea" value={form.landArea} onChange={handleChange} />
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={handleSave}>💾 Save Changes</button>
                  <button className="btn btn-ghost" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Alert preferences ──────────────────────────── */}
      {tab === 'profile' && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-icon amber" aria-hidden="true">🔔</div>
            <div>
              <div className="card-title">Alerts</div>
              <div className="card-subtitle">How AgriWaste Nexus reaches you</div>
            </div>
          </div>
          <div className="card-body">
            <div className="pref-row">
              <div>
                <div className="pref-label">SMS alerts to +91 {user?.mobile || '—'}</div>
                <div className="pref-help">
                  A text message when someone requests your residue, replies to an offer
                  or your account details are confirmed. In-app notifications keep working
                  either way.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyByPhone}
                aria-label="SMS alerts"
                className={`switch ${notifyByPhone ? 'on' : ''}`}
                disabled={savingPrefs}
                onClick={togglePhoneAlerts}
              >
                <span className="switch-knob" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── History tab ────────────────────────────────── */}
      {tab === 'history' && (
        <div>
          {loading ? (
            <div className="loading"><div className="spinner" /> Loading your history…</div>
          ) : calcs.length === 0 ? (
            <EmptyState
              emoji="📊"
              title="No calculations yet"
              description="Complete your first waste analysis to see your sustainability impact."
              actionLabel={setPage ? 'Start Calculation' : undefined}
              onAction={setPage ? () => setPage('calculator') : undefined}
              image={IMG.field}
            />
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <caption className="sr-only">Your saved waste calculations</caption>
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Crop &amp; Area</th>
                      <th scope="col" className="num">Residue</th>
                      <th scope="col" className="num">CO₂ Avoided</th>
                      <th scope="col" className="num">Biogas</th>
                      <th scope="col" className="num">Potential Income</th>
                      <th scope="col">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcs.map((c, i) => (
                      <tr key={c._id || c.id || i}>
                        <td>#{calcs.length - i}</td>
                        <td>
                          <strong style={{ color: 'var(--ink)' }}>
                            {c.inputs?.cropType
                              ? c.inputs.cropType.charAt(0).toUpperCase() + c.inputs.cropType.slice(1)
                              : '—'}
                          </strong>
                          <div className="muted" style={{ fontSize: '0.75rem' }}>
                            {c.inputs?.area} {c.inputs?.unit}
                          </div>
                        </td>
                        <td className="num">{c.result?.waste?.residueGenerated} t</td>
                        <td className="num">{c.result?.waste?.co2Avoided} t</td>
                        <td className="num">{c.result?.biogas?.totalBiogasM3} m³</td>
                        <td className="num">
                          <strong style={{ color: 'var(--green-700)' }}>
                            {inr(c.result?.credits?.totalIncome)}
                          </strong>
                        </td>
                        <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ fontSize: '0.76rem', marginTop: 10 }}>
                Scroll the table sideways on a narrow screen to see every column.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
