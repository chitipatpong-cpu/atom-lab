'use strict';
/* ================= INFO PANEL ================= */
function bondSummary(an) {
  const groups = new Map();
  an.B.forEach(b => {
    let x = an.A[b.i].el, y = an.A[b.j].el;
    if (enOf(x) > enOf(y)) [x, y] = [y, x];
    const key = x + ['', '–', '=', '≡'][b.order] + y;
    const g = groups.get(key) || { key, n: 0, b }; g.n++; groups.set(key, g);
  });
  return [...groups.values()].map(g => {
    const cls = g.b.ionic ? 'ไอออนิก' : g.b.polar ? 'มีขั้ว' : 'ไม่มีขั้ว';
    return `${g.key}${g.n > 1 ? ' ×' + g.n : ''} <span class="mut">· ΔEN ${g.b.d.toFixed(2)} · ${cls}</span>`;
  }).join('<br>');
}
const ionHTML = (el, q) => `${el}<sup>${chargeStr(q)}</sup>`;
// atomic weight: CIAAW standard value, or [A] = mass number of the longest-lived isotope
const massText = e => e.massStr.startsWith('[') ? `${e.massStr} <span class="mut">(เลขมวลของไอโซโทปที่อายุยืนที่สุด)</span>` : e.massStr + ' u';
const kToC = k => k == null ? '–' : `${(k - 273.15).toFixed(k > 1000 ? 0 : 1)} °C`;

function elementRows(e) {
  return [
    ['เลขอะตอม / มวลอะตอม', `${e.z} · ${massText(e)}`],
    ['ประเภท', `${CATEGORY_TH[e.cat]}${e.radioactive ? ' · <span style="color:var(--yellow)">☢ กัมมันตรังสี</span>' : ''}`],
    ['หมู่ / คาบ / บล็อก', `${e.group ?? '–'} / ${e.period} / ${e.block}`],
    ['การจัดเรียงอิเล็กตรอน', `${e.conf}<br><span class="mut">ระดับพลังงาน: ${e.shells.join(', ')}</span>`],
    ['อิเล็กโทรเนกาติวิตี (Pauling)', e.eneg ?? e.enNote ?? 'ไม่มีค่า'],
    ['สถานะที่ 25 °C', STATE_TH[e.state] || e.state],
    ['จุดหลอมเหลว / จุดเดือด', `${kToC(e.mp)} / ${kToC(e.bp)}`],
    ['เลขออกซิเดชันที่พบบ่อย', e.ox || '–'],
    ['ในห้องทดลองนี้', e.val[0] === 0 && e.val.length === 1 ? 'ไม่สร้างพันธะ' : `สร้างพันธะได้ ${e.val.join(' หรือ ')} พันธะ`],
  ];
}

