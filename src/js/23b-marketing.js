/* =====================================================================
   التقرير التسويقي «أثرٌ يُروى»
   مجلة أثر في شرائح 16:9 تُبنى من البيانات لحظة العرض: الأعمال والإنجازات والأثر والقيمة
   تُروى كقصة لها بداية وذروة ودعوة. كل شريحة بلا بيانات كافية تُحذف تلقائيًا.
   العناوين قابلة للتعديل مباشرة قبل العرض، ويُعرض بملء الشاشة أو يُطبع PDF.
   ===================================================================== */
const MK = (() => { App.ui.mk = App.ui.mk || { scope: 'all' }; return App.ui.mk; })();
const MK_SCOPES = [
  ['all', 'كل الشراكات', () => true],
  ['active', 'السارية', (p) => ['active', 'soon'].includes(pStatus(p))],
  ['golden', 'الذهبية', (p) => !!p.golden],
];
const mkPool = () => visiblePartnerships().filter((p) => !p.isDraft && (showDemo() || !p.demo));
const mkOne = () => (MK.scope === 'one' ? mkPool().find((p) => p.id === MK.pid) || null : null);
const mkNum = (n) => nf(Math.round(n || 0));
const mkE = (key, def, tag = 'span', cls = '') => { const v = rptVal('mk.' + key, def); return `<${tag} class="mk-ed ${cls}" data-ek="mk.${key}" data-base="${esc(String(def == null ? '' : def))}" contenteditable="true" spellcheck="false">${esc(v)}</${tag}>`; };
const MK_RINGS = `<svg class="mk-bond" viewBox="-200 -130 400 260" aria-hidden="true"><circle cx="-58" r="112"/><circle cx="58" r="112"/><circle class="k" cy="-94" r="5"/><circle class="k" cy="94" r="5"/></svg>`;
const mkImg = (id, cls = '') => {
  if (!id) return '';
  if (id.startsWith('asset:')) return `<img class="${cls}" src="${(ASSET_IMG[id.slice(6)] || {}).src || ''}" alt="">`;
  if (id.startsWith('lib:')) return `<img class="${cls}" src="${(IMG_LIB[id.slice(4)] || {}).src || ''}" alt="">`;
  return `<img class="${cls}" data-file="${esc(id)}" alt="">`;
};

/* — البيانات: كل الأرقام تُحسب من السجلات المحددة — */
function mkData() {
  const sc = MK_SCOPES.find((s) => s[0] === MK.scope) || MK_SCOPES[0];
  const L_ = mkPool().filter(sc[2]);
  const signed = L_.filter((p) => p.stage === 'signed');
  const act = L_.filter((p) => ['active', 'soon'].includes(pStatus(p)));
  const partners = [...new Set(L_.map((p) => p.partnerId))].map(partnerById).filter(Boolean);
  const secCount = {}; L_.forEach((p) => { const s = pSector(p) || 'غير محدد'; secCount[s] = (secCount[s] || 0) + 1; });
  const sectors = Object.entries(secCount).filter(([k]) => k !== 'غير محدد').sort((a, b) => b[1] - a[1]);
  const years = {}; L_.forEach((p) => { const d = parseDate(p.startDate); if (d) years[d.getFullYear()] = (years[d.getFullYear()] || 0) + 1; });
  const yKeys = Object.keys(years).map(Number).sort((a, b) => a - b);
  const prof = L_.map((p) => ({ p, P: pProfile(p) }));
  const value = prof.reduce((t, x) => t + (x.P.total || 0), 0);
  const fin = prof.reduce((o, { P }) => { o.partner += +P.fin.partnerSar || 0; o.muroj += +P.fin.murojSar || 0; o.inkind += +P.fin.inkindSar || 0; return o; }, { partner: 0, muroj: 0, inkind: 0 });
  const outputs = L_.flatMap((p) => richItems(p.outputs).map((x) => ({ p, t: trimP((x.title ? x.title + ': ' : '') + x.text) }))).filter((x) => x.t);
  const impacts = L_.map((p) => ({ p, t: trimP(firstItem(p.expectedImpact) || '') })).filter((x) => x.t);
  const evs = prof.filter((x) => x.P.ev && x.P.ev.score !== null).map((x) => ({ p: x.p, s: x.P.ev.score }));
  const avgEv = evs.length ? Math.round(evs.reduce((t, x) => t + x.s, 0) / evs.length) : null;
  const depts = new Set(L_.flatMap((p) => p.departments || []));
  const goals = goalCodes().map((g) => ({ ...g, n: L_.filter((p) => (p.goalsLinked || []).includes(g.k)).length }));
  const vTypes = {}; prof.forEach(({ P }) => (P.valueTypes || []).forEach((v) => { vTypes[v] = (vTypes[v] || 0) + 1; }));
  const activated = act.filter((p) => p.activation === 'مفعّلة').length;
  const stars = (L_.filter((p) => p.golden).length ? L_.filter((p) => p.golden) : [...L_].sort((a, b) => ((pProfile(b).ev || {}).score || 0) - ((pProfile(a).ev || {}).score || 0) || (pProfile(b).total - pProfile(a).total))).slice(0, 3);
  const ids = new Set(L_.map((p) => p.id));
  const stories = D.achievements.filter((a) => (showDemo() || !a.demo) && (MK.scope === 'all' || !a.partnershipId || ids.has(a.partnershipId))).sort((a, b) => ((b.date || '') > (a.date || '') ? 1 : -1));
  const photos = [];
  const seen = new Set(); const add = (id, cap) => { if (id && !seen.has(id)) { seen.add(id); photos.push({ id, cap }); } };
  L_.forEach((p) => { add(p.coverFileId, partnerName(p)); (p.attachments || []).filter((a) => isImg(a)).forEach((a) => add(a.fileId, partnerName(p))); });
  stories.forEach((s) => (s.gallery || []).forEach((g) => add(g, s.title)));
  ['asset:waqf-saitah-signing', 'asset:border-guard-signing'].forEach((a) => add(a, 'توقيع شراكة'));
  const props = visibleProposals().filter((x) => ['submitted', 'review', 'info', 'accepted'].includes(x.status) && (showDemo() || !x.demo));
  const pipe = visiblePartnerships().filter((p) => !p.isDraft && ['prep', 'sign'].includes(p.stage) && (showDemo() || !p.demo));
  const soon = act.filter((p) => pStatus(p) === 'soon');
  const first = [...signed].filter((p) => p.startDate).sort((a, b) => (a.startDate < b.startDate ? -1 : 1))[0];
  const latest = [...signed].filter((p) => p.startDate).sort((a, b) => (a.startDate > b.startDate ? -1 : 1))[0];
  return { sc, L: L_, signed, act, partners, sectors, years, yKeys, value, fin, outputs, impacts, evs, avgEv, depts, goals, vTypes, activated, stars, stories, photos, props, pipe, soon, first, latest, org: D.settings.org };
}

