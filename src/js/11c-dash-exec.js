/* ===== محرك العد التصاعدي (يُستخدم في كل لوحات المؤشرات) ===== */
const CU = { prev: {}, seen: new Set() };
const cuFmt = (v, f) => (f === 'pct' ? `${nf(Math.round(v))}%` : f === 'dec1' ? (+v).toFixed(1) : nf(Math.round(v)));
const cuReduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || /printing-/.test(document.documentElement.className);
function countUp(el) {
  const to = +el.dataset.v || 0, key = el.dataset.ck, fmt = el.dataset.fmt || 'int';
  const from = key && CU.prev[key] != null && CU.seen.has(key) ? CU.prev[key] : 0;
  if (key) { CU.prev[key] = to; CU.seen.add(key); }
  const final = cuFmt(to, fmt);
  el.style.minWidth = `${Math.max(final.length, cuFmt(from, fmt).length) * 0.62}em`; // أرقام بعرض ثابت حتى لا تتحرك البطاقة
  if (cuReduce() || from === to) { el.textContent = final; return; }
  const t0 = performance.now(), dur = from === 0 ? 1150 : 700;
  el.textContent = cuFmt(from, fmt);
  const tick = (t) => {
    if (!el.isConnected) return;
    const f = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - f, 3);
    const v = from + (to - from) * e;
    el.textContent = f < 1 ? cuFmt(fmt === 'dec1' ? v : to >= from ? Math.floor(v) : Math.ceil(v), fmt) : final;
    if (f < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function runCountUps(root, scope = '') {
  const els = $$('.cu', root);
  els.forEach((el, i) => { if (!el.dataset.ck) el.dataset.ck = `${scope || (App.route && App.route.name) || 'x'}:${design()}:${i}`; });
  const fresh = els.filter((el) => !CU.seen.has(el.dataset.ck));
  els.filter((el) => CU.seen.has(el.dataset.ck)).forEach(countUp);
  if (!fresh.length) return;
  if (!('IntersectionObserver' in window) || cuReduce()) { fresh.forEach(countUp); return; }
  // يبدأ العد عند ظهور الرقم أول مرة فقط، ولا يتكرر مع التمرير
  fresh.forEach((el) => { el.textContent = cuFmt(0, el.dataset.fmt); el.style.minWidth = `${cuFmt(+el.dataset.v || 0, el.dataset.fmt).length * 0.62}em`; });
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); countUp(en.target); } }), { threshold: 0.4 });
  fresh.forEach((el) => io.observe(el));
}
function animateDash(el) {
  if (!cuReduce()) { el.classList.add('dash-anim'); setTimeout(() => el.classList.remove('dash-anim'), 1800); }
  runCountUps(el);
}
// الطباعة والتصدير: القيم النهائية دائمًا
window.addEventListener('beforeprint', () => $$('.cu').forEach((el) => { el.textContent = cuFmt(+el.dataset.v || 0, el.dataset.fmt); }));

