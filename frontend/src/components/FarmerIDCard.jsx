import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../utils/apiRoot';

// Inline styles are used for the card itself so that html2canvas
// renders it identically when exporting to PNG / PDF.
const S = {
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    overflow: 'hidden',
    background: 'linear-gradient(140deg, #174A27 0%, #2C7A3F 58%, #2f8a4b 100%)',
    color: '#ffffff',
    boxShadow: '0 12px 32px rgba(23,74,39,0.28)',
    fontFamily: "'DM Sans', sans-serif",
  },
  top: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '13px 18px',
    background: 'rgba(0,0,0,0.22)',
    borderBottom: '1px solid rgba(255,255,255,0.18)',
  },
  brand:    { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.2 },
  brandSub: { fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', marginTop: 2, fontWeight: 700 },
  body:     { padding: '16px 18px 14px', display: 'flex', gap: 14 },
  photo: {
    width: 78, height: 94, borderRadius: 10, objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.45)', flexShrink: 0,
    background: 'rgba(255,255,255,0.16)',
  },
  photoPlaceholder: {
    width: 78, height: 94, borderRadius: 10, flexShrink: 0,
    border: '2px dashed rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
  },
  name: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 },
  row:  { display: 'flex', gap: 8, fontSize: '0.75rem', marginTop: 5, lineHeight: 1.35 },
  key:  { color: 'rgba(255,255,255,0.72)', minWidth: 74, textTransform: 'uppercase', fontSize: '0.61rem', letterSpacing: 0.7, fontWeight: 700, paddingTop: 1 },
  val:  { fontWeight: 600, overflowWrap: 'anywhere' },
  foot: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '11px 18px',
    background: 'rgba(0,0,0,0.22)',
    borderTop: '1px solid rgba(255,255,255,0.18)',
  },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.34)',
    padding: '3px 10px', borderRadius: 999,
    fontSize: '0.63rem', fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase',
  },
  qr: { background: '#ffffff', padding: 5, borderRadius: 7, lineHeight: 0, flexShrink: 0 },
};

export default function FarmerIDCard() {
  const cardRef = useRef();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [calcs, setCalcs] = useState([]);
  const [busy, setBusy] = useState('');

  const { user } = useAuth();

  // Carbon figure comes from the calculations saved to the account
  useEffect(() => {
    if (!user?._id) return;
    axios
      .get(`${API}/calculations/user/${user._id}`)
      .then(res => setCalcs(res.data.calculations || []))
      .catch(() => setCalcs(user?.calculations || []));
  }, [user]);

  const totalCO2 = calcs.reduce((sum, c) => sum + (c.result?.waste?.co2Avoided || 0), 0);
  const totalCredits = calcs.reduce((sum, c) => sum + (c.result?.credits?.carbonCredits || 0), 0);

  const farmer = {
    name: user?.name || 'Farmer',
    id: 'AWN-' + (user?._id || 'UNKNOWN'),
    district: user?.district || user?.village || 'Maharashtra',
    crop: user?.cropType
      ? user.cropType.charAt(0).toUpperCase() + user.cropType.slice(1)
      : 'Not set',
    carbon: totalCredits.toFixed(2) + ' credits · ' + totalCO2.toFixed(2) + ' t CO₂',
    mobile: user?.mobile || '',
    role: user?.role || 'farmer',
  };

  // A profile counts as complete only when the account actually holds
  // these details — this badge says nothing about government verification.
  const profileComplete = Boolean(
    user?.name && user?.mobile && user?.email && (user?.district || user?.village) && user?.cropType
  );

  const farmerEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(farmer))));
  const qrData = `${window.location.origin}/verify?data=${farmerEncoded}`;

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setCameraOn(true);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 200);
    } catch (err) {
      alert('Camera access denied or not supported');
      console.error(err);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL('image/png'));
    video.srcObject.getTracks().forEach(track => track.stop());
    setCameraOn(false);
  };

  const downloadImage = async () => {
    setBusy('png');
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 4, backgroundColor: null });
      const link = document.createElement('a');
      link.download = 'agriwaste-farmer-id.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally { setBusy(''); }
  };

  const downloadPDF = async () => {
    setBusy('pdf');
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 4, backgroundColor: null });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });
      pdf.addImage(img, 'PNG', 0, 0, 100, 60);
      pdf.save('agriwaste-farmer-id.pdf');
    } finally { setBusy(''); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── The card ─────────────────────────────────── */}
        <div style={{ flex: '0 1 400px', minWidth: 280 }}>
          <div ref={cardRef} style={S.card}>

            <div style={S.top}>
              <img
                src="/images/mark.png"
                alt=""
                aria-hidden="true"
                style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={S.brand}>AgriWaste Nexus</div>
                <div style={S.brandSub}>Digital Farmer ID</div>
              </div>
            </div>

            <div style={S.body}>
              {photo
                ? <img src={photo} alt={`${farmer.name} profile`} style={S.photo} />
                : <div style={S.photoPlaceholder} aria-hidden="true">🧑‍🌾</div>}

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.name}>{farmer.name}</div>
                <div style={S.row}><span style={S.key}>Farmer ID</span><span style={S.val}>{farmer.id}</span></div>
                <div style={S.row}><span style={S.key}>District</span><span style={S.val}>{farmer.district}</span></div>
                <div style={S.row}><span style={S.key}>Primary crop</span><span style={S.val}>{farmer.crop}</span></div>
                <div style={S.row}><span style={S.key}>Carbon</span><span style={S.val}>{farmer.carbon}</span></div>
              </div>
            </div>

            <div style={S.foot}>
              <div>
                <span style={S.chip}>
                  <span aria-hidden="true">{profileComplete ? '✓' : '!'}</span>
                  {profileComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </span>
                <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.68)', marginTop: 6, lineHeight: 1.4, maxWidth: 210 }}>
                  Issued by AgriWaste Nexus. Farm details are self-declared by the account holder.
                </div>
              </div>
              <div style={S.qr}>
                <QRCode value={qrData} size={72} />
              </div>
            </div>

          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={downloadImage} className="btn btn-primary" disabled={!!busy}>
              {busy === 'png' ? 'Preparing…' : '📥 Download Image'}
            </button>
            <button onClick={downloadPDF} className="btn btn-outline" disabled={!!busy}>
              {busy === 'pdf' ? 'Preparing…' : '📄 Download PDF'}
            </button>
          </div>
        </div>

        {/* ── Photo controls ───────────────────────────── */}
        <div style={{ flex: '1 1 280px', minWidth: 260 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-icon green" aria-hidden="true">📷</div>
              <div>
                <div className="card-title">Profile Photo</div>
                <div className="card-subtitle">Upload a photo or use your camera</div>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="id-photo">Upload from device</label>
                <input id="id-photo" type="file" accept="image/*" onChange={handlePhoto} />
              </div>

              <button onClick={startCamera} className="btn btn-outline btn-sm">
                📷 Capture Live Photo
              </button>

              {cameraOn && (
                <div style={{ marginTop: 14 }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 10 }} />
                  <button onClick={capturePhoto} className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                    Capture Photo
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {photo && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setPhoto(null)}>
                  Remove photo
                </button>
              )}

              <p className="muted" style={{ fontSize: '0.76rem', marginTop: 16, lineHeight: 1.55 }}>
                The QR code encodes the details shown on the card so anyone scanning it sees the same
                information. This card is issued by AgriWaste Nexus — it is not a government document.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
