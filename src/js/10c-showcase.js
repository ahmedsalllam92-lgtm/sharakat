/* =====================================================================
   واجهة الصور المتحركة + «معرض الأثر»
   الصور تُجمع لحظة العرض من سجلات الشراكات نفسها (الغلاف وصور الشراكة وصور قصص النجاح)،
   فأي صورة تُرفع أو تُحذف من شراكة تظهر أو تختفي هنا تلقائيًا.
   ===================================================================== */
/* كل صور الشراكات المتاحة للحساب الحالي */
function showcasePhotos() {
  const out = [], seen = new Set();
  const add = (id, p, extra = {}) => { if (!id || seen.has(id)) return; seen.add(id); out.push({ id, p, ...extra }); };
  visiblePartnerships().filter((p) => !p.isDraft && (showDemo() || !p.demo)).forEach((p) => {
    add(p.coverFileId, p, { kind: 'cover', at: p.updatedAt || p.startDate });
    (p.attachments || []).filter((a) => isImg(a) && (can('view.internal') || a.category === 'صور الشراكة' || p.public)).forEach((a) => add(a.fileId, p, { kind: a.category === 'صور الشراكة' ? 'field' : 'doc', cap: a.name, at: a.addedAt }));
  });
  D.achievements.filter((s) => showDemo() || !s.demo).forEach((s) => { const p = D.partnerships.find((x) => x.id === s.partnershipId); (s.gallery || []).forEach((g) => add(g, p, { kind: 'story', story: s, cap: s.title, at: s.date })); });
  return out;
}
/* شريحة لكل شراكة: أحدث صورة لها، بترتيب الشراكات المميزة ثم السارية */
function heroSlides() {
  const by = new Map();
  showcasePhotos().forEach((x) => { if (x.p && !by.has(x.p.id)) by.set(x.p.id, x); });
  const rank = (p) => (p.golden ? 0 : ['active', 'soon'].includes(pStatus(p)) ? 1 : 2);
  const L_ = [...by.values()].sort((a, b) => rank(a.p) - rank(b.p));
  if (L_.length < 2) ['waqf-saitah-signing', 'border-guard-signing'].forEach((k) => { if (ASSET_IMG[k]) L_.push({ id: 'asset:' + k, p: null, cap: ASSET_IMG[k].title }); });
  return L_.slice(0, 12);
}
const scImg = (id, cls = '', lazy) => (id.startsWith('asset:') ? `<img class="${cls}" src="${(ASSET_IMG[id.slice(6)] || {}).src || ''}" alt="">` : id.startsWith('lib:') ? `<img class="${cls}" src="${(IMG_LIB[id.slice(4)] || {}).src || ''}" alt="">` : `<img class="${cls}" data-file="${esc(id)}" alt="" ${lazy ? 'loading="lazy"' : ''}>`);

