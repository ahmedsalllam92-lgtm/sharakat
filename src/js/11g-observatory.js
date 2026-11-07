/* =====================================================================
   لوحة المؤشرات «حلقات النمو»
   المحفظة شجرة: كل حلقة سنة، وكل شعاع شراكة من بدايتها إلى نهايتها،
   والحلقة الذهبية «اليوم». حولها: النبض، وخط المسار، وبوصلة القيمة، وخريطة الشركاء.
   مشتركة بين الاتجاهين؛ الهوية تأتي من متغيرات كل اتجاه.
   ===================================================================== */
const OB_ALT = () => (design() === 'board' ? ['brief', 'إحاطة المجلس'] : ['classic', 'العرض التفصيلي']);
function obViewSwitch(cur) {
  const [k, l] = OB_ALT();
  return `<div class="ob-views" role="tablist" aria-label="طريقة عرض اللوحة"><a href="#/dashboard?v=obs" role="tab" class="${cur === 'obs' ? 'on' : ''}" data-dview="obs">${icon('leaf')}<span>حلقات النمو</span></a><a href="#/dashboard?v=${k}" role="tab" class="${cur !== 'obs' ? 'on' : ''}" data-dview="${k}">${icon(k === 'brief' ? 'flag' : 'grid')}<span>${l}</span></a></div>`;
}
function dashView(r) {
  const q = r && r.query && r.query.v;
  if (q) App.dashView = q === 'obs' ? 'obs' : 'alt';
  return App.dashView === 'alt' ? 'alt' : 'obs';
}

function renderObservatory(el) {
  el.classList.add('dashpage', 'obpage');
  App.dashHist = App.dashHist || [];
  App.dashLast = null;
  const base = () => visiblePartnerships();
  const o = D.settings.org;
  const lu = lastDataUpdate();
  el.innerHTML = `<div class="ob">
    <header class="ob-head">
      <div class="ob-ttl"><span class="ob-eyebrow"><i></i>لوحة المؤشرات · ${esc(o.name)}</span><h1>حلقات النمو</h1>
        <p class="ob-lead" id="obLead" aria-live="polite"></p>
        <dl class="ob-meta"><div><dt>تاريخ العرض</dt><dd>${fmtDate(isoDate(today()))}</dd></div><div><dt>آخر تحديث للبيانات</dt><dd>${lu ? fmtDT(lu) : '—'}</dd></div>${showDemo() ? '<div class="ob-demo">تشمل بيانات تجريبية</div>' : ''}</dl></div>
      <div class="ob-tools no-print">${obViewSwitch('obs')}
        <div class="ob-btns">${can('export') ? `<button class="btn" data-xls type="button">${icon('download')}<span>Excel</span></button><button class="btn" data-print type="button">${icon('print')}<span>طباعة</span></button>` : ''}<button class="btn" data-present type="button">${icon('expand')}<span>عرض</span></button></div></div>
    </header>
    <div class="ob-filters no-print"><div class="fbar dz-fbar" id="dashF"></div><div class="dz2-active" id="dzActive"></div></div>
    <div class="ob-printf print-only" id="obPrintF"></div>
    <div id="obBody"></div></div>`;
  const fb = new FilterBar($('#dashF', el), { dims: ['status', 'ptype', 'domain', 'sector', 'category', 'classification', 'department', 'owner', 'year'], getList: base, state: App.dashF, onChange: () => draw(false) });
  const drawActive = (list) => {
    const parts = Object.entries(App.dashF).filter(([, v]) => v && v.length);
    $('#dzActive', el).innerHTML = `<span class="dz2-scope">النطاق: <b>${list.length}</b> من ${base().length} شراكة</span>
      ${parts.flatMap(([d, vals]) => vals.map((v) => `<span class="dz2-chip"><em>${esc(FILTER_DIMS[d].label)}:</em> ${esc(FILTER_DIMS[d].fmt ? FILTER_DIMS[d].fmt(v) : v)}<button type="button" data-chipx="${esc(d)}|${esc(v)}" aria-label="إزالة الفلتر">${icon('x')}</button></span>`)).join('')}
      <span class="sp"></span>
      ${App.dashHist.length ? `<button type="button" class="linkbtn" data-undo>${icon('history')} رجوع</button>` : ''}
      ${parts.length ? `<button type="button" class="linkbtn" data-reset>${icon('x')} إعادة التعيين</button>` : ''}`;
    $('#obPrintF', el).textContent = filtersText(App.dashF);
  };
  const draw = (first) => {
    const cur = JSON.stringify(App.dashF);
    if (App.dashLast !== null && App.dashLast !== cur) App.dashHist.push(App.dashLast);
    App.dashLast = cur;
    const list = applyFilters(base(), App.dashF);
    drawActive(list);
    const body = $('#obBody', el);
    body.innerHTML = obBody(list, base(), first);
    $('#obLead', el).innerHTML = obLead(list);
    hydrateFiles(el);
    if (!first) { body.classList.remove('ob-in'); void body.offsetWidth; body.classList.add('ob-in'); }
    runCountUps(el);
  };
  const cross = (dim, k) => { const s = new Set(App.dashF[dim] || []); s.has(k) ? s.delete(k) : s.add(k); if (s.size) App.dashF[dim] = [...s]; else delete App.dashF[dim]; fb.render(); draw(false); };
  draw(true);
  el.onclick = (e) => {
    const cf = e.target.closest('[data-cf]'); if (cf) { e.preventDefault(); const [d, k] = cf.dataset.cf.split('|'); return cross(d, k); }
    const cx = e.target.closest('[data-chipx]'); if (cx) { const [d, k] = cx.dataset.chipx.split('|'); return cross(d, k); }
    if (e.target.closest('[data-undo]')) { const prev = App.dashHist.pop(); if (prev == null) return; for (const k of Object.keys(App.dashF)) delete App.dashF[k]; Object.assign(App.dashF, JSON.parse(prev)); App.dashLast = prev; fb.render(); return draw(false); }
    if (e.target.closest('[data-reset]')) { for (const k of Object.keys(App.dashF)) delete App.dashF[k]; fb.render(); return draw(false); }
    const sc = e.target.closest('[data-obscroll]'); if (sc) { const t = $('#' + sc.dataset.obscroll, el); if (t) { window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); t.classList.remove('ob-flash'); void t.offsetWidth; t.classList.add('ob-flash'); } return; }
    const dd = e.target.closest('[data-drawer]'); if (dd) return openDashDrawer(dd.dataset.drawer, applyFilters(base(), App.dashF));
    const h = e.target.closest('[data-href]'); if (h) return go(h.dataset.href);
    if (e.target.closest('[data-print]')) return window.print();
    if (e.target.closest('[data-present]')) return togglePresent();
    if (e.target.closest('[data-xls]')) return exportPartnershipsXlsx(applyFilters(base(), App.dashF), 'مؤشرات-الشراكات');
  };
  el.oninput = (e) => { if (e.target.matches('.ob-time input')) obTimeTo(el, +e.target.value); };
  el.addEventListener('click', (e) => { if (e.target.closest('[data-obnow]')) { const i = $('.ob-time input', el); i.value = today().getTime(); obTimeTo(el, +i.value); } });
  obBindPop(el);
  el.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-href][tabindex]')) { e.preventDefault(); go(e.target.dataset.href); } };
  bindTips(el);
}

