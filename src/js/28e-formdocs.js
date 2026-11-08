/* =====================================================================
   مستندات مصممة لنماذج المسار: منهجية بناء الشراكات، والتقييم المبدئي، والمواءمة الاستراتيجية
   بنفس هوية بطاقة تقييم الشراكة. العناوين والبنود والخيارات تُقرأ من تعريف كل نموذج (FORMS)،
   فأي تعديل على التعريف يظهر في المستند تلقائيًا.
   ===================================================================== */
const FD_TONE = { ex: 'ex', vg: 'vg', gd: 'gd', lo: 'lo', na: 'na' };
function fdField(F, R, rec, k) { for (const s of F.sections(R, rec)) { const f = s.fields.find((x) => x.k === k); if (f) return f; } return null; }
const fdOpts = (f) => (!f ? [] : typeof f.opts === 'function' ? f.opts() : f.opts || []);
const fdQ = (t, empty) => `<blockquote class="ev-q">${t ? esc(t).replace(/\n/g, '<br>') : `<span class="fx-empty">${esc(empty || 'لم يُكتب.')}</span>`}</blockquote>`;
const fdChoice = (opts, cur, icons) => `<div class="fx-choice">${opts.map((o) => `<span class="${o === cur ? 'on' : ''}">${icons && icons[o] ? icon(icons[o]) : ''}${esc(o)}</span>`).join('')}</div>`;
const fdTags = (opts, cur) => `<div class="fx-tags">${opts.map((o) => `<span class="${(Array.isArray(cur) ? cur.includes(o) : o === cur) ? 'on' : ''}">${esc(o)}</span>`).join('')}</div>`;
/* الإطار المشترك: الترويسة، الشريط الملون، البطاقات السريعة، التواقيع */
function fdShell({ kind, rec, key, tone, ring, facts, kpis, body, st }) {
  const F = FORMS[key], R = fRecInfo(kind, rec);
  const pr = (kind === 'partnership' && partnerById(rec.partnerId)) || { name: R.name, sector: rec.partnerSector || '' };
  const logo = (ASSET_IMG['murooj-logo'] || {}).src;
  const C = 2 * Math.PI * 52, dash = Math.max(0, Math.min(1, ring.pct || 0)) * C;
  const ref = kind === 'partnership' ? rec.code : rec.ref;
  return `<article class="fdoc evdoc fxdoc ev-${tone}" dir="rtl">
    <header class="ev-top"><div class="ev-brand">${logo ? `<img src="${logo}" alt="">` : ''}<div><b>${esc(D.settings.org.name)}</b><span>${esc(D.settings.org.dept)}</span></div></div>
      <div class="ev-meta"><div><span>رقم النموذج</span><b dir="ltr">${esc((st && st.no) || '—')}</b></div><div><span>تاريخ الإصدار</span><b>${st && st.at ? fmtDate(st.at.slice(0, 10)) + 'م' : '—'}</b></div></div></header>
    <section class="ev-hero">
      <div class="ev-id"><span class="ev-eye">${esc(F.title)}${F.step && wfStep(F.step) ? ` · المرحلة ${wfStep(F.step).n}: ${esc(wfStep(F.step).t)}` : ''}</span>
        <div class="ev-pn"><span class="ev-logo">${logoOrMono(pr, R.name)}</span><div><h1>${esc(R.name || '—')}</h1><p>${[ref, R.sector, kind === 'proposal' ? rec.department : ''].filter(Boolean).map(esc).join(' · ')}</p></div></div>
        <dl class="ev-facts">${facts.map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${v}</dd></div>`).join('')}</dl></div>
      <div class="ev-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="t"/><circle cx="60" cy="60" r="52" class="v" stroke-dasharray="${dash.toFixed(1)} ${C.toFixed(1)}"/></svg>
        <div class="ev-rv"><b>${ring.big}${ring.small ? `<small>${ring.small}</small>` : ''}</b><span>${esc(ring.label)}</span></div></div>
    </section>
    <section class="ev-kpis">${kpis.map(([l, v, cls]) => `<div class="${cls || ''}"><span>${esc(l)}</span><b>${v}</b></div>`).join('')}</section>
    ${body}
    <section class="ev-sigs"><div><span>أعدّه</span><b>${esc((st && st.by) || '')}</b><small>${esc((st && st.byDept) || '')}</small></div><div><span>الاعتماد</span><b>${st && st.status === 'done' ? 'معتمد إلكترونيًا في المنظومة' : 'مسودة — لم يُعتمد'}</b><small>${st && st.at ? fmtDT(st.at) : ''}</small></div><div><span>التوقيع</span><b class="ln"></b></div></section>
    <footer class="fd-foot">${esc(D.settings.org.name)} · ${esc(D.settings.org.platform)} · ${esc(F.title)} ${esc((st && st.no) || '')}</footer></article>`;
}
const fdSec = (n, t, sub, inner, cls) => `<section class="ev-sec ${cls || ''}"><h3><em>${String(n).padStart(2, '0')}</em>${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</h3>${inner}</section>`;

/* — منهجية بناء الشراكات — */
function methodologyDocHTML(kind, rec) {
  const key = 'methodology', F = FORMS[key], R = fRecInfo(kind, rec), st = formOf(rec, key) || {}, d = st.data || {};
  const steps = F.sections(R, rec).flatMap((s) => s.fields).filter((f) => f.n);
  const filled = steps.filter((f) => String(d[f.k] || '').trim()), req = steps.filter((f) => f.req), reqOk = req.filter((f) => String(d[f.k] || '').trim());
  const pct = steps.length ? filled.length / steps.length : 0;
  const tone = !steps.length ? 'na' : reqOk.length < req.length ? 'lo' : filled.length === steps.length ? 'ex' : 'vg';
  const cards = steps.map((f) => { const v = String(d[f.k] || '').trim(); return `<div class="fx-step ${v ? 'ok' : ''}"><span class="fx-n">${f.n}</span><div><b>${esc(f.l)}${f.req ? '<i class="fx-req">إلزامي</i>' : ''}</b>${v ? `<p>${esc(v).replace(/\n/g, '<br>')}</p>` : `<p class="fx-empty">${f.hint ? esc(f.hint) : 'لم يُستكمل.'}</p>`}</div></div>`; }).join('');
  const body = fdSec(1, 'مراحل المنهجية', `${filled.length} من ${steps.length} بنود مكتملة`, `<div class="fx-prog">${steps.map((f) => `<i class="${String(d[f.k] || '').trim() ? 'on' : ''}" title="${esc(f.l)}"></i>`).join('')}</div><div class="fx-steps">${cards}</div>`);
  return fdShell({ kind, rec, key, tone, st,
    ring: { pct, big: filled.length, small: '/' + steps.length, label: tone === 'ex' ? 'مكتملة' : tone === 'lo' ? 'بنود إلزامية ناقصة' : 'قيد الاستكمال' },
    facts: [['الجهة الشريكة', esc(d.partner || R.name || '—')], ['نوع الجهة', esc(d.sector || '—')], ['الحالة', st.status === 'done' ? 'مكتمل ومعتمد' : 'مسودة']],
    kpis: [['البنود المكتملة', `${filled.length} من ${steps.length}`], ['البنود الإلزامية', `${reqOk.length} من ${req.length}`], ['القطاع', esc(d.sector || '—')], ['المرحلة التالية', esc((wfStep('eval') || {}).t || '—'), 'rec']],
    body });
}

/* — التقييم المبدئي للشريك — */
function initialEvalDocHTML(kind, rec) {
  const key = 'initialEval', F = FORMS[key], R = fRecInfo(kind, rec), st = formOf(rec, key) || {}, d = st.data || {};
  const fCrit = fdField(F, R, rec, 'crit') || { items: [], opts: [] }, crit = d.crit || {};
  const items = fCrit.items || [], ok = items.filter((_, i) => (crit[i] || {}).v === 'ok').length, no = items.filter((_, i) => (crit[i] || {}).v === 'no').length;
  const W = d.ievW && d.ievW.length === items.length ? d.ievW : (fCrit.weights || items.map(() => 0));
  const sc = d.ievScore !== undefined && d.ievScore !== null ? d.ievScore : ievScore(d), autoRes = ievResult(sc), th = ievCfg().th;
  const recOpts = fdOpts(fdField(F, R, rec, 'rec')), ri = recOpts.indexOf(d.rec);
  const tone = ri < 0 ? 'na' : ri === 0 ? 'ex' : ri === recOpts.length - 1 ? 'lo' : 'gd';
  const okLbl = (fCrit.opts || []).map(([k, l]) => [k, l]);
  const rows = items.map((it, i) => { const c = crit[i] || {}; return `<tr><td class="fx-ix">${i + 1}</td><td><b class="fx-it">${esc(it)}</b>${c.n || c.note ? `<small class="fx-nt">${esc(c.n || c.note)}</small>` : ''}</td><td class="fx-w"><span>${W[i] || 0}%</span></td><td class="fx-res"><span class="fx-badge ${c.v || 'na'}">${icon(c.v === 'ok' ? 'check' : c.v === 'no' ? 'x' : 'info')}${esc((okLbl.find(([k]) => k === c.v) || [])[1] || 'لم يُقيَّم')}</span></td></tr>`; }).join('');
  const body = `
    ${fdSec(1, 'بيانات الجهة وتصنيفها', '', `<div class="fx-grid2">
      <div><div class="ev-lbl">نوع الجهة (القطاع)</div>${fdTags(fdOpts(fdField(F, R, rec, 'sector')), d.sector)}</div>
      <div><div class="ev-lbl">تصنيف الشراكة</div>${fdTags(fdOpts(fdField(F, R, rec, 'ptype')), d.ptype)}</div>
      <div><div class="ev-lbl">كيف بدأت العلاقة</div>${fdTags(fdOpts(fdField(F, R, rec, 'origin')), d.origin)}</div>
      <div><div class="ev-lbl">من بدأ العلاقة أو فتح الباب</div><p class="fx-val">${esc(d.originBy || '—')}</p></div></div>`)}
    ${fdSec(2, 'معايير التقييم المبدئي', `${ok} مناسب · ${no} غير مناسب من ${items.length}`, `<div class="fx-meter"><i class="ok" style="width:${items.length ? ok / items.length * 100 : 0}%"></i><i class="no" style="width:${items.length ? no / items.length * 100 : 0}%"></i></div><table class="ev-tbl fx-tbl"><thead><tr><th>م</th><th>المعيار</th><th>الوزن</th><th>النتيجة</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td></td><td>الدرجة الموزونة (مجموع أوزان المعايير المناسبة)</td><td class="fx-w"><b>${sc === null ? '—' : sc + '%'}</b></td><td>${autoRes ? `<span class="fx-badge ${sc < th[0] ? 'no' : sc <= th[1] ? 'mid' : 'ok'}">${esc(autoRes)}</span>` : ''}</td></tr></tfoot></table><p class="fx-thr">أقل من ${th[0]}%: ${esc(IEV_RES[2])} · من ${th[0]}% إلى ${th[1]}%: ${esc(IEV_RES[1])} · أكثر من ${th[1]}%: ${esc(IEV_RES[0])}</p>`)}
    <div class="ev-two">
      ${fdSec(3, 'القيمة والأثر المتوقعان', '', `<div class="ev-lbl">نوع القيمة المتوقعة</div>${fdTags(fdOpts(fdField(F, R, rec, 'valueTypes')), d.valueTypes || [])}<div class="ev-lbl">الأثر المتوقع</div>${fdQ(d.impact, 'لم يُوصف الأثر المتوقع.')}`)}
      ${fdSec(4, 'نتيجة التقييم', d.recManual ? 'محددة يدويًا' : 'محددة تلقائيًا من النسب', `${fdChoice(recOpts, d.rec, Object.fromEntries(recOpts.map((o, i) => [o, i === 0 ? 'check' : i === recOpts.length - 1 ? 'x' : 'alert'])))}<div class="ev-lbl">المبررات أو الشروط</div>${fdQ(d.recNote, 'لا توجد مبررات مكتوبة.')}`)}
    </div>`;
  return fdShell({ kind, rec, key, tone, st,
    ring: { pct: sc === null ? 0 : sc / 100, big: sc === null ? '—' : sc, small: sc === null ? '' : '%', label: d.rec || autoRes || 'لم يكتمل' },
    facts: [['المقيِّم', esc(d.by || '—')], ['تاريخ التقييم', d.date ? fmtDate(d.date) + 'م' : '—'], ['الحالة', st.status === 'done' ? 'مكتمل ومعتمد' : 'مسودة']],
    kpis: [['مجال عمل الجهة', esc(d.domain || '—')], ['تصنيف الشراكة', esc(d.ptype || '—')], ['القيمة المالية التقديرية', d.valueSar ? sar(d.valueSar) : '—'], ['نتيجة التقييم', esc(d.rec || '—'), 'rec']],
    body });
}

/* — المواءمة الاستراتيجية — */
function alignmentDocHTML(kind, rec) {
  const key = 'alignment', F = FORMS[key], R = fRecInfo(kind, rec), st = formOf(rec, key) || {}, d = st.data || {};
  const goals = goalCodes(), cl = (d.clauses || []).map((c) => (typeof c === 'string' ? { text: c, goals: [] } : c));
  const linked = cl.filter((c) => (c.goals || []).length).length;
  const cover = goals.map((g) => ({ ...g, n: cl.filter((c) => (c.goals || []).includes(g.k)).length }));
  const covered = cover.filter((g) => g.n).length;
  const resOpts = fdOpts(fdField(F, R, rec, 'result')), ri = resOpts.indexOf(d.result);
  const tone = ri < 0 ? 'na' : ri === 0 ? 'ex' : ri === resOpts.length - 1 ? 'lo' : 'gd';
  const maxN = Math.max(1, ...cover.map((g) => g.n));
  const matrix = `<table class="ev-tbl fx-mx"><thead><tr><th>م</th><th>بند المذكرة</th>${goals.map((g) => `<th class="g" title="${esc(g.t)}">${esc(g.k)}</th>`).join('')}<th>ملاحظات</th></tr></thead>
    <tbody>${cl.length ? cl.map((c, i) => `<tr><td class="fx-ix">${i + 1}</td><td class="fx-cl">${esc(c.text || '').replace(/\n/g, '<br>')}</td>${goals.map((g) => `<td class="g">${(c.goals || []).includes(g.k) ? '<i class="fx-dot"></i>' : ''}</td>`).join('')}<td class="fx-nt2">${esc(c.note || '')}</td></tr>`).join('') : `<tr><td colspan="${goals.length + 3}" class="fx-empty">لم تُسجَّل بنود.</td></tr>`}</tbody>
    <tfoot><tr><td></td><td>عدد البنود المرتبطة بكل هدف</td>${cover.map((g) => `<td class="g"><b>${g.n}</b></td>`).join('')}<td></td></tr></tfoot></table>`;
  const legend = `<div class="fx-goals">${cover.map((g) => `<div class="${g.n ? 'on' : ''}"><em>${esc(g.k)}</em><span>${esc(g.t.replace(/^[A-Z]{1,3}\d?\s*[:：]\s*/, ''))}</span><i><b style="width:${g.n / maxN * 100}%"></b></i><small>${g.n}</small></div>`).join('')}</div>`;
  const body = `
    ${fdSec(1, 'الغرض العام من المذكرة', '', fdQ(d.purpose, 'لم يُكتب الغرض.'))}
    ${fdSec(2, 'مصفوفة المواءمة مع الأهداف الاستراتيجية', `${linked} من ${cl.length} بنود مرتبطة · ${covered} من ${goals.length} أهداف مغطاة`, matrix + legend)}
    ${fdSec(3, 'رأي الإدارة الاستراتيجية', '', `<div class="fx-grid2 fx-op"><div>${fdChoice(resOpts, d.result, Object.fromEntries(resOpts.map((o, i) => [o, i === 0 ? 'check' : i === resOpts.length - 1 ? 'x' : 'alert'])))}</div><div>${fdQ(d.notes, 'لا توجد ملاحظات.')}</div></div>`)}`;
  return fdShell({ kind, rec, key, tone, st,
    ring: { pct: goals.length ? covered / goals.length : 0, big: covered, small: '/' + goals.length, label: 'أهداف مغطاة' },
    facts: [['المراجِع', esc(d.by || '—')], ['التاريخ', d.date ? fmtDate(d.date) + 'م' : '—'], ['الحالة', st.status === 'done' ? 'مكتمل ومعتمد' : 'مسودة']],
    kpis: [['الإدارة المالكة', esc(d.owner || '—')], ['الإدارات المشاركة', (d.depts || []).length ? d.depts.map(esc).join('، ') : '—'], ['بنود المذكرة', `${linked} مرتبطة من ${cl.length}`], ['نتيجة المواءمة', esc(d.result || '—'), 'rec']],
    body });
}
const FORM_DOCS = { methodology: methodologyDocHTML, initialEval: initialEvalDocHTML, alignment: alignmentDocHTML };
