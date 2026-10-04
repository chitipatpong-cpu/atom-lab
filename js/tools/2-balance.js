'use strict';
/* เครื่องมือคำนวณ: ดุลสมการเคมีอัตโนมัติ (ใช้ balanceEquation ใน js/formula.js) */
const BALANCE_EXAMPLES = ['Fe + O2 -> Fe2O3', 'Al + HCl -> AlCl3 + H2', 'C6H12O6 + O2 -> CO2 + H2O', 'KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2', 'Cu + HNO3 -> Cu(NO3)2 + NO + H2O', 'MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O'];
TOOLS.push({
  id: 'balance',
  html: () => `
<h3>🧮 ดุลสมการเคมีอัตโนมัติ</h3>
<label>สมการ (ไม่ต้องใส่เลขสัมประสิทธิ์) <input id="balIn" value="C3H8 + O2 -> CO2 + H2O"></label>
<div class="mut small">ใช้ -> คั่นสองข้าง · ไอออนใส่ประจุหลัง ^ เช่น Fe^3+, OH^-, SO4^2-</div>
<div class="examples" id="balEx">${BALANCE_EXAMPLES.map(x => `<button class="chipbtn" data-eq="${x}">${x.replace(/\^/g, '')}</button>`).join('')}</div>
<div id="balOut" class="out"></div>`,
  run() {
    try {
      const p = balanceEquation($('#balIn').value);
      const sorted = s => s.map(t => t.f).sort().join('+');
      const match = REACTIONS.find(r => sorted(r.p.left) === sorted(p.left) && sorted(r.p.right) === sorted(p.right));
      $('#balOut').innerHTML = `<div class="rx-eq big">${eqHTML(p, spLink)}</div>
        <div class="ok">✔ ดุลแล้ว — จำนวนอะตอมทุกธาตุ${p.left.concat(p.right).some(t => parseFormula(t.f).charge) ? 'และประจุรวม' : ''}เท่ากันทั้งสองข้าง</div>
        ${match ? `<div class="note">📌 ${match.th} — ${REACTION_TYPES[match.type][0]}${match.cond ? ' · ภาวะ: ' + match.cond : ''}</div>` : ''}`;
    } catch (e) { $('#balOut').innerHTML = `<span class="err">${e.message}</span>`; }
  },
  init() {
    $('#balEx').addEventListener('click', e => { const b = e.target.closest('[data-eq]'); if (b) { $('#balIn').value = b.dataset.eq; this.run(); } });
    $('#balIn').addEventListener('input', () => this.run());
    this.run();
  },
});
