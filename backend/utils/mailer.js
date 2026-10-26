/**
 * Optional email delivery for password-reset codes.
 *
 * If SMTP settings are present in .env AND nodemailer is installed, the
 * code is emailed. Otherwise sendResetCode() reports that it could not
 * send, and the route falls back to returning a demo code in the API
 * response. The backend boots either way — nodemailer is never required.
 *
 * To turn on real email, add to backend/.env:
 *   SMTP_USER=youraddress@gmail.com
 *   SMTP_PASS=your-16-character-gmail-app-password
 *   SMTP_FROM=AgriWaste Nexus <youraddress@gmail.com>
 * then run:  npm install nodemailer
 */

let transporter = null;
let checked = false;

function getTransporter() {
  if (checked) return transporter;
  checked = true;

  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('ℹ️  SMTP not configured — password-reset codes run in demo mode');
    return null;
  }

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (err) {
    console.log('ℹ️  nodemailer not installed — password-reset codes run in demo mode');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  console.log('✅ SMTP configured — password-reset codes will be emailed');
  return transporter;
}

function isConfigured() {
  return getTransporter() !== null;
}

async function sendResetCode(to, name, code) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'not_configured' };

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#F5F7F5;padding:24px;">
      <div style="background:#174A27;color:#ffffff;padding:20px 24px;border-radius:14px 14px 0 0;">
        <div style="font-size:18px;font-weight:bold;">AgriWaste Nexus</div>
        <div style="font-size:12px;opacity:0.85;margin-top:2px;">Smart Agricultural Waste Management</div>
      </div>
      <div style="background:#ffffff;padding:24px;border-radius:0 0 14px 14px;">
        <p style="color:#172117;font-size:15px;">Hello ${name || 'there'},</p>
        <p style="color:#667066;font-size:14px;line-height:1.6;">
          Use this code to reset your AgriWaste Nexus password. It expires in 10 minutes.
        </p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:10px;color:#174A27;
                    background:#E8F5E9;padding:16px;text-align:center;border-radius:10px;margin:20px 0;">
          ${code}
        </div>
        <p style="color:#667066;font-size:13px;line-height:1.6;">
          If you did not ask to reset your password, you can ignore this email —
          your password will stay the same.
        </p>
      </div>
    </div>`;

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'Your AgriWaste Nexus password reset code',
      text: `Your AgriWaste Nexus password reset code is ${code}. It expires in 10 minutes.`,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('❌ Failed to send reset email:', err.message);
    return { sent: false, reason: 'send_failed' };
  }
}

module.exports = { sendResetCode, isConfigured };
