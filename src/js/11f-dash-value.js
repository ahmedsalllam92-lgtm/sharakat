/* =====================================================================
   لوحة المؤشرات: القيمة والأداء + سير الإجراءات (مشتركة بين الاتجاهين)
   ===================================================================== */

/* — أين تقف كل مذكرة الآن: من الطلب إلى التفعيل — */
function wfPipeline(list) {
  const items = [];
  const ids = new Set(list.map((p) => p.id));
  const now = today();
  const ago = (iso) => { if (!iso) return null; const d = typeof iso === 'string' ? parseDate(iso.slice(0, 10)) : new Date(iso); if (!d || isNaN(d)) return null; d.setHours(0, 0, 0, 0); return Math.max(0, daysBetween(d, now)); };
  visibleProposals().filter((x) => ['submitted', 'review', 'info', 'accepted'].includes(x.status) && (showDemo() || !x.demo)).forEach((x) => {
    const st = wfStateOf('proposal', x);
    const s = x.status === 'accepted' ? wfStep('meeting') : st.cur; if (!s) return;
    const prev = Object.values(st.S).map((r) => r && typeof r.at === 'string' && /^\d{4}-/.test(r.at) ? r.at : null).filter(Boolean).sort().pop();
    items.push({ rec: x, kind: 'proposal', name: x.partnerName || x.ref, sub: x.ref, step: s, actor: x.status === 'accepted' ? 'إدارة الشراكات (التحويل إلى شراكة)' : wfActorName(s.actor), days: ago(prev || x.submittedAt || x.createdAt), href: '#/proposals/' + x.id, info: x.status === 'info', demo: x.demo });
  });
  let activating = 0;
  list.filter((p) => ids.has(p.id) && !p.isDraft && !['cancel', 'hold'].includes(p.stage)).forEach((p) => {
    const st = wfStateOf('partnership', p); const s = st.cur; if (!s) return;
    if (s.ongoing) { activating++; return; }
    const prev = Object.values(st.S).map((r) => r && typeof r.at === 'string' && /^\d{4}-/.test(r.at) ? r.at : null).filter(Boolean).sort().pop();
    const r = st.S[s.id] || {};
    items.push({ rec: p, kind: 'partnership', name: partnerName(p), sub: p.code || '', step: s, actor: wfActorName(s.actor), days: ago(prev || p.updatedAt), href: '#/partnerships/' + p.id + '?wf=1', returned: r.status === 'returned', demo: p.demo });
  });
  const phases = WF_PHASES.map((ph) => ({ ph, items: items.filter((i) => i.step.ph === ph.id).sort((a, b) => (b.days || 0) - (a.days || 0)) }));
  const late = items.filter((i) => (i.days || 0) > (D.settings.infoAgeDays || 7) * 2);
  const byActor = {}; items.forEach((i) => { byActor[i.actor] = (byActor[i.actor] || 0) + 1; });
  const top = Object.entries(byActor).sort((a, b) => b[1] - a[1])[0];
  return { items, phases, activating, late, top };
}
function pipelineHTML(P, { max = 4 } = {}) {
  const lim = (D.settings.infoAgeDays || 7) * 2;
  return `<div class="pl" role="list">${P.phases.map(({ ph, items }, i) => `<div class="pl-col ${items.length ? '' : 'empty'}" role="listitem">
      <header><em>${pad(i + 1)}</em><span>${esc(ph.t)}</span><b>${items.length}</b></header>
      <div class="pl-items">${items.slice(0, max).map((x) => `<a class="pl-it ${x.returned ? 'ret' : ''} ${(x.days || 0) > lim ? 'late' : ''}" href="${x.href}">
        <b>${esc(x.name)}${x.demo ? ' <span class="demo-tag">تجريبي</span>' : ''}</b>
        <span class="pl-step"><i>${x.step.n}</i>${esc(x.step.t)}</span>
        <small>${icon('users')}${esc(x.actor)}${x.days !== null ? ` · ${x.days ? `منذ ${plural(x.days, 'يوم', 'يومين', 'أيام', 'يومًا')}` : 'اليوم'}` : ''}${x.returned ? ' · مُعادة' : x.info ? ' · بانتظار الاستكمال' : ''}</small></a>`).join('') || '<p class="pl-none">لا توجد مذكرات في هذه المرحلة</p>'}
        ${items.length > max ? `<a class="pl-more" href="#/tasks">+ ${items.length - max} أخرى</a>` : ''}</div></div>`).join('')}
    <div class="pl-col act" role="listitem"><header><em>∞</em><span>تفعيل وتقارير دورية</span><b>${P.activating}</b></header><p class="pl-none">شراكات موقّعة تُرفع عنها تقارير التفعيل من الإدارات بشكل مستمر.</p></div>
  </div>`;
}

