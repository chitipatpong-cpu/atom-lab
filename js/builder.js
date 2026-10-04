'use strict';
/* ================= PALETTE ================= */
const tilesEl = $('#tiles');
let palFilter = 'common', palCat = null;
function slotsHTML(e) {
  if (e.val.length === 1 && e.val[0] === 0) return '<span>ไม่สร้างพันธะ</span><span class="t-dots"></span>';
  if (e.metal) return `<span>ไอออนิก (+${e.val.join('/+')})</span><span class="t-dots">${'<i></i>'.repeat(Math.min(e.val[0], 4))}</span>`;
  const lo = e.val[0];
  const dots = Array.from({ length: 4 }, (_, k) => `<i${k < lo ? '' : ' class="dim"'}></i>`).join('');
  return `<span>${e.val.join(', ')} พันธะ:</span><span class="t-dots">${dots}</span>`;
}
function renderPalette() {
  const q = $('#elSearch').value.trim().toLowerCase();
  let list = ELEMENT_LIST;
  if (palFilter === 'common') list = COMMON.map(s => E[s]);
  else if (palFilter === 'group' && palCat) list = list.filter(e => e.cat === palCat);
  if (q) list = ELEMENT_LIST.filter(e => e.sym.toLowerCase() === q || e.th.includes(q) || e.en.toLowerCase().includes(q) || String(e.z) === q);
  tilesEl.innerHTML = '';
  list.forEach(e => {
    const t = document.createElement('div');
    t.className = 'tile';
    t.style.setProperty('--ec', neon(e.sym));
    t.title = `${e.th} (${e.en}) · ${CATEGORY_TH[e.cat]}`;
    t.innerHTML = `<div class="t-top"><span>${e.z}</span>${e.eneg != null ? `<span class="t-en">EN ${e.eneg}</span>` : ''}</div>
      <div class="t-mid"><span class="t-sym">${e.sym}</span><span class="t-nm">${e.th}</span></div>
      <div class="t-slots">${slotsHTML(e)}</div>`;
    t.addEventListener('pointerdown', ev => startPaletteDrag(ev, e.sym));
    tilesEl.appendChild(t);
  });
  if (!list.length) tilesEl.innerHTML = '<div class="empty" style="grid-column:1/-1;padding:8px">ไม่พบธาตุ</div>';
}
$('#elCats').innerHTML = Object.entries(CATEGORY_TH).map(([k, v]) => `<button data-cat="${k}" style="--c:${CATEGORY_COLOR[k]}"><i></i>${v}</button>`).join('');
$('#elTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-f]'); if (!b) return;
  palFilter = b.dataset.f;
  $('#elTabs').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  $('#elCats').classList.toggle('show', palFilter === 'group');
  if (palFilter === 'group' && !palCat) { palCat = 'Nonmetal'; $('#elCats [data-cat="Nonmetal"]').classList.add('on'); }
  renderPalette();
});
$('#elCats').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  palCat = b.dataset.cat;
  $('#elCats').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  renderPalette();
});
$('#elSearch').addEventListener('input', renderPalette);
renderPalette();
// add an element from anywhere (periodic table page, tap on tile)
function addElementToLab(sym) {
  const a = addAtom(sym, W / 2 + (Math.random() - .5) * 120, H / 2 + (Math.random() - .5) * 90);
  selectedId = a.id; changed();
}

// status line in the header, the bar above the canvas and the SMILES box (refreshed on every change)
function updateStatus() {
  const sel = selectedId != null && compOf.has(selectedId) ? identify(comps[compOf.get(selectedId)]) : null;
  const modeName = { move: 'ต่อพันธะ', erase: 'ตัดพันธะ', charge: 'ประจุ' }[mode];
  $('#statusline').innerHTML = `อะตอมบนกระดาน: <b>${atoms.length}</b> • โมเลกุล: <b>${comps.length}</b> • โหมด: <span class="hl">${modeName}</span>`;
  $('#stageFormula').innerHTML = sel ? fmt(sel.entry ? sel.entry.f : sel.label) : '—';
  $('#stageStatus').innerHTML = !sel ? '<span class="mut">ยังไม่มีโมเลกุล</span>'
    : sel.complete ? `<span class="st-ok">● เสถียร (พันธะครบ)</span>` : `<span class="st-warn">● ยังไม่เสถียร</span>`;
  const sm = sel && sel.entry && sel.entry.smiles;
  $('#smilesBox').innerHTML = `<button id="copySmiles" ${sm ? '' : 'disabled'}>⧉ คัดลอก SMILES</button><code>${sm || '—'}</code>`;
}
$('#smilesBox').addEventListener('click', e => {
  if (!e.target.closest('#copySmiles')) return;
  const code = $('#smilesBox code').textContent;
  try { navigator.clipboard.writeText(code).then(() => toast('คัดลอก SMILES แล้ว: ' + code, 1400)); } catch (err) { toast(code, 2000); }
});

