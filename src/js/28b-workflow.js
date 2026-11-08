/* =====================================================================
   مسار الشراكة الجديدة (المعتمد من إدارة الشراكات)
   من طلب الشراكة إلى تقارير تفعيل المذكرة: ثلاث عشرة خطوة (WF_STEPS)، لكل خطوة جهة مسؤولة
   ومستندات مطلوبة. الصلاحيات تُبنى على هذا المسار: كل حساب إدارة يرى ما يخصه
   وينفّذ الخطوات المسندة إليه فقط.
   ===================================================================== */
const WF_KEYS = {
  partnerships: 'إدارة الشراكات',
  strategy: 'الإدارة الاستراتيجية',
  legal: 'الإدارة القانونية',
  excellency: 'مكتب المعالي',
  bizdev: 'إدارة تطوير الأعمال',
};
/* جهات خارج المنصة: لا حساب لها، والتواصل معها بخطاب، وتسجّل إدارة الشراكات ردها بإرفاق الخطاب */
const WF_EXTERNAL = ['excellency'];
const wfExternal = (a) => WF_EXTERNAL.includes(a);
const WF_DEPT_DEFAULTS = { strategy: 'الإدارة العامة للاستراتيجية', legal: 'الإدارة القانونية', excellency: 'مكتب المعالي', bizdev: 'إدارة تطوير الأعمال' };
const wfDept = (k) => (k === 'partnerships' ? D.settings.org.dept : ((D.settings.wfDepts || {})[k] || WF_DEPT_DEFAULTS[k]));
const WF_CAT = 'مستندات مسار المذكرة';

const WF_PHASES = [
  { id: 'req', t: 'الطلب والتقييم' },
  { id: 'build', t: 'الاجتماع وبناء المذكرة' },
  { id: 'rev', t: 'مراجعة المذكرة' },
  { id: 'sign', t: 'الاعتماد والتوقيع' },
  { id: 'act', t: 'التفعيل' },
];
/* actor: من ينفّذ الخطوة. requester = الإدارة الطالبة، concerned = الإدارات المعنية بالشراكة
   ref: رقم البند في إجراء المذكرات المعتمد (١–١١) */
const WF_STEPS = [
  { id: 'request', n: 1, ph: 'req', on: 'proposal', actor: 'requester', t: 'استلام طلب الشراكة أو المقترح', d: 'تقدّم الإدارة الطالبة المقترح عبر خدمة «شارك»، فيصل إلى إدارة الشراكات برقم مرجعي.', docs: [], auto: true },
  { id: 'method', n: 2, ref: 1, ph: 'req', on: 'proposal', actor: 'partnerships', t: 'منهجية بناء الشراكات', d: 'تطبيق منهجية بناء الشراكات على الطلب وتوثيقها.', docs: [{ k: 'methodology', l: 'نموذج منهجية بناء الشراكات', req: true, form: 'methodology' }] },
  { id: 'eval', n: 3, ref: 2, ph: 'req', on: 'proposal', actor: 'partnerships', kind: 'decision', t: 'التقييم المبدئي للشريك', d: 'تدرس إدارة الشراكات الجهة وتقرر إن كانت مناسبة. الجهة غير المناسبة يُغلق طلبها مع ذكر السبب.', docs: [{ k: 'evaluation', l: 'نموذج التقييم المبدئي للشريك', req: true, form: 'initialEval' }], yes: 'الجهة مناسبة', yesShort: 'مناسبة', no: 'الجهة غير مناسبة' },
  { id: 'meeting', n: 4, ph: 'build', on: 'partnership', actor: 'partnerships', t: 'الاجتماع المبدئي التعريفي', d: 'اجتماع تعريفي بين الطرفين بحضور الإدارة الطالبة والإدارات المساندة، ويُحدَّد فيه التقاطع الاستراتيجي.', docs: [{ k: 'minutes', l: 'محضر الاجتماع', req: false }], fields: ['date', 'attendees', 'intersection'] },
  { id: 'draft', n: 5, ref: 3, ph: 'build', on: 'partnership', actor: 'partnerships', t: 'تحديد سبل التعاون وبناء مسودة المذكرة', d: 'تحديد سبل التعاون بين الطرفين، وبناء مسودة مذكرة التعاون على النموذج المعتمد.', docs: [{ k: 'draft', l: 'مسودة مذكرة التعاون المعتمدة', req: true }], fields: ['coop'] },
  { id: 'depts', n: 6, ref: 4, ph: 'rev', on: 'partnership', actor: 'concerned', kind: 'multi', t: 'مشاركة المذكرة مع الإدارات المعنية', d: 'ترسل إدارة الشراكات المسودة للإدارات المعنية، وتسجل كل إدارة ملاحظاتها من حسابها. تُغلق الخطوة عند ورود الملاحظات أو باعتماد إدارة الشراكات.', docs: [{ k: 'deptNotes', l: 'ملاحظات الإدارة', req: false }] },
  { id: 'strategy', n: 7, ref: 5, ph: 'rev', on: 'partnership', actor: 'strategy', kind: 'review', back: 'draft', backLabel: 'إعادة بملاحظات', t: 'المواءمة الاستراتيجية', d: 'تراجع الإدارة الاستراتيجية المذكرة وتعبئ نموذج المواءمة: ربط كل بند بالأهداف الاستراتيجية (SO1–SO4، EO)، ثم تعتمدها أو تعيدها بملاحظات.', docs: [{ k: 'alignment', l: 'نموذج المواءمة الاستراتيجية', req: true, form: 'alignment' }] },
  { id: 'partner', n: 8, ref: 6, ph: 'rev', on: 'partnership', actor: 'partnerships', t: 'مشاركة المذكرة مع الشريك', d: 'ترسل إدارة الشراكات المذكرة للجهة الشريكة، وترفع النسخة بعد ملاحظات الشريك.', docs: [{ k: 'partnerVersion', l: 'المذكرة بعد ملاحظات الشريك', req: true }] },
  { id: 'legal', n: 9, ref: 7, ph: 'sign', on: 'partnership', actor: 'legal', kind: 'review', t: 'اعتماد القانونية وخطاب طلب موافقة المعالي', d: 'تعد إدارة الشراكات خطاب طلب موافقة معالي رئيس مجلس الأمناء (يُولَّد من بيانات الشراكة)، وتراجعه الإدارة القانونية بنموذج مراجعة الخطابات وتعتمده.', docs: [{ k: 'letter', l: 'خطاب طلب موافقة المعالي', req: true, by: 'partnerships', form: 'letter' }, { k: 'legalReview', l: 'نموذج مراجعة الخطابات', req: true, form: 'letterReview' }] },
  { id: 'excellency', n: 10, ref: 8, ph: 'sign', on: 'partnership', actor: 'excellency', kind: 'review', t: 'رفع المعاملة للمعالي', d: 'ترفع إدارة الشراكات المعاملة كاملة إلى مكتب المعالي بخطاب، ثم تسجّل رد المعالي بإرفاق خطاب الرد: موافقة، أو إعادة بملاحظات، أو رفض. لا يوجد حساب لمكتب المعالي في المنصة.', via: 'letter', docs: [{ k: 'transaction', l: 'المعاملة كاملة', req: true, by: 'partnerships' }, { k: 'approvalLetter', l: 'خطاب رد المعالي', req: true, by: 'partnerships' }], yes: 'موافقة المعالي', yesShort: 'موافقة', no: 'إعادة المعاملة', back: 'legal', final: true, reject: 'رفض المعاملة' },
  { id: 'signed', n: 11, ref: 9, ph: 'sign', on: 'partnership', actor: 'partnerships', t: 'توقيع المذكرة بين الطرفين', d: 'رفع المذكرة الموقعة وتسجيل تاريخي البدء والانتهاء؛ فتصبح الشراكة «موقّعة» ويبدأ حساب سريانها.', docs: [{ k: 'signedMoU', l: 'المذكرة الموقعة بين الطرفين', req: true }], fields: ['dates'] },
  { id: 'bizdev', n: 12, ref: 10, ph: 'act', on: 'partnership', actor: 'bizdev', t: 'خطة تفعيل المذكرة مع إدارة تطوير الأعمال', d: 'تعمل إدارة تطوير الأعمال مع إدارة الشراكات على المبادرات المقترحة أو خطة تفعيل المذكرة.', docs: [{ k: 'activationPlan', l: 'نموذج المبادرات المقترحة أو خطة تفعيل المذكرة', req: true }] },
  { id: 'reports', n: 13, ref: 11, ph: 'act', on: 'partnership', actor: 'concerned', kind: 'multi', ongoing: true, t: 'تقارير تفعيل المذكرة من الإدارات', d: 'ترفع كل إدارة مفعّلة للمذكرة تقرير التفعيل من حسابها. أول تقرير يجعل حالة التفعيل «مفعّلة».', docs: [{ k: 'activationReport', l: 'تقرير تفعيل المذكرة', req: true }] },
];
/* الترقيم يُحسب من الترتيب: إضافة خطوة أو حذفها يعيد ترقيم المسار في كل الشاشات */
WF_STEPS.forEach((s, i) => { s.n = i + 1; });
const wfStep = (id) => WF_STEPS.find((s) => s.id === id);
/* وصف الخطوة: من الإعدادات إن وُجد، وإلا من تعريف المسار */
const wfDesc = (s) => ((D.settings && D.settings.wfText) || {})[s.id] || s.d;
const wfFinal = () => WF_STEPS.find((s) => s.final) || [...WF_STEPS].reverse().find((s) => s.kind === 'review') || null;
const wfPhaseIdx = (s) => WF_PHASES.findIndex((p) => p.id === s.ph);
/* المسارات البديلة المستخرجة من التعريف: الإغلاق عند القرار السلبي، والإعادة، والرفض النهائي */
function wfBranches() {
  const out = [];
  WF_STEPS.forEach((s) => {
    if (s.kind === 'decision') out.push({ from: s.id, to: 'closed', label: s.no || 'غير مناسبة', type: 'close' });
    if (s.back && wfStep(s.back)) out.push({ from: s.id, to: s.back, label: s.backLabel || s.no || 'إعادة بملاحظات', type: 'back' });
    if (s.reject) out.push({ from: s.id, to: 'closed', label: s.reject, type: 'reject' });
  });
  return out;
}
const wfIsClosed = (S, list) => (list || WF_STEPS).some((s) => S[s.id] && S[s.id].status === 'done' && ((s.kind === 'decision' && S[s.id].decision === 'no') || S[s.id].decision === 'reject'));
const WF_ACTOR_LABEL = { requester: 'الإدارة الطالبة', partnerships: 'إدارة الشراكات', concerned: 'الإدارات المعنية', strategy: 'الإدارة الاستراتيجية', legal: 'الإدارة القانونية', excellency: 'مكتب المعالي', bizdev: 'إدارة تطوير الأعمال' };
const wfActorName = (a) => (['requester', 'concerned'].includes(a) ? WF_ACTOR_LABEL[a] : wfDept(a) || WF_ACTOR_LABEL[a]);

