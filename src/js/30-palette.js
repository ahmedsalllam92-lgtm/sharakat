/* =====================================================================
   نافذة الوصول السريع (Ctrl+K): بحث في كل شيء وتنفيذ أي إجراء من مكان واحد
   ===================================================================== */
App.recent = App.recent || [];
// آخر ما فُتح من الشراكات والجهات والمقترحات، ليظهر أولًا في النافذة
window.addEventListener('hashchange', () => {
  const m = /^#\/(partnerships|partners|proposals)\/([^/?]+)$/.exec(location.hash); if (!m || m[2] === 'new') return;
  const key = m[1] + ':' + m[2];
  App.recent = [key, ...App.recent.filter((k) => k !== key)].slice(0, 6);
});

function palActions() {
  const A = [
    can('edit.partnership') && { t: 'شراكة جديدة', s: 'إضافة سجل شراكة', ic: 'plus', kw: 'اضافة جديد سجل', run: () => go('#/partnerships/new') },
    can('proposal.create') && { t: 'مقترح شراكة جديد', s: 'من خدمة «شارك»', ic: 'send', kw: 'اقتراح شارك جديد', run: () => go('#/share/new') },
    can('edit.partnership') && { t: 'رفع صور', s: 'إلى شراكة في مركز الصور', ic: 'upload', kw: 'صور رفع مرفقات', run: async () => { go('#/media'); await sleep(250); if (await mediaUploadDlg('')) route(); } },
    can('view.dashboard') && { t: 'عرض اللوحة المفصلة تقديميًا', s: 'كل فصل شريحة بملء الشاشة', ic: 'play', kw: 'عرض تقديمي مجلس شرائح', run: async () => { if (design() !== 'board') { go('#/dashboard'); await sleep(300); return togglePresent(); } go('#/dashboard'); await sleep(450); boPresent(true); } },
    can('view.reports') && { t: 'إنشاء تقرير', s: 'PowerPoint أو PDF', ic: 'file', kw: 'تقرير عرض باوربوينت', run: () => go('#/reports') },
    can('export') && { t: 'تصدير سجل الشراكات إلى Excel', s: 'كل السجلات المتاحة لدورك', ic: 'download', kw: 'اكسل تصدير', run: () => exportPartnershipsXlsx(visiblePartnerships(), 'سجل-الشراكات') },
    Session.role() !== 'viewer' && { t: 'مهامي', s: (() => { const n = wfTasks().filter((t) => !t.follow).length; return n ? `${n} بانتظارك` : 'لا مهام الآن'; })(), ic: 'flag', kw: 'مهام مهمة انتظار مسار', run: () => go('#/tasks') },
    { t: 'حسابي', s: accountLabel(), ic: 'users', kw: 'حساب كلمة مرور خروج', run: () => accountMenu() },
    { t: 'تسجيل الخروج', s: accountLabel(), ic: 'x', kw: 'خروج تسجيل', run: () => authLogout() },
    { t: 'مسار الشراكة والصلاحيات', s: 'من المقترح إلى الإغلاق', ic: 'convert', kw: 'مسار عملية صلاحيات', run: () => go('#/process') },
    { t: 'تبديل الوضع النهاري والليلي', s: 'حسب الشكل الحالي', ic: 'moon', kw: 'ليلي نهاري داكن فاتح', run: () => { const b = $('[data-themetoggle]'); b && b.click(); } },
    { t: 'استعراض المنصة', s: 'جولة تعريفية تفاعلية', ic: 'play', kw: 'جولة شرح', run: () => startTour() },
    { t: 'استعراض مسار طلب الشراكة', s: 'من «شارك» حتى الاعتماد أو الرفض', ic: 'convert', kw: 'جولة مسار طلب اعتماد رفض', run: () => startReqTour() },
    { t: 'استعراض دعوة جهة خارجية', s: 'رابط بلا حساب: الجهة تقترح وتتابع الرد', ic: 'send', kw: 'جولة جهة خارجية رابط دعوة مقترح', run: () => startExtTour() },
    { t: 'تقويم الشراكات', s: 'التوقيع والانتهاء والتجديد والاجتماعات', ic: 'calendar', kw: 'تقويم مواعيد اجتماع تجديد انتهاء outlook google', run: () => { location.hash = '#/calendar'; } },
    { t: 'حكاية الشراكة', s: 'صفحة تعريفية متحركة: من الرمل إلى الأثر', ic: 'play', kw: 'حكاية فيلم تعريفي لاندنج صحراء قصة', run: () => { location.hash = '#/tale'; } },
    (isSysAdmin() || AUTH.dev) && { t: 'الدخول بحساب آخر للمعاينة', s: 'لمدير النظام', ic: 'user', kw: 'دور صلاحية مستخدم حساب', run: () => roleDialog() },
    ...Object.entries(DESIGNS).filter(([k]) => k !== design()).map(([k, d]) => ({ t: `شكل المنصة: ${d.name}`, s: d.tag, ic: 'palette', kw: 'تصميم اتجاه شكل', run: () => applyDesign(k) })),
  ];
  return A.filter(Boolean);
}
function palPages() { return navGroups().flatMap((g) => g.items.map((it) => ({ t: it.l, s: g.t, ic: it.ic, href: it.h }))); }

