/* =====================================================================
   «حكاية الشراكة» — فيلم تعريفي سينمائي يتحرك مع التمرير (أو تلقائيًا).
   جزيئات ذهبية من الرمل تتشكل: عنوانًا، ثم نورين يلتقيان في حلقتين متشابكتين،
   ثم تهبط في العمق (منهجية الشراكة)، ثم صور التوقيع الحقيقية، ثم تخضرّ الأرض
   بصور جوية، ثم تتجمع في شعار مروج بألوانه، ثم أرقام المنصة الحية، ثم كوكبة الشركاء.
   الأرقام والشعارات من سجلات المنصة لحظة العرض. لا مكتبات خارجية.
   ===================================================================== */
const TL_FONT = "'Expo Arabic','Noto Naskh Arabic','IBM Plex Sans Arabic',sans-serif";
const tlC = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const tlS = (p, a, b) => tlC((p - a) / (b - a));
const tlE = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/* نافذة ظهور: تظهر بين a و b مع تلاشٍ f */
const tlWin = (p, a, b, f = 0.012) => tlC(Math.min((p - a) / f, (b - p) / f));

function taleData() {
  const vis = (p) => !p.isDraft && (showDemo() || !p.demo);
  const signed = D.partnerships.filter((p) => vis(p) && p.stage === 'signed');
  const active = signed.filter((p) => ['active', 'soon'].includes(pStatus(p))).length;
  const pids = new Set(signed.map((p) => p.partnerId).filter(Boolean));
  const outputs = signed.reduce((t, p) => t + richItems(p.outputs).length, 0);
  const nums = [[pids.size, 'جهة شريكة', 'من القطاعات الحكومية والخاصة وغير الربحية'], [active, 'شراكة سارية', 'تُتابَع مخرجاتها والتزاماتها'], [outputs, 'مخرجًا مستهدفًا', 'في الشراكات الموقّعة']].filter((x) => x[0] > 0);
  const logos = D.partners.filter((pr) => pids.has(pr.id) && pr.logoFileId).slice(0, 14);
  const photos = [['border-guard-signing', 'المديرية العامة لحرس الحدود'], ['waqf-saitah-signing', 'وقف الأمير صيته بنت عبدالعزيز'], ['muhaidib-meet', 'مؤسسة عبدالقادر المهيدب الخيرية']].filter(([k]) => ASSET_IMG[k]);
  return { nums, logos, photos };
}

/* الفصول: النص المعروض ونافذته على محور التقدم */
function taleChapters(nums) {
  const N = [];
  nums.forEach((n, i) => N.push({ a: 0.775 + i * 0.037, b: 0.775 + (i + 1) * 0.037 - 0.004, cls: 'num', eye: '', h: n[1], s: n[2] }));
  return [
    { a: 0.000, b: 0.062, cls: 'open', eye: 'مؤسسة مروج الأهلية · إدارة الشراكات', h: '', s: 'حكاية الشراكة' },
    { a: 0.080, b: 0.185, cls: 'sd', eye: 'الفصل الأول', h: 'أرضٌ واسعة، وفكرة تبحث عن شريك', s: 'كل شراكة تبدأ بخطوة في مكان لم يُزرع بعد.' },
    { a: 0.205, b: 0.305, cls: 'sd', eye: 'الفصل الثاني', h: 'ثم امتدّت يد', s: 'شريكٌ يؤمن بالفكرة نفسها، فيلتقي الطريقان.' },
    { a: 0.325, b: 0.435, cls: 'sd l', eye: 'الفصل الثالث', h: 'معًا… إلى العمق', s: 'منهجية واضحة تُبنى عليها كل مذكرة.' },
    { a: 0.455, b: 0.555, cls: 'sd', eye: 'الفصل الرابع', h: 'اتفاقاتٌ تُوقَّع', s: 'مذكرات تفاهم مع جهات وطنية رائدة.' },
    { a: 0.575, b: 0.675, cls: 'sd', eye: 'الفصل الخامس', h: 'ثم تخضرّ الأرض', s: 'تتحوّل المذكرة إلى عملٍ على الأرض — ومن أبرزه زراعة المانجروف على الساحل الغربي للمملكة.' },
    { a: 0.695, b: 0.765, cls: 'logo', eye: '', h: 'مؤسسة مروج الأهلية', s: 'نحو غطاءٍ نباتيٍّ مستدام' },
    ...N,
    { a: 0.895, b: 1.01, cls: 'end', eye: 'منظومة الشراكات', h: 'كل شراكة لها أثرٌ يُقاس', s: 'ومسؤولٌ يتابعها، وقرارٌ في وقته.' },
  ];
}

