/* ===== الأدوار والصلاحيات (الدخول بكلمة مرور في 04b-auth.js) ===== */
const ROLES = {
  admin: { label: 'إدارة الشراكات', desc: 'كامل الصلاحيات: جميع الصفحات والإجراءات، والإعدادات والتصنيفات والنسخ الاحتياطي، وإدارة الحسابات وكلمات المرور.' },
  team: { label: 'فريق إدارة الشراكات', desc: 'إدارة سجلات الشراكات والجهات، ومراجعة مقترحات الإدارات، وتحديث محتوى الرئيسية.' },
  dept: { label: 'ممثل إدارة أخرى', desc: 'تقديم مقترحات الشراكة ومتابعة حالتها، والاطلاع على الشراكات دون بيانات التواصل والمستندات الداخلية.' },
  viewer: { label: 'مستخدم للاطلاع', desc: 'الاطلاع على الرئيسية ولوحة المؤشرات والسجل دون أي تعديل.' },
};
const PERMS = {
  'view.dashboard': ['admin', 'team', 'viewer'],
  'view.reports': ['admin', 'team', 'viewer'],
  'view.register': ['admin', 'team', 'dept', 'viewer'],
  'view.drafts': ['admin', 'team'],
  'view.contacts': ['admin', 'team', 'viewer'],
  'view.internal': ['admin', 'team', 'viewer'],
  'edit.partnership': ['admin', 'team'],
  'delete.partnership': ['admin'],
  'manage.partners': ['admin', 'team'],
  'view.partners': ['admin', 'team', 'viewer'],
  'proposal.create': ['admin', 'dept'],
  'proposal.review': ['admin', 'team'],
  'manage.content': ['admin', 'team'],
  'manage.lists': ['admin'],
  'manage.backup': ['admin'],
  'view.audit': ['admin', 'team'],
  'export': ['admin', 'team', 'viewer'],
  'manage.accounts': ['admin'],
};
const PERM_LABELS = {
  'view.dashboard': 'لوحة المؤشرات', 'view.register': 'سجل الشراكات', 'view.drafts': 'رؤية المسودات', 'view.contacts': 'بيانات التواصل',
  'view.internal': 'المرفقات والملاحظات الداخلية', 'edit.partnership': 'إضافة الشراكات وتعديلها', 'delete.partnership': 'حذف الشراكات',
  'manage.partners': 'إدارة الجهات الشريكة', 'proposal.create': 'تقديم مقترح', 'proposal.review': 'مراجعة المقترحات واتخاذ الإجراء',
  'manage.content': 'محتوى الرئيسية والإنجازات', 'manage.lists': 'التصنيفات والقوائم', 'manage.backup': 'النسخ الاحتياطي والاستعادة', 'view.audit': 'سجل التغييرات', 'manage.accounts': 'الحسابات وكلمات المرور', 'export': 'التصدير والطباعة',
};
/* ===== المبادرات الاستراتيجية لكل هدف (من ميثاق المشروع MRJ-NM-105 كما في منصة مروج) =====
   تُخزَّن في الإعدادات (goalInits) فتُعدَّل من «القوائم»، وتُربط بالهدف عبر رمزه (SO1…EO) */