function obLead(list) {
  const m = dashMetrics(list), P = wfPipeline(list);
  const b = (x) => `<b>${x}</b>`;
  if (!m.nd.length) return 'لا توجد شراكات ضمن هذا النطاق. وسّع الفلاتر أو أعد تعيينها.';
  return `${b(m.act)} ${m.act === 1 ? 'شراكة سارية' : 'شراكة سارية'} من ${b(m.nd.length)} مع ${b(m.nPartners)} جهة${m.soon.length ? `، و${b(m.soon.length)} ${m.soon.length === 1 ? 'تنتهي' : 'تنتهي'} خلال ${D.settings.expiryDays} يومًا` : ''}${P.items.length ? `، و${b(P.items.length)} طلبًا ومذكرة تتحرك في المسار المعتمد` : ''}.`;
}

/* — الجسم — */
function obBody(list, all, animate) {
  const m = dashMetrics(list);
  if (!m.nd.length) return `<div class="ob-empty">${emptyHTML({ ic: 'filter', title: 'لا توجد شراكات ضمن هذا النطاق', text: 'وسّع الفلاتر أو أعد تعيينها لعرض اللوحة.', actions: '<button class="btn" data-reset type="button">إعادة التعيين</button>' })}</div>`;
  const V = valueData(m.nd), P = wfPipeline(list);
  return `<section class="ob-hero ${animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'ob-anim' : ''}">
      <div class="ob-rings-wrap">${obRings(all, list)}</div>
      ${obPulse(m, V, P)}
    </section>
    ${obMetro(P)}
    <div class="ob-row">
      ${obCompass(V)}
      ${obMosaic(m.nd)}
    </div>
    ${obFoot(m)}`;
}

