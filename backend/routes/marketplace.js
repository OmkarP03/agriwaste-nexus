const express = require('express');
const router = express.Router();

const Listing = require('../models/Listing');
const { requireAuth, requireOwnership } = require('../middleware/auth');

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 500 * 1024;   // ~500 KB per photo after resizing
const DEFAULT_LISTING_DAYS = 90;

// Only show listings that are still live
function notExpired() {
  return {
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gte: new Date() } },
    ],
  };
}

// A moderator-removed listing stays in the database but leaves the market
function notRemoved() {
  return {
    $or: [
      { 'moderation.state': { $exists: false } },
      { 'moderation.state': null },
      { 'moderation.state': { $ne: 'removed' } },
    ],
  };
}

function cleanImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .filter(src => typeof src === 'string' && src.startsWith('data:image/'))
    .filter(src => src.length <= MAX_IMAGE_BYTES)
    .slice(0, MAX_IMAGES);
}

// Static buyers data (keep for now)
const buyers = [
  {
    id:'B001',
    name:'Maharashtra Biogas Authority',
    type:'Biogas Plant',
    location:'Pune',
    acceptedWaste:['rice','wheat','maize'],
    capacity:'50T/day',
    phone:'+91-2012345678',
    rating:4.5
  },
  {
    id:'B002',
    name:'GreenChar Industries',
    type:'Biochar Mfr',
    location:'Nashik',
    acceptedWaste:['rice','wheat','cotton'],
    capacity:'20T/day',
    phone:'+91-2534567890',
    rating:4.8
  },
  {
    id:'B003',
    name:'SugarEnergy Co-op',
    type:'Biomass Power',
    location:'Solapur',
    acceptedWaste:['sugarcane','cotton'],
    capacity:'100T/day',
    phone:'+91-2174563210',
    rating:4.2
  },
  {
    id:'B004',
    name:'AgroCompost Ltd.',
    type:'Compost',
    location:'Kolhapur',
    acceptedWaste:['rice','wheat','maize','soybean'],
    capacity:'30T/day',
    phone:'+91-2312345670',
    rating:4.0
  }
];

