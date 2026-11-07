/* =====================================================================
   نماذج المسار داخل المنظومة
   مبنية على نماذج المؤسسة المعتمدة (منهجية بناء الشراكات، المواءمة الاستراتيجية،
   خطاب طلب موافقة المعالي، مراجعة الخطابات) مع نموذج التقييم المبدئي ونموذج تقييم الشراكة.
   كل نموذج مرتبط بخطوته في المسار، ويُطبع أو يُنزّل Word بتنسيق موحد.
   ===================================================================== */
const SECTOR_FORM = ['قطاع حكومي', 'قطاع شبه حكومي', 'قطاع خاص', 'قطاع غير ربحي', 'قطاع التعليم'];
const SECTOR_TO_FORM = { 'حكومي': 'قطاع حكومي', 'شبه حكومي': 'قطاع شبه حكومي', 'خاص': 'قطاع خاص', 'غير ربحي': 'قطاع غير ربحي', 'تعليمي': 'قطاع التعليم' };
const OK_NO = [['ok', 'مناسب'], ['no', 'غير مناسب']];
const sar = (n) => (n || n === 0 ? `${nf(Math.round(+n))} ر.س` : '—');
const goalCode = (g) => (String(g).match(/^([A-Z]{1,3}\d?)\s*[:：]/) || [])[1] || g;
const goalCodes = () => L('goals').map((g) => ({ k: goalCode(g), t: g }));

/* — بيانات مساعدة من السجل — */
const trimP = (t) => String(t || '').trim().replace(/[.،؛:\s]+$/u, '');
function fRecInfo(kind, rec) {
  const isP = kind === 'partnership';
  const pr = isP ? partnerById(rec.partnerId) : null;
  const prop = isP && rec.proposalId ? D.proposals.find((x) => x.id === rec.proposalId) : kind === 'proposal' ? rec : null;
  const sector = isP ? (pr && pr.sector) : rec.partnerSector;
  return {
    name: isP ? partnerName(rec) : rec.partnerName || '',
    sector: SECTOR_TO_FORM[sector] || '',
    owner: isP ? wfReqDept(rec) || D.settings.org.dept : rec.department,
    depts: isP ? (rec.departments || []) : [rec.department].filter(Boolean),
    purpose: trimP(isP ? (firstItem(rec.expectedImpact) || firstItem(rec.cooperationAreas)) : (prop && (firstItem(prop.targets) || prop.strategicGoal)) || ''),
    added: trimP(isP ? firstItem(rec.expectedImpact) : (prop && prop.addedValue) || ''),
    coop: (isP ? richItems(rec.cooperationAreas).map((x) => (x.title ? x.title + ': ' : '') + x.text) : richItems((prop || {}).targets).map((x) => x.text)).map(trimP),
    cls: isP ? rec.classification : '',
    domain: isP ? (pr && pr.domain) || '' : (rec.profile || {}).domain || '',
  };
}

