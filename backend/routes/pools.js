const express = require('express');
const router  = express.Router();

const CreditPool  = require('../models/CreditPool');
const User        = require('../models/User');
const Calculation = require('../models/Calculation');
const { requireAuth, attachUser } = require('../middleware/auth');

/**
 * District credit pools.
 *
 * A two-acre farm produces roughly a dozen carbon credits a season.
 * Nobody buys a dozen credits. Pooling a district's farms into one lot
 * is how smallholders reach a volume a buyer will look at, so this keeps
 * one open pool per district per season and lets farmers join it.
 *
 * Joining a pool is an expression of interest recorded in this app. It
 * is not a registration with any carbon registry and no credits are
 * issued or sold here.
 */

const TARGET_CREDITS = 500;

function currentSeason(d = new Date()) {
  const m = d.getMonth() + 1;               // 1-12
  const y = d.getFullYear();
  if (m >= 6 && m <= 10) return `${y}-kharif`;
  if (m >= 4 && m <= 5)  return `${y}-zaid`;
  // Rabi runs Nov -> Mar, named for the year it started
  return `${m >= 11 ? y : y - 1}-rabi`;
}

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * "Satara" and "satara" are one district, so one pool. Without this the
 * two spellings each start their own pool and the district never reaches
 * a sellable volume — which is the entire point of pooling.
 */
function findPool(district, season) {
  const escaped = String(district).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return CreditPool.findOne({
    district: { $regex: `^${escaped}$`, $options: 'i' },
    season,
  });
}

function summarise(pool, userId) {
  const members = pool.members || [];
  const credits = round(members.reduce((s, m) => s + (Number(m.credits) || 0), 0));
  const co2     = round(members.reduce((s, m) => s + (Number(m.co2) || 0), 0));
  const target  = pool.targetCredits || TARGET_CREDITS;

  return {
    _id: pool._id,
    district: pool.district,
    season: pool.season,
    status: pool.status,
    targetCredits: target,
    totalCredits: credits,
    totalCo2: co2,
    memberCount: members.length,
    progress: Math.min(100, Math.round((credits / target) * 100)),
    joined: userId ? members.some((m) => String(m.userId) === String(userId)) : false,
    // Names + villages only. No contact details leak through this.
    members: members.map((m) => ({
      name: m.name,
      village: m.village,
      credits: round(m.credits),
      co2: round(m.co2),
      joinedAt: m.joinedAt,
      isMe: userId ? String(m.userId) === String(userId) : false,
    })),
    note: 'An expression of interest recorded in AgriWaste Nexus. Joining does not register credits with any carbon standard.',
  };
}

// What this user brings to the pool, from what they have already calculated
async function myTotals(userId) {
  const calcs = await Calculation.find({ userId: String(userId) });
  let credits = 0;
  let co2 = 0;
  for (const c of calcs) {
    const r = (c.result && c.result.credits) || {};
    credits += Number(r.carbonCredits) || 0;
    co2     += Number(r.co2Avoided) || 0;
  }
  return { credits: round(credits), co2: round(co2), calculations: calcs.length };
}

/**
 * GET /api/pools?district=Satara&season=2026-kharif
 * Falls back to the signed-in user's district and the current season.
 */
router.get('/', attachUser, async (req, res) => {
  try {
    const me = req.userId ? await User.findById(req.userId) : null;
    const district = (req.query.district || (me && me.district) || '').trim();
    const season   = (req.query.season || currentSeason()).trim();

    if (!district) {
      return res.json({
        pool: null,
        season,
        message: 'Add your district in your profile to see the pool for your area.',
      });
    }

    const pool = await findPool(district, season);
    const mine = me ? await myTotals(me._id) : null;

    res.json({
      season,
      district,
      mine,
      pool: pool ? summarise(pool, me && me._id) : null,
    });
  } catch (err) {
    console.error('pools GET:', err.message);
    res.status(500).json({ message: 'Could not load the credit pool' });
  }
});

/**
 * POST /api/pools/join  { season? }
 * Joins (or refreshes your entry in) the pool for your own district.
 */
router.post('/join', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const district = (user.district || '').trim();
    if (!district) {
      return res.status(400).json({
        message: 'Add your district to your profile before joining a pool',
      });
    }

    const season = (req.body.season || currentSeason()).trim();
    const mine = await myTotals(user._id);

    if (mine.calculations === 0) {
      return res.status(400).json({
        message: 'Run and save a calculation first — a pool entry needs a credit estimate behind it',
      });
    }

    let pool = await findPool(district, season);
    if (!pool) {
      pool = await CreditPool.create({
        district, season, targetCredits: TARGET_CREDITS, members: [],
      });
    }

    if (pool.status === 'closed') {
      return res.status(400).json({ message: 'This pool is closed for the season' });
    }

    const entry = {
      userId: String(user._id),
      name: user.name,
      village: user.village,
      credits: mine.credits,
      co2: mine.co2,
      joinedAt: new Date(),
    };

    const idx = (pool.members || []).findIndex((m) => String(m.userId) === String(user._id));
    if (idx >= 0) {
      // Already in — refresh the figures rather than adding a second row
      entry.joinedAt = pool.members[idx].joinedAt || entry.joinedAt;
      pool.members[idx] = entry;
    } else {
      pool.members.push(entry);
    }

    await pool.save();
    res.json({ season, district, mine, pool: summarise(pool, user._id) });
  } catch (err) {
    console.error('pools join:', err.message);
    res.status(500).json({ message: 'Could not join the credit pool' });
  }
});

/** POST /api/pools/leave  { season? } */
router.post('/leave', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const district = (user.district || '').trim();
    const season   = (req.body.season || currentSeason()).trim();

    const pool = await findPool(district, season);
    if (!pool) return res.status(404).json({ message: 'No pool to leave' });

    pool.members = (pool.members || []).filter(
      (m) => String(m.userId) !== String(user._id)
    );
    await pool.save();

    res.json({ season, district, pool: summarise(pool, user._id) });
  } catch (err) {
    console.error('pools leave:', err.message);
    res.status(500).json({ message: 'Could not leave the credit pool' });
  }
});

module.exports = router;
module.exports.currentSeason = currentSeason;
