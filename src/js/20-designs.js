/* ===== اتجاها التصميم: المؤسسي والمجلس ===== */
const DESIGNS = {
  classic: { name: 'القائمة الجانبية', short: 'جانبية', tag: 'القوائم على الجانب — مناسب للعمل اليومي',
    desc: 'التصميم الحالي: قائمة جانبية، وواجهة بصورة وأرقام، ولوحة مؤشرات في بطاقات.',
    traits: ['قائمة جانبية قابلة للطي', 'خط IBM Plex Sans Arabic', 'لوحات وبطاقات بحواف ناعمة'] },
  board: { name: 'القائمة العلوية', short: 'علوية', tag: 'القوائم في الأعلى بمساحة أعرض — مناسب للعرض على القيادات',
    desc: 'واجهة رسمية بخلفية عاجية وأخضر مروج وخطوط ذهبية، وعناوين بخط النسخ، ولوحة «إحاطة المجلس» بفصول مرقّمة: رسائل رئيسية، وأثر بالرموز، وشبكة الشركاء، وتدفق المحفظة، ومسار زمني، وقرارات مطلوبة، مع وضع عرض تقديمي.',
    traits: ['ترويسة رسمية بالتاريخين الهجري والميلادي', 'إحاطة بفصول مرقّمة وعرض تقديمي', 'رسوم تروي القصة: رموز وشبكة وتدفق ومسار زمني'] },
};
const design = () => { const d = D.settings && D.settings.design; return DESIGNS[d] ? d : 'classic'; };
function applyDesignAttr() { document.documentElement.dataset.design = design(); if (typeof applyTheme === 'function') applyTheme(); }

/* معاينات مصغرة تعبّر عن تكوين كل اتجاه */
function designPreviewSVG(k) {
  if (k === 'board') return `<svg viewBox="0 0 240 150" class="dprev" aria-hidden="true"><rect width="240" height="150" fill="#F7F4EC"/><rect width="240" height="3" fill="#A47C32"/>
    <rect y="3" width="240" height="18" fill="#FFFFFF"/><rect x="204" y="7" width="28" height="10" rx="2" fill="#0F4433"/><rect x="150" y="9" width="44" height="5" rx="1" fill="#14201B"/><rect x="8" y="9" width="40" height="5" rx="2" fill="#E6E1D5"/>
    <rect y="21" width="240" height="10" fill="#FFFFFF"/><rect y="31" width="240" height=".8" fill="#D6CFBE"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${200 - i * 34}" y="24" width="26" height="4" rx="1" fill="${i === 1 ? '#0F4433' : '#B7B09F'}"/>`).join('')}
    <rect x="10" y="38" width="220" height="40" rx="2" fill="#0F4433"/><rect x="150" y="46" width="70" height="8" rx="1" fill="#F7F4EC"/><rect x="176" y="58" width="44" height="4" rx="1" fill="#D9C08A"/><rect x="18" y="46" width="60" height="5" rx="2.5" fill="#A47C32"/>
    ${[0, 1, 2].map((i) => `<rect x="${158 - i * 74}" y="84" width="68" height="28" rx="2" fill="#FFFFFF" stroke="#E6E1D5"/><text x="${218 - i * 74}" y="98" font-size="8" font-weight="700" fill="#A47C32" text-anchor="end">0${i + 1}</text><rect x="${166 - i * 74}" y="102" width="${40 - i * 6}" height="3" rx="1" fill="#14201B"/>`).join('')}
    <circle cx="120" cy="132" r="13" fill="none" stroke="#E6E1D5" stroke-width="3"/><circle cx="120" cy="132" r="13" fill="none" stroke="#0F4433" stroke-width="3" stroke-dasharray="58 82" transform="rotate(-90 120 132)"/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="${170 + Math.cos(i * 1.25) * 20}" cy="${132 + Math.sin(i * 1.25) * 9}" r="3" fill="${i % 2 ? '#A47C32' : '#2F7A5E'}"/><line x1="200" y1="132" x2="${170 + Math.cos(i * 1.25) * 20}" y2="${132 + Math.sin(i * 1.25) * 9}" stroke="#B7B09F" stroke-width=".6"/>`).join('')}
    <path d="M20 140 C40 120 60 145 80 126" fill="none" stroke="#A47C32" stroke-width="5" opacity=".55"/></svg>`;
  return `<svg viewBox="0 0 240 150" class="dprev" aria-hidden="true"><rect width="240" height="150" fill="#F3F6F5"/>
    <defs><linearGradient id="pvc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B3F38"/><stop offset="1" stop-color="#082622"/></linearGradient></defs>
    <rect x="196" width="44" height="150" fill="url(#pvc)"/>${[18, 30, 42, 54, 66, 78].map((y, i) => `<rect x="204" y="${y}" width="28" height="5" rx="2" fill="${i === 1 ? '#7FD8A6' : '#3E6B62'}"/>`).join('')}
    <rect width="196" height="12" fill="#F3F6F5"/><rect x="60" y="3" width="70" height="6" rx="3" fill="#FFFFFF" stroke="#E1E9E6"/>
    <rect x="8" y="18" width="180" height="56" rx="6" fill="#0B3F38"/><rect x="104" y="30" width="72" height="8" rx="2" fill="#F2F7F5"/><rect x="124" y="42" width="52" height="8" rx="2" fill="#F2F7F5"/><rect x="146" y="56" width="30" height="8" rx="4" fill="#F2F7F5"/>
    <rect x="14" y="66" width="168" height="20" rx="3" fill="#FFFFFF" stroke="#E1E9E6"/>${[0, 1, 2, 3].map((i) => `<rect x="${154 - i * 40}" y="71" width="18" height="7" rx="1" fill="#0B3F38"/>`).join('')}
    <rect x="8" y="94" width="180" height="50" rx="4" fill="#FFFFFF" stroke="#E1E9E6"/><rect x="100" y="100" width="82" height="38" rx="2" fill="#E3EEEA"/><rect x="14" y="100" width="80" height="6" rx="2" fill="#16222A"/><rect x="14" y="112" width="64" height="4" rx="2" fill="#8AA097"/><rect x="14" y="122" width="40" height="8" rx="2" fill="#B08A3E"/></svg>`;
}

