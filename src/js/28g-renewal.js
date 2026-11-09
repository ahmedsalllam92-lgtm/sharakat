/* =====================================================================
   تقييم التجديد وخطة التفعيل
   - قبل انتهاء الشراكة بـ 60 يومًا تظهر في صفحتها دائرة متحركة «تقييم التجديد» تفتح نموذجًا بسيطًا:
     هل حققت الشراكة أهدافها وتستحق التجديد؟ وإن كانت التوصية التجديد تُحدد مدته أو تاريخه،
     فيُحدَّث تاريخ الانتهاء ويُسجَّل التجديد في سجل الشراكة ويظهر في صفحتها وفي التقارير.
   - خطة تفعيل المذكرة (الخطوة 12) نموذج داخل المنظومة بدل الملف (ويبقى رفع الملف ممكنًا).
   ===================================================================== */
const RNW_DAYS = 60;
const RNW_YES = ['تستحق التجديد', 'تجديد بشروط'];
const RNW_MODES = ['سنة', 'سنتان', 'ثلاث سنوات', 'حتى تاريخ محدد'];
function rnwAddYears(iso, n) { const d = parseDate(iso) || today(); const x = new Date(d); x.setFullYear(x.getFullYear() + n); return isoDate(x); }
function rnwNewEnd(p, d) {
  if (d.renewMode === 'حتى تاريخ محدد') return d.renewTo || '';
  const n = { 'سنة': 1, 'سنتان': 2, 'ثلاث سنوات': 3 }[d.renewMode]; return n ? rnwAddYears(d.forEnd || p.endDate, n) : '';
}
FORMS.renewal = {
  no: 'RNW', title: 'نموذج تقييم الشراكة للتجديد', short: 'تقييم التجديد', ic: 'history',
  sections: (R, rec) => [
    { t: 'الشراكة ومدتها', fields: [
      { k: 'partner', l: 'الجهة الشريكة', type: 'text', def: R.name, req: true },
      { k: 'term', l: 'مدة الشراكة الحالية', type: 'text', def: rec.startDate || rec.endDate ? `${rec.startDate ? fmtDate(rec.startDate) : '—'} — ${rec.endDate ? fmtDate(rec.endDate) : '—'}` : '' },
      { k: 'forEnd', l: 'تاريخ الانتهاء الحالي', type: 'date', def: rec.endDate || '', req: true },
    ] },
    { t: 'هل نجحت الشراكة؟', note: 'خمسة أسئلة مباشرة؛ الإجابة «نعم» أو «جزئيًا» أو «لا»، مع ملاحظة عند الحاجة.', fields: [
      { k: 'crit', type: 'checklist', opts: [['yes', 'نعم'], ['part', 'جزئيًا'], ['no', 'لا']], req: true, items: [
        'حققت الشراكة أهدافها ومجالات التعاون المتفق عليها',
        'نُفّذت المخرجات المستهدفة أو معظمها',
        'التزم الشريك وكان التواصل معه فعّالًا',
        'للشراكة أثر ملموس يخدم المؤسسة وأهدافها الاستراتيجية',
        'يرغب الطرفان في الاستمرار وتوجد فرص لتوسيع التعاون',
      ] },
      { k: 'achieved', l: 'أبرز ما تحقق', type: 'textarea', rows: 3, def: (rec.highlight && rec.highlight.value) ? `${rec.highlight.value} ${rec.highlight.label || ''}`.trim() : '' },
    ] },
    { t: 'التوصية والتجديد', note: 'عند التوصية بالتجديد يُحدَّث تاريخ انتهاء الشراكة تلقائيًا عند إتمام النموذج.', fields: [
      { k: 'rec', l: 'التوصية', type: 'chips', opts: ['تستحق التجديد', 'تجديد بشروط', 'لا تستحق التجديد'], req: true },
      { k: 'renewMode', l: 'مدة التجديد', type: 'chips', opts: RNW_MODES, hint: 'تُحسب من تاريخ الانتهاء الحالي.' },
      { k: 'renewTo', l: 'تاريخ الانتهاء الجديد (عند اختيار «حتى تاريخ محدد»)', type: 'date' },
      { k: 'conds', l: 'الشروط أو الملاحظات', type: 'textarea', rows: 2 },
      { k: 'by', l: 'المقيِّم', type: 'select', opts: partnersAccNames(), def: partnersAccDefault(), req: true },
      { k: 'date', l: 'تاريخ التقييم', type: 'date', def: isoDate(today()), req: true },
    ] },
  ],
  out: (rec, d) => {
    if (!RNW_YES.includes(d.rec)) { rec.renewDecision = { at: nowISO(), rec: d.rec, forEnd: d.forEnd }; return; }
    const to = rnwNewEnd(rec, d), from = d.forEnd || rec.endDate;
    if (!to || (from && to <= from)) return;
    rec.renewals = rec.renewals || [];
    if (rec.renewals.some((x) => x.from === from && x.to === to)) return;
    rec.renewals.push({ at: nowISO(), by: Session.userName(), from, to, mode: d.renewMode, rec: d.rec, conds: d.conds || '', no: (rec.forms && rec.forms.renewal && rec.forms.renewal.no) || '', data: JSON.parse(JSON.stringify(d)) });
    rec.endDate = to; rec.renewDecision = { at: nowISO(), rec: d.rec, forEnd: to };
  },
  doneMsg: (rec, d) => RNW_YES.includes(d.rec) && rnwCount(rec) && rec.endDate === (rec.renewals[rec.renewals.length - 1] || {}).to ? `جُدّدت الشراكة حتى ${fmtDate(rec.endDate)}` : 'حُفظ تقييم التجديد في ملف الشراكة',
  score: (d) => {
    const c = d.crit || {}, v = Object.values(c).map((x) => x && x.v), yes = v.filter((x) => x === 'yes').length, part = v.filter((x) => x === 'part').length;
    return `${d.rec || ''}${v.length ? ` — ${yes} نعم، ${part} جزئيًا من 5` : ''}`;
  },
};
/* خطة تفعيل المذكرة */
FORMS.activation = {
  no: 'ACT', title: 'خطة تفعيل المذكرة', short: 'خطة التفعيل', step: 'bizdev', ic: 'flag',
  sections: (R, rec) => [
    { t: 'بيانات الخطة', fields: [
      { k: 'partner', l: 'الجهة الشريكة', type: 'text', def: R.name, req: true },
      { k: 'owner', l: 'الإدارة المسؤولة عن التفعيل', type: 'select', opts: L('departments'), def: wfDept('bizdev') },
      { k: 'depts', l: 'الإدارات المنفذة', type: 'multi', opts: L('departments'), def: rec.departments || [] },
      { k: 'from', l: 'بداية التنفيذ', type: 'date', def: rec.startDate || '' },
      { k: 'to', l: 'نهاية التنفيذ', type: 'date', def: rec.endDate || '' },
    ] },
    { t: 'المبادرات المقترحة', note: 'كل مبادرة في سطر: اسمها — الإدارة — موعدها (مثال: حملة تشجير المنافذ — إدارة المشاريع — الربع الأول).', fields: [
      { k: 'inits', l: 'المبادرات', type: 'textarea', rows: 6, req: true, def: (R.coop || []).slice(0, 4).map((c) => trimP(c).split(/[،,]/)[0]).join('\n') },
      { k: 'kpis', l: 'مؤشرات القياس', type: 'textarea', rows: 3, hint: 'كيف يُقاس نجاح التفعيل (أعداد، نسب، مخرجات).' },
      { k: 'needs', l: 'المتطلبات والموارد', type: 'textarea', rows: 2 },
    ] },
    { t: 'الاعتماد', fields: [
      { k: 'by', l: 'المُعِدّ', type: 'text', def: Session.userName(), req: true },
      { k: 'date', l: 'التاريخ', type: 'date', def: isoDate(today()), req: true },
    ] },
  ],
  score: (d) => { const n = String(d.inits || '').split('\n').filter((x) => x.trim()).length; return n ? `${n} مبادرات` : ''; },
};
(() => { const s = WF_STEPS.find((x) => x.id === 'bizdev'); const dk = s && s.docs.find((x) => x.k === 'activationPlan'); if (dk && !dk.form) dk.form = 'activation'; })();

