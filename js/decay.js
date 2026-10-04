'use strict';
/* ================= RADIOACTIVE DECAY PAGE ================= */
const BY_Z = {}; ELEMENT_LIST.forEach(e => BY_Z[e.z] = e);
const isoName = (sym, A) => `<span class="iso"><sup>${A}</sup><sub>${E[sym].z}</sub>${sym}</span>`;
function fmtNum(v) {
  if (v >= 1e6) { const p = Math.floor(Math.log10(v)); return `${(v / 10 ** p).toFixed(2).replace(/\.?0+$/, '')} × 10<sup>${p}</sup>`; }
  return v.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}
const fmtHalfLife = (v, u) => `${fmtNum(v)} ${TIME_UNITS[u][0]}`;
function decayProduct(sym, A, mode) {
  const z = E[sym].z;
  if (mode === 'a') return [BY_Z[z - 2].sym, A - 4];
  if (mode === 'b-') return [BY_Z[z + 1].sym, A];
  if (mode === 'b+') return [BY_Z[z - 1].sym, A];
  return [sym, A];
}
function decayEquation(sym, A, mode) {
  const [ps, pa] = decayProduct(sym, A, mode);
  const parent = mode === 'g' ? isoName(sym, A).replace('</span>', '<sup>*</sup></span>') : isoName(sym, A);
  return `${parent} → ${isoName(ps, pa)} + ${DECAY_MODES[mode][1]}`;
}
// uranium-238 series: decay modes in order (product of each step is computed)
const U238_SERIES = ['a', 'b-', 'b-', 'a', 'a', 'a', 'a', 'a', 'b-', 'b-', 'a', 'b-', 'b-', 'a'];

