import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CalculatorForm from '../components/CalculatorForm';
import ResultsPanel from '../components/ResultsPanel';
import PageIntro from '../components/PageIntro';
import EmptyState from '../components/EmptyState';
import { IMG } from '../utils/media';

export default function BiocharAdvisor() {
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
        icon="⚗️"
        tone="earth"
        title="Biochar Advisor"
        description="Get pyrolysis parameters for your residue — biochar yield, recommended temperature and retention time, carbon sequestered, soil benefit score and estimated revenue."
        meta={<span className="pill pill-info">Slow pyrolysis</span>}
      />

      <CalculatorForm
        onResults={handleResults}
        title="Feedstock Details"
        subtitle="Enter the crop and field to be pyrolysed"
        submitLabel="Get Recommendation"
      />

      {results
        ? <ResultsPanel results={results} inputs={inputs} page="biochar" />
        : (
          <div style={{ marginTop: 20 }}>
            <EmptyState
              emoji="⚗️"
              title="No recommendation yet"
              description="Enter your crop and field details above to see yield, pyrolysis settings and soil benefit."
              image={IMG.biochar}
            />
          </div>
        )}
    </div>
  );
}
