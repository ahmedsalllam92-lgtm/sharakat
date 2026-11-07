/* ===== تصدير Excel بأعمدة ملف الحصر نفسها (كاتب XLSX مصغّر دون مكتبات خارجية) ===== */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files) {
  const enc = new TextEncoder();
  const chunks = [], central = [];
  let offset = 0;
  const d = new Date();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    chunks.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cSize, true); end.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
const xmlEsc = (s) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function colName(i) { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
function buildXlsx({ sheetName, title, headers, rows, widths, note }) {
  const nCols = headers.length;
  const cell = (r, c, v, s) => {
    const ref = colName(c) + r;
    if (typeof v === 'number') return `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
    if (v === '' || v == null) return `<c r="${ref}" s="${s}"/>`;
    return `<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  };
  let sd = `<row r="1" ht="34" customHeight="1">${cell(1, 0, title, 3)}</row>`;
  sd += `<row r="2" ht="48" customHeight="1">${headers.map((h, i) => cell(2, i, h, i >= 19 ? 4 : 1)).join('')}</row>`;
  rows.forEach((row, ri) => { sd += `<row r="${ri + 3}">${row.map((v, ci) => cell(ri + 3, ci, v, 2)).join('')}</row>`; });
  if (note) sd += `<row r="${rows.length + 4}">${cell(rows.length + 4, 0, note, 5)}</row>`;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>
<sheetData>${sd}</sheetData>
<autoFilter ref="A2:${colName(nCols - 1)}${rows.length + 2}"/>
<mergeCells count="1"><mergeCell ref="A1:${colName(nCols - 1)}1"/></mergeCells>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="5"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="14"/><color rgb="FF0B3F38"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FF6B4E12"/><name val="Arial"/></font><font><i/><sz val="9"/><color rgb="FF5A736B"/><name val="Arial"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B3F38"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5EDDB"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFCFDCD7"/></left><right style="thin"><color rgb="FFCFDCD7"/></right><top style="thin"><color rgb="FFCFDCD7"/></top><bottom style="thin"><color rgb="FFCFDCD7"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1" readingOrder="2"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" readingOrder="2"/></xf>
<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" readingOrder="2"/></xf>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  return zipStore([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="${xmlEsc(sheetName)}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${xmlEsc(sheetName)}'!$A$2:$${colName(nCols - 1)}$${rows.length + 2}</definedName></definedNames></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', data: styles },
    { name: 'xl/worksheets/sheet1.xml', data: sheet },
  ]);
}
function partnershipRows(list) {
  const contacts = can('view.contacts'), internal = can('view.internal');
  return list.map((p, i) => {
    const atts = internal ? Object.entries((p.attachments || []).reduce((m, a) => { (m[a.category || 'أخرى'] = m[a.category || 'أخرى'] || []).push(a.name); return m; }, {})).map(([c, n]) => `${c}: ${n.join('، ')}`).join('\n') : '';
    return [
      i + 1, p.title || partnerName(p), pSector(p), p.classification || '', p.cooperationAreas || '',
      contacts ? p.contactName || '' : '', contacts ? p.contactEmail || '' : '', contacts ? p.contactPhone || '' : '',
      p.startDate ? fmtDate(p.startDate, 'short') : '', p.endDate ? fmtDate(p.endDate, 'short') : '',
      p.expectedImpact || '', p.outputs || '', internal ? p.notes || '' : '', internal ? p.recommendations || '' : '', internal ? p.challenges || '' : '',
      (p.owners || []).join(' + '), (p.departments || []).join('، '), p.activation || '', atts,
      p.code || '', statusLabel(pStatus(p)), stageLabel(p.stage) + (p.isDraft ? ' (مسودة)' : ''), (p.categories || []).join('، '), fmtDT(p.updatedAt), p.demo ? 'بيانات تجريبية' : '',
    ];
  });
}
function exportPartnershipsXlsx(list, base) {
  if (!list.length) return toast('لا توجد سجلات لتصديرها ضمن الفلاتر الحالية.', 'err');
  const headers = [...REAL_SAMPLE.headers, 'الرمز', 'الحالة المحسوبة', 'مرحلة الشراكة', 'تصنيف الشراكة', 'آخر تحديث', 'ملاحظة'];
  const widths = [6, 34, 12, 16, 70, 22, 30, 15, 14, 14, 60, 60, 30, 30, 30, 22, 34, 14, 36, 16, 16, 18, 30, 22, 16];
  const blob = buildXlsx({
    sheetName: 'ملف الشراكات', title: REAL_SAMPLE.sheetTitle, headers, rows: partnershipRows(list), widths,
    note: `صُدّر من ${D.settings.org.platform} في ${fmtDT(nowISO())} — ${list.length} سجل${can('view.contacts') ? '' : ' — بيانات التواصل محجوبة حسب الدور'}. الأعمدة A إلى S مطابقة لملف الحصر الأصلي.`,
  });
  download(`${base}-${isoDate(today())}.xlsx`, blob);
  toast(`صُدّر ${list.length} سجل إلى Excel`);
}
