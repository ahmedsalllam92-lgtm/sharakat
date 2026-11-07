/* ===== ظهور المحتوى أثناء التمرير: لكل نوع محتوى حركته الخاصة ===== */
const RV_SETS = [
  // الصور: ستارة تنكشف من اليمين مع اقتراب خفيف
  ['wipe', '.spot-media img.photo, .story-fig img.photo, .mosaic img.photo, .gallery img.photo, .pcard img.photo, .st-card img.photo, .st-feature-media img.photo, .st-gal img.photo, .cm-mod img.photo, .ach-card img.photo, .news-item img.photo, .cover img.photo'],
  // العناوين: انزلاق من جهة القراءة
  ['head', '.hsec-h, .st-ch-h, .cm-mh, .ph h1'],
  // البطاقات والعناصر: صعود متتابع مع وضوح تدريجي
  ['rise', '.pcard, .story-item, .news-item, .spot-body, .share-band .share-in, .st-card, .st-news-item, .cm-row, .ach-card, .st-quote'],
  // الشعارات والأرقام: ظهور بتكبير
  ['pop', '.logo-cell, .kband .kpi, .st-stat, .cm-tile'],
];
function revealify(root) {
  if (!root || cuReduce() || !('IntersectionObserver' in window)) return;
  const seen = new Set();
  const items = [];
  RV_SETS.forEach(([type, sel]) => {
    $$(sel, root).forEach((el) => {
      if (seen.has(el) || el.closest('.hero, .st-hero, .cm-banner, [data-rv]') || el.closest('.st-reveal:not(.in)') && type !== 'wipe') return;
      seen.add(el); items.push([el, type]);
    });
  });
  const groups = new Map();
  items.forEach(([el, type]) => {
    const k = el.parentElement; const i = groups.get(k) || 0; groups.set(k, i + 1);
    el.dataset.rv = type; el.style.setProperty('--rvd', `${Math.min(i, 6) * 80}ms`);
    if (type === 'pop') { const v = el.querySelector('.v, b'); const n = v && /^\d[\d,]*$/.test(v.textContent.trim()) ? +v.textContent.replace(/,/g, '') : null; if (n !== null && !v.classList.contains('cu')) { v.dataset.rvn = n; v.textContent = '0'; v.style.minWidth = `${String(n).length * 0.62}em`; v.style.display = 'inline-block'; } }
  });
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target; io.unobserve(el); el.classList.add('rv-in');
    const v = el.querySelector('[data-rvn]');
    if (v) { const to = +v.dataset.rvn, t0 = performance.now() + parseFloat(getComputedStyle(el).getPropertyValue('--rvd') || 0), dur = 1100; const tick = (t) => { const f = Math.max(0, Math.min(1, (t - t0) / dur)); v.textContent = nf(Math.round(to * (1 - Math.pow(1 - f, 3)))); if (f < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  // احتياط: ما ظهر في الشاشة أو تجاوزه المستخدم ينكشف فورًا مهما كان أسلوب التمرير
  let pend = false;
  const sweep = () => {
    pend = false;
    if (!root.isConnected) { removeEventListener('scroll', onSc); return; }
    const lim = innerHeight * 0.92;
    items.forEach(([el, type]) => { if (el.classList.contains('rv-in')) return; const t = type === 'wipe' ? (el.closest('section, .hsec, .st-sec, .cm-mod, .spot') || el) : el; if (t.getBoundingClientRect().top < lim) { el.classList.add('rv-in'); const v = el.querySelector('[data-rvn]'); if (v && v.textContent === '0') v.textContent = nf(+v.dataset.rvn); } });
  };
  const onSc = () => { if (!pend) { pend = true; requestAnimationFrame(sweep); } };
  addEventListener('scroll', onSc, { passive: true });
  // الصور تنكشف عند ظهور قسمها (بعضها داخل شرائح عرض غير ظاهرة أفقيًا)
  const trig = new Map();
  items.forEach(([el, type]) => {
    if (type !== 'wipe') return io.observe(el);
    const t = el.closest('section, .hsec, .st-sec, .cm-mod, .spot') || el;
    if (!trig.has(t)) trig.set(t, []);
    trig.get(t).push(el);
  });
  if (trig.size) {
    const io2 = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { io2.unobserve(en.target); (trig.get(en.target) || []).forEach((el) => el.classList.add('rv-in')); } }), { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    trig.forEach((_, t) => io2.observe(t));
  }
}
window.addEventListener('beforeprint', () => $$('[data-rvn]').forEach((v) => { v.textContent = nf(+v.dataset.rvn); }));

/* ===== الصورة الرئيسية: نبضات ضوء على الخطوط الكنتورية وشبكة تربط الأرقام ===== */
function heroExtras(box, positions) {
  if (!box || box._fx2 || cuReduce()) return; box._fx2 = true;
  const aur = document.createElement('div'); aur.className = 'hfx-aurora'; box.prepend(aur);
  // نبضات تسير على أطول الخطوط
  const svg = box.querySelector('.hfx-svg');
  if (svg) {
    const paths = [...svg.querySelectorAll('path.topo-path')].map((p) => ({ p, L: p.getTotalLength ? p.getTotalLength() : 0 })).sort((a, b) => b.L - a.L).slice(0, 4);
    paths.forEach(({ p, L }, i) => {
      if (!L) return;
      const c = p.cloneNode(); c.setAttribute('class', `hfx-comet ${i % 2 ? 'g' : 'm'}`); c.removeAttribute('style');
      c.style.setProperty('--L', L.toFixed(0)); c.style.setProperty('--t', `${9 + i * 2.5}s`); c.style.setProperty('--dl', `${1.6 + i * 1.7}s`);
      svg.appendChild(c);
    });
  }
  // شبكة بين نقاط الأرقام الحية
  if (positions && positions.length > 1) {
    const pts = positions.map(([x, y]) => [x, y]);
    const seg = [];
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) seg.push([pts[i], pts[j]]);
    const net = document.createElement('div'); net.className = 'hfx-net';
    net.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${seg.map(([a, b], k) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 8 - (k % 3) * 4; return `<path d="M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}" style="--k:${k}" vector-effect="non-scaling-stroke"/>`; }).join('')}</svg>`;
    const bc = box.querySelector('.hfx-beacons'); box.insertBefore(net, bc);
  }
}