const GOAL_INITS_DEF = {
  SO1: ['تعزيز مشاركة الجهات غير الربحية وأفراد المجتمع', 'برامج بناء القدرات البيئية للقطاع غير الربحي', 'زيادة الوعي والمشاركة البيئية', 'منهجية تعظيم الأثر الاقتصادي والاجتماعي'],
  SO2: ['تنمية الغطاء النباتي وإعادة تأهيل الأراضي', 'الحفاظ على الأنواع الفطرية والنباتية', 'إصدار شهادات أرصدة الكربون', 'الجاهزية لأسواق التنوع البيولوجي', 'تعزيز الاقتصاد الدائري', 'التوسع في حلول المياه المستدامة'],
  SO3: ['الشراكة الاستراتيجية مع القطاع العام', 'الشراكة الاستراتيجية مع القطاع الخاص', 'الشراكة الاستراتيجية مع القطاع غير الربحي', 'إطار تقييم وتتبع قيمة الشراكات'],
  SO4: ['المنتجات المعرفية والبحثية لدعم القرار', 'برامج نشر المعرفة البيئية عبر القطاعات', 'توسيع نطاق الخدمات الاستشارية', 'تنفيذ خطة الابتكار البيئي'],
  EO: ['الاستدامة والحوكمة والتحول المؤسسي', 'الاعتماد المؤسسي والانتسابات الرسمية', 'تنفيذ خطة التحول الرقمي', 'إدارة رأس المال البشري', 'تحديث ممارسات إدارة المشاريع', 'الاتصال المؤسسي والإعلام', 'تنفيذ خطة الاستدامة المالية'],
};
function goalInits(goal) {
  if (!goal) return [];
  const code = (String(goal).match(/^([A-Z]{1,3}\d?)\s*[:：]/) || [])[1] || '';
  const list = ((D.settings && D.settings.goalInits) || {})[code] || GOAL_INITS_DEF[code] || [];
  return list.map((t, i) => ({ c: `${code}.I${i + 1}`, t }));
}
const initLabel = (v) => v || '';

/* أدوات نسخة الاستعراض المعزولة (iframe): تبادل البيانات بين النسختين وتبديل الحساب، دون أي حفظ */
function sbxExport() { return JSON.stringify(D); }
function sbxImport(json) { const keep = D.settings && D.settings.session; const x = JSON.parse(json); Object.keys(D).forEach((k) => { if (!(k in x)) delete D[k]; }); Object.assign(D, x); if (keep && D.settings) D.settings.session = keep; }
function sbxD() { return D; }
function sbxSession() { return { role: Session.role(), dept: Session.dept() }; }
function sbxAs(sess) { D.settings.session = sess; App.dirty = false; renderShell(); route(); }
const Session = {
  role: () => (D.settings && D.settings.session && D.settings.session.role) || 'admin',
  dept: () => (D.settings && D.settings.session && D.settings.session.dept) || 'إدارة المشاريع',
  member: () => (D.settings && D.settings.session && D.settings.session.member) || (L('team')[0] || 'عضو الفريق'),
  userName() {
    const r = this.role();
    if (r === 'admin') return (D.settings && D.settings.session && D.settings.session.accountId === 'sysadmin') ? 'مدير النظام' : 'إدارة الشراكات';
    if (r === 'team') return this.member() + ' (فريق الشراكات)';
    if (r === 'dept') return 'ممثل ' + this.dept();
    return 'مستخدم للاطلاع';
  },
};
const can = (perm) => (PERMS[perm] || []).includes(Session.role());

/* ===== القوائم والتصنيفات ===== */
const L = (k) => (D.settings && D.settings.lists && D.settings.lists[k]) || [];
const stageLabel = (id) => ((D.settings.stages || []).find((s) => s.id === id) || {}).label || '—';
const propStatusLabel = (id) => ((D.settings.proposalStatuses || []).find((s) => s.id === id) || {}).label || id;
const showDemo = () => !!(D.settings && D.settings.showDemo);