/* — الحالة: من المحفوظ، أو مستنتجة للسجلات السابقة لاعتماد المسار — */
function wfReqDept(p) { const x = p.proposalId && D.proposals.find((y) => y.id === p.proposalId); return (x && x.department) || p.requesterDept || ''; }
function wfConcerned(p) { const own = D.settings.org.dept; return [...new Set([wfReqDept(p), ...(p.departments || [])].filter((d) => d && d !== own))]; }
function wfLegacyIdx(p) {
  if (p.stage === 'signed') return 11 + (['قيد التفعيل', 'مفعّلة'].includes(p.activation) ? 1 : 0) + (p.activation === 'مفعّلة' ? 1 : 0);
  if (p.stage === 'sign') return 8;
  return 3;
}
function wfStateOf(kind, rec) {
  const saved = (rec.wf && rec.wf.steps) || {};
  const S = {};
  if (kind === 'proposal') {
    if (rec.status !== 'draft') S.request = { status: 'done', at: rec.submittedAt, by: rec.requesterName || rec.department };
    Object.assign(S, clone(saved));
    if (rec.status === 'rejected' && !S.eval) S.eval = { status: 'done', decision: 'no', legacy: true };
    if (['accepted', 'converted'].includes(rec.status) && !S.eval) { S.method = S.method || { status: 'done', legacy: true }; S.eval = { status: 'done', decision: 'yes', legacy: true }; }
  } else {
    const prop = rec.proposalId && D.proposals.find((y) => y.id === rec.proposalId);
    if (prop) Object.assign(S, wfStateOf('proposal', prop));
    const legacy = rec.wf ? 3 : wfLegacyIdx(rec);
    WF_STEPS.forEach((s) => { if (s.n <= legacy && !S[s.id]) S[s.id] = { status: 'done', legacy: true }; });
    Object.assign(S, clone(saved));
  }
  const list = WF_STEPS.filter((s) => (kind === 'proposal' ? s.on === 'proposal' : true));
  const closed = wfIsClosed(S, list);
  const cur = closed ? null : list.find((s) => !(S[s.id] && S[s.id].status === 'done'));
  return { S, cur: cur || null, closed, list };
}
function wfForm(kind, rec, key) {
  const f = (rec.forms || {})[key];
  if (f || kind !== 'partnership' || !rec.proposalId) return f || null;
  const x = D.proposals.find((y) => y.id === rec.proposalId); return (x && (x.forms || {})[key]) || null;
}
const wfDocOk = (kind, rec, d, docs) => docs.some((a) => a.doc === d.k) || (d.form && ((wfForm(kind, rec, d.form) || {}).status === 'done'));
function wfDocsOf(kind, rec, stepId) {
  const own = (rec.attachments || []).filter((a) => a.wf === stepId);
  if (kind === 'partnership' && rec.proposalId) { const x = D.proposals.find((y) => y.id === rec.proposalId); if (x) own.push(...(x.attachments || []).filter((a) => a.wf === stepId && !own.some((o) => o.fileId === a.fileId))); }
  return own;
}

