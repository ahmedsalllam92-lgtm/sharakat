/* ===== الجزء السفلي من لوحة المؤشرات: سطح واحد متصل بتصورات متنوعة ===== */
function squarify(items, x, y, w, h) {
  const total = items.reduce((t, i) => t + i.n, 0) || 1, out = [];
  let rest = items.map((i) => ({ ...i, a: (i.n / total) * w * h }));
  const worst = (row, side) => { const s = row.reduce((t, r) => t + r.a, 0), mx = Math.max(...row.map((r) => r.a)), mn = Math.min(...row.map((r) => r.a)); return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
  while (rest.length) {
    const side = Math.min(w, h); let row = [rest[0]], i = 1;
    while (i < rest.length && worst([...row, rest[i]], side) <= worst(row, side)) { row.push(rest[i]); i++; }
    const s = row.reduce((t, r) => t + r.a, 0);
    if (w >= h) { const cw = s / h; let yy = y; row.forEach((r) => { const rh = r.a / cw; out.push({ ...r, x, y: yy, w: cw, h: rh }); yy += rh; }); x += cw; w -= cw; }
    else { const rh = s / w; let xx = x; row.forEach((r) => { const rw = r.a / rh; out.push({ ...r, x: xx, y, w: rw, h: rh }); xx += rw; }); y += rh; h -= rh; }
    rest = rest.slice(row.length);
  }
  return out;
}
const TM_DIMS = [['sector', 'القطاع'], ['category', 'تصنيف الشراكة'], ['department', 'الإدارات'], ['classification', 'تصنيف المذكرة']];
function treemapHTML(nd, dim) {
  const rows = countBy(nd, dim).filter((r) => r.n).sort((a, b) => b.n - a.n);
  const sum = rows.reduce((t, r) => t + r.n, 0) || 1, sel = App.dashF[dim] || [];
  const tones = ['t1', 't2', 't3', 't4', 't5', 't6'];
  const W = 100, H = 54;
  const rects = rows.length ? squarify(rows, 0, 0, W, H) : [];
  return `<div class="tm-head"><div class="tm-sw" role="tablist" aria-label="بُعد التوزيع">${TM_DIMS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === dim}" class="${k === dim ? 'on' : ''}" data-tmdim="${k}">${l}</button>`).join('')}</div><span class="tm-note">${dim === 'category' || dim === 'department' ? 'الشراكة قد تُحسب في أكثر من خانة' : `${nd.length} شراكة`}</span></div>
    ${rows.length ? `<div class="tm dz-bars" style="--ar:${(H / W * 100).toFixed(2)}%">${rects.map((r, i) => { const big = r.w * r.h > 380, mid = r.w * r.h > 150; return `<button type="button" class="dzb-r tm-b ${tones[Math.min(i, 5)]} ${/^غير/.test(r.k) ? 'mut' : ''} ${sel.includes(r.k) ? 'sel' : ''} ${big ? 'big' : mid ? 'mid' : 'sm'}" data-cf="${dim}|${esc(r.k)}" style="right:${r.x.toFixed(3)}%;top:${(r.y / H * 100).toFixed(3)}%;width:${r.w.toFixed(3)}%;height:${(r.h / H * 100).toFixed(3)}%;--i:${i}" ${tipAttr(`<b>${esc(r.label)}</b>: ${r.n} (${Math.round(r.n / sum * 100)}%)<br><small>اضغط لتصفية اللوحة</small>`)}><span class="dzb-l">${esc(r.label)}</span><b>${r.n}</b><em>${Math.round(r.n / sum * 100)}%</em></button>`; }).join('')}</div>` : '<div class="empty-chart">لا توجد بيانات ضمن النطاق.</div>'}`;
}
function ownerRingsHTML(nd) {
  const ow = countBy(nd, 'owner').filter((r) => r.n);
  if (!ow.length) return '<div class="empty-chart">لا توجد بيانات.</div>';
  const R = 27, C = 2 * Math.PI * R;
  return `<div class="dz2-owners rg-grid">${ow.map((r) => {
    const ps = nd.filter((p) => FILTER_DIMS.owner.get(p).includes(r.k));
    const a = ps.filter((p) => ['active', 'soon'].includes(pStatus(p))).length, s = ps.filter((p) => pStatus(p) === 'soon').length;
    const la = (a - s) / r.n * C, ls = s / r.n * C;
    return `<button type="button" class="rg-c ${(App.dashF.owner || []).includes(r.k) ? 'sel' : ''}" data-cf="owner|${esc(r.k)}" ${tipAttr(`<b>${esc(r.label)}</b><br>${r.n} شراكات، منها ${a} سارية${s ? ` و${s} تنتهي قريبًا` : ''}<br><small>اضغط لتصفية اللوحة</small>`)}>
      <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${R}" class="rg-tr"/><circle cx="32" cy="32" r="${R}" class="rg-a" stroke-dasharray="${la.toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 32 32)"/><circle cx="32" cy="32" r="${R}" class="rg-s" stroke-dasharray="${ls.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-la).toFixed(2)}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle">${esc(initials(r.label))}</text></svg>
      <span class="rg-t"><b>${esc(r.label)}</b><small>${r.n} ${r.n === 1 ? 'شراكة' : r.n === 2 ? 'شراكتان' : 'شراكات'}، ${a} سارية</small></span></button>`;
  }).join('')}</div>`;
}
function countdownHTML(exp) {
  if (!exp.length) return '<div class="dz-exp ct-empty"><p>لا توجد شراكات تنتهي خلال 12 شهرًا.</p></div>';
  const R = 30, C = 2 * Math.PI * R, A = D.settings.alertDays || 30, X = D.settings.expiryDays;
  return `<div class="dz-exp ct-row">${exp.slice(0, 4).map((p) => {
    const dl = daysLeft(p), tone = dl <= A ? 'urg' : dl <= X ? 'warn' : 'ok', f = Math.max(0.03, Math.min(1, dl / 365));
    return `<a class="ct-c ${tone}" href="#/partnerships/${p.id}" ${tipAttr(`${esc(partnerName(p))}<br>ينتهي ${fmtDate(p.endDate)}`)}>
      <svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="${R}" class="ct-tr"/><circle cx="36" cy="36" r="${R}" class="ct-v" stroke-dasharray="${(f * C).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 36 36)"/></svg>
      <span class="ct-n"><b>${dl}</b><small>يومًا</small></span>
      <span class="ct-t"><b>${esc(partnerName(p))} ${demoTag(p)}</b><small>${fmtDate(p.endDate)}</small><small>${esc(p.classification || '')}${(p.owners || []).length ? `، ${esc(p.owners.join('، '))}` : ''}</small></span></a>`;
  }).join('')}${exp.length > 4 ? `<a class="ct-more" href="#/partnerships${filtersToQuery({ ...App.dashF, status: ['soon', 'active'] })}">و${exp.length - 4} شراكات أخرى خلال العام</a>` : ''}</div>`;
}
function proposalFlowHTML(pv) {
  if (!pv.length) return '<div class="empty-chart">لا توجد مقترحات.</div>';
  const ST = [['submitted', 'مقدَّم'], ['review', 'قيد الدراسة'], ['info', 'بانتظار الاستكمال'], ['accepted', 'مقبول'], ['converted', 'محوّل إلى شراكة']];
  const n = (s) => pv.filter((x) => x.status === s).length, mx = Math.max(1, ...ST.map(([s]) => n(s)), n('rejected'));
  const sz = (v) => (v ? Math.round(26 + 26 * Math.sqrt(v / mx)) : 22);
  const rej = n('rejected'), decided = pv.filter((x) => ['accepted', 'converted', 'rejected'].includes(x.status)).length, ok = n('accepted') + n('converted');
  return `<div class="dz-funnel pf">${ST.map(([s, l], i) => `<a class="dz-fr pf-s ${n(s) ? '' : 'z'} pf-${s}" href="#/proposals?status=${s}" style="--sz:${sz(n(s))}px" ${tipAttr(`${l}: ${n(s)}<br><small>اضغط لفتح المقترحات</small>`)}><span class="pf-node"><b>${n(s)}</b></span><span class="pf-l">${l}</span></a>`).join('')}
    <a class="dz-fr pf-s pf-rej ${rej ? '' : 'z'}" href="#/proposals?status=rejected" style="--sz:${sz(rej)}px" ${tipAttr(`غير مقبول: ${rej}`)}><span class="pf-node"><b>${rej}</b></span><span class="pf-l">غير مقبول</span></a></div>
    ${decided ? `<p class="pf-rate">نسبة القبول <b>${Math.round(ok / decided * 100)}%</b> من ${decided} ${decided === 1 ? 'مقترح' : 'مقترحات'} حُسم أمرها</p>` : ''}`;
}
function qualityMatrixHTML(nd) {
  const ps = nd.slice().sort((a, b) => missingFields(b).length - missingFields(a).length).slice(0, 30);
  const fields = CORE_FIELDS.map((k) => ({ k, l: FIELDS[k].label, miss: new Set(ps.filter((p) => missingFields(p).includes(k)).map((p) => p.id)) })).sort((a, b) => b.miss.size - a.miss.size);
  return `<div class="dz-fields qm" style="--cols:${ps.length}">${fields.map((f) => { const pct = Math.round((ps.length - f.miss.size) / (ps.length || 1) * 100); return `<div class="qm-r"><a class="qm-l" href="#/partnerships?missing=${f.k}" title="فتح السجلات التي ينقصها هذا الحقل">${esc(f.l)}</a><span class="qm-dots">${ps.map((p) => `<a class="qm-d ${f.miss.has(p.id) ? 'x' : ''}" href="#/partnerships/${p.id}" ${tipAttr(`<b>${esc(partnerName(p))}</b><br>${esc(f.l)}: ${f.miss.has(p.id) ? 'غير معبأ' : 'معبأ'}`)}></a>`).join('')}</span><b class="qm-p ${pct < 70 ? 'low' : pct < 100 ? 'mid' : ''}">${pct}%</b></div>`; }).join('')}</div>
    <div class="qm-lg"><span><i></i>معبأ</span><span><i class="x"></i>غير معبأ</span><span>كل نقطة شراكة، والأعمدة مرتبة من الأكثر نقصًا</span></div>`;
}
