import React from 'react';

export default function WasteResults({ results }) {

  if (!results) return null;

  return (
    <div>
      <h2>Waste Results</h2>

      <p>
        Residue Generated:
        {results.waste?.residueGenerated}
      </p>

      <p>
        Usable Biomass:
        {results.waste?.usableBiomass}
      </p>

      <p>
        CO₂ Avoided:
        {results.waste?.co2Avoided}
      </p>

    </div>
  );

}