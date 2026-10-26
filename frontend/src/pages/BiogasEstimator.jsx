import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CalculatorForm from '../components/CalculatorForm';
import ResultsPanel from '../components/ResultsPanel';
import PageIntro from '../components/PageIntro';
import EmptyState from '../components/EmptyState';
import { IMG } from '../utils/media';

export default function BiogasEstimator() {
  const { saveCalculation } = useAuth();
  const [results, setResults] = useState(null);
  const [inputs, setInputs] = useState(null);

  async function handleResults(r, i) {
    setResults(r);
    setInputs(i);
    await saveCalculation(r, i);
  }

  return (
    <div>
      <PageIntro
        icon="🔥"
        tone="amber"
        title="Biogas Estimator"
        description="Estimate the biogas your usable residue can produce over a 30-day digester cycle — total and daily gas volume, electricity in kWh, LPG equivalent and how many households it could serve."
        meta={<span className="pill pill-info">30-day digester cycle</span>}
      />

      <CalculatorForm
        onResults={handleResults}
        title="Feedstock Details"
        subtitle="Enter the crop and field that will feed the digester"
        submitLabel="Estimate Biogas"
      />

      {results
        ? <ResultsPanel results={results} inputs={inputs} page="biogas" />
        : (
          <div style={{ marginTop: 20 }}>
            <EmptyState
              emoji="🔥"
              title="No estimate yet"
              description="Enter your crop and field details above to see gas volume, electricity output and LPG equivalent."
              image={IMG.biogas}
            />
          </div>
        )}
    </div>
  );
}
