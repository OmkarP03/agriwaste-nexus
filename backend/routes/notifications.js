const express = require('express');
const router = express.Router();

const Notification = require('../models/Notification');
const { requireAuth, requireSelf } = require('../middleware/auth');

// Your own notifications only
router.get('/:userId', requireAuth, requireSelf('userId'), async (req, res) => {
  try {
    const notifications = await Notification
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications,
      unread: notifications.filter(n => !n.read).length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark one notification read
router.put('/read/:id', requireAuth, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);

    if (!n) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    if (String(n.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, error: 'Not yours' });
    }

    n.read = true;
    await n.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark every unread notification read — what the Notifications page calls
router.put('/read-all/:userId', requireAuth, requireSelf('userId'), async (req, res) => {
  try {
    // `$ne: true` rather than `read: false`, so notifications written
    // before the field existed are matched too.
    const result = await Notification.updateMany(
      { userId: req.params.userId, read: { $ne: true } },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      updated: result.modifiedCount ?? result.nModified ?? 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
