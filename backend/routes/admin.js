const express = require('express');
console.log("ADMIN ROUTE LOADED");
const router = express.Router();

const User = require('../models/User');
const Calculation = require('../models/Calculation');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');
const { requireAuth, requireRole } = require('../middleware/auth');
const notifier = require('../utils/notifier');

// Every route below this line requires a signed-in admin
router.use(requireAuth, requireRole('admin'));

router.get('/stats', async (req, res) => {
  try {

    const farmers = await User.countDocuments({
      role: 'farmer'
    });

    const buyers = await User.countDocuments({
      role: 'buyer'
    });

    const admins = await User.countDocuments({
      role: 'admin'
    });

    const calculations =
      await Calculation.countDocuments();

    const listings =
      await Listing.countDocuments();

    res.json({
      success: true,
      farmers,
      buyers,
      admins,
      calculations,
      listings
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});
router.get('/users', async (req, res) => {

  try {

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

router.delete('/users/:id', async (req, res) => {

  try {

    await User.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

router.get('/listings', async (req, res) => {

  try {

    const listings = await Listing.find()
      .sort({ postedDate: -1 });

    res.json({
      success: true,
      listings
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

router.delete('/listings/:id', async (req, res) => {

  try {

    await Listing.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

router.get('/analytics/crops', async (req, res) => {

  try {

    const crops = await Listing.aggregate([
      {
        $group: {
          _id: '$cropType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ]);

    res.json({
      success: true,
      crops
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

// ═══ Verification ═══════════════════════════════════════════
// The marketplace shows "Verified Buyers". This is what makes it true:
// an admin checks the business and sets the flag. Nobody can set it on
// themselves — the route is behind requireRole('admin') above.
router.put('/users/:id/verify', async (req, res) => {
  try {
    const verified = req.body.verified !== false;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });

    user.verified = verified;
    user.verifiedAt = verified ? new Date() : undefined;
    user.verifiedBy = verified ? String(req.userId) : undefined;
    user.verificationNote = req.body.note ? String(req.body.note).slice(0, 300) : undefined;
    await user.save();

    await Notification.create({
      userId: String(user._id),
      message: verified
        ? '✅ Your account has been verified. Farmers can now see you in the buyer directory.'
        : 'ℹ️ Your verified status has been removed. Contact support if you think this is a mistake.',
    });

    if (verified) {
      await notifier.send(user, 'AgriWaste Nexus: your buyer account has been verified.');
    }

    res.json({ success: true, user: { _id: user._id, verified: user.verified } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══ Moderation queue ═══════════════════════════════════════
router.get('/moderation/listings', async (req, res) => {
  try {
    const state = req.query.state;

    // Default view is everything that still needs a decision
    const query = state
      ? { 'moderation.state': state }
      : { $or: [
          { 'moderation.state': 'flagged' },
          { 'moderation.state': { $exists: false } },
          { 'moderation.state': null },
        ] };

    const listings = await Listing.find(query).sort({ postedDate: -1 }).limit(200);

    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/listings/:id/moderate', async (req, res) => {
  try {
    const state = req.body.state;

    if (!['ok', 'flagged', 'removed'].includes(state)) {
      return res.status(400).json({ success: false, message: 'state must be ok, flagged or removed.' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    listing.moderation = {
      state,
      reason: req.body.reason ? String(req.body.reason).slice(0, 300) : undefined,
      by: String(req.userId),
      at: new Date(),
    };
    await listing.save();

    if (state === 'removed') {
      await Notification.create({
        userId: String(listing.userId),
        message: `⚠️ Your listing "${listing.wasteType || listing.cropType}" was removed by a moderator.${
          req.body.reason ? ' Reason: ' + req.body.reason : ''
        }`,
      });
    }

    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;