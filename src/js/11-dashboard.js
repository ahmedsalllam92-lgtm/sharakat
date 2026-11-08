/* ===== لوحة المؤشرات التنفيذية — كل رقم ورسم محسوب من السجلات ===== */
function dashActions(list) {
  const props = visibleProposals();
  const items = [];
  const nNew = props.filter((x) => x.status === 'submitted').length;
  if (nNew && can('proposal.review')) items.push({ tone: 'info', ic: 'inbox', t: 'مقترحات جديدة بانتظار الدراسة', d: 'قدّمتها الإدارات ولم تبدأ مراجعتها', n: nNew, href: '#/proposals?status=submitted' });
  const old = props.filter((x) => x.status === 'info' && propAgeDays(x) > (D.settings.infoAgeDays || 7)).length;
  if (old && can('proposal.review')) items.push({ tone: 'warn', ic: 'clock', t: `بانتظار الاستكمال منذ أكثر من ${D.settings.infoAgeDays || 7} أيام`, d: 'يُقترح التواصل مع الإدارة المقدمة', n: old, href: '#/proposals?status=info' });
  const acc = props.filter((x) => x.status === 'accepted').length;
  if (acc && can('proposal.review')) items.push({ tone: 'ok', ic: 'convert', t: 'مقترحات مقبولة لم تُحوّل إلى شراكة', d: 'جاهزة للتحويل إلى سجل شراكة', n: acc, href: '#/proposals?status=accepted' });
  const urg = list.filter((p) => { const a = expiryAlert(p); return a && a.tone === 'urgent'; }).length;
  if (urg) items.push({ tone: 'danger', ic: 'alert', t: `عاجل: تنتهي خلال ${D.settings.alertDays || 30} يومًا`, d: 'تنبيه قبل الانتهاء — يلزم قرار التجديد', n: urg, href: '#/partnerships?status=soon' });
  const soon = list.filter((p) => pStatus(p) === 'soon').length;
  if (soon) items.push({ tone: 'warn', ic: 'calendar', t: `شراكات تنتهي خلال ${D.settings.expiryDays} يومًا`, d: 'تحتاج قرارًا بالتجديد أو الإنهاء', n: soon, href: '#/partnerships?status=soon' });
  const ended = list.filter((p) => pStatus(p) === 'ended').length;
  if (ended) items.push({ tone: 'info', ic: 'flag', t: 'شراكات منتهية', d: 'تأكد من توثيق نتائجها وقرار التجديد', n: ended, href: '#/partnerships?status=ended' });
  const miss = list.filter((p) => !p.isDraft && missingFields(p).length).length;
  if (miss && can('edit.partnership')) items.push({ tone: 'warn', ic: 'alert', t: 'سجلات ببيانات أساسية ناقصة', d: 'افتح السجل لمعرفة الحقول غير المعبأة', n: miss, href: '#/partnerships?missing=1' });
  const imp = list.filter((p) => pendingImportNotes(p).length).length;
  if (imp && can('edit.partnership')) items.push({ tone: 'danger', ic: 'info', t: 'قيم من ملف الحصر تحتاج تأكيدًا', d: 'تواريخ وردت بصيغة غير صحيحة وفُسّرت تلقائيًا', n: imp, href: '#/partnerships?importnote=1' });
  const dr = list.filter((p) => p.isDraft).length;
  if (dr && can('view.drafts')) items.push({ tone: 'info', ic: 'edit', t: 'مسودات لم تُستكمل', d: 'سجلات محفوظة كمسودة', n: dr, href: '#/partnerships?status=draft' });
  return items;
}

/* — ألوان دلالية — */
const SEC_VAR = (s) => ({ 'حكومي': 'var(--sec-1)', 'خاص': 'var(--sec-2)', 'غير ربحي': 'var(--sec-3)' }[s] || 'var(--sec-4)');
const SEC_BAND = (s) => ({ 'حكومي': '#7FD8A6', 'خاص': '#D9B467', 'غير ربحي': '#4FA88A' }[s] || '#6E8C86');
const SEC_XB = (s) => ({ 'حكومي': 'var(--xb-sec-1)', 'خاص': 'var(--xb-sec-2)', 'غير ربحي': 'var(--xb-sec-3)' }[s] || 'var(--xb-sec-4)');
const ST_VAR = (k) => ({ active: 'var(--st-active)', soon: 'var(--st-soon)', upcoming: 'var(--st-up)', nodates: 'var(--st-muted)', prep: 'var(--st-prep)', sign: 'var(--st-sign)', hold: 'var(--st-soon)', ended: 'var(--st-ended)', cancel: 'var(--danger)', draft: 'var(--st-muted)' }[k] || 'var(--st-muted)');
const tipAttr = (html) => `data-tip="${esc(html)}"`;

/* — بيانات زمنية: عدد الشراكات السارية في كل شهر (فعلي حتى اليوم، ومتوقع بعده وفق تواريخ الانتهاء) — */
function monthlySeries(list) {
  const t = today();
  const signed = list.filter((p) => !p.isDraft && p.stage === 'signed' && p.startDate);
  if (!signed.length) return null;
  const minS = new Date(Math.min(...signed.map((p) => +parseDate(p.startDate))));
  const start = new Date(Math.max(+new Date(minS.getFullYear(), minS.getMonth() - 2, 1), +new Date(t.getFullYear(), t.getMonth() - 30, 1)));
  const end = new Date(t.getFullYear(), t.getMonth() + 12, 1);
  const cur = new Date(t.getFullYear(), t.getMonth(), 1);
  const secs = [...L('sectors'), 'غير محدد'];
  const rows = [];
  for (let m = new Date(start); m <= end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    const o = { m: new Date(m), future: m > cur, current: +m === +cur, by: {}, total: 0 };
    secs.forEach((s) => { o.by[s] = 0; });
    signed.forEach((p) => { const s = parseDate(p.startDate), e = parseDate(p.endDate); if (s <= mEnd && (!e || e >= m)) { const k = pSector(p) || 'غير محدد'; o.by[k] = (o.by[k] || 0) + 1; o.total++; } });
    rows.push(o);
  }
  return { rows, secs: secs.filter((s) => rows.some((r) => r.by[s])) };
}
function niceMax(v) { if (v <= 4) return 4; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }

/* — منحنى تطور المحفظة (الزمن من اليمين إلى اليسار) — */
function evolutionSVG(series) {
  if (!series) return '<div class="empty-chart">لا توجد شراكات موقّعة بتواريخ بدء ضمن الفلاتر الحالية.</div>';
  const { rows, secs } = series;
  const W = 920, H = 300, pr = 44, pl = 14, pt = 30, pb = 36;
  const iw = W - pr - pl, ih = H - pt - pb, n = rows.length;
  const ymax = niceMax(Math.max(...rows.map((r) => r.total), 1));
  const x = (i) => W - pr - (n === 1 ? iw / 2 : i * iw / (n - 1));
  const y = (v) => pt + ih - v / ymax * ih;
  const ci = rows.findIndex((r) => r.current);
  let defs = '', areas = '';
  const cum = rows.map(() => 0);
  secs.forEach((s, k) => {
    const top = rows.map((r, i) => [x(i).toFixed(1), y(cum[i] + r.by[s]).toFixed(1)]);
    const bot = rows.map((r, i) => [x(i).toFixed(1), y(cum[i]).toFixed(1)]);
    rows.forEach((r, i) => { cum[i] += r.by[s]; });
    defs += `<linearGradient id="evg${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SEC_VAR(s)}" stop-opacity=".95"/><stop offset="1" stop-color="${SEC_VAR(s)}" stop-opacity=".6"/></linearGradient>`;
    areas += `<path class="ev-area" d="M${top.map((p) => p.join(' ')).join('L')}L${bot.reverse().map((p) => p.join(' ')).join('L')}Z" fill="url(#evg${k})"/>`;
  });
  const tops = rows.map((r, i) => [x(i).toFixed(1), y(r.total).toFixed(1)]);
  const past = ci >= 0 ? tops.slice(0, ci + 1) : tops, fut = ci >= 0 ? tops.slice(ci) : [];
  const tn = Number.isInteger(ymax / 4) ? 4 : 5;
  const ticks = Array.from({ length: tn + 1 }, (_, k) => k * ymax / tn);
  const step = Math.max(1, Math.ceil(n / 9));
  const labels = rows.map((r, i) => (i % step === 0 ? `<text x="${x(i)}" y="${H - 12}" text-anchor="middle" class="ev-x">${MONTHS[r.m.getMonth()]}${r.m.getMonth() === 0 || i === 0 ? ' ' + r.m.getFullYear() : ''}</text>` : '')).join('');
  const colW = n > 1 ? iw / (n - 1) : iw;
  const hov = rows.map((r, i) => `<rect class="ev-hit" x="${(x(i) - colW / 2).toFixed(1)}" y="${pt}" width="${colW.toFixed(1)}" height="${ih}" ${tipAttr(`<b>${MONTHS[r.m.getMonth()]} ${r.m.getFullYear()}</b>${r.future ? ' — متوقع' : ''}<br>الإجمالي: ${r.total}${secs.map((s) => `<br><span style="color:${SEC_BAND(s)}">●</span> ${s}: ${r.by[s] || 0}`).join('')}`)}/>`).join('');
  const futX = ci >= 0 ? x(ci) : null;
  return `<svg class="evo" viewBox="0 0 ${W} ${H}" role="img" aria-label="تطور عدد الشراكات السارية شهريًا">
    <defs>${defs}</defs>
    ${ticks.map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="ev-grid"/><text x="${W - pr + 12}" y="${y(v) + 4}" class="ev-y">${Math.round(v)}</text>`).join('')}
    <g class="ev-plot">${areas}
      ${futX !== null ? `<rect x="${pl}" y="${pt - 2}" width="${(futX - pl).toFixed(1)}" height="${ih + 2}" class="ev-fut"/>` : ''}
      <polyline class="ev-line" points="${past.map((p) => p.join(',')).join(' ')}"/>
      ${fut.length > 1 ? `<polyline class="ev-line fut" points="${fut.map((p) => p.join(',')).join(' ')}"/>` : ''}</g>
    ${futX !== null ? `<line x1="${futX}" x2="${futX}" y1="${pt - 8}" y2="${pt + ih}" class="ev-today"/><g transform="translate(${futX},${pt - 14})"><rect x="-24" y="-11" width="48" height="20" rx="10" class="ev-pill"/><text y="4" text-anchor="middle" class="ev-pill-t">اليوم</text></g>
      <circle cx="${futX}" cy="${y(rows[ci].total)}" r="5.5" class="ev-dot"/>
      ${futX - pl > 150 ? `<text x="${((pl + futX) / 2).toFixed(1)}" y="${pt + 16}" text-anchor="middle" class="ev-note">متوقع وفق تواريخ الانتهاء الحالية</text>` : ''}` : ''}
    ${labels}<line class="ev-guide" x1="0" x2="0" y1="${pt}" y2="${pt + ih}" style="display:none"/>${hov}</svg>`;
}

function evolutionStats(series, list) {
  if (!series) return '';
  const past = series.rows.filter((r) => !r.future);
  const peak = past.reduce((a, r) => (r.total >= a.total ? r : a), past[0]);
  const cur = series.rows.find((r) => r.current) || past[past.length - 1];
  const last = series.rows[series.rows.length - 1];
  const t = today(), yAgo = addDays(t, -365);
  const started = list.filter((p) => !p.isDraft && p.stage === 'signed' && p.startDate && parseDate(p.startDate) >= yAgo && parseDate(p.startDate) <= t).length;
  return `<div class="evstats">
    <div><b>${cur.total}</b><span>سارية هذا الشهر</span></div>
    <div><b>${peak.total}</b><span>أعلى عدد متزامن — ${MONTHS[peak.m.getMonth()]} ${peak.m.getFullYear()}</span></div>
    <div><b>${started}</b><span>بدأ سريانها خلال آخر 12 شهرًا</span></div>
    <div><b>${last.total}</b><span>تبقى سارية بعد 12 شهرًا ما لم تُجدَّد أو تُضف شراكات</span></div></div>`;
}

/* — منظومة الشركاء: حلقة القطاعات وحلقة الجهات — */
function arcPath(cx, cy, r0, r1, a0, a1) {
  const p = (r, a) => [(cx + r * Math.sin(a)).toFixed(2), (cy - r * Math.cos(a)).toFixed(2)];
  const big = a1 - a0 > Math.PI ? 1 : 0;
  if (a1 - a0 >= Math.PI * 2 - 0.02) { a1 = a0 + Math.PI * 2 - 0.02; }
  const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${big} 0 ${x3} ${y3}Z`;
}
const ST_PRIO = ['active', 'soon', 'upcoming', 'sign', 'prep', 'hold', 'nodates', 'ended', 'cancel'];
function sunburstSVG(list) {
  const nd = list.filter((p) => !p.isDraft);
  if (!nd.length) return '<div class="empty-chart">لا توجد شراكات ضمن الفلاتر الحالية.</div>';
  const secs = new Map();
  nd.forEach((p) => {
    const s = pSector(p) || 'غير محدد', pr = partnerById(p.partnerId); if (!pr) return;
    if (!secs.has(s)) secs.set(s, new Map());
    const m = secs.get(s); const e = m.get(pr.id) || { pr, n: 0, sts: [], pid: p.id }; e.n++; e.sts.push(pStatus(p)); m.set(pr.id, e);
  });
  const order = [...L('sectors'), 'غير محدد'].filter((s) => secs.has(s));
  const total = nd.length, S = 360, c = S / 2, gap = 0.012;
  let a = 0, ring1 = '', ring2 = '', labels = '';
  order.forEach((s) => {
    const parts = [...secs.get(s).values()].sort((x, y) => y.n - x.n);
    const sn = parts.reduce((t, e) => t + e.n, 0);
    const a0 = a, a1 = a + sn / total * Math.PI * 2;
    ring1 += `<path class="sb-seg sb-sec" d="${arcPath(c, c, 66, 106, a0 + gap, a1 - gap)}" fill="${SEC_VAR(s)}" data-href="#/partnerships${filtersToQuery({ ...App.dashF, sector: [s] })}" ${tipAttr(`<b>${s}</b><br>${plural(sn, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')} مع ${plural(parts.length, 'جهة واحدة', 'جهتين', 'جهات', 'جهة')}`)}/>`;
    if (a1 - a0 > 0.55) { const m = (a0 + a1) / 2; labels += `<text x="${(c + 86 * Math.sin(m)).toFixed(1)}" y="${(c - 86 * Math.cos(m) + 4).toFixed(1)}" text-anchor="middle" class="sb-lab">${esc(s)}</text>`; }
    let b = a0;
    parts.forEach((e) => {
      const b0 = b, b1 = b + e.n / total * Math.PI * 2;
      const st = ST_PRIO.find((k) => e.sts.includes(k)) || e.sts[0];
      ring2 += `<path class="sb-seg" d="${arcPath(c, c, 112, 170, b0 + gap * .6, b1 - gap * .6)}" fill="${ST_VAR(st)}" data-href="${e.n > 1 ? '#/partners/' + e.pr.id : '#/partnerships/' + e.pid}" ${tipAttr(`<b>${e.pr.name}</b><br>${s} — ${plural(e.n, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')}<br>${statusLabel(st)}${e.pr.demo ? ' — تجريبي' : ''}`)}/>`;
      if (b1 - b0 > 0.24) { const m = (b0 + b1) / 2; labels += `<text x="${(c + 141 * Math.sin(m)).toFixed(1)}" y="${(c - 141 * Math.cos(m) + 6).toFixed(1)}" text-anchor="middle" class="sb-mono">${esc(monogram(e.pr.name))}</text>`; }
      b = b1;
    });
    a = a1;
  });
  const nPartners = order.reduce((t, s) => t + secs.get(s).size, 0);
  const legend = ST_PRIO.filter((k) => nd.some((p) => pStatus(p) === k)).map((k) => `<span><i style="background:${ST_VAR(k)}"></i>${esc(statusLabel(k))}</span>`).join('');
  return `<div class="sb-wrap"><svg class="sb" viewBox="0 0 ${S} ${S}" role="img" aria-label="توزيع الجهات الشريكة على القطاعات">${ring1}${ring2}${labels}
      <text x="${c}" y="${c + 4}" text-anchor="middle" class="sb-n">${nPartners}</text><text x="${c}" y="${c + 26}" text-anchor="middle" class="sb-l">جهة شريكة</text></svg>
    <div class="sb-legend"><div class="sb-lh">الحلقة الخارجية: الجهات، ملوّنة بحالة شراكتها</div>${legend}<div class="sb-lh" style="margin-top:10px">الحلقة الداخلية: قطاع الجهة</div>${order.map((s) => `<span><i style="background:${SEC_VAR(s)}"></i>${esc(s)}</span>`).join('')}</div></div>`;
}

/* — خريطة التقاطع: الإدارات × القطاعات — */
function heatmapHTML(list) {
  const nd = list.filter((p) => !p.isDraft);
  const secs = [...L('sectors')].filter((s) => nd.some((p) => pSector(p) === s));
  if (nd.some((p) => !pSector(p))) secs.push('غير محدد');
  const depts = L('departments').filter((d) => nd.some((p) => (p.departments || []).includes(d)));
  if (!depts.length || !secs.length) return '<div class="empty-chart">لم تُحدَّد إدارات متقاطعة في الشراكات المعروضة.</div>';
  const cell = (d, s) => nd.filter((p) => (p.departments || []).includes(d) && (pSector(p) || 'غير محدد') === s).length;
  const dTot = (d) => nd.filter((p) => (p.departments || []).includes(d)).length;
  const M = Math.max(1, ...depts.flatMap((d) => secs.map((s) => cell(d, s))));
  const TM = Math.max(1, ...depts.map(dTot));
  return `<div class="hm-wrap"><table class="hm"><thead><tr><th></th>${secs.map((s) => `<th><i style="background:${SEC_VAR(s)}"></i>${esc(s)}</th>`).join('')}<th class="hm-tt">الإجمالي</th></tr></thead><tbody>
    ${depts.sort((x, y) => dTot(y) - dTot(x)).map((d) => `<tr><th>${esc(d)}</th>
      ${secs.map((s) => { const v = cell(d, s), f = v / M; return `<td><button class="hm-c ${f > .5 ? 'hi' : ''} ${v ? '' : 'z'}" style="--a:${v ? (0.14 + f * 0.8).toFixed(2) : 0}" data-href="#/partnerships${filtersToQuery({ ...App.dashF, department: [d], sector: [s] })}" ${tipAttr(`<b>${d}</b><br>${s}: ${v}`)}>${v || '–'}</button></td>`; }).join('')}
      <td class="hm-t"><span class="hm-tb"><i style="--w:${(dTot(d) / TM * 100).toFixed(0)}%"></i></span><b>${dTot(d)}</b></td></tr>`).join('')}
  </tbody></table></div>`;
}

/* — خارطة السريان — */
function roadmapHTML(list) {
  const rows = list.filter((p) => !p.isDraft && p.startDate && p.endDate).sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  if (!rows.length) return '<div class="empty-chart">لا توجد شراكات بتواريخ بدء وانتهاء ضمن الفلاتر الحالية.</div>';
  const t = today();
  const mn = Math.min(...rows.map((p) => +parseDate(p.startDate)), +t), mx = Math.max(...rows.map((p) => +parseDate(p.endDate)), +t);
  const y0 = new Date(mn).getFullYear(), y1 = new Date(mx).getFullYear() + 1;
  const a = +new Date(y0, 0, 1), span = +new Date(y1, 0, 1) - a;
  const pos = (d) => ((+d - a) / span * 100);
  const years = []; for (let y = y0; y < y1; y++) years.push(y);
  const qlines = years.flatMap((y) => [0, 3, 6, 9].map((m) => `<span class="rm-q ${m === 0 ? 'y' : ''}" style="right:${pos(new Date(y, m, 1)).toFixed(2)}%"></span>`)).join('');
  const tp = pos(t).toFixed(2);
  return `<div class="rm">
    <div class="rm-row rm-head"><span></span><div class="rm-years">${years.map((y) => `<span style="right:${pos(new Date(y, 0, 1)).toFixed(2)}%;width:${(100 / years.length).toFixed(2)}%">${y}</span>`).join('')}<span class="rm-now" style="right:${tp}%">اليوم</span></div></div>
    ${rows.map((p) => {
      const st = pStatus(p), pr = partnerById(p.partnerId), s = pos(parseDate(p.startDate)), e = pos(parseDate(p.endDate)), dl = daysLeft(p);
      return `<div class="rm-row" data-href="#/partnerships/${p.id}"><div class="rm-name">${plateHTML(pr, 40)}<span>${esc(partnerName(p))}</span></div>
        <div class="rm-track">${qlines}<span class="rm-bar st-${st}" style="right:${s.toFixed(2)}%;width:${Math.max(0.8, e - s).toFixed(2)}%" ${tipAttr(`<b>${partnerName(p)}</b><br>${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}<br>${statusLabel(st)}${dl !== null && dl >= 0 && ['active', 'soon'].includes(st) ? ` — متبقٍ ${dl} يومًا` : ''}`)}>${st === 'soon' ? `<em>تنتهي ${fmtDate(p.endDate, 'short')}</em>` : ''}</span><span class="rm-today" style="right:${tp}%"></span></div></div>`;
    }).join('')}</div>`;
}

/* — مسار الشراكة: من مقترح الإدارة إلى السريان — */
function lifecycleHTML(list) {
  const props = visibleProposals().filter((x) => x.status !== 'draft');
  const c = (k) => props.filter((x) => k.includes(x.status)).length;
  const decided = c(['accepted', 'converted', 'rejected']);
  const acc = decided ? Math.round(c(['accepted', 'converted']) / decided * 100) : null;
  const st = (k) => list.filter((p) => k.includes(pStatus(p))).length;
  const P = [
    { l: 'مقترحات مقدّمة', n: props.length, href: '#/proposals' },
    { l: 'قيد الدراسة والاستكمال', n: c(['submitted', 'review', 'info']), href: '#/proposals?status=submitted|review|info' },
    { l: 'مقبولة', n: c(['accepted', 'converted']), href: '#/proposals?status=accepted|converted', badge: acc !== null ? `القبول ${acc}%` : '' },
    { l: 'حُوّلت إلى شراكات', n: c(['converted']), href: '#/proposals?status=converted' },
  ];
  const fq = (k) => '#/partnerships' + filtersToQuery({ ...App.dashF, status: k });
  const T = [
    { l: 'قيد الإعداد', n: st(['prep']), href: fq(['prep']) },
    { l: 'بانتظار التوقيع', n: st(['sign']), href: fq(['sign']) },
    { l: 'لم يبدأ سريانها', n: st(['upcoming']), href: fq(['upcoming']) },
    { l: 'سارية', n: st(['active']), href: fq(['active']), hl: true },
    { l: 'تنتهي قريبًا', n: st(['soon']), href: fq(['soon']), warn: true },
    { l: 'منتهية', n: st(['ended']), href: fq(['ended']) },
  ];
  const cell = (s, bar) => `<a class="lc2-s ${s.hl ? 'hl' : ''} ${s.warn && s.n ? 'warn' : ''} ${s.n ? '' : 'zero'}" href="${s.href}" style="--b:${bar}"><span class="lc2-n cu" data-v="${s.n}">${s.n}</span><span class="lc2-l">${s.l}</span>${s.badge ? `<em>${s.badge}</em>` : ''}<i class="lc2-bar"></i></a>`;
  const PB = ['var(--xb-p1)', 'var(--xb-p2)', 'var(--xb-sec-3)', 'var(--xb-sec-1)'];
  const TB = ['var(--xb-sec-4)', 'var(--xb-p2)', 'var(--xb-p1)', 'var(--xb-accent)', 'var(--xb-gold)', 'var(--xb-sec-4)'];
  return `<div class="lc2"><div class="lc2-g"><div class="lc2-h">مقترحات الإدارات</div><div class="lc2-row" style="--n:${P.length}">${P.map((s, k) => cell(s, PB[k])).join('')}</div></div>
    <div class="lc2-g"><div class="lc2-h">مراحل الشراكة</div><div class="lc2-row" style="--n:${T.length}">${T.map((s, k) => cell(s, TB[k])).join('')}</div></div></div>`;
}

/* — رسوم صغيرة داخل البطاقات — */
function sparkSVG(vals, w = 150, h = 42) {
  if (vals.length < 2) return '<div class="spark-empty"></div>';
  const mx = Math.max(...vals, 1), n = vals.length;
  const pts = vals.map((v, i) => [(w - 3 - i * (w - 6) / (n - 1)).toFixed(1), (h - 4 - v / mx * (h - 12)).toFixed(1)]);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="spg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--xb-spark-fill)"/><stop offset="1" style="stop-color:var(--xb-spark-fill);stop-opacity:0"/></linearGradient></defs>
    <path d="M${pts.map((p) => p.join(' ')).join('L')}L${pts[n - 1][0]} ${h}L${pts[0][0]} ${h}Z" fill="url(#spg)"/><polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" style="stroke:var(--xb-spark)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function ringSVG(f, size = 60) {
  const r = size / 2 - 5, C = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="6"/>
    <circle class="ring-v" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(f * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="--c:${C.toFixed(1)}"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" class="ring-t">${Math.round(f * 100)}%</text></svg>`;
}
function segBar(parts) {
  const tot = parts.reduce((t, p) => t + p.n, 0);
  if (!tot) return '<div class="segbar empty"></div><div class="seglg"><span>لا توجد قيم</span></div>';
  return `<div class="segbar">${parts.filter((p) => p.n).map((p) => `<i style="flex:${p.n};background:${p.c}" ${tipAttr(`${p.l}: ${p.n}`)}></i>`).join('')}</div>
    <div class="seglg">${parts.filter((p) => p.n).map((p) => `<span><i style="background:${p.c}"></i>${esc(p.l)} <b>${p.n}</b></span>`).join('')}</div>`;
}
function expiryBars(list) {
  const t = today(); const cells = [];
  for (let k = 0; k < 12; k++) {
    const m = new Date(t.getFullYear(), t.getMonth() + k, 1), mEnd = new Date(t.getFullYear(), t.getMonth() + k + 1, 0);
    const n = list.filter((p) => !p.isDraft && p.stage === 'signed' && p.endDate && parseDate(p.endDate) >= (k ? m : t) && parseDate(p.endDate) <= mEnd).length;
    cells.push({ m, n });
  }
  const mx = Math.max(1, ...cells.map((c) => c.n));
  return `<div class="xbars">${cells.map((c) => `<i class="${c.n ? 'on' : ''}" style="--h:${c.n ? 22 + c.n / mx * 78 : 7}%" ${tipAttr(`${MONTHS[c.m.getMonth()]} ${c.m.getFullYear()}: ${plural(c.n, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')}`)}></i>`).join('')}</div><div class="xbars-l"><span>${MONTHS[t.getMonth()]}</span><span>الأشهر الاثنا عشر القادمة</span></div>`;
}

/* — الملخص التنفيذي — */
function narrative(list, filtered) {
  const nd = list.filter((p) => !p.isDraft);
  const partners = new Set(nd.map((p) => p.partnerId)).size;
  const act = nd.filter((p) => ['active', 'soon'].includes(pStatus(p))).length;
  const soon = nd.filter((p) => pStatus(p) === 'soon').sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  const props = visibleProposals().filter((x) => ['submitted', 'review', 'info'].includes(x.status));
  const oldest = props.length ? Math.max(...props.map(propAgeDays)) : 0;
  let s = `${filtered ? 'ضمن الفلاتر المختارة، ' : ''}تضم المحفظة ${plural(nd.length, 'شراكة واحدة', 'شراكتين', 'شراكات', 'شراكة')} مع ${plural(partners, 'جهة واحدة', 'جهتين', 'جهات', 'جهة')}، ${act ? `منها ${nf(act)} سارية حاليًا` : 'ولا توجد بينها شراكة سارية حاليًا'}.`;
  s += soon.length ? ` تنتهي ${plural(soon.length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')} خلال ${D.settings.expiryDays} يومًا، أقربها مع «${partnerName(soon[0])}» في ${fmtDate(soon[0].endDate)}.` : ` لا توجد شراكات تنتهي خلال ${D.settings.expiryDays} يومًا.`;
  if (props.length) s += ` وتعمل إدارة الشراكات على ${plural(props.length, 'مقترح واحد', 'مقترحين', 'مقترحات', 'مقترحًا')} من الإدارات${oldest > 0 ? `، أقدمها منذ ${plural(oldest, 'يوم واحد', 'يومين', 'أيام', 'يومًا')}` : ''}.`;
  return s;
}

/* ===== الصفحة ===== */
function renderDashboard(el, r) {
  const v = dashView(r);
  const out = v === 'obs' ? renderObservatory(el) : design() === 'board' ? renderDashBoard(el) : renderDashClassic(el);
  dashViewBar(el, v);
  return out;
}
function renderDashboardBand(el) {
  const now = new Date();
  el.classList.add('dashpage');
  el.innerHTML = `<div class="dash">
    <section class="xband">
      <div class="xband-bg" aria-hidden="true">${topoSVG('dash-band', { W: 1400, H: 620, levels: 16, cols: 70, focus: 'left' })}</div>
      <div class="xband-top">
        <div><h1>لوحة مؤشرات الشراكات</h1><div class="xsub">${esc(D.settings.org.dept)} — ${esc(D.settings.org.name)}<span class="xdot"></span>محدّثة تلقائيًا ${fmtDate(isoDate(now))}، <span class="num">${pad(now.getHours())}:${pad(now.getMinutes())}</span>${showDemo() ? '<span class="xdemo">تشمل بيانات تجريبية</span>' : ''}</div></div>
        <div class="xtools no-print">${can('export') ? `<button class="xbtn" data-xls title="تصدير Excel">${icon('download')}<span>Excel</span></button><button class="xbtn" data-print title="طباعة التقرير">${icon('print')}<span>طباعة</span></button>` : ''}<button class="xbtn" data-present title="وضع العرض">${icon('expand')}<span>عرض</span></button></div>
      </div>
      <div class="fbar on-dark no-print" id="dashF"></div>
      <div id="dashPrintF" class="print-only"></div>
      <div id="dashBand"></div>
    </section>
    <div id="dashBody"></div></div>`;
  const base = () => visiblePartnerships();
  new FilterBar($('#dashF', el), { dims: ['status', 'category', 'sector', 'classification', 'department', 'owner', 'year'], getList: base, state: App.dashF, onChange: () => draw(false) });
  const draw = (anim) => {
    const list = applyFilters(base(), App.dashF);
    const filtered = Object.values(App.dashF).some((v) => v && v.length);
    $('#dashPrintF', el).textContent = filtersText(App.dashF);
    $('#dashBand', el).innerHTML = dashBand(list, filtered);
    $('#dashBody', el).innerHTML = list.length ? dashBody(list) : `<div class="panel" style="margin-top:22px">${emptyHTML({ ic: 'filter', title: 'لا توجد شراكات ضمن الفلاتر الحالية', text: 'غيّر الفلاتر أو امسحها لعرض المؤشرات.', actions: '<button class="btn" onclick="App.dashF={};route()">مسح الفلاتر</button>' })}</div>`;
    hydrateFiles(el);
    if (anim) animateDash(el);
  };
  draw(true);
  el.onclick = (e) => {
    const h = e.target.closest('[data-href]'); if (h) return go(h.dataset.href);
    if (e.target.closest('[data-print]')) return window.print();
    if (e.target.closest('[data-present]')) return togglePresent();
    if (e.target.closest('[data-xls]')) return exportPartnershipsXlsx(applyFilters(base(), App.dashF), 'مؤشرات-الشراكات');
  };
  bindTips(el);
}
function dashBand(list, filtered) {
  const nd = list.filter((p) => !p.isDraft);
  const signed = nd.filter((p) => p.stage === 'signed');
  const act = nd.filter((p) => ['active', 'soon'].includes(pStatus(p))).length;
  const ser = monthlySeries(list);
  const past = ser ? ser.rows.filter((r) => !r.future).slice(-12).map((r) => r.total) : [];
  const delta = past.length > 1 ? past[past.length - 1] - past[0] : 0;
  const partnersBy = {}; nd.forEach((p) => { const s = pSector(p) || 'غير محدد'; (partnersBy[s] = partnersBy[s] || new Set()).add(p.partnerId); });
  const nPartners = new Set(nd.map((p) => p.partnerId)).size;
  const soon = nd.filter((p) => pStatus(p) === 'soon').sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  const props = visibleProposals();
  const inProc = props.filter((x) => ['submitted', 'review', 'info'].includes(x.status));
  const oldest = inProc.length ? Math.max(...inProc.map(propAgeDays)) : 0;
  const narr = esc(narrative(list, filtered)).replace(/(\d[\d,%]*)/g, '<b>$1</b>');
  const nSecs = Object.keys(partnersBy).length;
  return `<p class="xnarr">${narr}</p>
    <div class="xkpis" data-tour="dash-kpis">
      <a class="xcard" style="--k:var(--xb-accent)" href="#/partnerships${filtersToQuery({ ...App.dashF, status: ['active', 'soon'] })}">
        <div class="xk-top"><span class="xk-ic">${icon('layers')}</span><span class="xk-h">الشراكات السارية</span></div>
        <div class="xk-main"><div class="xk-num"><b class="xnum cu" data-v="${act}">${act}</b><span class="xk-of">من ${signed.length} موقّعة</span></div>${signed.length ? ringSVG(act / signed.length) : ''}</div>
        <div class="xk-viz">${sparkSVG(past)}</div>
        <div class="xk-f">${past.length > 1 && delta ? `<span class="xpill">${delta > 0 ? '+' : ''}${delta}</span> ` : ''}تطور العدد خلال آخر 12 شهرًا</div></a>
      <a class="xcard" style="--k:var(--xb-sec-2)" href="#/partners">
        <div class="xk-top"><span class="xk-ic">${icon('building')}</span><span class="xk-h">الجهات الشريكة</span></div>
        <div class="xk-main"><div class="xk-num"><b class="xnum cu" data-v="${nPartners}">${nPartners}</b><span class="xk-of">في ${plural(nSecs, 'قطاع واحد', 'قطاعين', 'قطاعات', 'قطاعًا')}</span></div></div>
        <div class="xk-viz">${segBar([...L('sectors'), 'غير محدد'].filter((s) => partnersBy[s]).map((s) => ({ l: s, n: partnersBy[s].size, c: SEC_XB(s) })))}</div>
        <div class="xk-f">التوزيع حسب قطاع الجهة</div></a>
      <a class="xcard" style="--k:var(--xb-gold)" href="#/partnerships${filtersToQuery({ ...App.dashF, status: ['soon'] })}">
        <div class="xk-top"><span class="xk-ic">${icon('calendar')}</span><span class="xk-h">تنتهي خلال ${D.settings.expiryDays} يومًا</span></div>
        <div class="xk-main"><div class="xk-num"><b class="xnum cu" data-v="${soon.length}">${soon.length}</b><span class="xk-of">${soon.length ? 'تحتاج قرار تجديد' : 'لا استحقاقات قريبة'}</span></div>${soon.length ? '<span class="xpill warn">إجراء مطلوب</span>' : ''}</div>
        <div class="xk-viz">${expiryBars(list)}</div>
        <div class="xk-f" title="${soon.length ? esc(partnerName(soon[0])) : ''}">${soon.length ? `الأقرب: <b>${esc(partnerName(soon[0]))}</b> — ${fmtDate(soon[0].endDate)}` : 'الانتهاءات المتوقعة خلال 12 شهرًا'}</div></a>
      <a class="xcard" style="--k:var(--xb-p3)" href="${can('proposal.review') ? '#/proposals?status=submitted|review|info' : '#/share'}">
        <div class="xk-top"><span class="xk-ic">${icon('inbox')}</span><span class="xk-h">مقترحات الإدارات قيد المعالجة</span></div>
        <div class="xk-main"><div class="xk-num"><b class="xnum cu" data-v="${inProc.length}">${inProc.length}</b><span class="xk-of">من ${props.filter((x) => x.status !== 'draft').length} مقدّمة</span></div>${inProc.length && oldest > (D.settings.infoAgeDays || 7) ? `<span class="xpill warn">أقدمها منذ ${plural(oldest, 'يوم', 'يومين', 'أيام', 'يومًا')}</span>` : ''}</div>
        <div class="xk-viz">${segBar([{ l: propStatusLabel('submitted'), n: inProc.filter((x) => x.status === 'submitted').length, c: 'var(--xb-p1)' }, { l: propStatusLabel('review'), n: inProc.filter((x) => x.status === 'review').length, c: 'var(--xb-p2)' }, { l: propStatusLabel('info'), n: inProc.filter((x) => x.status === 'info').length, c: 'var(--xb-p3)' }])}</div>
        <div class="xk-f">${inProc.length ? 'حسب مرحلة المراجعة' : 'لا توجد مقترحات معلّقة'}</div></a>
    </div>
    <div class="xlc"><div class="xlc-h"><span>مسار الشراكة من مقترح الإدارة إلى السريان</span><span class="prelim on-dark">${icon('info')} مراحل المقترح تصور أولي للمراجعة</span></div>${lifecycleHTML(list)}</div>`;
}
function dashBody(list) {
  const nd = list.filter((p) => !p.isDraft);
  const ser = monthlySeries(list);
  const acts = dashActions(list);
  const props = visibleProposals().filter((x) => x.status !== 'draft');
  const depts = [...new Set(props.map((x) => x.department))];
  const PST = ['submitted', 'review', 'info', 'accepted', 'converted', 'rejected'];
  const PC = { submitted: 'var(--st-up)', review: 'var(--st-soon)', info: '#E6A86B', accepted: 'var(--st-active)', converted: 'var(--sec-1)', rejected: 'var(--danger)' };
  const pmax = Math.max(1, ...depts.map((d) => props.filter((x) => x.department === d).length));
  const cells = nd.length * CORE_FIELDS.length;
  const filled = cells - nd.reduce((t, p) => t + missingFields(p).length, 0);
  const score = cells ? Math.round(filled / cells * 100) : 0;
  const fieldsMiss = CORE_FIELDS.map((k) => ({ k, l: FIELDS[k].label, n: nd.filter((p) => missingFields(p).includes(k)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 6);
  const owners = countBy(nd, 'owner');
  const cats = countBy(nd, 'category');
  const cmax = Math.max(1, ...cats.map((c) => c.n));
  const omax = Math.max(1, ...owners.map((o) => o.n));
  const cls = countBy(nd, 'classification'), actv = countBy(nd, 'activation');
  const mini = (title, data, colorFn, dim) => { const tot = data.reduce((t, d) => t + d.n, 0) || 1; let off = 0; const r = 34, C = 2 * Math.PI * r; return `<div class="mini"><svg viewBox="0 0 90 90" width="96" height="96">${data.map((d, i) => { const len = d.n / tot * C; const s = `<circle cx="45" cy="45" r="${r}" fill="none" stroke="${colorFn(d, i)}" stroke-width="11" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 45 45)" class="donut-seg" data-href="#/partnerships${filtersToQuery({ ...App.dashF, [dim]: [d.k] })}" ${tipAttr(`${d.label}: ${d.n}`)}/>`; off += len; return s; }).join('')}<text x="45" y="51" text-anchor="middle" class="mini-n">${tot}</text></svg>
    <div class="mini-l"><div class="mini-t">${title}</div>${data.map((d, i) => `<span data-href="#/partnerships${filtersToQuery({ ...App.dashF, [dim]: [d.k] })}"><i style="background:${colorFn(d, i)}"></i>${esc(d.label)}<b>${d.n}</b></span>`).join('')}</div></div>`; };
  return `<div class="dgrid dash-grid">
    <section class="dp c8" data-tour="dash-evolution"><header><div><h3>تطور محفظة الشراكات</h3><p>عدد الشراكات السارية شهريًا حسب قطاع الجهة — فعلي حتى اليوم، ومتوقع بعده وفق تواريخ الانتهاء</p></div>
      <div class="lg">${ser ? ser.secs.map((s) => `<span><i style="background:${SEC_VAR(s)}"></i>${esc(s)}</span>`).join('') : ''}</div></header>${evolutionSVG(ser)}${evolutionStats(ser, list)}</section>
    <section class="dp c4 dp-acts" data-tour="dash-actions"><header><div><h3>مركز الإجراءات</h3><p>${acts.length ? plural(acts.length, 'بند يحتاج متابعة', 'بندان يحتاجان متابعة', 'بنود تحتاج متابعة', 'بندًا يحتاج متابعة') : 'لا توجد بنود معلّقة'}</p></div></header>
      ${acts.length ? `<div class="xacts">${acts.map((a) => `<a class="xact ${a.tone}" href="${a.href}"><span class="xa-n">${a.n}</span><span class="xa-t"><b>${esc(a.t)}</b><span>${esc(a.d)}</span></span>${icon('chevL')}</a>`).join('')}</div>` : '<div class="empty-chart">لا توجد بنود معلّقة ضمن الفلاتر الحالية.</div>'}</section>
    <section class="dp c5"><header><div><h3>منظومة الشركاء</h3><p>القطاعات في الحلقة الداخلية، والجهات في الخارجية بحجم عدد شراكاتها</p></div></header>${sunburstSVG(list)}</section>
    <section class="dp c7"><header><div><h3>تقاطع الشراكات مع الإدارات</h3><p>عدد الشراكات لكل إدارة حسب قطاع الجهة — اضغط الخلية لفتح السجلات</p></div></header>${heatmapHTML(list)}</section>
    <section class="dp c12"><header><div><h3>خارطة سريان الشراكات</h3><p>من تاريخ البدء إلى تاريخ الانتهاء، مرتبة حسب أقرب انتهاء</p></div>
      <div class="lg"><span><i style="background:var(--st-active)"></i>سارية</span><span><i style="background:var(--st-soon)"></i>تنتهي خلال ${D.settings.expiryDays} يومًا</span><span><i style="background:var(--st-up)"></i>لم يبدأ سريانها</span><span><i style="background:var(--st-ended)"></i>منتهية</span></div></header>${roadmapHTML(list)}</section>
    <section class="dp c8"><header><div><h3>مقترحات الإدارات</h3><p>لكل إدارة حسب مرحلة المراجعة — لا تتأثر بفلاتر الشراكات</p></div></header>
      ${depts.length ? `<div class="pstack">${depts.sort((a, b) => props.filter((x) => x.department === b).length - props.filter((x) => x.department === a).length).map((d) => { const mine = props.filter((x) => x.department === d); return `<div class="ps-row" data-href="#/proposals?dept=${encodeURIComponent(d)}"><span class="ps-n">${esc(d)}</span><span class="ps-bar"><span style="width:${(mine.length / pmax * 100).toFixed(0)}%">${PST.map((s) => { const n = mine.filter((x) => x.status === s).length; return n ? `<i style="flex:${n};background:${PC[s]}" ${tipAttr(`${d}<br>${propStatusLabel(s)}: ${n}`)}></i>` : ''; }).join('')}</span></span><b>${mine.length}</b></div>`; }).join('')}</div>
        <div class="lg wrap" style="margin-top:14px">${PST.filter((s) => props.some((x) => x.status === s)).map((s) => `<span><i style="background:${PC[s]}"></i>${esc(propStatusLabel(s))}</span>`).join('')}</div>` : '<div class="empty-chart">لم تُقدَّم مقترحات بعد.</div>'}</section>
    <section class="dp c4"><header><div><h3>التصنيف والتفعيل</h3><p>تصنيف المذكرة وحالة تفعيل الشراكة</p></div></header>
      ${mini('تصنيف المذكرة', cls, (d, i) => ['var(--sec-1)', 'var(--sec-2)', 'var(--sec-3)', 'var(--sec-4)'][i % 4], 'classification')}
      ${mini('تفعيل الشراكة', actv, (d) => ({ 'مفعّلة': 'var(--st-active)', 'قيد التفعيل': 'var(--st-soon)', 'غير مفعّلة': 'var(--st-prep)' }[d.k] || 'var(--st-muted)'), 'activation')}</section>
    <section class="dp c6"><header><div><h3>تصنيف الشراكات</h3><p>الشراكة قد تندرج تحت أكثر من تصنيف${can('manage.lists') ? ' — <a href="#/settings/lists">إدارة القائمة</a>' : ''}</p></div></header>
      <div class="owners">${cats.map((o) => `<div class="ow cat-row" data-href="#/partnerships${filtersToQuery({ ...App.dashF, category: [o.k] })}"><span class="ow-n">${esc(o.label)}</span><span class="ow-b"><i style="--w:${(o.n / cmax * 100).toFixed(0)}%;${o.k === 'غير مصنّف' ? 'background:var(--st-muted)' : ''}"></i></span><b>${o.n}</b></div>`).join('')}</div></section>
    <section class="dp c6"><header><div><h3>المسؤولون من إدارة الشراكات</h3><p>عدد الشراكات المسندة لكل عضو</p></div></header>
      <div class="owners">${owners.map((o) => `<div class="ow" data-href="#/partnerships${filtersToQuery({ ...App.dashF, owner: [o.k] })}">${o.k === 'غير محدد' ? '<span class="av">–</span>' : avatar(o.k)}<span class="ow-n">${esc(o.label)}</span><span class="ow-b"><i style="--w:${(o.n / omax * 100).toFixed(0)}%"></i></span><b>${o.n}</b></div>`).join('')}</div></section>
    <section class="dp c12 dq"><div class="dq-score">${(() => { const r = 46, C = 2 * Math.PI * r; return `<svg viewBox="0 0 110 110" width="110" height="110"><circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--paper-3)" stroke-width="9"/><circle cx="55" cy="55" r="${r}" fill="none" stroke="${score >= 85 ? 'var(--st-active)' : score >= 65 ? 'var(--st-soon)' : 'var(--danger)'}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(score / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 55 55)" class="ring-v" style="--c:${C.toFixed(1)}"/><text x="55" y="61" text-anchor="middle" class="dq-n">${score}%</text></svg>`; })()}
      <div><h3>اكتمال البيانات الأساسية</h3><p>نسبة الحقول المعبأة من حقول ملف الحصر في السجلات المعروضة. اضغط أي حقل لفتح السجلات التي ينقصها.</p></div></div>
      <div class="dq-fields">${fieldsMiss.length ? fieldsMiss.map((f) => `<button data-href="#/partnerships?missing=${f.k}" ${tipAttr(`${f.l}: غير معبأ في ${f.n} من ${nd.length}`)}><span>${esc(f.l)}</span><i style="--w:${((nd.length - f.n) / Math.max(1, nd.length) * 100).toFixed(0)}%"></i><b>${Math.round((nd.length - f.n) / Math.max(1, nd.length) * 100)}%</b></button>`).join('') : '<div class="empty-chart">جميع الحقول الأساسية معبأة.</div>'}</div></section>
  </div>`;
}

/* — حركة الدخول وتلميحات المؤشر — */
function bindTips(root) {
  let tip = $('#tip');
  if (!tip) { tip = document.createElement('div'); tip.id = 'tip'; tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
  root.addEventListener('mousemove', (e) => {
    const t = e.target.closest('[data-tip]');
    const g = $('.ev-guide', root);
    if (!t) { tip.classList.remove('on'); if (g) g.style.display = 'none'; return; }
    tip.innerHTML = t.dataset.tip; tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX - w / 2, y = e.clientY - h - 14;
    if (y < 8) y = e.clientY + 18;
    x = Math.max(8, Math.min(innerWidth - w - 8, x));
    tip.style.transform = `translate(${x}px,${y}px)`;
    if (g) { if (t.classList.contains('ev-hit')) { const cx = +t.getAttribute('x') + +t.getAttribute('width') / 2; g.setAttribute('x1', cx); g.setAttribute('x2', cx); g.style.display = ''; } else g.style.display = 'none'; }
  });
  root.addEventListener('mouseleave', () => tip.classList.remove('on'));
}
window.addEventListener('hashchange', () => { const t = $('#tip'); t && t.classList.remove('on'); });
