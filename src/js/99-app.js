/* ===== هيكل التطبيق والتنقل ===== */
function applyTheme() { const d = D.settings && D.settings.design; document.documentElement.dataset.theme = d === 'board' ? (D.settings.boardTheme || 'light') : (D.settings && D.settings.theme) || 'light'; }

function navGroups() {
  const props = visibleProposals();
  const dept = Session.role() === 'dept';
  const newCount = can('proposal.review') ? props.filter((x) => x.status === 'submitted').length : dept ? props.filter((x) => x.department === Session.dept() && x.status === 'info').length : 0;
  return [
    { id: 'view', t: 'العرض', ic: 'eye', items: [{ h: '#/', ic: 'home', l: 'الرئيسية', m: ['home'] }, Session.role() !== 'viewer' && { h: '#/tasks', ic: 'flag', l: 'مهامي', m: ['tasks'], cnt: (() => { try { return wfTasks().filter((t) => !t.follow).length; } catch (_) { return 0; } })() }, can('view.dashboard') && { h: '#/dashboard', ic: 'chart', l: 'لوحة المؤشرات', m: ['dashboard'] }] },
    { id: 'pt', t: 'الشراكات', ic: 'leaf', items: [{ h: '#/partnerships', ic: 'layers', l: 'سجل الشراكات', m: ['partnerships', 'partnership', 'pform'] }, can('view.reports') && { h: '#/reports', ic: 'file', l: 'التقارير', m: ['reports', 'reportsMk'] }, can('view.partners') && { h: '#/partners', ic: 'building', l: 'الجهات الشريكة', m: ['partners', 'partner'] }, { h: '#/stories', ic: 'award', l: 'الإنجازات', m: ['stories'] }, { h: '#/media', ic: 'image', l: 'مركز الصور', m: ['media'] }, { h: '#/gallery', ic: 'star', l: 'معرض الأثر', m: ['gallery'] }, { h: '#/process', ic: 'convert', l: 'مسار الشراكة', m: ['process'] }, can('manage.content') && { h: '#/content', ic: 'news', l: 'إدارة المحتوى', m: ['content'] }] },
    { id: 'share', t: 'شارك', ic: 'msg', items: [{ h: '#/share', ic: 'send', l: 'شارك بمقترح', m: ['share', 'shareForm', 'shareDone'] }, (can('proposal.review') || dept) && { h: '#/proposals', ic: 'inbox', l: dept ? 'مقترحاتي' : 'المقترحات الواردة', m: ['proposals', 'proposal'], cnt: newCount }] },
    { id: 'adm', t: 'الإدارة', ic: 'lock', items: [can('manage.lists') && { h: '#/settings/lists', ic: 'list', l: 'القوائم', m: ['settings'], only: 'lists' }, (can('manage.lists') || can('manage.content')) && { h: '#/settings', ic: 'settings', l: 'الإعدادات', m: ['settings'], not: 'audit,lists' }, can('view.audit') && { h: '#/settings/audit', ic: 'history', l: 'سجل التغييرات', m: ['settings'], only: 'audit' }] },
  ].map((g) => ({ ...g, items: g.items.filter(Boolean) })).filter((g) => g.items.length);
}
function renderShell() {
  let app = $('#app');
  if (!app) {
    app = document.createElement('div'); app.id = 'app'; app.className = 'app';
    app.innerHTML = `<aside class="side" id="side" aria-label="التنقل"></aside><div class="main"><header class="topbar" id="topbar"></header><div id="warn"></div><main id="main" tabindex="-1"></main></div><button class="present-exit" data-present-exit type="button">${icon('x')} إنهاء العرض</button>`;
    document.body.prepend(app);
    bindShell(app);
  }
  applyDesignAttr();
  const dz = design();
  app.classList.toggle('side-min', !!App.ui.sideMin && dz === 'classic');
  const o = D.settings.org, r = Session.role();
  const groups = navGroups();
  const logoId = o.logoFileId;
  const brand = logoId
    ? `<span class="brand-mark has-logo"><img data-file="${esc(logoId)}" alt="${esc(o.name)}"></span><span class="brand-t"><b>${esc(o.platform)}</b></span>`
    : `<span class="brand-mark">${BRAND_MARK}</span><span class="brand-t"><b>${esc(o.platform)}</b><span>${esc(o.name)}</span></span>`;
  const navItem = (it) => `<a class="nav-a" href="${it.h}" data-m="${it.m.join(',')}" ${it.only ? `data-only="${it.only}"` : ''} ${it.not ? `data-not="${it.not}"` : ''} title="${esc(it.l)}" data-label="${esc(it.l)}">${icon(it.ic)}<span>${esc(it.l)}</span>${it.cnt ? `<span class="cnt">${it.cnt}</span>` : ''}</a>`;
  // القائمة الجانبية (تُستخدم أيضًا درجًا على الشاشات الصغيرة في كل الاتجاهات)
  $('#side').innerHTML = `<div class="brand ${logoId ? 'stacked' : ''}">${brand}</div>
    <nav class="nav ${App.navIntro ? '' : 'intro'}"><span class="nav-pill" aria-hidden="true"></span>${groups.map((g, gi) => `<div class="nav-g ${App.ui['closed_' + g.id] && dz === 'classic' ? 'closed' : ''}" data-g="${g.id}" style="--gi:${gi}"><button class="nav-gh" data-gtoggle="${g.id}" type="button" aria-expanded="${!(App.ui['closed_' + g.id] && dz === 'classic')}"><i class="ngi">${icon(g.ic || 'grid')}</i><span>${g.t}</span>${icon('chevD')}</button>
      <div class="nav-items"><div class="nav-in">${g.items.map(navItem).join('')}</div></div></div>`).join('')}</nav>
    <div class="side-foot"><div class="side-org">${esc(o.dept)}</div>
      ${dz === 'classic' ? `<button class="side-btn icon-only collapse-btn" data-collapse type="button" title="${App.ui.sideMin ? 'توسيع القائمة' : 'طي القائمة'}" aria-label="${App.ui.sideMin ? 'توسيع القائمة' : 'طي القائمة'}">${icon('sidebar')}</button>` : ''}</div>`;
  const roleBox = bellHTML() + `<button class="rolebox" data-role title="حسابي"><span class="rl">${esc(accountLabel())}</span><span class="av">${esc(initials(r === 'team' ? Session.member() : r === 'dept' ? Session.dept().replace(/^(إدارة|الإدارة العامة لل|الإدارة العامة|الإدارة|مكتب|الشؤون)\s*/, '') : isSysAdmin() ? 'م ن' : ROLES[r].label))}</span></button>`;
  const tourBtn = `<button class="tour-top" data-tourmenu type="button" aria-haspopup="menu" title="الاستعراضات">${icon('play')}<span>استعراض المنصة</span></button>`;
  const themeBtn = `<button class="icon-btn theme-btn" data-themetoggle title="${D.settings.theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}" aria-label="تبديل الوضع النهاري والليلي">${icon(D.settings.theme === 'dark' ? 'sun' : 'moon')}</button>`;
  const demo = showDemo() ? `<button class="demo-ribbon" data-demo title="البيانات التجريبية">${icon('info')}<span class="dr-t">يتضمن بيانات تجريبية</span></button>` : '';
  const search = (ph) => `<div class="gsearch"><input id="gq" type="search" placeholder="${ph}" aria-label="بحث عام" autocomplete="off">${icon('search')}</div>`;
  if (dz === 'board') {
    $('#topbar').innerHTML = boardTopbarHTML(tourBtn, demo, roleBox);
  } else {
    $('#topbar').innerHTML = `<button class="icon-btn menu-btn" data-menu aria-label="القائمة">${icon('menu')}</button>
    <div class="crumbs" id="crumbs"></div>
    ${search('بحث في الشراكات والجهات والمقترحات…')}
    ${tourBtn}${demo}${themeBtn}${roleBox}`;
  }
  $('#warn').innerHTML = Store.mode === 'memory' ? `<div class="storage-warn">${icon('alert')}<span>الحفظ المحلي غير متاح في هذا العرض (مثل المعاينة داخل Claude)، وستُفقد التعديلات عند الإغلاق. نزّل الملف وافتحه في Chrome أو Edge للحفظ المستمر.</span></div>` : '';
  hydrateFiles($('#side')); hydrateFiles($('#topbar'));
  renderDesignSwitcher();
  updateNav();
  if (!App.navIntro) setTimeout(() => { App.navIntro = true; const n = $('.side .nav'); n && n.classList.remove('intro'); }, 1200);
}
function moveNavPill(animate = true) {
  const nav = $('.side .nav'), pill = nav && nav.querySelector('.nav-pill'); if (!pill) return;
  const a = nav.querySelector('.nav-a.on');
  const g = a && a.closest('.nav-g');
  if (!a || (g && g.classList.contains('closed') && !$('.app.side-min'))) { pill.style.opacity = '0'; return; }
  const nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
  if (!animate) pill.style.transition = 'none';
  pill.style.top = `${ar.top - nr.top + nav.scrollTop}px`; pill.style.height = `${ar.height}px`; pill.style.opacity = '1';
  if (!animate) { pill.offsetHeight; pill.style.transition = ''; }
}
window.addEventListener('resize', () => moveNavPill(false));
/* أعداد القائمة (مهامي، المقترحات…) تُحسب من جديد مع كل انتقال حتى لا تبقى قديمة بعد أي تعديل */
function refreshNavCounts() {
  let groups; try { groups = navGroups(); } catch (_) { return; }
  const cnt = {}; groups.forEach((g) => (g.items || []).filter(Boolean).forEach((it) => { cnt[it.h] = it.cnt || 0; }));
  $$('a.nav-a[href], a.bo-link[href]').forEach((a) => {
    const h = a.getAttribute('href'); if (!(h in cnt)) return;
    let c = a.querySelector(':scope > .cnt');
    if (cnt[h]) { if (!c) { c = document.createElement('span'); c.className = 'cnt'; a.appendChild(c); } c.textContent = cnt[h]; } else if (c) c.remove();
  });
  $$('.bo-more').forEach((m) => {
    const sum = $$('.bo-mega a.nav-a[href]', m).reduce((t, a) => t + (cnt[a.getAttribute('href')] || 0), 0);
    const btn = $(':scope > .bo-link', m); if (!btn) return; let c = $(':scope > .cnt', btn);
    if (sum) { if (!c) { c = document.createElement('span'); c.className = 'cnt'; btn.insertBefore(c, btn.querySelector('.ic')); } c.textContent = sum; } else if (c) c.remove();
  });
}
function updateNav() {
  refreshNavCounts();
  const r = App.route; if (!r) return;
  $$('.nav-a').forEach((a) => {
    let on = a.dataset.m.split(',').includes(r.name);
    if (on && a.dataset.only) on = r.params.tab === a.dataset.only;
    if (on && a.dataset.not) on = !a.dataset.not.split(',').includes(r.params.tab);
    a.classList.toggle('on', on);
  });
  $$('[data-gm]').forEach((g) => g.classList.toggle('on', !!g.querySelector('.nav-a.on')));
  $$('.side .nav-g').forEach((g) => g.classList.toggle('has-on', !!g.querySelector('.nav-a.on')));
  moveNavPill();
  if (design() === 'board') boMoveInd();
  const crumbs = $('#crumbs'); if (!crumbs) return;
  const C = {
    home: ['الرئيسية'], dashboard: ['لوحة المؤشرات'], partnerships: ['سجل الشراكات'], stories: ['الإنجازات وقصص النجاح'], content: ['إدارة المحتوى'],
    partners: ['الجهات الشريكة'], media: ['مركز الصور'], tasks: ['مهامي'], process: ['مسار الشراكة'], share: ['شارك بمقترح'], shareForm: ['شارك', r.params.id ? 'تعديل المقترح' : 'مقترح جديد'], shareDone: ['شارك', 'تم الإرسال'],
    proposals: [Session.role() === 'dept' ? 'مقترحاتي' : 'المقترحات الواردة'], settings: ['الإعدادات', (SET_TABS.find((t) => t.id === r.params.tab) || {}).t || ''],
  };
  let c = C[r.name];
  if (r.name === 'partnership' || r.name === 'pform') { const p = D.partnerships.find((x) => x.id === r.params.id); c = ['سجل الشراكات', r.name === 'pform' ? (p ? 'تعديل — ' + partnerName(p) : 'شراكة جديدة') : p ? partnerName(p) : '']; }
  if (r.name === 'partner') { const p = partnerById(r.params.id); c = ['الجهات الشريكة', p ? p.name : '']; }
  if (r.name === 'proposal') { const x = D.proposals.find((y) => y.id === r.params.id); c = [Session.role() === 'dept' ? 'مقترحاتي' : 'المقترحات الواردة', x ? x.ref : '']; }
  c = (c || ['']).filter(Boolean);
  crumbs.innerHTML = c.map((x, i) => (i === c.length - 1 ? `<b>${esc(x)}</b>` : `<span>${esc(x)}</span><span class="sep">/</span>`)).join('');
  document.title = `${c[c.length - 1] || ''} — ${D.settings.org.platform}`;
}
function bindShell(app) {
  app.addEventListener('click', async (e) => {
    const gt = e.target.closest('[data-gtoggle]');
    if (gt) { const k = 'closed_' + gt.dataset.gtoggle; App.ui[k] = !App.ui[k]; gt.parentElement.classList.toggle('closed', App.ui[k]); gt.setAttribute('aria-expanded', !App.ui[k]); moveNavPill(); const t0 = performance.now(); const follow = () => { moveNavPill(false); if (performance.now() - t0 < 380) requestAnimationFrame(follow); }; requestAnimationFrame(follow); return; }
    if (e.target.closest('[data-collapse]')) { App.ui.sideMin = !App.ui.sideMin; renderShell(); return; }
    const ddt = e.target.closest('.st-ddt, [data-cmnew], .cm-btn.bell');
    if (ddt) { const dd = ddt.parentElement; const was = dd.classList.contains('open'); $$('.st-dd.open, .cm-dd.open').forEach((x) => x.classList.remove('open')); dd.classList.toggle('open', !was); return; }
    if (e.target.closest('.st-ddm a, .cm-ddm a')) $$('.st-dd.open, .cm-dd.open').forEach((x) => x.classList.remove('open'));
    if (e.target.closest('[data-themetoggle]')) {
      if (design() === 'board') D.settings.boardTheme = (D.settings.boardTheme || 'light') === 'dark' ? 'light' : 'dark';
      else D.settings.theme = D.settings.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.add('theme-anim'); applyTheme(); setTimeout(() => document.documentElement.classList.remove('theme-anim'), 450);
      await Repo.saveSettings(); renderShell(); if (App.route && ['dashboard', 'home'].includes(App.route.name)) route(); return;
    }
    if (e.target.closest('[data-palette]')) { openPalette(); return; }
    if (e.target.closest('[data-menu]')) { app.classList.toggle('nav-open'); return; }
    if (e.target.closest('.nav-a')) app.classList.remove('nav-open');
    if (e.target.closest('[data-role]') && e.target.closest('#topbar')) return accountMenu();
    if (e.target.closest('[data-bell]')) return toggleBell();
    if (e.target.closest('[data-demo]')) return demoDialog();
    if (e.target.closest('[data-present-exit]')) return togglePresent();
    if (e.target.closest('.topbar [data-tourmenu]')) return toggleTourMenu();
  });
  document.addEventListener('mousedown', (e) => { if (app.classList.contains('nav-open') && !e.target.closest('.side') && !e.target.closest('[data-menu]')) app.classList.remove('nav-open'); if (!e.target.closest('.st-dd, .cm-dd')) $$('.st-dd.open, .cm-dd.open').forEach((x) => x.classList.remove('open')); });
  // البحث العام
  let gsel = -1;
  app.addEventListener('input', debounce((e) => { if (e.target.id === 'gq') { gsel = -1; gsearch(e.target.value); } }, 120));
  app.addEventListener('keydown', (e) => {
    if (e.target.id !== 'gq') return;
    const items = $$('.gs-res a');
    if (e.key === 'ArrowDown') { gsel = Math.min(items.length - 1, gsel + 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { gsel = Math.max(0, gsel - 1); e.preventDefault(); }
    else if (e.key === 'Enter') { const it = items[gsel] || items[0]; if (it) { location.hash = it.getAttribute('href'); closeG(); e.target.blur(); } return; }
    else if (e.key === 'Escape') { closeG(); e.target.blur(); return; }
    items.forEach((a, i) => a.classList.toggle('on', i === gsel));
  });
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('.gsearch')) closeG(); });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); const g = $('#gq'); if (g) g.focus(); else openPalette(); } });
}
function closeG() { const r = $('.gs-res'); r && r.remove(); }
function gsearch(q) {
  closeG();
  q = q.trim(); if (q.length < 2) return;
  const ps = visiblePartnerships().filter((p) => matchQ(searchText(p), q)).slice(0, 6);
  const prs = can('view.partners') ? D.partners.filter((x) => (showDemo() || !x.demo) && matchQ(x.name + ' ' + (x.aliases || []).join(' '), q)).slice(0, 4) : [];
  const props = visibleProposals().filter((x) => propVisibleToMe(x) && matchQ([x.ref, x.partnerName, x.department, x.requesterName].join(' '), q)).slice(0, 4);
  const box = document.createElement('div'); box.className = 'gs-res';
  box.innerHTML = (ps.length ? `<div class="gs-h">الشراكات</div>${ps.map((p) => `<a href="#/partnerships/${p.id}">${plateHTML(partnerById(p.partnerId), 40)}<span>${esc(partnerName(p))}</span><span class="gs-sub">${esc(statusLabel(pStatus(p)))}</span></a>`).join('')}` : '')
    + (prs.length ? `<div class="gs-h">الجهات</div>${prs.map((x) => `<a href="#/partners/${x.id}">${icon('building')}<span>${esc(x.name)}</span><span class="gs-sub">${esc(x.sector || '')}</span></a>`).join('')}` : '')
    + (props.length ? `<div class="gs-h">المقترحات</div>${props.map((x) => `<a href="#/proposals/${x.id}">${icon('send')}<span>${esc(x.partnerName)}</span><span class="gs-sub">${esc(x.ref)} — ${esc(propStatusLabel(x.status))}</span></a>`).join('')}` : '')
    || `<div class="cb-empty">لا توجد نتائج لـ «${esc(q)}».</div>`;
  $('.gsearch').appendChild(box);
  hydrateFiles(box);
  box.addEventListener('click', (e) => { if (e.target.closest('a')) { closeG(); $('#gq').value = ''; } });
}
function roleDialog() {
  // حساب لكل إدارة: اختيار الحساب يحدد الدور وما يُسند إليه من خطوات مسار الشراكة
  const cur = currentAccountId();
  const A = wfAccounts();
  const groups = [...new Set(A.map((a) => a.g))];
  const taskN = (a) => { const keep = D.settings.session; D.settings.session = { role: a.role, dept: a.role === 'dept' ? a.dept : Session.dept(), member: a.member || Session.member(), accountId: a.id }; let n = 0; try { n = wfTasks().filter((t) => !t.follow).length; } catch (_) {} D.settings.session = keep; return n; };
  const m = Modal.open({
    title: 'الدخول بحساب آخر للمعاينة', size: 'lg', cls: 'acc-modal',
    body: `<p class="small muted" style="margin-bottom:12px">لكل إدارة حساب. يحدد الحساب ما يراه المستخدم والخطوات التي ينفّذها في مسار الشراكة الجديدة.</p>
      ${groups.map((g) => `<h4 class="acc-g">${esc(g)}</h4><div class="acc-grid">${A.filter((a) => a.g === g).map((a) => { const n = taskN(a); return `<div class="role-c acc-c ${a.id === cur ? 'on' : ''}" data-acc="${esc(a.id)}" data-rc="${a.role}" tabindex="0"><b>${esc(a.t)}</b><p>${esc(a.s || ROLES[a.role].label)}</p><span class="acc-r">${esc(ROLES[a.role].label)}</span>${n ? `<span class="acc-n">${n} ${n === 1 ? 'مهمة' : 'مهام'}</span>` : ''}</div>`; }).join('')}</div>`).join('')}
      <div class="grid2" style="margin-top:14px"><div class="field"><label>أو اختر الإدارة (لحساب ممثل إدارة)</label><select class="in" id="rdD">${L('departments').filter((d) => d !== D.settings.org.dept).map((d) => `<option ${d === Session.dept() ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div>
        <div class="field"><label>عضو الفريق (لفريق الشراكات)</label><select class="in" id="rdM">${L('team').map((d) => `<option ${d === Session.member() ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div></div>
      <div class="sim-note">معاينة المنصة كما يراها كل حساب، متاحة لمدير النظام فقط. للعودة افتح «حسابي» ← «العودة إلى مدير النظام».</div>`,
    foot: `<button class="btn primary" data-ok>تطبيق</button><button class="btn ghost" data-mclose>إلغاء</button>`,
  });
  let sel = cur, touchedD = false;
  m.el.addEventListener('click', (e) => { const c = e.target.closest('[data-acc]'); if (c) { sel = c.dataset.acc; touchedD = false; $$('[data-acc]', m.el).forEach((x) => x.classList.toggle('on', x === c)); } });
  m.el.addEventListener('dblclick', (e) => { if (e.target.closest('[data-acc]')) m.el.querySelector('[data-ok]').click(); });
  $('#rdD', m.el).addEventListener('change', () => { touchedD = true; });
  m.el.querySelector('[data-ok]').onclick = async () => {
    if (App.dirty && !(await confirmDlg('لديك تعديلات غير محفوظة. تبديل الحساب سيغلق النموذج دون حفظ.', { ok: 'تبديل الحساب', danger: true }))) return;
    const a = A.find((x) => x.id === sel) || A[0];
    let id = a.id;
    if (a.role === 'dept' && touchedD) id = 'dept:' + $('#rdD', m.el).value;
    if (a.role === 'team') id = 'team:' + $('#rdM', m.el).value;
    m.close(); await switchAccount(id);
  };
}
function demoDialog() {
  const n = { p: D.partnerships.filter((x) => x.demo).length, s: D.achievements.filter((x) => x.demo).length, pr: D.proposals.filter((x) => x.demo).length };
  const m = Modal.open({
    title: 'البيانات التجريبية',
    body: `<p style="line-height:1.9">أُضيفت ${n.p} شراكات و${n.pr} مقترحات و${n.s} إنجازات تجريبية بأسماء جهات وهمية لإظهار التصميم والمؤشرات. كلها تحمل وسم <span class="demo-tag">تجريبي</span>، ولا تمثل شراكات أو نتائج فعلية.</p>
      <p style="line-height:1.9;margin-top:10px">السجلات الفعلية هي الثلاثة المستوردة من ملف الحصر، وما تضيفه أنت.</p>`,
    foot: can('manage.backup') ? `<button class="btn primary" data-hide>إخفاء البيانات التجريبية</button><button class="btn ghost" data-mclose>إغلاق</button>` : `<button class="btn" data-mclose>إغلاق</button>`,
  });
  const h = m.el.querySelector('[data-hide]'); if (h) h.onclick = async () => { m.close(); await setDemo(false); route(); };
}

/* ===== التوجيه ===== */
const ROUTES = [
  { re: /^\/?$/, name: 'home', fn: renderHome, full: true },
  { re: /^\/dashboard$/, name: 'dashboard', fn: (el, r) => (can('view.dashboard') ? renderDashboard(el, r) : (el.innerHTML = noAccessHTML())) },
  { re: /^\/partnerships$/, name: 'partnerships', fn: renderRegister },
  { re: /^\/partnerships\/new$/, name: 'pform', fn: renderPartnershipForm },
  { re: /^\/partnerships\/([^/]+)\/edit$/, name: 'pform', fn: renderPartnershipForm, keys: ['id'] },
  { re: /^\/partnerships\/([^/]+)$/, name: 'partnership', fn: renderPartnership, keys: ['id'], full: true },
  { re: /^\/partners$/, name: 'partners', fn: renderPartners },
  { re: /^\/partners\/([^/]+)$/, name: 'partner', fn: renderPartner, keys: ['id'] },
  { re: /^\/reports$/, name: 'reports', fn: renderReports },
  { re: /^\/reports\/marketing$/, name: 'reportsMk', fn: renderMarketingReport },
  { re: /^\/stories$/, name: 'stories', fn: renderStories },
  { re: /^\/media$/, name: 'media', fn: renderMedia },
  { re: /^\/gallery$/, name: 'gallery', fn: renderGallery, full: true },
  { re: /^\/tasks$/, name: 'tasks', fn: renderTasks },
  { re: /^\/process$/, name: 'process', fn: renderProcess },
  { re: /^\/content$/, name: 'content', fn: renderContent },
  { re: /^\/share$/, name: 'share', fn: renderShare },
  { re: /^\/share\/new$/, name: 'shareForm', fn: renderShareForm },
  { re: /^\/share\/done\/([^/]+)$/, name: 'shareDone', fn: renderShareDone, keys: ['id'] },
  { re: /^\/share\/([^/]+)\/edit$/, name: 'shareForm', fn: renderShareForm, keys: ['id'] },
  { re: /^\/proposals$/, name: 'proposals', fn: renderProposals },
  { re: /^\/proposals\/([^/]+)$/, name: 'proposal', fn: renderProposal, keys: ['id'] },
  { re: /^\/settings(?:\/([^/]+))?$/, name: 'settings', fn: renderSettings, keys: ['tab'] },
];
function parseHash() {
  const h = decodeURI(location.hash.replace(/^#/, '')) || '/';
  const [path, qs] = h.split('?');
  const query = {};
  if (qs) qs.split('&').forEach((kv) => { const i = kv.indexOf('='); const k = i < 0 ? kv : kv.slice(0, i); const v = i < 0 ? '' : kv.slice(i + 1); try { query[decodeURIComponent(k)] = decodeURIComponent(v); } catch (_) { query[k] = v; } });
  return { path: path || '/', query };
}
function route() {
  if (!AUTH.dev && !currentLogin()) { if (!$('#shkLogin')) showLogin(); return; }
  const { path, query } = parseHash();
  let def = null, m = null;
  for (const d of ROUTES) { m = d.re.exec(path); if (m) { def = d; break; } }
  const main = $('#main');
  const page = document.createElement('div');
  if (!def) {
    page.className = 'page';
    page.innerHTML = emptyHTML({ ic: 'search', title: 'الصفحة غير موجودة', text: 'تحقق من الرابط أو عد إلى الرئيسية.', actions: '<a class="btn" href="#/">الرئيسية</a>' });
    main.replaceChildren(page); App.route = { name: '', params: {}, query }; updateNav(); return;
  }
  const params = {};
  (def.keys || []).forEach((k, i) => { params[k] = m[i + 1] ? decodeURIComponent(m[i + 1]) : undefined; });
  if (document.documentElement.classList.contains('ob-show')) { document.documentElement.classList.remove('ob-show'); const n = document.getElementById('obShowNav'); if (n) n.remove(); }
  App.route = { name: def.name, params, query, path };
  App.dirty = false;
  page.className = 'page' + (def.full ? ' full' : '');
  main.replaceChildren(page);
  window.scrollTo(0, 0);
  try { def.fn(page, App.route); }
  catch (e) {
    console.error(e);
    page.innerHTML = emptyHTML({ ic: 'alert', title: 'تعذّر عرض الصفحة', text: `حدث خطأ أثناء عرض هذه الصفحة: ${esc(e.message)}. بياناتك محفوظة؛ جرّب إعادة التحميل.`, actions: '<button class="btn" onclick="location.reload()">إعادة التحميل</button><a class="btn ghost" href="#/">الرئيسية</a>' });
  }
  updateNav();
  if (['home', 'achievements', 'news', 'stories'].includes(def.name)) requestAnimationFrame(() => revealify(page));
  boardRouteEnter(page, def.name);
  if (!$('.app').classList.contains('present') && def.name !== 'home') main.focus({ preventScroll: true });
}
window.addEventListener('hashchange', async () => {
  if (App.tour) App.dirty = false;
  if (App.dirty) {
    const target = location.hash;
    history.replaceState(null, '', App.lastHash || '#/');
    const ok = await confirmDlg('في النموذج تعديلات لم تُحفظ بعد. إذا غادرت الآن ستُفقد هذه التعديلات.', { title: 'تعديلات غير محفوظة', ok: 'المغادرة دون حفظ', cancel: 'البقاء في النموذج', danger: true });
    if (!ok) return;
    App.dirty = false;
    location.hash = target;
    return;
  }
  App.lastHash = location.hash;
  route();
});
window.addEventListener('beforeunload', (e) => { if (App.dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ===== التشغيل ===== */
/* الأهداف الاستراتيجية المعتمدة للمؤسسة (من نموذج المواءمة) */
const MUROOJ_GOALS = [
  'SO1: تعزيز دور المجتمع من خلال بناء القدرات والتوعية والمشاركة الشاملة لإحداث أثر اجتماعي واقتصادي ملموس في القطاع البيئي',
  'SO2: تعزيز الاستدامة البيئية من خلال مشاريع بيئية ذات أثر',
  'SO3: ترسيخ الشراكات وتفعيلها لضمان الموارد وتقديم الخدمات لتعظيم الأثر البيئي',
  'SO4: مواءمة الجهود البيئية من خلال إثراء المعرفة المشتركة وتيسير الابتكار بين المنظمات البيئية والقطاعات ذات الصلة',
  'EO: تحقيق التميز المؤسسي، وتنمية القدرات الداخلية، وتعزيز الاستدامة المالية',
];
/* مسميات الإدارات كما في الهيكل المعتمد للمؤسسة */
const DEPT_RENAMES = { 'إدارة المشاريع': 'الإدارة العامة للمشاريع', 'إدارة الاتصال المؤسسي': 'الإدارة العامة للاتصال المؤسسي', 'إدارة المشاركة المجتمعية': 'الإدارة العامة للمشاركة المجتمعية', 'الشؤون القانونية': 'الإدارة القانونية' };
const DEPT_ADD = ['الإدارة العامة للموارد البشرية والشؤون الإدارية', 'الإدارة القانونية', 'الإدارة المالية'];
function applyOfficialDepartments() {
  const s = D.settings, ren = (d) => DEPT_RENAMES[d] || d;
  s.lists.departments = [...new Set([...s.lists.departments.map(ren), ...DEPT_ADD])];
  D.partnerships.forEach((p) => { p.departments = (p.departments || []).map(ren); if (p.requesterDept) p.requesterDept = ren(p.requesterDept); });
  D.proposals.forEach((x) => { x.department = ren(x.department); });
  if (s.session && s.session.dept) { s.session.dept = ren(s.session.dept); if (s.session.accountId) s.session.accountId = s.session.accountId.replace(/^dept:(.+)$/, (m, d) => 'dept:' + ren(d)); }
  if (s.wfDepts) Object.keys(s.wfDepts).forEach((k) => { s.wfDepts[k] = ren(s.wfDepts[k]); });
  Store.putMany('partnerships', D.partnerships); Store.putMany('proposals', D.proposals);
}
/* بيانات تجريبية للتصنيف والقيمة والتقييم — للسجلات التجريبية فقط */
function applyDemoProfiles() {
  const P = {
    'شركة الأفق الأخضر للتطوير العمراني': ['شريك استراتيجي', 'بيئة', 'بناء شراكة (منهجية)', 'الإدارة العامة للمشاريع', 'تمويل من الشريك', 850000, 0, 120000, 510000, 'ضمن الخطة', [5, 5, 4, 4, 4, 4], 'تجديد وتوسيع', 'مرتفع'],
    'جمعية أصداء للتوعية البيئية': ['شريك خدمات', 'تنمية مجتمعية', 'مبادرة من الجهة الشريكة', 'مدير إدارة الشراكات', 'تمويل مشترك', 90000, 90000, 40000, 150000, 'ضمن الخطة', [4, 4, 4, 5, 3, 3], 'الاستمرار', 'متوسط'],
    'هيئة تطوير الواحات الشمالية': ['شريك استراتيجي', 'زراعة', 'توجيه من القيادة', 'معالي رئيس مجلس الأمناء', 'تمويل مشترك', 1200000, 400000, 250000, 300000, 'متأخر', [5, 3, 3, 3, 4, 5], 'الاستمرار', 'متوسط'],
    'مجموعة سنابل الوادي الغذائية': ['شريك خدمات', 'زراعة', 'علاقة شخصية', 'عضو مجلس الأمناء', 'تمويل من الشريك', 300000, 0, 60000, 280000, 'ضمن الخطة', [3, 4, 4, 3, 4, 2], 'إعادة هيكلة', 'متوسط'],
    'مؤسسة غرس الخيرية': ['شريك خدمات', 'بيئة', 'بناء شراكة (منهجية)', 'إدارة الشراكات', 'على نفقة المؤسسة', 0, 220000, 180000, 200000, 'مكتمل', [4, 5, 5, 4, 4, 4], 'تجديد وتوسيع', 'مرتفع'],
    'شركة شمس الجنوب للطاقة': ['شريك خدمات', 'طاقة', 'علاقة شخصية', 'الرئيس التنفيذي', 'إيرادات للمؤسسة', 150000, 0, 0, 150000, 'مكتمل', [3, 3, 2, 3, 3, 2], 'عدم التجديد', 'منخفض'],
    'كلية الشمال التقنية': ['شريك استراتيجي', 'تعليم وبحث علمي', 'مقترح من إدارة', 'الإدارة العامة للمشاركة المجتمعية', 'بدون التزامات مالية', 0, 0, 90000, 0, 'لا توجد التزامات', null, '', ''],
    'بلدية وادي السدر': ['شريك استراتيجي', 'بيئة', 'مقترح من إدارة', 'الإدارة العامة للمشاريع', 'تمويل مشترك', 500000, 250000, 0, 0, 'ضمن الخطة', null, '', ''],
    'صندوق أثر للاستدامة': ['شريك استراتيجي', 'مالية واستثمار', 'علاقة شخصية', 'عضو مجلس الأمناء', 'تمويل من الشريك', 2000000, 0, 0, 0, 'ضمن الخطة', null, '', ''],
    'شركة مرافئ للخدمات اللوجستية': ['شريك خدمات', 'نقل ولوجستيات', 'مبادرة من الجهة الشريكة', '', 'بدون التزامات مالية', 0, 0, 50000, 0, 'لا توجد التزامات', null, '', ''],
  };
  const vt = { 'تمويل من الشريك': ['مالية', 'عينية'], 'تمويل مشترك': ['مالية', 'معرفية وفنية'], 'على نفقة المؤسسة': ['عينية', 'مجتمعية وتطوعية'], 'إيرادات للمؤسسة': ['مالية'], 'بدون التزامات مالية': ['معرفية وفنية'] };
  const per = (d) => `${['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'][Math.floor(d.getMonth() / 3)]} ${d.getFullYear()}`;
  D.partnerships.filter((p) => p.demo).forEach((p) => {
    const v = P[partnerName(p)]; if (!v) return;
    const [ptype, domain, origin, originBy, model, ps, ms, ik, sp, fst, sc, rec, imp] = v;
    Object.assign(p, { ptype, origin, originBy, valueTypes: vt[model] || [], impactLevel: imp });
    p.finance = { model, partnerSar: ps, murojSar: ms, inkindSar: ik, spentSar: sp, status: fst, notes: '' };
    const pr = partnerById(p.partnerId); if (pr && !pr.domain) pr.domain = domain;
    if (sc) {
      const d0 = addDays(today(), -40);
      const scores = Object.fromEntries(EVAL_CRIT.map((c, i) => [c.k, { v: sc[i], n: '' }]));
      p.evals = [{ id: uid('ev'), no: `EVL-${d0.getFullYear()}-D${String(D.partnerships.indexOf(p) + 1).padStart(2, '0')}`, status: 'done', at: d0.toISOString(), by: 'بيانات تجريبية', byDept: D.settings.org.dept, demo: true,
        data: { period: per(d0), by: 'فريق إدارة الشراكات', date: isoDate(d0), scores, valueTypes: vt[model] || [], valueSar: ps + ik, impactLevel: imp, impact: p.highlight ? `${p.highlight.value} ${p.highlight.label}: ${p.highlight.text}` : '', rec, recNote: '' } }];
    }
  });
  Store.putMany('partnerships', D.partnerships); Store.putMany('partners', D.partners);
}
function migrate() {
  const s = D.settings, d = defaultSettings();
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  for (const k of Object.keys(d.lists)) if (!s.lists[k]) s.lists[k] = d.lists[k];
  for (const k of Object.keys(d.home)) if (s.home[k] === undefined) s.home[k] = d.home[k];
  if (!s.counters) s.counters = { pt: D.partnerships.length, sh: {} };
  let changed = false;
  if ((s.schema || 1) < 3) {
    if (!s.home.heroImageFileId) s.home.heroImageFileId = 'lib:dunes';
    if (!s.home.sections.some((x) => x.id === 'golden')) { const i = s.home.sections.findIndex((x) => x.id === 'kpis'); s.home.sections.splice(i + 1, 0, { id: 'golden', on: true }); changed = true; }
    if (!s.home.sections.some((x) => x.id === 'gallery')) { const i = s.home.sections.findIndex((x) => x.id === 'featured'); s.home.sections.splice(i + 1, 0, { id: 'gallery', on: true }); }
    applyImageDefaults();
    s.schema = 3; changed = true;
  }
  if (s.schema < 4) {
    const ren = (c) => (c === 'وثيقة المذكرة' ? 'الاتفاقية' : c);
    s.lists.attachmentCats = [...new Set(s.lists.attachmentCats.map(ren))];
    D.partnerships.forEach((p) => (p.attachments || []).forEach((a) => { a.category = ren(a.category); }));
    if (!s.listMeta) s.listMeta = {};
    applyDemoCategories();
    applyRealPhotos();
    s.schema = 4; changed = true;
  }
  if (s.splash && s.splash.bg === 'splash-aerial' && !s.splash.bgV2) { s.splash.bg = 'signings'; s.splash.bgV2 = true; changed = true; }
  if (s.splash && s.splash.bg === 'signings' && !s.splash.bgV3) { s.splash.bg = 'splash-bond'; s.splash.bgV3 = true; changed = true; }
  if (!s.splash) { s.splash = { on: true, text: SPLASH_DEF.text, sub: SPLASH_DEF.sub, bg: SPLASH_DEF.bg, stats: true, dur: SPLASH_DEF.dur }; changed = true; }
  if (s.design && !['classic', 'board'].includes(s.design)) { s.design = ['show', 'brand'].includes(s.design) ? 'board' : 'classic'; changed = true; }
  if (!s.deptsV2) { applyOfficialDepartments(); s.deptsV2 = true; changed = true; }
  if (!s.lists.departments.includes(WF_DEPT_DEFAULTS.legal)) { s.lists.departments.push(WF_DEPT_DEFAULTS.legal); changed = true; }
  if (!s.lists.goals.length) { s.lists.goals = [...MUROOJ_GOALS]; changed = true; }
  if (!s.ptypesV2) { s.ptypesV2 = true; if (!(s.lists.partnerTypes || []).includes('شريك إعلامي')) { s.lists.partnerTypes = [...(s.lists.partnerTypes || []), 'شريك إعلامي']; } changed = true; }
  if (!s.lists.formSectors || !s.lists.formSectors.length) { s.lists.formSectors = [...SECTOR_FORM]; changed = true; }
  ['شبه حكومي', 'تعليمي'].forEach((x) => { if (!s.lists.sectors.includes(x)) { s.lists.sectors.push(x); changed = true; } });
  if (!s.demoProfiles) { applyDemoProfiles(); s.demoProfiles = true; changed = true; }
  if (!s.lists.attachmentCats.includes(WF_CAT)) { s.lists.attachmentCats.push(WF_CAT); changed = true; }
  if (!s.wfDepts) { s.wfDepts = { ...WF_DEPT_DEFAULTS }; changed = true; }
  if (!s.wfTemplates) { s.wfTemplates = {}; changed = true; }
  if (s.schema < 5) {
    if (!s.org.platform || s.org.platform === 'منصة الشراكات') s.org.platform = 'منظومة الشراكات';
    if (!s.alertDays) s.alertDays = 30;
    s.schema = 5; changed = true;
  }
  return changed;
}
async function boot() {
  const bootEl = $('#boot');
  try {
    await Store.open();
    await Repo.load();
    if (!D.settings) await seedAll();
    if (migrate()) { await Repo.saveSettings(); for (const c of ['partnerships', 'achievements']) await Store.putMany(c, D[c]); }
    applyTheme();
    if (!authBoot()) { showLogin(); splashSync(); return; }
    renderShell();
    App.lastHash = location.hash;
    route();
    splashSync();
    bootEl.classList.add('out');
    setTimeout(() => bootEl.remove(), 400);
  } catch (e) {
    console.error(e);
    bootEl.innerHTML = `<div class="boot-in"><div class="boot-err"><b>تعذّر تشغيل المنصة</b><p style="margin-top:8px">${esc(e.message || e)}</p><p class="small" style="margin-top:8px;color:var(--muted)">جرّب فتح الملف في Chrome أو Edge. إذا تكرر الخطأ فقد تكون بيانات المتصفح تالفة.</p></div><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div>`;
  }
}
document.addEventListener('DOMContentLoaded', boot);
