/* =====================================================================
   الملف الشامل للشراكة: كل التفاصيل والنماذج والصور والمستندات في ملف واحد
   يُعرض للمعاينة ثم يُطبع أو يُحفظ PDF من المتصفح
   ===================================================================== */
const DOS_SECS = [
  ['summary', 'البيانات الأساسية', true],
  ['profile', 'التصنيف والقيمة والوضع المالي', true],
  ['wf', 'مسار المذكرة', true],
  ['content', 'مجالات التعاون والأثر والمتابعة', true],
  ['proposal', 'المقترح الأصلي', true],
  ['forms', 'النماذج المعتمدة', true],
  ['evals', 'تقييمات الشراكة', true],
  ['stories', 'الإنجازات المرتبطة', true],
  ['photos', 'معرض الصور', true],
  ['docs', 'المستندات والمرفقات', true],
  ['log', 'سجل التغييرات', false],
];

/* pdf.js مضمّن نصًا ويُحمَّل عند الحاجة فقط */
let PDFJS = null;
function loadPdfjs() {
  if (PDFJS) return PDFJS;
  const src = document.getElementById('vendor-pdfjs'), wsrc = document.getElementById('vendor-pdfjs-worker');
  if (!src || !wsrc) return null;
  const s = document.createElement('script'); s.textContent = src.textContent; document.head.appendChild(s);
  const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  if (!lib) return null;
  lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([wsrc.textContent], { type: 'text/javascript' }));
  PDFJS = lib; return lib;
}
const isPdf = (a) => a && (/pdf/.test(a.type || '') || /\.pdf$/i.test(a.name || ''));
async function pdfPagesToImages(blob, { max = 40, scale = 1.7 } = {}) {
  const lib = loadPdfjs(); if (!lib) throw new Error('قارئ PDF غير متاح');
  const doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false }).promise;
  const out = [];
  for (let i = 1; i <= Math.min(doc.numPages, max); i++) {
    const pg = await doc.getPage(i); const vp = pg.getViewport({ scale });
    const cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: cx, viewport: vp }).promise;
    out.push({ src: cv.toDataURL('image/jpeg', 0.86), land: vp.width > vp.height });
    pg.cleanup();
  }
  const total = doc.numPages; doc.destroy();
  return { pages: out, total };
}

function dossierAttachments(p) {
  const seen = new Set(), out = [];
  const add = (a, from) => { if (!a || !a.fileId || seen.has(a.fileId)) return; seen.add(a.fileId); out.push({ ...a, from }); };
  (p.attachments || []).forEach((a) => add(a, 'الشراكة'));
  const prop = p.proposalId && D.proposals.find((x) => x.id === p.proposalId);
  if (prop) (prop.attachments || []).forEach((a) => add(a, 'المقترح ' + (prop.ref || '')));
  return out;
}
function dossierForms(p) {
  const out = [];
  Object.entries(FORMS).forEach(([k, F]) => {
    if (F.periodic) return;
    const f = wfForm('partnership', p, k); if (!f) return;
    const [kind, rec] = wfFormOwner('partnership', p, k);
    out.push({ key: k, F, f, kind, rec });
  });
  (p.evals || []).forEach((e, i) => { if (e.status === 'done') out.push({ key: 'partnershipEval', F: FORMS.partnershipEval, f: e, kind: 'partnership', rec: p, idx: i }); });
  return out;
}

