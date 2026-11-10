/* ===== الإعدادات الافتراضية والبيانات الأولية ===== */
function defaultSettings() {
  return {
    id: 'main', schema: 1,
    org: { name: 'مؤسسة مروج الأهلية', dept: 'إدارة الشراكات', platform: 'منظومة الشراكات', logoFileId: null },
    lists: {
      sectors: ['حكومي', 'خاص', 'غير ربحي'],
      classifications: ['مذكرة تعاون', 'مذكرة تفاهم'],
      departments: ['إدارة الشراكات', 'إدارة المشاريع', 'إدارة تطوير الأعمال', 'إدارة الاتصال المؤسسي', 'إدارة المشاركة المجتمعية', 'الإدارة العامة للاستراتيجية'],
      team: ['وعد', 'رنيم', 'عبدالله'],
      activation: ['غير مفعّلة', 'قيد التفعيل', 'مفعّلة'],
      attachmentCats: ['تقرير الشراكة العام', 'صور الشراكة', 'تقييم الشراكة', 'الاتفاقية', 'مرفقات المقترح', 'أخرى'],
      categories: ['التشجير وزيادة الغطاء النباتي', 'التوعية البيئية', 'إعادة التدوير والاقتصاد الدائري', 'الدعم الميداني واللوجستي', 'التدريب وبناء القدرات', 'التمويل والاستدامة المالية'],
      goals: [],
      domains: ['بيئة', 'مياه', 'زراعة', 'سياحة', 'طاقة', 'تعليم وبحث علمي', 'صحة', 'تقنية', 'إعلام واتصال', 'مالية واستثمار', 'نقل ولوجستيات', 'تنمية مجتمعية', 'أخرى'],
      partnerTypes: ['شريك استراتيجي', 'شريك خدمات'],
      originTypes: ['علاقة شخصية', 'بناء شراكة (منهجية)', 'مبادرة من الجهة الشريكة', 'توجيه من القيادة', 'مقترح من إدارة'],
      valueTypes: ['مالية', 'عينية', 'معرفية وفنية', 'إعلامية', 'مجتمعية وتطوعية'],
      financeModels: ['بدون التزامات مالية', 'تمويل من الشريك', 'تمويل مشترك', 'على نفقة المؤسسة', 'إيرادات للمؤسسة'],
      financeStatus: ['لا توجد التزامات', 'ضمن الخطة', 'متأخر', 'مكتمل'],
    },
    stages: [{ id: 'prep', label: 'قيد الإعداد' }, { id: 'sign', label: 'بانتظار التوقيع' }, { id: 'signed', label: 'موقّعة' }, { id: 'hold', label: 'معلّقة' }, { id: 'cancel', label: 'ملغاة' }],
    proposalStatuses: [
      { id: 'draft', label: 'مسودة' }, { id: 'submitted', label: 'مقدم' }, { id: 'review', label: 'قيد الدراسة' }, { id: 'info', label: 'بانتظار الاستكمال' },
      { id: 'accepted', label: 'مقبول' }, { id: 'rejected', label: 'غير مقبول' }, { id: 'converted', label: 'محوّل إلى شراكة' },
    ],
    listMeta: {},
    letter: { to1: 'معالي نائب وزير البيئة والمياه والزراعة', to2: 'رئيس مجلس أمناء مؤسسة مروج الأهلية', signTitle: 'الرئيس التنفيذي لمؤسسة مروج الأهلية', signName: 'م. محمد بن عبدالعزيز باجري' },
    expiryDays: 90,
    alertDays: 30,
    infoAgeDays: 7,
    home: {
      sections: [{ id: 'hero', on: true }, { id: 'kpis', on: true }, { id: 'golden', on: true }, { id: 'featured', on: true }, { id: 'gallery', on: true }, { id: 'stories', on: true }, { id: 'logos', on: true }, { id: 'news', on: true }, { id: 'share', on: true }],
      heroTitle: 'نربط المؤسسة بشركاء يوسّعون أثرها البيئي',
      heroText: 'تبني إدارة الشراكات علاقات تعاون مع الجهات الحكومية والخاصة وغير الربحية، وتتابع كل شراكة من توقيع المذكرة حتى تحقق مخرجاتها على أرض الواقع.',
      heroImageFileId: 'lib:dunes',
      periodFrom: `${today().getFullYear()}-01-01`, periodTo: '',
      kpis: ['active', 'partners', 'signedInPeriod', 'outputs', 'departments'],
      featured: [], stories: [],
    },
    showDemo: true,
    session: { role: 'admin', dept: 'إدارة المشاريع', member: 'وعد' },
    theme: 'light',
    counters: { pt: 0, sh: {} },
    seededAt: nowISO(),
  };
}

