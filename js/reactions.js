'use strict';
/* ================= REACTIONS ================= */
REACTIONS.forEach((r, i) => {
  r.i = i;
  r.p = parseEquation(r.eq);
  r.all = [...r.p.left, ...r.p.right];
  r.buildable = r.all.every(t => { const s = speciesInfo(t.f); return s && s.smiles; });
});
const spName = f => { const s = speciesInfo(f); return s ? s.th : f; };
const spLink = f => `<span class="sp" title="${spName(f)}">${fmt(f)}</span>`;
const dhBadge = dh => dh === 'exo' ? '<span class="badge b-exo">🔥 คายความร้อน</span>' : dh === 'endo' ? '<span class="badge b-endo">❄️ ดูดความร้อน</span>' : '';

function reactionsFor(id) {
  if (!id) return [];
  const asR = REACTIONS.filter(r => r.p.left.some(t => t.f === id));
  const asP = REACTIONS.filter(r => !asR.includes(r) && r.p.right.some(t => t.f === id));
  return [...asR, ...asP];
}
function reactionStatus(r, sp = labSpecies()) {
  const missing = r.p.left.map(t => ({ f: t.f, n: t.coef - (sp[t.f] ? sp[t.f].length : 0) })).filter(m => m.n > 0);
  return { ready: !missing.length, missing };
}
function relatedReactionsHTML(id) {
  const list = reactionsFor(id);
  if (!list.length) return '';
  const sp = labSpecies();
  const cards = list.slice(0, 8).map(r => {
    const st = reactionStatus(r, sp), T = REACTION_TYPES[r.type];
    let action;
    if (!r.buildable) action = `<span class="mut small" title="บางสารสร้างในห้องทดลองไม่ได้">ดูสมการ</span>`;
    else if (st.ready) action = `<button class="rr-btn go" data-rx-run="${r.i}">ทำปฏิกิริยา</button>`;
    else action = `<button class="rr-btn" data-rx-fill="${r.i}" title="เติมสารตั้งต้นที่ขาด: ${st.missing.map(m => `${m.n} ${m.f}`).join(', ')}">ทดลอง</button>`;
    return `<div class="rx-row" style="--c:${T[2]}">
      <div class="rx-row-main"><div class="rx-name">${r.th}</div><div class="rx-eq small mut">${eqHTML(r.p)}</div></div>
      ${action}</div>`;
  }).join('');
  return `<h3 class="sec">ปฏิกิริยาเคมีที่เกี่ยวข้อง <span class="mut">(${list.length})</span></h3>${cards}
    ${list.length > 8 ? `<button class="btn small" data-rx-more="${id}">ดูทั้งหมดในหน้าปฏิกิริยา →</button>` : ''}`;
}
// reactions whose reactants are all on the canvas right now → shown in the detector card under the build area
let readyIndex = 0, readyList = [];
function refreshReady() {
  const box = $('#rxReady'); if (!box) return;
  const sp = labSpecies();
  const prevId = readyList[readyIndex] && readyList[readyIndex].i;
  readyList = REACTIONS.filter(r => r.buildable && reactionStatus(r, sp).ready)
    // prefer reactions that combine several different substances, then the ones using more of what is on the table
    .sort((a, b) => b.p.left.length - a.p.left.length || b.p.left.reduce((s, t) => s + t.coef, 0) - a.p.left.reduce((s, t) => s + t.coef, 0));
  readyIndex = Math.max(0, readyList.findIndex(r => r.i === prevId));
  renderReady();
}
function renderReady() {
  const box = $('#rxReady');
  if (!readyList.length) {
    box.innerHTML = `<div class="rc-icon" style="filter:grayscale(1);opacity:.6">⚗</div>
      <div class="rc-body"><div class="rc-tags"><span class="rc-tag idle">รอสารตั้งต้น</span></div>
      <div class="rc-text mut" style="font-weight:500">วางสารให้ครบตามสมการ ระบบจะตรวจจับปฏิกิริยาที่เกิดได้ให้อัตโนมัติ</div></div>
      <div class="rc-act"><button class="react-btn" disabled>⚡ ทำปฏิกิริยาเคมี (REACT!)</button></div>`;
    return;
  }
  const r = readyList[readyIndex], T = REACTION_TYPES[r.type];
  const side = list => list.map(t => `${t.coef > 1 ? t.coef : ''}${fmt(t.f)}`).join(' + ');
  const prodNames = r.p.right.map(t => spName(t.f)).join(' และ ');
  box.innerHTML = `<div class="rc-icon">⚗</div>
    <div class="rc-body">
      <div class="rc-tags"><span class="rc-tag">● ตรวจพบสภาวะปฏิกิริยา</span><span class="rc-type">${T[0]}${r.cond ? ' · ' + r.cond : ''}</span></div>
      <div class="rc-text">ตรวจพบ: <span class="rx-eq">${side(r.p.left)}</span> ${r.p.rev ? '⇌' : '→'} พร้อมเกิดเป็น
        <span class="rx-eq prod">${side(r.p.right)}</span> <span class="mut" style="font-weight:500">(${prodNames})</span></div>
      <div class="mut small">${r.th}</div>
    </div>
    <div class="rc-act">
      <button class="react-btn" data-rx-run="${r.i}">⚡ ทำปฏิกิริยาเคมี (REACT!)</button>
      ${readyList.length > 1 ? `<div class="rc-pager"><button data-rr-step="-1">‹</button>${readyIndex + 1} / ${readyList.length}<button data-rr-step="1">›</button></div>` : ''}
    </div>`;
}
document.addEventListener('click', e => {
  const s = e.target.closest('[data-rr-step]');
  if (s) { readyIndex = (readyIndex + +s.dataset.rrStep + readyList.length) % readyList.length; renderReady(); }
});

