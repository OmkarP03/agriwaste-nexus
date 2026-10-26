import React, { useState, useRef, useEffect } from 'react';

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    text: 'Namaskar! 🙏 I am Kisan Mitra, your AgriWaste assistant.\n\nI can help you with:\n• 🌾 Crop waste calculations\n• 🔥 Biogas potential\n• ⚗️ Biochar recommendations\n• 🌍 Carbon credits\n• 🏛️ Government schemes\n• 📍 Nearby plants\n\nAsk me anything in English, Hindi or Marathi!',
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  },
];

const QUICK_QUESTIONS = [
  '🌾 How much biogas from 5 acres rice?',
  '💰 What are carbon credits?',
  '🏛️ Which govt schemes am I eligible for?',
  '📍 How to find nearest plant?',
  '⚗️ What is biochar?',
  '🌍 How to sell carbon credits?',
];

export default function KisanMitraChat({ onClose }) {
  const [messages, setMessages]   = useState(INITIAL_MESSAGES);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [isMin, setIsMin]         = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

// 🔴 ONLY sendMessage() function updated — rest unchanged

function getLocalReply(text) {
    const q = text.toLowerCase();

    if (q.includes('biogas') && (q.includes('rice') || q.includes('acre'))) {
      return '🔥 For 5 acres of rice with 3 tons/acre yield:\n\n• Residue: ~20 tons\n• Dry Biomass: ~14 tons\n• Total Biogas: ~3,920 m³\n• Daily Output: ~130 m³/day\n• Electricity: ~23,520 kWh\n• Households served: ~65 homes/day\n\nUse our Biogas Estimator for exact numbers! 🌾';
    }
    if (q.includes('biogas')) {
      return '🔥 Biogas is produced by decomposing organic waste in a digester.\n\n• 1 ton dry biomass = ~280 m³ biogas\n• 1 m³ biogas = 6 kWh electricity\n• Replaces LPG for cooking\n• Rice straw biogas rate: 0.28 m³/kg\n\nTry our Biogas Estimator calculator! 💡';
    }
    if (q.includes('carbon credit') || q.includes('carbon')) {
      return '🌍 Carbon Credits — How to Earn:\n\n• 1 Carbon Credit = 1 tonne CO₂ avoided\n• Price: ₹1,200 – ₹2,000 per credit\n• By NOT burning crop waste you earn credits\n• Standard: Verra VCS / Gold Standard\n\nFor 2 acres rice = ~11 credits = ₹16,500+ income! 💰';
    }
    if (q.includes('scheme') || q.includes('subsidy') || q.includes('government') || q.includes('govt') || q.includes('sarkar') || q.includes('yojana')) {
      return '🏛️ Government Schemes for Farmers:\n\n• PM-KUSUM — 90% subsidy on solar pumps\n• Gobar Gas — ₹10,000–₹50,000 biogas subsidy\n• PM-KISAN — ₹6,000/year direct benefit\n• PMFBY — Crop insurance scheme\n• NABARD — Low interest loans\n\nVisit nearest Krishi Vigyan Kendra for details! 🌾';
    }
    if (q.includes('biochar')) {
      return '⚗️ Biochar — What is it?\n\n• Charcoal made from crop waste\n• Process: Slow Pyrolysis at 500°C\n• Yield: 30% of dry biomass\n• Improves soil fertility by 30–40%\n• Sells for ₹10,000/ton\n• Sequesters carbon for 100+ years\n\nFor 2 acres rice = ~1.7 tons biochar = ₹17,000! 💰';
    }
    if (q.includes('plant') || q.includes('nearest') || q.includes('locator') || q.includes('where')) {
      return '📍 Finding Nearest Plant:\n\n• Go to Plant Locator in sidebar\n• Click "My Location" button\n• Map shows all nearby plants\n• Filter by Biogas / Biochar / Compost\n\nNearest in Pune:\n🏭 Pune Biogas Processing Unit\n📞 +91-2012345678\n📍 Only 5 km away! ✅';
    }
    if (q.includes('sell') || q.includes('buyer') || q.includes('market') || q.includes('price')) {
      return '🛒 How to Sell Your Farm Waste:\n\n1. Go to Marketplace in sidebar\n2. Click "List Your Waste"\n3. Fill crop type, quantity, price\n4. Buyers will contact you directly\n\nCurrent prices:\n• Rice straw: ₹900–₹1,200/ton\n• Wheat stubble: ₹800–₹1,000/ton\n• Sugarcane bagasse: ₹500–₹700/ton 💰';
    }
    if (q.includes('calculat') || q.includes('residue') || q.includes('waste') || q.includes('biomass')) {
      return '🌾 Crop Waste Calculator:\n\nFor Rice — 2 acres, 3 tons/acre:\n• Residue: 8.1 tons\n• Dry Biomass: 7.1 tons\n• Usable Biomass: 5.7 tons\n• CO₂ Avoided: 11.9 tons\n• Total Income: ₹27,000+\n\nGo to Waste Calculator in sidebar! 🔬';
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hii') || q.includes('namaskar') || q.includes('namaste') || q.includes('name')) {
      return 'Namaskar! 🙏 I am Kisan Mitra, your AgriWaste AI assistant!\n\nI can help you with:\n• 🌾 Waste & biogas calculations\n• 💰 Carbon credit earning\n• 🏛️ Government schemes\n• 📍 Finding nearest plants\n• 🛒 Selling your crop waste\n\nWhat would you like to know? 😊';
    }
    if (q.includes('kya') || q.includes('kaise') || q.includes('mujhe') || q.includes('fasal')) {
      return '🙏 Namaskar Kisan Bhai!\n\nMain Kisan Mitra hun. Aapki madad ke liye taiyar hun!\n\n• 🌾 Fasal ka kachra — Waste Calculator use karein\n• 💰 Carbon credit — Carbon Credits page dekhein\n• 🏛️ Sarkari yojanao ke liye — PM-KUSUM, Gobar Gas available hai\n• 📍 Nazdiki plant — Plant Locator use karein\n\nKya jaanna chahte hain? 😊';
    }
    if (q.includes('kuthe') || q.includes('aahe') || q.includes('shetat') || q.includes('kay')) {
      return '🙏 Namaskar Shetkari Bandu!\n\nMi Kisan Mitra aahe. Tumchi madad karayala tayar aahe!\n\n• 🌾 Pik kachara — Waste Calculator vaparaa\n• 💰 Carbon credit — Carbon Credits page pahaa\n• 🏛️ Sarkari yojana — PM-KUSUM, Gobar Gas uplabdh aahe\n• 📍 Javal plant — Plant Locator vaparaa\n\nKay janun ghyayche aahe? 😊';
    }
    if (q.includes('id') || q.includes('card') || q.includes('profile')) {
      return '🪪 Farmer ID Card:\n\nYour digital farmer identity card shows:\n• Your name & farmer ID\n• District & main crop\n• Carbon credits earned\n• QR code for verification\n\nGo to My Profile to view and download yours! 📄';
    }
    if (q.includes('help') || q.includes('madad') || q.includes('what can')) {
      return '🤖 I can help you with:\n\n• 🌾 Crop waste & biogas calculations\n• ⚗️ Biochar recommendations\n• 🌍 Carbon credits & income\n• 🏛️ Government schemes & subsidies\n• 📍 Nearest biogas/biochar plants\n• 🛒 Selling waste in marketplace\n\nJust ask me anything! 😊';
    }
    return '🤔 I understand your question about "' + text + '".\n\nI can help you with:\n• 🌾 Biogas & biochar calculations\n• 🌍 Carbon credits\n• 🏛️ Government schemes\n• 📍 Finding nearby plants\n• 🛒 Marketplace\n\nTry asking:\n"How much biogas from 5 acres rice?"\n"What are carbon credits?" 😊';
  }

  function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: userText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const replyText = getLocalReply(userText);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
      setLoading(false);
      inputRef.current?.focus();
    }, 800);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages(INITIAL_MESSAGES);
  }

  if (isMin) {
    return (
      <div
        onClick={() => setIsMin(false)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2C5F2D, #4d9e4e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(44,95,45,0.5)',
          zIndex: 9999,
          overflow: 'hidden',
        animation: 'pulse-green 2s infinite',
      }}
    >
      <img
        src="/chatbot.png"
        alt="Kisan Mitra"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: 480,
      height: 650,
      borderRadius: 16,
      background: 'white',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3d1f, #2C5F2D)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <img
          src="/chatbot.png"
          alt="Kisan Mitra"
          style={{
            width: 38, height: 38,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>
            Kisan Mitra
          </div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            AI Assistant · Online
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={clearChat}
            title="Clear chat"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: 6,
              width: 28, height: 28,
              cursor: 'pointer', color: 'white',
              fontSize: '0.75rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            🗑️
          </button>
          <button
            onClick={() => setIsMin(true)}
            title="Minimize"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: 6,
              width: 28, height: 28,
              cursor: 'pointer', color: 'white',
              fontSize: '0.9rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            —
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: 6,
              width: 28, height: 28,
              cursor: 'pointer', color: 'white',
              fontSize: '0.9rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 14px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: '#f9fafb',
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 7,
            }}
          >
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#2C5F2D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
              <img src="/chatbot.png" alt="bot" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            )}

            {/* Bubble */}
            <div style={{ maxWidth: '80%' }}>
              <div style={{
                padding: '9px 12px',
                borderRadius: msg.role === 'user'
                  ? '12px 12px 2px 12px'
                  : '12px 12px 12px 2px',
                background: msg.role === 'user' ? '#2C5F2D' : 'white',
                color: msg.role === 'user' ? 'white' : '#111827',
                fontSize: '0.82rem',
                lineHeight: 1.55,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                whiteSpace: 'pre-wrap',
                border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
              }}>
                {msg.text}
              </div>
              <div style={{
                fontSize: '0.62rem',
                color: '#9ca3af',
                marginTop: 3,
                textAlign: msg.role === 'user' ? 'right' : 'left',
              }}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#2C5F2D',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', flexShrink: 0,
            }}>
              🤖
            </div>
            <div style={{
              padding: '10px 14px',
              background: 'white',
              borderRadius: '12px 12px 12px 2px',
              border: '1px solid #e5e7eb',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#2C5F2D',
                  animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && !loading && (
        <div style={{
          padding: '8px 12px',
          background: 'white',
          borderTop: '1px solid #f3f4f6',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Questions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  padding: '4px 9px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 16,
                  fontSize: '0.7rem',
                  color: '#065f46',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Kisan Mitra anything... (English/Hindi/Marathi)"
          rows={1}
          style={{
            flex: 1,
            padding: '9px 12px',
            border: '1.5px solid #d1d5db',
            borderRadius: 10,
            fontSize: '0.82rem',
            fontFamily: 'DM Sans, sans-serif',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.4,
            maxHeight: 80,
            color: '#111827',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = '#2C5F2D'; }}
          onBlur={e => { e.target.style.borderColor = '#d1d5db'; }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 38, height: 38,
            borderRadius: 10,
            background: input.trim() && !loading ? '#2C5F2D' : '#d1d5db',
            border: 'none',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 4px 20px rgba(44,95,45,0.5); }
          50% { box-shadow: 0 4px 28px rgba(44,95,45,0.8); }
        }
      `}</style>
    </div>
  );
}