/* ===== لوحة المؤشرات التنفيذية (الاتجاه المؤسسي) ===== */
const ST_ORDER = ['active', 'soon', 'upcoming', 'sign', 'prep', 'hold', 'nodates', 'ended', 'cancel'];
function lastDataUpdate() {
  const ts = [...D.partnerships.map((p) => p.updatedAt), ...D.proposals.map((p) => p.updatedAt || p.submittedAt), ...D.partners.map((p) => p.updatedAt)].filter(Boolean).sort();
  return ts.length ? ts[ts.length - 1] : null;
}
function renderDashClassic(el) {
  el.classList.add('dashpage');
  App.dashHist = App.dashHist || [];
  App.dashLast = null;
  const base = () => visiblePartnerships();
  const lu = lastDataUpdate();
  el.innerHTML = `<div class="dz3">
    <header class="dz3-head">
      <div><h1>لوحة مؤشرات الشراكات</h1>
        <dl class="dz3-meta"><div><dt>آخر تحديث للبيانات</dt><dd>${lu ? fmtDT(lu) : '—'}</dd></div><div><dt>تاريخ العرض</dt><dd>${fmtDate(isoDate(new Date()))}</dd></div>${showDemo() ? '<div class="dz3-demo">تشمل بيانات تجريبية</div>' : ''}</dl></div>
      <div class="dz-tools no-print">${obViewSwitch('alt')}${can('export') ? `<button class="btn" data-xls type="button">${icon('download')} Excel</button><button class="btn" data-print type="button">${icon('print')} طباعة أو PDF</button>` : ''}<button class="btn" data-present type="button">${icon('expand')} عرض</button></div>
    </header>
    <div class="dz3-filters no-print"><div class="fbar dz-fbar" id="dashF"></div><div class="dz2-active" id="dzActive"></div></div>
    <div id="dashBody"></div></div>`;
  const fb = new FilterBar($('#dashF', el), { dims: ['status', 'ptype', 'domain', 'category', 'sector', 'classification', 'department', 'owner', 'year'], getList: base, state: App.dashF, onChange: () => draw(false) });
  const drawActive = (list) => {
    const parts = Object.entries(App.dashF).filter(([, v]) => v && v.length);
    $('#dzActive', el).innerHTML = `<span class="dz2-scope">النطاق: <b>${list.length}</b> من ${base().length} شراكة</span>
      ${parts.flatMap(([d, vals]) => vals.map((v) => `<span class="dz2-chip"><em>${esc(FILTER_DIMS[d].label)}:</em> ${esc(FILTER_DIMS[d].fmt ? FILTER_DIMS[d].fmt(v) : v)}<button type="button" data-chipx="${esc(d)}|${esc(v)}" aria-label="إزالة الفلتر">${icon('x')}</button></span>`)).join('')}
      <span class="sp"></span>
      ${App.dashHist.length ? `<button type="button" class="linkbtn" data-undo>${icon('history')} رجوع</button>` : ''}
      ${parts.length ? `<button type="button" class="linkbtn" data-reset>${icon('x')} إعادة التعيين</button>` : ''}`;
  };
  const draw = (first) => {
    const cur = JSON.stringify(App.dashF);
    if (App.dashLast !== null && App.dashLast !== cur) App.dashHist.push(App.dashLast);
    App.dashLast = cur;
    const list = applyFilters(base(), App.dashF);
    const filtered = Object.values(App.dashF).some((v) => v && v.length);
    drawActive(list);
    const body = $('#dashBody', el);
    body.innerHTML = list.length ? dz2Body(list, filtered, first && !CU.seen.has('dz:act')) : `<div class="panel dz2-empty">${emptyHTML({ ic: 'filter', title: 'لا توجد شراكات ضمن هذا النطاق', text: 'وسّع الفلاتر أو أعدها إلى الوضع الافتراضي لعرض المؤشرات.', actions: '<button class="btn primary" data-reset type="button">إعادة التعيين</button>' })}</div>`;
    hydrateFiles(el);
    if (!first) { body.classList.remove('dz2-in'); void body.offsetWidth; body.classList.add('dz2-in'); }
    runCountUps(el);
  };
  const cross = (dim, k) => { const s = new Set(App.dashF[dim] || []); s.has(k) ? s.delete(k) : s.add(k); if (s.size) App.dashF[dim] = [...s]; else delete App.dashF[dim]; fb.render(); draw(false); };
  draw(true);
  el.onclick = (e) => {
    const tmd = e.target.closest('[data-tmdim]'); if (tmd) { App.dashDim = tmd.dataset.tmdim; return draw(false); }
    const cf = e.target.closest('[data-cf]'); if (cf) { const [d, k] = cf.dataset.cf.split('|'); return cross(d, k); }
    const cx = e.target.closest('[data-chipx]'); if (cx) { const [d, k] = cx.dataset.chipx.split('|'); return cross(d, k); }
    if (e.target.closest('[data-undo]')) { const prev = App.dashHist.pop(); if (prev == null) return; for (const k of Object.keys(App.dashF)) delete App.dashF[k]; Object.assign(App.dashF, JSON.parse(prev)); App.dashLast = prev; fb.render(); return draw(false); }
    if (e.target.closest('[data-reset]')) { for (const k of Object.keys(App.dashF)) delete App.dashF[k]; fb.render(); return draw(false); }
    const dd = e.target.closest('[data-drawer]'); if (dd) return openDashDrawer(dd.dataset.drawer, applyFilters(base(), App.dashF));
    const h = e.target.closest('[data-href]'); if (h) return go(h.dataset.href);
    if (e.target.closest('[data-print]')) return printDashboardSheet();
    if (e.target.closest('[data-present]')) return togglePresent();
    if (e.target.closest('[data-xls]')) return exportPartnershipsXlsx(applyFilters(base(), App.dashF), 'مؤشرات-الشراكات');
  };
  bindTips(el);
}

