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
  const lineDef = `${s0 ? `منذ ${fmtDate(p.startDate)} ` : ''}تجمع ${p.classification || 'شراكة'} بين ${org.name} و${name}${goal ? `، في ${goal.slice(0, 90)}` : ''}.`;
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
        <p>${mkE(k('pp.s'), trimP(pr.notes || '').slice(0, 260) || `${pr.name} شريك ${org.name} في ${pSector(p) ? 'القطاع ' + pSector(p) : 'هذه الشراكة'}.`)}</p>
        ${others.length ? `<div class="px-pp-others"><small>شراكات أخرى مع الجهة</small>${others.slice(0, 4).map((o) => `<span>${esc(o.title || o.code || '')}<em>${esc(statusLabel(pStatus(o)))}</em></span>`).join('')}</div>` : ''}
      </div></div>`]);
  /* 5. مجالات التعاون — كلها، ست بطاقات في كل شريحة */
  const pages = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
  pages(coop, 6).forEach((part, pi, all) => S.push(['pcoop', 'paper', 'مجالات التعاون', `
    <h2 class="mx-h">${mkE(k('co.h' + (pi || '')), 'مجالات التعاون' + (all.length > 1 ? ` (${pi + 1}/${all.length})` : ''))}</h2>
    <div class="px-coop n${part.length}">${part.map((c, i) => `<article style="--i:${i}"><em>${String(pi * 6 + i + 1).padStart(2, '0')}</em><b>${esc(trimP(c.t || c.x).slice(0, 90))}</b>${c.t && c.x ? `<p>${esc(trimP(c.x).slice(0, 150))}</p>` : ''}</article>`).join('')}</div>`]));
  /* 6. المخرجات — كلها */
  pages(outs, 6).forEach((part, pi, all) => S.push(['pout', 'night', 'المخرجات', `
    <h2 class="mx-h">${mkE(k('ou.h' + (pi || '')), 'المخرجات المستهدفة' + (all.length > 1 ? ` (${pi + 1}/${all.length})` : ''))}</h2>
    <div class="px-out one"><div class="px-out-l"><small>إسناد مشاريع وبناء مبادرات</small><ol start="${pi * 6 + 1}" style="counter-reset:o ${pi * 6}">${part.map((o, i) => `<li style="--i:${i}">${esc(o.slice(0, 160))}</li>`).join('')}</ol></div></div>`]));
  /* 6ب. الأثر المتوقع — كله */
  pages(imps, 4).forEach((part, pi, all) => S.push(['pimp', 'deep', 'الأثر المتوقع', `
    <h2 class="mx-h">${mkE(k('im.h' + (pi || '')), 'الأثر المتوقع وكيف يخدم المؤسسة' + (all.length > 1 ? ` (${pi + 1}/${all.length})` : ''))}</h2>
    <div class="px-imp n${part.length}">${part.map((o, i) => { const m = o.match(/^([^:：]{3,60})[:：]\s*(.+)$/); return `<article style="--i:${i}"><i>${icon('leaf')}</i>${m ? `<b>${esc(m[1])}</b><p>${esc(m[2].slice(0, 170))}</p>` : `<p>${esc(o.slice(0, 200))}</p>`}</article>`; }).join('')}</div>`]));
  /* 6ج. الفريق والإدارات والتفعيل */
  const own = p.owners || [], deps = p.departments || [];
  if (own.length || deps.length || p.activation) S.push(['pteam', 'paper', 'فريق العمل', `
    <h2 class="mx-h">${mkE(k('tm2.h'), 'فريق العمل والإدارات المشاركة')}</h2>
    <div class="px-team">
      <div class="px-team-c"><small>المسؤولون من ${esc(org.dept)}</small><div class="px-people">${own.length ? own.map((o, i) => `<span style="--i:${i}"><i>${esc(initials(o))}</i>${esc(o)}</span>`).join('') : '<em>لم يُحدَّد بعد</em>'}</div></div>
      <div class="px-team-c"><small>الإدارات الداخلية المتقاطعة</small><div class="px-deps">${deps.length ? deps.map((d, i) => `<span style="--i:${i}">${icon('building')}${esc(d)}</span>`).join('') : '<em>لم تُحدَّد بعد</em>'}</div></div>
      <div class="px-team-c px-act ${p.activation === 'مفعّلة' ? 'ok' : p.activation === 'قيد التفعيل' ? 'mid' : ''}"><small>حالة التفعيل</small><b>${esc(p.activation || 'غير محدد')}</b><span>${p.activation === 'مفعّلة' ? 'بدأ تنفيذ المخرجات ورفع تقارير التفعيل' : p.activation === 'قيد التفعيل' ? 'خطة التفعيل قيد التنفيذ مع الإدارات' : 'لم تبدأ خطة التفعيل بعد'}</span></div>
    </div>`]);
  /* 6د. الارتباط بالأهداف الاستراتيجية */
  const gl = (p.goalsLinked || []).map((g) => (goalCodes().find((x) => x.k === g) || {}).t || g).filter(Boolean);
  if (gl.length || p.strategicGoal || p.initiative) S.push(['pgoal', 'deep', 'الأهداف الاستراتيجية', `
    <h2 class="mx-h">${mkE(k('gl.h'), 'الارتباط بأهداف المؤسسة')}</h2>
    <div class="px-goals">${[...(p.strategicGoal ? [['الهدف الاستراتيجي', p.strategicGoal]] : []), ...(p.initiative ? [['المبادرة', p.initiative]] : []), ...gl.map((g) => ['هدف مرتبط', g])].slice(0, 6).map(([l, t], i) => `<div style="--i:${i}"><small>${esc(l)}</small><b>${esc(String(t).slice(0, 110))}</b></div>`).join('')}</div>`]);
  /* 7. المسار الزمني للشراكة */
  const ev = [];
  if (s0) ev.push([p.startDate, 'بداية الشراكة', 'a']);
  evs.forEach((e) => ev.push([e.data.date || e.at, `تقييم${e.data && evalScore(e.data) != null ? ': ' + evalScore(e.data) + '/100' : ''}`, 'b']));
  stories.forEach((s) => s.date && ev.push([s.date, trimP(s.title || 'إنجاز').slice(0, 40), 'c']));
  if (e0) ev.push([p.endDate, 'نهاية المدة الحالية', 'd']);
  const evS = ev.filter((x) => parseDate(String(x[0]).slice(0, 10))).sort((a, b) => (String(a[0]) < String(b[0]) ? -1 : 1)).slice(0, 7);
  if (evS.length >= 2) {
    const t0 = parseDate(String(evS[0][0]).slice(0, 10)).getTime(), t1 = Math.max(parseDate(String(evS[evS.length - 1][0]).slice(0, 10)).getTime(), t0 + 1), now = today().getTime();
    const X_ = (t) => 1160 - Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) * 1040;
    const nowF = Math.max(0, Math.min(1, (now - t0) / (t1 - t0)));
    S.push(['ptime', 'paper', 'المسار الزمني', `
      <h2 class="mx-h">${mkE(k('tm.h'), 'المسار الزمني للشراكة')}</h2>
      <div class="px-tl"><i class="px-tl-bed"></i><i class="px-tl-done" style="--f:${nowF.toFixed(3)}"></i>
        ${now > t0 && now < t1 ? `<span class="px-now" style="left:${X_(now).toFixed(0)}px">اليوم</span>` : ''}
        ${evS.map(([d, t, c], i) => `<div class="px-ev ${c} ${i % 2 ? 'dn' : 'up'}" style="left:${X_(parseDate(String(d).slice(0, 10)).getTime()).toFixed(0)}px;--i:${i}"><i></i><span><b>${esc(t)}</b><small>${fmtDate(String(d).slice(0, 10))}</small></span></div>`).join('')}
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
      <div class="px-wf">${WF_PHASES.map((ph, pi) => { const st = WF_STEPS.filter((x) => x.ph === ph.id); const d = st.filter((x) => W.S[x.id] && W.S[x.id].status === 'done').length; const cur = W.cur && st.some((x) => x.id === W.cur.id); return `<div class="px-ph ${d === st.length ? 'd' : cur ? 'c' : ''}" style="--i:${pi}"><em>${String(pi + 1).padStart(2, '0')}</em><b>${esc(ph.t)}</b><span class="px-ph-bar"><i style="width:${Math.round(d / st.length * 100)}%"></i></span><small>${d}/${st.length}</small></div>`; }).join('')}</div>`]);
  } catch (_) { /* المسار اختياري */ }
  /* 8ج. الوثائق الموثّقة */
  const docsBy = {}; (p.attachments || []).forEach((a2) => { const c2 = a2.category || 'أخرى'; docsBy[c2] = (docsBy[c2] || 0) + 1; });
  const dk = Object.entries(docsBy);
  if (dk.length) S.push(['pdocs', 'night', 'الوثائق', `
    <h2 class="mx-h">${mkE(k('dc.h'), 'وثائق ومرفقات موثّقة')}</h2>
    <div class="px-docs">${dk.map(([c2, n], i) => `<div style="--i:${i}"><i>${icon(FILE_CAT_IC && FILE_CAT_IC[c2] || 'file')}</i><b>${n}</b><span>${esc(c2)}</span></div>`).join('')}</div>`]);
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
    ${mxTree(X)}
    <div class="mx-seed-t">
      <span class="mx-mast">${esc(org.name)} · تقرير الأثر ${yr}</span>
      <h1 class="mx-title"><span>${mkE('cover.t1', 'تقرير الشراكات')}</span> <em>${mkE('cover.t2', 'والأثر')}</em></h1>
      <p>${mkE('cover.s', `${X.signed.length} شراكة موقّعة مع ${X.partners.length} جهة في ${X.sectors.length || 1} قطاعات. كل ورقة في الشكل تمثّل شراكة.`)}</p>
      <div class="mx-key"><span><i class="a"></i>سارية</span><span><i class="g"></i>ذهبية</span><span><i class="u"></i>قادمة أو قيد الإعداد</span><span><i class="e"></i>منتهية</span></div>
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
  /* 4. كوكبة الشركاء */
  const PR = X.partners.slice(0, 18), rings = [150, 230, 305];
  const nodes = PR.map((pr, i) => { const ring = i < 6 ? 0 : i < 12 ? 1 : 2, inRing = PR.filter((_, j) => (j < 6 ? 0 : j < 12 ? 1 : 2) === ring).length, idx = i - ring * 6; const a = (idx / inRing) * Math.PI * 2 + ring * 0.5 - Math.PI / 2; return { pr, x: 640 + Math.cos(a) * rings[ring] * 1.25, y: 400 + Math.sin(a) * rings[ring] * 0.62, i }; });
  S.push(['orbit', 'deep', 'الجهات الشريكة', `
    <h2 class="mx-h">${mkE('pa.h', 'شركاؤنا')}</h2>
    <p class="mx-sub">${mkE('pa.s', `${X.partners.length} جهة شريكة من ${X.sectors.length || 1} قطاعات.`)}</p>
    <svg class="mx-orb" viewBox="0 0 1280 720" aria-hidden="true">${rings.map((r, k) => `<ellipse cx="640" cy="400" rx="${r * 1.25}" ry="${r * 0.62}" class="ring" style="--k:${k}"/>`).join('')}${nodes.map((n) => `<line x1="640" y1="400" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" class="ray" style="--i:${n.i}" pathLength="1"/>`).join('')}</svg>
    <div class="mx-core">${(ASSET_IMG['murooj-logo-white'] || {}).src ? `<img src="${ASSET_IMG['murooj-logo-white'].src}" alt="">` : ''}</div>
    ${nodes.map((n) => `<span class="mx-node" style="left:${n.x.toFixed(0)}px;top:${n.y.toFixed(0)}px;--i:${n.i}" title="${esc(n.pr.name)}"><i>${logoOrMono(n.pr, n.pr.name)}</i><small>${esc(n.pr.name)}</small></span>`).join('')}
    ${X.partners.length > PR.length ? `<span class="mx-more">+${X.partners.length - PR.length} جهة أخرى</span>` : ''}`]);
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
        ${dated.map((p, i) => { const f = (parseDate(p.startDate).getTime() - t0) / (t1 - t0); const [x, y] = P(f); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.golden ? 10 : 7}" class="dt ${p.golden ? 'g' : ''}" style="--i:${i}"/>`; }).join('')}</svg>
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
  S.push(['horizon', 'dawn', 'الخطوات القادمة', `
    <div class="mx-sun"></div><svg class="mx-hz" viewBox="0 0 1280 720" preserveAspectRatio="none" aria-hidden="true"><path d="M0 560 Q 640 470 1280 560 L1280 720 L0 720Z"/><path d="M0 600 Q 640 520 1280 600" class="l"/></svg>
    <h2 class="mx-h">${mkE('nx.h', 'الفرص القادمة')}</h2>
    <div class="mx-rise">${[[X.props.length, 'مقترح قيد الدراسة', 'send'], [X.pipe.length, 'شراكة تقترب من التوقيع', 'convert'], [X.soon.length, 'فرصة تجديد وتوسع', 'history']].map(([v, l, ic], i) => `<div style="--i:${i}"><span>${icon(ic)}</span>${mxCnt(v)}<small>${l}</small></div>`).join('')}</div>`]);
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
        <div class="mk-head-a"><button class="btn gold lg" type="button" data-mkshow ${S.length ? '' : 'disabled'}>${icon('play')} عرض بملء الشاشة</button><button class="btn lg" type="button" data-mkpdf ${S.length ? '' : 'disabled'}>${icon('print')} PDF</button></div>
      </section>
      <div class="mk-scope" role="tablist" aria-label="نطاق التقرير">
        <div class="mk-mode"><button type="button" class="${MK.scope !== 'one' ? 'on' : ''}" data-mkmode="all">${icon('layers')} كل الشراكات</button><button type="button" class="${MK.scope === 'one' ? 'on' : ''}" data-mkmode="one">${icon('file')} شراكة واحدة</button></div>
        ${MK.scope === 'one' ? `<select class="in mk-pick" id="mkPick" aria-label="اختر الشراكة"><option value="">اختر الشراكة…</option>${mkPool().sort((a, b) => partnerName(a).localeCompare(partnerName(b), 'ar')).map((p) => `<option value="${p.id}" ${p.id === MK.pid ? 'selected' : ''}>${esc(partnerName(p))}${p.title && partnerById(p.partnerId) && p.title !== partnerById(p.partnerId).name ? ' — ' + esc(p.title) : ''} (${esc(p.code || '')})</option>`).join('')}</select>`
        : MK_SCOPES.map(([k, l, f]) => { const n = mkPool().filter(f).length; return `<button type="button" class="${MK.scope === k ? 'on' : ''}" data-mkscope="${k}" ${n ? '' : 'disabled'}>${esc(l)}<b>${n}</b></button>`; }).join('')}<span class="sp"></span><button type="button" class="linkbtn" data-mkreset>${icon('history')} استعادة النصوص الأصلية</button></div>
      <div class="mk-deck" id="mkDeck">${S.length ? S.map((s, i) => `<div class="mk-fr" data-i="${i}">${s}</div>`).join('') : `<div class="panel">${MK.scope === 'one' ? emptyHTML({ ic: 'file', title: 'اختر الشراكة', text: 'اختر من القائمة أعلاه الشراكة التي تريد تقريرها التسويقي.' }) : emptyHTML({ ic: 'file', title: 'لا توجد شراكات في هذا النطاق', text: 'اختر نطاقًا آخر.' })}</div>`}</div>`;
    hydrateFiles(el);
    fit();
    /* كل مشهد يبدأ حركته عند ظهوره في المعاينة */
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { mkPlay(e.target); io.unobserve(e.target); } }), { threshold: 0.35 }) : null;
    $$('#mkDeck .rs2.mk', el).forEach((sl) => { sl.classList.add('mk-anim'); io ? io.observe(sl) : mkPlay(sl); });
  };
  const fit = () => { const w = ($('#mkDeck', el) || {}).clientWidth || 1000; const k = Math.min(1, w / 1280); $$('.mk-fr', el).forEach((f) => { f.style.height = 720 * k + 'px'; const s = f.firstElementChild; if (s) s.style.transform = `scale(${k})`; }); };
  draw();
  App.mkFit = fit; window.removeEventListener('resize', App.mkFitL || (() => {})); App.mkFitL = () => fit(); window.addEventListener('resize', App.mkFitL);
  el.addEventListener('input', (e) => { const t = e.target.closest('[data-ek]'); if (t) RPT.ov[t.dataset.ek] = { v: t.innerText.replace(/ /g, ' ').trim(), base: t.dataset.base }; });
  el.addEventListener('change', (e) => { if (e.target.id === 'mkPick') { MK.pid = e.target.value; draw(); } });
  el.addEventListener('keydown', (e) => { const t = e.target.closest && e.target.closest('[data-ek]'); if (t && e.key === 'Enter') { e.preventDefault(); t.blur(); } });
  el.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-mkscope]'); if (sc) { MK.scope = sc.dataset.mkscope; return draw(); }
    const md = e.target.closest('[data-mkmode]'); if (md) { if (md.dataset.mkmode === 'one') { MK.scope = 'one'; if (!MK.pid || !mkPool().some((p) => p.id === MK.pid)) MK.pid = (mkPool()[0] || {}).id; } else if (MK.scope === 'one') MK.scope = 'all'; return draw(); }
    if (e.target.closest('[data-mkreset]')) { Object.keys(RPT.ov).filter((k) => k.startsWith('mk.')).forEach((k) => delete RPT.ov[k]); toast('استُعيدت النصوص الأصلية'); return draw(); }
    if (e.target.closest('[data-mkshow]')) return openReportShow(0, $$('#mkDeck .rs2', el));
    if (e.target.closest('[data-mkpdf]')) { prepareReportPrint($$('#mkDeck .rs2', el), 'التقرير-التسويقي-' + (mkOne() ? partnerName(mkOne()).replace(/\s+/g, '-') + '-' : '') + isoDate(today())); setTimeout(() => window.print(), 300); }
  });
}

window.addEventListener('beforeprint', () => { if (App.route && App.route.name === 'reportsMk' && !document.documentElement.classList.contains('printing-report')) { const n = $$('#mkDeck .rs2'); if (n.length) prepareReportPrint(n, 'التقرير-التسويقي-' + isoDate(today())); } });