/* — حلقات النمو — */
function obRings(all, list) {
  const inSet = new Set(list.map((p) => p.id));
  const items = all.filter((p) => !p.isDraft && parseDate(p.startDate) && parseDate(p.endDate));
  const undated = all.filter((p) => !p.isDraft && !(parseDate(p.startDate) && parseDate(p.endDate)));
  if (!items.length) return '<div class="empty-chart">لا توجد شراكات بتواريخ بدء وانتهاء لرسم الحلقات.</div>';
  const t = today();
  let y0 = Math.min(...items.map((p) => parseDate(p.startDate).getFullYear()));
  let y1 = Math.max(...items.map((p) => parseDate(p.endDate).getFullYear())) + 1;
  if (y1 - y0 < 3) y1 = y0 + 3;
  const T0 = new Date(y0, 0, 1).getTime(), T1 = new Date(y1, 0, 1).getTime();
  const R0 = 78, R1 = 292, C = 340;
  const rr = (d) => R0 + Math.max(0, Math.min(1, (d.getTime() - T0) / (T1 - T0))) * (R1 - R0);
  const secs = [...L('sectors'), 'غير محدد'];
  const groups = {}; items.forEach((p) => { const s = pSector(p) || 'غير محدد'; (groups[s] = groups[s] || []).push(p); });
  const order = [...secs.filter((s) => groups[s]), ...Object.keys(groups).filter((s) => !secs.includes(s))];
  order.forEach((s) => groups[s].sort((a, b) => (a.startDate < b.startDate ? -1 : 1)));
  const GAP = 1.4, slots = items.length + GAP * order.length;
  const step = (Math.PI * 2) / slots;
  const pt = (r, a) => [(C + r * Math.cos(a)).toFixed(1), (C + r * Math.sin(a)).toFixed(1)];
  const sw = Math.max(5, Math.min(15, step * ((R0 + R1) / 2) * 0.55));
  let a = -Math.PI / 2 + step * GAP / 2;
  let rays = '', labels = '', arcs = '', idx = 0;
  const rT = rr(t);
  order.forEach((s) => {
    const a0 = a - step * 0.5;
    groups[s].forEach((p) => {
      const st = pStatus(p), ds = parseDate(p.startDate), de = parseDate(p.endDate);
      const [x1, y1_] = pt(rr(ds), a), [x2, y2] = pt(rr(de), a);
      const dl = daysLeft(p);
      const tip = `<b>${esc(partnerName(p))}</b><br>${esc(statusLabel(st))} · ${fmtDate(p.startDate, 'short')} – ${fmtDate(p.endDate, 'short')}${dl !== null && dl >= 0 && ['active', 'soon'].includes(st) ? `<br>متبقٍ ${plural(dl, 'يوم واحد', 'يومان', 'أيام', 'يومًا')}` : ''}<br>${esc(s)}${p.ptype ? ' · ' + esc(p.ptype) : ''}`;
      const on = inSet.has(p.id);
      rays += `<g class="ob-ray ${on ? '' : 'dim'} st-${st}" data-href="#/partnerships/${p.id}" tabindex="${on ? 0 : -1}" role="link" aria-label="${esc(partnerName(p))}: ${esc(statusLabel(st))}" ${tipAttr(tip)} style="--i:${idx}" data-s="${ds.getTime()}" data-e="${de.getTime()}" data-a="${a.toFixed(4)}" data-in="${on ? 1 : 0}">
        <line x1="${x1}" y1="${y1_}" x2="${x2}" y2="${y2}" class="hit" stroke-width="${(sw + 10).toFixed(1)}"/>
        <line x1="${x1}" y1="${y1_}" x2="${x2}" y2="${y2}" class="v" pathLength="1" stroke="${ST_VAR(st)}" stroke-width="${sw.toFixed(1)}"/>
        <circle cx="${pt(rT, a)[0]}" cy="${pt(rT, a)[1]}" r="${(sw * 0.32).toFixed(1)}" class="now ${['active', 'soon'].includes(st) ? '' : 'off'}"/>
        ${st === 'soon' ? `<circle cx="${x2}" cy="${y2}" r="${(sw * 0.75).toFixed(1)}" class="pulse"/>` : ''}
      </g>`;
      a += step; idx++;
    });
    const a1 = a - step * 0.5, am = (a0 + a1) / 2;
    const [ax, ay] = pt(R1 + 20, a0 + step * 0.15), [bx, by] = pt(R1 + 20, a1 - step * 0.15);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const secOn = (App.dashF.sector || []).includes(s);
    arcs += `<path d="M${ax} ${ay} A${R1 + 20} ${R1 + 20} 0 ${large} 1 ${bx} ${by}" class="ob-sarc ${secOn ? 'on' : ''}"/>`;
    const [lx, ly] = pt(R1 + 40, am);
    const anchor = Math.abs(Math.cos(am)) < 0.25 ? 'middle' : Math.cos(am) > 0 ? 'start' : 'end';
    labels += `<g class="ob-slab ${secOn ? 'on' : ''}" data-cf="sector|${esc(s)}" role="button" tabindex="0" ${tipAttr(`تصفية اللوحة بالقطاع <b>${esc(s)}</b>`)}><text x="${lx}" y="${(+ly + 4).toFixed(1)}" text-anchor="${anchor}">${esc(s)}</text><text x="${lx}" y="${(+ly + 20).toFixed(1)}" text-anchor="${anchor}" class="n">${plural(groups[s].length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')}</text></g>`;
    a += step * GAP;
  });
  let years = '';
  for (let y = y0; y <= y1; y++) {
    const r = rr(new Date(y, 0, 1));
    years += `<circle cx="${C}" cy="${C}" r="${r.toFixed(1)}" class="ob-yr ${y === y0 || y === y1 ? 'edge' : ''}"/>`;
    if (y < y1 && Math.abs(rr(new Date(y, 6, 1)) - rT) > 16) { const rm = rr(new Date(y, 6, 1)); years += `<text x="${C}" y="${(C - rm + 4).toFixed(1)}" class="ob-yl" text-anchor="middle">${y}</text>`; }
  }
  const actN = list.filter((p) => !p.isDraft && ['active', 'soon'].includes(pStatus(p))).length;
  const legend = ['active', 'soon', 'upcoming', 'sign', 'prep', 'ended'].filter((k) => items.some((p) => pStatus(p) === k)).map((k) => `<button type="button" class="${(App.dashF.status || []).includes(k) ? 'on' : ''}" data-cf="status|${k}"><i style="background:${ST_VAR(k)}"></i>${esc(statusLabel(k))}<b>${items.filter((p) => pStatus(p) === k).length}</b></button>`).join('');
  return `<div class="ob-rings" data-tour="dash-evolution-hero">
    <header class="ob-rh"><h2>${icon('leaf')} المحفظة عبر الزمن</h2><p>كل حلقة سنة، وكل شعاع شراكة من بدايتها إلى نهايتها، والحلقة الذهبية «اليوم». الداخل ماضٍ والخارج مستقبل.</p></header>
    <svg viewBox="-70 -6 ${C * 2 + 140} ${C * 2 + 12}" class="ob-svg" data-t0="${T0}" data-t1="${T1}" data-r0="${R0}" data-r1="${R1}" data-c="${C}" role="img" aria-label="حلقات المحفظة: ${items.length} شراكة من ${y0} إلى ${y1}">
      <defs><radialGradient id="obGlow"><stop offset="0" stop-color="var(--ob-glow)" stop-opacity=".55"/><stop offset="1" stop-color="var(--ob-glow)" stop-opacity="0"/></radialGradient></defs>
      <circle cx="${C}" cy="${C}" r="${R1 + 8}" class="ob-disc"/>
      ${years}
      ${arcs}
      <circle cx="${C}" cy="${C}" r="${rT.toFixed(1)}" class="ob-today"/>
      <g class="ob-tdl"><rect x="${C - 26}" y="${(C - rT - 11).toFixed(1)}" width="52" height="22" rx="11"/><text x="${C}" y="${(C - rT + 4).toFixed(1)}" text-anchor="middle">اليوم</text></g>
      ${rays}
      <circle cx="${C}" cy="${C}" r="${R0 - 10}" class="ob-core"/>
      <circle cx="${C}" cy="${C}" r="${R0 + 40}" fill="url(#obGlow)" class="ob-coreglow"/>
      <text x="${C}" y="${C + 6}" text-anchor="middle" class="ob-cn">${actN}</text>
      <text x="${C}" y="${C + 30}" text-anchor="middle" class="ob-cl">سارية الآن</text>
      ${labels}
    </svg>
    <div class="ob-time no-print"><span class="ob-time-l">${icon('history')} آلة الزمن</span><input type="range" min="${T0}" max="${T1 - 86400000}" step="86400000" value="${t.getTime()}" aria-label="اختر تاريخًا لعرض الشراكات السارية فيه"><output id="obTimeOut">اليوم</output><button type="button" class="linkbtn" data-obnow hidden>العودة إلى اليوم</button></div>
    <div class="ob-lg">${legend}${undated.length ? `<span class="ob-und">${plural(undated.length, 'سجل واحد', 'سجلان', 'سجلات', 'سجلًا')} بلا تواريخ لا يظهر في الحلقات</span>` : ''}</div>
  </div>`;
}