/* ===== تعريف الحقول: مصدرها ملف الحصر أو حقول إدارية مقترحة ===== */
const FIELDS = {
  title: { label: 'اسم الشراكة', src: 'file', col: 'B' },
  partnerId: { label: 'الجهة الشريكة', src: 'file', col: 'B', note: 'مرتبطة بسجل الجهات لتوحيد الاسم' },
  sector: { label: 'القطاع', src: 'file', col: 'C' },
  classification: { label: 'تصنيف المذكرة', src: 'file', col: 'D' },
  cooperationAreas: { label: 'مجالات التعاون', src: 'file', col: 'E' },
  contactName: { label: 'ضابط الاتصال', src: 'file', col: 'F', sensitive: true },
  contactEmail: { label: 'البريد الإلكتروني للشريك', src: 'file', col: 'G', sensitive: true },
  contactPhone: { label: 'رقم الجوال', src: 'file', col: 'H', sensitive: true },
  startDate: { label: 'تاريخ بدء الشراكة', src: 'file', col: 'I' },
  endDate: { label: 'تاريخ انتهاء الشراكة', src: 'file', col: 'J' },
  expectedImpact: { label: 'الأثر المتوقع وكيف يخدم المؤسسة', src: 'file', col: 'K' },
  outputs: { label: 'المخرجات (إسناد مشاريع، بناء مبادرات)', src: 'file', col: 'L' },
  notes: { label: 'الملاحظات', src: 'file', col: 'M' },
  recommendations: { label: 'التوصيات', src: 'file', col: 'N' },
  challenges: { label: 'التحديات', src: 'file', col: 'O' },
  owners: { label: 'المسؤول من إدارة الشراكات', src: 'file', col: 'P' },
  departments: { label: 'التقاطع مع الإدارات', src: 'file', col: 'Q' },
  activation: { label: 'تفعيل الشراكة', src: 'file', col: 'R' },
  attachments: { label: 'تقارير الشراكة والمرفقات', src: 'file', col: 'S' },
  categories: { label: 'تصنيف الشراكة', src: 'admin' },
  stage: { label: 'مرحلة الشراكة', src: 'admin' },
  public: { label: 'الظهور في الواجهة التعريفية', src: 'admin' },
  highlight: { label: 'أبرز نتيجة للعرض', src: 'admin' },
  coverFileId: { label: 'صورة الغلاف', src: 'admin' },
  logo: { label: 'شعار الجهة', src: 'admin' },
};
const CORE_FIELDS = ['partnerId', 'sector', 'classification', 'cooperationAreas', 'contactName', 'contactEmail', 'contactPhone', 'startDate', 'endDate', 'expectedImpact', 'outputs', 'owners', 'departments', 'activation'];

/* ===== الجهات ===== */
const partnerById = (id) => D.partners.find((x) => x.id === id) || null;
const partnerName = (p) => { const x = partnerById(p.partnerId); return x ? x.name : (p.title || 'جهة غير محددة'); };
const pSector = (p) => { const x = partnerById(p.partnerId); return (x && x.sector) || ''; };
function findSimilarPartners(name, exceptId) {
  if (!name || name.trim().length < 3) return [];
  return D.partners.filter((x) => x.id !== exceptId && (!x.demo || showDemo()))
    .map((x) => ({ x, s: Math.max(nameSimilarity(name, x.name), ...(x.aliases || []).map((a) => nameSimilarity(name, a))) }))
    .filter((o) => o.s >= 0.6).sort((a, b) => b.s - a.s).map((o) => o.x);
}

