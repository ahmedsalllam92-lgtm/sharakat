/* =====================================================================
   العرض المرئي — طبقة المؤثرات الحية
   لوحة رسم خلف محتوى كل شريحة تتحرك طوال ظهورها، بمؤثر يناسب موضوعها:
   حبوب لقاح ذهبية تصعد في الغلاف، ومذنّبات ضوء تنطلق من المؤسسة إلى كل شريك،
   ونقطة مضيئة تجري على منحنى النمو، وشرارات عند الأرقام والتشابك في الختام…
   وفي العرض بملء الشاشة: مقدمة سينمائية، وانتقالات بضوء ذهبي، وميلان خفيف مع حركة الفأرة.
   تتوقف حين تغيب الشريحة، ولا تظهر في الطباعة، وتثبت لمن فعّل تقليل الحركة.
   ===================================================================== */
const MKFX_STILL = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const MKFX_DARK = ['film', 'night', 'deep', 'dawn'];
const mkRand = (a, b) => a + Math.random() * (b - a);

/* مواضع عناصر الشريحة بإحداثيات الشريحة المنطقية (1280×720) مهما كان تصغيرها */
function mkFxPos(sl, el) {
  const s = sl.getBoundingClientRect(), r = el.getBoundingClientRect(), k = s.width / 1280 || 1;
  return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k, w: r.width / k, h: r.height / k };
}
function mkFxVisible(sl) {
  if (!sl.isConnected) return false;
  const sh = sl.closest('.rshow-slide'); if (sh) return sh.classList.contains('on');
  const r = sl.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0;
}

