const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { attachUser, requireAuth } = require('../middleware/auth');

/**
 * The buyer directory.
 *
 * Buyers used to be four hardcoded objects in the marketplace page, and
 * "Contact" only set local state. These are real accounts a farmer can
 * actually reach.
 */

const PUBLIC_FIELDS =
  'name companyName buyerType capacityTonsPerDay acceptedWaste district village mobile verified verifiedAt createdAt';

// Anyone can browse; signing in is not required to see who buys residue
router.get('/', attachUser, async (req, res) => {
  try {
    const query = { role: 'buyer' };

    // Only verified buyers by default — the word has to mean something
    if (req.query.all !== '1') query.verified = true;

    if (req.query.wasteType) query.acceptedWaste = req.query.wasteType;
    if (req.query.district) query.district = req.query.district;
    if (req.query.type) query.buyerType = req.query.type;

    const buyers = await User.find(query).select(PUBLIC_FIELDS).sort({ verified: -1, createdAt: -1 });

    res.json({ success: true, buyers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// A buyer fills in their own profile
router.put('/me', requireAuth, async (req, res) => {
  try {
    if (req.userRole !== 'buyer' && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only buyer accounts have a buyer profile.' });
    }

    const ALLOWED = ['companyName', 'buyerType', 'capacityTonsPerDay', 'acceptedWaste', 'district', 'village'];
    const updates = {};
    ALLOWED.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.acceptedWaste && !Array.isArray(updates.acceptedWaste)) {
      updates.acceptedWaste = String(updates.acceptedWaste).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (updates.capacityTonsPerDay !== undefined) {
      updates.capacityTonsPerDay = Number(updates.capacityTonsPerDay) || 0;
    }

    // Changing the profile does not re-verify you, and cannot self-verify
    const buyer = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select(PUBLIC_FIELDS);

    res.json({ success: true, buyer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