/* ===== الحالة المحسوبة للشراكة ===== */
const STATUS_META = {
  active: { l: 'سارية', tone: 'ok', c: 'var(--chart-2)' },
  soon: { l: 'تنتهي قريبًا', tone: 'warn', c: 'var(--chart-4)' },
  upcoming: { l: 'لم يبدأ سريانها', tone: 'info', c: 'var(--chart-3)' },
  nodates: { l: 'موقّعة بلا تواريخ', tone: 'muted', c: 'var(--chart-7)' },
  prep: { l: 'قيد الإعداد', tone: 'info', c: 'var(--chart-6)' },
  sign: { l: 'بانتظار التوقيع', tone: 'gold', c: 'var(--chart-5)' },
  hold: { l: 'معلّقة', tone: 'warn', c: 'var(--chart-8)' },
  ended: { l: 'منتهية', tone: 'muted', c: 'var(--line-2)' },
  cancel: { l: 'ملغاة', tone: 'danger', c: 'var(--danger)' },
  draft: { l: 'مسودة', tone: 'muted', c: 'var(--faint)' },
};
const STATUS_ORDER = ['active', 'soon', 'upcoming', 'nodates', 'prep', 'sign', 'hold', 'ended', 'cancel', 'draft'];
function pStatus(p) {
  if (p.isDraft) return 'draft';
  if (p.stage !== 'signed') return ['prep', 'sign', 'hold', 'cancel'].includes(p.stage) ? p.stage : 'prep';
  const s = parseDate(p.startDate), e = parseDate(p.endDate), t = today();
  if (!s && !e) return 'nodates';
  if (s && s > t) return 'upcoming';
  if (e && e < t) return 'ended';
  if (e && daysBetween(t, e) <= (D.settings.expiryDays || 90)) return 'soon';
  return 'active';
}
function statusLabel(k) {
  if (['prep', 'sign', 'hold', 'cancel'].includes(k)) return stageLabel(k);
  return STATUS_META[k] ? STATUS_META[k].l : k;
}
function statusChip(p) {
  const k = typeof p === 'string' ? p : pStatus(p);
  const chip = `<span class="chip ${STATUS_META[k].tone}">${esc(statusLabel(k))}</span>`;
  if (typeof p !== 'string' && k === 'soon') { const dl = daysLeft(p); if (dl !== null && dl >= 0 && dl <= (D.settings.alertDays || 30)) return chip + `<span class="chip danger urgent" title="تنبيه: تنتهي خلال ${dl} يومًا">${icon('alert')}${dl === 0 ? 'تنتهي اليوم' : `خلال ${dl} يومًا`}</span>`; }
  return chip;
}
function expiryAlert(p) {
  if (!p || p.isDraft || p.stage !== 'signed') return null;
  const st = pStatus(p), dl = daysLeft(p);
  if (dl === null) return null;
  const A = D.settings.alertDays || 30, X = D.settings.expiryDays || 90;
  if (st === 'ended' || dl < 0) return { tone: 'ended', dl, title: `انتهت هذه الشراكة في ${fmtDate(p.endDate)} (منذ ${plural(-dl, 'يوم واحد', 'يومين', 'أيام', 'يومًا')})`, text: 'وثّق نتائجها، وحدّد قرار التجديد أو الإغلاق.' };
  if (dl <= A) return { tone: 'urgent', dl, title: dl === 0 ? 'تنتهي هذه الشراكة اليوم' : `تنتهي هذه الشراكة خلال ${plural(dl, 'يوم واحد', 'يومين', 'أيام', 'يومًا')} — في ${fmtDate(p.endDate)}`, text: 'يلزم اتخاذ قرار التجديد أو الإنهاء قبل تاريخ الانتهاء.' };
  if (dl <= X) return { tone: 'soon', dl, title: `تنتهي هذه الشراكة خلال ${plural(dl, 'يوم واحد', 'يومين', 'أيام', 'يومًا')} — في ${fmtDate(p.endDate)}`, text: 'يُستحسن البدء في دراسة التجديد.' };
  return null;
}
function daysLeft(p) { const e = parseDate(p.endDate); return e ? daysBetween(today(), e) : null; }
function termProgress(p) {
  const s = parseDate(p.startDate), e = parseDate(p.endDate);
  if (!s || !e || e <= s) return null;
  return Math.max(0, Math.min(1, (today() - s) / (e - s)));
}
function missingFields(p) {
  const miss = [];
  for (const k of CORE_FIELDS) {
    const v = k === 'sector' ? pSector(p) : p[k];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) miss.push(k);
  }
  return miss;
}
const pendingImportNotes = (p) => (p.importNotes || []).filter((n) => !n.confirmed);

/* ===== مجموعات العرض حسب الدور والبيانات التجريبية ===== */
function visiblePartnerships({ includeDrafts } = {}) {
  const drafts = includeDrafts === undefined ? can('view.drafts') : includeDrafts;
  return D.partnerships.filter((p) => (showDemo() || !p.demo) && (drafts || !p.isDraft));
}
function visibleProposals() {
  return D.proposals.filter((x) => (showDemo() || !x.demo));
}
function publicPartnerships() { return D.partnerships.filter((p) => p.public && !p.isDraft && (showDemo() || !p.demo) && p.stage !== 'cancel'); }
function publicStories() { return D.achievements.filter((a) => a.public && (showDemo() || !a.demo)); }
function publicNews() { return D.news.filter((n) => n.public && (showDemo() || !n.demo)); }