let pdrag = null; // palette drag
function startPaletteDrag(ev, sym) {
  if (ev.button !== undefined && ev.button !== 0) return;
  pdrag = { sym, sx: ev.clientX, sy: ev.clientY, ghost: null, pid: ev.pointerId };
  window.addEventListener('pointermove', paletteMove);
  window.addEventListener('pointerup', paletteUp);
  window.addEventListener('pointercancel', paletteCancel);
}
function paletteMove(ev) {
  if (!pdrag || ev.pointerId !== pdrag.pid) return;
  if (!pdrag.ghost) {
    if (Math.hypot(ev.clientX - pdrag.sx, ev.clientY - pdrag.sy) < 6) return;
    const g = document.createElement('div');
    g.className = 'ghost'; g.style.setProperty('--ec', neon(pdrag.sym)); g.textContent = pdrag.sym;
    document.body.appendChild(g); pdrag.ghost = g;
  }
  pdrag.ghost.style.transform = `translate(${ev.clientX - 22}px,${ev.clientY - 22}px)`;
  const p = canvasPos(ev);
  if (p.inside) {
    pdrag.cx = p.x; pdrag.cy = p.y; pdrag.over = true;
    const t = findSnap(pdrag.sym, p.x, p.y, null);
    snap = t ? { x: p.x, y: p.y, target: t } : null;
    overTrash = isOverTrash(p.x, p.y);
  } else { pdrag.over = false; snap = null; overTrash = false; }
  showTrash = true;
}
function paletteUp(ev) {
  if (!pdrag || ev.pointerId !== pdrag.pid) return;
  const d = pdrag; endPalette();
  if (!d.ghost) { addElementToLab(d.sym); return; } // tap → add near center
  const p = canvasPos(ev);
  if (!p.inside || isOverTrash(p.x, p.y)) return;
  const t = findSnap(d.sym, p.x, p.y, null);
  let x = p.x, y = p.y;
  if (t) {
    let dx = p.x - t.x, dy = p.y - t.y, l = Math.hypot(dx, dy);
    if (l < 1) { const ang = Math.random() * Math.PI * 2; dx = Math.cos(ang); dy = Math.sin(ang); l = 1; }
    const L = rpx(d.sym) + rpx(t.el) + 26;
    x = t.x + dx / l * L; y = t.y + dy / l * L;
  }
  const a = addAtom(d.sym, x, y);
  if (t) addBond(a, t, 1);
  selectedId = a.id; changed();
}
function paletteCancel() { endPalette(); }
function endPalette() {
  if (pdrag && pdrag.ghost) pdrag.ghost.remove();
  pdrag = null; snap = null; showTrash = false; overTrash = false;
  window.removeEventListener('pointermove', paletteMove);
  window.removeEventListener('pointerup', paletteUp);
  window.removeEventListener('pointercancel', paletteCancel);
}

/* ================= BUILDER CANVAS ================= */
const cv = $('#cv'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
let drag = null, snap = null, showTrash = false, overTrash = false;
const SNAP = 75;
function resize2D() {
  const r = $('#stage').getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = r.width; H = r.height;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
new ResizeObserver(resize2D).observe($('#stage'));
function canvasPos(ev) {
  const r = cv.getBoundingClientRect();
  const x = ev.clientX - r.left, y = ev.clientY - r.top;
  return { x, y, inside: x >= 0 && y >= 0 && x <= r.width && y <= r.height };
}
const trashPos = () => ({ x: W - 46, y: H - 46, r: 30 });
function isOverTrash(x, y) { const t = trashPos(); return Math.hypot(x - t.x, y - t.y) < t.r + 10; }
function hitAtom(x, y) {
  for (let k = atoms.length - 1; k >= 0; k--) { const a = atoms[k]; if (Math.hypot(a.x - x, a.y - y) <= rpx(a.el) + 5) return a; }
  return null;
}
function hitBond(x, y) {
  let best = null, bd = 9;
  for (const b of bonds) {
    const A = atomMap.get(b.a), B = atomMap.get(b.b);
    const dx = B.x - A.x, dy = B.y - A.y, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - A.x) * dx + (y - A.y) * dy) / l2));
    const d = Math.hypot(A.x + dx * t - x, A.y + dy * t - y);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}
