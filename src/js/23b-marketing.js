/* =====================================================================
   التقرير التسويقي «أثرٌ يُروى»
   مجلة أثر في شرائح 16:9 تُبنى من البيانات لحظة العرض: الأعمال والإنجازات والأثر والقيمة
   تُروى كقصة لها بداية وذروة ودعوة. كل شريحة بلا بيانات كافية تُحذف تلقائيًا.
   العناوين قابلة للتعديل مباشرة قبل العرض، ويُعرض بملء الشاشة أو يُطبع PDF.
   ===================================================================== */
const MK = (() => { App.ui.mk = App.ui.mk || { scope: 'all' }; return App.ui.mk; })();
const MK_SCOPES = [
  ['all', 'المحفظة كاملة', () => true],
  ['active', 'الشراكات السارية', (p) => ['active', 'soon'].includes(pStatus(p))],
  ['golden', 'الشراكات الذهبية', (p) => !!p.golden],
  ['picked', 'المحددة في الاستوديو', (p) => (RPT.ids || []).includes(p.id)],
];
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
  const L_ = visiblePartnerships().filter((p) => !p.isDraft && (showDemo() || !p.demo)).filter(sc[2]);
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
function mkSlides() {
  const X = mkData(), org = X.org;
  if (!X.L.length) return [];
  const yr = new Date().getFullYear();
  const yrs = X.yKeys.length ? (X.yKeys[0] === X.yKeys[X.yKeys.length - 1] ? `${X.yKeys[0]}` : `${X.yKeys[0]}–${X.yKeys[X.yKeys.length - 1]}`) : `${yr}`;
  const S = [];
  /* 1. البذرة */
  S.push(['seed', 'night', 'أثرٌ يُروى', `
    <div class="mx-grain"></div>
    ${mxTree(X)}
    <div class="mx-seed-t">
      <span class="mx-mast">${esc(org.name)} · تقرير الأثر ${yr}</span>
      <h1 class="mx-title"><span>${mkE('cover.t1', 'أثرٌ')}</span> <em>${mkE('cover.t2', 'يُروى')}</em></h1>
      <p>${mkE('cover.s', `بذرةٌ واحدة صارت شجرة: ${X.signed.length} شراكة، و${X.partners.length} جهة، في ${X.sectors.length || 1} قطاعات. كل ورقة هنا شراكة حقيقية.`)}</p>
      <div class="mx-key"><span><i class="a"></i>سارية</span><span><i class="g"></i>ذهبية</span><span><i class="u"></i>قادمة أو قيد الإعداد</span><span><i class="e"></i>منتهية</span></div>
    </div>`]);
  /* 2. السطر الواحد: كلمة بكلمة */
  const man = rptVal('mk.man.t', `خلال ${yrs} بنينا ${X.signed.length} شراكة مع ${X.partners.length} جهة${X.value ? `، بقيمة تتجاوز ${sarShort(X.value)} ريال` : ''}، لنحوّل الأهداف البيئية إلى أثرٍ يُرى ويُقاس.`);
  S.push(['line', 'paper', 'القصة في سطر', `
    <span class="mx-qm" aria-hidden="true">“</span>
    <p class="mx-line" data-ek="mk.man.t" data-base="${esc(`خلال ${yrs} بنينا ${X.signed.length} شراكة مع ${X.partners.length} جهة${X.value ? `، بقيمة تتجاوز ${sarShort(X.value)} ريال` : ''}، لنحوّل الأهداف البيئية إلى أثرٍ يُرى ويُقاس.`)}" contenteditable="true" spellcheck="false">${man.split(/\s+/).map((w, i) => `<span class="${/[0-9٠-٩]/.test(w) ? 'n' : ''}" style="--w:${i}">${esc(w)}</span>`).join(' ')}</p>
    <div class="mx-sig"><i></i>${esc(org.dept)} — ${esc(org.name)}</div>`]);
  /* 3. ثلاثة أرقام عملاقة تمتلئ بالذهب */
  const actPct = X.act.length ? Math.round(X.activated / X.act.length * 100) : 0;
  S.push(['three', 'night', 'بالأرقام', `
    <h2 class="mx-h">${mkE('num.h', 'ثلاثة أرقام تكفي')}</h2>
    <div class="mx-giants">${[[X.partners.length, mkNum(X.partners.length), 'جهة شريكة'], [X.act.length, mkNum(X.act.length), 'شراكة سارية الآن'], [X.value || X.outputs.length, X.value ? sarShort(X.value).replace(' مليون', 'M').replace(' ألف', 'K') : mkNum(X.outputs.length), X.value ? 'ريال قيمة تقديرية' : 'مخرجًا موثّقًا']].map(([v, t, l], i) => `<div class="mx-gi" style="--i:${i}"><b data-t="${esc(t)}">${esc(t)}</b><span>${l}</span></div>`).join('')}</div>
    <div class="mx-ticker">${[[X.outputs.length, 'مخرجًا موثّقًا'], [actPct + '%', 'نسبة التفعيل'], [X.avgEv === null ? '—' : X.avgEv + '/100', 'متوسط التقييم'], [X.depts.size, 'إدارة داخلية شريكة'], [X.signed.length, 'مذكرة موقّعة']].map(([v, l]) => `<span><b>${esc(String(v))}</b>${l}</span>`).join('<i>✦</i>')}</div>`]);
  /* 4. كوكبة الشركاء */
  const PR = X.partners.slice(0, 18), rings = [150, 230, 305];
  const nodes = PR.map((pr, i) => { const ring = i < 6 ? 0 : i < 12 ? 1 : 2, inRing = PR.filter((_, j) => (j < 6 ? 0 : j < 12 ? 1 : 2) === ring).length, idx = i - ring * 6; const a = (idx / inRing) * Math.PI * 2 + ring * 0.5 - Math.PI / 2; return { pr, x: 640 + Math.cos(a) * rings[ring] * 1.25, y: 400 + Math.sin(a) * rings[ring] * 0.62, i }; });
  S.push(['orbit', 'deep', 'شركاء النجاح', `
    <h2 class="mx-h">${mkE('pa.h', 'كوكبة من الشركاء')}</h2>
    <p class="mx-sub">${mkE('pa.s', `${X.partners.length} جهة تدور معنا حول هدف واحد: أثر بيئي يبقى.`)}</p>
    <svg class="mx-orb" viewBox="0 0 1280 720" aria-hidden="true">${rings.map((r, k) => `<ellipse cx="640" cy="400" rx="${r * 1.25}" ry="${r * 0.62}" class="ring" style="--k:${k}"/>`).join('')}${nodes.map((n) => `<line x1="640" y1="400" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" class="ray" style="--i:${n.i}" pathLength="1"/>`).join('')}</svg>
    <div class="mx-core">${(ASSET_IMG['murooj-logo-white'] || {}).src ? `<img src="${ASSET_IMG['murooj-logo-white'].src}" alt="">` : ''}</div>
    ${nodes.map((n) => `<span class="mx-node" style="left:${n.x.toFixed(0)}px;top:${n.y.toFixed(0)}px;--i:${n.i}" title="${esc(n.pr.name)}"><i>${logoOrMono(n.pr, n.pr.name)}</i><small>${esc(n.pr.name)}</small></span>`).join('')}
    ${X.partners.length > PR.length ? `<span class="mx-more">+${X.partners.length - PR.length} جهة أخرى</span>` : ''}`]);
  /* 5. نهر الزمن */
  const dated = X.L.filter((p) => parseDate(p.startDate)).sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  if (dated.length >= 2) {
    const t0 = parseDate(dated[0].startDate).getTime(), t1 = Math.max(parseDate(dated[dated.length - 1].startDate).getTime(), t0 + 1);
    const P = (f) => { const x = 1180 - f * 1080; const y = 470 + Math.sin(f * Math.PI * 2.2) * 70; return [x, y]; };
    let d = ''; for (let k = 0; k <= 60; k++) { const [x, y] = P(k / 60); d += (k ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    const yrsL = []; for (let y = new Date(t0).getFullYear(); y <= new Date(t1).getFullYear(); y++) yrsL.push(y);
    S.push(['river', 'paper', 'نهر الزمن', `
      <h2 class="mx-h">${mkE('gr.h', 'نهرٌ لا يتوقف')}</h2>
      <p class="mx-sub">${mkE('gr.s', `من أول شراكة في ${fmtDate(dated[0].startDate)} إلى اليوم: ${dated.length} شراكة على مجرى واحد.`)}</p>
      <svg class="mx-riv" viewBox="0 0 1280 720" aria-hidden="true"><path d="${d}" class="bed"/><path d="${d}" class="flow" pathLength="1"/>
        ${yrsL.map((y) => { const f = (new Date(y, 0, 1).getTime() - t0) / (t1 - t0); if (f < 0 || f > 1) return ''; const [x, yy] = P(f); return `<g class="yr"><line x1="${x}" x2="${x}" y1="${yy + 24}" y2="${yy + 60}"/><text x="${x}" y="${yy + 80}" text-anchor="middle">${y}</text></g>`; }).join('')}
        ${dated.map((p, i) => { const f = (parseDate(p.startDate).getTime() - t0) / (t1 - t0); const [x, y] = P(f); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.golden ? 10 : 7}" class="dt ${p.golden ? 'g' : ''}" style="--i:${i}"/>`; }).join('')}</svg>
      ${[dated[0], dated[dated.length - 1]].map((p, k) => { const f = (parseDate(p.startDate).getTime() - t0) / (t1 - t0); const [x, y] = P(f); return `<div class="mx-call ${k ? 'end' : 'start'}" style="left:${Math.max(40, Math.min(1000, x - 120)).toFixed(0)}px;top:${(y - 150).toFixed(0)}px"><em>${k ? 'الأحدث' : 'البداية'}</em><b>${esc(partnerName(p))}</b><span>${fmtDate(p.startDate)}</span></div>`; }).join('')}`]);
  }
  /* 6. بطاقات النجوم */
  if (X.stars.length) {
    S.push(['cards', 'night', X.L.some((p) => p.golden) ? 'الشراكات الذهبية' : 'نجوم المحفظة', `
      <h2 class="mx-h gold">${mkE('st.h', X.L.some((p) => p.golden) ? 'الشراكات الذهبية' : 'شراكات صنعت الفارق')}</h2>
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
  S.push(['rings', 'paper', 'مرآة الأثر', `
    <h2 class="mx-h">${mkE('im.h', 'حلقات تتسع')}</h2>
    <svg class="mx-rings" viewBox="-200 -200 400 400" aria-hidden="true">${rows.map((r, k) => { const rad = 170 - k * 30, C = 2 * Math.PI * rad, f = r[1] / rMax * 0.82; return `<circle r="${rad}" class="bg"/><circle r="${rad}" class="v" style="--k:${k};--c:${C.toFixed(1)}" stroke-dasharray="${(f * C).toFixed(1)} ${C.toFixed(1)}"/>`; }).join('')}<text y="10" text-anchor="middle" class="ct">${X.L.length}</text><text y="34" text-anchor="middle" class="cs">شراكة</text></svg>
    <ul class="mx-rl">${rows.map((r, k) => `<li style="--k:${k}"><i></i><b>${esc(r[0])}</b><span>${r[2] ? esc(r[2].slice(0, 46)) : ''}</span><em>${r[1]}</em></li>`).join('')}</ul>
    <div class="mx-quotes">${pts.map((x, i) => `<blockquote style="--i:${i}">${esc(x.t.slice(0, 120))}<cite>${esc(partnerName(x.p))}</cite></blockquote>`).join('')}</div>`]);
  /* 9. مضاعف الأثر */
  if (X.value) {
    const mult = X.fin.muroj ? (X.fin.partner + X.fin.inkind) / X.fin.muroj : 0;
    const parts = [[X.fin.partner, 'مساهمات الشركاء', 'a'], [X.fin.inkind, 'قيمة عينية ومعرفية', 'c'], [X.fin.muroj, 'مساهمة المؤسسة', 'b']].filter((x) => x[0]);
    S.push(['mult', 'night', 'القيمة', `
      <div class="mx-mult">
        ${mult >= 1 ? `<div class="mx-eq"><span class="one"><b>1</b>ريال من المؤسسة</span><span class="op">=</span><span class="many"><b data-cnt="${mult.toFixed(1)}" data-dec="1">${mult.toFixed(1)}</b>ريال من الشركاء</span></div><p class="mx-eq-s">${mkE('va.s', 'كل ريال تضعه المؤسسة يستقطب أضعافه من شركائها: هذه قوة الشراكة.')}</p>` : `<div class="mx-eq solo"><span class="many"><b>${sarShort(X.value)}</b>ريال قيمة تقديرية</span></div>`}
        <div class="mx-bars-h">${parts.map(([v, l, c], i) => `<div class="${c}" style="--w:${(v / X.value * 100).toFixed(1)}%;--i:${i}"><span>${l}</span><i></i><b>${sarShort(v)}</b></div>`).join('')}</div>
        <div class="mx-total"><span>إجمالي القيمة</span><b>${sarShort(X.value)}</b><small>ريال سعودي</small></div>
      </div>`]);
  }
  /* 10. الأفق */
  S.push(['horizon', 'dawn', 'ما القادم', `
    <div class="mx-sun"></div><svg class="mx-hz" viewBox="0 0 1280 720" preserveAspectRatio="none" aria-hidden="true"><path d="M0 560 Q 640 470 1280 560 L1280 720 L0 720Z"/><path d="M0 600 Q 640 520 1280 600" class="l"/></svg>
    <h2 class="mx-h">${mkE('nx.h', 'الأفضل لم يأتِ بعد')}</h2>
    <div class="mx-rise">${[[X.props.length, 'مقترح قيد الدراسة', 'send'], [X.pipe.length, 'شراكة تقترب من التوقيع', 'convert'], [X.soon.length, 'فرصة تجديد وتوسع', 'history']].map(([v, l, ic], i) => `<div style="--i:${i}"><span>${icon(ic)}</span>${mxCnt(v)}<small>${l}</small></div>`).join('')}</div>`]);
  /* 11. الختام: حلقتان تتشابكان */
  S.push(['bond', 'night', 'دعوة', `
    <div class="mx-grain"></div>
    <svg class="mx-bond2" viewBox="-300 -200 600 400" aria-hidden="true"><circle class="l" r="150"/><circle class="r" r="150"/><circle class="k" cx="0" cy="-131" r="7"/><circle class="k" cx="0" cy="131" r="7"/></svg>
    <div class="mx-end">
      ${(ASSET_IMG['murooj-logo-white'] || {}).src ? `<img class="mx-logo" src="${ASSET_IMG['murooj-logo-white'].src}" alt="">` : ''}
      <h2>${mkE('end.t', 'شريكنا القادم… قد تكون أنت')}</h2>
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
    const step = (t) => { const k = Math.min(1, (t - t0) / d), v = to * (1 - Math.pow(1 - k, 3)); b.textContent = dec ? v.toFixed(dec) : fmt ? nf(Math.round(v)) : nf(Math.round(v)); if (k < 1) requestAnimationFrame(step); };
    setTimeout(() => requestAnimationFrame(step), 500);
  });
}

/* — الصفحة — */
function renderMarketingReport(el) {
  if (!can('view.reports')) { el.innerHTML = noAccessHTML(); return; }
  el.classList.add('mkpage');
  const draw = () => {
    const S = mkSlides();
    el.innerHTML = `<section class="mk-head">
        <div class="mk-head-t"><a class="back" href="#/reports">${icon('arrowR')} استوديو التقارير</a><span class="rx-eye"><i></i>التقرير التسويقي</span><h1>أثرٌ يُروى</h1>
          <p>قصة أعمالكم وإنجازاتكم وأثركم في ${S.length} شرائح مبنية من البيانات لحظة العرض، بإخراج يليق بالعملاء والقيادات. اضغط أي عنوان لتعديله قبل العرض.</p></div>
        <div class="mk-head-a"><button class="btn gold lg" type="button" data-mkshow ${S.length ? '' : 'disabled'}>${icon('play')} عرض بملء الشاشة</button><button class="btn lg" type="button" data-mkpdf ${S.length ? '' : 'disabled'}>${icon('print')} PDF</button></div>
      </section>
      <div class="mk-scope" role="tablist" aria-label="نطاق التقرير">${MK_SCOPES.map(([k, l, f]) => { const n = visiblePartnerships().filter((p) => !p.isDraft && (showDemo() || !p.demo)).filter(f).length; return `<button type="button" class="${MK.scope === k ? 'on' : ''}" data-mkscope="${k}" ${n ? '' : 'disabled'}>${esc(l)}<b>${n}</b></button>`; }).join('')}<span class="sp"></span><button type="button" class="linkbtn" data-mkreset>${icon('history')} استعادة النصوص الأصلية</button></div>
      <div class="mk-deck" id="mkDeck">${S.length ? S.map((s, i) => `<div class="mk-fr" data-i="${i}">${s}</div>`).join('') : `<div class="panel">${emptyHTML({ ic: 'file', title: 'لا توجد شراكات في هذا النطاق', text: 'اختر نطاقًا آخر.' })}</div>`}</div>`;
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
  el.addEventListener('keydown', (e) => { const t = e.target.closest && e.target.closest('[data-ek]'); if (t && e.key === 'Enter') { e.preventDefault(); t.blur(); } });
  el.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-mkscope]'); if (sc) { MK.scope = sc.dataset.mkscope; return draw(); }
    if (e.target.closest('[data-mkreset]')) { Object.keys(RPT.ov).filter((k) => k.startsWith('mk.')).forEach((k) => delete RPT.ov[k]); toast('استُعيدت النصوص الأصلية'); return draw(); }
    if (e.target.closest('[data-mkshow]')) return openReportShow(0, $$('#mkDeck .rs2', el));
    if (e.target.closest('[data-mkpdf]')) { prepareReportPrint($$('#mkDeck .rs2', el), 'التقرير-التسويقي-' + isoDate(today())); setTimeout(() => window.print(), 300); }
  });
}

window.addEventListener('beforeprint', () => { if (App.route && App.route.name === 'reportsMk' && !document.documentElement.classList.contains('printing-report')) { const n = $$('#mkDeck .rs2'); if (n.length) prepareReportPrint(n, 'التقرير-التسويقي-' + isoDate(today())); } });
