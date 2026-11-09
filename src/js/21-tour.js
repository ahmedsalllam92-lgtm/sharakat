/* ===== استعراض المنصة: جولة تفاعلية داخل الصفحات الفعلية وفي الاتجاه المختار ===== */
const TOUR = { steps: [], i: 0, part: 0, playing: true, speed: 1, startHash: '#/', elapsed: 0, last: 0, raf: null, fsByTour: false, busy: false, token: 0 };
const TOUR_PART_SEC = 6.8;

/* — أدوات العرض الحي: مؤشر متحرك يكتب ويضغط فعليًا ثم تُعاد الحالة كما كانت — */
const TA = {
  tok: 0,
  chk() { if (TA.tok !== TOUR.token || !App.tour) throw new Error('tour-step-changed'); },
  q(sel) { return typeof sel === 'string' ? $$(sel).find((x) => x.getClientRects().length) : sel; },
  find(sel, text) { return $$(sel).find((x) => x.getClientRects().length && x.textContent.includes(text)); },
  async wait(ms) { await sleep(ms / Math.max(0.5, TOUR.speed)); TA.chk(); },
  async point(sel) {
    const el = TA.q(sel); TA.chk(); if (!el) return null;
    const r = el.getBoundingClientRect(), c = $('#tour .tour-cursor');
    c.hidden = false; c.style.left = `${r.left + Math.min(r.width / 2, 60)}px`; c.style.top = `${r.top + r.height / 2}px`;
    await TA.wait(700); return el;
  },
  async click(sel) {
    const el = await TA.point(sel); if (!el) return null;
    const c = $('#tour .tour-cursor'); c.classList.remove('clk'); void c.offsetWidth; c.classList.add('clk');
    await TA.wait(180); el.click(); await TA.wait(450); return el;
  },
  async hover(sel) {
    const el = await TA.point(sel); if (!el) return null;
    const r = el.getBoundingClientRect(), o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    el.dispatchEvent(new MouseEvent('mouseover', o)); el.dispatchEvent(new MouseEvent('mousemove', o)); await TA.wait(1300);
    el.dispatchEvent(new MouseEvent('mouseout', o)); return el;
  },
  async type(sel, text) {
    const el = await TA.click(sel); if (!el) return null;
    for (const ch of text) { el.value += ch; el.dispatchEvent(new Event('input', { bubbles: true })); await TA.wait(110); }
    await TA.wait(900); return el;
  },
  async clear(sel) { const el = TA.q(sel); if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); } await TA.wait(250); },
  hide() { const c = $('#tour .tour-cursor'); if (c) c.hidden = true; },
};
async function tourGo(h) { if (location.hash === h) route(); else location.hash = h; await sleep(450); }