/* صور توضيحية افتراضية (مولّدة، ومعلّمة بوسم «صورة توضيحية») — تُستبدل برفع صور فعلية */
const IMG_DEFAULTS = {
  covers: {
    'وقف الأمير صيته بنت عبدالعزيز': 'afforest', 'جمعية عيني لاعادة تدوير النفايات': 'nursery', 'المديرية العامة لحرس الحدود': 'dunes',
    'شركة الأفق الأخضر للتطوير العمراني': 'urban', 'جمعية أصداء للتوعية البيئية': 'mangrove', 'هيئة تطوير الواحات الشمالية': 'palms',
    'مجموعة سنابل الوادي الغذائية': 'pivots', 'كلية الشمال التقنية': 'nursery', 'مؤسسة غرس الخيرية': 'nursery', 'شركة شمس الجنوب للطاقة': 'dunes', 'بلدية وادي السدر': 'terraces',
  },
  gallery: {
    'شركة الأفق الأخضر للتطوير العمراني': ['urban', 'afforest', 'nursery'], 'جمعية أصداء للتوعية البيئية': ['mangrove', 'afforest'],
    'هيئة تطوير الواحات الشمالية': ['palms', 'terraces', 'dunes'], 'مؤسسة غرس الخيرية': ['nursery', 'afforest'], 'مجموعة سنابل الوادي الغذائية': ['pivots'],
  },
  stories: { 'شركة الأفق الأخضر للتطوير العمراني': 'afforest', 'جمعية أصداء للتوعية البيئية': 'mangrove', 'هيئة تطوير الواحات الشمالية': 'terraces', 'مؤسسة غرس الخيرية': 'nursery', 'مجموعة سنابل الوادي الغذائية': 'pivots' },
};
/* الصور الفعلية المرفوعة من إدارة الشراكات (مضمّنة في الملف) */
const REAL_PHOTOS = { 'المديرية العامة لحرس الحدود': 'border-guard-signing', 'وقف الأمير صيته بنت عبدالعزيز': 'waqf-saitah-signing', 'مؤسسة عبدالقادر المهيدب الخيرية': 'muhaidib-meet' };
/* ملف الحصر الفعلي (الإصدار 2): يحدّث الشراكات الموجودة بمطابقة الاسم ويضيف الجديدة والجهات المستهدفة.
   لا يمس الصور والمرفقات والتقييمات وحالة المسار؛ والمعرّفات ثابتة (من رقم الصف) فلا تتكرر السجلات إن طُبّق من جهازين. */
