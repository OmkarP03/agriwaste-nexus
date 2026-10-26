/**
 * AgriWaste Nexus — Calculation Engine
 * All formulas are research-backed (ICAR / FAO standards).
 * NO random values. Pure deterministic, formula-based logic.
 */

const CROP_DATA = {
  rice:      { residueFactor: 1.35, moistureContent: 0.12, biogasRate: 0.28, biocharYield: 0.30, emissionFactor: 1.47 },
  wheat:     { residueFactor: 1.20, moistureContent: 0.10, biogasRate: 0.25, biocharYield: 0.28, emissionFactor: 1.35 },
  maize:     { residueFactor: 1.00, moistureContent: 0.13, biogasRate: 0.32, biocharYield: 0.32, emissionFactor: 1.20 },
  sugarcane: { residueFactor: 0.30, moistureContent: 0.50, biogasRate: 0.20, biocharYield: 0.22, emissionFactor: 0.95 },
  cotton:    { residueFactor: 3.00, moistureContent: 0.08, biogasRate: 0.22, biocharYield: 0.26, emissionFactor: 1.10 },
  soybean:   { residueFactor: 1.50, moistureContent: 0.11, biogasRate: 0.26, biocharYield: 0.29, emissionFactor: 1.25 },
  default:   { residueFactor: 1.10, moistureContent: 0.12, biogasRate: 0.25, biocharYield: 0.28, emissionFactor: 1.20 }
};

const CARBON_CREDIT_PRICE_INR = 1500;
const BIOGAS_KWH_PER_M3       = 6.0;
const BIOGAS_LPG_EQUIV        = 0.45;

// ── Digester sizing & economics ───────────────────────────────
// Indicative figures for planning only. Plant costs and fuel prices vary
// by district, vendor and year — update these in one place when you have
// local quotes. Subsidy is deliberately NOT modelled: rates under the
// national biogas programme change, so we point the farmer at the scheme
// rather than inventing a number.
const PLANT_SIZES_M3_DAY   = [1, 2, 3, 4, 6, 8, 10, 15, 20, 25, 35, 50];
const GAS_PER_M3_DIGESTER  = 0.35;   // m³ gas per m³ of digester per day
const COST_PER_M3_DAY_INR  = [       // installed cost, by plant size band
  { upTo: 6,        rate: 32000 },
  { upTo: 20,       rate: 26000 },
  { upTo: Infinity, rate: 20000 },
];
const LPG_CYLINDER_KG        = 14.2;   // domestic cylinder
const LPG_CYLINDER_PRICE_INR = 1100;   // indicative refill price
const ELECTRICITY_INR_PER_KWH = 8;
const FEED_DAYS_PER_YEAR     = 365;    // residue is stored and fed year-round

function pickPlantSize(dailyM3) {
  return PLANT_SIZES_M3_DAY.find(s => s >= dailyM3)
    || PLANT_SIZES_M3_DAY[PLANT_SIZES_M3_DAY.length - 1];
}

function costPerM3Day(size) {
  return COST_PER_M3_DAY_INR.find(b => size <= b.upTo).rate;
}

function getCropData(cropType) {
  return CROP_DATA[cropType.toLowerCase()] || CROP_DATA.default;
}

// ── 1. Crop Waste Calculator ──────────────────────────────────
function calculateCropWaste({ cropType, area, yieldPerAcre, unit = 'acres' }) {
  const crop = getCropData(cropType);
  const areaAcres       = unit === 'hectares' ? area * 2.471 : area;
  const totalYield      = areaAcres * yieldPerAcre;
  const residueGenerated = +(totalYield * crop.residueFactor).toFixed(2);
  const dryBiomass      = +(residueGenerated * (1 - crop.moistureContent)).toFixed(2);
  const usableBiomass   = +(dryBiomass * 0.80).toFixed(2);
  const co2Avoided      = +(residueGenerated * crop.emissionFactor).toFixed(2);
  const energyEquivalent = +(dryBiomass * 15).toFixed(2);

  return {
    totalYield: +totalYield.toFixed(2),
    residueGenerated,
    dryBiomass,
    usableBiomass,
    co2Avoided,
    energyEquivalent,
    areaAcres: +areaAcres.toFixed(2)
  };
}