/* — تعريف النماذج — */
const FORMS = {
  methodology: {
    no: 'MTH', title: 'نموذج منهجية بناء الشراكات', step: 'method', ic: 'layers',
    sections: (R) => [
      { t: 'معلومات أساسية', fields: [
        { k: 'partner', l: 'اسم الجهة الشريكة', type: 'text', def: R.name, req: true },
        { k: 'sector', l: 'نوع الجهة (القطاع)', type: 'chips', opts: SECTOR_FORM, def: R.sector, req: true },
      ] },
      { t: 'منهجية بناء الشراكة', note: 'تُستكمل البنود الثمانية لكل شراكة جديدة قبل التقييم المبدئي.', fields: [
        { k: 'm1', n: 1, l: 'تحديد احتياجات المؤسسة', type: 'textarea', req: true, hint: 'الاحتياجات البحثية والاستشارية والفنية لمشروعات المؤسسة، والمجالات التي يمكن الاستفادة فيها من خبرات الجهة.' },
        { k: 'm2', n: 2, l: 'دراسة إمكانات الجهة ومدى مواءمتها', type: 'textarea', req: true, hint: 'إمكانات الجهة وخدماتها، ومدى مواءمتها مع احتياجات المؤسسة وأهدافها الاستراتيجية.' },
        { k: 'm3', n: 3, l: 'مراجعة الخبرات والإمكانات العلمية والفنية', type: 'textarea', hint: 'المراكز والكفاءات المتخصصة لدى الجهة، والتحقق من ملاءمتها لمبادرات المؤسسة ومشروعاتها.' },
        { k: 'm4', n: 4, l: 'تقييم القيمة المضافة المتوقعة', type: 'textarea', req: true, hint: 'الحلول المتوقعة، والدراسات، ورفع كفاءة التنفيذ، وقياس الأثر، ونقل المعرفة وبناء القدرات.' },
        { k: 'm5', n: 5, l: 'الاجتماعات التنسيقية', type: 'textarea', hint: 'الاجتماعات مع ممثلي الجهة لمناقشة مجالات التعاون ذات الأولوية واستعراض احتياجات المؤسسة.' },
        { k: 'm6', n: 6, l: 'تحديد مجالات التعاون والأدوار والمسؤوليات', type: 'textarea', req: true, hint: 'مجالات التعاون، ومسؤوليات الطرفين، وآليات الاستفادة، وإطار المبادرات والمخرجات المستهدفة.' },
        { k: 'm7', n: 7, l: 'إعداد مذكرة التفاهم واستكمال الموافقات', type: 'textarea', hint: 'إعداد المذكرة ومراجعتها من الإدارات المعنية والإدارة القانونية، واستكمال الموافقات وفق الإجراءات المعتمدة.' },
        { k: 'm8', n: 8, l: 'آلية التفعيل بعد الاعتماد', type: 'textarea', hint: 'المشروعات ذات الأولوية، وخطط العمل والاتفاقيات التنفيذية، والمتطلبات المالية والفنية، وآليات قياس الأثر.' },
      ] },
    ],
  },
  initialEval: {
    no: 'IEV', title: 'نموذج التقييم المبدئي للشريك', step: 'eval', ic: 'check',
    sections: (R, rec) => [
      { t: 'بيانات الجهة وتصنيفها', fields: [
        { k: 'partner', l: 'اسم الجهة', type: 'text', def: R.name, req: true },
        { k: 'sector', l: 'نوع الجهة (القطاع)', type: 'chips', opts: SECTOR_FORM, def: R.sector, req: true },
        { k: 'domain', l: 'مجال عمل الجهة', type: 'chips', opts: L('domains'), def: R.domain, req: true, hint: 'بيئة، مياه، سياحة، طاقة… تُدار القائمة من «القوائم».' },
        { k: 'ptype', l: 'تصنيف الشراكة', type: 'chips', opts: L('partnerTypes'), req: true, def: (rec.profile || {}).ptype || rec.ptype || '' },
        { k: 'origin', l: 'كيف بدأت العلاقة', type: 'chips', opts: L('originTypes'), req: true, def: (rec.profile || {}).origin || rec.origin || '' },
        { k: 'originBy', l: 'من بدأ العلاقة أو فتح الباب', type: 'text', hint: 'الاسم والصفة، مثل: عضو مجلس الأمناء، الرئيس التنفيذي، الإدارة الطالبة.', def: (rec.profile || {}).originBy || rec.originBy || '' },
      ] },
      { t: 'معايير التقييم المبدئي', fields: [{ k: 'crit', type: 'checklist', opts: OK_NO, items: ['سمعة الجهة ومصداقيتها', 'مواءمة نشاط الجهة مع رسالة المؤسسة وأهدافها الاستراتيجية', 'قدرات الجهة الفنية والبشرية', 'الملاءة والاستقرار المالي للجهة', 'القيمة المضافة المتوقعة للمؤسسة', 'خلو التعاون من تعارض المصالح والمخاطر القانونية', 'عدم تكرار الشراكة مع جهة مماثلة قائمة'], req: true }] },
      { t: 'القيمة والأثر المتوقعان', fields: [
        { k: 'valueTypes', l: 'نوع القيمة المتوقعة', type: 'multi', opts: L('valueTypes') },
        { k: 'valueSar', l: 'القيمة المالية التقديرية (ر.س)', type: 'number', hint: 'اختياري — تقدير أولي لقيمة ما تقدمه الجهة.' },
        { k: 'impact', l: 'الأثر المتوقع', type: 'textarea', def: R.added },
      ] },
      { t: 'التوصية', fields: [
        { k: 'rec', l: 'نتيجة التقييم', type: 'chips', opts: ['الجهة مناسبة', 'مناسبة بشروط', 'الجهة غير مناسبة'], req: true },
        { k: 'recNote', l: 'المبررات أو الشروط', type: 'textarea' },
        { k: 'by', l: 'اسم المقيِّم', type: 'text', def: Session.userName(), req: true },
        { k: 'date', l: 'تاريخ التقييم', type: 'date', def: isoDate(today()), req: true },
      ] },
    ],
    out: (rec, d, kind) => {
      const pf = { ptype: d.ptype, origin: d.origin, originBy: d.originBy, domain: d.domain, valueTypes: d.valueTypes, valueSar: d.valueSar };
      if (kind === 'proposal') rec.profile = { ...(rec.profile || {}), ...pf };
      else { Object.assign(rec, { ptype: d.ptype, origin: d.origin, originBy: d.originBy }); const pr = partnerById(rec.partnerId); if (pr && d.domain) { pr.domain = d.domain; Repo.save('partners', pr); } }
    },
    score: (d) => { const it = Object.values(d.crit || {}); const ok = it.filter((x) => x.v === 'ok').length; return it.length ? `${ok} من ${it.length} معايير مناسبة` : ''; },
  },
  alignment: {
    no: 'ALN', title: 'نموذج مواءمة مذكرات التفاهم مع الأهداف الاستراتيجية للمؤسسة', short: 'نموذج المواءمة الاستراتيجية', step: 'strategy', ic: 'chart',
    sections: (R) => [
      { t: 'معلومات أساسية', fields: [
        { k: 'partner', l: 'اسم الجهة الشريكة', type: 'text', def: R.name, req: true },
        { k: 'sector', l: 'نوع الجهة (القطاع)', type: 'chips', opts: SECTOR_FORM, def: R.sector, req: true },
        { k: 'owner', l: 'الإدارة المالكة', type: 'chips', opts: L('departments'), def: R.owner, req: true },
        { k: 'depts', l: 'الإدارات المشاركة', type: 'multi', opts: L('departments'), def: R.depts },
        { k: 'purpose', l: 'الغرض العام من المذكرة', type: 'textarea', def: R.purpose, req: true },
      ] },
      { t: 'المواءمة مع الأهداف الاستراتيجية', legend: true, fields: [{ k: 'clauses', type: 'clauses', def: R.coop, req: true }] },
      { t: 'رأي الإدارة الاستراتيجية', fields: [
        { k: 'result', l: 'نتيجة المواءمة', type: 'chips', opts: ['متوائمة', 'متوائمة بملاحظات', 'غير متوائمة'], req: true },
        { k: 'notes', l: 'ملاحظات', type: 'textarea' },
        { k: 'by', l: 'اسم المراجِع', type: 'text', def: Session.userName(), req: true },
        { k: 'date', l: 'التاريخ', type: 'date', def: isoDate(today()), req: true },
      ] },
    ],
    out: (rec, d) => { rec.goalsLinked = [...new Set((d.clauses || []).flatMap((c) => c.goals || []))]; },
    score: (d) => { const c = d.clauses || []; const g = new Set(c.flatMap((x) => x.goals || [])); return c.length ? `${c.length} بنود مرتبطة بـ${g.size} ${g.size === 1 ? 'هدف' : 'أهداف'}` : ''; },
  },
  letter: {
    no: 'LTR', title: 'خطاب طلب موافقة المعالي', step: 'legal', ic: 'mail', letter: true,
    sections: (R) => {
      const L_ = D.settings.letter || {};
      const body = `نحيط معاليكم علمًا بأن ${D.settings.org.name} تعمل حاليًا على التنسيق مع ${R.name}، وذلك لإبرام ${R.cls || 'مذكرة تفاهم'} تهدف إلى ${R.purpose || 'تعزيز التعاون في المجالات ذات الاهتمام المشترك'}.${R.added ? ` وتكمن القيمة المضافة لهذه الشراكة في ${R.added}` : ''}${R.coop.length ? `، وتشمل مجالات التعاون: ${R.coop.slice(0, 4).map((x) => trimP(x.split(':')[0])).join('، ')}` : ''}. ومن شأن هذه الشراكة أن تسهم في تعزيز القدرات الفنية والمؤسسية للمؤسسة، ورفع جودة مخرجاتها، وتعظيم الأثر المستدام لمبادراتها، بما يدعم تحقيق مستهدفاتها الاستراتيجية ومستهدفات رؤية المملكة 2030. (مرفق نسخة المذكرة).`;
      return [
        { t: 'المخاطَب', fields: [
          { k: 'to1', l: 'المخاطَب', type: 'text', def: L_.to1 || 'معالي نائب وزير البيئة والمياه والزراعة', req: true },
          { k: 'to2', l: 'الصفة', type: 'text', def: L_.to2 || `رئيس مجلس أمناء ${D.settings.org.name}`, req: true },
          { k: 'subject', l: 'موضوع الخطاب', type: 'text', def: `طلب موافقة معالي رئيس مجلس الأمناء على إبرام ${R.cls || 'مذكرة تفاهم'} مع ${R.name}`, req: true },
        ] },
        { t: 'نص الخطاب', note: 'يُولَّد النص من بيانات الشراكة، ويمكن تعديله قبل الإرسال للمراجعة القانونية.', fields: [
          { k: 'body', l: 'المتن', type: 'textarea', rows: 9, def: body, req: true },
          { k: 'closing', l: 'الختام', type: 'textarea', rows: 3, def: 'ونظرًا لأهمية هذه الشراكة وما تحققه من تكامل بين الجهات ذات العلاقة.\nآمل من معاليكم التلطف بالاطلاع والمباركة، أو التوجيه بما ترونه من سديد الرأي.' },
          { k: 'atts', l: 'مرفقات الخطاب', type: 'text', def: 'نسخة من مذكرة التفاهم' },
        ] },
        { t: 'التوقيع', fields: [
          { k: 'signTitle', l: 'صفة الموقِّع', type: 'text', def: L_.signTitle || `الرئيس التنفيذي لـ${D.settings.org.name}`, req: true },
          { k: 'signName', l: 'اسم الموقِّع', type: 'text', def: L_.signName || 'م. محمد بن عبدالعزيز باجري', req: true },
          { k: 'date', l: 'تاريخ الخطاب', type: 'date', def: isoDate(today()), req: true },
        ] },
      ];
    },
  },
  letterReview: {
    no: 'GPD', title: 'نموذج مراجعة الخطابات', step: 'legal', ic: 'file',
    sections: (R, rec) => {
      const lt = ((rec.forms || {}).letter || {}).data || {};
      return [
        { t: 'بيانات الطلب', fields: [
          { k: 'reqDept', l: 'الإدارة الطالبة', type: 'text', def: D.settings.org.dept, req: true },
          { k: 'subject', l: 'موضوع الخطاب', type: 'text', def: lt.subject || '', req: true },
          { k: 'atts', l: 'مرفقات الخطاب', type: 'text', def: lt.atts || 'نسخة من مذكرة التفاهم' },
          { k: 'reqDate', l: 'تاريخ الطلب', type: 'date', def: lt.date || isoDate(today()), req: true },
          { k: 'recvTime', l: 'وقت الاستلام', type: 'text', def: '' },
          { k: 'prevNo', l: 'رقم النموذج السابق — إن وجد', type: 'text', def: 'لا يوجد' },
        ] },
        { t: 'أولًا: قائمة المراجعة الأولية', fields: [
          { k: 'r1by', l: 'اسم المراجع الأولي', type: 'text', def: Session.userName(), req: true },
          { k: 'r1date', l: 'تاريخ المراجعة الأولية', type: 'date', def: isoDate(today()), req: true },
          { k: 'r1', type: 'checklist', opts: OK_NO, items: ['وضوح موضوع الخطاب', 'صحة الجهة المخاطبة', 'سلامة الصياغة اللغوية', 'استكمال المرفقات والوثائق', 'صحة الأسماء والتواريخ والأرقام', 'التأكد من الهوية البصرية للمؤسسة', 'تنسيق الخطاب'], req: true },
          { k: 'r1rec', l: 'التوصية الأولية', type: 'chips', opts: ['استكمال المراجعة', 'إعادة للتعديل'], req: true },
        ] },
        { t: 'ثانيًا: المراجعة', fields: [
          { k: 'r2by', l: 'اسم المراجع', type: 'text', req: true },
          { k: 'r2date', l: 'تاريخ المراجعة', type: 'date', def: isoDate(today()), req: true },
          { k: 'r2', type: 'checklist', opts: OK_NO, items: ['الجانب التنظيمي', 'سلامة الصياغة'], req: true },
          { k: 'r2rec', l: 'التوصية', type: 'chips', opts: ['مناسب', 'مناسب بعد التعديلات', 'غير مناسب'], req: true },
        ] },
        { t: 'ثالثًا: اعتماد المراجعة', fields: [
          { k: 'apBy', l: 'اسم معتمد المراجعة', type: 'text', req: true },
          { k: 'apDate', l: 'تاريخ اعتماد المراجعة', type: 'date', def: isoDate(today()), req: true },
          { k: 'apSign', l: 'توقيع معتمد المراجعة', type: 'sign' },
        ] },
      ];
    },
    score: (d) => d.r2rec || '',
  },
  partnershipEval: {
    no: 'EVL', title: 'نموذج تقييم الشراكة', ic: 'star', periodic: true,
    sections: () => [
      { t: 'بيانات التقييم', fields: [
        { k: 'period', l: 'فترة التقييم', type: 'text', def: `${['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'][Math.floor(today().getMonth() / 3)]} ${today().getFullYear()}`, req: true },
        { k: 'by', l: 'المقيِّم', type: 'text', def: Session.userName(), req: true },
        { k: 'date', l: 'تاريخ التقييم', type: 'date', def: isoDate(today()), req: true },
      ] },
      { t: 'معايير تقييم الشراكة', note: 'كل معيار من 1 (ضعيف) إلى 5 (ممتاز)، والدرجة النهائية موزونة.', fields: [{ k: 'scores', type: 'scores', items: EVAL_CRIT, req: true }] },
      { t: 'القيمة والأثر المتحققان', fields: [
        { k: 'valueTypes', l: 'القيمة المتحققة', type: 'multi', opts: L('valueTypes') },
        { k: 'valueSar', l: 'القيمة المالية المتحققة (ر.س)', type: 'number' },
        { k: 'impactLevel', l: 'مستوى الأثر', type: 'chips', opts: ['مرتفع', 'متوسط', 'منخفض', 'لم يظهر بعد'], req: true },
        { k: 'impact', l: 'وصف الأثر', type: 'textarea' },
      ] },
      { t: 'التوصية', fields: [
        { k: 'rec', l: 'التوصية', type: 'chips', opts: ['تجديد وتوسيع', 'الاستمرار', 'إعادة هيكلة', 'عدم التجديد'], req: true },
        { k: 'recNote', l: 'ملاحظات', type: 'textarea' },
      ] },
    ],
    score: (d) => { const s = evalScore(d); return s === null ? '' : `${s}% — ${evalGrade(s)}`; },
  },
};
const EVAL_CRIT = [
  { k: 'align', l: 'المواءمة الاستراتيجية', d: 'ارتباط الشراكة بأهداف المؤسسة', w: 20 },
  { k: 'outputs', l: 'تحقيق المخرجات المستهدفة', d: 'ما نُفّذ مقارنة بالمخرجات في المذكرة', w: 20 },
  { k: 'impact', l: 'الأثر المتحقق', d: 'أثر بيئي ومجتمعي قابل للقياس', w: 20 },
  { k: 'commit', l: 'التزام الشريك وجودة التواصل', d: 'سرعة الاستجابة والوفاء بالالتزامات', w: 15 },
  { k: 'value', l: 'القيمة المضافة مقابل التكلفة', d: 'العائد المالي والعيني والمعرفي', w: 15 },
  { k: 'sustain', l: 'الاستدامة وفرص التوسع', d: 'قابلية الاستمرار والتوسع', w: 10 },
];
function evalScore(d) { const s = d && d.scores; if (!s) return null; const it = EVAL_CRIT.filter((c) => s[c.k] && s[c.k].v); if (it.length < EVAL_CRIT.length) return null; return Math.round(EVAL_CRIT.reduce((t, c) => t + (+s[c.k].v / 5) * c.w, 0)); }
function evalGrade(s) { return s >= 85 ? 'ممتاز' : s >= 75 ? 'جيد جدًا' : s >= 65 ? 'جيد' : 'يحتاج تحسين'; }
const evalTone = (s) => (s >= 85 ? 'ok' : s >= 65 ? 'gold' : 'danger');
function lastEval(p) { const e = (p.evals || []).filter((x) => x.status === 'done').sort((a, b) => ((a.data.date || a.at) < (b.data.date || b.at) ? 1 : -1))[0]; return e ? { ...e, score: evalScore(e.data) } : null; }