/* — أفق المحفظة: كل شراكة شريط من البدء إلى الانتهاء، وخط ذهبي عند اليوم — */
function horizonHTML(list, animate) {
  const all = list.filter((p) => !p.isDraft && p.startDate && p.endDate);
  if (!all.length) return '<div class="hz-empty">لا توجد شراكات بتواريخ بدء وانتهاء ضمن النطاق.</div>';
  const MAXR = 14;
  const ps = (all.length > MAXR ? all.slice().sort((a, b) => (a.endDate < b.endDate ? 1 : -1)).slice(0, MAXR) : all).sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  const t = today();
  const y0 = Math.min(...ps.map((p) => parseDate(p.startDate).getFullYear()));
  const y1 = Math.max(...ps.map((p) => parseDate(p.endDate).getFullYear()), t.getFullYear()) + 1;
  const T0 = +new Date(y0, 0, 1), T1 = +new Date(y1, 0, 1);
  const X = (d) => ((+d - T0) / (T1 - T0)) * 100;
  const years = []; for (let y = y0; y <= y1; y++) years.push(y);
  const cls = (p) => { const s = pStatus(p); return s === 'active' ? 'a' : s === 'soon' ? 's' : s === 'upcoming' ? 'u' : s === 'ended' ? 'e' : 'o'; };
  return `<div class="hz ${animate ? 'anim' : ''}" style="--n:${ps.length}">
    <div class="hz-plot" aria-hidden="true">${years.map((y) => `<span class="hz-yr" style="right:${X(new Date(y, 0, 1)).toFixed(2)}%"><em>${y < y1 ? y : ''}</em></span>`).join('')}<span class="hz-today" style="right:${X(t).toFixed(2)}%"><em>اليوم</em></span></div>
    <div class="hz-rows">${ps.map((p, k) => { const a = X(parseDate(p.startDate)), b = X(parseDate(p.endDate)), dl = daysLeft(p); return `<a class="hz-row" href="#/partnerships/${p.id}" ${tipAttr(`<b>${esc(partnerName(p))}</b><br>من ${fmtDate(p.startDate)} إلى ${fmtDate(p.endDate)}<br>${statusLabel(pStatus(p))}${dl !== null && dl >= 0 ? ` — متبقٍ ${dl} يومًا` : ''}`)}><span class="hz-name">${esc(partnerName(p))}</span><span class="hz-track"><i class="hz-bar ${cls(p)}" style="right:${a.toFixed(2)}%;width:${Math.max(0.8, b - a).toFixed(2)}%;--d:${k}"></i></span></a>`; }).join('')}</div>
    ${all.length > MAXR ? `<p class="hz-more">يعرض الأفق ${MAXR} شراكة الأحدث انتهاءً من أصل ${all.length}.</p>` : ''}</div>`;
}
/* — لوحة التفاصيل الجانبية — */
const DRAWERS = {
  act: { t: 'الشراكات السارية', f: (p) => ['active', 'soon'].includes(pStatus(p)), q: { status: ['active', 'soon'] } },
  soon: { t: 'الشراكات التي تنتهي قريبًا', f: (p) => pStatus(p) === 'soon', q: { status: ['soon'] } },
  ended: { t: 'الشراكات المنتهية', f: (p) => pStatus(p) === 'ended', q: { status: ['ended'] } },
  missing: { t: 'سجلات ينقصها بيانات أساسية', f: (p) => missingFields(p).length > 0, href: '#/partnerships?missing=1' },
};
function openDashDrawer(key, list) {
  if (key === 'partners') return go('#/partners');
  if (key === 'props') return go(can('proposal.review') ? '#/proposals?status=submitted|review|info' : '#/share');
  const d = DRAWERS[key]; if (!d) return;
  const rows = list.filter((p) => !p.isDraft && d.f(p)).sort((a, b) => ((a.endDate || '9') < (b.endDate || '9') ? -1 : 1));
  $('#dzDrawer') && $('#dzDrawer').remove();
  const w = document.createElement('div'); w.id = 'dzDrawer'; w.className = 'dz2-drawer';
  w.innerHTML = `<div class="dz2-dr-bg" data-drx></div><aside class="dz2-dr" role="dialog" aria-label="${esc(d.t)}"><header><div><h3>${esc(d.t)}</h3><p>${rows.length} ${rows.length === 1 ? 'شراكة' : 'شراكات'} ضمن النطاق الحالي</p></div><button class="icon-btn" data-drx aria-label="إغلاق">${icon('x')}</button></header>
    <div class="dz2-dr-list">${rows.length ? rows.map((p) => { const dl = daysLeft(p); return `<a class="dz2-dr-it" href="#/partnerships/${p.id}"><span class="grow"><b>${esc(partnerName(p))} ${demoTag(p)}</b><small><span class="mono">${esc(p.code || '')}</span>${p.endDate ? ` · ينتهي ${fmtDate(p.endDate, 'short')}` : ''}</small></span>${statusChip(p)}${dl !== null && dl >= 0 ? `<span class="dz-days ${dl <= D.settings.expiryDays ? 'warn' : ''}">${dl} يومًا</span>` : ''}</a>`; }).join('') : '<div class="empty-chart">لا توجد سجلات.</div>'}</div>
    <footer><a class="btn primary" href="${d.href || '#/partnerships' + filtersToQuery({ ...App.dashF, ...d.q })}" data-drgo>${icon('layers')} فتح في سجل الشراكات</a><button class="btn ghost" data-drx type="button">إغلاق</button></footer></aside>`;
  document.body.appendChild(w);
  requestAnimationFrame(() => w.classList.add('on'));
  const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 260); document.removeEventListener('keydown', esc_); };
  const esc_ = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc_);
  w.addEventListener('click', (e) => { if (e.target.closest('[data-drx]')) close(); if (e.target.closest('a')) setTimeout(close, 0); });
}

