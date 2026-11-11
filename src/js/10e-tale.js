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
  const nums = [[pids.size, 'جهة شريكة', 'من القطاعات الحكومية والخاصة وغير الربحية'], [active, 'شراكة سارية', 'تُتابَع مخرجاتها والتزاماتها'], [outputs, 'مخرجًا مستهدفًا', 'في الشراكات الموقّعة'], [publicStories().length, 'قصة أثر موثّقة', 'نتائج ميدانية منشورة مرتبطة بشراكاتها']].filter((x) => x[0] > 0);
  /* كل الجهات الشريكة الفعلية: ذات الشعار أولًا */
  const logos = D.partners.filter((pr) => pids.has(pr.id)).sort((a, b) => !!b.logoFileId - !!a.logoFileId);
  const photos = [['border-guard-signing', 'المديرية العامة لحرس الحدود'], ['waqf-saitah-signing', 'وقف الأمير صيته بنت عبدالعزيز'], ['muhaidib-meet', 'مؤسسة عبدالقادر المهيدب الخيرية']].filter(([k]) => ASSET_IMG[k]);
  /* مشاريع مروج على الأرض، ومع كل مشروع عدد الشراكات المرتبطة به في المنصة (يظهر إن وُجد) */
  const txt = (p) => JSON.stringify([p.title, p.name, p.ptype, p.category, p.categories, p.domain, p.goals, p.outputs, p.scope, p.summary, partnerName(p)]);
  const hits = (re) => signed.filter((p) => re.test(txt(p))).length;
  const projects = [
    /* المواقع تقريبية على مستوى المنطقة: [خط الطول، خط العرض، الاسم] */
    ['leaf', 'زراعة المانجروف', 'على سواحل البحر الأحمر والخليج العربي', hits(/مانجروف|القرم|الشورى/), [[42.56, 16.9, 'جازان'], [40.27, 20.15, 'الليث'], [39.03, 22.8, 'رابغ'], [50.0, 26.56, 'القطيف']]],
    ['home', 'المساجد الخضراء وأنسنة المساجد', 'تشجير محيط المساجد وريّه بمياه الوضوء المعالجة', hits(/مسجد|مساجد|أنسنة/), [[46.72, 24.69, 'الرياض'], [39.17, 21.54, 'جدة'], [39.61, 24.47, 'المدينة المنورة'], [50.1, 26.43, 'الدمام']]],
    ['award', 'التشجير بالأشجار المحلية', 'في المدن والطرق والمرافق والمسطحات الخضراء', hits(/تشجير|شجر|أشجار|غرس|زراعة/), [[43.97, 26.33, 'القصيم'], [41.69, 27.52, 'حائل'], [36.57, 28.38, 'تبوك'], [46.72, 24.69, 'الرياض']]],
    ['flag', 'تأهيل المحميات ونثر البذور', 'إعادة الغطاء النباتي في المحميات الملكية', hits(/محمية|محميات|بذور|بذر|مراعي/), [[38.6, 30.4, 'محمية الملك سلمان'], [43.3, 27.9, 'محمية الإمام تركي'], [46.6, 25.7, 'محمية الملك عبدالعزيز']]],
    ['layers', 'الإدارة المستدامة للغابات', 'حماية الغابات الطبيعية في جبال السروات', hits(/غابة|غابات|العرعر|السروات/), [[42.5, 18.22, 'عسير'], [41.47, 20.01, 'الباحة'], [40.42, 21.27, 'الطائف']]],
  ];
  return { nums, logos, photos, signed: signed.length, projects };
}

