/* =====================================================================
   الملف الشامل للشراكة: كل التفاصيل والنماذج والصور والمستندات في ملف واحد
   يُعرض للمعاينة ثم يُطبع أو يُحفظ PDF من المتصفح
   ===================================================================== */
const DOS_SECS = [
  ['story', 'الشراكة في سطور: الدور وسلسلة القيمة ودورة الحياة', true],
  ['summary', 'بطاقة الشراكة: الحقائق والفترة', true],
  ['partner', 'الجهة الشريكة', true],
  ['profile', 'التصنيف والقيمة والوضع المالي والتقييم', true],
  ['wf', 'مسار المذكرة', true],
  ['content', 'مجالات التعاون والأثر والمتابعة', true],
  ['contact', 'الفريق والتواصل', true],
  ['proposal', 'المقترح الأصلي', true],
  ['forms', 'النماذج المعتمدة', true],
  ['evals', 'تقييمات الشراكة', true],
  ['stories', 'الإنجازات والمستجدات', true],
  ['photos', 'معرض الصور', true],
  ['docs', 'المستندات والمرفقات', true],
  ['admin', 'البيانات الإدارية والمصدر', true],
  ['log', 'سجل التغييرات', true],
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
  /* الصور تُضمَّن في الملف نفسه (data:) حتى تظهر في الطباعة وحفظ PDF دون الاعتماد على روابط مؤقتة */
  const url = async (id) => { const u = (await FileCache.url(id)) || ''; if (!u || u.startsWith('data:')) return u; try { const bl = await (await fetch(u)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => r(u); fr.readAsDataURL(bl); }); } catch (_) { return u; } };
  const kvT = (rows) => `<table class="ds-kv">${rows.filter(Boolean).map(([l, v]) => `<tr><th>${esc(l)}</th><td>${v || '<span class="ds-faint">—</span>'}</td></tr>`).join('')}</table>`;
  const has = (k) => secs.has(k);
  const toc = [];
  const chapters = [];
  let n = 0;
  const chap = (id, title, body, { page = true, sub = '' } = {}) => { n++; toc.push([pad(n), title]); chapters.push(`<section class="ds-ch ${page ? 'pg' : ''}" id="ds-${id}"><header class="ds-chh"><em>${pad(n)}</em><div><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div></header>${body}</section>`); };

  onProgress('البيانات الأساسية');
  const stt = pStatus(p), dl = daysLeft(p), tp = termProgress(p);
  const chipsH = (arr, cls = '') => (arr && arr.length ? `<div class="ds-chips">${arr.map((x) => `<span class="ds-chip ${cls}">${esc(x)}</span>`).join('')}</div>` : '<span class="ds-faint">—</span>');
  const fact = (ic, l, v, sub = '', tone = '') => `<div class="ds-fact ${tone}"><span class="ds-fi">${icon(ic)}</span><div><small>${esc(l)}</small><b>${v || '—'}</b>${sub ? `<em>${sub}</em>` : ''}</div></div>`;
  const kv2 = (rows) => `<dl class="ds-dl">${rows.filter(Boolean).map(([l, v, full]) => `<div class="${full ? 'full' : ''}"><dt>${esc(l)}</dt><dd>${v || '<span class="ds-faint">—</span>'}</dd></div>`).join('')}</dl>`;
  const bar = (pct, cls = '') => `<span class="ds-bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;
  const lst = (txt, empty) => richHTML(txt, { empty });

  /* — الفصل الأول: الشراكة في سطور — سرد يشرح الشراكة ودورها، وجسر بين الطرفين، وسلسلة القيمة، والأهداف، ودورة حياة الشراكة — */
  if (has('story')) {
    const coop = richItems(p.cooperationAreas), outs = richItems(p.outputs), imps = richItems(p.expectedImpact);
    const short = (it, n = 90) => { const s = (it.title || it.text || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
    const ico = (t) => (typeof mkIconFor === 'function' ? mkIconFor(t) : 'link');
    const goals = pStrat(p).goals.map((k) => (goalCodes().find((g) => g.k === k) || {}).t).filter(Boolean);
    const years = p.startDate && p.endDate ? Math.max(1, Math.round((parseDate(p.endDate) - parseDate(p.startDate)) / (365.25 * 864e5) * 10) / 10) : null;
    const signed = st.S.signed && st.S.signed.status === 'done' && !st.S.signed.legacy ? st.S.signed.at : null;
    const renews = p.renewals || [];
    const sect = pSector(p);
    /* السرد */
    const para = [
      `<b>${esc(pr.name || name)}</b> جهة من ${sect ? `القطاع ${esc(sect)}` : 'الجهات الشريكة'}${pr.domain ? ` تعمل في مجال ${esc(pr.domain)}` : ''}، ترتبط مع ${esc(o.name)} بـ${esc(p.classification || 'مذكرة شراكة')}${p.ptype ? ` ضمن الشراكات <b>${esc(p.ptype)}</b>` : ''}${p.startDate ? ` بدأت في ${fmtDate(p.startDate)}` : ''}${p.endDate ? ` وتمتد حتى ${fmtDate(p.endDate)}${years ? ` (${nf(years)} ${years <= 1 ? 'سنة' : years < 3 ? 'سنتان' : 'سنوات'})` : ''}` : ''}.`,
      p.showcaseGoal || coop.length ? `تهدف الشراكة إلى ${esc((p.showcaseGoal ? trimP(p.showcaseGoal).replace(/^(إلى|الى)\s+/, '') : short(coop[0], 160)).replace(/[.。،,\s…]+$/, ''))}.` : '',
      `<b>دورها في عمل المؤسسة:</b> ${[coop.length && `تفتح ${plural(coop.length, 'مجال تعاون واحدًا', 'مجالي تعاون', 'مجالات تعاون', 'مجالًا للتعاون')}`, outs.length && `وتستهدف ${plural(outs.length, 'مخرجًا واحدًا', 'مخرجين', 'مخرجات', 'مخرجًا')}`, goals.length && `وتخدم ${plural(goals.length, 'هدفًا استراتيجيًا واحدًا', 'هدفين استراتيجيين', 'أهداف استراتيجية', 'هدفًا استراتيجيًا')} للمؤسسة`, (p.departments || []).length && `وتشارك فيها ${plural(p.departments.length, 'إدارة واحدة', 'إدارتان', 'إدارات', 'إدارة')} من المؤسسة`].filter(Boolean).join(' ') || 'لم تُسجَّل بعد مجالات التعاون ومخرجاتها'}.`,
      `<b>أين تقف اليوم:</b> ${esc(statusLabel(stt))}${['active', 'soon'].includes(stt) && dl !== null ? ` ومتبقٍ ${plural(dl, 'يوم واحد', 'يومان', 'أيام', 'يومًا')}` : ''}${st.cur && !st.closed ? `، والخطوة الحالية في مسار المذكرة «${esc(st.cur.t)}»` : ''}${P.ev && P.ev.score !== null ? `، وآخر تقييم لها ${P.ev.score} من 100 (${esc(evalGrade(P.ev.score))})` : ''}${renews.length ? `، وجُدّدت ${plural(renews.length, 'مرة', 'مرتين', 'مرات', 'مرة')}` : ''}.`,
    ].filter(Boolean);
    /* الجسر بين الطرفين */
    const mlogo = (ASSET_IMG['murooj-logo'] || {}).src, plg = pr.logoFileId ? await url(pr.logoFileId) : '';
    const bridge = `<div class="dsx-bridge">
      <div class="dsx-party"><span class="dsx-lg">${mlogo ? `<img src="${mlogo}" alt="">` : ''}</span><b>${esc(o.name)}</b><small>${esc(o.dept)}</small></div>
      <div class="dsx-span"><span class="dsx-rail" aria-hidden="true"></span>
        <div class="dsx-nodes">${(coop.length ? coop : [{ text: 'مجالات التعاون تُسجَّل في الشراكة' }]).slice(0, 5).map((it, i) => `<span style="--i:${i}"><i>${icon(ico(it.title || it.text))}</i><em>${esc(short(it, 46))}</em></span>`).join('')}</div>
        <small class="dsx-cap">${esc(p.classification || 'مذكرة شراكة')}${years ? ` · ${nf(years)} ${years <= 1 ? 'سنة' : years < 3 ? 'سنتان' : 'سنوات'}` : ''}</small></div>
      <div class="dsx-party"><span class="dsx-lg">${plg ? `<img src="${plg}" alt="">` : `<span class="emb" data-sec="${esc(pr.sector || '')}">${icon(embIcon(pr))}</span>`}</span><b>${esc(pr.name || name)}</b><small>${esc([sect, pr.domain].filter(Boolean).join(' · ') || 'الجهة الشريكة')}</small></div></div>`;
    /* الأرقام */
    const nums = [[coop.length, 'مجال تعاون', 'link'], [outs.length, 'مخرج مستهدف', 'award'], [imps.length, 'أثر متوقع', 'leaf'], [goals.length, 'هدف استراتيجي', 'flag'], [(p.departments || []).length, 'إدارة مشاركة', 'users'], [P.ev && P.ev.score !== null ? P.ev.score : null, 'آخر تقييم /100', 'star']];
    const numsH = `<div class="dsx-nums">${nums.map(([v, l, ic]) => `<div><span>${icon(ic)}</span><b>${v === null || v === undefined ? '—' : nf(v)}</b><small>${l}</small></div>`).join('')}</div>`;
    /* سلسلة القيمة */
    const col = (t, ic, arr, cls) => `<div class="dsx-col ${cls}"><h4><span>${icon(ic)}</span>${t}</h4>${arr.length ? `<ul>${arr.slice(0, 4).map((it) => `<li><i>${icon(ico(it.title || it.text))}</i><span>${esc(short(it, 120))}</span></li>`).join('')}</ul>${arr.length > 4 ? `<em>+ ${plural(arr.length - 4, 'بند آخر', 'بندان آخران', 'بنود أخرى', 'بندًا آخر')} في الفصول التالية</em>` : ''}` : '<p class="ds-faint">لم يُسجَّل بعد.</p>'}</div>`;
    const chain = `<div class="dsx-chain">${col('ما نتعاون فيه', 'link', coop, 'a')}<span class="dsx-arr">${icon('chevL')}</span>${col('ما ننتجه معًا', 'award', outs, 'b')}<span class="dsx-arr">${icon('chevL')}</span>${col('الأثر الذي نصنعه', 'leaf', imps, 'c')}</div>`;
    /* دورة الحياة */
    const ev_ = [prop && prop.submittedAt && [prop.submittedAt.slice(0, 10), 'تقديم المقترح', 'p'], signed && [String(signed).slice(0, 10), 'توقيع المذكرة', 's'], p.startDate && [p.startDate, 'بداية الشراكة', 'b'], ...renews.map((r) => [String(r.at).slice(0, 10), 'تجديد حتى ' + fmtDate(r.to, 'short'), 'r']), [isoDate(today()), 'اليوم', 't'], p.endDate && [p.endDate, 'نهاية المدة', 'e']].filter(Boolean).filter((x) => parseDate(x[0])).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    let life = '';
    if (ev_.length >= 2) {
      const t0 = parseDate(ev_[0][0]).getTime(), t1 = Math.max(parseDate(ev_[ev_.length - 1][0]).getTime(), t0 + 1);
      life = `<div class="dsx-life"><div class="dsx-line">${ev_.map(([d, l, k], i) => { const f = (parseDate(d).getTime() - t0) / (t1 - t0); return `<span class="pt ${k} ${i % 2 ? 'dn' : 'up'}" style="right:${(f * 100).toFixed(1)}%"><i></i><b>${esc(l)}</b><small>${fmtDate(d, 'short')}</small></span>`; }).join('')}<i class="prog" style="width:${tp !== null ? Math.round(Math.max(0, Math.min(1, (today().getTime() - t0) / (t1 - t0))) * 100) : 0}%"></i></div></div>`;
    }
    chap('story', 'الشراكة في سطور', `
      ${bridge}
      <div class="dsx-narr">${para.map((x) => `<p>${x}</p>`).join('')}</div>
      ${numsH}
      <h3 class="ds-h3">سلسلة القيمة: من التعاون إلى الأثر</h3>${chain}
      ${goals.length ? `<h3 class="ds-h3">الأهداف الاستراتيجية التي تخدمها الشراكة</h3><div class="dsx-goals">${goals.map((g, i) => `<span><em>${pad(i + 1)}</em>${esc(g)}</span>`).join('')}</div>` : ''}
      ${life ? `<h3 class="ds-h3">دورة حياة الشراكة</h3>${life}` : ''}`, { sub: 'من هي الجهة، ولماذا هذه الشراكة، وما دورها في عمل المؤسسة' });
  }

  if (has('summary')) {
    const remTxt = ['active', 'soon'].includes(stt) && dl !== null ? `${nf(dl)} يومًا` : stt === 'upcoming' && p.startDate ? `يبدأ بعد ${nf(daysBetween(today(), parseDate(p.startDate)))} يومًا` : stt === 'ended' ? 'انتهت' : '—';
    const term = p.startDate && p.endDate ? `<div class="ds-term"><div class="ds-term-l"><span><small>البدء</small><b>${fmtDate(p.startDate)}</b></span><span class="c"><small>انقضى</small><b>${tp !== null ? Math.round(tp * 100) + '%' : '—'}</b></span><span><small>الانتهاء</small><b>${fmtDate(p.endDate)}</b></span></div>
      <div class="ds-term-b"><i style="width:${tp !== null ? Math.round(Math.max(0, Math.min(1, tp)) * 100) : 0}%"></i>${tp !== null && tp > 0 && tp < 1 ? `<em style="right:${Math.round(tp * 100)}%">اليوم</em>` : ''}</div></div>` : '';
    chap('summary', 'بطاقة الشراكة', `
      ${p.showcaseGoal ? `<blockquote class="ds-quote">${esc(p.showcaseGoal)}</blockquote>` : ''}
      <div class="ds-facts">
        ${fact('flag', 'الحالة', esc(statusLabel(stt)), esc(stageLabel(p.stage)), stt === 'soon' ? 'w' : stt === 'active' ? 'ok' : '')}
        ${fact('clock', 'المتبقي', remTxt, p.endDate ? 'حتى ' + fmtDate(p.endDate, 'short') : '')}
        ${fact('building', 'القطاع', esc(pSector(p) || ''), esc(pr.domain || ''))}
        ${fact('layers', 'تصنيف المذكرة', esc(p.classification || ''), esc(p.ptype || ''))}
        ${fact('users', 'المسؤولون', esc((p.owners || []).join('، ')), plural((p.departments || []).length, 'إدارة متقاطعة', 'إدارتان', 'إدارات', 'إدارة'))}
        ${fact('check', 'التفعيل', esc(p.activation || ''), P.ev && P.ev.score !== null ? `آخر تقييم ${P.ev.score}/100` : 'لم تُقيَّم بعد')}
      </div>
      ${term}
      ${p.highlight && p.highlight.value ? `<div class="ds-hl"><b>${esc(p.highlight.value)}</b><div><strong>${esc(p.highlight.label || '')}</strong><span>${esc(p.highlight.text || '')}</span></div></div>` : ''}
      <h3 class="ds-h3">البيانات التفصيلية</h3>
      ${kv2([['اسم الشراكة', esc(p.title || name)], ['رقم الشراكة', `<span class="ds-code">${esc(p.code || '—')}</span>`], ['تصنيف الشراكة', chipsH(p.categories)], ['التقاطع مع الإدارات', chipsH(p.departments, 'g'), true]])}`);
  }

  if (has('partner') && pr.id) {
    const others = D.partnerships.filter((x) => x.partnerId === pr.id && (showDemo() || !x.demo));
    const pprops = D.proposals.filter((x) => x.partnerId === pr.id || (x.partnerName && normAr(x.partnerName) === normAr(pr.name)));
    const lg = pr.logoFileId ? await url(pr.logoFileId) : '';
    chap('partner', 'الجهة الشريكة', `<div class="ds-pcard"><span class="ds-plogo">${lg ? `<img src="${lg}" alt="">` : `<span class="emb" data-sec="${esc(pr.sector || '')}">${icon(embIcon(pr))}</span>`}</span>
        <div><h3>${esc(pr.name)}</h3><p>${[pr.sector, pr.domain].filter(Boolean).map(esc).join(' · ') || '—'}</p>${pr.website ? `<a dir="ltr">${esc(pr.website)}</a>` : ''}</div></div>
      ${kv2([['الأسماء البديلة', chipsH(pr.aliases)], ['ملاحظات عن الجهة', esc(pr.notes || ''), true]])}
      <h3 class="ds-h3">كل الشراكات مع الجهة (${others.length})</h3>
      <table class="ds-tbl"><thead><tr><th>الشراكة</th><th>الرقم</th><th>الحالة</th><th>الفترة</th></tr></thead><tbody>${others.map((x) => `<tr class="${x.id === p.id ? 'cur' : ''}"><td><b>${esc(x.title || partnerName(x))}</b>${x.id === p.id ? '<small>هذا الملف</small>' : ''}</td><td class="ds-code">${esc(x.code || '')}</td><td><span class="ds-st ${['active', 'soon'].includes(pStatus(x)) ? 'ok' : ''}">${esc(statusLabel(pStatus(x)))}</span></td><td class="ds-sm">${x.startDate ? fmtDate(x.startDate, 'short') : '—'} – ${x.endDate ? fmtDate(x.endDate, 'short') : '—'}</td></tr>`).join('')}</tbody></table>
      ${pprops.length ? `<h3 class="ds-h3">المقترحات المرتبطة بالجهة (${pprops.length})</h3><table class="ds-tbl"><thead><tr><th>المرجع</th><th>الإدارة الطالبة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>${pprops.map((x) => `<tr><td class="ds-code">${esc(x.ref || '')}</td><td>${esc(x.department || '')}</td><td>${esc(propStatusLabel(x.status))}</td><td class="ds-sm">${x.submittedAt ? fmtDate(x.submittedAt.slice(0, 10), 'short') : '—'}</td></tr>`).join('')}</tbody></table>` : ''}`);
  }

  if (has('profile')) {
    const fin = can('view.internal') || wfInvolved(p);
    const tot = (+f.partnerSar || 0) + (+f.murojSar || 0) + (+f.inkindSar || 0), cash = (+f.partnerSar || 0) + (+f.murojSar || 0);
    const parts = [['مساهمة الشريك', +f.partnerSar || 0, 'a'], ['مساهمة المؤسسة', +f.murojSar || 0, 'b'], ['قيمة عينية ومعرفية', +f.inkindSar || 0, 'c']];
    const ev = P.ev && P.ev.score !== null ? P.ev : null;
    const sc = ev ? (ev.data.scores || {}) : {};
    chap('profile', 'التصنيف والقيمة والوضع المالي والتقييم', `
      <div class="ds-facts c4">
        ${fact('layers', 'تصنيف الشراكة', esc(P.ptype))}${fact('link', 'بداية العلاقة', esc(P.origin), esc(P.originBy))}
        ${fact('award', 'مستوى الأثر', esc(P.impactLevel))}${fact('star', 'نوع القيمة', esc((P.valueTypes || []).join('، ')))}
      </div>
      ${fin ? `<div class="ds-fin"><div class="ds-fin-h"><div><small>القيمة الإجمالية التقديرية</small><b>${tot ? sar(tot) : '—'}</b></div><div><small>الوضع المالي</small><span class="ds-st ${f.status === 'متأخر' ? 'bad' : f.status === 'مكتمل' ? 'ok' : 'cur'}">${esc(f.status || 'غير محدد')}</span></div><div><small>النموذج المالي</small><b class="sm">${esc(f.model || '—')}</b></div></div>
        ${tot ? `<div class="ds-stack">${parts.filter((x) => x[1]).map(([l, v, k]) => `<i class="${k}" style="flex:${v}"></i>`).join('')}</div><div class="ds-stack-l">${parts.map(([l, v, k]) => `<span><i class="${k}"></i>${l}<b>${v ? sar(v) : '—'}</b></span>`).join('')}</div>` : ''}
        ${cash ? `<div class="ds-spend"><span>المصروف حتى الآن <b>${sar(+f.spentSar || 0)}</b> من ${sar(cash)}</span>${bar(Math.round((+f.spentSar || 0) / cash * 100))}<em>${Math.round((+f.spentSar || 0) / cash * 100)}%</em></div>` : ''}
        ${f.notes ? `<p class="ds-note2">${esc(f.notes).replace(/\n/g, '<br>')}</p>` : ''}</div>` : ''}
      <h3 class="ds-h3">آخر تقييم للشراكة</h3>
      ${ev ? `<div class="ds-eval"><div class="ds-ring ${evalTone(ev.score)}" style="--v:${ev.score}"><b>${ev.score}</b><small>${evalGrade(ev.score)}</small></div>
        <ul>${EVAL_CRIT.map((c) => { const v = +((sc[c.k] || {}).v || 0); return `<li><span>${esc(c.l)} <em>(${c.w}%)</em></span>${bar(v / 5 * 100)}<b>${v || '—'}/5</b></li>`; }).join('')}</ul></div>
        <p class="ds-lead">${esc(ev.data.period || '')}${ev.data.rec ? ' · التوصية: ' + esc(ev.data.rec) : ''} · ${esc(ev.by || '')} · ${ev.no ? esc(ev.no) : ''}</p>` : '<p class="ds-lead">لم تُقيَّم الشراكة بعد.</p>'}`);
  }

  if (has('wf') && wfInvolved(p)) {
    const doneN = WF_STEPS.filter((s_) => st.S[s_.id] && st.S[s_.id].status === 'done').length;
    const cur = st.closed ? 'أُغلق الطلب' : st.cur ? `الخطوة ${st.cur.n}: ${st.cur.t} — لدى ${wfActorName(st.cur.actor)}` : 'اكتمل المسار';
    chap('wf', 'مسار المذكرة', `<div class="ds-wfh"><b>${doneN} من ${WF_STEPS.length}</b><span>${esc(cur)}</span>${bar(Math.round(doneN / WF_STEPS.length * 100))}</div>
      <div class="ds-steps">${WF_PHASES.map((ph, pi) => `<div class="ds-phase"><h4><em>${pad(pi + 1)}</em>${esc(ph.t)}</h4><ol class="ds-tbl">${WF_STEPS.filter((s_) => s_.ph === ph.id).map((s_) => {
        const r = st.S[s_.id] || {}, done = r.status === 'done', isCur = st.cur && st.cur.id === s_.id;
        const stx = done ? (r.decision === 'no' ? (s_.no || 'غير مناسبة') : r.decision === 'yes' && s_.yes ? s_.yes : 'مكتملة') : isCur ? 'جارية' : r.status === 'returned' ? 'مُعادة' : 'لم تبدأ';
        const docs = wfDocsOf('partnership', p, s_.id).map((a) => esc((s_.docs.find((d) => d.k === a.doc) || {}).l || a.name));
        const fs = s_.docs.filter((d) => d.form && wfForm('partnership', p, d.form)).map((d) => esc(FORMS[d.form].title) + (wfForm('partnership', p, d.form).status === 'done' ? ' ✓' : ' (مسودة)'));
        return `<li class="${done ? 'done' : isCur ? 'cur' : ''}"><span class="ds-sd">${done ? '✓' : s_.n}</span><div><b>${esc(s_.t)}</b>${s_.ref ? `<small class="ref">البند ${s_.ref}</small>` : ''}
          <small>${esc(wfActorName(s_.actor))} · <span class="ds-st ${done ? 'ok' : isCur ? 'cur' : ''}">${stx}</span>${r.legacy ? '' : [r.at ? fmtDT(r.at) : '', esc(r.by || '')].filter(Boolean).map((x) => ' · ' + x).join('')}</small>
          ${r.note ? `<small class="ds-note">${esc(r.note)}</small>` : ''}${[...fs, ...docs].length ? `<div class="ds-chips">${[...fs, ...docs].map((x) => `<span class="ds-chip">${x}</span>`).join('')}</div>` : ''}</div></li>`;
      }).join('')}</ol></div>`).join('')}</div>`);
  }

  if (has('content')) {
    const intl = can('view.internal');
    chap('content', 'مجالات التعاون والأثر والمتابعة', `
      <h3 class="ds-h3">مجالات التعاون</h3>${lst(p.cooperationAreas, 'لم تُسجَّل مجالات تعاون.')}
      <div class="ds-2c"><div><h3 class="ds-h3">الأثر المتوقع وكيف يخدم المؤسسة</h3>${lst(p.expectedImpact, 'لم يُسجَّل.')}</div><div><h3 class="ds-h3">المخرجات</h3>${lst(p.outputs, 'لم تُسجَّل.')}</div></div>
      ${intl ? `<div class="ds-3c"><div class="ds-box n"><h4>الملاحظات</h4>${lst(p.notes, 'لا توجد ملاحظات.')}</div><div class="ds-box c"><h4>التحديات</h4>${lst(p.challenges, 'لم تُسجَّل تحديات.')}</div><div class="ds-box r"><h4>التوصيات</h4>${lst(p.recommendations, 'لم تُسجَّل توصيات.')}</div></div>` : ''}`);
  }

  if (has('contact')) {
    chap('contact', 'الفريق والتواصل', `<div class="ds-2c">
      <div class="ds-box"><h4>${icon('users')} المسؤولون من إدارة الشراكات</h4>${(p.owners || []).length ? `<ul class="ds-people">${p.owners.map((o_) => `<li><span class="av">${esc(initials(o_))}</span>${esc(o_)}</li>`).join('')}</ul>` : '<p class="ds-faint">لم يُحدَّد مسؤول.</p>'}
        <h4 style="margin-top:12px">${icon('building')} الإدارات المتقاطعة</h4>${chipsH(p.departments, 'g')}</div>
      <div class="ds-box"><h4>${icon('phone')} ضابط الاتصال لدى الشريك</h4>${can('view.contacts') ? kv2([['الاسم', esc(p.contactName || '')], ['البريد الإلكتروني', p.contactEmail ? `<span dir="ltr">${esc(p.contactEmail)}</span>` : ''], ['رقم الجوال', p.contactPhone ? `<span dir="ltr">${esc(p.contactPhone)}</span>` : '']]) : '<p class="ds-faint">بيانات التواصل متاحة لفريق إدارة الشراكات فقط.</p>'}</div></div>`);
  }

  if (has('proposal') && prop) chap('proposal', 'المقترح الأصلي', `${kv2([
    ['الرقم المرجعي', `<span class="ds-code">${esc(prop.ref || '')}</span>`], ['الحالة', esc(propStatusLabel(prop.status))], ['الإدارة الطالبة', esc(prop.department || '')],
    ['مقدم الطلب', esc(prop.requesterName || '') + (prop.requesterEmail ? ` <span dir="ltr" class="ds-sm">${esc(prop.requesterEmail)}</span>` : '')], ['تاريخ التقديم', prop.submittedAt ? fmtDT(prop.submittedAt) : ''], ['قطاع الجهة', esc(prop.partnerSector || '')],
    ['الهدف الاستراتيجي', esc(prop.strategicGoal || ''), true],
    can('view.contacts') && ['ضابط الاتصال المقترح', [prop.contactName, prop.contactEmail, prop.contactPhone].filter(Boolean).map(esc).join(' — '), true]])}
    <div class="ds-2c"><div><h3 class="ds-h3">أسباب طلب الشراكة</h3>${lst(prop.reasons, '—')}</div><div><h3 class="ds-h3">المستهدفات</h3>${lst(prop.targets, '—')}</div></div>
    ${prop.addedValue ? `<h3 class="ds-h3">القيمة المضافة</h3>${lst(prop.addedValue, '—')}` : ''}
    ${(prop.events || []).length ? `<h3 class="ds-h3">مراحل المقترح</h3><table class="ds-tbl"><tbody>${prop.events.filter((e) => can('proposal.review') || e.vis !== 'internal').map((e) => `<tr><td class="ds-sm">${e.at ? fmtDT(e.at) : ''}</td><td>${esc(e.label || propStatusLabel(e.to || '') || e.type || '')}${e.message ? `<small>${esc(e.message)}</small>` : ''}</td><td class="ds-sm">${esc(e.by || '')}</td></tr>`).join('')}</tbody></table>` : ''}`);

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

  const news = D.news.filter((x) => x.partnershipId === p.id && (showDemo() || !x.demo)).sort((x, y) => (x.date < y.date ? 1 : -1));
  if (has('stories') && (stories.length || news.length)) {
    const rows = await Promise.all(stories.map(async (a_) => ({ a: a_, u: a_.coverFileId ? await url(a_.coverFileId) : '' })));
    chap('stories', 'الإنجازات والمستجدات', `${rows.map(({ a: a_, u }) => `<article class="ds-story">${u ? `<img src="${u}" alt="">` : ''}<div><h3>${esc(a_.title)}</h3>${a_.metricValue ? `<b class="ds-metric">${esc(a_.metricValue)} <span>${esc(a_.metricLabel || '')}</span></b>` : ''}<p>${esc(a_.summary || '')}</p>${a_.body ? `<p class="ds-sm">${esc(a_.body).replace(/\n/g, '<br>')}</p>` : ''}<small>${a_.date ? fmtDate(a_.date) : ''}${a_.public ? ' · منشور في الواجهة' : ''}</small></div></article>`).join('')}
      ${news.length ? `<h3 class="ds-h3">المستجدات (${news.length})</h3><ul class="ds-news">${news.map((x) => `<li><span class="d">${x.date ? fmtDate(x.date, 'short') : ''}</span><div><b>${esc(x.title)}</b>${x.body ? `<p>${esc(x.body)}</p>` : ''}</div></li>`).join('')}</ul>` : ''}`);
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

  if (has('admin') && can('view.internal')) {
    const featured = (D.settings.home.featured || []).includes(p.id);
    chap('admin', 'البيانات الإدارية والمصدر', `${kv2([['مرحلة الشراكة', esc(stageLabel(p.stage)) + (p.isDraft ? ' — مسودة' : '')], ['الحالة المحسوبة', esc(statusLabel(stt))],
      ['الظهور في الواجهة التعريفية', p.public ? 'منشورة' : 'غير منشورة'], ['العرض المميز في الرئيسية', featured ? 'ضمن الشراكات المختارة' : 'لا'],
      ['أُنشئ', `${fmtDT(p.createdAt)} — ${esc(p.createdBy || '')}`], ['آخر تحديث', `${fmtDT(p.updatedAt)} — ${esc(p.updatedBy || '')}`], p.source && ['المصدر', esc(p.source), true]])}
      ${(p.importNotes || []).length ? `<h3 class="ds-h3">ملاحظات الاستيراد</h3><ul class="ds-news">${p.importNotes.map((x) => `<li><span class="d">${x.confirmed ? '✓ مؤكدة' : 'بانتظار التأكيد'}</span><div><b>${esc(x.field || '')}</b><p>${esc(x.msg || '')}</p></div></li>`).join('')}</ul>` : ''}
      ${p.importRaw ? `<h3 class="ds-h3">البيانات كما وردت في ملف الحصر (الصف ${esc(String(p.seq || ''))})</h3><table class="ds-kv">${p.importRaw.map((c) => `<tr><th>${esc(c.h)}</th><td>${esc(c.v) || '<span class="ds-faint">—</span>'}</td></tr>`).join('')}</table>` : ''}`);
  }
  if (has('log') && logs.length) chap('log', 'سجل التغييرات', `<table class="ds-tbl"><thead><tr><th>الإجراء</th><th>التفاصيل</th><th>التاريخ</th><th>المستخدم</th></tr></thead><tbody>${logs.map((l) => `<tr><td>${esc(AUDIT_LABELS[l.action] || l.action)}</td><td class="ds-sm">${esc(l.details || '')}</td><td class="ds-sm">${fmtDT(l.at)}</td><td class="ds-sm">${esc(l.user || '')}</td></tr>`).join('')}</tbody></table>`);

  const cover = p.coverFileId ? await url(p.coverFileId) : '';
  const coverHTMLs = `<section class="ds-cover">
    <div class="ds-cv-top">${logo ? `<img src="${logo}" alt="">` : ''}<div><b>${esc(o.name)}</b><span>${esc(o.dept)}</span></div><span class="ds-cv-kind">ملف الشراكة الشامل</span></div>
    ${cover ? `<div class="ds-cv-img"><img src="${cover}" alt=""></div>` : '<div class="ds-cv-rule"></div>'}
    <div class="ds-cv-t"><div class="ds-cv-lg">${pr.logoFileId ? `<img src="${await url(pr.logoFileId)}" alt="">` : `<span class="emb" data-sec="${esc(pr.sector || '')}">${icon(embIcon(pr))}</span>`}</div><span class="ds-code">${esc(p.code || '')}</span><h1>${esc(name)}</h1>${p.title && p.title !== name ? `<p>${esc(p.title)}</p>` : ''}</div>
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
  st.textContent = `@page{size:A4;margin:16mm 14mm 18mm;@bottom-center{content:"${String(run).replace(/["\\]/g, '')} — صفحة " counter(page) " من " counter(pages);font-family:'SaudiRiyal','Expo Arabic','IBM Plex Sans Arabic',sans-serif;font-size:8.5pt;color:#6B756F}}@page :first{@bottom-center{content:none}}`;
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
  zip.file(`الملف الشامل — ${name}.html`, `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>الملف الشامل — ${esc(name)}</title><style>body{margin:0;background:#EDEAE2;font-family:'SaudiRiyal','Expo Arabic','IBM Plex Sans Arabic',Tahoma,sans-serif}${css ? css[0] : ''}</style></head><body><div id="dossier" class="standalone"><div class="ds-scroll">${div.innerHTML}</div></div></body></html>`);
  const out = await zip.generateAsync({ type: 'blob' });
  download(`حزمة الشراكة — ${name}.zip`, out);
  await Repo.log('partnership.dossier', 'partnership', p.id, p.code, 'تنزيل حزمة الشراكة (ZIP)');
  toast('نُزّلت حزمة الشراكة: الملف الشامل والمرفقات الأصلية');
}
