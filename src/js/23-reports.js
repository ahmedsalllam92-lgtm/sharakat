/* ===== التقارير: محرك شرائح موحّد — المعاينة وPDF وPowerPoint من المواصفة نفسها ===== */
const RPT_SECTIONS = [
  { k: 'cover', l: 'غلاف التقرير', g: 'التقرير' },
  { k: 'toc', l: 'فهرس المحتويات', g: 'التقرير' },
  { k: 'portfolio', l: 'لمحة عن المحفظة المختارة (رسوم)', g: 'التقرير' },
  { k: 'summary', l: 'ملخص الشراكات المختارة', g: 'التقرير' },
  { k: 'pcover', l: 'غلاف لكل شراكة', g: 'الشراكة' },
  { k: 'story', l: 'قصة الأثر (شريحة تسويقية)', g: 'الشراكة' },
  { k: 'hero', l: 'الرقم البطل: أبرز نتيجة', g: 'الشراكة' },
  { k: 'exec', l: 'الملخص التنفيذي', g: 'الشراكة' },
  { k: 'overview', l: 'نظرة عامة: المؤشرات والبيانات والفترة', g: 'الشراكة' },
  { k: 'partner', l: 'بطاقة الجهة الشريكة وشراكاتها', g: 'الشراكة' },
  { k: 'coop', l: 'مجالات التعاون', g: 'الشراكة' },
  { k: 'impact', l: 'الأثر المتوقع والمخرجات', g: 'الشراكة' },
  { k: 'follow', l: 'الملاحظات والتحديات والتوصيات', g: 'الشراكة' },
  { k: 'team', l: 'الفريق والإدارات والتواصل', g: 'الشراكة' },
  { k: 'activity', l: 'الإنجازات والمستجدات المرتبطة', g: 'الشراكة' },
  { k: 'history', l: 'سجل التحديثات ومصدر الشراكة', g: 'الشراكة', internal: true },
  { k: 'files', l: 'الملفات والتقارير المرفقة', g: 'الشراكة', internal: true },
  { k: 'photos', l: 'صور الشراكة', g: 'الشراكة' },
  { k: 'end', l: 'الخاتمة', g: 'الختام' },
];
const RPT = (() => { App.ui.rpt = App.ui.rpt || { ids: [], sections: RPT_SECTIONS.map((s) => s.k), ov: {}, f: {}, q: '' }; const r = App.ui.rpt; r.known = r.known || r.sections.slice(); RPT_SECTIONS.forEach((s) => { if (!r.known.includes(s.k)) { r.known.push(s.k); if (!r.sections.includes(s.k)) r.sections.push(s.k); } }); return r; })();
const rptOn = (k) => RPT.sections.includes(k) && (!RPT_SECTIONS.find((s) => s.k === k).internal || can('view.internal'));
// التعديل يبقى ما دامت بيانات الشراكة الأصلية لم تتغير؛ إذا عُدّلت الشراكة يظهر النص الجديد تلقائيًا
let RPT_STALE = 0;
function rptVal(key, def) {
  const o = RPT.ov[key]; def = def == null ? '' : String(def);
  if (!o) return def;
  if (typeof o === 'string') return o;
  if (o.base === def) return o.v;
  delete RPT.ov[key]; RPT_STALE++; return def;
}
const itemsOf = (txt) => richItems(txt).map((x) => ({ t: x.title || '', x: x.text || '' })).filter((x) => x.t || x.x);
const itemStr = (it) => (it.t ? `${it.t}\n${it.x}` : it.x);
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out.length ? out : [[]]; };

/* — قياس النص لاختيار حجم يناسب الصندوق (يُستخدم في المعاينة وPowerPoint معًا) — */
function fitSize(text, w, h, max, min = 11, lh = 1.5) {
  const paras = String(text || '').split('\n');
  for (let fs = max; fs >= min; fs -= 1) {
    const cpl = Math.max(4, Math.floor(w / (fs * (RC.cw || 0.5))));
    const lines = paras.reduce((t, p) => t + Math.max(1, Math.ceil(p.length / cpl)), 0);
    if (lines * fs * lh <= h) return fs;
  }
  return min;
}

