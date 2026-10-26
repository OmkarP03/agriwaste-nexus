const express = require('express');
const router  = express.Router();

const User        = require('../models/User');
const Calculation = require('../models/Calculation');
const { attachUser } = require('../middleware/auth');

/**
 * District benchmarks.
 *
 * "You avoided 24 t of CO2" means nothing on its own. "24 t — more than
 * 70% of the farms we have data for in Satara" is the line that makes a
 * farmer keep using the app. Everything here is computed from
 * calculations real users of this app have saved; it is not a claim
 * about the district as a whole, and the response says so.
 */

const round = (n, d = 2) => {
  const f = Math.pow(10, d);
  return Math.round((Number(n) || 0) * f) / f;
};

// Pull the numbers we care about out of one saved calculation.
function metricsOf(calc) {
  const r = (calc && calc.result) || {};
  const waste   = r.waste   || {};
  const biogas  = r.biogas  || {};
  const credits = r.credits || {};
  return {
    co2:     Number(credits.co2Avoided ?? waste.co2Avoided ?? 0) || 0,
    credits: Number(credits.carbonCredits ?? 0) || 0,
    income:  Number(credits.totalIncome ?? 0) || 0,
    biogas:  Number(biogas.totalBiogasM3 ?? 0) || 0,
    acres:   Number(waste.areaAcres ?? 0) || 0,
  };
}

const EMPTY = { co2: 0, credits: 0, income: 0, biogas: 0, acres: 0 };

function addTo(acc, m) {
  return {
    co2:     acc.co2     + m.co2,
    credits: acc.credits + m.credits,
    income:  acc.income  + m.income,
    biogas:  acc.biogas  + m.biogas,
    acres:   acc.acres   + m.acres,
  };
}

function roundAll(t) {
  return {
    co2:     round(t.co2),
    credits: round(t.credits),
    income:  Math.round(t.income),
    biogas:  round(t.biogas, 1),
    acres:   round(t.acres),
  };
}

/**
 * GET /api/stats/district?district=Satara
 *
 * Without ?district, uses the signed-in user's district.
 * When the caller is signed in, adds a `you` block and a percentile.
 */
router.get('/district', attachUser, async (req, res) => {
  try {
    // attachUser only puts the id on the request; the district lives on
    // the account, so load it when someone is signed in.
    const me = req.userId ? await User.findById(req.userId) : null;
    const district = (req.query.district || (me && me.district) || '').trim();

    if (!district) {
      return res.json({
        district: null,
        farms: 0,
        message: 'Add your district in your profile to compare with neighbouring farms.',
      });
    }

    // Case-insensitive exact match, so "satara" and "Satara" are one district
    const escaped = district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const peers = await User.find({
      district: { $regex: `^${escaped}$`, $options: 'i' },
      role: 'farmer',
    }).select('_id name village');

    if (!peers.length) {
      return res.json({ district, farms: 0, basis: 'app users only' });
    }

    const ids = peers.map((u) => String(u._id));
    const calcs = await Calculation.find({ userId: { $in: ids } });

    // One farm = one user. A farmer with three plots saved counts once,
    // with their three calculations summed.
    const perFarm = new Map();
    for (const c of calcs) {
      const key = String(c.userId);
      perFarm.set(key, addTo(perFarm.get(key) || EMPTY, metricsOf(c)));
    }

    const farms = [...perFarm.entries()].map(([userId, t]) => ({ userId, ...t }));

    if (!farms.length) {
      return res.json({ district, farms: 0, basis: 'app users only' });
    }

    const totals = farms.reduce((acc, f) => addTo(acc, f), EMPTY);
    const n = farms.length;

    const averages = {
      co2:     round(totals.co2 / n),
      credits: round(totals.credits / n),
      income:  Math.round(totals.income / n),
      biogas:  round(totals.biogas / n, 1),
      acres:   round(totals.acres / n),
    };

    const sortedCo2 = farms.map((f) => f.co2).sort((a, b) => a - b);
    const median = sortedCo2.length % 2
      ? sortedCo2[(sortedCo2.length - 1) / 2]
      : (sortedCo2[sortedCo2.length / 2 - 1] + sortedCo2[sortedCo2.length / 2]) / 2;

    const payload = {
      district,
      farms: n,
      calculations: calcs.length,
      totals: roundAll(totals),
      averages,
      best: round(Math.max(...sortedCo2)),
      median: round(median),
      basis: 'Averages across AgriWaste Nexus users in this district, not an official district survey.',
    };

    // The caller's own standing, when we know who they are
    if (me) {
      const mine = perFarm.get(String(me._id));
      if (mine) {
        const below = sortedCo2.filter((v) => v < mine.co2).length;
        payload.you = {
          ...roundAll(mine),
          // "ahead of X% of farms" — 0 when you're last, never 100
          percentile: n > 1 ? Math.round((below / (n - 1)) * 100) : null,
          vsAverage: averages.co2 > 0
            ? round(((mine.co2 - averages.co2) / averages.co2) * 100, 0)
            : null,
        };
      }
    }

    res.json(payload);
  } catch (err) {
    console.error('stats/district:', err.message);
    res.status(500).json({ message: 'Could not load district statistics' });
  }
});

/**
 * GET /api/stats/districts — every district with data, biggest first.
 * Used for the leaderboard strip and the district dropdown.
 */
router.get('/districts', async (req, res) => {
  try {
    const users = await User.find({ role: 'farmer' }).select('_id district');
    const byUser = new Map();
    for (const u of users) {
      if (u.district && String(u.district).trim()) {
        byUser.set(String(u._id), String(u.district).trim());
      }
    }

    if (!byUser.size) return res.json([]);

    const calcs = await Calculation.find({ userId: { $in: [...byUser.keys()] } });

    const districts = new Map();
    for (const c of calcs) {
      const name = byUser.get(String(c.userId));
      if (!name) continue;
      const key = name.toLowerCase();
      const row = districts.get(key) || { district: name, farmers: new Set(), ...EMPTY };
      const m = metricsOf(c);
      row.co2 += m.co2;
      row.credits += m.credits;
      row.income += m.income;
      row.biogas += m.biogas;
      row.acres += m.acres;
      row.farmers.add(String(c.userId));
      districts.set(key, row);
    }

    const out = [...districts.values()]
      .map((r) => ({
        district: r.district,
        farms: r.farmers.size,
        ...roundAll(r),
      }))
      .sort((a, b) => b.co2 - a.co2);

    res.json(out);
  } catch (err) {
    console.error('stats/districts:', err.message);
    res.status(500).json({ message: 'Could not load district statistics' });
  }
});

module.exports = router;