function renderInfo(an) {
  const info = $('#info');
  if (!an) {
    info.innerHTML = `<div class="empty"><h2 style="font-weight:600;font-size:19px;margin:0 0 6px;color:var(--text)">ยังไม่มีโมเลกุล</h2>
      ลากธาตุจากแถบซ้ายมาวาง แล้วนำอะตอมไปชิดกันเพื่อสร้างพันธะ<br>หรือเลือกจาก <b>📦 ตัวอย่างสาร</b> (มีให้เลือกกว่า ${DB.filter(d => d.smiles).length} ชนิด)
      <br><br>💡 ลองสร้าง H₂ สองโมเลกุลกับ O₂ หนึ่งโมเลกุล แล้วดูหัวข้อ <b>⚗️ ปฏิกิริยาที่เกี่ยวข้อง</b></div>`;
    return;
  }
  const { A } = an;
  let title, sub, formula, mass = null;
  const counts = {}; A.forEach(a => counts[a.el] = (counts[a.el] || 0) + 1);
  mass = molarMass(counts);
  if (an.n === 1 && !an.charge) { const e = E[A[0].el]; title = `อะตอม${e.th}`; sub = e.en; formula = A[0].el; }
  else if (an.entry) { title = an.entry.th; sub = `${an.entry.en} · ${COMPOUND_CATS[an.entry.cat]}`; formula = an.entry.f; }
  else { title = !an.complete ? 'กำลังสร้างโมเลกุล…' : an.charge ? 'ไอออนที่ยังไม่อยู่ในสมุด' : 'สารที่ยังไม่อยู่ในสมุด'; sub = 'สูตรโมเลกุล (Hill)'; formula = an.label; }

  const badges = [];
  if (an.charge) badges.push(`<span class="badge b-ion">ไอออน ประจุ ${chargeStr(an.charge)}</span>`);
  if (an.n > 1) badges.push(an.ionic ? '<span class="badge b-ion">สารประกอบไอออนิก</span>' : '<span class="badge b-cov">โควาเลนต์</span>');
  if (!an.complete) badges.push('<span class="badge b-warn">ยังไม่เสถียร</span>');
  else if (an.n > 1 && !an.ionic && !an.charge) badges.push(an.polar ? '<span class="badge b-pol">โมเลกุลมีขั้ว</span>' : '<span class="badge b-np">โมเลกุลไม่มีขั้ว</span>');

  let issues = '';
  if (!an.complete) {
    const items = an.issues.map(x => {
      const a = A[x.i], name = `${a.q ? ionHTML(a.el, a.q) : a.el} (${E[a.el].th})`;
      return x.need > 0 ? `<li>${name} ต้องการพันธะอีก ${x.need}</li>` : `<li>${name} มีพันธะเกิน ${-x.need} — ลองเปลี่ยนประจุหรือลดพันธะ</li>`;
    }).join('');
    issues = `<div class="issues">อะตอมยังสร้างพันธะไม่ครบ:<ul>${items}</ul>ต่ออะตอมเพิ่ม, แตะพันธะเพื่อเปลี่ยนเป็นพันธะคู่, ใช้ <b>± ประจุ</b> หรือกด <b>＋H เติมไฮโดรเจน</b></div>`;
  }

  let rows = [];
  if (an.n === 1 && !an.charge) rows = elementRows(E[A[0].el]);
  else {
    if (mass != null) rows.push(['มวลโมเลกุล', `${mass.toFixed(2)} g/mol`]);
    if (an.ionic) rows.push(['ไอออน', [...new Set(A.map((a, i) => an.ion[i] ? ionHTML(a.el, an.ion[i]) : null).filter(Boolean))].join(', ')]);
    if (an.n === 2) rows.push(['รูปร่าง', 'เส้นตรง (โมเลกุลอะตอมคู่)']);
    else if (an.shape && !an.ionic) {
      const c = an.center, s = an.shape;
      rows.push(['รูปร่าง', `<b>${s.s[0]}</b> <span class="mut">(${s.s[1]})</span>`]);
      rows.push(['อะตอมกลาง', `${A[c].el} — พันธะ ${s.x} · คู่โดดเดี่ยว ${s.e} <span class="mut">(AX${s.x > 1 ? '<sub>' + s.x + '</sub>' : ''}${s.e ? 'E' + (s.e > 1 ? '<sub>' + s.e + '</sub>' : '') : ''})</span>`]);
      rows.push(['มุมพันธะ', s.s[2]]);
      if (an.centers.length > 1) {
        rows.push(['อะตอมกลางอื่น', an.centers.filter(i => i !== c).map(i => { const sh = an.shapeOf(i); return `${A[i].el}: ${sh ? sh.s[0] : '-'}`; }).join(', ')]);
      }
    }
    if (an.B.length) rows.push(['พันธะ', bondSummary(an)]);
    if (!an.ionic && an.complete && an.n > 1 && !an.charge) rows.push(['โมเมนต์ขั้วคู่รวม', an.polar ? `μ ≠ 0 <span class="mut">(≈ ${an.netMag.toFixed(2)} หน่วยสัมพัทธ์)</span>` : 'μ = 0']);
  }

  let ex = '', exCls = '';
  if (an.complete && an.charge) {
    ex = an.n === 1
      ? `${E[A[0].el].th}${an.charge > 0 ? 'เสีย' : 'รับ'}อิเล็กตรอน ${Math.abs(an.charge)} ตัว กลายเป็น${an.charge > 0 ? 'ไอออนบวก (แคตไอออน)' : 'ไอออนลบ (แอนไอออน)'} ${ionHTML(A[0].el, an.charge)}`
      : `เป็น<b>ไอออนหลายอะตอม</b> — อะตอมภายในยึดกันด้วยพันธะโควาเลนต์ แต่ทั้งกลุ่มมีประจุรวม ${chargeStr(an.charge)} จึงจับกับไอออนตรงข้ามเป็นสารประกอบไอออนิกได้`;
    exCls = 'ion';
  } else if (an.n > 1 && an.complete) {
    if (an.ionic) {
      const metals = [...new Set(A.filter(a => E[a.el].metal).map(a => E[a.el].th))].join(', ');
      const non = [...new Set(A.filter(a => !E[a.el].metal).map(a => E[a.el].th))].join(', ');
      ex = `<b>${metals}</b> (โลหะ) ให้อิเล็กตรอนแก่ <b>${non}</b> กลายเป็นไอออนบวกและไอออนลบ ซึ่งยึดกันด้วยแรงดึงดูดทางไฟฟ้า (พันธะไอออนิก) — ในของแข็งจริงไอออนจะเรียงตัวเป็น<b>โครงผลึก</b> ภาพนี้แสดงเพียงหนึ่งหน่วยสูตร`;
      exCls = 'ion';
    } else {
      const polarBonds = [...new Set(an.B.filter(b => b.polar).map(b => `${A[b.pos].el}–${A[b.neg].el}`))];
      const shapeName = an.n === 2 ? 'เส้นตรง' : an.shape ? an.shape.s[0] : '';
      const hasLP = an.LP.some(l => l.length);
      const c = an.center;
      const sameAround = c >= 0 && an.nb[c].every(j => A[j].el === A[an.nb[c][0]].el);
      if (!an.polar && !polarBonds.length) {
        ex = `ทุกพันธะมีผลต่างค่าอิเล็กโทรเนกาติวิตี (ΔEN) น้อยกว่า 0.4 จึงเป็น<b>พันธะโควาเลนต์ไม่มีขั้ว</b> และไม่มีอิเล็กตรอนคู่โดดเดี่ยวที่ทำให้ไม่สมมาตร → <b>โมเลกุลไม่มีขั้ว</b>`;
        exCls = 'np';
      } else if (!an.polar) {
        ex = `แม้จะมีพันธะมีขั้ว (${polarBonds.join(', ')}) แต่รูปร่าง<b>${shapeName}</b>มีความสมมาตร ทำให้ขั้วของพันธะ (ลูกศรสีเหลือง — ชี้ที่พันธะเพื่อดู) <b>หักล้างกันหมด</b> → <b>โมเลกุลไม่มีขั้ว</b>`;
        exCls = 'np';
      } else if (!polarBonds.length) {
        ex = `พันธะแทบไม่มีขั้ว แต่อะตอมกลางมี<b>อิเล็กตรอนคู่โดดเดี่ยว</b> ทำให้รูปร่าง<b>${shapeName}</b>ไม่สมมาตรและประจุกระจายไม่สม่ำเสมอ → <b>โมเลกุลมีขั้ว</b>`;
        exCls = 'pol';
      } else {
        let why;
        if (an.n === 2) why = 'มีเพียงพันธะเดียว จึงไม่มีพันธะอื่นมาหักล้าง';
        else if (hasLP) why = `อะตอมกลางมีอิเล็กตรอนคู่โดดเดี่ยว ทำให้รูปร่าง<b>${shapeName}</b>ไม่สมมาตร`;
        else if (!sameAround) why = `อะตอมที่ล้อมรอบอะตอมกลางไม่เหมือนกัน แม้รูปร่างจะเป็น${shapeName}ก็ตาม`;
        else why = 'การจัดเรียงตัวในสามมิติไม่สมมาตร';
        ex = `ขั้วของพันธะ (${polarBonds.join(', ')}) <b>ไม่หักล้างกัน</b> เพราะ${why} → <b>โมเลกุลมีขั้ว</b> (ชี้ที่อะตอมกลางเพื่อดูลูกศรสีชมพู ซึ่งแสดงทิศของโมเมนต์ขั้วคู่รวม ชี้ไปทางฝั่งที่เป็นลบ)`;
        exCls = 'pol';
      }
    }
  }
  const note = an.entry && an.entry.info ? `<div class="note">📌 ${an.entry.info}</div>` : '';
  const elLink = an.n === 1 ? `<button class="btn small" data-goto-el="${A[0].el}">🔬 ดูในตารางธาตุ</button>` : '';
  // header line, stat boxes and the remaining detail rows (same data as before, new layout)
  const isAtom = an.n === 1 && !an.charge;
  const catLine = isAtom ? `ธาตุ · ${CATEGORY_TH[E[A[0].el].cat]}` : an.entry ? `${COMPOUND_CATS[an.entry.cat]}` : an.charge ? 'ไอออน' : 'โมเลกุล';
  const enName = isAtom ? E[A[0].el].en : an.entry ? an.entry.en : '';
  let stats, hide;
  if (isAtom) {
    const e = E[A[0].el];
    stats = [['เลขอะตอม (Z)', e.z], ['มวลอะตอม', e.massStr], ['อิเล็กโทรเนกาติวิตี', e.eneg ?? (e.enNote ? '1.1–1.2' : '–'), 'c-green'], ['สถานะที่ 25 °C', STATE_TH[e.state] || e.state, 'c-acc']];
    hide = ['สถานะที่ 25 °C'];
  } else {
    const bondType = !an.complete ? ['ยังไม่ครบ', 'c-yellow'] : an.charge ? ['ไอออน ' + chargeStr(an.charge), 'c-yellow'] : an.ionic ? ['ไอออนิก', 'c-yellow']
      : an.n < 2 ? ['–', ''] : an.polar ? ['โควาเลนต์มีขั้ว', 'c-pink'] : ['โควาเลนต์ไม่มีขั้ว', 'c-green'];
    const shape = an.n === 2 ? 'เส้นตรง' : an.shape && !an.ionic ? an.shape.s[0] : '–';
    const angle = an.n === 2 ? '180°' : an.shape && !an.ionic ? an.shape.s[2] : '–';
    stats = [['มวลโมเลกุล (Mw)', mass != null ? mass.toFixed(2) + ' g/mol' : '–'], ['ชนิดพันธะ', bondType[0], bondType[1]], ['รูปร่าง', shape, 'c-acc'], ['มุมพันธะ', angle]];
    hide = ['มวลโมเลกุล', 'รูปร่าง', 'มุมพันธะ'];
    // physical data + source link from PubChem (see compound-refs.js)
    const ref = an.entry && typeof COMPOUND_REF !== 'undefined' ? COMPOUND_REF[an.entry.id] : null;
    if (ref && !an.charge) {
      const t = (v, note) => v != null ? v + ' °C' : note || 'ไม่มีข้อมูล';
      let state = '–';
      if (ref.mp != null && ref.mp > 25) state = 'ของแข็ง';
      else if (ref.bp != null && ref.bp < 25) state = 'แก๊ส';
      else if (ref.mp != null && ref.mp <= 25 && ref.bp != null) state = 'ของเหลว';
      stats.push(['จุดหลอมเหลว', t(ref.mp, ref.mpNote)], ['จุดเดือด', t(ref.bp, ref.bpNote)]);
      if (state !== '–') rows.push(['สถานะที่ 25 °C, 1 atm', state]);
    }
    if (ref) rows.push(['แหล่งข้อมูล', `<a href="https://pubchem.ncbi.nlm.nih.gov/compound/${ref.cid}" target="_blank" rel="noopener">PubChem CID ${ref.cid}</a>`]);
  }
  if (isAtom) rows.push(['แหล่งข้อมูล', `<a href="https://pubchem.ncbi.nlm.nih.gov/element/${E[A[0].el].z}" target="_blank" rel="noopener">PubChem</a> · มวลอะตอม: <a href="https://www.ciaaw.org/abridged-atomic-weights.htm" target="_blank" rel="noopener">CIAAW</a>`]);
  rows = rows.filter(([k]) => !hide.includes(k));
  const exHead = { pol: '🌡 สภาพขั้ว: โมเลกุลมีขั้ว', np: '🌡 สภาพขั้ว: โมเลกุลไม่มีขั้ว', ion: '⚡ ลักษณะพันธะ / ไอออน' }[exCls] || '';
  info.innerHTML = `<div class="info-cat"><span>${catLine}</span><span class="mono">${fmt(formula)}</span></div>
    <h2>${title}${enName ? ` <span class="mut" style="font-weight:500">(${enName})</span>` : ''}</h2>
    <div class="stats">${stats.map(([k, v, c]) => `<div class="stat"><span>${k}</span><b class="${c || ''}">${v}</b></div>`).join('')}</div>
    ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
    ${note}${issues}
    ${ex ? `<div class="explain ${exCls}"><span class="ex-h">${exHead}</span>${ex}</div>` : ''}
    ${rows.length ? `<dl class="rows">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
    ${elLink}
    <div id="rxRelated">${relatedReactionsHTML(an.species)}</div>`;
}
$('#info').addEventListener('click', e => {
  const g = e.target.closest('[data-goto-el]');
  if (g) { showPage('table'); showElement(g.dataset.gotoEl); }
});

/* ================= DISCOVERY ================= */
function renderDiscovery() {
  const pool = DB.filter(d => d.smiles);
  const got = pool.filter(d => discovered.has(d.id)).length;
  $('#counter').innerHTML = `🧪 ค้นพบ <b>${got}</b>/${pool.length}`;
  $('#discCount').textContent = `ค้นพบแล้ว ${got} จาก ${pool.length} สาร`;
  $('#chips').innerHTML = pool.map(d => discovered.has(d.id)
    ? `<span class="chip got" data-id="${d.id}" title="${d.th} — แตะเพื่อสร้างอีกครั้ง">${fmt(d.f)}</span>`
    : `<span class="chip" title="ยังไม่ค้นพบ — ลองสร้างดู!">${fmt(d.f)}</span>`).join('');
}
$('#chips').addEventListener('click', e => {
  const c = e.target.closest('.chip.got'); if (!c) return;
  const d = DB_BY_ID[c.dataset.id];
  toast(`${d.th} · ${fmt(d.f)}<br><span style="font-size:13px;opacity:.8">${d.en}</span>`, 1600);
  buildCompound(d.id);
});
$('#counter').onclick = () => { showPage('lab'); const d = $('#disc'); d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
