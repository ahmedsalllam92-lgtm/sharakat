/* ===== الصفحة الرئيسية ===== */
function homePeriod() {
  const h = D.settings.home;
  const from = parseDate(h.periodFrom) || new Date(today().getFullYear(), 0, 1);
  const to = parseDate(h.periodTo) || today();
  return { from, to, text: `${fmtDate(isoDate(from))} – ${fmtDate(isoDate(to))}` };
}
function overlapsPeriod(p, per) {
  const s = parseDate(p.startDate), e = parseDate(p.endDate);
  if (!s) return false;
  return s <= per.to && (!e || e >= per.from);
}
const HOME_KPIS = {
  active: { label: 'شراكة سارية', sub: 'حتى اليوم', calc: (L_, per) => L_.filter((p) => ['active', 'soon'].includes(pStatus(p))).length, href: () => '#/partnerships?status=active|soon' },
  partners: { label: 'جهة شريكة', sub: 'لها شراكات مسجّلة', calc: (L_) => new Set(L_.filter((p) => !p.isDraft).map((p) => p.partnerId)).size, href: () => '#/partners' },
  signedInPeriod: { label: 'شراكة بدأ سريانها', sub: 'خلال الفترة', calc: (L_, per) => L_.filter((p) => p.stage === 'signed' && parseDate(p.startDate) && parseDate(p.startDate) >= per.from && parseDate(p.startDate) <= per.to).length, href: () => '#/partnerships' },
  outputs: { label: 'مخرجًا مستهدفًا', sub: 'في الشراكات الموقّعة', calc: (L_) => L_.filter((p) => !p.isDraft && p.stage === 'signed').reduce((a, p) => a + richItems(p.outputs).length, 0), href: () => '#/partnerships' },
  departments: { label: 'إدارة تتقاطع مع الشراكات', sub: 'في الشراكات الموقّعة', calc: (L_) => new Set(L_.filter((p) => !p.isDraft && p.stage === 'signed').flatMap((p) => p.departments || [])).size, href: () => '#/dashboard' },
  sectors: { label: 'قطاعات ممثلة', sub: '', subFn: (L_) => [...new Set(L_.filter((p) => p.stage === 'signed').map(pSector).filter(Boolean))].join('، '), calc: (L_, per) => new Set(L_.filter((p) => p.stage === 'signed').map(pSector).filter(Boolean)).size, href: () => '#/dashboard' },
  proposals: { label: 'مقترحًا من الإدارات', sub: 'قُدّم خلال الفترة', calc: (L_, per) => visibleProposals().filter((x) => x.submittedAt && new Date(x.submittedAt) >= per.from && new Date(x.submittedAt) <= addDays(per.to, 1)).length, href: () => '#/proposals' },
};

function featuredList() {
  const ids = D.settings.home.featured || [];
  const pub = publicPartnerships();
  return ids.map((id) => pub.find((p) => p.id === id)).filter(Boolean);
}
function featuredStories() {
  const ids = D.settings.home.stories || [];
  const pub = publicStories();
  const list = ids.map((id) => pub.find((a) => a.id === id)).filter(Boolean);
  return list;
}
function storyPartner(a) { const p = D.partnerships.find((x) => x.id === a.partnershipId); return p ? partnerById(p.partnerId) : null; }

function renderHome(el) {
  if (design() === 'board') return renderHomeBoard(el);
  const h = D.settings.home;
  const secs = h.sections.filter((s) => s.on);
  const html = secs.map((s, i) => {
    const prev = secs[i - 1];
    switch (s.id) {
      case 'hero': return homeHero();
      case 'kpis': return homeKpis(prev && prev.id === 'hero');
      case 'golden': return goldSectionHTML(false);
      case 'featured': return homeFeatured();
      case 'gallery': return homeGallery();
      case 'stories': return homeStories();
      case 'logos': return homeLogos();
      case 'news': return homeNews();
      case 'share': return homeShare();
      default: return '';
    }
  }).join('');
  const o = D.settings.org;
  el.innerHTML = `<div class="home">${html}
    <footer class="hfoot"><span>${esc(o.name)} — ${esc(o.dept)}</span><span>${showDemo() ? 'تتضمن الصفحة بيانات تجريبية مميزة بوسم «تجريبي» ولا تمثل شراكات فعلية.' : 'المحتوى مصدره سجلات المنصة المنشورة.'}</span></footer></div>`;
  hydrateFiles(el);
  initHeroFX($('[data-hfx]', el), [[14, 34], [30, 58], [8, 62], [40, 30]]);
  initHeroRot(el);
  bindHome(el);
}

