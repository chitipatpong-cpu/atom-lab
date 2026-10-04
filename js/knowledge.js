'use strict';
/* ================= KNOWLEDGE PAGE ================= */
const bt = (id, label) => `<button class="btn small" data-build="${id}">🧪 ${label || fmt(id)}</button>`;
// each topic lives in js/learn/NN-*.js and pushes itself here (file order = menu order)
const ARTICLES = [];
let articleId = 'atom';
function renderLearn() {
  $('#toc').innerHTML = ARTICLES.map(a => `<button data-art="${a.id}" class="${a.id === articleId ? 'on' : ''}">${a.icon} ${a.title}</button>`).join('');
  const a = ARTICLES.find(x => x.id === articleId);
  $('#article').innerHTML = `<h2>${a.icon} ${a.title}</h2>${a.html()}`;
  $('#article').scrollTop = 0;
}
function initLearn() {
  $('#toc').addEventListener('click', e => { const b = e.target.closest('[data-art]'); if (b) { articleId = b.dataset.art; renderLearn(); window.scrollTo({ top: 0 }); } });
  renderLearn();
}
