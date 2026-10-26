import React, { useEffect, useState } from 'react';

/**
 * "Add to home screen", plus an honest offline banner.
 *
 * Chrome on Android fires beforeinstallprompt when the app qualifies as
 * installable; we hold on to the event and offer the button instead of
 * letting the browser's own mini-bar decide. iOS has no such event, so
 * nothing is shown there rather than a button that would do nothing.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('agri_install_dismissed') === '1'; }
    catch { return false; }
  });
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' && navigator.onLine === false
  );

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault();
      setDeferred(e);
    }
    function onInstalled() {
      setDeferred(null);
    }
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem('agri_install_dismissed', '1'); } catch { /* private window */ }
  }

  return (
    <>
      {offline && (
        <div className="offline-bar" role="status">
          <span aria-hidden="true">📴</span> You are offline. Saved pages still open;
          listings and calculations will sync when you are back online.
        </div>
      )}

      {deferred && !dismissed && (
        <div className="install-bar" role="region" aria-label="Install AgriWaste Nexus">
          <span aria-hidden="true">📲</span>
          <span className="install-text">
            Install AgriWaste Nexus for offline access on your phone.
          </span>
          <button className="btn btn-primary btn-sm" onClick={install}>Install</button>
          <button className="btn btn-ghost btn-sm" onClick={dismiss}>Not now</button>
        </div>
      )}
    </>
  );
}