function homeHero() {
  const h = D.settings.home, o = D.settings.org;
  const draw = !App.heroDrawn; App.heroDrawn = true;
  const rot = heroRotHTML('classic');
  const art = rot ? `<div class="hfx-media">${rot}</div><div class="photo-fade hrot-fade"></div>` : h.heroImageFileId
    ? `<div class="hfx-media"><img class="photo hfx-img" data-file="${esc(h.heroImageFileId)}" alt=""></div><div class="photo-fade"></div>${h.heroImageFileId.startsWith('lib:') ? '<span class="illus hero-illus">صورة توضيحية</span>' : ''}`
    : `<div class="hfx-media">${topoSVG('hero-' + (o.name || ''), { W: 1600, H: 900, levels: 22, cols: 92, focus: 'left', draw })}</div><div class="fade"></div>`;
  return `<section class="hero" aria-label="الواجهة" data-tour="home-hero">
    <div class="hero-art hfx" data-hfx>${art}</div>
    <div class="hero-tools no-print">
      ${can('manage.content') ? `<a class="icon-btn" href="#/settings/home" title="تخصيص الرئيسية">${icon('settings')}</a>` : ''}
      <button class="icon-btn" data-present title="وضع العرض">${icon('expand')}</button>
    </div>
    <div class="hero-inner">
      <div class="hero-org">${o.logoFileId ? `<img data-file="${esc(o.logoFileId)}" alt="${esc(o.name)}">` : ''}<span>${esc(o.name)}</span><span class="bar"></span><span>${esc(o.dept)}</span></div>
      <h1>${esc(h.heroTitle)}</h1>
      <p class="lead">${esc(h.heroText)}</p>
      <div class="hero-actions">
        <a class="btn lg light" href="#/partnerships">${icon('layers')} استعرض الشراكات</a>
        <a class="btn lg outline" href="${can('proposal.create') ? '#/share/new' : '#/share'}">${icon('send')} شارك بمقترح شراكة</a>
      </div>
    </div>
  </section>`;
}

function homeKpis(overlap) {
  const per = homePeriod();
  const list = visiblePartnerships({ includeDrafts: false });
  const keys = (D.settings.home.kpis || []).filter((k) => HOME_KPIS[k]);
  if (!keys.length) return '';
  return `<section class="kband ${overlap ? '' : 'flat'}" aria-label="أرقام رئيسية" data-tour="home-impact">
    <div class="kband-in" style="--n:${keys.length}">
      <div class="kband-cap"><b>أرقام رئيسية</b><span>الفترة: ${per.text}<br>محسوبة تلقائيًا من سجلات المنصة${showDemo() ? '، وتشمل بيانات تجريبية' : ''}</span></div>
      ${keys.map((k) => { const K = HOME_KPIS[k]; return `<a class="kpi" href="${K.href()}"><div class="v">${nf(K.calc(list, per))}</div><div class="l">${esc(K.label)}</div><div class="s">${esc(K.subFn ? K.subFn(list) : K.sub)}</div></a>`; }).join('')}
    </div></section>`;
}