function mkFxStart(sl) {
  if (!sl || !sl.classList.contains('mk')) return;
  const k = sl.dataset.mk || '', tone = MKFX_DARK.find((t) => sl.classList.contains('mk-' + t)) || 'paper';
  let cv = sl.querySelector(':scope > .mk-fx');
  if (!cv) { cv = document.createElement('canvas'); cv.className = 'mk-fx'; cv.setAttribute('aria-hidden', 'true'); sl.insertBefore(cv, sl.firstChild); }
  const dpr = Math.min(2, devicePixelRatio || 1); cv.width = 1280 * dpr; cv.height = 720 * dpr;
  const cx = cv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const tk = (sl._fxTk = (sl._fxTk || 0) + 1), t0 = performance.now(), dark = tone !== 'paper';
  const gold = (a) => `rgba(240,212,150,${a})`, mint = (a) => `rgba(170,222,200,${a})`, ink = (a) => `rgba(164,124,50,${a})`;
  const P = [], sparks = [], comets = [];
  const dust = (n, o = {}) => { for (let i = 0; i < n; i++) P.push({ x: mkRand(0, 1280), y: mkRand(0, 720), r: mkRand(o.r0 || 0.6, o.r1 || 2.2), vx: mkRand(-0.15, 0.15), vy: o.up ? -mkRand(0.15, 0.6) : mkRand(-0.12, 0.12), ph: mkRand(0, 6.28), g: Math.random() < (o.gold == null ? 0.5 : o.gold) }); };
  const burst = (x, y, n = 26, sp = 3.2) => { for (let i = 0; i < n; i++) { const a = mkRand(0, 6.28), v = mkRand(0.6, sp); sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, r: mkRand(1, 2.6) }); } };
  const bokeh = []; const addBokeh = (n) => { for (let i = 0; i < n; i++) bokeh.push({ x: mkRand(0, 1280), y: mkRand(0, 720), r: mkRand(40, 130), vx: mkRand(-0.12, 0.12), vy: mkRand(-0.08, 0.08), g: Math.random() < 0.45, a: mkRand(0.035, 0.08) }); };
  /* إعداد كل نوع */
  const timers = [];
  const later = (ms, fn) => timers.push({ at: ms, fn, done: false });
  let nodes = [], core = null, path = null, pathLen = 0, rays = 0, stops = [], rv = { k: -1, f: 0, t: 0, on: null };
  if (['seed', 'pcover', 'film'].includes(k) || tone === 'film') { dust(70, { up: true, gold: 0.75, r1: 2.6 }); rays = 3; }
  else if (k === 'three' || k === 'mult') { addBokeh(9); dust(30, { gold: 0.7 }); later(2000, () => sl.querySelectorAll('.mx-giants > *, .mx-eq b').forEach((e, i) => setTimeout(() => { if (sl._fxTk === tk) { const p = mkFxPos(sl, e); burst(p.x, p.y - 20, 30, 3.6); } }, i * 220))); }
  else if (k === 'orbit') {
    dust(40, { gold: 0.4 });
    later(300, () => { const c = sl.querySelector('.mx-core'); core = c ? mkFxPos(sl, c) : { x: 640, y: 400 }; nodes = [...sl.querySelectorAll('.mx-node')].map((n) => mkFxPos(sl, n)); });
  } else if (k === 'river' || k === 'ptime') {
    dust(26, { gold: 0.8, r1: 1.6 });
    later(200, () => {
      path = sl.querySelector('.mx-riv .flow, svg path.flow'); try { pathLen = path ? path.getTotalLength() : 0; } catch (_) { pathLen = 0; }
      if (path && pathLen) {
        const samp = Array.from({ length: 401 }, (_, q) => { const pt = path.getPointAtLength(q / 400 * pathLen); return [q / 400, pt.x, pt.y]; });
        stops = [...sl.querySelectorAll('.mx-riv circle.dt')].map((c, ci) => { const x = +c.getAttribute('cx'), y = +c.getAttribute('cy'); let best = samp[0], bd = 1e9; samp.forEach((s_) => { const d = (s_[1] - x) ** 2 + (s_[2] - y) ** 2; if (d < bd) { bd = d; best = s_; } }); return { f: best[0], x, y, card: sl.querySelector(`.mx-rcard[data-i="${ci}"]`) }; }).sort((a, b) => a.f - b.f);
      }
    });
  } else if (k === 'bond') {
    dust(50, { gold: 0.8, up: true }); rays = 2;
    later(1700, () => { const pts = [...sl.querySelectorAll('.mx-bond .knot, circle.knot')]; if (pts.length) pts.forEach((e) => { const p = mkFxPos(sl, e); burst(p.x, p.y, 40, 4); }); else { burst(640, 270, 40, 4); burst(640, 470, 40, 4); } });
  } else if (k === 'horizon') { dust(36, { up: true, gold: 0.9 }); rays = 6; }
  else if (k === 'cards' || k === 'ppartner' || k === 'pteam') { addBokeh(7); dust(30, { gold: 0.5 }); }
  else if (['field', 'pgal', 'pdocs'].includes(k)) dust(45, { gold: 0.85, r1: 1.8 });
  else if (dark) { dust(48, { gold: 0.35 }); nodes = 'net'; }
  else dust(26, { gold: 1, r1: 1.6 });
  const still = MKFX_STILL();
  const frame = (now) => {
    if (sl._fxTk !== tk || !sl.isConnected) return;
    if (!mkFxVisible(sl)) { requestAnimationFrame(frame); return; }
    const t = (now - t0) / 1000;
    timers.forEach((x) => { if (!x.done && t * 1000 >= x.at) { x.done = true; x.fn(); } });
    cx.clearRect(0, 0, 1280, 720);
    /* أشعة ضوء بطيئة */
    if (rays) { cx.save(); cx.translate(k === 'horizon' ? 640 : 1100, k === 'horizon' ? 520 : -60); cx.rotate(t * 0.04); for (let i = 0; i < rays; i++) { cx.rotate((Math.PI * 2) / rays); const g = cx.createLinearGradient(0, 0, 900, 0); g.addColorStop(0, gold(dark ? 0.1 : 0.06)); g.addColorStop(1, gold(0)); cx.fillStyle = g; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(1000, -55); cx.lineTo(1000, 55); cx.closePath(); cx.fill(); } cx.restore(); }
    /* هالات ضبابية */
    for (const b of bokeh) { if (!still) { b.x += b.vx; b.y += b.vy; if (b.x < -150) b.x = 1430; if (b.x > 1430) b.x = -150; if (b.y < -150) b.y = 870; if (b.y > 870) b.y = -150; } const g = cx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); const c = b.g ? '240,212,150' : '150,210,185'; g.addColorStop(0, `rgba(${c},${b.a})`); g.addColorStop(1, `rgba(${c},0)`); cx.fillStyle = g; cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 6.283); cx.fill(); }
    /* شبكة خفيفة */
    if (nodes === 'net') { cx.lineWidth = 1; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], c = P[j], d = Math.hypot(a.x - c.x, a.y - c.y); if (d < 150) { cx.strokeStyle = mint(0.14 * (1 - d / 150)); cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(c.x, c.y); cx.stroke(); } } }
    /* الكوكبة: مذنّبات من المؤسسة إلى الشركاء، ونبض من المركز */
    if (core && Array.isArray(nodes) && nodes.length) {
      for (let i = 0; i < 3; i++) { const ph = ((t * 0.45 + i / 3) % 1), r = 60 + ph * 260; cx.strokeStyle = gold(0.22 * (1 - ph)); cx.lineWidth = 1.5; cx.beginPath(); cx.ellipse(core.x, core.y, r * 1.25, r * 0.62, 0, 0, 6.283); cx.stroke(); }
      if (!still && Math.random() < 0.07 && comets.length < 8) { const n = nodes[Math.floor(Math.random() * nodes.length)]; comets.push({ n, s: 0, back: Math.random() < 0.35 }); }
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i]; c.s += 0.014; if (c.s >= 1) { const p = c.back ? core : c.n; burst(p.x, p.y, 10, 1.6); comets.splice(i, 1); continue; }
        const a = c.back ? c.n : core, b = c.back ? core : c.n, e = c.s * c.s * (3 - 2 * c.s);
        const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e, tx = a.x + (b.x - a.x) * Math.max(0, e - 0.12), ty = a.y + (b.y - a.y) * Math.max(0, e - 0.12);
        const g = cx.createLinearGradient(tx, ty, x, y); g.addColorStop(0, gold(0)); g.addColorStop(1, gold(0.9)); cx.strokeStyle = g; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(tx, ty); cx.lineTo(x, y); cx.stroke();
        const h = cx.createRadialGradient(x, y, 0, x, y, 10); h.addColorStop(0, 'rgba(255,240,205,.95)'); h.addColorStop(1, 'rgba(255,240,205,0)'); cx.fillStyle = h; cx.beginPath(); cx.arc(x, y, 10, 0, 6.283); cx.fill();
      }
    }
    /* نقطة تجري على منحنى النمو */
    if (path && pathLen && t > 2.6) {
      /* تتنقل النقطة بين الشراكات بالترتيب الزمني: تتوقف عند كل شراكة وتظهر بطاقتها، ثم تكمل */
      let f;
      if (stops.length) {
        const TRAVEL = 0.45, DWELL = 1.5, cyc = stops.length * (TRAVEL + DWELL) + 2, tt = (t - 2.6) % cyc, seg = Math.floor(tt / (TRAVEL + DWELL)), inSeg = tt - seg * (TRAVEL + DWELL);
        if (seg >= stops.length) { f = stops[stops.length - 1].f; if (rv.on) { rv.on.classList.remove('on'); rv.on = null; } }
        else {
          const from = seg ? stops[seg - 1].f : 0, to = stops[seg].f, k_ = Math.min(1, inSeg / TRAVEL), e = k_ * k_ * (3 - 2 * k_);
          f = from + (to - from) * e;
          const card = stops[seg].card;
          if (k_ >= 1 && card && rv.on !== card) {
            if (rv.on) rv.on.classList.remove('on');
            const st = stops[seg], above = st.y > 300;
            card.style.left = Math.max(30, Math.min(1280 - 330, st.x - 150)) + 'px'; card.style.top = (above ? st.y - 118 : st.y + 26) + 'px';
            card.classList.toggle('below', !above); card.classList.add('on'); rv.on = card; burst(st.x, st.y, 14, 1.8);
          } else if (k_ < 1 && rv.on) { rv.on.classList.remove('on'); rv.on = null; }
        }
      } else f = ((t - 2.6) * 0.09) % 1; for (let q = 0; q < 14; q++) { const ff = Math.max(0, f - q * 0.006); const pt = path.getPointAtLength(ff * pathLen); cx.fillStyle = q ? ink(0.32 * (1 - q / 14)) : 'rgba(217,180,103,1)'; cx.beginPath(); cx.arc(pt.x, pt.y, q ? 5 - q * 0.3 : 7, 0, 6.283); cx.fill(); }
      const pt = path.getPointAtLength(f * pathLen), h = cx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 26); h.addColorStop(0, 'rgba(217,180,103,.45)'); h.addColorStop(1, 'rgba(217,180,103,0)'); cx.fillStyle = h; cx.beginPath(); cx.arc(pt.x, pt.y, 26, 0, 6.283); cx.fill();
    }
    /* الجزيئات */
    for (const p of P) {
      if (!still) { p.x += p.vx; p.y += p.vy; if (p.y < -10) { p.y = 730; p.x = mkRand(0, 1280); } if (p.y > 730) p.y = -10; if (p.x < -10) p.x = 1290; if (p.x > 1290) p.x = -10; }
      const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + p.ph);
      cx.fillStyle = dark ? (p.g ? gold(0.35 + 0.5 * tw) : mint(0.25 + 0.35 * tw)) : ink(0.12 + 0.22 * tw);
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
    }
    /* الشرارات */
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.03; s.vx *= 0.985; s.life -= 0.016; if (s.life <= 0) { sparks.splice(i, 1); continue; } cx.fillStyle = `rgba(255,232,180,${s.life})`; cx.beginPath(); cx.arc(s.x, s.y, s.r * s.life + 0.4, 0, 6.283); cx.fill(); }
    if (!still) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* — المقدمة السينمائية في العرض بملء الشاشة: نقاط بعدد الجهات الشريكة تتجمع حول المؤسسة ثم يظهر العنوان — */
