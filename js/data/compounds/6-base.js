'use strict';
/* สารประกอบหมวด: เบส (base)
   รูปแบบ: [สูตร, ชื่อไทย, ชื่ออังกฤษ, 'base', SMILES (null = สร้างในห้องทดลองไม่ได้), ข้อมูลเพิ่มเติม]
   ไอออนเขียนประจุหลัง ^ เช่น 'SO4^2-' · สารไอออนิกเขียนเป็นพันธะโลหะ–อโลหะหนึ่งหน่วยสูตร เช่น CaCO3 = O=C1O[Ca]O1 */
COMPOUND_RAW.push(
  ['NaOH', 'โซเดียมไฮดรอกไซด์ (โซดาไฟ)', 'Sodium hydroxide', 'base', '[Na]O', 'เบสแก่ กัดผิวหนัง ใช้ทำสบู่และล้างท่อ'],
  ['KOH', 'โพแทสเซียมไฮดรอกไซด์', 'Potassium hydroxide', 'base', '[K]O', 'เบสแก่'],
  ['LiOH', 'ลิเทียมไฮดรอกไซด์', 'Lithium hydroxide', 'base', '[Li]O'],
  ['Ca(OH)2', 'แคลเซียมไฮดรอกไซด์ (ปูนขาว)', 'Calcium hydroxide', 'base', 'O[Ca]O', 'สารละลายใสเรียกว่าน้ำปูนใส ใช้ทดสอบ CO₂'],
  ['Mg(OH)2', 'แมกนีเซียมไฮดรอกไซด์', 'Magnesium hydroxide', 'base', 'O[Mg]O', 'ใช้เป็นยาลดกรด (นมแมกนีเซีย)'],
  ['Ba(OH)2', 'แบเรียมไฮดรอกไซด์', 'Barium hydroxide', 'base', 'O[Ba]O'],
  ['Al(OH)3', 'อะลูมิเนียมไฮดรอกไซด์', 'Aluminium hydroxide', 'base', 'O[Al](O)O', 'ใช้เป็นยาลดกรด'],
  ['Fe(OH)2', 'เหล็ก(II) ไฮดรอกไซด์', 'Iron(II) hydroxide', 'base', 'O[Fe]O', 'ตะกอนสีเขียว'],
  ['Fe(OH)3', 'เหล็ก(III) ไฮดรอกไซด์', 'Iron(III) hydroxide', 'base', 'O[Fe](O)O', 'ตะกอนสีน้ำตาลแดง'],
  ['Cu(OH)2', 'คอปเปอร์(II) ไฮดรอกไซด์', 'Copper(II) hydroxide', 'base', 'O[Cu]O', 'ตะกอนสีฟ้า'],
);