/* — الصلاحية على خطوة: من الحساب الحالي — */
function wfWho() { return { role: Session.role(), dept: Session.dept() }; }
function wfCan(step, kind, rec, actorOverride) {
  const { role, dept } = wfWho();
  const a = actorOverride || step.actor;
  if (role === 'viewer') return false;
  if (a === 'partnerships' || wfExternal(a)) return ['admin', 'team'].includes(role); // الجهات الخارجية: تسجّل إدارة الشراكات ردها
  if (role === 'admin') return true; // مدير المنصة ينفّذ نيابة عن أي جهة، ويُسجل ذلك
  if (role !== 'dept') return false;
  if (a === 'requester') return kind === 'proposal' ? rec.department === dept : wfReqDept(rec) === dept;
  if (a === 'concerned') return kind === 'partnership' && wfConcerned(rec).includes(dept);
  return wfDept(a) === dept;
}
/* هل للحساب علاقة بالشراكة فيرى مستنداتها ومسارها؟ */
function wfInvolved(p) {
  const { role, dept } = wfWho();
  if (['admin', 'team', 'viewer'].includes(role)) return true;
  return wfConcerned(p).includes(dept) || ['strategy', 'legal', 'bizdev'].some((k) => wfDept(k) === dept);
}

/* — المهام: ما ينتظر الحساب الحالي — */
function wfTasks() {
  const out = [];
  const role = Session.role(); if (role === 'viewer') return out;
  visibleProposals().filter((x) => ['submitted', 'review', 'info'].includes(x.status) && (!x.demo || showDemo())).forEach((x) => {
    const st = wfStateOf('proposal', x);
    if (st.cur && st.cur.id !== 'request' && wfCan(st.cur, 'proposal', x) && x.status !== 'info') out.push({ kind: 'proposal', rec: x, step: st.cur, since: x.updatedAt || x.submittedAt, href: '#/proposals/' + x.id, name: x.partnerName, sub: x.ref + ' — ' + x.department });
  });
  if (can('proposal.review')) visibleProposals().filter((x) => x.status === 'accepted' && (!x.demo || showDemo())).forEach((x) => out.push({ kind: 'proposal', rec: x, step: { id: 'convert', n: 4, t: 'تحويل المقترح إلى سجل شراكة وبدء الاجتماع التعريفي' }, since: x.updatedAt, href: '#/proposals/' + x.id, name: x.partnerName, sub: x.ref + ' — الجهة مناسبة' }));
  D.partnerships.filter((p) => !p.isDraft && !['cancel', 'hold'].includes(p.stage) && (showDemo() || !p.demo)).forEach((p) => {
    const st = wfStateOf('partnership', p); const s = st.cur;
    if (!s) return;
    const mine = s.kind === 'multi' ? wfCan(s, 'partnership', p) && !(st.S[s.id] && st.S[s.id].depts && st.S[s.id].depts[Session.dept()]) && Session.role() === 'dept' : wfCan(s, 'partnership', p);
    // إدارة الشراكات تتابع الخطوات المتعددة وتغلقها، وترفع مستندات خطوات الاعتماد
    const team = ['admin', 'team'].includes(role) && (s.kind === 'multi' || (s.kind === 'review' && s.docs.some((d) => d.by === 'partnerships' && !wfDocOk('partnership', p, d, wfDocsOf('partnership', p, s.id)))));
    if (mine || team) out.push({ kind: 'partnership', rec: p, step: s, since: (st.S[s.id] && st.S[s.id].at) || p.updatedAt, href: '#/partnerships/' + p.id + '?wf=1', name: partnerName(p), sub: (p.code || '') + (team && !mine ? ' — للمتابعة' : ''), follow: team && !mine, returned: st.S[s.id] && st.S[s.id].status === 'returned' });
  });
  return out.sort((a, b) => (a.returned === b.returned ? ((a.since || '') < (b.since || '') ? -1 : 1) : a.returned ? -1 : 1));
}