/* — النبض — */
function obPulse(m, V, P) {
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const cu = (v, k, fmt = 'int') => `<b class="cu" data-v="${v}" data-ck="ob:${k}" data-fmt="${fmt}">${cuFmt(v, fmt)}</b>`;
  const near = m.soon[0];
  const tile = (o) => `<button type="button" class="ob-t ${o.tone || ''}" ${o.attr}><span class="ob-tl">${icon(o.ic)}${o.l}</span><span class="ob-tv">${o.v}</span><span class="ob-ts">${o.s}</span>${o.extra || ''}</button>`;
  const spend = pct(V.fin.spent, V.fin.cash);
  return `<aside class="ob-pulse" aria-label="النبض">
    <h2 class="ob-ph"><span class="ob-beat" aria-hidden="true"></span>النبض</h2>
    <div class="ob-tiles" data-tour="dash-kpis">
      ${tile({ ic: 'check', l: 'سارية الآن', v: cu(m.act, 'act'), s: `${pct(m.act, m.signed.length)}% من ${m.signed.length} موقّعة`, attr: 'data-drawer="act"', extra: m.past.length > 2 ? `<span class="ob-spark" aria-hidden="true">${sparkSVG(m.past, 120, 30)}</span>` : '' })}
      ${tile({ ic: 'clock', l: `تنتهي خلال ${D.settings.expiryDays} يومًا`, v: cu(m.soon.length, 'soon'), s: near ? `الأقرب: ${esc(partnerName(near))}` : 'لا شيء قريب', attr: 'data-drawer="soon"', tone: m.soon.length ? 'warn' : '' })}
      ${tile({ ic: 'layers', l: 'في المسار المعتمد', v: cu(P.items.length, 'pipe'), s: P.late.length ? `${P.late.length} متأخرة أكثر من ${(D.settings.infoAgeDays || 7) * 2} يومًا` : 'لا مذكرات متأخرة', attr: 'data-obscroll="obMetro"', tone: P.late.length ? 'warn' : '' })}
      ${tile({ ic: 'star', l: 'متوسط التقييم', v: V.avg !== null ? `${cu(V.avg, 'eval')}<em>/100</em>` : '<b>—</b>', s: V.avg !== null ? `${evalGrade(V.avg)} · ${V.ev.length} مقيّمة` : 'لا تقييمات بعد', attr: 'data-obscroll="obCompass"', tone: V.avg !== null && V.avg < 65 ? 'warn' : '' })}
      ${tile({ ic: 'chart', l: 'القيمة التقديرية', v: V.fin.total ? `<b>${sarShort(V.fin.total)}</b><em>ر.س</em>` : '<b>—</b>', s: V.fin.cash ? `صُرف ${spend}% من الالتزامات` : 'لم تُسجَّل قيم مالية', attr: 'data-obscroll="obCompass"' })}
      ${tile({ ic: 'users', l: 'الجهات الشريكة', v: cu(m.nPartners, 'partners'), s: `في ${plural(Object.keys(m.partnersBy).length, 'قطاع واحد', 'قطاعين', 'قطاعات', 'قطاعًا')}`, attr: 'data-drawer="partners"' })}
    </div>
    <div class="ob-now" data-tour="dash-actions"><h3>${icon('flag')} يحتاج قرارًا الآن</h3>
      ${m.acts.length ? `<ol>${m.acts.slice(0, 4).map((x) => `<li><a href="${x.href || '#/partnerships'}" class="t-${x.tone || ''}"><b>${x.n}</b><span>${esc(x.t)}</span>${icon('chevL')}</a></li>`).join('')}</ol>${m.acts.length > 4 ? `<button type="button" class="linkbtn" data-obscroll="obFoot">+ ${m.acts.length - 4} بنود أخرى</button>` : ''}` : '<p class="ob-calm">لا توجد بنود معلّقة. المحفظة في وضع مستقر.</p>'}
    </div>
  </aside>`;
}

