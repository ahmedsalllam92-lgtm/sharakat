/* =====================================================================
   بطاقة الشراكة للطباعة: صفحة أو صفحتان A4 مصممتان للطباعة (لا تُطبع واجهة الصفحة التفاعلية)
   رأس داكن بالشعار والاسم، شريط حقائق، المدة والمسار، الهدف والمجالات والمخرجات والأثر، الفريق.
   لا تتضمن أقسام «البيانات الناقصة» ولا مناطق الرفع ولا السجل.
   ===================================================================== */
async function pcPrintHTML(p) {
  const pr = partnerById(p.partnerId) || {}, o = D.settings.org, name = partnerName(p);
  const st = pStatus(p), dl = daysLeft(p), tp = termProgress(p), P = pProfile(p), f = P.fin || {};
  const W = wfStateOf('partnership', p);
  const doneN = WF_STEPS.filter((s) => W.S[s.id] && W.S[s.id].status === 'done').length;
  const coop = richItems(p.cooperationAreas), outs = richItems(p.outputs), imps = richItems(p.expectedImpact);
  const url = async (id) => { const u = (await FileCache.url(id)) || ''; if (!u || u.startsWith('data:')) return u; try { const bl = await (await fetch(u)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => r(u); fr.readAsDataURL(bl); }); } catch (_) { return u; } };
  const lg = pr.logoFileId ? await url(pr.logoFileId) : '';
  const mlogo = (ASSET_IMG['murooj-logo-white'] || {}).src || '';
  const cover = p.coverFileId && !p.coverFileId.startsWith('lib:') ? await url(p.coverFileId) : '';
  const txt = (it) => esc(it.title ? `${it.title}: ${it.text || ''}` : it.text || '');
  const list = (arr, empty) => (arr.length ? `<ol>${arr.map((it) => `<li>${txt(it)}</li>`).join('')}</ol>` : `<p class="pcp-faint">${empty}</p>`);
  const tot = (+f.partnerSar || 0) + (+f.murojSar || 0) + (+f.inkindSar || 0);
  const ev = P.ev && P.ev.score !== null ? P.ev : null;
  const rem = ['active', 'soon'].includes(st) && dl !== null ? `${nf(dl)} يومًا` : st === 'ended' ? 'انتهت' : st === 'upcoming' && p.startDate ? 'لم تبدأ بعد' : '—';
  const fact = (l, v, s = '') => `<div><small>${l}</small><b>${v || '—'}</b>${s ? `<em>${s}</em>` : ''}</div>`;
  const steps = WF_STEPS.map((s) => { const r = W.S[s.id] || {}; const done = r.status === 'done', cur = W.cur && W.cur.id === s.id; return `<li class="${done ? 'd' : cur ? 'c' : ''}"><i>${done ? '✓' : s.n}</i><span>${esc(s.t)}</span></li>`; }).join('');
  return `<article class="pcp-print" dir="rtl">
    <header class="pcp-hd">${cover ? `<img class="pcp-hd-img" src="${cover}" alt="">` : ''}<span class="pcp-hd-veil"></span>
      <div class="pcp-hd-top">${mlogo ? `<img src="${mlogo}" alt="">` : ''}<span>${esc(o.name)} · ${esc(o.dept)}</span><em>بطاقة الشراكة</em></div>
      <div class="pcp-hd-main"><span class="pcp-lg">${lg ? `<img src="${lg}" alt="">` : `<b>${esc(initials(name))}</b>`}</span>
        <div><span class="pcp-code">${esc(p.code || '')}</span><h1>${esc(name)}</h1><p>${[p.classification, pSector(p) && 'القطاع ' + pSector(p), p.ptype].filter(Boolean).map(esc).join(' · ')}</p>
          <div class="pcp-tags"><span class="st st-${st}">${esc(statusLabel(st))}</span>${p.golden ? '<span class="gold">★ شراكة ذهبية</span>' : ''}${(p.renewals || []).length ? '<span>مُجدَّدة</span>' : ''}${p.activation ? `<span>${esc(p.activation)}</span>` : ''}</div></div></div>
    </header>
    <section class="pcp-facts">${fact('الحالة', esc(statusLabel(st)), esc(stageLabel(p.stage)))}${fact('المتبقي', rem, p.endDate ? 'حتى ' + fmtDate(p.endDate, 'short') : '')}${fact('مسار المذكرة', `${doneN} من ${WF_STEPS.length}`, W.cur && !W.closed ? esc(W.cur.t) : 'اكتمل')}${fact('آخر تقييم', ev ? `${ev.score}<small>/100</small>` : 'لم تُقيَّم', ev ? esc(evalGrade(ev.score)) : '')}${fact('القيمة التقديرية', tot ? sar(tot) : '—', esc(f.model || ''))}</section>
    ${p.startDate && p.endDate ? `<section class="pcp-term"><div class="pcp-term-l"><span><small>البداية</small><b>${fmtDate(p.startDate)}</b></span><span class="c"><small>انقضى</small><b>${tp !== null ? Math.round(Math.max(0, Math.min(1, tp)) * 100) + '%' : '—'}</b></span><span><small>النهاية</small><b>${fmtDate(p.endDate)}</b></span></div><div class="pcp-bar"><i style="width:${tp !== null ? Math.round(Math.max(0, Math.min(1, tp)) * 100) : 0}%"></i></div></section>` : ''}
    ${p.showcaseGoal || coop.length ? `<section class="pcp-goal"><small>هدف الشراكة</small><p>${esc(p.showcaseGoal ? trimP(p.showcaseGoal) : coop[0].title || coop[0].text || '')}</p></section>` : ''}
    <section class="pcp-cols">
      <div class="pcp-box"><h2><span>01</span>مجالات التعاون</h2>${list(coop, 'لم تُسجَّل.')}</div>
      <div class="pcp-box"><h2><span>02</span>المخرجات المستهدفة</h2>${list(outs, 'لم تُسجَّل.')}</div>
    </section>
    <section class="pcp-box wide"><h2><span>03</span>الأثر المتوقع وكيف يخدم المؤسسة</h2>${list(imps, 'لم يُسجَّل.')}</section>
    <section class="pcp-box wide pcp-wf"><h2><span>04</span>مسار المذكرة <em>${doneN} من ${WF_STEPS.length}</em></h2><ol class="pcp-steps">${steps}</ol></section>
    <section class="pcp-cols">
      <div class="pcp-box"><h2><span>05</span>الفريق</h2><dl><dt>المسؤولون من إدارة الشراكات</dt><dd>${esc((p.owners || []).join('، ')) || '—'}</dd><dt>الإدارات المشاركة</dt><dd>${esc((p.departments || []).join('، ')) || '—'}</dd></dl></div>
      <div class="pcp-box"><h2><span>06</span>الجهة الشريكة</h2><dl><dt>الجهة</dt><dd>${esc(pr.name || name)}</dd><dt>القطاع والمجال</dt><dd>${esc([pr.sector, pr.domain].filter(Boolean).join(' · ')) || '—'}</dd>${can('view.contacts') && p.contactName ? `<dt>ضابط الاتصال</dt><dd>${esc(p.contactName)}${p.contactEmail ? ` · <span dir="ltr">${esc(p.contactEmail)}</span>` : ''}</dd>` : ''}</dl></div>
    </section>
    <footer class="pcp-ft"><span>${esc(o.platform)} — ${esc(o.name)}</span><span>طُبعت في ${fmtDate(isoDate(today()))}</span></footer>
  </article>`;
}
async function printPartnershipCard(p) {
  document.querySelectorAll('#pcPrint').forEach((x) => x.remove());
  const host = document.createElement('div'); host.id = 'pcPrint'; host.innerHTML = await pcPrintHTML(p);
  document.body.appendChild(host);
  await Promise.all([...host.querySelectorAll('img')].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 2500); }))));
  const html = document.documentElement; html.classList.add('printing-card');
  let stp = $('#pcPage'); if (!stp) { stp = document.createElement('style'); stp.id = 'pcPage'; document.head.appendChild(stp); }
  stp.textContent = '@page{size:A4;margin:10mm}';
  const prev = document.title; document.title = `بطاقة الشراكة — ${partnerName(p)}`;
  const done = () => { html.classList.remove('printing-card'); stp.textContent = ''; host.remove(); document.title = prev; removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  window.print();
}