/* — الألوان والهندسة (بكسل على شريحة 1280×720) — */
const RTHEMES = {
  classic: { name: 'المؤسسي', page: '#F2F6F4', card: '#FFFFFF', pri: '#0B3F38', priT: '#0B3F38', petrol2: '#1F6B5C', mint: '#5FB894', mintBg: '#E3F1EA', gold: '#B08A3E', goldBg: '#F6EEDC', clay: '#C2683F', clayBg: '#F8E6DC', ink: '#16222A', ink2: '#3B4B52', mut: '#6B7F78', faint: '#9AA9A3', line: '#E1E9E5', white: '#FFFFFF', head: '#0B3F38', headOv: '#06201C', kick: '#E6C786', onHead: '#FFFFFF', onHeadMut: '#C9DDD6', cover: '#0B3F38', cover2: '#1F6B5C', coverAcc: '#5FB894', track: '#E6EDEA', font: 'IBM Plex Sans Arabic', hfont: 'IBM Plex Sans Arabic', hk: 1, cw: 0.5, band: { bg: '#0B3F38', line: '#9FD4BE', lo: 0.2, hi: '#D9B467', ho: 0.75, ink: '#FFFFFF', kick: '#E6C786', logo: '#FFFFFF', logoInk: '#0B3F38' }, coverLines: { line: '#9FD4BE', lo: 0.16, hi: '#D9B467', ho: 0.6 } },
  board: { name: 'المجلس', page: '#F7F4EC', card: '#FFFFFF', pri: '#0F4433', priT: '#0F4433', petrol2: '#2F7A5E', mint: '#4F9A78', mintBg: '#E8EFEA', gold: '#A47C32', goldBg: '#F4EAD4', clay: '#A47C32', clayBg: '#F4EAD4', ink: '#14201B', ink2: '#2E3B35', mut: '#5C6861', faint: '#8C958E', line: '#E7E1D3', white: '#FFFFFF', head: '#0F4433', headOv: '#08241B', kick: '#D9C08A', onHead: '#FFFFFF', onHeadMut: '#C7D6CD', cover: '#0F4433', cover2: '#1A5C46', coverAcc: '#D9C08A', track: '#F1EDE2', font: 'IBM Plex Sans Arabic', hfont: 'Noto Naskh Arabic', hk: 1.12, cw: 0.5, band: { bg: '#0F4433', line: '#D9C08A', lo: 0.2, hi: '#D9C08A', ho: 0.7, ink: '#FFFFFF', kick: '#D9C08A', logo: '#D9C08A', logoInk: '#0F4433' }, coverLines: { line: '#D9C08A', lo: 0.18, hi: '#D9C08A', ho: 0.55 } },
};
const BAND_CACHE = {};
function geoGraphic(W, H, color, op = 0.16, tile = 120) {
  const k = `geo|${W}|${H}|${color}|${op}|${tile}`; if (BAND_CACHE[k]) return BAND_CACHE[k];
  const t = tile, h = t / 2, q = t * 0.3;
  return (BAND_CACHE[k] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><pattern id="g" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><g fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="1.4"><rect x="${h - q}" y="${h - q}" width="${2 * q}" height="${2 * q}"/><rect x="${h - q}" y="${h - q}" width="${2 * q}" height="${2 * q}" transform="rotate(45 ${h} ${h})"/><circle cx="${h}" cy="${h}" r="${t * 0.09}"/><path d="M0 ${h}H${t * 0.08}M${t * 0.92} ${h}H${t}M${h} 0V${t * 0.08}M${h} ${t * 0.92}V${t}"/></g></pattern></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
}
function topoGraphic(key, W, H, c, seed) {
  const k = `${key}|${W}|${H}|${seed}`; if (BAND_CACHE[k]) return BAND_CACHE[k];
  const ps = topoPaths(seed, W, H, { levels: H > 300 ? 16 : 11, cols: H > 300 ? 70 : 90, focus: 'left' });
  return (BAND_CACHE[k] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">${ps.map((p) => `<path d="${p.d}" fill="none" stroke="${p.hi ? c.hi : c.line}" stroke-opacity="${p.hi ? c.ho : c.lo}" stroke-width="${p.hi ? 1.8 : 1.1}"/>`).join('')}</svg>`);
}
const rptThemeKey = () => { if (RPT.theme && RPT.theme !== 'auto' && RTHEMES[RPT.theme]) return RPT.theme; const d = design(); return RTHEMES[d] ? d : 'classic'; };
let RC = RTHEMES.classic;
const SW = 1280, SH = 720, MX = 64, BY = 172, BH = 484;
const rx = (right, w) => SW - right - w;
const STC2 = (k) => ({ active: '#1F6B5C', soon: '#B8862F', upcoming: '#4E9C84', sign: '#9C845A', prep: '#6B7F78', hold: '#B8862F', ended: '#7D8C87', cancel: '#B5533C', nodates: '#7D8C87', draft: '#7D8C87' }[k] || '#6B7F78');
const P = {
  rect: (x, y, w, h, fill, o = {}) => ({ k: 'rect', x, y, w, h, fill, ...o }),
  circ: (x, y, d, fill, o = {}) => ({ k: 'circ', x, y, w: d, h: d, fill, ...o }),
  text: (x, y, w, h, text, o = {}) => ({ k: 'text', x, y, w, h, text: String(text == null ? '' : text), size: 16, color: RC.ink, align: 'right', valign: 'top', lh: 1.5, font: RC.font, ...o }),
  head: (x, y, w, h, text, o = {}) => { const t = P.text(x, y, w, h, text, { bold: true, font: RC.hfont, ...o }); t.size = Math.round(t.size * RC.hk); return t; },
  icon: (x, y, d, name, color) => ({ k: 'icon', x, y, w: d, h: d, name, color }),
  svg: (x, y, w, h, svg) => ({ k: 'svg', x, y, w, h, svg }),
  img: (x, y, w, h, src, o = {}) => ({ k: 'img', x, y, w, h, src, fit: 'cover', ...o }),
};
const card = (x, y, w, h, o = {}) => P.rect(x, y, w, h, o.fill || RC.card, { r: o.r == null ? 14 : o.r, line: o.line === undefined ? RC.line : o.line });

function frame(sp, s, title, idx, total) {
  const p = s.pid ? D.partnerships.find((x) => x.id === s.pid) : null, pr = p ? partnerById(p.partnerId) : null;
  const B = RC.band;
  const els = [P.rect(0, 0, SW, SH, RC.page), P.rect(0, 0, SW, 150, B.bg), P.svg(0, 0, SW, 150, topoGraphic(rptThemeKey(), SW, 150, B, 'band-' + rptThemeKey()))];
  if (pr && pr.logoFileId) els.push(P.circ(MX, 37, 76, '#FFFFFF'), P.img(MX + 12, 49, 52, 52, pr.logoFileId, { fit: 'contain' }));
  else if (s.pid) els.push(P.circ(MX, 39, 72, B.logo), P.icon(MX + 20, 59, 32, embIcon(pr), B.logoInk));
  els.push(P.text(rx(MX, 980), 34, 980, 28, s.kicker || `${s.pname || ''}${s.code ? '  ·  ' + s.code : ''}`, { size: 16, bold: true, color: B.kick, lh: 1.4 }));
  els.push(P.head(rx(MX, 980), 64, 980, 60, title, { size: fitSize(title, 980, 56, 34, 22, 1.3), color: B.ink, lh: 1.3 }));
  els.push(P.text(rx(MX, 700), 684, 700, 22, `${D.settings.org.name} — ${D.settings.org.platform}`, { size: 12, color: RC.faint, lh: 1.4 }));
  els.push(P.text(MX, 684, 200, 22, `${idx + 1} من ${total}`, { size: 12, color: RC.faint, align: 'left', lh: 1.4 }));
  return els.concat(sp);
}
const ICONSET = ['link', 'users', 'flag', 'leaf', 'chart', 'star', 'award', 'send', 'calendar', 'building'];
const TINTS = () => [[RC.mintBg, RC.priT], [RC.goldBg, RC.gold], [RC.clayBg, RC.clay]];
const tile = (x, y, d, name, k = 0) => { const [bg, fg] = TINTS()[k % 3]; return [P.rect(x, y, d, d, bg, { r: Math.round(d * 0.28) }), P.icon(x + d * 0.24, y + d * 0.24, d * 0.52, name, fg)]; };
const badge = (x, y, d, n, fill = RC.mintBg, color = RC.priT) => [P.circ(x, y, d, fill), P.text(x, y, d, d, String(n), { size: Math.round(d * 0.42), bold: true, color, align: 'center', valign: 'middle', lh: 1 })];
const chipEl = (rightEdge, y, label, color, { h = 30 } = {}) => { const w = Math.max(76, label.length * 9 + 32); return [P.rect(rightEdge - w, y, w, h, color, { r: h / 2 }), P.text(rightEdge - w, y, w, h, label, { size: 14, bold: true, color: RC.white, align: 'center', valign: 'middle', lh: 1 })]; };

/* — بناء الشرائح من بيانات الشراكات لحظة العرض — */
function rptSlides() {
  RPT_STALE = 0;
  RC = RTHEMES[rptThemeKey()];
  const ps = RPT.ids.map((id) => D.partnerships.find((p) => p.id === id)).filter(Boolean);
  const S = [];
  const now = new Date();
  const add = (s) => S.push(s);
  if (rptOn('cover')) {
    const st = ps.map(pStatus);
    add({ t: 'cover', title: rptVal('rep.title', ps.length === 1 ? `تقرير شراكة ${partnerName(ps[0])}` : 'تقرير الشراكات'), sub: rptVal('rep.sub', `${D.settings.org.dept} — ${D.settings.org.name}`), date: fmtDate(isoDate(now)), stats: [[ps.length, ps.length === 1 ? 'شراكة' : 'شراكات في التقرير'], [st.filter((x) => ['active', 'soon'].includes(x)).length, 'سارية حاليًا'], [new Set(ps.map((p) => p.partnerId)).size, 'جهة شريكة']] });
  }
  if (rptOn('toc') && ps.length > 1) chunk(ps, 9).forEach((part, i, all) => add({ t: 'toc', kicker: D.settings.org.dept, title: 'فهرس المحتويات' + (all.length > 1 ? ` (${i + 1}/${all.length})` : ''), rows: part, off: i * 9 }));
  if (rptOn('portfolio') && ps.length > 1) add({ t: 'portfolio', kicker: D.settings.org.dept, title: 'لمحة عن المحفظة المختارة', all: ps });
  if (rptOn('summary') && ps.length > 1) chunk(ps, 8).forEach((part, i, all) => add({ t: 'summary', kicker: D.settings.org.dept, title: 'ملخص الشراكات المختارة' + (all.length > 1 ? ` (${i + 1}/${all.length})` : ''), all: ps, rows: part }));
  ps.forEach((p) => {
    const id = p.id, pr = partnerById(p.partnerId), name = rptVal(`${id}.name`, partnerName(p));
    const head = { pid: id, pname: name, code: p.code || '' };
    const atts = p.attachments || [];
    const photos = atts.filter((a) => isImg(a) && (a.category === 'صور الشراكة' || !a.category));
    const files = atts.filter((a) => !isImg(a));
    const coop = itemsOf(p.cooperationAreas), imp = itemsOf(p.expectedImpact), outs = itemsOf(p.outputs);
    if (rptOn('pcover')) add({ t: 'pcover', ...head, p, pr, name, tag: rptVal(`${id}.tag`, p.showcaseGoal || firstItem(p.cooperationAreas) || '') });
    if (rptOn('story') && (p.showcaseGoal || imp.length)) add({ t: 'story', ...head, p, quote: rptVal(`${id}.quote`, p.showcaseGoal || itemStr(imp[0] || { t: '', x: '' })), pts: (p.showcaseGoal ? imp : imp.slice(1)).slice(0, 3).map((it, k) => ({ k, s: rptVal(`${id}.story.${k}`, it.t || it.x) })) });
    if (rptOn('hero') && p.highlight && p.highlight.value) add({ t: 'hero', ...head, p, pr, hv: rptVal(`${id}.hlv`, p.highlight.value), hl: rptVal(`${id}.hll`, p.highlight.label || ''), hx: rptVal(`${id}.hlx`, p.highlight.text || '') });
    if (rptOn('exec')) {
      const st = pStatus(p), dl = daysLeft(p);
      const stPh = { active: 'سارية حاليًا', soon: `سارية وتقترب من الانتهاء`, ended: 'منتهية', upcoming: 'موقّعة ولم يبدأ سريانها بعد', sign: 'بانتظار التوقيع', prep: 'قيد الإعداد', hold: 'معلّقة', cancel: 'ملغاة', nodates: 'دون تواريخ مسجلة' }[st] || statusLabel(st);
      const own = (p.owners || []).join(' و'), dep = (p.departments || []).join('، ');
      const auto = `شراكة مع ${pr ? pr.name : name}${pSector(p) ? ` (القطاع ${pSector(p)})` : ''}${p.classification ? ` بموجب ${p.classification}` : ''}، وهي ${stPh}.${p.startDate && p.endDate ? ` تمتد من ${fmtDate(p.startDate)} إلى ${fmtDate(p.endDate)}${dl !== null && dl >= 0 ? `، ويتبقى على انتهائها ${dl} يومًا` : ''}.` : ''} تتضمن ${coop.length} ${coop.length === 1 ? 'مجال تعاون' : 'مجالات تعاون'} و${outs.length} ${outs.length === 1 ? 'مخرجًا مستهدفًا' : 'مخرجات مستهدفة'}${own ? `، ويتولى متابعتها ${own} من إدارة الشراكات` : ''}${dep ? ` بالتقاطع مع ${dep}` : ''}.${p.highlight && p.highlight.value ? ` ومن أبرز نتائجها: ${p.highlight.value} ${p.highlight.label || ''}.` : ''}`;
      add({ t: 'exec', ...head, p, text: rptVal(`${id}.exec`, auto), top: coop.slice(0, 3).map((it, k) => ({ k, s: rptVal(`${id}.exec.top.${k}`, it.t || it.x) })), coopN: coop.length, outsN: outs.length });
    }
    if (rptOn('overview')) add({ t: 'overview', ...head, p, pr, counts: [[coop.length, 'مجالات التعاون'], [outs.length, 'المخرجات المستهدفة'], [(p.departments || []).length, 'الإدارات المتقاطعة'], [files.length, 'الملفات المرفقة'], [photos.length, 'صور الشراكة']], hlv: rptVal(`${id}.hlv`, (p.highlight && p.highlight.value) || ''), hll: rptVal(`${id}.hll`, (p.highlight && p.highlight.label) || '') });
    if (rptOn('partner') && pr) add({ t: 'partner', ...head, p, pr, others: D.partnerships.filter((x) => x.partnerId === pr.id && (showDemo() || !x.demo)), props: D.proposals.filter((x) => x.partnerId === pr.id || (x.partnerName && normAr(x.partnerName) === normAr(pr.name))) });
    if (rptOn('coop') && coop.length) { const per = coop.length <= 3 ? 3 : 6; chunk(coop.map((it, k) => ({ k, s: rptVal(`${id}.coop.${k}`, itemStr(it)) })), per).forEach((part, i, all) => add({ t: 'cards', ...head, title: 'مجالات التعاون' + (all.length > 1 ? ` (${i + 1}/${all.length})` : ''), items: part, key: `${id}.coop`, total: coop.length })); }
    if (rptOn('impact') && (imp.length || outs.length)) {
      const A = imp.map((it, k) => ({ k, s: rptVal(`${id}.impact.${k}`, itemStr(it)) })), B = outs.map((it, k) => ({ k, s: rptVal(`${id}.outputs.${k}`, itemStr(it)) }));
      const pages = Math.max(Math.ceil(A.length / 5), Math.ceil(B.length / 5), 1);
      for (let i = 0; i < pages; i++) add({ t: 'cols', ...head, title: 'الأثر المتوقع والمخرجات' + (pages > 1 ? ` (${i + 1}/${pages})` : ''), cols: [{ h: 'الأثر المتوقع وكيف يخدم المؤسسة', c: RC.pri, key: `${id}.impact`, items: A.slice(i * 5, i * 5 + 5), n: A.length }, { h: 'المخرجات المستهدفة', c: RC.gold, key: `${id}.outputs`, items: B.slice(i * 5, i * 5 + 5), n: B.length }] });
    }
    const fN = itemsOf(p.notes), fC = itemsOf(p.challenges), fR = itemsOf(p.recommendations);
    if (rptOn('follow') && (fN.length || fC.length || fR.length)) add({ t: 'cols', ...head, title: 'الملاحظات والتحديات والتوصيات', cols: [['الملاحظات', RC.petrol2, 'notes', fN], ['التحديات', RC.clay, 'challenges', fC], ['التوصيات', RC.gold, 'recs', fR]].map(([h, c, k, arr]) => ({ h, c, key: `${id}.${k}`, items: arr.slice(0, 5).map((it, j) => ({ k: j, s: rptVal(`${id}.${k}.${j}`, itemStr(it)) })), n: arr.length })) });
    if (rptOn('team')) add({ t: 'team', ...head, p });
    const stories = D.achievements.filter((a) => a.partnershipId === id && (showDemo() || !a.demo)), news = D.news.filter((n) => n.partnershipId === id && (showDemo() || !n.demo)).sort((a, b) => (a.date < b.date ? 1 : -1));
    if (rptOn('activity') && (stories.length || news.length)) add({ t: 'activity', ...head, stories: stories.slice(0, 3), news: news.slice(0, 6) });
    if (rptOn('history')) add({ t: 'history', ...head, p, log: D.audit.filter((e) => e.entityId === id).slice(0, 7), prop: D.proposals.find((x) => x.partnershipId === id) });
    if (rptOn('files') && files.length) { const byCat = {}; files.forEach((a) => { (byCat[a.category || 'أخرى'] = byCat[a.category || 'أخرى'] || []).push(a); }); chunk(Object.entries(byCat), 4).forEach((part, i, all) => add({ t: 'files', ...head, title: 'الملفات والتقارير المرفقة' + (all.length > 1 ? ` (${i + 1}/${all.length})` : ''), cats: part, total: files.length })); }
    if (rptOn('photos') && photos.length) chunk(photos, 4).forEach((part, i, all) => add({ t: 'photos', ...head, title: 'صور الشراكة' + (all.length > 1 ? ` (${i + 1}/${all.length})` : ''), photos: part }));
  });
  if (rptOn('end') && ps.length) add({ t: 'end', date: fmtDate(isoDate(now)), n: ps.length });
  const firstIdx = {}; S.forEach((s, i) => { if (s.pid && firstIdx[s.pid] === undefined) firstIdx[s.pid] = i + 1; });
  S.forEach((s) => { if (s.t === 'toc') s.pages = firstIdx; });
  return S.map((s, i) => ({ ...s, nav: navLabel(s), theme: rptThemeKey(), bg: RC.page, els: specFor(s, i, S.length) }));
}
function navLabel(s) { return { story: 'قصة الأثر', hero: 'الرقم البطل', cover: 'الغلاف', toc: 'الفهرس', portfolio: 'لمحة المحفظة', summary: 'ملخص الشراكات', end: 'الخاتمة', pcover: `غلاف: ${s.pname}`, exec: 'الملخص التنفيذي', overview: 'نظرة عامة', partner: 'الجهة الشريكة', team: 'الفريق', activity: 'الإنجازات', history: 'السجل' }[s.t] || (s.title || ''); }

/* — مواصفة كل شريحة: قائمة عناصر بإحداثيات ثابتة — */
function specFor(s, i, total) {
  const E = [];
  if (s.t === 'cover') {
    const pics = RPT.ids.map((id) => D.partnerships.find((p) => p.id === id)).filter((p) => p && p.coverFileId).map((p) => p.coverFileId).slice(0, 3);
    E.push(P.rect(0, 0, SW, SH, RC.cover));
    if (pics.length) {
      E.push(P.img(0, 0, 470, SH, pics[0]), P.rect(0, 0, 470, SH, RC.headOv, { alpha: 62 }));
      if (pics[1]) E.push(P.img(214, 452, 220, 156, pics[1], { r: 6 }), P.rect(214, 452, 220, 156, '#FFFFFF', { alpha: 100, line: RC.kick }));
      E.push(P.rect(470, 0, 6, SH, RC.kick));
    }
    E.push(P.svg(pics.length ? 476 : 0, 0, pics.length ? SW - 476 : SW, SH, geoGraphic(pics.length ? SW - 476 : SW, SH, RC.kick, 0.14)));
    E.push(P.rect(rx(MX, 90), 196, 90, 4, RC.kick));
    if (ASSET_IMG['murooj-logo-dark']) E.push(P.img(rx(MX, 300), 50, 300, 96, 'asset:murooj-logo-dark', { fit: 'contain', pos: 'right' }));
    E.push(P.text(rx(MX, 1000), 214, 1000, 30, D.settings.org.platform, { size: 20, bold: true, color: RC.kick, lh: 1.4 }));
    E.push(P.head(rx(MX, 1050), 252, 1050, 180, s.title, { key: 'rep.title', size: fitSize(s.title, 1050, 180, 64, 34, 1.25), color: RC.onHead, lh: 1.2, valign: 'middle' }));
    E.push(P.text(rx(MX, 1000), 440, 1000, 40, s.sub, { key: 'rep.sub', size: 24, color: '#C9DDD6', lh: 1.4 }));
    E.push(P.text(rx(MX, 400), 494, 400, 30, s.date, { size: 18, color: '#A9C4BB', lh: 1.4 }));
    s.stats.forEach(([n, l], k) => { const w = pics.length ? 230 : 250, x = rx(MX + k * (w + 16), w); E.push(P.rect(x, 566, w, 90, '#FFFFFF', { r: 14, alpha: 90 }), P.text(x + 20, 574, w - 40, 46, String(n), { size: 36, bold: true, color: RC.white, lh: 1.2 }), P.text(x + 20, 620, w - 40, 26, l, { size: 15, color: '#C9DDD6', lh: 1.3 })); });
    return E;
  }
  if (s.t === 'end') {
    E.push(P.rect(0, 0, SW, SH, RC.cover), P.svg(0, 0, SW, SH, geoGraphic(SW, SH, RC.kick, 0.13)), P.rect(rx(MX, 90), 228, 90, 4, RC.kick));
    if (ASSET_IMG['murooj-logo-dark']) E.push(P.img(rx(MX, 300), 50, 300, 96, 'asset:murooj-logo-dark', { fit: 'contain', pos: 'right' }));
    E.push(P.head(rx(MX, 900), 250, 900, 90, rptVal('rep.end', 'شكرًا لكم'), { key: 'rep.end', size: 60, color: RC.onHead, lh: 1.2, valign: 'middle' }));
    E.push(P.text(rx(MX, 900), 350, 900, 40, `${D.settings.org.dept} — ${D.settings.org.name}`, { size: 24, color: '#C9DDD6', lh: 1.4 }));
    E.push(P.text(rx(MX, 900), 420, 900, 70, rptVal('rep.endnote', `أُعدّ هذا التقرير من بيانات ${D.settings.org.platform} بتاريخ ${s.date}، ويغطي ${s.n === 1 ? 'شراكة واحدة' : `${s.n} شراكات`}.`), { key: 'rep.endnote', size: 18, color: '#A9C4BB', lh: 1.6 }));
    return E;
  }
  if (s.t === 'toc') {
    s.rows.forEach((p, k) => { const y = BY + k * 52, stk = pStatus(p); E.push(card(MX, y, SW - 2 * MX, 44, { r: 10 }), ...badge(SW - MX - 16 - 32, y + 6, 32, s.off + k + 1), P.text(rx(MX + 64, 640), y, 640, 44, partnerName(p), { size: fitSize(partnerName(p), 640, 22, 17, 12, 1.2), bold: true, valign: 'middle', lh: 1.2 }), P.text(rx(MX + 720, 150), y, 150, 44, p.code || '', { size: 13, color: RC.mut, valign: 'middle', lh: 1.2, ltr: true }), ...chipEl(MX + 300, y + 8, statusLabel(stk), STC2(stk), { h: 28 }), P.text(MX + 20, y, 120, 44, s.pages[p.id] ? `صفحة ${s.pages[p.id]}` : '', { size: 15, bold: true, color: RC.priT, align: 'left', valign: 'middle', lh: 1.2 })); });
    return frame(E, s, s.title, i, total);
  }
  if (s.t === 'portfolio') {
    const all = s.all, nd = all;
    const bars = (x, y, w, title, rows, color, maxRows = 6) => {
      E.push(P.text(x + 22, y, w - 44, 28, title, { size: 17, bold: true, color: RC.priT, lh: 1.3 }));
      const max = Math.max(1, ...rows.map((r) => r.n));
      rows.slice(0, maxRows).forEach((r, k) => { const yy = y + 38 + k * 34, lw2 = 170, tw = w - 44 - lw2 - 50; E.push(P.text(x + w - 22 - lw2, yy, lw2, 26, r.l, { size: fitSize(r.l, lw2, 20, 14, 10, 1.2), valign: 'middle', lh: 1.2 }), P.rect(x + 22 + 40, yy + 7, tw, 12, '#E8EEEC', { r: 6 }), P.rect(x + 22 + 40 + tw * (1 - r.n / max), yy + 7, Math.max(8, tw * r.n / max), 12, r.c || color, { r: 6 }), P.text(x + 22, yy, 34, 26, String(r.n), { size: 15, bold: true, align: 'left', valign: 'middle', lh: 1.2 })); });
    };
    const cw = (SW - 2 * MX - 16) / 2;
    const stRows = ST_ORDER.map((k) => ({ l: statusLabel(k), n: nd.filter((p) => pStatus(p) === k).length, c: STC2(k) })).filter((r) => r.n);
    const secRows = Object.entries(nd.reduce((m, p) => { const k = pSector(p) || 'غير محدد'; m[k] = (m[k] || 0) + 1; return m; }, {})).map(([l, n]) => ({ l, n }));
    const catRows = Object.entries(nd.reduce((m, p) => { (p.categories && p.categories.length ? p.categories : ['غير مصنّف']).forEach((c) => { m[c] = (m[c] || 0) + 1; }); return m; }, {})).map(([l, n]) => ({ l, n })).sort((a, b) => b.n - a.n);
    const xr = rx(MX, cw);
    E.push(card(xr, BY, cw, BH)); bars(xr, BY + 18, cw, 'توزيع الحالات', stRows, RC.petrol2, 5); bars(xr, BY + 18 + 38 + 5 * 34 + 24, cw, 'حسب قطاع الجهة', secRows, RC.gold, 4);
    E.push(card(MX, BY, cw, BH)); bars(MX, BY + 18, cw, 'حسب تصنيف الشراكة', catRows, RC.mint, 5);
    const t0 = today(), soon = nd.filter((p) => p.endDate && parseDate(p.endDate) >= t0).sort((a, b) => (a.endDate < b.endDate ? -1 : 1)).slice(0, 4);
    const ey = BY + 18 + 38 + 5 * 34 + 24;
    E.push(P.text(MX + 22, ey, cw - 44, 28, 'أقرب الاستحقاقات', { size: 17, bold: true, color: RC.priT, lh: 1.3 }));
    soon.forEach((p, k) => { const yy = ey + 38 + k * 40, dl = daysLeft(p); E.push(P.rect(MX + 22, yy, cw - 44, 34, RC.page, { r: 8 }), P.text(MX + 150, yy, cw - 186, 34, partnerName(p), { size: fitSize(partnerName(p), cw - 186, 18, 14, 10, 1.2), bold: true, valign: 'middle', lh: 1.2 }), P.text(MX + 34, yy, 110, 34, `${dl} يومًا`, { size: 13, bold: true, color: dl <= (D.settings.alertDays || 30) ? '#A2442C' : dl <= D.settings.expiryDays ? '#8A5E10' : RC.mut, align: 'left', valign: 'middle', lh: 1.2 })); });
    if (!soon.length) E.push(P.text(MX + 22, ey + 40, cw - 44, 24, 'لا توجد استحقاقات قادمة.', { size: 14, color: RC.faint }));
    return frame(E, s, s.title, i, total);
  }
  if (s.t === 'exec') {
    const p = s.p, st = pStatus(p), dl = daysLeft(p), rw = 760, lw = SW - 2 * MX - rw - 16, xr = rx(MX, rw);
    E.push(card(xr, BY, rw, BH), P.text(xr + 26, BY + 20, rw - 52, 30, 'الملخص التنفيذي', { size: 19, bold: true, color: RC.priT, lh: 1.3 }));
    E.push(P.text(xr + 26, BY + 60, rw - 52, 200, s.text, { key: s.pid + '.exec', size: fitSize(s.text, rw - 52, 200, 20, 12, 1.65), color: RC.ink2, lh: 1.65 }));
    E.push(P.rect(xr + 26, BY + 276, rw - 52, 1, RC.line), P.text(xr + 26, BY + 290, rw - 52, 26, 'أبرز مجالات التعاون', { size: 15, bold: true, color: RC.gold, lh: 1.3 }));
    s.top.forEach((it, k) => { const y = BY + 326 + k * 50; E.push(...badge(xr + rw - 26 - 32, y + 4, 32, k + 1), P.text(xr + 26, y, rw - 52 - 46, 44, it.s, { key: `${s.pid}.exec.top.${k}`, size: fitSize(it.s, rw - 52 - 46, 44, 16, 11, 1.4), color: RC.ink, lh: 1.4, valign: 'middle' })); });
    if (!s.top.length) E.push(P.text(xr + 26, BY + 330, rw - 52, 24, 'لم تُسجَّل مجالات تعاون.', { size: 14, color: RC.faint }));
    const tiles = [[dl === null ? '—' : dl >= 0 ? String(dl) : 'منتهية', dl !== null && dl >= 0 ? 'يومًا متبقيًا على الانتهاء' : statusLabel(st), STC2(st)], [String(s.coopN), 'مجالات التعاون', RC.pri], [String(s.outsN), 'المخرجات المستهدفة', RC.gold]];
    const th = (BH - 2 * 16) / 3;
    tiles.forEach(([v, l, c], k) => { const y = BY + k * (th + 16); E.push(card(MX, y, lw, th), P.text(MX + 24, y + 18, lw - 60, 66, v, { size: fitSize(v, lw - 60, 66, 52, 24, 1.2), bold: true, color: c, lh: 1.2 }), P.text(MX + 24, y + th - 44, lw - 60, 26, l, { size: 15, color: RC.mut, lh: 1.3 })); });
    return frame(E, s, 'الملخص التنفيذي', i, total);
  }
  if (s.t === 'story') {
    const p = s.p;
    E.push(P.rect(0, 0, SW, SH, RC.page));
    if (p.coverFileId) E.push(P.img(0, 0, 500, SH, p.coverFileId), P.rect(0, 0, 500, SH, RC.headOv, { alpha: 70 }));
    else E.push(P.rect(0, 0, 500, SH, RC.cover), P.svg(0, 0, 500, SH, geoGraphic(500, SH, RC.kick, 0.16)));
    E.push(P.rect(500, 0, 5, SH, RC.kick));
    E.push(P.text(MX, 560, 380, 30, s.pname, { size: 20, bold: true, color: RC.white, lh: 1.3 }), P.text(MX, 594, 380, 26, `${p.code || ''}${pSector(p) ? '  ·  القطاع ' + pSector(p) : ''}`, { size: 14, color: RC.onHeadMut, lh: 1.3 }));
    E.push(P.text(rx(MX, 640), 70, 640, 30, 'قصة الأثر', { size: 18, bold: true, color: RC.gold, lh: 1.3 }), P.rect(rx(MX, 70), 108, 70, 3, RC.gold));
    E.push(P.text(rx(MX - 10, 120), 120, 120, 120, '”', { size: 150, bold: true, color: RC.goldBg, align: 'right', lh: 1 }));
    E.push(P.head(rx(MX, 660), 150, 660, 250, s.quote, { key: s.pid + '.quote', size: fitSize(s.quote, 660, 250, 40, 22, 1.45), color: RC.priT, lh: 1.45, valign: 'middle' }));
    s.pts.forEach((it, k) => { const y = 440 + k * 72; E.push(P.rect(rx(MX, 660), y, 660, 60, RC.card, { r: 10, line: RC.line }), P.text(rx(MX + 16, 40), y, 40, 60, String(k + 1).padStart(2, '0'), { size: 22, bold: true, color: RC.gold, align: 'center', valign: 'middle', lh: 1 }), P.text(rx(MX + 70, 570), y + 6, 570, 48, it.s, { key: `${s.pid}.story.${it.k}`, size: fitSize(it.s, 570, 48, 17, 11, 1.4), color: RC.ink, valign: 'middle', lh: 1.4 })); });
    E.push(P.text(rx(MX, 600), 684, 600, 22, `${D.settings.org.name} — ${D.settings.org.platform}`, { size: 12, color: RC.faint, lh: 1.4 }), P.text(530, 684, 200, 22, `${i + 1} من ${total}`, { size: 12, color: RC.faint, align: 'left', lh: 1.4 }));
    return E;
  }
  if (s.t === 'hero') {
    const p = s.p, pr = s.pr;
    E.push(P.rect(0, 0, SW, SH, RC.cover), P.svg(0, 0, SW, SH, geoGraphic(SW, SH, RC.kick, 0.1)));
    if (p.coverFileId) { E.push(P.circ(MX + 10, 150, 420, RC.kick), P.img(MX + 18, 158, 404, 404, p.coverFileId, { round: true })); }
    else E.push(P.circ(MX + 10, 150, 420, RC.cover2, { line: RC.kick }));
    E.push(P.text(rx(MX, 640), 110, 640, 30, `${s.pname}${s.code ? '  ·  ' + s.code : ''}`, { size: 18, bold: true, color: RC.kick, lh: 1.3 }));
    E.push(P.text(rx(MX, 640), 150, 640, 30, 'أبرز نتيجة متحققة', { size: 16, color: RC.onHeadMut, lh: 1.3 }));
    E.push(P.head(rx(MX, 680), 190, 680, 210, s.hv, { key: s.pid + '.hlv', size: fitSize(s.hv, 680, 210, 168, 56, 1.1), color: RC.white, lh: 1.1, valign: 'middle' }));
    E.push(P.rect(rx(MX, 120), 410, 120, 5, RC.kick));
    if (s.hl) E.push(P.head(rx(MX, 680), 430, 680, 70, s.hl, { key: s.pid + '.hll', size: fitSize(s.hl, 680, 70, 34, 18, 1.3), color: RC.kick, lh: 1.3 }));
    if (s.hx) E.push(P.text(rx(MX, 640), 510, 640, 110, s.hx, { key: s.pid + '.hlx', size: fitSize(s.hx, 640, 110, 20, 13, 1.55), color: RC.onHeadMut, lh: 1.55 }));
    E.push(P.text(rx(MX, 700), 684, 700, 22, `${D.settings.org.name} — ${D.settings.org.platform}`, { size: 12, color: '#B9CCC5', lh: 1.4 }), P.text(MX, 684, 200, 22, `${i + 1} من ${total}`, { size: 12, color: '#B9CCC5', align: 'left', lh: 1.4 }));
    return E;
  }
  if (s.t === 'pcover') {
    const p = s.p, st = pStatus(p);
    if (p.coverFileId) E.push(P.img(0, 0, SW, SH, p.coverFileId)); else E.push(P.rect(0, 0, SW, SH, RC.cover2), P.circ(-200, 200, 700, RC.coverAcc, { alpha: 84 }));
    E.push(P.rect(0, 0, SW, SH, RC.headOv, { alpha: 48 }), P.rect(0, 300, SW, 420, RC.headOv, { alpha: 32 }));
    E.push(P.text(rx(MX, 1000), 300, 1000, 30, `${p.classification || ''}${p.code ? '  ·  ' + p.code : ''}`, { size: 18, bold: true, color: RC.kick, lh: 1.4 }));
    E.push(P.head(rx(MX, 1100), 336, 1100, 118, s.name, { key: s.pid + '.name', size: fitSize(s.name, 1100, 118, 56, 30, 1.25), color: RC.white, lh: 1.2, valign: 'middle' }));
    if (s.tag) E.push(P.text(rx(MX, 1000), 462, 1000, 74, s.tag, { key: s.pid + '.tag', size: fitSize(s.tag, 1000, 74, 21, 14, 1.5), color: '#E3EEEA', lh: 1.5 }));
    const info = [['القطاع', pSector(p) || '—'], ['الحالة', statusLabel(st)], ['الفترة', p.startDate && p.endDate ? `${fmtDate(p.startDate, 'short')} — ${fmtDate(p.endDate, 'short')}` : '—'], ['المسؤول', (p.owners || []).join('، ') || '—']];
    const w = (SW - 2 * MX - 3 * 14) / 4;
    info.forEach(([l, v], k) => { const x = rx(MX + k * (w + 14), w); E.push(P.rect(x, 574, w, 84, '#FFFFFF', { r: 12, alpha: 86 }), P.text(x + 16, 584, w - 32, 22, l, { size: 13, color: '#C9DDD6', lh: 1.3 }), P.text(x + 16, 608, w - 32, 40, v, { size: fitSize(v, w - 32, 40, 19, 12, 1.3), bold: true, color: RC.white, lh: 1.3 })); });
    E.push(P.text(rx(MX, 700), 684, 700, 22, `${D.settings.org.name} — ${D.settings.org.platform}`, { size: 12, color: '#B9CCC5', lh: 1.4 }), P.text(MX, 684, 200, 22, `${i + 1} من ${total}`, { size: 12, color: '#B9CCC5', align: 'left', lh: 1.4 }));
    return E;
  }
  if (s.t === 'summary') {
    const st = s.all.map(pStatus);
    const stats = [[s.all.length, 'شراكة'], [st.filter((x) => ['active', 'soon'].includes(x)).length, 'سارية'], [st.filter((x) => x === 'soon').length, 'تنتهي قريبًا'], [st.filter((x) => x === 'ended').length, 'منتهية'], [new Set(s.all.map((p) => p.partnerId)).size, 'جهة شريكة']];
    const tw = (SW - 2 * MX - 4 * 14) / 5;
    stats.forEach(([n, l], k) => { const x = rx(MX + k * (tw + 14), tw); E.push(card(x, BY, tw, 84), P.text(x + 18, BY + 10, tw - 36, 42, String(n), { size: 32, bold: true, color: RC.priT, lh: 1.25 }), P.text(x + 18, BY + 52, tw - 36, 22, l, { size: 14, color: RC.mut, lh: 1.3 })); });
    const cols = [['الجهة', 420], ['تصنيف المذكرة', 170], ['الحالة', 140], ['البدء', 140], ['الانتهاء', 140], ['المتبقي', SW - 2 * MX - 1010]];
    const ty = BY + 104, rh = 44;
    E.push(card(MX, ty, SW - 2 * MX, rh * (s.rows.length + 1) + 8, { r: 12 }), P.rect(MX, ty, SW - 2 * MX, rh, RC.pri, { r: 12 }));
    let cx = SW - MX;
    cols.forEach(([h, w]) => { E.push(P.text(cx - w + 12, ty, w - 24, rh, h, { size: 14, bold: true, color: RC.white, valign: 'middle', lh: 1.2 })); cx -= w; });
    s.rows.forEach((p, r) => {
      const y = ty + rh * (r + 1) + 4, dl = daysLeft(p), stk = pStatus(p);
      if (r % 2) E.push(P.rect(MX + 4, y, SW - 2 * MX - 8, rh, RC.page, { r: 6 }));
      const vals = [partnerName(p), p.classification || '—', statusLabel(stk), p.startDate ? fmtDate(p.startDate, 'short') : '—', p.endDate ? fmtDate(p.endDate, 'short') : '—', dl === null ? '—' : dl >= 0 ? `${dl} يومًا` : 'منتهية'];
      let x2 = SW - MX;
      cols.forEach(([, w], k) => { E.push(P.text(x2 - w + 12, y, w - 24, rh, vals[k], { size: k === 0 ? fitSize(vals[k], w - 24, 22, 15, 11, 1.2) : 14, bold: k === 0 || k === 2, color: k === 2 ? STC2(stk) : RC.ink, valign: 'middle', lh: 1.2 })); x2 -= w; });
    });
    return frame(E, s, s.title, i, total);
  }
  if (s.t === 'overview') {
    const p = s.p, st = pStatus(p), dl = daysLeft(p), tp = termProgress(p), al = expiryAlert(p);
    const tw = (SW - 2 * MX - 4 * 14) / 5;
    s.counts.forEach(([n, l], k) => { const x = rx(MX + k * (tw + 14), tw); E.push(card(x, BY, tw, 86), P.text(x + 18, BY + 10, tw - 36, 42, String(n), { size: 32, bold: true, color: k === 0 ? RC.pri : k === 1 ? RC.gold : RC.petrol2, lh: 1.25 }), P.text(x + 18, BY + 54, tw - 36, 22, l, { size: 14, color: RC.mut, lh: 1.3 })); });
    const facts = [['الجهة الشريكة', s.pr ? s.pr.name : '—'], ['القطاع', pSector(p) || '—'], ['تصنيف المذكرة', p.classification || '—'], ['تصنيف الشراكة', (p.categories || []).join('، ') || '—'], ['مرحلة الشراكة', stageLabel(p.stage) || '—'], ['تفعيل الشراكة', p.activation || '—'], ['المسؤول من إدارة الشراكات', (p.owners || []).join('، ') || '—'], ['الإدارات المتقاطعة', (p.departments || []).join('، ') || '—']];
    const fw = 744, cw = (fw - 14) / 2, chh = (BH - 104 - 3 * 12) / 4, fy = BY + 104;
    facts.forEach(([l, v], k) => { const col = k % 2, row = Math.floor(k / 2), x = rx(MX + col * (cw + 14), cw), y = fy + row * (chh + 12); E.push(card(x, y, cw, chh, { r: 12 }), P.text(x + 18, y + 10, cw - 36, 20, l, { size: 13, color: RC.mut, lh: 1.3 }), P.text(x + 18, y + 32, cw - 36, chh - 40, v, { size: fitSize(v, cw - 36, chh - 40, 18, 11, 1.3), bold: true, color: RC.ink, lh: 1.3 })); });
    const lx = MX, lw = SW - 2 * MX - fw - 16;
    const th = s.hlv ? 196 : BH - 104;
    E.push(card(lx, fy, lw, th));
    E.push(P.text(lx + 20, fy + 14, lw - 40, 22, 'فترة الشراكة والحالة', { size: 14, color: RC.mut, lh: 1.3 }));
    E.push(...chipEl(lx + lw - 20, fy + 42, statusLabel(st), STC2(st)));
    E.push(P.text(lx + 20, fy + 44, lw - 200, 28, dl === null ? '' : dl >= 0 ? `متبقٍ ${dl} يومًا` : `انتهت منذ ${-dl} يومًا`, { size: 18, bold: true, align: 'left', lh: 1.3 }));
    if (tp !== null) { const bw = lw - 40; E.push(P.rect(lx + 20, fy + 92, bw, 14, '#E6EDEA', { r: 7 }), P.rect(lx + 20 + bw * (1 - tp), fy + 92, Math.max(10, bw * tp), 14, STC2(st), { r: 7 })); }
    E.push(P.text(lx + 20 + (lw - 40) / 2, fy + 114, (lw - 40) / 2, 46, `البدء\n${p.startDate ? fmtDate(p.startDate) : '—'}`, { size: 13, color: RC.ink2, lh: 1.45, firstBold: true }), P.text(lx + 20, fy + 114, (lw - 40) / 2, 46, `الانتهاء\n${p.endDate ? fmtDate(p.endDate) : '—'}`, { size: 13, color: RC.ink2, lh: 1.45, align: 'left', firstBold: true }));
    if (al && !s.hlv) E.push(P.rect(lx + 20, fy + 168, lw - 40, 70, al.tone === 'urgent' ? RC.clayBg : al.tone === 'soon' ? RC.goldBg : RC.page, { r: 10 }), P.text(lx + 34, fy + 176, lw - 68, 56, al.title, { size: fitSize(al.title, lw - 68, 56, 15, 11, 1.4), bold: true, color: al.tone === 'urgent' ? '#A2442C' : al.tone === 'soon' ? '#8A5E10' : RC.ink2, lh: 1.4, valign: 'middle' }));
    if (!s.hlv && tp !== null) E.push(P.text(lx + 20, fy + 252, lw - 40, 110, `انقضى ${Math.round(tp * 100)}% من مدة الشراكة.${p.updatedAt ? `\nآخر تحديث للسجل: ${fmtDate(p.updatedAt)}` : ''}`, { size: 14, color: RC.mut, lh: 1.6 }));
    if (s.hlv) { const hy = fy + th + 14, hh = BH - 104 - th - 14; E.push(P.rect(lx, hy, lw, hh, RC.pri, { r: 14 }), P.text(lx + 22, hy + 12, lw - 44, 66, s.hlv, { key: s.pid + '.hlv', size: fitSize(s.hlv, lw - 44, 66, 46, 22, 1.2), bold: true, color: RC.white, lh: 1.2, valign: 'middle' }), P.text(lx + 22, hy + 80, lw - 44, hh - 92, s.hll || 'أبرز نتيجة', { key: s.pid + '.hll', size: 15, color: '#C9DDD6', lh: 1.4 })); }
    return frame(E, s, 'نظرة عامة على الشراكة', i, total);
  }
  if (s.t === 'partner') {
    const pr = s.pr, pw = 440, xr = rx(MX, pw), lw = SW - 2 * MX - pw - 18;
    E.push(P.rect(xr, BY, pw, BH, RC.pri, { r: 18 }), P.circ(xr + 18, BY + BH - 188, 170, RC.coverAcc, { alpha: 78 }), P.circ(xr + 24, BY + 24, 96, '#FFFFFF', { alpha: 92 }));
    if (pr.logoFileId) E.push(P.circ(xr + pw - 30 - 84, BY + 28, 84, '#FFFFFF'), P.img(xr + pw - 30 - 72, BY + 40, 60, 60, pr.logoFileId, { fit: 'contain' }));
    else E.push(P.circ(xr + pw - 30 - 84, BY + 28, 84, '#FFFFFF'), P.text(xr + pw - 30 - 84, BY + 28, 84, 84, pr.name.replace(/^(ال)/, '').charAt(0), { size: 36, bold: true, color: RC.pri, align: 'center', valign: 'middle', lh: 1 }));
    E.push(P.head(xr + 30, BY + 128, pw - 60, 96, pr.name, { size: fitSize(pr.name, pw - 60, 96, 32, 18, 1.25), color: '#FFFFFF', lh: 1.25 }));
    E.push(P.rect(xr + pw - 30 - 150, BY + 232, 150, 32, '#FFFFFF', { r: 16, alpha: 82 }), P.text(xr + pw - 30 - 150, BY + 232, 150, 32, pr.sector || 'قطاع غير محدد', { size: 14, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', lh: 1 }));
    [[s.others.length, 'شراكة مع المؤسسة'], [s.props.length, 'مقترح مرتبط']].forEach(([n, l], k) => { const w = (pw - 60 - 16) / 2, x = xr + pw - 30 - w - k * (w + 16); E.push(P.rect(x, BY + 300, w, 150, '#FFFFFF', { r: 14, alpha: 88 }), P.text(x + 18, BY + 316, w - 36, 70, String(n), { size: 56, bold: true, color: '#FFFFFF', lh: 1.15 }), P.text(x + 18, BY + 400, w - 36, 36, l, { size: 15, color: '#FFFFFF', lh: 1.3 })); });
    const info = [['users', 'الأسماء البديلة', (pr.aliases || []).join('، ') || 'لا توجد'], ['link', 'الموقع الإلكتروني', pr.website || 'غير مسجل'], ['msg', 'ملاحظات عن الجهة', pr.notes || 'لا توجد']];
    const iw = (lw - 2 * 16) / 3;
    info.forEach(([ic, l, v], k) => { const x = rx(MX + pw + 18 + k * (iw + 16), iw); E.push(card(x, BY, iw, 176), ...tile(x + iw - 20 - 52, BY + 20, 52, ic, k), P.text(x + 20, BY + 84, iw - 40, 22, l, { size: 13, color: RC.mut, lh: 1.3 }), P.text(x + 20, BY + 108, iw - 40, 56, v, { size: fitSize(v, iw - 40, 56, 17, 11, 1.35), bold: true, color: RC.ink, lh: 1.35, ltr: k === 1 && !!pr.website })); });
    const ty = BY + 196, th = BH - 196;
    E.push(card(MX, ty, lw, th), P.text(MX + 22, ty + 16, lw - 44, 28, 'الشراكات مع الجهة على خط زمني', { size: 17, bold: true, color: RC.priT, lh: 1.3 }));
    const os = s.others.filter((o) => o.startDate && o.endDate).slice(0, 4);
    if (os.length) {
      const t0 = Math.min(...os.map((o) => +parseDate(o.startDate))), t1 = Math.max(...os.map((o) => +parseDate(o.endDate)), +today());
      const ax = MX + 22, aw = lw - 44 - 150, X = (t) => ax + aw - (t - t0) / Math.max(1, t1 - t0) * aw;
      const y0 = new Date(t0).getFullYear(), y1 = new Date(t1).getFullYear();
      for (let y = y0; y <= y1 + 1; y++) { const t = +new Date(y, 0, 1); if (t < t0 || t > t1) continue; E.push(P.rect(X(t), ty + 54, 1, th - 70, RC.line), P.text(X(t) - 30, ty + 52, 60, 18, String(y), { size: 11, color: RC.faint, align: 'center', lh: 1.2 })); }
      const tx = X(+today()); E.push(P.rect(tx - 1, ty + 54, 2, th - 70, RC.gold));
      os.forEach((o, k) => { const y = ty + 80 + k * 46, st = pStatus(o), xs = X(+parseDate(o.startDate)), xe = X(+parseDate(o.endDate)); E.push(P.text(MX + lw - 22 - 140, y, 140, 30, o.code || '', { size: 13, bold: true, color: o.id === s.pid ? RC.priT : RC.ink, valign: 'middle', lh: 1.2, ltr: true }), P.rect(Math.min(xs, xe), y + 7, Math.max(10, Math.abs(xs - xe)), 16, STC2(st), { r: 8 })); });
    } else E.push(P.text(MX + 22, ty + 60, lw - 44, 24, 'لا توجد تواريخ مسجلة للشراكات.', { size: 14, color: RC.faint }));
    return frame(E, s, 'الجهة الشريكة', i, total);
  }
  if (s.t === 'cards') {
    const n = s.items.length, cols = n <= 3 ? 1 : 2, gap = 16;
    const cw = (SW - 2 * MX - (cols - 1) * gap) / cols, ch = (BH - 2 * gap) / 3;
    s.items.forEach((it, k) => {
      const col = k % cols, row = Math.floor(k / cols), x = rx(MX + col * (cw + gap), cw), y = BY + row * (ch + gap);
      E.push(card(x, y, cw, ch));
      E.push(P.text(x + 14, y + ch - 70, 120, 64, String(it.k + 1).padStart(2, '0'), { size: 58, bold: true, color: RC.line, align: 'left', lh: 1, font: RC.hfont }));
      E.push(...tile(x + cw - 20 - 58, y + 20, 58, ICONSET[it.k % ICONSET.length], it.k));
      const tw = cw - 58 - 20 - 18 - 24 - (cols === 1 ? 90 : 60);
      E.push(P.text(x + 24 + (cols === 1 ? 90 : 60), y + 18, tw, ch - 36, it.s, { key: `${s.key}.${it.k}`, size: fitSize(it.s, tw, ch - 36, 19, 11, 1.5), color: RC.ink2, lh: 1.5, firstBold: true }));
    });
    return frame(E, s, s.title, i, total);
  }
  if (s.t === 'cols') {
    const nC = s.cols.length, gap = 16, cw = (SW - 2 * MX - (nC - 1) * gap) / nC;
    s.cols.forEach((c, k) => {
      const x = rx(MX + k * (cw + gap), cw);
      const tint = c.c === RC.gold ? RC.goldBg : c.c === RC.clay ? RC.clayBg : RC.mintBg;
      E.push(card(x, BY, cw, BH), P.rect(x, BY, cw, 58, c.c, { r: 14 }), P.rect(x, BY + 40, cw, 18, c.c));
      E.push(P.text(x + 60, BY, cw - 80, 58, c.h, { size: fitSize(c.h, cw - 80, 30, 17, 12, 1.3), bold: true, color: RC.white, valign: 'middle', lh: 1.3 }));
      E.push(P.circ(x + 16, BY + 12, 34, '#FFFFFF', { alpha: 78 }), P.text(x + 16, BY + 12, 34, 34, String(c.n), { size: 15, bold: true, color: RC.white, align: 'center', valign: 'middle', lh: 1 }));
      const ih = (BH - 58 - 20) / 5;
      if (!c.items.length) E.push(P.text(x + 20, BY + 76, cw - 40, 30, 'لا يوجد.', { size: 15, color: RC.faint, lh: 1.4 }));
      c.items.forEach((it, j) => { const y = BY + 68 + j * ih; E.push(...badge(x + cw - 18 - 28, y + 6, 28, it.k + 1, tint, c.c)); const tw = cw - 28 - 18 - 12 - 18; E.push(P.text(x + 18, y + 4, tw, ih - 10, it.s, { key: `${c.key}.${it.k}`, size: fitSize(it.s, tw, ih - 10, 16, 10, 1.45), color: RC.ink2, lh: 1.45, firstBold: true })); if (j < c.items.length - 1) E.push(P.rect(x + 18, y + ih - 3, cw - 36, 1, RC.line)); });
    });
    return frame(E, s, s.title, i, total);
  }
  if (s.t === 'team') {
    const p = s.p, gap = 16, cw = (SW - 2 * MX - 2 * gap) / 3;
    const panel = (k, h, c) => { const x = rx(MX + k * (cw + gap), cw); E.push(card(x, BY, cw, BH), P.text(x + 22, BY + 18, cw - 44, 28, h, { size: 18, bold: true, color: c, lh: 1.3 })); return x; };
    let x = panel(0, 'المسؤول من إدارة الشراكات', RC.pri);
    (p.owners || []).slice(0, 4).forEach((o, k) => { const y = BY + 64 + k * 64; E.push(P.circ(x + cw - 22 - 48, y, 48, RC.mintBg), P.text(x + cw - 22 - 48, y, 48, 48, initials(o), { size: 16, bold: true, color: RC.priT, align: 'center', valign: 'middle', lh: 1 }), P.text(x + 22, y, cw - 44 - 60, 48, o, { size: 17, bold: true, valign: 'middle', lh: 1.3 })); });
    if (!(p.owners || []).length) E.push(P.text(x + 22, BY + 64, cw - 44, 26, 'غير محدد', { size: 15, color: RC.faint }));
    [['تفعيل الشراكة', p.activation || '—'], ['مرحلة الشراكة', stageLabel(p.stage) || '—'], ['الظهور في الواجهة', p.public ? 'منشورة' : 'غير منشورة']].forEach(([l, v], k) => { const y = BY + 330 + k * 48; E.push(P.text(x + 22, y, cw - 44, 20, l, { size: 12, color: RC.mut, lh: 1.3 }), P.text(x + 22, y + 20, cw - 44, 24, v, { size: 15, bold: true, lh: 1.3 })); });
    x = panel(1, 'الإدارات المتقاطعة', RC.gold);
    (p.departments || []).slice(0, 7).forEach((d, k) => { const y = BY + 62 + k * 54; E.push(P.rect(x + 22, y, cw - 44, 44, RC.goldBg, { r: 22 }), P.text(x + 40, y, cw - 80, 44, d, { size: fitSize(d, cw - 80, 22, 15, 11, 1.2), bold: true, color: '#7A5715', valign: 'middle', lh: 1.2 })); });
    if (!(p.departments || []).length) E.push(P.text(x + 22, BY + 64, cw - 44, 26, 'لا يوجد', { size: 15, color: RC.faint }));
    x = panel(2, 'ضابط الاتصال لدى الجهة', RC.petrol2);
    const ok = can('view.contacts');
    [['الاسم', ok ? p.contactName : null], ['البريد الإلكتروني', ok ? p.contactEmail : null], ['رقم الجوال', ok ? p.contactPhone : null]].forEach(([l, v], k) => { const y = BY + 66 + k * 84; E.push(P.rect(x + 22, y, cw - 44, 72, RC.page, { r: 12 }), P.text(x + 38, y + 8, cw - 76, 20, l, { size: 12, color: RC.mut, lh: 1.3 }), P.text(x + 38, y + 30, cw - 76, 32, ok ? (v || 'غير مسجل') : 'غير متاح لهذا الدور', { size: fitSize(v || '', cw - 76, 32, 17, 11, 1.3), bold: true, color: v ? RC.ink : RC.faint, lh: 1.3, ltr: !!v && k > 0 })); });
    return frame(E, s, 'الفريق والإدارات والتواصل', i, total);
  }
  if (s.t === 'activity') {
    const gap = 16, rw = 640, lw = SW - 2 * MX - rw - gap;
    E.push(card(rx(MX, rw), BY, rw, BH), P.text(rx(MX, rw) + 22, BY + 18, rw - 44, 28, 'الإنجازات وقصص النجاح', { size: 18, bold: true, color: RC.priT, lh: 1.3 }));
    if (!s.stories.length) E.push(P.text(rx(MX, rw) + 22, BY + 66, rw - 44, 26, 'لا توجد إنجازات مرتبطة.', { size: 15, color: RC.faint }));
    s.stories.forEach((a, k) => { const x = rx(MX, rw) + 18, y = BY + 62 + k * 136, w = rw - 36; E.push(P.rect(x, y, w, 124, RC.page, { r: 12 })); if (a.metricValue) E.push(P.text(x + w - 170, y + 14, 150, 48, a.metricValue, { size: fitSize(a.metricValue, 150, 48, 30, 16, 1.2), bold: true, color: RC.gold, lh: 1.2 }), P.text(x + w - 170, y + 62, 150, 44, a.metricLabel || '', { size: 12, color: RC.mut, lh: 1.3 })); const tw = w - (a.metricValue ? 190 : 32); E.push(P.text(x + 16, y + 12, tw, 28, a.title, { size: fitSize(a.title, tw, 28, 17, 12, 1.3), bold: true, lh: 1.3 }), P.text(x + 16, y + 42, tw, 56, a.summary || '', { size: fitSize(a.summary || '', tw, 56, 13, 10, 1.45), color: RC.ink2, lh: 1.45 }), P.text(x + 16, y + 98, tw, 20, fmtDate(a.date), { size: 12, color: RC.mut, lh: 1.3 })); });
    E.push(card(MX, BY, lw, BH), P.text(MX + 22, BY + 18, lw - 44, 28, 'آخر المستجدات', { size: 18, bold: true, color: RC.priT, lh: 1.3 }));
    if (!s.news.length) E.push(P.text(MX + 22, BY + 66, lw - 44, 26, 'لا توجد مستجدات مرتبطة.', { size: 15, color: RC.faint }));
    s.news.forEach((n, k) => { const y = BY + 62 + k * 68; E.push(P.rect(MX + lw - 18 - 100, y, 100, 52, RC.mintBg, { r: 10 }), P.text(MX + lw - 18 - 100, y, 100, 52, fmtDate(n.date, 'short'), { size: 13, bold: true, color: RC.priT, align: 'center', valign: 'middle', lh: 1.2 }), P.text(MX + 18, y, lw - 36 - 112, 52, n.title, { size: fitSize(n.title, lw - 36 - 112, 52, 15, 11, 1.4), bold: true, valign: 'middle', lh: 1.4 })); });
    return frame(E, s, 'الإنجازات والمستجدات المرتبطة', i, total);
  }
  if (s.t === 'history') {
    const p = s.p, gap = 16, rw = 720, lw = SW - 2 * MX - rw - gap, x = rx(MX, rw);
    E.push(card(x, BY, rw, BH), P.text(x + 22, BY + 18, rw - 44, 28, 'المحطات الزمنية للشراكة', { size: 18, bold: true, color: RC.priT, lh: 1.3 }));
    const t0 = today(), A = D.settings.alertDays || 30;
    const ms = [['إنشاء السجل', p.createdAt ? parseDate(isoDate(new Date(p.createdAt))) : null], ['بدء الشراكة', parseDate(p.startDate)], [`تنبيه قبل الانتهاء بـ ${A} يومًا`, p.endDate ? addDays(parseDate(p.endDate), -A) : null], ['انتهاء الشراكة', parseDate(p.endDate)]].filter((m) => m[1]);
    const mw = rw - 44;
    E.push(P.rect(x + 22, BY + 86, mw, 4, '#E6EDEA', { r: 2 }));
    ms.forEach(([l, d], k) => { const cx = x + 22 + mw - (ms.length === 1 ? mw / 2 : k * mw / (ms.length - 1)); const done = d <= t0; const first = k === 0, last = k === ms.length - 1 && ms.length > 1; const tx = first ? cx - 150 : last ? cx - 10 : cx - 80, al = first ? 'right' : last ? 'left' : 'center'; E.push(P.circ(cx - 9, BY + 79, 18, done ? RC.petrol2 : '#FFFFFF', { line: RC.petrol2 }), P.text(tx, BY + 104, 160, 22, l, { size: 13, bold: true, align: al, lh: 1.3 }), P.text(tx, BY + 126, 160, 20, fmtDate(isoDate(d)), { size: 12, color: done ? RC.petrol2 : RC.mut, align: al, lh: 1.3 })); });
    E.push(P.text(x + 22, BY + 172, rw - 44, 26, 'آخر التحديثات على السجل', { size: 16, bold: true, color: RC.priT, lh: 1.3 }));
    if (!s.log.length) E.push(P.text(x + 22, BY + 206, rw - 44, 24, 'لم تُسجَّل تعديلات على هذه الشراكة منذ إدخالها.', { size: 14, color: RC.faint, lh: 1.4 }));
    s.log.slice(0, 4).forEach((e, k) => { const y = BY + 206 + k * 64; E.push(P.rect(x + 22, y, rw - 44, 56, RC.page, { r: 10 }), P.text(x + rw - 22 - 16 - 180, y + 6, 180, 20, fmtDT(e.at), { size: 12, color: RC.mut, lh: 1.3 }), P.text(x + 38, y + 6, rw - 76 - 196, 22, `${(typeof AUDIT_LABELS !== 'undefined' && AUDIT_LABELS[e.action]) || e.action} — ${e.user || ''}`, { size: 14, bold: true, lh: 1.3 }), P.text(x + 38, y + 30, rw - 76, 22, String(e.details || e.label || '').slice(0, 120), { size: 12, color: RC.ink2, lh: 1.3 })); });
    E.push(card(MX, BY, lw, BH), P.text(MX + 22, BY + 18, lw - 44, 28, 'معلومات السجل والمصدر', { size: 18, bold: true, color: RC.priT, lh: 1.3 }));
    const info = [['تاريخ إنشاء السجل', p.createdAt ? fmtDate(p.createdAt) : '—'], ['آخر تحديث', p.updatedAt ? fmtDT(p.updatedAt) : '—'], ['المصدر', s.prop ? `مقترح ${s.prop.ref} من ${s.prop.department}` : p.demo ? 'بيانات تجريبية' : 'ملف حصر الشراكات / إدخال مباشر'], s.prop ? ['مقدّم المقترح', `${s.prop.requesterName || '—'}${s.prop.submittedAt ? ' — ' + fmtDate(s.prop.submittedAt) : ''}`] : ['قيم تحتاج تأكيدًا من ملف الحصر', pendingImportNotes(p).length ? `${pendingImportNotes(p).length} قيمة` : 'لا توجد']];
    info.forEach(([l, v], k) => { const y = BY + 64 + k * 96; E.push(P.rect(MX + 18, y, lw - 36, 84, RC.page, { r: 12 }), P.text(MX + 34, y + 10, lw - 68, 20, l, { size: 12, color: RC.mut, lh: 1.3 }), P.text(MX + 34, y + 34, lw - 68, 42, v, { size: fitSize(v, lw - 68, 42, 16, 11, 1.3), bold: true, lh: 1.3 })); });
    return frame(E, s, 'سجل التحديثات ومصدر الشراكة', i, total);
  }
  if (s.t === 'files') {
    const gap = 16, cw = (SW - 2 * MX - gap) / 2, ch = (BH - gap) / 2;
    s.cats.forEach(([cat, list], k) => {
      const col = k % 2, row = Math.floor(k / 2), x = rx(MX + col * (cw + gap), cw), y = BY + row * (ch + gap);
      E.push(card(x, y, cw, ch), P.text(x + 72, y + 16, cw - 94, 28, cat, { size: 18, bold: true, color: RC.priT, lh: 1.3 }), ...badge(x + 22, y + 12, 38, list.length, RC.goldBg, '#7A5715'));
      list.slice(0, 4).forEach((a, j) => { const yy = y + 58 + j * 40; E.push(P.rect(x + 22, yy, cw - 44, 34, RC.page, { r: 8 }), P.text(x + 170, yy, cw - 206, 34, a.name, { size: fitSize(a.name, cw - 206, 18, 14, 10, 1.2), bold: true, valign: 'middle', lh: 1.2 }), P.text(x + 34, yy, 128, 34, `${fmtDate(a.addedAt || a.at, 'short')} · ${fmtSize(a.size || 0)}`, { size: 11, color: RC.mut, align: 'left', valign: 'middle', lh: 1.2 })); });
      if (list.length > 4) E.push(P.text(x + 22, y + ch - 28, cw - 44, 20, `و${list.length - 4} ملفات أخرى`, { size: 12, color: RC.mut, lh: 1.3 }));
    });
    return frame(E, s, s.title, i, total);
  }
  if (s.t === 'photos') {
    const n = s.photos.length, cols = n === 1 ? 1 : 2, rows = n > 2 ? 2 : 1, gap = 16;
    const cw = (SW - 2 * MX - (cols - 1) * gap) / cols, ch = (BH - (rows - 1) * gap) / rows;
    s.photos.forEach((ph, k) => { const col = k % cols, row = Math.floor(k / cols), x = rx(MX + col * (cw + gap), cw), y = BY + row * (ch + gap); E.push(P.img(x, y, cw, ch, ph.fileId, { r: 12 }), P.rect(x, y + ch - 46, cw, 46, '#000000', { alpha: 45 }), P.text(x + 16, y + ch - 46, cw - 32, 46, ph.name || '', { size: 14, color: RC.white, valign: 'middle', lh: 1.2 })); });
    return frame(E, s, s.title, i, total);
  }
  return E;
}

/* — العرض HTML للمواصفة — */
const hexA = (hex, alpha) => { if (!alpha) return hex; const h = hex.replace('#', ''); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return `rgba(${r},${g},${b},${(1 - alpha / 100).toFixed(2)})`; };
function specHTML(slide) {
  return `<div class="rs2" data-st="${slide.t}" data-theme="${slide.theme || ''}" style="background:${slide.bg || '#fff'}">${slide.els.map((e) => {
    const box = `left:${e.x.toFixed(1)}px;top:${e.y.toFixed(1)}px;width:${e.w.toFixed(1)}px;height:${Math.max(e.h, 0).toFixed(1)}px;`;
    if (e.k === 'rect') return e.fill ? `<div class="rs2-r" style="${box}background:${hexA(e.fill, e.alpha)};${e.r ? `border-radius:${e.r}px;` : ''}${e.line ? `box-shadow:inset 0 0 0 1px ${e.line};` : ''}"></div>` : '';
    if (e.k === 'svg') return `<img class="rs2-i" style="${box}object-fit:cover" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(e.svg)}" alt="">`;
    if (e.k === 'icon') return `<svg class="rs2-ic" style="${box}stroke:${e.color}" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[e.name] || ''}</svg>`;
    if (e.k === 'circ') return `<div class="rs2-r" style="${box}border-radius:50%;background:${hexA(e.fill, e.alpha)};${e.line ? `box-shadow:inset 0 0 0 2.5px ${e.line};` : ''}"></div>`;
    if (e.k === 'img') { const pre = /^(lib|asset):/.test(e.src) ? FileCache_src(e.src) : ''; return `<img class="rs2-i" style="${box}object-fit:${e.fit};object-position:${e.pos === 'right' ? 'right center' : '50% 38%'};${e.round ? 'border-radius:50%;' : e.r ? `border-radius:${e.r}px;` : ''}" ${pre ? `src="${pre}"` : `data-file="${esc(e.src)}"`} alt="">`; }
    if (e.k === 'text') {
      const lines = e.text.split('\n');
      const inner = lines.map((l, k) => `<span class="${e.firstBold && k === 0 && lines.length > 1 ? 'fb' : ''}">${esc(l)}</span>`).join('<br>');
      return `<div class="rs2-t${e.key ? ' ed' : ''}" style="${box}font-family:'Expo Arabic','${e.font || RC.font}','IBM Plex Sans Arabic',Tahoma,sans-serif;font-size:${e.size}px;line-height:${e.lh};color:${e.color};font-weight:${e.bold ? 700 : 400};text-align:${e.align};justify-content:${e.valign === 'middle' ? 'center' : 'flex-start'};${e.ltr ? 'direction:ltr;' : ''}"${e.key ? ` contenteditable="true" spellcheck="false" data-ek="${esc(e.key)}" data-base="${esc(e.text)}"` : ''}><div class="rs2-tx">${inner}</div></div>`;
    }
    return '';
  }).join('')}</div>`;
}
function FileCache_src(id) { if (id.startsWith('lib:')) return (IMG_LIB[id.slice(4)] || {}).src || ''; if (id.startsWith('asset:')) return (ASSET_IMG[id.slice(6)] || {}).src || ''; return ''; }

/* — الصفحة — */
/* — قوالب القصة الجاهزة — */
const RPT_PRESETS = [
  { k: 'story', t: 'قصة أثر', d: 'تسويقية: صور، واقتباس الهدف، والرقم البطل، والأثر', ic: 'star', secs: ['cover', 'pcover', 'story', 'hero', 'impact', 'activity', 'photos', 'end'] },
  { k: 'brief', t: 'إحاطة تنفيذية', d: 'للقيادة: لمحة المحفظة وملخص كل شراكة', ic: 'chart', secs: ['cover', 'toc', 'portfolio', 'summary', 'exec', 'end'] },
  { k: 'card', t: 'بطاقة تعريفية', d: 'لشريك أو زائر: غلاف وقصة ونظرة عامة', ic: 'award', secs: ['pcover', 'story', 'hero', 'overview', 'partner', 'end'] },
  { k: 'full', t: 'الملف الكامل', d: 'كل المكونات المتاحة لكل شراكة', ic: 'layers', secs: null },
];
const RPT_QUICK = [
  ['active', 'السارية', (p) => ['active', 'soon'].includes(pStatus(p))],
  ['strategic', 'الاستراتيجية', (p) => (p.ptype || '').includes('استراتيجي')],
  ['soon', 'تنتهي قريبًا', (p) => pStatus(p) === 'soon'],
  ['all', 'كل الشراكات', () => true],
];
function rptPresetOn(pr) { const want = pr.secs || RPT_SECTIONS.map((s) => s.k); return want.length === RPT.sections.length && want.every((k) => RPT.sections.includes(k)); }
function renderReports(el, r) {
  if (!can('view.reports')) { el.innerHTML = noAccessHTML(); return; }
  const q = r.query || {};
  if (q.ids) RPT.ids = q.ids.split('|');
  RPT.ids = RPT.ids.filter((id) => D.partnerships.some((p) => p.id === id));
  const fq = {}; ['status', 'category', 'sector', 'classification', 'department', 'owner', 'activation', 'year'].forEach((k) => { if (q[k]) fq[k] = q[k].split('|'); });
  if (Object.keys(fq).length) RPT.f = fq;
  const base = () => visiblePartnerships({ includeDrafts: can('view.drafts') });
  if (q.all) RPT.ids = applyFilters(base(), RPT.f).map((p) => p.id);
  el.innerHTML = `<section class="rx-hero">
      <div class="rx-hero-t"><span class="rx-eye"><i></i>التقارير</span><h1>استوديو القصة</h1>
        <p>حوّل بيانات الشراكات إلى عرض يُقنع ويُلهم: اختر القصة، وحدد الشراكات، وعدّل أي نص مباشرة على الشريحة، ثم اعرضه بملء الشاشة أو نزّله PowerPoint وPDF. الأرقام تُقرأ من السجلات لحظة العرض.</p></div>
      <div class="rx-fan" aria-hidden="true"><span class="f1"><b></b><i></i><i></i><i></i></span><span class="f2"><b></b><em></em><i></i><i></i></span><span class="f3"><strong>”</strong><i></i><i></i><i></i></span></div>
    </section>
    <a class="mk-entry" href="#/reports/marketing"><span class="mk-entry-art" aria-hidden="true">${MK_RINGS}<b>${nf(liveCounts().partners)}</b></span><span class="mk-entry-b"><em>جديد</em><b>التقرير التسويقي</b><small>لكل الشراكات أو لشراكة واحدة: الأعمال والإنجازات والأثر في شرائح تُبنى من البيانات — للعملاء والقيادات</small></span><span class="btn gold">${icon('play')} افتح التقرير</span></a>
    <section class="rx-pick">
      <div class="rx-step"><span>1</span><div><b>اختر القصة</b><small>قالب جاهز يحدد مكونات التقرير، ويمكنك تعديلها بعد ذلك</small></div></div>
      <div class="rx-presets" id="rxPresets"></div>
      <div class="rx-step"><span>2</span><div><b>حدد الشراكات</b><small>اختيار سريع، أو من القائمة الكاملة في اللوحة الجانبية</small></div></div>
      <div class="rx-quick" id="rxQuick"></div>
    </section>
    <div class="rp">
      <aside class="rp-side" data-tour="reports-panel">
        <section class="rp-box"><header><b>1. الشراكات</b><span id="rpCount"></span></header>
          <div class="rp-dd" id="rpPD"><button class="rp-ddb" type="button" data-rpd>${icon('layers')}<span id="rpPDl"></span>${icon('chevD')}</button>
            <div class="rp-ddm rp-pdm" id="rpPDm">
              <div class="searchbox">${icon('search')}<input id="rpQ" type="search" placeholder="بحث باسم الجهة أو الرمز…" value="${esc(RPT.q || '')}"></div>
              <div class="rp-ddh"><label class="rp-all"><input type="checkbox" data-rall><span id="rpAllL">تحديد الكل</span></label><button class="linkbtn" data-rnone type="button">إلغاء التحديد</button></div>
              <div class="rp-list" id="rpList"></div></div></div>
          <div class="rp-chips" id="rpChips"></div>
          <details class="rp-fx" ${Object.values(RPT.f || {}).some((v) => v && v.length) ? 'open' : ''}><summary>${icon('filter')} تصفية القائمة (الحالة، التصنيف، القطاع…)</summary><div class="fbar rp-f" id="rpF"></div></details></section>
        <section class="rp-box"><header><b>2. مكونات التقرير</b></header>
          <div class="rp-dd" id="rpDD"><button class="rp-ddb" type="button" data-rdd>${icon('list')}<span id="rpDDl"></span>${icon('chevD')}</button><div class="rp-ddm" id="rpDDm"></div></div>
          <p class="hint">أزل أي مكوّن وسيختفي من المعاينة فورًا. المكوّن الذي لا تتوفر له بيانات في شراكة ما لا يُنشئ شريحة فارغة.</p>
          <label class="rp-theme"><span>ثيم التقرير</span><select class="in" id="rpTheme"><option value="auto">حسب اتجاه التصميم (${esc(DESIGNS[design()].name)})</option>${Object.entries(RTHEMES).map(([k, t]) => `<option value="${k}">${esc(t.name)}</option>`).join('')}</select></label></section>
        <section class="rp-box"><header><b>3. التنزيل</b></header>
          <button class="btn gold rp-show" data-rshow type="button">${icon('expand')} عرض التقرير بملء الشاشة</button>
          <div class="rp-exp"><button class="btn primary" data-rpptx type="button">${icon('download')} PowerPoint</button><button class="btn" data-rpdf type="button">${icon('print')} PDF</button></div>
          <button class="linkbtn" data-rreset type="button">${icon('history')} استعادة النصوص الأصلية</button>
          <p class="hint">تعديلاتك على نصوص المعاينة تظهر في الملف المنزّل ولا تغيّر سجلات الشراكات. إذا عُدّلت الشراكة لاحقًا يحل نصها الجديد محل تعديلك على ذلك النص.</p></section>
      </aside>
      <main class="rp-main"><div class="rp-bar" id="rpBar"></div><div class="rp-slides" id="rpSlides" data-tour="reports-preview"></div>
        <div class="rx-dock" id="rxDock"></div></main>
    </div>`;
  new FilterBar($('#rpF', el), { dims: ['status', 'category', 'sector', 'classification', 'department', 'owner', 'year'], getList: base, state: RPT.f, onChange: () => drawList() });
  const filteredList = () => applyFilters(base(), RPT.f).filter((p) => matchQ(searchText(p), RPT.q || '')).sort((a, b) => partnerName(a).localeCompare(partnerName(b), 'ar'));
  const drawList = () => {
    const L_ = filteredList();
    $('#rpList', el).innerHTML = L_.length ? L_.map((p) => `<label class="rp-it ${RPT.ids.includes(p.id) ? 'on' : ''}"><input type="checkbox" data-rid="${p.id}" ${RPT.ids.includes(p.id) ? 'checked' : ''}><span class="grow"><b>${esc(partnerName(p))} ${demoTag(p)}</b><small><span class="mono">${esc(p.code || '')}</span> · ${esc(statusLabel(pStatus(p)))}</small></span><span class="rp-dot" style="background:${ST_VAR(pStatus(p))}"></span></label>`).join('') : '<div class="empty-chart">لا توجد شراكات ضمن الفلاتر.</div>';
    const allOn = L_.length && L_.every((p) => RPT.ids.includes(p.id)), someOn = L_.some((p) => RPT.ids.includes(p.id));
    const cb = $('[data-rall]', el); cb.checked = !!allOn; cb.indeterminate = !allOn && someOn;
    $('#rpAllL', el).textContent = `تحديد الكل (${L_.length})`;
    $('#rpCount', el).textContent = `محدد ${RPT.ids.length} من ${base().length}`;
    $('#rpPDl', el).textContent = RPT.ids.length ? (RPT.ids.length === 1 ? partnerName(D.partnerships.find((p) => p.id === RPT.ids[0])) : `${RPT.ids.length} شراكات محددة`) : 'اختر الشراكات…';
    $('#rpChips', el).innerHTML = RPT.ids.slice(0, 12).map((id) => { const p = D.partnerships.find((x) => x.id === id); return p ? `<span class="rp-chip">${esc(partnerName(p))}<button type="button" data-rx="${id}" title="إزالة" aria-label="إزالة">${icon('x')}</button></span>` : ''; }).join('') + (RPT.ids.length > 12 ? `<span class="rp-chip more">+${RPT.ids.length - 12}</span>` : '');
  };
  const drawDD = () => {
    const avail = RPT_SECTIONS.filter((s) => !s.internal || can('view.internal'));
    $('#rpDDl', el).textContent = `${avail.filter((s) => RPT.sections.includes(s.k)).length} من ${avail.length} مكونات`;
    $('#rpDDm', el).innerHTML = `<div class="rp-ddh"><button class="linkbtn" data-rsall type="button">تحديد الكل</button><button class="linkbtn" data-rsnone type="button">إلغاء الكل</button></div>` + ['التقرير', 'الشراكة'].map((g) => `<div class="rp-ddg">${g === 'التقرير' ? 'على مستوى التقرير' : 'لكل شراكة'}</div>${avail.filter((s) => s.g === g).map((s) => `<label class="rp-ddo"><input type="checkbox" data-rsec="${s.k}" ${RPT.sections.includes(s.k) ? 'checked' : ''}><span>${esc(s.l)}</span></label>`).join('')}`).join('');
  };
  const drawPicks = () => {
    $('#rxPresets', el).innerHTML = RPT_PRESETS.map((pr) => { const n = (pr.secs || RPT_SECTIONS.map((s) => s.k)).length; return `<button type="button" class="rx-pre ${rptPresetOn(pr) ? 'on' : ''}" data-rpreset="${pr.k}"><span class="rx-pre-art a-${pr.k}" aria-hidden="true"><i></i><i></i><i></i></span><span class="rx-pre-b"><b>${icon(pr.ic)}${esc(pr.t)}</b><small>${esc(pr.d)}</small><em>${n} مكونات</em></span>${rptPresetOn(pr) ? `<span class="rx-on">${icon('check')}</span>` : ''}</button>`; }).join('');
    const all = base();
    $('#rxQuick', el).innerHTML = RPT_QUICK.map(([k, l, f]) => { const ids = all.filter(f).map((p) => p.id); const on = ids.length && ids.length === RPT.ids.length && ids.every((id) => RPT.ids.includes(id)); return `<button type="button" class="rx-q ${on ? 'on' : ''}" data-rquick="${k}" ${ids.length ? '' : 'disabled'}><b>${ids.length}</b><span>${esc(l)}</span></button>`; }).join('') + `<span class="rx-q-note">${RPT.ids.length ? `محدد الآن: <b>${RPT.ids.length}</b>` : 'لم تُحدَّد شراكات بعد'}</span>`;
  };
  const drawPreview = () => {
    drawPicks();
    const S = rptSlides();
    $('#rxDock', el).innerHTML = RPT.ids.length ? `<div class="rx-dock-in"><span class="rx-dock-n">${icon('layers')}<b>${S.length}</b> شريحة · ${plural(RPT.ids.length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')}</span><button type="button" class="btn gold" data-rshow>${icon('play')} عرض</button><button type="button" class="btn primary" data-rpptx2>${icon('download')} PowerPoint</button><button type="button" class="btn" data-rpdf>${icon('print')} PDF</button></div>` : '';
    $('#rpBar', el).innerHTML = RPT.ids.length ? `<div class="rp-bar-t"><span>${icon('layers')} ${plural(S.length, 'شريحة واحدة', 'شريحتان', 'شرائح', 'شريحة')} · ${plural(RPT.ids.length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')}</span><span class="rp-tip">${icon('edit')} اضغط على أي نص قابل للتعديل في المعاينة</span></div>
      <div class="rp-nav"><button type="button" class="rp-play" data-rshow>${icon('play')} عرض</button>${S.map((x, k) => `<button type="button" data-goto="${k}" class="${x.t === 'pcover' ? 'pc' : ''}"><b>${k + 1}</b>${esc(x.nav)}</button>`).join('')}</div>` : '';
    $('#rpSlides', el).innerHTML = RPT.ids.length ? S.map((s, i) => `<div class="rs-frame" data-si="${i}">${specHTML(s)}</div>`).join('') : `<div class="panel">${emptyHTML({ ic: 'file', title: 'اختر شراكة أو أكثر', text: 'حدد الشراكات من القائمة، أو استخدم الفلاتر ثم «تحديد المعروضة» لاختيار مجموعة كاملة (مثل الساري أو المنتهي).' })}</div>`;
    hydrateFiles($('#rpSlides', el));
    fitSlides();
    if (RPT_STALE) toast(`تحدّث ${plural(RPT_STALE, 'نص واحد', 'نصان', 'نصوص', 'نصًا')} في التقرير بعد تعديل بيانات الشراكة`);
  };
  const fitSlides = () => { $$('.rs-frame', el).forEach((f) => { const k = f.clientWidth / SW; f.style.setProperty('--k', k); f.style.height = `${SH * k}px`; }); };
  new ResizeObserver(() => fitSlides()).observe($('#rpSlides', el));
  drawList(); drawDD(); drawPreview();
  const th = $('#rpTheme', el); th.value = RPT.theme || 'auto'; th.onchange = () => { RPT.theme = th.value; drawPreview(); };
  $('#rpQ', el).oninput = debounce((e) => { RPT.q = e.target.value.trim(); drawList(); }, 150);
  el.addEventListener('change', (e) => {
    const c = e.target.closest('[data-rid]');
    if (c) { const id = c.dataset.rid; RPT.ids = c.checked ? [...new Set([...RPT.ids, id])] : RPT.ids.filter((x) => x !== id); drawList(); drawPreview(); return; }
    if (e.target.closest('[data-rall]')) { const L_ = filteredList().map((p) => p.id); RPT.ids = e.target.checked ? [...new Set([...RPT.ids, ...L_])] : RPT.ids.filter((x) => !L_.includes(x)); drawList(); drawPreview(); return; }
    const s = e.target.closest('[data-rsec]');
    if (s) { RPT.sections = s.checked ? [...new Set([...RPT.sections, s.dataset.rsec])] : RPT.sections.filter((x) => x !== s.dataset.rsec); drawDD(); drawPreview(); }
  });
  el.addEventListener('input', (e) => { const t = e.target.closest('[data-ek]'); if (t) RPT.ov[t.dataset.ek] = { v: t.innerText.replace(/\u00a0/g, ' ').replace(/\n{2,}/g, '\n').trim(), base: t.dataset.base }; });
  el.addEventListener('keydown', (e) => { const t = e.target.closest && e.target.closest('[data-ek]'); if (t && e.key === 'Enter' && /^(rep\.|.*\.(name|hlv|hll|tag|quote)$)/.test(t.dataset.ek)) e.preventDefault(); });
  el.addEventListener('click', async (e) => {
    const pre = e.target.closest('[data-rpreset]');
    if (pre) { const P_ = RPT_PRESETS.find((x) => x.k === pre.dataset.rpreset); RPT.sections = (P_.secs || RPT_SECTIONS.map((s) => s.k)).slice(); drawDD(); drawPreview(); toast(`قالب «${P_.t}»: ${RPT.sections.length} مكونات`); return; }
    const qk = e.target.closest('[data-rquick]');
    if (qk) { const f = RPT_QUICK.find((x) => x[0] === qk.dataset.rquick)[2]; RPT.ids = base().filter(f).map((p) => p.id); drawList(); drawPreview(); return; }
    if (e.target.closest('[data-rpptx2]')) { const b0 = $('[data-rpptx]', el); if (b0) b0.click(); return; }
    if (e.target.closest('[data-rdd]')) { $('#rpDD', el).classList.toggle('open'); return; }
    if (!e.target.closest('#rpDD')) $('#rpDD', el).classList.remove('open');
    if (e.target.closest('[data-rpd]')) { $('#rpPD', el).classList.toggle('open'); if ($('#rpPD', el).classList.contains('open')) setTimeout(() => $('#rpQ', el).focus(), 30); return; }
    if (!e.target.closest('#rpPD')) $('#rpPD', el).classList.remove('open');
    const rxb = e.target.closest('[data-rx]'); if (rxb) { RPT.ids = RPT.ids.filter((x) => x !== rxb.dataset.rx); drawList(); drawPreview(); return; }
    if (e.target.closest('[data-rshow]')) { if (!RPT.ids.length) return toast('اختر شراكة واحدة على الأقل.', 'err'); return openReportShow(0); }
    const nv = e.target.closest('[data-goto]'); if (nv) { const f = $(`.rs-frame[data-si="${nv.dataset.goto}"]`, el); f && window.scrollTo({ top: f.getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); return; }
    if (e.target.closest('[data-rnone]')) { RPT.ids = []; drawList(); drawPreview(); return; }
    if (e.target.closest('[data-rsall]')) { RPT.sections = RPT_SECTIONS.map((s) => s.k); drawDD(); drawPreview(); return; }
    if (e.target.closest('[data-rsnone]')) { RPT.sections = []; drawDD(); drawPreview(); return; }
    if (e.target.closest('[data-rreset]')) { if (!Object.keys(RPT.ov).length) return toast('لا توجد تعديلات على النصوص.'); RPT.ov = {}; drawPreview(); toast('استُعيدت النصوص الأصلية'); return; }
    if (e.target.closest('[data-rpdf]')) { if (!RPT.ids.length) return toast('اختر شراكة واحدة على الأقل.', 'err'); prepareReportPrint(); toast('اختر «حفظ بتنسيق PDF» في نافذة الطباعة'); window.print(); return; }
    if (e.target.closest('[data-rpptx]')) { if (!RPT.ids.length) return toast('اختر شراكة واحدة على الأقل.', 'err'); const b = e.target.closest('[data-rpptx]'); b.disabled = true; b.innerHTML = `${icon('download')} جارٍ الإعداد…`; try { await exportReportPptx(); } catch (err) { console.error(err); toast('تعذّر إنشاء ملف PowerPoint: ' + err.message, 'err'); } b.disabled = false; b.innerHTML = `${icon('download')} PowerPoint`; }
  });
}
const rptFileName = () => { const ps = RPT.ids.map((id) => D.partnerships.find((p) => p.id === id)).filter(Boolean); return (ps.length === 1 ? `تقرير شراكة ${partnerName(ps[0])}` : `تقرير الشراكات (${ps.length})`) + ` — ${isoDate(new Date())}`; };

/* — PDF: نسخ شرائح المعاينة نفسها (بنفس الخط والتنسيق) إلى صفحات 16:9 — */
function prepareReportPrint(nodes, title) {
  let host = $('#rptPrint'); if (host) host.remove();
  host = document.createElement('div'); host.id = 'rptPrint'; host.dir = 'rtl';
  const src = nodes && nodes.length ? nodes : $$('#rpSlides .rs2');
  host.innerHTML = src.length ? src.map((n) => n.outerHTML).join('') : rptSlides().map(specHTML).join('');
  $$('[contenteditable]', host).forEach((x) => x.removeAttribute('contenteditable')); $$('.rs2.mk', host).forEach((x) => x.classList.remove('mk-anim', 'play')); $$('.rs2-t.ed', host).forEach((x) => x.classList.remove('ed'));
  document.body.appendChild(host);
  if (!src.length) hydrateFiles(host);
  let st = $('#printPageSize'); if (!st) { st = document.createElement('style'); st.id = 'printPageSize'; document.head.appendChild(st); }
  st.textContent = '@page{size:1280px 720px;margin:0}';
  document.documentElement.classList.add('printing-report');
  const prevTitle = document.title; document.title = title || rptFileName();
  const done = () => { document.documentElement.classList.remove('printing-report'); st.textContent = ''; host.remove(); document.title = prevTitle; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
}
// Ctrl+P في صفحة التقارير يطبع التقرير نفسه وليس الصفحة
window.addEventListener('beforeprint', () => { if (App.route && App.route.name === 'reports' && RPT.ids.length && !document.documentElement.classList.contains('printing-report')) prepareReportPrint(); });

/* — PowerPoint: العناصر نفسها بالإحداثيات نفسها — */
async function fileDataURL(id) {
  if (!id) return null;
  const pre = FileCache_src(id); if (pre) return pre;
  const f = await Store.getFile(id); if (!f) return null;
  return await new Promise((res) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => res(null); rd.readAsDataURL(f.blob); });
}
async function imgSize(src) { return await new Promise((res) => { const im = new Image(); im.onload = () => res([im.naturalWidth || 16, im.naturalHeight || 9]); im.onerror = () => res([16, 9]); im.src = src; }); }
async function exportReportPptx() {
  if (typeof PptxGenJS === 'undefined') throw new Error('مكتبة PowerPoint غير محمّلة');
  const S = rptSlides();
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; pptx.rtlMode = true; pptx.author = D.settings.org.name; pptx.company = D.settings.org.name; pptx.title = rptFileName();
  const k = 13.333 / SW, IN = (v) => +(v * k).toFixed(4);
  const iconCache = {};
  const iconPNG = async (name, color) => { const key = name + color; if (iconCache[key]) return iconCache[key]; const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="192" height="192" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`; const im = new Image(); await new Promise((r) => { im.onload = r; im.onerror = r; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }); const c = document.createElement('canvas'); c.width = c.height = 192; c.getContext('2d').drawImage(im, 0, 0, 192, 192); return (iconCache[key] = c.toDataURL('image/png')); };
  const hex = (c) => (c || '#000000').replace('#', '').slice(0, 6).toUpperCase();
  const cache = {};
  for (const s of S) {
    const sl = pptx.addSlide();
    for (const e of s.els) {
      if (e.k === 'rect' && e.fill) {
        sl.addShape(e.r ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, { x: IN(e.x), y: IN(e.y), w: IN(e.w), h: IN(Math.max(e.h, 0.5)), fill: { color: hex(e.fill), transparency: e.alpha || 0 }, line: e.line ? { color: hex(e.line), width: 0.75 } : { color: hex(e.fill), transparency: 100 }, rectRadius: e.r ? Math.min(0.5, e.r / Math.max(1, Math.min(e.w, e.h))) : undefined });
      } else if (e.k === 'svg') {
        const key = 'svg' + e.svg.length + e.w + e.h; if (!iconCache[key]) { const im = new Image(); await new Promise((r) => { im.onload = r; im.onerror = r; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(e.svg); }); const c = document.createElement('canvas'); c.width = Math.round(e.w * 2); c.height = Math.round(e.h * 2); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); iconCache[key] = c.toDataURL('image/png'); }
        sl.addImage({ data: iconCache[key], x: IN(e.x), y: IN(e.y), w: IN(e.w), h: IN(e.h) });
      } else if (e.k === 'icon') {
        sl.addImage({ data: await iconPNG(e.name, e.color), x: IN(e.x), y: IN(e.y), w: IN(e.w), h: IN(e.h) });
      } else if (e.k === 'circ') {
        sl.addShape(pptx.ShapeType.ellipse, { x: IN(e.x), y: IN(e.y), w: IN(e.w), h: IN(e.h), fill: { color: hex(e.fill), transparency: e.alpha || 0 }, line: e.line ? { color: hex(e.line), width: 1.75 } : { color: hex(e.fill), transparency: 100 } });
      } else if (e.k === 'img') {
        const src = cache[e.src] || (cache[e.src] = await fileDataURL(e.src)); if (!src) continue;
        const [iw, ih] = await imgSize(src);
        if (e.fit === 'contain') { const r = Math.min(e.w / iw, e.h / ih), w = iw * r, h = ih * r; const x = e.pos === 'right' ? e.x + e.w - w : e.x + (e.w - w) / 2; sl.addImage({ data: src, x: IN(x), y: IN(e.y + (e.h - h) / 2), w: IN(w), h: IN(h) }); }
        else { const r = Math.max(e.w / iw, e.h / ih), w = iw * r, h = ih * r; sl.addImage({ data: src, x: IN(e.x), y: IN(e.y), w: IN(w), h: IN(h), sizing: { type: 'crop', x: IN((w - e.w) / 2), y: IN((h - e.h) * 0.38), w: IN(e.w), h: IN(e.h) }, ...(e.round ? { rounding: true } : {}) }); }
      } else if (e.k === 'text') {
        const lines = e.text.split('\n');
        const al = e.align === 'center' ? 'center' : e.align === 'left' ? 'left' : 'right';
        const runs = lines.map((l, j) => ({ text: l, options: { breakLine: j < lines.length - 1, bold: !!(e.bold || (e.firstBold && j === 0 && lines.length > 1)), rtlMode: !e.ltr, align: al, lang: e.ltr ? 'en-US' : 'ar-SA' } }));
        sl.addText(runs, { x: IN(e.x), y: IN(e.y), w: IN(e.w), h: IN(e.h), fontFace: e.font || 'IBM Plex Sans Arabic', fontSize: +(e.size * 0.75).toFixed(1), color: hex(e.color), align: e.align === 'center' ? 'center' : e.align === 'left' ? 'left' : 'right', valign: e.valign === 'middle' ? 'middle' : 'top', rtlMode: !e.ltr, lang: e.ltr ? 'en-US' : 'ar-SA', margin: 0, lineSpacingMultiple: +(e.lh / 1.2).toFixed(2), paraSpaceAfter: 0, wrap: true });
      }
    }
  }
  await pptx.writeFile({ fileName: rptFileName() + '.pptx' });
  toast('نُزّل ملف PowerPoint');
}

/* — عرض التقرير بملء الشاشة داخل المنصة — */
function openReportShow(start = 0, nodes) {
  const src = nodes && nodes.length ? nodes : $$('#rpSlides .rs2'); if (!src.length) return;
  const ov = document.createElement('div'); ov.id = 'rptShow'; ov.className = 'rshow'; ov.dir = 'rtl';
  ov.innerHTML = `<div class="rshow-stage"><div class="rshow-track">${src.map((n, k) => `<div class="rshow-slide" data-i="${k}">${n.outerHTML}</div>`).join('')}</div></div>
    <div class="rshow-thumbs" hidden>${src.map((n, k) => `<button type="button" class="rshow-th" data-j="${k}"><span class="rshow-thf">${n.outerHTML}</span><b>${k + 1}</b></button>`).join('')}</div>
    <div class="rshow-bar"><button type="button" data-a="prev" title="السابق (→)">${icon('chevR')}</button><span class="rshow-n"></span><button type="button" data-a="next" title="التالي (←)">${icon('chevL')}</button>
      <span class="rshow-sep"></span><button type="button" data-a="thumbs" title="الشرائح (T)">${icon('grid')}</button><button type="button" data-a="play" title="تشغيل تلقائي">${icon('play')}</button><button type="button" data-a="fs" title="ملء الشاشة (F)">${icon('expand')}</button><button type="button" data-a="exit" title="خروج (Esc)">${icon('x')}</button></div>
    <div class="rshow-prog"><i></i></div>`;
  $$('[contenteditable]', ov).forEach((x) => x.removeAttribute('contenteditable')); $$('.rs2.mk', ov).forEach((x) => x.classList.remove('play')); $$('.rs2-t.ed', ov).forEach((x) => x.classList.remove('ed'));
  document.body.appendChild(ov); document.documentElement.classList.add('rshowing');
  const slides = $$('.rshow-slide', ov), N = slides.length;
  let i = Math.max(0, Math.min(N - 1, start)), timer = null, idle = null;
  const fit = () => { const k = Math.min(innerWidth / 1280, innerHeight / 720); $$('.rshow-slide > .rs2', ov).forEach((s) => { s.style.transform = `scale(${k})`; }); const tk = 168 / 1280; $$('.rshow-thf > .rs2', ov).forEach((s) => { s.style.transform = `scale(${tk})`; }); };
  const show = (n) => { i = Math.max(0, Math.min(N - 1, n)); slides.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('past', k < i); const m = s.querySelector('.rs2.mk'); if (m && k === i) { m.classList.add('mk-anim'); m.classList.remove('play'); void m.offsetWidth; mkPlay(m); } }); $('.rshow-n', ov).textContent = `${i + 1} من ${N}`; $('.rshow-prog i', ov).style.width = `${((i + 1) / N) * 100}%`; $$('.rshow-th', ov).forEach((b, k) => b.classList.toggle('on', k === i)); const cur = $(`.rshow-th[data-j="${i}"]`, ov); cur && !$('.rshow-thumbs', ov).hidden && cur.scrollIntoView({ inline: 'center', block: 'nearest' }); };
  const stop = () => { clearInterval(timer); timer = null; $('[data-a="play"]', ov).innerHTML = icon('play'); };
  const close = () => { stop(); document.removeEventListener('keydown', keys, true); window.removeEventListener('resize', fit); document.removeEventListener('fullscreenchange', fsch); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); ov.remove(); document.documentElement.classList.remove('rshowing'); };
  const keys = (e) => {
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); close(); }
    else if (k === 'ArrowLeft' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); show(i + 1); }
    else if (k === 'ArrowRight' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); show(i - 1); }
    else if (k === 'Home') show(0); else if (k === 'End') show(N - 1);
    else if (k.toLowerCase() === 't') $('[data-a="thumbs"]', ov).click(); else if (k.toLowerCase() === 'f') $('[data-a="fs"]', ov).click();
    e.stopPropagation();
  };
  const fsch = () => { ov.classList.toggle('fs', !!document.fullscreenElement); };
  ov.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]'), th = e.target.closest('[data-j]');
    if (th) { show(+th.dataset.j); return; }
    if (a) { const t = a.dataset.a; if (t === 'prev') show(i - 1); else if (t === 'next') show(i + 1); else if (t === 'exit') close(); else if (t === 'thumbs') { const tb = $('.rshow-thumbs', ov); tb.hidden = !tb.hidden; ov.classList.toggle('with-thumbs', !tb.hidden); show(i); } else if (t === 'fs') { if (!document.fullscreenElement) ov.requestFullscreen && ov.requestFullscreen().catch(() => {}); else document.exitFullscreen().catch(() => {}); } else if (t === 'play') { if (timer) stop(); else { a.innerHTML = icon('pause'); timer = setInterval(() => { if (i >= N - 1) stop(); else show(i + 1); }, 6000); } } return; }
    if (e.target.closest('.rshow-stage')) show(e.clientX < innerWidth / 2 ? i + 1 : i - 1);
  });
  ov.addEventListener('mousemove', () => { ov.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => ov.classList.add('idle'), 2600); });
  document.addEventListener('keydown', keys, true); window.addEventListener('resize', fit); document.addEventListener('fullscreenchange', fsch);
  fit(); show(i);
  if (ov.requestFullscreen) ov.requestFullscreen().catch(() => {});
}

/* القوائم المنسدلة في استوديو التقارير تُغلق عند الضغط في أي مكان خارجها، حتى خارج الصفحة (الشريط العلوي مثلًا) */
document.addEventListener('mousedown', (e) => { ['rpDD', 'rpPD'].forEach((id) => { const d = document.getElementById(id); if (d && d.classList.contains('open') && !d.contains(e.target)) d.classList.remove('open'); }); });