/* — عرض المسار داخل صفحة المقترح أو الشراكة — */
function wfSectionHTML(kind, rec) {
  if (kind === 'partnership' && !wfInvolved(rec)) return '';
  const st = wfStateOf(kind, rec);
  const steps = WF_STEPS;
  const doneN = steps.filter((s) => st.S[s.id] && st.S[s.id].status === 'done').length;
  const pct = Math.round(doneN / steps.length * 100);
  const curTxt = st.closed ? (Object.values(st.S).some((x) => x && x.decision === 'reject') ? 'أُغلقت المعاملة: رُفضت في الاعتماد النهائي' : 'أُغلق الطلب: الجهة غير مناسبة') : st.cur ? `الخطوة ${st.cur.n}: ${st.cur.t} — لدى ${wfActorName(st.cur.actor)}` : 'اكتمل المسار';
  const phases = WF_PHASES.map((ph) => ({ ph, steps: steps.filter((s) => s.ph === ph.id) }));
  const row = (s) => {
    const r = st.S[s.id] || {}, done = r.status === 'done', cur = st.cur && st.cur.id === s.id, ret = r.status === 'returned';
    const lock = kind === 'proposal' && s.on === 'partnership';
    const docs = wfDocsOf(kind, rec, s.id);
    const can = cur && !lock && wfCan(s, kind, rec);
    const multi = s.kind === 'multi' && r.depts ? Object.keys(r.depts).length : 0;
    const need = s.kind === 'multi' && kind === 'partnership' ? wfConcerned(rec).length : 0;
    return `<li class="wf-s ${done ? 'done' : ''} ${cur ? 'cur' : ''} ${ret ? 'ret' : ''} ${lock ? 'lock' : ''} ${r.decision === 'no' || r.decision === 'reject' ? 'neg' : ''}" data-wfs="${s.id}">
      <span class="wf-dot">${done ? icon(r.decision === 'no' || r.decision === 'reject' ? 'x' : 'check') : s.n}</span>
      <div class="wf-b"><div class="wf-h"><b>${esc(s.t)}</b>${s.ref ? `<span class="wf-ref" title="رقم البند في إجراء المذكرات">البند ${s.ref}</span>` : ''}</div>
        <div class="wf-m"><span class="wf-who">${icon('users')}${esc(wfActorName(s.actor))}</span>
          ${done ? `<span>${r.direct ? `تُجووزت بالتسجيل المباشر${r.at ? ' — ' + fmtDT(r.at) : ''}` : r.legacy ? 'مكتملة قبل اعتماد المسار في المنصة' : `${r.decision === 'no' ? (s.no || 'غير مناسبة') : r.decision === 'reject' ? s.reject : r.decision === 'yes' && s.yes ? s.yes : 'اكتملت'} ${r.at ? '— ' + fmtDT(r.at) : ''}${r.by ? ' — ' + esc(r.by) : ''}`}</span>` : cur ? `<span class="wf-now">${ret ? 'أُعيدت بملاحظات' : lock ? '' : 'الخطوة الحالية'}</span>` : lock ? '<span>بعد التحويل إلى شراكة</span>' : ''}
          ${s.kind === 'multi' && kind === 'partnership' && (cur || done) ? `<span class="wf-multi">${multi} من ${need} ${s.id === 'reports' ? 'تقارير' : 'إدارات'}</span>` : ''}</div>
        ${ret && r.note ? `<div class="wf-note">${icon('msg')}${esc(r.note)}</div>` : ''}
        ${(() => { const fs = s.docs.filter((d) => d.form && wfForm(kind, rec, d.form)); return fs.length ? `<div class="wf-docs">${fs.map((d) => { const f = wfForm(kind, rec, d.form); return `<button type="button" class="wf-doc form ${f.status}" data-wfform="${d.form}" title="${esc(FORMS[d.form].title)}">${icon(f.status === 'done' ? 'check' : 'edit')}<span>${esc(FORMS[d.form].short || FORMS[d.form].title)}</span><small>${esc(f.no || '')}${f.status === 'done' ? '' : ' — مسودة'}</small></button>`; }).join('')}</div>` : ''; })()}
        ${docs.length ? `<div class="wf-docs">${docs.map((a) => `<button type="button" class="wf-doc" data-wfview="${esc(a.fileId)}" title="${esc(a.name)}">${icon('file')}<span>${esc((s.docs.find((d) => d.k === a.doc) || {}).l || a.name)}</span>${a.byDept ? `<small>${esc(a.byDept)}</small>` : ''}</button>`).join('')}</div>` : ''}
      </div>
      ${can ? `<button class="btn sm ${ret ? 'gold' : 'primary'} wf-go" type="button" data-wfopen="${s.id}">${s.kind === 'review' ? 'مراجعة واعتماد' : s.kind === 'decision' ? 'التقييم والقرار' : s.kind === 'multi' ? (Session.role() === 'dept' ? (s.id === 'reports' ? 'رفع تقرير التفعيل' : 'تسجيل ملاحظات إدارتكم') : 'متابعة الإدارات') : 'تنفيذ الخطوة'}</button>`
        : cur && !lock && ['admin', 'team'].includes(Session.role()) && s.kind === 'review' ? `<button class="btn sm wf-go" type="button" data-wfopen="${s.id}">${icon('upload')} المستندات</button>`
        : ((done && !r.legacy) || (s.ongoing && done)) && !s.auto ? `<button class="btn sm ghost wf-go" type="button" data-wfopen="${s.id}">التفاصيل</button>` : ''}
    </li>`;
  };
  return `<section class="dsec wf-sec" id="wf"><h2>مسار ${kind === 'proposal' ? 'الطلب' : 'المذكرة'} <span class="src">الإجراء المعتمد لشراكة جديدة</span></h2>
    <div class="wf-top"><div class="wf-bar"><i style="width:${pct}%"></i></div><div class="wf-cur ${st.closed ? 'neg' : ''}"><b>${doneN} من ${steps.length}</b><span>${esc(curTxt)}</span></div></div>
    ${wfNextHTML(kind, rec, st)}
    <div class="wf-phases">${phases.map(({ ph, steps: ss }) => { const all = ss.length && ss.every((s) => st.S[s.id] && st.S[s.id].status === 'done'); const curP = st.cur && ss.includes(st.cur); const lockP = kind === 'proposal' && ss.every((s) => s.on === 'partnership'); return `<div class="wf-ph ${all ? 'done' : curP ? 'cur' : ''} ${lockP ? 'lockp' : ''}"><h4 class="wf-ph-h"><em>${all ? icon('check') : pad(WF_PHASES.indexOf(ph) + 1)}</em><span>${ph.t}</span><small>${ss.filter((s) => st.S[s.id] && st.S[s.id].status === 'done').length}/${ss.length}</small></h4><ol class="wf-list">${ss.map(row).join('')}</ol></div>`; }).join('')}</div></section>`;
}

