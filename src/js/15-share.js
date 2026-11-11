/* ===== «شارك» — مقترحات الإدارات ===== */
function prelimNote() { return `<span class="prelim">${icon('info')} حالات المقترح تصور أولي للمراجعة، وليست إجراءات معتمدة من الجهة.</span>`; }
function shareStatusesHTML() {
  const ex = { draft: 'يحفظه مقدم الطلب قبل الإرسال، ولا يراه غيره.', submitted: 'أُرسل إلى إدارة الشراكات وحصل على رقم مرجعي.', review: 'بدأت إدارة الشراكات دراسته.', info: 'طلبت إدارة الشراكات معلومات إضافية من الإدارة المقدمة.', accepted: 'قُبل مبدئيًا، ولا يعني ذلك توقيع الشراكة.', rejected: 'لم يُقبل، مع توضيح السبب للإدارة المقدمة.', converted: 'أُنشئ منه سجل شراكة تتابعه إدارة الشراكات.' };
  return `<div class="acts">${D.settings.proposalStatuses.map((s) => `<div class="act" style="grid-template-columns:150px 1fr;cursor:default">${propChip(s.id)}<span class="d" style="font-size:13.5px">${esc(ex[s.id] || '')}</span></div>`).join('')}</div>`;
}
function renderShare(el) {
  const canCreate = can('proposal.create');
  const mine = Session.role() === 'dept' ? visibleProposals().filter((x) => x.department === Session.dept()).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')) : [];
  const needs = mine.filter((x) => x.status === 'info' || x.status === 'draft');
  el.innerHTML = `<div class="share-intro" data-tour="share-intro">
    <div class="l">${topoSVG('share-intro', { W: 700, H: 420, levels: 14, cols: 48, focus: 'left' })}
      <h1>شارك بمقترح شراكة</h1>
      <p>إذا رأت إدارتكم في جهة حكومية أو خاصة أو غير ربحية فرصة لتعاون يخدم أهداف المؤسسة، فقدّموا المقترح هنا. تدرسه إدارة الشراكات، وتتابعون حالته برقمه المرجعي.</p>
      ${canCreate ? `<a class="btn lg light" style="background:#F2F7F5;color:#0B3F38" href="#/share/new">${icon('plus')} ابدأ مقترحًا جديدًا</a>` : `<p class="small" style="margin-top:18px;color:var(--hero-mut)">تقديم المقترحات متاح لممثلي الإدارات. ${can('proposal.review') ? '<a href="#/proposals" style="color:#fff;text-decoration:underline">افتح المقترحات الواردة</a>.' : ''}</p>`}
    </div>
    <div class="r"><h3 style="font-size:15px;margin-bottom:6px">مراحل المقترح</h3><div style="margin-bottom:10px">${prelimNote()}</div>${shareStatusesHTML()}</div></div>
    ${can('proposal.review') ? (() => { const ps = visibleProposals().filter((x) => x.status !== 'draft'); return `<div class="inbox-strip">${D.settings.proposalStatuses.filter((s) => s.id !== 'draft').map((s) => `<a href="#/proposals?status=${s.id}"><div class="v">${ps.filter((x) => x.status === s.id).length}</div><div class="l">${propChip(s.id)}</div></a>`).join('')}</div>`; })() : ''}
    <div class="panel" style="margin-bottom:24px"><div class="panel-h"><h3>ما يحتاجه المقترح</h3><span class="sub">جهّز هذه البيانات قبل البدء — يمكنك الحفظ كمسودة والعودة لاحقًا</span></div><div class="panel-b">
      <ul class="prep-list">${[['اسم الإدارة الطالبة واسم مقدم الطلب', ''], ['الهدف الاستراتيجي', 'الهدف الذي تخدمه الشراكة'], ['اسم الجهة المستهدفة', 'يُطابَق تلقائيًا مع سجل الجهات'], ['مستهدفات الشراكة', 'ما الذي تسعى الشراكة إلى تحقيقه'], ['أسباب طلب الشراكة من الجهة', 'لماذا هذه الجهة تحديدًا'], ['القيمة المضافة', 'ما تضيفه الشراكة للمؤسسة'], ['بيانات مسؤول التواصل من الجهة', 'الاسم والرقم والبريد الإلكتروني'], ['المرفقات', 'عرض الجهة أو مراسلات سابقة، إن وجدت']].map(([a, b]) => `<li>${icon('check')}<span>${a}${b ? `<small>${b}</small>` : ''}</span></li>`).join('')}</ul></div></div>
    ${Session.role() === 'dept' ? `<div class="ph" style="margin-top:8px"><div><h1 style="font-size:20px">مقترحات ${esc(Session.dept())}</h1><p>${needs.length ? `${plural(needs.length, 'مقترح واحد يحتاج', 'مقترحان يحتاجان', 'مقترحات تحتاج', 'مقترحًا يحتاج')} إجراءً منكم.` : 'تابع حالة مقترحات إدارتك وملاحظات المراجعة.'}</p></div><div class="ph-actions"><a class="btn" href="#/proposals">جميع المقترحات</a></div></div>
      ${mine.length ? propTable(mine.slice(0, 6), true) : `<div class="panel">${emptyHTML({ ic: 'send', title: 'لم تقدّم إدارتك مقترحات بعد', text: 'يظهر هنا كل مقترح تقدمه إدارتك مع حالته وآخر مستجداته.', actions: `<a class="btn primary" href="#/share/new">${icon('plus')} مقترح جديد</a>` })}</div>`}` : ''}`;
  el.onclick = (e) => { const row = e.target.closest('[data-prop]'); if (row && !e.target.closest('a,button')) go('#/proposals/' + row.dataset.prop); };
}

const S_STEPS = [
  { id: 'req', t: 'الإدارة ومقدم الطلب', s: 'من يقدم المقترح' },
  { id: 'entity', t: 'الجهة المستهدفة', s: 'ومسؤول التواصل فيها' },
  { id: 'idea', t: 'فكرة الشراكة', s: 'المستهدفات والأسباب والقيمة' },
  { id: 'review', t: 'المرفقات والإرسال', s: 'مراجعة نهائية' },
];
/* حقول نموذج «شارك»: المصدر الوحيد للعرض والتحقق والمراجعة واستعراض «مسار طلب الشراكة».
   kind: dept | goal | partner | sector | text | area | sep (عنوان فرعي). req: إلزامي. demo: قيمة مثال للاستعراض. */
