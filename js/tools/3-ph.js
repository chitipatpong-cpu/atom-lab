'use strict';
/* เครื่องมือคำนวณ: pH และ pOH ที่ 25 °C (pH + pOH = 14) */
TOOLS.push({
  id: 'ph',
  html: () => `
<h3>🧪 pH และ pOH (ที่ 25 °C)</h3>
<label>คำนวณจาก <select id="phMode"><option value="h">[H₃O⁺] (mol/L)</option><option value="oh">[OH⁻] (mol/L)</option><option value="ph">ค่า pH</option></select></label>
<label>ค่า <input id="phVal" type="number" value="0.001" step="any"></label>
<div id="phOut" class="out"></div>`,
  run() {
    const mode = $('#phMode').value, v = +$('#phVal').value;
    let pH;
    if (mode === 'h') pH = -Math.log10(v); else if (mode === 'oh') pH = 14 + Math.log10(v); else pH = v;
    if (!isFinite(pH)) { $('#phOut').innerHTML = '<span class="err">ค่าไม่ถูกต้อง</span>'; return; }
    const kind = pH < 6.995 ? 'กรด' : pH > 7.005 ? 'เบส' : 'กลาง';
    $('#phOut').innerHTML = `<div class="big">pH = <b>${pH.toFixed(2)}</b> · pOH = ${(14 - pH).toFixed(2)} → <b>${kind}</b></div>
      <div>[H₃O⁺] = ${sci(10 ** -pH)} mol/L · [OH⁻] = ${sci(10 ** -(14 - pH))} mol/L</div>
      <div class="phscale"><i style="left:${Math.max(0, Math.min(14, pH)) / 14 * 100}%"></i></div>`;
  },
  init() {
    ['phMode', 'phVal'].forEach(id => $('#' + id).addEventListener('input', () => this.run()));
    this.run();
  },
});
