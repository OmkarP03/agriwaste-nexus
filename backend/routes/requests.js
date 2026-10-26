console.log("REQUEST ROUTES LOADED");
const express = require('express');
const router = express.Router();

const PurchaseRequest =
require('../models/PurchaseRequest');

const Notification =
require('../models/Notification');

const Listing =
require('../models/Listing');

const { requireAuth, requireSelf, requireRole } =
require('../middleware/auth');

const User = require('../models/User');
const notifier = require('../utils/notifier');

router.post('/', requireAuth, async (req,res)=>{

  try{

    const { listingId, quantity, message } = req.body;

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'That listing no longer exists.'
      });
    }

    if (String(listing.userId) === String(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a purchase request for your own listing.'
      });
    }

    const offered = req.body.offeredPricePerTon !== undefined
      ? Number(req.body.offeredPricePerTon)
      : undefined;

    const request = await PurchaseRequest.create({
      listingId,
      // the buyer is whoever holds the token, not whoever the body claims
      buyerId: req.userId,
      buyerName: req.body.buyerName,
      farmerId: listing.farmerId,
      // the real account id — this is what notifications and lookups use
      farmerUserId: String(listing.userId),
      farmerName: listing.farmerName,
      quantity: quantity ?? listing.quantity,
      listedPricePerTon: listing.pricePerTon,
      offeredPricePerTon: offered,
      message
    });

    const priceLine = offered && offered !== listing.pricePerTon
      ? ` at Rs ${offered}/ton (listed Rs ${listing.pricePerTon})`
      : '';

    await Notification.create({
      userId: String(listing.userId),
      message: `📨 ${req.body.buyerName} sent a purchase request for ${request.quantity} tons${priceLine}`
    });

    // …and to the farmer's phone, since nobody watches a dashboard
    const farmer = await User.findById(listing.userId);
    await notifier.send(
      farmer,
      `AgriWaste Nexus: ${req.body.buyerName} wants ${request.quantity} tons of your ${listing.wasteType || listing.cropType}${priceLine}. Open the app to reply.`
    );

    res.json({
      success:true,
      request
    });

  }catch(err){

    res.status(500).json({
      success:false,
      error:err.message
    });

  }

});

router.get('/buyer/:buyerId',
requireAuth, requireSelf('buyerId'),
async(req,res)=>{

  const requests =
  await PurchaseRequest.find({
    buyerId:req.params.buyerId
  });

  

  res.json({
    success:true,
    requests
  });

});

router.get(
  '/farmer/:farmerUserId',
  requireAuth, requireSelf('farmerUserId'),
  async (req,res)=>{

    try{

      // Was matched on farmerName, so two farmers sharing a name
      // saw — and could accept — each other's requests.
      const requests =
      await PurchaseRequest.find({
        farmerUserId:
        String(req.params.farmerUserId)
      }).sort({ createdAt: -1 });

      res.json({
        success:true,
        requests
      });

    }catch(err){

      res.status(500).json({
        success:false,
        error:err.message
      });

    }

});

const ALLOWED_STATUS = ['accepted', 'rejected', 'completed'];

router.put(
  '/:id/status',
  requireAuth,
  async (req,res)=>{

    try{

      const status = req.body.status;

      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Unknown status.'
        });
      }

      const found = await PurchaseRequest.findById(req.params.id);

      if (!found) {
        return res.status(404).json({ success:false, message:'Request not found.' });
      }

      if (req.userRole !== 'admin' && String(found.farmerUserId) !== String(req.userId)) {
        return res.status(403).json({
          success: false,
          message: 'Only the farmer who received this request can answer it.'
        });
      }

      // A farmer can accept less than was asked for — a buyer wanting
      // 20 t from a 15 t listing used to be an outright rejection.
      const patch = { status };

      if (status === 'accepted') {
        const listing = await Listing.findById(found.listingId);

        const available = listing
          ? Number(listing.quantityRemaining ?? listing.quantity ?? 0)
          : Number(found.quantity || 0);

        const asked = Number(found.quantity || 0);
        const wanted = req.body.quantity !== undefined
          ? Number(req.body.quantity)
          : asked;

        if (!(wanted > 0)) {
          return res.status(400).json({
            success: false,
            message: 'Enter how many tons you are accepting.'
          });
        }

        if (wanted > available) {
          return res.status(400).json({
            success: false,
            message: `Only ${available} tons are still unsold on that listing.`
          });
        }

        patch.acceptedQuantity = wanted;

        // Price settles on acceptance: whatever the farmer confirms, else
        // their counter, else the buyer's offer, else the listed price.
        patch.agreedPricePerTon =
          req.body.pricePerTon !== undefined ? Number(req.body.pricePerTon)
            : found.counterPricePerTon ?? found.offeredPricePerTon ?? found.listedPricePerTon;

        if (listing) {
          listing.quantityRemaining = Math.max(0, available - wanted);
          if (listing.quantityRemaining === 0) listing.status = 'sold';
          else if (listing.quantityRemaining < Number(listing.quantity || 0)) listing.status = 'reserved';
          await listing.save();
        }
      }

      const request =
      await PurchaseRequest.findByIdAndUpdate(
        req.params.id,
        patch,
        { new:true }
      );

      // One notification per outcome. The rejected branch used to appear
      // twice, so buyers were told about a rejection two times over.
      const priceNote = request.agreedPricePerTon
        ? ` at Rs ${request.agreedPricePerTon}/ton`
        : '';

      const MESSAGES = {
        accepted:  `✅ ${request.farmerName} accepted ${request.acceptedQuantity ?? request.quantity} of the ${request.quantity} tons you asked for${priceNote}`,
        rejected:  `❌ ${request.farmerName} rejected your request for ${request.quantity} tons`,
        completed: `🎉 Deal completed with ${request.farmerName} for ${request.quantity} tons`
      };

      await Notification.create({
        userId: String(request.buyerId),
        message: MESSAGES[status]
      });

      const buyer = await User.findById(request.buyerId);
      await notifier.send(buyer, 'AgriWaste Nexus: ' + MESSAGES[status].replace(/^[^ ]+ /, ''));

      res.json({
        success:true,
        request
      });

    }catch(err){

      res.status(500).json({
        success:false,
        error:err.message
      });

    }

});