/* الفصول: النص المعروض ونافذته على محور التقدم */
function taleChapters(nums, signed = 0) {
  const N = [];
  nums.forEach((n, i) => N.push({ a: 0.775 + i * 0.037, b: 0.775 + (i + 1) * 0.037 - 0.004, cls: 'num', eye: '', h: n[1], s: n[2] }));
  return [
    { a: 0.000, b: 0.062, cls: 'open', eye: 'مؤسسة مروج الأهلية · إدارة الشراكات', h: '', s: 'حكاية الشراكة' },
    { a: 0.080, b: 0.185, cls: 'sd', eye: 'الفصل الأول', h: 'أرضٌ واسعة، وفكرة تبحث عن شريك', s: 'كل شراكة تبدأ بخطوة في مكان لم يُزرع بعد.' },
    { a: 0.205, b: 0.305, cls: 'sd', eye: 'الفصل الثاني', h: 'ثم امتدّت يد', s: 'شريكٌ يؤمن بالفكرة نفسها، فيلتقي الطريقان.' },
    { a: 0.325, b: 0.435, cls: 'sd l', eye: 'الفصل الثالث', h: 'معًا… إلى العمق', s: 'منهجية واضحة تُبنى عليها كل مذكرة.' },
    { a: 0.455, b: 0.555, cls: 'sd', eye: 'الفصل الرابع', h: 'اتفاقاتٌ تُوقَّع', s: signed ? `${plural(signed, 'مذكرة تفاهم واحدة', 'مذكرتا تفاهم', 'مذكرات تفاهم', 'مذكرة تفاهم')} موقّعة مع جهات وطنية رائدة.` : 'مذكرات تفاهم مع جهات وطنية رائدة.', k: 'signed' },
    { a: 0.572, b: 0.690, cls: 'sd up', eye: 'الفصل الخامس', h: 'ثم تخضرّ الأرض', s: 'ليست المذكرات وحدها؛ مشاريع ومبادرات تُنفَّذ على أرض المملكة:' },
    { a: 0.695, b: 0.765, cls: 'logo', eye: '', h: 'مؤسسة مروج الأهلية', s: 'نحو غطاءٍ نباتيٍّ مستدام' },
    ...N,
    { a: 0.895, b: 1.01, cls: 'end', eye: 'شركاء مروج', h: 'معًا… نحو غطاءٍ نباتيٍّ مستدام', s: 'كل شراكة لها أثرٌ يُقاس، ومسؤولٌ يتابعها، وقرارٌ في وقته.' },
  ];
}

