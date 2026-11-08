/* =====================================================================
   ملف Excel منسّق لسجل الشراكات (عدة أوراق، بخط المنصة)
   - «ملخص»: أرقام المحفظة حسب الحالة والقطاع والمسؤول.
   - «الشراكات»: صف لكل شراكة بأعمدة مختصرة، والحالة ملوّنة، والتواريخ تواريخ حقيقية قابلة للفرز.
   - «التفاصيل»: النصوص الطويلة (مجالات التعاون، الأثر، المخرجات، الملاحظات، التوصيات).
   - «الجهات المستهدفة»: الجهات المدرجة في ملف الحصر دون شراكة بعد.
   - «بصيغة ملف الحصر»: الأعمدة الأصلية نفسها لمن يحتاج المطابقة مع الملف القديم.
   الخط: IBM Plex Sans Arabic (خط المنصة). إن لم يكن مثبتًا على الجهاز يعرض Excel خطًا بديلًا.
   ===================================================================== */
const XL_FONT = 'IBM Plex Sans Arabic';
const XL_C = { petrol: 'FF0B3F38', petrol2: 'FF1F6B5C', gold: 'FFB08A3E', sand: 'FFF6F1E4', line: 'FFD9E3DF', ink: 'FF14201B', mut: 'FF5E6B65', zebra: 'FFF7FAF9', white: 'FFFFFFFF' };
const XL_ST = { // ألوان الحالات (خلفية، نص)
  active: ['FFDDF1E6', 'FF1E6B4A'], soon: ['FFFBEBCB', 'FF8A5A00'], upcoming: ['FFDCEAF7', 'FF1F5A8A'], nodates: ['FFE8EEF0', 'FF4A5A60'],
  prep: ['FFF3ECDC', 'FF7A5C1E'], sign: ['FFF8E6CF', 'FF8A4B12'], hold: ['FFF1E3E3', 'FF8A3B3B'], ended: ['FFECEEEE', 'FF6B7370'], cancel: ['FFF6DEDA', 'FF9A2F22'], draft: ['FFEDEDED', 'FF666666'],
};
/* سجل أنماط: يحوّل وصف النمط إلى فهرس xf مع إزالة التكرار */
function xlStyles() {
  const fonts = [], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'], borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'], xfs = [], numFmts = [];
  const idx = (arr, x) => { let i = arr.indexOf(x); if (i < 0) { arr.push(x); i = arr.length - 1; } return i; };
  const key = new Map();
  const get = (o = {}) => {
    const k = JSON.stringify(o); if (key.has(k)) return key.get(k);
    const f = o.font || {};
    const fi = idx(fonts, `<font>${f.b ? '<b/>' : ''}<sz val="${f.sz || 10}"/><color rgb="${f.color || XL_C.ink}"/><name val="${XL_FONT}"/><family val="2"/><charset val="178"/></font>`);
    const fl = o.fill ? idx(fills, `<fill><patternFill patternType="solid"><fgColor rgb="${o.fill}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
    const b = o.border === 'none' ? 0 : idx(borders, o.border === 'bottom' ? `<border><left/><right/><top/><bottom style="medium"><color rgb="${o.bcolor || XL_C.gold}"/></bottom><diagonal/></border>` : `<border><left style="thin"><color rgb="${XL_C.line}"/></left><right style="thin"><color rgb="${XL_C.line}"/></right><top style="thin"><color rgb="${XL_C.line}"/></top><bottom style="thin"><color rgb="${XL_C.line}"/></bottom><diagonal/></border>`);
    let nf = 0; if (o.numFmt) { const ni = numFmts.indexOf(o.numFmt); nf = 164 + (ni < 0 ? numFmts.push(o.numFmt) - 1 : ni); }
    const a = o.align || {};
    xfs.push(`<xf numFmtId="${nf}" fontId="${fi}" fillId="${fl}" borderId="${b}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"${nf ? ' applyNumberFormat="1"' : ''}><alignment horizontal="${a.h || 'right'}" vertical="${a.v || 'center'}"${a.wrap === false ? '' : ' wrapText="1"'} readingOrder="2"${a.indent ? ` indent="${a.indent}"` : ''}/></xf>`);
    key.set(k, xfs.length - 1); return xfs.length - 1;
  };
  get({}); // 0: الافتراضي
  const xml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${numFmts.length ? `<numFmts count="${numFmts.length}">${numFmts.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${xmlEsc(f)}"/>`).join('')}</numFmts>` : ''}<fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="${borders.length}">${borders.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  return { get, xml };
}
const xlDate = (iso) => { const d = parseDate(iso); return d ? Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 864e5) : ''; };
/* ورقة: rows = [{ ht, cells: [{ v, s }] }] */
function xlSheetXML(sh) {
  const cell = (r, c, x) => {
    if (x == null) return '';
    const ref = colName(c) + r, s = x.s || 0, v = x.v;
    if (typeof v === 'number') return `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
    if (v === '' || v == null) return `<c r="${ref}" s="${s}"/>`;
    return `<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  };
  const rows = sh.rows.map((row, ri) => `<row r="${ri + 1}"${row.ht ? ` ht="${row.ht}" customHeight="1"` : ''}>${row.cells.map((x, ci) => cell(ri + 1, ci, x)).join('')}</row>`).join('');
  const fr = sh.freeze || {};
  const pane = fr.row || fr.col ? `<pane${fr.col ? ` xSplit="${fr.col}"` : ''}${fr.row ? ` ySplit="${fr.row}"` : ''} topLeftCell="${colName(fr.col || 0)}${(fr.row || 0) + 1}" activePane="${fr.row && fr.col ? 'bottomRight' : fr.row ? 'bottomLeft' : 'topRight'}" state="frozen"/>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr>${sh.tab ? `<tabColor rgb="${sh.tab}"/>` : ''}<pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView rightToLeft="1" showGridLines="0" workbookViewId="0"${sh.zoom ? ` zoomScale="${sh.zoom}"` : ''}>${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>
<sheetData>${rows}</sheetData>
${sh.filter ? `<autoFilter ref="${sh.filter}"/>` : ''}
${(sh.merges || []).length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}
<pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
<headerFooter><oddFooter>&amp;C&amp;"${XL_FONT}"&amp;8${xmlEsc(D.settings.org.name)} — صفحة &amp;P من &amp;N</oddFooter></headerFooter>
</worksheet>`;
}
function xlBook(sheets, st) {
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
  const wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="${sheets.findIndex((s) => s.active) >= 0 ? sheets.findIndex((s) => s.active) : 0}"/></bookViews><sheets>${sheets.map((s, i) => `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><definedNames>${sheets.map((s, i) => (s.filter ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlEsc(s.name)}'!$${s.filter.replace(/:/, ':$').replace(/([A-Z]+)(\d+)/g, '$1$$$2')}</definedName>` : '') + (s.printTitles ? `<definedName name="_xlnm.Print_Titles" localSheetId="${i}">'${xmlEsc(s.name)}'!$${s.printTitles}:$${s.printTitles}</definedName>` : '')).join('')}</definedNames></workbook>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  return zipStore([
    { name: '[Content_Types].xml', data: ct },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: wb },
    { name: 'xl/_rels/workbook.xml.rels', data: rels },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: xlSheetXML(s) })),
    { name: 'xl/styles.xml', data: st.xml() },
  ]);
}
/* تقدير ارتفاع صف فيه نص ملتف (Excel لا يحسبه تلقائيًا للملفات المولّدة) */
const xlHt = (cells, widths, min = 22, max = 150) => {
  let lines = 1;
  cells.forEach((v, i) => { if (typeof v !== 'string' || !v) return; const per = Math.max(8, (widths[i] || 12) * 1.7); const l = v.split('\n').reduce((t, s) => t + Math.max(1, Math.ceil(s.length / per)), 0); lines = Math.max(lines, l); });
  return Math.min(max, Math.max(min, Math.round(lines * 14.5 + 8)));
};

