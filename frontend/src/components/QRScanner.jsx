import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';

export default function QRScanner() {
  const [data, setData] = useState(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const handleScan = (result) => {
    if (result) setData(result.text);
  };

  const handleError = (err) => {
    console.error(err);
    setError('Could not access the camera. Check that this site is allowed to use it.');
  };

  let parsed = null;
  if (data) {
    try {
      const q = data.split('data=')[1];
      if (q) parsed = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(q)))));
    } catch { parsed = null; }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon blue" aria-hidden="true">📷</div>
        <div>
          <div className="card-title">Scan Farmer QR</div>
          <div className="card-subtitle">Point the camera at an AgriWaste Nexus ID card</div>
        </div>
      </div>

      <div className="card-body">
        {error && <div className="alert alert-warning" role="alert">⚠️ {error}</div>}

        {!active ? (
          <button className="btn btn-primary" onClick={() => setActive(true)}>
            📷 Start Scanner
          </button>
        ) : (
          <div style={{ maxWidth: 340 }}>
            <QrScanner delay={300} onError={handleError} onScan={handleScan} style={{ width: '100%' }} />
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setActive(false)}>
              Stop Scanner
            </button>
          </div>
        )}

        {parsed && (
          <div className="result-block" style={{ marginTop: 18 }}>
            <h4>Scanned Farmer</h4>
            <div className="result-row"><span className="key">Name</span><span className="val">{parsed.name}</span></div>
            <div className="result-row"><span className="key">Farmer ID</span><span className="val">{parsed.id}</span></div>
            <div className="result-row"><span className="key">District</span><span className="val">{parsed.district}</span></div>
            <div className="result-row"><span className="key">Primary crop</span><span className="val">{parsed.crop}</span></div>
            <div className="result-row"><span className="key">Carbon</span><span className="val green">{parsed.carbon}</span></div>
          </div>
        )}

        {data && !parsed && (
          <div style={{ marginTop: 18 }}>
            <h4 style={{ marginBottom: 6 }}>Scanned value</h4>
            <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'var(--gray-100)', padding: 12, borderRadius: 8 }}>
              {data}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
