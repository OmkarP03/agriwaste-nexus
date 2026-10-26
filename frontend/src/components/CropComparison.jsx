import React, { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { runLocalCalculation } from '../utils/api';
import { inr } from '../utils/media';

const CROPS = ['rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'soybean'];
const LABEL = c => c.charAt(0).toUpperCase() + c.slice(1);

const METRICS = {
  residueGenerated: { label: 'Residue generated', unit: 't',  get: r => r.waste.residueGenerated },
  usableBiomass:    { label: 'Usable biomass',    unit: 't',  get: r => r.waste.usableBiomass },
  co2Avoided:       { label: 'CO₂ avoided',       unit: 't',  get: r => r.waste.co2Avoided },
  totalIncome:      { label: 'Potential income',  unit: '₹',  get: r => r.credits.totalIncome },
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

/**
 * The same field, run through all six crops.
 *
 * The engine already holds residue and emission factors for every crop, so
 * this costs one extra calculation each and tells a farmer something they
 * can act on at planting time.
 */
export default function CropComparison({ inputs, currentCrop }) {
  const [metric, setMetric] = useState('residueGenerated');

  const rows = useMemo(() => {
    if (!inputs) return [];
    return CROPS.map(cropType => ({
      cropType,
      result: runLocalCalculation({ ...inputs, cropType }),
    }));
  }, [inputs]);

  if (!rows.length) return null;

  const m = METRICS[metric];
  const values = rows.map(r => m.get(r.result));
  const best = Math.max(...values);

  const data = {
    labels: rows.map(r => LABEL(r.cropType)),
    datasets: [{
      label: m.label,
      data: values,
      backgroundColor: rows.map(r =>
        r.cropType === currentCrop ? '#174A27'
          : m.get(r.result) === best ? '#66BB6A'
            : '#b9d6bd'
      ),
      borderRadius: 8,
      maxBarThickness: 56,
    }],
  };

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="card-header">
        <div className="card-icon green" aria-hidden="true">🌱</div>
        <div>
          <div className="card-title">Compare Crops on This Field</div>
          <div className="card-subtitle">
            Same {inputs.area} {inputs.unit} at {inputs.yieldPerAcre} t per {inputs.unit === 'hectares' ? 'hectare' : 'acre'}
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="chip-row" role="group" aria-label="Compare by" style={{ marginBottom: 16 }}>
          {Object.entries(METRICS).map(([key, def]) => (
            <button
              key={key}
              type="button"
              className={`chip ${metric === key ? 'active' : ''}`}
              aria-pressed={metric === key}
              onClick={() => setMetric(key)}
            >
              {def.label}
            </button>
          ))}
        </div>

        <div className="chart-wrapper">
          <Bar data={data} options={barOpts} aria-label={`${m.label} by crop`} />
        </div>

        <div className="table-wrap" style={{ marginTop: 18 }}>
          <table className="data-table">
            <caption className="sr-only">The same field compared across six crops</caption>
            <thead>
              <tr>
                <th scope="col">Crop</th>
                <th scope="col" className="num">Residue</th>
                <th scope="col" className="num">Usable</th>
                <th scope="col" className="num">CO₂ avoided</th>
                <th scope="col" className="num">Biogas</th>
                <th scope="col" className="num">Potential income</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ cropType, result }) => (
                <tr key={cropType} style={cropType === currentCrop
                  ? { background: 'var(--green-50)' } : undefined}>
                  <td>
                    {LABEL(cropType)}
                    {cropType === currentCrop && (
                      <span className="pill pill-available" style={{ marginLeft: 8 }}>Yours</span>
                    )}
                  </td>
                  <td className="num">{result.waste.residueGenerated} t</td>
                  <td className="num">{result.waste.usableBiomass} t</td>
                  <td className="num">{result.waste.co2Avoided} t</td>
                  <td className="num">{Math.round(result.biogas.totalBiogasM3).toLocaleString('en-IN')} m³</td>
                  <td className="num"><strong>{inr(result.credits.totalIncome)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="muted" style={{ fontSize: '0.78rem', marginTop: 12, lineHeight: 1.6 }}>
          This holds yield constant across crops to isolate the effect of residue factors, so treat it
          as a comparison of residue potential rather than a yield forecast. Real yields differ by crop,
          soil and season.
        </p>
      </div>
    </div>
  );
}