/* — المحتوى — */
function dz2Body(list, filtered, animate) {
  const m = dashMetrics(list);
  if (m.ser) { const c = m.ser.rows.find((r) => r.current); if (c) c.total = m.act; }
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const urgent = m.nd.filter((p) => { const a = expiryAlert(p); return a && a.tone === 'urgent'; }).length;
  const pv = m.props.filter((x) => x.status !== 'draft');
  const nSecs = Object.keys(m.partnersBy).length;
  const near = m.soon[0] || m.nd.filter((p) => p.endDate && parseDate(p.endDate) >= today()).sort((a, b) => (a.endDate < b.endDate ? -1 : 1))[0];
  const narr = `${filtered ? 'ضمن الفلاتر المختارة، ' : ''}تضم المحفظة ${m.nd.length} ${m.nd.length === 1 ? 'شراكة' : 'شراكة'} مع ${m.nPartners} جهة${near ? `، وأقرب انتهاء لشراكة سارية مع «${esc(partnerName(near))}» في ${fmtDate(near.endDate)}` : ''}.${m.inProc.length ? ` وتعمل إدارة الشراكات على ${m.inProc.length} ${m.inProc.length === 1 ? 'مقترح' : 'مقترحات'} من الإدارات.` : ''}`;
  const cu = (v, k, fmt = 'int') => `<b class="cu" data-v="${v}" data-ck="dz:${k}" data-fmt="${fmt}">${cuFmt(v, fmt)}</b>`;
  const cell = (o) => `<button type="button" class="dz-kpi dz2-kpi dz3-cell ${o.tone || ''}" data-drawer="${o.dr}"><span class="dz3-cl">${o.l}</span><span class="dz3-cv">${cu(o.v, o.k, o.fmt)}</span>${o.bar != null ? `<span class="dz3-cbar" aria-hidden="true"><i style="width:${Math.min(100, o.bar)}%"></i></span>` : ''}<span class="dz3-cs">${o.s}</span></button>`;
  const panel = (cls, title, sub, inner, extra = '', attrs = '') => `<section class="dz3-p ${cls}" ${attrs}><header><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>${extra}</header>${inner}</section>`;
  // تركيب المحفظة
  const stc = ST_ORDER.map((k) => ({ k, n: m.nd.filter((p) => pStatus(p) === k).length })).filter((x) => x.n);
  const tot = stc.reduce((t, x) => t + x.n, 0) || 1;
  const sel = (d, k) => (App.dashF[d] || []).includes(k);
  const comp = `<div class="dz3-comp" role="img" aria-label="تركيب المحفظة حسب الحالة">${stc.map((x) => `<button type="button" class="dz3-seg ${sel('status', x.k) ? 'sel' : ''}" data-cf="status|${x.k}" style="flex:${x.n};background:${ST_VAR(x.k)}" ${tipAttr(`<b>${statusLabel(x.k)}</b>: ${x.n} (${pct(x.n, tot)}%)<br><small>اضغط لتصفية اللوحة</small>`)} aria-label="${esc(statusLabel(x.k))} ${x.n}"></button>`).join('')}</div>
    <div class="dz2-legend dz3-legend">${stc.map((x) => `<button type="button" class="dz-st ${sel('status', x.k) ? 'sel' : ''}" data-cf="status|${x.k}"><i style="background:${ST_VAR(x.k)}"></i><span>${esc(statusLabel(x.k))}</span><b>${x.n}</b><em>${pct(x.n, tot)}%</em></button>`).join('')}</div>`;
  const bars = (dim, title, sub) => {
    const rows = countBy(m.nd, dim).filter((r) => r.n), max = Math.max(1, ...rows.map((r) => r.n)), sum = rows.reduce((t, r) => t + r.n, 0) || 1;
    return panel('c4 dz-bars k-' + dim, title, sub, rows.length ? `<div class="dzb">${rows.map((r) => `<button type="button" class="dzb-r ${sel(dim, r.k) ? 'sel' : ''}" data-cf="${dim}|${esc(r.k)}" ${tipAttr(`<b>${esc(r.label)}</b>: ${r.n} (${pct(r.n, sum)}%)<br><small>اضغط لتصفية اللوحة</small>`)}><span class="dzb-l">${esc(r.label)}</span><span class="dzb-t"><i class="${/^غير/.test(r.k) ? 'mut' : ''}" style="width:${Math.max(4, r.n / max * 100).toFixed(1)}%"></i></span><b>${r.n}</b><em>${pct(r.n, sum)}%</em></button>`).join('')}</div>` : '<div class="empty-chart">لا توجد بيانات ضمن النطاق.</div>');
  };
  const ow = countBy(m.nd, 'owner').filter((r) => r.n), omax = Math.max(1, ...ow.map((r) => r.n));
  const owners = ow.map((r) => { const ps = m.nd.filter((p) => FILTER_DIMS.owner.get(p).includes(r.k)); const a = ps.filter((p) => ['active', 'soon'].includes(pStatus(p))).length; return { ...r, a, o: r.n - a }; });
  const PF = ['submitted', 'review', 'info', 'accepted', 'converted', 'rejected'];
  const PFC = { submitted: 'var(--st-up)', review: 'var(--st-soon)', info: 'var(--warn)', accepted: 'var(--st-active)', converted: 'var(--petrol)', rejected: 'var(--danger)' };
  const pfn = PF.map((s) => ({ s, n: pv.filter((x) => x.status === s).length })), pfmax = Math.max(1, ...pfn.map((x) => x.n));
  const decided = pv.filter((x) => ['accepted', 'converted', 'rejected'].includes(x.status)).length, okd = pv.filter((x) => ['accepted', 'converted'].includes(x.status)).length;
  const t = today(), y1 = addDays(t, 365);
  const exp = m.nd.filter((p) => p.stage === 'signed' && p.endDate && parseDate(p.endDate) >= t && parseDate(p.endDate) <= y1).sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  const fields = CORE_FIELDS.map((k) => ({ k, l: FIELDS[k].label, n: m.nd.filter((p) => missingFields(p).includes(k)).length })).sort((a, b) => b.n - a.n);
  const ser = m.ser, curR = ser && (ser.rows.find((r) => r.current) || ser.rows.filter((r) => !r.future).slice(-1)[0]), ci = ser ? ser.rows.indexOf(curR) : 0;
  const ago = ser ? ser.rows[Math.max(0, ci - 12)].total : 0, ahead = ser ? ser.rows[Math.min(ser.rows.length - 1, ci + 6)].total : 0;
  const started = list.filter((p) => !p.isDraft && p.stage === 'signed' && p.startDate && parseDate(p.startDate) >= addDays(t, -365) && parseDate(p.startDate) <= t).length;
  const delta = m.act - ago;
  const soonTxt = m.soon.length ? `، ${m.soon.length === 1 ? 'وشراكة واحدة تنتهي' : m.soon.length === 2 ? 'وشراكتان تنتهيان' : `و${m.soon.length} شراكات تنتهي`} خلال ${D.settings.expiryDays} يومًا` : '، ولا توجد شراكات تنتهي خلال ' + D.settings.expiryDays + ' يومًا';

  return `<section class="dz3-hero" data-tour="dash-evolution-hero">
      <div class="dz3-topo" aria-hidden="true">${topoSVG('dash-horizon', { W: 1400, H: 520, levels: 16, cols: 80, focus: 'left' })}</div>
      <div class="dz3-hero-in">
        <h2 class="dz3-state">${cu(m.act, 'h-act')} من ${cu(m.nd.length, 'h-all')} شراكة سارية الآن${soonTxt}.</h2>
        <p class="dz-summary dz3-narr">${narr}</p>
      </div>
      <div class="dz3-hz-head"><h3>أفق المحفظة</h3><div class="dz3-hz-lg"><span><i class="a"></i>سارية</span><span><i class="s"></i>تنتهي خلال ${D.settings.expiryDays} يومًا</span><span><i class="u"></i>لم يبدأ سريانها</span><span><i class="e"></i>منتهية</span></div></div>
      ${horizonHTML(list, animate)}
    </section>
    <div class="dz-kpis dz2-kpis dz3-ledger" data-tour="dash-kpis">
      ${cell({ l: 'الشراكات السارية', v: m.act, k: 'act', dr: 'act', bar: pct(m.act, m.signed.length), s: `${pct(m.act, m.signed.length)}% من ${m.signed.length} شراكة موقّعة` })}
      ${cell({ l: `تنتهي خلال ${D.settings.expiryDays} يومًا`, v: m.soon.length, k: 'soon', dr: 'soon', tone: m.soon.length ? 'warn' : '', s: m.soon.length ? (urgent ? `منها ${urgent} خلال ${D.settings.alertDays || 30} يومًا` : `أقربها ${esc(partnerName(m.soon[0]))}`) : 'لا توجد استحقاقات قريبة' })}
      ${cell({ l: 'الجهات الشريكة', v: m.nPartners, k: 'partners', dr: 'partners', s: `في ${plural(nSecs, 'قطاع واحد', 'قطاعين', 'قطاعات', 'قطاعًا')}` })}
      ${cell({ l: 'مقترحات قيد المعالجة', v: m.inProc.length, k: 'inproc', dr: 'props', tone: m.inProc.length && m.oldest > (D.settings.infoAgeDays || 7) ? 'warn' : '', s: m.inProc.length ? `أقدمها منذ ${plural(m.oldest, 'يوم', 'يومين', 'أيام', 'يومًا')}` : 'لا توجد مقترحات معلّقة' })}
      ${cell({ l: 'اكتمال البيانات', v: m.score, k: 'score', fmt: 'pct', dr: 'missing', bar: m.score, tone: m.score < 70 ? 'warn' : '', s: 'من حقول ملف الحصر الأساسية' })}
    </div>
    <div class="dz3-grid">
      ${panel('c5 r2 k-dec', 'قرارات مطلوبة', m.acts.length ? 'بنود تحتاج متابعة من إدارة الشراكات' : 'لا توجد بنود معلّقة', m.acts.length ? `<div class="dz-acts dz2-acts">${m.acts.map((a) => `<a class="dz-act ${a.tone}" href="${a.href}"><b>${a.n}</b><span><strong>${esc(a.t)}</strong><small>${esc(a.d)}</small></span>${icon('chevL')}</a>`).join('')}</div>` : '<div class="empty-chart">لا توجد بنود معلّقة ضمن النطاق.</div>', '', 'data-tour="dash-actions"')}
      ${panel('c7 k-comp', 'تركيب المحفظة', `${m.nd.length} شراكة موزعة حسب حالتها المحسوبة من التواريخ`, comp, '', 'data-tour="dash-status"')}
      ${panel('c7 k-trend', 'تطور عدد الشراكات السارية', 'فعلي حتى اليوم، والخط المتقطع متوقع وفق تواريخ الانتهاء', dzLineSVG(ser) + (ser ? `<div class="dz-trend dz2-trend"><div>${cu(m.act, 'tr-now')}<span>سارية الآن</span></div><div>${cu(ago, 'tr-ago')}<span>قبل 12 شهرًا</span><small class="${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}">${delta > 0 ? `زيادة ${delta}` : delta < 0 ? `انخفاض ${-delta}` : 'دون تغير'}</small></div><div>${cu(started, 'tr-start')}<span>بدأت خلال 12 شهرًا</span></div><div>${cu(ahead, 'tr-ahead')}<span>متوقع بعد 6 أشهر دون تجديد</span></div></div>` : ''), '', 'data-tour="dash-evolution"')}
    </div>
    ${dzValueHTML(m.nd, sel)}
    <div class="dz3-deep">
      <section class="dz3-dc c8 k-dist"><header><h3>أين تتركز الشراكات</h3><p>مساحة كل خانة بحجم عدد الشراكات فيها. اضغط أي خانة لتصفية اللوحة</p></header>${treemapHTML(m.nd, App.dashDim || 'sector')}</section>
      <section class="dz3-dc c4 k-own"><header><h3>فريق المتابعة</h3><p>الحلقة: السارية، والذهبي ما يقترب من الانتهاء</p></header>${ownerRingsHTML(m.nd)}</section>
      <section class="dz3-dc c7 k-exp"><header><h3>العد التنازلي للاستحقاقات</h3><p>${exp.length ? `${exp.length} ${exp.length === 1 ? 'شراكة تنتهي' : 'شراكات تنتهي'} قبل ${fmtDate(isoDate(y1))}، والحلقة تمثل ما تبقى من السنة` : 'خلال 12 شهرًا القادمة'}</p></header>${countdownHTML(exp)}</section>
      <section class="dz3-dc c5 k-prop"><header><h3>رحلة مقترحات الإدارات</h3><p>${pv.length} ${pv.length === 1 ? 'مقترح' : 'مقترحات'}، وحجم الدائرة بعدد المقترحات في المرحلة. لا تتأثر بفلاتر الشراكات</p></header>${proposalFlowHTML(pv)}</section>
      <section class="dz3-dc c12 k-qual"><header><div><h3>خريطة اكتمال البيانات</h3><p>كل صف حقل من ملف الحصر وكل نقطة شراكة. اضغط النقطة لفتح الشراكة، أو اسم الحقل لفتح ما ينقصه</p></div><b class="dz-score">${cu(m.score, 'score2', 'pct')}</b></header>${qualityMatrixHTML(m.nd)}</section>
    </div>`;
}

