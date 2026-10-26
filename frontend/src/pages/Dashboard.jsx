import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';

import { useAuth } from '../context/AuthContext';
import { API } from '../utils/apiRoot';
import { useLang } from '../context/LangContext';
import SectionHead from '../components/SectionHead';
import { DistrictBenchmarkSection } from '../components/DistrictBenchmark';
import KpiCard from '../components/KpiCard';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import { IMG, bgImage, OVERLAY_MID, OVERLAY_STRONG, CROP_EMOJI, inr, compactInr } from '../utils/media';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);


const CHART_GREEN = '#174A27';
const CHART_GREEN_MID = '#2C7A3F';
const CHART_GREEN_LIGHT = '#66BB6A';
const CHART_GOLD = '#F5A623';
const CHART_EARTH = '#8B5E3C';
const CHART_BLUE = '#2563eb';

const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: '#eef1ee' }, ticks: { color: '#667066', font: { size: 11 } } },
    x: { grid: { display: false }, ticks: { color: '#667066', font: { size: 11 } } },
  },
};

const donutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '58%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { font: { size: 11 }, boxWidth: 10, boxHeight: 10, padding: 12, color: '#3d463d' },
    },
  },
};

export default function Dashboard({ setPage }) {
  const { t } = useLang();
  const { user } = useAuth();

  const isBuyer = user?.role === 'buyer';

  const [calcs, setCalcs]         = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [buyerStats, setBuyerStats] = useState(null);
  const [listings, setListings]   = useState([]);
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // ── Load everything this dashboard shows ────────────────
  useEffect(() => {
    if (!user?._id) return;
    let alive = true;
    setLoading(true);

    const calls = [
      axios.get(`${API}/calculations/user/${user._id}`).catch(() => null),
      axios.get(`${API}/marketplace/search?search=`).catch(() => null),
      isBuyer
        ? axios.get(`${API}/requests/buyer-stats/${user._id}`).catch(() => null)
        : axios.get(`${API}/marketplace/analytics/${user._id}`).catch(() => null),
      isBuyer
        ? axios.get(`${API}/requests/buyer/${user._id}`).catch(() => null)
        : axios.get(`${API}/requests/farmer/${user._id}`).catch(() => null),
    ];

    Promise.all(calls).then(([calcRes, listRes, statRes, reqRes]) => {
      if (!alive) return;
      setCalcs(calcRes?.data?.calculations || []);
      setListings(listRes?.data?.listings || []);
      if (isBuyer) setBuyerStats(statRes?.data || null);
      else setAnalytics(statRes?.data || null);
      setRequests(reqRes?.data?.requests || []);
      setLoading(false);
    });

    return () => { alive = false; };
  }, [user, isBuyer]);

  // ── Aggregate real calculation data ─────────────────────
  const totals = useMemo(() => {
    const sum = (fn) => calcs.reduce((a, c) => a + (Number(fn(c)) || 0), 0);
    return {
      count:      calcs.length,
      residue:    sum(c => c.result?.waste?.residueGenerated),
      dry:        sum(c => c.result?.waste?.dryBiomass),
      usable:     sum(c => c.result?.waste?.usableBiomass),
      co2:        sum(c => c.result?.waste?.co2Avoided),
      kwh:        sum(c => c.result?.biogas?.totalKWh),
      biochar:    sum(c => c.result?.biochar?.biocharYield),
      biocharRev: sum(c => c.result?.biochar?.estimatedRevenue),
      credits:    sum(c => c.result?.credits?.carbonCredits),
      creditIncome: sum(c => c.result?.credits?.incomeMid),
      fertSaving: sum(c => c.result?.credits?.fertilizerSaving),
      trees:      sum(c => c.result?.credits?.equivalentTrees),
      income:     sum(c => c.result?.credits?.totalIncome),
    };
  }, [calcs]);

  const hasData = totals.count > 0;

  // ── AgriWaste Nexus Sustainability Score (platform metric) ──
  const score = useMemo(() => {
    if (!hasData) return 0;
    const engagement = Math.min(30, totals.count * 10);
    const climate    = Math.min(25, totals.co2 * 1.5);
    const recovery   = Math.min(25, totals.usable * 2);
    const market     = Math.min(20, (analytics?.totalListings || 0) * 5 + 5);
    return Math.max(1, Math.min(100, Math.round(engagement + climate + recovery + market)));
  }, [hasData, totals, analytics]);

  // ── Charts from real data ───────────────────────────────
  const biomassChart = {
    labels: ['Residue Generated', 'Dry Biomass', 'Usable Biomass'],
    datasets: [{
      label: 'Tons',
      data: [totals.residue.toFixed(2), totals.dry.toFixed(2), totals.usable.toFixed(2)],
      backgroundColor: [CHART_GREEN, CHART_GREEN_MID, CHART_GREEN_LIGHT],
      borderRadius: 8,
      maxBarThickness: 74,
    }],
  };

  const valueChart = {
    labels: ['Biogas', 'Biochar', 'Carbon Credits', 'Fertilizer Saving'],
    datasets: [{
      data: [
        Math.round(totals.kwh * 8),
        Math.round(totals.biocharRev),
        Math.round(totals.creditIncome),
        Math.round(totals.fertSaving),
      ],
      backgroundColor: [CHART_GREEN_MID, CHART_EARTH, CHART_GOLD, CHART_BLUE],
      borderWidth: 0,
    }],
  };

  // ── Recent activity from real records ───────────────────
  const activity = useMemo(() => {
    const items = [];

    calcs.slice(0, 4).forEach(c => {
      const crop = c.inputs?.cropType || 'crop';
      items.push({
        key: 'calc-' + (c._id || c.id || Math.random()),
        icon: '✓',
        tone: '',
        title: `Waste analysis completed — ${crop.charAt(0).toUpperCase() + crop.slice(1)} (${c.inputs?.area} ${c.inputs?.unit})`,
        meta: `${Number(c.result?.waste?.residueGenerated || 0).toFixed(2)} t residue · ${Number(c.result?.waste?.co2Avoided || 0).toFixed(2)} t CO₂ avoided`,
        date: c.createdAt || c.date,
      });
    });

    requests.slice(0, 3).forEach(r => {
      items.push({
        key: 'req-' + r._id,
        icon: '✓',
        tone: r.status === 'pending' ? 'amber' : '',
        title: isBuyer
          ? `Purchase request sent to ${r.farmerName}`
          : `Purchase request received from ${r.buyerName}`,
        meta: `${r.quantity} tons · ${String(r.status || 'pending')}`,
        date: r.createdAt,
      });
    });

    if (!isBuyer) {
      listings
        .filter(l => l.userId === user?._id || l.farmerName === user?.name)
        .slice(0, 3)
        .forEach(l => {
          items.push({
            key: 'list-' + l._id,
            icon: '✓',
            tone: 'blue',
            title: `Marketplace listing created — ${l.wasteType || l.cropType}`,
            meta: `${l.quantity} tons · ${inr(l.pricePerTon)}/ton`,
            date: l.createdAt || l.postedDate,
          });
        });
    }

    return items
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 6);
  }, [calcs, requests, listings, isBuyer, user]);

  // ── Quick actions (existing setPage navigation only) ────
  const quickActions = isBuyer
    ? [
        { icon: '🛒', tone: 'amber', page: 'marketplace', title: 'Browse Farm Waste',   desc: 'Find residue near you' },
        { icon: '📨', tone: 'blue',  page: 'myRequests',  title: 'My Requests',         desc: 'Track purchase requests' },
        { icon: '📍', tone: 'green', page: 'locator',     title: 'Find Nearby Plants',  desc: 'Biogas, biochar & more' },
        { icon: '👤', tone: 'earth', page: 'profile',     title: 'My Profile',          desc: 'Account details' },
      ]
    : [
        { icon: '🌾', tone: 'green', page: 'calculator',  title: 'Calculate Crop Waste',      desc: 'Residue & biomass' },
        { icon: '🔥', tone: 'amber', page: 'biogas',      title: 'Estimate Biogas',           desc: 'Gas, kWh & LPG' },
        { icon: '⚗️', tone: 'earth', page: 'biochar',     title: 'Biochar Recommendation',    desc: 'Yield & soil benefit' },
        { icon: '🌍', tone: 'blue',  page: 'carbon',      title: 'Calculate Carbon Credits',  desc: 'Credits & income' },
        { icon: '🛒', tone: 'amber', page: 'marketplace', title: 'Sell Farm Waste',           desc: 'List your residue' },
        { icon: '📍', tone: 'green', page: 'locator',     title: 'Find Nearby Plants',        desc: 'Plants near you' },
      ];

  const previewListings = listings.slice(0, 4);

  return (
    <div>

      {/* ══════════ 1. HERO ══════════ */}
      <section
        className="dash-hero animate-in"
        style={{ ...bgImage(IMG.hero, OVERLAY_MID) }}
      >
        <div className="dash-hero-inner">
          <span className="hero-eyebrow">🌿 {t('heroTag')}</span>
          <h1>{t('heroTitle')}</h1>
          <p className="hero-sub">{t('heroSub')}</p>

          <div className="hero-actions">
            <button className="btn btn-light" onClick={() => setPage(isBuyer ? 'marketplace' : 'calculator')}>
              {isBuyer ? '🛒 ' + t('exploreMarketplace') : '🌾 ' + t('calculateWaste')}
            </button>
            <button className="btn btn-on-dark" onClick={() => setPage(isBuyer ? 'locator' : 'marketplace')}>
              {isBuyer ? '📍 Find Nearby Plants' : '🛒 ' + t('exploreMarketplace')}
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">500 MT+</div>
              <div className="hero-stat-label">{t('annualCropResidue')}</div>
            </div>
            {hasData && !isBuyer ? (
              <>
                <div>
                  <div className="hero-stat-value">{totals.co2.toFixed(2)} t</div>
                  <div className="hero-stat-label">{t('exampleCo2')}</div>
                </div>
                <div>
                  <div className="hero-stat-value">{compactInr(totals.income)}</div>
                  <div className="hero-stat-label">{t('potentialValue')}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="hero-stat-value">~60%</div>
                  <div className="hero-stat-label">Burned openly instead of recovered</div>
                </div>
                <div>
                  <div className="hero-stat-value">₹1.2–2K</div>
                  <div className="hero-stat-label">Carbon credit price per tonne CO₂</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ 2. WELCOME STRIP ══════════ */}
      <div className="welcome-strip animate-in d1">
        <div>
          <h3>
            {t('welcomeBack')}, {user?.name} <span aria-hidden="true">👋</span>
          </h3>
          <div className="ws-sub">{isBuyer ? t('buyerOverview') : t('farmOverview')}</div>
        </div>

        {isBuyer ? (
          <div className="ws-metrics">
            <div>
              <div className="ws-metric-value">{buyerStats?.total ?? 0}</div>
              <div className="ws-metric-label">Requests sent</div>
            </div>
            <div>
              <div className="ws-metric-value">{buyerStats?.accepted ?? 0}</div>
              <div className="ws-metric-label">Accepted</div>
            </div>
            <div>
              <div className="ws-metric-value">{buyerStats?.pending ?? 0}</div>
              <div className="ws-metric-label">Pending</div>
            </div>
            <div>
              <div className="ws-metric-value">{buyerStats?.quantity ?? 0} t</div>
              <div className="ws-metric-label">Quantity requested</div>
            </div>
          </div>
        ) : (
          <div className="ws-metrics">
            <div>
              <div className="ws-metric-value">{totals.count}</div>
              <div className="ws-metric-label">Calculations</div>
            </div>
            <div>
              <div className="ws-metric-value">{totals.credits.toFixed(2)}</div>
              <div className="ws-metric-label">Carbon credits</div>
            </div>
            <div>
              <div className="ws-metric-value">{totals.co2.toFixed(2)} t</div>
              <div className="ws-metric-label">CO₂ avoided</div>
            </div>
            <div>
              <div className="ws-metric-value">{totals.usable.toFixed(2)} t</div>
              <div className="ws-metric-label">Biomass processed</div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ 3. KPI CARDS ══════════ */}
      {!isBuyer && (
        <>
          <SectionHead icon="📈" title={t('kpiTitle')} sub={t('kpiSub')} />
          {hasData ? (
            <div className="kpi-grid animate-in d2">
              <KpiCard icon="🌾" tone="green" label={t('biomassProcessed')}
                value={totals.usable.toFixed(2)} unit="tons"
                note={`from ${totals.residue.toFixed(2)} t residue generated`} />
              <KpiCard icon="🔥" tone="amber" label={t('energyPotential')}
                value={Math.round(totals.kwh).toLocaleString('en-IN')} unit="kWh"
                note="via anaerobic digestion" />
              <KpiCard icon="⚗️" tone="earth" label={t('biocharPotential')}
                value={totals.biochar.toFixed(2)} unit="tons"
                note="slow pyrolysis at 500°C" />
              <KpiCard icon="🌍" tone="green" label="Carbon Credits"
                value={totals.credits.toFixed(2)} unit="credits"
                note={`${Math.round(totals.trees).toLocaleString('en-IN')} trees equivalent`} noteTone="up" />
              <KpiCard icon="💰" tone="amber" label={t('potentialValue')}
                value={inr(Math.round(totals.income))}
                note="credits + fertilizer saving + subsidy" noteTone="gold" />
            </div>
          ) : (
            <EmptyState
              emoji="📊"
              title={t('noCalcs')}
              description={t('noCalcsDesc')}
              actionLabel={t('startCalculation')}
              onAction={() => setPage('calculator')}
              image={IMG.field}
            />
          )}
        </>
      )}

      {/* Buyer KPI row */}
      {isBuyer && buyerStats && (
        <>
          <SectionHead icon="📈" title="Procurement Overview" sub="Your purchase requests at a glance" />
          <div className="kpi-grid animate-in d2">
            <KpiCard icon="📨" tone="green" label="Total Requests" value={buyerStats.total} />
            <KpiCard icon="✅" tone="green" label="Accepted" value={buyerStats.accepted} />
            <KpiCard icon="⏳" tone="amber" label="Pending" value={buyerStats.pending} />
            <KpiCard icon="✕"  tone="earth" label="Rejected" value={buyerStats.rejected} />
            <KpiCard icon="🌾" tone="amber" label="Quantity Requested" value={buyerStats.quantity} unit="tons" />
          </div>
        </>
      )}

      {/* Farmer marketplace analytics */}
      {!isBuyer && analytics && (
        <>
          <SectionHead icon="🛒" title="Your Marketplace Activity" sub="Listings you have published" />
          <div className="kpi-grid animate-in">
            <KpiCard icon="📋" tone="green" label="Total Listings" value={analytics.totalListings} />
            <KpiCard icon="🟢" tone="green" label="Available" value={analytics.availableListings} />
            <KpiCard icon="🌾" tone="amber" label="Waste Listed" value={analytics.totalWaste} unit="tons" />
            <KpiCard icon="💰" tone="amber" label="Expected Revenue" value={inr(analytics.expectedRevenue)} />
          </div>
        </>
      )}

      {/* ══════════ 4. ANALYTICS ══════════ */}
      {!isBuyer && hasData && (
        <>
          <SectionHead icon="📊" title={t('analyticsTitle')} sub={t('analyticsSub')} />
          <div className="results-grid animate-in">
            <div className="card">
              <div className="card-header">
                <div className="card-icon green" aria-hidden="true">📊</div>
                <div>
                  <div className="card-title">{t('biomassConversion')}</div>
                  <div className="card-subtitle">Tons, across all saved analyses</div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-wrapper">
                  <Bar data={biomassChart} options={barOpts}
                    aria-label="Bar chart of residue generated, dry biomass and usable biomass in tons" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-icon amber" aria-hidden="true">💹</div>
                <div>
                  <div className="card-title">{t('valueGeneration')}</div>
                  <div className="card-subtitle">Estimated value in ₹ by source</div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-wrapper">
                  <Doughnut data={valueChart} options={donutOpts}
                    aria-label="Doughnut chart of value from biogas, biochar, carbon credits and fertilizer saving" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════ 5. ENVIRONMENTAL IMPACT ══════════ */}
      {!isBuyer && hasData && (
        <>
          <SectionHead icon="🌱" title={t('impactTitle')} sub={t('impactSub')} />
          <section
            className="img-banner animate-in"
            style={{ ...bgImage(IMG.field, OVERLAY_STRONG) }}
          >
            <div className="impact-grid" style={{ marginBottom: 24 }}>
              <div className="impact-tile">
                <div className="impact-emoji" aria-hidden="true">🌍</div>
                <div className="impact-value">{totals.co2.toFixed(2)} t</div>
                <div className="impact-label">{t('co2Avoided')}</div>
              </div>
              <div className="impact-tile">
                <div className="impact-emoji" aria-hidden="true">🌳</div>
                <div className="impact-value">{Math.round(totals.trees).toLocaleString('en-IN')}</div>
                <div className="impact-label">{t('equivalentTrees')}</div>
              </div>
              <div className="impact-tile">
                <div className="impact-emoji" aria-hidden="true">🔥</div>
                <div className="impact-value">{Math.round(totals.kwh).toLocaleString('en-IN')}</div>
                <div className="impact-label">kWh {t('energyGenerated')}</div>
              </div>
              <div className="impact-tile">
                <div className="impact-emoji" aria-hidden="true">♻️</div>
                <div className="impact-value">{totals.usable.toFixed(2)} t</div>
                <div className="impact-label">{t('wasteRecovered')}</div>
              </div>
            </div>

            <div style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  {t('sustainabilityScore')}
                </span>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.3rem' }}>
                  {score} <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>/ 100</span>
                </span>
              </div>
              <div
                className="score-track"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="AgriWaste Nexus Sustainability Score"
              >
                <div className="score-fill" style={{ width: `${score}%` }} />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 1.5 }}>
                This is AgriWaste Nexus's own indicator, calculated from the analyses saved to your
                account. It is not an official or government rating.
              </p>
            </div>
          </section>
        </>
      )}

      {/* ══════════ 5b. DISTRICT BENCHMARK ══════════ */}
      {!isBuyer && <DistrictBenchmarkSection district={user?.district} />}

      {/* ══════════ 6. QUICK ACTIONS ══════════ */}
      <SectionHead icon="⚡" title={t('quickActions')} sub={t('quickActionsSub')} />
      <div className="qa-grid animate-in">
        {quickActions.map(a => (
          <button key={a.page + a.title} type="button" className="qa-card" onClick={() => setPage(a.page)}>
            <span className={`qa-icon ${a.tone}`} aria-hidden="true">{a.icon}</span>
            <span style={{ minWidth: 0 }}>
              <span className="qa-title" style={{ display: 'block' }}>{a.title}</span>
              <span className="qa-desc" style={{ display: 'block' }}>{a.desc}</span>
            </span>
            <span className="qa-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      {/* ══════════ 7. MARKETPLACE PREVIEW ══════════ */}
      <SectionHead
        icon="🛒"
        title={t('marketplacePreview')}
        sub={t('marketplacePreviewSub')}
        action={
          <button className="btn btn-outline btn-sm" onClick={() => setPage('marketplace')}>
            {t('viewMarketplace')} →
          </button>
        }
      />
      {previewListings.length > 0 ? (
        <div className="marketplace-grid animate-in">
          {previewListings.map(l => (
            <button
              key={l._id}
              type="button"
              className="listing-card"
              onClick={() => setPage('marketplace')}
              style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', padding: 0 }}
            >
              <div className="listing-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '1.2rem' }} aria-hidden="true">{CROP_EMOJI[l.cropType] || '🌿'}</span>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, marginTop: 2 }}>
                      {l.wasteType || l.cropType}
                    </div>
                  </div>
                  <span className="listing-tag">{l.cropType}</span>
                </div>
              </div>
              <div className="listing-body">
                <div className="listing-price">
                  {inr(l.pricePerTon)}
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--ink-soft)' }}> / ton</span>
                </div>
                <div className="listing-stat"><span>Quantity</span><strong>{l.quantity} tons</strong></div>
                <div className="listing-stat"><span>Location</span><strong>{l.location || '—'}</strong></div>
                <div className="listing-stat"><span>Farmer</span><strong>{l.farmerName}</strong></div>
              </div>
              <div className="listing-footer">
                <StatusPill status={l.status || 'available'} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--green-600)' }}>View →</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🛒"
          title={loading ? 'Loading listings…' : 'No listings yet'}
          description={loading ? '' : 'Farm waste listings posted on the platform will appear here.'}
          actionLabel={loading ? undefined : t('viewMarketplace')}
          onAction={loading ? undefined : () => setPage('marketplace')}
        />
      )}

      {/* ══════════ 8. RECENT ACTIVITY ══════════ */}
      <SectionHead icon="🕘" title={t('recentActivity')} sub="Your latest actions on the platform" />
      {activity.length > 0 ? (
        <div className="card animate-in" style={{ marginBottom: 8 }}>
          <div className="card-body">
            <div className="timeline">
              {activity.map(a => (
                <div className="tl-item" key={a.key}>
                  <span className={`tl-dot ${a.tone}`} aria-hidden="true">{a.icon}</span>
                  <div className="tl-title">{a.title}</div>
                  <div className="tl-meta">
                    {a.meta}
                    {a.date && ' · ' + new Date(a.date).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          emoji="🕘"
          title={loading ? 'Loading activity…' : t('noActivity')}
          description={loading ? '' : t('noActivityDesc')}
          actionLabel={loading || isBuyer ? undefined : t('startCalculation')}
          onAction={loading || isBuyer ? undefined : () => setPage('calculator')}
        />
      )}

    </div>
  );
}