function mkPrelude(host, { title, sub, count }, done) {
  const wrap = document.createElement('div'); wrap.className = 'mk-pre';
  const logo = (ASSET_IMG['murooj-logo-white'] || {}).src;
  wrap.innerHTML = `<canvas></canvas><div class="mk-pre-c">${logo ? `<img src="${logo}" alt="">` : ''}<span class="mk-pre-k">${esc(D.settings.org.name)} تقدّم</span><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div><button type="button" class="mk-pre-skip">تخطّي ${icon('chevL')}</button>`;
  host.appendChild(wrap);
  const cv = wrap.querySelector('canvas'), cx = cv.getContext('2d');
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.max(12, Math.min(90, count || 40)), C = { x: W / 2, y: H / 2 - 40 }, R = Math.min(W, H) * 0.3;
  const pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return { x: mkRand(0, W), y: mkRand(0, H), tx: C.x + Math.cos(a) * R * mkRand(0.85, 1.15), ty: C.y + Math.sin(a) * R * 0.62 * mkRand(0.85, 1.15), a, d: mkRand(0, 0.6) }; });
  const t0 = performance.now(); let end = false;
  const finish = () => { if (end) return; end = true; wrap.classList.add('out'); setTimeout(() => { wrap.remove(); done && done(); }, 900); };
  wrap.querySelector('.mk-pre-skip').onclick = (e) => { e.stopPropagation(); finish(); };
  const frame = (now) => {
    if (end || !wrap.isConnected) return;
    const t = (now - t0) / 1000;
    cx.clearRect(0, 0, W, H);
    const rot = t * 0.12;
    pts.forEach((p) => { const k = Math.min(1, Math.max(0, (t - p.d) / 2.2)), e = 1 - Math.pow(1 - k, 3); const ang = p.a + rot * e; const tx = C.x + Math.cos(ang) * R * (Math.hypot(p.tx - C.x, (p.ty - C.y) / 0.62) / R), ty = C.y + Math.sin(ang) * R * 0.62 * (Math.hypot(p.tx - C.x, (p.ty - C.y) / 0.62) / R); p.cx = p.x + (tx - p.x) * e; p.cy = p.y + (ty - p.y) * e; });
    const link = Math.min(1, Math.max(0, (t - 1.8) / 1));
    if (link > 0) { cx.lineWidth = 1; pts.forEach((p) => { cx.strokeStyle = `rgba(240,212,150,${0.18 * link})`; cx.beginPath(); cx.moveTo(C.x, C.y); cx.lineTo(p.cx, p.cy); cx.stroke(); }); for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; cx.strokeStyle = `rgba(170,222,200,${0.3 * link})`; cx.beginPath(); cx.moveTo(a.cx, a.cy); cx.lineTo(b.cx, b.cy); cx.stroke(); } }
    pts.forEach((p, i) => { const tw = 0.6 + 0.4 * Math.sin(t * 2 + i); cx.fillStyle = i % 5 === 0 ? `rgba(240,212,150,${tw})` : `rgba(200,235,220,${0.8 * tw})`; cx.beginPath(); cx.arc(p.cx, p.cy, i % 5 === 0 ? 3.2 : 2.2, 0, 6.283); cx.fill(); });
    const g = cx.createRadialGradient(C.x, C.y, 0, C.x, C.y, R * 0.9); g.addColorStop(0, `rgba(240,212,150,${0.16 * link})`); g.addColorStop(1, 'rgba(240,212,150,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(C.x, C.y, R * 0.9, 0, 6.283); cx.fill();
    if (t > 6.2) finish(); else requestAnimationFrame(frame);
  };
  if (MKFX_STILL()) setTimeout(finish, 1200); else requestAnimationFrame(frame);
  return finish;
}

