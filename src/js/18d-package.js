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
    const t = p.forms[k] = { ...(p.forms[k] || {}), data: { ...defs, ...(f.data || {}) }, status: f.status === 'done' ? 'done' : 'draft', at: nowISO(), by: Session.userName(), byDept: D.settings.org.dept };
    if (!t.no) t.no = formNumber(k);
    if (t.status === 'done' && FORMS[k].out) FORMS[k].out(p, t.data, 'partnership');
    forms++;
  }
  await Repo.saveSettings();
  await Repo.save('partnerships', p);
  await Repo.log('package.import', 'partnership', p.id, p.code, `استيراد حزمة: ${added} مرفق${forms ? ` و${forms} نموذج` : ''}`);
  return { p, added, skipped, forms };
}
