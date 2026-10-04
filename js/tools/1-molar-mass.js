'use strict';
/* เครื่องมือคำนวณ: มวลโมเลกุลและร้อยละโดยมวล */
TOOLS.push({
  id: 'molar',
  html: () => `
<h3>⚖️ มวลโมเลกุลและร้อยละโดยมวล</h3>
<label>สูตรเคมี <input id="mmF" value="CuSO4·5H2O" placeholder="เช่น H2SO4, Ca(OH)2, CuSO4·5H2O"></label>
<label>มวลของสาร (กรัม) <input id="mmG" type="number" value="10" step="any" min="0"></label>
<div id="mmOut" class="out"></div>`,
  run() {
    try {
      const pf = parseFormula($('#mmF').value), M = molarMass(pf.counts), g = +$('#mmG').value || 0;
      if (!Object.keys(pf.counts).length) throw new Error('กรุณาใส่สูตร');
      if (M == null) throw new Error('มีธาตุที่ไม่ทราบมวลอะตอม');
      const n = g / M;
      const rows = Object.entries(pf.counts).map(([el, k]) => `<tr><td>${el} <span class="mut">${E[el].th}</span></td><td>${k}</td><td>${E[el].mass}</td><td>${(E[el].mass * k).toFixed(3)}</td><td>${(E[el].mass * k / M * 100).toFixed(2)}%</td></tr>`).join('');
      const known = DB.find(d => d.key === hillOf(pf.counts) + '|' + pf.charge);
      $('#mmOut').innerHTML = `${known ? `<div class="mut">${known.th}</div>` : ''}<div class="big">${fmt($('#mmF').value)} = <b>${M.toFixed(3)} g/mol</b></div>
        <table class="tbl"><thead><tr><th>ธาตุ</th><th>จำนวน</th><th>มวลอะตอม</th><th>มวลรวม</th><th>% โดยมวล</th></tr></thead><tbody>${rows}</tbody></table>
        <div>${g} g = <b>${sci(n)} mol</b> = ${sci(n * NA)} โมเลกุล (หน่วยสูตร)</div>
        <div class="mut">ถ้าเป็นแก๊สที่ STP (0 °C, 1 atm) มีปริมาตรประมาณ ${sci(n * 22.414)} L</div>`;
    } catch (e) { $('#mmOut').innerHTML = `<span class="err">${e.message}</span>`; }
  },
  init() {
    ['mmF', 'mmG'].forEach(id => $('#' + id).addEventListener('input', () => this.run()));
    this.run();
  },
});