/* — نافذة الخيارات — */
function dossierDialog(p) {
  const atts = dossierAttachments(p), pdfs = atts.filter(isPdf).length, forms = dossierForms(p).length, photos = partnershipPhotos(p).length;
  const cnt = { forms, photos, docs: atts.length };
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal dos-dlg" role="dialog" aria-modal="true" aria-labelledby="dosT">
    <header class="modal-h"><div><h3 id="dosT">${icon('file')} الملف الشامل للشراكة</h3><p class="small muted">${esc(partnerName(p))} — ملف واحد يجمع التفاصيل والنماذج والصور والمستندات، جاهز للطباعة أو الحفظ PDF.</p></div><button class="icon-btn" data-mclose aria-label="إغلاق">${icon('x')}</button></header>
    <div class="modal-b">
      <div class="dos-opts">${DOS_SECS.map(([k, l, on]) => `<label class="dos-opt"><input type="checkbox" value="${k}" ${on ? 'checked' : ''}><span>${esc(l)}</span>${cnt[k] !== undefined ? `<em>${cnt[k]}</em>` : ''}</label>`).join('')}</div>
      <label class="dos-opt wide"><input type="checkbox" id="dosPdf" ${pdfs ? 'checked' : 'disabled'}><span>إدراج صفحات ملفات PDF المرفقة داخل الملف</span><em>${pdfs}</em></label>
      <p class="xs muted" style="margin-top:10px">${icon('info')} الصور وملفات PDF تُدرج بمحتواها كاملًا. ملفات Word وExcel تظهر في قائمة المستندات ببياناتها، ويمكن تنزيلها مع الحزمة.</p>
    </div>
    <footer class="modal-f"><button class="btn primary" data-dosgo>${icon('print')} تجهيز الملف ومعاينته</button>${atts.length ? `<button class="btn" data-doszip>${icon('download')} تنزيل الحزمة (ZIP)</button>` : ''}<button class="btn ghost" data-mclose>إلغاء</button></footer></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.onclick = async (e) => {
    if (e.target === bg || e.target.closest('[data-mclose]')) return close();
    const sel = () => new Set($$('.dos-opts input:checked', bg).map((x) => x.value));
    if (e.target.closest('[data-dosgo]')) { const s = sel(); const withPdf = $('#dosPdf', bg).checked; close(); return openDossier(p, { secs: s, withPdf }); }
    if (e.target.closest('[data-doszip]')) { const b = e.target.closest('[data-doszip]'); b.disabled = true; try { await dossierZip(p, sel()); } finally { b.disabled = false; } }
  };
  bg.onkeydown = (e) => { if (e.key === 'Escape') close(); };
  setTimeout(() => { const b = $('[data-dosgo]', bg); b && b.focus(); }, 30);
}