function spotResult(p) {
  if (p.highlight && p.highlight.value) return `<div><div class="spot-k">أبرز نتيجة</div><div class="spot-res"><span class="big">${esc(p.highlight.value)}</span><p><b>${esc(p.highlight.label || '')}</b>${p.highlight.text ? '<br>' + esc(p.highlight.text) : ''}</p></div></div>`;
  const st = publicStories().find((a) => a.partnershipId === p.id && a.metricValue);
  if (st) return `<div><div class="spot-k">أبرز نتيجة</div><div class="spot-res"><span class="big">${esc(st.metricValue)}</span><p><b>${esc(st.metricLabel || '')}</b><br>${esc(st.title)}</p></div></div>`;
  const outs = richItems(p.outputs).slice(0, 2);
  if (outs.length) return `<div><div class="spot-k">المخرجات المستهدفة</div><ul class="spot-out" style="margin:0;padding-right:18px">${outs.map((o) => `<li>${esc(o.title || o.text)}</li>`).join('')}</ul></div>`;
  return '';
}
function spotHTML(p) {
  const pr = partnerById(p.partnerId);
  const goal = p.showcaseGoal || firstItem(p.cooperationAreas);
  return `<div class="spot spot-anim" data-spot="${p.id}">
    <div class="spot-media">${coverHTML(p.id + (pr ? pr.name : ''), p.coverFileId, { W: 900, H: 640, levels: 16, cols: 60, tone: toneFor(pr) })}
      ${partnershipPhotos(p).length > 1 ? `<button class="photo-btn" data-pgal="${p.id}">${icon('image')} ${partnershipPhotos(p).length} صور</button>` : ''}
      <div class="spot-logo">${plateHTML(pr, 96)}</div></div>
    <div class="spot-body">
      <div><div class="spot-meta">${(p.categories || [])[0] ? `<span>${esc(p.categories[0])}</span>` : ''}<span>${esc(p.classification || 'مذكرة')}</span><span>${esc(pSector(p) ? 'القطاع ' + pSector(p) : '')}</span>${p.startDate ? `<span>منذ ${fmtDate(p.startDate, 'month')}</span>` : ''}</div>
        <h3 style="margin-top:10px">${esc(pr ? pr.name : p.title)} ${demoTag(p)}</h3></div>
      ${goal ? `<div><div class="spot-k">${p.showcaseGoal ? 'الهدف' : 'مجالات التعاون'}</div><p class="spot-goal">${esc(goal)}</p></div>` : ''}
      ${spotResult(p)}
      <div class="spot-foot"><a class="btn" href="#/partnerships/${p.id}">تفاصيل الشراكة ${icon('arrowL')}</a>${p.endDate ? `<span class="small muted">سارية حتى ${fmtDate(p.endDate)}</span>` : ''}</div>
    </div></div>`;
}
function homeFeatured() {
  const list = featuredList();
  if (!list.length) {
    if (!can('manage.content')) return '';
    return `<section class="hsec"><div class="hsec-h"><div><h2>شراكات مختارة</h2></div></div><div class="manage-hint"><span>لم تُحدَّد شراكات للعرض المميز. تظهر هنا الشراكات المنشورة التي تختارها الإدارة.</span><a class="btn sm" href="#/settings/home">اختيار الشراكات</a></div></section>`;
  }
  return `<section class="hsec" aria-label="شراكات مختارة" data-tour="home-partnerships">
    <div class="hsec-h"><div><h2>شراكات مختارة</h2><p>نماذج من شراكات الإدارة مع جهات حكومية وخاصة وغير ربحية.</p></div>${pshowBtn('featured')}<a class="lnk" href="#/partnerships">جميع الشراكات ${icon('arrowL')}</a></div>
    <div id="spotBox">${spotHTML(list[0])}</div>
    ${list.length > 1 ? `<nav class="spot-nav" aria-label="التنقل بين الشراكات المختارة">${list.map((p, i) => `<button class="${i === 0 ? 'on' : ''}" data-spotgo="${p.id}"><b>${esc(partnerName(p))}</b>${esc(p.classification || '')}${p.demo ? ' — تجريبي' : ''}</button>`).join('')}</nav>` : ''}
  </section>`;
}

