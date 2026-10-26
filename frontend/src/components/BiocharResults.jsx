import React from 'react';

export default function BiocharResults({ results }) {

  const { biochar:bc } = results;

  return (

    <div className="card">

      <div className="card-header">
        <div className="card-icon earth">⚗️</div>
        <div>
          <div className="card-title">
            Biochar Recommendation
          </div>
        </div>
      </div>

      <div className="card-body">

        <div className="result-row">
          <span>Biochar Yield</span>
          <strong>{bc.biocharYield} tons</strong>
        </div>

        <div className="result-row">
          <span>Temperature</span>
          <strong>{bc.pyrolysisTemp}°C</strong>
        </div>

        <div className="result-row">
          <span>Carbon Sequestered</span>
          <strong>{bc.carbonSequestered}</strong>
        </div>

        <div className="result-row">
          <span>Revenue</span>
          <strong>₹{bc.estimatedRevenue}</strong>
        </div>

      </div>

    </div>

  );

}