/* — بناء الملف — */
async function dossierHTML(p, { secs = new Set(DOS_SECS.filter((x) => x[2]).map((x) => x[0])), withPdf = true, onProgress = () => {} } = {}) {
  const pr = partnerById(p.partnerId) || {};
  const o = D.settings.org, name = partnerName(p);
  const logo = (ASSET_IMG['murooj-logo'] || {}).src;
  const P = pProfile(p), f = P.fin;
  const st = wfStateOf('partnership', p);
  const prop = p.proposalId && D.proposals.find((x) => x.id === p.proposalId);
  const atts = dossierAttachments(p);
  const galIds = new Set([p.coverFileId, ...(p.attachments || []).filter((a) => isImg(a) && a.category === 'صور الشراكة').map((a) => a.fileId)]);
  const photos = partnershipPhotos(p).filter((ph) => galIds.has(ph.fileId));
  const forms = dossierForms(p);
  const stories = D.achievements.filter((a) => a.partnershipId === p.id && (showDemo() || !a.demo));
  const logs = D.audit.filter((a) => a.entityId === p.id);
  const url = async (id) => (await FileCache.url(id)) || '';
  const kvT = (rows) => `<table class="ds-kv">${rows.filter(Boolean).map(([l, v]) => `<tr><th>${esc(l)}</th><td>${v || '<span class="ds-faint">—</span>'}</td></tr>`).join('')}</table>`;
  const has = (k) => secs.has(k);
  const toc = [];
  const chapters = [];
  let n = 0;
  const chap = (id, title, body, { page = true, sub = '' } = {}) => { n++; toc.push([pad(n), title]); chapters.push(`<section class="ds-ch ${page ? 'pg' : ''}" id="ds-${id}"><header class="ds-chh"><em>${pad(n)}</em><div><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div></header>${body}</section>`); };

  onProgress('البيانات الأساسية');
  if (has('summary')) chap('summary', 'البيانات الأساسية', kvT([
    ['الجهة الشريكة', esc(pr.name || name)], ['اسم الشراكة', esc(p.title || '')], ['رقم الشراكة', `<span class="ds-code">${esc(p.code || '—')}</span>`],
    ['القطاع', esc(pSector(p) || '')], ['مجال عمل الجهة', esc(pr.domain || '')], ['تصنيف المذكرة', esc(p.classification || '')],
    ['تصنيف الشراكة', esc(p.ptype || '')], ['فئات الشراكة', esc((p.categories || []).join('، '))],
    ['الحالة', esc(statusLabel(pStatus(p)))], ['مرحلة الشراكة', esc(stageLabel(p.stage))],
    ['تاريخ البدء', p.startDate ? fmtDate(p.startDate) : ''], ['تاريخ الانتهاء', p.endDate ? fmtDate(p.endDate) : ''],
    ['المسؤولون من إدارة الشراكات', esc((p.owners || []).join('، '))], ['تفعيل الشراكة', esc(p.activation || '')],
    ['التقاطع مع الإدارات', esc((p.departments || []).join('، '))],
    can('view.contacts') && ['ضابط الاتصال لدى الشريك', [p.contactName, p.contactEmail, p.contactPhone].filter(Boolean).map(esc).join(' — ')],
    ['آخر تحديث', `${fmtDT(p.updatedAt || p.createdAt)} — ${esc(p.updatedBy || p.createdBy || '')}`],
  ]), { page: false });

  if (has('profile')) {
    const fin = can('view.internal') || wfInvolved(p);
    chap('profile', 'التصنيف والقيمة والوضع المالي', `<div class="ds-2">${kvT([
      ['تصنيف الشراكة', esc(P.ptype)], ['بداية العلاقة', esc(P.origin)], ['من فتح الباب', esc(P.originBy)],
      ['نوع القيمة', esc((P.valueTypes || []).join('، '))], ['القيمة الإجمالية التقديرية', P.total ? sar(P.total) : ''], ['مستوى الأثر', esc(P.impactLevel)],
      ['آخر تقييم', P.ev && P.ev.score !== null ? `<b>${P.ev.score}</b> من 100 — ${evalGrade(P.ev.score)} (${esc(P.ev.data.period || '')})` : 'لم تُقيَّم بعد'],
    ])}${fin ? kvT([
      ['النموذج المالي', esc(f.model || '')], ['الوضع المالي', esc(f.status || '')], ['مساهمة الشريك', f.partnerSar ? sar(f.partnerSar) : ''],
      ['مساهمة المؤسسة', f.murojSar ? sar(f.murojSar) : ''], ['القيمة العينية والمعرفية', f.inkindSar ? sar(f.inkindSar) : ''], ['المصروف حتى الآن', f.spentSar ? sar(f.spentSar) : ''],
      ['ملاحظات مالية', esc(f.notes || '').replace(/\n/g, '<br>')],
    ]) : ''}</div>`);
  }

  if (has('wf') && wfInvolved(p)) {
    const doneN = WF_STEPS.filter((s) => st.S[s.id] && st.S[s.id].status === 'done').length;
    const cur = st.closed ? 'أُغلق الطلب' : st.cur ? `الخطوة ${st.cur.n}: ${st.cur.t} — لدى ${wfActorName(st.cur.actor)}` : 'اكتمل المسار';
    chap('wf', 'مسار المذكرة', `<div class="ds-wfbar"><i style="width:${Math.round(doneN / WF_STEPS.length * 100)}%"></i></div><p class="ds-lead"><b>${doneN} من ${WF_STEPS.length}</b> — ${esc(cur)}</p>
      <table class="ds-tbl"><thead><tr><th class="c">م</th><th>الخطوة</th><th>الجهة المنفّذة</th><th>الحالة</th><th>التاريخ والمنفّذ</th><th>المستندات والنماذج</th></tr></thead><tbody>
      ${WF_PHASES.map((ph) => `<tr class="ds-ph"><td colspan="6">${esc(ph.t)}</td></tr>` + WF_STEPS.filter((s) => s.ph === ph.id).map((s) => {
        const r = st.S[s.id] || {}, done = r.status === 'done', isCur = st.cur && st.cur.id === s.id;
        const stt = done ? (r.decision === 'no' ? (s.no || 'غير مناسبة') : r.decision === 'yes' && s.yes ? s.yes : 'مكتملة') : isCur ? 'جارية' : r.status === 'returned' ? 'مُعادة' : 'لم تبدأ';
        const docs = wfDocsOf('partnership', p, s.id).map((a) => esc((s.docs.find((d) => d.k === a.doc) || {}).l || a.name));
        const fs = s.docs.filter((d) => d.form && wfForm('partnership', p, d.form)).map((d) => esc(FORMS[d.form].title) + (wfForm('partnership', p, d.form).status === 'done' ? ' ✓' : ' (مسودة)'));
        return `<tr class="${done ? 'done' : isCur ? 'cur' : ''}"><td class="c">${s.n}</td><td><b>${esc(s.t)}</b>${s.ref ? `<small>البند ${s.ref}</small>` : ''}${r.note ? `<small class="ds-note">${esc(r.note)}</small>` : ''}</td><td>${esc(wfActorName(s.actor))}</td><td><span class="ds-st ${done ? 'ok' : isCur ? 'cur' : ''}">${stt}</span></td><td class="ds-sm">${r.legacy ? 'قبل اعتماد المسار' : [r.at ? fmtDT(r.at) : '', esc(r.by || '')].filter(Boolean).join('<br>')}</td><td class="ds-sm">${[...fs, ...docs].join('<br>') || '—'}</td></tr>`;
      }).join('')).join('')}</tbody></table>`);
  }

  if (has('content')) {
    const intl = can('view.internal');
    chap('content', 'مجالات التعاون والأثر والمتابعة', `
      ${p.showcaseGoal ? `<blockquote class="ds-quote">${esc(p.showcaseGoal)}</blockquote>` : ''}
      <h3 class="ds-h3">مجالات التعاون</h3>${richHTML(p.cooperationAreas)}
      <h3 class="ds-h3">الأثر المتوقع وكيف يخدم المؤسسة</h3>${richHTML(p.expectedImpact)}
      <h3 class="ds-h3">المخرجات</h3>${richHTML(p.outputs)}
      ${intl ? `<h3 class="ds-h3">الملاحظات</h3>${richHTML(p.notes, { empty: 'لا توجد ملاحظات.' })}<h3 class="ds-h3">التوصيات</h3>${richHTML(p.recommendations, { empty: 'لم تُسجَّل توصيات.' })}<h3 class="ds-h3">التحديات</h3>${richHTML(p.challenges, { empty: 'لم تُسجَّل تحديات.' })}` : ''}`);
  }

  if (has('proposal') && prop) chap('proposal', 'المقترح الأصلي', kvT([
    ['الرقم المرجعي', `<span class="ds-code">${esc(prop.ref || '')}</span>`], ['الحالة', esc(propStatusLabel(prop.status))], ['الإدارة الطالبة', esc(prop.department || '')],
    ['مقدم الطلب', esc(prop.requesterName || '')], ['تاريخ التقديم', prop.submittedAt ? fmtDT(prop.submittedAt) : ''], ['الهدف الاستراتيجي', esc(prop.strategicGoal || '')],
  ]) + `<h3 class="ds-h3">أسباب طلب الشراكة</h3>${richHTML(prop.reasons)}${prop.targets ? `<h3 class="ds-h3">المستهدفات</h3>${richHTML(prop.targets)}` : ''}${prop.addedValue ? `<h3 class="ds-h3">القيمة المضافة</h3>${richHTML(prop.addedValue)}` : ''}`);

  if (has('forms')) {
    const list = forms.filter((x) => x.key !== 'partnershipEval' || !has('evals'));
    if (list.length) chap('forms', 'النماذج المعتمدة', `<p class="ds-lead">${plural(list.length, 'نموذج واحد', 'نموذجان', 'نماذج', 'نموذجًا')} مُعبّأ في المنظومة، كل نموذج في صفحة مستقلة بصيغته الرسمية.</p>
      <table class="ds-tbl"><thead><tr><th>النموذج</th><th>الرقم</th><th>الحالة</th><th>أعدّه</th></tr></thead><tbody>${list.map((x) => `<tr><td><b>${esc(x.F.title)}</b></td><td class="ds-code">${esc(x.f.no || '—')}</td><td>${x.f.status === 'done' ? 'معتمد' : 'مسودة'}</td><td class="ds-sm">${esc(x.f.by || '')}${x.f.at ? '<br>' + fmtDT(x.f.at) : ''}</td></tr>`).join('')}</tbody></table>`
      + list.map((x) => `<div class="ds-form">${formDocHTML(x.kind, x.rec, x.key, x.idx ?? null)}</div>`).join(''));
  }
  if (has('evals')) {
    const evs = (p.evals || []).map((e, i) => [e, i]).filter(([e]) => e.status === 'done');
    if (evs.length) chap('evals', 'تقييمات الشراكة', `<table class="ds-tbl"><thead><tr><th>الفترة</th><th class="c">الدرجة</th><th>التقدير</th><th>التوصية</th><th>المقيِّم</th></tr></thead><tbody>${evs.map(([e]) => { const s = evalScore(e.data); return `<tr><td>${esc(e.data.period || '')}</td><td class="c"><b>${s ?? '—'}</b></td><td>${s !== null ? evalGrade(s) : '—'}</td><td>${esc(e.data.rec || '')}</td><td class="ds-sm">${esc(e.by || '')}<br>${e.at ? fmtDT(e.at) : ''}</td></tr>`; }).join('')}</tbody></table>`
      + evs.map(([, i]) => `<div class="ds-form">${formDocHTML('partnership', p, 'partnershipEval', i)}</div>`).join(''));
  }

  if (has('stories') && stories.length) {
    const rows = await Promise.all(stories.map(async (a) => ({ a, u: a.coverFileId ? await url(a.coverFileId) : '' })));
    chap('stories', 'الإنجازات المرتبطة', rows.map(({ a, u }) => `<article class="ds-story">${u ? `<img src="${u}" alt="">` : ''}<div><h3>${esc(a.title)}</h3>${a.metric || a.value ? `<b class="ds-metric">${esc([a.value, a.metric].filter(Boolean).join(' '))}</b>` : ''}<p>${esc(a.summary || a.text || '')}</p><small>${a.date ? fmtDate(a.date) : ''}</small></div></article>`).join(''));
  }

  if (has('photos') && photos.length) {
    onProgress('الصور');
    const rows = await Promise.all(photos.map(async (ph) => ({ ph, u: await url(ph.fileId) })));
    chap('photos', 'معرض الصور', `<div class="ds-gal">${rows.filter((x) => x.u).map(({ ph, u }) => `<figure><img src="${u}" alt=""><figcaption>${esc(ph.sub || '')}</figcaption></figure>`).join('')}</div>`);
  }

  if (has('docs') && atts.length) {
    const kindL = (a) => isImg(a) ? 'صورة' : isPdf(a) ? 'PDF' : /word|\.docx?$/i.test(a.type + a.name) ? 'Word' : /sheet|excel|\.xlsx?$/i.test(a.type + a.name) ? 'Excel' : 'ملف';
    let body = `<table class="ds-tbl"><thead><tr><th class="c">م</th><th>المستند</th><th>التصنيف</th><th>النوع</th><th>الحجم</th><th>أُضيف</th><th>في هذا الملف</th></tr></thead><tbody>${atts.map((a, i) => `<tr><td class="c">${i + 1}</td><td><b>${esc(a.name)}</b>${a.from !== 'الشراكة' ? `<small>من ${esc(a.from)}</small>` : ''}</td><td class="ds-sm">${esc(a.category || '')}</td><td>${kindL(a)}</td><td class="ds-sm">${a.size ? fmtSize(a.size) : '—'}</td><td class="ds-sm">${a.addedAt ? fmtDate(a.addedAt.slice(0, 10), 'short') : '—'}${a.by ? '<br>' + esc(a.by) : ''}</td><td class="ds-sm">${isImg(a) ? (galIds.has(a.fileId) && has('photos') ? 'في معرض الصور' : 'مُدرجة') : isPdf(a) && withPdf ? 'صفحاته مُدرجة' : 'في الحزمة فقط'}</td></tr>`).join('')}</tbody></table>`;
    let k = 0;
    for (const a of atts) {
      k++;
      const cap = `<div class="ds-att-h"><em>مرفق ${k}</em><b>${esc(a.name)}</b><span>${esc(a.category || '')}</span></div>`;
      if (isImg(a) && galIds.has(a.fileId) && has('photos')) continue;
      if (isImg(a)) { const u = await url(a.fileId); if (u) body += `<div class="ds-att">${cap}<img class="ds-att-img" src="${u}" alt=""></div>`; continue; }
      if (isPdf(a) && withPdf) {
        onProgress(`قراءة «${a.name}»`);
        try {
          const rec = await Store.getFile(a.fileId);
          if (!rec || !rec.blob) throw new Error('الملف غير موجود في هذا المتصفح');
          const { pages, total } = await pdfPagesToImages(rec.blob);
          body += pages.map((pg, i) => `<div class="ds-att ${pg.land ? 'land' : ''}">${cap.replace('</div>', `<i>صفحة ${i + 1} من ${total}</i></div>`)}<img class="ds-att-pg" src="${pg.src}" alt=""></div>`).join('');
          if (total > pages.length) body += `<p class="ds-lead">عُرضت أول ${pages.length} صفحة من ${total}. الملف كاملًا في الحزمة.</p>`;
        } catch (err) { body += `<div class="ds-att ds-att-miss">${cap}<p>تعذّر إدراج صفحات هذا الملف: ${esc(err.message || '')}</p></div>`; }
      }
    }
    chap('docs', 'المستندات والمرفقات', body);
  }

  if (has('log') && logs.length) chap('log', 'سجل التغييرات', `<table class="ds-tbl"><thead><tr><th>الإجراء</th><th>التفاصيل</th><th>التاريخ</th><th>المستخدم</th></tr></thead><tbody>${logs.map((l) => `<tr><td>${esc(AUDIT_LABELS[l.action] || l.action)}</td><td class="ds-sm">${esc(l.details || '')}</td><td class="ds-sm">${fmtDT(l.at)}</td><td class="ds-sm">${esc(l.user || '')}</td></tr>`).join('')}</tbody></table>`);

  const cover = p.coverFileId ? await url(p.coverFileId) : '';
  const tp = termProgress(p);
  const coverHTMLs = `<section class="ds-cover">
    <div class="ds-cv-top">${logo ? `<img src="${logo}" alt="">` : ''}<div><b>${esc(o.name)}</b><span>${esc(o.dept)}</span></div><span class="ds-cv-kind">ملف الشراكة الشامل</span></div>
    ${cover ? `<div class="ds-cv-img"><img src="${cover}" alt=""></div>` : '<div class="ds-cv-rule"></div>'}
    <div class="ds-cv-t"><span class="ds-code">${esc(p.code || '')}</span><h1>${esc(name)}</h1>${p.title && p.title !== name ? `<p>${esc(p.title)}</p>` : ''}</div>
    <div class="ds-cv-facts">
      <div><span>الحالة</span><b>${esc(statusLabel(pStatus(p)))}</b></div>
      <div><span>القطاع</span><b>${esc(pSector(p) || '—')}</b></div>
      <div><span>التصنيف</span><b>${esc(p.ptype || p.classification || '—')}</b></div>
      <div><span>الفترة</span><b class="nw">${p.startDate ? fmtDate(p.startDate, 'short') : '—'} – ${p.endDate ? fmtDate(p.endDate, 'short') : '—'}</b></div>
    </div>
    ${tp !== null ? `<div class="ds-cv-term"><i style="width:${Math.round(tp * 100)}%"></i></div>` : ''}
    <div class="ds-toc"><h3>محتويات الملف</h3><ol>${toc.map(([no, t]) => `<li><em>${no}</em><span>${esc(t)}</span></li>`).join('')}</ol></div>
    <div class="ds-cv-foot"><span>أُعدّ من ${esc(o.platform)}</span><span>${fmtDate(isoDate(today()))} — ${esc(Session.userName())}</span>${p.demo ? '<span class="ds-demo">بيانات تجريبية</span>' : ''}</div>
  </section>`;
  return `<article class="dossier" dir="rtl" data-run="${esc(name)} · ${esc(p.code || '')}">${coverHTMLs}${chapters.join('')}<footer class="ds-end">— نهاية الملف —</footer></article>`;
}