/* — الحالة والترقيم — */
const formOf = (rec, key) => (rec.forms || {})[key] || null;
const formDone = (rec, key) => { const f = formOf(rec, key); return !!(f && f.status === 'done'); };
function formNumber(key) {
  D.settings.counters = D.settings.counters || {};
  const c = D.settings.counters.forms = D.settings.counters.forms || {};
  const y = today().getFullYear(); const k = `${key}:${y}`;
  c[k] = (c[k] || 0) + 1;
  return `${FORMS[key].no}-${y}-${String(c[k]).padStart(3, '0')}`;
}

/* — حقل التحرير — */
function fFieldHTML(f, v, ro) {
  const id = 'ff_' + f.k;
  const dis = ro ? 'disabled' : '';
  const lab = f.l ? `<label for="${id}">${f.n ? `<em class="ff-n">${f.n}</em>` : ''}${esc(f.l)}${f.req ? ' <span class="ff-req">*</span>' : ''}</label>` : '';
  const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
  switch (f.type) {
    case 'textarea': return `<div class="field ff full" data-fk="${f.k}">${lab}<textarea class="in" id="${id}" rows="${f.rows || 3}" ${dis} placeholder="${esc(f.hint || '')}">${esc(v || '')}</textarea></div>`;
    case 'number': return `<div class="field ff" data-fk="${f.k}">${lab}<input class="in num" id="${id}" type="number" min="0" step="1000" value="${esc(v ?? '')}" ${dis}>${hint}</div>`;
    case 'date': return `<div class="field ff" data-fk="${f.k}">${lab}<input class="in" id="${id}" type="date" value="${esc(v || '')}" ${dis}></div>`;
    case 'sign': return `<div class="field ff" data-fk="${f.k}">${lab}<div class="ff-sign">${icon('check')}<span>يُعتمد إلكترونيًا باسم الحساب عند إتمام النموذج</span></div></div>`;
    case 'chips': case 'multi': {
      const vals = f.type === 'multi' ? (v || []) : [v];
      return `<div class="field ff ${f.opts.length > 4 ? 'full' : ''}" data-fk="${f.k}">${lab}<div class="ff-chips" role="${f.type === 'multi' ? 'group' : 'radiogroup'}">${f.opts.map((o) => `<button type="button" class="ff-chip ${vals.includes(o) ? 'on' : ''}" data-chip="${esc(o)}" ${dis} aria-pressed="${vals.includes(o)}">${f.type === 'multi' ? icon('check') : ''}${esc(o)}</button>`).join('')}</div>${hint}</div>`;
    }
    case 'checklist': return `<div class="field ff full" data-fk="${f.k}"><table class="ff-tbl"><thead><tr><th>م</th><th>عنصر المراجعة</th>${f.opts.map(([, l]) => `<th>${l}</th>`).join('')}<th>الملاحظات</th></tr></thead><tbody>
      ${f.items.map((it, i) => { const c = (v || {})[i] || {}; return `<tr data-row="${i}"><td class="c">${i + 1}</td><td>${esc(it)}</td>${f.opts.map(([k]) => `<td class="c"><button type="button" class="ff-tick ${c.v === k ? 'on ' + k : ''}" data-tick="${k}" ${dis} aria-label="${esc(it)}">${c.v === k ? icon(k === 'ok' ? 'check' : 'x') : ''}</button></td>`).join('')}<td><input class="in sm" data-note value="${esc(c.n || '')}" ${dis}></td></tr>`; }).join('')}</tbody></table></div>`;
    case 'scores': return `<div class="field ff full" data-fk="${f.k}"><table class="ff-tbl ff-sc"><thead><tr><th>المعيار</th><th>الوزن</th><th>التقييم</th><th>ملاحظات</th></tr></thead><tbody>
      ${f.items.map((c) => { const x = (v || {})[c.k] || {}; return `<tr data-row="${c.k}"><td><b>${esc(c.l)}</b><small>${esc(c.d)}</small></td><td class="c">${c.w}%</td><td class="c"><div class="ff-stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="ff-st ${+x.v >= n ? 'on' : ''}" data-score="${n}" ${dis} aria-label="${n}">${n}</button>`).join('')}</div></td><td><input class="in sm" data-note value="${esc(x.n || '')}" ${dis}></td></tr>`; }).join('')}</tbody></table><div class="ff-total" id="ffTotal"></div></div>`;
    case 'clauses': {
      const G = goalCodes();
      const rows = (v && v.length ? v : [{ text: '', goals: [] }]);
      return `<div class="field ff full" data-fk="${f.k}"><table class="ff-tbl ff-cl"><thead><tr><th>البند</th><th>الهدف الاستراتيجي المرتبط</th><th>ملاحظات</th>${ro ? '' : '<th></th>'}</tr></thead><tbody>
        ${rows.map((r, i) => `<tr data-row="${i}"><td><textarea class="in sm" data-cltext rows="3" ${dis}>${esc(typeof r === 'string' ? r : r.text || '')}</textarea></td><td><div class="ff-goals">${G.map((g) => `<button type="button" class="ff-chip sm ${(r.goals || []).includes(g.k) ? 'on' : ''}" data-goal="${esc(g.k)}" title="${esc(g.t)}" ${dis}>${esc(g.k)}</button>`).join('')}</div></td><td><input class="in sm" data-note value="${esc(r.note || '')}" ${dis}></td>${ro ? '' : `<td class="c"><button type="button" class="icon-btn" data-clrm aria-label="حذف البند">${icon('trash')}</button></td>`}</tr>`).join('')}
      </tbody></table>${ro ? '' : `<button type="button" class="btn sm" data-cladd>${icon('plus')} إضافة بند</button>`}</div>`;
    }
    default: return `<div class="field ff" data-fk="${f.k}">${lab}<input class="in" id="${id}" value="${esc(v || '')}" ${dis}>${hint}</div>`;
  }
}
function fReadField(box, f) {
  const w = box.querySelector(`[data-fk="${f.k}"]`); if (!w) return undefined;
  switch (f.type) {
    case 'chips': { const b = w.querySelector('.ff-chip.on'); return b ? b.dataset.chip : ''; }
    case 'multi': return $$('.ff-chip.on', w).map((b) => b.dataset.chip);
    case 'checklist': { const o = {}; $$('tr[data-row]', w).forEach((tr) => { const t = tr.querySelector('.ff-tick.on'); o[tr.dataset.row] = { v: t ? t.dataset.tick : '', n: tr.querySelector('[data-note]').value.trim() }; }); return o; }
    case 'scores': { const o = {}; $$('tr[data-row]', w).forEach((tr) => { const on = $$('.ff-st.on', tr).length; o[tr.dataset.row] = { v: on || '', n: tr.querySelector('[data-note]').value.trim() }; }); return o; }
    case 'clauses': return $$('tr[data-row]', w).map((tr) => ({ text: tr.querySelector('[data-cltext]').value.trim(), goals: $$('.ff-chip.on', tr).map((b) => b.dataset.goal), note: tr.querySelector('[data-note]').value.trim() })).filter((r) => r.text);
    case 'sign': return '';
    default: { const i = w.querySelector('input,textarea'); return i ? i.value.trim() : ''; }
  }
}
function fMissing(f, v) {
  if (!f.req) return false;
  if (f.type === 'checklist') return f.items.some((_, i) => !(v[i] && v[i].v));
  if (f.type === 'scores') return f.items.some((c) => !(v[c.k] && v[c.k].v));
  if (f.type === 'clauses') return !v.length || v.some((r) => !r.goals.length);
  if (f.type === 'multi') return !v.length;
  return !v;
}

