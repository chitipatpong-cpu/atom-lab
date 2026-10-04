'use strict';
/* ================= CHEMISTRY ================= */
function identify(ids) {
  const A = ids.map(id => atomMap.get(id));
  const idx = new Map(ids.map((id, i) => [id, i]));
  const B = bonds.filter(b => idx.has(b.a)).map(b => ({ i: idx.get(b.a), j: idx.get(b.b), order: b.order }));
  const nb = A.map(() => []), usedV = A.map(() => 0);
  B.forEach(b => { nb[b.i].push(b.j); nb[b.j].push(b.i); usedV[b.i] += b.order; usedV[b.j] += b.order; });
  const issues = [];
  A.forEach((a, i) => {
    const v = valOf(a.el, a.q);
    if (!v.includes(usedV[i])) { const t = v.find(x => x >= usedV[i]); issues.push({ i, need: t === undefined ? v[v.length - 1] - usedV[i] : t - usedV[i] }); }
  });
  const counts = {}; let charge = 0;
  A.forEach(a => { counts[a.el] = (counts[a.el] || 0) + 1; charge += a.q || 0; });
  const hill = hillOf(counts), complete = !issues.length, n = A.length;
  const key = hill + '|' + charge;
  const sig = graphSignature(A.map(a => a.el), A.map(a => a.q || 0), B.map(b => [b.i, b.j, b.order]));
  const entry = complete && (n > 1 || charge) ? DB.find(d => d.key === key && d.sig === sig) : null;
  const species = entry ? entry.id : n === 1 && !charge ? A[0].el : null;
  const label = hill + (charge ? '^' + (Math.abs(charge) > 1 ? Math.abs(charge) : '') + (charge > 0 ? '+' : '-') : '');
  return { ids, A, B, nb, used: usedV, issues, complete, hill, label, charge, entry: entry || null, species, n };
}

// vector helpers for layout
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vlen = a => Math.hypot(a[0], a[1], a[2]);
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vadds = (a, b, s) => { a[0] += b[0] * s; a[1] += b[1] * s; a[2] += b[2] * s; return a; };
const vnorm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// VSEPR-style 3D layout: bond springs + angular repulsion between electron domains (bonds & lone pairs) on every center
function layout3D(A, B, nb, lp) {
  const n = A.length, rnd = mulberry32(7);
  const cx = A.reduce((s, a) => s + a.x, 0) / n, cy = A.reduce((s, a) => s + a.y, 0) / n;
  const P = A.map(a => [(a.x - cx) / 45, -(a.y - cy) / 45, (rnd() - 0.5) * 0.8]);
  const BL = new Map();
  B.forEach(b => {
    const f = b.order === 2 ? 0.87 : b.order === 3 ? 0.78 : 1;
    b.L = 1.25 * (E[A[b.i].el].r + E[A[b.j].el].r) * f;
    BL.set(b.i + ',' + b.j, b.L); BL.set(b.j + ',' + b.i, b.L);
  });
  const LP = A.map((a, i) => nb[i].length >= 2 && lp[i] > 0
    ? Array.from({ length: lp[i] }, () => vnorm([rnd() - .5, rnd() - .5, rnd() - .5])) : []);
  const close = new Set();
  for (let i = 0; i < n; i++) { for (const j of nb[i]) close.add(pairKey(i, j)); for (const k of nb[i]) for (const l of nb[i]) if (k !== l) close.add(pairKey(k, l)); }
  const doubles = B.filter(b => b.order === 2);
  const T = n > 30 ? 700 : 1200;
  for (let t = 0; t < T; t++) {
    const s = 0.12 * (1 - t / T) + 0.004;
    const D = P.map(() => [0, 0, 0]);
    for (let i = 0; i < n; i++) {
      const nbN = nb[i].length, m = nbN + LP[i].length;
      if (m < 2) continue;
      const U = nb[i].map(j => vnorm(vsub(P[j], P[i]))).concat(LP[i]);
      for (let a = 0; a < m; a++) {
        const F = [0, 0, 0];
        for (let b = 0; b < m; b++) {
          if (a === b) continue;
          const la = a >= nbN, lb = b >= nbN;
          const w = la && lb ? 1.7 : (la || lb) ? 1.35 : 1;
          const d = vsub(U[a], U[b]), r = Math.max(vlen(d), 0.05);
          vadds(F, d, w / (r * r * r));
        }
        vadds(F, U[a], -vdot(F, U[a]));
        const fl = vlen(F); if (fl > 3) { F[0] *= 3 / fl; F[1] *= 3 / fl; F[2] *= 3 / fl; }
        if (a >= nbN) { const u = LP[i][a - nbN]; vadds(u, F, s); const nu = vnorm(u); u[0] = nu[0]; u[1] = nu[1]; u[2] = nu[2]; }
        else { const j = nb[i][a]; vadds(D[j], F, s * BL.get(i + ',' + j)); }
      }
    }
    // soft repulsion between atoms further than 1-3 apart
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (close.has(pairKey(i, j))) continue;
      const d = vsub(P[j], P[i]), r = vlen(d) || 0.01;
      if (r < 3.2) { const f = (3.2 - r) * 0.03 / r; vadds(D[j], d, f); vadds(D[i], d, -f); }
    }
    // keep atoms around a double bond coplanar (sp2)
    for (const b of doubles) {
      const others = nb[b.i].filter(k => k !== b.j).concat(nb[b.j].filter(k => k !== b.i));
      if (others.length < 2) continue;
      const nrm = vcross(vsub(P[others[0]], P[b.i]), vsub(P[b.j], P[b.i]));
      if (vlen(nrm) < 1e-4) continue;
      const nn = vnorm(nrm);
      for (let k = 1; k < others.length; k++) vadds(D[others[k]], nn, -vdot(vsub(P[others[k]], P[b.i]), nn) * 0.1);
    }
    for (let i = 0; i < n; i++) vadds(P[i], D[i], 1);
    for (let it = 0; it < 3; it++) for (const b of B) {
      const d = vsub(P[b.j], P[b.i]), r = vlen(d) || 0.001, c = (r - b.L) / r * 0.5;
      vadds(P[b.i], d, c); vadds(P[b.j], d, -c);
    }
  }
  const cen = [0, 0, 0]; P.forEach(p => vadds(cen, p, 1 / n)); P.forEach(p => vadds(p, cen, -1));
  return { P, LP };
}