/* — نافذة تنفيذ الخطوة — */
function wfStepDialog(kind, rec, sid, rerender) {
  const s = wfStep(sid); const st = wfStateOf(kind, rec); const r = st.S[sid] || {};
  const isCur = st.cur && st.cur.id === sid;
  const canAct = isCur && wfCan(s, kind, rec);
  const teamUp = isCur && ['admin', 'team'].includes(Session.role());
  const myDept = Session.dept(), role = Session.role();
  const docs = wfDocsOf(kind, rec, sid);
  const tpl = (k) => (D.settings.wfTemplates || {})[k];
  // من يرفع كل مستند: المنفّذ، أو إدارة الشراكات لمستندات «by: partnerships»
  const canUp = (d) => (d.by === 'partnerships' ? teamUp : canAct);
  const P = kind === 'partnership' ? rec : null;
  const f = r.fields || {};
  const concerned = P ? wfConcerned(P) : [];
  const multiRows = s.kind === 'multi' && P ? concerned.map((d) => { const x = (r.depts || {})[d]; return `<li class="${x ? 'ok' : ''}">${icon(x ? 'check' : 'clock')}<b>${esc(d)}</b><span>${x ? `${fmtDT(x.at)}${x.note ? ' — ' + esc(x.note) : ''}` : 'لم ترد بعد'}</span></li>`; }).join('') : '';
  const fieldsHTML = (s.fields || []).map((k) => ({
    date: `<div class="field"><label>تاريخ الاجتماع</label><input class="in" type="date" id="wfDate" value="${esc(f.date || '')}" ${canAct ? '' : 'disabled'}></div>`,
    attendees: `<div class="field"><label>الحضور: الإدارة الطالبة والإدارات المساندة</label><div class="wf-chks">${L('departments').map((d) => `<label class="check"><input type="checkbox" name="wfAtt" value="${esc(d)}" ${(f.attendees || (P ? [D.settings.org.dept, ...wfConcerned(P)] : [])).includes(d) ? 'checked' : ''} ${canAct ? '' : 'disabled'}> ${esc(d)}</label>`).join('')}</div></div>`,
    intersection: `<div class="field"><label>التقاطع الاستراتيجي</label><textarea class="in" id="wfInt" rows="3" ${canAct ? '' : 'disabled'} placeholder="الأهداف الاستراتيجية المشتركة التي تخدمها الشراكة">${esc(f.intersection || '')}</textarea></div>`,
    coop: `<div class="field"><label>سبل التعاون بين الطرفين</label><textarea class="in" id="wfCoop" rows="4" ${canAct ? '' : 'disabled'} placeholder="1. ...&#10;2. ...">${esc(f.coop || (P && P.cooperationAreas) || '')}</textarea><span class="hint">تُنسخ إلى «مجالات التعاون» في سجل الشراكة.</span></div>`,
    dates: `<div class="grid2"><div class="field"><label>تاريخ بدء الشراكة</label><input class="in" type="date" id="wfStart" value="${esc((P && P.startDate) || '')}" ${canAct ? '' : 'disabled'}></div><div class="field"><label>تاريخ انتهاء الشراكة</label><input class="in" type="date" id="wfEnd" value="${esc((P && P.endDate) || '')}" ${canAct ? '' : 'disabled'}></div></div>`,
  }[k])).join('');
  const docRow = (d) => {
    const have = docs.filter((a) => a.doc === d.k);
    const up = canUp(d) && !(s.kind === 'multi' && role !== 'dept');
    const fm = d.form ? wfForm(kind, rec, d.form) : null;
    const formBtns = d.form ? `<div class="wf-form">${fm ? `<span class="chip ${fm.status === 'done' ? 'ok' : 'gold'}">${icon(fm.status === 'done' ? 'check' : 'edit')} ${fm.status === 'done' ? 'مكتمل في المنظومة' : 'مسودة'} · ${esc(fm.no || '')}</span>` : ''}
        ${up ? `<button type="button" class="btn sm ${fm && fm.status === 'done' ? '' : 'primary'}" data-wffill="${d.form}">${icon(fm ? 'edit' : 'file')} ${fm ? (fm.status === 'done' ? 'تعديل النموذج' : 'متابعة التعبئة') : 'تعبئة النموذج في المنظومة'}</button>` : ''}
        ${fm ? `<button type="button" class="btn sm ghost" data-wfformview="${d.form}">${icon('eye')} عرض</button><button type="button" class="btn sm ghost" data-wfformprint="${d.form}">${icon('print')}</button>` : ''}</div>` : '';
    return `<div class="wf-dr ${have.length ? 'ok' : ''}"><div class="wf-dr-h">${icon(have.length ? 'check' : 'file')}<b>${esc(d.l)}</b>${d.req ? '<span class="wf-req">مطلوب</span>' : '<span class="wf-opt">اختياري</span>'}${d.by === 'partnerships' ? '<small>ترفعه إدارة الشراكات</small>' : ''}
        ${tpl(d.k) ? `<button type="button" class="linkbtn" data-wftpl="${esc(tpl(d.k))}">${icon('download')} النموذج الفارغ</button>` : ''}</div>
      ${formBtns}
      ${have.length ? `<div class="wf-dr-f">${have.map((a) => `<button type="button" class="wf-doc" data-wfview="${esc(a.fileId)}">${icon('file')}<span>${esc(a.name)}</span><small>${esc(a.byDept || '')} ${fmtDT(a.addedAt)}</small></button>`).join('')}</div>` : ''}
      ${up ? `<label class="drop sm" data-wfdrop="${d.k}"><input type="file" hidden data-wfup="${d.k}">${icon('upload')}<span>${have.length ? 'رفع نسخة محدّثة' : d.form ? 'أو ارفع النموذج ملفًا موقّعًا' : 'اختر الملف أو اسحبه هنا'}</span></label>` : ''}</div>`;
  };
  const acts = [];
  if (canAct) {
    if (s.kind === 'decision' || (s.kind === 'review' && s.yes)) { acts.push(`<button class="btn primary" data-wfdo="yes" type="button">${icon('check')} ${esc(s.yes || 'اعتماد')}</button>`, `<button class="btn ${s.kind === 'decision' ? 'danger' : ''}" data-wfdo="no" type="button">${esc(s.no || 'إعادة بملاحظات')}</button>`); if (s.reject && s.kind === 'review') acts.push(`<button class="btn danger" data-wfdo="reject" type="button">${esc(s.reject)}</button>`); }
    else if (s.kind === 'review') acts.push(`<button class="btn primary" data-wfdo="yes" type="button">${icon('check')} اعتماد</button>`, `<button class="btn" data-wfdo="return" type="button">إعادة بملاحظات</button>`);
    else if (s.kind === 'multi' && role === 'dept') acts.push(`<button class="btn primary" data-wfdo="dept" type="button">${icon('send')} ${s.id === 'reports' ? 'إرسال تقرير التفعيل' : 'إرسال ملاحظات الإدارة'}</button>`);
    else if (s.kind === 'multi') acts.push(`<button class="btn primary" data-wfdo="close" type="button">${icon('check')} ${s.id === 'reports' ? 'إغلاق المسار' : 'اعتماد الملاحظات والانتقال'}</button>`);
    else acts.push(`<button class="btn primary" data-wfdo="done" type="button">${icon('check')} إتمام الخطوة</button>`);
  }
  if (!canAct && s.kind === 'multi' && isCur && teamUp) acts.push(`<button class="btn primary" data-wfdo="close" type="button">${icon('check')} ${s.id === 'reports' ? 'إغلاق المسار' : 'اعتماد الملاحظات والانتقال'}</button>`);
  const onBehalf = canAct && role === 'admin' && !['partnerships', 'requester'].includes(s.actor) && !wfExternal(s.actor);
  const m = Modal.open({
    title: `الخطوة ${s.n}: ${s.t}`, size: 'lg', cls: 'wf-modal',
    body: `<p class="wf-md">${esc(wfDesc(s))}</p>
      <div class="wf-mi"><span>${icon('users')} المسؤول: <b>${esc(wfActorName(s.actor))}</b></span>${s.ref ? `<span>البند ${s.ref} في إجراء المذكرات</span>` : ''}${wfExternal(s.actor) ? `<span class="wf-ob">${icon('mail')} جهة خارج المنصة: يُسجَّل ردها بإرفاق الخطاب من حساب ${esc(wfActorName('partnerships'))}</span>` : ''}${onBehalf ? `<span class="wf-ob">${icon('alert')} تنفّذ بصفتك مدير المنصة نيابة عن ${esc(wfActorName(s.actor))}</span>` : ''}</div>
      ${r.status === 'returned' && r.note ? `<div class="note warn">${icon('msg')}<span><b>أُعيدت بملاحظات:</b> ${esc(r.note)}</span></div>` : ''}
      ${multiRows ? `<h4 class="m-h4">${s.id === 'reports' ? 'تقارير الإدارات' : 'ملاحظات الإدارات المعنية'}</h4><ul class="wf-ml">${multiRows}</ul>` : ''}
      ${s.docs.length ? `<h4 class="m-h4">المستندات</h4><div class="wf-drs">${s.docs.map(docRow).join('')}</div>` : ''}
      ${fieldsHTML ? `<h4 class="m-h4">البيانات</h4>${fieldsHTML}` : ''}
      ${acts.length ? `<div class="field"><label>${s.kind === 'multi' && role === 'dept' ? 'ملاحظات إدارتكم' : 'ملاحظة'} ${s.kind === 'review' || s.kind === 'decision' ? '(مطلوبة عند الإعادة أو عدم المناسبة)' : '(اختيارية)'}</label><textarea class="in" id="wfNote" rows="3"></textarea></div>` : (isCur ? '' : `<p class="faint small">${r.status === 'done' ? 'الخطوة مكتملة.' : 'تُتاح هذه الخطوة عند الوصول إليها في المسار.'}</p>`)}
      ${!canAct && isCur && !teamUp ? `<p class="faint small">${icon('lock')} تنفيذ هذه الخطوة من حساب ${esc(wfActorName(s.actor))}.</p>` : ''}`,
    foot: `${acts.join('')}<button class="btn ghost" data-mclose type="button">إغلاق</button>`,
  });
  const box = m.el;
  const store = async (dk, files) => {
    for (const file of files) {
      try {
        const up = await saveUpload(file);
        rec.attachments = rec.attachments || [];
        rec.attachments.push({ id: uid('att'), fileId: up.id, name: up.name, type: up.type, size: up.size, category: WF_CAT, wf: sid, doc: dk, byDept: role === 'dept' ? myDept : D.settings.org.dept, addedAt: nowISO(), by: Session.userName() });
      } catch (err) { toast(err.message, 'err'); return; }
    }
    await Repo.save(kind === 'proposal' ? 'proposals' : 'partnerships', rec);
    await Repo.log('workflow.doc', kind, rec.id, kind === 'proposal' ? rec.ref : rec.code, `الخطوة ${s.n}: رفع «${(s.docs.find((d) => d.k === dk) || {}).l}»`);
    toast('رُفع المستند'); m.close(); rerender(); setTimeout(() => wfStepDialog(kind, rec, sid, rerender), 60);
  };
  box.addEventListener('change', (e) => { const i = e.target.closest('[data-wfup]'); if (i && i.files.length) store(i.dataset.wfup, [...i.files]); });
  $$('[data-wfdrop]', box).forEach((dz) => { ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); })); ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); })); dz.addEventListener('drop', (e) => store(dz.dataset.wfdrop, [...e.dataTransfer.files])); });
  box.addEventListener('click', async (e) => {
    const v = e.target.closest('[data-wfview]'); if (v) return viewStored(v.dataset.wfview);
    const fl = e.target.closest('[data-wffill]'); if (fl) { m.close(); return openForm(kind, rec, fl.dataset.wffill, { onDone: () => { rerender(); setTimeout(() => wfStepDialog(kind, rec, sid, rerender), 80); } }); }
    const fv = e.target.closest('[data-wfformview]'); if (fv) { const [k2, o2] = wfFormOwner(kind, rec, fv.dataset.wfformview); return openForm(k2, o2, fv.dataset.wfformview, { ro: true }); }
    const fp = e.target.closest('[data-wfformprint]'); if (fp) { const [k2, o2] = wfFormOwner(kind, rec, fp.dataset.wfformprint); return printForm(k2, o2, fp.dataset.wfformprint); }
    const t = e.target.closest('[data-wftpl]'); if (t) return downloadStored(t.dataset.wftpl, 'نموذج');
    const b = e.target.closest('[data-wfdo]'); if (!b) return;
    const act = b.dataset.wfdo, note = ($('#wfNote', box) || {}).value ? $('#wfNote', box).value.trim() : '';
    const missing = s.docs.filter((d) => d.req && !(d.form && (wfForm(kind, rec, d.form) || {}).status === 'done') && !docs.some((a) => a.doc === d.k && (s.kind !== 'multi' || act !== 'dept' || a.byDept === myDept)));
    if (['yes', 'done', 'dept'].includes(act) && missing.length && !(act === 'dept' && s.id === 'depts')) { toast(`ارفع أولًا: ${missing.map((d) => d.l).join('، ')}`, 'err'); return; }
    if (['no', 'return', 'reject'].includes(act) && !note) { toast('اكتب الملاحظة أو السبب أولًا.', 'err'); $('#wfNote', box).focus(); return; }
    const fields = {};
    if ((s.fields || []).includes('date')) { fields.date = $('#wfDate', box).value; if (!fields.date) return toast('حدد تاريخ الاجتماع.', 'err'); }
    if ((s.fields || []).includes('attendees')) fields.attendees = $$('input[name=wfAtt]:checked', box).map((i) => i.value);
    if ((s.fields || []).includes('intersection')) { fields.intersection = $('#wfInt', box).value.trim(); if (!fields.intersection) return toast('اكتب التقاطع الاستراتيجي.', 'err'); }
    if ((s.fields || []).includes('coop')) { fields.coop = $('#wfCoop', box).value.trim(); if (!fields.coop) return toast('اكتب سبل التعاون.', 'err'); }
    if ((s.fields || []).includes('dates')) { fields.start = $('#wfStart', box).value; fields.end = $('#wfEnd', box).value; if (!fields.start || !fields.end || fields.end <= fields.start) return toast('حدد تاريخي البدء والانتهاء (الانتهاء بعد البدء).', 'err'); }
    await wfApply(kind, rec, s, act, note, fields);
    m.close(); rerender();
  });
}

