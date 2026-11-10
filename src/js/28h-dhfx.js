/* =====================================================================
   رأس صفحة الشراكة بلا صورة: خلفية من درجات الثيم مع حركة هادئة —
   خطوط كنتورية تنساب، وتيارات ذهبية تسري عليها جسيمات ضوء، وتوهّج يتبع المؤشر.
   النهاري: أخضر المؤسسة؛ الليلي: درجات الثيم الداكنة مع الذهبي.
   ===================================================================== */
function dhFxMount(el) {
  const head = el.querySelector('.dhead'); if (!head) return;
  const cover = head.querySelector('.cover'); if (!cover || cover.querySelector('img.photo')) return; // للصور غلافها
  head.classList.add('dh-live');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'); cv.className = 'dh-fx'; cv.setAttribute('aria-hidden', 'true');
  cover.appendChild(cv);
  const ctx = cv.getContext('2d'); if (!ctx) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  let W = 0, H = 0, mx = -1, my = -1, tmx = -1, tmy = -1, vis = true, raf = 0;
  const size = () => { const r = cover.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  const ro = new ResizeObserver(size); ro.observe(cover);
  const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame); }); io.observe(cover);
  head.addEventListener('mousemove', (e) => { const r = cover.getBoundingClientRect(); tmx = e.clientX - r.left; tmy = e.clientY - r.top; });
  head.addEventListener('mouseleave', () => { tmx = -1; });
  const seed = [...(location.hash || 'x')].reduce((t, c) => t + c.charCodeAt(0), 0);
  const rnd = (k) => { const x = Math.sin(seed * 9.13 + k * 12.7) * 43758.5453; return x - Math.floor(x); };
  /* تيارات: منحنيات جيبية بطيئة تعبر الرأس */
  const S = Array.from({ length: 6 }, (_, k) => ({ y: 0.18 + k * 0.13 + rnd(k) * 0.05, a: 0.05 + rnd(k + 9) * 0.06, f: 1.2 + rnd(k + 3) * 1.6, ph: rnd(k + 5) * 6.28, sp: 0.05 + rnd(k + 7) * 0.08 }));
  const P = Array.from({ length: 34 }, (_, k) => ({ s: k % S.length, x: rnd(k + 20), v: 0.012 + rnd(k + 40) * 0.03, r: 1 + rnd(k + 60) * 1.8, tw: rnd(k + 80) * 6.28 }));
  const yAt = (s, x, t) => (s.y + Math.sin(x * Math.PI * s.f + s.ph + t * s.sp) * s.a) * H;
  const dark = () => document.documentElement.dataset.theme === 'dark';
  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (!cv.isConnected) { ro.disconnect(); io.disconnect(); return; }
    if (!vis) return;
    const t = (now - t0) / 1000, dk = dark();
    const gold = dk ? '212,176,106' : '230,199,134', mint = dk ? '156,199,178' : '168,214,190';
    ctx.clearRect(0, 0, W, H);
    /* التيارات */
    S.forEach((s, k) => {
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const x = i / 60; const y = yAt(s, x, t); i ? ctx.lineTo(x * W, y) : ctx.moveTo(x * W, y); }
      ctx.strokeStyle = `rgba(${k % 2 ? mint : gold},${k % 2 ? 0.10 : 0.16})`; ctx.lineWidth = k % 2 ? 1 : 1.3; ctx.stroke();
    });
    /* جسيمات الضوء */
    ctx.globalCompositeOperation = 'lighter';
    P.forEach((p) => {
      p.x += p.v / 60; if (p.x > 1.05) p.x = -0.05;
      const s = S[p.s], x = p.x * W, y = yAt(s, p.x, t), tw = 0.55 + Math.sin(t * 2.2 + p.tw) * 0.45, R = p.r * 5;
      const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(${gold},${0.85 * tw})`); g.addColorStop(0.4, `rgba(${gold},${0.22 * tw})`); g.addColorStop(1, `rgba(${gold},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    });
    /* توهّج يتبع المؤشر */
    if (tmx >= 0) { mx = mx < 0 ? tmx : mx + (tmx - mx) * 0.08; my = my < 0 ? tmy : my + (tmy - my) * 0.08; const g = ctx.createRadialGradient(mx, my, 0, mx, my, 220); g.addColorStop(0, `rgba(${gold},.10)`); g.addColorStop(1, `rgba(${gold},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}
const _dhfxRender = renderPartnership;
renderPartnership = function (el, r) { _dhfxRender(el, r); try { dhFxMount(el); } catch (e) { console.warn(e); } };
