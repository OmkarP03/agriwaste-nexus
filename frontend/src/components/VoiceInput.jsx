import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LangContext';

/**
 * A small microphone button that dictates into one field.
 *
 * Typing a decimal on a phone in a field is the slowest part of this
 * app. The browser's own speech recognition does the job with no extra
 * dependency — and where the browser doesn't have it (Firefox, most
 * in-app browsers) the button simply isn't rendered, so nothing breaks.
 */

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const voiceSupported = Boolean(SpeechRecognition);

const LOCALE = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

// "do point paanch" / "2.5 acres" → 2.5
const WORD_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, panch: 5,
  chhe: 6, cheh: 6, saat: 7, aath: 8, nau: 9, das: 10,
};

export function parseSpokenNumber(text) {
  const clean = String(text || '').toLowerCase().replace(/,/g, '').trim();

  // A digit somewhere in the phrase wins — "2.5 acres", "area 3"
  const digits = clean.match(/\d+(\.\d+)?/);
  if (digits) return Number(digits[0]);

  // "two point five", "do point paanch"
  const parts = clean.split(/\s+/);
  const pointAt = parts.findIndex(p => p === 'point' || p === 'dashamlav');
  if (pointAt > 0) {
    const whole = WORD_NUMBERS[parts[pointAt - 1]];
    const frac  = WORD_NUMBERS[parts[pointAt + 1]];
    if (whole !== undefined && frac !== undefined) return Number(`${whole}.${frac}`);
  }

  for (const p of parts) {
    if (WORD_NUMBERS[p] !== undefined) return WORD_NUMBERS[p];
  }
  return null;
}

export default function VoiceInput({ onResult, numeric = false, label = 'Dictate this field' }) {
  const { lang } = useLang();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);

  // Stop the microphone if the field disappears mid-listen
  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* already stopped */ } }, []);

  if (!voiceSupported) return null;

  function start() {
    setError('');
    setHeard('');

    const rec = new SpeechRecognition();
    recRef.current = rec;
    rec.lang = LOCALE[lang] || 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const said = event.results[0][0].transcript;
      setHeard(said);

      if (numeric) {
        const n = parseSpokenNumber(said);
        if (n === null) {
          setError(`Heard “${said}” — say a number like “two point five”.`);
          return;
        }
        onResult(String(n));
      } else {
        onResult(said);
      }
    };

    rec.onerror = (event) => {
      setError(
        event.error === 'not-allowed'
          ? 'Microphone blocked. Allow microphone access in your browser to dictate.'
          : 'Could not hear that. Try again.'
      );
      setListening(false);
    };

    rec.onend = () => setListening(false);

    try {
      rec.start();
      setListening(true);
    } catch {
      setError('Could not start the microphone.');
    }
  }

  function stop() {
    try { recRef.current?.stop(); } catch { /* already stopped */ }
    setListening(false);
  }

  return (
    <div className="voice">
      <button
        type="button"
        className={`voice-btn ${listening ? 'on' : ''}`}
        onClick={listening ? stop : start}
        aria-label={listening ? 'Stop dictating' : label}
        title={listening ? 'Listening — tap to stop' : label}
      >
        <span aria-hidden="true">{listening ? '⏹' : '🎤'}</span>
      </button>
      <span className="voice-status" role="status" aria-live="polite">
        {listening ? 'Listening…' : error ? error : heard ? `Heard “${heard}”` : ''}
      </span>
    </div>
  );
}