/* مؤشرات مشتركة للوحة */
function dashMetrics(list) {
  const nd = list.filter((p) => !p.isDraft), signed = nd.filter((p) => p.stage === 'signed');
  const act = nd.filter((p) => ['active', 'soon'].includes(pStatus(p))).length;
  const ser = monthlySeries(list);
  const past = ser ? ser.rows.filter((r) => !r.future).slice(-12).map((r) => r.total) : [];
  const partnersBy = {}; nd.forEach((p) => { const s = pSector(p) || 'غير محدد'; (partnersBy[s] = partnersBy[s] || new Set()).add(p.partnerId); });
  const soon = nd.filter((p) => pStatus(p) === 'soon').sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  const props = visibleProposals(), inProc = props.filter((x) => ['submitted', 'review', 'info'].includes(x.status));
  const cells = nd.length * CORE_FIELDS.length, filled = cells - nd.reduce((t, p) => t + missingFields(p).length, 0);
  const y = String(today().getFullYear());
  return { nd, signed, act, ser, past, delta: past.length > 1 ? past[past.length - 1] - past[0] : 0, partnersBy, nPartners: new Set(nd.map((p) => p.partnerId)).size, soon, props, inProc,
    oldest: inProc.length ? Math.max(...inProc.map(propAgeDays)) : 0, score: cells ? Math.round(filled / cells * 100) : 0, startedYear: signed.filter((p) => (p.startDate || '').startsWith(y)).length, acts: dashActions(list) };
}