function findSnap(el, x, y, selfId) {
  let best = null, bd = SNAP;
  const self = selfId != null ? atomMap.get(selfId) : null;
  for (const t of atoms) {
    if (t.id === selfId) continue;
    const d = Math.hypot(t.x - x, t.y - y);
    if (d >= bd) continue;
    if (self) { if (!canBond(self, t)) continue; }
    else if ((E[el].metal && E[t.el].metal) || used(t.id) >= maxVal(t)) continue;
    best = t; bd = d;
  }
  return best;
}
function cycleBond(b) {
  const A = atomMap.get(b.a), B = atomMap.get(b.b);
  const can = b.order < 3 && used(A.id) < maxVal(A) && used(B.id) < maxVal(B);
  b.order = can ? b.order + 1 : 1;
  toast(['', 'พันธะเดี่ยว', 'พันธะคู่', 'พันธะสาม'][b.order] + ` ${A.el}${['', '–', '=', '≡'][b.order]}${B.el}`, 1200);
}

// atom picked by a tap/click: shows a ✕ delete badge and can be removed with the Delete key
let pickedId = null;
const deleteBadgePos = a => { const r = rpx(a.el); return { x: a.x + r * .8, y: a.y + r * .8 }; };
function deletePicked() {
  if (pickedId == null || !atomMap.has(pickedId)) return;
  const el = atomMap.get(pickedId).el;
  deleteAtom(pickedId); pickedId = null; changed();
  toast(`ลบอะตอม ${el} แล้ว`, 1000);
}
window.addEventListener('keydown', e => {
  if ((e.key !== 'Delete' && e.key !== 'Backspace') || typeof page !== 'undefined' && page !== 'lab') return;
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
  if (pickedId != null) { e.preventDefault(); deletePicked(); }
});

cv.addEventListener('pointerdown', e => {
  const p = canvasPos(e);
  if (pickedId != null && atomMap.has(pickedId)) {
    const bp = deleteBadgePos(atomMap.get(pickedId));
    if (Math.hypot(p.x - bp.x, p.y - bp.y) <= 12) { deletePicked(); return; }
  }
  const a = hitAtom(p.x, p.y);
  if (!a) pickedId = null;
  if (a) {
    if (mode === 'erase') { deleteAtom(a.id); changed(); return; }
    if (mode === 'charge') { // cycle formal charge 0 → +1 → −1 → +2 → −2 → +3 → −3 → 0
      const seq = [0, 1, -1, 2, -2, 3, -3], k = seq.indexOf(a.q || 0);
      a.q = seq[(k + 1) % seq.length]; selectedId = a.id;
      toast(`${a.el}${a.q ? '<sup>' + chargeStr(a.q) + '</sup>' : ''} ${a.q ? 'ประจุ ' + chargeStr(a.q) : 'ไม่มีประจุ'}`, 1100);
      changed(); return;
    }
    drag ={ id: a.id, sx: p.x, sy: p.y, ox: a.x - p.x, oy: a.y - p.y, moved: false };
    cv.setPointerCapture(e.pointerId);
    if (selectedId !== a.id) { selectedId = a.id; needs3D = true; }
    return;
  }
  const b = hitBond(p.x, p.y);
  if (b) {
    if (mode === 'erase') { bonds.splice(bonds.indexOf(b), 1); changed(); return; }
    cycleBond(b); selectedId = b.a; changed();
  }
});
cv.addEventListener('pointermove', e => {
  const p = canvasPos(e);
  if (!drag) { cv.style.cursor = hitAtom(p.x, p.y) ? (mode === 'erase' ? 'not-allowed' : 'grab') : hitBond(p.x, p.y) ? 'pointer' : 'default'; return; }
  const a = atomMap.get(drag.id); if (!a) return;
  if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 4) { drag.moved = true; showTrash = true; }
  a.x = p.x + drag.ox; a.y = p.y + drag.oy;
  const t = drag.moved ? findSnap(a.el, a.x, a.y, a.id) : null;
  snap = t ? { x: a.x, y: a.y, target: t } : null;
  overTrash = isOverTrash(p.x, p.y);
  cv.style.cursor = 'grabbing';
});
function endDrag(e, cancel) {
  if (!drag) return;
  const a = atomMap.get(drag.id);
  if (!cancel && a && drag.moved) {
    const p = canvasPos(e);
    if (isOverTrash(p.x, p.y)) { deleteAtom(a.id); changed(); }
    else if (snap && snap.target && canBond(a, snap.target)) { addBond(a, snap.target, 1); changed(); }
  }
  // a tap without moving picks the atom (tap again to unpick)
  if (!cancel && a && !drag.moved) pickedId = pickedId === a.id ? null : a.id;
  else pickedId = null;
  drag = null; snap = null; showTrash = false; overTrash = false;
}
cv.addEventListener('pointerup', e => endDrag(e, false));
cv.addEventListener('pointercancel', e => endDrag(e, true));

