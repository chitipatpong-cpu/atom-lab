'use strict';
/* ================= PERIODIC TABLE PAGE ================= */
let ptSelected = 'H';
const NUMERIC_MODES = {
  eneg: ['อิเล็กโทรเนกาติวิตี (Pauling)', e => e.eneg, ''],
  radius: ['รัศมีอะตอม (pm)', e => e.radius, 'pm'],
  ie: ['พลังงานไอออไนเซชันลำดับที่ 1 (eV)', e => e.ie, 'eV'],
  density: ['ความหนาแน่น (g/cm³)', e => e.density, ''],
  mp: ['จุดหลอมเหลว (K)', e => e.mp, 'K'],
};
const STATE_COLOR = { 'Solid': '#9fb3c8', 'Liquid': '#5fa8ff', 'Gas': '#ffd23f', 'Expected to be a Solid': '#5b6a80', 'Expected to be a Gas': '#8a7a40' };
const BLOCK_COLOR = { s: '#ff7a7a', p: '#ffd23f', d: '#6ea8ff', f: '#6fdc8c' };
function heat(t) { // 0..1 → blue → cyan → yellow → red
  const stops = [[40, 80, 200], [40, 190, 220], [250, 215, 60], [235, 70, 60]];
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
  return `rgb(${stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f)).join(',')})`;
}
function cellColor(e, mode) {
  if (mode === 'cat') return CATEGORY_COLOR[e.cat];
  if (mode === 'state') return STATE_COLOR[e.state] || '#666';
  if (mode === 'block') return BLOCK_COLOR[e.block];
  const [, get] = NUMERIC_MODES[mode];
  const v = get(e); if (v == null) return null;
  const vals = ELEMENT_LIST.map(get).filter(x => x != null);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const useLog = mode === 'density';
  return heat(useLog ? Math.log(v / lo) / Math.log(hi / lo) : (v - lo) / (hi - lo));
}
function renderPTable() {
  const mode = $('#ptMode').value, q = $('#ptSearch').value.trim().toLowerCase();
  const html = [];
  ELEMENT_LIST.forEach(e => {
    const c = cellColor(e, mode);
    const match = !q || e.sym.toLowerCase() === q || e.th.includes(q) || e.en.toLowerCase().includes(q) || String(e.z) === q;
    const row = (e.row > 7 ? e.row + 1 : e.row) + 1; // row 1 = group numbers, gap row before the f-block
    const val = NUMERIC_MODES[mode] ? NUMERIC_MODES[mode][1](e) : null;
    html.push(`<button class="pt-cell${e.sym === ptSelected ? ' sel' : ''}${match ? '' : ' dim'}" data-sym="${e.sym}"
      style="grid-row:${row};grid-column:${e.col};--c:${c || '#3a4458'}" title="${e.th} (${e.en})">
      <span class="z">${e.z}</span><b>${e.sym}</b><span class="nm">${e.th}</span>${val != null ? `<span class="v">${+val.toFixed(2)}</span>` : ''}${e.radioactive ? '<span class="ra">☢</span>' : ''}</button>`);
  });
  html.push('<div class="pt-ph" style="grid-row:7;grid-column:3">57–71</div><div class="pt-ph" style="grid-row:8;grid-column:3">89–103</div>');
  for (let g = 1; g <= 18; g++) html.push(`<div class="pt-gh" style="grid-row:1;grid-column:${g}">${g}</div>`);
  $('#ptable').innerHTML = html.join('');
  // legend
  let lg = '';
  if (mode === 'cat') lg = Object.entries(CATEGORY_TH).map(([k, v]) => `<span><i style="background:${CATEGORY_COLOR[k]}"></i>${v}</span>`).join('');
  else if (mode === 'state') lg = Object.entries(STATE_TH).map(([k, v]) => `<span><i style="background:${STATE_COLOR[k]}"></i>${v}</span>`).join('');
  else if (mode === 'block') lg = Object.entries(BLOCK_COLOR).map(([k, v]) => `<span><i style="background:${v}"></i>บล็อก ${k}</span>`).join('');
  else lg = `<span>${NUMERIC_MODES[mode][0]}: ต่ำ</span><span class="grad"></span><span>สูง</span><span class="mut">(สีเทา = ไม่มีข้อมูล)</span>`;
  $('#ptLegend').innerHTML = lg + '<span>☢ = ไม่มีไอโซโทปเสถียร (กัมมันตรังสี)</span>';
}
function bohrSVG(e) {
  const shells = e.shells, R0 = 26, step = Math.min(15, 92 / shells.length), size = 2 * (R0 + step * shells.length) + 16, c = size / 2;
  let s = `<svg viewBox="0 0 ${size} ${size}" class="bohr" role="img" aria-label="แบบจำลองอะตอมของโบร์ ${e.sym}">`;
  shells.forEach((n, i) => {
    const r = R0 + step * (i + 1);
    s += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(140,180,255,.35)" stroke-width="1"/>`;
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 - Math.PI / 2 + i * 0.3;
      s += `<circle cx="${(c + Math.cos(a) * r).toFixed(1)}" cy="${(c + Math.sin(a) * r).toFixed(1)}" r="${n > 18 ? 2.2 : 3}" fill="#7ef0ff"/>`;
    }
  });
  s += `<circle cx="${c}" cy="${c}" r="${R0 - 6}" fill="${e.color}"/><text x="${c}" y="${c + 5}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="15" fill="${isLight(e.color) ? '#1d2433' : '#fff'}">${e.sym}</text></svg>`;
  return s;
}
function showElement(sym) {
  ptSelected = sym;
  const e = E[sym];
  renderPTable();
  const comps = DB.filter(d => d.counts[sym]);
  const rx = REACTIONS.filter(r => r.all.some(t => t.f === sym || (DB_BY_ID[t.f] && DB_BY_ID[t.f].counts[sym])));
  const iso = ISOTOPES.filter(x => x[0] === sym);
  const extra = [
    ['รัศมีอะตอม (แวนเดอร์วาลส์)', e.radius != null ? e.radius + ' pm' : '–'],
    ['พลังงานไอออไนเซชันลำดับที่ 1', e.ie != null ? e.ie + ' eV' : '–'],
    ['สัมพรรคภาพอิเล็กตรอน', e.ea != null ? e.ea + ' eV' : '–'],
    ['ความหนาแน่น', e.density != null ? e.density + (e.state === 'Gas' ? ' g/L' : ' g/cm³') : '–'],
    ['ปีที่ค้นพบ', e.year === 'Ancient' ? 'รู้จักมาตั้งแต่สมัยโบราณ' : e.year ? 'ค.ศ. ' + e.year : '–'],
  ];
  $('#elDetail').innerHTML = `
    <div class="el-card" style="--c:${CATEGORY_COLOR[e.cat]}">
      <div class="el-big"><span class="z">${e.z}</span><b>${e.sym}</b><span>${e.th}</span><span class="mut">${e.en}</span><span class="mut">${e.massStr}</span></div>
      ${bohrSVG(e)}
      <div class="el-actions"><button class="btn go" data-add-el="${sym}">🧪 เพิ่มลงห้องทดลอง</button></div>
    </div>
    <div class="el-info">
      <dl class="rows">${[...elementRows(e), ...extra].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
      ${iso.length ? `<h3 class="sec">☢️ ไอโซโทปกัมมันตรังสี</h3>${iso.map(x => `<div>${isoName(x[0], x[1])} — ครึ่งชีวิต ${fmtHalfLife(x[3], x[4])} · ${DECAY_MODES[x[2]][0]}</div>`).join('')}` : ''}
      ${comps.length ? `<h3 class="sec">สารประกอบในฐานข้อมูล (${comps.length})</h3><div class="chips">${comps.map(d => `<span class="chip got" data-build="${d.id}" title="${d.th}${d.smiles ? ' — แตะเพื่อสร้างในห้องทดลอง' : ''}">${fmt(d.f)}</span>`).join('')}</div>` : ''}
      ${rx.length ? `<h3 class="sec">ปฏิกิริยาที่เกี่ยวข้อง (${rx.length})</h3>${rx.slice(0, 6).map(r => `<div class="rx-line">${eqHTML(r.p, spLink)} <span class="mut">· ${r.th}</span></div>`).join('')}
        ${rx.length > 6 ? `<button class="btn small" data-rx-more="${sym}">ดูทั้งหมด →</button>` : ''}` : ''}
    </div>`;
}
function initPTable() {
  $('#ptMode').addEventListener('change', renderPTable);
  $('#ptSearch').addEventListener('input', () => {
    renderPTable();
    const q = $('#ptSearch').value.trim().toLowerCase();
    const hit = q && ELEMENT_LIST.find(e => e.sym.toLowerCase() === q || String(e.z) === q || e.th === q);
    if (hit) showElement(hit.sym);
  });
  $('#ptable').addEventListener('click', e => { const c = e.target.closest('[data-sym]'); if (c) showElement(c.dataset.sym); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-add-el]'), b = e.target.closest('[data-build]');
    if (a) { showPage('lab'); requestAnimationFrame(() => { resize2D(); addElementToLab(a.dataset.addEl); }); }
    if (b) {
      const d = DB_BY_ID[b.dataset.build];
      if (!d.smiles) { toast(`${d.th} สร้างด้วยแบบจำลองพันธะในห้องทดลองไม่ได้`, 1800); return; }
      showPage('lab'); requestAnimationFrame(() => { resize2D(); buildCompound(d.id); });
    }
  });
  showElement('H');
}
