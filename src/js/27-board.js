/* =====================================================================
   الاتجاه السادس «المجلس»: رسمي وتسويقي معًا، للعرض على مجالس الإدارة والقيادات
   ===================================================================== */
const boardThemeKey = () => D.settings.boardTheme || 'light';
const boardLogoKey = () => (boardThemeKey() === 'dark' ? 'murooj-logo-dark' : 'murooj-logo');
const BO_AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const boIdx = (i) => String(i).padStart(2, '0');
const boSecName = (s) => ({ 'حكومي': 'الحكومي', 'خاص': 'الخاص', 'غير ربحي': 'غير الربحي' }[s] || `«${s}»`);

/* التاريخ بالتقويمين الهجري والميلادي */
function boHijri(d = new Date()) {
  try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s*هـ$/, '') + 'هـ'; } catch (_) { return ''; }
}
function boDates(d = new Date()) {
  const day = (() => { try { return new Intl.DateTimeFormat('ar', { weekday: 'long' }).format(d); } catch (_) { return ''; } })();
  return { day, hijri: boHijri(d), greg: fmtDate(isoDate(d)) + 'م' };
}

/* — الشريط العلوي: صف الهوية وصف التنقل المرقّم — */
function boardTopbarHTML(tourBtn, demo, roleBox) {
  const o = D.settings.org, dk = boardThemeKey() === 'dark';
  const groups = navGroups();
  const flat = groups.flatMap((g) => g.items);
  const pick = (h) => flat.find((it) => it.h === h);
  const main = ['#/', '#/tasks', '#/dashboard', '#/partnerships', '#/partners', '#/reports', '#/share'].map(pick).filter(Boolean);
  const label = (it) => ({ '#/dashboard': 'لوحة الأداء' }[it.h] || it.l);
  const rest = flat.filter((it) => !main.includes(it));
  const dt = boDates();
  const link = (it, i) => `<a class="nav-a bo-link" href="${it.h}" data-m="${it.m.join(',')}" ${it.only ? `data-only="${it.only}"` : ''} ${it.not ? `data-not="${it.not}"` : ''}><em>${boIdx(i + 1)}</em>${esc(label(it))}${it.cnt ? `<span class="cnt">${it.cnt}</span>` : ''}</a>`;
  const news = [can('edit.partnership') && ['#/partnerships/new', 'layers', 'شراكة جديدة', 'سجل شراكة قيد الإعداد'], can('proposal.create') && ['#/share/new', 'send', 'مقترح شراكة', 'من خدمة «شارك»'], can('manage.partners') && ['#/partners', 'building', 'جهة شريكة', 'في سجل الجهات الموحد'], can('edit.partnership') && ['#/media?upload=1', 'upload', 'رفع صور', 'إلى مركز الصور']].filter(Boolean);
  return `<div class="bo-row1">
      <button class="icon-btn menu-btn" data-menu aria-label="القائمة">${icon('menu')}</button>
      <a class="bo-brand" href="#/"><img src="${(ASSET_IMG[boardLogoKey()] || {}).src || ''}" alt="${esc(o.name)}"><span class="bo-brand-rule" aria-hidden="true"></span><span class="bo-brand-t"><b>${esc(o.platform)}</b><small>${esc(o.name)} · ${esc(o.dept)}</small></span></a>
      <button class="bo-find" type="button" data-palette aria-label="بحث ووصول سريع (Ctrl+K)">${icon('search')}<span>ابحث أو انتقل أو نفّذ إجراءً…</span><kbd>Ctrl K</kbd></button>
      <div class="bo-tools">${news.length ? `<div class="st-dd bo-new"><button class="btn primary st-ddt bo-new-b" type="button" aria-haspopup="true">${icon('plus')}<span>جديد</span></button>
          <div class="st-ddm">${news.map(([h, ic, t, d]) => `<a class="nav-a bo-new-i" href="${h}" data-m="">${icon(ic)}<span><b>${t}</b><small>${d}</small></span></a>`).join('')}</div></div>` : ''}
        ${tourBtn}${demo}
        <button class="icon-btn bo-theme" data-themetoggle type="button" title="${dk ? 'الوضع النهاري' : 'الوضع الليلي'}" aria-label="تبديل الوضع النهاري والليلي">${icon(dk ? 'sun' : 'moon')}</button>${roleBox}</div>
    </div>
    <nav class="bo-row2" aria-label="التنقل الرئيسي"><span class="bo-ind" aria-hidden="true"></span>${main.map(link).join('')}
      ${rest.length ? `<div class="st-dd bo-more" data-gm="more"><button class="st-link st-ddt bo-link" type="button" aria-haspopup="true"><em>${boIdx(main.length + 1)}</em>المزيد${rest.some((x) => x.cnt) ? `<span class="cnt">${rest.reduce((t, x) => t + (x.cnt || 0), 0)}</span>` : ''}${icon('chevD')}</button>
        <div class="st-ddm bo-mega">${groups.map((g) => { const its = g.items.filter((it) => rest.includes(it)); return its.length ? `<div class="bo-mega-g"><h5>${esc(g.t)}</h5>${its.map((it) => `<a class="nav-a" href="${it.h}" data-m="${it.m.join(',')}" ${it.only ? `data-only="${it.only}"` : ''} ${it.not ? `data-not="${it.not}"` : ''}>${icon(it.ic)}<span>${esc(it.l)}</span>${it.cnt ? `<span class="cnt">${it.cnt}</span>` : ''}</a>`).join('')}</div>` : ''; }).join('')}</div></div>` : ''}
      <span class="bo-row2-sp"></span><div class="bo-date" aria-label="تاريخ اليوم"><span>${esc(dt.day)}</span><b>${esc(dt.hijri)}</b><i aria-hidden="true"></i><b>${esc(dt.greg)}</b></div></nav>`;
}
/* المؤشر الذهبي ينزلق تحت الصفحة المفتوحة */
function boMoveInd(animate = true) {
  const nav = $('.bo-row2'), ind = nav && $('.bo-ind', nav); if (!ind) return;
  const a = $('.bo-row2 > .bo-link.on', nav) || $('.bo-more.on > .bo-link', nav);
  if (!a) { ind.style.opacity = '0'; return; }
  const nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
  if (!animate) ind.style.transition = 'none';
  ind.style.width = `${ar.width - 20}px`; ind.style.transform = `translateX(${ar.left - nr.left + 10}px)`; ind.style.opacity = '1';
  if (!animate) { void ind.offsetWidth; ind.style.transition = ''; }
}
addEventListener('resize', () => { if (design() === 'board') boMoveInd(false); });
/* عند دخول أي صفحة: سطر تعريفي فوق العنوان بالقسم ورقمه، وحركة دخول هادئة */
function boardRouteEnter(page, name) {
  if (design() !== 'board') return;
  requestAnimationFrame(() => boMoveInd(!!App.boNavSeen)); App.boNavSeen = true;
  const ph = page.querySelector(':scope > .ph, .ph'); if (!ph || ph.querySelector('.bo-ph-eye')) return;
  const g = navGroups().find((x) => x.items.some((it) => it.m.includes(name)));
  const t = ph.querySelector('h1'); if (!g || !t) return;
  const eye = document.createElement('div'); eye.className = 'bo-ph-eye'; eye.innerHTML = `<i></i>${esc(g.t)}`;
  t.parentElement.insertBefore(eye, t);
}

/* — ظهور الأقسام أثناء التمرير — */
function boReveal(root) {
  const els = $$('.bo-rv', root);
  if (cuReduce() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('bo-on')); return; }
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('bo-on'); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
  // القفز السريع (End أو الروابط) قد يتخطى أقسامًا دون أن تتقاطع مع الشاشة: كل ما فوق حافة الشاشة السفلى يظهر
  let raf = 0;
  const sweep = () => { raf = 0; const left = els.filter((e) => e.isConnected && !e.classList.contains('bo-on')); if (!left.length || !root.isConnected) { removeEventListener('scroll', onS); return; } left.forEach((e) => { if (e.getBoundingClientRect().top < innerHeight * 0.94) { e.classList.add('bo-on'); io.unobserve(e); } }); };
  const onS = () => { if (!raf) raf = requestAnimationFrame(sweep); };
  addEventListener('scroll', onS, { passive: true });
}

/* =====================================================================
   الرئيسية
   ===================================================================== */
