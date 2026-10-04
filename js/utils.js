'use strict';
const $ = s => document.querySelector(s);

/* ================= HELPERS ================= */
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(h, t, k) { const a = hexToRgb(h), b = hexToRgb(t); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
function isLight(h) { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) > 165; }
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const sup = n => n.toString().replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
function ballStyle(el) {
  const c = E[el].color;
  return `background:radial-gradient(circle at 32% 30%,${mix(c, '#ffffff', .55)},${c} 55%,${mix(c, '#000000', .35)});color:${isLight(c) ? '#1d2433' : '#fff'}`;
}
let toastTimer;
function toast(html, ms = 2600) {
  const t = $('#toast'); t.innerHTML = html; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
// bright "neon" display colour of an element for the dark UI (2D board, palette)
const NEON = { H: '#e6edf5', C: '#22d3ee', N: '#34d399', O: '#fb7185', F: '#a3e635', Cl: '#4ade80', Br: '#f59e0b', I: '#c084fc', S: '#38bdf8', P: '#c4b5fd', Na: '#d8b4fe', K: '#c084fc', Li: '#e879f9', Mg: '#bef264', Ca: '#5eead4', B: '#fda4af', Si: '#fcd34d' };
function neon(el) {
  if (NEON[el]) return NEON[el];
  const c = E[el].color, [r, g, b] = hexToRgb(c), L = 0.299 * r + 0.587 * g + 0.114 * b;
  return L < 110 ? mix(c, '#ffffff', .5) : L < 160 ? mix(c, '#ffffff', .25) : c;
}
