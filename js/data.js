'use strict';
/* ================= DATA =================
   Elements come from elements.js (PubChem). This file holds compounds, reactions, isotopes and lookup tables. */

const E = {};
ELEMENT_LIST.forEach(e => { E[e.sym] = Object.assign({ num: e.z }, e); });
const enOf = el => E[el].eneg != null ? E[el].eneg : E[el].metal ? 1.3 : 2.5;

const CATEGORY_TH = {
  'Nonmetal': 'อโลหะ', 'Noble gas': 'แก๊สมีตระกูล', 'Alkali metal': 'โลหะแอลคาไล', 'Alkaline earth metal': 'โลหะแอลคาไลน์เอิร์ท',
  'Metalloid': 'ธาตุกึ่งโลหะ', 'Halogen': 'แฮโลเจน', 'Post-transition metal': 'โลหะหลังทรานซิชัน', 'Transition metal': 'โลหะทรานซิชัน',
  'Lanthanide': 'แลนทาไนด์', 'Actinide': 'แอกทิไนด์',
};
const CATEGORY_COLOR = {
  'Nonmetal': '#6ea8ff', 'Noble gas': '#5fd0e8', 'Alkali metal': '#ff7a7a', 'Alkaline earth metal': '#ffb15c',
  'Metalloid': '#c6b06b', 'Halogen': '#6fdc8c', 'Post-transition metal': '#9fb3c8', 'Transition metal': '#e8a0c8',
  'Lanthanide': '#b49cff', 'Actinide': '#ff8fb8',
};
const STATE_TH = { 'Solid': 'ของแข็ง', 'Liquid': 'ของเหลว', 'Gas': 'แก๊ส', 'Expected to be a Solid': 'คาดว่าเป็นของแข็ง', 'Expected to be a Gas': 'คาดว่าเป็นแก๊ส' };
// commonly used elements shown first in the lab palette
const COMMON = ['H', 'C', 'N', 'O', 'F', 'Cl', 'Br', 'I', 'S', 'P', 'B', 'Si', 'Li', 'Na', 'K', 'Mg', 'Ca', 'Ba', 'Al', 'Fe', 'Cu', 'Zn', 'Ag', 'Mn', 'Pb', 'Hg', 'Xe', 'He'];

/* ---------- VSEPR ---------- */
const SHAPES = {
  '2,0': ['เส้นตรง', 'Linear', '180°'],
  '3,0': ['สามเหลี่ยมแบนราบ', 'Trigonal planar', '120°'],
  '2,1': ['มุมงอ', 'Bent', '< 120°'],
  '4,0': ['ทรงสี่หน้า', 'Tetrahedral', '109.5°'],
  '3,1': ['พีระมิดฐานสามเหลี่ยม', 'Trigonal pyramidal', '≈ 107° (< 109.5°)'],
  '2,2': ['มุมงอ', 'Bent', '≈ 104.5° (< 109.5°)'],
  '5,0': ['พีระมิดคู่ฐานสามเหลี่ยม', 'Trigonal bipyramidal', '90° และ 120°'],
  '4,1': ['ทรงไม้กระดก', 'Seesaw', '< 90° และ < 120°'],
  '3,2': ['รูปตัว T', 'T-shaped', '< 90°'],
  '2,3': ['เส้นตรง', 'Linear', '180°'],
  '6,0': ['ทรงแปดหน้า', 'Octahedral', '90°'],
  '5,1': ['พีระมิดฐานสี่เหลี่ยม', 'Square pyramidal', '< 90°'],
  '4,2': ['สี่เหลี่ยมแบนราบ', 'Square planar', '90°'],
};

/* ---------- COMPOUNDS ----------
   [formula, Thai, English, category, SMILES (null = cannot be built with the lab's bond model), info]
   Ions use "formula^charge" e.g. 'SO4^2-'.
   Ionic solids are drawn as metal–nonmetal "bonds" (one formula unit), e.g. CaCO3 = O=C1O[Ca]O1. */
const COMPOUND_CATS = {
  element: 'ธาตุอิสระ', hydride: 'สารประกอบไฮโดรเจน', covalent: 'สารประกอบโควาเลนต์', oxide: 'ออกไซด์', acid: 'กรด', base: 'เบส',
  salt: 'เกลือ / สารไอออนิก', organic: 'สารอินทรีย์', ion: 'ไอออน',
};
// compounds are in js/data/compounds/*.js (one file per category)
const COMPOUND_RAW = [];

/* ---------- REACTIONS ----------
   eq: coefficients + formulas exactly as in COMPOUND_RAW (or element symbols); '->' one way, '<=>' reversible
   type: synth (การรวมตัว) | decomp (การสลายตัว) | single (แทนที่เดี่ยว) | double (แทนที่สองตำแหน่ง/ตกตะกอน)
         | neutral (กรด-เบส) | carbonate (กรด-คาร์บอเนต) | combust (การเผาไหม้) | redox | organic | bio | ionic (สมการไอออนสุทธิ)
   dh: exo (คายความร้อน) | endo (ดูดความร้อน) */
const REACTION_TYPES = {
  synth: ['การรวมตัว (สังเคราะห์)', 'A + B → AB', '#4cc9ff'],
  decomp: ['การสลายตัว', 'AB → A + B', '#ffb15c'],
  single: ['การแทนที่เดี่ยว', 'A + BC → AC + B', '#b49cff'],
  double: ['การแทนที่สองตำแหน่ง (ตกตะกอน)', 'AB + CD → AD + CB', '#ff8fb8'],
  neutral: ['กรด + เบส (การสะเทิน)', 'กรด + เบส → เกลือ + น้ำ', '#6fdc8c'],
  carbonate: ['กรด + คาร์บอเนต', 'กรด + คาร์บอเนต → เกลือ + น้ำ + CO₂', '#5fd0e8'],
  combust: ['การเผาไหม้', 'เชื้อเพลิง + O₂ → CO₂ + H₂O', '#ff7a7a'],
  redox: ['รีดอกซ์อื่น ๆ', 'มีการถ่ายโอนอิเล็กตรอน', '#e8a0c8'],
  organic: ['ปฏิกิริยาเคมีอินทรีย์', 'การเติม การแทนที่ เอสเทอริฟิเคชัน', '#c6b06b'],
  bio: ['ปฏิกิริยาในสิ่งมีชีวิต', 'การสังเคราะห์ด้วยแสง การหายใจ การหมัก', '#9be36b'],
  ionic: ['สมการไอออนสุทธิ', 'แสดงเฉพาะไอออนที่เกิดปฏิกิริยา', '#ffd23f'],
};
// reactions are in js/data/reactions/*.js (one file per type)
const REACTIONS = [];
// radioactive isotopes: js/data/isotopes.js