/* ===== الفلاتر المشتركة بين السجل والمؤشرات ===== */
const FILTER_DIMS = {
  status: { label: 'الحالة', get: (p) => [pStatus(p)], fmt: statusLabel, order: () => STATUS_ORDER },
  sector: { label: 'القطاع', get: (p) => [pSector(p) || 'غير محدد'], order: () => [...L('sectors'), 'غير محدد'] },
  classification: { label: 'تصنيف المذكرة', get: (p) => [p.classification || 'غير محدد'], order: () => [...L('classifications'), 'غير محدد'] },
  category: { label: 'تصنيف الشراكة', get: (p) => (p.categories && p.categories.length ? p.categories : ['غير مصنّف']), order: () => [...L('categories'), 'غير مصنّف'] },
  department: { label: 'الإدارة', get: (p) => (p.departments && p.departments.length ? p.departments : ['غير محدد']), order: () => [...L('departments'), 'غير محدد'] },
  owner: { label: 'المسؤول', get: (p) => (p.owners && p.owners.length ? p.owners : ['غير محدد']), order: () => [...L('team'), 'غير محدد'] },
  activation: { label: 'التفعيل', get: (p) => [p.activation || 'غير محدد'], order: () => [...L('activation'), 'غير محدد'] },
  ptype: { label: 'تصنيف الشراكة (استراتيجي/خدمات)', get: (p) => [p.ptype || 'غير محدد'], order: () => [...L('partnerTypes'), 'غير محدد'] },
  domain: { label: 'مجال الجهة', get: (p) => [(partnerById(p.partnerId) || {}).domain || 'غير محدد'], order: () => [...L('domains'), 'غير محدد'] },
  year: { label: 'سنة البدء', get: (p) => [p.startDate ? p.startDate.slice(0, 4) : 'بلا تاريخ'], order: (vals) => [...vals].sort() },
};
function applyFilters(list, f, except) {
  return list.filter((p) => {
    for (const [k, vals] of Object.entries(f)) {
      if (k === except || !vals || !vals.length || !FILTER_DIMS[k]) continue;
      const pv = FILTER_DIMS[k].get(p);
      if (!vals.some((v) => pv.includes(v))) return false;
    }
    return true;
  });
}
function countBy(list, dim) {
  const m = new Map();
  list.forEach((p) => FILTER_DIMS[dim].get(p).forEach((v) => m.set(v, (m.get(v) || 0) + 1)));
  const ord = FILTER_DIMS[dim].order([...m.keys()]);
  const keys = [...new Set([...ord.filter((k) => m.has(k)), ...m.keys()])];
  return keys.map((k) => ({ k, label: FILTER_DIMS[dim].fmt ? FILTER_DIMS[dim].fmt(k) : k, n: m.get(k) || 0 }));
}
function searchText(p) {
  const pr = partnerById(p.partnerId);
  return [p.code, p.title, pr && pr.name, pr && (pr.aliases || []).join(' '), p.classification, (p.categories || []).join(' '), pSector(p), p.cooperationAreas, p.expectedImpact, p.outputs, p.notes, (p.owners || []).join(' '), (p.departments || []).join(' ')].join(' ');
}
function filtersToQuery(f) {
  const q = Object.entries(f).filter(([, v]) => v && v.length).map(([k, v]) => `${k}=${encodeURIComponent(v.join('|'))}`).join('&');
  return q ? '?' + q : '';
}
function queryToFilters(params) {
  const f = {};
  for (const k of Object.keys(FILTER_DIMS)) if (params[k]) f[k] = params[k].split('|').filter(Boolean);
  return f;
}

/* ===== الرموز والأرقام المرجعية ===== */
function nextPartnershipCode(startDate) {
  const y = (startDate && startDate.slice(0, 4)) || String(today().getFullYear());
  D.settings.counters.pt = (D.settings.counters.pt || 0) + 1;
  return `PT-${y}-${String(D.settings.counters.pt).padStart(3, '0')}`;
}
function nextProposalRef() {
  const y = String(today().getFullYear());
  const c = D.settings.counters.sh || (D.settings.counters.sh = {});
  c[y] = (c[y] || 0) + 1;
  return `SH-${y}-${String(c[y]).padStart(4, '0')}`;
}