function renderHomeBoard(el) {
  const h = D.settings.home, o = D.settings.org;
  const c = liveCounts();
  const list = visiblePartnerships().filter((p) => !p.isDraft);
  const signed = list.filter((p) => p.stage === 'signed');
  const secs = [...new Set(signed.map(pSector).filter(Boolean))];
  const depts = new Set(signed.flatMap((p) => p.departments || []));
  const outputs = signed.reduce((t, p) => t + richItems(p.outputs).length, 0);
  const props = visibleProposals().filter((x) => x.status !== 'draft');
  const photoA = ASSET_IMG['border-guard-signing'], photoB = ASSET_IMG['waqf-saitah-signing'];
  const feat = (featuredList().length ? featuredList() : publicPartnerships().filter((p) => ['active', 'soon'].includes(pStatus(p)))).slice(0, 3);
  const stories = (featuredStories().length ? featuredStories() : publicStories()).slice(0, 3);
  const partners = D.partners.filter((pr) => list.some((p) => p.partnerId === pr.id));
  const st = (k) => list.filter((p) => k.includes(pStatus(p))).length;
  const steps = [
    { n: props.length, t: 'مقترح من الإدارات', d: 'تقدّم الإدارات فرص الشراكة عبر خدمة «شارك»', h: '#/share' },
    { n: props.filter((x) => ['submitted', 'review', 'info'].includes(x.status)).length + st(['prep', 'sign']), t: 'قيد الدراسة والإعداد', d: 'مراجعة المقترح وإعداد المذكرة حتى التوقيع', h: '#/partnerships?status=prep|sign' },
    { n: c.active, t: 'شراكة سارية', d: 'تنفيذ المخرجات ومتابعة الالتزامات', h: '#/partnerships?status=active|soon' },
    { n: publicStories().length, t: 'قصة أثر موثّقة', d: 'نتائج ميدانية منشورة مرتبطة بشراكاتها', h: '#/stories' },
  ];
  el.classList.add('full');
  el.innerHTML = `<div class="bo-home">
    <section class="bo-hero" data-tour="home-hero">
      <div class="bo-hero-bg bo-geo" aria-hidden="true"><svg width="100%" height="100%"><defs><pattern id="boStar" width="96" height="96" patternUnits="userSpaceOnUse"><g fill="none" stroke-width="1"><rect x="20" y="20" width="56" height="56"/><rect x="20" y="20" width="56" height="56" transform="rotate(45 48 48)"><animateTransform attributeName="transform" type="rotate" values="45 48 48;405 48 48" dur="48s" repeatCount="indefinite"/></rect><circle cx="48" cy="48" r="9"/><path d="M0 48H8M88 48h8M48 0v8M48 88v8"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#boStar)"/></svg><span class="bo-geo-glow"></span></div>
      <div class="bo-hero-in">
        <div class="bo-hero-t">
          <div class="bo-eyebrow"><i></i>${esc(o.name)} · ${esc(o.dept)}</div>
          <h1>${esc(h.heroTitle || 'نربط المؤسسة بشركاء يوسّعون أثرها البيئي')}</h1>
          <p class="bo-lead">${esc(h.heroText || '')}</p>
          <div class="bo-cta">${can('view.dashboard') ? `<a class="btn primary lg" href="#/dashboard">${icon('chart')} لوحة الأداء</a>` : ''}<a class="btn lg" href="#/partnerships">${icon('layers')} سجل الشراكات</a></div>
          <dl class="bo-hero-facts">
            <div><dt>شراكات سارية</dt><dd><b class="cu" data-v="${c.active}">${c.active}</b></dd></div>
            <div><dt>جهات شريكة</dt><dd><b class="cu" data-v="${c.partners}">${c.partners}</b></dd></div>
            <div><dt>قطاعات ممثلة</dt><dd><b class="cu" data-v="${secs.length}">${secs.length}</b></dd></div>
          </dl>
        </div>
        <div class="bo-hero-m">
          <figure class="bo-ph a">${heroRotHTML('board') || (photoA ? `<img class="photo" src="${photoA.src}" alt="${esc(photoA.title)}">` : coverHTML('bo-a', null, { W: 800, H: 600 }))}</figure>
          ${photoB ? `<figure class="bo-ph b"><img class="photo hrot-twin" data-hrot-twin src="${photoB.src}" alt=""></figure>` : ''}
          <div class="bo-medal" aria-hidden="true"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56"/><circle cx="60" cy="60" r="47" class="rot"/><circle cx="60" cy="60" r="39" class="inr"/></svg><b>${c.partners}</b><span>جهة شريكة</span></div>
        </div>
      </div>
    </section>

    ${boQuickHTML()}
    <section class="bo-figs bo-rv" data-tour="home-impact">
      <header class="bo-sh"><span class="bo-num">01</span><div><h2>المنظومة بالأرقام</h2><p>أرقام حية تُحسب من سجلات المنصة لحظة العرض</p></div></header>
      <div class="bo-figs-g">
        ${[
          { v: c.active, l: 'شراكة سارية', s: `من ${signed.length} شراكة موقّعة`, viz: boDots(c.active, signed.length), h: '#/partnerships?status=active|soon' },
          { v: c.partners, l: 'جهة شريكة', s: `في ${plural(secs.length, 'قطاع واحد', 'قطاعين', 'قطاعات', 'قطاعًا')}`, viz: boSecStrip(list), h: can('view.partners') ? '#/partners' : '#/partnerships' },
          { v: outputs, l: 'مخرجًا مستهدفًا', s: 'في الشراكات الموقّعة', viz: boTicks(outputs), h: '#/partnerships' },
          { v: depts.size, l: 'إدارة متقاطعة', s: 'تشارك في تنفيذ الشراكات', viz: boTicks(depts.size, 'dept'), h: can('view.dashboard') ? '#/dashboard' : '#/partnerships' },
        ].map((f) => `<a class="bo-fig" href="${f.h}"><b class="cu" data-v="${f.v}">${f.v}</b><span class="bo-fig-l">${f.l}</span><span class="bo-fig-viz">${f.viz}</span><small>${f.s}</small></a>`).join('')}
      </div>
    </section>

    <section class="bo-journey bo-rv">
      <header class="bo-sh"><span class="bo-num">02</span><div><h2>رحلة الشراكة</h2><p>من فكرة في إدارة إلى أثر موثّق على أرض الواقع</p></div></header>
      <ol class="bo-steps">${steps.map((s, i) => `<li style="--i:${i}"><a href="${s.h}"><span class="bo-step-n"><i>${BO_AR(i + 1)}</i></span><b class="cu" data-v="${s.n}">${s.n}</b><strong>${s.t}</strong><small>${s.d}</small></a></li>`).join('')}</ol>
    </section>

    ${(D.settings.home.sections.find((x) => x.id === 'golden') || { on: true }).on ? goldSectionHTML(true) : ''}
    ${feat.length ? `<section class="bo-feat bo-rv" data-tour="home-partnerships">
      <header class="bo-sh"><span class="bo-num">03</span><div><h2>شراكات مختارة</h2><p>نماذج من الشراكات السارية ومخرجاتها</p></div>${pshowBtn('featured')}<a class="bo-more-l" href="#/partnerships">كل الشراكات ${icon('arrowL')}</a></header>
      <div class="bo-cards">${feat.map((p, i) => boPCard(p).replace('<a class="bo-pc"', `<a class="bo-pc" style="--i:${i}"`)).join('')}</div></section>` : ''}

    ${stories.length ? `<section class="bo-stories bo-rv">
      <header class="bo-sh"><span class="bo-num">${feat.length ? '04' : '03'}</span><div><h2>قصص الأثر</h2><p>ما تحقق في الميدان عبر الشراكات</p></div><a class="bo-more-l" href="#/stories">كل الإنجازات ${icon('arrowL')}</a></header>
      <div class="bo-st-g">${stories.map((a, i) => { const pr = storyPartner(a); return `<a class="bo-st ${i === 0 ? 'lead' : ''}" href="#" data-story="${a.id}"><div class="bo-st-m">${coverHTML('story' + a.id, a.coverFileId, { W: 900, H: 560, levels: 12, cols: 50, tone: toneFor(pr) })}</div>
        <div class="bo-st-b">${a.metricValue ? `<div class="bo-st-k"><b>${esc(a.metricValue)}</b><span>${esc(a.metricLabel || '')}</span></div>` : ''}<h3>${esc(a.title)}</h3>${i === 0 ? `<p>${esc(a.summary || '')}</p>` : ''}<small>${pr ? esc(pr.name) : ''} · ${fmtDate(a.date, 'month')} ${demoTag(a)}</small></div></a>`; }).join('')}</div></section>` : ''}

    ${partners.length ? `<section class="bo-wall bo-rv">
      <header class="bo-sh"><span class="bo-num">${boIdx(3 + !!feat.length + !!stories.length)}</span><div><h2>شركاؤنا</h2><p>جهات حكومية وخاصة وغير ربحية تتكامل مع المؤسسة</p></div></header>
      <div class="bo-wall-g">${[...L('sectors'), ''].map((s) => { const ps = partners.filter((pr) => (pr.sector || '') === s); return ps.length ? `<div class="bo-wall-s"><h4><i style="background:${SEC_VAR(s)}"></i>${esc(s || 'غير محدد')}<span>${ps.length}</span></h4><div class="bo-wall-l">${ps.map((pr) => `<a href="${can('view.partners') ? '#/partners/' + pr.id : '#/partnerships'}" title="${esc(pr.name)}">${plateHTML(pr, 48)}<span>${esc(pr.name)}</span></a>`).join('')}</div></div>` : ''; }).join('')}</div></section>` : ''}

    <section class="bo-close bc2 bo-rv">
      <div class="bc-bg" aria-hidden="true"><svg width="100%" height="100%"><defs><pattern id="bcStar" width="120" height="120" patternUnits="userSpaceOnUse"><g fill="none" stroke-width="1"><rect x="30" y="30" width="60" height="60"/><rect x="30" y="30" width="60" height="60" transform="rotate(45 60 60)"/><circle cx="60" cy="60" r="10"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#bcStar)"/></svg>
        <svg class="bc-ring" viewBox="-200 -200 400 400"><g><circle r="180"/><circle r="150" class="d"/>${Array.from({ length: 24 }, (_, k) => { const a = k / 24 * Math.PI * 2; return `<circle class="p" r="3" cx="${(Math.cos(a) * 180).toFixed(1)}" cy="${(Math.sin(a) * 180).toFixed(1)}"/>`; }).join('')}<rect x="-70" y="-70" width="140" height="140"/><rect x="-70" y="-70" width="140" height="140" transform="rotate(45)"/></g></svg>
        <svg class="bc-ring l" viewBox="-200 -200 400 400"><g><circle r="180"/><circle r="150" class="d"/><rect x="-70" y="-70" width="140" height="140"/><rect x="-70" y="-70" width="140" height="140" transform="rotate(45)"/></g></svg><i class="bc-sweep"></i></div>
      <div class="bo-close-in"><span class="bo-q" aria-hidden="true">”</span><p>كل شراكة في هذه المنظومة مرتبطة بأثر يمكن قياسه، وبمسؤول يتابعها، وبقرار في وقته.</p>
        <dl class="bc-stats">${[[c.active, 'شراكة سارية'], [c.partners, 'جهة شريكة'], [outputs, 'مخرجًا مستهدفًا'], [publicStories().length, 'قصة أثر']].map(([v, l], k) => `<div style="--k:${k}"><dd><b class="cu" data-v="${v}">${v}</b></dd><dt>${l}</dt></div>`).join('')}</dl>
        <div class="bo-cta">${can('proposal.create') ? `<a class="btn gold lg" href="#/share">${icon('send')} شارك بمقترح شراكة</a>` : ''}${can('view.reports') ? `<a class="btn lg" href="#/reports">${icon('file')} التقارير</a>` : ''}</div></div>
    </section>
    <footer class="bo-foot"><span>${esc(o.name)} — ${esc(o.dept)}</span><span>${showDemo() ? 'تتضمن الصفحة بيانات تجريبية مميزة بوسم «تجريبي» ولا تمثل شراكات فعلية.' : 'المحتوى مصدره سجلات المنصة المنشورة.'}</span></footer>
  </div>`;
  hydrateFiles(el);
  runCountUps(el);
  boReveal(el);
  initHeroRot(el);
  if (cuReduce()) $$('animateTransform', el).forEach((a) => a.remove());
  el.onclick = (e) => { const s = e.target.closest('[data-story]'); if (s) { e.preventDefault(); openStory(s.dataset.story); } };
}
/* اختصارات العمل اليومي: كل بطاقة تذهب إلى المهمة مباشرة وتعرض ما ينتظر */
function boQuickHTML() {
  const vp = visiblePartnerships().filter((p) => !p.isDraft);
  const props = visibleProposals();
  const pend = props.filter((x) => x.status === 'submitted').length;
  const soon = vp.filter((p) => pStatus(p) === 'soon').length;
  const mineInfo = Session.role() === 'dept' ? props.filter((x) => x.department === Session.dept() && x.status === 'info').length : 0;
  const T = [
    Session.role() !== 'viewer' && (() => { const n = wfTasks().filter((t) => !t.follow).length; return { h: '#/tasks', ic: 'flag', t: 'مهامي', d: 'خطوات المسار المسندة لحسابك', b: n ? `${n} بانتظارك` : '' }; })(),
    { h: '#/partnerships', ic: 'layers', t: 'سجل الشراكات', d: 'ابحث وصفِّ وافتح أي شراكة', b: soon ? `${soon} ${nounFor(soon, ['تنتهي قريبًا', 'تنتهيان قريبًا', 'تنتهي قريبًا', 'تنتهي قريبًا'])}` : '' },
    can('view.dashboard') && { h: '#/dashboard', ic: 'chart', t: 'لوحة الأداء', d: 'العرض المختصر والمفصّل', b: '' },
    can('proposal.review') && { h: '#/proposals?status=submitted', ic: 'inbox', t: 'المقترحات الواردة', d: 'مراجعة مقترحات الإدارات', b: pend ? `${pend} ${nounFor(pend, ['جديد', 'جديدان', 'جديدة', 'جديدًا'])}` : '' },
    can('proposal.create') && { h: '#/share/new', ic: 'send', t: 'شارك بمقترح', d: mineInfo ? 'لديك مقترح بانتظار الاستكمال' : `${plural(S_STEPS.length, 'خطوة واحدة', 'خطوتان', 'خطوات', 'خطوة')} لاقتراح جهة`, b: mineInfo ? `${mineInfo} بانتظار الاستكمال` : '' },
    { h: '#/media', ic: 'image', t: 'مركز الصور', d: 'صور الشراكات والإنجازات', b: '' }, { h: '#/gallery', ic: 'star', t: 'معرض الأثر', d: 'عرض سينمائي لصور الشراكات', b: '' },
    can('view.reports') && { h: '#/reports', ic: 'file', t: 'التقارير', d: 'PowerPoint وPDF بضغطة', b: '' },
  ].filter(Boolean).slice(0, 5);
  if (T.length < 5) T.push(...[{ h: '#/process', ic: 'convert', t: 'مسار الشراكة', d: 'الخطوات والمسؤوليات', b: '' }].slice(0, 5 - T.length));
  return `<section class="bo-quick" aria-label="اختصارات"><div class="bo-quick-in">
    ${T.map((x, i) => `<a class="bo-qt" href="${x.h}" style="--i:${i}"><span class="bo-qt-ic">${icon(x.ic)}</span><span class="bo-qt-t"><b>${x.t}</b><small>${x.d}</small></span>${x.b ? `<em>${esc(x.b)}</em>` : icon('arrowL')}</a>`).join('')}
    <button type="button" class="bo-qt find" data-palette style="--i:${T.length}"><span class="bo-qt-ic">${icon('search')}</span><span class="bo-qt-t"><b>ابحث في كل شيء</b><small>شراكة، جهة، مقترح، أو إجراء</small></span><kbd>Ctrl K</kbd></button>
  </div></section>`;
}
function boDots(n, of) {
  const tot = Math.min(of, 24), on = of ? Math.round(n / of * tot) : 0;
  return `<span class="bo-dots">${Array.from({ length: tot }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</span>`;
}
function boSecStrip(list) {
  const m = {}; list.forEach((p) => { const s = pSector(p) || 'غير محدد'; (m[s] = m[s] || new Set()).add(p.partnerId); });
  return `<span class="bo-strip">${Object.entries(m).map(([s, v]) => `<i style="flex:${v.size};background:${SEC_VAR(s)}" title="${esc(s)}: ${v.size}"></i>`).join('')}</span>`;
}
function boTicks(n, kind = '') { return `<span class="bo-ticks ${kind}">${Array.from({ length: Math.min(n, 40) }, () => '<i></i>').join('')}</span>`; }
function boPCard(p) {
  const pr = partnerById(p.partnerId), tp = termProgress(p), hl = p.highlight;
  return `<a class="bo-pc" href="#/partnerships/${p.id}">
    <div class="bo-pc-m">${coverHTML('p' + p.id, p.coverFileId, { W: 720, H: 420, levels: 11, cols: 44, tone: toneFor(pr) })}<span class="bo-pc-sec">${esc(pSector(p) || '')}</span></div>
    <div class="bo-pc-b"><div class="bo-pc-h">${plateHTML(pr, 44)}<div><h3>${esc(partnerName(p))} ${demoTag(p)}</h3><small>${esc((p.categories || [])[0] || p.classification || '')}</small></div></div>
      ${hl && hl.value ? `<div class="bo-pc-k"><b>${esc(hl.value)}</b><span>${esc(hl.label || '')}</span></div>` : `<p>${esc(firstItem(p.expectedImpact) || firstItem(p.cooperationAreas)).slice(0, 120)}</p>`}
      ${tp !== null ? `<div class="bo-term"><span><i style="width:${Math.round(tp * 100)}%"></i></span><small>${fmtDate(p.startDate, 'short')} — ${fmtDate(p.endDate, 'short')}</small></div>` : ''}</div></a>`;
}

