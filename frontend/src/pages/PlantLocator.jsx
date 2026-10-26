import React, { useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

import SectionHead from '../components/SectionHead';
import KpiCard from '../components/KpiCard';
import EmptyState from '../components/EmptyState';
import { IMG, bgImage, OVERLAY_MID } from '../utils/media';
import { haversineKm, directionsUrl } from '../utils/geo';

// ─── Fix leaflet default icons ────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Plant data (unchanged) ──────────────────────────────
const PLANTS = [
  { id:'P001', name:'Pune Biogas Processing Unit',          type:'Biogas',  city:'Pune',                     distanceKm:5,   capacity:'50T/day',  contact:'+91-2012345678', certified:true,  desc:'Handles rice, wheat & maize straw. Running since 2019.',  lat:18.5204, lng:73.8567 },
  { id:'P002', name:'GreenChar Nashik',                     type:'Biochar', city:'Nashik',                   distanceKm:180, capacity:'20T/day',  contact:'+91-2534567890', certified:true,  desc:'Slow pyrolysis plant. Exports biochar to EU markets.',     lat:20.0059, lng:73.7898 },
  { id:'P003', name:'Solapur Biomass Power',                type:'Biomass', city:'Solapur',                  distanceKm:250, capacity:'100T/day', contact:'+91-2174563210', certified:false, desc:'Co-gen plant. Accepts sugarcane bagasse & cotton stalks.', lat:17.6867, lng:75.9060 },
  { id:'P004', name:'AgroCompost Kolhapur',                 type:'Compost', city:'Kolhapur',                 distanceKm:230, capacity:'30T/day',  contact:'+91-2312345670', certified:true,  desc:'Vermicomposting + aerobic composting. ISO certified.',     lat:16.7050, lng:74.2433 },
  { id:'P005', name:'Satara BioEnergy Hub',                 type:'Biogas',  city:'Satara',                   distanceKm:110, capacity:'40T/day',  contact:'+91-2162345670', certified:true,  desc:'Community biogas serving 500+ households daily.',          lat:17.6805, lng:74.0183 },
  { id:'P006', name:'Chatrapati Sambhajinagar Green Plant', type:'Biochar', city:'Chatrapati Sambhajinagar', distanceKm:235, capacity:'25T/day',  contact:'+91-2402345670', certified:false, desc:'New facility. Pyrolysis + activated carbon production.',   lat:19.8762, lng:75.3433 },
];

const TYPE_ICON  = { All:'🏭', Biogas:'🔥', Biochar:'⚗️', Biomass:'⚡', Compost:'🌱' };
const TYPE_CLASS = { Biogas:'type-Biogas', Biochar:'type-Biochar', Biomass:'type-Biomass', Compost:'type-Compost' };
const TYPE_COLOR = { Biogas:'#F5A623', Biochar:'#8B5E3C', Biomass:'#2C7A3F', Compost:'#2563eb' };

function createMarkerIcon(type, isSelected, isNearest) {
  const color = TYPE_COLOR[type] || '#667066';
  const size  = isSelected ? 44 : 36;
  const emoji = TYPE_ICON[type] || '🏭';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px; height:${size}px;
        background:${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        border: ${isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.85)'};
        box-shadow: ${isSelected ? `0 0 0 4px ${color}55, 0 4px 12px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)'};
        display:flex; align-items:center; justify-content:center;
        transition: all 0.2s; cursor:pointer; position:relative;
      ">
        <span style="transform:rotate(45deg); font-size:${size * 0.38}px; line-height:1;">${emoji}</span>
      </div>
      ${isNearest ? `<div style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);background:#2C7A3F;color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;white-space:nowrap;z-index:999;">★ NEAREST</div>` : ''}
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function MapController({ selectedPlant }) {
  const map = useMap();
  React.useEffect(() => {
    if (selectedPlant) {
      map.flyTo([selectedPlant.lat, selectedPlant.lng], 13, { animate: true, duration: 1.2 });
    }
  }, [selectedPlant, map]);
  return null;
}

export default function PlantLocator() {
  const [filter, setFilter]               = useState('All');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [search, setSearch]               = useState('');
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [userLocation, setUserLocation]   = useState(null);
  const [locating, setLocating]           = useState(false);
  const [locationNote, setLocationNote]   = useState('');

  const types = ['All', 'Biogas', 'Biochar', 'Biomass', 'Compost'];

  // Distances were fixed numbers on each plant, so "nearest" was the same
  // plant whether the farmer was in Nashik or Nagpur. Once we know where
  // they are, measure it properly.
  const plants = useMemo(() => PLANTS.map(p => ({
    ...p,
    km: userLocation ? haversineKm(userLocation, { lat: p.lat, lng: p.lng }) : p.distanceKm,
    measured: Boolean(userLocation),
  })), [userLocation]);

  const shown = useMemo(() => plants.filter(p => {
    if (filter !== 'All' && p.type !== filter) return false;
    if (certifiedOnly && !p.certified) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => a.km - b.km), [plants, filter, certifiedOnly, search]);

  const nearestPlant = shown.length > 0
    ? shown.reduce((a, b) => (a.km < b.km ? a : b))
    : null;

  const totalCapacity = PLANTS.reduce((s, p) => s + (parseInt(p.capacity, 10) || 0), 0);

  function handleSelect(plant) {
    setSelectedPlant(prev => (prev?.id === plant.id ? null : plant));
  }

  function getUserLocation() {
    setLocating(true);
    setLocationNote('');

    if (!navigator.geolocation) {
      setUserLocation({ lat: 18.5204, lng: 73.8567 });
      setLocationNote('This browser cannot share a location — distances are measured from Pune.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationNote('');
        setLocating(false);
      },
      () => {
        setUserLocation({ lat: 18.5204, lng: 73.8567 });
        setLocationNote('Location was not shared — distances are measured from Pune instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function clearFilters() { setFilter('All'); setSearch(''); setCertifiedOnly(false); }

  return (
    <div>

      {/* ── Banner ─────────────────────────────────────── */}
      <section
        className="img-banner"
        style={{ ...bgImage(IMG.biogas, OVERLAY_MID), marginBottom: 22 }}
      >
        <h3>📍 Nearby Biomass Plants</h3>
        <p>
          Find biogas, biochar, biomass and compost facilities near your farm in Maharashtra.
          Select a plant to centre it on the map and see its capacity and contact details.
        </p>
      </section>

      {/* ── Overview ───────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <KpiCard icon="🏭" tone="green" label="Total Plants" value={PLANTS.length} />
        <KpiCard icon="✅" tone="green" label="Certified" value={PLANTS.filter(p => p.certified).length} />
        <KpiCard icon="📍" tone="amber" label="Nearest Plant"
          value={nearestPlant ? nearestPlant.km : '—'} unit="km"
          note={nearestPlant
            ? `${nearestPlant.name}${userLocation ? '' : ' · tap My Location for real distances'}`
            : undefined} />
        <KpiCard icon="⚙️" tone="earth" label="Total Capacity" value={totalCapacity} unit="T/day" />
      </div>

      {/* ── Filters ────────────────────────────────────── */}
      <div className="filter-bar">
        <div className="search-field">
          <span className="sf-icon" aria-hidden="true">🔍</span>
          <label className="sr-only" htmlFor="pl-search">Search plants</label>
          <input
            id="pl-search" className="input" type="search"
            placeholder="Search plant name or city…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="chip-row" role="group" aria-label="Filter by plant type">
          {types.map(t => (
            <button
              key={t}
              type="button"
              className={`chip ${filter === t ? 'active' : ''}`}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              <span aria-hidden="true">{TYPE_ICON[t]}</span> {t}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`chip ${certifiedOnly ? 'active' : ''}`}
          aria-pressed={certifiedOnly}
          onClick={() => setCertifiedOnly(!certifiedOnly)}
        >
          ✅ Certified only
        </button>

        <button type="button" className="btn btn-outline btn-sm" onClick={getUserLocation} disabled={locating}>
          {locating ? '⏳ Locating…' : userLocation ? '📡 Update my location' : '📡 My Location'}
        </button>
      </div>

      {locationNote && (
        <div className="alert alert-warning" role="status">⚠️ {locationNote}</div>
      )}
      {userLocation && !locationNote && (
        <div className="alert alert-info" role="status">
          <span aria-hidden="true">📍</span>
          <span>Distances below are measured from where you are now.</span>
        </div>
      )}

      {/* ── Nearest highlight ──────────────────────────── */}
      {nearestPlant && (
        <div
          className="alert alert-success"
          style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}
        >
          <span>
            <strong>★ Nearest to you — {nearestPlant.name}</strong>
            <span className="muted" style={{ display: 'block', fontSize: '0.78rem' }}>
              {nearestPlant.km} km away · {nearestPlant.capacity} · {nearestPlant.type}
            </span>
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => handleSelect(nearestPlant)}>
            📍 Show on map
          </button>
        </div>
      )}

      {/* ── Map + nearby list ──────────────────────────── */}
      <SectionHead
        icon="🗺️"
        title="Map & Nearby Plants"
        sub={`${shown.length} of ${PLANTS.length} plants shown — select one to centre the map`}
      />

      {shown.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No plants match your filters"
          description="Try a different plant type, clear the certified-only filter, or search for another city."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="locator-split">

          {/* Nearby plants list */}
          <div className="locator-aside">
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--line)',
              fontSize: '0.68rem', fontWeight: 800, color: 'var(--ink-soft)',
              textTransform: 'uppercase', letterSpacing: '0.9px',
              position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 2,
            }}>
              Nearby plants ({shown.length})
            </div>

            {shown.map(p => {
              const isSelected = selectedPlant?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  aria-pressed={isSelected}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '12px 14px', border: 'none',
                    borderBottom: '1px solid var(--line-soft)',
                    borderLeft: isSelected ? '3px solid var(--green-600)' : '3px solid transparent',
                    background: isSelected ? 'var(--green-50)' : 'var(--surface)',
                    cursor: 'pointer', font: 'inherit', transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', background: 'var(--green-100)',
                      }}
                    >
                      {TYPE_ICON[p.type]}
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{
                        display: 'block', fontFamily: 'Syne', fontWeight: 700,
                        fontSize: '0.86rem', color: 'var(--ink)', lineHeight: 1.3,
                      }}>
                        {p.name}
                      </span>
                      <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                        <span className={`plant-type-badge ${TYPE_CLASS[p.type]}`}>{p.type}</span>
                        {p.certified && <span className="pill pill-available">✓ Certified</span>}
                        {nearestPlant?.id === p.id && <span className="pill pill-pending">★ Nearest</span>}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: 6 }}>
                        📍 {p.city} · ⚙️ {p.capacity} · 🛣️ {p.km} km{p.measured ? '' : ' (approx.)'}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--gray-700)', marginTop: 4, lineHeight: 1.45 }}>
                        {p.desc}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map */}
          <div className="locator-map">
            {selectedPlant && (
              <div style={{
                position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--surface)', borderRadius: 10, padding: '8px 14px',
                boxShadow: 'var(--shadow-md)', zIndex: 1000,
                display: 'flex', alignItems: 'center', gap: 10, maxWidth: '88%',
                border: '1px solid var(--line)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem' }}>{selectedPlant.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                    {selectedPlant.type} · {selectedPlant.km} km · {selectedPlant.capacity}
                  </div>
                </div>
                <a
                  href={directionsUrl(userLocation, selectedPlant)}
                  target="_blank" rel="noreferrer"
                  className="btn btn-outline btn-sm"
                  aria-label={`Directions to ${selectedPlant.name}`}
                >🧭</a>
                <a href={`tel:${selectedPlant.contact}`} className="btn btn-outline btn-sm" aria-label="Call the plant">📞</a>
                <button className="icon-btn" onClick={() => setSelectedPlant(null)} aria-label="Clear selection">
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            )}

            <MapContainer center={[19.0, 76.0]} zoom={7} style={{ width: '100%', height: '100%', zIndex: 1 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController selectedPlant={selectedPlant} />

              {userLocation && selectedPlant && (
                <Polyline
                  positions={[[userLocation.lat, userLocation.lng], [selectedPlant.lat, selectedPlant.lng]]}
                  color="#2C7A3F" weight={3} dashArray="8,6" opacity={0.85}
                />
              )}

              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={L.divIcon({
                    className: '',
                    html: '<div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px #2563eb55;"></div>',
                    iconSize: [16, 16], iconAnchor: [8, 8],
                  })}
                >
                  <Popup><strong>📍 Your Location</strong></Popup>
                </Marker>
              )}

              {shown.map(plant => (
                <Marker
                  key={plant.id}
                  position={[plant.lat, plant.lng]}
                  icon={createMarkerIcon(plant.type, selectedPlant?.id === plant.id, nearestPlant?.id === plant.id)}
                  eventHandlers={{ click: () => handleSelect(plant) }}
                >
                  <Popup maxWidth={240}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', minWidth: 200 }}>
                      <div style={{
                        background: TYPE_COLOR[plant.type], margin: '-12px -12px 10px -12px',
                        padding: '10px 12px', borderRadius: '8px 8px 0 0',
                      }}>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{plant.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', marginTop: 2 }}>{plant.city}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#667066' }}>Type</span>
                          <span className={`plant-type-badge ${TYPE_CLASS[plant.type]}`}>{plant.type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#667066' }}>Capacity</span><strong>{plant.capacity}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#667066' }}>Distance</span><strong>{plant.km} km</strong>
                        </div>
                        {plant.certified && (
                          <div style={{
                            background: '#E8F5E9', color: '#174A27', padding: '3px 8px',
                            borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                            textAlign: 'center', marginTop: 2,
                          }}>
                            ✓ Certified Facility
                          </div>
                        )}
                        <a
                          href={`tel:${plant.contact}`}
                          style={{
                            display: 'block', textAlign: 'center', background: '#2C7A3F',
                            color: 'white', padding: '6px', borderRadius: 6,
                            textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, marginTop: 2,
                          }}
                        >
                          📞 {plant.contact}
                        </a>
                        <a
                          href={directionsUrl(userLocation, plant)}
                          target="_blank" rel="noreferrer"
                          style={{
                            display: 'block', textAlign: 'center', background: '#ffffff',
                            color: '#174A27', border: '1px solid #2C7A3F', padding: '5px',
                            borderRadius: 6, textDecoration: 'none', fontSize: '0.76rem',
                            fontWeight: 700, marginTop: 4,
                          }}
                        >
                          🧭 Directions
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Legend */}
            <div style={{
              position: 'absolute', bottom: 16, right: 10,
              background: 'var(--surface)', borderRadius: 10, padding: '8px 12px',
              boxShadow: 'var(--shadow-md)', zIndex: 1000, fontSize: '0.72rem',
              border: '1px solid var(--line)',
            }}>
              <div style={{ fontWeight: 800, marginBottom: 5, color: 'var(--gray-700)' }}>Legend</div>
              {Object.entries(TYPE_COLOR).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink-soft)' }}>{type}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, borderTop: '1px solid var(--line-soft)', paddingTop: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                <span style={{ color: 'var(--ink-soft)' }}>You</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="alert alert-info" style={{ marginTop: 22 }}>
        <span aria-hidden="true">🛰️</span>
        <span><strong>v2 roadmap:</strong> Google Maps API + ISRO satellite crop detection + IoT farm sensors</span>
      </div>
    </div>
  );
}