/* الخطوة التالية في المقترح المقبول: التحويل إلى شراكة (حتى لا يتوقف المسار بعد التقييم المبدئي) */
function wfNextHTML(kind, rec, st) {
  if (kind !== 'proposal' || !can('proposal.review')) return '';
  if (rec.status === 'accepted') return `<div class="wf-next no-print"><span class="wf-next-ic">${icon('convert')}</span><div><b>الخطوة التالية: تحويل الطلب إلى سجل شراكة</b><small>اكتمل التقييم المبدئي وقُبل الطلب. بعد التحويل تُستكمل مراحل الاجتماع والمذكرة والاعتماد من صفحة الشراكة.</small></div><button class="btn primary" type="button" data-act="convert">${icon('convert')} تحويل إلى شراكة</button></div>`;
  if (['submitted', 'review'].includes(rec.status) && Session.role() === 'admin') return `<div class="wf-next soft no-print"><span class="wf-next-ic">${icon('flag')}</span><div><b>${st.cur ? `الخطوة الحالية: ${esc(st.cur.t)}` : 'الطلب قيد الدراسة'}</b><small>نفّذها من زر الخطوة في المسار، أو سجّل الشراكة مباشرة إن كانت موقّعة أو معتمدة مسبقًا.</small></div><button class="btn" type="button" data-act="direct">${icon('convert')} تحويل مباشر</button></div>`;
  return '';
}
/* التسجيل المباشر: تُعلَّم مراحل ما قبل التوقيع «مُتجاوَزة» باسم الحساب، وتنتقل الشراكة إلى خطوة التوقيع */
async function wfDirect(prop, p) {
  const sign = WF_STEPS.find((s) => s.id === 'signed') || WF_STEPS.find((s) => s.ph === 'sign' && !s.kind);
  const upto = sign ? WF_STEPS.indexOf(sign) : WF_STEPS.length;
  const at = nowISO(), by = Session.userName();
  WF_STEPS.slice(0, upto).forEach((s) => {
    const own = s.on === 'proposal' && prop ? prop : p;
    own.wf = own.wf || { steps: {} }; own.wf.steps = own.wf.steps || {};
    const cur = own.wf.steps[s.id];
    if (!(cur && cur.status === 'done')) own.wf.steps[s.id] = { status: 'done', direct: true, at, by, decision: s.kind === 'decision' || s.final ? 'yes' : undefined };
  });
  if (p.stage === 'prep') p.stage = 'sign';
  if (prop) await Repo.save('proposals', prop);
  await Repo.save('partnerships', p);
  await Repo.log('workflow.direct', 'partnership', p.id, p.code, `تسجيل مباشر: تُجووزت المراحل حتى «${sign ? sign.t : 'النهاية'}»`);
}