/* ===== المقترحات ===== */
const PROP_TONE = { draft: 'muted', submitted: 'info', review: 'gold', info: 'warn', accepted: 'ok', rejected: 'danger', converted: 'ok' };
const PROP_FLOW = ['submitted', 'review', 'accepted', 'converted'];
function propChip(st) { return `<span class="chip ${PROP_TONE[st] || 'muted'}">${esc(propStatusLabel(st))}</span>`; }
function propVisibleToMe(x) {
  if (can('proposal.review')) return x.status !== 'draft' || x.createdByRole === Session.role();
  if (Session.role() === 'dept') return x.department === Session.dept();
  return false;
}
function propEventsFor(x) { return (x.events || []).filter((e) => can('proposal.review') || e.vis !== 'internal'); }
function propAgeDays(x) {
  const last = [...(x.events || [])].reverse().find((e) => e.type === 'status' || e.type === 'submitted' || e.type === 'resubmitted');
  return last ? daysBetween(new Date(new Date(last.at).toDateString()), today()) : 0;
}
async function propEvent(x, ev) {
  x.events = x.events || [];
  x.events.push({ id: uid('ev'), at: nowISO(), by: Session.userName(), role: Session.role(), ...ev });
}
async function setPropStatus(x, to, message = '', vis = 'all') {
  const from = x.status;
  x.status = to;
  await propEvent(x, { type: 'status', from, to, message, vis });
  await Repo.save('proposals', x);
  await Repo.log('proposal.status', 'proposal', x.id, x.ref, `${propStatusLabel(from)} ← ${propStatusLabel(to)}${message ? ' — ' + message.slice(0, 80) : ''}`);
  if (['info', 'converted'].includes(to) && typeof notify === 'function') await notify([{ dept: x.department }], { t: to === 'info' ? `طلب استكمال للمقترح ${x.ref}` : `تحوّل مقترحكم ${x.ref} إلى سجل شراكة`, b: message ? message.slice(0, 140) : propStatusLabel(to), href: '#/proposals/' + x.id, ic: to === 'info' ? 'msg' : 'convert' });
}
/* تحويل المقترح المقبول إلى سجل شراكة مع نقل البيانات والمرفقات */
function proposalMapping(x) {
  return [
    ['اسم الجهة المستهدفة', x.partnerName, 'الجهة الشريكة واسم الشراكة'],
    ['قطاع الجهة', x.partnerSector, 'القطاع (على مستوى الجهة)'],
    ['مستهدفات الشراكة', x.targets, 'مجالات التعاون'],
    ['القيمة المضافة', x.addedValue, 'الأثر المتوقع وكيف يخدم المؤسسة'],
    ['مسؤول التواصل من الجهة', x.contactName, 'ضابط الاتصال'],
    ['البريد الإلكتروني', x.contactEmail, 'البريد الإلكتروني للشريك'],
    ['رقم الجوال', x.contactPhone, 'رقم الجوال'],
    ['الإدارة الطالبة', x.department, 'التقاطع مع الإدارات'],
    ['المرفقات', (x.attachments || []).length ? `${x.attachments.length} مرفق` : '', 'تقارير الشراكة ← مرفقات المقترح'],
    ['أسباب الطلب والهدف الاستراتيجي', [x.strategicGoal, x.reasons].filter(Boolean).length ? 'تبقى في المقترح الأصلي' : '', 'تظهر في صفحة الشراكة عبر رابط المقترح'],
  ];
}
async function convertProposal(x, { partnerId, newPartner }) {
  let pid = partnerId;
  if (!pid) {
    const pr = { id: uid('ptr'), name: newPartner.name, sector: newPartner.sector || '', aliases: [], website: '', notes: '', logoFileId: null, createdAt: nowISO(), demo: !!x.demo };
    await Repo.save('partners', pr); pid = pr.id;
    await Repo.log('partner.create', 'partner', pr.id, pr.name, 'أُنشئت من تحويل مقترح ' + x.ref);
  } else if (x.partnerSector) {
    const pr = partnerById(pid); if (pr && !pr.sector) { pr.sector = x.partnerSector; await Repo.save('partners', pr); }
  }
  const atts = (x.attachments || []).map((a) => ({ ...a, id: uid('att'), category: a.wf ? WF_CAT : 'مرفقات المقترح', fromProposal: x.ref })); // مستندات المسار تبقى بتصنيفها
  const rec = {
    id: uid('pt'), code: nextPartnershipCode(''), title: partnerById(pid).name, partnerId: pid, classification: '',
    cooperationAreas: x.targets || '', expectedImpact: x.addedValue || '', outputs: '', notes: '', recommendations: '', challenges: '',
    contactName: x.contactName || '', contactEmail: x.contactEmail || '', contactPhone: x.contactPhone || '',
    startDate: '', endDate: '', owners: [], departments: x.department && L('departments').includes(x.department) ? [x.department] : [], activation: '',
    attachments: atts, stage: 'prep', isDraft: false, public: false, highlight: null, coverFileId: null,
    proposalId: x.id, requesterDept: x.department || '', strategicGoal: x.strategicGoal || '', initiative: x.initiative || '', wf: { steps: {} }, forms: clone(x.forms || {}), ptype: (x.profile || {}).ptype || '', origin: (x.profile || {}).origin || '', originBy: (x.profile || {}).originBy || '', valueTypes: (x.profile || {}).valueTypes || [], importNotes: [], importRaw: null, createdAt: nowISO(), createdBy: Session.userName(), demo: !!x.demo,
  };
  if ((x.profile || {}).domain) { const pr = partnerById(pid); if (pr && !pr.domain) { pr.domain = x.profile.domain; await Repo.save('partners', pr); } }
  await Repo.save('partnerships', rec);
  await Repo.saveSettings();
  x.partnershipId = rec.id;
  await setPropStatus(x, 'converted', `حُوّل إلى سجل الشراكة ${rec.code}. قبول المقترح لا يعني توقيع الشراكة؛ مرحلتها الحالية «${stageLabel('prep')}».`);
  await Repo.log('partnership.create', 'partnership', rec.id, rec.code + ' — ' + rec.title, 'من المقترح ' + x.ref);
  return rec;
}