function renderTale(el) {
  const { nums, logos, photos } = taleData();
  const chs = taleChapters(nums);
  const lib = (k) => (IMG_LIB[k] || {}).src || '', img = (k) => (ASSET_IMG[k] || {}).src || '';
  const greens = [['ksa-farasan-mangrove', 'غابة القندل · جزر فرسان'], ['ksa-jazan-mangrove', 'أشجار المانجروف · سواحل جازان']].filter(([k]) => img(k)).map(([k, t]) => [img(k), t]);
  el.classList.add('full');
  el.innerHTML = `<div class="tale2" id="tale">
    <div class="tz-stage">
      <div class="tz-bg tz-dunes" data-bg="dunes" style="background-image:url('${lib('dunes')}')"></div>
      <div class="tz-bg tz-depth" data-bg="depth"></div>
      <div class="tz-bg tz-photos" data-bg="photos">${photos.map(([k, t], i) => `<figure class="tz-ph" data-i="${i}"><img src="${img(k)}" alt=""><figcaption><i></i>${esc(t)}</figcaption></figure>`).join('')}</div>
      <div class="tz-bg tz-green" data-bg="green">${greens.map(([s, t], i) => `<div class="tz-g" data-i="${i}" style="background-image:url('${s}')"><span class="tz-gcap"><i></i>${t}<small>تصوير: وكالة الأنباء السعودية (واس) · CC BY-SA 4.0</small></span></div>`).join('')}</div>
      <div class="tz-bg tz-glow" data-bg="glow"></div>
      <canvas class="tz-cv" id="tzCv"></canvas>
      <div class="tz-method" id="tzMethod"><svg viewBox="0 0 10 400" preserveAspectRatio="none"><line x1="5" y1="0" x2="5" y2="400" class="b"/><line x1="5" y1="0" x2="5" y2="400" class="f" id="tzMLine"/></svg>
        ${['منهجية بناء الشراكات', 'التقييم المبدئي للشريك', 'صياغة المذكرة ومراجعتها', 'الاعتماد والتوقيع'].map((t, i) => `<div class="tz-m" style="top:${i * 33.3}%"><b>${['٠١', '٠٢', '٠٣', '٠٤'][i]}</b><span>${t}</span></div>`).join('')}</div>
      <div class="tz-orbit" id="tzOrbit">${img('murooj-logo-white') ? `<img class="tz-core" src="${img('murooj-logo-white')}" alt="">` : ''}
        ${logos.map((pr, k) => `<span class="tz-pl" style="--a:${(k / logos.length) * 360}deg;--r:${k % 2 ? 1 : 0.78}">${plateHTML(pr, 56)}</span>`).join('')}</div>
      <div class="tz-caps">${chs.map((c, i) => `<div class="tz-cap ${c.cls}" data-c="${i}">${c.eye ? `<small>${c.eye}</small>` : ''}${c.h ? `<h2>${c.h}</h2>` : ''}${c.s ? `<p>${c.s}</p>` : ''}</div>`).join('')}</div>
      <div class="tz-cta" id="tzCta">${can('proposal.create') ? `<a class="btn gold lg" href="#/share">${icon('send')} شارك بمقترح شراكة</a>` : ''}<a class="btn lg" href="#/partnerships">${icon('layers')} سجل الشراكات</a><button class="btn lg" type="button" data-tzreplay>${icon('history')} من البداية</button></div>
      <div class="tz-vig"></div><div class="tz-grain"></div>
      <div class="tz-ui"><button type="button" class="tz-play" data-tzplay>${icon('play')}<span>تشغيل</span></button><div class="tz-prog"><i id="tzProg"></i></div><button type="button" class="tz-fs" data-tzfs title="ملء الشاشة (F)">${icon('expand')}<span>ملء الشاشة</span></button></div>
      <div class="tz-hint" id="tzHint"><i></i><span>مرّر للأسفل، أو اضغط «تشغيل» للعرض بملء الشاشة</span></div>
    </div>
  </div>`;
  hydrateFiles(el);
  taleRun(el, { nums, chs });
}

