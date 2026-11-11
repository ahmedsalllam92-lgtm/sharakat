/* =====================================================================
   طباعة الإحاطة المفصّلة: نسخة مصممة للورق (A4 أفقي) بدل تصغير الشاشة.
   صفحتان كثيفتان: مؤشرات + شبكة مخططات صغيرة متجاورة، ثم المسار الزمني والمخاطر والقرارات.
   ===================================================================== */
function boPrintHTML(list) {
  const X = boStats(list), V = valueData(X.nd), PL = wfPipeline(X.nd), o = D.settings.org, dt = boDates();
  const n = X.nd.length || 1;
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const bar = (v, max, col = '#0F4433') => `<span class="bp-bar"><i style="width:${Math.max(2, pct(v, max))}%;background:${col}"></i></span>`;
  const card = (t, body, cls = '') => `<section class="bp-card ${cls}"><h3>${t}</h3>${body}</section>`;
  /* المؤشرات */
  const kpis = [
    [X.act.length, 'شراكة سارية', `من ${X.signed.length} موقّعة`],
    [X.partners.size, 'جهة شريكة', `${Object.keys(X.secMap).length} قطاعات`],
    [X.soon.length, 'تنتهي خلال 90 يومًا', 'قرار تجديد'],
    [PL.items.length, 'قيد الإجراء', `${PL.late.length} متأخرة`],
    [X.score + '%', 'سلامة المحفظة', ''],
    [V.avg !== null ? V.avg + '/100' : '—', 'متوسط التقييم', `${V.ev.length} مقيّمة`],
    [V.fin.total ? sarShort(V.fin.total) : '—', 'القيمة التقديرية', V.fin.cash ? `صُرف ${pct(V.fin.spent, V.fin.cash)}%` : ''],
    [X.complete + '%', 'اكتمال البيانات', ''],
  ];
  /* سلامة المحفظة */
  const health = card('مؤشر سلامة المحفظة', `<div class="bp-health"><div class="bp-ring" style="--v:${X.score}"><b>${X.score}%</b></div><ul>${X.health.map((h) => `<li><span>${h.l}</span>${bar(h.v, 100, h.v >= 70 ? '#2E8B6E' : h.v >= 50 ? '#B8913F' : '#B5543C')}<b>${h.v}%</b></li>`).join('')}</ul></div>`);
  /* التوزيع: القطاع × الحالة */
  const SG = [['active', 'سارية', ['active']], ['soon', 'قريبًا', ['soon']], ['pipe', 'إعداد/توقيع', ['prep', 'sign', 'hold', 'nodates', 'upcoming']], ['ended', 'منتهية', ['ended', 'cancel']]];
  const secs = Object.keys(X.secMap).length ? [...L('sectors'), 'غير محدد'].filter((s) => X.nd.some((p) => (pSector(p) || 'غير محدد') === s)) : [];
  const cnt = (s, ks) => X.nd.filter((p) => (pSector(p) || 'غير محدد') === s && ks.includes(pStatus(p))).length;
  const dist = card('توزيع المحفظة', `<table class="bp-tbl"><thead><tr><th>القطاع</th>${SG.map(([, l]) => `<th>${l}</th>`).join('')}<th>الكل</th></tr></thead><tbody>${secs.map((s) => `<tr><th><i style="background:${SEC_VAR(s)}"></i>${esc(s)}</th>${SG.map(([, , ks]) => { const c = cnt(s, ks); return `<td>${c || '<span class="z">·</span>'}</td>`; }).join('')}<td><b>${X.nd.filter((p) => (pSector(p) || 'غير محدد') === s).length}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><th>المجموع</th>${SG.map(([, , ks]) => `<td>${X.nd.filter((p) => ks.includes(pStatus(p))).length}</td>`).join('')}<td><b>${X.nd.length}</b></td></tr></tfoot></table>`);
  /* سير الإجراءات */
  const pmax = Math.max(1, ...PL.phases.map((x) => x.items.length), PL.activating);
  const proc = card('سير الإجراءات', `<ul class="bp-rows">${PL.phases.map(({ ph, items }, i) => `<li><span><em>${i + 1}</em>${esc(ph.t)}</span>${bar(items.length, pmax, '#1A5C46')}<b>${items.length}</b></li>`).join('')}<li><span><em>∞</em>تفعيل وتقارير</span>${bar(PL.activating, pmax, '#B8913F')}<b>${PL.activating}</b></li></ul>${PL.late.length ? `<p class="bp-note">متأخرة: ${PL.late.slice(0, 4).map((x) => esc(x.name)).join('، ')}</p>` : ''}`);
  /* المقترحات */
  const P = X.props, fs = [['مقدّمة', P.length], ['قيد الدراسة', P.filter((x) => ['submitted', 'review', 'info'].includes(x.status)).length], ['مقبولة', P.filter((x) => ['accepted', 'converted'].includes(x.status)).length], ['حُوّلت لشراكات', P.filter((x) => x.status === 'converted').length]];
  const fmax = Math.max(1, ...fs.map((x) => x[1]));
  const funnel = card('مقترحات الإدارات', `<ul class="bp-rows">${fs.map(([l, v]) => `<li><span>${l}</span>${bar(v, fmax, '#2F7A5E')}<b>${v}</b></li>`).join('')}</ul>`);
  /* القيمة والتقييم */
  const typ = V.types.slice(0, 4), tmax = Math.max(1, ...typ.map((x) => x.n));
  const value = card('القيمة والتقييم', `<div class="bp-mini"><div><small>القيمة</small><b>${V.fin.total ? sarShort(V.fin.total) : '—'}</b></div><div><small>مساهمة الشركاء</small><b>${V.fin.partner ? sarShort(V.fin.partner) : '—'}</b></div><div><small>متوسط التقييم</small><b>${V.avg !== null ? V.avg : '—'}</b></div></div>
    <ul class="bp-rows">${typ.map((t) => `<li><span>${esc(t.k)}</span>${bar(t.n, tmax, '#A47C32')}<b>${t.n}</b></li>`).join('')}</ul>`);
  /* الأثر */
  const hls = X.nd.filter((p) => p.highlight && p.highlight.value).slice(0, 5);
  const impact = card('الأثر المتحقق', hls.length ? `<ul class="bp-imp">${hls.map((p) => `<li><b>${esc(p.highlight.value)}</b><span>${esc(p.highlight.label || '')}<small>${esc(partnerName(p))}</small></span></li>`).join('')}</ul>` : '<p class="bp-note">لم تُسجَّل أرقام أثر بعد.</p>');
  /* الاستحقاقات */
  const soonL = X.nd.filter((p) => p.endDate && ['active', 'soon'].includes(pStatus(p))).sort((a, b) => (a.endDate < b.endDate ? -1 : 1)).slice(0, 7);
  const dues = card('أقرب الاستحقاقات', `<table class="bp-tbl l"><tbody>${soonL.map((p) => { const d = daysLeft(p); return `<tr class="${d !== null && d <= 90 ? 'w' : ''}"><th>${esc(partnerName(p))}</th><td>${fmtDate(p.endDate, 'short')}</td><td>${d !== null ? nf(d) + ' يومًا' : '—'}</td></tr>`; }).join('')}</tbody></table>`);
  /* المسار الزمني المضغوط */
  const rows = X.nd.filter((p) => p.startDate && p.endDate).sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  let lanes = '';
  if (rows.length) {
    const t = today(), y0 = Math.min(...rows.map((p) => parseDate(p.startDate).getFullYear()), t.getFullYear()), y1 = Math.max(...rows.map((p) => parseDate(p.endDate).getFullYear()), t.getFullYear()) + 1;
    const T0 = +new Date(y0, 0, 1), T1 = +new Date(y1, 0, 1), Pp = (d) => ((+d - T0) / (T1 - T0) * 100).toFixed(2);
    const years = []; for (let y = y0; y < y1; y++) years.push(y);
    const col = (p) => ({ active: '#2E8B6E', soon: '#C9A24F', ended: '#C9C2B2', upcoming: '#9CC9B4' }[pStatus(p)] || '#8FA39A');
    const half = Math.ceil(rows.length / 2);
    const block = (rs) => `<div class="bp-gantt"><div class="bp-gh"><span></span><div>${years.map((y) => `<em style="right:${Pp(new Date(y, 0, 1))}%">${y}</em>`).join('')}<i class="now" style="right:${Pp(t)}%"></i></div></div>${rs.map((p) => `<div class="bp-gr"><span>${esc(partnerName(p))}</span><div><i style="right:${Pp(parseDate(p.startDate))}%;width:${Math.max(0.8, Pp(parseDate(p.endDate)) - Pp(parseDate(p.startDate)))}%;background:${col(p)}"></i><i class="now" style="right:${Pp(t)}%"></i></div></div>`).join('')}</div>`;
    lanes = `<div class="bp-gantt2">${block(rows.slice(0, half))}${block(rows.slice(half))}</div><div class="bp-lg"><span><i style="background:#2E8B6E"></i>سارية</span><span><i style="background:#C9A24F"></i>تنتهي قريبًا</span><span><i style="background:#9CC9B4"></i>لم يبدأ</span><span><i style="background:#C9C2B2"></i>منتهية</span><span><i class="ln"></i>اليوم</span></div>`;
  }
  /* المخاطر والقرارات */
  const risks = boRisks(X, list).slice(0, 8), sev = { h: 'مرتفعة', m: 'متوسطة', l: 'منخفضة' };
  const riskT = card('سجل المتابعة والمخاطر', `<table class="bp-tbl l r"><thead><tr><th>البند</th><th>الأهمية</th><th>المسؤول</th><th>الموعد</th></tr></thead><tbody>${risks.map((r) => `<tr><th>${esc(r.t)}</th><td class="s-${r.s}">${sev[r.s] || ''}</td><td>${esc(r.o || '—')}</td><td>${r.due ? fmtDate(r.due, 'short') : '—'}</td></tr>`).join('')}</tbody></table>`);
  const decs = X.soon.map((p) => ['قرار', `تجديد الشراكة مع «${partnerName(p)}» أو إنهاؤها`]).concat(X.props.filter((x) => x.status === 'accepted').length ? [['قرار', 'اعتماد تحويل المقترحات المقبولة إلى شراكات']] : []).concat(X.act.filter((p) => p.activation && p.activation !== 'مفعّلة').length ? [['توجيه', `تفعيل ${X.act.filter((p) => p.activation && p.activation !== 'مفعّلة').length} شراكة سارية غير مفعّلة`]] : []).concat(X.complete < 80 ? [['توجيه', `استكمال البيانات الأساسية (الاكتمال ${X.complete}%)`]] : []).slice(0, 8);
  const decT = card('القرارات والتوصيات', `<ol class="bp-dec">${decs.map(([k, t]) => `<li><em class="${k === 'قرار' ? 'd' : 'g'}">${k}</em>${esc(t)}</li>`).join('') || '<li>لا توجد قرارات معلّقة.</li>'}</ol>`);
  const head = (pg) => `<header class="bp-hd"><div><small>${esc(o.name)} · ${esc(o.dept)}</small><h1>محفظة الشراكات الاستراتيجية${pg > 1 ? ' — تابع' : ''}</h1></div><dl><div><dt>التاريخ</dt><dd>${esc(dt.hijri)} · ${esc(dt.greg)}</dd></div><div><dt>النطاق</dt><dd>${X.nd.length} شراكة</dd></div><div><dt>صفحة</dt><dd>${pg} من 2</dd></div></dl></header>`;
  return `<article class="bp" dir="rtl">
    <div class="bp-pg">${head(1)}
      <section class="bp-kpis">${kpis.map(([v, l, s]) => `<div><b>${esc(String(v))}</b><span>${l}</span>${s ? `<small>${esc(s)}</small>` : ''}</div>`).join('')}</section>
      <div class="bp-grid g3">${health}${dist}${proc}</div>
      <div class="bp-grid g4">${impact}${value}${funnel}${dues}</div>
    </div>
    <div class="bp-pg">${head(2)}
      ${card(`المسار الزمني للشراكات <em>${rows.length} شراكة بتواريخ</em>`, lanes || '<p class="bp-note">لا توجد شراكات بتواريخ.</p>', 'wide')}
      <div class="bp-grid g2">${riskT}${decT}</div>
      <footer class="bp-ft"><span>المصدر: سجلات منظومة الشراكات لحظة الطباعة</span><span>${esc(o.platform)}</span></footer>
    </div>
  </article>`;
}
function printBoardBrief(list) {
  document.querySelectorAll('#bpPrint').forEach((x) => x.remove());
  const host = document.createElement('div'); host.id = 'bpPrint'; host.innerHTML = boPrintHTML(list);
  document.body.appendChild(host);
  const html = document.documentElement; html.classList.add('printing-bp');
  let st = $('#bpPage'); if (!st) { st = document.createElement('style'); st.id = 'bpPage'; document.head.appendChild(st); }
  st.textContent = '@page{size:A4 landscape;margin:8mm}';
  const done = () => { html.classList.remove('printing-bp'); st.textContent = ''; host.remove(); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  window.print();
}