/* — خط المسار: 13 محطة — */
function obMetro(P) {
  const lim = (D.settings.infoAgeDays || 7) * 2, warnD = D.settings.infoAgeDays || 7;
  const at = {}; P.items.forEach((x) => { (at[x.step.id] = at[x.step.id] || []).push(x); });
  const MAX = 5;
  const st = WF_STEPS.map((s) => {
    const its = (at[s.id] || []).sort((a, b) => (b.days || 0) - (a.days || 0));
    return `<li class="ob-st ${its.length ? 'has' : ''}" style="--ph:${WF_PHASES.findIndex((p) => p.id === s.ph)}" data-obpop tabindex="0" aria-label="الخطوة ${s.n}: ${esc(s.t)} — ${its.length}">
      <template class="ob-popt">${obPopHTML(`${s.n}. ${s.t}`, `لدى ${wfActorName(s.actor)}${s.ref ? ` · البند ${s.ref} في إجراء المذكرات` : ''}`, its)}</template>
      <div class="ob-tks">${its.length ? (() => { const w = its.some((x) => x.returned) ? 'ret' : its.some((x) => (x.days || 0) > lim) ? 'late' : its.some((x) => (x.days || 0) > warnD) ? 'warm' : ''; return `<span class="ob-cnt ${w}" aria-hidden="true"><b>${its.length}</b><small>${its.length === 1 ? 'عنصر' : 'عناصر'}</small></span>`; })() : ''}</div>
      <span class="ob-dot"><em>${s.n}</em></span>
      <div class="ob-sl"><b>${esc(s.t)}</b><small>${esc(wfActorName(s.actor))}</small></div>
    </li>`;
  }).join('');
  const phases = WF_PHASES.map((ph, i) => { const n = WF_STEPS.filter((s) => s.ph === ph.id).length, c = P.phases[i].items.length; return `<div class="ob-pb" style="--n:${n};--i:${i}" data-obpop tabindex="0"><template class="ob-popt">${obPopHTML(ph.t, `المرحلة ${pad(i + 1)} · ${plural(n, 'خطوة واحدة', 'خطوتان', 'خطوات', 'خطوة')}`, P.phases[i].items, true)}</template><span>${pad(i + 1)}</span><b>${esc(ph.t)}</b><em>${c}</em></div>`; }).join('');
  return `<section class="ob-metro" id="obMetro">
    <header class="ob-sh"><div><h2>${icon('layers')} خط المسار</h2><p>الرقم فوق كل محطة عدد الطلبات والمذكرات الواقفة فيها، ولونه بأطول مدة انتظار. قف على المحطة أو المرحلة لعرض التفاصيل وفتح أي عنصر.</p></div>
      <div class="ob-mlg"><span><i class="f"></i>حديثة</span><span><i class="w"></i>أكثر من ${warnD} أيام</span><span><i class="l"></i>أكثر من ${lim} يومًا</span><span><i class="r"></i>مُعادة</span><a class="linkbtn" href="#/process">${icon('layers')} مخطط المسار</a></div></header>
    <div class="ob-mscroll"><div class="ob-mtrack">
      <div class="ob-pbs">${phases}</div>
      <ol class="ob-line">${st}</ol>
      <div class="ob-inf" ${tipAttr('شراكات موقّعة تُرفع عنها تقارير التفعيل من الإدارات بشكل مستمر')}><span>∞</span><b>${P.activating}</b><small>في التفعيل والتقارير الدورية</small></div>
    </div></div>
  </section>`;
}