function renderDecayPage() {
  const chain = [['U', 238]];
  U238_SERIES.forEach(m => { const [s, a] = chain[chain.length - 1]; chain.push(decayProduct(s, a, m)); });
  const nA = U238_SERIES.filter(m => m === 'a').length, nB = U238_SERIES.length - nA;
  $('#page-decay').innerHTML = `
  <div class="doc-head"><h2>การสลายตัวของธาตุ (กัมมันตภาพรังสี)</h2></div>
  <div class="prose">
    <p>ปฏิกิริยาเคมีทั่วไปเปลี่ยนแค่การจัดเรียง<b>อิเล็กตรอน</b> ธาตุจึงยังเป็นธาตุเดิม (เช่น Na ในเกลือก็ยังเป็นโซเดียม)
    แต่<b>การสลายตัวของธาตุกัมมันตรังสี</b>เกิดที่<b>นิวเคลียส</b> เมื่อนิวเคลียสไม่เสถียร (มีสัดส่วนโปรตอนกับนิวตรอนไม่เหมาะสม หรือใหญ่เกินไป)
    มันจะปล่อยรังสีออกมาและอาจ<b>กลายเป็นธาตุใหม่</b> สมการนิวเคลียร์ต้องดุลทั้ง<b>เลขมวล (ตัวบน)</b> และ<b>เลขอะตอม (ตัวล่าง)</b></p>
    <p>ธาตุที่ไม่มีไอโซโทปเสถียรเลย ได้แก่ เทคนีเชียม (Tc, 43) โพรมีเทียม (Pm, 61) และทุกธาตุตั้งแต่พอโลเนียม (Po, 84) ขึ้นไป (มีสัญลักษณ์ ☢ ในตารางธาตุ)
    ส่วนบิสมัท (Bi, 83) ก็ไม่มีไอโซโทปที่เสถียรจริง แต่ Bi-209 มีครึ่งชีวิตยาวประมาณ 2 × 10¹⁹ ปี (นานกว่าอายุเอกภพมาก) จึงถือว่าเสถียรในทางปฏิบัติ</p>
  </div>
  <div class="cards3">
    <div class="card" style="--c:#ff7a7a"><h3>แอลฟา (α)</h3><p>นิวเคลียสของฮีเลียม ⁴₂He (2p + 2n) ประจุ +2 มวลมาก</p><p>อำนาจทะลุทะลวง<b>ต่ำ</b> — กระดาษแผ่นเดียวหรือผิวหนังกั้นได้ แต่อันตรายมากถ้าเข้าสู่ร่างกาย</p></div>
    <div class="card" style="--c:#ffd23f"><h3>บีตา (β)</h3><p>อิเล็กตรอน (β⁻) หรือโพซิตรอน (β⁺) ที่เกิดจากนิวตรอน↔โปรตอนเปลี่ยนกันในนิวเคลียส</p><p>อำนาจทะลุทะลวง<b>ปานกลาง</b> — แผ่นอะลูมิเนียมหนาไม่กี่มิลลิเมตรกั้นได้</p></div>
    <div class="card" style="--c:#6ea8ff"><h3>แกมมา (γ)</h3><p>คลื่นแม่เหล็กไฟฟ้าพลังงานสูง ไม่มีมวลและประจุ มักเกิดร่วมกับ α หรือ β</p><p>อำนาจทะลุทะลวง<b>สูงมาก</b> — ต้องใช้ตะกั่วหนาหรือคอนกรีตกั้น</p></div>
  </div>

  <h3 class="sec">ครึ่งชีวิต (Half-life, t<sub>½</sub>)</h3>
  <div class="prose"><p>คือเวลาที่สารกัมมันตรังสีสลายตัวไปจนเหลือ<b>ครึ่งหนึ่ง</b>ของปริมาณเดิม ไม่ขึ้นกับปริมาณ อุณหภูมิ หรือความดัน
  ปริมาณที่เหลือ N = N₀ × (½)<sup>t / t½</sup></p></div>
  <div class="sim">
    <div class="sim-ctrl">
      <label>ไอโซโทป <select id="hlIso">${ISOTOPES.map((x, i) => `<option value="${i}"${x[0] === 'C' ? ' selected' : ''}>${x[0]}-${x[1]} (t½ = ${fmtHalfLife(x[3], x[4]).replace(/<\/?sup>/g, '')})</option>`).join('')}</select></label>
      <label>ปริมาณเริ่มต้น (กรัม) <input id="hlN0" type="number" value="100" min="0" step="any"></label>
      <label>เวลาที่ผ่านไป <span class="row2"><input id="hlT" type="number" value="11460" min="0" step="any"><select id="hlU">${Object.entries(TIME_UNITS).map(([k, v]) => `<option value="${k}"${k === 'y' ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></span></label>
      <div class="sim-out" id="hlOut"></div>
    </div>
    <svg id="hlChart" viewBox="0 0 520 260" class="chart"></svg>
  </div>

  <h3 class="sec">ไอโซโทปกัมมันตรังสีที่สำคัญ</h3>
  <div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>ไอโซโทป</th><th>การสลายตัว</th><th>สมการนิวเคลียร์</th><th>ครึ่งชีวิต</th><th>การใช้ประโยชน์ / ความสำคัญ</th></tr></thead>
    <tbody>${ISOTOPES.map(([s, A, m, v, u, note]) => `<tr><td>${isoName(s, A)}${m === 'g' ? '<sup>m</sup>' : ''}<div class="mut small">${E[s].th}-${A}</div></td>
      <td>${DECAY_MODES[m][0]}</td><td class="eqcell">${decayEquation(s, A, m)}</td><td>${fmtHalfLife(v, u)}</td><td>${note}</td></tr>`).join('')}</tbody>
  </table></div>
  <div class="cards3">${Object.entries(DECAY_MODES).map(([k, v]) => `<div class="card"><h3>${v[0]}</h3><p>${v[2]}</p></div>`).join('')}</div>

  <h3 class="sec">อนุกรมการสลายตัวของยูเรเนียม-238</h3>
  <div class="prose"><p>นิวเคลียสหนักบางชนิดสลายตัวต่อเนื่องหลายขั้นจนได้ธาตุเสถียร U-238 สลายตัวผ่าน ${chain.length - 2} ธาตุกลาง
  (ปล่อย α ${nA} ครั้ง และ β⁻ ${nB} ครั้ง) จนกลายเป็นตะกั่ว-206 ที่เสถียร ระหว่างทางมีเรเดียมและแก๊สเรดอน</p></div>
  <div class="chain">${chain.map(([s, a], i) => `${i ? `<span class="ch-arrow">${U238_SERIES[i - 1] === 'a' ? 'α' : 'β⁻'}<br>→</span>` : ''}<span class="ch-node" style="--c:${CATEGORY_COLOR[E[s].cat]}">${isoName(s, a)}<small>${E[s].th}</small></span>`).join('')}</div>

  <h3 class="sec">ฟิชชันและฟิวชัน</h3>
  <div class="cards2">
    <div class="card" style="--c:#ffb15c"><h3>ฟิชชัน (Fission) — การแตกตัว</h3>
      <p class="eqcell">${isoName('U', 235)} + ¹₀n → ${isoName('Ba', 141)} + ${isoName('Kr', 92)} + 3 ¹₀n</p>
      <p>นิวเคลียสหนักถูกนิวตรอนชนแล้วแตกเป็นนิวเคลียสขนาดกลาง ปล่อยนิวตรอนใหม่ที่ทำให้เกิด<b>ปฏิกิริยาลูกโซ่</b> ใช้ในโรงไฟฟ้านิวเคลียร์</p></div>
    <div class="card" style="--c:#ffd23f"><h3>ฟิวชัน (Fusion) — การหลอมรวม</h3>
      <p class="eqcell">${isoName('H', 2)} + ${isoName('H', 3)} → ${isoName('He', 4)} + ¹₀n</p>
      <p>นิวเคลียสเบาหลอมรวมกันที่อุณหภูมิหลายล้านองศา ปล่อยพลังงานมหาศาล (ประมาณ 17.6 MeV ต่อปฏิกิริยา) เป็นแหล่งพลังงานของดวงอาทิตย์</p></div>
  </div>
  <p class="source">ค่าครึ่งชีวิตตามฐานข้อมูลมาตรฐาน NUBASE2020 (Kondev et al., Chinese Physics C 45, 030001, 2021) ผ่านบทความไอโซโทปในวิกิพีเดีย ตรวจสอบเมื่อ ต.ค. 2026 · ผลิตภัณฑ์ของการสลายตัวคำนวณจากเลขมวลและเลขอะตอมโดยอัตโนมัติ</p>`;

  const update = () => {
    const iso = ISOTOPES[+$('#hlIso').value], N0 = +$('#hlN0').value || 0;
    const half = iso[3] * TIME_UNITS[iso[4]][1], t = (+$('#hlT').value || 0) * TIME_UNITS[$('#hlU').value][1];
    const n = t / half, N = N0 * Math.pow(0.5, n);
    $('#hlOut').innerHTML = `ผ่านไป <b>${n.toFixed(2)}</b> ครึ่งชีวิต<br>เหลือ ${iso[0]}-${iso[1]} <b>${N < 0.001 && N > 0 ? N.toExponential(3) : N.toFixed(3)} กรัม</b> (${(100 * Math.pow(0.5, n)).toFixed(2)}%)<br><span class="mut">สลายตัวไปแล้ว ${(N0 - N).toFixed(3)} กรัม</span>`;
    // chart: 0..max(5, n+1) half-lives
    const maxN = Math.max(5, Math.ceil(n + 1)), X = v => 50 + v / maxN * 450, Y = f => 225 - f * 200;
    let s = `<line x1="50" y1="225" x2="505" y2="225" class="ax"/><line x1="50" y1="20" x2="50" y2="225" class="ax"/>`;
    for (let k = 0; k <= maxN; k++) s += `<line x1="${X(k)}" y1="225" x2="${X(k)}" y2="230" class="ax"/><text x="${X(k)}" y="245" class="tk">${k}</text>`;
    [1, .5, .25, .125].forEach(f => s += `<line x1="50" y1="${Y(f)}" x2="505" y2="${Y(f)}" class="grid"/><text x="44" y="${Y(f) + 4}" class="tk" text-anchor="end">${f * 100}%</text>`);
    let path = ''; for (let k = 0; k <= 200; k++) { const v = k / 200 * maxN; path += (k ? 'L' : 'M') + X(v).toFixed(1) + ' ' + Y(Math.pow(.5, v)).toFixed(1); }
    s += `<path d="${path}" class="curve"/>`;
    if (n <= maxN) s += `<line x1="${X(n)}" y1="${Y(Math.pow(.5, n))}" x2="${X(n)}" y2="225" class="mark"/><circle cx="${X(n)}" cy="${Y(Math.pow(.5, n))}" r="5" class="dot"/>`;
    s += `<text x="278" y="258" class="tk" text-anchor="middle">จำนวนครึ่งชีวิตที่ผ่านไป</text>`;
    $('#hlChart').innerHTML = s;
  };
  ['hlIso', 'hlN0', 'hlT', 'hlU'].forEach(id => $('#' + id).addEventListener('input', update));
  $('#hlIso').addEventListener('change', () => { const iso = ISOTOPES[+$('#hlIso').value]; $('#hlU').value = iso[4]; $('#hlT').value = +(iso[3] * 2).toPrecision(4); update(); });
  update();
}
