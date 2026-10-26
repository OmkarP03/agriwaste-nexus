import jsPDF from 'jspdf';

const INR = n => 'Rs ' + Number(n || 0).toLocaleString('en-IN');

/**
 * A one-page season summary the farmer can take to a bank, a co-op or a
 * buyer. Built with the jsPDF already bundled for the ID card.
 */
export function buildSeasonReport({ user, calcs }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 16;
  let y = 0;

  const sum = fn => calcs.reduce((a, c) => a + (Number(fn(c)) || 0), 0);

  const totals = {
    residue: sum(c => c.result?.waste?.residueGenerated),
    usable:  sum(c => c.result?.waste?.usableBiomass),
    co2:     sum(c => c.result?.waste?.co2Avoided),
    kwh:     sum(c => c.result?.biogas?.totalKWh),
    biochar: sum(c => c.result?.biochar?.biocharYield),
    credits: sum(c => c.result?.credits?.carbonCredits),
    income:  sum(c => c.result?.credits?.totalIncome),
    trees:   sum(c => c.result?.credits?.equivalentTrees),
  };

  // ── Header band ──
  doc.setFillColor(23, 74, 39);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold').setFontSize(16);
  doc.text('AgriWaste Nexus', M, 13);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  doc.text('Farm sustainability summary', M, 19.5);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), W - M, 13, { align: 'right' });

  y = 42;

  // ── Farmer ──
  doc.setTextColor(23, 33, 23);
  doc.setFont('helvetica', 'bold').setFontSize(12);
  doc.text(user?.name || 'Farmer', M, y);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  doc.setTextColor(102, 112, 102);
  const where = [user?.village, user?.district].filter(Boolean).join(', ');
  doc.text([where, user?.cropType ? `Primary crop: ${user.cropType}` : '', user?.landArea ? `${user.landArea} acres` : '']
    .filter(Boolean).join('   |   '), M, y + 5.5);

  y += 16;

  // ── Totals ──
  const rows = [
    ['Analyses recorded',      String(calcs.length)],
    ['Crop residue generated', `${totals.residue.toFixed(2)} tonnes`],
    ['Usable biomass',         `${totals.usable.toFixed(2)} tonnes`],
    ['CO2 avoided',            `${totals.co2.toFixed(2)} tonnes`],
    ['Equivalent trees',       Math.round(totals.trees).toLocaleString('en-IN')],
    ['Biogas energy potential',`${Math.round(totals.kwh).toLocaleString('en-IN')} kWh`],
    ['Biochar potential',      `${totals.biochar.toFixed(2)} tonnes`],
    ['Carbon credits',         totals.credits.toFixed(2)],
    ['Estimated total value',  INR(Math.round(totals.income))],
  ];

  doc.setDrawColor(226, 231, 224);
  doc.setFillColor(243, 250, 244);
  doc.rect(M, y, W - M * 2, 9, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(9);
  doc.setTextColor(23, 74, 39);
  doc.text('SEASON TOTALS', M + 4, y + 6);
  y += 13;

  doc.setFontSize(10);
  rows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal').setTextColor(102, 112, 102);
    doc.text(k, M + 4, y);
    doc.setFont('helvetica', 'bold').setTextColor(23, 33, 23);
    doc.text(v, W - M - 4, y, { align: 'right' });
    doc.setDrawColor(238, 241, 238);
    doc.line(M + 4, y + 2.5, W - M - 4, y + 2.5);
    y += 8;
  });

  y += 6;

  // ── Per-field breakdown ──
  if (calcs.length) {
    doc.setFillColor(243, 250, 244);
    doc.rect(M, y, W - M * 2, 9, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(23, 74, 39);
    doc.text('BY FIELD', M + 4, y + 6);
    y += 13;

    doc.setFontSize(8).setTextColor(102, 112, 102).setFont('helvetica', 'bold');
    doc.text('Crop / area', M + 4, y);
    doc.text('Residue', M + 78, y, { align: 'right' });
    doc.text('CO2', M + 104, y, { align: 'right' });
    doc.text('Value', M + 140, y, { align: 'right' });
    doc.text('Date', W - M - 4, y, { align: 'right' });
    y += 5;

    doc.setFont('helvetica', 'normal').setTextColor(23, 33, 23);
    calcs.slice(0, 18).forEach(c => {
      if (y > 262) return;
      const crop = c.inputs?.cropType
        ? c.inputs.cropType.charAt(0).toUpperCase() + c.inputs.cropType.slice(1)
        : '-';
      doc.text(`${crop}, ${c.inputs?.area} ${c.inputs?.unit}`, M + 4, y);
      doc.text(`${c.result?.waste?.residueGenerated ?? '-'} t`, M + 78, y, { align: 'right' });
      doc.text(`${c.result?.waste?.co2Avoided ?? '-'} t`, M + 104, y, { align: 'right' });
      doc.text(INR(c.result?.credits?.totalIncome), M + 140, y, { align: 'right' });
      doc.text(c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '-', W - M - 4, y, { align: 'right' });
      y += 6;
    });
  }

  // ── Footer ──
  doc.setDrawColor(226, 231, 224);
  doc.line(M, 276, W - M, 276);
  doc.setFontSize(7.5).setTextColor(102, 112, 102).setFont('helvetica', 'normal');
  doc.text(
    'Figures are estimates produced by the AgriWaste Nexus calculator from inputs entered by the farmer,',
    M, 281
  );
  doc.text(
    'using ICAR and FAO conversion factors. This is not a certified carbon statement.',
    M, 285
  );

  return doc;
}

export function downloadSeasonReport(args) {
  const doc = buildSeasonReport(args);
  const who = (args.user?.name || 'farm').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`agriwaste-season-report-${who}.pdf`);
}