router.get(
  '/all',
  requireAuth, requireRole('admin'),
  async (req,res)=>{

    try{

      const requests =
      await PurchaseRequest.find()
      .sort({
        createdAt:-1
      });

      res.json({
        success:true,
        requests
      });

    }catch(err){

      res.status(500).json({
        success:false,
        error:err.message
      });

    }

});

router.get(
  '/buyer-stats/:buyerId',
  requireAuth, requireSelf('buyerId'),
  async (req,res)=>{

    try{

      const requests =
      await PurchaseRequest.find({
        buyerId:req.params.buyerId
      });

      const total =
      requests.length;

      const accepted =
      requests.filter(
        r => r.status === 'accepted'
      ).length;

      const pending =
      requests.filter(
        r => r.status === 'pending'
      ).length;

      const rejected =
      requests.filter(
        r => r.status === 'rejected'
      ).length;

      const quantity =
      requests.reduce(
        (sum,r)=>
          sum + Number(r.quantity || 0),
        0
      );

      res.json({
        success:true,
        total,
        accepted,
        pending,
        rejected,
        quantity
      });

    }catch(err){

      res.status(500).json({
        success:false,
        error:err.message
      });

    }

});

// ── Counter-offer ──────────────────────────────────────────────
// A farmer can come back with a different price instead of rejecting.
router.put('/:id/counter', requireAuth, async (req, res) => {
  try {
    const price = Number(req.body.counterPricePerTon);

    if (!(price > 0)) {
      return res.status(400).json({ success: false, message: 'Enter a price per ton.' });
    }

    const doc = await PurchaseRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found.' });

    if (String(doc.farmerUserId) !== String(req.userId) && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the farmer can counter this offer.' });
    }

    if (doc.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been answered.' });
    }

    doc.counterPricePerTon = price;
    await doc.save();

    await Notification.create({
      userId: String(doc.buyerId),
      message: `💰 ${doc.farmerName} countered at Rs ${price}/ton for ${doc.quantity} tons`,
    });

    const buyer = await User.findById(doc.buyerId);
    await notifier.send(
      buyer,
      `AgriWaste Nexus: ${doc.farmerName} countered at Rs ${price}/ton for ${doc.quantity} tons.`
    );

    res.json({ success: true, request: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Message thread on a request ────────────────────────────────
// Either side of a deal can post; nobody else can read or write it.
function participantOf(reqDoc, userId) {
  if (String(reqDoc.buyerId) === String(userId)) return 'buyer';
  if (String(reqDoc.farmerUserId) === String(userId)) return 'farmer';
  return null;
}

router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const doc = await PurchaseRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, message:'Request not found.' });

    if (!participantOf(doc, req.userId) && req.userRole !== 'admin') {
      return res.status(403).json({ success:false, message:'This conversation is not yours.' });
    }

    res.json({ success:true, messages: doc.messages || [] });
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();

    if (!text) {
      return res.status(400).json({ success:false, message:'Write a message first.' });
    }
    if (text.length > 1000) {
      return res.status(400).json({ success:false, message:'Message is too long.' });
    }

    const doc = await PurchaseRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, message:'Request not found.' });

    const role = participantOf(doc, req.userId);
    if (!role) {
      return res.status(403).json({ success:false, message:'This conversation is not yours.' });
    }

    const entry = {
      fromId: String(req.userId),
      fromName: role === 'buyer' ? doc.buyerName : doc.farmerName,
      role,
      text,
      at: new Date(),
    };

    doc.messages = [...(doc.messages || []), entry];
    await doc.save();

    // Tell the other side there's a reply waiting
    const otherId = role === 'buyer' ? doc.farmerUserId : doc.buyerId;
    await Notification.create({
      userId: String(otherId),
      message: `💬 ${entry.fromName}: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`,
    });

    res.json({ success:true, messages: doc.messages });
  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
});

module.exports = router;