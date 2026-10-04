'use strict';
/* ================= STATE ================= */
let atoms = [], bonds = [], nextId = 1, selectedId = null, mode = 'move';
let atomMap = new Map(), comps = [], compOf = new Map(), bondSet = new Set();
let needs3D = true;
let discovered = new Set();
try { discovered = new Set(JSON.parse(localStorage.getItem('atomlab.discovered2') || '[]')); } catch (e) { }

const rpx = el => el === 'H' ? 15 : E[el].r > 1.15 ? 23 : 20;
const bondLen2D = (a, b, order) => rpx(a.el) + rpx(b.el) + (order > 1 ? 20 : 26);
const pairKey = (x, y) => x < y ? x + ':' + y : y + ':' + x;
function bondsOf(id) { return bonds.filter(b => b.a === id || b.b === id); }
function used(id) { let s = 0; for (const b of bonds) if (b.a === id || b.b === id) s += b.order; return s; }
function maxVal(a) { return maxOf(a.el, a.q); }
function need(a) { const u = used(a.id), t = valOf(a.el, a.q).find(x => x >= u); return t === undefined ? 0 : t - u; }
function canBond(a, b) {
  if (!a || !b || a.id === b.id) return false;
  if (E[a.el].metal && E[b.el].metal) return false;
  if (bondSet.has(pairKey(a.id, b.id))) return false;
  return used(a.id) < maxVal(a) && used(b.id) < maxVal(b);
}
function addAtom(el, x, y, q = 0) { const a = { id: nextId++, el, q, x, y, vx: 0, vy: 0, fx: 0, fy: 0 }; atoms.push(a); atomMap.set(a.id, a); return a; }
function addBond(a, b, order = 1) { bonds.push({ a: a.id, b: b.id, order }); bondSet.add(pairKey(a.id, b.id)); }
function deleteAtom(id) {
  bonds = bonds.filter(b => b.a !== id && b.b !== id);
  atoms = atoms.filter(a => a.id !== id);
  if (selectedId === id) selectedId = null;
}
function deleteComp(ids) { const s = new Set(ids); bonds = bonds.filter(b => !s.has(b.a)); atoms = atoms.filter(a => !s.has(a.id)); if (s.has(selectedId)) selectedId = null; }

function recomputeComps() {
  atomMap = new Map(atoms.map(a => [a.id, a]));
  bondSet = new Set(bonds.map(b => pairKey(b.a, b.b)));
  compOf = new Map(); comps = [];
  const adj = new Map(atoms.map(a => [a.id, []]));
  bonds.forEach(b => { adj.get(b.a).push(b.b); adj.get(b.b).push(b.a); });
  for (const a of atoms) {
    if (compOf.has(a.id)) continue;
    const ci = comps.length, list = [a.id]; compOf.set(a.id, ci);
    for (let k = 0; k < list.length; k++) for (const n of adj.get(list[k])) if (!compOf.has(n)) { compOf.set(n, ci); list.push(n); }
    comps.push(list);
  }
}

function changed() {
  recomputeComps();
  if (selectedId == null || !atomMap.has(selectedId)) selectedId = atoms.length ? atoms[atoms.length - 1].id : null;
  needs3D = true;
  $('#hint').style.display = atoms.length ? 'none' : '';
  if (typeof refreshRelated === "function") { refreshRelated(); refreshReady(); updateStatus(); }
  // discovery check
  for (const c of comps) {
    const id = identify(c);
    if (id.entry && !discovered.has(id.entry.id)) {
      discovered.add(id.entry.id);
      try { localStorage.setItem('atomlab.discovered2', JSON.stringify([...discovered])); } catch (e) { }
      toast(`🎉 ค้นพบสารใหม่!<br><span style="font-size:20px">${id.entry.th}</span> · ${fmt(id.entry.f)}`);
      renderDiscovery();
    }
  }
}

// species present on the canvas: id -> list of components (used by the reaction engine)
function labSpecies() {
  const out = {};
  for (const c of comps) {
    const s = identify(c).species;
    if (s) (out[s] = out[s] || []).push(c);
  }
  return out;
}