/* تبديل الاتجاه مع الحفاظ على الصفحة والفلاتر والدور */
async function applyDesign(id) {
  if (!DESIGNS[id] || id === design()) return;
  if (App.dirty && !(await confirmDlg('في النموذج تعديلات لم تُحفظ. تبديل شكل المنصة سيعيد عرض الصفحة وتُفقد هذه التعديلات.', { title: 'تعديلات غير محفوظة', ok: 'تبديل الاتجاه', danger: true }))) return;
  App.dirty = false;
  const ratio = (scrollY || 0) / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  D.settings.design = id;
  const run = () => {
    applyDesignAttr();
    renderShell();
    route();
    requestAnimationFrame(() => window.scrollTo(0, ratio * Math.max(0, document.documentElement.scrollHeight - innerHeight)));
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduce) { try { document.startViewTransition(run); } catch (_) { run(); } }
  else { document.documentElement.classList.add('design-swap'); run(); setTimeout(() => document.documentElement.classList.remove('design-swap'), 450); }
  await Repo.saveSettings();
  await Repo.log('settings.update', 'settings', 'design', 'شكل المنصة', DESIGNS[id].name);
  toast(`شكل المنصة: ${DESIGNS[id].name}`);
}
function renderDesignSwitcher() {
  let el = $('#dsw');
  if (!el) {
    el = document.createElement('div'); el.id = 'dsw'; el.className = 'dsw no-print'; document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-dsw-toggle]')) { el.classList.toggle('open'); return; }
      const o = e.target.closest('[data-dsw]'); if (o) { el.classList.remove('open'); applyDesign(o.dataset.dsw); return; }
      if (e.target.closest('[data-tour-start]')) { el.classList.remove('open'); startTour(); }
      if (e.target.closest('[data-rqtour-start]')) { el.classList.remove('open'); startReqTour(); }
    });
    document.addEventListener('mousedown', (e) => { if (!e.target.closest('#dsw')) el.classList.remove('open'); });
  }
  el.innerHTML = `<button class="dsw-fab" data-dsw-toggle type="button" title="شكل المنصة — Alt+1 / Alt+2" aria-label="تبديل شكل المنصة">${icon('palette')}<span>${DESIGNS[design()].short}</span></button>
    <div class="dsw-pop" role="menu" aria-label="شكل المنصة"><div class="dsw-h">شكل المنصة</div>
      ${Object.entries(DESIGNS).map(([k, d], i) => `<button class="dsw-o ${k === design() ? 'on' : ''}" data-dsw="${k}" type="button" role="menuitemradio" aria-checked="${k === design()}"><span class="dsw-sw dsw-${k}"></span><span class="grow"><b>${d.name}</b><small>${d.tag}</small></span><kbd>Alt+${i + 1}</kbd></button>`).join('')}
      <div class="dsw-sep"></div><button class="dsw-o" data-tour-start type="button"><span class="dsw-sw dsw-tour">${icon('play')}</span><span class="grow"><b>استعراض المنصة</b><small>جولة تعريفية في الشكل الحالي</small></span><kbd>Alt+T</kbd></button><button class="dsw-o" data-rqtour-start type="button"><span class="dsw-sw dsw-tour">${icon('convert')}</span><span class="grow"><b>مسار طلب الشراكة</b><small>من «شارك» حتى القرار</small></span></button></div>`;
}
document.addEventListener('keydown', (e) => {
  if (!e.altKey || e.ctrlKey || e.metaKey) return;
  if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
  const map = { Digit1: 'classic', Digit2: 'board' };
  if (map[e.code]) { e.preventDefault(); applyDesign(map[e.code]); }
  else if (e.code === 'KeyT' && typeof startTour === 'function' && !App.tour) { e.preventDefault(); startTour(); }
});

