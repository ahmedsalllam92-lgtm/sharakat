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
function mkSlides() {
  const X = mkData(), org = X.org;
  if (!X.L.length) return [];
  const yr = new Date().getFullYear();
  const yrs = X.yKeys.length ? (X.yKeys[0] === X.yKeys[X.yKeys.length - 1] ? `${X.yKeys[0]}` : `${X.yKeys[0]}–${X.yKeys[X.yKeys.length - 1]}`) : `${yr}`;
  const S = [];
  const cover = X.photos[0];
  /* 1. الغلاف */
  S.push(['cover', 'dark', 'تقرير الأثر', `
    <div class="mk-bg">${cover ? mkImg(cover.id, 'mk-photo') : ''}<span class="mk-veil"></span></div>
    ${MK_RINGS}
    <div class="mk-cv">
      <span class="mk-mast">${esc(org.name)} · ${esc(org.dept)}</span>
      <h1>${mkE('cover.t', D.settings.splash && D.settings.splash.text ? D.settings.splash.text : 'نبني شراكات… تصنع أثرًا يبقى')}</h1>
      <p>${mkE('cover.s', `تقرير الأثر والشراكات ${yr} — قصة ${plural(X.partners.length, 'جهة واحدة', 'جهتين', 'جهات', 'جهة')} اختارت أن تصنع الفرق معنا`)}</p>
      <div class="mk-cv-n">${[[X.act.length, 'شراكة سارية'], [X.partners.length, 'جهة شريكة'], [X.sectors.length, plural(X.sectors.length, 'قطاع', 'قطاعان', 'قطاعات', 'قطاعًا').replace(/^\d+\s*/, '')]].map(([v, l]) => `<span><b>${mkNum(v)}</b>${esc(l)}</span>`).join('')}</div>
    </div>`]);
  /* 2. القصة في سطر */
  const secTxt = X.sectors.slice(0, 3).map((s) => s[0]).join(' و');
  S.push(['manifesto', 'paper', 'القصة في سطر', `
    <div class="mk-man">
      <span class="mk-q" aria-hidden="true">“</span>
      <p class="mk-man-t">${mkE('man.t', `خلال ${yrs} بنينا ${X.signed.length} شراكة مع ${X.partners.length} جهة${secTxt ? ` من ${secTxt}` : ''}${X.value ? `، بقيمة تتجاوز ${sarShort(X.value)} ريال` : ''}، لنحوّل الأهداف البيئية إلى أثر يُرى ويُقاس.`, 'span', 'mk-man-s')}</p>
      <div class="mk-man-sig"><i></i><span>${esc(org.dept)}</span></div>
    </div>
    <div class="mk-man-side">${[[X.signed.length, 'شراكة موقّعة'], [X.depts.size, 'إدارة داخلية شريكة'], [X.outputs.length, 'مخرج موثّق']].map(([v, l]) => `<div><b>${mkNum(v)}</b><span>${l}</span></div>`).join('')}</div>`]);
  /* 3. بالأرقام */
  const actPct = X.act.length ? Math.round(X.activated / X.act.length * 100) : 0;
  const yMax = Math.max(1, ...Object.values(X.years));
  const spark = X.yKeys.length > 1 ? `<svg viewBox="0 0 200 60" class="mk-spark" preserveAspectRatio="none"><polyline points="${X.yKeys.map((y, i) => `${(i / (X.yKeys.length - 1) * 200).toFixed(1)},${(56 - X.years[y] / yMax * 50).toFixed(1)}`).join(' ')}"/></svg>` : '';
  S.push(['numbers', 'dark', 'بالأرقام', `
    <h2 class="mk-h">${mkE('num.h', 'أرقام تحكي القصة')}</h2>
    <div class="mk-bento">
      <div class="b1"><span>جهة شريكة</span><b>${mkNum(X.partners.length)}</b><small>${X.sectors.map((s) => esc(s[0])).slice(0, 3).join(' · ')}</small></div>
      <div class="b2"><span>شراكة سارية الآن</span><b>${mkNum(X.act.length)}</b><small>من ${X.signed.length} موقّعة</small>${spark}</div>
      <div class="b3"><span>القيمة التقديرية</span><b>${X.value ? sarShort(X.value) : '—'}</b><small>ريال سعودي</small></div>
      <div class="b4"><span>نسبة التفعيل</span><div class="mk-ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" class="t"/><circle cx="40" cy="40" r="32" class="v" stroke-dasharray="${(actPct / 100 * 201).toFixed(1)} 201"/></svg><b>${actPct}<small>%</small></b></div><small>من الشراكات السارية مفعّلة فعليًا</small></div>
      <div class="b5"><span>مخرجات موثّقة</span><b>${mkNum(X.outputs.length)}</b><small>في سجلات الشراكات</small></div>
      <div class="b6"><span>متوسط تقييم الأداء</span><b>${X.avgEv === null ? '—' : X.avgEv}<small>${X.avgEv === null ? '' : '/100'}</small></b><small>${X.avgEv === null ? 'لم تُقيَّم بعد' : evalGrade(X.avgEv)}</small></div>
    </div>`]);
  /* 4. رحلة النمو */
  if (X.yKeys.length >= 2) {
    const all = []; for (let y = X.yKeys[0]; y <= X.yKeys[X.yKeys.length - 1]; y++) all.push(y);
    let cum = 0; const cumS = all.map((y) => (cum += X.years[y] || 0));
    const peak = all.reduce((b, y) => ((X.years[y] || 0) > (X.years[b] || 0) ? y : b), all[0]);
    S.push(['growth', 'paper', 'رحلة النمو', `
      <h2 class="mk-h">${mkE('gr.h', 'من شراكة واحدة إلى منظومة')}</h2>
      <p class="mk-sub">${mkE('gr.s', `${cum} شراكة بدأت خلال ${all.length} سنوات، وذروة العام ${peak} بـ${X.years[peak]} شراكات جديدة.`)}</p>
      <div class="mk-grow">${all.map((y, i) => `<div class="${y === peak ? 'pk' : ''}" style="--h:${(cumS[i] / cum * 100).toFixed(1)}%;--i:${i}"><span class="v">${cumS[i]}</span><i></i><b>${y}</b><small>${X.years[y] ? '+' + X.years[y] : ''}</small></div>`).join('')}</div>
      <div class="mk-miles">${X.first ? `<div><em>البداية</em><b>${esc(partnerName(X.first))}</b><span>${fmtDate(X.first.startDate)}</span></div>` : ''}${X.latest && X.latest !== X.first ? `<div><em>الأحدث</em><b>${esc(partnerName(X.latest))}</b><span>${fmtDate(X.latest.startDate)}</span></div>` : ''}</div>`]);
  }
  /* 5. شركاء النجاح */
  const bySec = X.sectors.length ? X.sectors.map(([s]) => [s, X.partners.filter((pr) => X.L.some((p) => p.partnerId === pr.id && pSector(p) === s))]) : [['', X.partners]];
  S.push(['partners', 'paper', 'شركاء النجاح', `
    <h2 class="mk-h">${mkE('pa.h', 'شركاء يصنعون الفرق')}</h2>
    <p class="mk-sub">${mkE('pa.s', `${X.partners.length} جهة حكومية وخاصة وغير ربحية تتكامل معنا في رحلة واحدة.`)}</p>
    <div class="mk-wall">${bySec.slice(0, 4).map(([s, prs]) => `<div class="mk-wcol"><h4>${esc(s || 'الشركاء')}<em>${prs.length}</em></h4><div class="mk-logos">${prs.slice(0, 9).map((pr) => `<span title="${esc(pr.name)}"><i>${logoOrMono(pr, pr.name)}</i><small>${esc(pr.name)}</small></span>`).join('')}${prs.length > 9 ? `<span class="more"><i>+${prs.length - 9}</i></span>` : ''}</div></div>`).join('')}</div>`]);
  /* 6. نجوم المحفظة */
  if (X.stars.length) {
    S.push(['stars', 'dark', X.L.some((p) => p.golden) ? 'الشراكات الذهبية' : 'نجوم المحفظة', `
      <h2 class="mk-h gold">${mkE('st.h', X.L.some((p) => p.golden) ? 'الشراكات الذهبية' : 'شراكات صنعت الفارق')}</h2>
      <div class="mk-stgrid n${X.stars.length}">${X.stars.map((p, i) => { const pr = partnerById(p.partnerId) || {}; const P = pProfile(p); const ph = p.coverFileId || ((p.attachments || []).find((a) => isImg(a)) || {}).fileId; return `<article style="--i:${i}">
        <div class="mk-st-ph">${ph ? mkImg(ph) : `<span class="mk-st-art">${MK_RINGS}</span>`}<span class="mk-st-logo">${logoOrMono(pr, partnerName(p))}</span>${p.golden ? `<span class="mk-st-star">${typeof STAR_SVG !== 'undefined' ? STAR_SVG : '★'}</span>` : ''}</div>
        <div class="mk-st-b"><h3>${esc(partnerName(p))}</h3><small>${[p.classification, pSector(p)].filter(Boolean).map(esc).join(' · ')}</small>
          ${p.showcaseGoal || firstItem(p.cooperationAreas) ? `<p>${esc(trimP(p.showcaseGoal || firstItem(p.cooperationAreas)).slice(0, 150))}</p>` : ''}
          <div class="mk-st-f"><span><b>${richItems(p.outputs).length || '—'}</b>مخرجات</span><span><b>${P.ev && P.ev.score !== null ? P.ev.score : '—'}</b>تقييم</span><span><b>${P.total ? sarShort(P.total) : '—'}</b>قيمة</span></div></div></article>`; }).join('')}</div>`]);
  }
  /* 7. قصص من الميدان */
  X.stories.slice(0, 2).forEach((s, i) => {
    const ph = (s.gallery || [])[0] || s.coverFileId || (X.photos[i + 1] || {}).id;
    const pr = typeof storyPartner === 'function' ? storyPartner(s) : null;
    S.push(['story', 'split', 'قصص من الميدان', `
      <div class="mk-story-ph">${ph ? mkImg(ph) : ''}<span class="mk-veil"></span></div>
      <div class="mk-story-b">
        <span class="mk-tag">${esc(s.type || 'قصة نجاح')}${pr ? ` · ${esc(pr.name)}` : ''}</span>
        <h2>${mkE(`sto.${i}.t`, s.title)}</h2>
        <blockquote>${mkE(`sto.${i}.q`, trimP(s.summary || s.text || s.body || '').slice(0, 260), 'span')}</blockquote>
        ${s.metricValue ? `<div class="mk-story-m"><span><b>${esc(s.metricValue)}</b>${esc(s.metricLabel || '')}</span></div>` : ''}
        ${s.date ? `<small class="mk-date">${fmtDate(s.date)}</small>` : ''}
      </div>`]);
  });
  /* 8. مرآة الأثر */
  const gMax = Math.max(1, ...X.goals.map((g) => g.n));
  const pts = (X.impacts.length ? X.impacts : X.outputs).slice(0, 4);
  S.push(['impact', 'paper', 'مرآة الأثر', `
    <h2 class="mk-h">${mkE('im.h', 'أثر يتجاوز الأرقام')}</h2>
    <div class="mk-imp">
      <ol class="mk-imp-l">${pts.map((x, i) => `<li style="--i:${i}"><em>${String(i + 1).padStart(2, '0')}</em><div><p>${esc(x.t.slice(0, 160))}</p><small>${esc(partnerName(x.p))}</small></div></li>`).join('') || '<li><div><p>تُوثَّق المخرجات والأثر في سجلات الشراكات فتظهر هنا.</p></div></li>'}</ol>
      ${X.goals.some((g) => g.n) ? `<div class="mk-goals"><h4>${mkE('im.g', 'مساهمة الشراكات في الأهداف الاستراتيجية')}</h4>${X.goals.map((g) => `<div class="${g.n ? 'on' : ''}"><em>${esc(g.k)}</em><span>${esc(g.t.replace(/^[A-Z]{1,3}\d?\s*[:：]\s*/, '').slice(0, 58))}</span><i><b style="width:${(g.n / gMax * 100).toFixed(0)}%"></b></i><strong>${g.n}</strong></div>`).join('')}</div>`
        : `<div class="mk-goals sec"><h4>${mkE('im.sc', 'أثر يمتد عبر القطاعات')}</h4>${X.sectors.map(([k, n]) => `<div class="on"><span>${esc(k)}</span><i><b style="width:${(n / Math.max(1, X.sectors[0][1]) * 100).toFixed(0)}%"></b></i><strong>${n}</strong></div>`).join('')}<p class="mk-goals-n">${X.depts.size} ${X.depts.size === 1 ? 'إدارة داخلية تشارك' : 'إدارات داخلية تشارك'} في تنفيذ هذه الشراكات.</p></div>`}
    </div>`]);
  /* 9. القيمة */
  if (X.value) {
    const parts = [[X.fin.partner, 'مساهمات الشركاء', 'a'], [X.fin.muroj, 'مساهمة المؤسسة', 'b'], [X.fin.inkind, 'قيمة عينية ومعرفية', 'c']].filter((x) => x[0]);
    let acc = 0; const C = 2 * Math.PI * 90;
    const arcs = parts.map(([v, , c]) => { const f = v / X.value, s = `<circle r="90" class="${c}" stroke-dasharray="${(f * C).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-acc * C).toFixed(1)}"/>`; acc += f; return s; }).join('');
    const vt = Object.entries(X.vTypes).sort((a, b) => b[1] - a[1]).slice(0, 5);
    S.push(['value', 'dark', 'القيمة', `
      <div class="mk-val">
        <div class="mk-val-big"><span>${mkE('va.k', 'القيمة التقديرية للشراكات')}</span><b>${sarShort(X.value)}</b><small>ريال سعودي</small>
          <p>${mkE('va.s', `كل ريال تضعه المؤسسة يلتقي بمساهمات الشركاء وخبراتهم ليتضاعف الأثر.`)}</p></div>
        <div class="mk-donut"><svg viewBox="-110 -110 220 220"><circle r="90" class="t"/>${arcs}</svg><div class="mk-donut-c"><b>${parts.length}</b><span>مصادر قيمة</span></div></div>
        <ul class="mk-val-l">${parts.map(([v, l, c]) => `<li class="${c}"><i></i><span>${l}</span><b>${sarShort(v)}</b><small>${Math.round(v / X.value * 100)}%</small></li>`).join('')}
          ${vt.length ? `<li class="vt"><span>أنواع القيمة</span><div>${vt.map(([k, n]) => `<em>${esc(k)} <b>${n}</b></em>`).join('')}</div></li>` : ''}</ul>
      </div>`]);
  }
  /* 10. ما القادم */
  S.push(['next', 'paper', 'ما القادم', `
    <h2 class="mk-h">${mkE('nx.h', 'الأفضل لم يأتِ بعد')}</h2>
    <p class="mk-sub">${mkE('nx.s', 'فرص تتشكل الآن، وشراكات تقترب من التوقيع، وأخرى تستعد للتجديد والتوسع.')}</p>
    <div class="mk-nx">${[[X.props.length, 'مقترح شراكة قيد الدراسة', 'من إدارات المؤسسة عبر خدمة «شارك»', 'send'], [X.pipe.length, 'شراكة في الإعداد والتوقيع', 'تمر بمسار الاعتماد المؤسسي', 'convert'], [X.soon.length, 'فرصة تجديد قريبة', 'شراكات ناجحة تقترب من نهاية مدتها', 'history']].map(([v, l, d, ic], i) => `<div style="--i:${i}"><span class="mk-nx-ic">${icon(ic)}</span><b>${mkNum(v)}</b><h4>${l}</h4><p>${d}</p></div>`).join('')}</div>`]);
  /* 11. الختام */
  const endPh = X.photos[1] || X.photos[0];
  S.push(['close', 'dark', 'دعوة', `
    <div class="mk-bg">${endPh ? mkImg(endPh.id, 'mk-photo') : ''}<span class="mk-veil"></span></div>
    ${MK_RINGS}
    <div class="mk-end">
      ${(ASSET_IMG['murooj-logo-white'] || {}).src ? `<img class="mk-logo" src="${ASSET_IMG['murooj-logo-white'].src}" alt="">` : ''}
      <h2>${mkE('end.t', 'شريكنا القادم… قد تكون أنت')}</h2>
      <p>${mkE('end.s', `${org.dept} — ${org.name}. لنصنع معًا أثرًا يبقى.`)}</p>
    </div>`]);
  const N = S.length;
  return S.map(([k, tone, kick, inner], i) => mkFrame(k, tone, i + 1, N, kick, inner));
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