/* — المعاينة والطباعة — */
async function openDossier(p, opts = {}) {
  closeDossier();
  const ov = document.createElement('div'); ov.id = 'dossier'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'الملف الشامل للشراكة');
  ov.innerHTML = `<div class="ds-bar no-print"><div class="ds-bar-t">${icon('file')}<div><b>الملف الشامل — ${esc(partnerName(p))}</b><span id="dsProg">جارٍ تجهيز الملف…</span></div></div>
    <button class="btn primary" data-dsprint disabled>${icon('print')} طباعة / حفظ PDF</button><button class="btn ghost" data-dsclose>${icon('x')} إغلاق</button></div>
    <div class="ds-scroll"><div class="ds-load"><span class="spin"></span></div></div>`;
  document.body.appendChild(ov); document.documentElement.classList.add('dossier-open');
  const prog = (t) => { const e = $('#dsProg'); if (e) e.textContent = 'جارٍ تجهيز: ' + t + '…'; };
  ov.onclick = (e) => {
    if (e.target.closest('[data-dsclose]')) return closeDossier();
    if (e.target.closest('[data-dsprint]')) return printDossier(p);
  };
  ov.onkeydown = (e) => { if (e.key === 'Escape') closeDossier(); };
  try {
    const html = await dossierHTML(p, { ...opts, onProgress: prog });
    if (!document.body.contains(ov)) return;
    $('.ds-scroll', ov).innerHTML = html;
    await Promise.all($$('#dossier img', ov).map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
    const pages = $$('.ds-att', ov).length, forms = $$('.ds-form', ov).length;
    const pl = (k, ...w) => (k ? plural(k, ...w) : null); const gal = $$('.ds-gal img', ov).length;
    $('#dsProg').textContent = 'جاهز — ' + ([pl($$('.ds-ch', ov).length, 'فصل واحد', 'فصلان', 'فصول', 'فصلًا'), pl(forms, 'نموذج واحد', 'نموذجان', 'نماذج', 'نموذجًا'), pl(gal, 'صورة واحدة', 'صورتان', 'صور', 'صورة'), pl(pages, 'صفحة مرفقات واحدة', 'صفحتا مرفقات', 'صفحات مرفقات', 'صفحة مرفقات')].filter(Boolean).join('، '));
    $('[data-dsprint]', ov).disabled = false; $('[data-dsprint]', ov).focus();
    Repo.log('partnership.dossier', 'partnership', p.id, p.code, 'تجهيز الملف الشامل للطباعة');
  } catch (err) {
    console.warn(err);
    $('.ds-scroll', ov).innerHTML = emptyHTML({ ic: 'alert', title: 'تعذّر تجهيز الملف', text: esc(err.message || '') });
  }
}
function closeDossier() { const d = $('#dossier'); if (d) d.remove(); document.documentElement.classList.remove('dossier-open', 'printing-dossier'); }
function printDossier(p) {
  const html = document.documentElement; html.classList.add('printing-dossier');
  let st = $('#dosPage'); if (!st) { st = document.createElement('style'); st.id = 'dosPage'; document.head.appendChild(st); }
  const run = ($('#dossier .dossier') || {}).dataset ? $('#dossier .dossier').dataset.run : '';
  st.textContent = `@page{size:A4;margin:16mm 14mm 18mm;@bottom-center{content:"${String(run).replace(/["\\]/g, '')} — صفحة " counter(page) " من " counter(pages);font-family:'Expo Arabic','IBM Plex Sans Arabic',sans-serif;font-size:8.5pt;color:#6B756F}}@page :first{@bottom-center{content:none}}`;
  const prev = document.title; document.title = `الملف الشامل — ${partnerName(p)}`;
  const done = () => { html.classList.remove('printing-dossier'); st.textContent = ''; document.title = prev; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 60);
}

