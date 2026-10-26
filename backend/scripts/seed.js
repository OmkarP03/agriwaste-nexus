/**
 * Seeds the demo accounts the login page's demo buttons sign in as, plus
 * enough marketplace data that the dashboard isn't empty on stage.
 *
 *   cd backend && node scripts/seed.js
 *
 * Safe to run repeatedly: accounts and listings are upserted, never
 * duplicated. It also backfills farmerUserId on purchase requests created
 * before that field existed.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Calculation = require('../models/Calculation');
const PurchaseRequest = require('../models/PurchaseRequest');
const { runFullAnalysis } = require('../calculationEngine');

const DEMO_PASSWORD = '123456789';

const ACCOUNTS = [
  {
    email: 'farmer@demo.com',
    name: 'Demo Farmer',
    role: 'farmer',
    mobile: '9876543210',
    village: 'Shirwal',
    district: 'Satara',
    cropType: 'rice',
    landArea: '5',
  },
  {
    email: 'buyer@demo.com',
    name: 'Demo Buyer',
    role: 'buyer',
    mobile: '9876543211',
    district: 'Pune',
    companyName: 'Pune Biogas Works',
    buyerType: 'Biogas Plant',
    capacityTonsPerDay: 50,
    acceptedWaste: ['rice', 'wheat', 'maize'],
    verified: true,
    verifiedAt: new Date(),
    verificationNote: 'Demo account, verified for the seeded dataset.',
  },
  {
    email: 'admin@demo.com',
    name: 'Demo Admin',
    role: 'admin',
    mobile: '9876543212',
  },
  // A second buyer left unverified on purpose, so the admin screen has
  // something in its queue during a demo.
  {
    email: 'greenchar@demo.com',
    name: 'Anita Deshmukh',
    role: 'buyer',
    mobile: '9876500011',
    village: 'Ozar',
    district: 'Nashik',
    companyName: 'GreenChar Industries',
    buyerType: 'Biochar Mfr',
    capacityTonsPerDay: 20,
    acceptedWaste: ['rice', 'wheat', 'cotton'],
  },
];

// Neighbouring farms, so the district benchmark and the credit pool have
// somebody to compare against rather than an empty state.
const NEIGHBOURS = [
  { email: 'sunil@demo.com',  name: 'Sunil Pawar',   village: 'Wai',   area: 4 },
  { email: 'kavita@demo.com', name: 'Kavita Jadhav', village: 'Karad', area: 1.5 },
  { email: 'mahesh@demo.com', name: 'Mahesh Shinde', village: 'Patan', area: 7 },
];

const LISTINGS = [
  { cropType: 'rice',      wasteType: 'Rice Straw',    quantity: 15, pricePerTon: 1200, location: 'Nashik, MH',    description: 'Dry rice straw, low ash. Suitable for biogas or biochar.' },
  { cropType: 'wheat',     wasteType: 'Wheat Stubble', quantity: 8,  pricePerTon: 900,  location: 'Pune, MH',      description: 'Post-harvest wheat straw. Delivery within 50 km.' },
  { cropType: 'sugarcane', wasteType: 'Bagasse',       quantity: 30, pricePerTon: 600,  location: 'Solapur, MH',   description: 'High calorific bagasse. Bulk quantity available.' },
  { cropType: 'maize',     wasteType: 'Maize Stalks',  quantity: 12, pricePerTon: 1100, location: 'Kolhapur, MH',  description: 'Dried corn stalks for biomass energy.' },
];

const FIELDS = [
  { cropType: 'rice',  area: 2, yieldPerAcre: 3,   unit: 'acres' },
  { cropType: 'wheat', area: 3, yieldPerAcre: 2.5, unit: 'acres' },
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI missing from backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected\n');

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = {};

  for (const acc of ACCOUNTS) {
    let user = await User.findOne({ email: acc.email });

    if (user) {
      Object.assign(user, acc);
      user.password = hashed;          // reset, so the demo button always works
      await user.save();
      console.log(`↻ updated  ${acc.email}`);
    } else {
      user = await User.create({ ...acc, password: hashed });
      console.log(`+ created  ${acc.email}`);
    }

    users[acc.role] = user;
  }

  const farmer = users.farmer;

  // ── Listings ──
  for (const l of LISTINGS) {
    const exists = await Listing.findOne({ userId: farmer._id, wasteType: l.wasteType });
    if (exists) {
      console.log(`↻ listing  ${l.wasteType}`);
      continue;
    }
    await Listing.create({
      ...l,
      userId: farmer._id,
      farmerId: `AWN-${farmer._id}`,
      farmerName: farmer.name,
      contact: `+91-${farmer.mobile}`,
      status: 'available',
    });
    console.log(`+ listing  ${l.wasteType}`);
  }

  // ── A little calculation history, so the dashboard has real figures ──
  for (const f of FIELDS) {
    const existing = await Calculation.findOne({
      userId: farmer._id,
      'inputs.cropType': f.cropType,
      'inputs.area': f.area,
    });
    if (existing) {
      console.log(`↻ calc     ${f.cropType} ${f.area} ${f.unit}`);
      continue;
    }
    await Calculation.create({
      userId: farmer._id,
      inputs: f,
      result: runFullAnalysis(f),
    });
    console.log(`+ calc     ${f.cropType} ${f.area} ${f.unit}`);
  }

  // ── Neighbouring farms in the same district ──
  for (const n of NEIGHBOURS) {
    let neighbour = await User.findOne({ email: n.email });
    if (!neighbour) {
      neighbour = await User.create({
        email: n.email,
        name: n.name,
        role: 'farmer',
        mobile: '9876500000',
        village: n.village,
        district: farmer.district,
        cropType: 'rice',
        landArea: String(n.area),
        password: hashed,
      });
      console.log(`+ farm     ${n.name} (${n.village})`);
    } else {
      console.log(`↻ farm     ${n.name}`);
    }

    const field = { cropType: 'rice', area: n.area, yieldPerAcre: 3, unit: 'acres' };
    const has = await Calculation.findOne({ userId: neighbour._id, 'inputs.area': n.area });
    if (!has) {
      await Calculation.create({ userId: neighbour._id, inputs: field, result: runFullAnalysis(field) });
    }
  }

  // ── Backfill: requests created before farmerUserId existed ──
  const orphans = await PurchaseRequest.find({
    $or: [{ farmerUserId: { $exists: false } }, { farmerUserId: null }, { farmerUserId: '' }],
  });

  let fixed = 0;
  for (const r of orphans) {
    const match = await User.findOne({ name: r.farmerName, role: 'farmer' });
    if (match) {
      r.farmerUserId = String(match._id);
      await r.save();
      fixed++;
    }
  }
  if (orphans.length) {
    console.log(`\n↻ backfilled farmerUserId on ${fixed}/${orphans.length} older requests`);
  }

  console.log('\n─────────────────────────────');
  console.log('Demo sign-in');
  console.log('  farmer@demo.com / ' + DEMO_PASSWORD);
  console.log('  buyer@demo.com  / ' + DEMO_PASSWORD);
  console.log('  admin@demo.com  / ' + DEMO_PASSWORD);
  console.log('─────────────────────────────\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