/* — نافذة تعبئة النموذج — */
function openForm(kind, rec, key, { onDone, ro = false, evalIdx = null } = {}) {
  const F = FORMS[key];
  const R = fRecInfo(kind, rec);
  const store = F.periodic ? (evalIdx !== null ? (rec.evals || [])[evalIdx] : null) : formOf(rec, key);
  const data = (store && store.data) || {};
  const secs = F.sections(R, rec);
  const val = (f) => (data[f.k] !== undefined ? data[f.k] : typeof f.def === 'function' ? f.def() : f.def);
  const done = store && store.status === 'done';
  const m = Modal.open({
    title: F.title, size: 'xl', cls: 'ff-modal',
    body: `<div class="ff-head"><span>${icon(F.ic)}</span><div><b>${esc(R.name)}</b><small>${store && store.no ? `رقم النموذج: ${esc(store.no)} · ` : ''}${F.step ? `الخطوة ${wfStep(F.step).n}: ${esc(wfStep(F.step).t)}` : 'تقييم دوري للشراكة'}</small></div>${done ? `<span class="chip ok">${icon('check')} مكتمل ${store.at ? fmtDT(store.at) : ''}</span>` : store ? '<span class="chip gold">مسودة</span>' : ''}</div>
      ${secs.map((s) => `<section class="ff-sec"><h4>${esc(s.t)}</h4>${s.note ? `<p class="ff-note">${esc(s.note)}</p>` : ''}${s.legend ? `<div class="ff-legend">${goalCodes().map((g) => `<div><b>${esc(g.k)}</b><span>${esc(g.t.replace(/^[A-Z]{1,3}\d?\s*[:：]\s*/, ''))}</span></div>`).join('')}</div>` : ''}<div class="ff-grid">${s.fields.map((f) => fFieldHTML(f, val(f), ro)).join('')}</div></section>`).join('')}`,
    foot: ro ? `<button class="btn" data-ffprint type="button">${icon('print')} طباعة أو PDF</button><button class="btn" data-ffword type="button">${icon('download')} Word</button><button class="btn ghost" data-mclose type="button">إغلاق</button>`
      : `<button class="btn primary" data-ffsave="done" type="button">${icon('check')} ${done ? 'حفظ التعديلات' : 'إتمام النموذج'}</button><button class="btn" data-ffsave="draft" type="button">حفظ كمسودة</button>${store ? `<button class="btn ghost" data-ffprint type="button">${icon('print')} معاينة الطباعة</button>` : ''}<button class="btn ghost" data-mclose type="button">إلغاء</button>`,
  });
  const box = m.el;
  const total = () => { const t = $('#ffTotal', box); if (!t) return; const d = {}; secs.forEach((s) => s.fields.forEach((f) => { d[f.k] = fReadField(box, f); })); const sc = evalScore(d); t.innerHTML = sc === null ? '<span class="faint">تظهر الدرجة الموزونة بعد تقييم كل المعايير</span>' : `<b class="${evalTone(sc)}">${sc}%</b><span>${evalGrade(sc)}</span>`; };
  total();
  box.addEventListener('click', (e) => {
    if (ro && !e.target.closest('[data-ffprint],[data-ffword],[data-mclose]')) return;
    const ch = e.target.closest('.ff-chip'); if (ch && !ch.disabled) {
      const grp = ch.closest('[data-fk]'); const f = secs.flatMap((s) => s.fields).find((x) => x.k === grp.dataset.fk);
      if (ch.dataset.goal || f.type === 'multi') ch.classList.toggle('on'); else { const was = ch.classList.contains('on'); $$('.ff-chip', grp).forEach((b) => b.classList.remove('on')); if (!was) ch.classList.add('on'); }
      return;
    }
    const tk = e.target.closest('.ff-tick'); if (tk) { const tr = tk.closest('tr'); const was = tk.classList.contains('on'); $$('.ff-tick', tr).forEach((b) => { b.className = 'ff-tick'; b.innerHTML = ''; }); if (!was) { tk.classList.add('on', tk.dataset.tick); tk.innerHTML = icon(tk.dataset.tick === 'ok' ? 'check' : 'x'); } return; }
    const st = e.target.closest('.ff-st'); if (st) { const n = +st.dataset.score; $$('.ff-st', st.parentElement).forEach((b) => b.classList.toggle('on', +b.dataset.score <= n)); total(); return; }
    if (e.target.closest('[data-cladd]')) { const tb = box.querySelector('.ff-cl tbody'); const tr = tb.querySelector('tr').cloneNode(true); tr.querySelector('textarea').value = ''; tr.querySelector('[data-note]').value = ''; $$('.ff-chip', tr).forEach((b) => b.classList.remove('on')); tb.appendChild(tr); $$('tr', tb).forEach((r, i) => { r.dataset.row = i; }); tr.querySelector('textarea').focus(); return; }
    const rm = e.target.closest('[data-clrm]'); if (rm) { const tb = rm.closest('tbody'); if ($$('tr', tb).length > 1) rm.closest('tr').remove(); return; }
    if (e.target.closest('[data-ffprint]')) return printForm(kind, rec, key, evalIdx);
    if (e.target.closest('[data-ffword]')) return wordForm(kind, rec, key, evalIdx);
    const sv = e.target.closest('[data-ffsave]'); if (sv) save(sv.dataset.ffsave);
  });
  const save = async (mode) => {
    const d = {}; const miss = [];
    secs.forEach((s) => s.fields.forEach((f) => { d[f.k] = fReadField(box, f); if (mode === 'done' && fMissing(f, d[f.k])) miss.push(f.l || s.t); }));
    $$('.ff.invalid', box).forEach((x) => x.classList.remove('invalid'));
    if (miss.length) { secs.forEach((s) => s.fields.forEach((f) => { if (fMissing(f, d[f.k])) { const w = box.querySelector(`[data-fk="${f.k}"]`); w && w.classList.add('invalid'); } })); toast(`أكمل الحقول المطلوبة: ${miss.slice(0, 3).join('، ')}${miss.length > 3 ? '…' : ''}`, 'err'); const first = box.querySelector('.ff.invalid'); first && first.scrollIntoView({ block: 'center' }); return; }
    const rec0 = { data: d, status: mode, at: nowISO(), by: Session.userName(), byDept: Session.role() === 'dept' ? Session.dept() : D.settings.org.dept };
    let target;
    if (F.periodic) {
      rec.evals = rec.evals || [];
      if (evalIdx !== null && rec.evals[evalIdx]) { target = Object.assign(rec.evals[evalIdx], rec0); }
      else { target = { ...rec0, id: uid('ev'), no: formNumber(key) }; rec.evals.push(target); }
    } else {
      rec.forms = rec.forms || {};
      target = rec.forms[key] = { ...(rec.forms[key] || {}), ...rec0 };
      if (!target.no) target.no = formNumber(key);
    }
    if (mode === 'done' && F.out) F.out(rec, d, kind);
    await Repo.saveSettings();
    await Repo.save(kind === 'proposal' ? 'proposals' : 'partnerships', rec);
    await Repo.log('form.' + mode, kind, rec.id, kind === 'proposal' ? rec.ref : rec.code, `${F.short || F.title} (${target.no})${mode === 'done' ? ' — مكتمل' : ' — مسودة'}${F.score && F.score(d) ? ': ' + F.score(d) : ''}`);
    toast(mode === 'done' ? `اكتمل ${F.short || F.title}` : 'حُفظت المسودة');
    m.close(); onDone && onDone();
  };
}

