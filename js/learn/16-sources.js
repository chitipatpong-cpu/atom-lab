'use strict';
/* หน้าความรู้เคมี — หัวข้อ: แหล่งอ้างอิงข้อมูล
   แก้เนื้อหาใน html ได้เลย · bt('สูตร') = ปุ่มสร้างโมเลกุลในห้องทดลอง */
ARTICLES.push({
  id: 'sources', icon: '📚', title: 'แหล่งอ้างอิงข้อมูล', html: () => `
<p>ข้อมูลในเว็บนี้ตรวจสอบกับแหล่งต่อไปนี้ (ตรวจสอบล่าสุด ตุลาคม ค.ศ. 2026)</p>
<table class="tbl"><thead><tr><th>ข้อมูล</th><th>แหล่งอ้างอิง</th></tr></thead><tbody>
<tr><td>สมบัติของธาตุทั้ง 118 ธาตุ (การจัดเรียงอิเล็กตรอน อิเล็กโทรเนกาติวิตี พลังงานไอออไนเซชัน จุดหลอมเหลว จุดเดือด ความหนาแน่น ปีที่ค้นพบ ประเภทธาตุ)</td><td><a href="https://pubchem.ncbi.nlm.nih.gov/periodic-table/" target="_blank" rel="noopener">PubChem Periodic Table</a> (National Institutes of Health, สหรัฐอเมริกา)</td></tr>
<tr><td>มวลอะตอมมาตรฐาน</td><td><a href="https://www.ciaaw.org/abridged-atomic-weights.htm" target="_blank" rel="noopener">CIAAW / IUPAC — Abridged standard atomic weights</a> · ธาตุที่ไม่มีไอโซโทปเสถียรแสดงเลขมวลของไอโซโทปที่อายุยืนที่สุดในวงเล็บ [ ] ตาม <a href="https://en.wikipedia.org/wiki/List_of_chemical_elements" target="_blank" rel="noopener">Wikipedia: List of chemical elements</a></td></tr>
<tr><td>อิเล็กโทรเนกาติวิตีที่ PubChem ไม่มี (Tb, Pm, Eu, Yb)</td><td><a href="https://en.wikipedia.org/wiki/Electronegativities_of_the_elements_(data_page)" target="_blank" rel="noopener">Electronegativities of the elements (data page)</a> — อ้างอิง Pauling (1960), Allred (1961), Huheey (1993)</td></tr>
<tr><td>ชื่อธาตุภาษาไทย</td><td><a href="https://www.wikidata.org/" target="_blank" rel="noopener">Wikidata</a></td></tr>
<tr><td>รัศมีโคเวเลนต์ (ใช้จัดความยาวพันธะในภาพ 3 มิติ)</td><td>B. Cordero et al., “Covalent radii revisited”, <i>Dalton Trans.</i> 2008, 2832–2838</td></tr>
<tr><td>สูตรและการระบุตัวตนของสารประกอบทั้ง ${DB.length} ชนิด</td><td><a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubChem</a> — ตรวจสูตรโมเลกุลกับ PubChem ครบทุกชนิด (แผงข้อมูลมีลิงก์ CID ของแต่ละสาร)</td></tr>
<tr><td>จุดหลอมเหลวและจุดเดือดของสารประกอบ</td><td>PubChem — Experimental Properties (ค่ามัธยฐานของข้อมูลที่รายงานที่ความดัน 1 atm)</td></tr>
<tr><td>ปฏิกิริยาคายหรือดูดความร้อน</td><td>คำนวณจาก ΔH°f มาตรฐานใน <a href="https://chem.libretexts.org/Ancillary_Materials/Reference/Reference_Tables/Thermodynamics_Tables/T1:_Standard_Thermodynamic_Quantities" target="_blank" rel="noopener">LibreTexts T1</a> (CRC Handbook of Chemistry and Physics, 84th ed.) และ <a href="https://en.wikipedia.org/wiki/Standard_enthalpy_of_formation" target="_blank" rel="noopener">Wikipedia: Standard enthalpy of formation</a></td></tr>
<tr><td>สภาวะของกระบวนการอุตสาหกรรม (ฮาเบอร์ สัมผัส ออสต์วาลด์ ฯลฯ)</td><td>บทความ Wikipedia ของแต่ละกระบวนการ เช่น <a href="https://en.wikipedia.org/wiki/Ostwald_process" target="_blank" rel="noopener">Ostwald process</a>, <a href="https://en.wikipedia.org/wiki/Haber_process" target="_blank" rel="noopener">Haber process</a>, <a href="https://en.wikipedia.org/wiki/Contact_process" target="_blank" rel="noopener">Contact process</a></td></tr>
<tr><td>ครึ่งชีวิตของไอโซโทป</td><td>NUBASE2020 (F.G. Kondev et al., <i>Chinese Physics C</i> 45, 030001, 2021) ผ่านบทความไอโซโทปใน Wikipedia</td></tr>
<tr><td>การเสริมไอโอดีนในเกลือของไทย</td><td><a href="https://doi.org/10.3390/foods12183513" target="_blank" rel="noopener">Foods 2023, 12, 3513</a></td></tr>
</tbody></table>
<h3>ข้อจำกัดของแบบจำลองในห้องทดลอง</h3>
<ul>
<li>รูปร่าง 3 มิติคำนวณด้วยแบบจำลอง VSEPR อย่างง่าย มุมพันธะที่แสดงเป็นค่าตามตำรา ไม่ใช่ผลคำนวณเชิงควอนตัม</li>
<li>ขนาดของขั้วรวม (μ) เป็นค่าสัมพัทธ์จาก ΔEN ไม่ใช่ค่าโมเมนต์ขั้วคู่จริงในหน่วยเดอบาย</li>
<li>สารไอออนิกแสดงเป็นหนึ่งหน่วยสูตร ส่วนของแข็งจริงเป็นโครงผลึก</li>
<li>สารที่มีอิเล็กตรอนเดี่ยว (NO, NO₂) และโครงผลึกร่างตาข่าย (SiO₂) สร้างด้วยแบบจำลองพันธะคู่อิเล็กตรอนไม่ได้</li>
</ul>` });
