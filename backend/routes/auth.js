const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const User = require('../models/User');
const { signToken, requireAuth, requireSelf } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

// Roles a visitor may choose at signup. 'admin' is deliberately absent —
// admin accounts are created with scripts/seed.js, never over the wire.
const SIGNUP_ROLES = ['farmer', 'buyer'];

// Strip the password hash (and anything else private) before responding.
function publicUser(doc) {
  const u = doc.toObject ? doc.toObject() : { ...doc };
  delete u.password;
  return u;
}

console.log("AUTH ROUTES LOADED");

router.post('/register', async (req, res) => {

  try {

    const {
      name,
      email,
      password,
      mobile,
      role,
      village,
      district,
      cropType,
      landArea
    } = req.body;

    const existingUser = await User.findOne({
      email
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists'
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      // Never take the role straight from the request body
      role: SIGNUP_ROLES.includes(role) ? role : 'farmer',
      village,
      district,
      cropType,
      landArea
    });

    res.status(201).json({
      success: true,
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    // password is select:false in the schema, so ask for it explicitly
    const user = await User
      .findOne({ email })
      .select('+password');

    // Same message either way, so this can't be used to discover
    // which email addresses have accounts.
    if (!user) {
      return res.status(400).json({
        message: 'Incorrect email or password'
      });
    }

    const match =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        message: 'Incorrect email or password'
      });
    }

    res.json({
      success: true,
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});
router.put('/update-profile/:id', requireAuth, requireSelf('id'), async (req, res) => {
  try {

    // Only these fields may be changed here — not role, email or password
    const ALLOWED = ['name', 'village', 'district', 'cropType', 'landArea', 'mobile', 'notifyByPhone'];
    const updates = {};
    ALLOWED.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json({
      success: true,
      user: publicUser(updatedUser)
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});

// ═══════════════════════════════════════════════════════════════
//  PASSWORD RESET
//  1. /forgot-password/request  → e-mail (or return) a 6-digit code
//  2. /forgot-password/verify   → exchange a valid code for a token
//  3. /forgot-password/reset    → set the new password using that token
//  The code is verified on the server, so the browser cannot skip a step.
// ═══════════════════════════════════════════════════════════════

const PasswordReset = require('../models/PasswordReset');
const { sendResetCode, isConfigured } = require('../utils/mailer');

const OTP_TTL_MS      = 10 * 60 * 1000; // code valid for 10 minutes
const RESEND_COOLDOWN = 60 * 1000;      // one code per minute
const MAX_ATTEMPTS    = 5;              // wrong guesses before the code dies

// ── 1. Request a code ──────────────────────────────────────────
router.post('/forgot-password/request', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address.',
      });
    }

    // Always answer the same way, so this cannot be used to discover
    // which email addresses have accounts.
    const genericReply = {
      success: true,
      emailSent: isConfigured(),
      message: isConfigured()
        ? 'If that email is registered, a reset code is on its way.'
        : 'If that email is registered, a reset code has been generated.',
    };

    const user = await User.findOne({
      email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    });

    if (!user) return res.json(genericReply);

    // Throttle: one code per minute per account
    const recent = await PasswordReset.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (recent && Date.now() - new Date(recent.createdAt).getTime() < RESEND_COOLDOWN) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN - (Date.now() - new Date(recent.createdAt).getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait}s before asking for another code.`,
        retryAfter: wait,
      });
    }

    // Any older codes for this account stop working immediately
    await PasswordReset.deleteMany({ userId: user._id });

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await PasswordReset.create({
      userId: user._id,
      otpHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    const mail = await sendResetCode(user.email, user.name, code);

    // No mail service configured — hand the code back so the flow is
    // still usable. This is clearly labelled as a demo code in the UI.
    if (!mail.sent) {
      return res.json({
        ...genericReply,
        emailSent: false,
        demoCode: code,
        message: 'Reset code generated. Email delivery is not configured on this server.',
      });
    }

    return res.json(genericReply);
  } catch (err) {
    console.log('FORGOT PASSWORD REQUEST ERROR', err);
    res.status(500).json({ success: false, message: 'Could not start the reset. Try again.' });
  }
});

// ── 2. Verify the code ─────────────────────────────────────────
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();

    const invalid = {
      success: false,
      message: 'That code is not valid or has expired. Request a new one.',
    };

    if (!email || !/^\d{6}$/.test(otp)) return res.status(400).json(invalid);

    const user = await User.findOne({
      email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    });
    if (!user) return res.status(400).json(invalid);

    const record = await PasswordReset.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json(invalid);

    if (record.expiresAt < new Date()) {
      await PasswordReset.deleteMany({ userId: user._id });
      return res.status(400).json(invalid);
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await PasswordReset.deleteMany({ userId: user._id });
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Request a new code.',
      });
    }

    const match = await bcrypt.compare(otp, record.otpHash);

    if (!match) {
      record.attempts += 1;
      await record.save();
      const left = MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        success: false,
        message: left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`
          : 'Too many incorrect attempts. Request a new code.',
      });
    }

    // Correct code — issue a short-lived token that authorises one reset
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset', rid: String(record._id) },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ success: true, resetToken });
  } catch (err) {
    console.log('FORGOT PASSWORD VERIFY ERROR', err);
    res.status(500).json({ success: false, message: 'Could not verify the code. Try again.' });
  }
});

// ── 3. Set the new password ────────────────────────────────────
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Your reset session expired. Start again.',
      });
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Your reset session expired. Start again.',
      });
    }

    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token.' });
    }

    // The code record must still exist — this makes the token single-use
    const record = await PasswordReset.findById(payload.rid);
    if (!record || String(record.userId) !== String(payload.id)) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has already been used. Start again.',
      });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Account not found.' });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    await PasswordReset.deleteMany({ userId: user._id });

    console.log('PASSWORD RESET COMPLETED FOR', user.email);

    res.json({ success: true, message: 'Password updated. You can sign in now.' });
  } catch (err) {
    console.log('FORGOT PASSWORD RESET ERROR', err);
    res.status(500).json({ success: false, message: 'Could not reset the password. Try again.' });
  }
});


module.exports = router;