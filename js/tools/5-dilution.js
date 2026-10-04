'use strict';
/* เครื่องมือคำนวณ: การเจือจางสารละลาย M₁V₁ = M₂V₂ */
TOOLS.push({
  id: 'dilution',
  html: () => `
<h3>💧 การเจือจางสารละลาย M₁V₁ = M₂V₂</h3>
<div class="grid2">
  <label>M₁ (mol/L) <input id="dM1" type="number" value="12" step="any"></label>
  <label>M₂ (mol/L) <input id="dM2" type="number" value="1" step="any"></label>
  <label>V₂ (mL) <input id="dV2" type="number" value="250" step="any"></label>
</div>
<div id="dilOut" class="out"></div>`,
  run() {
    const M1 = +$('#dM1').value, M2 = +$('#dM2').value, V2 = +$('#dV2').value;
    const V1 = M2 * V2 / M1;
    if (!isFinite(V1) || V1 <= 0) { $('#dilOut').innerHTML = '<span class="err">ใส่ M₁, M₂ และ V₂ ให้ครบ</span>'; return; }
    $('#dilOut').innerHTML = `<div class="big">ใช้สารละลายเข้มข้น <b>${sci(V1)} mL</b></div><div>แล้วเติมน้ำจนปริมาตรรวมเป็น ${V2} mL (เติมน้ำ ${sci(V2 - V1)} mL)</div>
      ${M1 > M2 ? '<div class="note">⚠️ ถ้าเป็นกรดเข้มข้น ให้ค่อย ๆ เทกรดลงในน้ำ ไม่ใช่เทน้ำลงในกรด</div>' : ''}`;
  },
  init() {
    ['dM1', 'dM2', 'dV2'].forEach(id => $('#' + id).addEventListener('input', () => this.run()));
    this.run();
  },
});
