import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import KpiCard from './KpiCard';
import { inr } from '../utils/media';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const C = {
  green:  '#174A27',
  mid:    '#2C7A3F',
  light:  '#66BB6A',
  gold:   '#F5A623',
  earth:  '#8B5E3C',
  blue:   '#2563eb',
};

const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: '#eef1ee' }, ticks: { color: '#667066', font: { size: 11 } } },
    x: { grid: { display: false }, ticks: { color: '#667066', font: { size: 11 } } },
  },
};

const donutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '58%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { font: { size: 11 }, boxWidth: 10, boxHeight: 10, padding: 12, color: '#3d463d' },
    },
  },
};

function ChartCard({ icon, tone, title, subtitle, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className={`card-icon ${tone}`} aria-hidden="true">{icon}</div>
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="card-body">
        <div className="chart-wrapper">{children}</div>
      </div>
    </div>
  );
}

function Reco({ title = 'Recommendation', children }) {
  return (
    <div className="reco-box">
      <h4>💡 {title}</h4>
      {children}
    </div>
  );
}

export default function ResultsPanel({ results, inputs, page = 'all' }) {
  if (!results) return null;

  const { waste: w, biogas: bg, biochar: bc, credits: cr } = results;
  const cropName = inputs?.cropType
    ? inputs.cropType.charAt(0).toUpperCase() + inputs.cropType.slice(1)
    : 'Crop';

  const recoveryRate = w.residueGenerated ? (w.usableBiomass / w.residueGenerated) * 100 : 0;

  // Older saved calculations predate the sizing figures
  const ec = bg?.economics || null;

  return (
    <div className="results-section">

      <div className="alert alert-success">
        <span aria-hidden="true">✅</span>
        <span>
          Analysis complete for <strong>{cropName} — {inputs?.area} {inputs?.unit}</strong>
          {' '}· ICAR/FAO formula-based results
        </span>
      </div>

      {/* ══════════════ WASTE CALCULATOR ══════════════ */}
      {page === 'waste' && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <KpiCard icon="🌾" tone="green" label="Residue Generated"
              value={w.residueGenerated} unit="tons"
              note={`from ${w.totalYield} t total yield`} />
            <KpiCard icon="🍂" tone="earth" label="Dry Biomass"
              value={w.dryBiomass} unit="tons"
              note="after moisture loss" />
            <KpiCard icon="♻️" tone="green" label="Usable Biomass"
              value={w.usableBiomass} unit="tons"
              note={`${recoveryRate.toFixed(0)}% recovery rate`} noteTone="up" />
            <KpiCard icon="🌍" tone="amber" label="CO₂ Avoided"
              value={w.co2Avoided} unit="tons CO₂"
              note="vs. open-field burning" noteTone="up" />
          </div>

          <div className="results-grid">
            <ChartCard icon="📊" tone="green" title="Biomass Conversion" subtitle="Tons at each stage">
              <Bar
                aria-label="Bar chart comparing residue generated, dry biomass and usable biomass"
                data={{
                  labels: ['Residue Generated', 'Dry Biomass', 'Usable Biomass'],
                  datasets: [{
                    label: 'Tons',
                    data: [w.residueGenerated, w.dryBiomass, w.usableBiomass],
                    backgroundColor: [C.green, C.mid, C.light],
                    borderRadius: 8,
                    maxBarThickness: 74,
                  }],
                }}
                options={barOpts}
              />
            </ChartCard>

            <div className="card">
              <div className="card-header">
                <div className="card-icon earth" aria-hidden="true">📋</div>
                <div>
                  <div className="card-title">Field Summary</div>
                  <div className="card-subtitle">Derived from your inputs</div>
                </div>
              </div>
              <div className="card-body">
                <div className="result-block">
                  <h4>Breakdown</h4>
                  <div className="result-row"><span className="key">Area analysed</span><span className="val">{w.areaAcres} acres</span></div>
                  <div className="result-row"><span className="key">Total crop yield</span><span className="val">{w.totalYield} t</span></div>
                  <div className="result-row"><span className="key">Residue generated</span><span className="val green">{w.residueGenerated} t</span></div>
                  <div className="result-row"><span className="key">Dry biomass</span><span className="val">{w.dryBiomass} t</span></div>
                  <div className="result-row"><span className="key">Usable biomass</span><span className="val green">{w.usableBiomass} t</span></div>
                  <div className="result-row"><span className="key">Energy equivalent</span><span className="val amber">{w.energyEquivalent} GJ</span></div>
                </div>

                <Reco title="What to do with this residue">
                  <p>
                    Roughly <strong>{w.usableBiomass} tons</strong> of {cropName.toLowerCase()} residue is
                    recoverable from this field. Routing it to biogas or biochar instead of burning avoids
                    about <strong>{w.co2Avoided} tons of CO₂</strong>.
                  </p>
                  <ul>
                    <li>Bale and store the residue under cover to keep moisture low.</li>
                    <li>Check the Plant Locator for facilities that accept {cropName.toLowerCase()} residue.</li>
                    <li>List any surplus on the Marketplace rather than leaving it in the field.</li>
                  </ul>
                </Reco>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════ BIOGAS ESTIMATOR ══════════════ */}
      {page === 'biogas' && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <KpiCard icon="🔥" tone="amber" label="Total Biogas"
              value={Number(bg.totalBiogasM3).toLocaleString('en-IN')} unit="m³"
              note="over a 30-day digester cycle" />
            <KpiCard icon="📅" tone="green" label="Daily Output"
              value={bg.dailyBiogasM3} unit="m³/day" />
            <KpiCard icon="⚡" tone="amber" label="Electricity"
              value={Number(bg.totalKWh).toLocaleString('en-IN')} unit="kWh"
              note={`${bg.dailyKWh} kWh per day`} />
            <KpiCard icon="🛢️" tone="earth" label="LPG Equivalent"
              value={bg.lpgEquivalentKg} unit="kg" />
            <KpiCard icon="🏠" tone="green" label="Households Served"
              value={bg.householdsServed} unit="homes/day"
              note={`${bg.co2OffsetLPG} t CO₂ offset vs LPG`} noteTone="up" />
          </div>

          <div className="results-grid">
            <ChartCard icon="📊" tone="amber" title="Biogas Output" subtitle="Energy carriers from this residue">
              <Bar
                aria-label="Bar chart of total biogas in cubic metres, electricity in kilowatt hours and LPG equivalent in kilograms"
                data={{
                  labels: ['Biogas (m³)', 'Electricity (kWh)', 'LPG equiv. (kg)'],
                  datasets: [{
                    label: 'Output',
                    data: [bg.totalBiogasM3, bg.totalKWh, bg.lpgEquivalentKg],
                    backgroundColor: [C.mid, C.gold, C.earth],
                    borderRadius: 8,
                    maxBarThickness: 74,
                  }],
                }}
                options={barOpts}
              />
            </ChartCard>

            <div className="card">
              <div className="card-header">
                <div className="card-icon green" aria-hidden="true">🔥</div>
                <div>
                  <div className="card-title">30-Day Digester</div>
                  <div className="card-subtitle">Anaerobic digestion estimate</div>
                </div>
              </div>
              <div className="card-body">
                <div className="result-block">
                  <h4>Output</h4>
                  <div className="result-row"><span className="key">Total Biogas</span><span className="val green">{bg.totalBiogasM3} m³</span></div>
                  <div className="result-row"><span className="key">Daily Output</span><span className="val">{bg.dailyBiogasM3} m³/day</span></div>
                  <div className="result-row"><span className="key">Electricity</span><span className="val green">{bg.totalKWh} kWh</span></div>
                  <div className="result-row"><span className="key">Daily Electricity</span><span className="val">{bg.dailyKWh} kWh/day</span></div>
                  <div className="result-row"><span className="key">LPG Equivalent</span><span className="val">{bg.lpgEquivalentKg} kg</span></div>
                  <div className="result-row"><span className="key">Households/day</span><span className="val amber">{bg.householdsServed} homes</span></div>
                  <div className="result-row"><span className="key">CO₂ Offset (LPG)</span><span className="val">{bg.co2OffsetLPG} t</span></div>
                </div>

                <Reco title="Running it well">
                  <ul>
                    <li>Keep feedstock chopped to 2–5 cm for faster digestion.</li>
                    <li>Maintain the digester between 30–40°C for steady gas output.</li>
                    <li>Use the digestate as a nutrient-rich field amendment.</li>
                    <li>Store the residue dry and feed a little each day rather than all at once.</li>
                  </ul>
                </Reco>
              </div>
            </div>
          </div>

          {/* ── Sizing & payback ── */}
          {ec && (
            <div className="card" style={{ marginTop: 18 }}>
              <div className="card-header">
                <div className="card-icon amber" aria-hidden="true">🏗️</div>
                <div>
                  <div className="card-title">Digester Sizing &amp; Payback</div>
                  <div className="card-subtitle">
                    Sized for year-round running, not a one-month batch
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="kpi-grid" style={{ marginBottom: 18 }}>
                  <KpiCard icon="⚙️" tone="green" label="Plant Size"
                    value={ec.plantSizeM3PerDay} unit="m³/day"
                    note={`feeding ~${ec.steadyDailyM3} m³/day year-round`} />
                  <KpiCard icon="🛢️" tone="earth" label="Digester Volume"
                    value={ec.digesterVolumeM3} unit="m³" />
                  <KpiCard icon="💰" tone="amber" label="Installed Cost"
                    value={inr(ec.capitalCostINR)} note="before any subsidy" />
                  <KpiCard icon="📈" tone="green" label="Payback"
                    value={ec.paybackYears ?? '—'} unit="years"
                    note="against bottled cooking gas" noteTone="up" />
                </div>

                <div className="results-grid">
                  <div className="result-block">
                    <h4>What the gas replaces each year</h4>
                    <div className="result-row">
                      <span className="key">Cooking gas</span>
                      <span className="val green">
                        {ec.lpgCylinders} cylinders · {inr(ec.lpgValueINR)}
                      </span>
                    </div>
                    <div className="result-row">
                      <span className="key">…or electricity</span>
                      <span className="val">{inr(ec.electricityValueINR)}</span>
                    </div>
                    <div className="result-row">
                      <span className="key">Cylinder price assumed</span>
                      <span className="val">{inr(ec.lpgCylinderPriceINR)}</span>
                    </div>
                    <div className="result-row">
                      <span className="key">Electricity rate assumed</span>
                      <span className="val">{inr(ec.electricityRateINR)} / kWh</span>
                    </div>
                  </div>

                  <div>
                    <div className="total-box" style={{ marginTop: 0 }}>
                      <div className="tb-label">Cost recovered in</div>
                      <div className="tb-value">
                        {ec.paybackYears ?? '—'} <span style={{ fontSize: '1rem' }}>years</span>
                      </div>
                    </div>
                    <p className="muted" style={{ fontSize: '0.78rem', marginTop: 12, lineHeight: 1.6 }}>
                      {ec.basis}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════ BIOCHAR ADVISOR ══════════════ */}
      {page === 'biochar' && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <KpiCard icon="⚗️" tone="earth" label="Biochar Yield"
              value={bc.biocharYield} unit="tons" note={bc.method} />
            <KpiCard icon="🌡️" tone="amber" label="Pyrolysis Temp"
              value={bc.pyrolysisTemp} unit="°C" note={`retention ${bc.retentionTime}`} />
            <KpiCard icon="🌍" tone="green" label="Carbon Sequestered"
              value={bc.carbonSequestered} unit="tons" note="locked into stable carbon" noteTone="up" />
            <KpiCard icon="🌱" tone="green" label="Soil Benefit Score"
              value={bc.soilBenefitScore} unit="/ 100"
              note={`pH improvement ≈ +${bc.pHImprovement}`} />
            <KpiCard icon="💰" tone="amber" label="Estimated Revenue"
              value={inr(bc.estimatedRevenue)} note="at prevailing biochar rates" noteTone="gold" />
          </div>

          <div className="results-grid">
            <ChartCard icon="📊" tone="earth" title="Biochar Analysis" subtitle="Yield, carbon and soil score">
              <Bar
                aria-label="Bar chart of biochar yield, carbon stored and soil benefit score"
                data={{
                  labels: ['Biochar Yield (t)', 'Carbon Stored (t)', 'Soil Score'],
                  datasets: [{
                    label: 'Value',
                    data: [bc.biocharYield, bc.carbonSequestered, bc.soilBenefitScore],
                    backgroundColor: [C.earth, C.green, C.gold],
                    borderRadius: 8,
                    maxBarThickness: 74,
                  }],
                }}
                options={barOpts}
              />
            </ChartCard>

            <div className="card">
              <div className="card-header">
                <div className="card-icon earth" aria-hidden="true">⚗️</div>
                <div>
                  <div className="card-title">Pyrolysis Parameters</div>
                  <div className="card-subtitle">{bc.method} — {bc.pyrolysisTemp}°C</div>
                </div>
              </div>
              <div className="card-body">
                <div className="result-block">
                  <h4>Process</h4>
                  <div className="result-row"><span className="key">Biochar Yield</span><span className="val green">{bc.biocharYield} tons</span></div>
                  <div className="result-row"><span className="key">Temperature</span><span className="val">{bc.pyrolysisTemp}°C</span></div>
                  <div className="result-row"><span className="key">Retention Time</span><span className="val">{bc.retentionTime}</span></div>
                  <div className="result-row"><span className="key">Carbon Sequestered</span><span className="val green">{bc.carbonSequestered} t</span></div>
                  <div className="result-row"><span className="key">Soil Benefit Score</span><span className="val amber">{bc.soilBenefitScore}/100</span></div>
                  <div className="result-row"><span className="key">Application Rate</span><span className="val">{bc.applicationRate} t/acre</span></div>
                  <div className="result-row"><span className="key">Est. Revenue</span><span className="val green">{inr(bc.estimatedRevenue)}</span></div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 5 }}>
                    <span className="muted">Soil benefit score</span>
                    <strong>{bc.soilBenefitScore}/100</strong>
                  </div>
                  <div className="meter-track" role="progressbar"
                    aria-valuenow={bc.soilBenefitScore} aria-valuemin={0} aria-valuemax={100}
                    aria-label="Soil benefit score">
                    <div className="meter-fill" style={{ width: `${bc.soilBenefitScore}%` }} />
                  </div>
                </div>

                <Reco>
                  <p>{bc.recommendation}</p>
                  <ul>
                    <li>Apply around <strong>{bc.applicationRate} t/acre</strong>, mixed into the top soil layer.</li>
                    <li>Charge the biochar with compost or slurry before applying.</li>
                    <li>Slow pyrolysis at {bc.pyrolysisTemp}°C gives the most stable carbon fraction.</li>
                  </ul>
                </Reco>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════ CARBON CREDITS ══════════════ */}
      {page === 'carbon' && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <KpiCard icon="🌍" tone="green" label="CO₂ Avoided"
              value={cr.co2Avoided} unit="tons" />
            <KpiCard icon="🏅" tone="green" label="Carbon Credits"
              value={cr.carbonCredits} unit="credits" note={cr.creditStandard} />
            <KpiCard icon="💰" tone="amber" label="Credit Income"
              value={inr(cr.incomeMid)}
              note={`${inr(cr.incomeLow)} – ${inr(cr.incomeHigh)} range`} noteTone="gold" />
            <KpiCard icon="🌳" tone="green" label="Equivalent Trees"
              value={Number(cr.equivalentTrees).toLocaleString('en-IN')} unit="trees" noteTone="up" />
          </div>

          <div className="results-grid">
            <ChartCard icon="💹" tone="amber" title="Income Breakdown" subtitle="Where the value comes from (₹)">
              <Doughnut
                aria-label="Doughnut chart of carbon income, fertilizer saving and subsidy potential"
                data={{
                  labels: ['Carbon Income', 'Fertilizer Saving', 'Subsidy Potential'],
                  datasets: [{
                    data: [cr.incomeMid, cr.fertilizerSaving, cr.subsidyPotential],
                    backgroundColor: [C.mid, C.blue, C.gold],
                    borderWidth: 0,
                  }],
                }}
                options={donutOpts}
              />
            </ChartCard>

            <div className="card">
              <div className="card-header">
                <div className="card-icon green" aria-hidden="true">🌍</div>
                <div>
                  <div className="card-title">Carbon Credits</div>
                  <div className="card-subtitle">{cr.creditStandard}</div>
                </div>
              </div>
              <div className="card-body">
                <div className="result-block">
                  <h4>Estimate</h4>
                  <div className="result-row"><span className="key">CO₂ Avoided</span><span className="val green">{cr.co2Avoided} t</span></div>
                  <div className="result-row"><span className="key">Carbon Credits</span><span className="val green">{cr.carbonCredits}</span></div>
                  <div className="result-row"><span className="key">Credit Income</span><span className="val green">{inr(cr.incomeMid)}</span></div>
                  <div className="result-row"><span className="key">Income Range</span><span className="val">{inr(cr.incomeLow)} – {inr(cr.incomeHigh)}</span></div>
                  <div className="result-row"><span className="key">Fertilizer Saving</span><span className="val">{inr(cr.fertilizerSaving)}</span></div>
                  <div className="result-row"><span className="key">Subsidy Potential</span><span className="val">{inr(cr.subsidyPotential)}</span></div>
                  <div className="result-row">
                    <span className="key">Equivalent Trees</span>
                    <span className="val amber"><span aria-hidden="true">🌳</span> {Number(cr.equivalentTrees).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="total-box">
                  <div className="tb-label">Total Potential Income</div>
                  <div className="tb-value">{inr(cr.totalIncome)}</div>
                </div>

                <Reco title="Next steps">
                  <p>
                    These figures are an estimate produced by the AgriWaste Nexus calculator from your
                    inputs. Actual credit income depends on the buyer, the verification route you choose
                    and the market price at the time of sale.
                  </p>
                  <ul>
                    <li>Keep records of residue quantity, dates and where it was processed.</li>
                    <li>Photograph bales and delivery receipts — buyers ask for evidence.</li>
                    <li>Aggregate with nearby farms; larger volumes attract better rates.</li>
                  </ul>
                </Reco>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════ COMBINED (legacy 'all') ══════════════ */}
      {page === 'all' && (
        <div className="results-grid">
          <ChartCard icon="📊" tone="green" title="Biomass Breakdown" subtitle="Tons">
            <Bar
              data={{
                labels: ['Residue Generated', 'Dry Biomass', 'Usable Biomass'],
                datasets: [{
                  label: 'Tons',
                  data: [w.residueGenerated, w.dryBiomass, w.usableBiomass],
                  backgroundColor: [C.green, C.mid, C.light],
                  borderRadius: 8,
                  maxBarThickness: 74,
                }],
              }}
              options={barOpts}
            />
          </ChartCard>
          <ChartCard icon="💹" tone="amber" title="Revenue Sources" subtitle="₹ by source">
            <Doughnut
              data={{
                labels: ['Electricity Rev', 'Biochar Rev', 'Carbon Credits', 'Fertilizer Saving'],
                datasets: [{
                  data: [Math.round(bg.totalKWh * 8), bc.estimatedRevenue, cr.incomeMid, cr.fertilizerSaving],
                  backgroundColor: [C.mid, C.earth, C.gold, C.blue],
                  borderWidth: 0,
                }],
              }}
              options={donutOpts}
            />
          </ChartCard>
        </div>
      )}

    </div>
  );
}