/* — بوصلة القيمة: التقييم × القيمة — */
function obCompass(V) {
  const pts = V.ev.map(({ p, e }) => ({ p, s: e.score, v: pProfile(p).total || 0 }));
  const W = 560, H = 360, L_ = 54, R_ = 18, T_ = 22, B_ = 42;
  const x = (s) => L_ + (Math.max(40, Math.min(100, s)) - 40) / 60 * (W - L_ - R_);
  const vmax = Math.max(1, ...pts.map((d) => d.v));
  const y = (v) => H - B_ - Math.sqrt(v / vmax) * (H - T_ - B_);
  const vs = pts.map((d) => d.v).sort((a, b) => a - b), med = vs.length ? vs[Math.floor(vs.length / 2)] : 0;
  const col = (p) => ((p.ptype || '').includes('استراتيجي') ? 'var(--petrol)' : p.ptype ? 'var(--gold)' : 'var(--line-2)');
  const qx = x(75), qy = y(med);
  const grid = [40, 55, 70, 85, 100].map((s) => `<line x1="${x(s)}" x2="${x(s)}" y1="${T_}" y2="${H - B_}" class="g"/><text x="${x(s)}" y="${H - B_ + 18}" text-anchor="middle" class="ax">${s}</text>`).join('');
  const yt = [0, 0.25, 1].map((f) => { const v = vmax * f; return `<text x="${L_ - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="ax">${v ? sarShort(v) : '0'}</text>`; }).join('');
  const dots = pts.sort((a, b) => b.v - a.v).map((d, i) => `<g class="ob-pt" data-href="#/partnerships/${d.p.id}" tabindex="0" role="link" aria-label="${esc(partnerName(d.p))}: تقييم ${d.s}" ${tipAttr(`<b>${esc(partnerName(d.p))}</b><br>التقييم ${d.s} (${evalGrade(d.s)})<br>القيمة ${sar(d.v)}${d.p.ptype ? '<br>' + esc(d.p.ptype) : ''}`)} style="--i:${i}"><circle cx="${x(d.s).toFixed(1)}" cy="${y(d.v).toFixed(1)}" r="11" fill="${col(d.p)}"/><text x="${x(d.s).toFixed(1)}" y="${(y(d.v) - 17).toFixed(1)}" text-anchor="middle">${esc(partnerName(d.p).split(' ').slice(0, 2).join(' '))}</text></g>`).join('');
  const types = V.types.filter((t) => t.k !== 'غير محدد');
  return `<section class="ob-card ob-compass" id="obCompass">
    <header class="ob-sh"><div><h2>${icon('star')} بوصلة القيمة</h2><p>أين تقف كل شراكة مُقيّمة بين جودة الأداء (أفقيًا) وحجم القيمة (رأسيًا).</p></div>
      <div class="ob-types">${types.map((t) => `<button type="button" data-cf="ptype|${esc(t.k)}" class="${(App.dashF.ptype || []).includes(t.k) ? 'on' : ''}"><i style="background:${t.k.includes('استراتيجي') ? 'var(--petrol)' : 'var(--gold)'}"></i>${esc(t.k)}<b>${t.n}</b></button>`).join('')}</div></header>
    ${pts.length ? `<svg viewBox="0 0 ${W} ${H}" class="ob-csvg" role="img" aria-label="بوصلة القيمة لـ ${pts.length} شراكة مُقيّمة">
      <rect x="${qx}" y="${T_}" width="${W - R_ - qx}" height="${qy - T_}" class="q q1"/>
      <rect x="${L_}" y="${qy}" width="${qx - L_}" height="${H - B_ - qy}" class="q q4"/>
      ${grid}${yt}
      <line x1="${qx}" x2="${qx}" y1="${T_}" y2="${H - B_}" class="qd"/><line x1="${L_}" x2="${W - R_}" y1="${qy}" y2="${qy}" class="qd"/>
      <text x="${W - R_ - 6}" y="${T_ + 16}" text-anchor="end" class="ql">ركائز المحفظة</text>
      <text x="${L_ + 6}" y="${T_ + 16}" class="ql">قيمة تحتاج أداءً أفضل</text>
      <text x="${W - R_ - 6}" y="${H - B_ - 8}" text-anchor="end" class="ql">أداء واعد يستحق التوسيع</text>
      <text x="${L_ + 6}" y="${H - B_ - 8}" class="ql">تحت المراجعة</text>
      <text x="${(L_ + W - R_) / 2}" y="${H - 6}" text-anchor="middle" class="axt">درجة التقييم من 100</text>
      ${dots}
    </svg>` : '<div class="empty-chart">لم تُقيَّم أي شراكة بعد. يُعبَّأ نموذج تقييم الشراكة من صفحة كل شراكة، فتظهر هنا.</div>'}
    ${V.notEval.length ? `<div class="ob-noeval"><span>${icon('alert')} سارية بلا تقييم:</span>${V.notEval.slice(0, 6).map((p) => `<a href="#/partnerships/${p.id}#profile">${esc(partnerName(p))}</a>`).join('')}${V.notEval.length > 6 ? `<em>+${V.notEval.length - 6}</em>` : ''}</div>` : ''}
  </section>`;
}

/* — خريطة الشركاء: كل شراكة بلاطة، مجمّعة حسب القطاع — */
function obMosaic(nd) {
  const secs = [...L('sectors'), 'غير محدد'];
  const g = {}; nd.forEach((p) => { const s = pSector(p) || 'غير محدد'; (g[s] = g[s] || []).push(p); });
  const order = [...secs.filter((s) => g[s]), ...Object.keys(g).filter((s) => !secs.includes(s))];
  const rank = (p) => STATUS_ORDER.indexOf(pStatus(p));
  return `<section class="ob-card ob-mosaic" data-tour="dash-status">
    <header class="ob-sh"><div><h2>${icon('grid')} خريطة الشركاء</h2><p>كل بلاطة شراكة بلون حالتها، مجمّعة حسب القطاع. اضغط القطاع لتصفية اللوحة، أو البلاطة لفتح الشراكة.</p></div></header>
    <div class="ob-mz">${order.map((s) => `<div class="ob-mzc">
      <button type="button" class="ob-mzh ${(App.dashF.sector || []).includes(s) ? 'on' : ''}" data-cf="sector|${esc(s)}"><b>${esc(s)}</b><em>${g[s].length}</em></button>
      <div class="ob-mzt">${g[s].sort((a, b) => rank(a) - rank(b)).map((p) => { const pr = partnerById(p.partnerId) || {}; const st = pStatus(p); return `<a class="ob-tile" href="#/partnerships/${p.id}" style="--c:${ST_VAR(st)}" ${tipAttr(`<b>${esc(partnerName(p))}</b><br>${esc(statusLabel(st))}${pr.domain ? ' · ' + esc(pr.domain) : ''}${p.ptype ? '<br>' + esc(p.ptype) : ''}`)}><span class="mg">${esc(monogram(partnerName(p)))}</span><small>${esc(partnerName(p))}</small>${p.ptype && p.ptype.includes('استراتيجي') ? `<i class="star" title="شريك استراتيجي">${icon('star')}</i>` : ''}</a>`; }).join('')}</div></div>`).join('')}</div>
  </section>`;
}

