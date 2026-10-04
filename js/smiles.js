'use strict';
/* ================= VALENCE & SMILES ================= */

// allowed bond counts for an element with formal charge q
function valOf(el, q = 0) {
  const e = E[el];
  if (!q) return e.val;
  if (e.metal) { const v = e.val.map(x => x - q).filter(x => x >= 0); return v.length ? v : [0]; }
  if (e.ve == null) return [0];
  const ve = e.ve - q;
  if (el === 'H' || el === 'He') return ve === 1 ? [1] : [0];
  if (ve <= 0 || ve >= 8) return [0];
  return ve <= 4 ? [ve] : [8 - ve];
}
const maxOf = (el, q) => { const v = valOf(el, q); return v[v.length - 1]; };
function lonePairs(el, q, usedBonds) {
  const e = E[el];
  if (e.metal || e.ve == null) return 0;
  return Math.max(0, Math.floor((e.ve - q - usedBonds) / 2));
}

/* SMILES subset: organic atoms B C N O P S F Cl Br I (implicit H), [bracket] atoms with H-count and charge,
   bonds - = #, branches ( ), ring closures 1-9, '.' for disconnected parts. Kekulé form only (no aromatic lowercase). */
function parseSmiles(s) {
  const atoms = [], bonds = [];
  const ORGANIC = ['Cl', 'Br', 'B', 'C', 'N', 'O', 'P', 'S', 'F', 'I'];
  let i = 0, prev = null, order = 1;
  const stack = [], rings = {};
  const add = (el, charge, hcount, implicit) => {
    if (!E[el]) throw new Error('unknown element ' + el);
    const idx = atoms.length;
    atoms.push({ el, charge, hcount, implicit });
    if (prev !== null) bonds.push([prev, idx, order]);
    prev = idx; order = 1;
    return idx;
  };
  while (i < s.length) {
    const c = s[i];
    if (c === '(') { stack.push(prev); i++; continue; }
    if (c === ')') { prev = stack.pop(); i++; continue; }
    if (c === '-') { order = 1; i++; continue; }
    if (c === '=') { order = 2; i++; continue; }
    if (c === '#') { order = 3; i++; continue; }
    if (c === '.') { prev = null; i++; continue; }
    if (/\d/.test(c)) {
      if (rings[c] !== undefined) { bonds.push([rings[c].atom, prev, Math.max(order, rings[c].order)]); delete rings[c]; }
      else rings[c] = { atom: prev, order };
      order = 1; i++; continue;
    }
    if (c === '[') {
      const end = s.indexOf(']', i);
      const m = s.slice(i + 1, end).match(/^([A-Z][a-z]?)(H(\d*))?([+-]+|[+-]\d+)?$/);
      if (!m) throw new Error('bad bracket atom ' + s.slice(i, end + 1));
      let q = 0;
      if (m[4]) q = /\d/.test(m[4]) ? parseInt(m[4]) : (m[4][0] === '+' ? 1 : -1) * m[4].length;
      add(m[1], q, m[2] ? (m[3] ? +m[3] : 1) : 0, false);
      i = end + 1; continue;
    }
    const sym = ORGANIC.find(o => s.startsWith(o, i));
    if (!sym) throw new Error('bad SMILES at ' + s.slice(i));
    add(sym, 0, 0, true); i += sym.length;
  }
  if (Object.keys(rings).length) throw new Error('unclosed ring');
  // expand hydrogens into explicit atoms
  const usedB = atoms.map(() => 0);
  bonds.forEach(([a, b, o]) => { usedB[a] += o; usedB[b] += o; });
  const n0 = atoms.length;
  for (let k = 0; k < n0; k++) {
    const a = atoms[k];
    let h = a.hcount;
    if (a.implicit) { const t = valOf(a.el, a.charge).find(v => v >= usedB[k]); h = t === undefined ? 0 : t - usedB[k]; }
    for (let q = 0; q < h; q++) { atoms.push({ el: 'H', charge: 0 }); bonds.push([k, atoms.length - 1, 1]); }
  }
  return { atoms: atoms.map(a => ({ el: a.el, charge: a.charge })), bonds };
}

// structural fingerprint: each atom's element+charge with its sorted neighbour list -> sorted multiset
function graphSignature(els, charges, bondList) {
  const nb = els.map(() => []);
  bondList.forEach(([a, b, o]) => { nb[a].push(els[b] + o); nb[b].push(els[a] + o); });
  return els.map((el, i) => el + (charges[i] || '') + ':' + nb[i].sort().join(',')).sort().join('|');
}

/* ---------- compound database ---------- */
let DB = [];
const DB_BY_ID = {};
function prepareDB() {
  DB = COMPOUND_RAW.map(([f, th, en, cat, smiles, info]) => {
    const pf = parseFormula(f);
    const d = { id: f, f, th, en, cat, smiles, info: info || '', charge: pf.charge, counts: pf.counts, hill: hillOf(pf.counts) };
    d.key = d.hill + '|' + d.charge;
    if (smiles) {
      const g = parseSmiles(smiles);
      d.graph = g;
      d.sig = graphSignature(g.atoms.map(a => a.el), g.atoms.map(a => a.charge), g.bonds);
    }
    return d;
  });
  DB.forEach(d => DB_BY_ID[d.id] = d);
}
// look up a species in an equation: compound id, or a free element symbol
function speciesInfo(f) {
  if (DB_BY_ID[f]) return DB_BY_ID[f];
  if (E[f]) return { id: f, f, th: E[f].th, en: E[f].en, element: true, smiles: `[${f}]`, charge: 0 };
  return null;
}

prepareDB();