function refreshRelated() {
  const box = $('#rxRelated'); if (!box) return;
  const c = selectedId != null && compOf.has(selectedId) ? comps[compOf.get(selectedId)] : null;
  box.innerHTML = relatedReactionsHTML(c ? identify(c).species : null);
}

/* ---------- running a reaction on the canvas ---------- */
let flash = null; // visual burst drawn by the builder
function fillReactants(r) {
  const sp = labSpecies();
  let built = 0;
  const sel = selectedId != null && compOf.has(selectedId) ? comps[compOf.get(selectedId)] : null;
  const near = sel ? sel.map(id => atomMap.get(id)) : null;
  r.p.left.forEach(t => {
    const have = sp[t.f] ? sp[t.f].length : 0;
    for (let k = have; k < t.coef; k++) {
      let cx, cy;
      if (near) { // place close to the selected molecule
        const mx = near.reduce((s, a) => s + a.x, 0) / near.length, my = near.reduce((s, a) => s + a.y, 0) / near.length;
        const ang = Math.random() * Math.PI * 2, d = 120 + built * 25;
        cx = Math.max(60, Math.min(W - 60, mx + Math.cos(ang) * d)); cy = Math.max(60, Math.min(H - 60, my + Math.sin(ang) * d));
      }
      buildSmiles(speciesInfo(t.f).smiles, cx, cy); built++;
    }
  });
  changed();
  toast(built ? `เติมสารตั้งต้น ${built} โมเลกุลแล้ว — กด ⚗️ ทำปฏิกิริยา ได้เลย` : 'สารตั้งต้นครบแล้ว', 2200);
}
function runReaction(r) {
  const sp = labSpecies();
  if (!reactionStatus(r, sp).ready) { toast('สารตั้งต้นยังไม่ครบ', 1500); return; }
  const sel = selectedId != null && compOf.has(selectedId) ? compOf.get(selectedId) : -1;
  const used = [];
  r.p.left.forEach(t => {
    // prefer the selected molecule, then the nearest ones
    const list = sp[t.f].slice().sort((a, b) => (compOf.get(b[0]) === sel) - (compOf.get(a[0]) === sel));
    used.push(...list.slice(0, t.coef));
  });
  const all = used.flat().map(id => atomMap.get(id));
  const cx = all.reduce((s, a) => s + a.x, 0) / all.length, cy = all.reduce((s, a) => s + a.y, 0) / all.length;
  used.forEach(c => deleteComp(c));
  recomputeComps();
  const total = r.p.right.reduce((s, t) => s + t.coef, 0);
  let k = 0, first = null;
  r.p.right.forEach(t => {
    for (let n = 0; n < t.coef; n++) {
      const ang = (k / total) * Math.PI * 2 - Math.PI / 2, d = total > 1 ? 50 + total * 14 : 0;
      const made = buildSmiles(speciesInfo(t.f).smiles, Math.max(60, Math.min(W - 60, cx + Math.cos(ang) * d)), Math.max(60, Math.min(H - 60, cy + Math.sin(ang) * d)));
      if (!first) first = made[0];
      k++;
    }
  });
  selectedId = first ? first.id : null;
  flash = { x: cx, y: cy, t0: performance.now(), color: r.dh === 'endo' ? '#5fd0e8' : '#ffb15c' };
  changed();
  toast(`⚗️ ${r.th}<br><span style="font-size:15px">${eqHTML(r.p)}</span>`, 3200);
}
document.addEventListener('click', e => {
  const run = e.target.closest('[data-rx-run]'), fill = e.target.closest('[data-rx-fill]');
  const tryIt = e.target.closest('[data-rx-try]'), more = e.target.closest('[data-rx-more]');
  if (run) runReaction(REACTIONS[+run.dataset.rxRun]);
  if (fill) fillReactants(REACTIONS[+fill.dataset.rxFill]);
  if (tryIt) {
    const r = REACTIONS[+tryIt.dataset.rxTry];
    showPage('lab');
    requestAnimationFrame(() => { resize2D(); fillReactants(r); });
  }
  if (more) { showPage('reactions'); $('#rxSearch').value = spName(more.dataset.rxMore); renderReactionsPage(); }
});