/* — المستند المنسق للطباعة وWord — */
function formDocHTML(kind, rec, key, evalIdx = null, forWord = false) {
  const F = FORMS[key]; const R = fRecInfo(kind, rec);
  const st = F.periodic ? (rec.evals || [])[evalIdx] : formOf(rec, key);
  const d = (st && st.data) || {};
  const logo = (ASSET_IMG['murooj-logo'] || {}).src;
  const val = (f) => d[f.k];
  const cell = (f) => {
    const v = val(f);
    if (f.type === 'multi') return (v || []).map(esc).join('، ') || '—';
    if (f.type === 'number') return v ? sar(v) : '—';
    if (f.type === 'date') return v ? fmtDate(v) + 'م' : '—';
    if (f.type === 'sign') return st && st.status === 'done' ? `معتمد إلكترونيًا — ${esc(st.by)} — ${fmtDT(st.at)}` : '';
    if (f.type === 'chips' && f.opts.length <= 6 && !forWord) return f.opts.map((o) => `<span class="fd-opt ${o === v ? 'on' : ''}">${o === v ? '☑' : '☐'} ${esc(o)}</span>`).join('');
    if (f.type === 'chips') return esc(v || '—');
    return esc(v || '—').replace(/\n/g, '<br>');
  };
  const secs = F.sections(R, rec);
  const head = `<div class="fd-head"><div class="fd-brand">${logo ? `<img src="${logo}" alt="">` : ''}<div><b>${esc(D.settings.org.name)}</b><span>${esc(D.settings.org.dept)}</span></div></div><div class="fd-meta"><div><span>رقم النموذج</span><b>${esc((st && st.no) || '—')}</b></div><div><span>التاريخ</span><b>${st && st.at ? fmtDate(st.at.slice(0, 10)) + 'م' : '—'}</b></div></div></div>`;
  if (F.letter) {
    return `<article class="fdoc fletter" dir="rtl">${head}
      <div class="fl-to"><b>${esc(d.to1 || '')}</b><b>${esc(d.to2 || '')}</b><span>سلمه الله</span></div>
      <p class="fl-salam">السلام عليكم ورحمة الله وبركاته،</p>
      <p class="fl-sub"><b>الموضوع:</b> ${esc(d.subject || '')}</p>
      <div class="fl-body">${esc(d.body || '').replace(/\n/g, '<br>')}</div>
      <div class="fl-body">${esc(d.closing || '').replace(/\n/g, '<br>')}</div>
      <p class="fl-thanks">وتقبلوا معاليكم خالص تحياتي،</p>
      <div class="fl-sign"><b>${esc(d.signTitle || '')}</b><b>${esc(d.signName || '')}</b></div>
      ${d.atts ? `<p class="fl-atts"><b>المرفقات:</b> ${esc(d.atts)}</p>` : ''}
      <footer class="fd-foot">${esc(D.settings.org.name)} · ${esc(D.settings.org.platform)} · ${st && st.status === 'done' ? 'نسخة معتمدة' : 'مسودة'}</footer></article>`;
  }
  const body = secs.map((s) => {
    const simple = s.fields.filter((f) => !['checklist', 'scores', 'clauses'].includes(f.type) && !(f.type === 'textarea' && f.n));
    const numbered = s.fields.filter((f) => f.type === 'textarea' && f.n);
    let h = `<section class="fd-sec"><h3>${esc(s.t)}</h3>`;
    if (simple.length) h += `<table class="fd-kv">${simple.map((f) => `<tr><th>${esc(f.l)}</th><td>${cell(f)}</td></tr>`).join('')}</table>`;
    if (numbered.length) h += `<table class="fd-tbl"><thead><tr><th class="c">م</th><th>البند</th><th>الوصف</th></tr></thead><tbody>${numbered.map((f) => `<tr><td class="c">${f.n}</td><td class="lb">${esc(f.l)}</td><td>${esc(val(f) || '—').replace(/\n/g, '<br>')}</td></tr>`).join('')}</tbody></table>`;
    s.fields.filter((f) => f.type === 'checklist').forEach((f) => { const v = val(f) || {}; h += `<table class="fd-tbl"><thead><tr><th class="c">م</th><th>عنصر المراجعة</th>${f.opts.map(([, l]) => `<th class="c">${l}</th>`).join('')}<th>الملاحظات</th></tr></thead><tbody>${f.items.map((it, i) => `<tr><td class="c">${i + 1}</td><td>${esc(it)}</td>${f.opts.map(([k]) => `<td class="c tick">${(v[i] || {}).v === k ? '✓' : ''}</td>`).join('')}<td>${esc((v[i] || {}).n || '')}</td></tr>`).join('')}</tbody></table>`; });
    s.fields.filter((f) => f.type === 'scores').forEach((f) => { const v = val(f) || {}; const sc = evalScore(d); h += `<table class="fd-tbl"><thead><tr><th>المعيار</th><th class="c">الوزن</th><th class="c">التقييم (من 5)</th><th>ملاحظات</th></tr></thead><tbody>${f.items.map((c) => `<tr><td class="lb">${esc(c.l)}</td><td class="c">${c.w}%</td><td class="c"><b>${(v[c.k] || {}).v || '—'}</b></td><td>${esc((v[c.k] || {}).n || '')}</td></tr>`).join('')}<tr class="tot"><td>الدرجة الموزونة</td><td></td><td class="c"><b>${sc === null ? '—' : sc + '%'}</b></td><td>${sc === null ? '' : evalGrade(sc)}</td></tr></tbody></table>`; });
    s.fields.filter((f) => f.type === 'clauses').forEach((f) => { const v = val(f) || []; h += `<table class="fd-tbl"><thead><tr><th>البند</th><th class="c">الهدف الاستراتيجي المرتبط</th><th>ملاحظات</th></tr></thead><tbody>${v.map((r) => `<tr><td>${esc(r.text).replace(/\n/g, '<br>')}</td><td class="c"><b>${(r.goals || []).map(esc).join('، ')}</b></td><td>${esc(r.note || '')}</td></tr>`).join('')}</tbody></table>`; });
    if (s.legend) h += `<div class="fd-legend">${goalCodes().map((g) => `<p><b>${esc(g.k)}:</b> ${esc(g.t.replace(/^[A-Z]{1,3}\d?\s*[:：]\s*/, ''))}</p>`).join('')}</div>`;
    return h + '</section>';
  }).join('');
  return `<article class="fdoc" dir="rtl">${head}<h1 class="fd-title">${esc(F.title)}</h1>${body}
    <div class="fd-sigs"><div><span>أعدّه</span><b>${esc((st && st.by) || '')}</b><small>${esc((st && st.byDept) || '')}</small></div><div><span>الحالة</span><b>${st && st.status === 'done' ? 'مكتمل ومعتمد في المنظومة' : 'مسودة'}</b><small>${st && st.at ? fmtDT(st.at) : ''}</small></div></div>
    <footer class="fd-foot">${esc(D.settings.org.name)} · ${esc(D.settings.org.platform)} · ${esc(F.title)}</footer></article>`;
}
function printForm(kind, rec, key, evalIdx = null) {
  let host = $('#formPrint'); if (host) host.remove();
  host = document.createElement('div'); host.id = 'formPrint'; host.innerHTML = formDocHTML(kind, rec, key, evalIdx);
  document.body.appendChild(host);
  document.documentElement.classList.add('printing-form');
  const prev = document.title; document.title = `${FORMS[key].title} — ${fRecInfo(kind, rec).name}`;
  const done = () => { document.documentElement.classList.remove('printing-form'); host.remove(); document.title = prev; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 60);
}
function wordForm(kind, rec, key, evalIdx = null) {
  const css = `body{font-family:'Sakkal Majalla','Traditional Arabic',Arial;direction:rtl;font-size:14pt;color:#14201B}h1{font-size:18pt;color:#0F4433;text-align:center}h3{font-size:14pt;color:#0F4433;border-bottom:2px solid #A47C32;padding-bottom:4px;margin-top:18pt}table{border-collapse:collapse;width:100%;margin:6pt 0}th,td{border:1px solid #BFB6A2;padding:5pt 7pt;vertical-align:top;text-align:right}th{background:#F1EDE2}td.c,th.c{text-align:center}.fd-head{border-bottom:3px solid #0F4433;padding-bottom:6pt}.fd-head img{height:54px}.fd-meta span{color:#5C6861}.fd-opt{margin-left:10pt}.fl-to b{display:block}.fl-body{line-height:1.9;text-align:justify;margin:10pt 0}.fl-sign{text-align:left;margin-top:24pt}.fl-sign b{display:block}.fd-foot{color:#8C958E;font-size:9pt;border-top:1px solid #D7CFBC;margin-top:18pt;padding-top:4pt}.tot td{background:#E8EFEA;font-weight:bold}`;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(FORMS[key].title)}</title><style>${css}</style></head><body dir="rtl">${formDocHTML(kind, rec, key, evalIdx, true)}</body></html>`;
  download(`${FORMS[key].short || FORMS[key].title} — ${fRecInfo(kind, rec).name}.doc`, new Blob(['﻿' + html], { type: 'application/msword' }));
  toast('نُزّل النموذج بصيغة Word');
}

/* =====================================================================
   بطاقة الشراكة: التصنيف، ومن بدأ العلاقة، والقيمة، والأثر، والوضع المالي
   ===================================================================== */
const FIN_FIELDS = [
  { k: 'model', l: 'النموذج المالي للشراكة', type: 'chips', opts: () => L('financeModels') },
  { k: 'partnerSar', l: 'مساهمة الشريك المالية (ر.س)', type: 'number' },
  { k: 'murojSar', l: 'مساهمة المؤسسة المالية (ر.س)', type: 'number' },
  { k: 'inkindSar', l: 'القيمة العينية والمعرفية التقديرية (ر.س)', type: 'number' },
  { k: 'spentSar', l: 'المصروف حتى الآن (ر.س)', type: 'number' },
  { k: 'status', l: 'الوضع المالي', type: 'chips', opts: () => L('financeStatus') },
  { k: 'notes', l: 'ملاحظات مالية', type: 'textarea' },
];
function pProfile(p) {
  const pr = partnerById(p.partnerId) || {};
  const f = p.finance || {};
  const total = (+f.partnerSar || 0) + (+f.murojSar || 0) + (+f.inkindSar || 0);
  return { ptype: p.ptype || '', domain: pr.domain || '', origin: p.origin || '', originBy: p.originBy || '', valueTypes: p.valueTypes || [], impactLevel: p.impactLevel || '', fin: f, total, ev: lastEval(p) };
}
function profileSectionHTML(p) {
  const P = pProfile(p), f = P.fin, edit = can('edit.partnership');
  const ev = P.ev; const evs = (p.evals || []).filter((e) => e.status === 'done');
  const kv = (l, v, cls = '') => `<div class="${cls}"><dt>${esc(l)}</dt><dd>${v || '<span class="faint">لم يُحدَّد</span>'}</dd></div>`;
  const money = (x) => (x === 0 || x === '0' ? '0 ر.س' : x ? sar(x) : '');
  const fin = can('view.internal') || wfInvolved(p);
  const ring = (s) => { const r = 26, C = 2 * Math.PI * r; return `<svg viewBox="0 0 64 64" class="pf-ring ${evalTone(s)}" aria-hidden="true"><circle cx="32" cy="32" r="${r}" class="bg"/><circle cx="32" cy="32" r="${r}" class="v" stroke-dasharray="${(s / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle">${s}</text></svg>`; };
  return `<section class="dsec pf-sec" id="profile"><h2>التصنيف والقيمة والتقييم ${edit ? `<button class="btn sm" type="button" data-pfedit>${icon('edit')} تعديل</button>` : ''}</h2>
    <div class="pf-grid">
      <div class="pf-card"><h4>${icon('layers')} التصنيف</h4><dl class="kv pf-kv">${kv('تصنيف الشراكة', P.ptype ? `<span class="chip ${P.ptype.includes('استراتيجي') ? 'ok' : 'gold'}">${esc(P.ptype)}</span>` : '')}${kv('مجال عمل الجهة', esc(P.domain))}${kv('بداية العلاقة', esc(P.origin))}${kv('من فتح الباب', esc(P.originBy))}</dl></div>
      <div class="pf-card"><h4>${icon('star')} تقييم الشراكة</h4>${ev && ev.score !== null ? `<div class="pf-ev">${ring(ev.score)}<div><b>${evalGrade(ev.score)}</b><span>${esc(ev.data.period || '')} — ${esc(ev.data.rec || '')}</span><small>${esc(ev.no)} · ${esc(ev.by)}</small></div></div>
          ${evs.length > 1 ? `<div class="pf-hist">${evs.map((e, i) => { const s = evalScore(e.data); return `<button type="button" data-evview="${(p.evals || []).indexOf(e)}" title="${esc(e.data.period)}"><i style="height:${s}%" class="${evalTone(s)}"></i><span>${s}</span></button>`; }).join('')}</div>` : ''}
          <div class="pf-acts"><button class="btn sm ghost" type="button" data-evview="${(p.evals || []).indexOf(evs.find((e) => e.id === ev.id))}">${icon('file')} عرض النموذج</button>${edit ? `<button class="btn sm" type="button" data-evnew>${icon('plus')} تقييم جديد</button>` : ''}</div>`
        : `<p class="muted small">لم تُقيَّم الشراكة بعد. يُقيَّم أداء الشراكة دوريًا بستة معايير موزونة.</p>${edit ? `<button class="btn sm primary" type="button" data-evnew>${icon('star')} تعبئة نموذج تقييم الشراكة</button>` : ''}`}</div>
      <div class="pf-card"><h4>${icon('award')} القيمة والأثر</h4><dl class="kv pf-kv">${kv('نوع القيمة', (P.valueTypes || []).map((v) => `<span class="chip plain">${esc(v)}</span>`).join(' '))}${kv('القيمة الإجمالية التقديرية', P.total ? `<b class="num">${sar(P.total)}</b>` : '')}${kv('مستوى الأثر', P.impactLevel ? `<span class="chip ${P.impactLevel === 'مرتفع' ? 'ok' : P.impactLevel === 'متوسط' ? 'gold' : ''}">${esc(P.impactLevel)}</span>` : (ev ? esc(ev.data.impactLevel) : ''))}${kv('الأثر', esc((ev && ev.data.impact) || firstItem(p.expectedImpact)), 'full')}</dl></div>
      ${fin ? `<div class="pf-card"><h4>${icon('chart')} الوضع المالي</h4><dl class="kv pf-kv">${kv('النموذج المالي', esc(f.model))}${kv('الوضع', f.status ? `<span class="chip ${f.status === 'متأخر' ? 'danger' : f.status === 'مكتمل' ? 'ok' : ''}">${esc(f.status)}</span>` : '')}${kv('مساهمة الشريك', money(f.partnerSar))}${kv('مساهمة المؤسسة', money(f.murojSar))}${kv('القيمة العينية والمعرفية', money(f.inkindSar))}${kv('المصروف حتى الآن', money(f.spentSar))}</dl>
        ${(+f.partnerSar || 0) + (+f.murojSar || 0) ? `<div class="pf-spend"><i style="width:${Math.min(100, Math.round((+f.spentSar || 0) / ((+f.partnerSar || 0) + (+f.murojSar || 0)) * 100))}%"></i></div><small class="faint">نسبة الصرف من الالتزامات المالية</small>` : ''}</div>` : ''}
    </div></section>`;
}
function profileDialog(p, onDone) {
  const P = pProfile(p);
  const fields = [
    { k: 'ptype', l: 'تصنيف الشراكة', type: 'chips', opts: L('partnerTypes') },
    { k: 'domain', l: 'مجال عمل الجهة', type: 'chips', opts: L('domains') },
    { k: 'origin', l: 'كيف بدأت العلاقة', type: 'chips', opts: L('originTypes') },
    { k: 'originBy', l: 'من بدأ العلاقة أو فتح الباب', type: 'text' },
    { k: 'valueTypes', l: 'نوع القيمة', type: 'multi', opts: L('valueTypes') },
    { k: 'impactLevel', l: 'مستوى الأثر', type: 'chips', opts: ['مرتفع', 'متوسط', 'منخفض', 'لم يظهر بعد'] },
  ];
  const ff = FIN_FIELDS.map((f) => ({ ...f, opts: typeof f.opts === 'function' ? f.opts() : f.opts }));
  const vals = { ...P, ...(p.finance || {}) };
  const m = Modal.open({
    title: 'التصنيف والقيمة والوضع المالي', size: 'lg', cls: 'ff-modal',
    body: `<section class="ff-sec"><h4>التصنيف ومن بدأ العلاقة</h4><div class="ff-grid">${fields.map((f) => fFieldHTML(f, vals[f.k])).join('')}</div></section>
      <section class="ff-sec"><h4>الوضع المالي للشراكة</h4><div class="ff-grid">${ff.map((f) => fFieldHTML(f, vals[f.k])).join('')}</div></section>`,
    foot: `<button class="btn primary" data-ok type="button">${icon('check')} حفظ</button><button class="btn ghost" data-mclose type="button">إلغاء</button>`,
  });
  m.el.addEventListener('click', async (e) => {
    const ch = e.target.closest('.ff-chip'); if (ch) { const grp = ch.closest('[data-fk]'); const f = [...fields, ...ff].find((x) => x.k === grp.dataset.fk); if (f.type === 'multi') ch.classList.toggle('on'); else { const was = ch.classList.contains('on'); $$('.ff-chip', grp).forEach((b) => b.classList.remove('on')); if (!was) ch.classList.add('on'); } return; }
    if (!e.target.closest('[data-ok]')) return;
    const r = (f) => fReadField(m.el, f);
    Object.assign(p, { ptype: r(fields[0]), origin: r(fields[2]), originBy: r(fields[3]), valueTypes: r(fields[4]), impactLevel: r(fields[5]) });
    p.finance = Object.fromEntries(ff.map((f) => [f.k, f.type === 'number' ? (r(f) === '' ? '' : +r(f)) : r(f)]));
    const pr = partnerById(p.partnerId); if (pr) { pr.domain = r(fields[1]); await Repo.save('partners', pr); }
    await Repo.save('partnerships', p);
    await Repo.log('partnership.update', 'partnership', p.id, p.code, 'تحديث التصنيف والقيمة والوضع المالي');
    toast('حُفظ'); m.close(); onDone && onDone();
  });
}
function bindProfile(el, p) {
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-pfedit]')) { e.stopPropagation(); return profileDialog(p, () => route()); }
    if (e.target.closest('[data-evnew]')) { e.stopPropagation(); return openForm('partnership', p, 'partnershipEval', { onDone: () => route() }); }
    const v = e.target.closest('[data-evview]'); if (v) { e.stopPropagation(); return openForm('partnership', p, 'partnershipEval', { ro: !can('edit.partnership'), evalIdx: +v.dataset.evview, onDone: () => route() }); }
  }, true);
}