/* — الإطار المشترك لكل شريحة — */
function mkFrame(k, tone, n, N, kicker, inner, extra = '') {
  return `<section class="rs2 mk mks-${k} mk-${tone}" data-mk="${k}" ${extra}>
    ${inner}
    <header class="mk-top"><span class="mk-kick"><em>${String(n).padStart(2, '0')}</em>${esc(kicker)}</span><span class="mk-pg">${n} / ${N}</span></header>
    <footer class="mk-foot"><span>${esc(D.settings.org.name)}</span><i></i><span>${esc(D.settings.org.platform)} · تقرير الأثر والشراكات</span></footer>
  </section>`;
}
/* — المشاهد السينمائية: كل مشهد بصري بتوقيع خاص، يتحرك عند ظهوره ويُطبع في حالته النهائية — */
const mxCnt = (v, txt) => `<b data-cnt="${+v || 0}">${txt != null ? txt : mkNum(v)}</b>`;
/* شجرة الأثر: الجذع المؤسسة، والأغصان القطاعات، والأوراق الشراكات */
/* الغلاف الرسمي: حلقات القطاعات — قوس لكل قطاع بطول نصيبه، والرقم في المركز */
function mxEmblem(X) {
  const secs = X.sectors.length ? X.sectors : [['الشراكات', X.L.length || 1]];
  const tot = secs.reduce((t, [, n]) => t + n, 0) || 1, cx = 300, cy = 360, R = 210, gap = 0.035;
  const cols = ['#2E8B6E', '#E6C786', '#5FB894', '#B8913F', '#9CC9B4', '#D9B467'];
  let a = -Math.PI / 2, arcs = '', labels = '';
  secs.forEach(([nm, n], i) => {
    const sweep = (n / tot) * Math.PI * 2 - gap, a1 = a + gap / 2, a2 = a1 + sweep, r = R - (i % 2) * 0;
    const p = (ang, rr) => [cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr];
    const [x1, y1] = p(a1, r), [x2, y2] = p(a2, r), large = sweep > Math.PI ? 1 : 0;
    arcs += `<path class="em-a" d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${cols[i % cols.length]}" pathLength="1" style="--k:${i}"/>`;
    const mid = (a1 + a2) / 2, [lx, ly] = p(mid, R + 46);
    labels += `<g class="em-l" style="--k:${i}"><text x="${lx.toFixed(1)}" y="${(ly - 4).toFixed(1)}" text-anchor="middle" class="n">${nf(n)}</text><text x="${lx.toFixed(1)}" y="${(ly + 18).toFixed(1)}" text-anchor="middle">${esc(nm)}</text></g>`;
    a += (n / tot) * Math.PI * 2;
  });
  return `<svg class="mx-emb" viewBox="0 0 600 720" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${R + 26}" class="em-o"/><circle cx="${cx}" cy="${cy}" r="${R - 26}" class="em-o"/>
    ${Array.from({ length: 72 }, (_, i) => { const ang = i / 72 * Math.PI * 2, r1 = R + 30, r2 = R + (i % 6 ? 34 : 40); return `<line class="em-t" x1="${(cx + Math.cos(ang) * r1).toFixed(1)}" y1="${(cy + Math.sin(ang) * r1).toFixed(1)}" x2="${(cx + Math.cos(ang) * r2).toFixed(1)}" y2="${(cy + Math.sin(ang) * r2).toFixed(1)}"/>`; }).join('')}
    ${arcs}${labels}
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" class="em-big">${nf(X.signed.length || X.L.length)}</text>
    <text x="${cx}" y="${cy + 44}" text-anchor="middle" class="em-cap">${X.signed.length ? 'شراكة موقّعة' : 'شراكة'}</text>
    <text x="${cx}" y="${cy + 70}" text-anchor="middle" class="em-cap2">${nf(X.partners.length)} جهة · ${nf(secs.length)} قطاعات</text></svg>`;
}
function mxTree(X) {
  const secs = (X.sectors.length ? X.sectors : [['الشراكات', X.L.length]]).slice(0, 6);
  const W = 640, H = 600, bx = W / 2, by = H - 12, ty = H - 230;
  const trunk = `<path class="tr" pathLength="1" d="M${bx} ${by} C ${bx - 6} ${by - 80}, ${bx + 8} ${ty + 80}, ${bx} ${ty}"/>`;
  let br = '', lv = '', lb = '', li = 0;
  secs.forEach(([s, n], k) => {
    const f = secs.length === 1 ? 0.5 : k / (secs.length - 1);
    const ang = (-160 + f * 140) * Math.PI / 180, len = 190 + (k % 2) * 40;
    const sy = ty + 40 - (k % 3) * 22, sx = bx;
    const ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len - 40;
    const cx = sx + Math.cos(ang) * len * 0.35, cy = sy + Math.sin(ang) * len * 0.35 - 70;
    br += `<path class="br" pathLength="1" style="--k:${k}" d="M${sx} ${sy} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}"/>`;
    const ps = X.L.filter((p) => (pSector(p) || 'الشراكات') === s || (secs.length === 1));
    ps.slice(0, 14).forEach((p, j) => {
      const t = 0.42 + (j / Math.max(1, ps.length)) * 0.58;
      const qx = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex, qy = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey;
      const off = (j % 2 ? 1 : -1) * (14 + (j % 3) * 6);
      const lx = qx + Math.cos(ang + Math.PI / 2) * off, ly = qy + Math.sin(ang + Math.PI / 2) * off;
      const st = pStatus(p), cls = p.golden ? 'g' : ['active', 'soon'].includes(st) ? 'a' : st === 'ended' ? 'e' : 'u';
      lv += `<g class="lf ${cls}" style="--i:${li}" transform="translate(${lx.toFixed(1)} ${ly.toFixed(1)}) rotate(${((ang * 180) / Math.PI + 90 + (j % 2 ? 30 : -30)).toFixed(0)})"><path d="M0 0 C 14 -10, 14 -32, 0 -44 C -14 -32, -14 -10, 0 0Z"/><path class="vein" d="M0 -2 L0 -38"/></g>`;
      li++;
    });
    lb += `<text class="sl" x="${(ex + Math.cos(ang) * 22).toFixed(1)}" y="${(ey - 16).toFixed(1)}" text-anchor="middle" style="--k:${k}">${esc(s)} · ${n}</text>`;
  });
  return `<svg class="mx-tree" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><radialGradient id="mxGlow"><stop offset="0" stop-color="#E6C786" stop-opacity=".35"/><stop offset="1" stop-color="#E6C786" stop-opacity="0"/></radialGradient></defs><circle cx="${bx}" cy="${ty - 40}" r="250" fill="url(#mxGlow)" class="glow"/>${trunk}${br}${lv}${lb}<circle class="seed" cx="${bx}" cy="${by}" r="7"/></svg>`;
}
/* — نصوص الشرائح: قصّ عند حدود الكلمات، وعنوان قصير ووصف من كل بند، وأيقونة حسب موضوعه — */
function mkClip(t, n) {
  t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t;
  const cut = t.slice(0, n), i = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('،'));
  return cut.slice(0, i > n * 0.6 ? i : n).replace(/[،,؛:\s]+$/u, '') + '…';
}
function mkSplit(text) {
  let t = trimP(text).replace(/^\s*(\d+\s*[-–.)]\s*)/, '');
  const stripLead = (x) => x.replace(/^(التعاون|العمل المشترك|التنسيق)\s+(في|على)\s+/, '');
  const m = t.match(/^(.{12,95}?)[،,]\s*((?:بما|وذلك|من خلال|عبر|مثل|ومنها|وتشمل|بهدف).+)$/);
  if (m) return { t: stripLead(m[1]).replace(/^./, (c) => c), d: m[2] };
  const c = t.match(/^([^:：]{4,70})[:：]\s*(.+)$/); if (c) return { t: stripLead(c[1]), d: c[2] };
  const w = stripLead(t).split(' ');
  const cm = t.match(/^(.{12,95}?)[،,]\s*(.{8,})$/); if (cm) return { t: stripLead(cm[1]), d: cm[2] }; // أول فاصلة
  return { t: stripLead(t), d: '' }; // جملة واحدة بلا فاصل: تبقى كاملة عنوانًا (لا تُقسم في منتصفها)
}
const MK_ICONS = [[/سياح|معسكر|زائر|رحل/, 'flag'], [/أخرى|اهتمام المشترك/, 'link'], [/مجتمع|تطوع|متطوع|شباب|أسر/, 'users'], [/دراس|بحث|بحوث|ابتكار|تقني|حلول/, 'search'], [/تدريب|تعليم|ورش|قدرات|معرف|خبرات/, 'award'], [/قياس|أثر|مؤشر|تقارير|بيانات/, 'chart'], [/إعلام|محتوى|نشر|أخبار|توعي/, 'news'], [/مال|استثمار|تمويل|رعاي/, 'star'], [/مياه|سيول/, 'layers'], [/نبات|غطاء|تشجير|شجر|بيئ|موائل|أحيائ|تصحر|مناخ|زراع/, 'leaf']];
/* بطاقات البنود (مجالات التعاون، والمخرجات، والأثر): عنوان قصير وأيقونة ووصف موجز */
function mkFitText(root) {
  (root || document).querySelectorAll('.mx-wall').forEach((w) => { let k = 1; w.style.setProperty('--fs', '1'); const over = () => w.scrollHeight > w.clientHeight + 1 || [...w.querySelectorAll('ul')].some((u) => u.scrollWidth > u.clientWidth + 1); while (over() && k > 0.55) { k = +(k - 0.04).toFixed(2); w.style.setProperty('--fs', String(k)); } });
  (root || document).querySelectorAll('.px-co2 article, .hz-c, .px-pp-b').forEach((a) => {
    let k = 1; a.style.setProperty('--fs', '1');
    /* المحتوى الفعلي (لا الزخارف المطلقة) مقابل المساحة الداخلية للبطاقة */
    const over = () => { const R = a.getBoundingClientRect(), sc = R.height / (a.offsetHeight || 1), pb = parseFloat(getComputedStyle(a).paddingBottom) || 0; const kids = [...a.children].filter((x) => getComputedStyle(x).position !== 'absolute'); if (!kids.length || !R.height) return false; return Math.max(...kids.map((x) => x.getBoundingClientRect().bottom)) > R.bottom - pb * sc * 0.4 + 1; };
    while (over() && k > 0.62) { k = +(k - 0.04).toFixed(2); a.style.setProperty('--fs', String(k)); }
  });
}
function mkCardsHTML(items, startN, total, label) {
  const n = items.length;
  return `<div class="px-co2 n${n}">${items.map((raw, i) => { const sp = mkSplit(raw); return `<article style="--i:${i}"><span class="px-co2-n">${String(startN + i + 1).padStart(2, '0')}</span><div class="px-co2-h"><i class="px-co2-ic">${icon(mkIconFor(sp.t, raw))}</i><b>${esc(sp.t)}</b></div>${sp.d ? `<p>${esc(sp.d)}</p>` : ''}</article>`; }).join('')}</div>`;
}
const mkCardsHead = (h, count, noun, page, pages, sub) => `<div class="px-co2-head"><h2 class="mx-h">${h}</h2><div class="px-co2-sum"><b>${nf(count)}</b><span>${noun}${pages > 1 ? `<small>الصفحة ${page} من ${pages}</small>` : sub ? `<small>${esc(sub)}</small>` : ''}</span></div></div>`;
if (!MK.cover) { try { MK.cover = localStorage.getItem('shk_mk_cover') || 'formal'; } catch (_) { MK.cover = 'formal'; } }
const mkIconFor = (t, full) => (MK_ICONS.find(([re]) => re.test(t)) || MK_ICONS.find(([re]) => re.test(full || '')) || [, 'link'])[1];

