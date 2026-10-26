const express = require('express');
const router = express.Router();

const Plot = require('../models/Plot');
const { requireAuth } = require('../middleware/auth');

const MAX_PLOTS = 25;

// Everything here is scoped to the signed-in farmer
router.use(requireAuth);

function clean(body) {
  return {
    name: String(body.name || '').trim().slice(0, 60),
    cropType: String(body.cropType || 'rice'),
    area: Number(body.area),
    unit: body.unit === 'hectares' ? 'hectares' : 'acres',
    yieldPerAcre: Number(body.yieldPerAcre),
    note: body.note ? String(body.note).slice(0, 200) : undefined,
  };
}

function validate(p) {
  if (!p.name) return 'Give the plot a name.';
  if (!(p.area > 0)) return 'Area must be greater than zero.';
  if (!(p.yieldPerAcre > 0)) return 'Yield must be greater than zero.';
  return null;
}

router.get('/', async (req, res) => {
  try {
    const plots = await Plot.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json({ success: true, plots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = clean(req.body);
    const problem = validate(data);
    if (problem) return res.status(400).json({ success: false, message: problem });

    const count = await Plot.countDocuments({ userId: req.userId });
    if (count >= MAX_PLOTS) {
      return res.status(400).json({
        success: false,
        message: `You can save up to ${MAX_PLOTS} plots.`,
      });
    }

    // Saving under a name that already exists updates that plot, so the
    // farmer doesn't end up with three "North Field" entries.
    const existing = await Plot.findOne({ userId: req.userId, name: data.name });

    if (existing) {
      Object.assign(existing, data, { updatedAt: new Date() });
      await existing.save();
      return res.json({ success: true, plot: existing, updated: true });
    }

    const plot = await Plot.create({ ...data, userId: req.userId });
    res.status(201).json({ success: true, plot, updated: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) return res.status(404).json({ success: false, message: 'Plot not found.' });
    if (String(plot.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Not your plot.' });
    }

    const data = clean(req.body);
    const problem = validate(data);
    if (problem) return res.status(400).json({ success: false, message: problem });

    Object.assign(plot, data, { updatedAt: new Date() });
    await plot.save();

    res.json({ success: true, plot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) return res.status(404).json({ success: false, message: 'Plot not found.' });
    if (String(plot.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Not your plot.' });
    }

    await plot.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