function physics() {
  const n = atoms.length;
  for (const a of atoms) { a.fx = 0; a.fy = 0; }
  for (const b of bonds) {
    const A = atomMap.get(b.a), B = atomMap.get(b.b);
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 0.01;
    const f = (d - bondLen2D(A, B, b.order)) * 0.12, ux = dx / d, uy = dy / d;
    A.fx += ux * f; A.fy += uy * f; B.fx -= ux * f; B.fy -= uy * f;
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const A = atoms[i], B = atoms[j];
    let dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
    if (d < 0.01) { dx = Math.random() - .5; dy = Math.random() - .5; d = 0.5; }
    let f = 0;
    if (compOf.get(A.id) === compOf.get(B.id)) {
      if (d < 160 && !bondSet.has(pairKey(A.id, B.id))) f = Math.min(4, 1500 / (d * d));
    } else {
      const minD = rpx(A.el) + rpx(B.el) + 6;
      if (d < minD && !(snap && (snap.target === A || snap.target === B))) f = (minD - d) * 0.3;
    }
    if (f) { const ux = dx / d, uy = dy / d; A.fx -= ux * f; A.fy -= uy * f; B.fx += ux * f; B.fy += uy * f; }
  }
  for (const a of atoms) {
    if (drag && drag.id === a.id) { a.vx = a.vy = 0; continue; }
    a.vx = (a.vx + a.fx) * 0.72; a.vy = (a.vy + a.fy) * 0.72;
    const sp = Math.hypot(a.vx, a.vy); if (sp > 25) { a.vx *= 25 / sp; a.vy *= 25 / sp; }
    a.x += a.vx; a.y += a.vy;
    const r = rpx(a.el);
    a.x = Math.max(r, Math.min(W - r, a.x)); a.y = Math.max(r, Math.min(H - r, a.y));
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // grid
  ctx.lineWidth = 1; ctx.beginPath(); ctx.strokeStyle = 'rgba(34,211,238,0.045)';
  for (let x = 0; x < W; x += 30) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
  for (let y = 0; y < H; y += 30) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
  ctx.stroke();
  const selC = selectedId != null && compOf.has(selectedId) ? compOf.get(selectedId) : -1;

  // bonds
  for (const b of bonds) {
    const A = atomMap.get(b.a), B = atomMap.get(b.b);
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, px = -dy / d, py = dx / d;
    const ionic = E[A.el].metal || E[B.el].metal;
    const sel = compOf.get(A.id) === selC;
    const offs = b.order === 1 ? [0] : b.order === 2 ? [-3.6, 3.6] : [-6, 0, 6];
    ctx.save();
    ctx.lineWidth = b.order === 1 ? 3 : 2.2; ctx.lineCap = 'round';
    ctx.strokeStyle = ionic ? 'rgba(251,191,36,.8)' : sel ? '#22d3ee' : '#3b4a5b';
    if (sel && !ionic) { ctx.shadowColor = 'rgba(34,211,238,.8)'; ctx.shadowBlur = 8; }
    ctx.setLineDash(ionic ? [5, 5] : []);
    for (const o of offs) { ctx.beginPath(); ctx.moveTo(A.x + px * o, A.y + py * o); ctx.lineTo(B.x + px * o, B.y + py * o); ctx.stroke(); }
    ctx.restore();
  }
  // snap preview
  if (snap) {
    const t = snap.target, pulse = 4 + Math.sin(performance.now() / 120) * 2;
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(snap.x, snap.y); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(t.x, t.y, rpx(t.el) + pulse + 4, 0, Math.PI * 2); ctx.stroke();
  }
  // atoms: dark core + neon ring
  for (const a of atoms) {
    const r = rpx(a.el), nc = neon(a.el), sel = compOf.get(a.id) === selC;
    ctx.save();
    if (sel) { ctx.shadowColor = nc; ctx.shadowBlur = 14; }
    ctx.fillStyle = '#0d131a'; ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = sel ? 10 : 0;
    ctx.lineWidth = a.el === 'H' ? 1.8 : 2.4; ctx.strokeStyle = sel ? nc : mix(nc, '#0d131a', .25);
    ctx.stroke();
    ctx.restore();
    if (drag && drag.id === a.id) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a.x, a.y, r + 4, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = nc;
    ctx.font = `700 ${a.el === 'H' ? 12 : a.el.length > 1 ? 13 : 15}px "JetBrains Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(a.el, a.x, a.y + 1);
    if (a.q) { // formal charge badge
      const bx = a.x + r * .78, by = a.y - r * .78, txt = chargeStr(a.q);
      ctx.fillStyle = a.q > 0 ? '#f43f5e' : '#0ea5e9';
      ctx.beginPath(); ctx.arc(bx, by, 8.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 10px "JetBrains Mono", monospace'; ctx.fillText(txt, bx, by + 1);
    }
    // free valence slots
    const k = need(a);
    if (k > 0) {
      let mx = 0, my = 0, cnt = 0;
      for (const b of bonds) {
        if (b.a !== a.id && b.b !== a.id) continue;
        const o = atomMap.get(b.a === a.id ? b.b : b.a), dd = Math.hypot(o.x - a.x, o.y - a.y) || 1;
        mx += (o.x - a.x) / dd; my += (o.y - a.y) / dd; cnt++;
      }
      const base = cnt ? Math.atan2(-my, -mx) : -Math.PI / 2;
      const step = cnt ? Math.min(0.75, 2.6 / Math.max(1, k - 1)) : (Math.PI * 2) / k;
      ctx.fillStyle = nc; ctx.shadowColor = nc; ctx.shadowBlur = 6;
      for (let q = 0; q < k; q++) {
        const ang = cnt ? base + (q - (k - 1) / 2) * step : base + q * step;
        ctx.beginPath(); ctx.arc(a.x + Math.cos(ang) * (r + 8), a.y + Math.sin(ang) * (r + 8), 2.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }
  // reaction burst
  if (flash) {
    const t = (performance.now() - flash.t0) / 900;
    if (t > 1) flash = null;
    else {
      ctx.save();
      ctx.globalAlpha = 1 - t; ctx.strokeStyle = flash.color; ctx.lineWidth = 4 * (1 - t) + 1;
      for (const k of [0, .25]) { const rr = Math.max(0, t - k) * 220; if (rr > 0) { ctx.beginPath(); ctx.arc(flash.x, flash.y, rr, 0, Math.PI * 2); ctx.stroke(); } }
      ctx.restore();
    }
  }
  // picked atom: dashed ring + ✕ delete badge
  const pk = pickedId != null && !drag ? atomMap.get(pickedId) : null;
  if (pk) {
    const r = rpx(pk.el), bp = deleteBadgePos(pk);
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(pk.x, pk.y, r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(bp.x, bp.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.beginPath();
    ctx.moveTo(bp.x - 4, bp.y - 4); ctx.lineTo(bp.x + 4, bp.y + 4); ctx.moveTo(bp.x + 4, bp.y - 4); ctx.lineTo(bp.x - 4, bp.y + 4); ctx.stroke();
  } else if (pickedId != null && !atomMap.has(pickedId)) pickedId = null;
  // trash
  if (showTrash) {
    const t = trashPos();
    ctx.fillStyle = overTrash ? 'rgba(248,113,113,.35)' : 'rgba(255,255,255,.06)';
    ctx.strokeStyle = overTrash ? '#f87171' : 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.fillText('🗑', t.x, t.y + 1);
  }
}

/* ================= TOOLBAR ================= */
function setMode(m) {
  mode = m; updateStatus();
  $('#mMove').classList.toggle('on', m === 'move'); $('#mErase').classList.toggle('on', m === 'erase'); $('#mCharge').classList.toggle('on', m === 'charge');
}
$('#mMove').onclick = () => setMode('move');
$('#mErase').onclick = () => setMode('erase');
$('#mCharge').onclick = () => { setMode(mode === 'charge' ? 'move' : 'charge'); if (mode === 'charge') toast('แตะอะตอมเพื่อเปลี่ยนประจุ 0 → +1 → −1 → +2 …', 2200); };
$('#bClear').onclick = () => { atoms = []; bonds = []; selectedId = null; changed(); };
function fillH(ids) {
  let added = 0;
  for (const id of ids.slice()) {
    const a = atomMap.get(id);
    if (!a || a.el === 'H' || E[a.el].metal) continue;
    const k = need(a); if (k <= 0) continue;
    let mx = 0, my = 0, cnt = 0;
    bondsOf(a.id).forEach(b => {
      const o = atomMap.get(b.a === a.id ? b.b : b.a), d = Math.hypot(o.x - a.x, o.y - a.y) || 1;
      mx += (o.x - a.x) / d; my += (o.y - a.y) / d; cnt++;
    });
    const base = cnt ? Math.atan2(-my, -mx) : -Math.PI / 2;
    for (let q = 0; q < k; q++) {
      const ang = cnt ? base + (q - (k - 1) / 2) * Math.min(1.2, 2.4 / Math.max(1, k - 1)) : base + q * 2 * Math.PI / k;
      const L = rpx(a.el) + rpx('H') + 26;
      const h = addAtom('H', a.x + Math.cos(ang) * L, a.y + Math.sin(ang) * L);
      addBond(a, h, 1); added++;
    }
  }
  return added;
}
$('#bFill').onclick = () => {
  const ids = selectedId != null && compOf.has(selectedId) ? comps[compOf.get(selectedId)] : atoms.map(a => a.id);
  const n = fillH(ids);
  if (!n) toast('ไม่มีพันธะว่างให้เติมไฮโดรเจน', 1500);
  changed();
};

// the free spot on the canvas farthest from existing atoms
function freeSpot(margin = 90) {
  let cx = W / 2, cy = H / 2, best = -1;
  for (let k = 0; k < 60; k++) {
    const x = margin + Math.random() * Math.max(1, W - 2 * margin), y = margin + Math.random() * Math.max(1, H - 2 * margin);
    const d = atoms.reduce((m, a) => Math.min(m, Math.hypot(a.x - x, a.y - y)), 1e9) - Math.hypot(x - W / 2, y - H / 2) * 0.15;
    if (d > best) { best = d; cx = x; cy = y; }
  }
  return [cx, cy];
}
// build a molecule from SMILES on the canvas; returns the created atoms
function buildSmiles(smiles, cx, cy) {
  if (cx == null) [cx, cy] = freeSpot();
  const g = parseSmiles(smiles);
  const made = g.atoms.map(a => addAtom(a.el, cx, cy, a.charge));
  g.bonds.forEach(([i, j, o]) => addBond(made[i], made[j], o));
  // tree layout (BFS) from atom 0; ring closures are pulled together by the physics
  const adj = made.map(() => []);
  g.bonds.forEach(([i, j]) => { adj[i].push(j); adj[j].push(i); });
  const seen = new Set([0]), queue = [[0, -1]];
  while (queue.length) {
    const [u, par] = queue.shift();
    const kids = adj[u].filter(v => !seen.has(v));
    const base = par < 0 ? -Math.PI / 2 : Math.atan2(made[u].y - made[par].y, made[u].x - made[par].x);
    kids.forEach((v, k) => {
      seen.add(v);
      const ang = par < 0 ? base + k * 2 * Math.PI / kids.length : base + (k - (kids.length - 1) / 2) * Math.min(1.1, 2.4 / Math.max(1, kids.length - 1));
      const L = bondLen2D(made[u], made[v], 1);
      made[v].x = made[u].x + Math.cos(ang) * L; made[v].y = made[u].y + Math.sin(ang) * L;
      queue.push([v, u]);
    });
  }
  // separate disconnected pieces ('.' in SMILES)
  made.forEach((a, i) => { if (!seen.has(i)) { a.x = cx + (Math.random() - .5) * 80; a.y = cy + 70; } });
  recomputeComps();
  for (let k = 0; k < 120; k++) physics();
  return made;
}
function buildCompound(id, cx, cy) {
  const d = speciesInfo(id);
  if (!d || !d.smiles) { toast('สารนี้สร้างด้วยแบบจำลองพันธะในห้องทดลองไม่ได้', 1800); return null; }
  const made = buildSmiles(d.smiles, cx, cy);
  selectedId = made[0].id; changed();
  return made;
}
/* ---------- searchable compound picker (ตัวอย่างสาร) ---------- */
const presetInput = $('#presetInput'), presetList = $('#presetList');
const normF = s => s.toLowerCase().replace(/[\^()\s·.]/g, '').replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 8320));
let presetItems = [], presetActive = 0;
function renderPresetList() {
  const q = presetInput.value.trim().toLowerCase(), qf = normF(q);
  presetItems = [];
  let html = '';
  const item = (d, extra = '') => {
    html += `<div class="combo-item${presetItems.length === presetActive ? ' active' : ''}" data-i="${presetItems.length}">
      <span>${d.th}${extra}</span><span class="combo-f">${fmt(d.f)}</span></div>`;
    presetItems.push(d);
  };
  if (!q) { // browse by category
    Object.entries(COMPOUND_CATS).forEach(([cat, label]) => {
      const list = DB.filter(d => d.cat === cat && d.smiles);
      if (!list.length) return;
      html += `<div class="combo-group">${label}</div>`;
      list.forEach(d => item(d));
    });
  } else { // ranked search: exact match > starts with > contains
    const rank = (s, t) => !t ? 9 : s === t ? 0 : s.startsWith(t) ? 1 : s.includes(t) ? 2 : 9;
    DB.filter(d => d.smiles).map((d, i) => {
      const th = d.th.toLowerCase(), en = d.en.toLowerCase(), f = normF(d.f);
      const thMain = th.split(/\s*\(/)[0], thAlt = (th.match(/\(([^)]*)\)/) || [])[1] || '';
      const score = Math.min(rank(thMain, q), rank(thAlt, q), rank(th, q) + .5, rank(en, q), rank(f, qf), COMPOUND_CATS[d.cat].includes(q) ? 3 : 9);
      return { d, i, score };
    }).filter(x => x.score < 9).sort((a, b) => a.score - b.score || a.i - b.i)
      .forEach(x => item(x.d, ` <span class="mut small">· ${COMPOUND_CATS[x.d.cat]}</span>`));
  }
  presetList.innerHTML = html || '<div class="combo-empty">ไม่พบสาร — ลองพิมพ์ชื่อไทย ชื่ออังกฤษ หรือสูตร เช่น H2SO4</div>';
}
function openPreset() { presetActive = 0; renderPresetList(); presetList.classList.add('show'); }
function closePreset() { presetList.classList.remove('show'); }
function pickPreset(i) {
  const d = presetItems[i]; if (!d) return;
  presetInput.value = ''; closePreset(); presetInput.blur();
  buildCompound(d.id);
}
function moveActive(k) {
  if (!presetItems.length) return;
  presetActive = (presetActive + k + presetItems.length) % presetItems.length;
  presetList.querySelectorAll('.combo-item').forEach(el => el.classList.toggle('active', +el.dataset.i === presetActive));
  const el = presetList.querySelector('.combo-item.active'); if (el) el.scrollIntoView({ block: 'nearest' });
}
presetInput.addEventListener('focus', openPreset);
presetInput.addEventListener('input', () => { presetActive = 0; renderPresetList(); presetList.classList.add('show'); });
presetInput.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); pickPreset(presetActive); }
  else if (e.key === 'Escape') { closePreset(); presetInput.blur(); }
});
// pointerdown (not click) so the pick happens before the input loses focus
presetList.addEventListener('pointerdown', e => { const it = e.target.closest('.combo-item'); if (it) { e.preventDefault(); pickPreset(+it.dataset.i); } });
document.addEventListener('pointerdown', e => { if (!e.target.closest('#presetBox')) closePreset(); });
