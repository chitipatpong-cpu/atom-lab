'use strict';
/* ================= FORMULAS =================
   parseFormula('Ca(OH)2')  -> { counts: {Ca:1,O:2,H:2}, charge: 0 }
   parseFormula('SO4^2-')   -> charge -2   (charges need '^': Fe^3+, OH^-)
   parseFormula('CuSO4·5H2O') handles hydrates */
function parseFormula(str) {
  let s = String(str).trim().replace(/\s+/g, '');
  let charge = 0;
  const cm = s.match(/\^(\d*)([+-])$/);
  if (cm) { charge = (cm[1] ? +cm[1] : 1) * (cm[2] === '+' ? 1 : -1); s = s.slice(0, cm.index); }
  const counts = {};
  const add = (c, k) => { for (const el in c) counts[el] = (counts[el] || 0) + c[el] * k; };
  for (const part of s.split(/[·.*]/)) {
    const m = part.match(/^(\d+)(.*)$/);
    const mult = m ? +m[1] : 1;
    add(parseGroup(m ? m[2] : part), mult);
  }
  return { counts, charge };
}
function parseGroup(s) {
  let i = 0;
  function group() {
    const c = {};
    while (i < s.length && s[i] !== ')' && s[i] !== ']') {
      let sub;
      if (s[i] === '(' || s[i] === '[') { i++; sub = group(); if (s[i] !== ')' && s[i] !== ']') throw new Error('วงเล็บไม่ครบ'); i++; }
      else {
        const m = s.slice(i).match(/^[A-Z][a-z]?/);
        if (!m) throw new Error(`อ่านสูตรไม่ได้ที่ "${s.slice(i)}"`);
        if (!E[m[0]]) throw new Error(`ไม่รู้จักธาตุ "${m[0]}"`);
        sub = { [m[0]]: 1 }; i += m[0].length;
      }
      const n = s.slice(i).match(/^\d+/);
      const k = n ? +n[0] : 1; if (n) i += n[0].length;
      for (const el in sub) c[el] = (c[el] || 0) + sub[el] * k;
    }
    return c;
  }
  const c = group();
  if (i < s.length) throw new Error('วงเล็บไม่ครบ');
  return c;
}
function hillOf(c) {
  const ks = Object.keys(c).filter(k => c[k]);
  const order = c.C ? ['C', ...(c.H ? ['H'] : []), ...ks.filter(k => k !== 'C' && k !== 'H').sort()] : ks.sort();
  return order.map(k => k + (c[k] > 1 ? c[k] : '')).join('');
}
const chargeStr = q => q ? (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−') : '';
// pretty HTML: subscripts for counts, superscript for charge
function fmt(f) {
  let s = String(f), ch = '';
  const cm = s.match(/\^(\d*)([+-])$/);
  if (cm) { ch = `<sup>${cm[1]}${cm[2] === '+' ? '+' : '−'}</sup>`; s = s.slice(0, cm.index); }
  return s.replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>') + ch;
}
function molarMass(counts) {
  let m = 0;
  for (const el in counts) { if (E[el].mass == null) return null; m += E[el].mass * counts[el]; }
  return m;
}

/* ---------- equations ---------- */
// "2H2 + O2 -> 2H2O" -> { left:[{coef,f}], right:[...], rev }
function parseEquation(eq) {
  const norm = eq.replace(/→|⟶|=>/g, '->').replace(/⇌|<->/g, '<=>').replace(/=(?!>)/g, '->');
  const rev = norm.includes('<=>');
  const sides = norm.split(/<=>|->/);
  if (sides.length !== 2) throw new Error('ต้องมีลูกศร -> หนึ่งตัวคั่นสารตั้งต้นกับผลิตภัณฑ์');
  // split on "+" that is not part of a charge (e.g. Fe^3+)
  const side = s => s.split(/(?<!\^\d*)\+/).map(t => t.trim()).filter(Boolean).map(t => {
    const m = t.match(/^(\d+)\s*(.+)$/);
    return { coef: m ? +m[1] : 1, f: (m ? m[2] : t).replace(/\((s|l|g|aq)\)$/i, '') };
  });
  const left = side(sides[0]), right = side(sides[1]);
  if (!left.length || !right.length) throw new Error('ต้องมีสารทั้งสองข้างของลูกศร');
  return { left, right, rev };
}
// atoms & charge conservation
function checkBalanced(p) {
  const tot = side => {
    const c = { '#q': 0 };
    side.forEach(t => { const pf = parseFormula(t.f); for (const el in pf.counts) c[el] = (c[el] || 0) + pf.counts[el] * t.coef; c['#q'] += pf.charge * t.coef; });
    return c;
  };
  const L = tot(p.left), R = tot(p.right);
  const keys = new Set([...Object.keys(L), ...Object.keys(R)]);
  for (const k of keys) if ((L[k] || 0) !== (R[k] || 0)) return false;
  return true;
}
// balance with exact rational Gaussian elimination (BigInt) -> smallest integer coefficients
function balanceEquation(str) {
  const p = parseEquation(str);
  const species = [...p.left, ...p.right].map(t => t.f);
  const parsed = species.map(parseFormula);
  const els = [...new Set(parsed.flatMap(x => Object.keys(x.counts)))];
  const rows = els.map(el => parsed.map((x, j) => BigInt((x.counts[el] || 0) * (j < p.left.length ? 1 : -1))));
  if (parsed.some(x => x.charge)) rows.push(parsed.map((x, j) => BigInt(x.charge * (j < p.left.length ? 1 : -1))));
  const n = species.length;
  // rational matrix as [num, den]
  const M = rows.map(r => r.map(v => [v, 1n]));
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  const norm = ([a, b]) => { if (b < 0n) { a = -a; b = -b; } const g = gcd(a, b) || 1n; return [a / g, b / g]; };
  const sub = (x, y) => norm([x[0] * y[1] - y[0] * x[1], x[1] * y[1]]);
  const mul = (x, y) => norm([x[0] * y[0], x[1] * y[1]]);
  const div = (x, y) => norm([x[0] * y[1], x[1] * y[0]]);
  const pivots = []; let r = 0;
  for (let c = 0; c < n && r < M.length; c++) {
    let k = r; while (k < M.length && M[k][c][0] === 0n) k++;
    if (k === M.length) continue;
    [M[r], M[k]] = [M[k], M[r]];
    const pv = M[r][c];
    M[r] = M[r].map(x => div(x, pv));
    for (let i = 0; i < M.length; i++) if (i !== r && M[i][c][0] !== 0n) { const f = M[i][c]; M[i] = M[i].map((x, j) => sub(x, mul(f, M[r][j]))); }
    pivots.push(c); r++;
  }
  const free = [...Array(n).keys()].filter(c => !pivots.includes(c));
  if (free.length === 0) throw new Error('ดุลสมการไม่ได้ — ตรวจสอบว่าสารทั้งสองข้างมีธาตุชุดเดียวกันหรือไม่');
  if (free.length > 1) throw new Error('สมการนี้ดุลได้หลายแบบ — ลองแยกเป็นหลายปฏิกิริยา');
  const fc = free[0];
  const sol = Array(n).fill(null); sol[fc] = [1n, 1n];
  pivots.forEach((c, i) => { sol[c] = norm([-M[i][fc][0], M[i][fc][1]]); });
  let lcm = 1n; sol.forEach(([, d]) => { lcm = lcm / gcd(lcm, d) * d; });
  let ints = sol.map(([a, d]) => a * (lcm / d));
  if (ints.some(v => v <= 0n)) {
    if (ints.every(v => v <= 0n)) ints = ints.map(v => -v);
    if (ints.some(v => v <= 0n)) throw new Error('ดุลไม่ได้ด้วยสัมประสิทธิ์บวก — สารบางตัวอาจอยู่ผิดข้าง');
  }
  const g = ints.reduce((a, b) => gcd(a, b));
  ints = ints.map(v => Number(v / g));
  p.left.forEach((t, i) => t.coef = ints[i]);
  p.right.forEach((t, i) => t.coef = ints[p.left.length + i]);
  return p;
}
function eqHTML(p, link) {
  const term = t => `<span class="term">${t.coef > 1 ? `<b class="coef">${t.coef}</b>` : ''}${link ? link(t.f) : fmt(t.f)}</span>`;
  return p.left.map(term).join(' <span class="op">+</span> ') + ` <span class="arrow">${p.rev ? '⇌' : '→'}</span> ` + p.right.map(term).join(' <span class="op">+</span> ');
}
