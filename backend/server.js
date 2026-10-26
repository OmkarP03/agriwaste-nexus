
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

console.log("MONGO_URI loaded:", process.env.MONGO_URI ? "YES" : "NO");

if (!process.env.JWT_SECRET) {
  console.error('\n❌ JWT_SECRET is missing from backend/.env — refusing to start.');
  console.error('   Add a long random value, e.g.  JWT_SECRET=<64 random hex characters>\n');
  process.exit(1);
}

const app = express();

app.use(cors());
// Listings carry up to three resized photos as data URLs, which is a few
// hundred KB. body-parser's 100 KB default would reject those outright.
app.use(express.json({ limit: '5mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('✅ MongoDB Connected');
})
.catch((err) => {
  console.error('❌ MongoDB Error:', err);
});

console.log("TRYING TO LOAD AUTH");
const authRoutes = require('./routes/auth');
console.log("AUTH IMPORTED");
const calculatorRoutes  = require('./routes/calculator');
const marketplaceRoutes = require('./routes/marketplace');
const locatorRoutes     = require('./routes/locator');
const calculationRoutes = require('./routes/calculations');
console.log("BEFORE REQUEST IMPORT");

const requestRoutes =
require('./routes/requests');

console.log("AFTER REQUEST IMPORT");
const adminRoutes = require('./routes/admin');
console.log("ADMIN IMPORT SUCCESS");
const notificationRoutes =
require('./routes/notifications');
const plotRoutes = require('./routes/plots');
const statsRoutes = require('./routes/stats');
const poolRoutes  = require('./routes/pools');
const buyerRoutes = require('./routes/buyers');
app.use('/api/auth', authRoutes);

app.use('/api/calculator',  calculatorRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/locator',     locatorRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/requests',requestRoutes);
app.use('/api/admin', adminRoutes);
app.use(
  '/api/notifications',
  notificationRoutes
);
app.use('/api/plots', plotRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/stats',  statsRoutes);
app.use('/api/pools',  poolRoutes);


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AgriWaste Nexus API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});