/* onlyMissing: يضيف ما ليس موجودًا فقط (شراكات وجهات) دون تعديل أي سجل قائم — لإصلاح خادم لم تصله السجلات */
function applyRealV2({ onlyMissing = false } = {}) {
  if (typeof REAL_V2 === 'undefined') return false;
  let added = 0;
  const s = D.settings, t0 = nowISO(), by = 'تحديث ملف الحصر';
  ['العنود'].forEach((m) => { if (!s.lists.team.includes(m)) s.lists.team.push(m); });
  ['تعليمي'].forEach((x) => { if (!s.lists.sectors.includes(x)) s.lists.sectors.push(x); });
  const nk = (x) => String(x || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[()\s]+/g, ' ').trim();
  const same = (a, b) => !!a && !!b && nk(a) === nk(b); // مطابقة صارمة: «وزارة الطاقة» ليست «الشركة السعودية للطاقة»
  const findPartner = (name) => D.partners.find((x) => !x.demo && (same(x.name, name) || (x.aliases || []).some((a) => same(a, name))));
  const ensurePartner = (r, extra) => {
    let pr = findPartner(r.partner);
    if (onlyMissing && pr) return pr;
    if (!pr) { pr = { id: 'ptr-r2-' + r.row, name: r.partner, sector: r.sector, aliases: [], website: '', notes: '', logoFileId: null, createdAt: t0, demo: false }; D.partners.push(pr); }
    else { if (!pr.sector && r.sector) pr.sector = r.sector; if (pr.name !== r.partner) { pr.aliases = [...new Set([...(pr.aliases || []), pr.name])]; pr.name = r.partner; } } // الاسم المصحَّح من الملف، والقديم اسمًا بديلًا
    (r.aliases || []).forEach((a) => { if (!(pr.aliases || []).includes(a) && !same(a, pr.name)) pr.aliases = [...(pr.aliases || []), a]; });
    Object.assign(pr, extra || {});
    return pr;
  };
  for (const r of REAL_V2.records) {
    const pr = ensurePartner(r, { target: false, targetNote: '' });
    const notes = [...(r.importNotes || [])];
    if (r.stage === 'signed' && !r.startDate && r.stageNote) notes.push({ field: 'تاريخ بدء الشراكة', original: '', msg: r.stageNote + '. يُرجى إضافة التواريخ عند توفرها.', confirmed: false });
    const f = {
      title: r.title, partnerId: pr.id, classification: r.classification, cooperationAreas: r.cooperationAreas,
      startDate: r.startDate, endDate: r.endDate,
      expectedImpact: r.expectedImpact, outputs: r.outputs, notes: r.notes || (r.stage !== 'signed' ? r.stageNote : '') || '', recommendations: r.recommendations,
      owners: r.owners, stage: r.stage, importNotes: notes, importRaw: r.importRaw, source: 'ملف حصر الشراكات', realRow: r.row,
    };
    ['contactName', 'contactEmail', 'contactPhone'].forEach((k) => { if (r[k]) f[k] = r[k]; }); // بيانات التواصل لا تُمحى (تُستورد من داخل المنصة)
    let p = D.partnerships.find((x) => !x.demo && x.realRow === r.row) || D.partnerships.find((x) => !x.demo && !x.realRow && same(x.title, r.title));
    if (p) {
      if (!onlyMissing) Object.assign(p, f, { activation: p.activation || r.activation || '', updatedAt: t0, updatedBy: by });
    } else {
      added++;
      s.counters.pt = (s.counters.pt || 0) + 1;
      D.partnerships.push({ id: 'pt-r2-' + r.row, code: `PT-${(r.startDate || t0).slice(0, 4)}-${String(s.counters.pt).padStart(3, '0')}`, seq: s.counters.pt, ...f,
        departments: [], activation: r.activation || '', attachments: [], categories: [], isDraft: false, public: r.stage === 'signed', highlight: null, coverFileId: null, proposalId: null,
        createdAt: t0, createdBy: by, updatedAt: t0, updatedBy: by, demo: false });
    }
  }
  for (const r of REAL_V2.targets) {
    const ex = findPartner(r.partner);
    if (ex && D.partnerships.some((p) => p.partnerId === ex.id)) continue; // جهة لها شراكة فعلًا
    ensurePartner(r, { target: true, targetNote: r.note || '', owners: r.owners || [] });
  }
  applyRealPhotos();
  return onlyMissing ? added : true;
}
/* شعارات الجهات الفعلية المرفقة من الإدارة (تُطبق إن لم يكن للجهة شعار) */
const REAL_LOGOS = { 'مؤسسة عبدالقادر المهيدب الخيرية': 'amsf-logo' };
/* شعارات الجهات الرسمية المضافة مع المنصة (حسب اسم الجهة)؛ لا تستبدل شعارًا موجودًا */
function applyPartnerLogos() {
  let n = 0; const P = typeof PARTNER_LOGOS !== 'undefined' ? PARTNER_LOGOS : {};
  for (const [name, key] of Object.entries(P)) { if (!ASSET_IMG[key]) continue; D.partners.filter((pr) => pr.name === name && !pr.logoFileId).forEach((pr) => { pr.logoFileId = 'asset:' + key; n++; }); }
  return n;
}
function applyRealPhotos() {
  for (const [title, key] of Object.entries(REAL_LOGOS)) {
    if (!ASSET_IMG[key]) continue;
    const p = D.partnerships.find((x) => !x.demo && x.title === title); const pr = p && partnerById(p.partnerId);
    if (pr && !pr.logoFileId) pr.logoFileId = 'asset:' + key;
  }
  for (const [title, key] of Object.entries(REAL_PHOTOS)) {
    if (!ASSET_IMG[key]) continue;
    const p = D.partnerships.find((x) => !x.demo && x.title === title); if (!p) continue;
    const fid = 'asset:' + key;
    if (!p.coverFileId || p.coverFileId.startsWith('lib:')) p.coverFileId = fid;
    if (!(p.attachments || []).some((a) => a.fileId === fid)) p.attachments = [...(p.attachments || []), { id: uid('att'), fileId: fid, name: ASSET_IMG[key].title, type: 'image/jpeg', size: Math.round(ASSET_IMG[key].src.length * 0.74), category: 'صور الشراكة', addedAt: nowISO(), by: 'إدارة الشراكات' }];
  }
}
/* تصنيفات مقترحة للبيانات التجريبية فقط — السجلات الفعلية تُترك للتصنيف من الإدارة */
const DEMO_CATEGORIES = {
  'شركة الأفق الأخضر للتطوير العمراني': ['التشجير وزيادة الغطاء النباتي'], 'جمعية أصداء للتوعية البيئية': ['التوعية البيئية'], 'هيئة تطوير الواحات الشمالية': ['التشجير وزيادة الغطاء النباتي'],
  'مجموعة سنابل الوادي الغذائية': ['إعادة التدوير والاقتصاد الدائري'], 'كلية الشمال التقنية': ['التدريب وبناء القدرات'], 'مؤسسة غرس الخيرية': ['التشجير وزيادة الغطاء النباتي', 'التوعية البيئية'],
  'شركة شمس الجنوب للطاقة': ['الدعم الميداني واللوجستي'], 'بلدية وادي السدر': ['التشجير وزيادة الغطاء النباتي'], 'صندوق أثر للاستدامة': ['التمويل والاستدامة المالية'], 'شركة مرافئ للخدمات اللوجستية': ['الدعم الميداني واللوجستي'],
};
function applyDemoCategories() { for (const p of D.partnerships) { if (!p.categories) p.categories = p.demo ? (DEMO_CATEGORIES[p.title] || []) : []; } }
function libAtt(key, cat = 'صور الشراكة') {
  const L_ = IMG_LIB[key];
  return { id: uid('att'), fileId: 'lib:' + key, name: L_.title, type: 'image/jpeg', size: Math.round(L_.src.length * 0.74), category: cat, addedAt: nowISO(), by: 'بيانات تجريبية' };
}
function applyImageDefaults() {
  for (const p of D.partnerships) {
    const k = IMG_DEFAULTS.covers[p.title];
    if (k && !p.coverFileId && IMG_LIB[k]) p.coverFileId = 'lib:' + k;
    const g = IMG_DEFAULTS.gallery[p.title];
    if (g && p.demo && !(p.attachments || []).some((a) => a.fileId && a.fileId.startsWith('lib:'))) p.attachments = [...(p.attachments || []), ...g.filter((x) => IMG_LIB[x]).map((x) => libAtt(x))];
  }
  for (const a of D.achievements) {
    const p = D.partnerships.find((x) => x.id === a.partnershipId);
    const sk = p && (IMG_DEFAULTS.stories[p.title] || IMG_DEFAULTS.covers[p.title]);
    if (!a.coverFileId && sk) a.coverFileId = 'lib:' + sk;
    if (a.demo && !(a.gallery || []).length && p && IMG_DEFAULTS.gallery[p.title]) a.gallery = IMG_DEFAULTS.gallery[p.title].map((x) => 'lib:' + x);
  }
}