/* — الدوّار في الواجهة — */
function heroRotHTML(variant) {
  const S = heroSlides();
  const own = variant === 'classic' && D.settings.home && D.settings.home.heroImageFileId; // صورة الواجهة المختارة من الإعدادات تبقى أول صورة
  if (own) S.unshift({ id: own, p: null, cap: D.settings.home.heroTitle || '' });
  if (!S.length) return '';
  return `<div class="hrot hrot-${variant}" data-hrot data-n="${S.length}">
    ${S.map((x, i) => `<button type="button" class="hrot-s ${i === 0 ? 'on' : ''}" data-hs="${i}" ${x.p ? `data-hpid="${x.p.id}"` : ''} aria-label="${esc(x.p ? partnerName(x.p) : x.cap || '')}">${scImg(x.id, 'hrot-img photo')}</button>`).join('')}
    <div class="hrot-cap" aria-live="polite">${S.map((x, i) => `<span class="${i === 0 ? 'on' : ''}" data-hc="${i}">${x.p ? `<i>${logoOrMono(partnerById(x.p.partnerId), partnerName(x.p))}</i><b>${esc(partnerName(x.p))}</b><small>${x.p.golden ? '★ شراكة ذهبية · ' : ''}اضغط للتفاصيل</small>` : `<b>${esc(x.cap || '')}</b>`}</span>`).join('')}</div>
    ${S.length > 1 ? `<div class="hrot-dots">${S.map((_, i) => `<i class="${i === 0 ? 'on' : ''}" data-hd="${i}"></i>`).join('')}</div>` : ''}
    <a class="hrot-gal" href="#/gallery" title="معرض الأثر" aria-label="معرض الأثر">${icon('image')}<span>المعرض</span></a>
  </div>`;
}
function initHeroRot(root) {
  const box = root && root.querySelector('[data-hrot]'); if (!box) return;
  hydrateFiles(box);
  const n = +box.dataset.n; let i = 0, paused = false;
  const show = (k) => {
    i = (k + n) % n;
    box.querySelectorAll('.hrot-s').forEach((s, j) => { s.classList.toggle('on', j === i); s.classList.toggle('prev', j === (i - 1 + n) % n); });
    box.querySelectorAll('[data-hc]').forEach((s, j) => s.classList.toggle('on', j === i));
    box.querySelectorAll('[data-hd]').forEach((s, j) => s.classList.toggle('on', j === i));
    const twin = root.querySelector('[data-hrot-twin]'); if (twin) { const nx = box.querySelectorAll('.hrot-s img')[(i + 1) % n]; if (nx) { twin.classList.remove('in'); void twin.offsetWidth; twin.src = nx.src || ''; twin.classList.add('in'); } }
  };
  clearInterval(App.hrotT);
  if (n > 1) App.hrotT = setInterval(() => { if (!document.body.contains(box)) return clearInterval(App.hrotT); if (!paused && !document.hidden) show(i + 1); }, 5200);
  box.addEventListener('mouseenter', () => { paused = true; }); box.addEventListener('mouseleave', () => { paused = !!$('#hrotPop'); });
  box.addEventListener('click', (e) => {
    const d = e.target.closest('[data-hd]'); if (d) { e.stopPropagation(); return show(+d.dataset.hd); }
    const s = e.target.closest('[data-hpid]') || (e.target.closest('.hrot-cap') && box.querySelector('.hrot-s.on[data-hpid]'));
    if (s) { e.stopPropagation(); paused = true; hrotPopover(s.dataset.hpid, box, () => { paused = false; }); }
  });
  setTimeout(() => show(0), 30);
}
/* بطاقة تفاصيل الشراكة فوق الصورة؛ تُغلق بالضغط خارجها أو Esc */
function hrotPopover(pid, anchor, onClose) {
  const p = D.partnerships.find((x) => x.id === pid); if (!p) return;
  $('#hrotPop') && $('#hrotPop').remove();
  const pr = partnerById(p.partnerId) || {}, P = pProfile(p), dl = daysLeft(p);
  const photos = showcasePhotos().filter((x) => x.p && x.p.id === p.id);
  const el = document.createElement('div'); el.id = 'hrotPop'; el.className = 'hrot-pop'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', partnerName(p));
  el.innerHTML = `<button type="button" class="hp-x" aria-label="إغلاق">${icon('x')}</button>
    <div class="hp-h"><span class="hp-logo">${logoOrMono(pr, partnerName(p))}</span><div><b>${esc(partnerName(p))}</b><small>${[p.classification, pSector(p)].filter(Boolean).map(esc).join(' · ')}</small></div>${p.golden ? `<span class="hp-gold" title="شراكة ذهبية">${typeof STAR_SVG !== 'undefined' ? STAR_SVG : '★'}</span>` : ''}</div>
    ${p.showcaseGoal || firstItem(p.cooperationAreas) ? `<p class="hp-q">${esc(trimP(p.showcaseGoal || firstItem(p.cooperationAreas)).slice(0, 180))}</p>` : ''}
    <dl class="hp-f"><div><dt>الحالة</dt><dd>${statusChip(p)}</dd></div><div><dt>المدة</dt><dd>${p.startDate ? fmtDate(p.startDate, 'short') + ' – ' + fmtDate(p.endDate, 'short') : '—'}</dd></div>
      <div><dt>المخرجات</dt><dd>${richItems(p.outputs).length || '—'}</dd></div><div><dt>${dl !== null && dl >= 0 ? 'المتبقي' : 'التقييم'}</dt><dd>${dl !== null && dl >= 0 ? plural(dl, 'يوم', 'يومان', 'أيام', 'يومًا') : P.ev && P.ev.score !== null ? P.ev.score + '/100' : '—'}</dd></div></dl>
    <div class="hp-a"><a class="btn primary sm" href="#/partnerships/${p.id}">${icon('layers')} تفاصيل الشراكة</a>${photos.length ? `<a class="btn sm" href="#/gallery?p=${p.id}">${icon('image')} صورها (${photos.length})</a>` : ''}</div>`;
  document.body.appendChild(el);
  const r = anchor.getBoundingClientRect(), w = Math.min(360, innerWidth - 24);
  el.style.width = w + 'px';
  el.style.top = Math.round(Math.max(12, Math.min(innerHeight - el.offsetHeight - 12, r.top + r.height / 2 - el.offsetHeight / 2))) + 'px';
  el.style.left = Math.round(Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2))) + 'px';
  requestAnimationFrame(() => el.classList.add('on'));
  const close = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 200); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', key); window.removeEventListener('hashchange', close); onClose && onClose(); };
  const out = (e) => { if (!el.contains(e.target)) close(); };
  const key = (e) => { if (e.key === 'Escape') close(); };
  setTimeout(() => document.addEventListener('mousedown', out, true), 0);
  document.addEventListener('keydown', key); window.addEventListener('hashchange', close);
  el.querySelector('.hp-x').onclick = close;
}

