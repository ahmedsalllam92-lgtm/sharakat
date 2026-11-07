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
  App.ui[vkey] = App.ui[vkey] || 'table';
  const VIEWS = [['table', 'table', 'جدول'], ['cards', 'grid', 'بطاقات']];
  const canEdit = can('edit.partnership');
  el.innerHTML = `<div id="regPrintHead"></div>
    <div class="ph no-print"><div><h1>سجل الشراكات</h1><p>جميع الشراكات المسجلة في المنصة${can('view.drafts') ? '، بما فيها المسودات' : ''}. ابحث بالاسم أو الرمز أو أي نص في المجالات والمخرجات.</p></div>
    <div class="ph-actions">${can('export') ? `<button class="btn" data-xls>${icon('download')} Excel</button><button class="btn" data-print>${icon('print')} طباعة</button>` : ''}${can('view.reports') ? `<button class="btn" data-rep title="تقرير بالشراكات المعروضة">${icon('file')} تقرير</button>` : ''}${canEdit ? `<a class="btn primary" href="#/partnerships/new">${icon('plus')} شراكة جديدة</a>` : ''}</div></div>
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
    const row = e.target.closest('[data-row]');
    if (row && !e.target.closest('a,button') && !row.closest('.cm-detail')) go('#/partnerships/' + row.dataset.row);
    if (e.target.closest('[data-print]')) window.print();
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
function regTable(list) {
  const th = (k, l) => `<th class="sortable ${App.ui.regSort === k ? 'sorted' : ''}" data-sort="${k}">${l}<span class="ar">▾</span></th>`;
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${th('name', 'الشراكة')}<th>القطاع</th><th>التصنيف</th>${th('status', 'الحالة')}${th('end', 'الفترة')}<th>المسؤول</th>${th('updated', 'آخر تحديث')}</tr></thead><tbody>
    ${list.map((p) => { const pr = partnerById(p.partnerId); return `<tr data-row="${p.id}" tabindex="0">
      <td><div class="t-name">${plateHTML(pr, 40)}<div><b>${esc(pr ? pr.name : p.title)} ${demoTag(p)}</b><span class="code">${esc(p.code || '')}</span>${p.title && pr && p.title !== pr.name ? `<span> — ${esc(p.title)}</span>` : ''}${(p.categories || []).length ? `<span class="t-cats">${p.categories.map(esc).join('، ')}</span>` : ''}</div></div></td>
      <td>${esc(pSector(p) || '—')}</td><td>${esc(p.classification || '—')}</td><td>${statusChip(p)}</td><td>${termCell(p)}</td>
      <td class="small">${esc((p.owners || []).join('، ') || '—')}</td><td class="small muted">${relDays(p.updatedAt || p.createdAt)}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}
function regCards(list) {
  return `<div class="cards">${list.map((p) => {
    const pr = partnerById(p.partnerId), tp = termProgress(p);
    return `<a class="pcard" href="#/partnerships/${p.id}">
      <div class="media">${coverHTML(p.id + (pr ? pr.name : ''), p.coverFileId, { W: 600, H: 300, levels: 10, cols: 40, tone: toneFor(pr) })}<span class="st">${statusChip(p)}</span>${plateHTML(pr, 56)}</div>
      <div class="bd"><h3>${esc(pr ? pr.name : p.title)} ${demoTag(p)}</h3>
        <div class="ln"><span>${esc(p.classification || 'تصنيف غير محدد')}</span><span>${esc(pSector(p) || '')}</span><span class="code">${esc(p.code || '')}</span></div>
        ${(p.categories || []).length ? `<div class="tagline">${p.categories.map((c) => `<span class="chip plain cat">${esc(c)}</span>`).join('')}</div>` : ''}
        <p class="goal">${esc(p.showcaseGoal || firstItem(p.cooperationAreas) || 'لم تُسجَّل مجالات التعاون.')}</p>
        ${tp !== null ? `<div class="term" title="المدة المنقضية من فترة الشراكة"><i style="width:${(tp * 100).toFixed(0)}%"></i></div>` : ''}</div>
      <div class="ft"><span>${esc((p.owners || []).join('، ') || 'بلا مسؤول')}</span><span>${p.endDate ? 'حتى ' + fmtDate(p.endDate, 'short') : '—'}</span></div></a>`;
  }).join('')}</div>`;
}
