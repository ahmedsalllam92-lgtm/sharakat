/* =====================================================================
   استيراد «حزمة شراكة»: مستندات وصور ونماذج معبأة لشراكة قائمة في ملف واحد (.json)
   تُستخدم لنقل ملفات شراكة دفعة واحدة دون نشرها في شيفرة المنصة؛
   تُحفظ المرفقات في مخزن المنصة (والخادم المشترك عند تفعيله) كأي ملف يُرفع يدويًا.
   الصيغة: { app: 'sharakat-package', v: 1, match: { title }, cover?, attachments: [{ name, type, category, wf?, doc?, data(base64) }], forms: { key: { status, data } } }
   الاستيراد آمن للتكرار: لا يُضاف ملف موجود بنفس الاسم والحجم، ولا يُستبدل نموذج مكتمل.
   ===================================================================== */
function pkgFindPartnership(m) {
  const nk = (x) => String(x || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[()\s]+/g, ' ').trim();
  const keys = [m.title, ...(m.alt || [])].filter(Boolean).map(nk);
  return D.partnerships.find((p) => !p.demo && (keys.includes(nk(p.title)) || keys.includes(nk(partnerName(p)))))
    || D.partnerships.find((p) => !p.demo && keys.some((k) => k.length > 6 && (nk(p.title).includes(k) || nk(partnerName(p)).includes(k))));
}
/* مطابقة قيمة من الحزمة بخيارات القائمة في هذه المنصة (مثل «الإدارة العامة للمشاريع» ↔ «إدارة المشاريع») */
function pkgFit(v, opts) {
  if (!v || !opts || !opts.length || opts.includes(v)) return v;
  const core = (x) => String(x).replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/^(قطاع\s+)/, '').replace(/^(الاداره\s+العامه\s+|اداره\s+|الاداره\s+)/, '').replace(/^(لل|ال)/, '').replace(/\s+/g, ' ').trim();
  const c = core(v);
  return opts.find((o) => core(o) === c) || opts.find((o) => core(o).includes(c) || c.includes(core(o))) || v;
}
async function importPartnerPackage(file, onStep) {
  let P;
  try { P = JSON.parse(await file.text()); } catch (_) { throw new Error('تعذّرت قراءة الملف: ليس حزمة شراكة صالحة.'); }
  if (!P || P.app !== 'sharakat-package' || !P.match) throw new Error('الملف ليس «حزمة شراكة» من منظومة الشراكات.');
  const p = pkgFindPartnership(P.match);
  if (!p) throw new Error(`لم تُعثر على شراكة باسم «${P.match.title}» في السجل.`);
  p.attachments = p.attachments || [];
  let added = 0, skipped = 0, forms = 0;
  const atts = P.attachments || [];
  for (let i = 0; i < atts.length; i++) {
    const a = atts[i]; onStep && onStep(i + 1, atts.length, a.name);
    const bin = Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0));
    if (p.attachments.some((x) => (x.srcName || x.name) === a.name && (x.srcSize === bin.length || x.size === bin.length))) { skipped++; continue; }
    const up = await saveUpload(new File([bin], a.name, { type: a.type || 'application/octet-stream' }));
    const att = { id: uid('att'), fileId: up.id, name: up.name, type: up.type, size: up.size, srcSize: bin.length, srcName: a.name, category: a.category || 'أخرى', addedAt: nowISO(), by: Session.userName() };
    if (a.wf) Object.assign(att, { wf: a.wf, doc: a.doc, byDept: D.settings.org.dept });
    p.attachments.push(att); added++;
    if (a.cover && (!p.coverFileId || /^(lib|asset):/.test(p.coverFileId))) p.coverFileId = up.id;
  }
  p.forms = p.forms || {};
  for (const [k, f] of Object.entries(P.forms || {})) {
    if (!FORMS[k] || (p.forms[k] && p.forms[k].status === 'done')) continue;
    /* الحقول غير الواردة في الحزمة تأخذ نصوص النموذج الافتراضية، فتُحفظ كاملة */
    const defs = Object.fromEntries(FORMS[k].sections(fRecInfo('partnership', p), p).flatMap((x) => x.fields).filter((x) => x.def !== undefined && typeof x.def !== 'function').map((x) => [x.k, x.def]));
    const data = { ...defs, ...(f.data || {}) };
    FORMS[k].sections(fRecInfo('partnership', p), p).flatMap((x) => x.fields).forEach((fd) => {
      const opts = typeof fd.opts === 'function' ? fd.opts() : fd.opts;
      if (!Array.isArray(opts) || !opts.length || typeof opts[0] !== 'string') return;
      if (fd.type === 'multi' && Array.isArray(data[fd.k])) data[fd.k] = data[fd.k].map((v) => pkgFit(v, opts));
      else if (typeof data[fd.k] === 'string') data[fd.k] = pkgFit(data[fd.k], opts);
    });
    const t = p.forms[k] = { ...(p.forms[k] || {}), data, status: f.status === 'done' ? 'done' : 'draft', at: f.at || nowISO(), by: f.by || Session.userName(), byDept: f.byDept || D.settings.org.dept };
    if (!t.no) t.no = formNumber(k);
    if (t.status === 'done' && FORMS[k].out) FORMS[k].out(p, t.data, 'partnership');
    forms++;
  }
  /* حقول السجل الفارغة فقط (لا يُستبدل ما أدخلته الإدارة) */
  for (const [k, v] of Object.entries(P.fields || {})) {
    const cur = p[k]; if (Array.isArray(cur) ? cur.length : cur) continue;
    p[k] = k === 'departments' && Array.isArray(v) ? v.map((x) => pkgFit(x, L('departments'))) : v;
  }
  /* موضع الشراكة في المسار: الخطوات حتى «upto» مكتملة (سابقة لاعتماد المسار في المنصة) */
  let steps = 0;
  if (P.wf && P.wf.upto && typeof WF_STEPS !== 'undefined') {
    const upto = WF_STEPS.findIndex((x) => x.id === P.wf.upto);
    p.wf = p.wf || { steps: {} }; p.wf.steps = p.wf.steps || {};
    WF_STEPS.slice(0, upto + 1).forEach((x) => { const c = p.wf.steps[x.id]; if (!(c && c.status === 'done')) { p.wf.steps[x.id] = { status: 'done', legacy: true, at: nowISO(), by: Session.userName(), decision: x.kind === 'decision' || x.final ? 'yes' : undefined }; steps++; } });
    const sign = WF_STEPS.findIndex((x) => x.id === 'signed');
    if (p.stage === 'prep' && upto >= sign - 3) p.stage = 'sign';
  }
  wfEnsureForms('partnership', p);
  await Repo.saveSettings();
  await Repo.save('partnerships', p);
  await Repo.log('package.import', 'partnership', p.id, p.code, `استيراد حزمة: ${added} مرفق${forms ? ` و${forms} نموذج` : ''}`);
  return { p, added, skipped, forms, steps };
}
