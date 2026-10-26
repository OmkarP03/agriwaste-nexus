import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CalculatorForm from '../components/CalculatorForm';
import ResultsPanel from '../components/ResultsPanel';
import PageIntro from '../components/PageIntro';
import EmptyState from '../components/EmptyState';
import { IMG } from '../utils/media';
import { CreditPoolSection } from '../components/CreditPoolCard';

export default function CarbonCredits() {
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
        icon="🌍"
        tone="green"
        title="Carbon Credits"
        description="See the CO₂ you avoid by recovering residue instead of burning it, the carbon credits that represents, the income range at current rates, fertilizer saving, subsidy potential and tree equivalent."
        meta={<span className="pill pill-info">Estimate, not a certification</span>}
      />

      <CalculatorForm
        onResults={handleResults}
        title="Field Details"
        subtitle="Enter the crop and area you are calculating credits for"
        submitLabel="Calculate Credits"
      />

      {results
        ? <ResultsPanel results={results} inputs={inputs} page="carbon" />
        : (
          <div style={{ marginTop: 20 }}>
            <EmptyState
              emoji="🌍"
              title="No calculation yet"
              description="Enter your crop and area above to see CO₂ avoided, carbon credits and potential income."
              image={IMG.carbon}
            />
          </div>
        )}

      {/* Pooling is what makes a smallholder's dozen credits sellable */}
      <div style={{ marginTop: 28 }}>
        <CreditPoolSection />
      </div>
    </div>
  );
}