/* =====================================================================
   لوحة المجلس — إحاطة رسمية بفصول مرقّمة، كل فصل برسالة ورسم
   ===================================================================== */
const BO_CH = [
  { id: 'sum', t: 'الخلاصة التنفيذية', s: 'ثلاث رسائل رئيسية ومؤشر سلامة المحفظة' },
  { id: 'impact', t: 'الأثر المتحقق', s: 'النتائج الميدانية بالرموز والصور، لا بالأرقام وحدها' },
  { id: 'eval', t: 'تقييم الشراكات وقيمتها', s: 'نموذج تقييم الشراكة، والتصنيف، ومن فتح الباب، والوضع المالي' },
  { id: 'proc', t: 'سير الإجراءات', s: 'أين تقف كل مذكرة في المسار المعتمد، ومن يحملها الآن' },
  { id: 'net', t: 'منظومة الشركاء', s: 'شبكة الجهات حول المؤسسة حسب القطاع والحالة' },
  { id: 'flow', t: 'تدفق المحفظة', s: 'من قطاع الجهة إلى مجال الشراكة إلى حالتها' },
  { id: 'time', t: 'المسار الزمني والاستحقاقات', s: 'مدة كل شراكة وإنجازاتها الموثقة، وسجل المتابعة' },
  { id: 'dec', t: 'القرارات والتوصيات', s: 'ما يُعرض على المجلس للاعتماد أو التوجيه' },
];
function renderDashBoard(el) {
  el.classList.add('dashpage');
  App.dashHist = App.dashHist || [];
  App.dashLast = null;
  const base = () => visiblePartnerships();
  const lu = lastDataUpdate();
  const dt = boDates();
  el.innerHTML = `<div class="bo-dash" id="boDash">
    <header class="bo-cover">
      <div class="bo-cover-bg" aria-hidden="true">${topoSVG('bo-cover', { W: 1400, H: 520, levels: 12, cols: 60, focus: 'left', cls: 'topo bo-topo' })}</div>
      <div class="bo-cover-t">
        <div class="bo-eyebrow"><i></i>إحاطة مجلس الإدارة<span class="bo-class">${icon('lock')} للعرض الرسمي</span></div>
        <h1>محفظة الشراكات الاستراتيجية</h1>
        <p class="bo-cover-s">${esc(D.settings.org.name)} — ${esc(D.settings.org.dept)}</p>
        <dl class="bo-cover-meta"><div><dt>تاريخ الإحاطة</dt><dd>${esc(dt.hijri)} · ${esc(dt.greg)}</dd></div><div><dt>آخر تحديث للبيانات</dt><dd>${lu ? fmtDT(lu) : '—'}</dd></div><div><dt>النطاق</dt><dd id="boScope">—</dd></div>${showDemo() ? '<div class="bo-demo">تشمل بيانات تجريبية</div>' : ''}</dl>
      </div>
      <div class="bo-cover-tools no-print"><button class="btn primary" data-bopresent type="button">${icon('play')} عرض تقديمي</button>${can('export') ? `<button class="btn" data-print type="button">${icon('print')} طباعة أو PDF</button><button class="btn" data-xls type="button">${icon('download')} Excel</button>` : ''}</div>
      <nav class="bo-toc no-print" aria-label="محاور الإحاطة">${BO_CH.map((c, i) => `<a href="#" data-boch="${i}"><em>${boIdx(i + 1)}</em><span>${c.t}</span></a>`).join('')}</nav>
    </header>
    <div class="bo-filters no-print"><div class="fbar dz-fbar" id="dashF"></div><div class="dz2-active" id="dzActive"></div></div>
    <div class="bo-printf print-only" id="boPrintF"></div>
    <div id="dashBody"></div></div>`;
  const fb = new FilterBar($('#dashF', el), { dims: ['status', 'ptype', 'domain', 'category', 'sector', 'classification', 'department', 'owner', 'year'], getList: base, state: App.dashF, onChange: () => draw(false) });
  const drawActive = (list) => {
    const parts = Object.entries(App.dashF).filter(([, v]) => v && v.length);
    $('#boScope', el).textContent = `${list.filter((p) => !p.isDraft).length} من ${base().filter((p) => !p.isDraft).length} شراكة` + (Object.values(App.dashF).some((v) => v && v.length) ? ' — ' + filtersText(App.dashF).replace('الفلاتر المطبقة — ', '') : '');
    $('#boPrintF', el).textContent = filtersText(App.dashF);
    $('#dzActive', el).innerHTML = `<span class="dz2-scope">النطاق: <b>${list.length}</b> من ${base().length} شراكة</span>
      ${parts.flatMap(([d, vals]) => vals.map((v) => `<span class="dz2-chip"><em>${esc(FILTER_DIMS[d].label)}:</em> ${esc(FILTER_DIMS[d].fmt ? FILTER_DIMS[d].fmt(v) : v)}<button type="button" data-chipx="${esc(d)}|${esc(v)}" aria-label="إزالة الفلتر">${icon('x')}</button></span>`)).join('')}
      <span class="sp"></span>
      ${App.dashHist.length ? `<button type="button" class="linkbtn" data-undo>${icon('history')} رجوع</button>` : ''}
      ${parts.length ? `<button type="button" class="linkbtn" data-reset>${icon('x')} إعادة التعيين</button>` : ''}`;
  };
  const draw = (first) => {
    const cur = JSON.stringify(App.dashF);
    if (App.dashLast !== null && App.dashLast !== cur) App.dashHist.push(App.dashLast);
    App.dashLast = cur;
    const list = applyFilters(base(), App.dashF);
    drawActive(list);
    const body = $('#dashBody', el);
    body.innerHTML = list.some((p) => !p.isDraft) ? boBody(list) : `<div class="panel dz2-empty">${emptyHTML({ ic: 'filter', title: 'لا توجد شراكات ضمن هذا النطاق', text: 'وسّع الفلاتر أو أعدها إلى الوضع الافتراضي لعرض الإحاطة.', actions: '<button class="btn primary" data-reset type="button">إعادة التعيين</button>' })}</div>`;
    hydrateFiles(el);
    if (first) boReveal(body); else { $$('.bo-rv', body).forEach((x) => x.classList.add('bo-on')); body.classList.remove('dz2-in'); void body.offsetWidth; body.classList.add('dz2-in'); }
    runCountUps(el);
    if (App.boPresent) boPresentSync();
  };
  const cross = (dim, k) => { const s = new Set(App.dashF[dim] || []); s.has(k) ? s.delete(k) : s.add(k); if (s.size) App.dashF[dim] = [...s]; else delete App.dashF[dim]; fb.render(); draw(false); };
  draw(true);
  el.onclick = (e) => {
    const ch = e.target.closest('[data-boch]'); if (ch) { e.preventDefault(); const t = $$('.bo-ch', el)[+ch.dataset.boch]; t && t.scrollIntoView({ behavior: cuReduce() ? 'auto' : 'smooth', block: 'start' }); return; }
    const cf = e.target.closest('[data-cf]'); if (cf) { const [d, k] = cf.dataset.cf.split('|'); return cross(d, k); }
    const cx = e.target.closest('[data-chipx]'); if (cx) { const [d, k] = cx.dataset.chipx.split('|'); return cross(d, k); }
    if (e.target.closest('[data-undo]')) { const prev = App.dashHist.pop(); if (prev == null) return; for (const k of Object.keys(App.dashF)) delete App.dashF[k]; Object.assign(App.dashF, JSON.parse(prev)); App.dashLast = prev; fb.render(); return draw(false); }
    if (e.target.closest('[data-reset]')) { for (const k of Object.keys(App.dashF)) delete App.dashF[k]; fb.render(); return draw(false); }
    const dd = e.target.closest('[data-drawer]'); if (dd) return openDashDrawer(dd.dataset.drawer, applyFilters(base(), App.dashF));
    const st = e.target.closest('[data-story]'); if (st) { e.preventDefault(); return openStory(st.dataset.story); }
    const hr = e.target.closest('[data-href]'); if (hr) return go(hr.dataset.href);
    if (e.target.closest('[data-bopresent]')) return boPresent(true);
    if (e.target.closest('[data-print]')) return window.print();
    if (e.target.closest('[data-xls]')) return exportPartnershipsXlsx(applyFilters(base(), App.dashF), 'إحاطة-المجلس');
  };
  bindTips(el);
}