/* صور «ثم تخضرّ الأرض»: تختارها إدارة الشراكات من صور المنصة أو ترفعها؛ الافتراضي صور واس للمانجروف */
const TALE_KSA = [[42.78,16.35],[42.65,16.77],[42.35,17.08],[42.27,17.47],[41.75,17.83],[41.22,18.67],[40.94,19.49],[40.25,20.17],[39.8,20.34],[39.14,21.29],[39.02,21.99],[39.07,22.58],[38.49,23.69],[38.02,24.08],[37.48,24.29],[37.15,24.86],[37.21,25.08],[36.93,25.6],[36.64,25.83],[36.25,26.57],[35.64,27.38],[35.13,28.06],[34.63,28.06],[34.79,28.61],[34.83,28.96],[34.96,29.36],[36.07,29.2],[36.5,29.51],[36.74,29.87],[37.5,30.0],[37.67,30.34],[38.0,30.51],[37.0,31.51],[39.0,32.01],[39.2,32.16],[40.4,31.89],[41.89,31.19],[44.71,29.18],[46.57,29.1],[47.46,29.0],[47.71,28.53],[48.42,28.55],[48.81,27.69],[49.3,27.46],[49.47,27.11],[50.15,26.69],[50.21,26.28],[50.11,25.94],[50.24,25.61],[50.53,25.33],[50.66,25.0],[50.81,24.75],[51.11,24.56],[51.39,24.63],[51.58,24.25],[51.62,24.01],[52.0,23.0],[55.01,22.5],[55.21,22.71],[55.67,22.0],[55.0,20.0],[52.0,19.0],[49.12,18.62],[48.18,18.17],[47.47,17.12],[47.0,16.95],[46.75,17.28],[46.37,17.23],[45.4,17.33],[45.22,17.43],[44.06,17.41],[43.79,17.32],[43.38,17.58],[43.12,17.09],[43.22,16.67],[42.78,16.35]];
const TALE_GREEN_DEF = [
  { fileId: 'asset:ksa-farasan-mangrove', cap: 'غابة القندل · جزر فرسان', credit: 'تصوير: وكالة الأنباء السعودية (واس) · CC BY-SA 4.0' },
  { fileId: 'asset:ksa-jazan-mangrove', cap: 'أشجار المانجروف · سواحل جازان', credit: 'تصوير: وكالة الأنباء السعودية (واس) · CC BY-SA 4.0' },
];
function taleGreens() {
  const L_ = (D.settings && D.settings.taleGreens) || [];
  return L_.filter((g) => !g.fileId.startsWith('asset:') || ASSET_IMG[g.fileId.slice(6)]);
}
const taleImgTag = (id) => (id.startsWith('asset:') ? `<img class="tz-gi" src="${ASSET_IMG[id.slice(6)].src}" alt="">` : `<img class="tz-gi" data-file="${esc(id)}" alt="">`);
async function pickTaleGreens() {
  const cur = taleGreens().map((g) => ({ ...g }));
  const pool = [...TALE_GREEN_DEF, ...mediaItems().filter((m) => !m.illus && !String(m.fileId).startsWith('lib:')).map((m) => ({ fileId: m.fileId, cap: m.pname || m.title || '' }))];
  const seen = new Set(); const all = pool.filter((g) => (seen.has(g.fileId) ? false : seen.add(g.fileId)));
  const m = Modal.open({
    title: 'صور «ثم تخضرّ الأرض»', size: 'lg',
    body: `<p class="small muted" style="margin-bottom:12px">اختر الصور التي تظهر في الفصل الخامس بالترتيب، واكتب تحت كل صورة اسم المكان أو المشروع. يُفضَّل صور فعلية لمشاريع المؤسسة داخل المملكة.</p>
      <div class="tzp-sel" id="tzpSel"></div>
      <div class="row" style="justify-content:space-between;margin:14px 0 8px"><b class="small">صور المنصة</b><label class="btn sm">${icon('upload')} رفع صورة<input type="file" accept="image/*" multiple hidden id="tzpUp"></label></div>
      <div class="tzp-pool" id="tzpPool"></div>`,
    foot: `<button class="btn" data-x>إلغاء</button><button class="btn" data-def>بلا صور (الخريطة)</button><button class="btn primary" data-save>حفظ</button>`,
    onClose: () => {},
  });
  const thumb = (id) => taleImgTag(id).replace('class="tz-gi"', '');
  const draw = () => {
    $('#tzpSel', m.el).innerHTML = cur.length ? cur.map((g, i) => `<div class="tzp-it"><span class="tzp-n">${i + 1}</span>${thumb(g.fileId)}<input class="in" data-cap="${i}" value="${esc(g.cap || '')}" placeholder="المكان أو المشروع"><div class="tzp-b"><button class="icon-btn" data-up="${i}" title="تقديم" ${i ? '' : 'disabled'}>${icon('chevR')}</button><button class="icon-btn" data-rm="${i}" title="إزالة">${icon('x')}</button></div></div>`).join('') : '<p class="small muted">لم تُختر صور؛ يظهر في الفصل خريطة المملكة بمواقع المشاريع.</p>';
    $('#tzpPool', m.el).innerHTML = all.map((g) => `<button type="button" class="tzp-p ${cur.some((c) => c.fileId === g.fileId) ? 'on' : ''}" data-add="${esc(g.fileId)}">${thumb(g.fileId)}<span>${esc(g.cap || '')}</span></button>`).join('');
    hydrateFiles(m.el);
  };
  draw();
  m.el.addEventListener('input', (e) => { const c = e.target.closest('[data-cap]'); if (c) cur[+c.dataset.cap].cap = c.value; });
  m.el.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-add]'), r = e.target.closest('[data-rm]'), u = e.target.closest('[data-up]');
    if (a) { const g = all.find((x) => x.fileId === a.dataset.add); const k = cur.findIndex((c) => c.fileId === g.fileId); if (k >= 0) cur.splice(k, 1); else cur.push({ ...g }); draw(); }
    else if (r) { cur.splice(+r.dataset.rm, 1); draw(); }
    else if (u) { const i = +u.dataset.up; [cur[i - 1], cur[i]] = [cur[i], cur[i - 1]]; draw(); }
    else if (e.target.closest('[data-def]')) { cur.splice(0, cur.length); draw(); }
    else if (e.target.closest('[data-x]')) m.close();
    else if (e.target.closest('[data-save]')) {
      D.settings.taleGreens = cur.map((g) => ({ fileId: g.fileId, cap: (g.cap || '').trim(), ...(g.credit ? { credit: g.credit } : {}) }));
      await Repo.saveSettings(); m.close(); toast('حُفظت صور العرض'); route();
    }
  });
  $('#tzpUp', m.el).onchange = async (e) => {
    for (const f of [...e.target.files]) { try { const rec = await saveUpload(f); const g = { fileId: rec.id, cap: '' }; all.unshift(g); cur.push(g); } catch (err) { toast(err.message, 'err'); } }
    e.target.value = ''; draw();
  };
}

