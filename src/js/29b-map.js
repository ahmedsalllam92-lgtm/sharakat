/* =====================================================================
   خريطة الشراكات التفاعلية: الشراكات على مناطق المملكة الثلاث عشرة
   — المنطقة من حقل «المنطقة» في الشراكة، وإن لم تُحدَّد تُستنتج من اسم الجهة ونصوص الشراكة (وتظهر «مستنتجة»).
   — فقاعة لكل منطقة بحجم عدد شراكاتها، وخطوط من الرياض (مقر المؤسسة)، ولوحة جانبية بالشراكات عند النقر.
   ===================================================================== */
const KSA_NATIONAL = 'على مستوى المملكة';
const KSA_REGIONS = [
  ['الرياض', 46.72, 24.69, ['الرياض', 'الخرج', 'الدرعية', 'المجمعة', 'الزلفي', 'وادي الدواسر', 'الدوادمي', 'شقراء', 'القويعية', 'عفيف']],
  ['مكة المكرمة', 40.2, 21.6, ['مكة', 'جدة', 'الطائف', 'رابغ', 'الليث', 'القنفذة', 'الكامل', 'خليص', 'الهدا', 'الشفا']],
  ['المدينة المنورة', 39.3, 24.9, ['المدينة المنورة', 'ينبع', 'العلا', 'خيبر', 'الحناكية']],
  ['القصيم', 43.97, 26.33, ['القصيم', 'بريدة', 'عنيزة', 'الرس', 'البكيرية']],
  ['المنطقة الشرقية', 49.6, 25.6, ['المنطقة الشرقية', 'الدمام', 'الخبر', 'الظهران', 'الأحساء', 'الاحساء', 'الهفوف', 'الجبيل', 'القطيف', 'حفر الباطن', 'الخفجي', 'رأس تنورة']],
  ['عسير', 42.6, 18.6, ['عسير', 'أبها', 'ابها', 'خميس مشيط', 'بيشة', 'النماص', 'تنومة', 'السودة', 'محايل', 'رجال ألمع']],
  ['تبوك', 36.6, 28.1, ['تبوك', 'نيوم', 'أملج', 'ضباء', 'تيماء']],
  ['حائل', 41.7, 27.5, ['حائل']],
  ['الحدود الشمالية', 41.6, 30.4, ['الحدود الشمالية', 'عرعر', 'طريف', 'رفحاء']],
  ['جازان', 42.6, 17.1, ['جازان', 'جيزان', 'فرسان', 'صبيا', 'أبو عريش', 'صامطة']],
  ['نجران', 45.0, 17.9, ['نجران', 'شرورة']],
  ['الباحة', 41.47, 20.0, ['الباحة', 'بلجرشي', 'المندق', 'رغدان']],
  ['الجوف', 39.3, 29.9, ['الجوف', 'سكاكا', 'دومة الجندل', 'القريات']],
];
const KSA_REGION_NAMES = [KSA_NATIONAL, ...KSA_REGIONS.map((r) => r[0])];
/* كلمة كاملة (مع حروف الجر الملتصقة) — حتى لا تُطابق «الرس» داخل «الرسمي» */
const MAP_RE = {}; const mapWordRe = (k) => MAP_RE[k] || (MAP_RE[k] = new RegExp(`(^|[^\\u0600-\\u06FF])[وبلف]?${mapNorm(k)}(?=$|[^\\u0600-\\u06FF])`, 'g'));
const mapNorm = (s) => String(s || '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
/* منطقة الشراكة: المحددة، أو المستنتجة من النصوص */
function pRegion(p) {
  if (p.region) return { r: p.region, inferred: false };
  const pr = partnerById(p.partnerId);
  const txt = mapNorm([pr && pr.name, p.title, p.cooperationAreas, p.outputs, p.expectedImpact, p.notes].map((x) => (typeof x === 'string' ? x : JSON.stringify(x || ''))).join(' '));
  let best = null, bestN = 0;
  for (const [name, , , kws] of KSA_REGIONS) { const n = kws.reduce((t, k) => t + (txt.match(mapWordRe(k)) || []).length, 0); if (n > bestN) { bestN = n; best = name; } }
  if (best) return { r: best, inferred: true };
  if (/المملكه|كافه المناطق|جميع المناطق|وطني|الوطنيه|السعوديه/.test(txt)) return { r: KSA_NATIONAL, inferred: true };
  return { r: '', inferred: true };
}

function renderMap(el) {
  const st = App.map = App.map || { sel: '', status: '' };
  const canEdit = can('edit.partnership') && !App.share;
  const STATUS = [['', 'الكل'], ['active', 'سارية'], ['soon', 'تنتهي قريبًا'], ['expired', 'منتهية'], ['prep', 'قيد الإعداد']];
  const base = visiblePartnerships().filter((p) => !p.isDraft && p.stage !== 'cancel');
  const draw = () => {
    const list = base.filter((p) => !st.status || (st.status === 'prep' ? ['prep', 'sign'].includes(pStatus(p)) : pStatus(p) === st.status));
    const R = {}; list.forEach((p) => { const g = pRegion(p); (R[g.r || ''] = R[g.r || ''] || []).push({ p, inferred: g.inferred }); });
    const max = Math.max(1, ...KSA_REGIONS.map(([n]) => (R[n] || []).length));
    /* الإسقاط: نفس إسقاط «حكاية الشراكة» */
    const W = 1000, H = 760, lon0 = 34.4, lon1 = 55.8, lat0 = 16.2, lat1 = 32.3, k = Math.cos(24 * Math.PI / 180);
    const sc = Math.min((W - 60) / ((lon1 - lon0) * k), (H - 60) / (lat1 - lat0));
    const ox = (W - (lon1 - lon0) * k * sc) / 2, oy = (H - (lat1 - lat0) * sc) / 2;
    const xy = (lon, lat) => [ox + (lon - lon0) * k * sc, oy + (lat1 - lat) * sc];
    const path = TALE_KSA.map(([a, b], i) => { const [x, y] = xy(a, b); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + 'Z';
    const [hx, hy] = xy(46.72, 24.69);
    const bubbles = KSA_REGIONS.map(([n, lon, lat], i) => {
      const L_ = R[n] || [], c = L_.length, [x, y] = xy(lon, lat), r = c ? 14 + Math.sqrt(c / max) * 30 : 6;
      const act = L_.filter((o) => ['active', 'soon'].includes(pStatus(o.p))).length;
      const arc = n === 'الرياض' || !c ? '' : `<path class="mp-arc" d="M${hx.toFixed(1)} ${hy.toFixed(1)} Q${((hx + x) / 2).toFixed(1)} ${(Math.min(hy, y) - 60).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}" style="--i:${i}"/>`;
      return { arc, g: `<g class="mp-reg ${st.sel === n ? 'on' : ''} ${c ? '' : 'zero'}" data-reg="${esc(n)}" style="--i:${i}" tabindex="0" role="button" aria-label="${esc(n)}: ${c} شراكة">
        ${c ? `<circle class="mp-pulse" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>` : ''}
        <circle class="mp-b" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" style="--a:${c ? (act / c).toFixed(2) : 0}"/>
        ${c ? `<text class="mp-n" x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}">${c}</text>` : ''}
        <text class="mp-l" x="${x.toFixed(1)}" y="${(y + r + 18).toFixed(1)}">${esc(n)}</text></g>` };
    });
    const nat = R[KSA_NATIONAL] || [], none = R[''] || [];
    const inferredN = list.filter((p) => !p.region && pRegion(p).r).length;
    const sel = st.sel, items = sel ? (R[sel] || []) : [];
    const secs = (L_) => { const m = {}; L_.forEach((o) => { const s = pSector(o.p) || 'غير محدد'; m[s] = (m[s] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const top = KSA_REGIONS.map(([n]) => [n, (R[n] || []).length]).filter((x) => x[1]).sort((a, b) => b[1] - a[1]);
    const row = ({ p, inferred }) => { const pr = partnerById(p.partnerId); return `<a class="mp-row" href="#/partnerships/${p.id}">${plateHTML(pr, 40)}<span class="mp-rt"><b>${esc(partnerName(p))}</b><small>${esc(p.code || '')}${inferred ? ' · <em>منطقة مستنتجة</em>' : ''}</small></span>${statusChip(p)}</a>`; };
    const panel = sel ? `<div class="mp-ph"><button class="icon-btn" type="button" data-mpclose title="رجوع">${icon('chevR')}</button><div><h3>${esc(sel)}</h3><small>${plural(items.length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')}</small></div></div>
        ${items.length ? `<div class="mp-secs">${secs(items).map(([s, n]) => `<span><i style="background:${SEC_VAR(s)}"></i>${esc(s)} <b>${n}</b></span>`).join('')}</div><div class="mp-list">${items.map(row).join('')}</div>` : '<p class="muted small">لا توجد شراكات في هذه المنطقة ضمن التصفية الحالية.</p>'}`
      : `<div class="mp-ph"><div><h3>المناطق</h3><small>اضغط على أي منطقة لعرض شراكاتها</small></div></div>
        <div class="mp-rank">${top.map(([n, c]) => `<button type="button" data-reg="${esc(n)}"><span>${esc(n)}</span><i style="width:${(c / (top[0] ? top[0][1] : 1) * 100).toFixed(0)}%"></i><b>${c}</b></button>`).join('') || '<p class="muted small">لا توجد شراكات بمنطقة محددة بعد.</p>'}</div>
        ${nat.length ? `<button type="button" class="mp-nat" data-reg="${KSA_NATIONAL}">${icon('flag')}<span><b>${KSA_NATIONAL}</b><small>شراكات يمتد أثرها لكل المناطق</small></span><b>${nat.length}</b></button>` : ''}
        ${none.length ? `<div class="mp-none"><b>${icon('info')} ${plural(none.length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')} بلا منطقة</b>${canEdit ? '<span>حدّد منطقتها لتظهر على الخريطة:</span>' : ''}
          <div class="mp-list">${none.slice(0, 40).map(({ p }) => `<div class="mp-row ro"><a href="#/partnerships/${p.id}">${esc(partnerName(p))}</a>${canEdit ? `<select class="in sm" data-setreg="${p.id}"><option value="">المنطقة…</option>${KSA_REGION_NAMES.map((n) => `<option>${esc(n)}</option>`).join('')}</select>` : ''}</div>`).join('')}</div></div>` : ''}`;
    el.innerHTML = `<div class="ph"><div><h1>خريطة الشراكات</h1><p>انتشار الشراكات على مناطق المملكة. ${inferredN ? `${plural(inferredN, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')} مستنتجة المنطقة من اسم الجهة ونصوص الشراكة — حدّدها من نموذج الشراكة لتثبيتها.` : ''}</p></div></div>
      <div class="mp-bar"><div class="seg">${STATUS.map(([k, l]) => `<button type="button" class="${st.status === k ? 'on' : ''}" data-mpst="${k}">${l}</button>`).join('')}</div>
        <div class="mp-legend"><span><i class="lg-a"></i>سارية</span><span><i class="lg-o"></i>أخرى</span><span><i class="lg-hq"></i>مقر المؤسسة</span></div></div>
      <div class="mp-wrap"><div class="mp-map panel"><svg viewBox="0 0 ${W} ${H}" class="mp-svg ${st.seen ? 'seen' : ''}" role="img" aria-label="خريطة المملكة بالشراكات">
          <defs><radialGradient id="mpG" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="var(--mp-land2)"/><stop offset="1" stop-color="var(--mp-land)"/></radialGradient>
            <pattern id="mpDots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" class="mp-dot"/></pattern></defs>
          <path class="mp-land" d="${path}"/><path class="mp-dots" d="${path}"/><path class="mp-edge" d="${path}"/>
          ${bubbles.map((b) => b.arc).join('')}
          <g class="mp-hq"><circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="5"/><circle class="mp-hq-r" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="5"/></g>
          ${bubbles.map((b) => b.g).join('')}
        </svg><div class="mp-tip" id="mpTip" hidden></div></div>
        <aside class="mp-side panel">${panel}</aside></div>`;
    hydrateFiles(el);
    st.seen = true;
  };
  st.seen = false;
  draw();
  el.onclick = (e) => {
    const g = e.target.closest('[data-reg]'); if (g) { st.sel = st.sel === g.dataset.reg ? '' : g.dataset.reg; return draw(); }
    if (e.target.closest('[data-mpclose]')) { st.sel = ''; return draw(); }
    const s = e.target.closest('[data-mpst]'); if (s) { st.status = s.dataset.mpst; return draw(); }
  };
  el.onkeydown = (e) => { const g = e.target.closest('[data-reg]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.click(); } };
  el.onchange = async (e) => {
    const s = e.target.closest('[data-setreg]'); if (!s || !s.value) return;
    const p = D.partnerships.find((x) => x.id === s.dataset.setreg); if (!p) return;
    p.region = s.value; await Repo.save('partnerships', p); await Repo.log('partnership.update', 'partnership', p.id, p.code, 'المنطقة: ' + p.region);
    toast(`حُددت منطقة ${partnerName(p)}: ${p.region}`); draw();
  };
  el.onmousemove = (e) => {
    const tip = $('#mpTip', el); if (!tip) return;
    const g = e.target.closest('.mp-reg');
    if (!g) { tip.hidden = true; return; }
    const n = g.dataset.reg, L_ = base.filter((p) => pRegion(p).r === n);
    const act = L_.filter((p) => ['active', 'soon'].includes(pStatus(p))).length;
    tip.innerHTML = `<b>${esc(n)}</b><span>${plural(L_.length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')}${L_.length ? ` · ${act} سارية` : ''}</span>`;
    const r = $('.mp-map', el).getBoundingClientRect(); tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top - 14) + 'px'; tip.hidden = false;
  };
}