/* — الحسابات المشتركة للفصول — */
function boStats(list) {
  const nd = list.filter((p) => !p.isDraft);
  const S = (k) => nd.filter((p) => k.includes(pStatus(p)));
  const signed = nd.filter((p) => p.stage === 'signed');
  const act = S(['active', 'soon']), soon = S(['soon']).sort((a, b) => (a.endDate < b.endDate ? -1 : 1)), up = S(['upcoming']), ended = S(['ended']), pipe = S(['prep', 'sign', 'hold']);
  const partners = new Set(nd.map((p) => p.partnerId));
  const secMap = {}; nd.forEach((p) => { const s = pSector(p) || 'غير محدد'; (secMap[s] = secMap[s] || new Set()).add(p.partnerId); });
  const cells = nd.length * CORE_FIELDS.length;
  const complete = cells ? Math.round((cells - nd.reduce((t, p) => t + missingFields(p).length, 0)) / cells * 100) : 0;
  const activated = act.filter((p) => p.activation === 'مفعّلة').length;
  const props = visibleProposals().filter((x) => x.status !== 'draft');
  const inProc = props.filter((x) => ['submitted', 'review', 'info'].includes(x.status));
  const ser = monthlySeries(list);
  let trend = null;
  if (ser) { const ci = Math.max(0, ser.rows.findIndex((r) => r.current)); trend = { now: act.length, ago: ser.rows[Math.max(0, ci - 12)].total, ahead: ser.rows[Math.min(ser.rows.length - 1, ci + 6)].total }; }
  const health = [
    { k: 'cont', l: 'الاستمرارية', d: 'الموقّعة غير المنتهية', v: signed.length ? Math.round((signed.length - ended.length) / signed.length * 100) : 0 },
    { k: 'act', l: 'التفعيل', d: 'السارية المفعّلة فعليًا', v: act.length ? Math.round(activated / act.length * 100) : 0 },
    { k: 'data', l: 'اكتمال البيانات', d: 'حقول ملف الحصر المعبأة', v: complete },
    { k: 'renew', l: 'أمان الاستحقاقات', d: 'السارية غير المهددة بالانتهاء', v: act.length ? Math.round((act.length - soon.length) / act.length * 100) : 0 },
  ];
  const score = Math.round(health.reduce((t, h) => t + h.v, 0) / health.length);
  return { nd, signed, act, soon, up, ended, pipe, partners, secMap, complete, activated, props, inProc, ser, trend, health, score };
}
const boChHead = (i, extra = '') => { if (typeof i === 'string') i = BO_CH.findIndex((c) => c.id === i); const c = BO_CH[i]; return `<header class="bo-chh"><span class="bo-chn" style="--p:${((i + 1) / BO_CH.length * 100).toFixed(1)}%"><small>الفصل</small><b>${boIdx(i + 1)}</b><em>من ${boIdx(BO_CH.length)}</em><i></i></span><div><h2>${c.t}</h2><p>${c.s}</p></div>${extra}</header>`; };
const boInsight = () => ''; /* أُزيلت صناديق «الخلاصة» من اللوحة المفصلة بطلب الإدارة */
const boB = (n) => `<b>${n}</b>`;

function boBody(list) {
  const X = boStats(list);
  return [boChSummary(X, list), boChImpact(X), boChEval(X), boChProc(X), boChNetwork(X), boChFlow(X), boChTime(X, list), boChDecisions(X, list)].map((h, i) => `<section class="bo-ch bo-rv" data-ch="${BO_CH[i].id}" style="--ci:${i}">${h}</section>`).join('')
    + `<footer class="bo-sign"><div><b>إعداد</b><span>${esc(D.settings.org.dept)} — ${esc(D.settings.org.name)}</span></div><div><b>المصدر</b><span>سجلات منظومة الشراكات لحظة العرض؛ تتحدث الأرقام والرسوم تلقائيًا مع كل تعديل.</span></div><div><b>التاريخ</b><span>${esc(boHijri())} · ${fmtDate(isoDate(new Date()))}م</span></div></footer>`;
}

/* 01 — الخلاصة التنفيذية */
function boChSummary(X) {
  const nSec = Object.keys(X.secMap).length;
  const topSec = Object.entries(X.secMap).sort((a, b) => b[1].size - a[1].size)[0];
  const d = X.trend ? X.trend.now - X.trend.ago : 0;
  const msgs = [
    { ic: 'users', tone: 'g', h: 'منظومة متنوعة', t: `تضم المحفظة ${boB(X.nd.length)} ${nounFor(X.nd.length, ['شراكة', 'شراكة', 'شراكات', 'شراكة'])} مع ${boB(X.partners.size)} ${nounFor(X.partners.size, ['جهة', 'جهة', 'جهات', 'جهة'])} في ${plural(nSec, 'قطاع واحد', 'قطاعين', 'قطاعات', 'قطاعًا')}${topSec ? `، أكبرها القطاع ${esc(boSecName(topSec[0]))} بـ${boB(topSec[1].size)}` : ''}.`, viz: boSecStrip(X.nd) },
    { ic: 'chart', tone: 'g', h: d > 0 ? 'زخم متصاعد' : d < 0 ? 'المحفظة تتقلص' : 'محفظة مستقرة', t: X.trend ? `${boB(X.trend.now)} ${nounFor(X.trend.now, ['شراكة سارية', 'شراكة سارية', 'شراكات سارية', 'شراكة سارية'])} اليوم مقابل ${boB(X.trend.ago)} قبل اثني عشر شهرًا${d ? ` (${d > 0 ? '+' : ''}${d})` : ''}.` : `${boB(X.act.length)} ${nounFor(X.act.length, ['شراكة سارية', 'شراكة سارية', 'شراكات سارية', 'شراكة سارية'])} حاليًا.`, viz: X.ser ? boSpark(X.ser) : '' },
    X.soon.length
      ? { ic: 'alert', tone: 'w', h: 'استحقاقات تحتاج قرارًا', t: `${plural(X.soon.length, 'شراكة واحدة تنتهي', 'شراكتان تنتهيان', 'شراكات تنتهي', 'شراكة تنتهي')} خلال ${D.settings.expiryDays} يومًا، أقربها مع «${esc(partnerName(X.soon[0]))}» في ${fmtDate(X.soon[0].endDate)}.`, viz: boCal(X.soon) }
      : { ic: 'check', tone: 'g', h: 'لا استحقاقات عاجلة', t: `لا توجد شراكات تنتهي خلال ${D.settings.expiryDays} يومًا.${X.up.length ? ` ويبدأ سريان ${plural(X.up.length, 'شراكة جديدة', 'شراكتين جديدتين', 'شراكات جديدة', 'شراكة جديدة')} قريبًا.` : ''}`, viz: '' },
  ];
  const lvl = X.score >= 85 ? ['ممتاز', 'g'] : X.score >= 70 ? ['جيد', 'g'] : X.score >= 55 ? ['مقبول', 'w'] : ['يحتاج معالجة', 'r'];
  const R = 70, C = 2 * Math.PI * R;
  const weak = X.health.slice().sort((a, b) => a.v - b.v)[0];
  const kp = [
    { k: 'act', v: X.act.length, l: 'شراكة سارية', s: `من ${X.signed.length} موقّعة`, viz: boDots(X.act.length, X.signed.length) },
    { k: 'partners', v: X.partners.size, l: 'جهة شريكة', s: `في ${plural(nSec, 'قطاع', 'قطاعين', 'قطاعات', 'قطاعًا')}`, viz: boSecStrip(X.nd) },
    { k: 'soon', v: X.soon.length, l: `تنتهي خلال ${D.settings.expiryDays} يومًا`, s: X.soon.length ? 'قرار تجديد مطلوب' : 'لا استحقاقات قريبة', viz: boCal(X.soon), warn: X.soon.length > 0 },
    { k: 'props', v: X.inProc.length, l: 'مقترحًا قيد المعالجة', s: `من ${X.props.length} مقدّمة من الإدارات`, viz: boDots(X.inProc.length, X.props.length) },
    { k: 'missing', v: X.complete, l: 'اكتمال البيانات', s: 'من حقول ملف الحصر', viz: `<span class="bo-meter"><i style="width:${X.complete}%"></i></span>`, pct: true },
  ];
  return `${boChHead('sum')}
    <div class="bo-sum">
      <ol class="bo-msgs" data-tour="dash-kpis">${msgs.map((m, i) => `<li class="bo-msg ${m.tone}"><span class="bo-msg-n"><i>${BO_AR(i + 1)}</i></span><div><h3>${icon(m.ic)}${m.h}</h3><p>${m.t}</p>${m.viz ? `<div class="bo-msg-viz">${m.viz}</div>` : ''}</div></li>`).join('')}</ol>
      <div class="bo-health">
        <div class="bo-health-h"><h3>مؤشر سلامة المحفظة</h3><span class="bo-lvl ${lvl[1]}">${lvl[0]}</span></div>
        <div class="bo-gauge"><svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="${R}" class="bg"/>${Array.from({ length: 40 }, (_, i) => { const a = i / 40 * Math.PI * 2; return `<line x1="${(90 + 80 * Math.sin(a)).toFixed(1)}" y1="${(90 - 80 * Math.cos(a)).toFixed(1)}" x2="${(90 + 84 * Math.sin(a)).toFixed(1)}" y2="${(90 - 84 * Math.cos(a)).toFixed(1)}" class="tk ${i / 40 * 100 < X.score ? 'on' : ''}"/>`; }).join('')}<circle cx="90" cy="90" r="${R}" class="v ${lvl[1]}" stroke-dasharray="${(X.score / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 90 90)" style="--c:${C.toFixed(1)}"/></svg>
          <div class="bo-gauge-t"><b class="cu" data-v="${X.score}" data-fmt="pct">${X.score}%</b><span>من 100</span></div></div>
        <ul class="bo-hl">${X.health.map((h) => `<li ${tipAttr(`<b>${h.l}</b><br>${h.d}: ${h.v}%`)}><span>${h.l}</span><i><em style="width:${h.v}%" class="${h.v >= 70 ? 'g' : h.v >= 50 ? 'w' : 'r'}"></em></i><b>${h.v}%</b></li>`).join('')}</ul>
        <p class="bo-note">مؤشر مركّب من ${plural(X.health.length, 'عنصر واحد', 'عنصرين', 'عناصر', 'عنصرًا')} بأوزان متساوية، يُحسب من السجلات المعروضة.</p>
      </div>
    </div>
    <div class="bo-kpis">${kp.map((k) => `<button type="button" class="bo-kpi ${k.warn ? 'warn' : ''}" data-drawer="${k.k}"><span class="bo-kpi-l">${k.l}</span><b class="cu" data-v="${k.v}" ${k.pct ? 'data-fmt="pct"' : ''}>${k.v}${k.pct ? '%' : ''}</b><span class="bo-kpi-v">${k.viz}</span><small>${k.s}</small></button>`).join('')}</div>
    ${boInsight(`مؤشر سلامة المحفظة ${boB(X.score + '%')} (${lvl[0]})${weak && weak.v < 100 ? `؛ أضعف عناصره «${weak.l}» بنسبة ${boB(weak.v + '%')}، ويُقترح أن يكون محور المتابعة القادمة` : ''}.`)}`;
}
function boSpark(ser) {
  const rows = ser.rows, W = 260, H = 46, n = rows.length, mx = Math.max(1, ...rows.map((r) => r.total));
  const ci = Math.max(0, rows.findIndex((r) => r.current));
  const pts = rows.map((r, i) => [(W - 2 - i * (W - 4) / Math.max(1, n - 1)).toFixed(1), (H - 4 - r.total / mx * (H - 10)).toFixed(1)]);
  return `<svg class="bo-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.slice(0, ci + 1).map((p) => p.join(',')).join(' ')}" class="l"/><polyline points="${pts.slice(ci).map((p) => p.join(',')).join(' ')}" class="l f"/><circle cx="${pts[ci][0]}" cy="${pts[ci][1]}" r="3.5" class="d"/></svg>`;
}
function boCal(soon) {
  const t = today();
  return `<span class="bo-cal">${Array.from({ length: 12 }, (_, k) => { const m = new Date(t.getFullYear(), t.getMonth() + k, 1), me = new Date(t.getFullYear(), t.getMonth() + k + 1, 0); const n = soon.filter((p) => { const e = parseDate(p.endDate); return e >= m && e <= me; }).length; return `<i class="${n ? 'on' : ''}" title="${MONTHS[m.getMonth()]} ${m.getFullYear()}${n ? ': ' + n : ''}"><em>${MONTHS[m.getMonth()].slice(0, 3)}</em></i>`; }).join('')}</span>`;
}