/* — تطبيق الإجراء وآثاره على حالة الطلب أو الشراكة — */
async function wfApply(kind, rec, s, act, note, fields) {
  rec.wf = rec.wf || { steps: {} }; rec.wf.steps = rec.wf.steps || {};
  const by = Session.userName(), at = nowISO(), dept = Session.role() === 'dept' ? Session.dept() : D.settings.org.dept;
  const cur = rec.wf.steps[s.id] || {};
  let msg = '';
  if (act === 'dept') {
    cur.depts = cur.depts || {}; cur.depts[Session.dept()] = { at, by, note };
    const P = rec, all = wfConcerned(P);
    if (s.id === 'depts' && all.every((d) => cur.depts[d])) Object.assign(cur, { status: 'done', at, by: 'اكتملت ملاحظات الإدارات' });
    if (s.id === 'reports' && P.activation !== 'مفعّلة') P.activation = 'مفعّلة';
    if (s.id === 'reports' && all.every((d) => cur.depts[d])) Object.assign(cur, { status: 'done', at, by: 'وردت تقارير كل الإدارات' });
    msg = `${Session.dept()}: ${s.id === 'reports' ? 'تقرير تفعيل' : 'ملاحظات على المذكرة'}`;
  } else if (act === 'no' && s.kind === 'decision') {
    Object.assign(cur, { status: 'done', decision: 'no', at, by, note });
    msg = `${s.no}: ${note}`;
  } else if (act === 'reject' && s.reject) {
    Object.assign(cur, { status: 'done', decision: 'reject', at, by, note, byDept: dept });
    msg = `${s.reject}: ${note}`;
  } else if (act === 'no' || act === 'return') {
    Object.assign(cur, { status: 'returned', at, by, note, byDept: dept });
    msg = `أُعيدت بملاحظات: ${note}`;
  } else {
    Object.assign(cur, { status: 'done', decision: act === 'yes' ? 'yes' : undefined, at, by, byDept: dept, note: note || undefined, fields: Object.keys(fields).length ? fields : cur.fields });
    msg = act === 'yes' ? (s.yes || 'اعتُمدت') : 'اكتملت';
  }
  rec.wf.steps[s.id] = cur;
  // الآثار على حالة السجل
  if (kind === 'proposal' && s.kind === 'decision') {
    if (cur.decision === 'yes') await setPropStatus(rec, 'accepted', note || 'الجهة مناسبة وفق التقييم المبدئي.', 'all');
    if (cur.decision === 'no') await setPropStatus(rec, 'rejected', note, 'all');
  } else if (kind === 'proposal' && s.actor === 'partnerships' && rec.status === 'submitted') await setPropStatus(rec, 'review', '', 'all');
  if (kind === 'partnership') {
    if (s.id === 'draft' && fields.coop) rec.cooperationAreas = fields.coop;
    if (s.id === 'meeting' && fields.attendees) rec.departments = [...new Set([...(rec.departments || []), ...fields.attendees.filter((d) => d !== D.settings.org.dept)])];
    const st = wfStateOf('partnership', rec);
    if (cur.status === 'done' && st.cur && wfPhaseIdx(st.cur) >= WF_PHASES.findIndex((p) => p.id === 'sign') && rec.stage === 'prep') rec.stage = 'sign';
    if (cur.decision === 'reject') { rec.stage = 'cancel'; rec.closedReason = note; }
    if (s.id === 'signed' && cur.status === 'done') { rec.stage = 'signed'; rec.startDate = fields.start; rec.endDate = fields.end; }
    if (s.id === 'bizdev' && cur.status === 'done' && !rec.activation || (s.id === 'bizdev' && cur.status === 'done' && rec.activation === 'غير مفعّلة')) rec.activation = 'قيد التفعيل';
  }
  await Repo.save(kind === 'proposal' ? 'proposals' : 'partnerships', rec);
  await Repo.log('workflow.step', kind, rec.id, kind === 'proposal' ? rec.ref : rec.code, `الخطوة ${s.n} «${s.t}»: ${msg}`);
  await wfNotifyStep(kind, rec, s, cur, note);
  toast(cur.status === 'returned' ? 'أُعيدت الخطوة بملاحظات' : act === 'dept' ? 'أُرسلت' : `الخطوة ${s.n}: ${msg}`);
}

function wfFormOwner(kind, rec, key) { if ((rec.forms || {})[key] || kind !== 'partnership' || !rec.proposalId) return [kind, rec]; const x = D.proposals.find((y) => y.id === rec.proposalId); return x ? ['proposal', x] : [kind, rec]; }
function bindWf(el, kind, rec) {
  el.addEventListener('click', (e) => {
    const fo = e.target.closest('.wf-sec [data-wfform]'); if (fo) { e.stopPropagation(); const k = fo.dataset.wfform; const [k2, o2] = wfFormOwner(kind, rec, k); return openForm(k2, o2, k, { ro: true }); }
    const o = e.target.closest('[data-wfopen]'); if (o) { e.preventDefault(); e.stopPropagation(); return wfStepDialog(kind, rec, o.dataset.wfopen, () => route()); }
    const v = e.target.closest('.wf-sec [data-wfview]'); if (v) { e.stopPropagation(); return viewStored(v.dataset.wfview); }
  }, true);
}

/* =====================================================================
   حساب لكل إدارة
   ===================================================================== */
function wfAccounts() {
  const own = D.settings.org.dept;
  const duty = (d) => Object.keys(WF_DEPT_DEFAULTS).filter((k) => wfDept(k) === d);
  const A = [{ id: 'admin', t: 'إدارة الشراكات', s: 'كامل الصلاحيات — ' + own, role: 'admin', dept: own, g: 'إدارة الشراكات' }];
  L('team').forEach((m) => A.push({ id: 'team:' + m, t: m, s: 'فريق ' + own, role: 'team', dept: own, member: m, g: 'إدارة الشراكات' }));
  const depts = [...new Set([...L('departments').filter((d) => d !== own), ...['legal'].map(wfDept)].filter((d) => !WF_EXTERNAL.map(wfDept).includes(d)))];
  depts.forEach((d) => { const du = duty(d); const st = WF_STEPS.filter((x) => du.includes(x.actor)); A.push({ id: 'dept:' + d, t: d, s: st.length ? st.map((x) => `${x.n}. ${x.t}`).join('، ') : 'تطلب الشراكات وتتقاطع معها وترفع تقارير التفعيل', role: 'dept', dept: d, duties: du, g: du.length ? 'جهات المراجعة والاعتماد' : 'الإدارات' }); });
  A.push({ id: 'viewer', t: 'القيادة ومجلس الإدارة', s: 'اطلاع على المؤشرات والتقارير', role: 'viewer', dept: '', g: 'الاطلاع' });
  return A;
}
function currentAccountId() {
  const s = D.settings.session || {}, r = Session.role();
  if (s.accountId === 'sysadmin') return 'sysadmin';
  if (s.accountId && wfAccounts().some((a) => a.id === s.accountId)) { const a = wfAccounts().find((x) => x.id === s.accountId); if (a.role === r && (r !== 'dept' || a.dept === Session.dept()) && (r !== 'team' || a.member === Session.member())) return a.id; }
  return r === 'dept' ? 'dept:' + Session.dept() : r === 'team' ? 'team:' + Session.member() : r;
}
function accountLabel() { const a = authAccounts().find((x) => x.id === currentAccountId()); return a ? a.t : ROLES[Session.role()].label; }
async function switchAccount(id) {
  const a = wfAccounts().find((x) => x.id === id); if (!a) return;
  if (!AUTH.dev && !(currentLogin() || {}).sys) return toast('الدخول بحساب آخر متاح لمدير النظام فقط. سجّل الخروج ثم ادخل بالحساب المطلوب.', 'err');
  D.settings.session = { role: a.role, dept: a.role === 'dept' ? a.dept : Session.dept(), member: a.member || Session.member(), accountId: a.id };
  await Repo.saveSettings();
  await Repo.log('role.switch', 'system', 'session', a.t, ROLES[a.role].label);
  App.dirty = false; renderShell(); route();
  const n = wfTasks().length;
  toast(`الحساب الحالي: ${a.t}${n ? ` — ${plural(n, 'مهمة واحدة', 'مهمتان', 'مهام', 'مهمة')} بانتظارك` : ''}`);
}