/* ===== الصورة الرئيسية: حركة وتفاعل ===== */
function heroMediaHTML(extraCls = '') {
  const h = D.settings.home, o = D.settings.org;
  return `<div class="hfx-media ${extraCls}">${h.heroImageFileId ? `<img class="hfx-img photo" data-file="${esc(h.heroImageFileId)}" alt="">` : `<div class="hfx-topo">${topoSVG('hero-' + (o.name || ''), { W: 1600, H: 900, levels: 22, cols: 92, focus: 'left' })}</div>`}</div>${h.heroImageFileId && h.heroImageFileId.startsWith('lib:') ? '<span class="illus hero-illus">صورة توضيحية</span>' : ''}`;
}
/* أرقام حيّة محسوبة لحظة العرض من السجلات: تتغير فور إضافة جهة أو شراكة أو انتهاء شراكة */
const nounFor = (n, f) => (n === 1 ? f[0] : n === 2 ? f[1] : n >= 3 && n <= 10 ? f[2] : f[3]);
function liveCounts() {
  const list = visiblePartnerships({ includeDrafts: false });
  const st = (k) => list.filter((p) => k.includes(pStatus(p))).length;
  const linked = new Set(list.map((p) => p.partnerId));
  const anyLinked = new Set(D.partnerships.map((p) => p.partnerId));
  const partners = D.partners.filter((pr) => linked.has(pr.id) || (!anyLinked.has(pr.id) && !pr.target && (showDemo() || !pr.demo))).length; // الجهات المستهدفة لا تُعد جهات شريكة
  return { active: st(['active', 'soon']), soon: st(['soon']), ended: st(['ended']), partners, total: list.length };
}
function heroBeacons() {
  const c = liveCounts(), X = D.settings.expiryDays;
  return [
    { v: c.active, l: nounFor(c.active, ['شراكة سارية', 'شراكتان ساريتان', 'شراكات سارية', 'شراكة سارية']), href: '#/partnerships?status=active|soon' },
    { v: c.partners, l: nounFor(c.partners, ['جهة شريكة', 'جهتان شريكتان', 'جهات شريكة', 'جهة شريكة']), href: can('view.partners') ? '#/partners' : '#/partnerships' },
    { v: c.soon, l: `${nounFor(c.soon, ['شراكة تنتهي', 'شراكتان تنتهيان', 'شراكات تنتهي', 'شراكة تنتهي'])} خلال ${X} يومًا`, href: '#/partnerships?status=soon' },
    { v: c.ended, l: nounFor(c.ended, ['شراكة منتهية', 'شراكتان منتهيتان', 'شراكات منتهية', 'شراكة منتهية']), href: '#/partnerships?status=ended' },
  ];
}
function initHeroFX(box, positions) {
  if (!box || box._fx) return; box._fx = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lines = document.createElement('div'); lines.className = 'hfx-lines';
  lines.innerHTML = topoSVG('hfx-' + design(), { W: 1600, H: 900, levels: 9, cols: 64, focus: 'any', draw: !reduce, cls: 'topo hfx-svg' });
  const bc = document.createElement('div'); bc.className = 'hfx-beacons';
  bc.innerHTML = heroBeacons().slice(0, positions.length).map((b, i) => `<a class="hfx-b" href="${b.href}" style="--x:${positions[i][0]}%;--y:${positions[i][1]}%;--d:${(i * 0.7).toFixed(1)}s" title="${esc(b.v + ' ' + b.l)}"><i></i><span><b>${esc(b.v)}</b>${esc(b.l)}</span></a>`).join('');
  const sweep = document.createElement('div'); sweep.className = 'hfx-sweep';
  box.append(lines, sweep, bc);
  if (reduce) return;
  heroExtras(box, positions);
  box.classList.add('hfx-on');
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
  const tick = () => {
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    box.style.setProperty('--mx', cx.toFixed(4)); box.style.setProperty('--my', cy.toFixed(4));
    raf = Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008 ? requestAnimationFrame(tick) : null;
  };
  const host = box.closest('section') || box;
  host.addEventListener('mousemove', (e) => { const r = box.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; if (!raf) raf = requestAnimationFrame(tick); });
  host.addEventListener('mouseleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  const onScroll = () => { if (!box.isConnected) { window.removeEventListener('scroll', onScroll); return; } const r = box.getBoundingClientRect(); box.style.setProperty('--sy', Math.max(-1, Math.min(1, -r.top / Math.max(1, r.height))).toFixed(3)); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

/* ===== الرئيسية — حكاية الأثر ===== */
function setDesignTab(b) {
  const cur = design();
  b.innerHTML = `<div class="panel" data-tour="settings-design"><div class="panel-h"><h3>شكل المنصة</h3><span class="sub">يُطبَّق على المنصة كلها ويُحفظ في هذا المتصفح</span></div><div class="panel-b">
      <div class="dcards">${Object.entries(DESIGNS).map(([k, d], i) => `<div class="dcard ${k === cur ? 'on' : ''}" data-dk="${k}">
        <div class="dcard-prev">${designPreviewSVG(k)}${k === cur ? `<span class="dcard-on">${icon('check')} مفعّل</span>` : ''}</div>
        <div class="dcard-b"><h4>${i + 1}. ${d.name}</h4><p>${d.desc}</p><ul>${d.traits.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <button class="btn ${k === cur ? '' : 'primary'}" data-pickdesign="${k}" type="button" ${k === cur ? 'disabled' : ''}>${k === cur ? 'الشكل الحالي' : 'اختيار هذا الشكل'}</button></div></div>`).join('')}</div>
      <div class="note" style="margin-top:16px">${icon('info')}<span>يحتفظ التبديل بالصفحة الحالية والفلاتر والدور، والبيانات مشتركة بين الاتجاهات. للتبديل السريع أثناء العرض استخدم زر «اتجاه التصميم» أسفل الشاشة، أو الاختصارات Alt+1 وAlt+2 وAlt+3.</span></div></div></div>`;
  b.onclick = (e) => { const k = e.target.closest('[data-pickdesign]'); if (k) applyDesign(k.dataset.pickdesign); };
}