function palResults(q) {
  const G = [];
  const hit = (s) => !q || matchQ(s, q);
  if (!q) {
    const rec = App.recent.map((k) => { const [t, id] = k.split(':');
      if (t === 'partnerships') { const p = D.partnerships.find((x) => x.id === id); return p && { t: partnerName(p), s: statusLabel(pStatus(p)), plate: partnerById(p.partnerId), href: '#/partnerships/' + id }; }
      if (t === 'partners') { const x = partnerById(id); return x && { t: x.name, s: 'جهة شريكة', ic: 'building', href: '#/partners/' + id }; }
      const x = D.proposals.find((y) => y.id === id); return x && { t: x.partnerName, s: x.ref, ic: 'send', href: '#/proposals/' + id }; }).filter(Boolean);
    if (rec.length) G.push({ h: 'فتحته مؤخرًا', items: rec });
  }
  const acts = palActions().filter((a) => hit(a.t + ' ' + a.s + ' ' + a.kw));
  if (acts.length) G.push({ h: 'إجراءات', items: acts.slice(0, q ? 6 : 7) });
  const pages = palPages().filter((p) => hit(p.t + ' ' + p.s));
  if (pages.length && (q || !App.recent.length)) G.push({ h: 'الصفحات', items: pages.slice(0, q ? 6 : 8) });
  if (q && q.length >= 2) {
    const ps = visiblePartnerships().filter((p) => matchQ(searchText(p), q)).slice(0, 6);
    if (ps.length) G.push({ h: 'الشراكات', items: ps.map((p) => ({ t: partnerName(p), s: `${p.code ? p.code + ' · ' : ''}${statusLabel(pStatus(p))}`, plate: partnerById(p.partnerId), href: '#/partnerships/' + p.id, demo: p.demo })) });
    const prs = can('view.partners') ? D.partners.filter((x) => (showDemo() || !x.demo) && matchQ(x.name + ' ' + (x.aliases || []).join(' '), q)).slice(0, 4) : [];
    if (prs.length) G.push({ h: 'الجهات', items: prs.map((x) => ({ t: x.name, s: x.sector || '', ic: 'building', href: '#/partners/' + x.id })) });
    const props = visibleProposals().filter((x) => propVisibleToMe(x) && matchQ([x.ref, x.partnerName, x.department, x.requesterName].join(' '), q)).slice(0, 4);
    if (props.length) G.push({ h: 'المقترحات', items: props.map((x) => ({ t: x.partnerName, s: `${x.ref} · ${propStatusLabel(x.status)}`, ic: 'send', href: '#/proposals/' + x.id })) });
  }
  return G;
}