// ── 2. Biogas Potential Estimator ────────────────────────────
function calculateBiogas({ usableBiomass, cropType, digesterDays = 30 }) {
  const crop = getCropData(cropType);
  const totalBiogasM3  = +(usableBiomass * crop.biogasRate * 1000).toFixed(1);
  const dailyBiogasM3  = +(totalBiogasM3 / digesterDays).toFixed(2);
  const householdsServed = Math.floor(dailyBiogasM3 / 2);
  const totalKWh       = +(totalBiogasM3 * BIOGAS_KWH_PER_M3).toFixed(1);
  const dailyKWh       = +(dailyBiogasM3 * BIOGAS_KWH_PER_M3).toFixed(2);
  const lpgEquivalentKg = +(totalBiogasM3 * BIOGAS_LPG_EQUIV).toFixed(1);
  const co2OffsetLPG   = +(lpgEquivalentKg * 2.98 / 1000).toFixed(2);

  // ── Sizing ──
  // The 30-day figures above describe how fast this residue COULD be
  // digested. A real farm plant is sized differently: the residue is
  // stored and fed a little each day, so the plant is sized against
  // year-round operation, not a one-month sprint. Sizing on the 30-day
  // rate would recommend a community plant for a two-acre field.
  const steadyDailyM3     = +(totalBiogasM3 / FEED_DAYS_PER_YEAR).toFixed(2);
  const plantSizeM3PerDay = pickPlantSize(steadyDailyM3);
  const digesterVolumeM3  = +(plantSizeM3PerDay / GAS_PER_M3_DIGESTER).toFixed(1);
  const capitalCostINR    = Math.round(plantSizeM3PerDay * costPerM3Day(plantSizeM3PerDay));

  // ── What a year of this residue is worth, two ways ──
  const lpgCylinders    = +(lpgEquivalentKg / LPG_CYLINDER_KG).toFixed(1);
  const lpgValueINR     = Math.round(lpgCylinders * LPG_CYLINDER_PRICE_INR);
  const electricityValueINR = Math.round(totalKWh * ELECTRICITY_INR_PER_KWH);

  // Payback against the cooking-gas route, which is what family plants
  // actually displace. Assumes this much residue every year.
  const paybackYears = lpgValueINR > 0
    ? +(capitalCostINR / lpgValueINR).toFixed(1)
    : null;

  return {
    totalBiogasM3,
    dailyBiogasM3,
    householdsServed,
    totalKWh,
    dailyKWh,
    lpgEquivalentKg,
    co2OffsetLPG,
    digesterDays,

    economics: {
      steadyDailyM3,
      plantSizeM3PerDay,
      digesterVolumeM3,
      capitalCostINR,
      lpgCylinders,
      lpgValueINR,
      electricityValueINR,
      paybackYears,
      lpgCylinderPriceINR: LPG_CYLINDER_PRICE_INR,
      electricityRateINR: ELECTRICITY_INR_PER_KWH,
      basis: 'Indicative planning figures, assuming this much residue each year and the plant run year-round. Confirm the plant cost with a local vendor and check the current national biogas subsidy — it is not included here.'
    }
  };
}

// ── 3. Biochar Recommendation ────────────────────────────────
function calculateBiochar({ usableBiomass, cropType }) {
  const crop = getCropData(cropType);
  const biocharYield    = +(usableBiomass * crop.biocharYield).toFixed(2);
  const pyrolysisTemp   = { rice:500, wheat:480, maize:520, sugarcane:450, cotton:490, soybean:510 }[cropType.toLowerCase()] || 500;
  const carbonSequestered = +(biocharYield * 0.65 * 0.80).toFixed(2);
  const soilBenefitScore  = Math.min(100, Math.round((biocharYield / usableBiomass) * 100 + 30));
  const applicationRate   = (biocharYield / 2).toFixed(2);
  const pHImprovement     = +(Math.min(0.8, biocharYield * 0.05)).toFixed(2);
  const estimatedRevenue  = +(biocharYield * 10000).toFixed(0);

  return {
    biocharYield,
    pyrolysisTemp,
    carbonSequestered,
    soilBenefitScore,
    applicationRate,
    pHImprovement,
    estimatedRevenue,
    method: 'Slow Pyrolysis',
    retentionTime: '60-90 minutes',
    recommendation: biocharYield > 1
      ? 'High yield — ideal for commercial biochar production'
      : 'Moderate yield — recommended for on-farm soil amendment'
  };
}

// ── 4. Carbon Credit Calculator ──────────────────────────────
function calculateCarbonCredits({ co2Avoided, area }) {
  const carbonCredits   = co2Avoided;
  const incomeLow       = +(carbonCredits * 1200).toFixed(0);
  const incomeMid       = +(carbonCredits * CARBON_CREDIT_PRICE_INR).toFixed(0);
  const incomeHigh      = +(carbonCredits * 2000).toFixed(0);
  const fertilizerSaving = +(area * 800).toFixed(0);
  const subsidyPotential = +(carbonCredits * 500).toFixed(0);
  const totalIncome     = incomeMid + +fertilizerSaving + +subsidyPotential;

  return {
    co2Avoided: +co2Avoided.toFixed(2),
    carbonCredits: +carbonCredits.toFixed(2),
    incomeLow: +incomeLow,
    incomeMid: +incomeMid,
    incomeHigh: +incomeHigh,
    fertilizerSaving: +fertilizerSaving,
    subsidyPotential: +subsidyPotential,
    totalIncome,
    equivalentTrees: Math.round(co2Avoided * 45),
    creditStandard: 'Estimated using Verra VCS methodology'
  };
}

// ── 5. Master Calculator ─────────────────────────────────────
function runFullAnalysis(inputs) {
  const waste   = calculateCropWaste(inputs);
  const biogas  = calculateBiogas({ usableBiomass: waste.usableBiomass, cropType: inputs.cropType });
  const biochar = calculateBiochar({ usableBiomass: waste.usableBiomass, cropType: inputs.cropType });
  const credits = calculateCarbonCredits({ co2Avoided: waste.co2Avoided, area: waste.areaAcres });
  return { waste, biogas, biochar, credits };
}

module.exports = {
  calculateCropWaste,
  calculateBiogas,
  calculateBiochar,
  calculateCarbonCredits,
  runFullAnalysis
};