function homeGallery() {
  const all = fieldPhotos();
  const f0 = featuredList()[0];
  if (f0 && all.length > 3 && all[0].fileId === f0.coverFileId) all.push(all.shift());
  const items = all.slice(0, 7);
  const allIllus = items.every((it) => it.fileId.startsWith('lib:'));
  if (items.length < 3) {
    if (!can('manage.content')) return '';
    return `<section class="hsec"><div class="hsec-h"><div><h2>من الميدان</h2></div></div><div class="manage-hint"><span>يظهر هنا معرض صور الشراكات المنشورة. ارفع الصور في سجل كل شراكة بتصنيف «صور الشراكة».</span><a class="btn sm" href="#/partnerships">سجل الشراكات</a></div></section>`;
  }
  return `<section class="hsec" aria-label="من الميدان">
    <div class="hsec-h"><div><h2>من الميدان</h2><p>صور من مواقع الشراكات المنشورة ومبادراتها.${allIllus ? ' <span class="illus-note">الصور المعروضة حاليًا توضيحية مولّدة، وتُستبدل بصور الميدان عند رفعها.</span>' : ''}</p></div><button class="lnk linkbtn" data-galall>عرض المعرض كاملًا (${all.length}) ${icon('arrowL')}</button></div>
    <div class="mosaic n${items.length}">${items.map((it, i) => `<figure class="mt" data-gi="${i}" tabindex="0">
      <img data-file="${esc(it.fileId)}" alt="${esc(it.caption)}">
      <figcaption><b>${esc(it.caption)}</b>${it.sub ? `<span>${esc(it.sub)}</span>` : ''}</figcaption>
      ${!allIllus && it.fileId.startsWith('lib:') ? '<span class="illus">صورة توضيحية</span>' : ''}</figure>`).join('')}</div></section>`;
}
function homeStories() {
  const list = featuredStories();
  if (!list.length) {
    if (!can('manage.content')) return '';
    return `<section class="hsec"><div class="hsec-h"><div><h2>إنجازات وقصص نجاح</h2></div></div><div class="manage-hint"><span>لا توجد قصص نجاح منشورة بعد. أضف الإنجازات من صفحة المحتوى واربطها بالشراكة الخاصة بها.</span><a class="btn sm" href="#/content">إدارة المحتوى</a></div></section>`;
  }
  const [lead, ...rest] = list;
  const lp = storyPartner(lead);
  return `<section class="hsec" aria-label="إنجازات وقصص نجاح">
    <div class="hsec-h"><div><h2>إنجازات وقصص نجاح</h2><p>نتائج تحققت على أرض الواقع عبر الشراكات.</p></div><a class="lnk" href="#/stories">جميع الإنجازات ${icon('arrowL')}</a></div>
    <div class="stories">
      <a class="story-lead" href="#" data-story="${lead.id}">
        <div class="media">${coverHTML('story' + lead.id, lead.coverFileId, { W: 960, H: 600, levels: 15, cols: 60, tone: toneFor(lp) })}
          ${lead.metricValue ? `<div class="metric"><b>${esc(lead.metricValue)}</b><span>${esc(lead.metricLabel || '')}</span></div>` : ''}</div>
        <h3>${esc(lead.title)}</h3><p>${esc(lead.summary || '')}</p>
        <div class="story-meta">${lp ? `<span>${esc(lp.name)}</span>` : ''}<span>${fmtDate(lead.date, 'month')}</span>${demoTag(lead)}</div>
      </a>
      <div class="story-list">${rest.slice(0, 3).map((a) => { const ap = storyPartner(a); return `<a class="story-item" href="#" data-story="${a.id}">
        <div class="th">${coverHTML('story' + a.id, a.coverFileId, { W: 400, H: 300, levels: 9, cols: 32, tone: toneFor(ap) })}</div>
        <div><h4>${esc(a.title)}</h4>${a.metricValue ? `<div class="mv">${esc(a.metricValue)} ${esc(a.metricLabel || '')}</div>` : ''}<div class="m">${ap ? esc(ap.name) + ' — ' : ''}${fmtDate(a.date, 'month')} ${demoTag(a)}</div></div></a>`; }).join('')}</div>
    </div></section>`;
}
function openStory(id) {
  const a = D.achievements.find((x) => x.id === id); if (!a) return;
  const p = D.partnerships.find((x) => x.id === a.partnershipId);
  const pr = p ? partnerById(p.partnerId) : null;
  const m = Modal.open({
    title: a.title, size: 'lg', cls: 'story-modal', noHead: true,
    body: `<div class="story-hero">${coverHTML('story' + a.id, a.coverFileId, { W: 1200, H: 520, levels: 16, cols: 70, tone: toneFor(pr) })}
        <button class="icon-btn" data-mclose style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,.9);color:#16222A" aria-label="إغلاق">${icon('x')}</button></div>
      <div class="story-content"><div>
        <div class="story-meta" style="margin-top:0;margin-bottom:8px">${fmtDate(a.date)} ${demoTag(a)}</div>
        <h2>${esc(a.title)}</h2>
        <p style="margin-top:12px;color:var(--ink-2);line-height:1.95">${esc(a.summary || '')}</p>
        <div style="margin-top:18px">${richHTML(a.body, { empty: '' })}</div>
        ${(a.gallery || []).length ? `<div class="gallery" data-galbox style="margin-top:18px">${a.gallery.map((g) => `<div class="g" data-zoom="${esc(g)}" data-cap="${esc(a.title)}" data-sub="${esc(pr ? pr.name : '')}"><img data-file="${esc(g)}" alt="">${g.startsWith('lib:') ? '<span class="illus">توضيحية</span>' : ''}</div>`).join('')}</div>` : ''}
      </div><aside>
        ${a.metricValue ? `<div class="story-fig"><b>${esc(a.metricValue)}</b><span>${esc(a.metricLabel || '')}</span></div>` : ''}
        ${pr ? `<div style="margin-top:24px"><div class="xs muted" style="margin-bottom:8px">الشراكة</div><div class="row">${plateHTML(pr, 56)}<div><b style="font-size:14px;font-weight:600;line-height:1.5;display:block">${esc(pr.name)}</b><a href="#/partnerships/${p.id}" data-mclose class="small">تفاصيل الشراكة</a></div></div></div>` : ''}
      </aside></div>`,
  });
  hydrateFiles(m.el);
}

