/* =====================================================================
   استيراد بيانات التواصل من «ملف حصر الشراكات» داخل المنصة
   بيانات ضباط الاتصال (الاسم والبريد والجوال) لا تُكتب في شيفرة المنصة لأن المستودع عام؛
   تُقرأ هنا من ملف Excel على جهاز المستخدم وتُحفظ في بيانات المنصة (المحمية في المنصة المشتركة).
   قارئ XLSX مصغّر بلا مكتبات: فك الضغط بـ DecompressionStream وقراءة XML بـ DOMParser.
   ===================================================================== */
async function readXlsxFirstSheet(file) {
  const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer);
  let e = buf.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('الملف ليس ملف Excel صالحًا (xlsx).');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  const files = {}, dec = new TextDecoder();
  for (let i = 0; i < n; i++) {
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
    files[dec.decode(buf.subarray(p + 46, p + 46 + nl))] = { method, csize, lho }; p += 46 + nl + el + cl;
  }
  const get = async (name) => {
    const f = files[name]; if (!f) return null;
    const off = f.lho + 30 + dv.getUint16(f.lho + 26, true) + dv.getUint16(f.lho + 28, true), data = buf.subarray(off, off + f.csize);
    if (f.method === 0) return dec.decode(data);
    if (typeof DecompressionStream === 'undefined') throw new Error('المتصفح لا يدعم قراءة ملفات Excel. استخدم Chrome أو Edge.');
    return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  };
  const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
  const sst = await get('xl/sharedStrings.xml');
  const strings = sst ? [...xml(sst).getElementsByTagName('si')].map((si) => [...si.getElementsByTagName('t')].map((t) => t.textContent).join('')) : [];
  // أول ورقة بترتيب المصنف
  let target = 'xl/worksheets/sheet1.xml';
  try {
    const wb = xml(await get('xl/workbook.xml')), rels = xml(await get('xl/_rels/workbook.xml.rels'));
    const first = wb.getElementsByTagName('sheet')[0], rid = first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const rel = [...rels.getElementsByTagName('Relationship')].find((r) => r.getAttribute('Id') === rid);
    if (rel) target = 'xl/' + rel.getAttribute('Target').replace(/^\/?xl\//, '').replace(/^\//, '');
  } catch (_) { /* نستخدم الورقة الأولى الافتراضية */ }
  const sh = await get(target); if (!sh) throw new Error('تعذّرت قراءة الورقة الأولى من الملف.');
  const rows = {};
  for (const c of xml(sh).getElementsByTagName('c')) {
    const ref = c.getAttribute('r') || '', m = ref.match(/^([A-Z]+)(\d+)$/); if (!m) continue;
    const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0];
    let val = t === 's' ? strings[+(v && v.textContent)] : t === 'inlineStr' ? [...c.getElementsByTagName('t')].map((x) => x.textContent).join('') : v ? v.textContent : '';
    (rows[+m[2]] = rows[+m[2]] || {})[m[1]] = String(val == null ? '' : val).trim();
  }
  return rows;
}
async function importContactsFromXlsx(file) {
  const rows = await readXlsxFirstSheet(file);
  const head = rows[2] || {}, col = (re) => Object.keys(head).find((k) => re.test(head[k] || ''));
  const cN = col(/اسم الشراكة/), cC = col(/ضابط الاتصال/), cE = col(/البريد/), cP = col(/الجوال|الهاتف/);
  if (!cN || !(cC || cE || cP)) throw new Error('لم أجد أعمدة «اسم الشراكة» وبيانات التواصل في الصف الثاني من الملف. تأكد أنه ملف حصر الشراكات.');
  const nk = (x) => String(x || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[()\s]+/g, ' ').trim();
  let n = 0, miss = 0;
  for (const r of Object.keys(rows).map(Number).filter((x) => x >= 3).sort((a, b) => a - b)) {
    const row = rows[r], name = row[cN]; if (!name) continue;
    const name2 = (typeof REAL_V2 !== 'undefined' && (REAL_V2.records.find((x) => x.row === r) || {}).title) || name;
    const p = D.partnerships.find((x) => !x.demo && x.realRow === r) || D.partnerships.find((x) => !x.demo && (nk(x.title) === nk(name) || nk(x.title) === nk(name2)));
    const vals = { contactName: (row[cC] || '').replace(/\s+/g, ' '), contactEmail: (row[cE] || '').trim(), contactPhone: (row[cP] || '').replace(/\.0$/, '') };
    if (/^5\d{8}$/.test(vals.contactPhone)) vals.contactPhone = '0' + vals.contactPhone;
    if (!vals.contactName && !vals.contactEmail && !vals.contactPhone) continue;
    if (!p) { miss++; continue; }
    let ch = false; Object.entries(vals).forEach(([k, v]) => { if (v && p[k] !== v) { p[k] = v; ch = true; } });
    if (ch) { await Repo.save('partnerships', p); n++; }
  }
  await Repo.log('contacts.import', 'system', 'import', 'استيراد بيانات التواصل من ملف الحصر', `${n} شراكة${miss ? `، ${miss} صف بلا شراكة مطابقة` : ''}`);
  return { n, miss };
}
