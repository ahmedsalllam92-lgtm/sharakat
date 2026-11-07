/* ===== طباعة لوحة المؤشرات: صفحة واحدة كبيرة (A3 أفقي) بكل الأرقام والرسوم المهمة ===== */
const PS_C = { petrol: '#0B3F38', petrol2: '#1F6B5C', mint: '#5FB894', sage: '#A7CBBE', gold: '#B08A3E', sand: '#E8D6AE', clay: '#C2683F', ink: '#16222A', ink2: '#3B4B52', mut: '#6B7F78', line: '#DCE5E1', paper: '#F5F8F7' };
const PS_ST = { active: '#1F6B5C', soon: '#C9973B', upcoming: '#8FC2AF', sign: '#B9A27A', prep: '#7D9590', hold: '#D9B467', nodates: '#C5CFCB', ended: '#C9D2CE', cancel: '#B5533C' };
const PS_SEC = (s) => ({ 'حكومي': '#0B3F38', 'خاص': '#B08A3E', 'غير ربحي': '#5FB894' }[s] || '#B7C4BF');

function psDonut(parts, { size = 210, th = 34, center = '', sub = '' } = {}) {
  const tot = parts.reduce((t, p) => t + p.n, 0) || 1, r = size / 2 - th / 2 - 2, C = 2 * Math.PI * r, cx = size / 2;
  let off = 0;
  const segs = parts.map((p) => { const len = p.n / tot * C; const s = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${p.c}" stroke-width="${th}" stroke-dasharray="${Math.max(0, len - 2.5).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})"/>`; off += len; return s; }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${PS_C.paper}" stroke-width="${th}"/>${segs}<text x="${cx}" y="${cx + 6}" text-anchor="middle" font-size="44" font-weight="700" fill="${PS_C.ink}">${center}</text><text x="${cx}" y="${cx + 32}" text-anchor="middle" font-size="15" fill="${PS_C.mut}">${sub}</text></svg>`;
}
function psGauge(v, { size = 190, label = '' } = {}) {
  const r = size / 2 - 18, cx = size / 2, cy = size / 2 + 10, a0 = Math.PI, a1 = 0;
  const pt = (a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const arc = (from, to) => { const [x0, y0] = pt(from), [x1, y1] = pt(to); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  const av = a0 - (Math.min(100, Math.max(0, v)) / 100) * Math.PI;
  return `<svg width="${size}" height="${size * 0.68}" viewBox="0 0 ${size} ${size * 0.68}"><path d="${arc(a0, a1)}" fill="none" stroke="${PS_C.paper}" stroke-width="20" stroke-linecap="round"/><path d="${arc(a0, av)}" fill="none" stroke="${v >= 85 ? PS_C.petrol2 : v >= 65 ? PS_C.gold : PS_C.clay}" stroke-width="20" stroke-linecap="round"/><text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="40" font-weight="700" fill="${PS_C.ink}">${v}%</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="14" fill="${PS_C.mut}">${label}</text></svg>`;
}
function psArea(series, act, { W = 760, H = 250 } = {}) {
  if (!series) return '<div class="ps-empty">لا توجد شراكات موقّعة بتواريخ بدء.</div>';
  const rows = series.rows.map((r) => ({ ...r })); const ci0 = rows.findIndex((r) => r.current); if (ci0 >= 0) rows[ci0].total = act;
  const pr = 34, pl = 10, pt = 22, pb = 30, iw = W - pr - pl, ih = H - pt - pb, n = rows.length;
  const ymax = niceMax(Math.max(...rows.map((r) => r.total), 1));
  const x = (i) => W - pr - (n === 1 ? iw / 2 : i * iw / (n - 1)), y = (v) => pt + ih - v / ymax * ih;
  const ci = Math.max(0, ci0);
  const pts = rows.map((r, i) => [x(i), y(r.total)]);
  const path = (a) => a.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
  const area = (a) => `${path(a)}L${a[a.length - 1][0].toFixed(1)} ${pt + ih}L${a[0][0].toFixed(1)} ${pt + ih}Z`;
  const past = pts.slice(0, ci + 1), fut = pts.slice(ci);
  const ticks = [0, ymax / 2, ymax];
  const step = Math.max(1, Math.ceil(n / 9));
  return `<svg width="100%" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="psg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PS_C.mint}" stop-opacity=".55"/><stop offset="1" stop-color="${PS_C.mint}" stop-opacity=".04"/></linearGradient></defs>
    ${ticks.map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${PS_C.line}" stroke-dasharray="3 4"/><text x="${W - pr + 8}" y="${y(v) + 4}" font-size="12" fill="${PS_C.mut}">${Math.round(v)}</text>`).join('')}
    ${past.length > 1 ? `<path d="${area(past)}" fill="url(#psg)"/>` : ''}${fut.length > 1 ? `<path d="${area(fut)}" fill="${PS_C.sage}" opacity=".18"/>` : ''}
    <path d="${path(past)}" fill="none" stroke="${PS_C.petrol}" stroke-width="3" stroke-linejoin="round"/>${fut.length > 1 ? `<path d="${path(fut)}" fill="none" stroke="${PS_C.petrol2}" stroke-width="2.4" stroke-dasharray="7 6"/>` : ''}
    <line x1="${x(ci)}" x2="${x(ci)}" y1="${pt - 4}" y2="${pt + ih}" stroke="${PS_C.gold}" stroke-width="1.5"/><circle cx="${x(ci)}" cy="${y(rows[ci].total)}" r="6" fill="${PS_C.gold}" stroke="#fff" stroke-width="2"/>
    <text x="${x(ci)}" y="${y(rows[ci].total) - 12}" text-anchor="middle" font-size="16" font-weight="700" fill="${PS_C.ink}">${rows[ci].total}</text>
    ${rows.map((r, i) => (i % step === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="12" fill="${PS_C.mut}">${MONTHS[r.m.getMonth()]}${r.m.getMonth() === 0 || i === 0 ? ' ' + r.m.getFullYear() : ''}</text>` : '')).join('')}</svg>`;
}
function psBars(rows, color = PS_C.petrol2) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return rows.length ? `<div class="ps-bars">${rows.slice(0, 7).map((r) => `<div class="ps-br"><span class="ps-bl">${esc(r.label)}</span><span class="ps-bt"><i style="width:${Math.max(5, r.n / max * 100).toFixed(1)}%;background:${/^غير/.test(r.k) ? '#C5CFCB' : color}"></i></span><b>${r.n}</b></div>`).join('')}</div>` : '<div class="ps-empty">لا توجد بيانات.</div>';
}
function psFunnel(rows) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  const cols = ['#8FC2AF', '#C9973B', '#D98A55', '#1F6B5C', '#0B3F38', '#B5533C'];
  return `<div class="ps-funnel">${rows.map((r, i) => `<div class="ps-fr"><span>${esc(r.l)}</span><span class="ps-ft"><i style="width:${r.n ? Math.max(8, r.n / max * 100) : 0}%;background:${cols[i % cols.length]}"></i></span><b>${r.n}</b></div>`).join('')}</div>`;
}
function psTimeline(list) {
  const t = today(), y1 = addDays(t, 365);
  const exp = list.filter((p) => !p.isDraft && p.stage === 'signed' && p.endDate && parseDate(p.endDate) >= t && parseDate(p.endDate) <= y1).sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  const months = Array.from({ length: 12 }, (_, k) => new Date(t.getFullYear(), t.getMonth() + k + 1, 1));
  const pos = (d) => Math.min(100, Math.max(0, (+d - +t) / (+y1 - +t) * 100));
  return `<div class="ps-tl"><div class="ps-tl-axis">${months.map((m) => `<span style="right:${pos(m).toFixed(2)}%">${MONTHS[m.getMonth()]}</span>`).join('')}</div>
    ${exp.length ? exp.slice(0, 7).map((p) => { const dl = daysLeft(p); return `<div class="ps-tl-r"><span class="ps-tl-n">${esc(partnerName(p))}</span><span class="ps-tl-t"><i class="${dl <= (D.settings.alertDays || 30) ? 'u' : dl <= D.settings.expiryDays ? 's' : ''}" style="right:${pos(parseDate(p.endDate)).toFixed(2)}%"></i><em style="right:${pos(parseDate(p.endDate)).toFixed(2)}%">${fmtDate(p.endDate, 'short')} · ${dl} يومًا</em></span></div>`; }).join('') : '<div class="ps-empty">لا توجد شراكات تنتهي خلال 12 شهرًا.</div>'}</div>`;
}

function buildPrintSheet() {
  // الورقة تُبنى من مكونات اللوحة نفسها حتى تطابق الشاشة دائمًا
  const base = visiblePartnerships(), list = applyFilters(base, App.dashF);
  const filtered = Object.values(App.dashF).some((v) => v && v.length);
  const lu = lastDataUpdate();
  const fparts = Object.entries(App.dashF).filter(([, v]) => v && v.length).map(([k, v]) => `${FILTER_DIMS[k].label}: ${v.map((x) => (FILTER_DIMS[k].fmt ? FILTER_DIMS[k].fmt(x) : x)).join('، ')}`);
  const logo = ASSET_IMG['murooj-logo'] ? `<img class="ps2-logo" src="${ASSET_IMG['murooj-logo'].src}" alt="">` : '';
  return `<div class="ps2" dir="rtl">
    <header class="ps2-head ps-head"><div class="ps2-brand">${logo}<div><h1>لوحة مؤشرات الشراكات</h1><p>${esc(D.settings.org.dept)}، ${esc(D.settings.org.name)}</p></div></div>
      <dl class="dz3-meta ps2-meta ps-meta"><div><dt>تاريخ الطباعة</dt><dd>${fmtDT(new Date().toISOString())}</dd></div><div><dt>آخر تحديث للبيانات</dt><dd>${lu ? fmtDT(lu) : '—'}</dd></div><div><dt>النطاق</dt><dd>${list.length} من ${base.length} شراكة</dd></div><div class="ps2-f"><dt>الفلاتر</dt><dd>${fparts.length ? esc(fparts.join('، ')) : 'دون فلاتر، جميع الشراكات المتاحة'}</dd></div>${showDemo() ? '<div class="dz3-demo">تشمل بيانات تجريبية</div>' : ''}</dl></header>
    <div class="dz3 ps2-body">${list.length ? dz2Body(list, filtered, false) : '<p class="ps2-empty">لا توجد شراكات ضمن النطاق المختار.</p>'}</div>
    <footer class="ps2-foot">${esc(D.settings.org.name)}، ${esc(D.settings.org.platform)}. الأرقام محسوبة تلقائيًا من السجلات وقت الطباعة.</footer></div>`;
}
function preparePrintSheet() {
  $$('.cu').forEach((el) => { el.textContent = cuFmt(+el.dataset.v || 0, el.dataset.fmt); });
  let host = $('#printSheet'); if (host) host.remove();
  host = document.createElement('div'); host.id = 'printSheet'; host.innerHTML = buildPrintSheet();
  document.body.appendChild(host);
  // القياس أثناء الإخفاء البصري فقط (العنصر مخفي افتراضيًا على الشاشة)
  Object.assign(host.style, { display: 'block', position: 'absolute', top: '0', right: '-30000px', visibility: 'hidden' });
  // نوسّع عرض الورقة حتى تملأ الصفحة عرضًا وارتفاعًا معًا ثم نصغّرها بنسبة واحدة
  const sheet = host.firstElementChild, PW = 1587, maxH = 1118;
  // بحث ثنائي عن العرض الذي تطابق فيه نسبة الارتفاع إلى العرض نسبة صفحة A3
  const target = maxH / PW, ratio = (w) => { sheet.style.width = w + 'px'; return sheet.scrollHeight / w; };
  let W = PW;
  if (ratio(PW) > target) {
    let lo = PW, hi = PW * 2.2;
    for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (ratio(mid) > target) lo = mid; else hi = mid; }
    W = Math.round(hi); sheet.style.width = W + 'px';
  }
  const h = sheet.scrollHeight, k = Math.min(1, maxH / h, PW / W);
  host.dataset.scale = k.toFixed(3);
  if (k < 1) { sheet.style.transform = `scale(${k.toFixed(4)})`; sheet.style.transformOrigin = 'top right'; sheet.style.marginRight = `${Math.max(0, (PW - W * k) / 2).toFixed(1)}px`; host.style.height = maxH + 'px'; host.style.overflow = 'hidden'; }
  Object.assign(host.style, { display: '', position: '', top: '', right: '', visibility: '' });
  let st = $('#printPageSize'); if (!st) { st = document.createElement('style'); st.id = 'printPageSize'; document.head.appendChild(st); }
  st.textContent = '@page{size:420mm 297mm;margin:0}';
  document.documentElement.classList.add('printing-sheet');
  const prevTitle = document.title; document.title = `لوحة مؤشرات الشراكات — ${fmtDate(isoDate(new Date()))}`;
  const done = () => { document.documentElement.classList.remove('printing-sheet'); st.textContent = ''; host.remove(); document.title = prevTitle; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  return host;
}
async function printDashboardSheet() {
  const host = preparePrintSheet();
  await hydrateFiles(host);
  window.print();
}
// Ctrl+P من صفحة المؤشرات يطبع الورقة الواحدة أيضًا
window.addEventListener('beforeprint', () => {
  if (App.route && App.route.name === 'dashboard' && design() !== 'board' && App.dashView === 'alt' && !document.documentElement.classList.contains('printing-sheet') && !document.documentElement.classList.contains('printing-report')) preparePrintSheet();
});
