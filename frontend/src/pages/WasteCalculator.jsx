import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CalculatorForm from '../components/CalculatorForm';
import ResultsPanel from '../components/ResultsPanel';
import PageIntro from '../components/PageIntro';
import EmptyState from '../components/EmptyState';
import CropComparison from '../components/CropComparison';
import { IMG } from '../utils/media';

export default function WasteCalculator() {
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
        icon="🌾"
        tone="green"
        title="Waste Calculator"
        description="Enter your crop, land area and yield to estimate how much residue your field produces, how much of it is usable biomass, and how much CO₂ you avoid by recovering it instead of burning it."
        meta={<span className="pill pill-info">Results are saved to your profile</span>}
      />

      <CalculatorForm onResults={handleResults} submitLabel="Calculate Waste" />

      {results
        ? (
          <>
            <ResultsPanel results={results} inputs={inputs} page="waste" />
            <CropComparison inputs={inputs} currentCrop={inputs?.cropType} />
          </>
        )
        : (
          <div style={{ marginTop: 20 }}>
            <EmptyState
              emoji="🌾"
              title="No results yet"
              description="Fill in the form above — or press Load Sample Data — to see your residue, biomass and CO₂ figures."
              image={IMG.field}
            />
          </div>
        )}
    </div>
  );
}
