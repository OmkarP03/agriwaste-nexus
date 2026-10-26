import React, { useState, useEffect } from 'react';

const SLIDES = [
  {
    src: '/images/slide1.png',
    title: 'Rice Straw to Biogas',
    subtitle: 'Punjab & Maharashtra Farmers Earning ₹15,000+ per Acre',
    tag: 'SUCCESS STORY',
  },
  {
    src: '/images/slide2.png',
    title: 'Biochar Production Unit',
    subtitle: 'Slow Pyrolysis at 500°C — 30% Yield from Wheat Stubble',
    tag: 'TECHNOLOGY',
  },
  {
    src: '/images/slide3.png',
    title: 'Community Biogas Plant',
    subtitle: 'Satara Hub Serving 500+ Households Daily',
    tag: 'INFRASTRUCTURE',
  },
  {
    src: '/images/slide4.png',
    title: 'Carbon Credit Marketplace',
    subtitle: 'Farmers Earning ₹1,500 per Tonne CO₂ Avoided — Verra VCS',
    tag: 'CARBON MARKET',
  },
  {
    src: '/images/slide5.png',
    title: 'Farm Waste Marketplace',
    subtitle: '50+ Verified Buyers Connected with 1,000+ Farmers Across Maharashtra',
    tag: 'MARKETPLACE',
  },
];

const FALLBACK_COLORS = [
  'linear-gradient(160deg, #1a3d1f 0%, #2C5F2D 60%)',
  'linear-gradient(160deg, #0f2a1a 0%, #1a4d2e 60%)',
  'linear-gradient(160deg, #1a2a0f 0%, #3a5c1a 60%)',
  'linear-gradient(160deg, #2a1a00 0%, #5c3a00 60%)',
  'linear-gradient(160deg, #0a1a2a 0%, #1a3a5c 60%)',
];

export default function HeroSlideshow() {
  const [current, setCurrent]     = useState(0);
  const [playing, setPlaying]     = useState(true);
  const [animating, setAnimating] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);  // ✅ FIXED
  const [imgError, setImgError]   = useState(false);  // ✅ FIXED

  // ✅ Reset image state every time slide changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [current]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => goNext(), 4000);
    return () => clearInterval(interval);
  }, [current, playing]);

  function goTo(idx) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 300);
  }

  function goNext() { goTo((current + 1) % SLIDES.length); }
  function goPrev() { goTo((current - 1 + SLIDES.length) % SLIDES.length); }

  const slide = SLIDES[current];

  return (
    <div className="slideshow-wrap">

      <div
        className={`slide-main ${animating ? 'slide-fade' : ''}`}
        style={{
          background: imgError ? FALLBACK_COLORS[current] : '#111',
          position: 'relative',
          height: 360,
          overflow: 'hidden',
        }}
      >
        {/* ✅ Image always tries to load — shows fallback color if error */}
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.title}
          onLoad={() => { setImgLoaded(true); setImgError(false); }}
          onError={() => { setImgError(true); setImgLoaded(false); }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0,
            display: imgError ? 'none' : 'block',   // ✅ hide if error
            opacity: imgLoaded ? 1 : 0,             // ✅ fade in when loaded
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Dark overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
          zIndex: 1,
        }} />

        {/* Grid texture */}
        <div className="slide-grid-overlay" style={{ zIndex: 2 }} />

        {/* Content */}
        <div className="slide-content" style={{ position: 'relative', zIndex: 3 }}>
          <div className="slide-tag">{slide.tag}</div>
          <h2 className="slide-title">{slide.title}</h2>
          <p className="slide-subtitle">{slide.subtitle}</p>
        </div>

        {/* Counter */}
        <div className="slide-counter" style={{ zIndex: 3 }}>
          {current + 1} / {SLIDES.length}
        </div>

        {/* Play/Pause */}
        <button className="slide-playpause" style={{ zIndex: 3 }} onClick={() => setPlaying(!playing)}>
          {playing ? '⏸' : '▶'}
        </button>

        {/* Arrows */}
        <button className="slide-btn slide-prev" style={{ zIndex: 3 }} onClick={goPrev}>‹</button>
        <button className="slide-btn slide-next" style={{ zIndex: 3 }} onClick={goNext}>›</button>
      </div>

      {/* Live Ticker */}
      <div className="live-ticker">
        <div className="ticker-label">LIVE UPDATES</div>
        <div className="ticker-content">
          <div className="ticker-scroll">
            <span>🌾 500MT crop residue generated yearly in India &nbsp;|&nbsp;</span>
            <span>♻️ AgriWaste Nexus helps farmers earn ₹15,000+ per acre &nbsp;|&nbsp;</span>
            <span>🌍 Carbon credit price: ₹1,200–₹2,000 per tonne CO₂ &nbsp;|&nbsp;</span>
            <span>🔥 Biogas potential: 1 ton dry biomass = 280 m³ biogas &nbsp;|&nbsp;</span>
            <span>⚗️ Biochar value: ₹10,000 per ton — improving soil health &nbsp;|&nbsp;</span>
            <span>📍 6 certified biomass plants across Maharashtra &nbsp;|&nbsp;</span>
          </div>
        </div>
        <div className="ticker-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`ticker-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
          <button className="ticker-nav" onClick={goPrev}>‹</button>
          <button className="ticker-nav" onClick={() => setPlaying(!playing)}>
            {playing ? '⏸' : '▶'}
          </button>
          <button className="ticker-nav" onClick={goNext}>›</button>
        </div>
      </div>

    </div>
  );
}