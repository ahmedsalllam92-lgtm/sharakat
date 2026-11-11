/* =====================================================================
   استعراض «دعوة جهة خارجية»: الشاشة مقسومة —
   يسار: إدارة الشراكات (تنشئ رابط الدعوة، تستلم المقترح، ترد عليه).
   يمين: متصفح الجهة الخارجية (تفتح الرابط، تملأ النموذج، تتابع الرد).
   يعمل في نسختين معزولتين بلا خادم ولا حفظ (مثل استعراض مسار الطلب).
   ===================================================================== */
const EXT_DEMO = { label: 'شركة الواحة الخضراء للتطوير', name: 'م. سارة العتيبي', title: 'مديرة الاستدامة', email: 'sara@alwaha-green.sa', phone: '0550000000', targets: 'حملات تشجير مشتركة في المدن\nبرامج توعية بيئية للموظفين والمجتمع\nتبادل الخبرات في إدارة المشاتل', value: 'زيادة الغطاء النباتي في المواقع التابعة للشركة وإشراك موظفيها في العمل التطوعي البيئي.', duration: 'سنتان' };
function extTourScenes() {
  const S = [
    { k: 'intro', stage: 'x1', t: 'دعوة جهة خارجية', run: extTIntro },
    { k: 'invite', stage: 'x1', t: 'إنشاء رابط الدعوة', run: extTInvite },
    { k: 'open', stage: 'x2', t: 'الجهة تفتح الرابط', run: extTOpen },
    { k: 'fill', stage: 'x2', t: 'تعبئة المقترح وإرساله', run: extTFill },
    { k: 'inbox', stage: 'x3', t: 'وصول المقترح إلى إدارة الشراكات', run: extTInbox },
    { k: 'reply', stage: 'x3', t: 'الرد على الجهة', run: extTReply },
    { k: 'track', stage: 'x4', t: 'الجهة تتابع الرد', run: extTTrack },
    { k: 'decide', stage: 'x4', t: 'القرار يصل للجهة', run: extTDecide },
    { k: 'end', stage: 'x4', t: 'الخلاصة', run: extTEnd },
  ];
  S.forEach((x, i) => { x.i = i; }); return S;
}
const EXT_STAGES = [['x1', 'رابط الدعوة'], ['x2', 'نموذج الجهة'], ['x3', 'استلام ورد'], ['x4', 'المتابعة والقرار']];
async function startExtTour() {
  if ($('#rqTour')) return;
  if (!window.__APP_SRC) return toast('تعذّر تجهيز نسخة الاستعراض.', 'err');
  if (App.tour) endTour();
  RQ.token++; const tk = RQ.token;
  Object.assign(RQ, { tk, scenes: extTourScenes(), stageIds: EXT_STAGES.map((x) => x[0]), i: 0, ended: false, waitChoice: null, accs: {}, paused: false, fast: false, snaps: [], choice: null, rec: null, kind: 'proposal', speed: window.__rqSpeed || +(D.settings.tourSpeed || 1), replay: startExtTour });
  window.__shkGetFile = (id) => Store.getFile(id);
  RQ.base = new Set((D.settings.notifs || []).map((n) => n.id)); RQ.shown = new Set();
  const data = sbxExport(); window.__shkSbx = { data: () => data };
  const root = document.createElement('div');
  root.id = 'rqTour'; root.className = 'tour rq rq-ext';
  root.innerHTML = `<div class="rq-top"><div class="rq-ttl"><span class="rq-eye">استعراض</span><b>دعوة جهة خارجية</b></div>
      <ol class="rq-stages" aria-label="المراحل">${EXT_STAGES.map(([id, t], i) => `<li data-rqst="${id}"><em>${i + 1}</em><span>${t}</span></li>`).join('')}</ol></div>
    <div class="rq-panes">
      <section class="rq-pane" data-side="r"><header><span class="rq-tag">متصفح الجهة الخارجية</span><b class="rq-who">${esc(EXT_DEMO.label)}</b></header><div class="rq-view"><div class="rq-load">جارٍ تجهيز نسخة معزولة…</div></div></section>
      <section class="rq-pane" data-side="l"><header><span class="rq-tag">داخل المنصة</span><b class="rq-who">${esc(wfActorName('partnerships'))}</b></header><div class="rq-view"><div class="rq-load">جارٍ تجهيز نسخة معزولة…</div></div></section>
    </div>
    <div class="rq-spot" hidden></div>
    <div class="tour-card rq-card" role="dialog" aria-live="polite" hidden><div class="tour-ch"><span class="tour-step"></span><span class="tour-design">نسخة معزولة</span></div><h3></h3><div class="tour-body"></div><div class="rq-choice" hidden></div></div>
    <div class="tour-bar" role="toolbar" aria-label="التحكم في الاستعراض">
      <button class="tb" data-rq="prev" title="السابق (→)">${icon('chevR')}</button>
      <button class="tb main" data-rq="play" title="تشغيل / إيقاف مؤقت (مسافة)">${icon('pause')}</button>
      <button class="tb" data-rq="next" title="التالي (←)">${icon('chevL')}</button>
      <div class="tb-prog"><span class="tb-txt"></span><div class="tb-track rq-track"></div></div>
      <label class="tb-speed" title="سرعة الاستعراض"><select data-rq="speed" aria-label="سرعة الاستعراض"><option value="0.75">بطيء</option><option value="1">عادي</option><option value="1.5">سريع</option></select></label>
      <button class="tb end" data-rq="end" title="إنهاء الاستعراض (Esc)">${icon('x')}<span>إنهاء</span></button></div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('rq-on');
  $('[data-rq="speed"]', root).value = String(RQ.speed);
  $('.rq-track', root).innerHTML = RQ.scenes.map((s, k) => `<button data-rqjump="${k}" title="${esc(s.t)}"></button>`).join('');
  root.addEventListener('click', rqClick);
  $('[data-rq="speed"]', root).onchange = (e) => { RQ.speed = +e.target.value; };
  document.addEventListener('keydown', rqKeys, true);
  window.addEventListener('resize', rqLayout);
  const adm = rqSess('partnerships', '');
  try {
    const [r, l] = await Promise.all([rqFrame('r', adm, '#/'), rqFrame('l', adm, '#/settings/external')]);
    if (tk !== RQ.token) return;
    RQ.f = { r, l }; rqLayout(); rqLoop(0);
  } catch (e) { if (e !== 'rq-abort' && tk === RQ.token) { console.error(e); toast('تعذّر تشغيل الاستعراض: ' + (e.message || e), 'err'); endReqTour(); } }
}
/* صفحات الجهة داخل النسخة اليمنى */
const extTW = () => rqW('r');
async function extTShowForm() { extTW().extFormPage('demo', { label: EXT_DEMO.label, org: { name: D.settings.org.name } }, { submit: (d) => extTW().extDemoSubmit(d) }); await rqSleep(250); }
async function extTShowTrack() { extTW().extTrackPage('demo', { status: () => extTW().extDemoStatus() }); await rqSleep(300); }
const extTRec = (sd) => rqW(sd).sbxD().proposals.filter((x) => x.external).pop();

function extTInbox0(link) {
  extTW().extShell(link ? `<div class="ext-card ext-mail"><div class="ext-mail-h"><span class="ext-ic">${icon('msg')}</span><div><b>${esc(D.settings.org.name)} — ${esc(D.settings.org.dept)}</b><small>إلى: ${esc(EXT_DEMO.email)}</small></div></div><h1>دعوة لاقتراح شراكة</h1><p>السادة ${esc(EXT_DEMO.label)}، يسعدنا اهتمامكم بالشراكة مع المؤسسة. يمكنكم تقديم مقترحكم مباشرة عبر الرابط التالي، ومتابعة الرد عليه:</p><div class="ext-link"><input readonly value="${esc(link)}"></div></div>`
    : `<div class="ext-card ext-center"><span class="ext-ic">${icon('msg')}</span><h1>بانتظار رابط الدعوة</h1><p>هذا متصفح الجهة الخارجية: ليس لها حساب في المنصة ولا ترى أي شيء منها، إلى أن تصلها دعوة.</p></div>`);
}
async function extTIntro() {
  extTInbox0(''); rqActive(null);
  rqCard({ step: 'نسخة معزولة — لا تُحفظ أي بيانات', t: 'دعوة جهة خارجية لاقتراح شراكة', wide: true, b: `<p>نتابع جهة من خارج المؤسسة (ليس لها حساب) من لحظة دعوتها حتى وصول القرار إليها.</p>
    <ul class="rq-ul"><li><b>يسار:</b> ${esc(wfActorName('partnerships'))} داخل المنصة: تنشئ رابط الدعوة، وتستلم المقترح، وترد عليه.</li><li><b>يمين:</b> ما تراه الجهة الخارجية في متصفحها عند فتح الرابط.</li><li>المقترح الخارجي يدخل «المقترحات الواردة» ويسير في المسار المعتمد كأي مقترح.</li></ul>` });
  await rqSleep(5600);
}
async function extTInvite() {
  const sd = 'l';
  await rqGo(sd, '#/settings/external'); const d = rqDoc(sd);
  await rqPoint(sd, '.sh-new', { step: wfActorName('partnerships') + ' · الإعدادات', t: 'مقترحات الجهات الخارجية', b: '<p>من الإعدادات ← «مقترحات الجهات الخارجية» تنشئ إدارة الشراكات رابط دعوة خاصًا بجهة معينة.</p>' }, 2600);
  RQ.cardStep = wfActorName('partnerships'); RQ.cardT = 'اسم الجهة المدعوة'; RQ.cardB = '<p>يظهر مسبقًا في نموذج الجهة.</p>';
  await rqType(sd, d.getElementById('exLabel'), EXT_DEMO.label);
  const ch = d.querySelector('[data-exd="30"]'); await rqPoint(sd, ch, { step: wfActorName('partnerships'), t: 'صلاحية الرابط', b: '<p>يوم، أو أسبوع، أو شهر، أو 3 أشهر، أو حتى تاريخ يُختار من التقويم. ويمكن إيقاف الرابط في أي وقت.</p>' }, 2200); ch.click(); await rqSleep(300);
  const u = rqDoc(sd).querySelector('[data-exu="1"]'); await rqPoint(sd, u, { step: wfActorName('partnerships'), t: 'عدد المقترحات', b: '<p>مقترح واحد، أو حتى 5، أو مفتوح. يُغلق الرابط تلقائيًا عند بلوغ العدد.</p>' }, 2000); u.click(); await rqSleep(300);
  const mk = rqDoc(sd).querySelector('[data-exmake]'); await rqPoint(sd, mk, { step: wfActorName('partnerships'), t: 'إنشاء الرابط', b: '<p>يُنشأ الرابط ويُنسخ ليُرسل للجهة (بريد أو واتساب).</p>' }, 1600); mk.click();
  await rqWaitFor(sd, '.sh-made', 3000);
  extTInbox0((rqDoc(sd).querySelector('#exUrl') || {}).value || 'https://sharakat-murooj.github.io/?propose=…');
  await rqPoint(sd, '.sh-made', { step: wfActorName('partnerships'), t: 'الرابط جاهز للإرسال', b: '<p>لا يحفظ الخادم الرابط نفسه بل بصمته فقط، ويظهر في قائمة «روابط الدعوة» بحالته وعدد استخدامه وزر «إيقاف».</p>' }, 3200);
}
async function extTOpen() {
  const sd = 'r'; rqActive(sd);
  if (!rqDoc(sd).querySelector('.ext-mail')) extTInbox0('https://sharakat-murooj.github.io/?propose=…');
  await rqPoint(sd, '.ext-mail', { step: 'الجهة الخارجية · البريد', t: 'تصل الدعوة للجهة', b: '<p>يُرسل الرابط بالبريد أو واتساب، وتفتحه الجهة من أي جهاز.</p>' }, 2600);
  await extTShowForm();
  await rqPoint(sd, '.ext-intro', { step: 'الجهة الخارجية', t: 'تفتح الجهة الرابط', b: '<p>صفحة بهوية المؤسسة، بلا تسجيل دخول ولا حساب. لا ترى الجهة أي شيء من بيانات المنصة.</p>' }, 3400);
  await rqPoint(sd, '[data-k="partnerName"]', { step: 'الجهة الخارجية', t: 'اسم الجهة جاهز', b: '<p>من اسم الدعوة، ويمكنها تعديله.</p>' }, 1800);
}
async function extTFill() {
  const sd = 'r'; const d = rqDoc(sd);
  if (!d.querySelector('.ext-form')) await extTShowForm();
  const D2 = rqDoc(sd);
  const sec = D2.querySelector('[data-k="partnerSector"]'); if (sec) { sec.value = 'خاص'; }
  const fill = [['requesterName', EXT_DEMO.name, 'مقدم الطلب'], ['requesterTitle', EXT_DEMO.title, 'المنصب'], ['requesterEmail', EXT_DEMO.email, 'البريد الإلكتروني'], ['targets', EXT_DEMO.targets, 'مجالات التعاون المقترحة'], ['addedValue', EXT_DEMO.value, 'القيمة المضافة والأثر المتوقع'], ['duration', EXT_DEMO.duration, 'المدة المقترحة']];
  for (const [k, v, l] of fill) { RQ.cardStep = 'الجهة الخارجية · النموذج'; RQ.cardT = l; RQ.cardB = '<p>الحقول المعلَّمة بنجمة إلزامية، ويتحقق النموذج منها قبل الإرسال.</p>'; await rqType(sd, D2.querySelector(`[data-k="${k}"]`), v); }
  const btn = D2.querySelector('.ext-form [type=submit]'); await rqPoint(sd, btn, { step: 'الجهة الخارجية', t: 'إرسال المقترح', b: '<p>يصل مباشرة إلى إدارة الشراكات.</p>' }, 1500);
  btn.click(); await rqWaitFor(sd, '.ext-link', 4000);
  const x = extTRec(sd); RQ.rec = x ? { id: x.id } : null;
  await rqPoint(sd, '.ext-card', { step: 'الجهة الخارجية', t: 'رقم المقترح ورابط المتابعة', b: `<p>تحصل الجهة على الرقم <b dir="ltr">${esc(x ? x.ref : '')}</b> ورابط متابعة خاص بها تعود إليه لمعرفة الحالة والرد.</p>` }, 3600);
}
async function extTInbox() {
  const sd = 'l'; await rqSync('r', 'l', { bell: false });
  await rqGo(sd, '#/proposals'); await rqSleep(300);
  const row = rqDoc(sd).querySelector('.ext-chip'); const tr = row && row.closest('tr');
  await rqPoint(sd, tr || row, { step: wfActorName('partnerships') + ' · المقترحات الواردة', t: 'وصل المقترح', b: '<p>يظهر في «المقترحات الواردة» مع باقي المقترحات، بوسم <b>«جهة خارجية»</b> يبيّن مصدره.</p>' }, 3600);
}
async function extTReply() {
  const sd = 'l', x = extTRec(sd); if (!x) return;
  await rqGo(sd, '#/proposals/' + x.id); await rqSleep(300);
  await rqPoint(sd, '.ext-note', { step: wfActorName('partnerships') + ' · صفحة المقترح', t: 'مصدر المقترح', b: '<p>اسم الجهة ومقدم الطلب وبريده، وتنبيه أن رسائل تغيير الحالة تظهر للجهة. يسير المقترح في المسار المعتمد: منهجية بناء الشراكات، والتقييم المبدئي، ثم القرار.</p>' }, 3800);
  const b = rqDoc(sd).querySelector('[data-act="info"]'); await rqPoint(sd, b, { step: wfActorName('partnerships'), t: 'طلب استكمال من الجهة', b: '<p>كل إجراء على المقترح يمكن أن يحمل رسالة للجهة.</p>' }, 1800);
  b.click(); const ta = await rqWaitFor(sd, '.modal textarea, .modal input', 3000);
  RQ.cardStep = wfActorName('partnerships'); RQ.cardT = 'رسالة للجهة'; RQ.cardB = '<p>تظهر هذه الرسالة في صفحة متابعة الجهة.</p>';
  await rqType(sd, ta, 'نرجو تزويدنا بنبذة عن مشاريعكم البيئية السابقة والمواقع المقترحة للتشجير.');
  const ok = rqDoc(sd).querySelector('.modal [data-ok]'); await rqPoint(sd, ok, { step: wfActorName('partnerships'), t: 'إرسال الطلب', b: '' }, 900); ok.click(); await rqSleep(700);
}
async function extTTrack() {
  const sd = 'r'; await rqSync('l', 'r', { bell: false }); rqActive(sd); await extTShowTrack();
  await rqPoint(sd, '.ext-steps', { step: 'الجهة الخارجية · رابط المتابعة', t: 'أين وصل المقترح', b: '<p>ثلاث مراحل واضحة: تم الاستلام، قيد الدراسة، القرار.</p>' }, 2600);
  await rqPoint(sd, '.ext-msgs', { step: 'الجهة الخارجية', t: 'رسالة إدارة الشراكات', b: '<p>ترى الجهة الحالة والرسائل الموجهة لها فقط، ولا ترى الملاحظات الداخلية أو بيانات المنصة.</p>' }, 3600);
}
async function extTDecide() {
  const sd = 'l', w = rqW(sd), x = extTRec(sd); if (!x) return;
  await rqGo(sd, '#/proposals/' + x.id); await rqSleep(300);
  await rqPoint(sd, '.review-box', { step: wfActorName('partnerships'), t: 'بعد الدراسة: القرار', b: '<p>بعد منهجية بناء الشراكات والتقييم المبدئي تقبل الإدارة المقترح أو تعتذر عنه، مع رسالة للجهة.</p>' }, 2800);
  await w.setPropStatus(x, 'accepted', 'يسعدنا قبول مقترحكم مبدئيًا، وسيتواصل معكم فريق الشراكات لترتيب الاجتماع التعريفي.', 'all'); w.route(); await rqSleep(500);
  await rqSync('l', 'r', { bell: false }); rqActive('r'); await extTShowTrack();
  await rqPoint('r', '.ext-status', { step: 'الجهة الخارجية', t: 'وصل القرار', b: '<p>تتحدث صفحة المتابعة تلقائيًا بالحالة والرسالة، ويبدأ بعدها مسار الشراكة داخل المنصة كأي شراكة.</p>' }, 3800);
}
async function extTEnd() {
  RQ.ended = true; rqActive(null);
  rqCard({ step: 'نهاية الاستعراض', t: 'دعوة الجهات الخارجية في سطور', wide: true, b: `<ul class="rq-ul"><li>رابط دعوة بمدة محددة وعدد مقترحات، يمكن إيقافه في أي وقت.</li><li>الجهة تقترح بلا حساب، وتحصل على رقم ورابط متابعة.</li><li>المقترح يدخل «المقترحات الواردة» بوسم «جهة خارجية» ويسير في المسار المعتمد.</li><li>رسائل تغيير الحالة تصل للجهة في صفحة المتابعة.</li></ul>
    <p class="small muted">كل ما جرى كان في نسخة معزولة؛ بيانات المنصة كما هي.</p><div class="row" style="gap:8px;margin-top:12px"><button class="btn" type="button" data-rqreplay>${icon('history')} إعادة الاستعراض</button><button class="btn primary" type="button" data-rqclose>إنهاء</button></div>` });
}