function openPalette(initial = '') {
  if ($('#pal')) { $('#palQ').focus(); return; }
  const prevFocus = document.activeElement;
  const w = document.createElement('div'); w.id = 'pal'; w.className = 'pal-bg';
  w.innerHTML = `<div class="pal" role="dialog" aria-modal="true" aria-label="الوصول السريع">
    <div class="pal-in">${icon('search')}<input id="palQ" type="text" autocomplete="off" placeholder="ابحث عن شراكة أو جهة أو صفحة، أو اكتب ما تريد فعله…" aria-label="ابحث أو نفّذ أمرًا" value="${esc(initial)}"><kbd>Esc</kbd></div>
    <div class="pal-res" id="palRes" role="listbox"></div>
    <div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> للتنقل</span><span><kbd>Enter</kbd> للفتح</span><span><kbd>Ctrl</kbd><kbd>K</kbd> من أي صفحة</span></div></div>`;
  document.body.appendChild(w);
  requestAnimationFrame(() => w.classList.add('on'));
  const q = $('#palQ', w), res = $('#palRes', w);
  let flat = [], sel = 0;
  const draw = () => {
    const G = palResults(q.value.trim());
    flat = G.flatMap((g) => g.items);
    sel = Math.min(sel, Math.max(0, flat.length - 1));
    let k = 0;
    res.innerHTML = G.length ? G.map((g) => `<div class="pal-h">${esc(g.h)}</div>${g.items.map((it) => { const i = k++; return `<button type="button" class="pal-it ${i === sel ? 'on' : ''}" data-pi="${i}" role="option" aria-selected="${i === sel}">
        <span class="pal-ic">${it.plate !== undefined ? plateHTML(it.plate, 28) : icon(it.ic || 'chevL')}</span><span class="pal-t"><b>${esc(it.t)}</b>${it.demo ? demoTag(it) : ''}</span><span class="pal-s">${esc(it.s || '')}</span>${it.run ? '<span class="pal-k">إجراء</span>' : icon('chevL')}</button>`; }).join('')}`).join('')
      : `<div class="pal-empty">${icon('search')}<b>لا توجد نتائج لـ «${esc(q.value.trim())}»</b><span>جرّب اسم الجهة أو الرقم المرجعي أو اسم الصفحة.</span></div>`;
    hydrateFiles(res);
  };
  const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 160); document.removeEventListener('keydown', key, true); if (prevFocus && prevFocus.focus && prevFocus.isConnected) prevFocus.focus({ preventScroll: true }); };
  const runIt = async (it) => { if (!it) return; close(); if (it.run) await it.run(); else if (it.href) go(it.href); };
  const mark = () => { $$('.pal-it', res).forEach((b, i) => { b.classList.toggle('on', i === sel); b.setAttribute('aria-selected', i === sel); if (i === sel) b.scrollIntoView({ block: 'nearest' }); }); };
  const key = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, flat.length); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + flat.length) % Math.max(1, flat.length); mark(); }
    else if (e.key === 'Enter' && document.activeElement === q) { e.preventDefault(); runIt(flat[sel]); }
  };
  document.addEventListener('keydown', key, true);
  q.addEventListener('input', debounce(() => { sel = 0; draw(); }, 90));
  w.addEventListener('mousedown', (e) => { if (e.target === w) close(); });
  res.addEventListener('click', (e) => { const b = e.target.closest('[data-pi]'); if (b) runIt(flat[+b.dataset.pi]); });
  res.addEventListener('mousemove', (e) => { const b = e.target.closest('[data-pi]'); if (b && +b.dataset.pi !== sel) { sel = +b.dataset.pi; mark(); } });
  draw(); q.focus(); q.select();
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) { e.preventDefault(); if ($('#pal')) return; if (!App.tour) openPalette(); }
});
