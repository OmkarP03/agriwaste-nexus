import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API } from '../utils/apiRoot';

/**
 * The conversation attached to one purchase request.
 *
 * Accept/reject with a single fixed sentence isn't how a deal gets agreed —
 * pickup date, transport and who loads the trailer all have to be settled.
 */
export default function RequestThread({ requestId, me }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    let alive = true;
    axios.get(`${API}/requests/${requestId}/messages`)
      .then(res => { if (alive) setMessages(res.data.messages || []); })
      .catch(() => { if (alive) setError('Could not load the conversation.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [requestId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    setSending(true);
    setError('');
    try {
      const res = await axios.post(`${API}/requests/${requestId}/messages`, { text: body });
      setMessages(res.data.messages || []);
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send that message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="thread">
      <div className="thread-log" role="log" aria-label="Conversation">
        {loading && <div className="muted" style={{ fontSize: '0.82rem' }}>Loading…</div>}

        {!loading && messages.length === 0 && (
          <div className="muted" style={{ fontSize: '0.82rem' }}>
            No messages yet — agree a pickup date and who arranges transport.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role === me ? 'mine' : 'theirs'}`}>
            <div className="bubble-who">{m.fromName}</div>
            <div className="bubble-text">{m.text}</div>
            <div className="bubble-at">
              {new Date(m.at).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <div className="muted" style={{ fontSize: '0.78rem', color: 'var(--red-600)' }}>{error}</div>}

      <form className="thread-form" onSubmit={send}>
        <label className="sr-only" htmlFor={`msg-${requestId}`}>Message</label>
        <input
          id={`msg-${requestId}`}
          className="input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Pickup on Tuesday? Who arranges the trailer?"
          maxLength={1000}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !text.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