// GET ALL LISTINGS
router.get('/listings', async (req, res) => {
  try {

    const { cropType, status } = req.query;

    let query = {};

    if (cropType) {
      query.cropType = cropType;
    }

    if (status) {
      query.status = status;
    }

    const conditions = [notRemoved()];
    if (req.query.includeExpired !== '1') conditions.push(notExpired());

    const listings = await Listing
      .find({ ...query, $and: conditions })
      .sort({ postedDate: -1 });

    res.json({
      success: true,
      count: listings.length,
      listings
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});

// CREATE NEW LISTING
router.post('/listings', requireAuth, async (req, res) => {

  try {

    const { farmerName, cropType, quantity } = req.body;

    if (!farmerName || !cropType || !quantity) {
      return res.status(400).json({
        error: 'farmerName, cropType, quantity required'
      });
    }

    const days = Number(req.body.listingDays) > 0
      ? Number(req.body.listingDays)
      : DEFAULT_LISTING_DAYS;

    // The listing belongs to whoever holds the token
    const listing = await Listing.create({
      ...req.body,
      userId: req.userId,
      farmerId: `AWN-${req.userId}`,
      quantity: Number(quantity),
      quantityRemaining: Number(quantity),
      images: cleanImages(req.body.images),
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      listing
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

// DELETE LISTING
router.delete('/listings/:id', requireAuth, requireOwnership(Listing), async (req, res) => {

  try {

    const listing = await Listing.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Listing removed'
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

// GET BUYERS
router.get('/buyers', (req, res) => {

  const { wasteType } = req.query;

  let filtered = [...buyers];

  if (wasteType) {
    filtered = filtered.filter(
      b => b.acceptedWaste.includes(wasteType)
    );
  }

  res.json({
    success: true,
    buyers: filtered
  });

});

// CONTACT BUYER
router.post('/contact/:buyerId', (req, res) => {

  const buyer = buyers.find(
    b => b.id === req.params.buyerId
  );

  if (!buyer) {
    return res.status(404).json({
      error: 'Buyer not found'
    });
  }

  res.json({
    success: true,
    message: `Contact request sent to ${buyer.name}. They will reach out within 24 hours.`,
    buyer: {
      name: buyer.name,
      phone: buyer.phone
    }
  });

});
// GET LISTINGS OF LOGGED-IN USER
router.get('/user/:userId', requireAuth, async (req, res) => {

  if (req.userRole !== 'admin' && String(req.params.userId) !== String(req.userId)) {
    return res.status(403).json({ success: false, message: 'You can only view your own listings.' });
  }


  try {

    const listings = await Listing.find({
      userId: req.params.userId
    });

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
// UPDATE LISTING STATUS
router.put('/listings/:id/status', requireAuth, requireOwnership(Listing), async (req, res) => {

  try {

    const { status } = req.body;

    const listing =
      await Listing.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

    res.json({
      success: true,
      listing
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

// UPDATE LISTING
router.put('/listings/:id', requireAuth, requireOwnership(Listing), async (req, res) => {

  try {

    // Ownership fields can't be reassigned through an edit
    const { userId, farmerId, quantityRemaining, ...safe } = req.body;

    if (safe.images !== undefined) {
      safe.images = cleanImages(safe.images);
    }

    // Raising or lowering the listed quantity moves the unsold figure by
    // the same amount, so accepted requests stay accounted for.
    if (safe.quantity !== undefined) {
      const current = req.doc;
      const sold = Number(current.quantity || 0) - Number(
        current.quantityRemaining ?? current.quantity ?? 0
      );
      safe.quantity = Number(safe.quantity);
      safe.quantityRemaining = Math.max(0, safe.quantity - sold);
    }

    if (safe.listingDays !== undefined) {
      const d = Number(safe.listingDays) > 0 ? Number(safe.listingDays) : DEFAULT_LISTING_DAYS;
      safe.expiresAt = new Date(Date.now() + d * 24 * 60 * 60 * 1000);
      delete safe.listingDays;
    }

    const listing =
      await Listing.findByIdAndUpdate(
        req.params.id,
        safe,
        { new: true }
      );

    res.json({
      success: true,
      listing
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

// FARMER ANALYTICS
router.get('/analytics/:userId', requireAuth, async (req, res) => {

  if (req.userRole !== 'admin' && String(req.params.userId) !== String(req.userId)) {
    return res.status(403).json({ success: false, message: 'You can only view your own analytics.' });
  }

  try {

    const listings =
      await Listing.find({
        userId: req.params.userId
      });

    const totalListings =
      listings.length;

    const availableListings =
      listings.filter(
        l => l.status === 'available'
      ).length;

    const totalWaste =
      listings.reduce(
        (sum, l) =>
          sum + Number(l.quantity || 0),
        0
      );

    const expectedRevenue =
      listings.reduce(
        (sum, l) =>
          sum +
          (
            Number(l.quantity || 0) *
            Number(l.pricePerTon || 0)
          ),
        0
      );

    res.json({
      success: true,
      totalListings,
      availableListings,
      totalWaste,
      expectedRevenue
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

router.get('/search', async (req, res) => {

  try {

    const search =
      req.query.search || '';

    // Everything inside one $and, rather than a top-level $or sitting
    // beside it — the mixed form is easy to misread and easy to break.
    const listings =
      await Listing.find({
        $and: [
          notExpired(),
          notRemoved(),
          { $or: [
          {
            farmerName: {
              $regex: search,
              $options: 'i'
            }
          },
          {
            farmerId: {
              $regex: search,
              $options: 'i'
            }
          },
          {
            cropType: {
              $regex: search,
              $options: 'i'
            }
          },
          {
            location: {
              $regex: search,
              $options: 'i'
            }
          },
          {
            wasteType: {
              $regex: search,
              $options: 'i'
            }
          }
          ] }
        ]
      }).sort({ postedDate: -1 });

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

module.exports = router;