/* =====================================================================
   «معرض الأثر»: صفحة عرض ودعاية — جدار فسيفسائي، وعرض سينمائي، وبكرات لكل شراكة
   ===================================================================== */
function renderGallery(el, r) {
  el.classList.add('full', 'galpage');
  const q = (r && r.query) || {};
  App.gal = App.gal || { view: 'wall', sec: '', pid: '' };
  if (q.p) { App.gal.pid = q.p; App.gal.view = 'wall'; }
  const draw = () => {
    const all = showcasePhotos();
    const parts = [...new Map(all.filter((x) => x.p).map((x) => [x.p.id, x.p])).values()];
    const secs = [...new Set(parts.map(pSector).filter(Boolean))];
    const G = App.gal;
    const list = all.filter((x) => (!G.sec || (x.p && pSector(x.p) === G.sec)) && (!G.pid || (x.p && x.p.id === G.pid)));
    const hero = list[0] || all[0];
    App.galList = list;
    el.innerHTML = `<div class="gal">
      <header class="gal-hero">
        <div class="gal-hero-bg">${hero ? scImg(hero.id, 'gal-hero-img') : ''}<span></span></div>
        <div class="gal-hero-in">
          <span class="gal-eye"><i></i>${esc(D.settings.org.name)} · ${esc(D.settings.org.dept)}</span>
          <h1><span>معرض</span> <em>الأثر</em></h1>
          <p>لحظات من الميدان، وتوقيعات، ومبادرات صنعناها مع شركائنا. يتجدد تلقائيًا مع كل صورة تُضاف إلى شراكة.</p>
          <div class="gal-stats"><span><b>${all.length}</b>صورة</span><span><b>${parts.length}</b>شراكة</span><span><b>${secs.length}</b>قطاعات</span></div>
          <div class="gal-cta"><button type="button" class="btn gold lg" data-gcine ${list.length ? '' : 'disabled'}>${icon('play')} العرض السينمائي</button>
            <div class="gal-views" role="tablist">${[['wall', 'الجدار', 'grid'], ['reels', 'حسب الشراكة', 'layers']].map(([k, l, ic]) => `<button type="button" class="${G.view === k ? 'on' : ''}" data-gview="${k}">${icon(ic)}${l}</button>`).join('')}</div></div>
        </div>
      </header>
      <nav class="gal-f" aria-label="تصفية المعرض">
        <button type="button" class="${!G.sec && !G.pid ? 'on' : ''}" data-gsec="">الكل <b>${all.length}</b></button>
        ${secs.map((s) => `<button type="button" class="${G.sec === s ? 'on' : ''}" data-gsec="${esc(s)}">${esc(s)} <b>${all.filter((x) => x.p && pSector(x.p) === s).length}</b></button>`).join('')}
        <span class="sp"></span>
        <label class="gal-pick">${icon('filter')}<select data-gpid><option value="">كل الشراكات</option>${parts.map((p) => `<option value="${p.id}" ${G.pid === p.id ? 'selected' : ''}>${esc(partnerName(p))}</option>`).join('')}</select></label>
      </nav>
      ${!list.length ? `<div class="gal-empty">${icon('image')}<b>لا توجد صور بعد</b><span>ارفع صور الشراكات من صفحة كل شراكة (تصنيف «صور الشراكة»)، وستظهر هنا فورًا.</span></div>`
      : G.view === 'reels' ? galReels(list) : galWall(list)}
    </div>`;
    hydrateFiles(el);
    galReveal(el);
  };
  draw();
  el.onclick = (e) => {
    const v = e.target.closest('[data-gview]'); if (v) { App.gal.view = v.dataset.gview; return draw(); }
    const s = e.target.closest('[data-gsec]'); if (s) { App.gal.sec = s.dataset.gsec; App.gal.pid = ''; return draw(); }
    if (e.target.closest('[data-gcine]')) return galViewer(0, true);
    const t = e.target.closest('[data-gi]'); if (t) { e.preventDefault(); return galViewer(+t.dataset.gi, false); }
  };
  el.onchange = (e) => { if (e.target.matches('[data-gpid]')) { App.gal.pid = e.target.value; App.gal.sec = ''; draw(); } };
}
/* جدار فسيفسائي بأحجام متفاوتة تُحدَّد بإيقاع ثابت فيبدو مُخرجًا لا عشوائيًا */
function galWall(list) {
  const span = (i) => ['w2 h2', '', 'h2', '', 'w2', '', '', 'h2', 'w2', ''][i % 10];
  return `<section class="gal-wall">${list.map((x, i) => `<a href="#" class="gal-t ${span(i)}" data-gi="${i}" style="--i:${i % 12}">
    ${scImg(x.id, '', true)}
    <span class="gal-t-c">${x.p ? `<i>${logoOrMono(partnerById(x.p.partnerId), partnerName(x.p))}</i>` : ''}<span><b>${esc(x.p ? partnerName(x.p) : x.cap || '')}</b><small>${esc(x.kind === 'story' ? (x.cap || 'قصة نجاح') : x.p ? (pSector(x.p) || '') : '')}</small></span></span>
    ${x.kind === 'story' ? '<em class="gal-badge">قصة نجاح</em>' : x.p && x.p.golden ? '<em class="gal-badge gold">★ ذهبية</em>' : ''}</a>`).join('')}</section>`;
}
/* بكرة أفقية لكل شراكة بشعارها */
function galReels(list) {
  const by = new Map(); list.forEach((x, i) => { const k = x.p ? x.p.id : '_'; if (!by.has(k)) by.set(k, []); by.get(k).push([x, i]); });
  return `<section class="gal-reels">${[...by.entries()].map(([k, arr]) => { const p = arr[0][0].p; return `<div class="gal-reel">
    <header>${p ? `<i>${logoOrMono(partnerById(p.partnerId), partnerName(p))}</i><div><b>${esc(partnerName(p))}</b><small>${[p.classification, pSector(p)].filter(Boolean).map(esc).join(' · ')} · ${arr.length} ${arr.length === 1 ? 'صورة' : 'صور'}</small></div><a class="linkbtn" href="#/partnerships/${p.id}">الشراكة ${icon('arrowL')}</a>` : '<div><b>صور أخرى</b></div>'}</header>
    <div class="gal-strip">${arr.map(([x, i]) => `<a href="#" class="gal-r" data-gi="${i}">${scImg(x.id, '', true)}</a>`).join('')}</div></div>`; }).join('')}</section>`;
}
function galReveal(el) {
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.gal-t,.gal-reel', el).forEach((t) => (io ? io.observe(t) : t.classList.add('in')));
}
/* العارض السينمائي: صورة بحركة بطيئة، وخلفية ضبابية من الصورة نفسها، وبطاقة الشراكة، وشريط مصغرات */
function galViewer(start, autoplay) {
  const L_ = App.galList || []; if (!L_.length) return;
  $('#galV') && $('#galV').remove();
  const v = document.createElement('div'); v.id = 'galV'; v.className = 'galv' + (autoplay ? ' cine' : ''); v.dir = 'rtl';
  v.innerHTML = `<div class="galv-bg"></div><div class="galv-stage"></div>
    <aside class="galv-info"></aside>
    <div class="galv-bar"><button type="button" data-v="prev" title="السابق">${icon('chevR')}</button><span class="galv-n"></span><button type="button" data-v="next" title="التالي">${icon('chevL')}</button>
      <span class="sep"></span><button type="button" data-v="play" title="تشغيل/إيقاف (مسافة)">${icon(autoplay ? 'pause' : 'play')}</button><button type="button" data-v="fs" title="ملء الشاشة">${icon('expand')}</button><button type="button" data-v="dl" title="تنزيل">${icon('download')}</button><button type="button" data-v="x" title="إغلاق (Esc)">${icon('x')}</button></div>
    <div class="galv-prog"><i></i></div>
    <div class="galv-thumbs">${L_.map((x, i) => `<button type="button" data-vt="${i}">${scImg(x.id, '', true)}</button>`).join('')}</div>`;
  document.body.appendChild(v); document.documentElement.classList.add('galv-on');
  hydrateFiles(v.querySelector('.galv-thumbs'));
  let i = start, timer = null, playing = !!autoplay;
  const D_ = 5200;
  const show = async (k) => {
    i = (k + L_.length) % L_.length; const x = L_[i];
    const st = v.querySelector('.galv-stage');
    const im = document.createElement('div'); im.className = 'galv-img'; im.innerHTML = scImg(x.id); st.appendChild(im); hydrateFiles(im);
    const img = im.querySelector('img');
    const ready = () => { const src = img.src; v.querySelector('.galv-bg').style.backgroundImage = src ? `url("${src}")` : ''; requestAnimationFrame(() => im.classList.add('on')); [...st.children].slice(0, -1).forEach((o) => { o.classList.remove('on'); o.classList.add('out'); setTimeout(() => o.remove(), 900); }); };
    if (img.complete && img.src) ready(); else { img.onload = ready; setTimeout(ready, 600); }
    const p = x.p, pr = p ? partnerById(p.partnerId) : null;
    v.querySelector('.galv-info').innerHTML = p ? `<span class="gi-logo">${logoOrMono(pr, partnerName(p))}</span><div><small>${esc([pSector(p), p.classification].filter(Boolean).join(' · '))}</small><b>${esc(partnerName(p))}</b>${x.kind === 'story' && x.story ? `<p>${esc(x.story.title)}</p>` : p.showcaseGoal || firstItem(p.cooperationAreas) ? `<p>${esc(trimP(p.showcaseGoal || firstItem(p.cooperationAreas)).slice(0, 120))}</p>` : ''}<a href="#/partnerships/${p.id}" data-v="x">تفاصيل الشراكة ${icon('arrowL')}</a></div>` : `<div><b>${esc(x.cap || '')}</b></div>`;
    v.querySelector('.galv-n').textContent = `${i + 1} / ${L_.length}`;
    v.querySelectorAll('[data-vt]').forEach((b, j) => b.classList.toggle('on', j === i));
    const on = v.querySelector(`[data-vt="${i}"]`); on && on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    restart();
  };
  const restart = () => { clearTimeout(timer); const pg = v.querySelector('.galv-prog i'); pg.style.transition = 'none'; pg.style.width = '0'; if (playing) { void pg.offsetWidth; pg.style.transition = `width ${D_}ms linear`; pg.style.width = '100%'; timer = setTimeout(() => show(i + 1), D_); } };
  const close = () => { clearTimeout(timer); document.removeEventListener('keydown', key); document.documentElement.classList.remove('galv-on'); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); v.classList.add('bye'); setTimeout(() => v.remove(), 300); };
  const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(i + 1); if (e.key === 'ArrowRight') show(i - 1); if (e.key === ' ') { e.preventDefault(); toggle(); } };
  const toggle = () => { playing = !playing; v.querySelector('[data-v="play"]').innerHTML = icon(playing ? 'pause' : 'play'); v.classList.toggle('cine', playing); restart(); };
  document.addEventListener('keydown', key);
  v.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-vt]'); if (t) return show(+t.dataset.vt);
    const b = e.target.closest('[data-v]'); if (!b) { if (e.target.closest('.galv-stage')) show(i + 1); return; }
    const a = b.dataset.v;
    if (a === 'x') return close();
    if (a === 'next') return show(i + 1);
    if (a === 'prev') return show(i - 1);
    if (a === 'play') return toggle();
    if (a === 'fs') { if (!document.fullscreenElement) v.requestFullscreen && v.requestFullscreen().catch(() => {}); else document.exitFullscreen().catch(() => {}); return; }
    if (a === 'dl') { const x = L_[i]; if (x.id.startsWith('asset:') || x.id.startsWith('lib:')) { const src = (x.id.startsWith('asset:') ? ASSET_IMG[x.id.slice(6)] : IMG_LIB[x.id.slice(4)]).src; const l = document.createElement('a'); l.href = src; l.download = 'صورة.jpg'; l.click(); } else downloadStored(x.id, x.p ? partnerName(x.p) : 'صورة'); }
  });
  show(i);
}
