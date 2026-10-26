import React, { useRef, useState } from 'react';

const MAX_IMAGES = 3;
const MAX_EDGE = 1000;     // longest side, in pixels
const QUALITY = 0.75;

/**
 * Photos for a marketplace listing.
 *
 * Resized in the browser before upload — a phone photo is 4 MB, which no
 * document store wants and no farmer on a rural connection wants to send.
 * A 1000px JPEG is about 120 KB and still shows moisture and contamination,
 * which is what a buyer is actually looking for.
 */
function resize(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({ images = [], onChange, label = 'Photos' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBusy(true);
    setError('');

    try {
      const room = MAX_IMAGES - images.length;
      if (room <= 0) {
        setError(`You can add up to ${MAX_IMAGES} photos.`);
        return;
      }

      const next = [];
      for (const f of files.slice(0, room)) {
        if (!f.type.startsWith('image/')) continue;
        next.push(await resize(f));
      }

      onChange([...images, ...next]);
    } catch (err) {
      setError('Could not read that image. Try another photo.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(i) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  return (
    <div className="form-group">
      <label htmlFor="listing-photos">
        {label} <span className="muted" style={{ fontWeight: 400 }}>· up to {MAX_IMAGES}</span>
      </label>

      <input
        id="listing-photos"
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        disabled={busy || images.length >= MAX_IMAGES}
      />

      {busy && <div className="muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>Resizing…</div>}
      {error && <div className="muted" style={{ fontSize: '0.78rem', marginTop: 6, color: 'var(--red-600)' }}>{error}</div>}

      {images.length > 0 && (
        <div className="thumb-row">
          {images.map((src, i) => (
            <div className="thumb" key={i}>
              <img src={src} alt={`Listing photo ${i + 1}`} />
              <button
                type="button"
                className="thumb-remove"
                onClick={() => remove(i)}
                aria-label={`Remove photo ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="muted" style={{ fontSize: '0.74rem', marginTop: 8, lineHeight: 1.5 }}>
        Photos are resized on your phone before upload, so this works on a slow connection.
      </p>
    </div>
  );
}