function renderTale(el) {
  const { nums, logos, photos, signed, projects } = taleData();
  const chs = taleChapters(nums, signed);
  const mapMode = !taleGreens().length;
  const lib = (k) => (IMG_LIB[k] || {}).src || '', img = (k) => (ASSET_IMG[k] || {}).src || '';
  const greens = taleGreens();
  el.classList.add('full');
  el.innerHTML = `<div class="tale2" id="tale">
    <div class="tz-stage">
      <div class="tz-bg tz-dunes" data-bg="dunes" style="background-image:url('${lib('dunes')}')"></div>
      <div class="tz-bg tz-depth" data-bg="depth"></div>
      <div class="tz-bg tz-photos" data-bg="photos">${photos.map(([k, t], i) => `<figure class="tz-ph" data-i="${i}"><img src="${img(k)}" alt=""><figcaption><i></i>${esc(t)}</figcaption></figure>`).join('')}</div>
      <div class="tz-bg tz-green" data-bg="green">${greens.map((g, i) => `<div class="tz-g" data-i="${i}">${taleImgTag(g.fileId)}<span class="tz-gcap"><i></i>${esc(g.cap || '')}${g.credit ? `<small>${esc(g.credit)}</small>` : ''}</span></div>`).join('')}</div>
      <div class="tz-bg tz-glow" data-bg="glow"></div>
      <canvas class="tz-cv" id="tzCv"></canvas>
      <div class="tz-method" id="tzMethod"><svg viewBox="0 0 10 400" preserveAspectRatio="none"><line x1="5" y1="0" x2="5" y2="400" class="b"/><line x1="5" y1="0" x2="5" y2="400" class="f" id="tzMLine"/></svg>
        ${['منهجية بناء الشراكات', 'التقييم المبدئي للشريك', 'صياغة المذكرة ومراجعتها', 'الاعتماد والتوقيع'].map((t, i) => `<div class="tz-m" style="top:${i * 33.3}%"><b>${['٠١', '٠٢', '٠٣', '٠٤'][i]}</b><span>${t}</span></div>`).join('')}</div>
      <div class="tz-proj" id="tzProj">${projects.map(([ic, t, d, n], i) => `<div class="tz-pj" data-i="${i}"><span class="tz-pj-ic">${icon(ic)}</span><div><b>${t}</b><small>${d}</small></div><em data-pjn="${i}" ${n ? '' : 'hidden'}>${n ? plural(n, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة') : ''}</em></div>`).join('')}</div>
      <div class="tz-orbit" id="tzOrbit">${img('murooj-logo-white') ? `<img class="tz-core" src="${img('murooj-logo-white')}" alt="">` : ''}
        ${logos.map((pr, k) => `<span class="tz-pl" data-k="${k}" title="${esc(pr.name)}">${plateHTML(pr, 48)}</span>`).join('')}</div>
      <div class="tz-count" id="tzCount"><b>0</b><span>${logos.length === 1 ? 'جهة شريكة' : 'جهة شريكة'}</span></div>
      <div class="tz-caps">${chs.map((c, i) => `<div class="tz-cap ${c.cls}" data-c="${i}" ${c.k ? `data-k="${c.k}"` : ''}>${c.eye ? `<small>${c.eye}</small>` : ''}${c.h ? `<h2>${c.h}</h2>` : ''}${c.s ? `<p>${c.s}</p>` : ''}</div>`).join('')}</div>
      <div class="tz-cta" id="tzCta">${can('proposal.create') ? `<a class="btn gold lg" href="#/share">${icon('send')} شارك بمقترح شراكة</a>` : ''}<a class="btn lg" href="#/partnerships">${icon('layers')} سجل الشراكات</a><button class="btn lg" type="button" data-tzreplay>${icon('history')} من البداية</button></div>
      <div class="tz-vig"></div><div class="tz-grain"></div>
      <div class="tz-ui"><button type="button" class="tz-play" data-tzplay>${icon('play')}<span>تشغيل</span></button><div class="tz-prog"><i id="tzProg"></i></div>${can('manage.content') && !App.share ? `<button type="button" class="tz-fs tz-pics" data-tzpics title="اختيار صور «ثم تخضرّ الأرض»">${icon('image')}<span>صور العرض</span></button>` : ''}<button type="button" class="tz-fs" data-tzfs title="ملء الشاشة (F)">${icon('expand')}<span>ملء الشاشة</span></button></div>
      <div class="tz-hint" id="tzHint"><i></i><span>مرّر للأسفل، أو اضغط «تشغيل» للعرض بملء الشاشة</span></div>
    </div>
  </div>`;
  hydrateFiles(el);
  taleRun(el, { nums, chs, projects, mapMode, nPartners: logos.length });
}

/* ===== محرك الجزيئات ===== */
function taleRun(el, { nums, chs, projects, mapMode, nPartners }) {
  const root = $('#tale', el), cv = $('#tzCv', el), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 760;
  const N = small ? 1500 : 2800;
  let W = 0, H = 0, DPR = 1, shapes = {}, ready = false, mapXY = () => [0, 0], spiral = [], halo = { cx: 0, cy: 0, R: 1 };
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
    /* خريطة المملكة: تعبئة خافتة وحدود مضيئة */
    { const lon0 = 34.4, lon1 = 55.8, lat0 = 16.2, lat1 = 32.3, k = Math.cos(24 * Math.PI / 180);
      const mw = small ? W * 0.86 : Math.min(W * 0.46, H * 0.74 * ((lon1 - lon0) * k) / (lat1 - lat0));
      const sc = mw / ((lon1 - lon0) * k), cx = small ? W * 0.5 : W * 0.29, cy = small ? H * 0.34 : H * 0.54;
      const mh = (lat1 - lat0) * sc;
      mapXY = (lon, lat) => [cx - mw / 2 + (lon - lon0) * k * sc, cy - mh / 2 + (lat1 - lat) * sc];
      const pts = [], cols = [];
      const path = new Path2D(); TALE_KSA.forEach(([a, b], i) => { const [x, y] = mapXY(a, b); i ? path.lineTo(x, y) : path.moveTo(x, y); }); path.closePath();
      const fill = sample((g) => { g.fillStyle = '#fff'; g.fill(path); }, 7);
      for (let i = 0; i < fill.pts.length; i += 2) { pts.push(fill.pts[i], fill.pts[i + 1]); cols.push(150, 128, 82); }
      for (let i = 0; i < TALE_KSA.length - 1; i++) { const [x1, y1] = mapXY(...TALE_KSA[i]), [x2, y2] = mapXY(...TALE_KSA[i + 1]); const n = Math.max(2, Math.hypot(x2 - x1, y2 - y1) / 2.2); for (let j = 0; j < n; j++) { pts.push(x1 + (x2 - x1) * j / n + (Math.random() - 0.5) * 1.5, y1 + (y2 - y1) * j / n + (Math.random() - 0.5) * 1.5); cols.push(...GOLD); } }
      shapes.ksa = fit({ pts, cols }); }
    /* الكوكبة: مواضع الجهات على حلزون حول شعار مروج */
    { const n = Math.max(1, nPartners), K0 = Math.max(10, Math.round(n * 0.32)), Rm = Math.min(W * 0.4, H * 0.27), c0 = Rm / Math.sqrt(n + K0);
      const cx = W / 2, cy = H * 0.53; spiral = [];
      for (let k = 0; k < n; k++) { const a = (k + K0) * 2.39996, r = c0 * Math.sqrt(k + K0); spiral.push([cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 0.92]); }
      const sz = Math.max(28, Math.min(52, c0 * 1.55));
      $$('.tz-pl', el).forEach((e, k) => { const q = spiral[k]; if (!q) return; e.style.left = (q[0] - cx) + 'px'; e.style.top = (q[1] - H * 0.53) + 'px'; e.style.setProperty('--sz', sz + 'px'); });
      halo = { cx, cy, R: Rm }; }
    ready = true; last = -1; tick(performance.now());
  };

  /* المواضع الحية (تتحرك مع الوقت) */
  const live = {
    dust: (i, t) => [((P.rx[i] * W + t * 8 * P.sp[i]) % W), (P.ry[i] * H + Math.sin(t * 0.3 + P.ph[i]) * 14)],
    wind: (i, t) => { const lane = P.ry[i]; const y0 = H * (0.62 + lane * 0.36); const x = W - ((P.rx[i] * (W + 200) + t * (40 + lane * 120) * P.sp[i]) % (W + 200)) + 100; return [x, y0 + Math.sin(x * 0.012 + P.ph[i]) * 16 * (1 - lane) - Math.sin(x * 0.004) * 30]; },
    warp: (i, t) => [P.rx[i] * W, H + 40 - ((P.ry[i] * (H + 80) + t * (260 + P.sp[i] * 520)) % (H + 80))],
    bokeh: (i, t) => [P.rx[i] * W + Math.sin(t * 0.2 + P.ph[i]) * 30, P.ry[i] * H + Math.cos(t * 0.17 + P.ph[i]) * 30],
    orbit: (i, t) => { const a = P.rx[i] * 6.283 + t * 0.04 * (i % 2 ? -1 : 1), r = halo.R * (1.08 + P.ry[i] * 0.22); return [halo.cx + Math.cos(a) * r * 1.18, halo.cy + Math.sin(a) * r * 0.86]; },
  };
  const liveCol = { dust: CREAM, wind: GOLD, warp: CREAM, bokeh: GOLD, orbit: GOLD };
  /* المسار: [بداية التحول، اكتماله، الشكل] */
  const keys = () => {
    const k = [[0, 0, 'dust'], [0.004, 0.034, 'title'], [0.058, 0.09, 'wind'], [0.19, 0.215, 'two'], [0.232, 0.262, 'rings'], [0.312, 0.34, 'warp'], [0.44, 0.47, 'bokeh'], ...(mapMode ? [[0.566, 0.596, 'ksa']] : []), [0.678, 0.712, 'logo']];
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

  /* مواقع المشاريع: تومض مع ظهور كل مشروع في القائمة، والمشروع الحالي أبرز */
  const mapPins = (p, t) => {
    const al = tlWin(p, 0.592, 0.69, 0.01); if (al <= 0) return;
    const curI = projects.reduce((c, _, i) => (p >= 0.592 + i * 0.016 ? i : c), -1);
    ctx.font = `600 ${small ? 11 : 13}px ${TL_FONT}`; ctx.textAlign = 'center'; ctx.direction = 'rtl';
    const done = new Set();
    projects.forEach((pj, i) => {
      if (i > curI) return;
      const on = i === curI, a = al * (on ? 1 : 0.45);
      (pj[4] || []).forEach(([lon, lat, name], j) => {
        const [x, y] = mapXY(lon, lat), key = name;
        const pulse = (t * 1.2 + j * 0.3) % 1;
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(x, y, 0, x, y, on ? 26 : 14); g.addColorStop(0, `rgba(170,230,150,${0.9 * a})`); g.addColorStop(1, 'rgba(170,230,150,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 30, y - 30, 60, 60);
        if (on) { ctx.strokeStyle = `rgba(190,240,170,${(1 - pulse) * 0.8 * a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 6 + pulse * 22, 0, 6.283); ctx.stroke(); }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(214,245,200,${a})`; ctx.beginPath(); ctx.arc(x, y, on ? 4 : 3, 0, 6.283); ctx.fill();
        if (on && !done.has(key)) { done.add(key); ctx.fillStyle = `rgba(251,244,226,${a})`; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 6; ctx.fillText(name, x, y - 12); ctx.shadowBlur = 0; }
      });
    });
  };
  const draw = (p, t) => {
    ctx.clearRect(0, 0, W, H);
    let ki = 0; for (let k = 0; k < K.length; k++) if (p >= K[k][0]) ki = k;
    const cur = K[ki], prev = K[Math.max(0, ki - 1)];
    const mt = ki === 0 ? 1 : tlS(p, cur[0], cur[1]);
    const morphing = mt < 1;
    const fade = cur[2] === 'bokeh' ? 0.45 : cur[2] === 'orbit' ? 0.55 : 1;
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
      if (streak && lt >= 1) { if (i % 3) continue; ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${(al * 0.42).toFixed(3)})`; ctx.fillRect(x, y, 0.8, 6 + P.sp[i] * 14); }
      else { const s = cur[2] === 'bokeh' ? 1.5 + P.sz[i] * 3.5 : (cur[2] === 'title' || cur[2].startsWith('num') || cur[2] === 'logo' ? 1.4 : 1) * (1 + P.sz[i] * 1.6); ctx.fillRect(x - s / 2, y - s / 2, s, s); }
    }
    ctx.globalCompositeOperation = 'source-over';
    traveler(p, t);
    if (mapMode) mapPins(p, t);
  };

  /* طبقات الصور والنصوص */
  const bgs = {}; $$('[data-bg]', el).forEach((b) => { bgs[b.dataset.bg] = b; });
  const plates = $$('.tz-pl', el), countEl = $('#tzCount', el), countB = $('#tzCount b', el), proj = $('#tzProj', el), pjs = $$('.tz-pj', el), caps = $$('.tz-cap', el), phs = $$('.tz-ph', el), gs = $$('.tz-g', el), mline = $('#tzMLine', el), meth = $('#tzMethod', el), orbit = $('#tzOrbit', el), cta = $('#tzCta', el);
  const layers = (p) => {
    bgs.dunes.style.opacity = (Math.min(tlWin(p, 0.06, 0.315, 0.03), 1) * 0.62).toFixed(3);
    bgs.dunes.style.transform = `scale(${(1.08 + tlS(p, 0.06, 0.32) * 0.18).toFixed(4)}) rotate(${(tlS(p, 0.06, 0.32) * -3).toFixed(3)}deg)`;
    bgs.depth.style.opacity = tlWin(p, 0.31, 0.45, 0.02).toFixed(3);
    bgs.photos.style.opacity = tlWin(p, 0.445, 0.565, 0.015).toFixed(3);
    const pn = phs.length || 1;
    phs.forEach((f, i) => { const a = 0.45 + i * (0.11 / pn), b = a + 0.11 / pn + 0.012; const v = tlWin(p, a, b, 0.012); f.style.opacity = v.toFixed(3); f.querySelector('img').style.transform = `scale(${(1.04 + tlS(p, a, b) * 0.12).toFixed(4)}) translateX(${(tlS(p, a, b) * -2).toFixed(2)}%)`; });
    bgs.green.style.opacity = (mapMode ? 0 : tlWin(p, 0.565, 0.705, 0.012)).toFixed(3);
    const gstep = 0.12 / Math.max(1, gs.length); gs.forEach((g, i) => { const a = 0.57 + i * gstep; const r = tlE(tlS(p, a, a + Math.min(0.035, gstep * 0.7))) * 150; g.classList.toggle('on', p > a + 0.02 && (i === gs.length - 1 || p < a + gstep)); g.style.clipPath = `circle(${r.toFixed(2)}% at ${i % 2 ? 38 : 62}% ${i % 2 ? 55 : 45}%)`; g.style.transform = `scale(${(1.15 - tlS(p, a, 0.7) * 0.12).toFixed(4)})`; });
    bgs.glow.style.opacity = tlWin(p, 0.68, 1.2, 0.03).toFixed(3);
    meth.style.opacity = tlWin(p, 0.335, 0.435, 0.012).toFixed(3);
    proj.style.opacity = tlWin(p, 0.585, 0.69, 0.01).toFixed(3);
    pjs.forEach((x, i) => x.classList.toggle('on', p >= 0.592 + i * 0.016));
    const ml = tlS(p, 0.345, 0.42); mline.style.strokeDashoffset = (400 - ml * 400).toFixed(1);
    $$('.tz-m', meth).forEach((m, i) => m.classList.toggle('on', ml >= i / 3 - 0.001));
    orbit.style.opacity = tlS(p, 0.893, 0.91).toFixed(3); orbit.classList.toggle('on', p > 0.893);
    { const n = plates.length, shown = p < 0.9 ? 0 : Math.min(n, Math.ceil(tlS(p, 0.9, 0.968) * n));
      plates.forEach((e, k) => e.classList.toggle('in', k < shown));
      countEl.style.opacity = tlS(p, 0.895, 0.91).toFixed(3); countB.textContent = shown.toLocaleString('ar-SA-u-nu-latn'); }
    cta.classList.toggle('on', p > 0.972);
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
    const DUR = 92000; let st = null; const p0 = getP();
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
  const picsBtn = $('[data-tzpics]', el); if (picsBtn) picsBtn.onclick = () => pickTaleGreens();
  fsBtn.onclick = toggleCinema;
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.documentElement.classList.contains('tz-cinema')) { cinema(false); fsBtn.classList.remove('on'); $('span', fsBtn).textContent = 'ملء الشاشة'; } });
  addEventListener('hashchange', () => document.documentElement.classList.remove('tz-cinema'), { once: true });
  /* تحديث حي: إن تغيّرت أرقام المنصة أثناء العرض تتبدّل الأرقام في مكانها دون إعادة الفيلم */
  root.__tzLive = () => {
    const d = taleData();
    if (d.nums.length !== nums.length) return false;
    const sc = $('[data-k="signed"] p', el); if (sc) sc.textContent = taleChapters(d.nums, d.signed).find((c) => c.k === 'signed').s;
    d.projects.forEach((pj, i) => { const n = pj[3], e = $(`[data-pjn="${i}"]`, el); if (!e) return; e.hidden = !n; if (n) e.textContent = plural(n, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة'); });
    if (d.nums.every((n, i) => n[0] === nums[i][0])) return true;
    d.nums.forEach((n, i) => { nums[i] = n; });
    shapes.nums = nums.map(([v]) => textShape(Number(v).toLocaleString('ar-SA-u-nu-latn'), Math.min(H * 0.46, W / 3.2), H * 0.42, GOLD, 800));
    last = -1; kick(); return true;
  };
  build();
}