/* — التذييل: القرارات، واكتمال البيانات، وفريق المتابعة — */
function obFoot(m) {
  const fields = CORE_FIELDS.map((k) => ({ k, l: FIELDS[k].label, n: m.nd.filter((p) => missingFields(p).includes(k)).length })).filter((f) => f.n).sort((a, b) => b.n - a.n).slice(0, 5);
  const ow = countBy(m.nd, 'owner').filter((r) => r.n && r.k !== 'غير محدد').map((r) => { const ps = m.nd.filter((p) => FILTER_DIMS.owner.get(p).includes(r.k)); return { ...r, a: ps.filter((p) => pStatus(p) === 'active').length, s: ps.filter((p) => pStatus(p) === 'soon').length }; });
  const omax = Math.max(1, ...ow.map((r) => r.n));
  const R = 34, C = 2 * Math.PI * R;
  return `<div class="ob-foot" id="obFoot">
    <section class="ob-card ob-dec"><header class="ob-sh"><div><h2>${icon('flag')} قرارات مطلوبة</h2><p>${m.acts.length ? 'بنود عملية من بيانات المحفظة والمقترحات' : 'لا توجد بنود معلّقة'}</p></div></header>
      ${m.acts.length ? `<ul>${m.acts.map((x) => `<li><a href="${x.href || '#/partnerships'}" class="t-${x.tone || ''}"><b>${x.n}</b><span><strong>${esc(x.t)}</strong><small>${esc(x.d || '')}</small></span></a></li>`).join('')}</ul>` : '<p class="ob-calm">كل شيء في مكانه.</p>'}</section>
    <section class="ob-card ob-q"><header class="ob-sh"><div><h2>${icon('check')} اكتمال البيانات</h2><p>من حقول ملف الحصر الأساسية</p></div></header>
      <div class="ob-qtop"><svg viewBox="0 0 84 84" class="ob-qr" aria-hidden="true"><circle cx="42" cy="42" r="${R}" class="bg"/><circle cx="42" cy="42" r="${R}" class="v" stroke-dasharray="${(m.score / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/><text x="42" y="48" text-anchor="middle">${m.score}%</text></svg>
        <p>${fields.length ? `أكثر الحقول نقصًا: <b>${esc(fields[0].l)}</b>` : 'كل الحقول الأساسية مكتملة.'}</p></div>
      ${fields.length ? `<ul class="ob-ql">${fields.map((f) => `<li><a href="#/partnerships?missing=1"><span>${esc(f.l)}</span><i><em style="width:${Math.round(f.n / m.nd.length * 100)}%"></em></i><b>${f.n}</b></a></li>`).join('')}</ul>` : ''}</section>
    <section class="ob-card ob-team"><header class="ob-sh"><div><h2>${icon('users')} فريق المتابعة</h2><p>الشراكات لكل مسؤول، والذهبي ما يقترب من الانتهاء</p></div></header>
      ${ow.length ? `<ul>${ow.map((r) => `<li><button type="button" data-cf="owner|${esc(r.k)}" class="${(App.dashF.owner || []).includes(r.k) ? 'on' : ''}">${avatar(r.k)}<span>${esc(r.k)}</span><i><em class="a" style="width:${r.a / omax * 100}%"></em><em class="s" style="width:${r.s / omax * 100}%"></em><em class="o" style="width:${(r.n - r.a - r.s) / omax * 100}%"></em></i><b>${r.n}</b></button></li>`).join('')}</ul>` : '<p class="ob-calm">لم يُحدَّد مسؤولون.</p>'}</section>
  </div>`;
}