/* — الحالة: هل حان تقييم التجديد؟ — */
function rnwDue(p) {
  if (!p || p.stage !== 'signed' || !p.endDate) return null;
  const dl = daysLeft(p); if (dl === null || dl > RNW_DAYS || dl < -30) return null;
  const dec = p.renewDecision; if (dec && dec.forEnd === p.endDate) return null; // قُيِّمت لهذه المدة
  return dl;
}
const rnwCount = (p) => (p.renewals || []).length;
function rnwChipHTML(p) { const n = rnwCount(p); return n ? `<span class="chip rnw-chip" title="آخر تجديد: حتى ${esc(fmtDate(p.renewals[n - 1].to))}">${icon('history')} مُجدَّدة${n > 1 ? ` (${n})` : ''}</span>` : ''; }
function rnwHistoryHTML(p) {
  const R = p.renewals || []; if (!R.length) return '';
  return `<div class="rnw-hist"><b>${icon('history')} سجل التجديد</b>${R.map((x, i) => `<div><span class="n">${i + 1}</span><span>من ${fmtDate(x.from, 'short')} إلى <b>${fmtDate(x.to, 'short')}</b><small>${esc(x.mode || '')}${x.rec === 'تجديد بشروط' ? ' · بشروط' : ''} · ${fmtDate(String(x.at).slice(0, 10), 'short')}</small></span></div>`).join('')}</div>`;
}
/* الدائرة المتحركة داخل صفحة الشراكة */
function rnwMount(el, id) {
  const p = D.partnerships.find((x) => x.id === id); if (!p) return;
  /* شارة التجديد وسجله */
  const tag = el.querySelector('.dhead .tagline'); if (tag && rnwCount(p) && !tag.querySelector('.rnw-chip')) tag.insertAdjacentHTML('beforeend', rnwChipHTML(p));
  const per = [...el.querySelectorAll('.side-card')].find((c) => (c.querySelector('h3') || {}).textContent === 'فترة الشراكة');
  if (per && rnwCount(p)) per.insertAdjacentHTML('beforeend', rnwHistoryHTML(p));
  const dl = rnwDue(p); if (dl === null || !can('edit.partnership')) return;
  const C = 2 * Math.PI * 44, frac = Math.max(0, Math.min(1, dl / RNW_DAYS));
  const b = document.createElement('button'); b.type = 'button'; b.className = 'rnw-fab no-print'; b.title = 'تقييم الشراكة قبل انتهائها: هل تستحق التجديد؟';
  b.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" class="t"/><circle cx="50" cy="50" r="44" class="v" stroke-dasharray="${(frac * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" r="48" class="o"/></svg>
    <span class="rnw-in"><b>${dl >= 0 ? nf(dl) : '!'}</b><small>${dl >= 0 ? 'يومًا' : 'انتهت'}</small></span><span class="rnw-lbl">تقييم التجديد</span>`;
  const go = () => openForm('partnership', p, 'renewal', { onDone: () => route() });
  b.onclick = go; el.appendChild(b);
  /* زر مختصر داخل تنبيه قرب الانتهاء */
  const al = el.querySelector('.p-alert'); if (al && !al.querySelector('.rnw-go')) { const g = document.createElement('button'); g.type = 'button'; g.className = 'btn sm primary rnw-go'; g.innerHTML = `${icon('history')} تقييم التجديد`; g.onclick = go; al.appendChild(g); }
}
/* ربطها بصفحة الشراكة */
const _rnwRender = renderPartnership;
renderPartnership = function (el, r) { _rnwRender(el, r); try { rnwMount(el, r.params.id); } catch (e) { console.warn(e); } };
