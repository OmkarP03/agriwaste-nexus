import React, { useState } from 'react';
import FarmerIDCard from '../components/FarmerIDCard';
import QRScanner from '../components/QRScanner';
import SectionHead from '../components/SectionHead';

export default function FarmerIDPage() {
  const [tab, setTab] = useState('card');

  return (
    <div>
      <SectionHead
        icon="🪪"
        title="Digital Farmer ID"
        sub="Your AgriWaste Nexus identity card — download it, or scan another farmer's QR code"
      />

      <div className="tabs" role="tablist">
        <button
          role="tab" aria-selected={tab === 'card'}
          className={`tab-btn ${tab === 'card' ? 'active' : ''}`}
          onClick={() => setTab('card')}
        >
          🪪 My ID Card
        </button>
        <button
          role="tab" aria-selected={tab === 'scan'}
          className={`tab-btn ${tab === 'scan' ? 'active' : ''}`}
          onClick={() => setTab('scan')}
        >
          📷 Scan a QR Code
        </button>
      </div>

      {tab === 'card' ? <FarmerIDCard /> : <QRScanner />}
    </div>
  );
}