/* — آلة الزمن: تحريك الحلقة الذهبية إلى أي تاريخ — */
function obTimeTo(el, ms) {
  const svg = $('.ob-svg', el); if (!svg) return;
  const T0 = +svg.dataset.t0, T1 = +svg.dataset.t1, R0 = +svg.dataset.r0, R1 = +svg.dataset.r1, C = +svg.dataset.c;
  const r = R0 + Math.max(0, Math.min(1, (ms - T0) / (T1 - T0))) * (R1 - R0);
  const isNow = Math.abs(ms - today().getTime()) < 86400000;
  $('.ob-today', svg).setAttribute('r', r.toFixed(1));
  const lab = $('.ob-tdl', svg); $('rect', lab).setAttribute('y', (C - r - 11).toFixed(1)); $('text', lab).setAttribute('y', (C - r + 4).toFixed(1));
  const d = new Date(ms);
  $('text', lab).textContent = isNow ? 'اليوم' : String(d.getFullYear());
  let n = 0;
  $$('.ob-ray', svg).forEach((g) => {
    const live = +g.dataset.s <= ms && ms <= +g.dataset.e;
    g.classList.toggle('off', !live && !isNow);
    const dot = $('.now', g), a = +g.dataset.a;
    if (dot) { dot.setAttribute('cx', (C + r * Math.cos(a)).toFixed(1)); dot.setAttribute('cy', (C + r * Math.sin(a)).toFixed(1)); dot.classList.toggle('off', !live); }
    if (live && g.dataset.in === '1') n++;
  });
  $('.ob-cn', svg).textContent = n;
  $('.ob-cl', svg).textContent = isNow ? 'سارية الآن' : `سارية في ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  $('#obTimeOut', el).textContent = isNow ? 'اليوم' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  $('[data-obnow]', el).hidden = isNow;
  svg.classList.toggle('ob-travel', !isNow);
}

/* — بطاقة المحطة/المرحلة: تظهر عند الوقوف عليها وتختفي عند الابتعاد — */
function obPopHTML(title, sub, items, byStep = false) {
  const lim = (D.settings.infoAgeDays || 7) * 2, warnD = D.settings.infoAgeDays || 7;
  const row = (x) => {
    const r = x.rec || {}, isP = x.kind === 'partnership';
    const pr = isP ? partnerById(r.partnerId) || {} : {};
    const tone = x.returned ? 'ret' : (x.days || 0) > lim ? 'late' : (x.days || 0) > warnD ? 'warm' : '';
    const facts = isP
      ? [pSector(r), r.ptype, pr.domain, r.endDate ? 'حتى ' + fmtDate(r.endDate, 'short') : ''].filter(Boolean)
      : [r.department, r.partnerSector, r.requesterName].filter(Boolean);
    return `<a class="ob-pi ${tone}" href="${x.href}"><span class="ob-pim">${esc(monogram(x.name))}</span>
      <span class="ob-pib"><b>${esc(x.name)} ${x.demo ? '<span class="demo-tag">تجريبي</span>' : ''}</b>
        <small>${esc(x.sub || '')}${isP ? ` · ${esc(statusLabel(pStatus(r)))}` : ` · ${esc(propStatusLabel(r.status))}`}${byStep ? ` · خطوة ${x.step.n}: ${esc(x.step.t)}` : ''}</small>
        ${facts.length ? `<small class="f">${facts.map(esc).join(' · ')}</small>` : ''}
        <small class="w"><i></i>${x.days !== null ? (x.days ? `ينتظر منذ ${plural(x.days, 'يوم', 'يومين', 'أيام', 'يومًا')}` : 'وصل اليوم') : ''} لدى ${esc(x.actor)}${x.returned ? ' · مُعادة للاستكمال' : x.info ? ' · بانتظار الاستكمال' : ''}</small></span></a>`;
  };
  const late = items.filter((x) => (x.days || 0) > lim).length;
  return `<div class="ob-poph"><b>${esc(title)}</b><span>${esc(sub)}</span></div>
    <div class="ob-popk"><span><b>${items.length}</b> ${items.length === 1 ? 'عنصر' : 'عناصر'}</span>${items.length ? `<span>${items.filter((x) => x.kind === 'partnership').length} مذكرة · ${items.filter((x) => x.kind === 'proposal').length} طلب</span>` : ''}${late ? `<span class="l">${late} متأخرة</span>` : ''}</div>
    ${items.length ? `<div class="ob-popl">${items.map(row).join('')}</div>` : '<p class="ob-pope">لا توجد شراكات أو طلبات في هذه المرحلة الآن.</p>'}`;
}
function obBindPop(el) {
  let pop = $('#obPop'); if (!pop) { pop = document.createElement('div'); pop.id = 'obPop'; pop.className = 'ob-pop'; pop.setAttribute('role', 'dialog'); document.body.appendChild(pop); }
  let cur = null, hideT = null;
  const place = (t) => {
    const r = t.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = r.left + r.width / 2 - pw / 2; x = Math.max(12, Math.min(innerWidth - pw - 12, x));
    let y = r.top - ph - 10; let below = false;
    if (y < 12) { y = r.bottom + 10; below = true; }
    pop.style.left = x + 'px'; pop.style.top = Math.max(12, y) + 'px';
    pop.classList.toggle('below', below);
    pop.style.setProperty('--ax', (r.left + r.width / 2 - x) + 'px');
  };
  const show = (t) => {
    clearTimeout(hideT); if (cur === t) return;
    cur = t; pop.innerHTML = $('template.ob-popt', t).innerHTML; pop.classList.add('on');
    $$('.ob-st.pop-on, .ob-pb.pop-on', el).forEach((x) => x.classList.remove('pop-on')); t.classList.add('pop-on');
    $('#tip') && $('#tip').classList.remove('on');
    place(t);
  };
  const hide = (now) => { clearTimeout(hideT); hideT = setTimeout(() => { pop.classList.remove('on'); if (cur) cur.classList.remove('pop-on'); cur = null; }, now ? 0 : 140); };
  el.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-obpop]'); if (t && !e.target.closest('.ob-tk')) show(t); });
  el.addEventListener('mouseout', (e) => { const t = e.target.closest('[data-obpop]'); if (t && !t.contains(e.relatedTarget) && !pop.contains(e.relatedTarget)) hide(); });
  el.addEventListener('focusin', (e) => { const t = e.target.closest('[data-obpop]'); if (t && e.target === t) show(t); });
  el.addEventListener('focusout', (e) => { if (!pop.contains(e.relatedTarget)) hide(); });
  pop.onmouseenter = () => clearTimeout(hideT);
  pop.onmouseleave = (e) => { if (!cur || !cur.contains(e.relatedTarget)) hide(); };
  pop.onclick = (e) => { if (e.target.closest('a')) hide(true); };
  el.addEventListener('click', (e) => { const t = e.target.closest('[data-obpop]'); if (t && !e.target.closest('a') && matchMedia('(hover: none)').matches) { cur === t ? hide(true) : show(t); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(true); });
  window.addEventListener('scroll', () => hide(true), { passive: true, once: false });
  window.addEventListener('hashchange', () => hide(true));
}