/* — تنزيل التقرير فيديو: يُبنى من بيانات المنصة لحظة التسجيل، فيتحدث تلقائيًا مع أي تعديل.
   يطلب المتصفح إذن تسجيل هذا التبويب، ثم يُعرض التقرير تلقائيًا بمقدمته وحركته ويُنزَّل الملف عند انتهائه. — */
async function mkVideo(nodes) {
  if (!nodes || !nodes.length) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || typeof MediaRecorder === 'undefined') return toast('تسجيل الفيديو يحتاج متصفح Chrome أو Edge على الكمبيوتر.', 'err');
  const per = 7, secs = Math.round(6 + nodes.length * per);
  const ok = await confirmDlg(`سيُعرض التقرير تلقائيًا بملء الشاشة ويُسجَّل فيديو (حوالي ${Math.ceil(secs / 60)} دقيقة)، ثم يُنزَّل الملف.<br><br>عند ظهور نافذة المتصفح اختر <b>«هذا التبويب»</b> ثم «مشاركة». لا تغيّر التبويب أثناء التسجيل.`, { title: 'تنزيل التقرير فيديو', ok: 'بدء التسجيل' });
  if (!ok) return;
  let stream;
  try { stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30, displaySurface: 'browser', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include', surfaceSwitching: 'exclude' }); }
  catch (e) { return toast('لم يُسمح بالتسجيل.', 'err'); }
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8e6 } : {});
  const chunks = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  let stopped = false;
  const stop = () => { if (stopped) return; stopped = true; try { rec.state !== 'inactive' && rec.stop(); } catch (_) { /* */ } stream.getTracks().forEach((t) => t.stop()); };
  rec.onstop = () => {
    const ext = /mp4/.test(rec.mimeType || mime) ? 'mp4' : 'webm';
    const one = typeof mkOne === 'function' && mkOne();
    download(`العرض-المرئي-${one ? partnerName(one).replace(/\s+/g, '-') + '-' : ''}${isoDate(today())}.${ext}`, new Blob(chunks, { type: rec.mimeType || 'video/webm' }));
    toast('نُزّل فيديو التقرير');
    const ov = document.getElementById('rptShow'); if (ov) ov.querySelector('[data-a="exit"]') && ov.querySelector('[data-a="exit"]').click();
  };
  stream.getVideoTracks()[0].addEventListener('ended', stop);
  await new Promise((r) => setTimeout(r, 400));
  rec.start(1000);
  window.__rshowAuto = { per: per * 1000, onEnd: () => setTimeout(stop, 800) };
  openReportShow(0, nodes);
}
