'use strict';
/* สารประกอบหมวด: สารประกอบโควาเลนต์ (covalent)
   รูปแบบ: [สูตร, ชื่อไทย, ชื่ออังกฤษ, 'covalent', SMILES (null = สร้างในห้องทดลองไม่ได้), ข้อมูลเพิ่มเติม]
   ไอออนเขียนประจุหลัง ^ เช่น 'SO4^2-' · สารไอออนิกเขียนเป็นพันธะโลหะ–อโลหะหนึ่งหน่วยสูตร เช่น CaCO3 = O=C1O[Ca]O1 */
COMPOUND_RAW.push(
  ['BF3', 'โบรอนไตรฟลูออไรด์', 'Boron trifluoride', 'covalent', 'FB(F)F', 'B มีอิเล็กตรอนล้อมรอบเพียง 6 ตัว (ไม่ครบออกเตต)'],
  ['BCl3', 'โบรอนไตรคลอไรด์', 'Boron trichloride', 'covalent', 'ClB(Cl)Cl'],
  ['NF3', 'ไนโตรเจนไตรฟลูออไรด์', 'Nitrogen trifluoride', 'covalent', 'FN(F)F'],
  ['NCl3', 'ไนโตรเจนไตรคลอไรด์', 'Nitrogen trichloride', 'covalent', 'ClN(Cl)Cl', 'ของเหลวที่ระเบิดได้ง่าย'],
  ['OF2', 'ออกซิเจนไดฟลูออไรด์', 'Oxygen difluoride', 'covalent', 'FOF'],
  ['PCl3', 'ฟอสฟอรัสไตรคลอไรด์', 'Phosphorus trichloride', 'covalent', 'ClP(Cl)Cl'],
  ['PCl5', 'ฟอสฟอรัสเพนตะคลอไรด์', 'Phosphorus pentachloride', 'covalent', 'ClP(Cl)(Cl)(Cl)Cl', 'P มีอิเล็กตรอนล้อมรอบ 10 ตัว (เกินออกเตต)'],
  ['SF4', 'ซัลเฟอร์เตตระฟลูออไรด์', 'Sulfur tetrafluoride', 'covalent', 'FS(F)(F)F'],
  ['SF6', 'ซัลเฟอร์เฮกซะฟลูออไรด์', 'Sulfur hexafluoride', 'covalent', 'FS(F)(F)(F)(F)F', 'แก๊สเฉื่อยและหนัก ใช้เป็นฉนวนไฟฟ้าแรงสูง'],
  ['ClF3', 'คลอรีนไตรฟลูออไรด์', 'Chlorine trifluoride', 'covalent', 'FCl(F)F', 'ตัวออกซิไดซ์ที่รุนแรงมาก'],
  ['XeF2', 'ซีนอนไดฟลูออไรด์', 'Xenon difluoride', 'covalent', 'F[Xe]F', 'หนึ่งในสารประกอบของแก๊สมีตระกูลที่เตรียมได้'],
  ['XeF4', 'ซีนอนเตตระฟลูออไรด์', 'Xenon tetrafluoride', 'covalent', 'F[Xe](F)(F)F'],
  ['SiCl4', 'ซิลิคอนเตตระคลอไรด์', 'Silicon tetrachloride', 'covalent', 'Cl[Si](Cl)(Cl)Cl'],
  ['SiF4', 'ซิลิคอนเตตระฟลูออไรด์', 'Silicon tetrafluoride', 'covalent', 'F[Si](F)(F)F'],
  ['CCl4', 'คาร์บอนเตตระคลอไรด์', 'Carbon tetrachloride', 'covalent', 'ClC(Cl)(Cl)Cl', 'ตัวทำละลายไม่มีขั้ว แม้พันธะ C–Cl จะมีขั้ว'],
  ['CF4', 'คาร์บอนเตตระฟลูออไรด์', 'Carbon tetrafluoride', 'covalent', 'FC(F)(F)F'],
  ['CS2', 'คาร์บอนไดซัลไฟด์', 'Carbon disulfide', 'covalent', 'S=C=S', 'ของเหลวระเหยง่าย ใช้เป็นตัวทำละลาย'],
);
