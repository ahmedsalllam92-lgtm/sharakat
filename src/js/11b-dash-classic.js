/* ===== رسم خطي مشترك للوحة المؤشرات ===== */
/* منحنى خطي واحد: عدد الشراكات السارية شهريًا */
function dzLineSVG(series) {
  if (!series) return '<div class="empty-chart">لا توجد شراكات موقّعة بتواريخ بدء ضمن الفلاتر الحالية.</div>';
  const rows = series.rows;
  const W = 900, H = 260, pr = 40, pl = 12, pt = 26, pb = 34;
  const iw = W - pr - pl, ih = H - pt - pb, n = rows.length;
  const ymax = niceMax(Math.max(...rows.map((r) => r.total), 1));
  const x = (i) => W - pr - (n === 1 ? iw / 2 : i * iw / (n - 1));
  const y = (v) => pt + ih - v / ymax * ih;
  const ci = Math.max(0, rows.findIndex((r) => r.current));
  const pts = rows.map((r, i) => [x(i).toFixed(1), y(r.total).toFixed(1)]);
  const past = pts.slice(0, ci + 1), fut = pts.slice(ci);
  const area = (arr) => (arr.length > 1 ? `M${arr.map((p) => p.join(' ')).join('L')}L${arr[arr.length - 1][0]} ${pt + ih}L${arr[0][0]} ${pt + ih}Z` : '');
  const tn = Number.isInteger(ymax / 4) ? 4 : 5;
  const ticks = Array.from({ length: tn + 1 }, (_, k) => k * ymax / tn);
  const step = Math.max(1, Math.ceil(n / 8));
  const colW = n > 1 ? iw / (n - 1) : iw;
  const tx = x(ci);
  return `<svg class="dz-line" viewBox="0 0 ${W} ${H}" role="img" aria-label="تطور عدد الشراكات السارية شهريًا">
    ${ticks.map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="ev-grid"/><text x="${W - pr + 10}" y="${y(v) + 4}" class="ev-y">${Math.round(v)}</text>`).join('')}
    <path d="${area(past)}" class="dzl-area"/><path d="${area(fut)}" class="dzl-area fut"/>
    <polyline points="${past.map((p) => p.join(',')).join(' ')}" class="dzl-line"/>
    ${fut.length > 1 ? `<polyline points="${fut.map((p) => p.join(',')).join(' ')}" class="dzl-line fut"/>` : ''}
    <line x1="${tx}" x2="${tx}" y1="${pt - 6}" y2="${pt + ih}" class="ev-today"/>
    <g transform="translate(${tx},${pt - 12})"><rect x="-24" y="-10" width="48" height="19" rx="9.5" class="ev-pill"/><text y="4" text-anchor="middle" class="ev-pill-t">اليوم</text></g>
    <circle cx="${tx}" cy="${y(rows[ci].total)}" r="5" class="ev-dot"/>
    <text x="${tx}" y="${y(rows[ci].total) - 12}" text-anchor="middle" class="dzl-val">${rows[ci].total}</text>
    ${rows.map((r, i) => (i % step === 0 ? `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" class="ev-x">${MONTHS[r.m.getMonth()]}${r.m.getMonth() === 0 || i === 0 ? ' ' + r.m.getFullYear() : ''}</text>` : '')).join('')}
    <line class="ev-guide" x1="0" x2="0" y1="${pt}" y2="${pt + ih}" style="display:none"/>
    ${rows.map((r, i) => `<rect class="ev-hit" x="${(x(i) - colW / 2).toFixed(1)}" y="${pt}" width="${colW.toFixed(1)}" height="${ih}" ${tipAttr(`<b>${MONTHS[r.m.getMonth()]} ${r.m.getFullYear()}</b>${r.future ? ' — متوقع' : ''}<br>شراكات سارية: ${r.total}`)}/>`).join('')}</svg>`;
}
function dzTrendStats(series, list) {
  if (!series) return '';
  const cur = series.rows.find((r) => r.current) || series.rows.filter((r) => !r.future).slice(-1)[0];
  const ci = series.rows.indexOf(cur);
  const ago = series.rows[Math.max(0, ci - 12)];
  const ahead = series.rows[Math.min(series.rows.length - 1, ci + 6)];
  const t = today(), yAgo = addDays(t, -365);
  const started = list.filter((p) => !p.isDraft && p.stage === 'signed' && p.startDate && parseDate(p.startDate) >= yAgo && parseDate(p.startDate) <= t).length;
  return `<div class="dz-trend"><div><b>${cur.total}</b><span>سارية الآن</span></div><div><b>${ago.total}</b><span>قبل 12 شهرًا</span></div><div><b>${started}</b><span>بدأت خلال آخر 12 شهرًا</span></div><div><b>${ahead.total}</b><span>متوقع بعد 6 أشهر دون تجديد</span></div></div>`;
}