function homeLogos() {
  const pub = publicPartnerships();
  const seen = new Map();
  pub.forEach((p) => { const pr = partnerById(p.partnerId); if (pr && !seen.has(pr.id)) seen.set(pr.id, { pr, p }); });
  const items = [...seen.values()];
  if (!items.length) return '';
  const secs = L('sectors').filter((s) => items.some((i) => i.pr.sector === s));
  return `<section class="hsec" aria-label="الشركاء">
    <div class="hsec-h"><div><h2>شركاؤنا</h2><p>${plural(items.length, 'جهة واحدة', 'جهتان', 'جهات', 'جهة')} من القطاعات الحكومية والخاصة وغير الربحية.</p></div>
      ${secs.length > 1 ? `<div class="logo-tabs" role="tablist"><button class="on" data-lsec="">الكل</button>${secs.map((s) => `<button data-lsec="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}</div>
    <div class="logo-grid">${items.map(({ pr, p }) => `<a class="logo-cell" href="#/partnerships/${p.id}" data-sec="${esc(pr.sector || '')}" title="${esc(pr.name)}">
      ${pr.logoFileId ? `<div class="lg"><img data-file="${esc(pr.logoFileId)}" alt="${esc(pr.name)}"></div><span class="sec">${esc(pr.sector || '')}</span>` : `<span class="wm">${esc(pr.name)}</span><span class="sec">${esc(pr.sector || '')}</span>`}
      ${demoTag(pr)}</a>`).join('')}</div></section>`;
}

function newsItems() {
  const manual = publicNews().map((n) => ({ ...n, src: 'خبر' }));
  const t = today();
  const auto = publicPartnerships().filter((p) => p.stage === 'signed' && p.startDate && parseDate(p.startDate) <= t && daysBetween(parseDate(p.startDate), t) <= 400)
    .filter((p) => !manual.some((n) => n.partnershipId === p.id && Math.abs(daysBetween(parseDate(n.date), parseDate(p.startDate))) < 10))
    .map((p) => ({ id: 'auto-' + p.id, title: `بدء سريان ${p.classification || 'الشراكة'} مع ${partnerName(p)}`, date: p.startDate, body: firstItem(p.cooperationAreas).slice(0, 180), partnershipId: p.id, demo: p.demo, src: 'من سجل الشراكات' }));
  return [...manual, ...auto].sort((a, b) => (a.date < b.date ? 1 : -1));
}
function homeNews() {
  const items = newsItems().slice(0, 5);
  if (!items.length) return '';
  return `<section class="hsec" aria-label="آخر المستجدات">
    <div class="hsec-h"><div><h2>آخر المستجدات</h2><p>أخبار الشراكات وبدء سريان المذكرات الجديدة.</p></div></div>
    <div class="news">${items.map((n) => `<article class="news-item"><time>${fmtDate(n.date)}</time>
      <div><h4>${n.partnershipId ? `<a href="#/partnerships/${n.partnershipId}" style="color:inherit">${esc(n.title)}</a>` : esc(n.title)} ${demoTag(n)}</h4>${n.body ? `<p>${esc(n.body)}</p>` : ''}</div>
      <span class="src">${esc(n.src)}</span></article>`).join('')}</div></section>`;
}

function homeShare() {
  return `<section class="share-band" aria-label="شارك بمقترح شراكة" data-tour="home-share"><div class="share-in">
    <div class="share-l"><h2>اقترح جهة للشراكة مع المؤسسة</h2>
      <p>تستقبل إدارة الشراكات مقترحات الإدارات بشأن الجهات التي ترى فيها فرصة لتعاون يخدم أهداف المؤسسة، وتدرسها وتبلغ الإدارة المقدمة بالنتيجة.</p>
      <a class="btn lg primary" href="${can('proposal.create') ? '#/share/new' : '#/share'}">${icon('send')} شارك بمقترح شراكة</a></div>
    <div class="share-r"><ol class="steps">
      <li><div><b>قدّم المقترح</b><span>بيانات الجهة المستهدفة، ومستهدفات الشراكة، والقيمة المضافة، ومسؤول التواصل.</span></div></li>
      <li><div><b>تدرسه إدارة الشراكات</b><span>قد تطلب استكمال معلومات قبل اتخاذ القرار.</span></div></li>
      <li><div><b>تابع حالته برقمه المرجعي</b><span>تظهر كل مستجدات المقترح وملاحظات المراجعة في صفحة «مقترحاتي».</span></div></li>
    </ol></div></div></section>`;
}

function bindHome(el) {
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-gi]')) openGallery(fieldPhotos(), +e.target.dataset.gi); });
  el.addEventListener('click', (e) => {
    const go = e.target.closest('[data-spotgo]');
    if (go) {
      const p = D.partnerships.find((x) => x.id === go.dataset.spotgo);
      $('#spotBox', el).innerHTML = spotHTML(p); hydrateFiles($('#spotBox', el));
      $$('[data-spotgo]', el).forEach((b) => b.classList.toggle('on', b === go));
      return;
    }
    const st = e.target.closest('[data-story]');
    if (st) { e.preventDefault(); openStory(st.dataset.story); return; }
    const gi = e.target.closest('[data-gi]');
    if (gi) return openGallery(fieldPhotos(), +gi.dataset.gi);
    if (e.target.closest('[data-galall]')) return openGallery(fieldPhotos(), 0);
    const pg = e.target.closest('[data-pgal]');
    if (pg) { const p = D.partnerships.find((x) => x.id === pg.dataset.pgal); return openGallery(partnershipPhotos(p), 0); }
    const ls = e.target.closest('[data-lsec]');
    if (ls) {
      $$('[data-lsec]', el).forEach((b) => b.classList.toggle('on', b === ls));
      $$('.logo-cell', el).forEach((c) => { c.style.display = !ls.dataset.lsec || c.dataset.sec === ls.dataset.lsec ? '' : 'none'; });
      return;
    }
    if (e.target.closest('[data-present]')) togglePresent();
  });
}
function togglePresent() {
  const app = $('.app');
  const on = !app.classList.contains('present');
  app.classList.toggle('present', on);
  if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (on) toast('وضع العرض — للخروج اضغط Esc أو «إنهاء العرض»');
  setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) { const a = $('.app'); a && a.classList.remove('present'); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const a = $('.app.present'); a && a.classList.remove('present'); } });

