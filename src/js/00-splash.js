/* =====================================================================
   الشاشة الافتتاحية: تظهر عند كل فتح أو إعادة تحميل.
   صورة كبيرة بحركة بطيئة، ونجمة هندسية تُرسم، وحلقات نمو تتسع من المركز،
   وجملة تُعدَّل من الإعدادات، وأرقام حية من آخر جلسة تُحدَّث فور تحميل البيانات.
   ملف مستقل لا يعتمد على بقية الشيفرة لأنه يعمل قبل تحميل البيانات.
   ===================================================================== */
const SPLASH_DEF = { on: true, text: 'نبني شراكات… تصنع أثرًا يبقى', sub: 'منظومة الشراكات — مؤسسة مروج الأهلية', bg: 'calm', stats: true, dur: 4.2 };
const SPLASH_BGS = [['calm', 'هادئ — لون المؤسسة بإضاءة خفيفة، بلا صور أو رسومات'], ['splash-bond', 'فجر الشراكة — لوحة فنية (نهران من الضوء يلتقيان)'], ['signings', 'لحظات توقيع الشراكات (صور متتابعة)'], ['splash-aerial', 'صورة جوية للغطاء النباتي'], ['splash-forest', 'غابة ومسطحات خضراء'], ['border-guard-signing', 'صورة توقيع مذكرة'], ['waqf-saitah-signing', 'صورة توقيع شراكة']];
function splashCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem('shk_splash') || '{}') || {}; } catch (e) { c = {}; } if (!c.bgV4) c.bg = 'calm'; if (+c.dur === 3.4) c.dur = 4.2; /* المدة الافتراضية القديمة: وقت كافٍ لحركة تلاقي الشركاء */ return { ...SPLASH_DEF, ...c }; }
function splashShow(force) {
  if (window.__SBX) return null;
  const cfg = splashCfg();
  let auto = false; try { auto = navigator.webdriver && !localStorage.getItem('shk_splash_force'); } catch (e) { auto = !!navigator.webdriver; }
  if (!force && (!cfg.on || auto)) return null;
  const old = document.getElementById('shkSplash'); if (old) old.remove();
  const esc_ = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const img = (k) => ((typeof ASSET_IMG !== 'undefined' && ASSET_IMG[k]) || {}).src || '';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = Math.max(1.5, Math.min(8, +cfg.dur || 3)) * (reduce ? 0.6 : 1);
  const el = document.createElement('div'); el.id = 'shkSplash'; el.setAttribute('role', 'presentation');
  if (document.documentElement.dataset.theme === 'dark') el.classList.add('dk');
  if (reduce) el.classList.add('rm');
  el.style.setProperty('--dur', dur + 's');
  const words = String(cfg.text || SPLASH_DEF.text).split(/\s+/).filter(Boolean);
  const S = cfg.statsVals;
  const stats = []; // الأرقام لا تُعرض من ذاكرة الجهاز (قد تكون قديمة)؛ تظهر حين تُحمَّل بيانات المنصة الفعلية (splashSync)
  /* «لحظات التوقيع»: صور توقيع الشراكات الحقيقية تتعاقب ببطء، وفوقها حلقتان ذهبيتان تقتربان حتى تتشابكا (رمز الشراكة) */
  const SIGN = ['waqf-saitah-signing', 'border-guard-signing'].map(img).filter(Boolean);
  const calm = cfg.bg === 'calm';
  if (calm) el.classList.add('sp-min');
  const bgs = calm ? [] : cfg.bg === 'signings' && SIGN.length ? SIGN : [img(cfg.bg) || img('splash-aerial')];
  el.innerHTML = `${bgs.map((u, i) => `<div class="sp-bg ${bgs.length > 1 ? 'xf' : ''}" style="background-image:url('${u}');--k:${i};--n:${bgs.length}"></div>`).join('')}<div class="sp-veil ${bgs.length > 1 ? 'warm' : ''} ${cfg.bg === 'splash-bond' ? 'art' : ''}"></div>
    ${calm ? '<div class="calm-deco" aria-hidden="true"><i class="cd-a"></i><i class="cd-b"></i><i class="cd-c"></i><span class="cd-lines"></span></div><div class="sp-glow" aria-hidden="true"></div>' : ''}<svg class="sp-geo" ${calm ? 'hidden' : ''} viewBox="-300 -300 600 600" aria-hidden="true">
      ${[110, 165, 220, 275].map((r, i) => `<circle r="${r}" class="ring" style="--i:${i}"/>`).join('')}
      <g class="bond"><circle class="b1" r="118"/><circle class="b2" r="118"/><circle class="knot" cy="-100" r="6"/><circle class="knot" cy="100" r="6"/></g>
      ${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle class="dot" r="3" cx="${(Math.cos(a) * 220).toFixed(1)}" cy="${(Math.sin(a) * 220).toFixed(1)}" style="--i:${i}"/>`; }).join('')}
    </svg>
    <div class="sp-in">
      ${img('murooj-logo-white') ? `<img class="sp-logo" src="${img('murooj-logo-white')}" alt="مؤسسة مروج الأهلية">` : ''}
      <span class="sp-rule"></span>
      <h1>${words.map((w, i) => `<span style="animation-delay:${(0.45 + i * 0.12).toFixed(2)}s">${esc_(w)}</span>`).join(' ')}</h1>
      ${cfg.sub ? `<p>${esc_(cfg.sub)}</p>` : ''}
      <div class="sp-stats">${stats.map(([v, l], i) => `<span style="animation-delay:${(1.1 + i * 0.12).toFixed(2)}s"><b data-to="${+v || 0}">0</b>${esc_(l)}</span>`).join('')}</div>
    </div>
    ${calm ? '<span class="sp-sheen" aria-hidden="true"></span>' : ''}
    <div class="sp-bar"><i></i></div><small class="sp-skip">اضغط للمتابعة</small>`;
  const put = () => {
    document.documentElement.classList.add('sp-lock'); // لا شريط تمرير ولا تمرير خلف الشاشة الافتتاحية
    document.body.appendChild(el);
    const count = () => el.querySelectorAll('.sp-stats b').forEach((b) => { const to = +b.dataset.to || 0, t0 = performance.now(), d = reduce ? 1 : 900; const step = (t) => { const k = Math.min(1, (t - t0) / d); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; setTimeout(() => requestAnimationFrame(step), reduce ? 0 : 1100); });
    count(); el._count = count;
    if (calm && !reduce) { try { spFx(el, (cfg.statsVals || {}).partners, dur); } catch (e) { /* زخرفة غير حرجة */ } }
    el._t = setTimeout(close, dur * 1000);
  };
  const close = () => { if (el.classList.contains('out')) return; clearTimeout(el._t); el.classList.add('out'); setTimeout(() => { el.remove(); if (!document.getElementById('shkSplash')) document.documentElement.classList.remove('sp-lock'); }, 700); document.removeEventListener('keydown', key); };
  const key = () => close();
  el.addEventListener('click', close);
  document.addEventListener('keydown', key);
  if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
  return el;
}
/* «تلاقي الشركاء»: نقاط ذهبية بعدد الجهات تنطلق من أطراف الشاشة في مسارات منحنية،
   وتلتقي في هالة حول الشعار تدور ببطء وتتصل خيوطها، ثم نبضة ذهبية ولمعة تعبر الشعار والجملة */
function spFx(host, n, dur) {
  const cv = document.createElement('canvas'); cv.className = 'sp-fx'; cv.setAttribute('aria-hidden', 'true');
  host.insertBefore(cv, host.querySelector('.sp-in'));
  const ctx = cv.getContext('2d'); if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0, cx = 0, cy = 0, rx = 0, ry = 0;
  const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cx = W / 2; cy = H * 0.5; rx = Math.min(W * 0.4, 600); ry = Math.min(H * 0.38, 320); };
  size(); addEventListener('resize', size);
  const N = Math.max(24, Math.min(90, n || 48)), T_FLY = Math.min(1.5, dur * 0.42);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const P = Array.from({ length: N }, (_, i) => {
    const side = i % 4, e = Math.random();
    const s = side === 0 ? [e, -0.05] : side === 1 ? [1.05, e] : side === 2 ? [e, 1.05] : [-0.05, e];
    return { a0: (i / N) * Math.PI * 2 + rnd(-0.05, 0.05), sx: s[0], sy: s[1], bend: rnd(-0.35, 0.35), d: rnd(0, T_FLY * 0.45), r: rnd(1.2, 2.6), gold: Math.random() < 0.72, tw: rnd(0, 6.28) };
  });
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  host.addEventListener('mousemove', (ev) => { tmx = (ev.clientX / W - 0.5) * 18; tmy = (ev.clientY / H - 0.5) * 12; });
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const t0 = performance.now();
  let pulsed = false;
  const frame = (now) => {
    if (!cv.isConnected) { removeEventListener('resize', size); return; }
    const t = (now - t0) / 1000;
    mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const rot = t * 0.12, pts = [];
    P.forEach((p) => {
      const k = Math.max(0, Math.min(1, (t - p.d) / (T_FLY - p.d * 0.6)));
      const a = p.a0 + rot * ease(Math.min(1, t / (T_FLY + 0.4)));
      const breathe = 1 + Math.sin(t * 1.4 + p.tw) * 0.012;
      const tx = cx + Math.cos(a) * rx * breathe + mx, ty = cy + Math.sin(a) * ry * breathe + my;
      const sx = p.sx * W, sy = p.sy * H;
      const qx = (sx + tx) / 2 + (ty - sy) * p.bend, qy = (sy + ty) / 2 - (tx - sx) * p.bend; // نقطة التحكم: مسار منحنٍ
      const u = ease(k), x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * qx + u * u * tx, y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * qy + u * u * ty;
      pts.push([x, y, k]);
      if (k <= 0) return;
      const col = p.gold ? '240,215,155' : '170,225,200';
      if (k < 1) { // ذيل الحركة
        const u2 = ease(Math.max(0, k - 0.08)), x2 = (1 - u2) * (1 - u2) * sx + 2 * (1 - u2) * u2 * qx + u2 * u2 * tx, y2 = (1 - u2) * (1 - u2) * sy + 2 * (1 - u2) * u2 * qy + u2 * u2 * ty;
        const g = ctx.createLinearGradient(x2, y2, x, y); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.75)`);
        ctx.strokeStyle = g; ctx.lineWidth = p.r; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke();
      }
      const tw = k >= 1 ? 0.65 + Math.sin(t * 3 + p.tw) * 0.35 : 1;
      const R = p.r * 5;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, R); gg.addColorStop(0, `rgba(${col},${0.9 * tw})`); gg.addColorStop(0.35, `rgba(${col},${0.28 * tw})`); gg.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    });
    /* خيوط الشبكة بين الجيران بعد الوصول */
    const L = Math.max(0, Math.min(1, (t - T_FLY * 0.85) / 0.7));
    if (L > 0) {
      for (let i = 0; i < N; i++) for (const j of [1, 2]) {
        const A = pts[i], B = pts[(i + j) % N]; if (A[2] < 1 || B[2] < 1) continue;
        ctx.strokeStyle = `rgba(230,199,134,${(j === 1 ? 0.32 : 0.12) * L})`; ctx.lineWidth = j === 1 ? 0.9 : 0.6;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
      /* شرارات تسري على الخيوط */
      for (let s = 0; s < 5; s++) {
        const i = Math.floor((t * 0.9 + s / 5) * N) % N, f = ((t * 2.2 + s * 0.37) % 1), A = pts[i], B = pts[(i + 1) % N];
        const x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, `rgba(255,240,205,${0.85 * L})`); g.addColorStop(1, 'rgba(255,240,205,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      }
    }
    /* نبضة ذهبية تتسع من المركز عند اكتمال الهالة */
    const pt = t - T_FLY * 0.95;
    if (pt > 0 && pt < 1.4) {
      if (!pulsed) { pulsed = true; host.classList.add('fx-pulse'); }
      const q = ease(pt / 1.4);
      for (const [off, al] of [[0, 0.55], [0.18, 0.3]]) {
        const qq = Math.max(0, q - off);
        ctx.strokeStyle = `rgba(240,215,155,${al * (1 - qq)})`; ctx.lineWidth = 2 * (1 - qq) + 0.5;
        ctx.beginPath(); ctx.ellipse(cx + mx, cy + my, rx * (0.25 + qq * 1.05), ry * (0.25 + qq * 1.05), 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
/* تُستدعى بعد تحميل البيانات: تحفظ الإعدادات والأرقام لتظهر فورًا في الفتح التالي، وتحدّث الأرقام إن كانت الشاشة ما زالت ظاهرة */
function splashSync(live = true) {
  if (window.__SBX) return;
  try {
    const s = (D.settings && D.settings.splash) || {};
    const nd = visiblePartnerships().filter((p) => !p.isDraft);
    const statsVals = { act: nd.filter((p) => ['active', 'soon'].includes(pStatus(p))).length, partners: new Set(nd.map((p) => p.partnerId)).size, sectors: new Set(nd.filter((p) => p.stage === 'signed').map(pSector).filter(Boolean)).size };
    localStorage.setItem('shk_splash', JSON.stringify({ ...SPLASH_DEF, ...s, statsVals }));
    if (!live) return; // شاشة الدخول: البيانات لم تُسحب من المنصة بعد
    const el = document.getElementById('shkSplash');
    if (el && !el.classList.contains('out') && s.stats !== false) {
      const box = el.querySelector('.sp-stats');
      const want = [[statsVals.act, 'شراكة سارية'], [statsVals.partners, 'جهة شريكة'], [statsVals.sectors, 'قطاعات']];
      if (box && !box.children.length) { box.innerHTML = want.map(([v, l], i) => `<span style="animation-delay:${(0.2 + i * 0.12).toFixed(2)}s"><b data-to="${v}">0</b>${l}</span>`).join(''); el._count && el._count(); }
      else box && box.querySelectorAll('b').forEach((b, i) => { b.dataset.to = want[i][0]; b.textContent = want[i][0]; });
    }
  } catch (e) { /* الشاشة الافتتاحية ليست حرجة */ }
}
splashShow();