/* — حزمة ZIP: الملف الشامل (HTML) والمرفقات الأصلية — */
async function dossierZip(p, secs) {
  if (typeof JSZip === 'undefined') { toast('أداة الضغط غير متاحة', 'err'); return; }
  toast('جارٍ تجهيز الحزمة…');
  const zip = new JSZip(); const name = partnerName(p).replace(/[\\/:*?"<>|]/g, '');
  const atts = dossierAttachments(p); const used = new Set();
  const folder = zip.folder('المرفقات');
  for (const a of atts) {
    let blob = null;
    if (/^(lib|asset):/.test(a.fileId)) { const u = await FileCache.url(a.fileId); if (u) blob = await (await fetch(u)).blob(); }
    else { const r = await Store.getFile(a.fileId); blob = r && r.blob; }
    if (!blob) continue;
    let fn = (a.name || 'ملف').replace(/[\\/:*?"<>|]/g, ''); if (!/\.[a-z0-9]{2,5}$/i.test(fn)) { const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'application/pdf': 'pdf' }[blob.type || a.type]; if (ext) fn += '.' + ext; } let i = 2; while (used.has(fn)) fn = fn.replace(/(\.[^.]+)?$/, ` (${i++})$1`); used.add(fn);
    folder.file(fn, blob);
  }
  const html = await dossierHTML(p, { secs, withPdf: false });
  const div = document.createElement('div'); div.innerHTML = html;
  await Promise.all($$('img', div).map(async (im) => { if (im.src.startsWith('blob:')) { try { im.src = await blobToDataURL(await (await fetch(im.src)).blob()); } catch (_) { /* تجاهل */ } } }));
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n').match(/\/\*DOSSIER-CSS\*\/[\s\S]*?\/\*DOSSIER-CSS-END\*\//);
  zip.file(`الملف الشامل — ${name}.html`, `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>الملف الشامل — ${esc(name)}</title><style>body{margin:0;background:#EDEAE2;font-family:'Expo Arabic','IBM Plex Sans Arabic',Tahoma,sans-serif}${css ? css[0] : ''}</style></head><body><div id="dossier" class="standalone"><div class="ds-scroll">${div.innerHTML}</div></div></body></html>`);
  const out = await zip.generateAsync({ type: 'blob' });
  download(`حزمة الشراكة — ${name}.zip`, out);
  await Repo.log('partnership.dossier', 'partnership', p.id, p.code, 'تنزيل حزمة الشراكة (ZIP)');
  toast('نُزّلت حزمة الشراكة: الملف الشامل والمرفقات الأصلية');
}
