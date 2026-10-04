'use strict';
/* ================= PAGES ================= */
let page = 'lab';
const pageInit = { table: initPTable, reactions: initReactionsPage, decay: renderDecayPage, learn: initLearn, tools: renderTools };
const pageDone = {};
function showPage(p) {
  page = p;
  document.querySelectorAll('.page').forEach(s => s.classList.toggle('on', s.id === 'page-' + p));
  document.querySelectorAll('#nav [data-page]').forEach(b => b.classList.toggle('on', b.dataset.page === p));
  document.body.classList.toggle('doc-mode', p !== 'lab');
  if (!pageDone[p] && pageInit[p]) { pageInit[p](); pageDone[p] = true; }
  if (p === 'lab') requestAnimationFrame(resize2D);
}
$('#nav').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b) showPage(b.dataset.page); });
document.addEventListener('click', e => {
  const l = e.target.closest('[data-page-link]');
  if (l) { e.preventDefault(); showPage(l.dataset.pageLink); window.scrollTo({ top: 0 }); }
});

/* ================= LOOP ================= */
function frame() {
  if (page === 'lab') {
    physics(); physics();
    draw();
    if (needs3D) { needs3D = false; update3D(); }
    render3D();
  }
  requestAnimationFrame(frame);
}
resize2D();
init3D();
renderDiscovery();
changed();
renderInfo(null);
requestAnimationFrame(frame);