/* تقرير تسويقي لشراكة واحدة: كل شريحة تُبنى من بيانات الشراكة نفسها، وتُحذف إن لم تتوفر بياناتها */
function mkSlidesOne(p) {
  const org = D.settings.org, pr = partnerById(p.partnerId) || null, name = partnerName(p), P = pProfile(p), st = pStatus(p);
  const k = (s) => 'p.' + p.id + '.' + s; // مفاتيح تعديل النصوص خاصة بكل شراكة
  const coop = itemsOf(p.cooperationAreas), outs = richItems(p.outputs).map((x) => trimP((x.title ? x.title + ': ' : '') + x.text)).filter(Boolean);
  const imps = itemsOf(p.expectedImpact).map((x) => trimP(x.t ? x.t + ': ' + x.x : x.x)).filter(Boolean);
  const s0 = parseDate(p.startDate), e0 = parseDate(p.endDate);
  const months = s0 && e0 ? Math.max(1, Math.round((e0 - s0) / (30.44 * 864e5))) : null;
  const dur = months == null ? null : months % 12 === 0 ? [months / 12, months / 12 === 1 ? 'سنة' : months / 12 === 2 ? 'سنتان' : 'سنوات'] : [months, 'شهرًا'];
  const dl = daysLeft(p);
  const stories = D.achievements.filter((a) => a.partnershipId === p.id && (showDemo() || !a.demo)).sort((a, b) => ((b.date || '') > (a.date || '') ? 1 : -1));
  const photos = []; const seen = new Set(); const add = (id) => { if (id && !seen.has(id)) { seen.add(id); photos.push(id); } };
  add(p.coverFileId); (p.attachments || []).filter((a) => isImg(a)).forEach((a) => add(a.fileId)); stories.forEach((s) => (s.gallery || []).forEach(add));
  const goal = trimP(p.showcaseGoal || (coop[0] && (coop[0].t || coop[0].x)) || firstItem(p.expectedImpact) || '');
  const others = D.partnerships.filter((x) => x.partnerId === p.partnerId && x.id !== p.id && !x.isDraft && (showDemo() || !x.demo));
  const evs = (p.evals || []).filter((e) => e.status === 'done');
  const S = [];
  /* 1. الغلاف */
  S.push(['pcover', 'film', 'تقرير الشراكة', `
    <div class="mx-film">${photos[0] ? mkImg(photos[0]) : coverHTML('pc' + p.id, null, { W: 1280, H: 720, levels: 16, cols: 70, tone: 'dark' })}</div><span class="mx-bars"></span>
    <div class="px-cover">
      <div class="px-logos">${(ASSET_IMG['murooj-logo-white'] || {}).src ? `<img class="px-org" src="${ASSET_IMG['murooj-logo-white'].src}" alt="">` : ''}<span class="px-x">${MK_RINGS}</span><span class="px-plg">${logoOrMono(pr, name)}</span></div>
      <span class="mx-mast">${esc(org.name)} · تقرير الشراكة ${new Date().getFullYear()}</span>
      <h1 class="px-name">${mkE(k('cv.t'), name)}</h1>
      <p class="px-sub">${mkE(k('cv.s'), p.title && pr && p.title !== pr.name ? p.title : [p.classification, pSector(p)].filter(Boolean).join(' · '))}</p>
      <div class="px-meta">${[p.classification, pSector(p), p.ptype, s0 ? `${fmtDate(p.startDate)}${e0 ? ' – ' + fmtDate(p.endDate) : ''}` : ''].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}<span class="st st-${st}">${esc(statusLabel(st))}</span></div>
    </div>`]);
  /* 2. الملخص */
  const lineDef = `${s0 ? `منذ ${fmtDate(p.startDate)} ` : ''}تجمع ${p.classification || 'شراكة'} بين ${org.name} و${name}${goal ? `، في ${mkSplit(goal).t}` : ''}.`;
  const line = rptVal('mk.' + k('ln'), lineDef);
  S.push(['line', 'paper', 'الملخص', `
    <span class="mx-qm" aria-hidden="true">“</span>
    <p class="mx-line" data-ek="mk.${k('ln')}" data-base="${esc(lineDef)}" contenteditable="true" spellcheck="false">${line.split(/\s+/).map((w, i) => `<span class="${/[0-9٠-٩]/.test(w) ? 'n' : ''}" style="--w:${i}">${esc(w)}</span>`).join(' ')}</p>
    <div class="mx-sig"><i></i>${esc(org.dept)} — ${esc(org.name)}</div>`]);
  /* 3. أبرز الأرقام */
  const G = [];
  if (dur) G.push([dur[0], nf(dur[0]), 'مدة الشراكة (' + dur[1] + ')']);
  if (P.total) G.push([P.total, sarShort(P.total).replace(' مليون', 'M').replace(' ألف', 'K'), '⃁ قيمة تقديرية']);
  if (p.highlight && p.highlight.value) G.push([0, String(p.highlight.value), p.highlight.label || 'أبرز نتيجة']);
  if (G.length < 3 && outs.length) G.push([outs.length, nf(outs.length), 'مخرجًا مستهدفًا']);
  if (G.length < 3 && imps.length) G.push([imps.length, nf(imps.length), 'أثرًا متوقعًا']);
  if (G.length < 3 && (p.departments || []).length) G.push([p.departments.length, nf(p.departments.length), 'إدارة داخلية مشاركة']);
  if (G.length < 3 && coop.length) G.push([coop.length, nf(coop.length), 'مجالًا للتعاون']);
  if (G.length < 3 && P.ev && P.ev.score !== null) G.push([P.ev.score, P.ev.score + '/100', 'نتيجة التقييم']);
  if (G.length >= 2) S.push(['three', 'night', 'بالأرقام', `
    <h2 class="mx-h">${mkE(k('num.h'), 'أبرز الأرقام')}</h2>
    <div class="mx-giants">${G.slice(0, 3).map(([v, t, l], i) => `<div class="mx-gi" style="--i:${i}"><b data-t="${esc(t)}">${esc(t)}</b><span>${esc(l)}</span></div>`).join('')}</div>
    <div class="mx-ticker">${[[statusLabel(st), 'الحالة'], [dl !== null && ['active', 'soon'].includes(st) ? nf(dl) + ' يومًا' : '—', 'المتبقي'], [(p.departments || []).length || '—', 'إدارة داخلية مشاركة'], [p.activation || '—', 'التفعيل'], [others.length ? others.length + 1 : 1, 'شراكة مع الجهة']].map(([v, l]) => `<span><b>${esc(String(v))}</b>${l}</span>`).join('<i>✦</i>')}</div>`]);
  /* 4. الجهة الشريكة */
  if (pr) S.push(['ppartner', 'deep', 'الجهة الشريكة', `
    <div class="px-pp">
      <div class="px-pp-lg">${logoOrMono(pr, name)}</div>
      <div class="px-pp-b"><h2>${esc(pr.name)}</h2>
        <div class="px-pp-tags">${[pr.sector || pSector(p), pr.domain, pr.type].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
        <p>${mkE(k('pp.s'), trimP(pr.notes || '') || `${pr.name} شريك ${org.name} في ${pSector(p) ? 'القطاع ' + pSector(p) : 'هذه الشراكة'}.`)}</p>
        <dl class="px-pp-facts">${[['القطاع', pr.sector || pSector(p)], ['مجال العمل', pr.domain], ['نوع الشراكة', p.classification], ['تصنيف الشراكة', p.ptype], ['بداية الشراكة', s0 ? fmtDate(p.startDate) : ''], ['المدة', dur ? `${nf(dur[0])} ${dur[1]}` : ''], ['مجالات التعاون', coop.length ? nf(coop.length) : ''], ['الحالة', statusLabel(st)]].filter(([, v]) => v).slice(0, 6).map(([l, v], i) => `<div style="--i:${i}"><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        ${others.length ? `<div class="px-pp-others"><small>شراكات أخرى مع الجهة</small>${others.slice(0, 4).map((o) => `<span>${esc(o.title || o.code || '')}<em>${esc(statusLabel(pStatus(o)))}</em></span>`).join('')}</div>` : ''}
      </div></div>`]);
  /* 5. مجالات التعاون — كلها، ست بطاقات في كل شريحة */
  const pages = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
  /* عدد البنود في الشريحة حسب طولها حتى يظهر النص كاملًا بخط مقروء */
  const per = (arr) => { const len = (x) => String(typeof x === 'string' ? x : (x.t || '') + ' ' + (x.x || '')).length; const avg = arr.length ? arr.reduce((t, x) => t + len(x), 0) / arr.length : 0; return avg > 300 ? 3 : avg > 170 ? 4 : 6; };
  const pc = per(coop); pages(coop, pc).forEach((part, pi, all) => S.push(['pcoop', 'paper', 'مجالات التعاون', `
    <div class="px-co2-head"><h2 class="mx-h">${mkE(k('co.h' + (pi || '')), 'مجالات التعاون')}</h2>
      <div class="px-co2-sum"><b>${nf(coop.length)}</b><span>${coop.length === 1 ? 'مجال تعاون' : 'مجالات تعاون'}${all.length > 1 ? `<small>الصفحة ${pi + 1} من ${all.length}</small>` : `<small>بين ${esc(org.name)} و${esc(name)}</small>`}</span></div></div>
    <div class="px-co2 n${part.length}">${part.map((c, i) => { const sp = c.t ? { t: trimP(c.t), d: trimP(c.x) } : mkSplit(c.x); const all_ = (c.t || '') + ' ' + c.x; return `<article style="--i:${i}"><span class="px-co2-n">${String(pi * pc + i + 1).padStart(2, '0')}</span><div class="px-co2-h"><i class="px-co2-ic">${icon(mkIconFor(sp.t, all_))}</i><b>${esc(sp.t)}</b></div>${sp.d ? `<p>${esc(sp.d)}</p>` : ''}</article>`; }).join('')}</div>`]));
  /* 6. المخرجات — كلها */
  const po = per(outs); pages(outs, po).forEach((part, pi, all) => S.push(['pout', 'night', 'المخرجات', `
    ${mkCardsHead(mkE(k('ou.h' + (pi || '')), 'المخرجات المستهدفة'), outs.length, outs.length === 1 ? 'مخرج مستهدف' : 'مخرجات مستهدفة', pi + 1, all.length, 'إسناد مشاريع وبناء مبادرات')}
    ${mkCardsHTML(part, pi * po, outs.length)}`]));
  /* 6ب. الأثر المتوقع — كله */
  const pm = per(imps); pages(imps, pm).forEach((part, pi, all) => S.push(['pimp', 'deep', 'الأثر المتوقع', `
    ${mkCardsHead(mkE(k('im.h' + (pi || '')), 'الأثر المتوقع'), imps.length, imps.length === 1 ? 'أثر متوقع' : 'آثار متوقعة', pi + 1, all.length, 'وكيف يخدم المؤسسة')}
    ${mkCardsHTML(part, pi * pm, imps.length)}`]));
  /* 6ج. شبكة الشراكة: الشراكة في المركز، وفريق إدارة الشراكات يمينًا، والإدارات يسارًا، والتفعيل أسفلها */
  const own = p.owners || [], deps = p.departments || [];
  if (own.length || deps.length || p.activation) {
    const CX = 640, CY = 420;
    const place = (n, side) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); const a = (side > 0 ? -60 + t * 120 : 120 + t * 120) * Math.PI / 180; return [CX + Math.cos(a) * (side > 0 ? 400 : 400) * (side > 0 ? 1 : 1), CY + Math.sin(a) * 210]; });
    const oP = place(Math.min(own.length, 5), 1).map(([x, y]) => [CX + Math.abs(x - CX), y]);
    const dP = place(Math.min(deps.length, 6), -1).map(([x, y]) => [CX - Math.abs(x - CX), y]);
    const actPct = p.activation === 'مفعّلة' ? 1 : p.activation === 'قيد التفعيل' ? 0.5 : 0, RR = 82, CC = 2 * Math.PI * RR;
    const line = ([x, y], i, cls) => `<path class="tn-l ${cls}" pathLength="1" style="--i:${i}" d="M${CX} ${CY} C ${(CX + x) / 2} ${CY}, ${(CX + x) / 2} ${y}, ${x} ${y}"/>`;
    S.push(['pteam', 'paper', 'فريق العمل', `
      <h2 class="mx-h">${mkE(k('tm2.h'), 'من يعمل على هذه الشراكة')}</h2>
      <svg class="tn-svg" viewBox="0 0 1280 720" aria-hidden="true">${oP.map((pt, i) => line(pt, i, 'o')).join('')}${dP.map((pt, i) => line(pt, i + oP.length, 'd')).join('')}
        <circle cx="${CX}" cy="${CY}" r="${RR}" class="tn-rbg"/><circle cx="${CX}" cy="${CY}" r="${RR}" class="tn-r" style="--c:${CC.toFixed(1)}" stroke-dasharray="${(actPct * CC).toFixed(1)} ${CC.toFixed(1)}" transform="rotate(-90 ${CX} ${CY})"/></svg>
      <div class="tn-core" style="left:${CX}px;top:${CY}px"><span class="tn-lg">${logoOrMono(pr, name)}</span></div>
      <div class="tn-act ${actPct === 1 ? 'ok' : actPct ? 'mid' : ''}" style="left:${CX}px;top:${CY + 112}px"><b>${esc(p.activation || 'التفعيل غير محدد')}</b><small>${actPct === 1 ? 'المخرجات قيد التنفيذ' : actPct ? 'خطة التفعيل جارية' : 'لم تبدأ خطة التفعيل'}</small></div>
      <span class="tn-cap o" style="left:${CX + 400}px;top:150px">فريق ${esc(org.dept)}</span><span class="tn-cap d" style="left:${CX - 400}px;top:150px">الإدارات المتقاطعة</span>
      ${oP.map(([x, y], i) => `<div class="tn-n o" style="left:${x}px;top:${y}px;--i:${i}"><i>${esc(initials(own[i]))}</i><b>${esc(own[i])}</b></div>`).join('')}
      ${own.length > 5 ? `<span class="tn-more o" style="left:${CX + 400}px;top:${CY + 250}px">+${own.length - 5}</span>` : ''}
      ${!own.length ? `<div class="tn-n o empty" style="left:${CX + 400}px;top:${CY}px"><i>?</i><b>لم يُحدَّد مسؤول</b></div>` : ''}
      ${dP.map(([x, y], i) => `<div class="tn-n d" style="left:${x}px;top:${y}px;--i:${i + oP.length}"><i>${icon('building')}</i><b>${esc(deps[i])}</b></div>`).join('')}
      ${deps.length > 6 ? `<span class="tn-more d" style="left:${CX - 400}px;top:${CY + 250}px">+${deps.length - 6}</span>` : ''}
      ${!deps.length ? `<div class="tn-n d empty" style="left:${CX - 400}px;top:${CY}px"><i>${icon('building')}</i><b>لم تُحدَّد إدارات</b></div>` : ''}`]);
  }
  /* 6د. الارتباط بالأهداف الاستراتيجية */
  const gl = (p.goalsLinked || []).map((g) => (goalCodes().find((x) => x.k === g) || {}).t || g).filter(Boolean);
  if (gl.length || p.strategicGoal || p.initiative) S.push(['pgoal', 'deep', 'الأهداف الاستراتيجية', `
    <h2 class="mx-h">${mkE(k('gl.h'), 'الارتباط بأهداف المؤسسة')}</h2>
    <div class="px-goals">${[...(p.strategicGoal ? [['الهدف الاستراتيجي', p.strategicGoal]] : []), ...(p.initiative ? [['المبادرة', p.initiative]] : []), ...gl.map((g) => ['هدف مرتبط', g])].slice(0, 6).map(([l, t], i) => `<div style="--i:${i}"><small>${esc(l)}</small><b>${esc(String(t).slice(0, 110))}</b></div>`).join('')}</div>`]);
  /* 7. المسار الزمني: السنوات والشهور، ونسبة المنقضي، وكل أحداث الشراكة الموثقة */
  if (s0 && e0 && e0 > s0) {
    const ev = [[p.startDate, 'بداية الشراكة', 'a', 'flag'], ...(p.renewals || []).map((x) => [String(x.at).slice(0, 10), `تجديد حتى ${fmtDate(x.to)}`, 'g', 'history'])];
    try { const W = wfStateOf('partnership', p); WF_STEPS.forEach((x) => { const r_ = W.S[x.id]; if (r_ && r_.status === 'done' && r_.at && !r_.legacy) ev.push([r_.at, x.t, 'w', 'check']); }); } catch (_) { /* */ }
    evs.forEach((e) => ev.push([e.data.date || e.at, `تقييم الشراكة${evalScore(e.data) != null ? ': ' + evalScore(e.data) + '/100' : ''}`, 'b', 'award']));
    stories.forEach((st_) => st_.date && ev.push([st_.date, trimP(st_.title || 'إنجاز').slice(0, 42), 'c', 'star']));
    (MK.docs === false ? [] : p.attachments || []).filter((a2) => a2.addedAt && !isImg(a2) && a2.category !== 'أخرى').forEach((a2) => ev.push([a2.addedAt, `${a2.category}: ${a2.name.replace(/\.[a-z0-9]{2,5}$/i, '')}`.slice(0, 48), 'f', 'file']));
    ev.push([p.endDate, 'نهاية المدة الحالية', 'd', 'calendar']);
    const t0 = s0.getTime(), t1 = e0.getTime(), now = today().getTime();
    const L0 = 1140, L1 = 140, X_ = (t) => L0 - Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) * (L0 - L1);
    const evS = ev.map(([d, t, c, ic]) => [parseDate(String(d).slice(0, 10)), t, c, ic]).filter((x) => x[0] && x[0].getTime() >= t0 - 864e5 && x[0].getTime() <= t1 + 864e5).sort((a2, b2) => a2[0] - b2[0]);
    const keep = evS.length > 8 ? [evS[0], ...evS.slice(1, -1).filter((_, i, arr) => i % Math.ceil(arr.length / 6) === 0).slice(0, 6), evS[evS.length - 1]] : evS;
    const pct = Math.max(0, Math.min(1, (now - t0) / (t1 - t0))), months = Math.round((t1 - t0) / (30.44 * 864e5));
    const ticks = []; for (let d = new Date(s0.getFullYear(), s0.getMonth() + 1, 1); d < e0; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) ticks.push(d);
    S.push(['ptime', 'paper', 'المسار الزمني', `
      <h2 class="mx-h">${mkE(k('tm.h'), 'المسار الزمني للشراكة')}</h2>
      <dl class="tl-stats"><div><dt>مدة الشراكة</dt><dd><b>${months}</b> شهرًا</dd></div><div><dt>انقضى من المدة</dt><dd><b>${Math.round(pct * 100)}%</b></dd></div><div><dt>${now > t1 ? 'انتهت منذ' : now < t0 ? 'تبدأ بعد' : 'المتبقي'}</dt><dd><b>${nf(Math.abs(Math.round(((now > t1 ? now - t1 : now < t0 ? t0 - now : t1 - now)) / 864e5)))}</b> يومًا</dd></div><div><dt>أحداث موثقة</dt><dd><b>${evS.length}</b></dd></div></dl>
      <div class="tl2">
        <i class="tl2-bed" style="right:${1280 - L0}px;left:${L1}px"></i><i class="tl2-fill" style="right:${1280 - L0}px;--w:${(pct * (L0 - L1)).toFixed(0)}px"></i>
        ${ticks.map((d) => `<i class="tl2-tk ${d.getMonth() === 0 ? 'y' : ''}" style="left:${X_(d.getTime()).toFixed(0)}px"></i>${d.getMonth() === 0 ? `<span class="tl2-yr" style="left:${X_(d.getTime()).toFixed(0)}px">${d.getFullYear()}</span>` : ''}`).join('')}
        ${now >= t0 && now <= t1 ? `<div class="tl2-now" style="left:${X_(now).toFixed(0)}px"><span>اليوم · ${Math.round(pct * 100)}%</span></div>` : ''}
        ${keep.map(([d, t, c, ic], i) => `<div class="tl2-ev ${c} ${i % 2 ? 'dn' : 'up'}" style="left:${X_(d.getTime()).toFixed(0)}px;--i:${i}"><i class="tl2-dot"></i><span class="tl2-card"><em>${icon(ic)}</em><b>${esc(t)}</b><small>${fmtDate(isoDate(d))}</small></span></div>`).join('')}
      </div>`]);
  }
  /* 8. من الميدان: قصص الشراكة، أو معرض صورها */
  stories.slice(0, 2).forEach((s, i) => {
    const ph = (s.gallery || [])[0] || photos[i + 1] || photos[0];
    const mv = String(s.metricValue || '').replace(/[^\d.]/g, '');
    S.push(['field', 'film', 'من الميدان', `
      <div class="mx-film">${ph ? mkImg(ph) : ''}</div><span class="mx-bars"></span>
      <div class="mx-field"><span class="mx-tag">${esc(name)}</span>
        ${s.metricValue ? `<div class="mx-metric">${mv ? `<b data-cnt="${mv}" data-fmt="1">${esc(s.metricValue)}</b>` : `<b>${esc(s.metricValue)}</b>`}<span>${esc(s.metricLabel || '')}</span></div>` : ''}
        <h2>${mkE(k(`sto.${i}.t`), s.title)}</h2><p>${mkE(k(`sto.${i}.q`), trimP(s.summary || '').slice(0, 220))}</p></div>`]);
  });
  if (photos.length >= 3) S.push(['pgal', 'film', 'صور الشراكة', `
    <div class="px-gal n${Math.min(5, photos.length)}">${photos.slice(0, 5).map((id, i) => `<figure style="--i:${i}">${mkImg(id)}</figure>`).join('')}</div>
    <h2 class="px-gal-t">${mkE(k('ga.h'), 'من أعمال الشراكة')}</h2>`]);
  /* 8ب. مسار المذكرة */
  try {
    const W = wfStateOf('partnership', p), done = WF_STEPS.filter((x) => W.S[x.id] && W.S[x.id].status === 'done').length;
    S.push(['pwf', 'paper', 'مسار المذكرة', `
      <h2 class="mx-h">${mkE(k('wf.h'), 'مسار المذكرة حتى الأثر')}</h2>
      <p class="mx-sub">${W.cur ? `الخطوة الحالية: ${W.cur.n}. ${esc(W.cur.t)}` : W.closed ? 'أُغلق الطلب' : 'اكتملت خطوات المسار'} — ${done} من ${WF_STEPS.length} خطوة مكتملة.</p>
      <div class="px-wf">${WF_PHASES.map((ph, pi) => { const st = WF_STEPS.filter((x) => x.ph === ph.id); const d = st.filter((x) => W.S[x.id] && W.S[x.id].status === 'done').length; const cur = W.cur && st.some((x) => x.id === W.cur.id); return `<div class="px-ph ${d === st.length ? 'd' : cur ? 'c' : ''}" style="--i:${pi}"><em>${String(pi + 1).padStart(2, '0')}</em><b>${esc(ph.t)}</b><span class="px-ph-bar"><i style="width:${Math.round(d / st.length * 100)}%"></i></span><small>${d}/${st.length}</small></div>`; }).join('')}</div>      <ol class="px-wf-steps">${WF_STEPS.map((x, si) => { const r = W.S[x.id] || {}, dn = r.status === 'done', cu = W.cur && W.cur.id === x.id; return `<li class="${dn ? 'd' : cu ? 'c' : ''}" style="--i:${si}"><em>${dn ? '✓' : x.n}</em><span><b>${esc(x.t)}</b><small>${dn ? (r.at && !r.legacy ? fmtDate(String(r.at).slice(0, 10)) : 'مكتملة') : cu ? 'الخطوة الحالية — ' + esc(wfActorName(x.actor)) : esc(wfActorName(x.actor))}</small></span></li>`; }).join('')}</ol>
`]);
  } catch (_) { /* المسار اختياري */ }
  /* 8ج. الوثائق والصور: صور الشراكة الفعلية وقائمة المستندات بتصنيفاتها */
  const atts = (p.attachments || []).filter((a2) => a2.fileId);
  const phs = [...new Set([p.coverFileId, ...atts.filter((a2) => isImg(a2)).map((a2) => a2.fileId)].filter(Boolean))];
  const docs = MK.docs === false ? [] : atts.filter((a2) => !isImg(a2));
  if (phs.length || docs.length) {
    const ext = (n) => (String(n).match(/\.([a-z0-9]+)$/i) || [, ''])[1].toUpperCase();
    const byCat = {}; atts.forEach((a2) => { const c2 = a2.category || 'أخرى'; byCat[c2] = (byCat[c2] || 0) + 1; });
    S.push(['pdocs', 'night', docs.length ? 'الوثائق والصور' : 'الصور', `
      <h2 class="mx-h">${mkE(k(docs.length ? 'dc.h' : 'dc.h2'), docs.length ? 'الوثائق والصور' : 'صور الشراكة')}</h2>
      <p class="mx-sub">${Object.entries(byCat).filter(([c2]) => docs.length || c2 === 'صور الشراكة').map(([c2, n]) => `${esc(c2)}: ${n}`).join(' · ')}</p>
      <div class="dc2 ${phs.length && docs.length ? 'both' : phs.length ? 'ph' : 'dc'}">
        ${phs.length ? `<div class="dc2-ph n${Math.min(4, phs.length)}">${phs.slice(0, 4).map((id, i) => `<figure style="--i:${i}" data-mkopen="${esc(id)}" title="عرض الصورة">${mkImg(id)}</figure>`).join('')}${phs.length > 4 ? `<span class="dc2-more">+${phs.length - 4} صورة</span>` : ''}</div>` : ''}
        ${docs.length ? `<ul class="dc2-list">${docs.slice(0, 6).map((a2, i) => `<li style="--i:${i}" data-mkopen="${esc(a2.fileId)}" title="فتح المستند"><span class="dc2-ic t-${ext(a2.name).toLowerCase()}">${ext(a2.name) || icon('file')}</span><div><b>${esc(a2.name)}</b><small>${esc(a2.category || 'أخرى')} · ${fmtSize(a2.size || 0)}${a2.addedAt ? ' · ' + fmtDate(String(a2.addedAt).slice(0, 10), 'short') : ''}</small></div></li>`).join('')}${docs.length > 6 ? `<li class="dc2-more-l">+${docs.length - 6} مستندات أخرى</li>` : ''}</ul>` : ''}
      </div>`]);
  }
  /* 9. القيمة */
  if (P.total) {
    const f = P.fin, mult = +f.murojSar ? ((+f.partnerSar || 0) + (+f.inkindSar || 0)) / +f.murojSar : 0;
    const parts = [[+f.partnerSar || 0, 'مساهمة الشريك', 'a'], [+f.inkindSar || 0, 'قيمة عينية ومعرفية', 'c'], [+f.murojSar || 0, 'مساهمة المؤسسة', 'b']].filter((x) => x[0]);
    S.push(['mult', 'night', 'القيمة', `
      <div class="mx-mult">
        ${mult >= 1 ? `<div class="mx-eq"><span class="one"><b>1<small class="cur">⃁</small></b>من المؤسسة</span><span class="op">=</span><span class="many"><b data-cnt="${mult.toFixed(1)}" data-dec="1" data-suf="&lt;small class=&quot;cur&quot;&gt;⃁&lt;/small&gt;">${mult.toFixed(1)}<small class="cur">⃁</small></b>من الشريك</span></div><p class="mx-eq-s">${mkE(k('va.s'), `مقابل كل ⃁ تساهم به المؤسسة، يساهم الشريك بنحو ${mult.toFixed(1)} ⃁.`)}</p>` : `<div class="mx-eq solo"><span class="many"><b>${sarShort(P.total)}</b>⃁ قيمة تقديرية</span></div>`}
        ${parts.length ? `<div class="mx-bars-h">${parts.map(([v, l, c], i) => `<div class="${c}" style="--w:${(v / P.total * 100).toFixed(1)}%;--i:${i}"><span>${l}</span><i></i><b>${sarShort(v)}</b></div>`).join('')}</div>` : ''}
        <div class="mx-total"><span>إجمالي القيمة</span><b>${sarShort(P.total)}</b><small>⃁</small></div>
      </div>`]);
  }
  /* 10. التقييم */
  if (P.ev && P.ev.score !== null) {
    const R_ = 120, C = 2 * Math.PI * R_, sc = P.ev.score;
    S.push(['peval', 'paper', 'التقييم', `
      <h2 class="mx-h">${mkE(k('ev.h'), 'نتيجة تقييم الشراكة')}</h2>
      <div class="px-ev2"><svg viewBox="0 0 300 300" class="px-ring ${evalTone(sc)}" aria-hidden="true"><circle cx="150" cy="150" r="${R_}" class="bg"/><circle cx="150" cy="150" r="${R_}" class="v" style="--c:${C.toFixed(1)}" stroke-dasharray="${(sc / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 150 150)"/></svg>
        <div class="px-ev-n">${mxCnt(sc)}<small>من 100</small></div>
        <div class="px-ev-b"><b>${esc(evalGrade(sc))}</b>${(P.ev.data || {}).rec ? `<small>التوصية: ${esc(P.ev.data.rec)}</small>` : ''}${(P.ev.data || {}).date ? `<small>تاريخ التقييم: ${fmtDate(String(P.ev.data.date).slice(0, 10))}</small>` : ''}${(P.valueTypes || []).length ? `<div class="px-vt">${P.valueTypes.slice(0, 5).map((v) => `<span>${esc(v)}</span>`).join('')}</div>` : ''}</div>
      </div>`]);
  }
  /* 11. الختام */
  S.push(['bond', 'night', 'الختام', `
    <div class="mx-grain"></div>
    <svg class="mx-bond2" viewBox="-300 -200 600 400" aria-hidden="true"><circle class="l" r="150"/><circle class="r" r="150"/><circle class="k" cx="0" cy="-131" r="7"/><circle class="k" cx="0" cy="131" r="7"/></svg>
    <div class="mx-end">
      <div class="px-end-lg">${(ASSET_IMG['murooj-logo-white'] || {}).src ? `<img class="mx-logo" src="${ASSET_IMG['murooj-logo-white'].src}" alt="">` : ''}<span class="px-plg">${logoOrMono(pr, name)}</span></div>
      <h2>${mkE(k('end.t'), `شكرًا لشركائنا في ${name}`)}</h2>
      <p>${mkE(k('end.s'), `${org.dept} — ${org.name}`)}</p>
    </div>`]);
  const N = S.length;
  return S.map(([kk, tone, kick, inner], i) => mkFrame(kk, tone, i + 1, N, kick, inner));
}
function mkSlides() {
  const one = mkOne(); if (MK.scope === 'one') return one ? mkSlidesOne(one) : [];
  const X = mkData(), org = X.org;
  if (!X.L.length) return [];
  const yr = new Date().getFullYear();
  const yrs = X.yKeys.length ? (X.yKeys[0] === X.yKeys[X.yKeys.length - 1] ? `${X.yKeys[0]}` : `${X.yKeys[0]}–${X.yKeys[X.yKeys.length - 1]}`) : `${yr}`;
  const S = [];
  /* 1. الغلاف */
  S.push(['seed', 'night', 'الغلاف', `
    <div class="mx-grain"></div>
    ${MK.cover === 'tree' ? mxTree(X) : mxEmblem(X)}
    <div class="mx-seed-t">
      <span class="mx-mast">${esc(org.name)} · تقرير الأثر ${yr}</span>
      <h1 class="mx-title"><span>${mkE('cover.t1', 'تقرير الشراكات')}</span> <em>${mkE('cover.t2', 'والأثر')}</em></h1>
      <p>${mkE('cover.s', `${X.signed.length} شراكة موقّعة مع ${X.partners.length} جهة في ${X.sectors.length || 1} قطاعات.${MK.cover === 'tree' ? ' كل ورقة في الشكل تمثّل شراكة.' : ''}`)}</p>
      ${MK.cover === 'tree' ? '<div class="mx-key"><span><i class="a"></i>سارية</span><span><i class="g"></i>ذهبية</span><span><i class="u"></i>قادمة أو قيد الإعداد</span><span><i class="e"></i>منتهية</span></div>' : `<div class="mx-cv-stats">${[[X.act.length, 'شراكة سارية'], [X.partners.length, 'جهة شريكة'], [X.value ? sarShort(X.value) : X.outputs.length, X.value ? 'قيمة تقديرية ⃁' : 'مخرجًا']].map(([v, l]) => `<div><b>${typeof v === 'number' ? nf(v) : esc(v)}</b><span>${l}</span></div>`).join('')}</div>`}
    </div>`]);
  /* 2. السطر الواحد: كلمة بكلمة */
  const man = rptVal('mk.man.t', `خلال ${yrs} بنينا ${X.signed.length} شراكة مع ${X.partners.length} جهة${X.value ? `، بقيمة تتجاوز ${sarShort(X.value)} ⃁` : ''}، بهدف تحقيق أثر بيئي ملموس وقابل للقياس.`);
  S.push(['line', 'paper', 'الملخص', `
    <span class="mx-qm" aria-hidden="true">“</span>
    <p class="mx-line" data-ek="mk.man.t" data-base="${esc(`خلال ${yrs} بنينا ${X.signed.length} شراكة مع ${X.partners.length} جهة${X.value ? `، بقيمة تتجاوز ${sarShort(X.value)} ⃁` : ''}، بهدف تحقيق أثر بيئي ملموس وقابل للقياس.`)}" contenteditable="true" spellcheck="false">${man.split(/\s+/).map((w, i) => `<span class="${/[0-9٠-٩]/.test(w) ? 'n' : ''}" style="--w:${i}">${esc(w)}</span>`).join(' ')}</p>
    <div class="mx-sig"><i></i>${esc(org.dept)} — ${esc(org.name)}</div>`]);
  /* 3. ثلاثة أرقام عملاقة تمتلئ بالذهب */
  const actPct = X.act.length ? Math.round(X.activated / X.act.length * 100) : 0;
  S.push(['three', 'night', 'بالأرقام', `
    <h2 class="mx-h">${mkE('num.h', 'أبرز الأرقام')}</h2>
    <div class="mx-giants">${[[X.partners.length, mkNum(X.partners.length), 'جهة شريكة'], [X.act.length, mkNum(X.act.length), 'شراكة سارية الآن'], [X.value || X.outputs.length, X.value ? sarShort(X.value).replace(' مليون', 'M').replace(' ألف', 'K') : mkNum(X.outputs.length), X.value ? '⃁ قيمة تقديرية' : 'مخرجًا موثّقًا']].map(([v, t, l], i) => `<div class="mx-gi" style="--i:${i}"><b data-t="${esc(t)}">${esc(t)}</b><span>${l}</span></div>`).join('')}</div>
    <div class="mx-ticker">${[[X.outputs.length, 'مخرجًا موثّقًا'], [actPct + '%', 'نسبة التفعيل'], [X.avgEv === null ? '—' : X.avgEv + '/100', 'متوسط التقييم'], [X.depts.size, 'إدارة داخلية شريكة'], [X.signed.length, 'مذكرة موقّعة']].map(([v, l]) => `<span><b>${esc(String(v))}</b>${l}</span>`).join('<i>✦</i>')}</div>`]);
  /* 4. الشركاء: كوكبة حين يكونون قليلين، وجدار كامل مقسّم حسب القطاع حين يكثرون (كل الجهات تظهر) */
  if (X.partners.length > 18) {
    const secOf = (pr) => { const p = X.L.find((x) => x.partnerId === pr.id); return (p && pSector(p)) || 'جهات أخرى'; };
    const G = {}; X.partners.forEach((pr) => { (G[secOf(pr)] = G[secOf(pr)] || []).push(pr); });
    const grp = Object.entries(G).sort((a, b) => b[1].length - a[1].length);
    let perCol = Math.ceil(X.partners.length / 6); while (grp.reduce((t, [, l]) => t + Math.ceil(l.length / perCol), 0) > 6) perCol++;
    const spans = grp.map(([, l]) => Math.ceil(l.length / perCol)), tot = spans.reduce((t, n) => t + n, 0);
    let k = 0;
    S.push(['wall', 'deep', 'الجهات الشريكة', `
    <h2 class="mx-h">${mkE('pa.h', 'شركاؤنا')}</h2>
    <p class="mx-sub">${mkE('pa.s', `${X.partners.length} جهة شريكة من ${X.sectors.length || 1} قطاعات.`)}</p>
    <div class="mx-wall" style="--c:${tot}">${grp.map(([sec, l], gi) => `<section class="wl-s" style="grid-column:span ${spans[gi]};--cols:${spans[gi]}"><h3><span>${esc(sec)}</span><b>${nf(l.length)}</b></h3>
      <ul>${l.map((pr) => `<li class="wl-t" style="--i:${k++}"><i>${logoOrMono(pr, pr.name)}</i><span>${esc(pr.name)}</span></li>`).join('')}</ul></section>`).join('')}</div>`]);
  } else {
  const PR = X.partners.slice(0, 18), rings = [150, 230, 305];
  const nodes = PR.map((pr, i) => { const ring = i < 6 ? 0 : i < 12 ? 1 : 2, inRing = PR.filter((_, j) => (j < 6 ? 0 : j < 12 ? 1 : 2) === ring).length, idx = i - ring * 6; const a = (idx / inRing) * Math.PI * 2 + ring * 0.5 - Math.PI / 2; return { pr, x: 640 + Math.cos(a) * rings[ring] * 1.25, y: 400 + Math.sin(a) * rings[ring] * 0.62, i }; });
  S.push(['orbit', 'deep', 'الجهات الشريكة', `
    <h2 class="mx-h">${mkE('pa.h', 'شركاؤنا')}</h2>
    <p class="mx-sub">${mkE('pa.s', `${X.partners.length} جهة شريكة من ${X.sectors.length || 1} قطاعات.`)}</p>
    <svg class="mx-orb" viewBox="0 0 1280 720" aria-hidden="true">${rings.map((r, k) => `<ellipse cx="640" cy="400" rx="${r * 1.25}" ry="${r * 0.62}" class="ring" style="--k:${k}"/>`).join('')}${nodes.map((n) => `<line x1="640" y1="400" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" class="ray" style="--i:${n.i}" pathLength="1"/>`).join('')}</svg>
    <div class="mx-core">${(ASSET_IMG['murooj-logo-white'] || {}).src ? `<img src="${ASSET_IMG['murooj-logo-white'].src}" alt="">` : ''}</div>
    ${nodes.map((n) => `<span class="mx-node" style="left:${n.x.toFixed(0)}px;top:${n.y.toFixed(0)}px;--i:${n.i}" title="${esc(n.pr.name)}"><i>${logoOrMono(n.pr, n.pr.name)}</i><small>${esc(n.pr.name)}</small></span>`).join('')}
    ${X.partners.length > PR.length ? `<span class="mx-more">+${X.partners.length - PR.length} جهة أخرى</span>` : ''}`]);
  }
  /* 5. التسلسل الزمني */
  const dated = X.L.filter((p) => parseDate(p.startDate)).sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  if (dated.length >= 2) {
    const t0 = parseDate(dated[0].startDate).getTime(), t1 = Math.max(parseDate(dated[dated.length - 1].startDate).getTime(), t0 + 1);
    const P = (f) => { const x = 1180 - f * 1080; const y = 470 + Math.sin(f * Math.PI * 2.2) * 70; return [x, y]; };
    let d = ''; for (let k = 0; k <= 60; k++) { const [x, y] = P(k / 60); d += (k ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    const yrsL = []; for (let y = new Date(t0).getFullYear(); y <= new Date(t1).getFullYear(); y++) yrsL.push(y);
    S.push(['river', 'paper', 'التسلسل الزمني', `
      <h2 class="mx-h">${mkE('gr.h', 'نمو الشراكات عبر السنوات')}</h2>
      <p class="mx-sub">${mkE('gr.s', `من أول شراكة في ${fmtDate(dated[0].startDate)} إلى اليوم: ${dated.length} شراكة.`)}</p>
      <svg class="mx-riv" viewBox="0 0 1280 720" aria-hidden="true"><path d="${d}" class="bed"/><path d="${d}" class="flow" pathLength="1"/>
        ${yrsL.map((y) => { const f = (new Date(y, 0, 1).getTime() - t0) / (t1 - t0); if (f < 0 || f > 1) return ''; const [x, yy] = P(f); return `<g class="yr"><line x1="${x}" x2="${x}" y1="${yy + 24}" y2="${yy + 60}"/><text x="${x}" y="${yy + 80}" text-anchor="middle">${y}</text></g>`; }).join('')}
        ${dated.map((p, i) => { const f = (parseDate(p.startDate).getTime() - t0) / (t1 - t0); const [x, y] = P(f); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.golden ? 10 : 7}" class="dt ${p.golden ? 'g' : ''}" style="--i:${i}" data-f="${f.toFixed(4)}"/>`; }).join('')}</svg>
      ${dated.map((p, i) => { const pr = partnerById(p.partnerId); return `<div class="mx-rcard" data-i="${i}"><span class="lg">${logoOrMono(pr, partnerName(p))}</span><span class="tx"><em>${fmtDate(p.startDate)}</em><b>${esc(partnerName(p))}</b><small>${esc([pSector(p), statusLabel(pStatus(p))].filter(Boolean).join(' · '))}</small></span><i class="n">${i + 1}</i></div>`; }).join('')}
      ${[dated[0], dated[dated.length - 1]].map((p, k) => { const f = (parseDate(p.startDate).getTime() - t0) / (t1 - t0); const [x, y] = P(f); return `<div class="mx-call ${k ? 'end' : 'start'}" style="left:${Math.max(40, Math.min(1000, x - 120)).toFixed(0)}px;top:${(y - 150).toFixed(0)}px"><em>${k ? 'الأحدث' : 'البداية'}</em><b>${esc(partnerName(p))}</b><span>${fmtDate(p.startDate)}</span></div>`; }).join('')}`]);
  }
  /* 6. بطاقات النجوم */
  if (X.stars.length) {
    S.push(['cards', 'night', X.L.some((p) => p.golden) ? 'الشراكات الذهبية' : 'أبرز الشراكات', `
      <h2 class="mx-h gold">${mkE('st.h', X.L.some((p) => p.golden) ? 'الشراكات الذهبية' : 'أبرز الشراكات')}</h2>
      <div class="mx-cards n${X.stars.length}">${X.stars.map((p, i) => { const pr = partnerById(p.partnerId) || {}; const P = pProfile(p); const ph = p.coverFileId || ((p.attachments || []).find((a) => isImg(a)) || {}).fileId; return `<article style="--i:${i}">
        <div class="mx-foil"></div>
        <div class="mx-c-ph">${ph ? mkImg(ph) : ''}<span class="mx-c-no">${String(i + 1).padStart(2, '0')}</span></div>
        <div class="mx-c-logo">${logoOrMono(pr, partnerName(p))}</div>
        <h3>${esc(partnerName(p))}</h3><small>${[p.classification, pSector(p)].filter(Boolean).map(esc).join(' · ')}</small>
        <div class="mx-c-stats"><span><b>${P.ev && P.ev.score !== null ? P.ev.score : '—'}</b>تقييم</span><span><b>${richItems(p.outputs).length || '—'}</b>مخرجات</span><span><b>${P.total ? sarShort(P.total).replace(' مليون', 'M').replace(' ألف', 'K') : '—'}</b>قيمة</span></div>
      </article>`; }).join('')}</div>`]);
  }
  /* 7. من الميدان */
  X.stories.slice(0, 2).forEach((s, i) => {
    const ph = (s.gallery || [])[0] || (X.photos[i + 1] || {}).id;
    const pr = typeof storyPartner === 'function' ? storyPartner(s) : null;
    const mv = String(s.metricValue || '').replace(/[^\d.]/g, '');
    S.push(['field', 'film', 'من الميدان', `
      <div class="mx-film">${ph ? mkImg(ph) : ''}</div><span class="mx-bars"></span>
      <div class="mx-field">
        <span class="mx-tag">${esc(pr ? pr.name : 'قصة نجاح')}</span>
        ${s.metricValue ? `<div class="mx-metric">${mv ? `<b data-cnt="${mv}" data-fmt="1">${esc(s.metricValue)}</b>` : `<b>${esc(s.metricValue)}</b>`}<span>${esc(s.metricLabel || '')}</span></div>` : ''}
        <h2>${mkE(`sto.${i}.t`, s.title)}</h2>
        <p>${mkE(`sto.${i}.q`, trimP(s.summary || '').slice(0, 220), 'span')}</p>
      </div>`]);
  });
  /* 8. حلقات الأثر */
  const rows = (X.goals.some((g) => g.n) ? X.goals.filter((g) => g.n).map((g) => [g.k, g.n, g.t.replace(/^[A-Z]{1,3}\d?\s*[:：]\s*/, '')]) : X.sectors.map(([k, n]) => [k, n, ''])).slice(0, 5);
  const rMax = Math.max(1, ...rows.map((r) => r[1]));
  const pts = (X.impacts.length ? X.impacts : X.outputs).slice(0, 3);
  S.push(['rings', 'paper', 'التوزيع', `
    <h2 class="mx-h">${mkE('im.h', X.goals.some((g) => g.n) ? 'الشراكات حسب الأهداف الاستراتيجية' : 'الشراكات حسب القطاع')}</h2>
    <svg class="mx-rings" viewBox="-200 -200 400 400" aria-hidden="true">${rows.map((r, k) => { const rad = 170 - k * 30, C = 2 * Math.PI * rad, f = r[1] / rMax * 0.82; return `<circle r="${rad}" class="bg"/><circle r="${rad}" class="v" style="--k:${k};--c:${C.toFixed(1)}" stroke-dasharray="${(f * C).toFixed(1)} ${C.toFixed(1)}"/>`; }).join('')}<text y="10" text-anchor="middle" class="ct">${X.L.length}</text><text y="34" text-anchor="middle" class="cs">شراكة</text></svg>
    <ul class="mx-rl">${rows.map((r, k) => `<li style="--k:${k}"><i></i><b>${esc(r[0])}</b><span>${r[2] ? esc(r[2].slice(0, 46)) : ''}</span><em>${r[1]}</em></li>`).join('')}</ul>
    <div class="mx-quotes">${pts.map((x, i) => `<blockquote style="--i:${i}">${esc(x.t.slice(0, 120))}<cite>${esc(partnerName(x.p))}</cite></blockquote>`).join('')}</div>`]);
  /* 9. مضاعف الأثر */
  if (X.value) {
    const mult = X.fin.muroj ? (X.fin.partner + X.fin.inkind) / X.fin.muroj : 0;
    const parts = [[X.fin.partner, 'مساهمات الشركاء', 'a'], [X.fin.inkind, 'قيمة عينية ومعرفية', 'c'], [X.fin.muroj, 'مساهمة المؤسسة', 'b']].filter((x) => x[0]);
    S.push(['mult', 'night', 'القيمة', `
      <div class="mx-mult">
        ${mult >= 1 ? `<div class="mx-eq"><span class="one"><b>1<small class="cur">⃁</small></b>من المؤسسة</span><span class="op">=</span><span class="many"><b data-cnt="${mult.toFixed(1)}" data-dec="1" data-suf="&lt;small class=&quot;cur&quot;&gt;⃁&lt;/small&gt;">${mult.toFixed(1)}<small class="cur">⃁</small></b>من الشركاء</span></div><p class="mx-eq-s">${mkE('va.s', `مقابل كل ⃁ تساهم به المؤسسة، يساهم الشركاء بنحو ${mult.toFixed(1)} ⃁.`)}</p>` : `<div class="mx-eq solo"><span class="many"><b>${sarShort(X.value)}</b>⃁ قيمة تقديرية</span></div>`}
        <div class="mx-bars-h">${parts.map(([v, l, c], i) => `<div class="${c}" style="--w:${(v / X.value * 100).toFixed(1)}%;--i:${i}"><span>${l}</span><i></i><b>${sarShort(v)}</b></div>`).join('')}</div>
        <div class="mx-total"><span>إجمالي القيمة</span><b>${sarShort(X.value)}</b><small>⃁</small></div>
      </div>`]);
  }
  /* 10. الخطوات القادمة */
  const hzCols = [
    { n: X.props.length, l: 'مقترحات قيد الدراسة', d: 'وصلت من الإدارات عبر «شارك»', ic: 'send', items: X.props.map((x) => [x.partnerName || x.title || '—', propStatusLabel(x.status)]) },
    { n: X.pipe.length, l: 'شراكات تقترب من التوقيع', d: 'في مراحل المذكرة والاعتماد', ic: 'convert', items: X.pipe.map((p) => { const w = wfStateOf('partnership', p); return [partnerName(p), w.cur ? `المرحلة ${w.cur.n} من ${WF_STEPS.length}` : stageLabel(p.stage)]; }) },
    { n: X.soon.length, l: 'فرص تجديد وتوسّع', d: 'شراكات سارية تقترب من نهايتها', ic: 'history', items: X.soon.map((p) => [partnerName(p), daysLeft(p) !== null ? `تنتهي خلال ${nf(daysLeft(p))} يومًا` : 'تنتهي قريبًا']) },
  ];
  S.push(['horizon', 'dawn', 'الخطوات القادمة', `
    <div class="mx-sun"></div><svg class="mx-hz" viewBox="0 0 1280 720" preserveAspectRatio="none" aria-hidden="true"><path d="M0 610 Q 640 540 1280 610 L1280 720 L0 720Z"/><path d="M0 640 Q 640 575 1280 640" class="l"/></svg>
    <h2 class="mx-h">${mkE('nx.h', 'الفرص القادمة')}</h2>
    <p class="mx-sub">${mkE('nx.s', `${nf(hzCols.reduce((t, c) => t + c.n, 0))} فرصة على طاولة إدارة الشراكات الآن`)}</p>
    <div class="mx-hz2">${hzCols.map((c, ci) => `<div class="hz-c" style="--i:${ci}"><div class="hz-top"><span class="hz-ic">${icon(c.ic)}</span>${mxCnt(c.n)}</div><h3>${c.l}</h3><small class="hz-d">${c.d}</small>
      <ul>${c.items.slice(0, 4).map(([a, b], k) => `<li style="--k:${k}"><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('') || '<li class="none"><span>لا توجد حاليًا</span></li>'}</ul>${c.items.length > 4 ? `<em class="hz-more">+${nf(c.items.length - 4)} أخرى</em>` : ''}</div>`).join('')}</div>`]);
  /* 11. الختام: حلقتان تتشابكان */
  S.push(['bond', 'night', 'الختام', `
    <div class="mx-grain"></div>
    <svg class="mx-bond2" viewBox="-300 -200 600 400" aria-hidden="true"><circle class="l" r="150"/><circle class="r" r="150"/><circle class="k" cx="0" cy="-131" r="7"/><circle class="k" cx="0" cy="131" r="7"/></svg>
    <div class="mx-end">
      ${(ASSET_IMG['murooj-logo-white'] || {}).src ? `<img class="mx-logo" src="${ASSET_IMG['murooj-logo-white'].src}" alt="">` : ''}
      <h2>${mkE('end.t', 'نرحب بالشراكات الجديدة')}</h2>
      <p>${mkE('end.s', `${org.dept} — ${org.name}`)}</p>
    </div>`]);
  const N = S.length;
  return S.map(([k, tone, kick, inner], i) => mkFrame(k, tone, i + 1, N, kick, inner));
}
/* تشغيل المشهد: الحركة عبر CSS، والعدّادات عبر JS */
function mkPlay(sl) {
  if (!sl || sl.classList.contains('play')) return;
  sl.classList.add('play');
  if (typeof mkFxStart === 'function') try { mkFxStart(sl); } catch (_) { /* المؤثرات ليست حرجة */ }
  sl.querySelectorAll('[data-cnt]').forEach((b) => {
    const to = +b.dataset.cnt, dec = +b.dataset.dec || 0, fmt = b.dataset.fmt, t0 = performance.now(), d = 1500;
    const step = (t) => { const k = Math.min(1, (t - t0) / d), v = to * (1 - Math.pow(1 - k, 3)); const txt = dec ? v.toFixed(dec) : nf(Math.round(v)); if (b.dataset.suf) b.innerHTML = txt + b.dataset.suf; else b.textContent = txt; /* اللاحقة (علامة الريال) تبقى أثناء العدّ */ if (k < 1) requestAnimationFrame(step); };
    setTimeout(() => requestAnimationFrame(step), 500);
  });
}

/* — الصفحة — */
function renderMarketingReport(el, r) {
  if (!can('view.reports')) { el.innerHTML = noAccessHTML(); return; }
  const qp = r && r.query && r.query.p; if (qp && mkPool().some((p) => p.id === qp)) { MK.scope = 'one'; MK.pid = qp; }
  if (MK.scope === 'picked') MK.scope = 'all';
  el.classList.add('mkpage');
  const draw = () => {
    const S = mkSlides();
    el.innerHTML = `<section class="mk-head">
        <div class="mk-head-t">${retLinkHTML('#/reports', 'استوديو التقارير')}<span class="rx-eye"><i></i>التقرير التسويقي</span><h1>${mkOne() ? esc(partnerName(mkOne())) : 'التقرير التسويقي'}</h1>
          <p>${mkOne() ? `تقرير تسويقي لهذه الشراكة في ${S.length} شرائح مبنية من بياناتها` : `أعمال الشراكات وإنجازاتها وأثرها في ${S.length} شرائح مبنية من البيانات`} لحظة العرض. اضغط أي عنوان لتعديله قبل العرض.</p></div>
        <div class="mk-head-a"><button class="btn gold lg" type="button" data-mkshow ${S.length ? '' : 'disabled'}>${icon('play')} عرض بملء الشاشة</button><button class="btn lg" type="button" data-mkpdf ${S.length ? '' : 'disabled'}>${icon('print')} PDF</button><button class="btn lg" type="button" data-mkvideo ${S.length ? '' : 'disabled'} title="يُسجَّل العرض الحالي بالبيانات الحالية ويُنزَّل ملف فيديو">${icon('play')} فيديو</button></div>
      </section>
      <div class="mk-scope" role="tablist" aria-label="نطاق التقرير">
        <div class="mk-mode"><button type="button" class="${MK.scope !== 'one' ? 'on' : ''}" data-mkmode="all">${icon('layers')} كل الشراكات</button><button type="button" class="${MK.scope === 'one' ? 'on' : ''}" data-mkmode="one">${icon('file')} شراكة واحدة</button></div>
        ${MK.scope === 'one' ? `<select class="in mk-pick" id="mkPick" aria-label="اختر الشراكة"><option value="">اختر الشراكة…</option>${mkPool().sort((a, b) => partnerName(a).localeCompare(partnerName(b), 'ar')).map((p) => `<option value="${p.id}" ${p.id === MK.pid ? 'selected' : ''}>${esc(partnerName(p))}${p.title && partnerById(p.partnerId) && p.title !== partnerById(p.partnerId).name ? ' — ' + esc(p.title) : ''} (${esc(p.code || '')})</option>`).join('')}</select>`
        : MK_SCOPES.map(([k, l, f]) => { const n = mkPool().filter(f).length; return `<button type="button" class="${MK.scope === k ? 'on' : ''}" data-mkscope="${k}" ${n ? '' : 'disabled'}>${esc(l)}<b>${n}</b></button>`; }).join('')}${MK.scope !== 'one' ? `<div class="mk-mode mk-cover" title="شكل غلاف التقرير"><button type="button" class="${MK.cover !== 'tree' ? 'on' : ''}" data-mkcover="formal">غلاف رسمي</button><button type="button" class="${MK.cover === 'tree' ? 'on' : ''}" data-mkcover="tree">غلاف الشجرة</button></div>` : ''}<span class="sp"></span>${mkOne() && (mkOne().attachments || []).some((a2) => !isImg(a2)) ? `<label class="mk-tog" title="عند الإخفاء تبقى الصور فقط، ولا تُطبع المستندات"><span class="switch"><input type="checkbox" data-mkdocs ${MK.docs === false ? '' : 'checked'}><i></i></span>المستندات في التقرير والطباعة</label>` : ''}<button type="button" class="linkbtn" data-mkreset>${icon('history')} استعادة النصوص الأصلية</button></div>
      <div class="mk-deck" id="mkDeck">${S.length ? S.map((s, i) => `<div class="mk-fr" data-i="${i}">${s}</div>`).join('') : `<div class="panel">${MK.scope === 'one' ? emptyHTML({ ic: 'file', title: 'اختر الشراكة', text: 'اختر من القائمة أعلاه الشراكة التي تريد تقريرها التسويقي.' }) : emptyHTML({ ic: 'file', title: 'لا توجد شراكات في هذا النطاق', text: 'اختر نطاقًا آخر.' })}</div>`}</div>`;
    hydrateFiles(el);
    fit();
    mkFitText(el); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => mkFitText(el));
    /* كل مشهد يبدأ حركته عند ظهوره في المعاينة */
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { mkPlay(e.target); io.unobserve(e.target); } }), { threshold: 0.35 }) : null;
    $$('#mkDeck .rs2.mk', el).forEach((sl) => { sl.classList.add('mk-anim'); io ? io.observe(sl) : mkPlay(sl); });
  };
  const fit = () => { const w = ($('#mkDeck', el) || {}).clientWidth || 1000; const k = Math.min(1, w / 1280); $$('.mk-fr', el).forEach((f) => { f.style.height = 720 * k + 'px'; const s = f.firstElementChild; if (s) s.style.transform = `scale(${k})`; }); };
  draw();
  App.mkFit = fit; window.removeEventListener('resize', App.mkFitL || (() => {})); App.mkFitL = () => fit(); window.addEventListener('resize', App.mkFitL);
  el.addEventListener('input', (e) => { const t = e.target.closest('[data-ek]'); if (t) RPT.ov[t.dataset.ek] = { v: t.innerText.replace(/ /g, ' ').trim(), base: t.dataset.base }; });
  el.addEventListener('change', (e) => { if (e.target.id === 'mkPick') { MK.pid = e.target.value; draw(); } if (e.target.matches('[data-mkdocs]')) { MK.docs = e.target.checked; draw(); } });
  el.addEventListener('keydown', (e) => { const t = e.target.closest && e.target.closest('[data-ek]'); if (t && e.key === 'Enter') { e.preventDefault(); t.blur(); } });
  el.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-mkscope]'); if (sc) { MK.scope = sc.dataset.mkscope; return draw(); }
    const md = e.target.closest('[data-mkmode]'); if (md) { if (md.dataset.mkmode === 'one') { MK.scope = 'one'; if (!MK.pid || !mkPool().some((p) => p.id === MK.pid)) MK.pid = (mkPool()[0] || {}).id; } else if (MK.scope === 'one') MK.scope = 'all'; return draw(); }
    if (e.target.closest('[data-mkreset]')) { Object.keys(RPT.ov).filter((k) => k.startsWith('mk.')).forEach((k) => delete RPT.ov[k]); toast('استُعيدت النصوص الأصلية'); return draw(); }
    if (e.target.closest('[data-mkshow]')) return openReportShow(0, $$('#mkDeck .rs2', el));
    const cv = e.target.closest('[data-mkcover]'); if (cv) { MK.cover = cv.dataset.mkcover; try { localStorage.setItem('shk_mk_cover', MK.cover); } catch (_) { /* */ } return draw(); }
    if (e.target.closest('[data-mkvideo]')) return mkVideo($$('#mkDeck .rs2', el));
    if (e.target.closest('[data-mkpdf]')) {
      const one = mkOne(), title = 'التقرير-التسويقي-' + (one ? partnerName(one).replace(/\s+/g, '-') + '-' : '') + isoDate(today());
      const withDocs = one && MK.docs !== false && (one.attachments || []).some((a2) => a2.fileId && !isImg(a2));
      if (!withDocs) { prepareReportPrint($$('#mkDeck .rs2', el), title); setTimeout(() => window.print(), 300); return; }
      const b = e.target.closest('[data-mkpdf]'); b.disabled = true; const old = b.innerHTML;
      mkAppendixHTML(one, (i, n, name) => { b.innerHTML = `${icon('history')} تجهيز المستندات ${i}/${n}…`; }).then((extra) => {
        prepareReportPrint($$('#mkDeck .rs2', el), title, extra); setTimeout(() => window.print(), 400);
      }).catch(() => toast('تعذّر تجهيز المستندات للطباعة', 'err')).finally(() => { b.disabled = false; b.innerHTML = old; });
    }
  });
}

window.addEventListener('beforeprint', () => { if (App.route && App.route.name === 'reportsMk' && !document.documentElement.classList.contains('printing-report')) { const n = $$('#mkDeck .rs2'); if (n.length) prepareReportPrint(n, 'التقرير-التسويقي-' + isoDate(today())); } });
