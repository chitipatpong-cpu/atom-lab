'use strict';
/* เครื่องมือคำนวณ: กฎแก๊สอุดมคติ PV = nRT (R = 0.082057 L·atm/(mol·K) อยู่ใน js/tools.js) */
TOOLS.push({
  id: 'gas',
  html: () => `
<h3>🎈 กฎแก๊สอุดมคติ PV = nRT</h3>
<label>หาค่า <select id="gasFind"><option value="V">ปริมาตร V</option><option value="P">ความดัน P</option><option value="n">จำนวนโมล n</option><option value="T">อุณหภูมิ T</option></select></label>
<div class="grid2">
  <label>P (atm) <input id="gP" type="number" value="1" step="any"></label>
  <label>V (L) <input id="gV" type="number" value="22.4" step="any"></label>
  <label>n (mol) <input id="gN" type="number" value="1" step="any"></label>
  <label>T (°C) <input id="gT" type="number" value="0" step="any"></label>
</div>
<div id="gasOut" class="out"></div>`,
  run() {
    const f = $('#gasFind').value;
    const P = +$('#gP').value, V = +$('#gV').value, n = +$('#gN').value, T = +$('#gT').value + 273.15;
    ['P', 'V', 'N', 'T'].forEach(k => $('#g' + k).disabled = (k === 'N' ? 'n' : k) === f);
    let res;
    if (f === 'V') res = `V = <b>${sci(n * R_GAS * T / P)} L</b>`;
    if (f === 'P') res = `P = <b>${sci(n * R_GAS * T / V)} atm</b>`;
    if (f === 'n') res = `n = <b>${sci(P * V / (R_GAS * T))} mol</b>`;
    if (f === 'T') { const t = P * V / (n * R_GAS); res = `T = <b>${sci(t)} K</b> (${sci(t - 273.15)} °C)`; }
    $('#gasOut').innerHTML = `<div class="big">${res}</div><div class="mut">R = 0.08206 L·atm/(mol·K) · แก๊สจริงจะเบี่ยงเบนจากค่านี้เมื่อความดันสูงหรืออุณหภูมิต่ำ</div>`;
  },
  init() {
    ['gasFind', 'gP', 'gV', 'gN', 'gT'].forEach(id => $('#' + id).addEventListener('input', () => this.run()));
    this.run();
  },
});
