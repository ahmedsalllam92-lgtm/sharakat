/* =====================================================================
   مستندات الشراكة داخل طباعة العرض المرئي (PDF)
   بعد شرائح التقرير: لكل مستند غلاف يعرّف به، ثم محتواه نفسه:
   - PDF: كل صفحة صورة واضحة (pdf.js)      - Word: نصه وتنسيقه (mammoth)
   - Excel: جداوله (SheetJS)                  - نص: كما هو
   تُحمَّل المكتبات عند الحاجة فقط من cdnjs؛ إن تعذّر التحميل (دون إنترنت) يبقى الغلاف مع تنبيه.
   ===================================================================== */
const MK_LIBS = {
  pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfw: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
};
const mkLoad = (src) => new Promise((res, rej) => {
  const old = document.querySelector(`script[data-mklib="${src}"]`); if (old) { if (old.dataset.ok) return res(); old.addEventListener('load', res); old.addEventListener('error', rej); return; }
  const s = document.createElement('script'); s.src = src; s.dataset.mklib = src; s.onload = () => { s.dataset.ok = '1'; res(); }; s.onerror = () => rej(new Error('تعذّر تحميل أداة عرض الملف'));
  document.head.appendChild(s);
});
const mkExt = (n) => (String(n || '').match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
function mkDocCover(p, a, i, n) {
  return `<section class="rs2 mk mk-night mk-app-cover"><div class="mkac">
    <span class="mkac-n">مرفق ${i + 1} من ${n}</span>
    <span class="dc2-ic t-${mkExt(a.name)}">${(mkExt(a.name) || 'ملف').toUpperCase()}</span>
    <h2>${esc(a.name.replace(/\.[a-z0-9]{2,5}$/i, ''))}</h2>
    <dl><div><dt>التصنيف</dt><dd>${esc(a.category || 'أخرى')}</dd></div><div><dt>الشراكة</dt><dd>${esc(partnerName(p))}</dd></div>${a.addedAt ? `<div><dt>تاريخ الرفع</dt><dd>${fmtDate(String(a.addedAt).slice(0, 10))}</dd></div>` : ''}<div><dt>الحجم</dt><dd>${fmtSize(a.size || 0)}</dd></div></dl>
    <p>تلي هذه الصفحة محتوى المستند كما رُفع على ${esc(D.settings.org.platform)}.</p></div></section>`;
}
const mkNote = (t) => `<section class="rs2 mk mk-paper mk-app-note"><div><b>${icon('info')} ${esc(t)}</b><small>يمكن فتح الملف وتنزيله من صفحة الشراكة في المنصة.</small></div></section>`;
async function mkAppendixHTML(p, onStep) {
  const docs = (p.attachments || []).filter((a) => a.fileId && !isImg(a));
  const out = [];
  for (let i = 0; i < docs.length; i++) {
    const a = docs[i], ext = mkExt(a.name); onStep && onStep(i + 1, docs.length, a.name);
    out.push(mkDocCover(p, a, i, docs.length));
    const f = await Store.getFile(a.fileId);
    if (!f || !f.blob) { out.push(mkNote('تعذّر العثور على الملف')); continue; }
    try {
      if (ext === 'pdf' || f.type === 'application/pdf') {
        await mkLoad(MK_LIBS.pdf); window.pdfjsLib.GlobalWorkerOptions.workerSrc = MK_LIBS.pdfw;
        const doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(await f.blob.arrayBuffer()) }).promise;
        const N = Math.min(doc.numPages, 60);
        for (let k = 1; k <= N; k++) {
          const pg = await doc.getPage(k), vp0 = pg.getViewport({ scale: 1 }), sc = Math.min(1280 / vp0.width, 720 / vp0.height) * 1.7, vp = pg.getViewport({ scale: sc });
          const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
          const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
          await pg.render({ canvasContext: cx, viewport: vp }).promise;
          out.push(`<section class="rs2 mk-app-pg"><img src="${cv.toDataURL('image/jpeg', 0.9)}" alt=""><span>${esc(a.name)} — صفحة ${k} من ${doc.numPages}</span></section>`);
        }
        if (doc.numPages > N) out.push(mkNote(`عُرضت أول ${N} صفحة من ${doc.numPages}`));
      } else if (ext === 'docx') {
        await mkLoad(MK_LIBS.mammoth);
        const r = await window.mammoth.convertToHtml({ arrayBuffer: await f.blob.arrayBuffer() });
        out.push(`<section class="mk-app-flow" dir="auto">${r.value || '<p>المستند فارغ.</p>'}</section>`);
      } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
        await mkLoad(MK_LIBS.xlsx);
        const wb = window.XLSX.read(new Uint8Array(await f.blob.arrayBuffer()), { type: 'array' });
        wb.SheetNames.slice(0, 6).forEach((sn) => out.push(`<section class="mk-app-flow sheet"><h3>${esc(sn)}</h3>${window.XLSX.utils.sheet_to_html(wb.Sheets[sn], { header: '', footer: '' }).replace(/<\/?(html|head|body|meta|title)[^>]*>/gi, '')}</section>`));
      } else if (/^text\//.test(f.type) || ['txt', 'md'].includes(ext)) {
        out.push(`<section class="mk-app-flow"><pre>${esc((await f.blob.text()).slice(0, 60000))}</pre></section>`);
      } else out.push(mkNote(`صيغة «${ext || f.type || 'غير معروفة'}» لا يمكن عرض محتواها داخل الطباعة`));
    } catch (e) { out.push(mkNote('تعذّر عرض محتوى الملف داخل الطباعة' + (navigator.onLine ? '' : ' (يحتاج اتصالًا بالإنترنت)'))); }
  }
  return out.join('');
}
/* فتح الصور والمستندات من شريحة «الوثائق والصور» */
document.addEventListener('click', (e) => {
  const d = e.target.closest('.rs2.mk [data-mkopen]'); if (!d) return;
  e.preventDefault(); e.stopPropagation(); viewStored(d.dataset.mkopen);
}, true);