/* ===== محرك الجزيئات ===== */
function taleRun(el, { nums, chs }) {
  const root = $('#tale', el), cv = $('#tzCv', el), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 760;
  const N = small ? 1500 : 2800;
  let W = 0, H = 0, DPR = 1, shapes = {}, ready = false;
  const P = { x: new Float32Array(N), y: new Float32Array(N), ph: new Float32Array(N), sp: new Float32Array(N), sz: new Float32Array(N), dl: new Float32Array(N), rx: new Float32Array(N), ry: new Float32Array(N) };
  for (let i = 0; i < N; i++) { P.ph[i] = Math.random() * 6.283; P.sp[i] = 0.4 + Math.random() * 1.2; P.sz[i] = Math.random(); P.dl[i] = Math.random(); P.rx[i] = Math.random(); P.ry[i] = Math.random(); }
  const GOLD = [233, 197, 120], CREAM = [255, 240, 205];

  /* عينات من رسم على لوحة خفية */
  const sample = (draw, step = 3) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d', { willReadFrequently: true });
    draw(g); const d = g.getImageData(0, 0, W, H).data; const pts = [], cols = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) { const k = (y * W + x) * 4; if (d[k + 3] > 140) { pts.push(x + (Math.random() - 0.5) * step, y + (Math.random() - 0.5) * step); cols.push(d[k], d[k + 1], d[k + 2]); } }
    return { pts, cols };
  };
  const fit = ({ pts, cols }, tint) => {
    const n = pts.length / 2, out = new Float32Array(N * 2), col = new Uint8ClampedArray(N * 3);
    if (!n) return { p: out, c: col };
    const idx = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
    for (let i = 0; i < N; i++) {
      const j = idx[i % n]; out[i * 2] = pts[j * 2] + (i >= n ? (Math.random() - 0.5) * 3 : 0); out[i * 2 + 1] = pts[j * 2 + 1] + (i >= n ? (Math.random() - 0.5) * 3 : 0);
      const c = tint || [cols[j * 3], cols[j * 3 + 1], cols[j * 3 + 2]]; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    return { p: out, c: col };
  };
  const textShape = (txt, size, y, tint = GOLD, weight = 800) => fit(sample((g) => { g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.font = `${weight} ${size}px ${TL_FONT}`; g.fillText(txt, W / 2, y); }, size > 260 ? 4 : 3), tint);
  const build = async () => {
    const r = cv.getBoundingClientRect(); DPR = Math.min(2, devicePixelRatio || 1); W = Math.max(320, Math.round(r.width)); H = Math.max(320, Math.round(r.height));
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    try { await document.fonts.ready; } catch (_) { /* */ }
    const M = Math.min(W, H);
    shapes.title = textShape('من الرمل إلى الأثر', Math.min(W / 7.2, H / 4.4), H * 0.47);
    /* حلقتان متشابكتان: شريكان */
    { const pts = [], cols = [], R = M * 0.2, cx = W * (small ? 0.5 : 0.36), cy = H * 0.5;
      for (let i = 0; i < 2400; i++) { const left = i % 2 === 0, a = Math.random() * 6.283, rr = R + (Math.random() - 0.5) * M * 0.012 + (Math.random() < 0.15 ? (Math.random() - 0.5) * M * 0.05 : 0);
        pts.push(cx + (left ? -R * 0.55 : R * 0.55) + Math.cos(a) * rr, cy + Math.sin(a) * rr); cols.push(...(left ? GOLD : CREAM)); }
      shapes.rings = fit({ pts, cols }); }
    /* نوران: مسافر على الكثبان، ونور يصعد من الرمل */
    { const pts = [], cols = [], cx = W * (small ? 0.5 : 0.36);
      for (let i = 0; i < 1200; i++) { const left = i % 2 === 0, a = Math.random() * 6.283, rr = Math.pow(Math.random(), 2.2) * M * 0.05;
        pts.push((left ? cx - M * 0.16 : cx + M * 0.16) + Math.cos(a) * rr, H * (left ? 0.58 : 0.44) + Math.sin(a) * rr); cols.push(...(left ? GOLD : CREAM)); }
      shapes.two = fit({ pts, cols }); }
    /* شعار مروج بألوانه (مفتّحة قليلًا على الخلفية الداكنة) */
    { const im = new Image(); im.src = (ASSET_IMG['murooj-logo'] || ASSET_IMG['murooj-logo-white'] || {}).src || '';
      try { await im.decode(); } catch (_) { /* */ }
      const s = sample((g) => { if (!im.width) return; const sc = Math.min(W * 0.62 / im.width, H * 0.46 / im.height); const w = im.width * sc, h = im.height * sc; g.drawImage(im, (W - w) / 2, H * 0.44 - h / 2, w, h); }, 3);
      for (let i = 0; i < s.cols.length; i++) s.cols[i] = Math.min(255, s.cols[i] * 0.75 + 70);
      shapes.logo = fit(s); }
    shapes.nums = nums.map(([v]) => textShape(Number(v).toLocaleString('ar-SA-u-nu-latn'), Math.min(H * 0.46, W / 3.2), H * 0.42, GOLD, 800));
    ready = true; last = -1; tick(performance.now());
  };

  /* المواضع الحية (تتحرك مع الوقت) */
  const live = {
    dust: (i, t) => [((P.rx[i] * W + t * 8 * P.sp[i]) % W), (P.ry[i] * H + Math.sin(t * 0.3 + P.ph[i]) * 14)],
    wind: (i, t) => { const lane = P.ry[i]; const y0 = H * (0.62 + lane * 0.36); const x = W - ((P.rx[i] * (W + 200) + t * (40 + lane * 120) * P.sp[i]) % (W + 200)) + 100; return [x, y0 + Math.sin(x * 0.012 + P.ph[i]) * 16 * (1 - lane) - Math.sin(x * 0.004) * 30]; },
    warp: (i, t) => [P.rx[i] * W, H + 40 - ((P.ry[i] * (H + 80) + t * (260 + P.sp[i] * 520)) % (H + 80))],
    bokeh: (i, t) => [P.rx[i] * W + Math.sin(t * 0.2 + P.ph[i]) * 30, P.ry[i] * H + Math.cos(t * 0.17 + P.ph[i]) * 30],
    orbit: (i, t) => { const ring = i % 3, R = Math.min(W, H) * (0.26 + ring * 0.11), a = P.rx[i] * 6.283 + t * (0.05 + ring * 0.025) * (ring % 2 ? -1 : 1); return [W / 2 + Math.cos(a) * R * 1.45, H * 0.555 + Math.sin(a) * R * 0.46 + (P.ry[i] - 0.5) * 6]; },
  };
  const liveCol = { dust: CREAM, wind: GOLD, warp: CREAM, bokeh: GOLD, orbit: GOLD };
  /* المسار: [بداية التحول، اكتماله، الشكل] */
  const keys = () => {
    const k = [[0, 0, 'dust'], [0.004, 0.034, 'title'], [0.058, 0.09, 'wind'], [0.19, 0.215, 'two'], [0.232, 0.262, 'rings'], [0.312, 0.34, 'warp'], [0.44, 0.47, 'bokeh'], [0.678, 0.712, 'logo']];
    nums.forEach((_, i) => { const a = 0.775 + i * 0.037; k.push([a - 0.006, a + 0.014, 'num' + i]); });
    k.push([0.882, 0.912, 'orbit']);
    return k;
  };
  const K = keys();
  const shapeAt = (name, i, t, out) => {
    if (live[name]) { const v = live[name](i, t); out[0] = v[0]; out[1] = v[1]; const c = liveCol[name]; out[2] = c[0]; out[3] = c[1]; out[4] = c[2]; return; }
    const s = name.startsWith('num') ? shapes.nums[+name.slice(3)] : shapes[name];
    if (!s) { const v = live.dust(i, t); out[0] = v[0]; out[1] = v[1]; out[2] = 255; out[3] = 240; out[4] = 205; return; }
    out[0] = s.p[i * 2] + Math.sin(t * P.sp[i] + P.ph[i]) * 1.3; out[1] = s.p[i * 2 + 1] + Math.cos(t * P.sp[i] * 0.8 + P.ph[i]) * 1.3; out[2] = s.c[i * 3]; out[3] = s.c[i * 3 + 1]; out[4] = s.c[i * 3 + 2];
  };
  const A = new Float32Array(5), B = new Float32Array(5);
  let last = -1, prog = 0, raf = 0, t0 = performance.now();
  const getP = () => { const r = root.getBoundingClientRect(), Hh = root.offsetHeight - innerHeight; return tlC(-r.top / Math.max(1, Hh)); };

  /* المسافر وأثره على الكثبان (الفصل الأول) */
  const traveler = (p, t) => {
    const w = tlS(p, 0.085, 0.185); if (p < 0.075 || p > 0.205) return;
    const path = (u) => [W * (0.92 - u * 0.62), H * (0.6 + Math.sin(u * 5.2) * 0.025 + u * 0.02)];
    const al = tlWin(p, 0.08, 0.2, 0.01);
    ctx.globalCompositeOperation = 'lighter';
    for (let s = 0; s < 34; s++) { const u = w - s * 0.012; if (u < 0) break; const [x, y] = path(u); ctx.fillStyle = `rgba(240,205,130,${(0.5 - s * 0.014) * al})`; ctx.beginPath(); ctx.ellipse(x + (s % 2 ? 4 : -4), y + 8, 3.2, 1.3, 0, 0, 6.283); ctx.fill(); }
    const [x, y] = path(w), gr = ctx.createRadialGradient(x, y, 0, x, y, 46);
    gr.addColorStop(0, `rgba(255,244,214,${al})`); gr.addColorStop(0.25, `rgba(240,200,120,${0.55 * al})`); gr.addColorStop(1, 'rgba(240,200,120,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - 46, y - 46, 92, 92);
    ctx.globalCompositeOperation = 'source-over';
  };

  const draw = (p, t) => {
    ctx.clearRect(0, 0, W, H);
    let ki = 0; for (let k = 0; k < K.length; k++) if (p >= K[k][0]) ki = k;
    const cur = K[ki], prev = K[Math.max(0, ki - 1)];
    const mt = ki === 0 ? 1 : tlS(p, cur[0], cur[1]);
    const morphing = mt < 1;
    const fade = cur[2] === 'bokeh' ? 0.45 : 1;
    const streak = cur[2] === 'warp';
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const d = P.dl[i] * 0.45, lt = morphing ? tlE(tlC((mt - d) / 0.55)) : 1;
      shapeAt(cur[2], i, t, B);
      let x = B[0], y = B[1], r = B[2], g = B[3], b = B[4];
      if (lt < 1) {
        shapeAt(prev[2], i, t, A);
        const sw = Math.sin(lt * Math.PI) * (40 + P.sz[i] * 60);
        x = A[0] + (B[0] - A[0]) * lt + Math.cos(P.ph[i]) * sw; y = A[1] + (B[1] - A[1]) * lt + Math.sin(P.ph[i]) * sw;
        r = A[2] + (B[2] - A[2]) * lt; g = A[3] + (B[3] - A[3]) * lt; b = A[4] + (B[4] - A[4]) * lt;
      }
      P.x[i] = x; P.y[i] = y;
      const tw = 0.55 + 0.45 * Math.sin(t * 2 * P.sp[i] + P.ph[i]);
      const al = (cur[2] === 'dust' ? 0.35 : 0.85) * tw * fade;
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${al.toFixed(3)})`;
      if (streak && lt >= 1) ctx.fillRect(x, y, 1.2, 10 + P.sp[i] * 26);
      else { const s = cur[2] === 'bokeh' ? 1.5 + P.sz[i] * 3.5 : (cur[2] === 'title' || cur[2].startsWith('num') || cur[2] === 'logo' ? 1.4 : 1) * (1 + P.sz[i] * 1.6); ctx.fillRect(x - s / 2, y - s / 2, s, s); }
    }
    ctx.globalCompositeOperation = 'source-over';
    traveler(p, t);
  };

  /* طبقات الصور والنصوص */
  const bgs = {}; $$('[data-bg]', el).forEach((b) => { bgs[b.dataset.bg] = b; });
  const caps = $$('.tz-cap', el), phs = $$('.tz-ph', el), gs = $$('.tz-g', el), mline = $('#tzMLine', el), meth = $('#tzMethod', el), orbit = $('#tzOrbit', el), cta = $('#tzCta', el);
  const layers = (p) => {
    bgs.dunes.style.opacity = (Math.min(tlWin(p, 0.06, 0.315, 0.03), 1) * 0.62).toFixed(3);
    bgs.dunes.style.transform = `scale(${(1.08 + tlS(p, 0.06, 0.32) * 0.18).toFixed(4)}) rotate(${(tlS(p, 0.06, 0.32) * -3).toFixed(3)}deg)`;
    bgs.depth.style.opacity = tlWin(p, 0.31, 0.45, 0.02).toFixed(3);
    bgs.photos.style.opacity = tlWin(p, 0.445, 0.565, 0.015).toFixed(3);
    const pn = phs.length || 1;
    phs.forEach((f, i) => { const a = 0.45 + i * (0.11 / pn), b = a + 0.11 / pn + 0.012; const v = tlWin(p, a, b, 0.012); f.style.opacity = v.toFixed(3); f.querySelector('img').style.transform = `scale(${(1.04 + tlS(p, a, b) * 0.12).toFixed(4)}) translateX(${(tlS(p, a, b) * -2).toFixed(2)}%)`; });
    bgs.green.style.opacity = tlWin(p, 0.565, 0.7, 0.012).toFixed(3);
    gs.forEach((g, i) => { const a = 0.57 + i * 0.05; const r = tlE(tlS(p, a, a + 0.035)) * 150; g.classList.toggle('on', p > a + 0.03 && (i === gs.length - 1 || p < a + 0.05)); g.style.clipPath = `circle(${r.toFixed(2)}% at ${i % 2 ? 38 : 62}% ${i % 2 ? 55 : 45}%)`; g.style.transform = `scale(${(1.15 - tlS(p, a, 0.7) * 0.12).toFixed(4)})`; });
    bgs.glow.style.opacity = tlWin(p, 0.68, 1.2, 0.03).toFixed(3);
    meth.style.opacity = tlWin(p, 0.335, 0.435, 0.012).toFixed(3);
    const ml = tlS(p, 0.345, 0.42); mline.style.strokeDashoffset = (400 - ml * 400).toFixed(1);
    $$('.tz-m', meth).forEach((m, i) => m.classList.toggle('on', ml >= i / 3 - 0.001));
    orbit.style.opacity = tlS(p, 0.9, 0.93).toFixed(3); orbit.classList.toggle('on', p > 0.9);
    cta.classList.toggle('on', p > 0.94);
    caps.forEach((c, i) => { const ch = chs[i], v = tlWin(p, ch.a, ch.b, 0.01); c.style.opacity = v.toFixed(3); c.style.transform = `translateY(${((1 - v) * 18).toFixed(1)}px)`; c.style.filter = v < 1 ? `blur(${((1 - v) * 6).toFixed(1)}px)` : ''; c.style.visibility = v > 0 ? 'visible' : 'hidden'; });
    root.classList.toggle('lit', p > 0.565 && p < 0.7);
    $('#tzProg', el).style.width = (p * 100).toFixed(1) + '%';
    $('#tzHint', el).classList.toggle('off', p > 0.01);
  };
  const tick = (now) => {
    raf = 0;
    if (!document.body.contains(root)) { removeEventListener('resize', onResize); return; }
    if (!ready) return;
    const p = getP(); prog = p;
    const t = (now - t0) / 1000;
    draw(p, reduce ? 0 : t); if (p !== last) layers(p); last = p;
    if (!reduce || auto) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', kick, { passive: true });
  const onResize = () => { ready = false; clearTimeout(onResize.t); onResize.t = setTimeout(build, 200); };
  addEventListener('resize', onResize);

  /* التشغيل التلقائي: يقود التمرير نفسه فيبقى كل شيء متزامنًا */
  let auto = 0;
  const playBtn = $('[data-tzplay]', el);
  const top0 = () => root.getBoundingClientRect().top + scrollY, span = () => root.offsetHeight - innerHeight;
  const stop = () => { if (!auto) return; cancelAnimationFrame(auto); auto = 0; playBtn.classList.remove('on'); $('span', playBtn).textContent = 'تشغيل'; kick(); };
  const play = () => {
    if (getP() > 0.985) scrollTo(0, top0());
    playBtn.classList.add('on'); $('span', playBtn).textContent = 'إيقاف';
    const DUR = 78000; let st = null; const p0 = getP();
    const step = (ts) => { if (st === null) st = ts; const k = tlC(p0 + (ts - st) / DUR); scrollTo(0, top0() + span() * k); if (k < 1 && auto) auto = requestAnimationFrame(step); else stop(); };
    auto = requestAnimationFrame(step);
  };
  playBtn.onclick = () => { if (auto) return stop(); if (!document.documentElement.classList.contains('tz-cinema')) enterCinema(); setTimeout(play, 350); };
  document.addEventListener('keydown', function tzKeys(e) {
    if (!document.body.contains(root)) return document.removeEventListener('keydown', tzKeys);
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if (e.key === 'f' || e.key === 'F' || e.key === 'ب') { e.preventDefault(); toggleCinema(); }
    else if (e.key === ' ') { e.preventDefault(); playBtn.click(); }
    else if (e.key === 'Escape' && document.documentElement.classList.contains('tz-cinema') && !document.fullscreenElement) toggleCinema();
  });
  ['wheel', 'touchstart'].forEach((ev) => root.addEventListener(ev, stop, { passive: true }));
  $('[data-tzreplay]', el).onclick = () => { stop(); scrollTo({ top: top0(), behavior: 'auto' }); setTimeout(play, 300); };
  /* وضع العرض: يخفي شريط المنصة ويملأ الشاشة */
  const cinema = (on) => { document.documentElement.classList.toggle('tz-cinema', on); onResize(); };
  function enterCinema() { cinema(true); document.documentElement.requestFullscreen?.().catch(() => {}); fsBtn.classList.add('on'); $('span', fsBtn).textContent = 'خروج'; }
  function toggleCinema() { if (!document.documentElement.classList.contains('tz-cinema')) return enterCinema(); cinema(false); fsBtn.classList.remove('on'); $('span', fsBtn).textContent = 'ملء الشاشة'; if (document.fullscreenElement) document.exitFullscreen(); }
  const fsBtn = $('[data-tzfs]', el);
  fsBtn.onclick = toggleCinema;
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.documentElement.classList.contains('tz-cinema')) { cinema(false); fsBtn.classList.remove('on'); $('span', fsBtn).textContent = 'ملء الشاشة'; } });
  addEventListener('hashchange', () => document.documentElement.classList.remove('tz-cinema'), { once: true });
  build();
}
