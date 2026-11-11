/* =====================================================================
   «من الرمل إلى الأثر»: صفحة تعريفية تتحرك مع التمرير كأنها فيلم قصير.
   صحراء خالية ← رجل يمشي ← يد تخرج من الرمل يمسكها ← تنزل به (والصفحة معه)
   ← أرض عامرة: اتفاقات وزراعة وعمل، وشعار مروج ← أرقام المنصة الحية وشركاؤها.
   كل الرسومات SVG داخل الصفحة، والأرقام من سجلات المنصة لحظة العرض.
   ===================================================================== */
const TALE_SCENES = [
  { a: 0.00, b: 0.10, t: 'من الرمل إلى الأثر', s: 'حكاية الشراكة في مؤسسة مروج الأهلية', k: 'title' },
  { a: 0.10, b: 0.30, t: 'أرضٌ واسعة، وفكرة تبحث عن شريك', s: 'كل شراكة تبدأ بخطوة في مكان لم يُزرع بعد' },
  { a: 0.30, b: 0.44, t: 'ثم امتدّت يد', s: 'شريك يؤمن بالفكرة نفسها' },
  { a: 0.44, b: 0.64, t: 'معًا… إلى العمق', s: 'دراسة، ومنهجية، ومذكرة تُبنى على أساس' },
  { a: 0.64, b: 0.80, t: 'اتفاقات، وزراعة، وعمل لا يتوقف', s: 'تتحول المذكرة إلى مخرجات على أرض الواقع' },
  { a: 0.80, b: 1.01, t: '', s: '', k: 'outro' },
];
const taleClamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const taleSeg = (p, a, b) => taleClamp((p - a) / (b - a));
const taleEase = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function taleFigure(id) {
  /* رجل بثوب وشماغ، يتجه يسارًا (اتجاه القراءة) — رجلان تتأرجحان عند المشي، وذراع ترتفع للإمساك */
  return `<g id="${id}" class="tl-man">
    <g class="tl-leg l1"><path d="M-6 58 L-9 96" /></g><g class="tl-leg l2"><path d="M6 58 L9 96" /></g>
    <path class="tl-thobe" d="M-17 6 Q-20 40 -15 64 L15 64 Q20 40 17 6 Q0 -2 -17 6Z"/>
    <g class="tl-arm-b"><path d="M12 12 Q20 30 16 46" /></g>
    <g class="tl-arm"><path d="M-12 12 Q-22 30 -18 46" /></g>
    <circle class="tl-head" cx="0" cy="-10" r="12"/>
    <path class="tl-shmagh" d="M-14 -12 Q0 -30 14 -12 L18 6 Q0 0 -18 6Z"/>
    <path class="tl-agal" d="M-12 -16 Q0 -23 12 -16"/>
  </g>`;
}
function taleHand() {
  return `<g class="tl-hand-g"><g class="tl-hand">
    <path class="tl-skin" d="M-26 120 L-24 30 Q-24 18 -12 18 L14 18 Q26 18 26 30 L26 120Z"/>
    <g class="tl-fingers">${[-20, -8, 4, 16].map((x, i) => `<rect class="tl-skin tl-f f${i}" x="${x - 5}" y="${-38 + Math.abs(i - 1.5) * 7}" width="11" height="${60 - Math.abs(i - 1.5) * 7}" rx="5.5"/>`).join('')}</g>
    <rect class="tl-skin tl-thumb" x="22" y="10" width="11" height="40" rx="5.5" transform="rotate(32 27 40)"/>
    <path class="tl-cuff" d="M-28 92 L28 92 L28 120 L-28 120Z"/>
  </g></g>`;
}
function taleDunes(cls, y, amp, col) {
  return `<path class="${cls}" fill="${col}" d="M0 ${y} C 200 ${y - amp} 380 ${y + amp * 0.6} 600 ${y - amp * 0.4} S 1000 ${y + amp} 1200 ${y - amp * 0.5} S 1500 ${y + amp * 0.4} 1600 ${y - amp * 0.2} L1600 900 L0 900Z"/>`;
}
function taleStats() {
  const vis = (p) => !p.isDraft && (showDemo() || !p.demo);
  const signed = D.partnerships.filter((p) => vis(p) && p.stage === 'signed');
  const active = signed.filter((p) => ['active', 'soon'].includes(pStatus(p))).length;
  const partners = new Set(signed.map((p) => p.partnerId).filter(Boolean));
  const outputs = signed.reduce((t, p) => t + richItems(p.outputs).length, 0);
  const secs = new Set(signed.map(pSector).filter(Boolean)).size;
  const logos = D.partners.filter((pr) => partners.has(pr.id) && pr.logoFileId).slice(0, 16);
  return { stats: [[active, 'شراكة سارية'], [partners.size, 'جهة شريكة'], [outputs, 'مخرجًا مستهدفًا'], [secs, 'قطاعات']].filter(([v]) => v > 0), logos };
}
function renderTale(el) {
  const logo = (ASSET_IMG['murooj-logo'] || {}).src, logoW = (ASSET_IMG['murooj-logo-white'] || {}).src;
  const { stats, logos } = taleStats();
  const tree = (x, y, s, i) => `<g class="tl-tree" style="--i:${i}" transform="translate(${x} ${y}) scale(${s})"><g class="tl-grow"><path class="tl-trunk" d="M-4 0 L-3 -46 L3 -46 L4 0Z"/><circle class="tl-leaf a" cx="0" cy="-62" r="24"/><circle class="tl-leaf b" cx="-16" cy="-50" r="16"/><circle class="tl-leaf c" cx="17" cy="-52" r="15"/></g></g>`;
  const palm = (x, y, s, i) => `<g class="tl-tree" style="--i:${i}" transform="translate(${x} ${y}) scale(${s})"><g class="tl-grow"><path class="tl-trunk" d="M-5 0 Q-2 -40 2 -84 L7 -84 Q4 -40 5 0Z"/>${[-70, -35, 0, 35, 70, 110, -110].map((r) => `<path class="tl-frond" d="M4 -84 Q${4 + 34 * Math.cos((r - 90) * Math.PI / 180)} ${-84 + 34 * Math.sin((r - 90) * Math.PI / 180) - 10} ${4 + 56 * Math.cos((r - 90) * Math.PI / 180)} ${-84 + 56 * Math.sin((r - 90) * Math.PI / 180) + 14}"/>`).join('')}</g></g>`;
  const worker = (x, y, i, act) => `<g class="tl-worker ${act}" style="--i:${i}" transform="translate(${x} ${y})"><circle class="tl-head" cx="0" cy="-58" r="8"/><path class="tl-vest" d="M-11 -48 L11 -48 L13 -16 L-13 -16Z"/><path class="tl-limb" d="M-6 -16 L-8 0 M6 -16 L8 0"/><g class="tl-tool"><path class="tl-limb" d="M10 -44 L24 -30"/>${act === 'dig' ? '<path class="tl-shovel" d="M24 -30 L30 -6 M26 -6 L34 -6 L32 2 L28 2Z"/>' : '<path class="tl-can" d="M22 -32 h14 v12 h-14Z M36 -28 l10 4"/><g class="tl-drops"><circle cx="48" cy="-18" r="2"/><circle cx="50" cy="-10" r="2"/><circle cx="47" cy="-3" r="2"/></g>'}</g></g>`;
  el.classList.add('full');
  el.innerHTML = `<div class="tale" id="tale">
    <div class="tl-stage">
      <div class="tl-world" id="tlWorld">
        <!-- ١) الصحراء -->
        <section class="tl-p tl-desert">
          <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs><linearGradient id="tlSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6E9C9"/><stop offset="1" stop-color="#F2DDB0"/></linearGradient>
              <radialGradient id="tlSun"><stop offset="0" stop-color="#FFF6DD"/><stop offset=".6" stop-color="#F7DFA4"/><stop offset="1" stop-color="#F7DFA4" stop-opacity="0"/></radialGradient></defs>
            <rect width="1600" height="900" fill="url(#tlSky)"/>
            <circle class="tl-sun" cx="1220" cy="250" r="190" fill="url(#tlSun)"/>
            <g class="tl-heat">${[0, 1, 2].map((i) => `<path d="M${300 + i * 380} ${520 + i * 12} q30 -8 60 0 t60 0 t60 0" />`).join('')}</g>
            ${taleDunes('tl-d1', 600, 70, '#EBCB8D')}${taleDunes('tl-d2', 680, 60, '#E2BC78')}${taleDunes('tl-d3', 760, 40, '#D9AE66')}
            <g class="tl-sand">${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 137) % 1600}" cy="${700 + (i * 53) % 160}" r="${1 + (i % 3)}" style="--d:${(i % 7) * 0.6}s"/>`).join('')}</g>
            <g class="tl-steps" id="tlSteps"></g>
            <g class="tl-mound" id="tlMound"><ellipse cx="0" cy="0" rx="70" ry="16"/></g>
          </svg>
        </section>
        <!-- ٢) العمق -->
        <section class="tl-p tl-deep">
          <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="1600" height="900" fill="#C99A55"/>
            ${[0, 1, 2, 3, 4].map((i) => `<path class="tl-strata" d="M0 ${120 + i * 170} C 400 ${80 + i * 170} 900 ${170 + i * 170} 1600 ${110 + i * 170} L1600 ${200 + i * 170} C 900 ${250 + i * 170} 500 ${170 + i * 170} 0 ${210 + i * 170}Z" style="opacity:${0.18 + i * 0.1}"/>`).join('')}
            <g class="tl-roots">${[260, 620, 1040, 1380].map((x, i) => `<path d="M${x} 0 C ${x + 30} 160 ${x - 40} 300 ${x + 10} 520 S ${x + 60} 760 ${x + 20} 900" style="--i:${i}"/>`).join('')}</g>
            <g class="tl-glow">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 211) % 1600}" cy="${(i * 97) % 900}" r="${1.5 + (i % 3)}" style="--d:${(i % 9) * 0.4}s"/>`).join('')}</g>
          </svg>
          <div class="tl-deep-t" data-th="0.53"><span>منهجية بناء الشراكات</span><span>التقييم المبدئي</span><span>صياغة المذكرة</span><span>الاعتماد والتوقيع</span></div>
        </section>
        <!-- ٣) الأرض العامرة -->
        <section class="tl-p tl-alive" id="tlAlive">
          <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs><linearGradient id="tlSky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6F0E8"/><stop offset="1" stop-color="#F5F1E4"/></linearGradient></defs>
            <rect width="1600" height="900" fill="url(#tlSky2)"/>
            <path d="M0 640 C 300 600 600 660 900 620 S 1400 600 1600 630 L1600 900 L0 900Z" fill="#CFE0C9"/>
            <path d="M0 720 C 400 690 700 740 1100 700 S 1500 700 1600 712 L1600 900 L0 900Z" fill="#9DBF98"/>
            <g class="tl-rows">${Array.from({ length: 9 }, (_, i) => `<path d="M${120 + i * 160} 900 L${700 + i * 25} 700" />`).join('')}</g>
            ${tree(150, 700, 1.3, 0)}${palm(300, 712, 1.4, 1)}${tree(450, 690, 1, 2)}${palm(990, 704, 1.5, 3)}${tree(1430, 700, 1.3, 4)}${palm(1540, 708, 1.2, 5)}
            ${Array.from({ length: 12 }, (_, i) => `<g class="tl-sprout" style="--i:${i}" transform="translate(${640 + (i % 6) * 60} ${770 + Math.floor(i / 6) * 50})"><path d="M0 0 L0 -16 M0 -10 Q-10 -18 -14 -12 M0 -12 Q10 -22 14 -16"/></g>`).join('')}
            ${worker(560, 790, 0, 'dig')}${worker(1000, 800, 1, 'water')}${worker(1340, 790, 2, 'dig')}
            <!-- الاتفاقية -->
            <g class="tl-deal" transform="translate(1210 430) scale(.82)">
              <rect class="tl-paper" x="-90" y="-110" width="180" height="230" rx="8"/>
              ${[0, 1, 2, 3, 4].map((i) => `<path class="tl-line" d="M-60 ${-70 + i * 26} H${60 - (i % 2) * 30}"/>`).join('')}
              <path class="tl-sign" d="M-50 90 C -30 60 -20 110 0 80 S 30 70 50 88"/>
              <g class="tl-shake" transform="translate(0 170)"><path class="tl-arm-l" d="M-150 20 L-30 0"/><path class="tl-arm-r" d="M150 20 L30 0"/><ellipse class="tl-clasp" cx="0" cy="0" rx="34" ry="18"/></g>
            </g>
          </svg>
          <div class="tl-logo" data-th="0.69">${logo ? `<img src="${logo}" alt="مؤسسة مروج الأهلية">` : ''}<svg viewBox="-110 -110 220 220" aria-hidden="true"><circle r="100" class="r1"/><circle r="86" class="r2"/>${Array.from({ length: 16 }, (_, k) => { const a = k / 16 * Math.PI * 2; return `<circle class="pt" r="3" cx="${(Math.cos(a) * 100).toFixed(1)}" cy="${(Math.sin(a) * 100).toFixed(1)}"/>`; }).join('')}</svg></div>
        </section>
        <!-- ٤) الخاتمة -->
        <section class="tl-p tl-end">
          <div class="tl-end-in">
            ${logoW ? `<img class="tl-end-logo" src="${logoW}" alt="">` : ''}
            <h2>هذه منظومة الشراكات</h2>
            <p>كل شراكة فيها لها أثر يُقاس، ومسؤول يتابعها، وقرار في وقته.</p>
            ${stats.length ? `<dl class="tl-nums">${stats.map(([v, l], k) => `<div style="--k:${k}"><dd><b data-v="${v}">0</b></dd><dt>${l}</dt></div>`).join('')}</dl>` : ''}
            ${logos.length ? `<div class="tl-orbit">${logos.map((pr, k) => `<span style="--k:${k};--n:${logos.length}">${plateHTML(pr, 48)}</span>`).join('')}</div>` : ''}
            <div class="tl-cta">${can('proposal.create') ? `<a class="btn gold lg" href="#/share">${icon('send')} شارك بمقترح شراكة</a>` : ''}<a class="btn lg" href="#/partnerships">${icon('layers')} سجل الشراكات</a><button class="btn lg" type="button" data-tlreplay>${icon('history')} من البداية</button></div>
          </div>
        </section>
      </div>
      <!-- البطل واليد فوق العالم -->
      <svg class="tl-actors" id="tlActors" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <g id="tlHandWrap">${taleHand()}</g>
        ${taleFigure('tlMan')}
      </svg>
      <div class="tl-cap" id="tlCap" aria-live="polite"><small></small><h2></h2></div>
      <div class="tl-ui"><button type="button" class="tl-play" data-tlplay>${icon('play')}<span>تشغيل تلقائي</span></button><div class="tl-prog"><i id="tlProg"></i></div></div>
      <div class="tl-hint" id="tlHint"><span>مرّر للأسفل</span><i></i></div>
    </div>
  </div>`;
  hydrateFiles(el);
  taleMount(el);
}
function taleMount(el) {
  const root = $('#tale', el), world = $('#tlWorld', el), man = $('#tlMan', el), hand = $('#tlHandWrap', el), cap = $('#tlCap', el), prog = $('#tlProg', el), hint = $('#tlHint', el), steps = $('#tlSteps', el), mound = $('#tlMound', el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = -1, raf = 0, scene = -1, auto = 0, lastX = null, stepN = 0, counted = false;
  const fired = new Set();
  const GX = 640, GY = 742; /* موضع اليد على الرمل */
  const frame = () => {
    raf = 0;
    if (!document.body.contains(root)) { removeEventListener('scroll', onScroll); return; }
    const r = root.getBoundingClientRect(), H = root.offsetHeight - innerHeight * 0.92;
    const p = taleClamp(-r.top / Math.max(1, H));
    if (Math.abs(p - last) < 0.0004) return; last = p;
    prog.style.width = (p * 100).toFixed(1) + '%';
    hint.classList.toggle('off', p > 0.02);
    /* الكاميرا: الصحراء ← العمق ← الأرض العامرة ← الخاتمة */
    const cam = taleEase(taleSeg(p, 0.44, 0.54)) + taleEase(taleSeg(p, 0.62, 0.70)) + taleEase(taleSeg(p, 0.80, 0.88));
    world.style.transform = `translate3d(0, ${(-cam * world.firstElementChild.offsetHeight).toFixed(1)}px, 0)`;
    /* الرجل: يدخل ويمشي، ثم يقف، ثم ينزل مع اليد، ثم يهبط في الأرض العامرة */
    const walk = taleSeg(p, 0.04, 0.32);
    let x = 1500 - walk * (1500 - (GX + 70)), y = 742;
    const grab = taleSeg(p, 0.38, 0.44), sink = taleEase(taleSeg(p, 0.44, 0.54)), rise = taleEase(taleSeg(p, 0.62, 0.68)), land = taleEase(taleSeg(p, 0.68, 0.75));
    const walking = p > 0.04 && p < 0.32;
    man.classList.toggle('walk', walking && !reduce);
    man.classList.toggle('reach', p >= 0.34);
    man.classList.toggle('hold', p >= 0.42 && p < 0.68);
    /* أثر الخطوات على الرمل */
    if (walking && (lastX === null || Math.abs(lastX - x) > 46)) { lastX = x; if (stepN < 40) { steps.insertAdjacentHTML('beforeend', `<ellipse cx="${(x + (stepN % 2 ? 8 : -8)).toFixed(0)}" cy="${y + 98 + (stepN % 2 ? 4 : 0)}" rx="7" ry="2.6"/>`); stepN++; } }
    /* اليد تخرج من الرمل */
    const up = taleEase(taleSeg(p, 0.30, 0.38));
    const handY = GY + 120 - up * 150;
    const away = taleEase(taleSeg(p, 0.68, 0.73));
    hand.setAttribute('transform', `translate(${GX} ${handY + sink * 140 - rise * 140 + away * 170})`);
    hand.classList.toggle('closed', grab > 0.6);
    hand.style.opacity = p < 0.29 ? 0 : p > 0.71 ? taleClamp(1 - (p - 0.71) / 0.03) : 1;
    mound.setAttribute('transform', `translate(${GX} ${GY + 104}) scale(${(0.4 + up * 0.8).toFixed(2)} 1)`);
    mound.style.opacity = up > 0.02 ? 1 : 0;
    if (p >= 0.42) { x = GX + 58; y = 742 - 22 + sink * 140 - rise * 140; }
    if (p >= 0.68) { x = GX + 58 + land * 70; y = 742 - 22 + land * 22; }
    man.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    $('#tlActors', el).style.opacity = p > 0.80 ? taleClamp(1 - (p - 0.80) / 0.05) : 1;
    /* عتبات الأحداث */
    $$('[data-th]', el).forEach((n) => n.classList.toggle('on', p >= +n.dataset.th));
    $('#tlAlive', el).classList.toggle('on', p >= 0.66);
    $('#tlAlive', el).style.setProperty('--grow', taleSeg(p, 0.68, 0.80).toFixed(3));
    root.classList.toggle('dark', p > 0.46 && p < 0.64);
    if (p >= 0.86 && !counted) { counted = true; $$('.tl-nums b', el).forEach((b) => taleCount(b, +b.dataset.v)); root.classList.add('end-on'); }
    /* النص */
    const si = TALE_SCENES.findIndex((s) => p >= s.a && p < s.b);
    if (si !== scene) {
      scene = si; const s = TALE_SCENES[si] || {};
      cap.classList.remove('show'); cap.classList.toggle('title', s.k === 'title');
      setTimeout(() => { if (scene !== si) return; $('h2', cap).textContent = s.t || ''; $('small', cap).textContent = s.s || ''; if (s.t) cap.classList.add('show'); }, 220);
    }
    fired.add(si);
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', onScroll, { passive: true });
  frame();
  /* تشغيل تلقائي: ينزل بالصفحة بهدوء حتى النهاية، ويتوقف بأي تمرير يدوي */
  const playBtn = $('[data-tlplay]', el);
  const stop = () => { if (!auto) return; cancelAnimationFrame(auto); auto = 0; playBtn.classList.remove('on'); $('span', playBtn).textContent = 'تشغيل تلقائي'; };
  const play = () => {
    const H = root.offsetHeight - innerHeight * 0.92, top0 = root.getBoundingClientRect().top + scrollY;
    if (last > 0.985) scrollTo(0, top0);
    playBtn.classList.add('on'); $('span', playBtn).textContent = 'إيقاف';
    let t0 = null; const start = scrollY, total = top0 + H - start, dur = Math.max(4000, 34000 * (total / H));
    const step = (ts) => { if (t0 === null) t0 = ts; const k = taleClamp((ts - t0) / dur); scrollTo(0, start + total * k); if (k < 1 && auto) auto = requestAnimationFrame(step); else stop(); };
    auto = requestAnimationFrame(step);
  };
  playBtn.onclick = () => (auto ? stop() : play());
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => root.addEventListener(ev, stop, { passive: true }));
  $('[data-tlreplay]', el).onclick = () => { stop(); steps.innerHTML = ''; stepN = 0; lastX = null; counted = false; root.classList.remove('end-on'); scrollTo({ top: root.getBoundingClientRect().top + scrollY, behavior: 'smooth' }); };
}
function taleCount(b, v) {
  const t0 = performance.now(), d = 1400;
  const f = (t) => { const k = taleClamp((t - t0) / d); b.textContent = Math.round(v * (1 - Math.pow(1 - k, 3))).toLocaleString('ar-SA-u-nu-latn'); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