/* — بيانات القيمة والتقييم — */
function valueData(nd) {
  const live = nd.filter((p) => p.stage === 'signed');
  const ev = live.map((p) => ({ p, e: lastEval(p) })).filter((x) => x.e && x.e.score !== null);
  const avg = ev.length ? Math.round(ev.reduce((t, x) => t + x.e.score, 0) / ev.length) : null;
  const by = (f, opts) => { const m = {}; nd.forEach((p) => { const k = f(p) || 'غير محدد'; m[k] = (m[k] || 0) + 1; }); return [...opts, 'غير محدد'].filter((k) => m[k]).map((k) => ({ k, n: m[k] })).concat(Object.keys(m).filter((k) => ![...opts, 'غير محدد'].includes(k)).map((k) => ({ k, n: m[k] }))); };
  const F = nd.map((p) => p.finance || {});
  const sum = (k) => F.reduce((t, f) => t + (+f[k] || 0), 0);
  const fin = { partner: sum('partnerSar'), muroj: sum('murojSar'), inkind: sum('inkindSar'), spent: sum('spentSar') };
  fin.total = fin.partner + fin.muroj + fin.inkind;
  fin.cash = fin.partner + fin.muroj;
  return {
    live, ev, avg,
    types: by((p) => p.ptype, L('partnerTypes')),
    doms: by((p) => (partnerById(p.partnerId) || {}).domain, L('domains')).sort((a, b) => (a.k === 'غير محدد') - (b.k === 'غير محدد') || b.n - a.n),
    orig: by((p) => p.origin, L('originTypes')),
    fst: by((p) => (p.finance || {}).status, L('financeStatus')),
    vals: (() => { const m = {}; nd.forEach((p) => (p.valueTypes || []).forEach((v) => { m[v] = (m[v] || 0) + 1; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); })(),
    fin,
    notEval: live.filter((p) => !ev.some((x) => x.p === p) && ['active', 'soon'].includes(pStatus(p))),
  };
}
const sarShort = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')} مليون` : n >= 1e3 ? `${nf(Math.round(n / 1e3))} ألف` : nf(n));

/* — القسم في الاتجاه المؤسسي — */
function dzValueHTML(nd, sel) {
  const V = valueData(nd);
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const tsum = V.types.reduce((t, x) => t + x.n, 0) || 1;
  const tcol = (k) => (k.includes('استراتيجي') ? 'var(--petrol)' : k === 'غير محدد' ? 'var(--line-2)' : 'var(--gold)');
  const dmax = Math.max(1, ...V.doms.map((d) => d.n));
  const R = 46, C = 2 * Math.PI * R;
  const grades = ['ممتاز', 'جيد جدًا', 'جيد', 'يحتاج تحسين'].map((g) => ({ g, n: V.ev.filter((x) => evalGrade(x.e.score) === g).length }));
  const P = wfPipeline(nd);
  const f = V.fin;
  return `<div class="dz3-deep dv">
    <section class="dz3-dc c4 dv-type"><header><h3>تصنيف الشراكات</h3><p>شريك استراتيجي أم شريك خدمات. اضغط للتصفية</p></header>
      <div class="dv-split">${V.types.map((t) => `<button type="button" class="${sel('ptype', t.k) ? 'sel' : ''}" ${t.k === 'غير محدد' ? 'disabled' : `data-cf="ptype|${esc(t.k)}"`} style="flex:${t.n};background:${tcol(t.k)}" title="${esc(t.k)}: ${t.n}"></button>`).join('')}</div>
      <ul class="dv-lg">${V.types.map((t) => `<li><i style="background:${tcol(t.k)}"></i><span>${esc(t.k)}</span><b>${t.n}</b><em>${pct(t.n, tsum)}%</em></li>`).join('')}</ul>
      <h4 class="dv-h4">من فتح الباب</h4>
      <ul class="dv-lg sm">${V.orig.map((o) => `<li><i class="${o.k === 'غير محدد' ? 'u' : 'o'}"></i><span>${esc(o.k)}</span><b>${o.n}</b></li>`).join('')}</ul>
    </section>
    <section class="dz3-dc c4 dv-dom"><header><h3>مجالات عمل الجهات</h3><p>القطاع الذي ينتمي إليه الشريك</p></header>
      <div class="dzb">${V.doms.map((d) => `<button type="button" class="dzb-r ${sel('domain', d.k) ? 'sel' : ''}" ${d.k === 'غير محدد' ? 'disabled' : `data-cf="domain|${esc(d.k)}"`}><span>${esc(d.k)}</span><span class="dzb-t"><i style="width:${(d.n / dmax * 100).toFixed(0)}%" class="${d.k === 'غير محدد' ? 'u' : ''}"></i></span><b>${d.n}</b></button>`).join('')}</div>
    </section>
    <section class="dz3-dc c4 dv-ev"><header><h3>تقييم الشراكات</h3><p>آخر تقييم مكتمل بنموذج تقييم الشراكة</p></header>
      ${V.avg !== null ? `<div class="dv-evtop"><svg viewBox="0 0 110 110" class="dv-ring ${evalTone(V.avg)}" aria-hidden="true"><circle cx="55" cy="55" r="${R}" class="bg"/><circle cx="55" cy="55" r="${R}" class="v" stroke-dasharray="${(V.avg / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 55 55)"/><text x="55" y="62" text-anchor="middle">${V.avg}</text></svg>
        <div><b>${evalGrade(V.avg)}</b><span>متوسط ${plural(V.ev.length, 'شراكة مقيّمة', 'شراكتين مقيّمتين', 'شراكات مقيّمة', 'شراكة مقيّمة')} من ${V.live.length} موقّعة</span></div></div>
        <ul class="dv-grades">${grades.map((g) => `<li><span>${g.g}</span><i><em style="width:${V.ev.length ? g.n / V.ev.length * 100 : 0}%" class="${g.g === 'يحتاج تحسين' ? 'r' : g.g === 'جيد' ? 'w' : ''}"></em></i><b>${g.n}</b></li>`).join('')}</ul>
        <div class="dv-evl">${V.ev.sort((a, b) => b.e.score - a.e.score).slice(0, 4).map(({ p, e }) => `<a href="#/partnerships/${p.id}#profile"><span>${esc(partnerName(p))}</span><b class="${evalTone(e.score)}">${e.score}</b></a>`).join('')}</div>`
        : '<p class="dv-empty">لم تُقيَّم أي شراكة بعد. يُعبَّأ نموذج التقييم من صفحة كل شراكة.</p>'}
      ${V.notEval.length ? `<p class="dv-warn">${icon('alert')} ${plural(V.notEval.length, 'شراكة سارية بلا تقييم', 'شراكتان ساريتان بلا تقييم', 'شراكات سارية بلا تقييم', 'شراكة سارية بلا تقييم')}</p>` : ''}
    </section>
    <section class="dz3-dc c6 dv-fin"><header><h3>القيمة والوضع المالي</h3><p>من بطاقة التصنيف والقيمة في كل شراكة</p></header>
      <div class="dv-fin-top"><div><span>القيمة الإجمالية التقديرية</span><b>${f.total ? sarShort(f.total) : '—'}</b><small>ريال سعودي</small></div>
        <div class="dv-stack" role="img" aria-label="مكونات القيمة">${[['partner', 'مساهمة الشركاء', 'var(--petrol)'], ['muroj', 'مساهمة المؤسسة', 'var(--gold)'], ['inkind', 'قيمة عينية ومعرفية', 'var(--petrol-3)']].map(([k, l, c]) => `<i style="flex:${f[k] || 0};background:${c}" title="${l}: ${sar(f[k])}"></i>`).join('')}</div>
        <ul class="dv-lg sm">${[['partner', 'مساهمة الشركاء', 'var(--petrol)'], ['muroj', 'مساهمة المؤسسة', 'var(--gold)'], ['inkind', 'قيمة عينية ومعرفية', 'var(--petrol-3)']].map(([k, l, c]) => `<li><i style="background:${c}"></i><span>${l}</span><b>${f[k] ? sarShort(f[k]) : '—'}</b></li>`).join('')}</ul></div>
      <div class="dv-spend"><div><span>المصروف من الالتزامات المالية</span><b>${pct(f.spent, f.cash)}%</b></div><i><em style="width:${Math.min(100, pct(f.spent, f.cash))}%"></em></i><small>${sar(f.spent)} من ${sar(f.cash)}</small></div>
      <div class="dv-chips">${V.fst.map((s) => `<span class="dv-chip ${s.k === 'متأخر' ? 'r' : s.k === 'مكتمل' ? 'g' : s.k === 'غير محدد' ? 'u' : ''}">${esc(s.k)} <b>${s.n}</b></span>`).join('')}</div>
    </section>
    <section class="dz3-dc c6 dv-vt"><header><h3>نوع القيمة المضافة</h3><p>ما تضيفه الشراكات للمؤسسة</p></header>
      ${V.vals.length ? `<div class="dv-vals">${V.vals.map(([k, n]) => `<div><b>${n}</b><span>${esc(k)}</span></div>`).join('')}</div>` : '<p class="dv-empty">لم يُحدَّد نوع القيمة لأي شراكة بعد.</p>'}
    </section>
    <section class="dz3-dc c12 dv-pipe"><header><div><h3>أين تقف المذكرات الآن</h3><p>${P.items.length ? `${plural(P.items.length, 'طلب أو مذكرة', 'طلبان أو مذكرتان', 'طلبات ومذكرات', 'طلبًا ومذكرة')} في المسار المعتمد${P.top ? `، وأكثرها لدى «${esc(P.top[0])}» (${P.top[1]})` : ''}${P.late.length ? `، و${plural(P.late.length, 'واحدة متأخرة', 'اثنتان متأخرتان', 'متأخرة', 'متأخرة')} أكثر من ${(D.settings.infoAgeDays || 7) * 2} يومًا` : ''}` : 'لا توجد طلبات أو مذكرات قيد الإجراء'}</p></div><a class="linkbtn" href="#/process">${icon('layers')} مخطط المسار</a></header>
      ${pipelineHTML(P)}</section>
  </div>`;
}