/* صفحة «مهامي» */
function renderTasks(el) {
  const T = wfTasks();
  const acc = wfAccounts().find((x) => x.id === currentAccountId());
  const r0 = Session.role();
  const mineSteps = r0 === 'admin' || r0 === 'team' ? WF_STEPS.filter((s) => s.actor === 'partnerships' || s.kind === 'multi') : r0 === 'dept' ? WF_STEPS.filter((s) => (acc && acc.duties || []).includes(s.actor)) : [];
  const whenSteps = r0 === 'dept' ? WF_STEPS.filter((s) => ['requester', 'concerned'].includes(s.actor) || s.id === 'meeting') : [];
  el.innerHTML = `<div class="ph"><div><h1>مهامي</h1><p>الخطوات التي تنتظر ${esc(acc ? acc.t : 'حسابك')} في مسار الشراكات الجديدة. كل مهمة تفتح الخطوة مباشرة بمستنداتها.</p>${T.length ? `<p class="tk-sum"><b>${T.filter((t) => !t.follow).length}</b> بانتظارك${T.some((t) => t.follow) ? ` · <b>${T.filter((t) => t.follow).length}</b> للمتابعة فقط` : ''}</p>` : ''}</div></div>
    ${canListDirect() && (D.settings.listReqs || []).length ? `<section class="panel tk-lr"><div class="panel-h"><h3>${icon('plus')} خيارات جديدة بانتظار الاعتماد</h3><span class="sub">اقترحها مستخدمون من خارج إدارة الشراكات؛ تظهر في القوائم بعد الموافقة</span></div><div class="panel-b"><ul class="lr-list">${D.settings.listReqs.map((r) => `<li><div><b>«${esc(r.v)}»</b><small>${esc(LIST_TITLES[r.list] || r.list)} · ${esc(r.by)}${r.from ? ' · من ' + esc(r.from) : ''} · ${relDays(r.at)}</small></div><button class="btn sm primary" type="button" data-lrok="${r.id}">${icon('check')} اعتماد</button><button class="btn sm ghost" type="button" data-lrno="${r.id}">${icon('x')} رفض</button></li>`).join('')}</ul></div></section>` : ''}
    ${T.length ? `<div class="tk-list">${T.map((t) => `<a class="tk ${t.returned ? 'ret' : ''} ${t.follow ? 'fol' : ''}" href="${t.href}" data-tkopen="${t.step.id}" data-tkid="${t.rec.id}" data-tkkind="${t.kind}">
        <span class="tk-n">${t.step.n}</span><span class="tk-b"><b>${esc(t.step.t)}</b><span>${esc(t.name || '')}</span><small>${esc(t.sub || '')}</small></span>
        <span class="tk-m">${t.returned ? '<em class="ret">أُعيدت بملاحظات</em>' : t.follow ? '<em>متابعة</em>' : ''}<small>${t.since ? relDays(t.since) : ''}</small></span>${icon('chevL')}</a>`).join('')}</div>`
      : emptyHTML({ ic: 'check', title: 'لا توجد مهام بانتظارك', text: Session.role() === 'viewer' ? 'حساب الاطلاع لا تُسند إليه خطوات في المسار.' : 'ستظهر هنا الخطوات المسندة لحسابك عند وصول أي شراكة إليها.' })}
    <section class="panel tk-duty"><div class="panel-h"><h3>دور ${esc(acc ? acc.t : '')} في المسار</h3><a class="linkbtn" href="#/process">${icon('convert')} مسار الشراكة كاملًا</a></div>
      <div class="panel-b">${mineSteps.length ? `<h4 class="m-h4" style="margin-top:0">${r0 === 'dept' ? 'يعتمد أو ينفّذ في كل شراكة' : 'خطوات إدارة الشراكات'}</h4><ol class="tk-steps">${mineSteps.map((s) => `<li><span>${s.n}</span><b>${esc(s.t)}</b><small>${esc(s.d)}</small></li>`).join('')}</ol>` : ''}
        ${whenSteps.length ? `<h4 class="m-h4">عندما تكون إدارتكم طالبة الشراكة أو معنية بها</h4><ol class="tk-steps soft">${whenSteps.map((s) => `<li><span>${s.n}</span><b>${esc(s.t)}</b><small>${esc(s.d)}</small></li>`).join('')}</ol>` : ''}
        ${!mineSteps.length && !whenSteps.length ? '<p class="muted small">لا تُسند لهذا الحساب خطوات تنفيذ؛ اطلاع فقط.</p>' : ''}</div></section>`;
  el.onclick = async (e) => {
    const lr = e.target.closest('[data-lrok],[data-lrno]'); if (lr) { await decideListReq(lr.dataset.lrok || lr.dataset.lrno, !!lr.dataset.lrok); toast(lr.dataset.lrok ? 'اعتُمد الخيار وأُضيف إلى القائمة' : 'رُفض الخيار'); return route(); }
    const a = e.target.closest('[data-tkopen]'); if (!a) return;
    e.preventDefault();
    const kind = a.dataset.tkkind, rec = (kind === 'proposal' ? D.proposals : D.partnerships).find((x) => x.id === a.dataset.tkid);
    go(kind === 'proposal' ? '#/proposals/' + rec.id : '#/partnerships/' + rec.id);
    if (a.dataset.tkopen === 'convert') return;
    setTimeout(() => { const w = $('#wf'); w && w.scrollIntoView({ block: 'start' }); wfStepDialog(kind, rec, a.dataset.tkopen, () => route()); }, 350);
  };
}
function wfEvalDone(x) { const e = wfStateOf('proposal', x).S.eval; return !!(e && e.status === 'done' && e.decision === 'yes'); }
