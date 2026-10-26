import React from 'react';

/**
 * Application header.
 *
 * The emblem is used on its own (mark.png) rather than the full logo,
 * because the logo file already contains the "AgriWaste Nexus"
 * wordmark — pairing it with the text would print the name twice.
 */
export default function TopHeader() {
  return (
    <header className="top-header">
      <div className="header-inner">

        <div className="header-lockup">
          <img
            className="header-mark"
            src="/images/mark.png"
            alt="AgriWaste Nexus"
          />
          <div className="header-text">
            <span className="header-hindi">कृषि अपशिष्ट नेक्सस</span>
            <span className="header-title">AgriWaste Nexus</span>
          </div>
        </div>

        <div className="header-rule" aria-hidden="true" />
        <p className="header-tagline">Smart Agricultural Waste Management</p>

        <div className="header-badges">
          <span className="header-badge-item">
            <span aria-hidden="true">🌾</span>
            <span className="hb-label">Agri Innovation</span>
          </span>
          <span className="header-badge-item">
            <span aria-hidden="true">♻️</span>
            <span className="hb-label">Digital India</span>
          </span>
        </div>

      </div>
    </header>
  );
}
