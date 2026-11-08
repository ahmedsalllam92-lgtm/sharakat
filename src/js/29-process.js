/* =====================================================================
   مسار الشراكة: المخطط مولّد من المسار المطبق فعليًا في المنظومة (WF_STEPS)
   كل خطوة في مسار جهتها، وعدد السجلات فيها الآن، ومصفوفة مسؤوليات
   مستخرجة من الصلاحيات المطبقة نفسها
   ===================================================================== */
const PR_LANES = [
  { id: 'requester', t: 'الإدارة الطالبة', s: 'تقدّم الطلب وتحضر الاجتماع', ic: 'send' },
  { id: 'partnerships', t: 'إدارة الشراكات', s: 'تدير المسار حتى التوقيع', ic: 'users' },
  { id: 'concerned', t: 'الإدارات المعنية', s: 'ملاحظات وتقارير تفعيل', ic: 'building' },
  { id: 'strategy', t: 'الإدارة الاستراتيجية', s: 'المواءمة الاستراتيجية', ic: 'chart' },
  { id: 'legal', t: 'الإدارة القانونية', s: 'مراجعة الخطابات', ic: 'file' },
  { id: 'excellency', t: 'مكتب المعالي', s: 'الموافقة بخطاب — خارج المنصة', ic: 'mail' },
  { id: 'bizdev', t: 'إدارة تطوير الأعمال', s: 'خطة التفعيل', ic: 'leaf' },
];
const PR_PHASES = WF_PHASES.map((ph) => { const ns = WF_STEPS.filter((s) => s.ph === ph.id).map((s) => s.n - 1); return { t: ph.t, from: Math.min(...ns), to: Math.max(...ns) }; });
const prP = () => visibleProposals();
const prS = (k) => visiblePartnerships().filter((p) => !p.isDraft && k.includes(pStatus(p)));
/* السجلات الواقفة عند كل خطوة الآن */
function prAt(id) {
  const out = [];
  if (WF_STEPS.find((s) => s.id === id).on === 'proposal') prP().filter((x) => !['draft', 'converted'].includes(x.status) && (!x.demo || showDemo())).forEach((x) => { const st = wfStateOf('proposal', x); if (st.cur && st.cur.id === id) out.push({ t: x.partnerName || x.ref, s: x.ref + ' — ' + x.department, h: '#/proposals/' + x.id }); });
  else D.partnerships.filter((p) => !p.isDraft && !['cancel', 'hold'].includes(p.stage) && (showDemo() || !p.demo)).forEach((p) => { const st = wfStateOf('partnership', p); if (st.cur && st.cur.id === id) out.push({ t: partnerName(p), s: (p.code || '') + (st.S[id] && st.S[id].status === 'returned' ? ' — أُعيدت بملاحظات' : ''), h: '#/partnerships/' + p.id + '?wf=1' }); });
  return out;
}
const PR_STEPS = [
  ...WF_STEPS.map((s) => ({ id: s.id, lane: s.actor, col: s.n - 1, kind: s.id === 'request' ? 'start' : s.kind === 'decision' || s.kind === 'review' ? 'decision' : '', t: s.t, st: s.ref ? `البند ${s.ref} — ${s.docs.map((d) => d.l).join('، ') || ''}` : s.docs.map((d) => d.l).join('، ') || 'من خدمة «شارك»', wf: s, n: () => prAt(s.id).length, href: s.on === 'proposal' ? '#/proposals' : '#/partnerships' })),
  { id: 'direct', lane: 'partnerships', col: 0, kind: 'start', t: 'تسجيل شراكة مباشرة', st: 'شراكة قائمة أو موقّعة: من ملف الحصر أو بطلب من إدارة', n: null },
  { id: 'closed', lane: 'requester', col: 2, kind: 'end', t: 'إغلاق الطلب', st: 'الجهة غير مناسبة', n: () => prP().filter((x) => x.status === 'rejected').length, href: '#/proposals?status=rejected' },
  { id: 'active', lane: 'requester', col: 12, kind: 'end', t: 'مذكرة مفعّلة', st: 'تتابع في السجل حتى الاستحقاق', n: () => visiblePartnerships().filter((p) => p.activation === 'مفعّلة' && ['active', 'soon'].includes(pStatus(p))).length, href: '#/partnerships?activation=مفعّلة' },
];
const PR_EDGES = [
  ...WF_STEPS.slice(0, -1).map((s, i) => [s.id, WF_STEPS[i + 1].id, s.yesShort || (s.kind === 'review' ? 'اعتماد' : '')]),
  ...wfBranches().filter((b) => b.type !== 'reject').map((b) => [b.from, b.to, b.label, b.type === 'back' ? 'back' : undefined]),
  ['direct', (WF_STEPS.find((s) => s.on === 'partnership') || {}).id, 'تسجيل مباشر', 'long'], [WF_STEPS[WF_STEPS.length - 1].id, 'active'],
];
/* مصفوفة المسؤوليات مستخرجة من المسار المطبق */
const PR_ROLES = [
  { k: 'partnerships', t: 'إدارة الشراكات' }, { k: 'requester', t: 'الإدارة الطالبة' }, { k: 'concerned', t: 'الإدارات المعنية' },
  { k: 'strategy', t: 'الإدارة الاستراتيجية' }, { k: 'legal', t: 'الإدارة القانونية' }, { k: 'excellency', t: 'مكتب المعالي' }, { k: 'bizdev', t: 'إدارة تطوير الأعمال' }, { k: 'leader', t: 'القيادة' },
];
const RACI = { R: { t: 'ينفّذ', c: 'r' }, A: { t: 'يعتمد', c: 'a' }, C: { t: 'يُستشار', c: 'c' }, I: { t: 'يطّلع', c: 'i' } };
function prRaci() {
  const M = {};
  WF_STEPS.forEach((s) => {
    const r = M[s.id] = { admin: 'I' };
    r[s.actor] = ['strategy', 'legal', 'excellency'].includes(s.actor) ? 'A' : 'R';
    if (s.docs.some((d) => d.by === 'partnerships')) r.partnerships = 'R';
    if (s.id === 'eval') { r.partnerships = 'A'; r.requester = 'I'; }
    if (s.id === 'meeting') { r.requester = 'C'; r.concerned = 'C'; }
    if (['draft', 'partner'].includes(s.id)) r.requester = 'I';
    if (s.id === 'depts') { r.partnerships = 'A'; r.requester = 'R'; }
    if (s.id === 'signed') { r.leader = 'I'; r.excellency = r.excellency || 'I'; }
    if (s.id === 'bizdev') { r.partnerships = 'C'; r.concerned = 'I'; }
    if (s.id === 'reports') { r.partnerships = 'A'; r.bizdev = 'C'; r.leader = 'I'; }
  });
  return M;
}
const prMatrixSteps = () => WF_STEPS;