function tourSteps() {
  const real = D.partnerships.find((p) => !p.demo && !p.isDraft && p.coverFileId && p.coverFileId.startsWith('asset:'))
    || visiblePartnerships({ includeDrafts: false }).find((p) => p.public) || visiblePartnerships({ includeDrafts: false })[0];
  const S = [];
  S.push({ key: 'intro', title: 'فكرة المنصة', route: '#/', parts: [
    { sel: ['.hero-inner', '.st-hero-in', '.cm-banner-in', '.sh-hero-in', '.bd-hero-in', '[data-tour="home-hero"]'], h: D.settings.org.platform, what: 'منظومة واحدة تدير شراكات المؤسسة: من مقترح الإدارة، إلى التوقيع، ثم المتابعة وقياس الأثر.', why: 'بدل ملفات Excel والمراسلات المتفرقة: سجل موحد، ومؤشرات تتحدث تلقائيًا، وملفات محفوظة مع كل شراكة.', how: 'الأرقام على الصورة حيّة: تتغير فور إضافة شراكة أو انتهائها. اضغط أي رقم لفتح سجلاته.', act: async () => { await TA.hover('.hfx-b'); } },
  ] });
  S.push({ key: 'home', title: 'الرئيسية والأثر', route: '#/', parts: [
    { sel: ['.kband', '.st-stats', '.cm-kpis', '.sh-nums', '.bd-steps', '[data-tour="home-impact"]'], h: 'الأثر بالأرقام', what: 'أرقام الفترة التي تحددها الإدارة: الشراكات السارية، والجهات، والمخرجات المستهدفة.', why: 'تعرض للقيادات والزوار حجم الشراكات بصدق ودون تحديث يدوي.', how: 'تُختار الأرقام المعروضة وفترتها من «الإعدادات ← محتوى الرئيسية».' },
    { sel: ['.spot', '.st-pgrid .st-card:nth-child(2)', '.st-card.lead .st-card-body', '.cm-table', '.sh-card', '.bd-card', '[data-tour="home-partnerships"]'], h: 'الشراكات المختارة', what: 'بطاقات بصرية للشراكات المنشورة: الشعار والصورة والهدف وأبرز نتيجة.', why: 'تسويق إنجازات الإدارة بشكل جذاب، دون إظهار بيانات التواصل أو المستندات الداخلية.', how: 'يختار الفريق الشراكات المميزة وترتيبها، ويضغط الزائر أي بطاقة لفتح تفاصيلها.' },
  ] });
  if (can('view.dashboard')) {
    S.push({ key: 'dash', title: 'لوحة المؤشرات', route: '#/dashboard', parts: [
      { sel: ['[data-tour="dash-kpis"]'], h: 'المؤشرات التنفيذية', what: 'الشراكات السارية، والتي تنتهي قريبًا، والجهات، والمقترحات قيد المعالجة، واكتمال البيانات.', why: 'صورة فورية عن الوضع، محسوبة من السجلات لحظة فتح الصفحة.', how: 'اضغط أي بطاقة لفتح السجلات التي تمثلها مباشرة.' },
      { sel: ['[data-tour="dash-status"]', '.dz-line', '[data-tour="dash-evolution"]', '.sd-stats'], h: 'الرسوم التفاعلية', what: 'تركيب المحفظة، وتطورها، والتوزيع حسب القطاع والتصنيف والإدارة والمسؤول.', why: 'الضغط على أي جزء يصفّي اللوحة كاملة، ويمكن التراجع أو إعادة التعيين بضغطة.', how: 'مرّر المؤشر فوق أي جزء لرؤية الرقم والنسبة، واضغطه للتصفية.', act: async () => { await TA.hover('.dz3-seg, .dz-stbar a, .ev-hit, .sb-seg, .hm-c'); } },
    ] });
    S.push({ key: 'actions', title: 'مركز الإجراءات', route: '#/dashboard', parts: [
      { sel: ['.dz-acts', '.sd-list li:first-child', '.cd-al', '[data-tour="dash-actions"]'], h: 'ما يحتاج متابعة', what: 'بنود عملية: مقترحات بانتظار الدراسة، وشراكات تقترب من الانتهاء، وبيانات ناقصة.', why: 'يحوّل المؤشرات إلى مهام واضحة حتى لا يفوت الفريق قرار تجديد أو مقترحًا متأخرًا.', how: `كل بند يفتح السجلات المعنية فورًا. ويظهر تنبيه عاجل قبل الانتهاء بـ ${D.settings.alertDays || 30} يومًا.`, act: async () => { await TA.point('.dz-act, .sd-list li a, .cd-a'); } },
    ] });
  }
  S.push({ key: 'register', title: 'سجل الشراكات', route: '#/partnerships', parts: [
    { sel: ['.reg-tools .searchbox', '[data-tour="reg-tools"]'], h: 'البحث الذكي', what: 'بحث فوري باسم الجهة أو الرمز أو أي نص في الشراكة، يتجاهل فروق الهمزات والتاء المربوطة. ومن أي صفحة: Ctrl+K للوصول السريع إلى أي شراكة أو جهة أو أمر.', why: 'يصل المستخدم إلى أي شراكة في ثوانٍ.', how: 'شاهد: نكتب «حرس» فتظهر النتائج المطابقة فورًا.', act: async () => { await TA.type('.reg-tools .searchbox input', 'حرس'); await TA.clear('.reg-tools .searchbox input'); } },
    { sel: ['#regF'], h: 'الفلاتر المتعددة', what: 'فلاتر بالحالة والتصنيف والقطاع والإدارة والمسؤول وسنة البدء، وكل فلتر يقبل أكثر من اختيار.', why: 'تكوين أي قائمة مطلوبة: «السارية في القطاع الحكومي» أو «المنتهية هذا العام».', how: 'شاهد: نختار «سارية» من فلتر الحالة.', act: async () => { const fb = $('#regF'); if (fb) { window.scrollTo({ top: Math.max(0, fb.getBoundingClientRect().top + scrollY - 150) }); await TA.wait(250); } await TA.click('#regF .fbtn[data-dim="status"]'); const o = TA.find('#regF .fpop .fo', 'سارية'); if (o) await TA.click(o.querySelector('input') || o); const d = TA.q('#regF [data-done]'); if (d) await TA.click(d); await TA.wait(1200); TA.hide(); await tourGo('#/partnerships'); } },
    { sel: ['.reg-meta .seg', '.seg'], h: 'طرق العرض', what: 'جدول عملي للمراجعة، أو بطاقات بصرية بالصور.', why: 'الجدول للعمل اليومي والتصدير، والبطاقات للعرض على القيادات.', how: 'شاهد: نبدّل طريقة العرض ثم نعود.', act: async () => { const b = $$('.reg-meta .seg [data-view], .seg [data-view]'); const on = b.find((x) => x.classList.contains('on')), off = b.find((x) => !x.classList.contains('on')); if (off) { await TA.click(off); await TA.wait(900); } if (on) await TA.click(on); } },
    { sel: ['#regBody tbody tr:first-child', '#regBody .pc:first-child', '.st-reg .st-card:first-child', '.cm-detail', '#regBody .pcard:first-child'], h: design() === 'command' ? 'القائمة والتفاصيل والمقارنة' : 'كل شراكة في سطر واضح', what: design() === 'command' ? 'اختيار أي سجل يعرض تفاصيله جانبًا، ويمكن تحديد حتى 3 شراكات ومقارنتها.' : 'الحالة محسوبة من التواريخ، مع الفترة والمتبقي والمسؤول وتنبيه الانتهاء.', why: 'قراءة سريعة لوضع كل شراكة دون فتحها.', how: 'اضغط السجل لفتح صفحته الكاملة، أو نزّل القائمة Excel أو أصدر لها تقريرًا.' },
  ] });
  if (real) S.push({ key: 'detail', title: 'تفاصيل الشراكة', route: '#/partnerships/' + real.id, parts: [
    { sel: ['.dhead-in', '[data-tour="detail-head"]'], h: 'صفحة الشراكة', what: 'الجهة والتصنيف والحالة المحسوبة، مع صور الشراكة في الغلاف.', why: 'كل ما يخص الشراكة في مكان واحد منظم.', how: 'تنقّل بين الأقسام من الشريط أسفل الغلاف.' },
    can('view.internal') ? { sel: ['.fcat.wide', '.fcat', '[data-tour="detail-files"]'], tab: 'files', h: 'الملفات والصور', what: 'الاتفاقية وتقارير الشراكة وتقييمها وصورها، مصنفة في بطاقات.', why: 'المستندات محفوظة مع سجلها، وتبقى داخلية لا تظهر في الواجهة التعريفية.', how: 'اضغط «رفع» أو اسحب الملف إلى تصنيفه، واختر أي صورة غلافًا للشراكة.' } : null,
    { sel: ['.dside'], tab: 'ov', h: 'الفترة والمسؤولون', what: 'شريط مدة الشراكة والمتبقي، والمسؤولون من إدارة الشراكات، واكتمال البيانات.', why: 'يعرف كل مسؤول ما عليه متابعته ومتى يحين التجديد.', how: 'أكمل البيانات الناقصة من زر «استكمال البيانات».' },
    can('view.internal') ? { sel: ['#wf .wf-phases', '#wf'], tab: 'wf', h: 'مسار المذكرة ونماذجه', what: `${WF_STEPS.length} مرحلة معتمدة من الطلب إلى تقارير التفعيل، ولكل مرحلة مسؤولها ومستنداتها ونماذجها (المنهجية، والتقييم المبدئي، والمذكرة، والمواءمة، والخطاب، ومراجعة الخطابات).`, why: 'يعرف كل طرف أين تقف المذكرة ومن عليه الدور الآن، وتُحفظ النماذج المكتملة في ملف الشراكة.', how: 'زر الخطوة الحالية يفتح نافذة التنفيذ: تعبئة النموذج أو رفع المستند ثم الاعتماد أو الإعادة بملاحظات.' } : null,
    can('view.internal') ? { sel: ['[data-tour="detail-dossier"]', '.dbar-acts'], h: 'الملف الشامل', what: 'ملف واحد للطباعة أو PDF يجمع بيانات الشراكة ونماذجها ومستنداتها وصورها بغلاف وفهرس.', why: 'يُرفع للقيادات أو يُحفظ كأرشيف دون تجميع يدوي.', how: 'اضغط «الملف الشامل» واختر ما يدخل فيه.' } : null,
    can('view.reports') ? { sel: ['[data-tour="detail-report"]'], h: 'تقرير بضغطة', what: 'زر يفتح تقرير هذه الشراكة جاهزًا في قسم التقارير.', why: 'لا حاجة لتجميع البيانات يدويًا عند طلب تقرير عن شراكة.', how: 'اضغط «تقرير»، ثم نزّله PowerPoint أو PDF أو اعرضه بملء الشاشة.' } : null,
  ].filter(Boolean) });
  if (can('view.partners')) S.push({ key: 'partners', title: 'الجهات الشريكة', route: '#/partners', parts: [
    { sel: ['#pbody tbody tr:first-child', '#pbody .pcard:first-child', '#pbody .tbl-wrap', '#pbody'], h: 'سجل موحد للجهات', what: 'كل جهة مرتبطة بشراكاتها ومقترحاتها، مع أسمائها البديلة وشعارها.', why: 'يمنع تكرار الجهة بأسماء مختلفة، وينبّه إلى الأسماء المتقاربة لدمجها.', how: 'افتح الجهة لعرض شراكاتها، واستخدم «مراجعة ودمج» عند ظهور تنبيه التكرار.' },
  ] });
  if (can('proposal.create')) S.push({ key: 'share', title: 'تقديم مقترح جديد', route: '#/share/new', demo: true, parts: [
    { sel: ['#wsteps'], h: `مسار «شارك» بـ${plural(S_STEPS.length, 'خطوة واحدة', 'خطوتين', 'خطوات', 'خطوة')}`, what: 'نموذج تملؤه الإدارات لاقتراح جهة للشراكة: بيانات المقدم، ثم الجهة، ثم الفكرة، ثم المرفقات.', why: 'وصول منظم لمقترحات الإدارات، مع حفظ المسودة ورقم مرجعي للمتابعة.', how: 'البيانات المعروضة توضيحية مؤقتة ولن تُحفظ.' },
    { sel: ['#wpanel .fpanel-b', '#wpanel'], h: 'تعبئة سهلة', what: 'حقول واضحة مع تنبيهات، وقوائم جاهزة من إعدادات المنصة.', why: 'يقلّل ذهاب وإياب الاستيضاح بين الإدارات وإدارة الشراكات.', how: 'شاهد: ننتقل إلى الخطوة التالية.', act: async () => { const n = TA.q('[data-wn]'); if (n) { await TA.click(n); App.dirty = false; } } },
  ] });
  else S.push({ key: 'share', title: 'خدمة «شارك»', route: '#/share', parts: [
    { sel: ['.share-intro', '[data-tour="share-intro"]'], h: 'خدمة «شارك»', what: 'نقطة دخول الإدارات لاقتراح جهات للشراكة، مع شرح مراحل المقترح.', why: 'تنظّم وصول المقترحات إلى إدارة الشراكات.', how: 'يقدّم ممثلو الإدارات المقترح من «ابدأ مقترحًا جديدًا».' },
  ] });
  if (can('proposal.review') || Session.role() === 'dept') S.push({ key: 'proposals', title: 'متابعة المقترحات', route: '#/proposals', parts: [
    { sel: ['#itabs'], h: can('proposal.review') ? 'المقترحات حسب الحالة' : 'مقترحاتي', what: 'حالات المقترح: مقدم، قيد الدراسة، بانتظار الاستكمال، مقبول، محوّل إلى شراكة.', why: 'يعرف الجميع أين وصل كل مقترح، ويمكن اختيار أكثر من حالة معًا.', how: 'شاهد: نختار «مقدم» و«قيد الدراسة» معًا ثم نعود إلى الكل.', act: async () => { await TA.click('#itabs [data-tab="submitted"]'); await TA.click('#itabs [data-tab="review"]'); await TA.wait(800); await TA.click('#itabs [data-tab="all"]'); } },
    { sel: ['[data-tour="proposals-list"]'], h: 'مراجعة وتحويل', what: can('proposal.review') ? 'تراجع إدارة الشراكات المقترح، وتطلب استكماله، ثم تحوّل المقبول إلى شراكة دون إعادة إدخال.' : 'تتابع الإدارة مقترحاتها وطلبات الاستكمال برقمها المرجعي.', why: 'لا يضيع أي مقترح، ويُحفظ سجل كل خطوة.', how: 'اضغط أي مقترح لعرض تفاصيله والإجراءات المتاحة لدورك.' },
  ] });
  if (can('view.reports')) S.push({ key: 'reports', title: 'التقارير', route: '#/reports', prep: () => { if (!App.ui.rpt.ids.length && real) App.ui.rpt.ids = [real.id]; }, parts: [
    { sel: ['#rpPD'], h: 'اختيار الشراكات', what: 'قائمة منسدلة بالبحث و«تحديد الكل»، مع فلاتر متعددة لاختيار مجموعة كاملة مثل الساري أو المنتهي.', why: 'تقرير عن شراكة واحدة أو عن المحفظة كلها، بغلاف لكل شراكة.', how: 'شاهد: نفتح القائمة.', act: async () => { await TA.click('[data-rpd]'); await TA.wait(1200); await TA.click('[data-rpd]'); } },
    { sel: ['#rpDD'], h: 'مكونات التقرير', what: `${RPT_SECTIONS.length} مكوّنًا: فهرس، ولمحة بالرسوم، وملخص تنفيذي، وبيانات، وتعاون، وأثر، وفريق، وملفات، وصور…`, why: 'كل تقرير على مقاس الحاجة، والتغيير يظهر في المعاينة فورًا.', how: 'شاهد: نزيل «صور الشراكة» ثم نعيدها.', act: async () => { await TA.click('[data-rdd]'); if (TA.q('[data-rsec="photos"]')) { await TA.click('[data-rsec="photos"]'); await TA.wait(700); await TA.click('[data-rsec="photos"]'); } await TA.click('[data-rdd]'); } },
    { sel: ['.rs-frame'], h: 'معاينة قابلة للتعديل', what: 'شرائح التقرير كما ستُنزَّل، بألوان شكل المنصة الحالي ومن اليمين إلى اليسار.', why: 'تعدّل أي نص مباشرة قبل التنزيل دون تغيير سجلات الشراكة.', how: 'اضغط أي نص واكتب، ثم نزّل PowerPoint أو PDF، أو اعرضه بملء الشاشة.' },
  ] });
  /* — صفحات العمل اليومي والعرض: تُضاف حسب صلاحية الحساب — */
  if (Session.role() !== 'viewer') S.push({ key: 'tasks', title: 'مهامي', route: '#/tasks', parts: [
    { sel: ['.tk-sum', '.tk-list', '#main .ph'], h: 'مهامي', what: 'كل ما على حسابك الآن: خطوات المسار المسندة لإدارتك، والمستندات المطلوبة، والمتأخر منها.', why: 'لا ينتظر الطلب أحدًا دون أن يعرف؛ كل مهمة تفتح الخطوة مباشرة.', how: 'اضغط المهمة لتنتقل إلى الخطوة وتنفذها من نافذتها.' },
  ] });
  if (can('view.internal')) S.push({ key: 'process', title: 'مخطط مسار الشراكة', route: '#/process', parts: [
    { sel: ['.pr-map', '.pr-cols', '#main .page'], h: 'المخطط الكامل للإجراء', what: 'خريطة المراحل حسب الإدارات: من يبدأ، ومن يراجع، ومن يعتمد، ومسارات الإعادة بملاحظات.', why: 'مرجع واحد يشرح الإجراء المعتمد لأي إدارة جديدة.', how: 'مرّر للأسفل لتبقى رؤوس الإدارات ثابتة، واطبع المخطط A4 بالعرض.' },
  ] });
  if (can('view.reports')) S.push({ key: 'marketing', title: 'التقرير التسويقي', route: '#/reports/marketing', parts: [
    { sel: ['.mk-head', '.mk-scope'], h: 'تقرير تسويقي جاهز', what: 'شرائح تُبنى من البيانات لكل الشراكات أو لشراكة واحدة: الجهة، والتعاون، والفريق، والمسار الزمني، والصور والوثائق.', why: 'عرض للعملاء والقيادات دون تصميم يدوي، ويتحدث مع كل تعديل في السجلات.', how: 'اختر النطاق أو الشراكة، ثم «عرض» بملء الشاشة أو PDF مع المستندات.' },
  ] });
  S.push({ key: 'stories', title: 'الإنجازات وقصص الأثر', route: '#/stories', parts: [
    { sel: ['#main .cards', '#main .ph'], h: 'قصص الأثر', what: 'إنجازات موثقة بالصور والأرقام ومربوطة بشراكاتها.', why: 'تحوّل نتائج الشراكات إلى قصص تظهر في الرئيسية والتقارير.', how: 'أضف إنجازًا من صفحة الشراكة أو من هنا، وحدد رقمه البارز وصوره.' },
  ] });
  if (can('view.internal')) S.push({ key: 'media', title: 'مركز الصور', route: '#/media', parts: [
    { sel: ['.m-tools', '#mStats', '#main .ph'], h: 'مكتبة الصور والملفات', what: 'كل صور الشراكات والإنجازات في مكان واحد، مع البحث والتصفية حسب المصدر.', why: 'إعادة استخدام الصور في التقارير والعروض دون البحث في المجلدات.', how: 'ارفع الصور واربطها بالشراكة، وتُضغط تلقائيًا للحفاظ على المساحة.' },
  ] });
  S.push({ key: 'gallery', title: 'معرض الأثر', route: '#/gallery', parts: [
    { sel: ['.gal-hero', '.gal'], h: 'معرض الأثر', what: 'واجهة عرض بصرية للصور والقصص بملء الشاشة.', why: 'مناسبة للعرض في الاجتماعات والمعارض.', how: 'اختر شراكة أو قصة لتنتقل بين صورها.' },
  ] });
  if (can('manage.content')) S.push({ key: 'content', title: 'إدارة المحتوى', route: '#/content', parts: [
    { sel: ['.inbox-tabs', '#cbody', '#main .ph'], h: 'إدارة المحتوى', what: 'ما يظهر في الرئيسية والعروض: الشراكات المميزة، والأخبار، والإنجازات المنشورة.', why: 'تتحكم الإدارة في الواجهة العامة دون المساس بالسجلات.', how: 'انشر أو أخفِ أي عنصر، ورتّب الشراكات الذهبية.' },
  ] });
  if (can('view.dashboard')) S.push({ key: 'dashalt', title: 'اللوحة المفصلة للمجلس', route: '#/dashboard?v=alt', parts: [
    { sel: ['.bo-ch', '#obBody > section', '#main .page'], h: 'إحاطة بفصول مرقّمة', what: 'العرض المفصل: الخلاصة، والأثر، والتقييم، وسير الإجراءات، ومنظومة الشركاء، والقرارات المطلوبة.', why: 'تُعرض على المجلس مباشرة أو تُطبع، وكل رقم فيها محسوب من السجلات.', how: 'بدّل بين «مختصر» و«مفصّل» أعلى اللوحة، واستخدم ملء الشاشة للعرض.' },
  ] });
  S.push({ key: 'settings', title: 'تخصيص المنصة', route: '#/settings/design', parts: [
    { sel: ['.dcard.on', '.dcard'], h: 'شكل المنصة والإعدادات', what: 'شكلان للمنصة (قائمة جانبية أو علوية)، ومحتوى الرئيسية، والقوائم والتصنيفات، والأدوار، والنسخ الاحتياطي.', why: 'تتحكم الإدارة في ما يُعرض وكيف يُعرض دون تعديل برمجي.', how: can('manage.lists') ? 'بدّل الاتجاه من هنا أو بالاختصارات Alt+1 وAlt+2 وAlt+3، وتتغير معه التقارير أيضًا.' : 'يمكن لكل مستخدم اختيار اتجاه التصميم.' },
  ] });
  S.push({ key: 'end', title: 'الخلاصة', route: null, parts: [{ sel: null, h: 'منظومة واحدة لدورة الشراكة كاملة' }] });
  /* ترتيب الاستخدام: الواجهة، ثم العمل اليومي، ثم الشراكة ومسارها، ثم المقترحات، ثم العرض والتقارير، ثم الإدارة */
  const ORDER = ['intro', 'home', 'search', 'dash', 'dashalt', 'actions', 'tasks', 'register', 'detail', 'process', 'partners', 'share', 'proposals', 'reports', 'marketing', 'stories', 'media', 'gallery', 'content', 'settings', 'end'];
  return S.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
}
function startTour() {
  if (App.tour) return;
  if (App.dirty) App.dirty = false;
  App.tour = true;
  Object.assign(TOUR, { steps: tourSteps(), i: 0, part: 0, playing: true, elapsed: 0, startHash: location.hash || '#/', fsByTour: false, token: TOUR.token + 1, acting: false });
  TOUR.snap = { rpt: JSON.parse(JSON.stringify(App.ui.rpt || {})), views: Object.fromEntries(Object.entries(App.ui).filter(([k]) => k.startsWith('regView_'))) };
  TOUR.speed = +(D.settings.tourSpeed || 1);
  const root = document.createElement('div');
  root.id = 'tour'; root.className = 'tour';
  root.innerHTML = `<div class="tour-block"></div><div class="tour-spot" hidden></div><div class="tour-cursor" hidden><svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L9.6 19z"/></svg></div>
    <div class="tour-card" role="dialog" aria-live="polite"><div class="tour-ch"><span class="tour-step"></span><span class="tour-design">${DESIGNS[design()].name}</span></div><h3></h3><div class="tour-body"></div><div class="tour-pb"><i></i></div></div>
    <div class="tour-bar" role="toolbar" aria-label="التحكم في الاستعراض">
      <button class="tb" data-t="prev" title="السابق (→)">${icon('chevR')}</button>
      <button class="tb main" data-t="play" title="تشغيل / إيقاف مؤقت (مسافة)"></button>
      <button class="tb" data-t="next" title="التالي (←)">${icon('chevL')}</button>
      <div class="tb-prog"><span class="tb-txt"></span><div class="tb-track"></div></div>
      <label class="tb-speed" title="سرعة الاستعراض"><select data-t="speed" aria-label="سرعة الاستعراض"><option value="0.75">بطيء</option><option value="1">عادي</option><option value="1.5">سريع</option></select></label>
      <button class="tb" data-t="restart" title="إعادة الجولة">${icon('history')}</button>
      <button class="tb" data-t="fs" title="ملء الشاشة">${icon('expand')}</button>
      <button class="tb end" data-t="end" title="إنهاء الاستعراض (Esc)">${icon('x')}<span>إنهاء</span></button></div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('touring');
  root.querySelector('[data-t="speed"]').value = String(TOUR.speed);
  root.querySelector('.tb-track').innerHTML = TOUR.steps.map((s, k) => `<button data-jump="${k}" title="${esc(s.title)}"></button>`).join('');
  root.addEventListener('click', onTourClick);
  root.querySelector('[data-t="speed"]').addEventListener('change', (e) => { TOUR.speed = +e.target.value; D.settings.tourSpeed = TOUR.speed; Repo.saveSettings(); });
  document.addEventListener('keydown', tourKeys, true);
  window.addEventListener('resize', placeTour);
  window.addEventListener('scroll', placeTourSoon, { passive: true });
  $('#dsw') && $('#dsw').classList.add('hide');
  showStep(0, 0);
  tickLoop();
}
function onTourClick(e) {
  const b = e.target.closest('[data-t]'); const j = e.target.closest('[data-jump]');
  if (j) return showStep(+j.dataset.jump, 0);
  if (!b) return;
  const t = b.dataset.t;
  if (t === 'prev') prevTour();
  else if (t === 'next') nextTour();
  else if (t === 'play') { TOUR.playing = !TOUR.playing; updateBar(); }
  else if (t === 'restart') { TOUR.playing = true; showStep(0, 0); }
  else if (t === 'fs') toggleTourFs();
  else if (t === 'end') endTour();
  else if (t === 'again') { TOUR.playing = true; showStep(0, 0); }
}
function tourKeys(e) {
  if (!App.tour) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endTour(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); nextTour(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); prevTour(); }
  else if (e.key === ' ' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); TOUR.playing = !TOUR.playing; updateBar(); }
}
function nextTour() {
  const s = TOUR.steps[TOUR.i];
  if (TOUR.part < s.parts.length - 1) showStep(TOUR.i, TOUR.part + 1);
  else if (TOUR.i < TOUR.steps.length - 1) showStep(TOUR.i + 1, 0);
  else { TOUR.playing = false; updateBar(); }
}
function prevTour() {
  if (TOUR.part > 0) showStep(TOUR.i, TOUR.part - 1);
  else if (TOUR.i > 0) showStep(TOUR.i - 1, TOUR.steps[TOUR.i - 1].parts.length - 1);
}
function pickTarget(cands) {
  const list = Array.isArray(cands) ? cands : [cands];
  const maxH = innerHeight * 0.58; let best = null;
  for (const s of list) {
    const el = $$(s).find((x) => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden'); if (!el) continue;
    const h = el.getBoundingClientRect().height; if (h <= maxH) return el;
    if (!best || h < best.h) best = { el, h };
  }
  return best && best.el;
}
async function waitFor(sel, ms = 3000) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    const el = sel && pickTarget(sel);
    if (el) return el;
    await sleep(80);
  }
  return null;
}
function fillCard(i, part) {
  const s = TOUR.steps[i], p = s.parts[part], card = $('#tour .tour-card');
  card.querySelector('.tour-step').textContent = `الخطوة ${i + 1} من ${TOUR.steps.length}${s.parts.length > 1 ? ` — ${part + 1}/${s.parts.length}` : ''}`;
  card.querySelector('h3').textContent = p.h;
  card.querySelector('.tour-body').innerHTML = p.sel ? `<dl><div><dt>ما هي</dt><dd>${esc(p.what)}</dd></div><div><dt>فائدتها</dt><dd>${esc(p.why)}</dd></div><div><dt>طريقة الاستخدام</dt><dd>${esc(p.how)}</dd></div></dl>`
    : `<p class="tour-final">تجمع المنصة دورة الشراكة كاملة: من مقترح الإدارة، إلى الدراسة والتحويل، إلى سجل منظم وملفات محفوظة، ثم مؤشرات تنفيذية وواجهة تعرض الأثر.</p>
      <ul class="tour-vals"><li><b>وضوح</b><span>بيانات موحدة وحالات محسوبة تلقائيًا</span></li><li><b>متابعة</b><span>مركز إجراءات وتنبيهات للاستحقاقات</span></li><li><b>مشاركة</b><span>مسار «شارك» للإدارات الأخرى</span></li><li><b>أثر</b><span>واجهة تعريفية تبرز الإنجازات</span></li></ul>
      <div class="tour-fbtns"><button class="btn" data-t="again" type="button">${icon('history')} إعادة الجولة</button><button class="btn primary" data-t="end" type="button">إنهاء الاستعراض</button></div>`;
}
function tourMetrics(el = TOUR.el) {
  const root = $('#tour'), bar = root.querySelector('.tour-bar'), card = root.querySelector('.tour-card');
  const vw = document.documentElement.clientWidth || innerWidth, vh = document.documentElement.clientHeight || innerHeight, small = vw < 760;
  card.style.maxHeight = ''; card.style.width = small ? `${vw - 24}px` : '';
  const barH = bar.offsetHeight + (small ? 16 : 28);
  let topOff = ($('.topbar') && getComputedStyle($('.topbar')).display !== 'none' ? $('.topbar').offsetHeight : 0) + (small ? 8 : 14);
  const db = $('#main .dbar'); if (db && el && getComputedStyle(db).position === 'sticky' && !db.contains(el) && (db.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) topOff += db.offsetHeight;
  return { vw, vh, small, barH, topOff, cw: card.offsetWidth, ch: Math.min(card.offsetHeight, vh - barH - topOff - 10) };
}
async function showStep(i, part) {
  const tok = ++TOUR.token;
  TOUR.i = i; TOUR.part = part; TOUR.elapsed = 0; TOUR.busy = true; TOUR.mode = null;
  const s = TOUR.steps[i], p = s.parts[part];
  const root = $('#tour'); if (!root) return;
  root.classList.toggle('final', !p.sel);
  updateBar();
  const card = root.querySelector('.tour-card'), spot = root.querySelector('.tour-spot');
  card.classList.add('swap');
  if (s.prep) s.prep();
  if (s.route && location.hash !== s.route) { App.dirty = false; location.hash = s.route; await sleep(160); }
  TOUR.acting = false; TA.hide();
  if (tok !== TOUR.token) return;
  $$('.st-reveal').forEach((x) => x.classList.add('in'));
  let el = null;
  if (p.sel) {
    if (p.tab) { const t = await waitFor(`.tabbed [data-anchor="${p.tab}"]`, 600); if (t && !t.classList.contains('on')) t.click(); }
    el = await waitFor(p.sel);
    if (tok !== TOUR.token) return;
    if (s.demo && part === 0) await demoFillShare();
  }
  fillCard(i, part);
  const M = tourMetrics(el);
  if (el) {
    const r = el.getBoundingClientRect(), H = r.height, W = r.width;
    const avail = M.vh - M.barH - M.topOff;
    let target;
    if (M.small) { TOUR.mode = 'dock'; target = r.top + scrollY - M.topOff; }
    else if (H + M.ch + 16 <= avail) { TOUR.mode = 'below'; target = r.top + scrollY - M.topOff - Math.max(0, (avail - H - M.ch - 16) / 2); }
    else if (W + M.cw + 40 <= M.vw) { TOUR.mode = 'side'; target = H <= avail ? r.top + scrollY - M.topOff - (avail - H) / 2 : r.top + scrollY - M.topOff; }
    else { TOUR.mode = 'top'; target = r.top + scrollY - M.topOff; }
    window.scrollTo({ top: Math.max(0, target), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    await waitScrollEnd();
  } else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  if (tok !== TOUR.token) return;
  TOUR.el = el;
  spot.hidden = !el;
  placeTour();
  card.classList.remove('swap');
  TOUR.busy = false;
  TOUR.last = performance.now();
  TA.hide();
  if (p.act && el) {
    TOUR.acting = true; TA.tok = tok;
    try { await sleep(500); await p.act(); } catch (err) { if (String(err.message) !== 'tour-step-changed') console.warn(err); }
    if (tok === TOUR.token) { TA.hide(); TOUR.acting = false; const again = p.sel && pickTarget(p.sel); if (again) TOUR.el = again; TOUR.elapsed = 0; App.dirty = false; }
  }
}
async function waitScrollEnd(max = 1600) {
  const t0 = performance.now(); let last = -1, still = 0;
  await sleep(120);
  while (performance.now() - t0 < max) {
    await new Promise((r) => requestAnimationFrame(r));
    if (Math.abs(scrollY - last) < 0.5) { if (++still >= 4) break; } else still = 0;
    last = scrollY;
  }
  await sleep(80);
}
let placeQueued = false;
function placeTourSoon() { if (placeQueued) return; placeQueued = true; requestAnimationFrame(() => { placeQueued = false; placeTour(); }); }
function placeTour() {
  const root = $('#tour'); if (!root) return;
  const spot = root.querySelector('.tour-spot'), card = root.querySelector('.tour-card');
  const cur = TOUR.steps[TOUR.i] && TOUR.steps[TOUR.i].parts[TOUR.part];
  if ((!TOUR.el || !TOUR.el.isConnected) && cur && cur.sel && !TOUR.busy) TOUR.el = pickTarget(cur.sel);
  const el = TOUR.el, M = tourMetrics();
  const { vw, vh, barH, topOff, small } = M;
  card.style.maxHeight = `${vh - barH - (small ? 12 : topOff) - 8}px`;
  const cw = card.offsetWidth, ch = card.offsetHeight;
  if (!el || !el.isConnected || root.classList.contains('final')) {
    spot.hidden = true;
    card.style.top = `${Math.max(12, (vh - barH - ch) / 2)}px`; card.style.left = `${Math.max(12, (vw - cw) / 2)}px`;
    return;
  }
  let r = el.getBoundingClientRect();
  if (TOUR.acting) {
    const ext = $$('.fpop, .rp-dd.open .rp-ddm, #tip.on, .cb-pop').filter((x) => x.getClientRects().length && getComputedStyle(x).display !== 'none' && getComputedStyle(x).visibility !== 'hidden');
    // أثناء العرض الحي: نُبرز الزر المفتوح وقائمته فقط حتى يتسع المكان لصندوق الشرح
    if (ext.length) { const an = ext[0].closest('.fbtn'); if (an && an !== el && el.contains(an)) r = an.getBoundingClientRect(); }
    ext.forEach((x) => { const q = x.getBoundingClientRect(); if (q.width && q.height) r = { left: Math.min(r.left, q.left), top: Math.min(r.top, q.top), right: Math.max(r.right, q.right), bottom: Math.max(r.bottom, q.bottom), width: 0, height: 0 }; });
    r.width = r.right - r.left; r.height = r.bottom - r.top;
  }
  const pad = 8, gap = 14;
  let top = Math.max(topOff - 6, r.top - pad), left = Math.max(4, r.left - pad);
  let bottom = Math.min(vh - barH + 6, r.bottom + pad), right = Math.min(vw - 4, r.right + pad);
  let x, y;
  if (small) {
    y = vh - barH - ch - 4; x = (vw - cw) / 2;
    bottom = Math.min(bottom, y - 6);
  } else {
    const spaceB = vh - barH - bottom, spaceT = top - topOff, spaceL = left, spaceR = vw - right;
    const clampY = (v) => Math.min(Math.max(topOff, v), vh - barH - ch - 6);
    const clampX = (v) => Math.min(Math.max(12, v), vw - cw - 12);
    if (spaceB >= ch + gap) { y = bottom + gap; x = clampX(right - cw); }
    else if (spaceT >= ch + gap) { y = top - ch - gap; x = clampX(right - cw); }
    else if (spaceL >= cw + gap * 2) { x = left - cw - gap; y = clampY(top); }
    else if (spaceR >= cw + gap * 2) { x = right + gap; y = clampY(top); }
    else {
      // الهدف أكبر من المساحة المتاحة: نُبرز الجزء العلوي ونضع الشرح أسفله
      y = vh - barH - ch - 6; x = clampX(right - cw);
      bottom = Math.min(bottom, y - gap);
    }
  }
  Object.assign(spot.style, { top: `${top}px`, left: `${left}px`, width: `${Math.max(0, right - left)}px`, height: `${Math.max(40, bottom - top)}px` });
  card.style.left = `${Math.round(x)}px`; card.style.top = `${Math.round(Math.max(small ? 8 : topOff, y))}px`;
}
function updateBar() {
  const root = $('#tour'); if (!root) return;
  root.querySelector('[data-t="play"]').innerHTML = TOUR.playing ? `${icon('pause')}<span>إيقاف مؤقت</span>` : `${icon('play')}<span>${TOUR.i === TOUR.steps.length - 1 && TOUR.part === TOUR.steps[TOUR.i].parts.length - 1 ? 'تشغيل' : 'استكمال'}</span>`;
  root.querySelector('.tb-txt').textContent = `الخطوة ${TOUR.i + 1} من ${TOUR.steps.length} — ${TOUR.steps[TOUR.i].title}`;
  $$('.tb-track button', root).forEach((b, k) => { b.classList.toggle('done', k < TOUR.i); b.classList.toggle('cur', k === TOUR.i); });
  root.classList.toggle('paused', !TOUR.playing);
}
function tickLoop() {
  const root = $('#tour'); if (!root) return;
  const now = performance.now();
  const dt = now - (TOUR.last || now); TOUR.last = now;
  const s = TOUR.steps[TOUR.i];
  const final = !s.parts[TOUR.part].sel;
  const dur = (final ? 9 : TOUR_PART_SEC) * 1000 / TOUR.speed;
  if (TOUR.playing && !TOUR.busy && !TOUR.acting && !final) {
    TOUR.elapsed += dt;
    if (TOUR.elapsed >= dur) { TOUR.elapsed = 0; nextTour(); }
  }
  const pb = root.querySelector('.tour-pb i'); if (pb) pb.style.width = `${final ? 100 : Math.min(100, TOUR.elapsed / dur * 100)}%`;
  if (TOUR.el && !TOUR.busy) placeTour();
  TOUR.raf = requestAnimationFrame(tickLoop);
}
function toggleTourFs() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().then(() => { TOUR.fsByTour = true; }).catch(() => toast('ملء الشاشة غير متاح في هذا المتصفح.', 'err')); }
  else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
async function demoFillShare() {
  const setv = (sel, v) => { const i = $(sel); if (i && !i.value) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); } };
  const dep = $('#s_department');
  if (dep && !dep.value && dep.options.length > 1) { dep.selectedIndex = 1; dep.dispatchEvent(new Event('change', { bubbles: true })); }
  setv('#s_requesterName', 'سارة العبدالله — مثال توضيحي');
  setv('#s_requesterEmail', 'example@murooj.example');
  App.dirty = false;
}
function endTour() {
  if (!App.tour) return;
  cancelAnimationFrame(TOUR.raf); TOUR.token++;
  document.removeEventListener('keydown', tourKeys, true);
  window.removeEventListener('resize', placeTour);
  window.removeEventListener('scroll', placeTourSoon);
  const root = $('#tour'); root && root.remove();
  document.documentElement.classList.remove('touring');
  $('#dsw') && $('#dsw').classList.remove('hide');
  if (TOUR.fsByTour && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  App.dirty = false;
  if (TOUR.snap) { App.ui.rpt = TOUR.snap.rpt; Object.assign(App.ui, TOUR.snap.views); }
  const back = TOUR.startHash;
  setTimeout(() => { App.tour = false; }, 0);
  if (location.hash !== back) location.hash = back; else route();
  toast('انتهى استعراض المنصة');
}

/* ===== الإعدادات: استعراض المنصة ===== */
function setTourTab(b) {
  const steps = tourSteps();
  const secs = steps.reduce((t, s) => t + s.parts.length, 0) * TOUR_PART_SEC + 9;
  b.innerHTML = `<div class="panel" data-tour="settings-tour"><div class="panel-h"><h3>استعراض المنصة</h3><span class="sub">جولة تفاعلية تشرح المميزات ومسارات الاستخدام</span></div><div class="panel-b">
      <div class="tour-intro"><div><p style="line-height:1.9">تنتقل الجولة بين صفحات المنصة الفعلية، وتبرز كل ميزة مع شرح موجز لما هي وفائدتها وطريقة استخدامها. تجري الجولة بالكامل داخل الاتجاه المفعّل حاليًا: <b>${DESIGNS[design()].name}</b>، وتراعي الدور الحالي: <b>${ROLES[Session.role()].label}</b>.</p>
        <p class="small muted" style="margin-top:8px">المدة التقريبية بالسرعة العادية: ${Math.round(secs / 60 * 10) / 10} دقيقة. لا تُعدَّل أي سجلات أثناء الجولة، وتعود المنصة إلى الصفحة التي بدأت منها عند الإنهاء.</p>
        <div class="row wrap" style="margin-top:16px;gap:10px"><button class="btn primary lg" data-tour-start type="button">${icon('play')} بدء الاستعراض</button>
          <label class="row small"><span class="muted">السرعة</span><select class="in" id="tourSpeed" style="width:auto;min-height:38px"><option value="0.75">بطيء</option><option value="1">عادي</option><option value="1.5">سريع</option></select></label></div></div>
        <ol class="tour-list">${steps.map((s, i) => `<li><span>${i + 1}</span>${esc(s.title)}</li>`).join('')}</ol></div>
      </div></div>
    <div class="panel rq-set" style="margin-top:18px" data-tour="settings-rqtour"><div class="panel-h"><h3>مسار طلب الشراكة</h3><span class="sub">استعراض مستقل: من «شارك» حتى الاعتماد أو الرفض</span></div><div class="panel-b">
      <div class="tour-intro"><div><p style="line-height:1.9">شاشة مقسومة: يمينًا الجهة الطالبة، ويسارًا الجهة التي عليها الدور. يُبنى الاستعراض من تعريف المسار الحالي (${(() => { const f = wfFinal(); return WF_STEPS.indexOf(f) + 1; })()} مراحل حتى الاعتماد النهائي) ومن حقول «شارك» الإلزامية، فيتغير تلقائيًا مع أي تعديل عليهما.</p>
        <p class="small muted" style="margin-top:8px">يجري في نسخة معزولة: لا تُحفظ أي بيانات، ولا تُرسل إشعارات حقيقية، ولا يبقى أي أثر بعد الإنهاء.</p>
        <div class="row wrap" style="margin-top:16px;gap:10px"><button class="btn primary lg" data-rqtour-start type="button">${icon('play')} بدء استعراض المسار</button></div></div>
        <ol class="tour-list">${WF_STEPS.slice(0, WF_STEPS.indexOf(wfFinal()) + 1).map((s) => `<li><span>${s.n}</span>${esc(s.t)}</li>`).join('')}</ol></div>
      <div class="note" style="margin-top:16px">${icon('info')}<span>أثناء الجولة: المسافة للإيقاف والاستكمال، والسهمان للتنقل، وEsc للإنهاء. ويمكن بدء الجولة من زر «اتجاه التصميم» أسفل الشاشة أو بالاختصار Alt+T.</span></div></div></div>`;
  const sp = $('#tourSpeed', b); sp.value = String(D.settings.tourSpeed || 1);
  sp.onchange = async () => { D.settings.tourSpeed = +sp.value; await Repo.saveSettings(); };
  b.onclick = (e) => { if (e.target.closest('[data-tour-start]')) startTour(); if (e.target.closest('[data-rqtour-start]')) startReqTour(); };
}
