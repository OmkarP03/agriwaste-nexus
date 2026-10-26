/**
 * Phone alerts for the events a farmer won't be sitting at a dashboard for.
 *
 * Farmers will not watch a web page waiting for a purchase request. Until a
 * message reaches their phone, the marketplace is a screen rather than a
 * market — this is the piece that changes that.
 *
 * Works with two gateways, chosen by SMS_PROVIDER in backend/.env:
 *
 *   MSG91 (India, cheapest for bulk SMS)
 *     SMS_PROVIDER=msg91
 *     MSG91_AUTHKEY=...
 *     MSG91_SENDER=AGRIWN          (6-char approved sender id)
 *     MSG91_ROUTE=4
 *
 *   Twilio (SMS, or WhatsApp with a whatsapp: prefix)
 *     SMS_PROVIDER=twilio
 *     TWILIO_ACCOUNT_SID=...
 *     TWILIO_AUTH_TOKEN=...
 *     TWILIO_FROM=+1234567890      or  whatsapp:+14155238886
 *
 * With neither configured, send() records what it would have sent and
 * returns { sent:false, reason:'not_configured' }. Nothing breaks, and the
 * in-app notification is created either way — the phone alert is an extra
 * channel, never the only one.
 */

const PROVIDER = (process.env.SMS_PROVIDER || '').toLowerCase();

function isConfigured() {
  if (PROVIDER === 'msg91') return Boolean(process.env.MSG91_AUTHKEY);
  if (PROVIDER === 'twilio') {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM
    );
  }
  return false;
}

/** 9876543210 → 919876543210 */
function normalise(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

async function sendViaMsg91(to, text) {
  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: process.env.MSG91_AUTHKEY,
    },
    body: JSON.stringify({
      sender: process.env.MSG91_SENDER || 'AGRIWN',
      route: process.env.MSG91_ROUTE || '4',
      mobiles: to,
      message: text,
    }),
  });

  if (!res.ok) throw new Error(`MSG91 responded ${res.status}`);
  return res.json().catch(() => ({}));
}

async function sendViaTwilio(to, text) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const from = process.env.TWILIO_FROM;
  const isWhatsApp = from.startsWith('whatsapp:');

  const body = new URLSearchParams({
    To: isWhatsApp ? `whatsapp:+${to}` : `+${to}`,
    From: from,
    Body: text,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(
          `${sid}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Twilio responded ${res.status} ${detail.slice(0, 120)}`);
  }
  return res.json().catch(() => ({}));
}

/**
 * @param {object} user  the recipient (needs `mobile`; respects notifyByPhone)
 * @param {string} text  plain text, kept short — one SMS segment where possible
 */
async function send(user, text) {
  if (!user) return { sent: false, reason: 'no_user' };
  if (user.notifyByPhone === false) return { sent: false, reason: 'opted_out' };

  const to = normalise(user.mobile);
  if (!to) return { sent: false, reason: 'no_number' };

  if (!isConfigured()) {
    console.log(`📱 [sms not configured] would send to ${to}: ${text}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    if (PROVIDER === 'msg91') await sendViaMsg91(to, text);
    else await sendViaTwilio(to, text);

    console.log(`📱 sent to ${to}`);
    return { sent: true };
  } catch (err) {
    // A failed text must never fail the request that triggered it
    console.error('📱 send failed:', err.message);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

module.exports = { send, isConfigured, normalise };
