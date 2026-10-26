import React from 'react';
import LangToggle from './LangToggle';
import { IMG, bgImage, OVERLAY_MID } from '../utils/media';

/**
 * Shared shell for Login / Register / Forgot password.
 *
 * Left: brand panel over a farmland photograph with a dark green overlay.
 * Right: language toggle, then the form card.
 * Under 980px the panel is hidden and a compact brand bar takes its place.
 */
export default function AuthLayout({ headline, sub, children, aside }) {
  return (
    <div className="auth-page">

      <aside
        className="auth-left"
        style={{ ...bgImage(IMG.hero, OVERLAY_MID) }}
      >
        <div className="auth-brand-row">
          <img className="auth-logo" src="/images/mark.png" alt="" aria-hidden="true" />
          <div className="auth-wordmark">
            AgriWaste Nexus
            <small>Smart Waste Management</small>
          </div>
        </div>

        <div className="auth-brand">
          <h1>{headline}</h1>
          <p>{sub}</p>
          {aside}
        </div>

        <div className="auth-foot">
          <span>Made in India 🇮🇳</span>
        </div>
      </aside>

      <div className="auth-right">
        <div className="auth-topbar">
          <div className="auth-topbar-brand">
            <img src="/images/mark.png" alt="" aria-hidden="true" />
            <span>AgriWaste Nexus</span>
          </div>
          <LangToggle />
        </div>

        <div className="auth-scroll">
          {children}
        </div>
      </div>

    </div>
  );
}