/* 02 — الأثر المتحقق: مصفوفات رمزية تجعل الرقم مرئيًا */
const BO_GLYPHS = {
  tree: '<path d="M12 2c-3 3-5 6-5 9a5 5 0 0 0 10 0c0-3-2-6-5-9z"/><path d="M12 15v7"/>',
  person: '<circle cx="12" cy="6" r="3.2"/><path d="M5.5 21c.6-4.5 3.2-7 6.5-7s5.9 2.5 6.5 7z"/>',
  land: '<path d="M3 17l5-6 4 4 3-3 6 5z"/><path d="M3 20h18"/>',
  cycle: '<path d="M12 3l3.5 5H13v4h-2V8H8.5z"/><path d="M5 13l-2 6h6l-1.5-2.3"/><path d="M19 13l2 6h-6l1.5-2.3"/>',
  spark: '<path d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z"/>',
};
function boGlyphFor(label) {
  const s = normAr(label || '');
  if (/شجر|شتل|نبات|غرس/.test(s)) return 'tree';
  if (/طالب|متطوع|مستفيد|شخص|زائر|متدرب|مشارك/.test(s)) return 'person';
  if (/هكتار|م2|متر|ارض|مساح/.test(s)) return 'land';
  if (/طن|كيلو|مخلف|نفاي|تدوير/.test(s)) return 'cycle';
  return 'spark';
}
function boUnit(v) { if (v <= 30) return 1; const raw = v / 24, p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function boChImpact(X) {
  const ids = new Set(X.nd.map((p) => p.id));
  const hls = X.nd.filter((p) => p.highlight && p.highlight.value).map((p) => ({ p, v: +String(p.highlight.value).replace(/[^\d.]/g, '') || 0, raw: p.highlight.value, l: p.highlight.label || '', t: p.highlight.text || '' })).filter((h) => h.v > 0).sort((a, b) => b.v - a.v);
  const achs = D.achievements.filter((a) => ids.has(a.partnershipId) && (showDemo() || !a.demo)).sort((a, b) => (a.date < b.date ? 1 : -1));
  const outs = X.signed.reduce((t, p) => t + richItems(p.outputs).length, 0);
  const areas = X.signed.reduce((t, p) => t + richItems(p.cooperationAreas).length, 0);
  const depts = new Set(X.signed.flatMap((p) => p.departments || [])).size;
  const tiles = hls.slice(0, 4).map((h) => {
    const u = boUnit(h.v), n = Math.max(1, Math.round(h.v / u)), g = boGlyphFor(h.l);
    return `<a class="bo-pict" href="#/partnerships/${h.p.id}"><div class="bo-pict-h"><b>${esc(h.raw)}</b><span>${esc(h.l)}</span></div>
      <div class="bo-pict-g" aria-hidden="true">${Array.from({ length: Math.min(n, 40) }, (_, i) => `<svg viewBox="0 0 24 24" style="--i:${i}">${BO_GLYPHS[g]}</svg>`).join('')}</div>
      <small class="bo-pict-u">كل رمز = ${nf(u)} ${esc(h.l.split(' ')[0])}</small><p>${esc(h.t)}</p><span class="bo-pict-p">${plateHTML(partnerById(h.p.partnerId), 28)}${esc(partnerName(h.p))} ${demoTag(h.p)}</span></a>`;
  }).join('');
  const commit = [
    { n: outs, l: 'مخرجًا مستهدفًا', d: 'مسجلًا في الشراكات الموقّعة' },
    { n: areas, l: 'مجال تعاون', d: 'مثبتًا في المذكرات' },
    { n: depts, l: 'إدارة متقاطعة', d: 'تشارك في التنفيذ' },
    { n: achs.length, l: 'قصة أثر موثّقة', d: 'بالصور والنتائج' },
  ];
  return `${boChHead('impact')}
    ${tiles ? `<div class="bo-picts">${tiles}</div>` : '<div class="empty-chart">لم تُسجَّل نتائج قابلة للقياس في الشراكات المعروضة بعد. تُضاف من حقل «أبرز نتيجة للعرض» في صفحة الشراكة.</div>'}
    <div class="bo-commit">${commit.map((c) => `<div><b class="cu" data-v="${c.n}">${c.n}</b><span>${c.l}</span><small>${c.d}</small></div>`).join('')}</div>
    ${achs.length ? `<div class="bo-field"><h4>من الميدان</h4><div class="bo-field-g">${achs.slice(0, 4).map((a) => `<a class="bo-fc" href="#" data-story="${a.id}"><div class="bo-fc-m">${coverHTML('story' + a.id, a.coverFileId, { W: 560, H: 360, levels: 10, cols: 40, tone: toneFor(storyPartner(a)) })}${a.metricValue ? `<span class="bo-fc-k"><b>${esc(a.metricValue)}</b> ${esc(a.metricLabel || '')}</span>` : ''}</div><h5>${esc(a.title)}</h5><small>${fmtDate(a.date, 'month')} ${demoTag(a)}</small></a>`).join('')}</div></div>` : ''}
    ${boInsight(hls.length ? `أبرز نتيجة مسجّلة: ${boB(esc(hls[0].raw))} ${esc(hls[0].l)} عبر الشراكة مع «${esc(partnerName(hls[0].p))}»، ضمن ${plural(hls.length, 'شراكة واحدة', 'شراكتين', 'شراكات', 'شراكة')} لها نتائج قابلة للقياس من أصل ${X.act.length} سارية.` : `تلتزم الشراكات الموقّعة بـ${boB(outs)} مخرجًا مستهدفًا؛ يُقترح توثيق نتائجها القابلة للقياس لعرضها على المجلس.`)}`;
}

/* 03 — تقييم الشراكات وقيمتها */
function boChEval(X) {
  const nd = X.nd, live = nd.filter((p) => p.stage === 'signed');
  const ev = live.map((p) => ({ p, e: lastEval(p) })).filter((x) => x.e && x.e.score !== null);
  const avg = ev.length ? Math.round(ev.reduce((t, x) => t + x.e.score, 0) / ev.length) : null;
  const grades = ['ممتاز', 'جيد جدًا', 'جيد', 'يحتاج تحسين'].map((g) => ({ g, n: ev.filter((x) => evalGrade(x.e.score) === g).length }));
  const crit = EVAL_CRIT.map((c) => ({ ...c, v: ev.length ? ev.reduce((t, x) => t + (+((x.e.data.scores || {})[c.k] || {}).v || 0), 0) / ev.length : 0 }));
  const by = (f, opts) => { const m = {}; nd.forEach((p) => { const k = f(p) || 'غير محدد'; m[k] = (m[k] || 0) + 1; }); return [...opts, 'غير محدد'].filter((k) => m[k]).map((k) => ({ k, n: m[k] })).concat(Object.keys(m).filter((k) => ![...opts, 'غير محدد'].includes(k)).map((k) => ({ k, n: m[k] }))); };
  const types = by((p) => p.ptype, L('partnerTypes'));
  const doms = by((p) => (partnerById(p.partnerId) || {}).domain, L('domains')).sort((a, b) => (a.k === 'غير محدد') - (b.k === 'غير محدد') || b.n - a.n);
  const orig = by((p) => p.origin, L('originTypes'));
  const F = nd.map((p) => p.finance || {});
  const sum = (k) => F.reduce((t, f) => t + (+f[k] || 0), 0);
  const fin = { partner: sum('partnerSar'), muroj: sum('murojSar'), inkind: sum('inkindSar'), spent: sum('spentSar') };
  fin.total = fin.partner + fin.muroj + fin.inkind;
  const late = nd.filter((p) => (p.finance || {}).status === 'متأخر');
  const R = 54, C = 2 * Math.PI * R;
  const dmax = Math.max(1, ...doms.map((d) => d.n));
  const tcol = (k) => (k.includes('استراتيجي') ? 'var(--petrol)' : k === 'غير محدد' ? 'var(--line-2)' : 'var(--gold)');
  const recs = ev.sort((a, b) => b.e.score - a.e.score);
  const notEval = live.filter((p) => !ev.some((x) => x.p === p) && ['active', 'soon'].includes(pStatus(p)));
  const strategic = nd.filter((p) => (p.ptype || '').includes('استراتيجي')).length;
  const personal = nd.filter((p) => p.origin === 'علاقة شخصية').length;
  return `${boChHead('eval')}
    <div class="bo-ev">
      <div class="bo-ev-score">
        <h4>متوسط تقييم الشراكات</h4>
        ${avg !== null ? `<div class="bo-gauge sm"><svg viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="${R}" class="bg"/><circle cx="70" cy="70" r="${R}" class="v ${avg >= 85 ? '' : avg >= 65 ? 'w' : 'r'}" stroke-dasharray="${(avg / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 70 70)" style="--c:${C.toFixed(1)}"/></svg><div class="bo-gauge-t"><b class="cu" data-v="${avg}" data-fmt="pct">${avg}%</b><span>${evalGrade(avg)}</span></div></div>
          <p class="bo-note">${ev.length} من ${live.length} شراكة موقّعة لها تقييم مكتمل بنموذج تقييم الشراكة.</p>
          <ul class="bo-hl">${grades.map((g) => `<li><span>${g.g}</span><i><em style="width:${ev.length ? g.n / ev.length * 100 : 0}%" class="${g.g === 'يحتاج تحسين' ? 'r' : g.g === 'جيد' ? 'w' : 'g'}"></em></i><b>${g.n}</b></li>`).join('')}</ul>`
        : '<div class="empty-chart">لم تُقيَّم أي شراكة بعد. يُعبَّأ نموذج تقييم الشراكة من صفحة كل شراكة.</div>'}
      </div>
      <div class="bo-ev-crit"><h4>معايير التقييم <small>متوسط من 5</small></h4>
        ${crit.map((c) => `<div class="bo-cr"><span><b>${esc(c.l)}</b><small>الوزن ${c.w}%</small></span><i><em style="width:${(c.v / 5 * 100).toFixed(0)}%"></em></i><b>${c.v ? c.v.toFixed(1) : '—'}</b></div>`).join('')}</div>
      <div class="bo-ev-cls"><h4>تصنيف الشراكات</h4>
        <div class="bo-split">${types.map((t) => `<i style="flex:${t.n};background:${tcol(t.k)}" ${tipAttr(`${esc(t.k)}: ${t.n}`)} data-cf="ptype|${esc(t.k)}"></i>`).join('')}</div>
        <div class="bo-split-l">${types.map((t) => `<button type="button" data-cf="ptype|${esc(t.k)}"><i style="background:${tcol(t.k)}"></i>${esc(t.k)} <b>${t.n}</b></button>`).join('')}</div>
        <h4 style="margin-top:18px">مجال عمل الجهات</h4>
        <div class="bo-doms">${doms.slice(0, 7).map((d) => `<button type="button" class="bo-dom ${d.k === 'غير محدد' ? 'na' : ''}" data-cf="domain|${esc(d.k)}"><span>${esc(d.k)}</span><i><em style="width:${d.n / dmax * 100}%"></em></i><b>${d.n}</b></button>`).join('')}</div>
        <h4 style="margin-top:18px">من فتح الباب</h4>
        <div class="bo-orig">${orig.map((o) => `<span class="${o.k === 'غير محدد' ? 'na' : ''}"><b>${o.n}</b>${esc(o.k)}</span>`).join('')}</div></div>
    </div>
    <div class="bo-fin">
      <div><span>مساهمات الشركاء</span><b class="cu" data-v="${fin.partner}">${nf(fin.partner)}</b><small>⃁</small></div>
      <div><span>مساهمات المؤسسة</span><b class="cu" data-v="${fin.muroj}">${nf(fin.muroj)}</b><small>⃁</small></div>
      <div><span>القيمة العينية والمعرفية</span><b class="cu" data-v="${fin.inkind}">${nf(fin.inkind)}</b><small>⃁</small></div>
      <div class="tot"><span>القيمة الإجمالية للمحفظة</span><b class="cu" data-v="${fin.total}">${nf(fin.total)}</b><small>⃁</small></div>
      <div class="sp"><span>نسبة الصرف من الالتزامات المالية</span><div class="bo-meter"><i style="width:${fin.partner + fin.muroj ? Math.min(100, Math.round(fin.spent / (fin.partner + fin.muroj) * 100)) : 0}%"></i></div><small>${nf(fin.spent)} ⃁ مصروف${late.length ? ` · <em>${late.length} ${late.length === 1 ? 'شراكة متأخرة' : 'شراكات متأخرة'} ماليًا</em>` : ''}</small></div>
    </div>
    ${recs.length ? `<div class="tbl-wrap"><table class="tbl bo-rt bo-evt"><thead><tr><th>الشراكة</th><th>التصنيف</th><th>المجال</th><th>آخر تقييم</th><th>التوصية</th><th>القيمة الإجمالية</th></tr></thead><tbody>
      ${recs.map(({ p, e }) => { const P = pProfile(p); return `<tr data-href="#/partnerships/${p.id}"><td><b>${esc(partnerName(p))}</b> ${demoTag(p)}<small>${esc(e.data.period || '')}</small></td><td>${esc(P.ptype || '—')}</td><td>${esc(P.domain || '—')}</td><td><span class="bo-evs ${evalTone(e.score)}"><b>${e.score}%</b>${evalGrade(e.score)}</span></td><td>${esc(e.data.rec || '—')}</td><td><span class="num">${P.total ? sar(P.total) : '—'}</span></td></tr>`; }).join('')}</tbody></table></div>` : ''}
    ${boInsight(avg !== null ? `متوسط تقييم الشراكات ${boB(avg + '%')} (${evalGrade(avg)})؛ ${boB(strategic)} من ${nd.length} شراكة مصنّفة شريكًا استراتيجيًا، و${boB(personal)} بدأت بعلاقة شخصية. ${notEval.length ? `${plural(notEval.length, 'شراكة سارية واحدة لم تُقيَّم', 'شراكتان ساريتان لم تُقيَّما', 'شراكات سارية لم تُقيَّم', 'شراكة سارية لم تُقيَّم')} بعد.` : ''}${fin.total ? ` القيمة الإجمالية للمحفظة ${boB(nf(fin.total))} ⃁.` : ''}` : `لم تُقيَّم الشراكات بعد؛ يُقترح تعبئة نموذج تقييم الشراكة لكل شراكة سارية قبل الإحاطة القادمة.`)}`;
}

/* 03 — منظومة الشركاء: شبكة شعاعية حول المؤسسة */
function boChProc(X) {
  const P = wfPipeline(X.nd);
  const lim = (D.settings.infoAgeDays || 7) * 2;
  const cnt = P.phases.map((x) => x.items.length), tot = P.items.length;
  return `${boChHead('proc')}
    <div class="bo-proc">
      <div class="bo-proc-k">
        <div><b class="cu" data-v="${tot}">${tot}</b><span>طلب ومذكرة قيد الإجراء</span></div>
        <div><b class="cu" data-v="${P.phases[3].items.length}">${P.phases[3].items.length}</b><span>في الاعتماد والتوقيع</span></div>
        <div class="${P.late.length ? 'w' : ''}"><b class="cu" data-v="${P.late.length}">${P.late.length}</b><span>متأخرة أكثر من ${lim} يومًا</span></div>
        <div><b class="cu" data-v="${P.activating}">${P.activating}</b><span>شراكة في التفعيل والتقارير</span></div>
      </div>
      <div class="bo-proc-bar" aria-hidden="true">${cnt.map((n, i) => `<i style="flex:${Math.max(n, 0.35)}" class="${n ? '' : 'z'}"><em>${pad(i + 1)}</em></i>`).join('')}</div>
      ${pipelineHTML(P, { max: 3 })}
    </div>
    ${boInsight(tot ? `${P.top ? `أكبر عدد من المذكرات لدى «${esc(P.top[0])}» (${P.top[1]})` : ''}${P.late.length ? `، و${plural(P.late.length, 'مذكرة واحدة تجاوزت', 'مذكرتان تجاوزتا', 'مذكرات تجاوزت', 'مذكرة تجاوزت')} ${lim} يومًا دون انتقال، ويُقترح توجيه الجهات المعنية بتسريعها.` : '، ولا توجد مذكرات متأخرة عن المدة المرجعية.'}` : 'لا توجد طلبات أو مذكرات قيد الإجراء حاليًا.')}`;
}
function boChNetwork(X) {
  const by = new Map();
  X.nd.forEach((p) => { const pr = partnerById(p.partnerId); if (!pr) return; const e = by.get(pr.id) || { pr, ps: [] }; e.ps.push(p); by.set(pr.id, e); });
  const secs = [...L('sectors'), 'غير محدد'].filter((s) => [...by.values()].some((e) => (e.pr.sector || 'غير محدد') === s));
  const W = 980, H = 560, cx = W / 2, cy = H / 2 + 6, RX = 330, RY = 205;
  const total = by.size || 1;
  const gapA = 0.22;
  let a = -Math.PI / 2 + 0.0001;
  const span = Math.PI * 2 - gapA * secs.length;
  let arcs = '', links = '', nodes = '', labels = '';
  const stC = (s) => ST_VAR(s);
  secs.forEach((s) => {
    const es = [...by.values()].filter((e) => (e.pr.sector || 'غير محدد') === s).sort((x, y) => y.ps.length - x.ps.length);
    const a0 = a, a1 = a + span * es.length / total;
    const P = (ang, rx = RX, ry = RY) => [cx + rx * Math.cos(ang), cy + ry * Math.sin(ang)];
    const steps = 24; const arcPts = Array.from({ length: steps + 1 }, (_, k) => P(a0 + (a1 - a0) * k / steps, RX + 46, RY + 38));
    arcs += `<path d="M${arcPts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L')}" class="bo-net-arc" style="stroke:${SEC_VAR(s)}"/>`;
    const am = (a0 + a1) / 2, [lx, ly] = P(am, RX + 72, RY + 58);
    labels += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" class="bo-net-sec" data-cf="sector|${esc(s)}">${esc(s)} · ${es.length}</text>`;
    es.forEach((e, k) => {
      const ang = es.length === 1 ? am : a0 + (a1 - a0) * (k + 0.5) / es.length;
      const [x, y] = P(ang);
      const sts = e.ps.map(pStatus); const st = ST_PRIO.find((q) => sts.includes(q)) || sts[0];
      const r = 15 + Math.min(4, e.ps.length - 1) * 5;
      const live = ['active', 'soon'].includes(st);
      const mx = cx + (x - cx) * 0.45 + (y - cy) * 0.12, my = cy + (y - cy) * 0.45 - (x - cx) * 0.06;
      links += `<path d="M${cx} ${cy}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}" class="bo-net-ln ${live ? 'live' : ''}" style="stroke:${SEC_VAR(s)};stroke-width:${(1.2 + e.ps.length * 1.1).toFixed(1)};--d:${k}"/>`;
      const href = e.ps.length > 1 && can('view.partners') ? '#/partners/' + e.pr.id : '#/partnerships/' + e.ps[0].id;
      nodes += `<g class="bo-net-n" data-href="${href}" ${tipAttr(`<b>${esc(e.pr.name)}</b><br>${esc(s)} — ${plural(e.ps.length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')}<br>${esc(statusLabel(st))}${e.pr.demo ? ' — تجريبي' : ''}`)} transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="${r + 4}" class="halo" style="stroke:${stC(st)}"/><circle r="${r}" class="core" style="fill:${SEC_VAR(s)}"/>${e.pr.logoFileId ? `<circle r="${r - 1}" class="lgbg"/><image data-file="${esc(e.pr.logoFileId)}" x="${-(r - 4)}" y="${-(r - 4)}" width="${2 * (r - 4)}" height="${2 * (r - 4)}" preserveAspectRatio="xMidYMid meet"/>` : `<svg x="${-r * 0.5}" y="${-r * 0.5}" width="${r}" height="${r}" viewBox="0 0 24 24" class="bo-net-emb" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[embIcon(e.pr)]}</svg>`}</g>`;
      const out = Math.cos(ang) > 0.25 ? 'start' : Math.cos(ang) < -0.25 ? 'end' : 'middle';
      const nm = e.pr.name.length > 22 ? e.pr.name.slice(0, 21) + '…' : e.pr.name;
      const ox = out === 'start' ? r + 9 : out === 'end' ? -(r + 9) : 0, oy = out === 'middle' ? (Math.sin(ang) > 0 ? r + 17 : -(r + 9)) : 4;
      labels += `<text x="${(x + ox).toFixed(1)}" y="${(y + oy).toFixed(1)}" text-anchor="${out === 'start' ? 'end' : out === 'end' ? 'start' : 'middle'}" class="bo-net-lab">${esc(nm)}</text>`;
    });
    a = a1 + gapA;
  });
  const logo = (ASSET_IMG[boardLogoKey()] || {}).src;
  const multi = [...by.values()].filter((e) => e.ps.length > 1).length;
  const topSec = secs.map((s) => [s, [...by.values()].filter((e) => (e.pr.sector || 'غير محدد') === s).length]).sort((p, q) => q[1] - p[1])[0];
  const stUsed = ST_PRIO.filter((k) => X.nd.some((p) => pStatus(p) === k));
  return `${boChHead('net')}
    <div class="bo-net" data-tour="dash-status">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="شبكة الجهات الشريكة حول المؤسسة"><defs><radialGradient id="boNetG"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></radialGradient></defs>
        <ellipse cx="${cx}" cy="${cy}" rx="${RX}" ry="${RY}" class="bo-net-orbit"/><ellipse cx="${cx}" cy="${cy}" rx="${RX * 0.55}" ry="${RY * 0.55}" class="bo-net-orbit inr"/>
        ${arcs}${links}
        <g class="bo-net-c"><circle cx="${cx}" cy="${cy}" r="74" fill="url(#boNetG)"/><circle cx="${cx}" cy="${cy}" r="58" class="plate"/>${logo ? `<image href="${logo}" x="${cx - 44}" y="${cy - 30}" width="88" height="60" preserveAspectRatio="xMidYMid meet"/>` : `<text x="${cx}" y="${cy + 6}" text-anchor="middle" class="bo-net-org">${esc(D.settings.org.name)}</text>`}</g>
        ${nodes}${labels}</svg>
      <aside class="bo-net-lg"><h4>قراءة الشبكة</h4><ul>
        <li><i class="ln"></i>خط متصل: شراكة سارية، ومتقطع: غير سارية</li><li><i class="sz"></i>حجم الدائرة وسماكة الخط: عدد الشراكات مع الجهة</li><li><i class="cl"></i>لون الدائرة: قطاع الجهة، ولون الإطار: حالة شراكتها</li></ul>
        <div class="bo-net-k">${secs.map((s) => `<button type="button" data-cf="sector|${esc(s)}"><i style="background:${SEC_VAR(s)}"></i>${esc(s)}</button>`).join('')}</div>
        <div class="bo-net-k st">${stUsed.map((k) => `<span><i style="border-color:${ST_VAR(k)}"></i>${esc(statusLabel(k))}</span>`).join('')}</div></aside>
    </div>
    ${boInsight(`ترتبط المؤسسة بـ${boB(by.size)} ${nounFor(by.size, ['جهة', 'جهة', 'جهات', 'جهة'])}${topSec ? `، أكثرها من القطاع ${esc(boSecName(topSec[0]))} (${boB(topSec[1])})` : ''}${multi ? `، ${multi === 1 ? 'واحدة منها تجمعها' : `و${boB(multi)} منها تجمعها`} بالمؤسسة أكثر من شراكة` : ''}. اضغط القطاع لتصفية الإحاطة كلها.`)}`;
}

/* 04 — تدفق المحفظة (مخطط سانكي): القطاع ← مجال الشراكة ← الحالة */
function boChFlow(X) {
  const nd = X.nd;
  const stGroup = (p) => { const s = pStatus(p); return s === 'active' ? 'active' : s === 'soon' ? 'soon' : s === 'upcoming' ? 'upcoming' : s === 'ended' ? 'ended' : 'pipe'; };
  const SG = { active: 'سارية', soon: 'تنتهي قريبًا', upcoming: 'لم يبدأ سريانها', pipe: 'قيد الإعداد والتوقيع', ended: 'منتهية' };
  const SGF = { active: ['active'], soon: ['soon'], upcoming: ['upcoming'], pipe: ['prep', 'sign', 'hold', 'nodates'], ended: ['ended', 'cancel'] };
  const SGC = { active: 'var(--st-active)', soon: 'var(--st-soon)', upcoming: 'var(--st-up)', pipe: 'var(--st-prep)', ended: 'var(--st-ended)' };
  const cat = (p) => (p.categories && p.categories[0]) || 'غير مصنّف';
  const cols = [
    { key: 'sector', f: (p) => pSector(p) || 'غير محدد', order: [...L('sectors'), 'غير محدد'], c: (k) => SEC_VAR(k), lab: (k) => k, cf: (k) => `sector|${k}` },
    { key: 'category', f: cat, order: [...L('categories'), 'غير مصنّف'], c: () => 'var(--bo-ink-3)', lab: (k) => k, cf: (k) => `category|${k}` },
    { key: 'status', f: stGroup, order: ['active', 'soon', 'upcoming', 'pipe', 'ended'], c: (k) => SGC[k], lab: (k) => SG[k], cf: (k) => `status|${SGF[k][0]}`, href: (k) => '#/partnerships' + filtersToQuery({ ...App.dashF, status: SGF[k] }) },
  ];
  const W = 1000, H = Math.max(380, 90 + nd.length * 30), nodeW = 14, top = 34, bot = 14;
  const colX = [W - 250, W / 2 - 7, 236];
  const usable = H - top - bot;
  const gap = 12;
  const keysOf = cols.map((col) => col.order.filter((k) => nd.some((p) => col.f(p) === k)));
  const unit = (usable - gap * Math.max(0, ...keysOf.map((k) => k.length - 1))) / nd.length; // مقياس واحد لكل الأعمدة
  const pos = cols.map((col, ci) => {
    const keys = keysOf[ci];
    const colH = nd.length * unit + gap * Math.max(0, keys.length - 1);
    let y = top + (usable - colH) / 2; const m = {};
    keys.forEach((k) => { const n = nd.filter((p) => col.f(p) === k).length; m[k] = { y, h: n * unit, n, inY: y, outY: y }; y += n * unit + gap; });
    return { keys, m, unit };
  });
  let bands = '';
  for (let ci = 0; ci < 2; ci++) {
    const A = cols[ci], B = cols[ci + 1], PA = pos[ci], PB = pos[ci + 1];
    PA.keys.forEach((ka) => PB.keys.forEach((kb) => {
      const n = nd.filter((p) => A.f(p) === ka && B.f(p) === kb).length; if (!n) return;
      const h = n * unit;
      const ya = PA.m[ka].outY, yb = PB.m[kb].inY; PA.m[ka].outY += h; PB.m[kb].inY += h;
      const x0 = colX[ci], x1 = colX[ci + 1] + nodeW, xm = (x0 + x1) / 2;
      const col = ci === 0 ? A.c(ka) : B.c(kb);
      bands += `<path class="bo-sk-b" d="M${x0} ${ya.toFixed(1)}C${xm} ${ya.toFixed(1)} ${xm} ${yb.toFixed(1)} ${x1} ${yb.toFixed(1)}L${x1} ${(yb + h).toFixed(1)}C${xm} ${(yb + h).toFixed(1)} ${xm} ${(ya + h).toFixed(1)} ${x0} ${(ya + h).toFixed(1)}Z" style="fill:${col}" ${tipAttr(`${esc(A.lab(ka))} ← ${esc(B.lab(kb))}<br><b>${n}</b> ${n === 1 ? 'شراكة' : 'شراكات'}`)}/>`;
    }));
  }
  const nodes = cols.map((col, ci) => pos[ci].keys.map((k) => {
    const m = pos[ci].m[k], x = colX[ci];
    const lx = ci === 0 ? x + nodeW + 10 : ci === 2 ? x - 10 : x + nodeW / 2;
    const anchor = ci === 0 ? 'end' : ci === 2 ? 'start' : 'middle'; // النص عربي: البداية يمين النقطة
    const ly = ci === 1 ? m.y - 6 : m.y + m.h / 2 + 5;
    return `<g class="bo-sk-n" data-cf="${esc(col.cf(k))}"><rect x="${x}" y="${m.y.toFixed(1)}" width="${nodeW}" height="${Math.max(2, m.h).toFixed(1)}" rx="3" style="fill:${col.c(k)}"/>
      <text x="${lx}" y="${ly.toFixed(1)}" text-anchor="${anchor}" class="bo-sk-t ${ci === 1 ? 'mid' : ''}">${esc(col.lab(k))} <tspan class="n">${m.n}</tspan></text></g>`;
  }).join('')).join('');
  const act = nd.filter((p) => ['active', 'soon'].includes(pStatus(p)));
  const topCat = pos[1].keys.map((k) => [k, pos[1].m[k].n]).sort((a, b) => b[1] - a[1])[0];
  return `${boChHead('flow')}
    <div class="bo-sk-cols" aria-hidden="true"><span>قطاع الجهة</span><span>مجال الشراكة</span><span>حالة الشراكة</span></div>
    <div class="bo-sk"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="تدفق الشراكات من القطاع إلى المجال إلى الحالة">${bands}${nodes}</svg></div>
    ${boInsight(`${topCat ? `المجال الأكثر حضورًا في المحفظة: «${esc(topCat[0])}» بـ${boB(topCat[1])} ${nounFor(topCat[1], ['شراكة', 'شراكة', 'شراكات', 'شراكة'])}. ` : ''}${boB(act.length)} من ${nd.length} شراكة تصل إلى مرحلة السريان. اضغط أي عقدة لتصفية الإحاطة.`)}`;
}

/* 05 — المسار الزمني: لكل شراكة مسار من البدء إلى الانتهاء، عليه الإنجازات الموثقة */
function boChTime(X, list) {
  const rows = X.nd.filter((p) => p.startDate && p.endDate).sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  const t = today();
  const achs = D.achievements.filter((a) => (showDemo() || !a.demo) && a.date);
  const risks = boRisks(X, list);
  const sev = { h: 'مرتفعة', m: 'متوسطة', l: 'منخفضة' };
  let lanes = '<div class="empty-chart">لا توجد شراكات بتواريخ بدء وانتهاء ضمن النطاق.</div>';
  if (rows.length) {
    const y0 = Math.min(...rows.map((p) => parseDate(p.startDate).getFullYear()), t.getFullYear());
    const y1 = Math.max(...rows.map((p) => parseDate(p.endDate).getFullYear()), t.getFullYear()) + 1;
    const T0 = +new Date(y0, 0, 1), T1 = +new Date(y1, 0, 1);
    const P = (d) => ((+d - T0) / (T1 - T0) * 100).toFixed(2);
    const years = []; for (let y = y0; y < y1; y++) years.push(y);
    const tp = P(t);
    lanes = `<div class="bo-ln" style="--n:${rows.length}">
      <div class="bo-ln-head"><span></span><div class="bo-ln-axis">${years.map((y) => `<span style="right:${P(new Date(y, 0, 1))}%;width:${(100 / years.length).toFixed(2)}%">${y}</span>`).join('')}</div></div>
      <div class="bo-ln-body"><div class="bo-ln-grid" aria-hidden="true">${years.map((y) => `<i style="right:${P(new Date(y, 0, 1))}%"></i>`).join('')}${years.map((y) => `<i class="h" style="right:${P(new Date(y, 6, 1))}%"></i>`).join('')}<b class="bo-ln-today" style="right:${tp}%"><em>اليوم</em></b></div>
      ${rows.map((p, k) => {
        const st = pStatus(p), s0 = P(parseDate(p.startDate)), s1 = P(parseDate(p.endDate)), dl = daysLeft(p);
        const pa = achs.filter((a) => a.partnershipId === p.id);
        const cls = st === 'active' ? 'a' : st === 'soon' ? 's' : st === 'upcoming' ? 'u' : st === 'ended' ? 'e' : 'o';
        const tag = st === 'soon' ? `<em class="bo-ln-tag s">تنتهي خلال ${dl} يومًا</em>` : st === 'upcoming' ? `<em class="bo-ln-tag u">تبدأ ${fmtDate(p.startDate, 'short')}</em>` : st === 'ended' ? '<em class="bo-ln-tag e">منتهية</em>' : '';
        return `<div class="bo-ln-row" data-href="#/partnerships/${p.id}" style="--k:${k}"><div class="bo-ln-name">${plateHTML(partnerById(p.partnerId), 28)}<span><b>${esc(partnerName(p))}</b><small>${esc(pSector(p) || '')}${p.code ? ' · ' + esc(p.code) : ''}</small></span></div>
          <div class="bo-ln-track"><span class="bo-ln-bar ${cls}" style="right:${s0}%;width:${Math.max(0.8, s1 - s0).toFixed(2)}%" ${tipAttr(`<b>${esc(partnerName(p))}</b><br>${fmtDate(p.startDate)} — ${fmtDate(p.endDate)}<br>${esc(statusLabel(st))}${dl !== null && dl >= 0 && ['active', 'soon'].includes(st) ? ` — متبقٍ ${dl} يومًا` : ''}`)}><i class="s0"></i><i class="s1"></i></span>
            ${pa.map((a) => `<button type="button" class="bo-ln-star" data-story="${a.id}" style="right:${P(parseDate(a.date))}%" ${tipAttr(`<b>${esc(a.title)}</b><br>${fmtDate(a.date)}${a.metricValue ? `<br>${esc(a.metricValue)} ${esc(a.metricLabel || '')}` : ''}`)} aria-label="${esc(a.title)}">${icon('star')}</button>`).join('')}
            ${tag ? `<span class="bo-ln-tagw" style="${st === 'upcoming' ? `left:calc(${(100 - +s0).toFixed(2)}% + 10px)` : `right:calc(${s1}% + 10px)`}">${tag}</span>` : ''}</div></div>`;
      }).join('')}</div>
      <div class="bo-tl-lg"><span><i class="a"></i>سارية</span><span><i class="s"></i>تنتهي خلال ${D.settings.expiryDays} يومًا</span><span><i class="u"></i>لم يبدأ سريانها</span><span><i class="e"></i>منتهية</span><span class="st">${icon('star')}إنجاز موثّق</span><span class="r">الزمن من اليمين إلى اليسار، والخط الذهبي تاريخ اليوم</span></div></div>`;
  }
  return `${boChHead('time')}
    ${lanes}
    <div class="bo-risk" data-tour="dash-actions"><h4>سجل المتابعة والمخاطر <small>${risks.length ? plural(risks.length, 'بند واحد', 'بندان', 'بنود', 'بندًا') : 'لا بنود'}</small></h4>
      ${risks.length ? `<div class="tbl-wrap"><table class="tbl bo-rt"><thead><tr><th>البند</th><th>الأهمية</th><th>المسؤول</th><th>الموعد</th><th>الإجراء المقترح</th></tr></thead><tbody>
        ${risks.map((r) => `<tr ${r.href ? `data-href="${r.href}"` : ''}><td><b>${esc(r.t)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</td><td><span class="bo-sev ${r.s}">${sev[r.s]}</span></td><td>${esc(r.o || '—')}</td><td>${r.due ? `<span class="num">${fmtDate(r.due, 'short')}</span>${r.days != null ? `<small>${r.days} يومًا</small>` : ''}` : '—'}</td><td>${esc(r.a)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-chart">لا توجد بنود مفتوحة ضمن النطاق الحالي.</div>'}</div>
    ${boInsight(X.trend ? `السارية اليوم ${boB(X.trend.now)}، وتبقى ${boB(X.trend.ahead)} بعد ستة أشهر ما لم تُجدَّد أو تُضف شراكات جديدة.${X.soon.length ? ` أقرب استحقاق: «${esc(partnerName(X.soon[0]))}» في ${fmtDate(X.soon[0].endDate)}.` : ''}` : 'لا توجد تواريخ كافية لرسم المسار الزمني.')}`;
}
function boRisks(X, list) {
  const R = [];
  X.soon.forEach((p) => { const dl = daysLeft(p); R.push({ t: `انتهاء الشراكة مع ${partnerName(p)}`, sub: p.code || '', s: dl <= (D.settings.alertDays || 30) ? 'h' : 'm', o: (p.owners || []).join('، '), due: p.endDate, days: dl, a: 'رفع توصية بالتجديد أو الإنهاء مع تقييم الأثر', href: '#/partnerships/' + p.id }); });
  X.act.filter((p) => p.activation && p.activation !== 'مفعّلة').forEach((p) => R.push({ t: `شراكة سارية ${p.activation === 'قيد التفعيل' ? 'قيد التفعيل' : 'غير مفعّلة'}: ${partnerName(p)}`, sub: p.code || '', s: p.activation === 'قيد التفعيل' ? 'l' : 'm', o: (p.owners || []).join('، '), a: 'إقرار خطة تفعيل بمخرجات وجدول زمني', href: '#/partnerships/' + p.id }));
  X.up.forEach((p) => R.push({ t: `بدء سريان الشراكة مع ${partnerName(p)}`, sub: p.code || '', s: 'l', o: (p.owners || []).join('، '), due: p.startDate, days: daysBetween(today(), parseDate(p.startDate)), a: 'تجهيز فريق التنفيذ وخطة الإطلاق', href: '#/partnerships/' + p.id }));
  const miss = X.nd.filter((p) => missingFields(p).length);
  if (miss.length) R.push({ t: `${plural(miss.length, 'سجل واحد', 'سجلان', 'سجلات', 'سجلًا')} ببيانات أساسية ناقصة`, s: miss.length > X.nd.length / 2 ? 'm' : 'l', o: 'إدارة الشراكات', a: 'استكمال الحقول من الجهات المعنية', href: '#/partnerships?missing=1' });
  const old = X.inProc.filter((x) => propAgeDays(x) > (D.settings.infoAgeDays || 7));
  if (old.length) R.push({ t: `${plural(old.length, 'مقترح واحد', 'مقترحان', 'مقترحات', 'مقترحًا')} من الإدارات متأخر في المعالجة`, s: 'm', o: 'إدارة الشراكات', a: 'البت في المقترحات أو طلب استكمالها', href: can('proposal.review') ? '#/proposals?status=submitted|review|info' : '' });
  const ord = { h: 0, m: 1, l: 2 };
  return R.sort((a, b) => ord[a.s] - ord[b.s] || (a.days ?? 9999) - (b.days ?? 9999)).slice(0, 10);
}

/* 06 — القرارات والتوصيات المطلوبة */
function boChDecisions(X) {
  const D_ = [];
  X.soon.forEach((p) => D_.push({ k: 'قرار', c: 'd', t: `اعتماد قرار تجديد الشراكة مع «${partnerName(p)}» أو إنهائها`, s: `تنتهي في ${fmtDate(p.endDate)} — متبقٍ ${daysLeft(p)} يومًا`, href: '#/partnerships/' + p.id }));
  const acc = X.props.filter((x) => x.status === 'accepted');
  if (acc.length) D_.push({ k: 'قرار', c: 'd', t: `اعتماد تحويل ${plural(acc.length, 'مقترح مقبول', 'مقترحين مقبولين', 'مقترحات مقبولة', 'مقترحًا مقبولًا')} إلى ${acc.length === 1 ? 'شراكة' : 'شراكات'}`, s: acc.map((x) => x.partnerName).filter(Boolean).slice(0, 3).join('، '), href: can('proposal.review') ? '#/proposals?status=accepted' : '' });
  const sign = X.nd.filter((p) => pStatus(p) === 'sign');
  if (sign.length) D_.push({ k: 'قرار', c: 'd', t: `اعتماد توقيع ${plural(sign.length, 'مذكرة واحدة', 'مذكرتين', 'مذكرات', 'مذكرة')} بانتظار التوقيع`, s: sign.map(partnerName).slice(0, 3).join('، '), href: '#/partnerships?status=sign' });
  const notAct = X.act.filter((p) => p.activation && p.activation !== 'مفعّلة');
  if (notAct.length) D_.push({ k: 'توجيه', c: 'g', t: `توجيه بتفعيل ${plural(notAct.length, 'شراكة سارية', 'شراكتين ساريتين', 'شراكات سارية', 'شراكة سارية')} لم يكتمل تفعيلها`, s: notAct.map(partnerName).slice(0, 3).join('، '), href: '#/partnerships' + filtersToQuery({ status: ['active', 'soon'] }) });
  const miss = X.nd.filter((p) => missingFields(p).length);
  if (miss.length) D_.push({ k: 'توجيه', c: 'g', t: `توجيه باستكمال بيانات ${plural(miss.length, 'سجل', 'سجلين', 'سجلات', 'سجلًا')} لرفع اكتمال البيانات من ${X.complete}%`, s: 'يدعم دقة التقارير المرفوعة للمجلس', href: '#/partnerships?missing=1' });
  X.nd.filter((p) => richItems(p.recommendations).length).slice(0, 3).forEach((p) => D_.push({ k: 'توصية', c: 'r', t: firstItem(p.recommendations), s: `من سجل الشراكة مع «${partnerName(p)}»`, href: '#/partnerships/' + p.id }));
  if (X.up.length) D_.push({ k: 'للعلم', c: 'i', t: `يبدأ سريان ${plural(X.up.length, 'شراكة جديدة', 'شراكتين جديدتين', 'شراكات جديدة', 'شراكة جديدة')} قريبًا`, s: X.up.map((p) => `${partnerName(p)} (${fmtDate(p.startDate, 'short')})`).slice(0, 3).join('، '), href: '#/partnerships?status=upcoming' });
  const P = X.props;
  const fs = [
    { l: 'مقدّمة', n: P.length },
    { l: 'قيد الدراسة', n: P.filter((x) => ['submitted', 'review', 'info'].includes(x.status)).length },
    { l: 'مقبولة', n: P.filter((x) => ['accepted', 'converted'].includes(x.status)).length },
    { l: 'حُوّلت إلى شراكات', n: P.filter((x) => x.status === 'converted').length },
  ];
  const fmax = Math.max(1, fs[0].n);
  const tags = { d: 'للاعتماد', g: 'للتوجيه', r: 'توصية', i: 'للعلم' };
  return `${boChHead('dec')}
    <div class="bo-dec">
      <ol class="bo-dec-l">${D_.length ? D_.slice(0, 8).map((d, i) => `<li class="${d.c}" ${d.href ? `data-href="${d.href}"` : ''}><span class="bo-dec-n">${BO_AR(i + 1)}</span><div><span class="bo-dec-k">${tags[d.c]}</span><h4>${esc(d.t)}</h4>${d.s ? `<small>${esc(d.s)}</small>` : ''}</div>${d.href ? icon('chevL') : ''}</li>`).join('') : '<li class="i"><div><h4>لا توجد بنود تحتاج قرارًا من المجلس ضمن النطاق الحالي.</h4></div></li>'}</ol>
      <div class="bo-funnel"><h4>مسار مقترحات الإدارات</h4><p>من فكرة في إدارة إلى شراكة موقّعة</p>
        <div class="bo-fn">${fs.map((f, i) => `<a href="${can('proposal.review') ? '#/proposals' : '#/share'}" style="--w:${Math.max(18, f.n / fmax * 100).toFixed(0)}%;--i:${i}"><b class="cu" data-v="${f.n}">${f.n}</b><span>${f.l}</span></a>`).join('')}</div>
        ${fs[0].n ? `<p class="bo-fn-r">نسبة التحويل إلى شراكات: <b>${Math.round(fs[3].n / fs[0].n * 100)}%</b></p>` : ''}</div>
    </div>
    ${boInsight(D_.filter((d) => d.c === 'd').length ? `${plural(D_.filter((d) => d.c === 'd').length, 'بند واحد يحتاج', 'بندان يحتاجان', 'بنود تحتاج', 'بندًا يحتاج')} اعتماد المجلس، و${plural(D_.filter((d) => d.c === 'g').length, 'بند واحد', 'بندان', 'بنود', 'بندًا')} للتوجيه.` : 'لا بنود تحتاج اعتماد المجلس حاليًا؛ تُعرض البنود للعلم والمتابعة.')}`;
}

/* =====================================================================
   العرض التقديمي: كل فصل شريحة بملء الشاشة، والتنقل بالأسهم
   ===================================================================== */
function boPresent(on) {
  const root = $('#boDash'); if (!root) return;
  App.boPresent = on;
  root.classList.toggle('bo-pres', on);
  document.documentElement.classList.toggle('bo-presenting', on);
  const app = $('.app');
  if (on) {
    app.classList.add('present');
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    let nav = $('#boPNav');
    if (!nav) {
      nav = document.createElement('div'); nav.id = 'boPNav'; nav.className = 'bo-pnav no-print';
      document.body.appendChild(nav);
      nav.addEventListener('click', (e) => {
        const b = e.target.closest('[data-bop]'); if (b) return boGoto(+b.dataset.bop);
        if (e.target.closest('[data-bonext]')) return boGoto(App.boSlide + 1);
        if (e.target.closest('[data-boprev]')) return boGoto(App.boSlide - 1);
        if (e.target.closest('[data-boexit]')) return boPresent(false);
      });
    }
    App.boSlide = 0;
    boPresentSync(); boGoto(0);
  } else {
    app.classList.remove('present');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const nav = $('#boPNav'); nav && nav.remove();
  }
}
function boSlides() { return [$('.bo-cover'), ...$$('#boDash .bo-ch')].filter(Boolean); }
function boPresentSync() {
  const nav = $('#boPNav'); if (!nav) return;
  const n = boSlides().length;
  nav.innerHTML = `<button type="button" data-boprev aria-label="السابق">${icon('chevR')}</button><div class="bo-pdots">${Array.from({ length: n }, (_, i) => `<button type="button" data-bop="${i}" class="${i === App.boSlide ? 'on' : ''}" title="${i ? esc(BO_CH[i - 1].t) : 'الغلاف'}"><em>${i ? boIdx(i) : '•'}</em></button>`).join('')}</div><span class="bo-pcount"><b>${App.boSlide + 1}</b> / ${n}</span><button type="button" data-bonext aria-label="التالي">${icon('chevL')}</button><button type="button" class="x" data-boexit>${icon('x')} إنهاء العرض</button>`;
}
function boGoto(i) {
  const s = boSlides(); if (!s.length) return;
  App.boSlide = Math.max(0, Math.min(s.length - 1, i));
  s.forEach((el, k) => el.classList.toggle('bo-cur', k === App.boSlide));
  s[App.boSlide].scrollIntoView({ behavior: cuReduce() ? 'auto' : 'smooth', block: 'start' });
  boPresentSync();
}
document.addEventListener('keydown', (e) => {
  if (!App.boPresent) return;
  if (['ArrowLeft', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); boGoto(App.boSlide + 1); }
  else if (['ArrowRight', 'PageUp'].includes(e.key)) { e.preventDefault(); boGoto(App.boSlide - 1); }
  else if (e.key === 'Home') { e.preventDefault(); boGoto(0); }
  else if (e.key === 'End') { e.preventDefault(); boGoto(99); }
  else if (e.key === 'Escape') boPresent(false);
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && App.boPresent) boPresent(false); });
window.addEventListener('hashchange', () => { if (App.boPresent) boPresent(false); });