/* صفحة جميع الإنجازات */
function renderStories(el) {
  const list = publicStories().sort((a, b) => (a.date < b.date ? 1 : -1));
  el.innerHTML = `<div class="ph"><div><h1>الإنجازات وقصص النجاح</h1><p>ما تحقق عبر الشراكات، مرتبطًا بالشراكة الخاصة بكل إنجاز.</p></div>
    <div class="ph-actions">${can('manage.content') ? `<a class="btn" href="#/content">${icon('edit')} إدارة المحتوى</a>` : ''}</div></div>
    ${list.length ? `<div class="cards">${list.map((a) => { const pr = storyPartner(a); return `<a class="pcard" href="#" data-story="${a.id}">
      <div class="media">${coverHTML('story' + a.id, a.coverFileId, { W: 600, H: 300, levels: 10, cols: 40, tone: toneFor(pr) })}${a.metricValue ? `<span class="st"><span class="chip gold plain">${esc(a.metricValue)} ${esc(a.metricLabel || '')}</span></span>` : ''}</div>
      <div class="bd" style="padding-top:16px"><h3>${esc(a.title)}</h3><p class="goal">${esc(a.summary || '')}</p></div>
      <div class="ft"><span>${pr ? esc(pr.name) : ''}</span><span>${fmtDate(a.date, 'month')} ${demoTag(a)}</span></div></a>`; }).join('')}</div>`
    : emptyHTML({ ic: 'award', title: 'لا توجد إنجازات منشورة', text: 'تظهر هنا الإنجازات التي يضيفها فريق الشراكات ويختار نشرها.', actions: can('manage.content') ? '<a class="btn primary" href="#/content">إضافة إنجاز</a>' : '' })}`;
  hydrateFiles(el);
  el.onclick = (e) => { const s = e.target.closest('[data-story]'); if (s) { e.preventDefault(); openStory(s.dataset.story); } };
}
