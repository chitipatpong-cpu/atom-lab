'use strict';
/* ================= 3D VIEWER ================= */
let R = null, lastSig = null, current = null, labelItems = [];
// showDip / showLP = "always show"; otherwise details appear only for the hovered (or tapped) atom/bond
const view = { autoRotate: true, showDip: false, showLP: false, zoom: 1, fitDist: 8 };
let hover = null; // { kind: 'atom' | 'bond', i }
const BASE_TILT = () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -0.45, 0));
function init3D() {
  if (typeof THREE === 'undefined') { $('#v3dmsg').textContent = 'โหลดไลบรารี 3 มิติไม่สำเร็จ (ต้องต่ออินเทอร์เน็ต)'; return; }
  try {
    const canvas = $('#c3d');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.position.set(0, 0, 8);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.95); d1.position.set(3, 4, 6); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x8fb4ff, 0.45); d2.position.set(-4, -2, -3); scene.add(d2);
    const group = new THREE.Group(); scene.add(group);
    group.quaternion.copy(BASE_TILT());
    R = { renderer, scene, camera, group, sphereGeo: new THREE.SphereGeometry(1, 40, 28), mats: {}, hit: [], reveal: [], atomMeshes: [] };
    const ro = new ResizeObserver(() => {
      const r = $('#v3d').getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); fitCamera();
    });
    ro.observe($('#v3d'));
    setup3DControls(canvas);
  } catch (e) { $('#v3dmsg').textContent = 'อุปกรณ์นี้ไม่รองรับ WebGL'; R = null; }
}
function setup3DControls(canvas) {
  const ptrs = new Map(); let pinch0 = 0, zoom0 = 1, down = null;
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    if (!R || !R.hit.length) return null;
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, R.camera);
    const hit = raycaster.intersectObjects(R.hit, false)[0];
    return hit ? hit.object.userData : null;
  }
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    down = { x: e.clientX, y: e.clientY, moved: false };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = view.zoom; }
  });
  canvas.addEventListener('pointermove', e => {
    if (!R) return;
    if (!ptrs.has(e.pointerId)) { // mouse hovering without a button pressed
      if (e.pointerType === 'mouse') { const h = pick(e); setHover(h); canvas.style.cursor = h ? 'pointer' : 'grab'; }
      return;
    }
    const prev = ptrs.get(e.pointerId), dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.moved = true;
    if (!down || !down.moved) return;
    canvas.style.cursor = 'grabbing';
    if (ptrs.size === 1) {
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.01);
      const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.01);
      R.group.quaternion.premultiply(qy).premultiply(qx);
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      view.zoom = Math.max(0.4, Math.min(3, zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / (pinch0 || 1)));
      fitCamera();
    }
  });
  const up = e => {
    // a tap (no drag) selects what's under the finger — touch screens have no hover
    if (e.type === 'pointerup' && down && !down.moved && ptrs.size === 1 && e.pointerType !== 'mouse') setHover(pick(e));
    ptrs.delete(e.pointerId);
    if (!ptrs.size) { down = null; canvas.style.cursor = 'grab'; }
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !ptrs.size) setHover(null); });
  canvas.addEventListener('wheel', e => { e.preventDefault(); view.zoom = Math.max(0.4, Math.min(3, view.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); fitCamera(); }, { passive: false });
  view.isDragging = () => ptrs.size > 0;
}
function fitCamera() {
  if (!R) return;
  const asp = Math.min(1, R.camera.aspect);
  R.camera.position.set(0, 0, view.fitDist / asp / view.zoom);
}
function mat(key, make) { return R.mats[key] || (R.mats[key] = make()); }
const dispR = el => 0.2 + 0.26 * E[el].r;
function cyl(a, b, r, material) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 18, 1), material);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
function arrow(from, to, r, material, perp) {
  const g = new THREE.Group();
  const d = new THREE.Vector3().subVectors(to, from), L = d.length(), dir = d.clone().normalize();
  const head = Math.min(0.3, L * 0.38);
  const shaftEnd = to.clone().addScaledVector(dir, -head);
  g.add(cyl(from, shaftEnd, r, material));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 2.7, head, 20), material);
  cone.position.copy(shaftEnd).addScaledVector(dir, head / 2);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  g.add(cone);
  if (perp) { // "+" crossed tail of a dipole arrow
    const c = from.clone().addScaledVector(dir, Math.min(0.16, L * 0.2));
    g.add(cyl(c.clone().addScaledVector(perp, -0.11), c.clone().addScaledVector(perp, 0.11), r, material));
  }
  return g;
}
function perpOf(d, ref) {
  let p = ref ? ref.clone().addScaledVector(d, -ref.dot(d)) : new THREE.Vector3();
  if (p.length() < 1e-3) { p = new THREE.Vector3(0, 1, 0).cross(d); if (p.length() < 1e-3) p = new THREE.Vector3(1, 0, 0).cross(d); }
  return p.normalize();
}
function clearGroup(g) {
  while (g.children.length) {
    const c = g.children.pop();
    c.traverse(o => { if (o.geometry && o.geometry !== R.sphereGeo) o.geometry.dispose(); });
  }
}
function addLabel(html, pos, cls) {
  const el = document.createElement('div');
  el.className = 'lb ' + cls; el.innerHTML = html;
  $('#labels').appendChild(el);
  labelItems.push({ el, pos });
  return el;
}
// register something that is hidden until its atom/bond is hovered (or its "always show" toggle is on)
function reveal(obj, kind, atomsIdx, bondsIdx) {
  R.reveal.push({ obj, kind, atoms: new Set(atomsIdx), bonds: new Set(bondsIdx) });
}
function applyReveal() {
  if (!R) return;
  for (const it of R.reveal) {
    const always = it.kind === 'lp' ? view.showLP : view.showDip;
    const hovered = hover && (hover.kind === 'atom' ? it.atoms.has(hover.i) : it.bonds.has(hover.i));
    const show = always || !!hovered;
    if (it.obj.isObject3D) it.obj.visible = show; else it.obj.style.display = show ? '' : 'none';
  }
  R.atomMeshes.forEach((m, i) => m.scale.setScalar(m.userData.r * (hover && hover.kind === 'atom' && hover.i === i ? 1.12 : 1)));
}
function setHover(h) {
  const nh = h ? { kind: h.kind, i: h.i } : null;
  if ((nh && hover && nh.kind === hover.kind && nh.i === hover.i) || (!nh && !hover)) return;
  hover = nh;
  applyReveal();
  const tip = $('#tip');
  if (!hover || !current) { tip.classList.remove('show'); return; }
  tip.innerHTML = hover.kind === 'atom' ? atomTip(current, hover.i) : bondTip(current, hover.i);
  tip.classList.add('show');
}
const BOND_NAME = ['', 'พันธะเดี่ยว', 'พันธะคู่', 'พันธะสาม'];
function atomTip(an, i) {
  const a = an.A[i], e = E[a.el], lines = [];
  lines.push(`<div class="t-head">${a.el}<small>${e.th} · ${e.en}</small></div>`);
  if (an.ion[i]) {
    const n = Math.abs(an.ion[i]);
    lines.push(`<div class="${an.ion[i] > 0 ? 'pos' : 'neg'}">ไอออน ${a.el}<sup>${n > 1 ? n : ''}${an.ion[i] > 0 ? '+' : '−'}</sup> — ${an.ion[i] > 0 ? 'ให้' : 'รับ'}อิเล็กตรอน ${n} ตัว</div>`);
  } else if (an.q[i] < -0.01) lines.push(`<div class="neg">δ− ประจุลบบางส่วน — ดึงอิเล็กตรอนในพันธะเข้าหาตัว</div>`);
  else if (an.q[i] > 0.01) lines.push(`<div class="pos">δ+ ประจุบวกบางส่วน — อิเล็กตรอนถูกดึงออกไป</div>`);
  else lines.push(`<div class="mut">ไม่มีประจุย่อย</div>`);
  lines.push(`<div>EN ${e.eneg ?? e.enNote ?? "–"} · พันธะ ${an.nb[i].length} · คู่โดดเดี่ยว ${an.lp[i]}</div>`);
  if (i === an.center && an.shape && !an.ionic) {
    lines.push(`<div>อะตอมกลาง: <b>${an.shape.s[0]}</b> <span class="mut">${an.shape.s[2]}</span></div>`);
    if (an.complete) lines.push(`<div class="${an.polar ? 'pink' : ''}">ขั้วรวม: ${an.polar ? 'μ ≠ 0 → โมเลกุลมีขั้ว' : 'μ = 0 → โมเลกุลไม่มีขั้ว'}</div>`);
  }
  return lines.join('');
}
function bondTip(an, k) {
  const b = an.B[k], A = an.A, x = A[b.i].el, y = A[b.j].el;
  const ea = E[x].eneg, eb = E[y].eneg, lines = [];
  lines.push(`<div class="t-head">${x}${['', '–', '=', '≡'][b.order]}${y}<small>${BOND_NAME[b.order]}</small></div>`);
  lines.push(`<div>ΔEN = |${Math.max(ea, eb)} − ${Math.min(ea, eb)}| = <b>${b.d.toFixed(2)}</b></div>`);
  if (b.ionic) lines.push(`<div style="color:var(--yellow)">พันธะไอออนิก — แรงดึงดูดระหว่างไอออนบวกกับไอออนลบ</div>`);
  else if (b.polar) lines.push(`<div>พันธะโควาเลนต์<b>มีขั้ว</b> — อิเล็กตรอนเอนไปทาง <span class="neg">${A[b.neg].el} (δ−)</span></div>`);
  else lines.push(`<div class="mut">พันธะโควาเลนต์ไม่มีขั้ว (ΔEN &lt; 0.4)</div>`);
  return lines.join('');
}
function buildScene(an) {
  if (!R) return;
  clearGroup(R.group); $('#labels').innerHTML = ''; labelItems = [];
  R.hit = []; R.reveal = []; R.atomMeshes = [];
  hover = null; $('#tip').classList.remove('show');
  R.group.quaternion.copy(BASE_TILT());
  setViewChips(an);
  if (!an) return;
  const V = THREE.Vector3;
  const P = an.P.map(p => new V(p[0], p[1], p[2]));
  const incident = an.A.map(() => []);
  an.B.forEach((b, k) => { incident[b.i].push(k); incident[b.j].push(k); });

  an.A.forEach((a, i) => {
    const m = new THREE.Mesh(R.sphereGeo, mat('a' + a.el, () => new THREE.MeshStandardMaterial({ color: E[a.el].color, roughness: 0.32, metalness: 0.08 })));
    const r = dispR(a.el); m.scale.setScalar(r); m.position.copy(P[i]);
    m.userData = { kind: 'atom', i, r };
    R.group.add(m); R.hit.push(m); R.atomMeshes.push(m);
    addLabel(a.el, P[i], 'sym' + (isLight(E[a.el].color) ? ' dark' : ''));
  });
  an.B.forEach((b, k) => {
    const pa = P[b.i], pb = P[b.j], d = new V().subVectors(pb, pa).normalize();
    const ud = { kind: 'bond', i: k };
    if (b.ionic) {
      const m = cyl(pa, pb, 0.035, mat('ionic', () => new THREE.MeshStandardMaterial({ color: 0xffd23f, transparent: true, opacity: 0.45 })));
      m.userData = ud; R.group.add(m); R.hit.push(m); return;
    }
    let ref = null;
    const n1 = an.nb[b.i].find(x => x !== b.j); if (n1 !== undefined) ref = new V().subVectors(P[n1], pa);
    else { const n2 = an.nb[b.j].find(x => x !== b.i); if (n2 !== undefined) ref = new V().subVectors(P[n2], pb); }
    const perp = perpOf(d, ref);
    const offs = b.order === 1 ? [0] : b.order === 2 ? [-0.075, 0.075] : [-0.11, 0, 0.11];
    const rad = b.order === 1 ? 0.075 : b.order === 2 ? 0.05 : 0.042;
    const mid = pa.clone().lerp(pb, 0.5);
    const ma = mat('b' + an.A[b.i].el, () => new THREE.MeshStandardMaterial({ color: mix(E[an.A[b.i].el].color, '#ffffff', .35), roughness: .4 }));
    const mb = mat('b' + an.A[b.j].el, () => new THREE.MeshStandardMaterial({ color: mix(E[an.A[b.j].el].color, '#ffffff', .35), roughness: .4 }));
    offs.forEach(o => {
      const s = pa.clone().addScaledVector(perp, o), e = pb.clone().addScaledVector(perp, o), mm = mid.clone().addScaledVector(perp, o);
      [cyl(s, mm, rad, ma), cyl(mm, e, rad, mb)].forEach(c => { c.userData = ud; R.group.add(c); R.hit.push(c); });
    });
  });
  // bond dipole arrows (δ+ → δ−)
  const yellow = mat('dip', () => new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0x6a5200, roughness: .35 }));
  an.B.forEach((b, k) => {
    if (!b.polar) return;
    const pp = P[b.pos], pn = P[b.neg], d = new V().subVectors(pn, pp).normalize();
    const mid = pp.clone().lerp(pn, 0.5);
    const perp = perpOf(d, mid.length() > 0.05 ? mid.clone() : null);
    const off = 0.24 + Math.max(dispR(an.A[b.pos].el), dispR(an.A[b.neg].el)) * 0.45;
    const from = pp.clone().addScaledVector(d, dispR(an.A[b.pos].el) * 0.6).addScaledVector(perp, off);
    const to = pn.clone().addScaledVector(d, -dispR(an.A[b.neg].el) * 0.6).addScaledVector(perp, off);
    const ar = arrow(from, to, 0.032, yellow, perp);
    R.group.add(ar); reveal(ar, 'dip', [b.i, b.j], [k]);
  });
  // partial charge / ion labels
  an.A.forEach((a, i) => {
    let txt = '';
    if (an.ion[i]) txt = (Math.abs(an.ion[i]) > 1 ? Math.abs(an.ion[i]) : '') + (an.ion[i] > 0 ? '+' : '−');
    else if (an.q[i] > 0.01) txt = 'δ+'; else if (an.q[i] < -0.01) txt = 'δ−';
    if (!txt) return;
    const out = P[i].length() > 0.1 ? P[i].clone().normalize() : new V(0.7, 0.7, 0).normalize();
    const pos = P[i].clone().addScaledVector(out, dispR(a.el) + 0.32);
    const color = txt.includes('+') ? '#ffb3b3' : '#9fd8ff';
    const el = addLabel(`<span style="color:${color}">${an.ion[i] ? a.el + '<sup>' + txt + '</sup>' : txt}</span>`, pos, 'delta');
    reveal(el, 'dip', [i], incident[i]);
  });
  // lone pairs
  const lpMat = mat('lp', () => new THREE.MeshStandardMaterial({ color: 0xb58cff, emissive: 0x2b1660, transparent: true, opacity: 0.42, roughness: .3, depthWrite: false }));
  const eMat = mat('e', () => new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7a5cff }));
  an.LP.forEach((list, i) => list.forEach(u => {
    const dir = new V(u[0], u[1], u[2]);
    const c = P[i].clone().addScaledVector(dir, dispR(an.A[i].el) + 0.22);
    const g = new THREE.Group();
    const lobe = new THREE.Mesh(R.sphereGeo, lpMat);
    lobe.scale.set(0.15, 0.3, 0.15); lobe.position.copy(c);
    lobe.quaternion.setFromUnitVectors(new V(0, 1, 0), dir); g.add(lobe);
    const p = perpOf(dir, null);
    [-1, 1].forEach(sg => { const e = new THREE.Mesh(R.sphereGeo, eMat); e.scale.setScalar(0.04); e.position.copy(c).addScaledVector(p, 0.065 * sg).addScaledVector(dir, 0.08); g.add(e); });
    R.group.add(g); reveal(g, 'lp', [i], []);
  }));
  // net dipole: shown with "show all", or when hovering the central atom
  if (an.polar) {
    const nd = new V(...an.net).normalize(), len = 1.1 + Math.min(1.6, an.netMag);
    const pinkMat = mat('net', () => new THREE.MeshBasicMaterial({ color: 0xff5fd2, transparent: true, opacity: .92, depthTest: false }));
    const ar = arrow(nd.clone().multiplyScalar(-len / 2), nd.clone().multiplyScalar(len / 2), 0.045, pinkMat, null);
    ar.traverse(o => { o.renderOrder = 10; });
    R.group.add(ar);
    const centerIdx = an.center >= 0 ? [an.center] : [];
    reveal(ar, 'dip', centerIdx, []);
    reveal(addLabel('μ', nd.clone().multiplyScalar(len / 2 + 0.3), 'net'), 'dip', centerIdx, []);
  }
  applyReveal();
  // fit
  let rad = 0.8; an.A.forEach((a, i) => rad = Math.max(rad, P[i].length() + dispR(a.el) + 0.3));
  view.fitDist = rad / Math.tan(20 * Math.PI / 180) * 1.12; view.zoom = 1; fitCamera();
  
}
const _v = () => new THREE.Vector3();
function hoverPoint() {
  if (!hover || !current) return null;
  const p = current.P;
  if (hover.kind === 'atom') return _v().set(...p[hover.i]);
  const b = current.B[hover.i];
  return _v().set(...p[b.i]).lerp(_v().set(...p[b.j]), 0.5);
}
function render3D() {
  if (!R) return;
  if (view.autoRotate && !hover && !(view.isDragging && view.isDragging()))
    R.group.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.005));
  R.renderer.render(R.scene, R.camera);
  const el = $('#v3d'), w = el.clientWidth, h = el.clientHeight;
  const v = new THREE.Vector3(), mw = R.group.matrixWorld;
  // tooltip follows the hovered atom / bond
  const hp = hoverPoint();
  if (hp) {
    hp.applyMatrix4(mw).project(R.camera);
    const x = (hp.x + 1) / 2 * w, y = (1 - hp.y) / 2 * h, tip = $('#tip');
    tip.classList.toggle('below', y < 120);
    tip.style.left = Math.max(110, Math.min(w - 110, x)) + 'px'; tip.style.top = y + 'px';
  }
  if (!labelItems.length) return;
  const zs = labelItems.map(it => { v.copy(it.pos).applyMatrix4(mw); return v.z; });
  const zmin = Math.min(...zs), zmax = Math.max(...zs);
  labelItems.forEach((it, k) => {
    v.copy(it.pos).applyMatrix4(mw).project(R.camera);
    const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
    const t = zmax - zmin > 0.01 ? (zs[k] - zmin) / (zmax - zmin) : 1;
    it.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    it.el.style.opacity = (0.35 + 0.65 * t).toFixed(2);
    it.el.style.zIndex = Math.round(t * 100);
  });
}
function toggle(btn, key, after) {
  $(btn).onclick = () => { view[key] = !view[key]; $(btn).classList.toggle('on', view[key]); after && after(); };
}
toggle('#tDip', 'showDip', applyReveal);
toggle('#tLP', 'showLP', applyReveal);
toggle('#tRot', 'autoRotate');
$('#tReset').onclick = () => { if (R) { R.group.quaternion.copy(BASE_TILT()); view.zoom = 1; fitCamera(); } };

