const express = require('express');
const router = express.Router();

const Calculation = require('../models/Calculation');
const { requireAuth, requireSelf } = require('../middleware/auth');

// All four calculator pages run the same engine and save the same result,
// so opening Waste → Biogas → Biochar → Carbon for one field used to write
// four identical rows and quadruple every dashboard total. Within this
// window, an identical set of inputs updates the existing row instead.
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function sameField(a = {}, b = {}) {
  return String(a.cropType) === String(b.cropType)
    && Number(a.area) === Number(b.area)
    && String(a.unit) === String(b.unit)
    && Number(a.yieldPerAcre) === Number(b.yieldPerAcre);
}

router.post('/save', requireAuth, async (req, res) => {
  try {
    const { inputs, result } = req.body;

    if (!inputs || !result) {
      return res.status(400).json({
        success: false,
        error: 'inputs and result are required',
      });
    }

    // The owner comes from the token, never from the request body
    const userId = req.userId;

    const recent = await Calculation
      .find({
        userId,
        createdAt: { $gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
      })
      .sort({ createdAt: -1 })
      .limit(20);

    const existing = recent.find(c => sameField(c.inputs, inputs));

    if (existing) {
      existing.result = result;
      await existing.save();

      return res.json({
        success: true,
        deduped: true,
        calculation: existing,
      });
    }

    const calculation = await Calculation.create({ userId, inputs, result });

    res.status(201).json({
      success: true,
      deduped: false,
      calculation,
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/user/:userId', requireAuth, requireSelf('userId'), async (req, res) => {
  try {
    const calculations = await Calculation
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, calculations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Let a farmer remove a calculation from their own history
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const calc = await Calculation.findById(req.params.id);

    if (!calc) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    if (String(calc.userId) !== String(req.userId) && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not yours to delete' });
    }

    await calc.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
