import React from 'react';

const SOCIAL_LINKS = [
  { name: 'YouTube',    icon: 'YT', color: '#ff0000', bg: '#fff0f0', url: 'https://youtube.com',        followers: '2.1K',      label: 'Subscribe' },
  { name: 'Instagram',  icon: 'IG', color: '#e1306c', bg: '#fff0f5', url: 'https://www.instagram.com/omkar.p__007/',      followers: '458',      label: 'Follow'    },
  { name: 'Twitter',    icon: 'X',  color: '#000000', bg: '#f3f4f6', url: 'https://twitter.com',        followers: '3.2K',      label: 'Follow'    },
  { name: 'LinkedIn',   icon: 'in', color: '#0077b5', bg: '#e8f4fd', url: 'https://linkedin.com',       followers: '1.5K',      label: 'Connect'   },
  { name: 'Facebook',   icon: 'fb', color: '#1877f2', bg: '#e7f0fd', url: 'https://facebook.com',       followers: '6.3K',      label: 'Like'      },
  { name: 'WhatsApp',   icon: 'WA', color: '#25d366', bg: '#e8fdf0', url: 'https://wa.me/918208135967', followers: 'Community', label: 'Join'      },
];

const QUICK_LINKS = [
  { label: 'Waste Calculator', icon: '🌾' },
  { label: 'Biogas Estimator', icon: '🔥' },
  { label: 'Biochar Advisor',  icon: '⚗️' },
  { label: 'Carbon Credits',   icon: '🌍' },
  { label: 'Marketplace',      icon: '🛒' },
  { label: 'Plant Locator',    icon: '📍' },
];

const CONTACT_INFO = [
  { icon: '📧', label: 'agriwaste@gmail.com'     },
  { icon: '📞', label: '+91 8208135967'          },
  { icon: '📍', label: 'Pune, Maharashtra, India' },
  { icon: '🕐', label: 'Mon-Sat: 9AM - 6PM'      },
];

function SocialCard(props) {
  var s = props.s;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        textDecoration: 'none',
        transition: 'all 0.2s',
      }}
      onMouseEnter={function(e) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={function(e) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: s.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.72rem',
        fontWeight: 900,
        color: s.color,
        flexShrink: 0,
        fontFamily: 'sans-serif',
      }}>
        {s.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
          {s.name}
        </div>
        <div style={{ fontSize: '0.62rem', lineHeight: 1.2 }}>

  <span style={{ color: '#F5A623', fontWeight: 700 }}>
    {s.followers}
  </span>

  <span style={{ color: 'rgba(255,255,255,0.65)' }}>
    {' '}· {s.label}
  </span>

</div>
      </div>
    </a>
  );
}

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(180deg, #1a3d1f 0%, #0f2a14 100%)',
      color: 'white',
      marginTop: 48,
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Top Bar */}
      <div style={{
        background: '#2C5F2D',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.8rem' }}>🌿</span>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>
              AgriWaste Nexus
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              Turning Farm Waste into Clean Energy and Farmer Income
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>500MT</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Residue/Year</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>15K+</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Per Acre</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>6+</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plants</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 32,
        padding: '36px 32px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>

        {/* Column 1 - About */}
        <div>
          <h4 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: 14,
            color: '#7ecb7f',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            About Us
          </h4>
          <p style={{ fontSize: '0.82rem', lineHeight: 1.7, opacity: 0.7, marginBottom: 14 }}>
            AgriWaste Nexus helps Indian farmers turn agricultural waste into biogas,
            biochar and carbon credits — using ICAR and FAO conversion factors to put
            real numbers behind a circular economy for farm residue.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(126,203,127,0.15)',
              color: '#7ecb7f',
              border: '1px solid rgba(126,203,127,0.3)',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: '0.68rem',
              fontWeight: 600,
            }}>
              🇮🇳 Made in India
            </span>
          </div>
        </div>

        {/* Column 2 - Quick Links */}
        <div>
          <h4 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: 14,
            color: '#7ecb7f',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Quick Links
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_LINKS.map(function(link) {
              return (
                <div
                  key={link.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.82rem',
                    opacity: 0.75,
                    cursor: 'pointer',
                    padding: '2px 0',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={function(e) { e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={function(e) { e.currentTarget.style.opacity = 0.75; }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>
                  <span>{link.label}</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: '0.7rem' }}>→</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3 - Contact */}
        <div>
          <h4 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: 14,
            color: '#7ecb7f',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Contact Us
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CONTACT_INFO.map(function(item) {
              return (
                <div
                  key={item.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', opacity: 0.75 }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Newsletter */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>
              📬 Subscribe for Updates
            </div>
            <div style={{
              display: 'flex',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <input
                type="email"
                placeholder="your@email.com"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.78rem',
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button style={{
                padding: '8px 14px',
                background: '#4d9e4e',
                color: 'white',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                flexShrink: 0,
              }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Column 4 - Follow Us */}
        <div>
          <h4 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: 14,
            color: '#7ecb7f',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Follow Us
          </h4>
          <p style={{ fontSize: '0.78rem', opacity: 0.65, marginBottom: 14, lineHeight: 1.5 }}>
            Stay updated with latest news on agri-tech, farm waste innovations and carbon markets.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SOCIAL_LINKS.map(function(s) {
              return <SocialCard key={s.name} s={s} />;
            })}
          </div>
        </div>

      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 32px' }} />

      {/* Bottom Bar */}
      <div style={{
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
          2026 AgriWaste Nexus. All rights reserved. Built with love for Indian Farmers.
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['Privacy Policy', 'Terms of Use', 'Contact'].map(function(link) {
            return (
              <span
                key={link}
                style={{ fontSize: '0.72rem', opacity: 0.5, cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={function(e) { e.currentTarget.style.opacity = 1; }}
                onMouseLeave={function(e) { e.currentTarget.style.opacity = 0.5; }}
              >
                {link}
              </span>
            );
          })}
        </div>
      </div>

    </footer>
  );
}