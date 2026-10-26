import React from 'react';

export default function CarbonResults({ results }) {

  const { credits:cr } = results;

  return (

    <div className="card">

      <div className="card-header">
        <div className="card-icon amber">🌍</div>
        <div>
          <div className="card-title">
            Carbon Credits
          </div>
        </div>
      </div>

      <div className="card-body">

        <div className="result-row">
          <span>Carbon Credits</span>
          <strong>{cr.carbonCredits}</strong>
        </div>

        <div className="result-row">
          <span>Credit Income</span>
          <strong>₹{cr.incomeMid}</strong>
        </div>

        <div className="result-row">
          <span>Subsidy</span>
          <strong>₹{cr.subsidyPotential}</strong>
        </div>

        <div className="result-row">
          <span>Equivalent Trees</span>
          <strong>{cr.equivalentTrees}</strong>
        </div>

        <div className="result-row">
          <span>Total Income</span>
          <strong>₹{cr.totalIncome}</strong>
        </div>

      </div>

    </div>

  );

}