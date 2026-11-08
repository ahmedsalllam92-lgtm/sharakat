/* ===== صفحة تفاصيل الشراكة ===== */
function renderPartnership(el, r) {
  const p = D.partnerships.find((x) => x.id === r.params.id);
  if (!p || (p.isDraft && !can('view.drafts')) || (p.demo && !showDemo())) {
    el.innerHTML = emptyHTML({ ic: 'search', title: 'لم يُعثر على الشراكة', text: 'قد تكون حُذفت، أو أنها مسودة لا تظهر لدورك الحالي، أو بيانات تجريبية مخفية.', actions: '<a class="btn" href="#/partnerships">العودة إلى السجل</a>' });
    return;
  }
  const pr = partnerById(p.partnerId);
  const internal = can('view.internal'), canEdit = can('edit.partnership');
  const st = pStatus(p), tp = termProgress(p), dl = daysLeft(p);
  const miss = missingFields(p);
  const prop = p.proposalId ? D.proposals.find((x) => x.id === p.proposalId) : null;
  const stories = D.achievements.filter((a) => a.partnershipId === p.id && (showDemo() || !a.demo) && (a.public || can('manage.content')));
  const featured = (D.settings.home.featured || []).includes(p.id);
  const logs = D.audit.filter((a) => a.entityId === p.id);
  const photos = partnershipPhotos(p);
  const kv = (label, val, full) => `<div class="${full ? 'full' : ''}"><dt>${esc(label)}</dt><dd>${val || '<span class="faint">—</span>'}</dd></div>`;
  const wfHTML = wfSectionHTML('partnership', p);
  const secs = [wfHTML && ['wf', 'مسار المذكرة'], ['profile', 'التصنيف والتقييم'], ['ov', 'نظرة عامة'], internal && ['files', 'الملفات والصور'], ['coop', 'مجالات التعاون'], ['impact', 'الأثر والمخرجات'], internal && ['follow', 'المتابعة'], ['contact', 'التواصل'], stories.length && ['stories', 'الإنجازات'], prop && ['proposal', 'المقترح الأصلي'], internal && ['admin', 'بيانات إدارية'], internal && ['log', 'السجل']].filter(Boolean);
  el.innerHTML = `
  <div class="dhead" data-tour="detail-head">${coverHTML(p.id + (pr ? pr.name : ''), p.coverFileId, { W: 1600, H: 420, levels: 18, cols: 90 })}<div class="shade"></div>
    <a class="back no-print" href="#/partnerships">${icon('arrowR')} سجل الشراكات</a>
    <div class="dhead-in">${plateEditHTML(pr, 120, canEdit && can('manage.partners'))}
      <div class="grow"><h1>${esc(pr ? pr.name : p.title)} ${demoTag(p)}${goldStarHTML(p)}</h1>
        <div class="sub"><span class="code" style="color:inherit">${esc(p.code || '')}</span>${p.title && pr && p.title !== pr.name ? `<span>${esc(p.title)}</span>` : ''}<span>${esc(p.classification || 'تصنيف غير محدد')}</span>${pSector(p) ? `<span>القطاع ${esc(pSector(p))}</span>` : ''}</div>
        <div class="tagline">${statusChip(p)}${p.ptype ? `<span class="chip plain cat">${esc(p.ptype)}</span>` : ''}${pr && pr.domain ? `<span class="chip plain cat">${esc(pr.domain)}</span>` : ''}${(p.categories || []).map((c) => `<span class="chip plain cat">${esc(c)}</span>`).join('')}${p.activation ? `<span class="chip plain">${esc(p.activation)}</span>` : ''}${p.public && !p.isDraft ? '<span class="chip plain">منشورة في الواجهة</span>' : ''}${featured ? '<span class="chip gold plain">مميزة في الرئيسية</span>' : ''}</div></div>
      ${photos.length ? `<div class="dh-photos no-print" aria-label="صور الشراكة">${photos.slice(0, 4).map((ph, k) => `<button data-dgal="${k}" title="${esc(ph.sub || '')}"><img data-file="${esc(ph.fileId)}" alt="">${k === 3 && photos.length > 4 ? `<span class="more">+${photos.length - 4}</span>` : ''}</button>`).join('')}<span class="dh-pl">${plural(photos.length, 'صورة واحدة', 'صورتان', 'صور', 'صورة')}</span></div>` : ''}</div></div>
  ${pFactsHTML(p)}
  <div class="dbar"><div class="dbar-in">${secs.map(([id, l], i) => `<a href="#${id}" data-anchor="${id}" class="${i === 0 ? 'on' : ''}">${l}</a>`).join('')}<span class="sp"></span>
    <button class="btn sm ghost" data-print title="طباعة صفحة الشراكة كما تظهر">${icon('print')} طباعة</button>
    <button class="btn sm" data-dossier data-tour="detail-dossier" title="ملف واحد يجمع التفاصيل والنماذج والصور والمستندات">${icon('file')} الملف الشامل</button>
    ${can('view.reports') ? `<a class="btn sm ghost" href="#/reports?ids=${p.id}" data-tour="detail-report">${icon('file')} تقرير</a>` : ''}
    ${canEdit ? `<a class="btn sm primary" href="#/partnerships/${p.id}/edit">${icon('edit')} تعديل</a>` : ''}
    ${can('delete.partnership') ? `<button class="btn sm danger" data-del>${icon('trash')}</button>` : ''}</div></div>
  <div class="dbody"><div>
    ${printHead('بطاقة شراكة — ' + (pr ? pr.name : p.title), '', { compact: true })}
    ${p.isDraft ? `<div class="note warn" style="margin-bottom:16px">${icon('edit')}<span>هذا السجل محفوظ كمسودة ولا يظهر إلا لفريق إدارة الشراكات. ${canEdit ? `<a href="#/partnerships/${p.id}/edit">استكمل البيانات واحفظه</a>.` : ''}</span></div>` : ''}
    ${(() => { const a = internal ? expiryAlert(p) : null; return a ? `<div class="p-alert ${a.tone}" role="alert" data-tour="detail-alert"><span class="pa-ic">${icon(a.tone === 'ended' ? 'flag' : 'alert')}</span><div class="grow"><b>${esc(a.title)}</b><span>${esc(a.text)}</span></div>${canEdit ? `<a class="btn sm" href="#/partnerships/${p.id}/edit">${icon('edit')} تحديث الشراكة</a>` : ''}</div>` : ''; })()}
    ${(p.showcaseGoal || firstItem(p.cooperationAreas)) ? `<blockquote class="st-quote">${esc(p.showcaseGoal || firstItem(p.cooperationAreas))}</blockquote>` : ''}
    ${wfHTML}
    ${profileSectionHTML(p)}
    <section class="dsec" id="ov"><h2>نظرة عامة <span class="src">من ملف الحصر</span></h2>
      ${pendingImportNotes(p).length || (p.importNotes || []).length ? `<div class="import-notes" style="margin-bottom:14px">${(p.importNotes || []).map((n, i) => `<div class="inote ${n.confirmed ? 'done' : ''}">${icon(n.confirmed ? 'check' : 'info')}<span class="grow">${esc(n.msg)}${n.confirmed ? ` — أُكّد في ${fmtDT(n.confirmedAt)}` : ''}</span>${!n.confirmed && canEdit ? `<button class="btn sm" data-confirmnote="${i}">تأكيد القيمة</button>` : ''}</div>`).join('')}</div>` : ''}
      <dl class="kv">
        ${kv('الجهة الشريكة', pr ? `<a href="#/partners/${pr.id}">${esc(pr.name)}</a>` : '')}
        ${kv('اسم الشراكة', esc(p.title))}
        ${kv('القطاع', esc(pSector(p)))}
        ${kv('تصنيف المذكرة', esc(p.classification))}
        ${kv('تصنيف الشراكة', (p.categories || []).length ? `<div class="tagline">${p.categories.map((c) => `<a class="chip plain cat" href="#/partnerships?category=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}</div>` : (canEdit ? `<a href="#/partnerships/${p.id}/edit">إضافة تصنيف</a>` : ''))}
        ${kv('تاريخ بدء الشراكة', p.startDate ? fmtDate(p.startDate) : '')}
        ${kv('تاريخ انتهاء الشراكة', p.endDate ? fmtDate(p.endDate) : '')}
        ${kv('المسؤول من إدارة الشراكات', esc((p.owners || []).join('، ')))}
        ${kv('تفعيل الشراكة', esc(p.activation))}
        ${kv('التقاطع مع الإدارات', (p.departments || []).length ? `<div class="tagline">${p.departments.map((d) => `<span class="chip plain">${esc(d)}</span>`).join('')}</div>` : '', true)}
      </dl></section>
    ${internal ? `<section class="dsec" id="files" data-tour="detail-files"><h2>الملفات والصور <span class="src">تقارير الشراكة من ملف الحصر</span></h2>
      <p class="small muted" style="margin:-6px 0 16px">${canEdit ? 'ارفع الملفات مباشرة في التصنيف المناسب أو اسحبها إليه. تُحفظ في هذا المتصفح، ولا تظهر المستندات في الواجهة التعريفية؛ تظهر صور الشراكة فقط إذا كانت الشراكة منشورة.' : 'ملفات الشراكة وصورها.'}</p>
      ${filesSectionHTML(p, canEdit)}</section>` : ''}
    <section class="dsec" id="coop" data-tour="detail-coop"><h2>مجالات التعاون <span class="src">من ملف الحصر</span></h2>${richHTML(p.cooperationAreas)}</section>
    <section class="dsec" id="impact"><h2>الأثر المتوقع من الشراكة وكيف يخدم المؤسسة <span class="src">من ملف الحصر</span></h2>${richHTML(p.expectedImpact)}
      <h2 style="margin-top:26px">المخرجات <span class="src">إسناد مشاريع، بناء مبادرات</span></h2>${richHTML(p.outputs)}</section>
    ${internal ? `<section class="dsec" id="follow"><h2>المتابعة <span class="src">من ملف الحصر</span></h2>
      <dl class="kv" style="grid-template-columns:1fr">
        <div><dt>الملاحظات</dt><dd>${richHTML(p.notes, { empty: 'لا توجد ملاحظات.' })}</dd></div>
        <div><dt>التوصيات</dt><dd>${richHTML(p.recommendations, { empty: 'لم تُسجَّل توصيات.' })}</dd></div>
        <div style="border-bottom:0"><dt>التحديات</dt><dd>${richHTML(p.challenges, { empty: 'لم تُسجَّل تحديات.' })}</dd></div></dl></section>` : ''}
    <section class="dsec" id="contact"><h2>ضابط الاتصال لدى الشريك <span class="src">من ملف الحصر</span></h2>
      ${can('view.contacts') ? `<dl class="kv">${kv('الاسم', esc(p.contactName))}${kv('البريد الإلكتروني', p.contactEmail ? `<a href="mailto:${esc(p.contactEmail)}" dir="ltr">${esc(p.contactEmail)}</a>` : '')}${kv('رقم الجوال', p.contactPhone ? `<a href="tel:${esc(p.contactPhone)}" class="num">${esc(p.contactPhone)}</a>` : '')}</dl>`
        : `<div class="locked">${icon('lock')}<span>بيانات التواصل متاحة لفريق إدارة الشراكات فقط.</span></div>`}</section>
    ${stories.length ? `<section class="dsec" id="stories"><h2>الإنجازات المرتبطة</h2><div class="story-list">${stories.map((a) => `<a class="story-item" href="#" data-story="${a.id}"><div class="th">${coverHTML('story' + a.id, a.coverFileId, { W: 400, H: 300, levels: 9, cols: 32, tone: toneFor(pr) })}</div><div><h4>${esc(a.title)}</h4>${a.metricValue ? `<div class="mv">${esc(a.metricValue)} ${esc(a.metricLabel || '')}</div>` : ''}<div class="m">${fmtDate(a.date)} ${a.public ? '' : '— غير منشور'} ${demoTag(a)}</div></div></a>`).join('')}</div></section>` : ''}
    ${prop ? `<section class="dsec" id="proposal"><h2>المقترح الأصلي</h2>
      <div class="row wrap" style="justify-content:space-between;margin-bottom:12px"><div class="row"><span class="code" style="font-size:14px">${esc(prop.ref)}</span>${propChip(prop.status)}</div><a class="btn sm" href="#/proposals/${prop.id}">فتح المقترح</a></div>
      <dl class="kv">${kv('الإدارة الطالبة', esc(prop.department))}${kv('مقدم الطلب', esc(prop.requesterName))}${kv('الهدف الاستراتيجي', esc(prop.strategicGoal), true)}${kv('المبادرة الاستراتيجية', esc(prop.initiative || ''), true)}<div class="full"><dt>أسباب طلب الشراكة من الجهة</dt><dd>${richHTML(prop.reasons)}</dd></div></dl>
      <p class="xs muted" style="margin-top:10px">قبول المقترح لا يعني توقيع الشراكة؛ تُتابَع مرحلة الشراكة في هذا السجل.</p></section>` : ''}
    ${internal ? `<section class="dsec" id="admin"><h2>بيانات إدارية <span class="adm">حقول إدارية مقترحة</span></h2>
      <dl class="kv">${kv('مرحلة الشراكة', esc(stageLabel(p.stage)) + (p.isDraft ? ' — مسودة' : ''))}${kv('الحالة المحسوبة', statusChip(p))}
        ${kv('الظهور في الواجهة التعريفية', p.public ? 'منشورة' : 'غير منشورة')}${kv('العرض المميز في الرئيسية', featured ? 'ضمن الشراكات المختارة' : 'لا')}
        ${kv('الهدف المختصر للعرض', esc(p.showcaseGoal || ''), true)}
        ${kv('أبرز نتيجة للعرض', p.highlight && p.highlight.value ? `<b>${esc(p.highlight.value)}</b> ${esc(p.highlight.label || '')}${p.highlight.text ? ' — ' + esc(p.highlight.text) : ''}` : '', true)}
        ${kv('أُنشئ', `${fmtDT(p.createdAt)} — ${esc(p.createdBy || '')}`)}${kv('آخر تحديث', `${fmtDT(p.updatedAt)} — ${esc(p.updatedBy || '')}`)}
        ${p.source ? kv('المصدر', esc(p.source)) : ''}</dl>
      ${p.importRaw ? `<details class="raw" style="margin-top:16px"><summary>${icon('table')} البيانات كما وردت في ملف الحصر (الصف ${p.seq})</summary><table>${p.importRaw.map((c) => `<tr><td>${esc(c.h)}</td><td>${esc(c.v) || '<span class="faint">فارغ</span>'}</td></tr>`).join('')}</table></details>` : ''}</section>` : ''}
    ${internal ? `<section class="dsec" id="log"><h2>سجل التغييرات</h2>${logs.length ? `<ul class="history">${logs.map((l) => `<li><div>${esc(AUDIT_LABELS[l.action] || l.action)}${l.details ? ` — <span class="muted">${esc(l.details)}</span>` : ''}</div><div class="w">${fmtDT(l.at)} — ${esc(l.user)}</div></li>`).join('')}</ul>` : '<p class="muted small">لا توجد تغييرات مسجلة على هذا السجل منذ إنشائه.</p>'}</section>` : ''}
  </div>
  <aside class="dside">
    <div class="side-card"><h3>فترة الشراكة</h3>
      ${p.startDate || p.endDate ? `<div class="term-big"><div class="term"><i style="width:${tp !== null ? (tp * 100).toFixed(0) : 0}%"></i></div><div class="lbls"><span>${fmtDate(p.startDate, 'short')}</span><span>${fmtDate(p.endDate, 'short')}</span></div></div>
        <p class="small" style="margin-top:6px">${st === 'upcoming' ? `يبدأ السريان بعد ${plural(daysBetween(today(), parseDate(p.startDate)), 'يوم واحد', 'يومين', 'أيام', 'يومًا')}` : dl !== null ? (dl >= 0 ? `متبقٍ ${plural(dl, 'يوم واحد', 'يومان', 'أيام', 'يومًا')} على الانتهاء` : `انتهت منذ ${plural(-dl, 'يوم واحد', 'يومين', 'أيام', 'يومًا')}`) : ''}</p>` : '<p class="small muted">لم تُحدَّد تواريخ البدء والانتهاء.</p>'}</div>
    <div class="side-card"><h3>المسؤولون من إدارة الشراكات</h3>${(p.owners || []).length ? `<div class="people">${p.owners.map((o) => `<div class="person">${avatar(o)}<span>${esc(o)}</span></div>`).join('')}</div>` : '<p class="small muted">لم يُحدَّد مسؤول.</p>'}</div>
    ${canEdit ? `<div class="side-card"><h3>اكتمال البيانات الأساسية</h3>${miss.length ? `<p class="small muted" style="margin-bottom:10px">${plural(miss.length, 'حقل واحد غير معبأ', 'حقلان غير معبأين', 'حقول غير معبأة', 'حقلًا غير معبأ')}:</p><div class="tagline">${miss.map((k) => `<span class="chip warn plain">${esc(FIELDS[k].label)}</span>`).join('')}</div><a class="btn sm" style="margin-top:12px" href="#/partnerships/${p.id}/edit">استكمال البيانات</a>` : '<p class="small" style="color:var(--ok)">جميع الحقول الأساسية معبأة.</p>'}</div>` : ''}
    ${can('manage.content') && !p.isDraft ? `<div class="side-card no-print"><h3>العرض في الواجهة</h3>
      <label class="row" style="justify-content:space-between;margin-bottom:10px"><span class="small">منشورة في الواجهة التعريفية</span><span class="switch"><input type="checkbox" data-pub ${p.public ? 'checked' : ''}><i></i></span></label>
      <label class="row" style="justify-content:space-between"><span class="small">ضمن الشراكات المختارة</span><span class="switch"><input type="checkbox" data-feat ${featured ? 'checked' : ''} ${p.public ? '' : 'disabled'}><i></i></span></label>
      <p class="xs muted" style="margin-top:10px">لا تظهر بيانات التواصل والمستندات الداخلية في الواجهة التعريفية.</p></div>` : ''}
  </aside></div>`;
  hydrateFiles(el);
  bindLogoUpload(el, () => rerenderKeep());
  bindWf(el, 'partnership', p);
  bindProfile(el, p);
  if (r.query && r.query.wf) setTimeout(() => { const w = $('#wf', el); if (w) window.scrollTo({ top: w.getBoundingClientRect().top + scrollY - 130 }); const c = wfStateOf('partnership', p).cur; if (c && wfCan(c, 'partnership', p)) wfStepDialog('partnership', p, c.id, () => route()); }, 200);
  // مركز القيادة: الأقسام تبويبات
  const showTab = (id) => { $$('.dbody > div > .dsec, .dbody > div > .st-quote', el).forEach((s) => s.classList.toggle('tab-on', s.id === id || (id === 'ov' && s.classList.contains('st-quote')))); $$('[data-anchor]', el).forEach((a) => a.classList.toggle('on', a.dataset.anchor === id)); App.ui.cmTab = id; };
  // تمييز القسم الظاهر في الشريط
  const anchors = $$('[data-anchor]', el);
  const obs = new IntersectionObserver((ents) => { if (el.classList.contains('tabbed')) return; ents.forEach((en) => { if (en.isIntersecting) anchors.forEach((a) => a.classList.toggle('on', a.dataset.anchor === en.target.id)); }); }, { rootMargin: '-140px 0px -60% 0px' });
  $$('.dsec', el).forEach((s) => s.id && obs.observe(s));
  el.onclick = async (e) => {
    const gs = e.target.closest('[data-gstar]'); if (gs) { e.preventDefault(); return toggleGolden(p, gs); }
    const fx = e.target.closest('[data-anchor-to]');
    if (fx) { e.preventDefault(); const t = $('#' + fx.dataset.anchorTo, el); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 124, behavior: 'smooth' }); return; }
    const an = e.target.closest('[data-anchor]');
    if (an) { e.preventDefault(); if (el.classList.contains('tabbed')) { showTab(an.dataset.anchor); return; } const s = $('#' + an.dataset.anchor, el); s && window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 124, behavior: 'smooth' }); return; }
    if (e.target.closest('[data-print]')) return window.print();
    if (e.target.closest('[data-dossier]')) return dossierDialog(p);
    const dg = e.target.closest('[data-dgal]'); if (dg) return openGallery(photos, +dg.dataset.dgal);
    const vf = e.target.closest('[data-viewf]'); if (vf) return viewStored(vf.dataset.viewf);
    const sc = e.target.closest('[data-setcover]');
    if (sc) { p.coverFileId = sc.dataset.setcover; await Repo.save('partnerships', p); await Repo.log('partnership.files', 'partnership', p.id, p.code, 'تغيير صورة الغلاف'); toast('عُيّنت صورة الغلاف'); return rerenderKeep(); }
    const da = e.target.closest('[data-delatt]');
    if (da) {
      const a = (p.attachments || []).find((x) => x.id === da.dataset.delatt); if (!a) return;
      if (!(await confirmDlg(`حذف «${esc(a.name)}» من ملفات الشراكة؟`, { title: 'حذف ملف', ok: 'حذف', danger: true }))) return;
      p.attachments = p.attachments.filter((x) => x.id !== a.id);
      if (p.coverFileId === a.fileId) p.coverFileId = (p.attachments.find((x) => x.category === 'صور الشراكة' && isImg(x)) || {}).fileId || null;
      await Repo.save('partnerships', p);
      const used = D.partnerships.some((x) => (x.attachments || []).some((y) => y.fileId === a.fileId) || x.coverFileId === a.fileId) || D.proposals.some((x) => (x.attachments || []).some((y) => y.fileId === a.fileId));
      if (!used && !/^(lib|asset):/.test(a.fileId)) await Store.delFile(a.fileId);
      await Repo.log('partnership.files', 'partnership', p.id, p.code, `حذف «${a.name}» من «${a.category}»`);
      toast('حُذف الملف'); return rerenderKeep();
    }
    const sto = e.target.closest('[data-story]'); if (sto) { e.preventDefault(); return openStory(sto.dataset.story); }
    const cn = e.target.closest('[data-confirmnote]');
    if (cn) { const n = p.importNotes[+cn.dataset.confirmnote]; n.confirmed = true; n.confirmedAt = nowISO(); n.confirmedBy = Session.userName(); await Repo.save('partnerships', p); await Repo.log('partnership.confirm', 'partnership', p.id, p.code, 'تأكيد قيمة مستوردة: ' + n.field); toast('أُكّدت القيمة'); return route(); }
    if (e.target.closest('[data-del]')) {
      if (!(await confirmDlg(`سيُحذف سجل الشراكة «${esc(partnerName(p))}» نهائيًا من هذا المتصفح، مع إزالته من العرض المميز. لا يمكن التراجع إلا من نسخة احتياطية.`, { title: 'حذف الشراكة', ok: 'حذف السجل', danger: true }))) return;
      await Repo.remove('partnerships', p.id);
      D.settings.home.featured = (D.settings.home.featured || []).filter((x) => x !== p.id); await Repo.saveSettings();
      const pp = p.proposalId && D.proposals.find((x) => x.id === p.proposalId); if (pp) { pp.partnershipId = null; await Repo.save('proposals', pp); }
      await Repo.log('partnership.delete', 'partnership', p.id, p.code + ' — ' + partnerName(p));
      toast('حُذف السجل'); return go('#/partnerships');
    }
  };
  el.ondragover = (e) => { const c = e.target.closest('.fcat'); if (c && canEdit) { e.preventDefault(); $$('.fcat.over', el).forEach((x) => x !== c && x.classList.remove('over')); c.classList.add('over'); } };
  el.ondragleave = (e) => { const c = e.target.closest('.fcat'); if (c && !c.contains(e.relatedTarget)) c.classList.remove('over'); };
  el.ondrop = async (e) => { const c = e.target.closest('.fcat'); if (!c || !canEdit) return; e.preventDefault(); c.classList.remove('over'); if (await uploadToPartnership(p, c.dataset.fcat, [...e.dataTransfer.files])) rerenderKeep(); };
  el.onchange = async (e) => {
    if (e.target.matches('[data-fup]')) { const files = [...e.target.files]; e.target.value = ''; if (await uploadToPartnership(p, e.target.dataset.fup, files)) rerenderKeep(); return; }
    if (e.target.matches('[data-pub]')) {
      p.public = e.target.checked;
      if (!p.public) D.settings.home.featured = (D.settings.home.featured || []).filter((x) => x !== p.id);
      await Repo.save('partnerships', p); await Repo.saveSettings();
      await Repo.log('partnership.publish', 'partnership', p.id, p.code, p.public ? 'نُشرت في الواجهة' : 'أُخفيت من الواجهة');
      toast(p.public ? 'نُشرت الشراكة في الواجهة' : 'أُخفيت الشراكة من الواجهة'); route();
    }
    if (e.target.matches('[data-feat]')) {
      const f = D.settings.home.featured || (D.settings.home.featured = []);
      if (e.target.checked && !f.includes(p.id)) f.push(p.id);
      if (!e.target.checked) D.settings.home.featured = f.filter((x) => x !== p.id);
      await Repo.saveSettings();
      await Repo.log('home.featured', 'partnership', p.id, p.code, e.target.checked ? 'أُضيفت إلى الشراكات المختارة' : 'أُزيلت من الشراكات المختارة');
      toast(e.target.checked ? 'أُضيفت إلى الشراكات المختارة في الرئيسية' : 'أُزيلت من الشراكات المختارة'); route();
    }
  };
}
/* شريط الحقائق السريعة أسفل ترويسة الشراكة */
function pFactsHTML(p) {
  const st = pStatus(p), dl = daysLeft(p);
  const P = pProfile(p);
  const wf = wfInvolved(p) ? wfStateOf('partnership', p) : null;
  const done = wf ? WF_STEPS.filter((x) => wf.S[x.id] && wf.S[x.id].status === 'done').length : 0;
  const files = (p.attachments || []).length;
  const cell = (ic, l, v, sub, href, tone = '') => `<a class="pfx ${tone}" href="${href}" data-anchor-to="${href.slice(1)}"><span class="pfx-ic">${icon(ic)}</span><span class="pfx-b"><small>${l}</small><b>${v}</b>${sub ? `<em>${sub}</em>` : ''}</span></a>`;
  return `<div class="pfacts" aria-label="حقائق سريعة">
    ${cell('flag', 'الحالة', esc(statusLabel(st)), dl !== null && ['active', 'soon'].includes(st) ? `متبقٍ ${plural(dl, 'يوم واحد', 'يومان', 'أيام', 'يومًا')}` : p.endDate ? 'حتى ' + fmtDate(p.endDate, 'short') : '', '#ov', st === 'soon' ? 'warn' : '')}
    ${wf ? cell('layers', 'مسار المذكرة', `${done} من ${WF_STEPS.length}`, wf.cur ? `${wf.cur.n}. ${esc(wf.cur.t)}` : 'اكتمل المسار', '#wf') : ''}
    ${cell('star', 'آخر تقييم', P.ev && P.ev.score !== null ? `${P.ev.score} <span class="pfx-u">من 100</span>` : 'لم تُقيَّم', P.ev && P.ev.score !== null ? evalGrade(P.ev.score) : 'نموذج تقييم الشراكة', '#profile', P.ev && P.ev.score !== null ? evalTone(P.ev.score) : 'mute')}
    ${can('view.internal') ? cell('chart', 'القيمة التقديرية', P.total ? sarShort(P.total) + ' <span class="pfx-u">ر.س</span>' : '—', P.ptype || 'تصنيف غير محدد', '#profile') : ''}
    ${can('view.internal') ? cell('clip', 'الملفات والصور', String(files), files ? `${partnershipPhotos(p).length} صورة` : 'لا ملفات بعد', '#files') : ''}
  </div>`;
}
const FILE_CAT_IC = { 'تقرير الشراكة العام': 'file', 'صور الشراكة': 'image', 'تقييم الشراكة': 'award', 'الاتفاقية': 'flag', 'مرفقات المقترح': 'send', 'أخرى': 'clip' };
function filesSectionHTML(p, canEdit) {
  const atts = p.attachments || [];
  const cats = L('attachmentCats').filter((c) => c !== 'مرفقات المقترح' || atts.some((a) => a.category === c));
  const extra = [...new Set(atts.map((a) => a.category || 'أخرى'))].filter((c) => !cats.includes(c));
  const ordered = [...cats, ...extra].sort((a, b) => (a === 'صور الشراكة' ? -1 : b === 'صور الشراكة' ? 1 : a === 'الاتفاقية' ? -1 : b === 'الاتفاقية' ? 1 : 0));
  return `<div class="fcats">${ordered.map((c) => {
    const list = atts.filter((a) => (a.category || 'أخرى') === c);
    const photos = c === 'صور الشراكة';
    return `<div class="fcat ${photos ? 'wide' : ''} ${list.length ? '' : 'is-empty'}" data-fcat="${esc(c)}">
      <div class="fcat-h"><span class="fcat-ic">${icon(FILE_CAT_IC[c] || 'clip')}</span><div class="grow"><b>${esc(c)}</b><span>${list.length ? plural(list.length, 'ملف واحد', 'ملفان', 'ملفات', 'ملفًا') : 'لا توجد ملفات'}</span></div>
        ${canEdit ? `<label class="btn sm">${icon('upload')} رفع${photos ? ' صور' : ''}<input type="file" multiple hidden data-fup="${esc(c)}" ${photos ? 'accept="image/*"' : ''}></label>` : ''}</div>
      ${photos && list.length ? `<div class="fphotos" data-galbox>${list.map((a) => `<div class="fph"><div class="g" data-zoom="${esc(a.fileId)}" data-cap="${esc(partnerName(p))}" data-sub="${esc(a.name)}"><img data-file="${esc(a.fileId)}" alt="${esc(a.name)}">${a.fileId.startsWith('lib:') ? '<span class="illus">توضيحية</span>' : ''}${p.coverFileId === a.fileId ? '<span class="fcover">الغلاف</span>' : ''}</div>
        <div class="fph-m"><span title="${esc(a.name)}">${esc(a.name)}</span><span class="fph-a">${canEdit && p.coverFileId !== a.fileId ? `<button class="linkbtn" data-setcover="${esc(a.fileId)}">تعيين غلافًا</button>` : ''}<button class="icon-btn" data-dl="${esc(a.fileId)}" data-name="${esc(a.name)}" title="تنزيل الصورة">${icon('download')}</button>${canEdit ? `<button class="icon-btn" data-delatt="${esc(a.id)}" title="حذف الصورة">${icon('trash')}</button>` : ''}</span></div></div>`).join('')}</div>` : ''}
      ${!photos && list.length ? `<div class="att-list">${list.map((a) => `<div class="att"><span class="fi">${attIcon(a)}</span><div class="grow"><div class="nm" title="${esc(a.name)}">${esc(a.name)}</div><div class="mt"><span class="num">${fmtSize(a.size || 0)}</span> — ${fmtDate(a.addedAt || a.at)}${a.by ? ' — ' + esc(a.by) : ''}${a.fromProposal ? ` — من المقترح ${esc(a.fromProposal)}` : ''}</div></div>
        <button class="icon-btn" data-viewf="${esc(a.fileId)}" title="عرض">${icon('eye')}</button><button class="icon-btn" data-dl="${esc(a.fileId)}" data-name="${esc(a.name)}" title="تنزيل">${icon('download')}</button>${canEdit ? `<button class="icon-btn" data-delatt="${esc(a.id)}" title="حذف">${icon('trash')}</button>` : ''}</div>`).join('')}</div>` : ''}
      ${canEdit ? `<div class="fdrop ${list.length ? 'sm' : ''}">${icon('upload')} ${list.length ? 'اسحب ملفات إضافية هنا' : 'اسحب الملفات هنا أو استخدم زر «رفع»'}</div>` : (list.length ? '' : '<div class="fdrop ro">لم تُرفع ملفات.</div>')}
    </div>`;
  }).join('')}</div>`;
}
async function viewStored(fileId) {
  const f = await Store.getFile(fileId);
  if (!f) return toast('تعذّر العثور على الملف في التخزين المحلي.', 'err');
  if (/^image\//.test(f.type)) return openGallery([{ fileId, caption: f.name }], 0);
  const u = URL.createObjectURL(f.blob);
  const w = window.open(u, '_blank');
  if (!w) download(f.name, f.blob);
  setTimeout(() => URL.revokeObjectURL(u), 60000);
}
async function uploadToPartnership(p, cat, files) {
  const added = [];
  for (const f of files) {
    if (cat === 'صور الشراكة' && !/^image\//.test(f.type)) { toast(`«${f.name}» ليس صورة؛ تصنيف «صور الشراكة» يقبل الصور فقط.`, 'err'); continue; }
    try { const rec = await saveUpload(f); added.push({ id: uid('att'), fileId: rec.id, name: rec.name, type: rec.type, size: rec.size, category: cat, addedAt: nowISO(), by: Session.userName() }); }
    catch (e) { toast(e.message, 'err'); }
  }
  if (!added.length) return false;
  p.attachments = [...(p.attachments || []), ...added];
  let coverMsg = '';
  if (cat === 'صور الشراكة' && (!p.coverFileId || p.coverFileId.startsWith('lib:'))) { p.coverFileId = added[0].fileId; coverMsg = '، واستُخدمت الأولى غلافًا بدل الصورة التوضيحية'; }
  await Repo.save('partnerships', p);
  await Repo.log('partnership.files', 'partnership', p.id, p.code, `رفع ${added.length} إلى «${cat}»: ${added.map((a) => a.name).join('، ')}`);
  toast(`رُفع ${plural(added.length, 'ملف واحد', 'ملفان', 'ملفات', 'ملفًا')} إلى «${cat}»${coverMsg}`);
  return true;
}
const rerenderKeep = () => { const y = scrollY; route(); window.scrollTo(0, y); };
const AUDIT_LABELS = {
  'partnership.create': 'إنشاء سجل الشراكة', 'partnership.update': 'تعديل البيانات', 'partnership.delete': 'حذف سجل الشراكة', 'partnership.confirm': 'تأكيد قيمة مستوردة', 'partnership.publish': 'تغيير الظهور في الواجهة',
  'home.featured': 'تغيير العرض المميز', 'partnership.golden': 'الشراكات الذهبية', 'list.request': 'اقتراح خيار جديد', 'list.decision': 'قرار على خيار مقترح', 'workflow.direct': 'تسجيل مباشر', 'partnership.files': 'تحديث ملفات الشراكة', 'list.add': 'إضافة قيمة إلى قائمة', 'proposal.create': 'إنشاء مقترح', 'proposal.submit': 'تقديم مقترح', 'proposal.status': 'تغيير حالة مقترح', 'proposal.note': 'ملاحظة على مقترح', 'proposal.update': 'تحديث مقترح',
  'partner.create': 'إضافة جهة', 'partner.update': 'تعديل جهة', 'partner.merge': 'دمج جهتين', 'partner.delete': 'حذف جهة', 'settings.update': 'تعديل الإعدادات', 'content.save': 'حفظ محتوى', 'content.delete': 'حذف محتوى',
  'partnership.dossier': 'تجهيز الملف الشامل', seed: 'تهيئة المنصة', backup: 'نسخة احتياطية', restore: 'استعادة نسخة احتياطية', 'demo.toggle': 'إظهار/إخفاء البيانات التجريبية', 'role.switch': 'معاينة بحساب آخر', 'auth.login': 'تسجيل دخول', 'notify.read': 'قراءة الإشعارات', 'auth.logout': 'تسجيل خروج', 'auth.password': 'تغيير كلمة مرور',
};

/* ===== نموذج الإدخال والتعديل ===== */
const P_STEPS = [
  { id: 'entity', t: 'الجهة والتصنيف', d: 'الجهة الشريكة، واسم الشراكة، والقطاع، وتصنيف المذكرة، وتصنيف الشراكة.', f: ['partnerId', 'title', 'sector', 'classification', 'categories'] },
  { id: 'term', t: 'الفترة والتفعيل', d: 'تواريخ بدء الشراكة وانتهائها، وحالة التفعيل.', f: ['startDate', 'endDate', 'activation'] },
  { id: 'scope', t: 'مجالات التعاون والأثر', d: 'اكتب كل بند في سطر مستقل، ويمكن ترقيمه (1. 2. 3.) — يُعرض كقائمة منظمة.', f: ['cooperationAreas', 'expectedImpact'] },
  { id: 'outputs', t: 'المخرجات والمتابعة', d: 'المخرجات المستهدفة، والملاحظات، والتوصيات، والتحديات.', f: ['outputs', 'notes', 'recommendations', 'challenges'] },
  { id: 'team', t: 'الفريق والإدارات', d: 'المسؤول من إدارة الشراكات، والإدارات التي تتقاطع معها الشراكة.', f: ['owners', 'departments'] },
  { id: 'contact', t: 'ضابط الاتصال', d: 'بيانات التواصل لدى الجهة الشريكة. لا تظهر في الواجهة التعريفية.', f: ['contactName', 'contactEmail', 'contactPhone'] },
  { id: 'files', t: 'التقارير والمرفقات', d: 'التقرير العام، وصور الشراكة، وتقييم الشراكة، ووثيقة المذكرة.', f: ['attachments'] },
  { id: 'admin', t: 'الحالة والعرض', d: 'حقول إدارية مقترحة، منفصلة عن ملف الحصر وقابلة للتعديل.', f: ['stage', 'public', 'showcaseGoal', 'highlight', 'coverFileId'], admin: true },
];
function renderPartnershipForm(el, r) {
  const isNew = !r.params.id;
  const orig = isNew ? null : D.partnerships.find((x) => x.id === r.params.id);
  if (!can('edit.partnership')) { el.innerHTML = noAccessHTML(); return; }
  if (!isNew && !orig) { el.innerHTML = emptyHTML({ ic: 'search', title: 'لم يُعثر على الشراكة', actions: '<a class="btn" href="#/partnerships">العودة إلى السجل</a>' }); return; }
  const s = orig ? clone(orig) : { title: '', partnerId: '', classification: '', categories: [], cooperationAreas: '', expectedImpact: '', outputs: '', notes: '', recommendations: '', challenges: '', contactName: '', contactEmail: '', contactPhone: '', startDate: '', endDate: '', owners: [], departments: [], activation: '', attachments: [], stage: 'prep', public: false, showcaseGoal: '', highlight: null, coverFileId: null, isDraft: true };
  s.highlight = s.highlight || { value: '', label: '', text: '' };
  s.categories = s.categories || [];
  const canAdd = can('edit.partnership');
  const fromLabel = () => (orig ? `الشراكة ${orig.code}` : 'نموذج شراكة جديدة');
  const pr0 = partnerById(s.partnerId);
  const fs = { step: (r.query && r.query.step) || 'entity', newPartner: null, sector: pr0 ? pr0.sector || '' : '', logoFileId: pr0 ? pr0.logoFileId : null, errors: {} };
  App.dirty = false;
  const partnerOpts = () => D.partners.filter((x) => !x.demo || showDemo() || x.id === s.partnerId).sort((a, b) => a.name.localeCompare(b.name, 'ar')).map((x) => ({ value: x.id, label: x.name, sub: x.sector || '' }));
  const pName = () => (s.partnerId === '__new__' ? fs.newPartner.name : (partnerById(s.partnerId) || {}).name || '');
  el.innerHTML = `<div class="ph"><div><h1>${isNew ? 'شراكة جديدة' : 'تعديل الشراكة'}</h1><p>${isNew ? 'الحقول مستخرجة من ملف حصر الشراكات ومنظمة في مجموعات. لا يوجد حقل إلزامي سوى ما يحدد الجهة أو اسم الشراكة.' : `<span class="code">${esc(orig.code)}</span> — ${esc(partnerName(orig))}`}</p></div>
    <div class="ph-actions"><a class="btn ghost" href="${isNew ? '#/partnerships' : '#/partnerships/' + orig.id}">إلغاء</a></div></div>
    <div class="fwrap"><nav class="fnav" id="fnav" aria-label="مجموعات النموذج"></nav><div class="fpanel" id="fpanel"></div></div>`;
  const filled = (k) => { const v = k === 'sector' ? fs.sector : k === 'highlight' ? s.highlight.value : s[k]; return !(v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && !v.length)); };
  const drawNav = () => {
    $('#fnav', el).innerHTML = P_STEPS.map((st, i) => {
      const n = st.f.filter(filled).length, bad = st.f.some((k) => fs.errors[k]);
      return `${st.admin ? '<hr><div class="adm-l">حقول إدارية مقترحة</div>' : ''}<button type="button" data-step="${st.id}" class="${fs.step === st.id ? 'on' : ''} ${bad ? 'bad' : n === st.f.length ? 'done' : ''}"><span class="ix">${bad ? '!' : n === st.f.length ? icon('check') : i + 1}</span><span>${st.t}</span><span class="fc">${n}/${st.f.length}</span></button>`;
    }).join('');
  };
  const field = (k, label, inner, { hint = '', err = '', full = false } = {}) => `<div class="field ${full ? 'span2' : ''} ${fs.errors[k] ? 'invalid' : ''}" data-f="${k}"><label for="f_${k}">${esc(label)}</label>${inner}${hint ? `<span class="hint">${hint}</span>` : ''}<span class="err">${esc(fs.errors[k] || err)}</span></div>`;
  const ta = (k, label, { tall, hint } = {}) => field(k, label, `<textarea class="in ${tall ? 'tall' : ''}" id="f_${k}" data-k="${k}" rows="6">${esc(s[k])}</textarea><details class="list-prev"><summary>معاينة كما سيظهر في صفحة الشراكة</summary><div data-pv="${k}" style="margin-top:8px">${richHTML(s[k], { empty: 'لا يوجد نص بعد.' })}</div></details>`, { hint, full: true });
  const lst = (k, label, listKey, val, { multi = false, hint = '', full = false, add = 'إضافة إلى القائمة' } = {}) => field(k, label, comboHTML(k, { options: L(listKey), value: val, multi, allowAdd: canAdd, addLabel: add, placeholder: multi ? 'اختر أو اكتب لإضافة قيمة…' : 'اختر أو اكتب لإضافة قيمة…' }), { hint: hint || (canAdd ? 'اكتب قيمة غير موجودة لإضافتها إلى القائمة.' : ''), full });
  const sel = (k, label, opts, val, { empty = 'غير محدد' } = {}) => field(k, label, `<select class="in" id="f_${k}" data-k="${k}"><option value="">${empty}</option>${opts.map((o) => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}${val && !opts.includes(val) ? `<option selected>${esc(val)}</option>` : ''}</select>`);
  const drawStep = () => {
    const st = P_STEPS.find((x) => x.id === fs.step);
    const idx = P_STEPS.indexOf(st);
    let body = '';
    if (st.id === 'entity') {
      const sim = s.partnerId === '__new__' ? findSimilarPartners(fs.newPartner.name) : [];
      const otherCount = s.partnerId && s.partnerId !== '__new__' ? D.partnerships.filter((x) => x.partnerId === s.partnerId && x.id !== s.id).length : 0;
      body = `<div class="grid2">
        ${field('partnerId', 'الجهة الشريكة', comboHTML('partnerId', { options: [...partnerOpts(), ...(fs.newPartner ? [{ value: '__new__', label: fs.newPartner.name, sub: 'جهة جديدة — تُنشأ عند الحفظ' }] : [])], value: s.partnerId, allowAdd: true, addLabel: 'إضافة جهة جديدة' }), { hint: 'ابحث في سجل الجهات لتجنب تكرار الجهة بأسماء مختلفة.', full: true })}
        ${sim.length ? `<div class="span2 dup-warn">${icon('alert')}<span>توجد جهات بأسماء مشابهة: ${sim.map((x) => `<button type="button" data-usep="${x.id}">${esc(x.name)}</button>`).join('، ')}. اختر إحداها إن كانت الجهة نفسها.</span></div>` : ''}
        ${field('title', 'اسم الشراكة', `<input class="in" id="f_title" data-k="title" value="${esc(s.title)}" placeholder="${esc(pName() || 'يُستخدم اسم الجهة إن تُرك فارغًا')}">`, { hint: 'في ملف الحصر يحمل هذا العمود اسم الجهة الشريكة؛ يمكن تمييز الشراكة باسم مختلف عند تعدد الشراكات مع الجهة نفسها.', full: true })}
        ${lst('sector', 'القطاع', 'sectors', fs.sector, { hint: otherCount ? `يُحفظ على مستوى الجهة، ويسري على ${plural(otherCount, 'شراكة أخرى', 'شراكتين أخريين', 'شراكات أخرى', 'شراكة أخرى')} لها.` : 'يُحفظ على مستوى الجهة.' })}
        ${lst('classification', 'تصنيف المذكرة', 'classifications', s.classification)}
        <div class="span2 cat-field">${lst('categories', 'تصنيف الشراكة', 'categories', s.categories, { multi: true, full: true, add: 'إضافة تصنيف جديد', hint: 'يمكن اختيار أكثر من تصنيف. التصنيف الجديد الذي تكتبه هنا يُحفظ في «القوائم» ويصبح متاحًا لجميع الشراكات.' })}<span class="chip gold plain cat-badge">حقل إضافي</span></div>
      </div>`;
    } else if (st.id === 'term') {
      body = `<div class="grid2">
        ${field('startDate', 'تاريخ بدء الشراكة', `<input type="date" class="in" id="f_startDate" data-k="startDate" value="${esc(s.startDate)}">`)}
        ${field('endDate', 'تاريخ انتهاء الشراكة', `<input type="date" class="in" id="f_endDate" data-k="endDate" value="${esc(s.endDate)}">`, { hint: s.startDate ? `مدة سريعة: <button type="button" class="btn sm ghost" data-dur="1">سنة</button><button type="button" class="btn sm ghost" data-dur="2">سنتان</button><button type="button" class="btn sm ghost" data-dur="3">3 سنوات</button>` : '' })}
        ${lst('activation', 'تفعيل الشراكة', 'activation', s.activation)}
        <div class="field"><label>المدة</label><div class="in" style="background:var(--paper-2);display:flex;align-items:center" id="durOut">${durText()}</div></div>
      </div>${(s.importNotes || []).some((n) => !n.confirmed) ? `<div class="note warn" style="margin-top:16px">${icon('info')}<span>${esc(s.importNotes.filter((n) => !n.confirmed).map((n) => n.msg).join(' '))}</span></div>` : ''}`;
    } else if (st.id === 'scope') {
      body = `<div class="grid2">${ta('cooperationAreas', 'مجالات التعاون', { tall: true, hint: 'تُحفظ العناوين الفرعية (مثل: أولًا: التزامات الطرف الأول:) وتُعرض عناوينَ للقائمة.' })}${ta('expectedImpact', 'الأثر المتوقع من الشراكة وكيف يخدم المؤسسة', { tall: true })}</div>`;
    } else if (st.id === 'outputs') {
      body = `<div class="grid2">${ta('outputs', 'المخرجات (إسناد مشاريع، بناء مبادرات)')}${ta('notes', 'الملاحظات')}${ta('recommendations', 'التوصيات')}${ta('challenges', 'التحديات')}</div>`;
    } else if (st.id === 'team') {
      body = `<div class="grid2">
        ${lst('owners', 'المسؤول من إدارة الشراكات', 'team', s.owners, { multi: true, full: true, add: 'إضافة إلى الفريق', hint: 'يمكن اختيار أكثر من مسؤول، أو كتابة اسم جديد لإضافته إلى الفريق.' })}
        ${lst('departments', 'التقاطع مع الإدارات', 'departments', s.departments, { multi: true, full: true, add: 'إضافة إدارة' })}
      </div>`;
    } else if (st.id === 'contact') {
      body = `<div class="grid2">
        ${field('contactName', 'ضابط الاتصال', `<input class="in" id="f_contactName" data-k="contactName" value="${esc(s.contactName)}">`, { full: true })}
        ${field('contactEmail', 'البريد الإلكتروني للشريك', `<input class="in" type="email" dir="ltr" id="f_contactEmail" data-k="contactEmail" value="${esc(s.contactEmail)}" placeholder="name@example.com">`)}
        ${field('contactPhone', 'رقم الجوال', `<input class="in" dir="ltr" inputmode="tel" id="f_contactPhone" data-k="contactPhone" value="${esc(s.contactPhone)}" placeholder="05XXXXXXXX">`)}
      </div><div class="note" style="margin-top:16px">${icon('lock')}<span>تظهر بيانات التواصل لفريق الشراكات ومستخدمي الاطلاع، ولا تظهر لممثلي الإدارات الأخرى ولا في الواجهة التعريفية.</span></div>`;
    } else if (st.id === 'files') {
      body = attachEditorHTML('pAtt', { cats: L('attachmentCats'), defaultCat: L('attachmentCats')[0] });
    } else if (st.id === 'admin') {
      body = `<div class="grid2">
        ${field('stage', 'مرحلة الشراكة', `<select class="in" id="f_stage" data-k="stage">${D.settings.stages.map((o) => `<option value="${o.id}" ${o.id === s.stage ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`, { hint: 'تُحسب حالة السريان (سارية، تنتهي قريبًا، منتهية) تلقائيًا من التواريخ عندما تكون المرحلة «موقّعة».' })}
        <div class="field"><label>الظهور في الواجهة التعريفية</label><label class="row" style="min-height:42px"><span class="switch"><input type="checkbox" data-k="public" ${s.public ? 'checked' : ''}><i></i></span><span class="small">نشر الشراكة في الرئيسية وجدار الشركاء</span></label><span class="hint">لا تُنشر المسودات مهما كان هذا الخيار.</span></div>
        ${field('showcaseGoal', 'الهدف المختصر للعرض', `<textarea class="in" id="f_showcaseGoal" data-k="showcaseGoal" rows="2" style="min-height:70px">${esc(s.showcaseGoal || '')}</textarea>`, { hint: 'جملة واحدة تظهر في الشراكات المختارة. إن تُرك فارغًا يُعرض أول بند من مجالات التعاون.', full: true })}
        <div class="span2"><div class="flabel" style="margin-bottom:6px">أبرز نتيجة للعرض</div><div class="grid3">
          <div class="field"><input class="in" data-hl="value" value="${esc(s.highlight.value)}" placeholder="الرقم، مثل 4,800"></div>
          <div class="field"><input class="in" data-hl="label" value="${esc(s.highlight.label)}" placeholder="الوحدة، مثل شجرة محلية"></div>
          <div class="field"><input class="in" data-hl="text" value="${esc(s.highlight.text)}" placeholder="وصف مختصر للنتيجة"></div></div>
          <span class="hint" style="font-size:12.5px;color:var(--faint)">أدخل نتيجة متحققة فعلًا. إن تُركت فارغة تُعرض المخرجات المستهدفة بعنوان «المخرجات المستهدفة».</span></div>
        <div class="field"><label>صورة الغلاف</label><div class="row">${s.coverFileId ? `<img data-file="${esc(s.coverFileId)}" style="width:120px;height:68px;object-fit:cover;border-radius:6px" alt="">` : '<span class="small muted">غلاف مولّد من الهوية</span>'}<label class="btn sm">${icon('upload')} رفع صورة<input type="file" accept="image/*" hidden data-upcover></label><button type="button" class="btn sm" data-libcover>${icon('image')} من المكتبة التوضيحية</button>${s.coverFileId ? '<button type="button" class="btn sm ghost" data-rmcover>إزالة</button>' : ''}</div>${s.coverFileId && s.coverFileId.startsWith('lib:') ? '<span class="hint">صورة توضيحية مولّدة — يُفضَّل استبدالها بصورة فعلية من الميدان.</span>' : ''}</div>
        <div class="field"><label>شعار الجهة</label><div class="row">${fs.logoFileId ? `<div class="plate s56"><img data-file="${esc(fs.logoFileId)}" alt=""></div>` : '<span class="small muted">لا يوجد شعار</span>'}<label class="btn sm">${icon('upload')} ${fs.logoFileId ? 'تغيير' : 'رفع شعار'}<input type="file" accept="image/*" hidden data-uplogo></label></div><span class="hint">يُحفظ على مستوى الجهة ويظهر في جميع شراكاتها.</span></div>
      </div>`;
    }
    const errs = Object.entries(fs.errors);
    $('#fpanel', el).innerHTML = `<div class="fpanel-h ${st.admin ? '' : ''}"><h2>${st.t} ${st.admin ? '<span class="chip gold plain" style="vertical-align:middle;margin-inline-start:6px">حقول إدارية مقترحة</span>' : ''}</h2><p>${st.d}</p></div>
      <div class="fpanel-b">${errs.length ? `<div class="err-sum"><b>يلزم تصحيح ${plural(errs.length, 'حقل واحد', 'حقلين', 'حقول', 'حقلًا')} قبل الحفظ:</b><ul>${errs.map(([k, m]) => `<li><a data-goerr="${k}">${esc((FIELDS[k] || { label: k }).label)}</a>: ${esc(m)}</li>`).join('')}</ul></div>` : ''}${body}</div>
      <div class="fpanel-f"><span class="st ${App.dirty ? 'dirty' : ''}" id="fstate">${App.dirty ? icon('edit') + ' تعديلات غير محفوظة' : isNew ? 'سجل جديد لم يُحفظ' : s.isDraft ? 'مسودة محفوظة' : 'محفوظ'}</span>
        ${idx > 0 ? `<button type="button" class="btn ghost" data-prev>${icon('chevR')} السابق</button>` : ''}
        ${idx < P_STEPS.length - 1 ? `<button type="button" class="btn" data-next>التالي ${icon('chevL')}</button>` : ''}
        ${isNew || s.isDraft ? `<button type="button" class="btn" data-save="draft">حفظ كمسودة</button>` : ''}
        <button type="button" class="btn primary" data-save="final">${isNew || s.isDraft ? 'حفظ السجل' : 'حفظ التعديلات'}</button></div>`;
    bindCombos($('#fpanel', el));
    hydrateFiles($('#fpanel', el));
    if (st.id === 'files') bindAttachEditor($('#pAtt', el), () => s.attachments, (v) => { s.attachments = v; }, { onChange: markDirty });
    drawNav();
  };
  function durText() {
    const a = parseDate(s.startDate), b = parseDate(s.endDate);
    if (!a || !b) return '<span class="faint">تُحسب بعد إدخال التاريخين</span>';
    if (b < a) return '<span style="color:var(--danger)">تاريخ الانتهاء قبل تاريخ البدء</span>';
    const d = daysBetween(a, b) + 1, m = Math.round(d / 30.44);
    return `${plural(d, 'يوم واحد', 'يومان', 'أيام', 'يومًا')} (نحو ${plural(m, 'شهر', 'شهرين', 'أشهر', 'شهرًا')})`;
  }
  function markDirty() { if (!App.dirty) { App.dirty = true; const f = $('#fstate', el); if (f) { f.className = 'st dirty'; f.innerHTML = icon('edit') + ' تعديلات غير محفوظة'; } } }
  const validate = (mode) => {
    const e = {};
    if (!s.partnerId && !s.title.trim()) e.partnerId = 'اختر الجهة الشريكة أو اكتب اسم الشراكة لتمييز السجل.';
    if (s.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.contactEmail.trim())) e.contactEmail = 'صيغة البريد الإلكتروني غير صحيحة، مثال: name@example.com';
    if (s.contactPhone && !/^\+?[0-9\s-]{7,16}$/.test(s.contactPhone.trim())) e.contactPhone = 'رقم الجوال يجب أن يتكون من أرقام فقط (7 إلى 15 رقمًا)، ويمكن أن يبدأ بعلامة +.';
    if (s.startDate && s.endDate && s.endDate < s.startDate) e.endDate = 'تاريخ الانتهاء يسبق تاريخ البدء.';
    if (mode === 'final' && s.stage === 'signed' && !s.startDate) e.startDate = 'المرحلة «موقّعة» تحتاج تاريخ بدء لحساب حالة السريان. اختر مرحلة أخرى أو أدخل التاريخ.';
    return e;
  };
  const save = async (mode) => {
    fs.errors = validate(mode);
    if (Object.keys(fs.errors).length) {
      const firstStep = P_STEPS.find((st) => st.f.some((k) => fs.errors[k]));
      fs.step = firstStep.id; drawStep();
      toast('لم يُحفظ السجل — راجع الحقول المشار إليها.', 'err');
      return;
    }
    // تحقق من التكرار
    if (s.partnerId && s.partnerId !== '__new__') {
      const dup = D.partnerships.find((x) => x.id !== s.id && x.partnerId === s.partnerId && !x.isDraft && x.classification === s.classification && (!s.startDate || !x.endDate || x.endDate >= s.startDate) && (!s.endDate || !x.startDate || x.startDate <= s.endDate));
      if (dup && !(await confirmDlg(`يوجد سجل آخر للجهة نفسها بالتصنيف نفسه وفترة متداخلة: <b>${esc(dup.code)}</b>. هل تريد الحفظ على أي حال؟`, { title: 'سجل مشابه', ok: 'حفظ على أي حال' }))) return;
    }
    // الجهة
    if (s.partnerId === '__new__') {
      const pr = { id: uid('ptr'), name: fs.newPartner.name, sector: fs.sector, aliases: [], website: '', notes: '', logoFileId: fs.logoFileId, createdAt: nowISO(), demo: false };
      await Repo.save('partners', pr); s.partnerId = pr.id;
      await Repo.log('partner.create', 'partner', pr.id, pr.name, 'أُضيفت من نموذج الشراكة');
    } else if (s.partnerId) {
      const pr = partnerById(s.partnerId);
      if (pr && (pr.sector !== fs.sector || pr.logoFileId !== fs.logoFileId)) { pr.sector = fs.sector; pr.logoFileId = fs.logoFileId; await Repo.save('partners', pr); }
    }
    if (!s.title.trim() && s.partnerId) s.title = partnerById(s.partnerId).name;
    s.title = s.title.trim(); s.contactEmail = (s.contactEmail || '').trim(); s.contactPhone = (s.contactPhone || '').trim();
    s.highlight = s.highlight && s.highlight.value ? s.highlight : null;
    s.isDraft = mode === 'draft';
    if (isNew) {
      Object.assign(s, { id: uid('pt'), code: nextPartnershipCode(s.startDate), createdAt: nowISO(), createdBy: Session.userName(), importNotes: [], importRaw: null, proposalId: null, demo: false });
      await Repo.save('partnerships', s); await Repo.saveSettings();
      await Repo.log('partnership.create', 'partnership', s.id, s.code + ' — ' + s.title, s.isDraft ? 'حُفظ كمسودة' : '');
    } else {
      const changed = diffLabels(orig, s);
      if (orig.isDraft && !s.isDraft) changed.unshift('اعتماد السجل من مسودة');
      await Repo.save('partnerships', s);
      if (!s.public || s.isDraft) { D.settings.home.featured = (D.settings.home.featured || []).filter((x) => x !== s.id); await Repo.saveSettings(); }
      await Repo.log('partnership.update', 'partnership', s.id, s.code + ' — ' + s.title, changed.length ? 'عُدّل: ' + changed.join('، ') : 'دون تغيير في الحقول');
    }
    App.dirty = false;
    toast(s.isDraft ? 'حُفظت المسودة' : 'حُفظ سجل الشراكة');
    go('#/partnerships/' + s.id);
  };
  drawStep();
  const panel = $('#fpanel', el);
  el.addEventListener('click', async (e) => {
    const stp = e.target.closest('[data-step]'); if (stp) { fs.step = stp.dataset.step; drawStep(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (e.target.closest('[data-next]')) { fs.step = P_STEPS[P_STEPS.findIndex((x) => x.id === fs.step) + 1].id; drawStep(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest('[data-prev]')) { fs.step = P_STEPS[P_STEPS.findIndex((x) => x.id === fs.step) - 1].id; drawStep(); window.scrollTo({ top: 0 }); return; }
    const sv = e.target.closest('[data-save]'); if (sv) return save(sv.dataset.save);
    const ge = e.target.closest('[data-goerr]'); if (ge) { const st = P_STEPS.find((x) => x.f.includes(ge.dataset.goerr)); fs.step = st.id; drawStep(); setTimeout(() => { const f = $(`[data-f="${ge.dataset.goerr}"] .in, [data-f="${ge.dataset.goerr}"] input`, el); f && f.focus(); }, 50); return; }
    const up = e.target.closest('[data-usep]'); if (up) { s.partnerId = up.dataset.usep; fs.newPartner = null; const pr = partnerById(s.partnerId); fs.sector = pr.sector || ''; fs.logoFileId = pr.logoFileId; markDirty(); drawStep(); return; }
    const du = e.target.closest('[data-dur]'); if (du) { const a = parseDate(s.startDate); const b = new Date(a); b.setFullYear(b.getFullYear() + +du.dataset.dur); b.setDate(b.getDate() - 1); s.endDate = isoDate(b); markDirty(); drawStep(); return; }
    if (e.target.closest('[data-rmcover]')) { s.coverFileId = null; markDirty(); drawStep(); }
    if (e.target.closest('[data-libcover]')) { const k = await pickLibImage(s.coverFileId); if (k) { s.coverFileId = 'lib:' + k; markDirty(); drawStep(); } }
  });
  el.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (k) {
      s[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; markDirty();
      if (fs.errors[k]) { delete fs.errors[k]; e.target.closest('.field') && e.target.closest('.field').classList.remove('invalid'); drawNav(); }
      const pv = $(`[data-pv="${k}"]`, el); if (pv) pv.innerHTML = richHTML(s[k], { empty: 'لا يوجد نص بعد.' });
      if (k === 'startDate' || k === 'endDate') { const d = $('#durOut', el); d && (d.innerHTML = durText()); }
    }
    if (e.target.dataset.hl) { s.highlight[e.target.dataset.hl] = e.target.value; markDirty(); }
  });
  el.addEventListener('change', async (e) => {
    if (e.target.matches('select[data-k]')) { s[e.target.dataset.k] = e.target.value; markDirty(); drawNav(); }
    if (e.target.matches('input[type=date][data-k]')) { drawStep(); }
    if (e.target.matches('[data-upcover]') && e.target.files[0]) { try { const f = await saveUpload(e.target.files[0]); s.coverFileId = f.id; markDirty(); drawStep(); } catch (er) { toast(er.message, 'err'); } }
    if (e.target.matches('[data-uplogo]') && e.target.files[0]) { try { const f = await saveUpload(e.target.files[0]); fs.logoFileId = f.id; markDirty(); drawStep(); } catch (er) { toast(er.message, 'err'); } }
  });
  el.addEventListener('cbchange', (e) => {
    const k = e.target.dataset.cb;
    if (k === 'partnerId') {
      s.partnerId = e.detail;
      if (s.partnerId && s.partnerId !== '__new__') { const pr = partnerById(s.partnerId); fs.sector = pr.sector || ''; fs.logoFileId = pr.logoFileId; fs.newPartner = null; }
      if (fs.errors.partnerId) delete fs.errors.partnerId;
      markDirty(); drawStep(); return;
    }
    if (k === 'sector') { fs.sector = e.detail; markDirty(); drawNav(); return; }
    s[k] = e.detail; markDirty(); drawNav();
  });
  el.addEventListener('cbadd', async (e) => {
    const k = e.target.dataset.cb;
    if (k === 'partnerId') {
      e.preventDefault();
      const name = e.detail.value.trim();
      const sim = findSimilarPartners(name);
      if (sim.length && !(await confirmDlg(`توجد جهات بأسماء مشابهة لـ «${esc(name)}»:<br><b>${sim.map((x) => esc(x.name)).join('<br>')}</b><br><br>هل تريد إضافة جهة جديدة رغم ذلك؟ يمكنك بدلًا من ذلك اختيار الجهة الموجودة من القائمة.`, { title: 'جهة مشابهة موجودة', ok: 'إضافة جهة جديدة' }))) return;
      fs.newPartner = { name }; s.partnerId = '__new__'; fs.sector = ''; fs.logoFileId = null;
      if (!s.title) s.title = '';
      markDirty(); drawStep();
      toast('ستُنشأ الجهة في سجل الجهات عند حفظ الشراكة');
      return;
    }
    const LIST_OF = { sector: 'sectors', classification: 'classifications', categories: 'categories', activation: 'activation', owners: 'team', departments: 'departments' };
    if (LIST_OF[k]) await addListValue(LIST_OF[k], e.detail.value, fromLabel());
  });
}
function noAccessHTML() {
  return emptyHTML({ ic: 'lock', title: 'هذه الصفحة غير متاحة لدورك الحالي', text: `الدور الحالي: ${esc(ROLES[Session.role()].label)}. الأدوار في النسخة المحلية محاكاة للتجربة فقط، ويمكن تبديلها من أعلى الصفحة.`, actions: '<a class="btn" href="#/">الرئيسية</a>' });
}