function exportPartnershipsXlsx(list, base) {
  if (!list.length) return toast('لا توجد سجلات لتصديرها ضمن الفلاتر الحالية.', 'err');
  const S = xlStyles(), org = D.settings.org, contacts = can('view.contacts'), internal = can('view.internal');
  const T = {
    title: S.get({ font: { b: 1, sz: 18, color: XL_C.petrol }, border: 'none', align: { wrap: false } }),
    sub: S.get({ font: { sz: 10, color: XL_C.mut }, border: 'none', align: { wrap: false } }),
    band: S.get({ fill: XL_C.gold, border: 'none' }),
    head: S.get({ font: { b: 1, sz: 10.5, color: XL_C.white }, fill: XL_C.petrol, align: { h: 'center' } }),
    cell: S.get({ font: { sz: 10 } }), cellZ: S.get({ font: { sz: 10 }, fill: XL_C.zebra }),
    name: S.get({ font: { b: 1, sz: 10.5, color: XL_C.petrol } }), nameZ: S.get({ font: { b: 1, sz: 10.5, color: XL_C.petrol }, fill: XL_C.zebra }),
    num: S.get({ font: { sz: 10, color: XL_C.mut }, align: { h: 'center' } }), numZ: S.get({ font: { sz: 10, color: XL_C.mut }, fill: XL_C.zebra, align: { h: 'center' } }),
    date: S.get({ font: { sz: 10 }, numFmt: 'dd/mm/yyyy', align: { h: 'center' } }), dateZ: S.get({ font: { sz: 10 }, fill: XL_C.zebra, numFmt: 'dd/mm/yyyy', align: { h: 'center' } }),
    top: S.get({ font: { sz: 10 }, align: { v: 'top' } }), topZ: S.get({ font: { sz: 10 }, fill: XL_C.zebra, align: { v: 'top' } }),
    nameTop: S.get({ font: { b: 1, sz: 10.5, color: XL_C.petrol }, align: { v: 'top' } }), nameTopZ: S.get({ font: { b: 1, sz: 10.5, color: XL_C.petrol }, fill: XL_C.zebra, align: { v: 'top' } }),
    kpiL: S.get({ font: { sz: 10.5, color: XL_C.mut }, fill: XL_C.sand, border: 'none' }), kpiV: S.get({ font: { b: 1, sz: 22, color: XL_C.petrol }, fill: XL_C.sand, border: 'none', align: { h: 'right', wrap: false } }),
    sec: S.get({ font: { b: 1, sz: 12, color: XL_C.petrol }, border: 'bottom', align: { wrap: false } }),
    foot: S.get({ font: { sz: 9, color: XL_C.mut }, border: 'none', align: { wrap: false } }),
  };
  const stS = {}; Object.entries(XL_ST).forEach(([k, [bg, fg]]) => { stS[k] = S.get({ font: { b: 1, sz: 10, color: fg }, fill: bg, align: { h: 'center' } }); });
  const z = (i, a, b) => (i % 2 ? b : a);
  const now = fmtDT(nowISO());
  const titleRows = (t, n) => [{ ht: 34, cells: [{ v: t, s: T.title }] }, { ht: 20, cells: [{ v: `${org.name} · ${org.platform} — صُدّر في ${now}${n != null ? ` — ${n}` : ''}`, s: T.sub }] }, { ht: 6, cells: Array.from({ length: 1 }, () => ({ v: '', s: T.band })) }];
  const sorted = [...list].sort((a, b) => STATUS_ORDER.indexOf(pStatus(a)) - STATUS_ORDER.indexOf(pStatus(b)) || partnerName(a).localeCompare(partnerName(b), 'ar'));

  /* — الشراكات — */
  const H = ['#', 'الرمز', 'الجهة الشريكة', 'عنوان الشراكة', 'القطاع', 'نوع المذكرة', 'تصنيف الشراكة', 'الحالة', 'تاريخ البدء', 'تاريخ الانتهاء', 'المتبقي (يوم)', 'المسؤول', 'الإدارات المتقاطعة', 'التفعيل', ...(contacts ? ['ضابط الاتصال', 'البريد الإلكتروني', 'الجوال'] : []), 'آخر تحديث'];
  const W = [5, 13, 34, 30, 11, 13, 20, 16, 12, 12, 10, 18, 28, 12, ...(contacts ? [22, 28, 14] : []), 16];
  const main = { name: 'الشراكات', tab: XL_C.petrol, cols: W, freeze: { row: 4, col: 3 }, rows: titleRows('سجل الشراكات', `${list.length} شراكة`), active: true, printTitles: 4 };
  main.rows[2].cells = H.map(() => ({ v: '', s: T.band }));
  main.rows.push({ ht: 30, cells: H.map((h) => ({ v: h, s: T.head })) });
  sorted.forEach((p, i) => {
    const pr = partnerById(p.partnerId), st = pStatus(p), dl = daysLeft(p);
    const vals = [
      { v: i + 1, s: z(i, T.num, T.numZ) }, { v: p.code || '', s: z(i, T.num, T.numZ) },
      { v: pr ? pr.name : p.title, s: z(i, T.name, T.nameZ) }, { v: p.title && pr && p.title !== pr.name ? p.title : '', s: z(i, T.cell, T.cellZ) },
      { v: pSector(p), s: z(i, T.cell, T.cellZ) }, { v: p.classification || '', s: z(i, T.cell, T.cellZ) }, { v: (p.categories || []).join('، ') || p.ptype || '', s: z(i, T.cell, T.cellZ) },
      { v: statusLabel(st) + (p.isDraft ? ' (مسودة)' : ''), s: stS[st] || T.cell },
      { v: xlDate(p.startDate), s: z(i, T.date, T.dateZ) }, { v: xlDate(p.endDate), s: z(i, T.date, T.dateZ) },
      { v: dl !== null && ['active', 'soon'].includes(st) ? dl : '', s: z(i, T.num, T.numZ) },
      { v: (p.owners || []).join('، '), s: z(i, T.cell, T.cellZ) }, { v: (p.departments || []).join('، '), s: z(i, T.cell, T.cellZ) }, { v: p.activation || '', s: z(i, T.cell, T.cellZ) },
      ...(contacts ? [{ v: p.contactName || '', s: z(i, T.cell, T.cellZ) }, { v: p.contactEmail || '', s: z(i, T.cell, T.cellZ) }, { v: p.contactPhone || '', s: z(i, T.num, T.numZ) }] : []),
      { v: fmtDT(p.updatedAt || p.createdAt), s: z(i, T.num, T.numZ) },
    ];
    main.rows.push({ ht: xlHt(vals.map((x) => (typeof x.v === 'string' ? x.v : '')), W, 24, 60), cells: vals });
  });
  main.filter = `A4:${colName(H.length - 1)}${main.rows.length}`;
  main.merges = [`A1:${colName(H.length - 1)}1`, `A2:${colName(H.length - 1)}2`];
  main.rows.push({ ht: 10, cells: [] }, { cells: [{ v: `الحالة تُحسب من التواريخ: «تنتهي قريبًا» خلال ${D.settings.expiryDays || 90} يومًا. ${contacts ? '' : 'بيانات التواصل محجوبة حسب صلاحية الحساب. '}الخط: ${XL_FONT}.`, s: T.foot }] });

  /* — التفاصيل — */
  const DH = ['#', 'الجهة الشريكة', 'الحالة', 'مجالات التعاون', 'الأثر المتوقع', 'المخرجات', ...(internal ? ['الملاحظات', 'التوصيات'] : [])];
  const DW = [5, 30, 15, 60, 50, 50, ...(internal ? [38, 32] : [])];
  const det = { name: 'التفاصيل', tab: XL_C.gold, cols: DW, freeze: { row: 4, col: 2 }, rows: titleRows('تفاصيل الشراكات'), printTitles: 4 };
  det.rows[2].cells = DH.map(() => ({ v: '', s: T.band }));
  det.rows.push({ ht: 30, cells: DH.map((h) => ({ v: h, s: T.head })) });
  sorted.forEach((p, i) => {
    const st = pStatus(p);
    const txt = [p.cooperationAreas, p.expectedImpact, p.outputs, ...(internal ? [p.notes, p.recommendations] : [])].map((x) => trimP(x || '').replace(/\n{2,}/g, '\n'));
    const vals = [{ v: i + 1, s: z(i, T.num, T.numZ) }, { v: partnerName(p), s: z(i, T.nameTop, T.nameTopZ) }, { v: statusLabel(st), s: stS[st] || T.cell }, ...txt.map((t) => ({ v: t, s: z(i, T.top, T.topZ) }))];
    det.rows.push({ ht: xlHt(['', '', '', ...txt], DW, 24, 220), cells: vals });
  });
  det.filter = `A4:${colName(DH.length - 1)}${det.rows.length}`;
  det.merges = [`A1:${colName(DH.length - 1)}1`, `A2:${colName(DH.length - 1)}2`];

  /* — ملخص — */
  const cnt = (f) => list.filter(f).length;
  const sum = { name: 'ملخص', tab: XL_C.gold, cols: [26, 14, 4, 26, 14, 4, 26, 14], rows: titleRows('ملخص سجل الشراكات', `${list.length} شراكة`) };
  sum.rows[2].cells = Array.from({ length: 8 }, () => ({ v: '', s: T.band }));
  sum.merges = ['A1:H1', 'A2:H2'];
  const K = [['إجمالي الشراكات', list.length], ['سارية الآن', cnt((p) => ['active', 'soon'].includes(pStatus(p)))], ['قيد الإعداد والتوقيع', cnt((p) => ['prep', 'sign', 'hold'].includes(pStatus(p)))], ['منتهية', cnt((p) => pStatus(p) === 'ended')]];
  sum.rows.push({ ht: 12, cells: [] });
  sum.rows.push({ ht: 22, cells: [{ v: K[0][0], s: T.kpiL }, { v: '', s: T.kpiL }, null, { v: K[1][0], s: T.kpiL }, { v: '', s: T.kpiL }, null, { v: K[2][0], s: T.kpiL }, { v: '', s: T.kpiL }] });
  sum.rows.push({ ht: 38, cells: [{ v: K[0][1], s: T.kpiV }, { v: '', s: T.kpiV }, null, { v: K[1][1], s: T.kpiV }, { v: '', s: T.kpiV }, null, { v: K[2][1], s: T.kpiV }, { v: '', s: T.kpiV }] });
  const r0 = sum.rows.length; sum.merges.push(`A${r0 - 1}:B${r0 - 1}`, `D${r0 - 1}:E${r0 - 1}`, `G${r0 - 1}:H${r0 - 1}`, `A${r0}:B${r0}`, `D${r0}:E${r0}`, `G${r0}:H${r0}`);
  sum.rows.push({ ht: 14, cells: [] });
  const group = (getter) => { const m = {}; list.forEach((p) => getter(p).forEach((k) => { m[k] = (m[k] || 0) + 1; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const tbl = [
    ['حسب الحالة', STATUS_ORDER.map((k) => [statusLabel(k), cnt((p) => pStatus(p) === k), k]).filter((x) => x[1])],
    ['حسب القطاع', group((p) => [pSector(p) || 'غير محدد'])],
    ['حسب المسؤول', group((p) => (p.owners || []).length ? p.owners : ['بلا مسؤول'])],
  ];
  const maxLen = Math.max(...tbl.map((t) => t[1].length));
  sum.rows.push({ ht: 26, cells: [{ v: tbl[0][0], s: T.sec }, { v: '', s: T.sec }, null, { v: tbl[1][0], s: T.sec }, { v: '', s: T.sec }, null, { v: tbl[2][0], s: T.sec }, { v: '', s: T.sec }] });
  for (let i = 0; i < maxLen; i++) {
    const c = [];
    tbl.forEach(([, rows], ti) => { const x = rows[i]; if (ti) c.push(null); c.push(x ? { v: x[0], s: x[2] ? stS[x[2]] : z(i, T.cell, T.cellZ) } : null, x ? { v: x[1], s: z(i, T.num, T.numZ) } : null); });
    sum.rows.push({ ht: 22, cells: c });
  }

  /* — الجهات المستهدفة — */
  const tg = D.partners.filter((x) => x.target && !D.partnerships.some((p) => p.partnerId === x.id) && (showDemo() || !x.demo)).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  const sheets = [main, det, sum];
  if (tg.length) {
    const TW = [5, 46, 14, 22, 40];
    const tgs = { name: 'الجهات المستهدفة', tab: XL_C.petrol2, cols: TW, freeze: { row: 4 }, rows: titleRows('الجهات المستهدفة', `${tg.length} جهة`), printTitles: 4 };
    tgs.rows[2].cells = TW.map(() => ({ v: '', s: T.band }));
    tgs.rows.push({ ht: 30, cells: ['#', 'الجهة', 'القطاع', 'المسؤول', 'ملاحظة'].map((h) => ({ v: h, s: T.head })) });
    tg.forEach((x, i) => tgs.rows.push({ ht: 24, cells: [{ v: i + 1, s: z(i, T.num, T.numZ) }, { v: x.name, s: z(i, T.name, T.nameZ) }, { v: x.sector || '', s: z(i, T.cell, T.cellZ) }, { v: (x.owners || []).join('، '), s: z(i, T.cell, T.cellZ) }, { v: x.targetNote || '', s: z(i, T.cell, T.cellZ) }] }));
    tgs.filter = `A4:E${tgs.rows.length}`; tgs.merges = ['A1:E1', 'A2:E2'];
    sheets.push(tgs);
  }
  /* — بصيغة ملف الحصر — */
  const OH = ['#', 'اسم الشراكة', 'القطاع', 'تصنيف المذكرة', 'مجالات التعاون', 'بيانات ضابط الاتصال', 'البريد الالكتروني للشريك', 'رقم الجوال', 'تاريخ بدء الشراكة', 'تاريخ انتهاء الشراكة', 'الأثر المتوقع من الشراكة وكيف يخدم المؤسسة', 'المخرجات (اسناد مشاريع، بناء مبادرات)', 'الملاحظات', 'التوصيات', 'المسؤول من إدارة الشراكات'];
  const OW = [5, 34, 12, 14, 50, 22, 26, 14, 13, 13, 46, 46, 30, 26, 18];
  const orig = { name: 'بصيغة ملف الحصر', cols: OW, freeze: { row: 4, col: 2 }, rows: titleRows('ملف حصر الشراكات'), printTitles: 4 };
  orig.rows[2].cells = OW.map(() => ({ v: '', s: T.band }));
  orig.rows.push({ ht: 34, cells: OH.map((h) => ({ v: h, s: T.head })) });
  sorted.forEach((p, i) => {
    const t = [p.title || partnerName(p), pSector(p), p.classification || '', trimP(p.cooperationAreas || ''), contacts ? p.contactName || '' : '', contacts ? p.contactEmail || '' : '', contacts ? p.contactPhone || '' : ''];
    const t2 = [trimP(p.expectedImpact || ''), trimP(p.outputs || ''), internal ? p.notes || '' : '', internal ? p.recommendations || '' : '', (p.owners || []).join(' + ')];
    const vals = [{ v: i + 1, s: z(i, T.num, T.numZ) }, ...t.map((v, k) => ({ v, s: k === 0 ? z(i, T.nameTop, T.nameTopZ) : z(i, T.top, T.topZ) })), { v: xlDate(p.startDate), s: z(i, T.date, T.dateZ) }, { v: xlDate(p.endDate), s: z(i, T.date, T.dateZ) }, ...t2.map((v) => ({ v, s: z(i, T.top, T.topZ) }))];
    orig.rows.push({ ht: xlHt(['', ...t, '', '', ...t2], OW, 24, 200), cells: vals });
  });
  orig.filter = `A4:O${orig.rows.length}`; orig.merges = ['A1:O1', 'A2:O2'];
  sheets.push(orig);
  download(`${base}-${isoDate(today())}.xlsx`, xlBook(sheets, S));
  toast(`صُدّر ${list.length} شراكة إلى Excel`);
}
