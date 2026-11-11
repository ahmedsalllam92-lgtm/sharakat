/* =====================================================================
   استعراض الشراكات المميزة (الذهبية والمختارة) من داخل القسم
   شاشة كاملة: صورة الشراكة بحركة بطيئة، وبطاقة معلوماتها تدخل بحركة متتابعة،
   وشريط مصغرات، وتشغيل تلقائي، وتنقل بالأسهم ولوحة المفاتيح.
   ===================================================================== */
function pshowSlide(p) {
  const pr = partnerById(p.partnerId) || {}, st = pStatus(p), P = pProfile(p), dl = daysLeft(p);
  const s0 = parseDate(p.startDate), e0 = parseDate(p.endDate);
  const months = s0 && e0 ? Math.max(1, Math.round((e0 - s0) / (30.44 * 864e5))) : null;
  const goal = trimP(p.showcaseGoal || firstItem(p.cooperationAreas) || firstItem(p.expectedImpact) || '');
  const coop = itemsOf(p.cooperationAreas).filter((c) => normAr(trimP(c.t || c.x)) !== normAr(goal)).slice(0, 3);
  const facts = [
    months ? [months % 12 === 0 ? months / 12 : months, months % 12 === 0 ? (months / 12 === 1 ? 'سنة' : months / 12 === 2 ? 'سنتان' : 'سنوات') : 'شهرًا', 'مدة الشراكة'] : null,
    dl !== null && ['active', 'soon'].includes(st) ? [nf(dl), 'يومًا', 'المتبقي'] : null,
    richItems(p.outputs).length ? [richItems(p.outputs).length, '', 'مخرجات مستهدفة'] : null,
    P.ev && P.ev.score !== null ? [P.ev.score, '/100', 'التقييم'] : null,
    P.total ? [sarShort(P.total), '⃁', 'القيمة'] : null,
  ].filter(Boolean).slice(0, 4);
  return `<div class="ps-media">${coverHTML('ps' + p.id, p.coverFileId || ((p.attachments || []).find((a) => isImg(a)) || {}).fileId, { W: 1400, H: 900, levels: 12, cols: 50, tone: toneFor(pr) })}</div>
    <div class="ps-veil"></div>
    <article class="ps-card">
      <div class="ps-head"><span class="ps-logo">${logoOrMono(pr, partnerName(p))}</span>
        <div><span class="ps-kick">${p.golden ? `<i class="ps-star">${STAR_SVG}</i>شراكة ذهبية` : 'شراكة مختارة'} · ${esc(p.code || '')}</span><h2>${esc(partnerName(p))}</h2>
        <small>${[p.classification, pSector(p), p.ptype].filter(Boolean).map(esc).join(' · ')}</small></div></div>
      <div class="ps-chips">${statusChip(p)}${s0 ? `<span class="chip plain">${fmtDate(p.startDate, 'short')}${e0 ? ' – ' + fmtDate(p.endDate, 'short') : ''}</span>` : ''}</div>
      ${goal ? `<p class="ps-goal">${esc(goal.slice(0, 220))}</p>` : ''}
      ${facts.length ? `<dl class="ps-facts">${facts.map(([v, u, l]) => `<div><dd><b>${esc(String(v))}</b>${u ? `<small>${esc(u)}</small>` : ''}</dd><dt>${l}</dt></div>`).join('')}</dl>` : ''}
      ${coop.length ? `<ul class="ps-coop">${coop.map((c) => `<li>${esc(trimP(c.t || c.x).slice(0, 110))}</li>`).join('')}</ul>` : ''}
      <div class="ps-acts"><a class="btn gold" href="#/partnerships/${p.id}" data-psclose>${icon('layers')} فتح الشراكة</a>${can('view.reports') ? `<a class="btn ghost" href="#/reports/marketing?p=${p.id}" data-psclose>${icon('star')} تقرير تسويقي</a>` : ''}</div>
    </article>`;
}
function openPShow(list, title, start = 0) {
  if (!list.length) return;
  const old = $('#pshow'); if (old) old.remove();
  let i = Math.max(0, Math.min(list.length - 1, start)), timer = null, playing = true;
  const DUR = 7000;
  const el = document.createElement('div'); el.id = 'pshow'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
  el.innerHTML = `<div class="ps-stage"></div>
    <header class="ps-top"><span class="ps-title">${icon('star')} ${esc(title)} <em>${list.length}</em></span>
      <div class="ps-ctl"><button type="button" class="ps-btn" data-psplay aria-label="إيقاف مؤقت">${icon('pause')}</button><button type="button" class="ps-btn" data-psclose aria-label="إغلاق">${icon('x')}</button></div></header>
    ${list.length > 1 ? `<button type="button" class="ps-nav prev" data-psgo="-1" aria-label="السابقة">${icon('chevR')}</button><button type="button" class="ps-nav next" data-psgo="1" aria-label="التالية">${icon('chevL')}</button>` : ''}
    <footer class="ps-foot">${list.length > 1 ? `<div class="ps-thumbs">${list.map((p, k) => `<button type="button" class="ps-th" data-psi="${k}" title="${esc(partnerName(p))}"><span>${logoOrMono(partnerById(p.partnerId) || {}, partnerName(p))}</span><i class="ps-prog"></i></button>`).join('')}</div>` : ''}</footer>`;
  document.body.appendChild(el); hydrateFiles($('.ps-foot', el) || el); // شعارات الشراكات في الشريط السفلي
  document.documentElement.classList.add('ps-lock');
  const stage = $('.ps-stage', el);
  const show = (n, dir = 1) => {
    i = (n + list.length) % list.length;
    const s = document.createElement('div'); s.className = 'ps-slide ' + (dir < 0 ? 'from-l' : 'from-r'); s.innerHTML = pshowSlide(list[i]);
    stage.appendChild(s); hydrateFiles(s);
    requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('on')));
    [...stage.children].filter((x) => x !== s).forEach((x) => { x.classList.add('out'); setTimeout(() => x.remove(), 900); });
    $$('.ps-th', el).forEach((t, k) => { t.classList.toggle('on', k === i); t.classList.toggle('done', k < i); });
    restart();
  };
  const restart = () => {
    clearTimeout(timer);
    const pr = $('.ps-th.on .ps-prog', el);
    $$('.ps-prog', el).forEach((x) => { x.style.animation = 'none'; void x.offsetWidth; x.style.animation = ''; });
    if (pr) pr.style.animationPlayState = playing ? 'running' : 'paused';
    if (playing && list.length > 1) timer = setTimeout(() => show(i + 1, 1), DUR);
  };
  const close = () => { clearTimeout(timer); el.classList.add('bye'); document.removeEventListener('keydown', key); setTimeout(() => { el.remove(); document.documentElement.classList.remove('ps-lock'); }, 400); };
  const key = (e) => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(i + 1, 1); else if (e.key === 'ArrowRight') show(i - 1, -1); else if (e.key === ' ') { e.preventDefault(); toggle(); } };
  const toggle = () => { playing = !playing; const b = $('[data-psplay]', el); b.innerHTML = icon(playing ? 'pause' : 'play'); b.setAttribute('aria-label', playing ? 'إيقاف مؤقت' : 'تشغيل'); el.classList.toggle('paused', !playing); restart(); };
  document.addEventListener('keydown', key);
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-psclose]')) return close();
    if (e.target.closest('[data-psplay]')) return toggle();
    const g = e.target.closest('[data-psgo]'); if (g) return show(i + +g.dataset.psgo, +g.dataset.psgo);
    const t = e.target.closest('[data-psi]'); if (t) return show(+t.dataset.psi, +t.dataset.psi >= i ? 1 : -1);
  });
  requestAnimationFrame(() => el.classList.add('in'));
  show(i);
}
/* زر «استعراض» في رؤوس الأقسام */
function pshowBtn(kind) { return `<button type="button" class="ps-open" data-pshow="${kind}">${icon('play')}<span>استعراض</span></button>`; }
function pshowList(kind) {
  if (kind === 'golden') return goldenList();
  return (featuredList().length ? featuredList() : publicPartnerships().filter((p) => ['active', 'soon'].includes(pStatus(p)))).slice(0, 12);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pshow]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  openPShow(pshowList(b.dataset.pshow), b.dataset.pshow === 'golden' ? 'الشراكات الذهبية' : 'شراكات مختارة');
});
