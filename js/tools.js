'use strict';
/* ================= TOOLS PAGE ================= */
const NA = 6.02214076e23, R_GAS = 0.082057; // L·atm/(mol·K)
const sci = v => {
  if (!isFinite(v)) return '–';
  if (v !== 0 && (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3)) { const p = Math.floor(Math.log10(Math.abs(v))); return `${(v / 10 ** p).toFixed(3)} × 10<sup>${p}</sup>`; }
  return (+v.toPrecision(6)).toLocaleString('en-US', { maximumFractionDigits: 6 });
};
// each calculator lives in js/tools/N-*.js and pushes { id, html(), run(), init() } here (file order = page order)
const TOOLS = [];
function renderTools() {
  $('#page-tools').innerHTML = `<div class="doc-head"><h2>เครื่องมือคำนวณทางเคมี</h2></div>
  <div class="tools">${TOOLS.map(t => `<section class="tool" id="tool-${t.id}">${t.html()}</section>`).join('')}</div>`;
  TOOLS.forEach(t => t.init());
}
