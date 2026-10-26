// API calls with local fallback when backend is offline

const CROP_DATA_LOCAL = {
  rice:      { residueFactor:1.35, moisture:0.12, biogasRate:0.28, biocharYield:0.30, ef:1.47 },
  wheat:     { residueFactor:1.20, moisture:0.10, biogasRate:0.25, biocharYield:0.28, ef:1.35 },
  maize:     { residueFactor:1.00, moisture:0.13, biogasRate:0.32, biocharYield:0.32, ef:1.20 },
  sugarcane: { residueFactor:0.30, moisture:0.50, biogasRate:0.20, biocharYield:0.22, ef:0.95 },
  cotton:    { residueFactor:3.00, moisture:0.08, biogasRate:0.22, biocharYield:0.26, ef:1.10 },
  soybean:   { residueFactor:1.50, moisture:0.11, biogasRate:0.26, biocharYield:0.29, ef:1.25 },
};

// Mirrors backend/calculationEngine.js — keep the two in step.
const PLANT_SIZES_M3_DAY  = [1, 2, 3, 4, 6, 8, 10, 15, 20, 25, 35, 50];
const GAS_PER_M3_DIGESTER = 0.35;
const COST_PER_M3_DAY_INR = [
  { upTo: 6,        rate: 32000 },
  { upTo: 20,       rate: 26000 },
  { upTo: Infinity, rate: 20000 },
];
const LPG_CYLINDER_KG         = 14.2;
const LPG_CYLINDER_PRICE_INR  = 1100;
const ELECTRICITY_INR_PER_KWH = 8;
const FEED_DAYS_PER_YEAR      = 365;

function digesterEconomics({ totalBiogas, lpgKg, totalKWh }) {
  const steadyDailyM3 = +(totalBiogas / FEED_DAYS_PER_YEAR).toFixed(2);
  const plantSizeM3PerDay = PLANT_SIZES_M3_DAY.find(x => x >= steadyDailyM3)
    || PLANT_SIZES_M3_DAY[PLANT_SIZES_M3_DAY.length - 1];
  const rate = COST_PER_M3_DAY_INR.find(b => plantSizeM3PerDay <= b.upTo).rate;
  const capitalCostINR = Math.round(plantSizeM3PerDay * rate);
  const lpgCylinders   = +(lpgKg / LPG_CYLINDER_KG).toFixed(1);
  const lpgValueINR    = Math.round(lpgCylinders * LPG_CYLINDER_PRICE_INR);

  return {
    steadyDailyM3,
    plantSizeM3PerDay,
    digesterVolumeM3: +(plantSizeM3PerDay / GAS_PER_M3_DIGESTER).toFixed(1),
    capitalCostINR,
    lpgCylinders,
    lpgValueINR,
    electricityValueINR: Math.round(totalKWh * ELECTRICITY_INR_PER_KWH),
    paybackYears: lpgValueINR > 0 ? +(capitalCostINR / lpgValueINR).toFixed(1) : null,
    lpgCylinderPriceINR: LPG_CYLINDER_PRICE_INR,
    electricityRateINR: ELECTRICITY_INR_PER_KWH,
    basis: 'Indicative planning figures, assuming this much residue each year and the plant run year-round. Confirm the plant cost with a local vendor and check the current national biogas subsidy — it is not included here.',
  };
}

export function runLocalCalculation({ cropType, area, yieldPerAcre, unit = 'acres' }) {
  const c = CROP_DATA_LOCAL[cropType] || CROP_DATA_LOCAL.rice;
  const areaAcres  = unit === 'hectares' ? area * 2.471 : +area;
  const totalYield = areaAcres * +yieldPerAcre;
  const residue    = +(totalYield  * c.residueFactor).toFixed(2);
  const dry        = +(residue     * (1 - c.moisture)).toFixed(2);
  const usable     = +(dry         * 0.80).toFixed(2);
  const co2Avoided = +(residue     * c.ef).toFixed(2);

  const totalBiogas = +(usable * c.biogasRate * 1000).toFixed(1);
  const dailyBiogas = +(totalBiogas / 30).toFixed(2);
  const totalKWh    = +(totalBiogas * 6).toFixed(1);
  const lpgKg       = +(totalBiogas * 0.45).toFixed(1);

  const bcy      = +(usable * c.biocharYield).toFixed(2);
  const carbonSeq = +(bcy * 0.65 * 0.80).toFixed(2);
  const soilScore = Math.min(100, Math.round((bcy / usable) * 100 + 30));
  const bcRev    = +(bcy * 10000).toFixed(0);

  const credits    = co2Avoided;
  const incomeMid  = +(credits * 1500).toFixed(0);
  const fertSaving = +(areaAcres * 800).toFixed(0);
  const subsidy    = +(credits * 500).toFixed(0);
  const totalIncome = +incomeMid + +fertSaving + +subsidy;

  return {
    waste:   { totalYield:+totalYield.toFixed(2), residueGenerated:residue, dryBiomass:dry, usableBiomass:usable, co2Avoided, energyEquivalent:+(dry*15).toFixed(1), areaAcres:+areaAcres.toFixed(2) },
    biogas:  { totalBiogasM3:totalBiogas, dailyBiogasM3:dailyBiogas, householdsServed:Math.floor(dailyBiogas/2), totalKWh, dailyKWh:+(dailyBiogas*6).toFixed(2), lpgEquivalentKg:lpgKg, co2OffsetLPG:+(lpgKg*2.98/1000).toFixed(2), digesterDays:30,
               economics: digesterEconomics({ totalBiogas, lpgKg, totalKWh }) },
    biochar: { biocharYield:bcy, pyrolysisTemp:500, carbonSequestered:carbonSeq, soilBenefitScore:soilScore, applicationRate:(bcy/2).toFixed(2), pHImprovement:0.4, estimatedRevenue:+bcRev, method:'Slow Pyrolysis', retentionTime:'60-90 minutes', recommendation: bcy>1?'High yield — ideal for commercial production':'Moderate yield — on-farm soil amendment' },
    credits: { co2Avoided, carbonCredits:+credits.toFixed(2), incomeLow:+(credits*1200).toFixed(0), incomeMid:+incomeMid, incomeHigh:+(credits*2000).toFixed(0), fertilizerSaving:+fertSaving, subsidyPotential:+subsidy, totalIncome, equivalentTrees:Math.round(co2Avoided*45), creditStandard:'Estimated using Verra VCS methodology' }
  };
}

export const api = {
  runFullAnalysis: async (data) => {
    const res = await fetch('/api/calculator/full', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    if (!res.ok) throw new Error('API error');
    return res.json();
  },
  getListings: () => fetch('/api/marketplace/listings').then(r => r.json()),
  postListing: (data) => fetch('/api/marketplace/listings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r=>r.json()),
  getBuyers:   () => fetch('/api/marketplace/buyers').then(r => r.json()),
  getPlants:   (lat, lng) => fetch(`/api/locator/plants?lat=${lat}&lng=${lng}`).then(r => r.json()),
};