function update3D() {
  const sel = selectedId != null && compOf.has(selectedId) ? comps[compOf.get(selectedId)] : null;
  let sig = '';
  if (sel) {
    const set = new Set(sel);
    sig = sel.slice().sort((a, b) => a - b).join(',') + '|' + bonds.filter(b => set.has(b.a)).map(b => `${b.a}-${b.b}-${b.order}`).sort().join(',');
  }
  if (sig === lastSig) return;
  lastSig = sig;
  current = sel ? analyze(sel) : null;
  buildScene(current);
  renderInfo(current);
  updateStatus();
}

// overlay chips on the 3D card: shape (top-right), bond angle + polarity (bottom-left), hybridisation from the steric number
const HYBRID = { 2: 'SP', 3: 'SP²', 4: 'SP³', 5: 'SP³D', 6: 'SP³D²' };
function setViewChips(an) {
  let chip = '', angle = '', hyb = '—';
  if (an) {
    const c = an.center, s = an.shape && !an.ionic ? an.shape : null;
    if (an.n === 1) chip = an.charge ? fmt(an.label) : an.A[0].el;
    else if (an.ionic) chip = 'Ionic (ไอออนิก)';
    else if (an.n === 2) chip = 'Linear (เส้นตรง)';
    else if (s) chip = `${s.s[1]} (${an.A[c].el})`;
    if (an.n === 2 && !an.ionic) angle = '∠ 180° (เส้นตรง)';
    else if (s) angle = `∠ ${s.s[2]} (${s.s[0]})`;
    if (an.complete && an.n > 1 && !an.ionic && !an.charge) angle += (angle ? ' · ' : '') + (an.polar ? 'μ ≠ 0 มีขั้ว' : 'μ = 0 ไม่มีขั้ว');
    if (s) hyb = `${an.A[c].el}: ${HYBRID[s.x + s.e] || '—'} HYBRID`;
  }
  $('#vchip').innerHTML = chip; $('#vAngle').innerHTML = angle; $('#vHybrid').textContent = hyb;
}