function analyze(ids) {
  const an = identify(ids);
  const { A, B, nb, used: u } = an;
  an.lp = A.map((a, i) => lonePairs(a.el, a.q || 0, u[i]));
  B.forEach(b => {
    const ea = enOf(A[b.i].el), eb = enOf(A[b.j].el);
    b.d = Math.abs(ea - eb);
    b.ionic = E[A[b.i].el].metal || E[A[b.j].el].metal;
    b.polar = !b.ionic && b.d >= 0.4;
    b.neg = ea >= eb ? b.i : b.j; b.pos = b.neg === b.i ? b.j : b.i;
  });
  an.ionic = B.some(b => b.ionic);
  const { P, LP } = layout3D(A, B, nb, an.lp);
  an.P = P; an.LP = LP;
  // dipole: polar bond vectors (δ+ → δ−) + lone-pair contributions
  const net = [0, 0, 0];
  B.forEach(b => { if (b.polar) vadds(net, vnorm(vsub(P[b.neg], P[b.pos])), b.d); });
  LP.forEach(list => list.forEach(v => vadds(net, v, 0.3)));
  an.net = net; an.netMag = vlen(net);
  an.polar = !an.ionic && !an.charge && an.n > 1 && an.netMag > 0.06;
  // partial charges
  an.q = A.map(() => 0);
  B.forEach(b => { if (b.polar) { an.q[b.neg] -= b.d; an.q[b.pos] += b.d; } });
  // ionic charges
  an.ion = A.map(a => a.q || 0); // formal charges + charges from ionic bonds
  B.forEach(b => {
    if (!b.ionic) return;
    const m = E[A[b.i].el].metal ? b.i : b.j, o = m === b.i ? b.j : b.i;
    an.ion[m] += b.order; an.ion[o] -= b.order;
  });
  // shapes
  const shapeOf = i => {
    const key = nb[i].length + ',' + (LP[i].length || 0);
    return SHAPES[key] ? { key, s: SHAPES[key], x: nb[i].length, e: LP[i].length } : null;
  };
  let center = -1;
  A.forEach((a, i) => {
    if (E[a.el].metal && an.ionic) return;
    if (center < 0 || nb[i].length > nb[center].length) center = i;
  });
  an.center = center;
  an.shape = center >= 0 && nb[center].length >= 2 ? shapeOf(center) : null;
  an.centers = A.map((a, i) => i).filter(i => nb[i].length >= 2 && !(E[A[i].el].metal && an.ionic));
  an.shapeOf = shapeOf;
  return an;
}