async function seedAll() {
  D.settings = defaultSettings();
  const t = today();
  const dd = (n) => isoDate(addDays(t, n));
  const at = (n, h = 10) => { const x = addDays(t, n); x.setHours(h, 15, 0, 0); return x.toISOString(); };

  /* — السجلات الفعلية من ملف حصر الشراكات — */
  for (const r of REAL_SAMPLE.records) {
    const pr = { id: uid('ptr'), name: r.title, sector: r.sector, aliases: [], website: '', notes: '', logoFileId: null, createdAt: nowISO(), demo: false };
    D.partners.push(pr);
    D.settings.counters.pt = r.seq;
    D.partnerships.push({
      id: uid('pt'), code: `PT-${(r.startDate || '2026').slice(0, 4)}-${String(r.seq).padStart(3, '0')}`, seq: r.seq,
      title: r.title, partnerId: pr.id, classification: r.classification, cooperationAreas: r.cooperationAreas,
      contactName: r.contactName, contactEmail: r.contactEmail, contactPhone: r.contactPhone, startDate: r.startDate, endDate: r.endDate,
      expectedImpact: r.expectedImpact, outputs: r.outputs, notes: r.notes, recommendations: r.recommendations, challenges: r.challenges,
      owners: r.owners, departments: r.departments, activation: r.activation, attachments: [],
      stage: 'signed', isDraft: false, public: true, highlight: null, coverFileId: null, proposalId: null,
      importNotes: r.importNotes, importRaw: r.importRaw, source: 'ملف حصر الشراكات',
      createdAt: nowISO(), createdBy: 'استيراد ملف الحصر', updatedAt: nowISO(), updatedBy: 'استيراد ملف الحصر', demo: false,
    });
  }

  /* — بيانات تجريبية مميزة بوسم «تجريبي» لإظهار التصميم فقط — */
  const demoP = [
    { name: 'شركة الأفق الأخضر للتطوير العمراني', sector: 'خاص', cls: 'مذكرة تفاهم', s: -260, e: 470, stage: 'signed', act: 'مفعّلة', owners: ['وعد'], depts: ['إدارة المشاريع', 'إدارة الاتصال المؤسسي'], feat: true,
      coop: '1. تنفيذ مشاريع تشجير في الممرات والحدائق ضمن الأحياء التي تطورها الشركة.\n2. اعتماد قائمة نباتات محلية موفرة للمياه في مشاريع الشركة الجديدة.\n3. إشراك السكان في حملات زراعة موسمية بالتعاون مع المؤسسة.',
      impact: '1. زيادة الغطاء النباتي: رفع نسبة المساحات المظللة في الأحياء السكنية.\n2. ترسيخ الاستدامة في التطوير العمراني: نقل معايير المؤسسة البيئية إلى مشاريع القطاع الخاص.',
      out: '1. إسناد مشروع تشجير الممرات الخضراء في ثلاثة أحياء.\n2. بناء مبادرة «حيّنا أخضر» للزراعة المجتمعية.', notes: 'اكتمل الموسم الأول، والتحضير جارٍ للموسم الثاني.',
      goal: 'نقل معايير التشجير المحلي الموفر للمياه إلى الأحياء السكنية التي تطورها الشركة.', hl: { value: '4,800', label: 'شجرة محلية', text: 'زُرعت في الممرات الخضراء لثلاثة أحياء سكنية خلال الموسم الأول.' } },
    { name: 'جمعية أصداء للتوعية البيئية', sector: 'غير ربحي', cls: 'مذكرة تعاون', s: -400, e: 330, stage: 'signed', act: 'مفعّلة', owners: ['رنيم'], depts: ['إدارة المشاركة المجتمعية'], feat: true,
      coop: '1. تصميم برامج توعوية بيئية مشتركة للمدارس والمراكز المجتمعية.\n2. تأهيل متطوعين لتقديم الورش في المناطق المستهدفة.\n3. قياس أثر البرامج وتبادل البيانات بين الطرفين.',
      impact: '1. رفع الوعي البيئي لدى الطلاب والأسر.\n2. توسيع قاعدة المتطوعين في مبادرات المؤسسة.',
      out: '1. بناء مبادرة «بيئتي مسؤوليتي» التوعوية.\n2. إعداد حقيبة تدريبية موحدة للمتطوعين.', notes: '',
      goal: 'برامج توعوية بيئية مشتركة تصل إلى الطلاب والأسر عبر متطوعين مؤهلين.', hl: { value: '36', label: 'ورشة توعوية', text: 'نُفّذت في المدارس والمراكز المجتمعية بمشاركة متطوعين من الجهتين.' } },
    { name: 'هيئة تطوير الواحات الشمالية', sector: 'حكومي', cls: 'مذكرة تعاون', s: -150, e: 580, stage: 'signed', act: 'قيد التفعيل', owners: ['عبدالله'], depts: ['إدارة المشاريع', 'الإدارة العامة للاستراتيجية'], feat: true,
      coop: '1. إعداد خطة مشتركة لإعادة تأهيل أراضي الواحات المتدهورة.\n2. تبادل البيانات المكانية والدراسات البيئية.\n3. تنفيذ مشاريع تجريبية لحصاد مياه الأمطار.',
      impact: '1. حماية الموارد الطبيعية في الواحات.\n2. دعم المجتمعات الزراعية المحلية بحلول مستدامة.',
      out: '1. إسناد مشروع المسح البيئي للواحات.\n2. بناء مبادرة حصاد مياه الأمطار.', notes: 'بانتظار اعتماد خطة التنفيذ من الهيئة.',
      goal: 'خطة مشتركة لإعادة تأهيل أراضي الواحات المتدهورة وحصاد مياه الأمطار.', hl: { value: '120', label: 'هكتارًا', text: 'من أراضي الواحات أُدرجت في خطة إعادة التأهيل المشتركة.' } },
    { name: 'مجموعة سنابل الوادي الغذائية', sector: 'خاص', cls: 'مذكرة تفاهم', s: -330, e: 35, stage: 'signed', act: 'مفعّلة', owners: ['رنيم', 'عبدالله'], depts: ['إدارة تطوير الأعمال'],
      coop: '1. تطوير برنامج لفرز المخلفات العضوية في مصانع المجموعة.\n2. تحويل المخلفات إلى سماد عضوي يُستخدم في مشاريع المؤسسة.',
      impact: '1. خفض المخلفات المرسلة إلى المرادم.\n2. توفير مدخلات زراعية مستدامة لمشاريع التشجير.',
      out: '1. إسناد مشروع وحدة التسميد التجريبية.', notes: 'تنتهي المذكرة قريبًا؛ يلزم قرار بشأن التجديد.',
      hl: { value: '62', label: 'طنًا من المخلفات العضوية', text: 'فُرزت وحُوّلت إلى سماد خلال العام الأول.' } },
    { name: 'كلية الشمال التقنية', sector: 'حكومي', cls: 'مذكرة تعاون', s: 20, e: 750, stage: 'signed', act: 'غير مفعّلة', owners: ['وعد'], depts: ['إدارة المشاريع'],
      coop: '1. تدريب طلاب الكلية ميدانيًا في مشاريع المؤسسة.\n2. تطوير حلول تقنية لمراقبة الري في المشاتل.', impact: '1. بناء قدرات وطنية في التقنيات البيئية.', out: '1. بناء برنامج التدريب الميداني.', notes: '' },
    { name: 'مؤسسة غرس الخيرية', sector: 'غير ربحي', cls: 'مذكرة تفاهم', s: -700, e: 60, stage: 'signed', act: 'مفعّلة', owners: ['عبدالله'], depts: ['إدارة المشاركة المجتمعية', 'إدارة المشاريع'],
      coop: '1. تشغيل مشتل مجتمعي مشترك لإنتاج الشتلات المحلية.\n2. توزيع الشتلات على المبادرات التطوعية.', impact: '1. توفير شتلات محلية بتكلفة منخفضة.', out: '1. إسناد مشروع المشتل المجتمعي.', notes: '',
      hl: { value: '15,000', label: 'شتلة محلية', text: 'أنتجها المشتل المجتمعي ووُزعت على المبادرات التطوعية.' } },
    { name: 'شركة شمس الجنوب للطاقة', sector: 'خاص', cls: 'مذكرة تعاون', s: -760, e: -25, stage: 'signed', act: 'مفعّلة', owners: ['وعد'], depts: ['إدارة تطوير الأعمال'],
      coop: '1. تركيب أنظمة ري تعمل بالطاقة الشمسية في مواقع المؤسسة.', impact: '1. خفض استهلاك الطاقة في الري.', out: '1. إسناد مشروع الري الشمسي في موقعين.', notes: 'انتهت المذكرة، ولم يُتخذ قرار بالتجديد.' },
    { name: 'بلدية وادي السدر', sector: 'حكومي', cls: 'مذكرة تعاون', s: null, e: null, stage: 'sign', act: '', owners: ['رنيم'], depts: ['إدارة المشاريع'],
      coop: '1. تخصيص مواقع داخل نطاق البلدية لمشاريع التشجير.\n2. صيانة مشتركة للمواقع بعد التنفيذ.', impact: '1. توسيع نطاق مشاريع المؤسسة جغرافيًا.', out: '', notes: 'المسودة النهائية لدى الشؤون القانونية في البلدية.' },
  ];
  const demoIds = [];
  for (const d of demoP) {
    const pr = { id: uid('ptr'), name: d.name, sector: d.sector, aliases: [], website: '', notes: '', logoFileId: null, createdAt: nowISO(), demo: true };
    D.partners.push(pr);
    const startDate = d.s === null ? '' : dd(d.s), endDate = d.e === null ? '' : dd(d.e);
    D.settings.counters.pt++;
    const rec = {
      id: uid('pt'), code: `PT-${(startDate || String(t.getFullYear())).slice(0, 4)}-${String(D.settings.counters.pt).padStart(3, '0')}`,
      title: d.name, partnerId: pr.id, classification: d.cls, cooperationAreas: d.coop, contactName: 'اسم تجريبي', contactEmail: 'contact@example.org', contactPhone: '0500000000',
      startDate, endDate, expectedImpact: d.impact, outputs: d.out, notes: d.notes, recommendations: '', challenges: '', owners: d.owners, departments: d.depts, activation: d.act,
      attachments: [], stage: d.stage, isDraft: false, public: d.stage !== 'sign', highlight: d.hl || null, showcaseGoal: d.goal || '', coverFileId: null, proposalId: null,
      importNotes: [], importRaw: null, createdAt: at(d.s === null ? -30 : Math.min(-5, d.s)), createdBy: 'بيانات تجريبية', updatedAt: at(-Math.floor(Math.random() * 20) - 1), updatedBy: 'بيانات تجريبية', demo: true,
    };
    D.partnerships.push(rec);
    if (d.feat) demoIds.push(rec.id);
  }
  // مسودة شراكة تجريبية (لا تظهر إلا لفريق الشراكات)
  {
    const pr = { id: uid('ptr'), name: 'شركة مرافئ للخدمات اللوجستية', sector: 'خاص', aliases: [], website: '', notes: '', logoFileId: null, createdAt: nowISO(), demo: true };
    D.partners.push(pr);
    D.settings.counters.pt++;
    D.partnerships.push({ id: uid('pt'), code: `PT-${t.getFullYear()}-${String(D.settings.counters.pt).padStart(3, '0')}`, title: pr.name, partnerId: pr.id, classification: 'مذكرة تفاهم', cooperationAreas: '1. دعم نقل الشتلات إلى المواقع البعيدة.', contactName: '', contactEmail: '', contactPhone: '', startDate: '', endDate: '', expectedImpact: '', outputs: '', notes: '', recommendations: '', challenges: '', owners: ['وعد'], departments: [], activation: '', attachments: [], stage: 'prep', isDraft: true, public: false, highlight: null, coverFileId: null, proposalId: null, importNotes: [], importRaw: null, createdAt: at(-3), createdBy: 'بيانات تجريبية', updatedAt: at(-3), updatedBy: 'بيانات تجريبية', demo: true });
  }

  /* — مقترحات تجريبية بمراحل مختلفة — */
  const mk = (o) => ({ id: uid('pr'), attachments: [], partnerSector: '', requesterEmail: '', createdByRole: 'dept', demo: true, partnershipId: null, ...o });
  const ev = (n, type, extra = {}) => ({ id: uid('ev'), at: at(n, 9 + Math.abs(n) % 6), type, ...extra });
  const props = [
    mk({ status: 'submitted', department: 'إدارة المشاريع', requesterName: 'سلمان العتيبي', strategicGoal: 'توسيع الغطاء النباتي في المناطق المستهدفة', partnerName: 'شركة نخيل الشمال للمقاولات', partnerSector: 'خاص',
      targets: '1. إشراك الشركة في تنفيذ أعمال التشجير ضمن مشاريعها الإنشائية.\n2. توفير معدات الحفر والري للمواقع البعيدة.', reasons: 'تنفذ الشركة مشاريع طرق في نطاق عمل المؤسسة، ولديها التزامات بيئية ضمن عقودها.', addedValue: 'خفض تكلفة التنفيذ في المواقع البعيدة، والوصول إلى مواقع يصعب العمل فيها دون معدات ثقيلة.',
      contactName: 'م. فهد الشمري', contactPhone: '0551234567', contactEmail: 'csr@example.com', events: [ev(-2, 'submitted', { by: 'ممثل إدارة المشاريع', role: 'dept' })] }),
    mk({ status: 'review', department: 'إدارة الاتصال المؤسسي', requesterName: 'نورة القحطاني', strategicGoal: 'تعزيز الوعي البيئي المجتمعي', partnerName: 'قناة الواحة الإعلامية', partnerSector: 'خاص',
      targets: '1. إنتاج سلسلة قصيرة عن مشاريع المؤسسة.\n2. تغطية إعلامية لمواسم الزراعة.', reasons: 'تحتاج المؤسسة إلى وصول أوسع لرسائلها البيئية.', addedValue: 'ظهور إعلامي منتظم دون تكلفة إنتاج على المؤسسة.',
      contactName: 'خالد المطيري', contactPhone: '0567654321', contactEmail: 'media@example.com',
      events: [ev(-9, 'submitted', { by: 'ممثل إدارة الاتصال المؤسسي', role: 'dept' }), ev(-7, 'status', { from: 'submitted', to: 'review', by: 'رنيم (فريق الشراكات)', role: 'team', message: 'بدأت دراسة المقترح.', vis: 'all' }), ev(-6, 'note', { by: 'رنيم (فريق الشراكات)', role: 'team', message: 'يلزم التأكد من عدم تعارض المحتوى مع سياسة الاتصال.', vis: 'internal' })] }),
    mk({ status: 'info', department: 'إدارة المشاركة المجتمعية', requesterName: 'ريم الدوسري', strategicGoal: 'تمكين التطوع البيئي', partnerName: 'جمعية رواد التطوع', partnerSector: 'غير ربحي',
      targets: '1. تنظيم فرق تطوعية لمواسم الزراعة.', reasons: 'نقص المتطوعين في المواسم الكبيرة.', addedValue: 'رفع عدد ساعات التطوع.',
      contactName: '', contactPhone: '', contactEmail: '',
      events: [ev(-16, 'submitted', { by: 'ممثل إدارة المشاركة المجتمعية', role: 'dept' }), ev(-14, 'status', { from: 'submitted', to: 'review', by: 'عبدالله (فريق الشراكات)', role: 'team', message: '', vis: 'all' }), ev(-10, 'status', { from: 'review', to: 'info', by: 'عبدالله (فريق الشراكات)', role: 'team', message: 'يُرجى إضافة بيانات مسؤول التواصل في الجمعية، وتوضيح عدد المتطوعين المتوقع في كل موسم.', vis: 'all' })] }),
    mk({ status: 'accepted', department: 'إدارة تطوير الأعمال', requesterName: 'عبدالعزيز الحربي', strategicGoal: 'تنويع مصادر الدعم والاستدامة المالية', partnerName: 'شركة الحصاد الذكي للتقنيات الزراعية', partnerSector: 'خاص',
      targets: '1. تجربة أجهزة استشعار رطوبة التربة في مشتلين.\n2. مشاركة البيانات لتحسين جداول الري.', reasons: 'الشركة تبحث عن مواقع تجريبية لتقنياتها.', addedValue: 'خفض استهلاك المياه في المشاتل.',
      contactName: 'سارة الزهراني', contactPhone: '0549876543', contactEmail: 'pilot@example.com',
      events: [ev(-24, 'submitted', { by: 'ممثل إدارة تطوير الأعمال', role: 'dept' }), ev(-20, 'status', { from: 'submitted', to: 'review', by: 'وعد (فريق الشراكات)', role: 'team', message: '', vis: 'all' }), ev(-5, 'status', { from: 'review', to: 'accepted', by: 'وعد (فريق الشراكات)', role: 'team', message: 'قُبل المقترح مبدئيًا، وسيُحوّل إلى سجل شراكة بعد تحديد نطاق المذكرة.', vis: 'all' })] }),
    mk({ status: 'rejected', department: 'إدارة المشاريع', requesterName: 'سلمان العتيبي', strategicGoal: 'رفع كفاءة تنفيذ المشاريع', partnerName: 'مكتب سديم للاستشارات', partnerSector: 'خاص',
      targets: '1. تقديم استشارات هندسية للمشاريع.', reasons: 'الحاجة إلى دعم فني.', addedValue: 'تسريع إعداد الدراسات.', contactName: 'ماجد', contactPhone: '0500001111', contactEmail: 'info@example.net',
      events: [ev(-40, 'submitted', { by: 'ممثل إدارة المشاريع', role: 'dept' }), ev(-33, 'status', { from: 'submitted', to: 'rejected', by: 'رنيم (فريق الشراكات)', role: 'team', message: 'العلاقة المقترحة تعاقدية بمقابل مالي، وتُعالج عبر المشتريات لا عبر مذكرة شراكة.', vis: 'all' })] }),
    mk({ status: 'draft', department: 'إدارة المشاريع', requesterName: 'سلمان العتيبي', strategicGoal: '', partnerName: 'جامعة', partnerSector: '', targets: '', reasons: '', addedValue: '', contactName: '', contactPhone: '', contactEmail: '', events: [ev(-1, 'created', { by: 'ممثل إدارة المشاريع', role: 'dept' })] }),
  ];
  // مقترح محوّل إلى شراكة (مع سجلها)
  const conv = mk({ status: 'converted', department: 'الإدارة العامة للاستراتيجية', requesterName: 'هند السبيعي', strategicGoal: 'تنويع مصادر الدعم والاستدامة المالية', partnerName: 'صندوق أثر للاستدامة', partnerSector: 'غير ربحي',
    targets: '1. تمويل مشترك لمبادرات إعادة التأهيل البيئي.\n2. تطوير مؤشرات موحدة لقياس الأثر.', reasons: 'يمتلك الصندوق برنامجًا لدعم الجهات البيئية غير الربحية.', addedValue: 'مصدر دعم مستدام للمبادرات، ومنهجية قياس أثر معتمدة.',
    contactName: 'لمى العنزي', contactPhone: '0533332222', contactEmail: 'grants@example.org', events: [] });
  {
    const pr = { id: uid('ptr'), name: conv.partnerName, sector: 'غير ربحي', aliases: [], website: '', notes: '', logoFileId: null, createdAt: at(-12), demo: true };
    D.partners.push(pr);
    D.settings.counters.pt++;
    const rec = { id: uid('pt'), code: `PT-${t.getFullYear()}-${String(D.settings.counters.pt).padStart(3, '0')}`, title: pr.name, partnerId: pr.id, classification: '', cooperationAreas: conv.targets, expectedImpact: conv.addedValue, outputs: '', notes: '', recommendations: '', challenges: '', contactName: conv.contactName, contactEmail: conv.contactEmail, contactPhone: conv.contactPhone, startDate: '', endDate: '', owners: ['عبدالله'], departments: ['الإدارة العامة للاستراتيجية'], activation: '', attachments: [], stage: 'prep', isDraft: false, public: false, highlight: null, coverFileId: null, proposalId: conv.id, importNotes: [], importRaw: null, createdAt: at(-12), createdBy: 'بيانات تجريبية', updatedAt: at(-12), updatedBy: 'بيانات تجريبية', demo: true };
    D.partnerships.push(rec);
    conv.partnershipId = rec.id;
    conv.events = [ev(-30, 'submitted', { by: 'ممثل الإدارة العامة للاستراتيجية', role: 'dept' }), ev(-27, 'status', { from: 'submitted', to: 'review', by: 'عبدالله (فريق الشراكات)', role: 'team', vis: 'all' }), ev(-15, 'status', { from: 'review', to: 'accepted', by: 'عبدالله (فريق الشراكات)', role: 'team', message: 'قُبل المقترح.', vis: 'all' }), ev(-12, 'status', { from: 'accepted', to: 'converted', by: 'عبدالله (فريق الشراكات)', role: 'team', message: `حُوّل إلى سجل الشراكة ${rec.code}.`, vis: 'all' })];
  }
  props.push(conv);
  const y = String(t.getFullYear());
  props.forEach((p, i) => { p.ref = `SH-${y}-${String(i + 1).padStart(4, '0')}`; p.createdAt = p.events[0] ? p.events[0].at : at(-1); p.updatedAt = p.events.length ? p.events[p.events.length - 1].at : p.createdAt; p.submittedAt = (p.events.find((e) => e.type === 'submitted') || {}).at || null; });
  D.settings.counters.sh = { [y]: props.length };
  D.proposals = props;

  /* — إنجازات ومستجدات تجريبية مرتبطة بشراكات تجريبية فقط — */
  const byName = (n) => D.partnerships.find((p) => p.title === n);
  const A = (pn, o) => ({ id: uid('ach'), partnershipId: byName(pn).id, public: true, demo: true, coverFileId: null, gallery: [], createdAt: nowISO(), ...o });
  D.achievements = [
    A('شركة الأفق الأخضر للتطوير العمراني', { title: 'ممرات خضراء تعيد الظل إلى ثلاثة أحياء سكنية', date: dd(-60), metricValue: '4,800', metricLabel: 'شجرة محلية', summary: 'نُفّذ الموسم الأول من مشروع الممرات الخضراء بنباتات محلية موفرة للمياه، وبمشاركة السكان في يومين للزراعة المجتمعية.', body: 'بدأ المشروع بمسح الممرات القائمة وتحديد المواقع الأنسب للتظليل.\n1. اختيار الأنواع: اعتُمدت قائمة من الأنواع المحلية الموفرة للمياه.\n2. التنفيذ: زُرعت الأشجار على ثلاث مراحل خلال الموسم.\n3. المشاركة المجتمعية: شارك السكان في يومين للزراعة بالتنسيق مع الشركة.' }),
    A('جمعية أصداء للتوعية البيئية', { title: 'حملة «بيئتي مسؤوليتي» تصل إلى 18 مدرسة', date: dd(-35), metricValue: '2,400', metricLabel: 'طالب وطالبة', summary: 'قدّم متطوعون من الجهتين 36 ورشة توعوية حول ترشيد المياه وفرز المخلفات والعناية بالأشجار.', body: '1. المحتوى: حقيبة تدريبية موحدة أعدتها الجهتان.\n2. التنفيذ: 36 ورشة في 18 مدرسة ومركزين مجتمعيين.\n3. المتابعة: استبيان قبلي وبعدي لقياس التغير في المعرفة.' }),
    A('هيئة تطوير الواحات الشمالية', { title: 'خطة مشتركة لإعادة تأهيل أراضي الواحات', date: dd(-20), metricValue: '120', metricLabel: 'هكتارًا ضمن الخطة', summary: 'أنهى الفريق المشترك المسح البيئي الأولي، وحدد المواقع ذات الأولوية لإعادة التأهيل وحصاد مياه الأمطار.', body: '1. المسح: حُصرت المواقع المتدهورة وفق معايير متفق عليها.\n2. الأولويات: صُنّفت المواقع حسب سهولة الوصول وتوفر المياه.\n3. الخطوة التالية: اعتماد خطة التنفيذ من الهيئة.' }),
    A('مؤسسة غرس الخيرية', { title: 'مشتل مجتمعي يوفّر الشتلات للمبادرات التطوعية', date: dd(-90), metricValue: '15,000', metricLabel: 'شتلة محلية', summary: 'يعمل المشتل المشترك على إنتاج شتلات محلية وتوزيعها على المبادرات التطوعية بتكلفة منخفضة.', body: '1. الإنتاج: خطوط إنتاج لثمانية أنواع محلية.\n2. التوزيع: أولوية للمبادرات التطوعية والمدارس.' }),
    A('مجموعة سنابل الوادي الغذائية', { title: 'تحويل المخلفات العضوية إلى سماد في مصانع المجموعة', date: dd(-120), metricValue: '62', metricLabel: 'طنًا من المخلفات', summary: 'برنامج فرز في ثلاثة مصانع يحوّل المخلفات العضوية إلى سماد يُستخدم في مشاريع التشجير.', body: '1. الفرز: نقاط فرز في ثلاثة مصانع.\n2. المعالجة: وحدة تسميد تجريبية.\n3. الاستخدام: توريد السماد إلى مشاتل المؤسسة.' }),
  ];
  D.news = [
    { id: uid('nw'), title: 'توقيع مذكرة تعاون مع هيئة تطوير الواحات الشمالية', date: dd(-150), body: 'تشمل المذكرة إعداد خطة مشتركة لإعادة تأهيل أراضي الواحات وتبادل البيانات البيئية.', partnershipId: byName('هيئة تطوير الواحات الشمالية').id, public: true, demo: true },
    { id: uid('nw'), title: 'تسليم التقرير الأول لشراكة الأفق الأخضر', date: dd(-70), body: 'استعرض التقرير نتائج الموسم الأول ومقترحات التوسع في الموسم الثاني.', partnershipId: byName('شركة الأفق الأخضر للتطوير العمراني').id, public: true, demo: true },
    { id: uid('nw'), title: 'اجتماع المراجعة نصف السنوية مع جمعية أصداء', date: dd(-40), body: 'ناقش الطرفان نتائج الحملة التوعوية وخطة الفصل الدراسي القادم.', partnershipId: byName('جمعية أصداء للتوعية البيئية').id, public: true, demo: true },
    { id: uid('nw'), title: 'فتح باب مقترحات الشراكة للإدارات', date: dd(-12), body: 'تستقبل إدارة الشراكات مقترحات الإدارات عبر خدمة «شارك» في المنصة.', partnershipId: null, public: true, demo: true },
  ];
  const realFirst = D.partnerships.find((p) => !p.demo);
  D.settings.home.featured = [demoIds[0], realFirst.id, demoIds[1], demoIds[2]];
  D.settings.home.stories = D.achievements.slice(0, 4).map((a) => a.id);

  applyImageDefaults();
  applyRealPhotos();
  applyDemoCategories();
  D.settings.schema = 5;
  // حفظ دفعة واحدة
  await Store.put('settings', D.settings);
  for (const c of ['partners', 'partnerships', 'proposals', 'achievements', 'news']) await Store.putMany(c, D[c]);
  D.audit = [];
  await Repo.log('seed', 'system', 'seed', 'تهيئة المنصة', `استيراد ${REAL_SAMPLE.records.length} سجلات من «${REAL_SAMPLE.sheetTitle}» وإضافة بيانات تجريبية مميزة`);
}