/* ---------- reactions page ---------- */
let rxType = 'all';
function renderReactionsPage() {
  const q = $('#rxSearch').value.trim().toLowerCase();
  const onlyLab = $('#rxLab').checked;
  const list = REACTIONS.filter(r => (rxType === 'all' || r.type === rxType) && (!onlyLab || r.buildable) &&
    (!q || r.th.toLowerCase().includes(q) || r.eq.toLowerCase().includes(q) || r.all.some(t => spName(t.f).toLowerCase().includes(q)) || (r.use || '').includes(q)));
  $('#rxCount').textContent = `${list.length} ปฏิกิริยา`;
  $('#rxList').innerHTML = list.map(r => {
    const T = REACTION_TYPES[r.type];
    const names = r.all.map(t => `${fmt(t.f)} = ${spName(t.f)}`).filter((v, i, s) => s.indexOf(v) === i).join(' · ');
    return `<article class="rx-card" style="--c:${T[2]}">
      <div class="rx-top"><span class="rx-type">${T[0]}</span>${dhBadge(r.dh)}${r.p.rev ? '<span class="badge b-cov">⇌ ผันกลับได้</span>' : ''}</div>
      <h3>${r.th}</h3>
      <div class="rx-eq big">${eqHTML(r.p, spLink)}</div>
      <div class="rx-names">${names}</div>
      <dl class="rows">
        ${r.cond ? `<dt>ภาวะ</dt><dd>${r.cond}</dd>` : ''}
        ${r.obs ? `<dt>สิ่งที่สังเกตได้</dt><dd>${r.obs}</dd>` : ''}
        ${r.use ? `<dt>ความสำคัญ</dt><dd>${r.use}</dd>` : ''}
      </dl>
      ${r.buildable ? `<button class="btn small go" data-rx-try="${r.i}">🧪 ลองในห้องทดลอง</button>` : '<span class="mut small">มีสารที่สร้างด้วยแบบจำลองพันธะในห้องทดลองไม่ได้</span>'}
    </article>`;
  }).join('') || '<div class="empty">ไม่พบปฏิกิริยา</div>';
}
function initReactionsPage() {
  const chips = [['all', 'ทั้งหมด', '#8ea3c6'], ...Object.entries(REACTION_TYPES).map(([k, v]) => [k, v[0], v[2]])];
  $('#rxTypes').innerHTML = chips.map(([k, label, c]) => `<button class="chipbtn${k === 'all' ? ' on' : ''}" data-type="${k}" style="--c:${c}">${label}</button>`).join('');
  $('#rxTypes').addEventListener('click', e => {
    const b = e.target.closest('[data-type]'); if (!b) return;
    rxType = b.dataset.type;
    $('#rxTypes').querySelectorAll('.chipbtn').forEach(x => x.classList.toggle('on', x === b));
    const T = REACTION_TYPES[rxType];
    $('#rxTypeInfo').innerHTML = T ? `<b>${T[0]}</b> — รูปทั่วไป: ${T[1]}` : '';
    renderReactionsPage();
  });
  $('#rxSearch').addEventListener('input', renderReactionsPage);
  $('#rxLab').addEventListener('change', renderReactionsPage);
  renderReactionsPage();
}
