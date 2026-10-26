const express = require('express');
const router = express.Router();
const {
  calculateCropWaste,
  calculateBiogas,
  calculateBiochar,
  calculateCarbonCredits,
  runFullAnalysis
} = require('../calculationEngine');

// Run all 4 calculators at once
router.post('/full', (req, res) => {
  try {
    const { cropType, area, yieldPerAcre, unit } = req.body;
    if (!cropType || !area || !yieldPerAcre) {
      return res.status(400).json({ error: 'cropType, area, and yieldPerAcre are required' });
    }
    const result = runFullAnalysis({
      cropType,
      area: +area,
      yieldPerAcre: +yieldPerAcre,
      unit
    });
    res.json({ success: true, inputs: req.body, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/waste', (req, res) => {
  try { res.json({ success: true, result: calculateCropWaste(req.body) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/biogas', (req, res) => {
  try { res.json({ success: true, result: calculateBiogas(req.body) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/biochar', (req, res) => {
  try { res.json({ success: true, result: calculateBiochar(req.body) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/carbon', (req, res) => {
  try { res.json({ success: true, result: calculateCarbonCredits(req.body) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/crops', (req, res) => {
  res.json({ crops: ['rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'soybean'] });
});

module.exports = router; 