const SHARE_FIELDS = [
  { k: 'department', step: 'req', l: 'اسم الإدارة الطالبة', kind: 'dept', req: true, msg: 'اختر الإدارة الطالبة.' },
  { k: 'reqType', step: 'req', l: 'نوع الطلب', kind: 'select', options: () => REQ_TYPES, req: true, msg: 'اختر نوع الطلب.', hint: 'الشراكة القائمة أو الموقّعة تُسجَّل مباشرة بعد تحقق إدارة الشراكات من مستنداتها، دون المرور بكل مراحل المسار.' },
  { k: 'requesterName', step: 'req', l: 'اسم مقدم الطلب', kind: 'text', demo: 'سارة العتيبي' },
  { k: 'requesterEmail', step: 'req', l: 'البريد الإلكتروني لمقدم الطلب', kind: 'text', type: 'email', ltr: true, add: true, ph: 'name@example.org', hint: 'للتواصل بشأن المقترح عند الحاجة.', demo: 'sara@example.org' },
  { k: 'strategicGoal', step: 'req', l: 'الهدف الاستراتيجي', kind: 'goal' },
  { k: 'initiative', step: 'req', l: 'المبادرة الاستراتيجية', kind: 'init', hint: 'تظهر مبادرات الهدف المختار.' },
  { k: 'partnerName', step: 'entity', l: 'اسم الجهة المستهدفة', kind: 'partner', req: true, msg: 'اكتب اسم الجهة المستهدفة.', demo: 'جمعية الواحة البيئية' },
  { k: 'ptype', step: 'entity', l: 'تصنيف الشراكة المقترح', kind: 'select', list: 'partnerTypes', hint: 'استراتيجية، إعلامية، خدمات… تُدار القائمة من «القوائم».' },
  { k: 'partnerSector', step: 'entity', l: 'قطاع الجهة', kind: 'sector', add: true, hint: 'يسهّل نقل البيانات عند تحويل المقترح إلى شراكة.' },
  { k: '_contact', step: 'entity', l: 'بيانات مسؤول التواصل من الجهة', kind: 'sep' },
  { k: 'contactName', step: 'entity', l: 'الاسم', kind: 'text', demo: 'خالد الشمري' },
  { k: 'contactPhone', step: 'entity', l: 'الرقم', kind: 'text', ltr: true, ph: '05XXXXXXXX', demo: '0551234567' },
  { k: 'contactEmail', step: 'entity', l: 'البريد الإلكتروني', kind: 'text', type: 'email', ltr: true, ph: 'name@example.com', demo: 'k.alshammari@example.com' },
  { k: 'targets', step: 'idea', l: 'مستهدفات الشراكة', kind: 'area', hint: 'اكتب كل مستهدف في سطر مستقل، ويمكن ترقيمه.', demo: '1. زراعة 5000 شجرة محلية\n2. حملات توعية في المدارس' },
  { k: 'reasons', step: 'idea', l: 'أسباب طلب الشراكة من الجهة', kind: 'area', demo: 'خبرة الجهة في التشجير ووجود متطوعين مدربين.' },
  { k: 'addedValue', step: 'idea', l: 'القيمة المضافة', kind: 'area', hint: 'ما الذي تضيفه الشراكة للمؤسسة ولإدارتكم؟', demo: 'توسيع الغطاء النباتي وإشراك المجتمع.' },
];
const REQ_TYPES = ['مقترح شراكة جديدة', 'تسجيل شراكة قائمة أو موقّعة'];
const isExistingReq = (x) => x && x.reqType === REQ_TYPES[1];
const shareFields = (step) => SHARE_FIELDS.filter((x) => x.kind !== 'sep' && (!step || x.step === step));
const shareReq = () => shareFields().filter((x) => x.req);
function renderShareForm(el, r) {
  if (!can('proposal.create')) { el.innerHTML = noAccessHTML(); return; }
  const editing = r.params.id ? D.proposals.find((x) => x.id === r.params.id) : null;
  if (r.params.id && (!editing || !['draft', 'info'].includes(editing.status))) {
    el.innerHTML = emptyHTML({ ic: 'lock', title: 'لا يمكن تعديل هذا المقترح', text: 'يمكن تعديل المقترح وهو مسودة، أو عند طلب إدارة الشراكات استكماله.', actions: editing ? `<a class="btn" href="#/proposals/${editing.id}">فتح المقترح</a>` : '' });
    return;
  }
  const s = editing ? clone(editing) : { ...Object.fromEntries(shareFields().map((x) => [x.k, ''])), department: Session.role() === 'dept' ? Session.dept() : '', reqType: REQ_TYPES[0], attachments: [], status: 'draft' };
  if (!s.reqType) s.reqType = REQ_TYPES[0];
  shareFields().forEach((x) => { if (s[x.k] == null) s[x.k] = ''; });
  const fs = { step: 'req', errors: {}, reply: '' };
  App.dirty = false;
  const infoReq = editing && editing.status === 'info' ? [...editing.events].reverse().find((e) => e.type === 'status' && e.to === 'info') : null;
  el.innerHTML = `<div class="ph"><div><h1>${editing ? (editing.status === 'info' ? 'استكمال المقترح' : 'متابعة المسودة') : 'مقترح شراكة جديد'}</h1><p>${editing ? `<span class="code">${esc(editing.ref)}</span> — ` : ''}الحقول مستخرجة من خانة «شارك» في ملف الحصر. ${prelimNote()}</p></div>
    <div class="ph-actions"><a class="btn ghost" href="${editing ? '#/proposals/' + editing.id : '#/share'}">إلغاء</a></div></div>
    ${infoReq ? `<div class="note warn" style="margin-bottom:18px">${icon('msg')}<div><b>طلب استكمال من إدارة الشراكات — ${fmtDT(infoReq.at)}</b><div style="margin-top:4px;white-space:pre-wrap">${esc(infoReq.message || '')}</div></div></div>` : ''}
    <div class="wiz-wrap" data-tour="share-form"><div class="wiz-steps" id="wsteps"></div><div class="fpanel" id="wpanel"></div></div>`;
  const field = (k, label, inner, { hint = '', full = false, add = false } = {}) => `<div class="field ${full ? 'span2' : ''} ${fs.errors[k] ? 'invalid' : ''}" data-f="${k}"><label for="s_${k}">${esc(label)}${(SHARE_FIELDS.find((x) => x.k === k) || {}).req ? ' <span class="req" aria-label="إلزامي">*</span>' : ''}${add ? ' <span class="chip gold plain" style="height:18px;font-size:11px">إضافة مقترحة</span>' : ''}</label>${inner}${hint ? `<span class="hint">${hint}</span>` : ''}<span class="err">${esc(fs.errors[k] || '')}</span></div>`;
  const inp = (k, label, o = {}) => field(k, label, `<input class="in" id="s_${k}" data-k="${k}" value="${esc(s[k])}" ${o.ltr ? 'dir="ltr"' : ''} ${o.type ? `type="${o.type}"` : ''} placeholder="${esc(o.ph || '')}">`, o);
  const ta = (k, label, o = {}) => field(k, label, `<textarea class="in" id="s_${k}" data-k="${k}" rows="5">${esc(s[k])}</textarea>`, { ...o, full: true });
  const doneStep = (id) => { const fl = shareFields(id); return fl.length > 0 && fl.every((x) => !x.req || String(s[x.k] || '').trim()) && fl.some((x) => String(s[x.k] || '').trim()); };
  const drawSteps = () => { $('#wsteps', el).innerHTML = S_STEPS.map((st, i) => `<button type="button" data-ws="${st.id}" class="${fs.step === st.id ? 'on' : ''} ${doneStep(st.id) && fs.step !== st.id ? 'done' : ''}"><span class="ix">${doneStep(st.id) && fs.step !== st.id ? icon('check') : i + 1}</span><span>${st.t}<small>${st.s}</small></span></button>`).join(''); };
  const matchBox = () => {
    if (!s.partnerName || s.partnerName.trim().length < 3) return '';
    const sim = findSimilarPartners(s.partnerName);
    if (!sim.length) return `<div class="note" style="margin-top:6px">${icon('info')}<span>لا توجد جهة بهذا الاسم في سجل الجهات حاليًا.</span></div>`;
    return `<div class="note" style="margin-top:6px">${icon('building')}<span>جهة مسجلة لدى إدارة الشراكات: ${sim.slice(0, 3).map((x) => { const n = D.partnerships.filter((p) => p.partnerId === x.id && !p.isDraft).length; return `<b>${esc(x.name)}</b>${n ? ` (${plural(n, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')})` : ''}`; }).join('، ')}. سيُراعى ذلك عند دراسة المقترح.</span></div>`;
  };
  const initOpts = () => { const L_ = goalInits(s.strategicGoal); return `<option value="">${s.strategicGoal ? 'اختر المبادرة' : '—'}</option>${L_.map((x) => `<option value="${esc(x.t)}" ${x.t === s.initiative ? 'selected' : ''}>${esc(x.c)} — ${esc(x.t)}</option>`).join('')}`; };
  const drawStep = () => {
    let body = '';
    if (fs.step !== 'review') {
      const rend = (x) => {
        if (x.kind === 'sep') return `<div></div><div class="span2 flabel" style="margin-top:6px">${esc(x.l)}</div>`;
        if (x.kind === 'dept') return `${field('department', x.l, `<select class="in" id="s_department" data-k="department"><option value="">اختر الإدارة</option>${L('departments').filter((d) => d !== D.settings.org.dept).map((d) => `<option ${d === s.department ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>`, { hint: Session.role() === 'dept' ? 'إدارتك في المحاكاة الحالية.' : '' })}`;
        if (x.kind === 'goal') return field('strategicGoal', x.l, `<select class="in" id="s_strategicGoal" data-k="strategicGoal"><option value="">اختر الهدف الاستراتيجي</option>${[...new Set([...L('goals'), s.strategicGoal].filter(Boolean))].map((o) => `<option value="${esc(o)}" ${o === s.strategicGoal ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`, { full: true });
        if (x.kind === 'init') return field('initiative', x.l, `<select class="in" id="s_initiative" data-k="initiative" ${s.strategicGoal ? '' : 'disabled'}>${initOpts()}</select>`, { full: true, hint: s.strategicGoal ? x.hint : 'اختر الهدف أولًا.' });
        if (x.kind === 'partner') return `${field('partnerName', x.l, `<input class="in" id="s_partnerName" data-k="partnerName" value="${esc(s.partnerName)}"><div id="pmatch">${matchBox()}</div>`, { full: true })}`;
        if (x.kind === 'sector') return `${field('partnerSector', x.l, `<select class="in" id="s_partnerSector" data-k="partnerSector"><option value="">غير محدد</option>${L('sectors').map((o) => `<option ${o === s.partnerSector ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`, { add: true, hint: 'يسهّل نقل البيانات إلى سجل الشراكة عند قبول المقترح.' })}`;
        if (x.kind === 'area') return ta(x.k, x.l, { hint: x.hint || '', add: x.add });
        if (x.kind === 'select') return field(x.k, x.l, `<select class="in" id="s_${x.k}" data-k="${x.k}">${x.options ? '' : '<option value="">اختر</option>'}${(x.options ? (typeof x.options === 'function' ? x.options() : x.options) : L(x.list || '')).map((o) => `<option ${o === s[x.k] ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>${x.list ? `<button type="button" class="linkbtn s-add" data-sadd="${x.list}" data-sk="${x.k}">${icon('plus')} ${canListDirect() ? 'إضافة خيار' : 'اقتراح خيار جديد'}</button>` : ''}`, { hint: x.hint || '', add: x.add, full: x.full });
        return inp(x.k, x.l, { ltr: x.ltr, type: x.type, ph: x.ph, hint: x.hint || '', add: x.add, full: x.full });
      };
      body = `<div class="grid2">${SHARE_FIELDS.filter((x) => x.step === fs.step).map(rend).join('')}</div>`;
    } else {
      const errs = Object.entries(fs.errors);
      body = `${errs.length ? `<div class="err-sum"><b>يلزم استكمال ما يلي قبل الإرسال:</b><ul>${errs.map(([k, m]) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
        <div class="flabel" style="margin-bottom:8px">المرفقات <span class="chip gold plain" style="height:18px;font-size:11px">إضافة مقترحة</span></div>
        ${attachEditorHTML('sAtt', { cats: ['مرفقات المقترح'], defaultCat: 'مرفقات المقترح' })}
        <div class="flabel" style="margin:22px 0 10px">مراجعة المقترح قبل الإرسال</div>
        <div class="review-sum">${S_STEPS.filter((st) => st.id !== 'review').map((st) => { const fl = shareFields(st.id); const sh = fl.filter((x) => x.kind !== 'area'), ar = fl.filter((x) => x.kind === 'area');
          return `<div class="rs"><h4>${esc(st.t)} <button type="button" data-ws="${st.id}">تعديل</button></h4>${sh.length ? `<dl class="kv">${sh.map((x) => `<div ${x.kind === 'goal' || x.kind === 'partner' ? 'class="full"' : ''}><dt>${esc(x.l)}${x.req ? ' <span class="req">*</span>' : ''}</dt><dd ${x.ltr ? 'dir="ltr" style="text-align:right"' : ''}>${esc(s[x.k]) || '<span class="faint">—</span>'}</dd></div>`).join('')}</dl>` : ''}${ar.map((x, i) => `<div class="xs muted" ${i || sh.length ? 'style="margin-top:10px"' : ''}>${esc(x.l)}</div>${richHTML(s[x.k], { empty: 'لم تُكتب.' })}`).join('')}</div>`; }).join('')}
        </div>
        ${editing && editing.status === 'info' ? `<div class="field" style="margin-top:18px"><label for="sReply">رد على طلب الاستكمال (يظهر لإدارة الشراكات)</label><textarea class="in" id="sReply" rows="3" style="min-height:80px">${esc(fs.reply)}</textarea></div>` : ''}`;
    }
    const idx = S_STEPS.findIndex((x) => x.id === fs.step);
    $('#wpanel', el).innerHTML = `<div class="fpanel-h"><h2>${S_STEPS[idx].t}</h2></div><div class="fpanel-b">${body}</div>
      <div class="fpanel-f"><span class="st ${App.dirty ? 'dirty' : ''}" id="sstate">${App.dirty ? icon('edit') + ' تعديلات غير محفوظة' : editing ? 'محفوظ' : 'لم يُحفظ بعد'}</span>
        ${idx > 0 ? `<button type="button" class="btn ghost" data-wp>${icon('chevR')} السابق</button>` : ''}
        ${idx < S_STEPS.length - 1 ? `<button type="button" class="btn" data-wn>التالي ${icon('chevL')}</button>` : ''}
        ${(!editing || editing.status === 'draft') ? `<button type="button" class="btn" data-sdraft>حفظ كمسودة</button>` : ''}
        ${idx === S_STEPS.length - 1 ? `<button type="button" class="btn primary" data-submit>${icon('send')} ${editing && editing.status === 'info' ? 'إرسال الاستكمال' : 'إرسال المقترح'}</button>` : ''}</div>`;
    bindCombos($('#wpanel', el));
    if (fs.step === 'review') bindAttachEditor($('#sAtt', el), () => s.attachments, (v) => { s.attachments = v; }, { onChange: dirty });
    drawSteps();
  };
  function dirty() { if (!App.dirty) { App.dirty = true; const f = $('#sstate', el); if (f) { f.className = 'st dirty'; f.innerHTML = icon('edit') + ' تعديلات غير محفوظة'; } } }
  const validate = () => {
    const e = {};
    shareReq().forEach((x) => { if (!String(s[x.k] || '').trim()) e[x.k] = x.msg || `استكمل حقل «${x.l}».`; });
    if (s.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.contactEmail.trim())) e.contactEmail = 'صيغة البريد الإلكتروني لمسؤول التواصل غير صحيحة.';
    if (s.requesterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.requesterEmail.trim())) e.requesterEmail = 'صيغة البريد الإلكتروني لمقدم الطلب غير صحيحة.';
    if (s.contactPhone && !/^\+?[0-9\s-]{7,16}$/.test(s.contactPhone.trim())) e.contactPhone = 'رقم مسؤول التواصل يجب أن يتكون من أرقام فقط.';
    return e;
  };
  const persist = async (mode) => {
    const rec = editing || { id: uid('pr'), ref: nextProposalRef(), createdAt: nowISO(), createdByRole: Session.role(), events: [], demo: false, partnershipId: null };
    const prev = editing ? editing.status : null;
    Object.assign(rec, { department: s.department, requesterName: s.requesterName.trim(), requesterEmail: (s.requesterEmail || '').trim(), strategicGoal: s.strategicGoal, partnerName: s.partnerName.trim(), partnerSector: s.partnerSector, contactName: s.contactName.trim(), contactPhone: (s.contactPhone || '').trim(), contactEmail: (s.contactEmail || '').trim(), targets: s.targets, reasons: s.reasons, addedValue: s.addedValue, attachments: s.attachments });
    shareFields().forEach((x) => { if (!(x.k in rec) || ['text', 'area', 'select'].includes(x.kind)) rec[x.k] = typeof s[x.k] === 'string' ? s[x.k].trim() : s[x.k]; });
    if (!editing) { rec.status = 'draft'; await propEvent(rec, { type: 'created' }); }
    if (mode === 'draft') {
      rec.status = 'draft';
      await Repo.save('proposals', rec); await Repo.saveSettings();
      await Repo.log(editing ? 'proposal.update' : 'proposal.create', 'proposal', rec.id, rec.ref, 'مسودة');
    } else if (prev === 'info') {
      rec.status = 'submitted';
      const reply = ($('#sReply', el) || {}).value || '';
      await propEvent(rec, { type: 'resubmitted', message: reply.trim(), vis: 'all' });
      await Repo.save('proposals', rec);
      await Repo.log('proposal.update', 'proposal', rec.id, rec.ref, 'أُعيد تقديمه بعد الاستكمال');
      await notify([{ grp: 'partnerships' }], { t: `استُكمل المقترح ${rec.ref}`, b: `${rec.department} — ${rec.partnerName}`, href: '#/proposals/' + rec.id, ic: 'send' });
    } else {
      rec.status = 'submitted'; rec.submittedAt = nowISO();
      await propEvent(rec, { type: 'submitted' });
      await Repo.save('proposals', rec); await Repo.saveSettings();
      await Repo.log('proposal.submit', 'proposal', rec.id, rec.ref, `${rec.department} — ${rec.partnerName}`);
      await notify([{ grp: 'partnerships' }], { t: `${isExistingReq(rec) ? 'طلب تسجيل شراكة قائمة' : 'طلب شراكة جديد'} ${rec.ref}`, b: `${rec.department} — ${rec.partnerName}`, href: '#/proposals/' + rec.id, ic: 'send' });
    }
    if (!editing) D.proposals.includes(rec) || D.proposals.push(rec);
    App.dirty = false;
    return rec;
  };
  drawStep();
  el.addEventListener('click', async (e) => {
    const sa = e.target.closest('[data-sadd]'); if (sa) {
      const res = await inputDlg({ title: canListDirect() ? 'إضافة خيار' : 'اقتراح خيار جديد', label: LIST_TITLES[sa.dataset.sadd] || 'الخيار', hint: canListDirect() ? 'يُضاف إلى القائمة فورًا.' : 'يُرسل إلى إدارة الشراكات للاعتماد، ويظهر في القائمة بعد الموافقة.', ok: canListDirect() ? 'إضافة' : 'إرسال للاعتماد', multiline: false });
      const v = res && typeof res === 'object' ? res.value : res; if (!v) return;
      const r = await requestListValue(sa.dataset.sadd, v, 'خدمة «شارك»');
      if (r === 'added') { s[sa.dataset.sk] = v.trim(); dirty(); drawStep(); toast(`أُضيف «${v.trim()}»`); }
      else if (r === 'requested') toast('أُرسل الخيار إلى إدارة الشراكات للاعتماد');
      return;
    }
    const ws = e.target.closest('[data-ws]'); if (ws) { fs.step = ws.dataset.ws; drawStep(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest('[data-wn]')) { fs.step = S_STEPS[S_STEPS.findIndex((x) => x.id === fs.step) + 1].id; drawStep(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest('[data-wp]')) { fs.step = S_STEPS[S_STEPS.findIndex((x) => x.id === fs.step) - 1].id; drawStep(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest('[data-sdraft]')) {
      if (!s.partnerName.trim() && !s.department) return toast('اكتب اسم الجهة أو اختر الإدارة قبل حفظ المسودة.', 'err');
      const rec = await persist('draft'); toast(`حُفظت المسودة ${rec.ref}`); return go('#/proposals/' + rec.id);
    }
    if (e.target.closest('[data-submit]')) {
      fs.reply = ($('#sReply', el) || {}).value || '';
      fs.errors = validate();
      if (Object.keys(fs.errors).length) { fs.step = 'review'; drawStep(); toast('لم يُرسل المقترح — راجع البنود المشار إليها.', 'err'); return; }
      const wasInfo = editing && editing.status === 'info';
      const rec = await persist('submit');
      if (wasInfo) { toast('أُرسل الاستكمال إلى إدارة الشراكات'); return go('#/proposals/' + rec.id); }
      return go('#/share/done/' + rec.id);
    }
  });
  el.addEventListener('input', (e) => {
    const k = e.target.dataset.k; if (!k) return;
    s[k] = e.target.value; dirty();
    if (fs.errors[k]) { delete fs.errors[k]; e.target.closest('.field').classList.remove('invalid'); }
    if (k === 'partnerName') { const pm = $('#pmatch', el); pm && (pm.innerHTML = matchBox()); }
  });
  el.addEventListener('change', (e) => {
    const k = e.target.dataset.k; if (!(k && e.target.tagName === 'SELECT')) return;
    s[k] = e.target.value; dirty();
    if (k === 'strategicGoal') { // المبادرات تتبع الهدف المختار
      if (!goalInits(s.strategicGoal).some((x) => x.t === s.initiative)) s.initiative = '';
      const sel = $('#s_initiative', el); if (sel) { sel.innerHTML = initOpts(); sel.disabled = !s.strategicGoal; const h = sel.closest('.field').querySelector('.hint'); if (h) h.textContent = s.strategicGoal ? 'تظهر مبادرات الهدف المختار.' : 'اختر الهدف أولًا.'; }
    }
  });
  el.addEventListener('cbchange', (e) => { s[e.target.dataset.cb] = e.detail; dirty(); });
}
function renderShareDone(el, r) {
  const x = D.proposals.find((p) => p.id === r.params.id);
  if (!x) { el.innerHTML = emptyHTML({ title: 'لم يُعثر على المقترح' }); return; }
  el.innerHTML = `<div class="done-card"><div class="seal">${icon('check')}</div>
    <h1 style="font-size:24px;font-weight:500">أُرسل المقترح إلى إدارة الشراكات</h1>
    <p class="muted" style="margin-top:8px">احتفظ بالرقم المرجعي لمتابعة المقترح.</p>
    <div class="ref"><span id="refv">${esc(x.ref)}</span><button title="نسخ الرقم المرجعي" data-copy>${icon('copy')}</button></div>
    <p class="small muted" style="margin:14px auto 0;max-width:46ch;line-height:1.9">سيصل المقترح إلى سجل «المقترحات الواردة» لدى إدارة الشراكات. ستظهر لك أي ملاحظات أو طلبات استكمال في صفحة المقترح وفي «مقترحاتي».</p>
    <div class="row wrap" style="justify-content:center;margin-top:26px"><a class="btn primary" href="#/proposals/${x.id}">متابعة المقترح</a><a class="btn" href="#/share/new">مقترح جديد</a><a class="btn ghost" href="#/">الرئيسية</a></div></div>`;
  el.onclick = (e) => { if (e.target.closest('[data-copy]')) { navigator.clipboard && navigator.clipboard.writeText(x.ref).then(() => toast('نُسخ الرقم المرجعي')).catch(() => toast('انسخ الرقم يدويًا: ' + x.ref)); } };
}

/* ===== سجل المقترحات ===== */
function propTable(list, mine) {
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الرقم المرجعي</th><th>الجهة المستهدفة</th>${mine ? '' : '<th>الإدارة الطالبة</th>'}<th>مقدم الطلب</th><th>الحالة</th><th>آخر إجراء</th>${mine ? '<th></th>' : ''}</tr></thead><tbody>
    ${list.map((x) => { const age = propAgeDays(x); const old = ['submitted', 'info'].includes(x.status) && age > (D.settings.infoAgeDays || 7); const upd = x.events && x.events.length ? x.events[x.events.length - 1].at : x.updatedAt; const resub = x.status === 'submitted' && (x.events || []).some((e) => e.type === 'resubmitted');
      return `<tr data-prop="${x.id}"><td><span class="code" style="font-size:13.5px;color:var(--ink)">${esc(x.ref)}</span> ${demoTag(x)}</td><td><b style="font-weight:600">${esc(x.partnerName || '—')}</b></td>${mine ? '' : `<td class="small">${x.external ? '<span class="chip ext-chip">جهة خارجية</span>' : esc(x.department)}</td>`}<td class="small">${esc(x.requesterName || '—')}</td>
      <td>${propChip(x.status)}${resub ? ' <span class="chip info plain" title="أعادت الإدارة تقديمه بعد الاستكمال">مُستكمل</span>' : ''}</td><td><span class="age ${old ? 'old' : ''}">${relDays(upd)}</span></td>
      ${mine ? `<td>${x.status === 'info' ? `<a class="btn sm gold" href="#/share/${x.id}/edit">استكمال</a>` : x.status === 'draft' ? `<a class="btn sm" href="#/share/${x.id}/edit">متابعة</a>` : ''}</td>` : ''}</tr>`; }).join('')}
  </tbody></table></div>`;
}
function renderProposals(el, r) {
  const review = can('proposal.review'), dept = Session.role() === 'dept';
  if (!review && !dept) { el.innerHTML = noAccessHTML(); return; }
  const q = r.query || {};
  const st = { tabs: q.status && q.status !== 'all' ? q.status.split('|') : [], q: '', depts: q.dept ? q.dept.split('|') : [] };
  const statuses = D.settings.proposalStatuses.filter((s) => dept || s.id !== 'draft');
  el.innerHTML = `<div class="ph"><div><h1>${dept ? 'مقترحاتي' : 'المقترحات الواردة'}</h1><p>${dept ? `مقترحات ${esc(Session.dept())} وحالتها وملاحظات المراجعة.` : 'مقترحات الإدارات الأخرى المرسلة إلى إدارة الشراكات.'} ${prelimNote()}</p></div>
    <div class="ph-actions">${can('proposal.create') ? `<a class="btn primary" href="#/share/new">${icon('plus')} مقترح جديد</a>` : ''}</div></div>
    <div class="inbox-tabs" id="itabs"></div>
    <div class="reg-tools"><div class="searchbox">${icon('search')}<input id="iq" type="search" placeholder="بحث بالرقم المرجعي أو الجهة أو مقدم الطلب…"></div>
      ${dept ? '' : `<div class="idept-box">${comboHTML('idept', { options: L('departments'), value: st.depts, multi: true, placeholder: 'جميع الإدارات — اختر إدارة أو أكثر' })}</div>`}</div>
    <p class="hint itab-hint">يمكن اختيار أكثر من حالة: اضغط على الحالات المطلوبة، و«الكل» لإلغاء التصفية.</p>
    <div id="ibody" data-tour="proposals-list"></div>`;
  const base = () => visibleProposals().filter((x) => (dept ? x.department === Session.dept() : x.status !== 'draft' || x.createdByRole === Session.role()));
  const draw = () => {
    const all = base().filter((x) => (!st.depts.length || st.depts.includes(x.department)) && matchQ([x.ref, x.partnerName, x.requesterName, x.department, x.targets].join(' '), st.q));
    const tabs = [{ id: 'all', label: 'الكل', n: all.length }, ...statuses.map((s) => ({ id: s.id, label: s.label, n: all.filter((x) => x.status === s.id).length }))];
    $('#itabs', el).innerHTML = tabs.map((t) => `<button data-tab="${t.id}" class="${t.id === 'all' ? (!st.tabs.length ? 'on' : '') : st.tabs.includes(t.id) ? 'on multi' : ''}" aria-pressed="${t.id === 'all' ? !st.tabs.length : st.tabs.includes(t.id)}">${t.id !== 'all' && st.tabs.includes(t.id) ? icon('check') : ''}${esc(t.label)} <span class="n">${t.n}</span></button>`).join('');
    const list = (!st.tabs.length ? all : all.filter((x) => st.tabs.includes(x.status))).sort((a, b) => ((b.events || []).slice(-1)[0] || {}).at > ((a.events || []).slice(-1)[0] || {}).at ? 1 : -1);
    $('#ibody', el).innerHTML = list.length ? propTable(list, dept) : `<div class="panel">${emptyHTML({ ic: 'inbox', title: base().length ? 'لا توجد مقترحات ضمن هذا التبويب' : (dept ? 'لم تقدم إدارتك مقترحات بعد' : 'لم تصل مقترحات بعد'), text: base().length ? 'اختر تبويبًا آخر أو امسح البحث.' : (dept ? 'ابدأ بتقديم مقترح شراكة من «شارك».' : 'تظهر هنا المقترحات فور إرسالها من الإدارات.'), actions: can('proposal.create') ? `<a class="btn primary" href="#/share/new">${icon('plus')} مقترح جديد</a>` : '' })}</div>`;
  };
  draw();
  $('#iq', el).oninput = debounce((e) => { st.q = e.target.value.trim(); draw(); }, 150);
  bindCombos(el);
  el.addEventListener('cbchange', (e) => { if (e.target.closest('[data-cb="idept"]')) { st.depts = e.detail || []; draw(); } });
  el.onclick = (e) => {
    const t = e.target.closest('[data-tab]'); if (t) { const id = t.dataset.tab; st.tabs = id === 'all' ? [] : st.tabs.includes(id) ? st.tabs.filter((x) => x !== id) : [...st.tabs, id]; draw(); return; }
    const row = e.target.closest('[data-prop]'); if (row && !e.target.closest('a,button')) go('#/proposals/' + row.dataset.prop);
  };
}

/* ===== تفاصيل المقترح والمراجعة ===== */
function propTrack(x) {
  const evs = x.events || [];
  const had = (s) => evs.some((e) => e.to === s) || x.status === s;
  let steps = ['submitted', 'review'];
  if (had('info')) steps.push('info');
  steps.push(x.status === 'rejected' ? 'rejected' : 'accepted');
  if (x.status !== 'rejected') steps.push('converted');
  if (x.status === 'draft') steps = ['draft', 'submitted', 'review', 'accepted', 'converted'];
  const order = { draft: 0, submitted: 1, review: 2, info: 3, accepted: 4, rejected: 4, converted: 5 };
  const curI = steps.indexOf(x.status);
  return `<div class="prop-track">${steps.map((s, i) => {
    const done = curI > i || (x.status === 'converted' && s !== 'converted') ;
    const cur = s === x.status;
    return `${i ? `<span class="pt-line ${curI >= i ? 'done' : ''}"></span>` : ''}<span class="pt-step ${done ? 'done' : ''} ${cur ? 'cur' : ''} ${s === 'rejected' ? 'neg' : ''}"><span class="d"></span>${esc(propStatusLabel(s))}</span>`;
  }).join('')}</div>`;
}
const EV_LABEL = { created: 'أُنشئ المقترح كمسودة', submitted: 'قُدّم المقترح إلى إدارة الشراكات', resubmitted: 'أُعيد تقديم المقترح بعد الاستكمال', note: 'ملاحظة', edited: 'عُدّل المقترح' };
function renderProposal(el, r) {
  const x = D.proposals.find((p) => p.id === r.params.id);
  const review = can('proposal.review');
  if (!x || (x.demo && !showDemo()) || !(review || (Session.role() === 'dept' && x.department === Session.dept()))) {
    el.innerHTML = x && !review ? noAccessHTML() : emptyHTML({ ic: 'search', title: 'لم يُعثر على المقترح', actions: '<a class="btn" href="#/proposals">سجل المقترحات</a>' });
    return;
  }
  if (x.status === 'draft' && review && x.createdByRole !== Session.role()) { el.innerHTML = emptyHTML({ ic: 'lock', title: 'المقترح مسودة لم تُرسل بعد', text: 'لا تظهر المسودات لإدارة الشراكات حتى ترسلها الإدارة المقدمة.' }); return; }
  const mine = Session.role() === 'dept' && x.department === Session.dept();
  const pt = x.partnershipId ? D.partnerships.find((p) => p.id === x.partnershipId) : null;
  const sim = findSimilarPartners(x.partnerName);
  const evs = propEventsFor(x);
  const infoReq = x.status === 'info' ? [...x.events].reverse().find((e) => e.type === 'status' && e.to === 'info') : null;
  const kv = (l, v, full) => `<div class="${full ? 'full' : ''}"><dt>${esc(l)}</dt><dd>${v || '<span class="faint">—</span>'}</dd></div>`;
  let actionBox = '';
  if (review) {
    const A = {
      submitted: [['review', 'بدء الدراسة', 'primary'], ['info', 'طلب استكمال', ''], ['accepted', wfEvalDone(x) ? 'قبول المقترح' : 'التقييم المبدئي والقرار', ''], ['rejected', 'عدم القبول', 'danger']],
      review: [['info', 'طلب استكمال', ''], ['accepted', wfEvalDone(x) ? 'قبول المقترح' : 'التقييم المبدئي والقرار', 'primary'], ['rejected', 'عدم القبول', 'danger']],
      info: [['review', 'العودة إلى الدراسة', '']],
      accepted: [['convert', 'تحويل إلى شراكة', 'primary'], ['review', 'إعادة إلى الدراسة', '']],
      rejected: [['review', 'إعادة فتح المقترح', '']],
      converted: [],
    }[x.status] || [];
    if (['admin', 'team'].includes(Session.role()) && ['submitted', 'review', 'accepted'].includes(x.status)) A.push(['direct', isExistingReq(x) ? 'تسجيل الشراكة القائمة مباشرة' : 'تحويل مباشر', isExistingReq(x) ? 'primary' : '']);
    actionBox = `<div class="review-box no-print"><h3>إجراء إدارة الشراكات</h3>${x.external ? `<div class="note ext-note">${icon('send')}<span><b>مقترح من جهة خارجية</b> عبر رابط دعوة${x.extLabel ? ` («${esc(x.extLabel)}»)` : ''}. الرسالة التي تكتبها عند تغيير الحالة تظهر للجهة في صفحة المتابعة الخاصة بها.</span></div>` : ''}
      ${x.status === 'converted' && pt ? `<p class="small" style="margin-bottom:12px">أُنشئ من المقترح سجل الشراكة <a href="#/partnerships/${pt.id}"><b class="code" style="color:inherit">${esc(pt.code)}</b></a>. مرحلة الشراكة الحالية: <b>${esc(stageLabel(pt.stage))}</b>.</p>` : ''}
      ${x.status === 'info' ? `<p class="small muted" style="margin-bottom:12px">بانتظار استكمال الإدارة المقدمة منذ ${relDays(infoReq ? infoReq.at : x.updatedAt).replace('قبل ', '')}.</p>` : ''}
      ${A.length ? `<div class="acts2">${A.map(([k, l, c]) => `<button class="btn ${c}" data-act="${k}" ${A.length === 1 || (A.length === 3 && k === A[2][0] && false) ? 'style="grid-column:1/-1"' : ''}>${esc(l)}</button>`).join('')}</div>` : ''}
      <div class="field" style="margin-top:14px"><label for="pnote">إضافة ملاحظة</label><textarea class="in" id="pnote" rows="3" style="min-height:76px" placeholder="ملاحظة على المقترح…"></textarea>
        <div class="row" style="justify-content:space-between;margin-top:4px"><label class="check small"><input type="checkbox" id="pvis"> مرئية للإدارة المقدمة</label><button class="btn sm" data-addnote>إضافة</button></div></div>
      <p class="xs muted" style="margin-top:12px">${prelimNote()}</p></div>`;
  } else if (mine) {
    actionBox = `<div class="review-box no-print"><h3>متابعة المقترح</h3>
      ${x.status === 'info' ? `<div class="note warn" style="margin-bottom:12px">${icon('msg')}<div><b>مطلوب استكمال</b><div style="white-space:pre-wrap;margin-top:4px">${esc(infoReq && infoReq.message || '')}</div></div></div><a class="btn gold" style="width:100%" href="#/share/${x.id}/edit">استكمال المقترح</a>` : ''}
      ${x.status === 'draft' ? `<p class="small muted" style="margin-bottom:12px">المقترح مسودة ولم يُرسل بعد.</p><div class="acts2"><a class="btn primary" href="#/share/${x.id}/edit">متابعة وإرسال</a><button class="btn danger" data-deldraft>حذف المسودة</button></div>` : ''}
      ${['submitted', 'review'].includes(x.status) ? '<p class="small muted">المقترح لدى إدارة الشراكات. ستظهر هنا أي ملاحظات أو طلبات استكمال.</p>' : ''}
      ${x.status === 'accepted' ? '<p class="small">قُبل المقترح مبدئيًا. قبول المقترح لا يعني توقيع الشراكة.</p>' : ''}
      ${x.status === 'converted' ? '<p class="small">حُوّل المقترح إلى سجل شراكة تتابعه إدارة الشراكات حتى التوقيع والتفعيل.</p>' : ''}
      ${x.status !== 'draft' ? `<div class="field" style="margin-top:14px"><label for="pnote">رسالة إلى إدارة الشراكات</label><textarea class="in" id="pnote" rows="3" style="min-height:76px"></textarea><div class="row" style="justify-content:flex-end;margin-top:4px"><button class="btn sm" data-addnote>إرسال</button></div></div>` : ''}</div>`;
  }
  el.innerHTML = `${printHead('مقترح شراكة ' + x.ref)}
    <div class="prop-head"><div><div class="row" style="margin-bottom:6px"><span class="code" style="font-size:14px">${esc(x.ref)}</span>${propChip(x.status)} ${demoTag(x)}</div>
      <h1>${esc(x.partnerName || 'جهة غير محددة')}</h1><p class="muted small" style="margin-top:4px">${esc(x.department)} — ${esc(x.requesterName || 'مقدم الطلب غير محدد')}${x.submittedAt ? ` — قُدّم في ${fmtDate(x.submittedAt.slice(0, 10))}` : ''}</p></div>
      <div class="ph-actions"><a class="btn ghost" href="#/proposals">${icon('arrowR')} ${review ? 'المقترحات الواردة' : 'مقترحاتي'}</a><button class="btn" data-print>${icon('print')} طباعة</button></div></div>
    ${propTrack(x)}
    ${['draft'].includes(x.status) ? '' : `<div class="wf-wrap">${wfSectionHTML('proposal', x)}</div>`}
    <div class="dbody" style="padding:0;max-width:none"><div>
      <section class="dsec"><h2>الإدارة ومقدم الطلب <span class="src">من خانة «شارك»</span></h2><dl class="kv">${kv('اسم الإدارة الطالبة', esc(x.department))}${kv('اسم مقدم الطلب', esc(x.requesterName))}${x.requesterEmail ? kv('البريد الإلكتروني لمقدم الطلب', `<a href="mailto:${esc(x.requesterEmail)}" dir="ltr">${esc(x.requesterEmail)}</a>`) : ''}${kv('نوع الطلب', esc(x.reqType || REQ_TYPES[0]))}${kv('تصنيف الشراكة المقترح', esc(x.ptype || ''))}${kv('الهدف الاستراتيجي', esc(x.strategicGoal), true)}${kv('المبادرة الاستراتيجية', esc(x.initiative || ''), true)}</dl></section>
      <section class="dsec"><h2>الجهة المستهدفة <span class="src">من خانة «شارك»</span></h2>
        ${review && sim.length ? `<div class="note" style="margin-bottom:12px">${icon('building')}<span>الجهة مسجلة في سجل الجهات: ${sim.slice(0, 3).map((s) => `<a href="#/partners/${s.id}">${esc(s.name)}</a>`).join('، ')}</span></div>` : ''}
        <dl class="kv">${kv('اسم الجهة المستهدفة', esc(x.partnerName))}${kv('قطاع الجهة', esc(x.partnerSector))}${kv('مسؤول التواصل من الجهة', esc(x.contactName))}${kv('الرقم', x.contactPhone ? `<span class="num">${esc(x.contactPhone)}</span>` : '')}${kv('البريد الإلكتروني', x.contactEmail ? `<a href="mailto:${esc(x.contactEmail)}" dir="ltr">${esc(x.contactEmail)}</a>` : '', true)}</dl></section>
      <section class="dsec"><h2>فكرة الشراكة <span class="src">من خانة «شارك»</span></h2>
        <div class="xs muted" style="margin-bottom:4px">مستهدفات الشراكة</div>${richHTML(x.targets)}
        <div class="xs muted" style="margin:16px 0 4px">أسباب طلب الشراكة من الجهة</div>${richHTML(x.reasons)}
        <div class="xs muted" style="margin:16px 0 4px">القيمة المضافة</div>${richHTML(x.addedValue)}</section>
      <section class="dsec"><h2>المرفقات</h2>${attachmentsView(x.attachments, { emptyText: 'لم تُرفق ملفات بالمقترح.' })}</section>
      <section class="dsec"><h2>سجل المقترح والمراسلات</h2>${evs.length ? `<ul class="history">${evs.map((e) => `<li class="${e.vis === 'internal' ? 'internal' : ''} ${e.type === 'status' ? 'st' : ''}">
          <div>${e.type === 'status' ? `تغيرت الحالة: ${esc(propStatusLabel(e.from))} ← <b>${esc(propStatusLabel(e.to))}</b>` : esc(EV_LABEL[e.type] || e.type)}${e.vis === 'internal' ? ' <span class="chip gold plain" style="height:18px;font-size:11px">داخلية</span>' : ''}</div>
          <div class="w">${fmtDT(e.at)} — ${esc(e.by || '')}</div>${e.message ? `<div class="msg">${esc(e.message)}</div>` : ''}</li>`).join('')}</ul>` : '<p class="muted small">لا توجد أحداث.</p>'}</section>
    </div><aside class="dside" style="top:84px">${actionBox}
      ${pt && !review ? '' : ''}
      <div class="side-card" style="margin-top:16px"><h3>منفصل عن حالة الشراكة</h3><p class="small muted" style="line-height:1.85">حالة المقترح تخص دراسته فقط. بعد التحويل تُتابَع الشراكة في سجلها بمراحل مستقلة: قيد الإعداد، ثم بانتظار التوقيع، ثم موقّعة.</p></div></aside></div>`;
  hydrateFiles(el);
  bindWf(el, 'proposal', x);
  el.onclick = async (e) => {
    if (e.target.closest('[data-print]')) return window.print();
    if (e.target.closest('[data-deldraft]')) { if (await confirmDlg('حذف المسودة نهائيًا؟', { danger: true, ok: 'حذف' })) { await Repo.remove('proposals', x.id); await Repo.log('proposal.update', 'proposal', x.id, x.ref, 'حُذفت المسودة'); toast('حُذفت المسودة'); go('#/proposals'); } return; }
    if (e.target.closest('[data-addnote]')) {
      const t = $('#pnote', el).value.trim(); if (!t) return toast('اكتب نص الملاحظة أولًا.', 'err');
      const vis = review ? ($('#pvis', el).checked ? 'all' : 'internal') : 'all';
      await propEvent(x, { type: 'note', message: t, vis }); await Repo.save('proposals', x);
      await Repo.log('proposal.note', 'proposal', x.id, x.ref, vis === 'internal' ? 'ملاحظة داخلية' : 'رسالة مرئية');
      toast('أُضيفت الملاحظة'); return route();
    }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const k = a.dataset.act;
    if (k === 'convert') return convertDialog(x);
    if (k === 'direct') return convertDialog(x, true);
    if (k === 'info') { const v = await inputDlg({ title: 'طلب استكمال معلومات', label: 'ما المطلوب من الإدارة المقدمة؟', hint: 'تظهر الرسالة للإدارة المقدمة مع زر «استكمال المقترح».', ok: 'إرسال الطلب' }); if (!v) return; await setPropStatus(x, 'info', v.value, 'all'); toast('أُرسل طلب الاستكمال'); return route(); }
    if (k === 'rejected') { const v = await inputDlg({ title: 'عدم قبول المقترح', label: 'سبب عدم القبول', hint: 'يظهر السبب للإدارة المقدمة.', ok: 'تأكيد عدم القبول' }); if (!v) return; await setPropStatus(x, 'rejected', v.value, 'all'); toast('سُجّل عدم قبول المقترح'); return route(); }
    if (k === 'accepted' && !wfEvalDone(x)) { const c = wfStateOf('proposal', x).cur; toast('يُقبل المقترح بعد منهجية بناء الشراكات والتقييم المبدئي للشريك.'); return c && wfStepDialog('proposal', x, c.id, () => route()); }
    if (k === 'accepted') { const v = await inputDlg({ title: 'قبول المقترح', label: 'ملاحظة للإدارة المقدمة (اختيارية)', required: false, ok: 'قبول', hint: 'قبول المقترح لا يعني توقيع الشراكة؛ يمكن تحويله بعد ذلك إلى سجل شراكة.' }); if (v === null) return; await setPropStatus(x, 'accepted', v.value, 'all'); toast('قُبل المقترح'); return route(); }
    if (k === 'review') { await setPropStatus(x, 'review', '', 'all'); toast('المقترح قيد الدراسة'); return route(); }
  };
}
function convertDialog(x, direct = false) {
  const sim = findSimilarPartners(x.partnerName);
  const best = sim.find((s) => nameSimilarity(s.name, x.partnerName) >= 0.85);
  const m = Modal.open({
    title: `تحويل المقترح ${x.ref} إلى سجل شراكة`, size: 'lg',
    body: `<p class="small muted" style="margin-bottom:14px">تُنقل البيانات والمرفقات دون إعادة إدخال، ويبقى السجل مرتبطًا بالمقترح الأصلي. تبدأ الشراكة بمرحلة «${esc(stageLabel('prep'))}» ولا تُنشر في الواجهة حتى تقرر الإدارة ذلك.</p>
      <div class="flabel" style="margin-bottom:8px">الجهة الشريكة</div>
      <div class="stack" style="margin-bottom:18px">
        ${sim.map((s) => `<label class="check"><input type="radio" name="cvp" value="${s.id}" ${best && best.id === s.id ? 'checked' : ''}> ربط بالجهة المسجلة: <b>${esc(s.name)}</b> <span class="faint small">${esc(s.sector || '')}</span></label>`).join('')}
        <label class="check"><input type="radio" name="cvp" value="" ${best ? '' : 'checked'}> إنشاء جهة جديدة باسم: <b>${esc(x.partnerName)}</b></label>
      </div>
      <table class="map-tbl"><thead><tr><th>من المقترح</th><th></th><th>إلى سجل الشراكة</th></tr></thead><tbody>
        ${proposalMapping(x).map(([a, v, b]) => `<tr><td><b style="font-weight:500">${esc(a)}</b>${v ? `<div class="xs muted" style="margin-top:2px;max-height:40px;overflow:hidden">${esc(String(v).slice(0, 120))}</div>` : '<div class="xs faint">فارغ</div>'}</td><td>←</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>`,
    foot: `${['admin', 'team'].includes(Session.role()) ? `<label class="check small" style="margin-inline-end:auto"><input type="checkbox" id="cvDirect" ${direct ? 'checked' : ''}> تسجيل مباشر: تجاوز مراحل المسار حتى «${esc((WF_STEPS.find((s) => s.id === 'signed') || {}).t || 'التوقيع')}»</label>` : ''}<button class="btn primary" data-ok>${icon('convert')} إنشاء سجل الشراكة</button><button class="btn ghost" data-mclose>إلغاء</button>`,
  });
  m.el.querySelector('[data-ok]').onclick = async () => {
    const pid = (m.el.querySelector('input[name=cvp]:checked') || {}).value || '';
    const dir = !!(m.el.querySelector('#cvDirect') || {}).checked;
    const rec = await convertProposal(x, { partnerId: pid, newPartner: { name: x.partnerName, sector: x.partnerSector } });
    if (dir) await wfDirect(x, rec);
    m.close();
    toast(dir ? `أُنشئ سجل الشراكة ${rec.code} مباشرة — الخطوة الحالية: التوقيع` : `أُنشئ سجل الشراكة ${rec.code}`);
    go('#/partnerships/' + rec.id);
  };
}