function renderProcess(el) {
  const M = prRaci();
  const cnt = (s) => (typeof s.n === 'function' ? s.n() : null);
  const laneOf = (id) => PR_LANES.findIndex((l) => l.id === id);
  const NC = 13;
  const accts = wfAccounts();
  const PH_C = ['#3E8576', '#1F6B5C', '#0B3F38', '#B08A3E', '#5FB894'];
  const live = WF_STEPS.reduce((t, x) => t + prAt(x.id).length, 0);
  const activated = visiblePartnerships().filter((p) => p.activation === 'مفعّلة' && ['active', 'soon'].includes(pStatus(p))).length;
  const back = PR_EDGES.filter((e) => e[3] === 'back');
  const stair = WF_STEPS.map((x, i) => {
    const pi = WF_PHASES.findIndex((p) => p.id === x.ph), recs = prAt(x.id), lane = PR_LANES.find((l) => l.id === x.actor) || PR_LANES[1];
    const dec = x.kind === 'decision' || x.kind === 'review';
    return `<button type="button" class="js-st ${recs.length ? 'has' : ''} ${dec ? 'dec' : ''}" data-jstep="${x.id}" style="--h:${74 + i * 15}px;--c:${PH_C[pi]};--i:${i}" ${tipAttr(`<b>${x.n}. ${esc(x.t)}</b><br>${esc(wfActorName(x.actor))}${x.ref ? ` · البند ${x.ref}` : ''}<br>${x.docs.length ? 'المستندات: ' + x.docs.map((d) => esc(d.l)).join('، ') : 'بيانات الطلب من «شارك»'}<br>${recs.length ? `الآن: ${recs.length}` : 'لا سجلات الآن'}`)}>
      <span class="js-now">${recs.length ? `<b>${recs.length}</b>` : ''}</span>
      <span class="js-blk"><em>${x.n}</em><i class="js-ic">${icon(lane.ic)}</i>${dec ? `<span class="js-dec" title="${x.kind === 'decision' ? 'قرار' : 'اعتماد'}">${x.kind === 'decision' ? 'قرار' : 'اعتماد'}</span>` : ''}</span>
      <span class="js-t">${esc(x.t)}</span><span class="js-a">${esc(wfActorName(x.actor))}</span>
    </button>`;
  }).join('');
  const arcs = back.map(([from, to, label]) => { const a_ = WF_STEPS.findIndex((x) => x.id === from), b_ = WF_STEPS.findIndex((x) => x.id === to); return `<span class="js-arc" style="--a:${a_};--b:${b_}"><i></i><small>${esc(label)}</small></span>`; }).join('');
  el.innerHTML = `<section class="js-hero">
      <div class="js-hero-t"><span class="js-eye"><i></i>مسار الشراكة</span><h1>من فكرة إلى أثر</h1>
        <p>الإجراء المعتمد لشراكة جديدة كما هو مطبّق في المنظومة: ${plural(WF_STEPS.length, 'خطوة واحدة', 'خطوتان', 'خطوات', 'خطوة')} في ${plural(WF_PHASES.length, 'مرحلة واحدة', 'مرحلتين', 'مراحل', 'مرحلة')}، تنفّذها ${plural(PR_LANES.length, 'جهة واحدة', 'جهتان', 'جهات', 'جهة')}، وكل خطوة لها مستندها وصاحب قرارها.</p>
        <div class="js-acts no-print"><button class="btn gold" data-prprint type="button">${icon('print')} طباعة أو PDF</button>${can('export') ? `<button class="btn" data-prxls type="button">${icon('download')} المصفوفة Excel</button>` : ''}${Session.role() !== 'viewer' ? `<a class="btn" href="#/tasks">${icon('flag')} مهامي</a>` : ''}</div></div>
      <dl class="js-stats"><div><dt>خطوة</dt><dd>${WF_STEPS.length}</dd></div><div><dt>مراحل</dt><dd>${WF_PHASES.length}</dd></div><div><dt>جهات منفّذة</dt><dd>${PR_LANES.length}</dd></div><div class="g"><dt>في المسار الآن</dt><dd>${live}</dd></div><div><dt>مذكرات مفعّلة</dt><dd>${activated}</dd></div></dl>
    </section>
    <nav class="js-nav no-print" aria-label="أقسام الصفحة"><a href="#" data-jgo="jsClimb">${icon('chart')} صعود الشراكة</a><a href="#" data-jgo="prMapSec">${icon('layers')} مخطط الجهات</a><a href="#" data-jgo="prRaci">${icon('grid')} مصفوفة المسؤوليات</a><a href="#" data-jgo="prAcc">${icon('users')} الحسابات</a></nav>
    <section class="js-climb" id="jsClimb">
      <header class="js-sh"><div><h2>صعود الشراكة</h2><p>كل درجة خطوة، تعلو كلما اقتربت الشراكة من التوقيع والأثر. الرقم فوق الدرجة عدد السجلات الواقفة عندها الآن، والضغط يفتح تفاصيل الخطوة.</p></div>
        <div class="js-lg"><span><i class="d"></i>قرار أو اعتماد</span><span><i class="n"></i>سجلات الآن</span><span><i class="b"></i>إعادة بملاحظات</span></div></header>
      <div class="js-scroll"><div class="js-stage">
        <div class="js-arcs">${arcs}</div>
        <div class="js-stairs">${stair}
          <div class="js-goal" ${tipAttr('شراكات سارية اكتمل تفعيلها وتُتابع تقاريرها')}><span class="js-flag">${icon('flag')}</span><b>${activated}</b><small>أثر متحقق<br>مذكرات مفعّلة</small></div></div>
        <div class="js-phases">${WF_PHASES.map((ph, i) => { const n = WF_STEPS.filter((x) => x.ph === ph.id).length; const c = WF_STEPS.filter((x) => x.ph === ph.id).reduce((t, x) => t + prAt(x.id).length, 0); return `<div style="--n:${n};--c:${PH_C[i]}"><em>${pad(i + 1)}</em><b>${esc(ph.t)}</b>${c ? `<small>${c} الآن</small>` : ''}</div>`; }).join('')}<div class="js-ph-end"></div></div>
        <div class="js-branch" style="--a:2" title="إذا كانت الجهة غير مناسبة"><i></i><span>${icon('x')} غير مناسبة: إغلاق الطلب <b>${prP().filter((x) => x.status === 'rejected').length}</b></span></div>
      </div></div>
    </section>
    <section class="js-map-sec" id="prMapSec"><header class="js-sh"><div><h2>مخطط الجهات</h2><p>من يفعل ماذا: كل خطوة في مسار الجهة المسؤولة عنها، والأسهم تبيّن الانتقال والإعادة.</p></div></header>
    <div class="pr-legend"><span><i class="k start"></i>بداية</span><span><i class="k"></i>خطوة</span><span><i class="k decision"></i>قرار أو اعتماد</span><span><i class="k end"></i>نهاية</span><span><b class="pr-n-s">3</b>سجلات في هذه الخطوة الآن</span><span class="pr-hint">${icon('info')}اضغط أي خطوة لعرض مستنداتها وسجلاتها</span></div>
    <section class="pr-map-wrap" aria-label="مخطط مسار الشراكة">
      <div class="pr-map" id="prMap" style="--nc:${NC};--nl:${PR_LANES.length}">
        <div class="pr-corner"></div>
        ${PR_PHASES.map((ph, i) => `<div class="pr-phase" style="grid-column:${ph.from + 2} / ${ph.to + 3};grid-row:1"><em>${pad(i + 1)}</em>${ph.t}</div>`).join('')}
        ${PR_LANES.map((l, i) => `<div class="pr-lane-h l-${l.id}" style="grid-row:${i + 2}">${icon(l.ic)}<span><b>${l.t}</b><small>${l.s}</small></span></div><div class="pr-lane-bg l-${l.id}" style="grid-row:${i + 2};grid-column:2 / ${NC + 2}"></div>`).join('')}
        ${PR_STEPS.map((s) => { const n = cnt(s); return `<button type="button" class="pr-node ${s.kind || ''} l-${s.lane}" data-step="${s.id}" style="grid-column:${s.col + 2};grid-row:${laneOf(s.lane) + 2}">
          ${s.wf ? `<span class="pr-num">${s.wf.n}</span>` : ''}<span class="pr-t">${s.kind === 'start' ? icon('play') : s.kind === 'end' ? icon('flag') : ''}${esc(s.t)}</span><span class="pr-st">${esc(s.st)}</span>${n ? `<b class="pr-n" title="سجلات في هذه الخطوة الآن">${n}</b>` : ''}</button>`; }).join('')}
        <svg class="pr-edges" aria-hidden="true"><defs><marker id="prArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs></svg>
      </div>
    </section>
    <div class="pr-side-notes"><div>${icon('alert')}<span><b>المستندات شرط للانتقال:</b> لا تكتمل الخطوة حتى يُرفع مستندها المطلوب، ويمكن تنزيل النموذج الفارغ من داخل الخطوة.</span></div>
      <div>${icon('history')}<span><b>كل إجراء مسجّل:</b> الإتمام والاعتماد والإعادة بملاحظات تُسجل باسم الحساب ووقته في سجل التغييرات وسجل الشراكة.</span></div></div>
    </section>

    <section class="panel pr-raci pr-heat" id="prRaci">
      <div class="panel-h"><h3>مصفوفة المسؤوليات</h3><span class="sub">مستخرجة من الصلاحيات المطبقة في المسار. تُعدّل جهات الاعتماد من <a href="#/settings/roles">الحسابات والصلاحيات</a>.</span></div>
      <div class="panel-b"><div class="pr-raci-lg">${Object.entries(RACI).map(([k, v]) => `<span><i class="rc ${v.c}">${k}</i>${v.t}</span>`).join('')}</div>
        <div class="tbl-wrap"><table class="tbl pr-mx"><thead><tr><th>الخطوة</th>${PR_ROLES.map((r) => `<th>${esc(r.t)}<small>${esc(['strategy', 'legal', 'excellency', 'bizdev'].includes(r.k) ? wfDept(r.k) : '')}</small></th>`).join('')}<th>المستند المطلوب</th></tr></thead><tbody>
        ${PR_PHASES.map((ph, pi) => `<tr class="pr-mx-ph"><td colspan="${PR_ROLES.length + 2}"><em>${pad(pi + 1)}</em>${ph.t}</td></tr>` + WF_STEPS.filter((s) => s.n - 1 >= ph.from && s.n - 1 <= ph.to).map((s) => `<tr><th><button class="linkbtn" type="button" data-step="${s.id}">${s.n}. ${esc(s.t)}</button>${s.ref ? `<small>البند ${s.ref} في إجراء المذكرات</small>` : ''}</th>
          ${PR_ROLES.map((r) => { const v = (M[s.id] || {})[r.k] || ''; return `<td><span class="rc ${v ? RACI[v].c : 'none'}" title="${v ? RACI[v].t : 'لا دور'}">${v || '·'}</span></td>`; }).join('')}
          <td class="pr-perm">${s.docs.length ? s.docs.map((d) => `<span class="chip ${d.req ? '' : 'plain'}">${esc(d.l)}</span>`).join('') : '<span class="faint">—</span>'}</td></tr>`).join('')).join('')}
        </tbody></table></div></div></section>

    <div class="pr-cols" id="prAcc">
      <section class="panel"><div class="panel-h"><h3>الحسابات ومهامها في المسار</h3><span class="sub">حساب لكل إدارة</span></div>
        <div class="panel-b pr-accts">${accts.filter((a) => a.role !== 'team').map((a) => { const mine = a.role === 'dept' ? WF_STEPS.filter((s) => (a.duties || []).includes(s.actor)) : a.role === 'admin' ? WF_STEPS.filter((s) => s.actor === 'partnerships') : []; return `<div class="pr-acct ${a.duties && a.duties.length ? 'prop' : ''}">
          <div class="pr-acct-h"><b>${esc(a.t)}</b><span class="chip">${esc(ROLES[a.role].label)}</span></div>
          <p>${a.role === 'viewer' ? 'اطلاع على لوحة الأداء والتقارير.' : mine.length ? `${a.role === 'admin' ? 'خطوات إدارة الشراكات، والتنفيذ نيابة عن أي جهة' : 'يعتمد أو ينفّذ'}: ${mine.map((s) => `${s.n}. ${esc(s.t)}`).join('، ')}.` : ''}${a.role === 'dept' ? ' وعند طلب شراكة أو التقاطع معها: الاجتماع التعريفي، والملاحظات على المذكرة، وتقارير التفعيل.' : ''}</p></div>`; }).join('')}
          <div class="pr-acct"><div class="pr-acct-h"><b>فريق إدارة الشراكات</b><span class="chip">${esc(ROLES.team.label)}</span></div><p>حساب لكل عضو (${L('team').map(esc).join('، ')}): ينفّذ خطوات إدارة الشراكات ويتابع الإدارات.</p></div></div></section>
      <section class="panel"><div class="panel-h"><h3>المسار الآن</h3><span class="sub">عدد السجلات في كل مرحلة</span></div>
        <div class="panel-b"><ul class="pr-gaps pr-now">${PR_PHASES.map((ph, i) => { const ids = WF_STEPS.filter((s) => s.n - 1 >= ph.from && s.n - 1 <= ph.to); const n = ids.reduce((t, s) => t + prAt(s.id).length, 0); return `<li>${icon('layers')}<span><b>${pad(i + 1)} ${esc(ph.t)}:</b> ${n ? plural(n, 'سجل واحد', 'سجلان', 'سجلات', 'سجلًا') : 'لا سجلات'}</span></li>`; }).join('')}</ul></div></section>
    </div>`;
  bindTips(el);
  // تقاطع الصف والعمود في المصفوفة
  const mx = $('.pr-mx', el);
  if (mx) { mx.addEventListener('mouseover', (e) => { const td = e.target.closest('td,th'); $$('.pr-mx .hx', el).forEach((x) => x.classList.remove('hx')); if (!td || !td.closest('tbody')) return; const tr = td.parentElement, i = [...tr.children].indexOf(td); tr.classList.add('hx'); if (i > 0 && i <= PR_ROLES.length) $$(`.pr-mx tr > :nth-child(${i + 1})`, el).forEach((c) => c.classList.add('hx')); }); mx.addEventListener('mouseleave', () => $$('.pr-mx .hx', el).forEach((x) => x.classList.remove('hx'))); }
  drawPrEdges(el);
  const ro = new ResizeObserver(() => drawPrEdges(el)); ro.observe($('#prMap', el));
  el.onclick = (e) => {
    const js = e.target.closest('[data-jstep]'); if (js) return prStepPanel(js.dataset.jstep);
    const jg = e.target.closest('[data-jgo]'); if (jg) { e.preventDefault(); const t = $('#' + jg.dataset.jgo, el); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' }); return; }
    const st = e.target.closest('[data-step]'); if (st) return prStepPanel(st.dataset.step);
    if (e.target.closest('[data-prprint]')) return window.print();
    if (e.target.closest('[data-prxls]')) return prExportXlsx();
  };
}

/* أسهم المخطط تُرسم من مواقع الخطوات الفعلية على الشاشة */
function drawPrEdges(el) {
  const map = $('#prMap', el), svg = map && $('.pr-edges', map); if (!svg) return;
  const R = map.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`); svg.setAttribute('width', R.width); svg.setAttribute('height', R.height);
  const box = (id) => { const n = $(`.pr-node[data-step="${id}"]`, map); if (!n) return null; const b = n.getBoundingClientRect(); return { l: b.left - R.left, r: b.right - R.left, t: b.top - R.top, b: b.bottom - R.top, cx: (b.left + b.right) / 2 - R.left, cy: (b.top + b.bottom) / 2 - R.top }; };
  let out = svg.querySelector('defs').outerHTML;
  PR_EDGES.forEach(([a, b, label, kind]) => {
    const A = box(a), B = box(b); if (!A || !B) return;
    let d, lx, ly;
    if (kind === 'back') {
      const y = Math.min(A.t, B.t) - 22;
      d = `M${A.cx} ${A.t}C${A.cx} ${y} ${B.cx} ${y} ${B.cx} ${B.t}`; lx = (A.cx + B.cx) / 2; ly = y + 2;
    } else if (kind === 'long') {
      const y = Math.max(A.b, B.b) + 18; d = `M${A.cx} ${A.b}C${A.cx} ${y + 30} ${B.cx} ${y + 30} ${B.cx} ${B.b}`; lx = (A.cx + B.cx) / 2; ly = y + 22;
    } else if (Math.abs(A.cx - B.cx) < 30) {
      const down = B.cy > A.cy; const y0 = down ? A.b : A.t, y1 = down ? B.t : B.b;
      d = `M${A.cx} ${y0}L${B.cx} ${y1}`; lx = A.cx + 6; ly = (y0 + y1) / 2;
    } else {
      const x0 = A.l, x1 = B.r, mx = (x0 + x1) / 2;
      d = `M${x0} ${A.cy}C${mx} ${A.cy} ${mx} ${B.cy} ${x1} ${B.cy}`; lx = mx; ly = (A.cy + B.cy) / 2;
    }
    out += `<path d="${d}" class="pr-e ${kind || ''}" marker-end="url(#prArr)"/>`;
    if (label) out += `<text x="${lx.toFixed(1)}" y="${(ly - 5).toFixed(1)}" text-anchor="middle" class="pr-el">${esc(label)}</text>`;
  });
  svg.innerHTML = out;
}

/* لوحة تفاصيل الخطوة */
function prStepPanel(id) {
  const s = PR_STEPS.find((x) => x.id === id); if (!s) return;
  const w0 = s.wf;
  const lane = PR_LANES.find((l) => l.id === s.lane);
  const phase = PR_PHASES.find((p) => s.col >= p.from && s.col <= p.to);
  const M = prRaci();
  const roles = w0 ? PR_ROLES.map((r) => [r, (M[id] || {})[r.k]]).filter(([, v]) => v) : [];
  const nxt = PR_EDGES.filter((e) => e[0] === id).map((e) => [PR_STEPS.find((x) => x.id === e[1]), e[2]]);
  const prv = PR_EDGES.filter((e) => e[1] === id).map((e) => [PR_STEPS.find((x) => x.id === e[0]), e[2]]);
  const recs = w0 ? prAt(id) : [];
  const accts = w0 ? wfAccounts().filter((a) => (a.role === 'team' || a.role === 'admin') ? w0.actor === 'partnerships' : a.role === 'dept' && (a.duties || []).includes(w0.actor)).map((a) => a.t) : [];
  $('#prDrawer') && $('#prDrawer').remove();
  const w = document.createElement('div'); w.id = 'prDrawer'; w.className = 'dz2-drawer';
  w.innerHTML = `<div class="dz2-dr-bg" data-drx></div><aside class="dz2-dr pr-dr" role="dialog" aria-label="${esc(s.t)}"><header><div><small class="pr-dr-ph">${phase ? esc(phase.t) : ''}${w0 && w0.ref ? ` · البند ${w0.ref}` : ''}</small><h3>${w0 ? w0.n + '. ' : ''}${esc(s.t)}</h3><p>${icon(lane.ic)} ${esc(w0 ? wfActorName(w0.actor) : lane.t)}</p></div><button class="icon-btn" data-drx aria-label="إغلاق">${icon('x')}</button></header>
    <div class="dz2-dr-list pr-dr-b">
      <p class="pr-dr-d">${esc(w0 ? w0.d : s.st)}</p>
      ${w0 ? `<dl class="kv"><div><dt>المستندات</dt><dd>${w0.docs.length ? w0.docs.map((d) => `<span class="chip">${esc(d.l)}</span>${d.req ? '' : ' <small class="faint">اختياري</small>'}`).join('<br>') : '<span class="faint">بيانات الطلب من «شارك»</span>'}</dd></div><div><dt>الحسابات المنفّذة</dt><dd>${accts.length ? accts.map(esc).join('، ') : w0.actor === 'requester' ? 'حساب الإدارة الطالبة' : w0.actor === 'concerned' ? 'حسابات الإدارات المعنية بالشراكة' : '—'}</dd></div></dl>` : ''}
      ${roles.length ? `<h4 class="m-h4">الأدوار في هذه الخطوة</h4><div class="pr-dr-roles">${roles.map(([r, v]) => `<span><i class="rc ${RACI[v].c}">${v}</i>${esc(r.t)} — ${RACI[v].t}</span>`).join('')}</div>` : ''}
      <h4 class="m-h4">قبلها وبعدها</h4><div class="pr-dr-nav">${prv.map(([x, l]) => `<button type="button" class="pr-dr-step" data-gostep="${x.id}">${icon('chevR')}${esc(x.t)}${l ? `<small>${esc(l)}</small>` : ''}</button>`).join('')}${nxt.map(([x, l]) => `<button type="button" class="pr-dr-step nx" data-gostep="${x.id}">${esc(x.t)}${l ? `<small>${esc(l)}</small>` : ''}${icon('chevL')}</button>`).join('')}</div>
      ${w0 ? `<h4 class="m-h4">السجلات في هذه الخطوة الآن <small class="faint">${recs.length}</small></h4>${recs.length ? recs.slice(0, 12).map((r) => `<a class="dz2-dr-it" href="${r.h}"><span class="grow"><b>${esc(r.t)}</b><small>${esc(r.s)}</small></span>${icon('chevL')}</a>`).join('') : '<div class="empty-chart">لا توجد سجلات في هذه الخطوة حاليًا.</div>'}` : ''}
    </div>
    <footer>${s.href ? `<a class="btn primary" href="${s.href}">${icon('layers')} فتح في المنصة</a>` : ''}<button class="btn ghost" data-drx type="button">إغلاق</button></footer></aside>`;
  document.body.appendChild(w);
  requestAnimationFrame(() => w.classList.add('on'));
  const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 260); document.removeEventListener('keydown', k); };
  const k = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', k);
  w.addEventListener('click', (e) => { const g = e.target.closest('[data-gostep]'); if (g) { close(); setTimeout(() => prStepPanel(g.dataset.gostep), 270); return; } if (e.target.closest('[data-drx]')) close(); if (e.target.closest('a')) setTimeout(close, 0); });
}

function prExportXlsx() {
  const M = prRaci();
  const headers = ['المرحلة', 'رقم الخطوة', 'الخطوة', 'البند في إجراء المذكرات', 'الجهة المنفّذة', ...PR_ROLES.map((r) => r.t), 'المستندات المطلوبة', 'الوصف'];
  const rows = WF_STEPS.map((s) => [WF_PHASES.find((p) => p.id === s.ph).t, s.n, s.t, s.ref || '', wfActorName(s.actor), ...PR_ROLES.map((r) => { const v = (M[s.id] || {})[r.k]; return v ? RACI[v].t : ''; }), s.docs.map((d) => d.l + (d.req ? '' : ' (اختياري)')).join('، '), s.d]);
  const blob = buildXlsx({ sheetName: 'مسار الشراكة', title: 'مسار الشراكة الجديدة — الخطوات والمسؤوليات', headers, rows, widths: [20, 8, 36, 12, 24, ...PR_ROLES.map(() => 14), 44, 60], note: `صُدّر من ${D.settings.org.platform} في ${fmtDT(nowISO())}. ينفّذ: يقوم بالخطوة، يعتمد: صاحب القرار، يُستشار: يُؤخذ رأيه، يطّلع: يُبلَّغ بالنتيجة.` });
  download(`مسار-الشراكة-${isoDate(today())}.xlsx`, blob);
  toast('صُدّرت مصفوفة المسؤوليات إلى Excel');
}

/* اتجاه الصفحة عند الطباعة: أفقي للوحة المجلس ومسار الشراكة وصفحات الجداول (السجل، المقترحات، الجهات، المهام) */
window.addEventListener('beforeprint', () => {
  const r = App.route && App.route.name;
  if (!(['process', 'partnerships', 'proposals', 'partners', 'tasks'].includes(r) || (r === 'dashboard' && (design() === 'board' || App.dashView !== 'alt')))) return;
  if (document.documentElement.classList.contains('printing-sheet') || document.documentElement.classList.contains('printing-report')) return;
  let st = $('#landPage'); if (!st) { st = document.createElement('style'); st.id = 'landPage'; document.head.appendChild(st); }
  st.textContent = '@page{size:A4 landscape;margin:12mm}';
});
window.addEventListener('afterprint', () => { const st = $('#landPage'); if (st) st.textContent = ''; });
