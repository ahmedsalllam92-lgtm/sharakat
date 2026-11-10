/* ===== سجل الشراكات ===== */
const SORTS = {
  updated: { label: 'آخر تحديث', fn: (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '') },
  name: { label: 'الاسم', fn: (a, b) => partnerName(a).localeCompare(partnerName(b), 'ar') },
  status: { label: 'الحالة', fn: (a, b) => STATUS_ORDER.indexOf(pStatus(a)) - STATUS_ORDER.indexOf(pStatus(b)) },
  end: { label: 'تاريخ الانتهاء (الأقرب)', fn: (a, b) => (a.endDate || '9999').localeCompare(b.endDate || '9999') },
  start: { label: 'تاريخ البدء (الأحدث)', fn: (a, b) => (b.startDate || '').localeCompare(a.startDate || '') },
  code: { label: 'الرمز', fn: (a, b) => (a.code || '').localeCompare(b.code || '') },
};
function renderRegister(el, r) {
  const q = r.query || {};
  const st = { f: queryToFilters(q), q: q.q || '', missing: q.missing || '', importnote: q.importnote || '', partner: q.partner || '' };
  App.ui.regSort = App.ui.regSort || 'updated';
  const vkey = 'regView_' + design();
  App.ui[vkey] = App.ui[vkey] || 'cards';
  const VIEWS = [['cards', 'grid', 'بطاقات'], ['table', 'table', 'جدول']];
  const canEdit = can('edit.partnership');
  el.classList.add('regpage');
  el.innerHTML = `<div id="regPrintHead"></div>
    <div class="ph no-print"><div><h1>سجل الشراكات</h1><p>ابحث بالاسم أو الرمز أو أي نص في المجالات والمخرجات.</p></div>
    <div class="ph-actions">${can('export') ? `<button class="btn" data-xls>${icon('download')} Excel</button><button class="btn icon-only" data-print title="طباعة" aria-label="طباعة">${icon('print')}</button>` : ''}${can('view.reports') ? `<button class="btn" data-rep title="تقرير بالشراكات المعروضة">${icon('file')} تقرير</button>` : ''}${canEdit ? `<a class="btn primary" href="#/partnerships/new">${icon('plus')} شراكة جديدة</a>` : ''}</div></div>
    ${design() === 'board' ? '<div class="bo-strip-st no-print" id="regStrip" role="group" aria-label="تصفية سريعة حسب الحالة"></div>' : ''}
    <div class="reg-tools" data-tour="reg-tools">
      <div class="searchbox">${icon('search')}<input id="regQ" type="search" placeholder="بحث في السجل…" value="${esc(st.q)}" aria-label="بحث في السجل"></div>
      <div class="fbar" id="regF"></div>
    </div>
    <div class="reg-meta"><div class="row wrap"><span id="regCount"></span><div class="activef" id="regSpecial"></div></div>
      <div class="row"><label class="small muted" for="regSort">ترتيب</label><select id="regSort" class="in" style="width:auto;min-height:36px;padding-top:4px;padding-bottom:4px">${Object.entries(SORTS).map(([k, s]) => `<option value="${k}" ${k === App.ui.regSort ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
        <div class="seg" role="tablist" aria-label="طريقة العرض">${VIEWS.map(([k, ic, l]) => `<button data-view="${k}" class="${App.ui[vkey] === k ? 'on' : ''}" title="${l}">${icon(ic)}<span>${l}</span></button>`).join('')}</div></div></div>
    <div id="regBody"></div>`;
  const base = () => visiblePartnerships();
  const special = (list) => list.filter((p) => (!st.missing || (st.missing === '1' ? missingFields(p).length : missingFields(p).includes(st.missing))) && (!st.importnote || pendingImportNotes(p).length) && (!st.partner || p.partnerId === st.partner) && matchQ(searchText(p), st.q));
  const syncHash = () => {
    const f = filtersToQuery(st.f).slice(1);
    const extra = [st.q && `q=${encodeURIComponent(st.q)}`, st.missing && `missing=${encodeURIComponent(st.missing)}`, st.importnote && 'importnote=1', st.partner && `partner=${st.partner}`].filter(Boolean).join('&');
    const qs = [f, extra].filter(Boolean).join('&');
    history.replaceState(null, '', '#/partnerships' + (qs ? '?' + qs : ''));
    App.lastHash = location.hash;
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-sst]'); if (!b) return; const k = b.dataset.sst; if (k) st.f.status = k.split('|'); else delete st.f.status; fb.render(); draw(); syncHash(); });
  const fb = new FilterBar($('#regF', el), { dims: ['status', 'ptype', 'domain', 'category', 'sector', 'classification', 'department', 'owner', 'activation', 'year'], getList: () => special(base()), state: st.f, onChange: () => { draw(); syncHash(); } });
  const draw = () => {
    const all = base();
    let list = special(applyFilters(all, st.f)).sort(SORTS[App.ui.regSort].fn);
    App.lastRegList = list;
    $('#regCount', el).innerHTML = `<span>${list.length === all.length ? `${nf(all.length)} شراكة` : `${nf(list.length)} من ${nf(all.length)} شراكة`}</span>`;
    const sp = [];
    if (st.missing) sp.push(`<button data-clr="missing">${st.missing === '1' ? 'بيانات أساسية ناقصة' : 'لم يُعبَّأ: ' + esc(FIELDS[st.missing] ? FIELDS[st.missing].label : st.missing)} ${icon('x')}</button>`);
    if (st.importnote) sp.push(`<button data-clr="importnote">قيم استيراد تحتاج تأكيدًا ${icon('x')}</button>`);
    if (st.partner) { const pr = partnerById(st.partner); sp.push(`<button data-clr="partner">الجهة: ${esc(pr ? pr.name : '')} ${icon('x')}</button>`); }
    $('#regSpecial', el).innerHTML = sp.join('');
    const strip = $('#regStrip', el);
    if (strip) {
      // تصفية سريعة بالحالة: العدد يحترم بقية الفلاتر والبحث
      const pool = special(applyFilters(all, st.f, 'status'));
      const cur = (st.f.status || []).join('|');
      const SG = [['', 'الكل', null], ['active', 'سارية', ['active']], ['soon', 'تنتهي قريبًا', ['soon']], ['upcoming', 'لم يبدأ سريانها', ['upcoming']], ['prep|sign|hold', 'قيد الإعداد والتوقيع', ['prep', 'sign', 'hold']], ['ended', 'منتهية', ['ended']], ['draft', 'مسودات', ['draft']]];
      strip.innerHTML = SG.map(([k, l, sts]) => { const n = sts ? pool.filter((p) => sts.includes(pStatus(p))).length : pool.length; if (sts && !n && cur !== k) return ''; return `<button type="button" class="bo-sst ${cur === k ? 'on' : ''} ${k ? 's-' + k.split('|')[0] : ''}" data-sst="${k}"><b>${n}</b><span>${l}</span></button>`; }).join('');
    }
    $('#regPrintHead', el).innerHTML = printHead('سجل الشراكات', filtersText(st.f) + (st.q ? ` | البحث: ${st.q}` : ''));
    const body = $('#regBody', el);
    if (!all.length) {
      body.innerHTML = `<div class="panel">${emptyHTML({ ic: 'layers', title: 'لا توجد شراكات مسجلة بعد', text: canEdit ? 'أضف أول شراكة، أو حوّل مقترحًا مقبولًا من مقترحات الإدارات إلى سجل شراكة.' : 'لم تُسجَّل شراكات في المنصة حتى الآن.', actions: canEdit ? `<a class="btn primary" href="#/partnerships/new">${icon('plus')} شراكة جديدة</a>` : '' })}</div>`;
      return;
    }
    if (!list.length) {
      body.innerHTML = `<div class="panel">${emptyHTML({ ic: 'search', title: st.q ? `لا توجد نتائج لـ «${st.q}»` : 'لا توجد شراكات تطابق الفلاتر', text: 'جرّب كلمات أخرى أو خفّف الفلاتر. يتجاهل البحث الفروق بين الهمزات والتاء المربوطة.', actions: '<button class="btn" data-reset>مسح البحث والفلاتر</button>' })}</div>`;
      return;
    }
    const vw = App.ui[vkey];
    body.innerHTML = vw === 'cards' ? regCards(list) : regTable(list);
    hydrateFiles(body);
  };
  draw();
  /* الطباعة (حتى بـ Ctrl+P) تكون دائمًا بالجدول الرسمي ثم يعود العرض كما كان */
  el._bp = () => { if (!el.isConnected || App.ui[vkey] === 'table') return; el._pv = App.ui[vkey]; App.ui[vkey] = 'table'; draw(); };
  el._ap = () => { if (!el._pv) return; App.ui[vkey] = el._pv; el._pv = null; if (el.isConnected) draw(); };
  if (window.__regPr) { window.removeEventListener('beforeprint', window.__regPr[0]); window.removeEventListener('afterprint', window.__regPr[1]); }
  window.__regPr = [el._bp, el._ap]; window.addEventListener('beforeprint', el._bp); window.addEventListener('afterprint', el._ap);
  $('#regQ', el).addEventListener('input', debounce((e) => { st.q = e.target.value.trim(); fb.render(); draw(); syncHash(); }, 180));
  $('#regSort', el).onchange = (e) => { App.ui.regSort = e.target.value; draw(); };
  el.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) { App.ui[vkey] = v.dataset.view; $$('[data-view]', el).forEach((b) => b.classList.toggle('on', b === v)); draw(); return; }
    const c = e.target.closest('[data-clr]');
    if (c) { st[c.dataset.clr] = ''; fb.render(); draw(); syncHash(); return; }
    if (e.target.closest('[data-reset]')) { st.q = ''; $('#regQ', el).value = ''; for (const k of Object.keys(st.f)) delete st.f[k]; st.missing = st.importnote = st.partner = ''; fb.render(); draw(); syncHash(); return; }
    const th = e.target.closest('th[data-sort]');
    if (th) { App.ui.regSort = th.dataset.sort; $('#regSort', el).value = th.dataset.sort; draw(); return; }
    const pd = e.target.closest('[data-pcdos]'); if (pd) { const pp = D.partnerships.find((x) => x.id === pd.dataset.pcdos); if (pp) dossierDialog(pp); return; }
    const row = e.target.closest('[data-row]');
    if (row && !e.target.closest('a,button') && !row.closest('.cm-detail')) go('#/partnerships/' + row.dataset.row);
    if (e.target.closest('[data-print]')) { // الطباعة دائمًا بالجدول الرسمي، أفقيًا، بعد تحميل الشعارات
      (async () => {
        const pv = App.ui[vkey]; if (pv !== 'table') { App.ui[vkey] = 'table'; draw(); }
        await hydrateFiles(el); await Promise.all($$('#regBody img', el).map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 2500); }))));
        const html = document.documentElement; html.classList.add('printing-reg');
        let stp = $('#regPage'); if (!stp) { stp = document.createElement('style'); stp.id = 'regPage'; document.head.appendChild(stp); }
        stp.textContent = '@page{size:A4 landscape;margin:10mm 9mm}';
        const done = () => { html.classList.remove('printing-reg'); stp.textContent = ''; window.removeEventListener('afterprint', done); if (pv !== 'table') { App.ui[vkey] = pv; draw(); } };
        window.addEventListener('afterprint', done);
        window.print();
      })();
    }
    const qa = e.target.closest('[data-rtgo]'); if (qa) { go(qa.dataset.rtgo); return; }
    if (e.target.closest('[data-xls]')) exportPartnershipsXlsx(App.lastRegList || [], 'سجل-الشراكات');
    if (e.target.closest('[data-rep]')) { const ids = (App.lastRegList || []).map((p) => p.id); if (!ids.length) return toast('لا توجد شراكات معروضة.', 'err'); App.ui.rpt.ids = ids; go('#/reports'); }
  });
}
function termCell(p) {
  if (!p.startDate && !p.endDate) return '<span class="faint">—</span>';
  const dl = daysLeft(p), s = pStatus(p);
  let rem = '';
  if (dl !== null && ['active', 'soon'].includes(s)) rem = `<div class="xs ${s === 'soon' ? '' : 'faint'}" style="${s === 'soon' ? 'color:var(--warn)' : ''}">متبقٍ ${plural(dl, 'يوم واحد', 'يومان', 'أيام', 'يومًا')}</div>`;
  return `<div class="small">${fmtDate(p.startDate, 'short')} – ${fmtDate(p.endDate, 'short')}</div>${rem}`;
}
/* جدول السجل: خط بلون الحالة، وشريط يبيّن ما انقضى من مدة الشراكة، وتقييم، ومسؤولون، وأزرار سريعة عند المرور.
   عند الترتيب بالحالة تُجمَّع الشراكات تحت عنوان لكل حالة. */
function regTable(list) {
  const th = (k, l, cls = '') => `<th class="${cls}${k ? ' sortable' : ''}${k && App.ui.regSort === k ? ' sorted' : ''}" ${k ? `data-sort="${k}"` : ''}>${l}${k ? '<span class="ar">▾</span>' : ''}</th>`;
  const group = App.ui.regSort === 'status';
  const rows = []; let last = null;
  list.forEach((p) => {
    const st = pStatus(p);
    if (group && st !== last) { last = st; rows.push(`<tr class="rt-grp" style="--c:${ST_VAR(st)}"><td colspan="7"><span><i></i>${esc(statusLabel(st))}<b>${list.filter((x) => pStatus(x) === st).length}</b></span></td></tr>`); }
    rows.push(rtRow(p, st));
  });
  return `<div class="tbl-wrap rt-wrap"><table class="tbl rt"><thead><tr>${th('name', 'الشراكة', 'rt-c-name')}${th('', 'التصنيف والقطاع')}${th('status', 'الحالة')}${th('end', 'المدة', 'rt-c-term')}${th('', 'التقييم', 'rt-c-ev')}${th('', 'المسؤول')}${th('updated', 'آخر تحديث', 'rt-c-up')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function rtRow(p, st) {
  const pr = partnerById(p.partnerId), name = pr ? pr.name : p.title;
  const tp = termProgress(p), dl = daysLeft(p), ev = (pProfile(p).ev || {}).score;
  const sub = p.title && pr && p.title !== pr.name ? p.title : '';
  const own = p.owners || [];
  let rem = '';
  if (dl !== null && ['active', 'soon'].includes(st)) rem = `<span class="rt-rem ${st === 'soon' ? 'w' : ''}">متبقٍ ${plural(dl, 'يوم واحد', 'يومان', 'أيام', 'يومًا')}</span>`;
  else if (st === 'upcoming' && p.startDate) rem = `<span class="rt-rem">يبدأ بعد ${plural(Math.max(0, daysBetween(today(), parseDate(p.startDate))), 'يوم واحد', 'يومين', 'أيام', 'يومًا')}</span>`;
  else if (st === 'ended') rem = '<span class="rt-rem e">انتهت</span>';
  const term = p.startDate || p.endDate ? `<div class="rt-term">${tp !== null ? `<span class="rt-bar" title="انقضى ${Math.round(tp * 100)}% من المدة"><i style="width:${Math.max(3, Math.round(tp * 100))}%"></i></span>` : ''}<div class="small">${fmtDate(p.startDate, 'short')} – ${fmtDate(p.endDate, 'short')}</div>${rem}</div>` : '<span class="faint">—</span>';
  return `<tr data-row="${p.id}" tabindex="0" class="st-${st} ${p.golden ? 'gold' : ''}" style="--c:${ST_VAR(st)}">
    <td class="rt-c-name"><div class="t-name">${plateHTML(pr, 44)}<div class="rt-nm"><b>${esc(name)} ${demoTag(p)}${p.golden ? `<span class="rt-gold" title="شراكة ذهبية">${STAR_SVG}</span>` : ''}</b>
      <span class="rt-meta"><span class="code">${esc(p.code || '')}</span>${sub ? `<span class="rt-sub">${esc(sub)}</span>` : ''}</span>
      ${(p.categories || []).length ? `<span class="rt-cats">${p.categories.slice(0, 3).map((c) => `<em>${esc(c)}</em>`).join('')}${p.categories.length > 3 ? `<em>+${p.categories.length - 3}</em>` : ''}</span>` : ''}</div></div></td>
    <td><div class="rt-cls"><b>${esc(p.classification || '—')}</b>${pSector(p) ? `<span>${esc(pSector(p))}${p.ptype ? ` · ${esc(p.ptype)}` : ''}</span>` : p.ptype ? `<span>${esc(p.ptype)}</span>` : ''}</div></td>
    <td>${statusChip(p)}</td>
    <td class="rt-c-term">${term}</td>
    <td class="rt-c-ev">${ev != null ? `<span class="rt-ev ${evalTone(ev)}"><b>${ev}</b><small>/100</small></span>` : '<span class="faint xs">لم تُقيَّم</span>'}</td>
    <td><div class="rt-own" title="${esc(own.join('، ') || 'بلا مسؤول')}">${own.length ? `<span class="rt-avs">${own.slice(0, 3).map((o) => avatar(o)).join('')}</span><span class="small">${esc(own[0])}${own.length > 1 ? ` <em>+${own.length - 1}</em>` : ''}</span>` : '<span class="faint xs">بلا مسؤول</span>'}</div></td>
    <td class="rt-c-up"><span class="small muted">${relDays(p.updatedAt || p.createdAt)}</span>
      <span class="rt-acts no-print"><button type="button" data-pcdos="${p.id}" title="الملف الشامل" aria-label="الملف الشامل">${icon('file')}</button>${can('view.reports') ? `<button type="button" data-rtgo="#/reports?ids=${p.id}" title="تقرير" aria-label="تقرير">${icon('chart')}</button>` : ''}<span class="rt-go" aria-hidden="true">${icon('chevL')}</span></span></td></tr>`;
}
function regCards(list) {
  return `<div class="pc-grid">${list.map(pcardHTML).join('')}</div>`;
}
/* بطاقة الحلقة: الشعار داخل حلقة تمتلئ بالمدة المنقضية من الشراكة، وخط مسار مصغّر، وثلاثة أرقام */
function pcardHTML(p) {
  const pr = partnerById(p.partnerId) || null, st = pStatus(p), tp = termProgress(p), dl = daysLeft(p);
  const P = pProfile(p);
  const wf = wfInvolved(p) ? wfStateOf('partnership', p) : null;
  const done = wf ? WF_STEPS.filter((s) => wf.S[s.id] && wf.S[s.id].status === 'done').length : 0;
  const strat = (p.ptype || '').includes('استراتيجي');
  const name = pr ? pr.name : p.title;
  const R_ = 38, C = 2 * Math.PI * R_, pct = tp === null ? 0 : Math.max(0, Math.min(1, tp));
  const rem = ['active', 'soon'].includes(st) && dl !== null ? `<b>${nf(dl)}</b><small>يومًا</small>`
    : st === 'upcoming' && p.startDate ? `<small>يبدأ بعد</small><b>${nf(Math.max(0, daysBetween(today(), parseDate(p.startDate))))}</b>`
    : st === 'ended' ? '<small>انتهت</small>' : '<small>—</small>';
  const goal = p.showcaseGoal || firstItem(p.cooperationAreas) || firstItem(p.expectedImpact) || '';
  const ev = P.ev && P.ev.score !== null ? P.ev.score : null;
  const owners = p.owners || [];
  return `<article class="pc st-${st} ${strat ? 'strat' : ''} ${p.golden ? 'gold' : ''}" style="--c:${ST_VAR(st)}">
    <div class="pc-media">${p.golden ? `<span class="pc-gold" title="شراكة ذهبية">${STAR_SVG}<b>شراكة ذهبية</b></span>` : ''}${coverHTML(p.id + (pr ? pr.name : ''), p.coverFileId, { W: 640, H: 300, levels: 10, cols: 40, tone: toneFor(pr) })}<span class="pc-shade" aria-hidden="true"></span>
      <div class="pc-top">${statusChip(p)}${p.ptype ? `<span class="pc-type">${strat ? icon('star') : ''}${esc(p.ptype)}</span>` : ''}</div>
      ${goal ? `<p class="pc-goal">${esc(goal)}</p>` : ''}
    </div>
    <div class="pc-ring" ${tp !== null ? `title="انقضى ${Math.round(pct * 100)}% من مدة الشراكة"` : ''}>
      <svg viewBox="0 0 92 92" aria-hidden="true"><circle cx="46" cy="46" r="${R_}" class="t"/>${tp !== null ? `<circle cx="46" cy="46" r="${R_}" class="v" stroke-dasharray="${(pct * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 46 46)"/><circle cx="${(46 + R_ * Math.cos(pct * 2 * Math.PI - Math.PI / 2)).toFixed(1)}" cy="${(46 + R_ * Math.sin(pct * 2 * Math.PI - Math.PI / 2)).toFixed(1)}" r="4" class="k"/>` : ''}</svg>
      <span class="pc-lg ${pr && pr.logoFileId ? 'has' : ''}">${logoOrMono(pr, name)}</span>
    </div>
    <div class="pc-body"><div class="pc-head">
      <span class="pc-code">${esc(p.code || '')}${pSector(p) ? ` · ${esc(pSector(p))}` : ''}${pr && pr.domain ? ` · ${esc(pr.domain)}` : ''}</span>
      <h3><a class="pc-link" href="#/partnerships/${p.id}">${esc(name)}</a> ${demoTag(p)}</h3>
      <p class="pc-sub">${esc(p.title && pr && p.title !== pr.name ? p.title : p.classification || 'تصنيف غير محدد')}</p></div>
      ${wf ? `<div class="pc-wf" title="مسار المذكرة: ${done} من ${WF_STEPS.length}"><span class="pc-wfl" aria-hidden="true">${WF_STEPS.map((s) => `<i class="${wf.S[s.id] && wf.S[s.id].status === 'done' ? 'd' : wf.cur && wf.cur.id === s.id ? 'c' : ''}"></i>`).join('')}</span><small>${wf.cur ? `${wf.cur.n}. ${esc(wf.cur.t)}` : wf.closed ? 'أُغلق الطلب' : 'اكتمل المسار'}</small></div>` : ''}
      <dl class="pc-facts">
        <div class="${st === 'soon' ? 'w' : ''}"><dt>المتبقي</dt><dd>${rem}</dd></div>
        <div class="${ev !== null ? 'e-' + evalTone(ev) : ''}"><dt>التقييم</dt><dd>${ev !== null ? `<b>${ev}</b><small>/100</small>` : '<small>لم تُقيَّم</small>'}</dd></div>
        <div><dt>القيمة</dt><dd>${P.total ? `<b>${sarShort(P.total)}</b><small>⃁</small>` : '<small>—</small>'}</dd></div>
      </dl>
    </div>
    <footer class="pc-foot">
      <span class="pc-own" title="${esc(owners.join('، ') || 'بلا مسؤول')}">${owners.slice(0, 3).map((o) => avatar(o)).join('')}${owners.length ? '' : '<small>بلا مسؤول</small>'}</span>
      <span class="pc-end">${p.endDate ? `${icon('calendar')}حتى ${fmtDate(p.endDate, 'short')}` : ''}</span>
      <span class="pc-acts">${can('view.reports') ? `<a href="#/reports?ids=${p.id}" title="تقرير" aria-label="تقرير">${icon('chart')}</a>` : ''}<button type="button" data-pcdos="${p.id}" title="الملف الشامل" aria-label="الملف الشامل">${icon('file')}</button></span>
    </footer>
  </article>`;
}