/* ===== إضافة قيمة إلى قائمة من داخل أي شراكة — تظهر لكل الشراكات وفي صفحة «القوائم» ===== */
const LIST_TITLES = { domains: 'مجالات عمل الجهات', partnerTypes: 'تصنيف الشراكة', originTypes: 'بداية العلاقة', valueTypes: 'أنواع القيمة', financeModels: 'النماذج المالية', financeStatus: 'الوضع المالي', sectors: 'القطاعات', classifications: 'تصنيفات المذكرات', categories: 'تصنيفات الشراكة', departments: 'الإدارات', team: 'فريق إدارة الشراكات', activation: 'حالات التفعيل', attachmentCats: 'تصنيفات الملفات', goals: 'الأهداف الاستراتيجية' };
async function addListValue(listKey, v, from) {
  v = String(v || '').trim();
  if (!v || L(listKey).some((x) => normAr(x) === normAr(v))) return false;
  D.settings.lists[listKey].push(v);
  D.settings.listMeta = D.settings.listMeta || {};
  (D.settings.listMeta[listKey] = D.settings.listMeta[listKey] || {})[v] = { at: nowISO(), by: Session.userName(), from };
  await Repo.saveSettings();
  await Repo.log('list.add', 'settings', 'lists', LIST_TITLES[listKey] || listKey, `«${v}» — أُضيفت من ${from}`);
  toast(`أُضيفت «${v}» إلى قائمة ${LIST_TITLES[listKey] || ''} وأصبحت متاحة لجميع الشراكات`);
  return true;
}

/* ===== مقارنة التعديلات لسجل التغييرات ===== */
function diffLabels(a, b) {
  const keys = Object.keys(FIELDS).filter((k) => !['sector', 'logo'].includes(k));
  return keys.filter((k) => JSON.stringify(a[k] ?? '') !== JSON.stringify(b[k] ?? '')).map((k) => FIELDS[k].label);
}
