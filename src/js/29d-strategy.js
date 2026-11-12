/* =====================================================================
   الارتباط الاستراتيجي: كيف تخدم الشراكات أهداف المؤسسة ومبادراتها
   المصدر بالترتيب: ربط يدوي من إدارة الشراكات (stratLinks) إن وُجد، وإلا
   نموذج المواءمة الاستراتيجية (goalsLinked) + الهدف والمبادرة في المقترح الأصلي.
   ===================================================================== */
if (typeof AUDIT_LABELS === 'object') AUDIT_LABELS['partnership.strategy'] = 'الارتباط الاستراتيجي';

const stratGoals = () => goalCodes().map((g) => ({ k: g.k, t: String(g.t).replace(/^[A-Z]{1,3}\d?\s*[:：]\s*/, ''), full: g.t, inits: goalInits(g.t) }));
/* المبادرة النصية ← رمز هدفها */
function stratInitGoal(txt) {
  const n = normAr(txt || ''); if (!n) return '';
  for (const g of stratGoals()) if (g.inits.some((i) => normAr(i.t) === n)) return g.k;
  return '';
}
function pStrat(p) {
  if (p.stratLinks) return { goals: [...(p.stratLinks.goals || [])], inits: [...(p.stratLinks.inits || [])], src: 'manual' };
  const prop = p.proposalId ? D.proposals.find((x) => x.id === p.proposalId) : null;
  const G = new Set(), I = new Set(); let src = '';
  [p, prop].filter(Boolean).forEach((r) => {
    (r.goalsLinked || []).forEach((k) => { G.add(k); src = src || 'form'; });
    if (r.strategicGoal) { G.add(goalCode(r.strategicGoal)); src = src || 'proposal'; }
    if (r.initiative) { I.add(r.initiative); const g = stratInitGoal(r.initiative); if (g) G.add(g); }
  });
  const valid = new Set(stratGoals().map((g) => g.k));
  return { goals: [...G].filter((k) => valid.has(k)), inits: [...I], src };
}
const STRAT_SRC = { manual: 'ربط إدارة الشراكات', form: 'نموذج المواءمة الاستراتيجية', proposal: 'المقترح الأصلي' };

/* ملخص المحفظة */
function stratSummary(list) {
  const G = stratGoals();
  const rows = list.map((p) => ({ p, s: pStrat(p) }));
  const goals = G.map((g) => {
    const ps = rows.filter((r) => r.s.goals.includes(g.k));
    const inits = g.inits.map((i) => ({ ...i, ps: rows.filter((r) => r.s.inits.some((x) => normAr(x) === normAr(i.t))).map((r) => r.p) }));
    const noInit = ps.filter((r) => !r.s.inits.some((x) => g.inits.some((i) => normAr(i.t) === normAr(x)))).map((r) => r.p);
    return { ...g, ps: ps.map((r) => r.p), inits, noInit };
  });
  const linked = rows.filter((r) => r.s.goals.length).map((r) => r.p), unlinked = rows.filter((r) => !r.s.goals.length).map((r) => r.p);
  const initsAll = goals.flatMap((g) => g.inits), initsOn = initsAll.filter((i) => i.ps.length).length;
  return { goals, linked, unlinked, total: list.length, goalsOn: goals.filter((g) => g.ps.length).length, initsAll: initsAll.length, initsOn };
}

const stratChip = (p) => { const pr = partnerById(p.partnerId); return `<a class="sg-p" href="#/partnerships/${p.id}" title="${esc(partnerName(p))}">${plateHTML(pr, 28)}<span>${esc(partnerName(p))}</span></a>`; };

function renderStrategy(el) {
  const st = App.strat = App.strat || { view: 'map' };
  const canEdit = can('edit.partnership') && !App.share;
  const base = () => visiblePartnerships().filter((p) => !p.isDraft && p.stage !== 'cancel');
  const draw = () => {
    const list = base(), S = stratSummary(list), pct = S.total ? Math.round(S.linked.length / S.total * 100) : 0;
    const maxG = Math.max(1, ...S.goals.map((g) => g.ps.length));
    const kpi = (v, l, s, tone = '') => `<div class="sg-k ${tone}"><b>${v}</b><span>${l}</span>${s ? `<small>${s}</small>` : ''}</div>`;
    const mapView = `<div class="sg-goals">${S.goals.map((g) => `<section class="sg-g ${g.ps.length ? '' : 'gap'}">
        <header><span class="sg-code">${esc(g.k)}</span><h3>${esc(g.t)}</h3><div class="sg-n"><b>${g.ps.length}</b><small>${g.ps.length === 1 ? 'شراكة' : 'شراكات'}</small></div></header>
        <div class="sg-bar"><i style="width:${(g.ps.length / maxG * 100).toFixed(1)}%"></i></div>
        ${g.inits.length ? `<ul class="sg-inits">${g.inits.map((i) => `<li class="${i.ps.length ? '' : 'gap'}"><span class="sg-it"><em>${esc(i.c.split('.')[1] || '')}</em>${esc(i.t)}</span><span class="sg-ps">${i.ps.length ? i.ps.slice(0, 5).map(stratChip).join('') + (i.ps.length > 5 ? `<span class="sg-more">+${i.ps.length - 5}</span>` : '') : '<span class="sg-gap">فجوة: لا توجد شراكة</span>'}</span></li>`).join('')}</ul>` : ''}
        ${g.noInit.length ? `<div class="sg-noinit"><small>مرتبطة بالهدف دون تحديد مبادرة</small><div class="sg-ps">${g.noInit.map(stratChip).join('')}</div></div>` : ''}
      </section>`).join('')}</div>
      <section class="panel sg-un"><h2>${icon('flag')} شراكات بلا ارتباط استراتيجي <span class="muted small">${S.unlinked.length}</span></h2>
        ${S.unlinked.length ? `<div class="sg-ps wrap">${S.unlinked.map((p) => canEdit ? `<button type="button" class="sg-p" data-sglink="${p.id}" title="ربط بالأهداف">${plateHTML(partnerById(p.partnerId), 28)}<span>${esc(partnerName(p))}</span>${icon('plus')}</button>` : stratChip(p)).join('')}</div>` : '<p class="muted small">كل الشراكات مرتبطة بهدف واحد على الأقل.</p>'}</section>`;
    const G = stratGoals();
    const rows = list.map((p) => ({ p, s: pStrat(p) })).sort((a, b) => (a.s.goals.length ? 1 : 0) - (b.s.goals.length ? 1 : 0) || partnerName(a.p).localeCompare(partnerName(b.p), 'ar'));
    const matrix = `<div class="panel sg-mx-w"><p class="small muted" style="margin:0 0 12px">اضغط على الخانة لربط الشراكة بالهدف أو إلغاء الربط؛ يُحفظ فورًا. لتحديد المبادرات اضغط «تفصيل».</p><div class="sg-mx-s"><table class="sg-mx"><thead><tr><th>الشراكة</th>${G.map((g) => `<th title="${esc(g.full)}">${esc(g.k)}</th>`).join('')}<th></th></tr></thead><tbody>
      ${rows.map(({ p, s }) => `<tr><td><span class="sg-mx-p">${plateHTML(partnerById(p.partnerId), 28)}<a href="#/partnerships/${p.id}">${esc(partnerName(p))}</a></span></td>${G.map((g) => `<td><button type="button" class="sg-cell ${s.goals.includes(g.k) ? 'on' : ''}" data-sgcell="${p.id}|${g.k}" ${canEdit ? '' : 'disabled'} aria-pressed="${s.goals.includes(g.k)}" title="${esc(g.full)}">${icon('check')}</button></td>`).join('')}<td>${canEdit ? `<button type="button" class="linkbtn" data-sglink="${p.id}">تفصيل</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
    el.innerHTML = `<div class="ph"><div><h1>الارتباط الاستراتيجي</h1><p>كيف تخدم الشراكات أهداف المؤسسة الاستراتيجية ومبادراتها، وأين الفجوات التي تحتاج شراكات جديدة.</p></div>
      <div class="ph-actions">${canEdit ? `<div class="seg sg-vw"><button type="button" data-sgv="map" class="${st.view === 'map' ? 'on' : ''}">${icon('flag')} الخريطة</button><button type="button" data-sgv="mx" class="${st.view === 'mx' ? 'on' : ''}">${icon('grid')} الربط السريع</button></div>` : ''}<button class="btn" type="button" onclick="window.print()">${icon('print')} طباعة</button></div></div>
      <div class="sg-kpis">${kpi(pct + '%', 'من الشراكات مرتبطة بالأهداف', `${S.linked.length} من ${S.total}`, 'pri')}${kpi(`${S.goalsOn}/${S.goals.length}`, 'أهداف تخدمها شراكات', S.goals.length - S.goalsOn ? `${S.goals.length - S.goalsOn} بلا شراكات` : 'كل الأهداف مغطاة')}${kpi(`${S.initsOn}/${S.initsAll}`, 'مبادرات تخدمها شراكات', S.initsAll - S.initsOn ? `${S.initsAll - S.initsOn} فجوة` : '')}${kpi(S.unlinked.length, 'شراكة بلا ارتباط', S.unlinked.length ? 'تحتاج ربطًا' : '', S.unlinked.length ? 'warn' : '')}</div>
      ${st.view === 'mx' && canEdit ? matrix : mapView}`;
    hydrateFiles(el);
  };
  draw();
  el.onclick = async (e) => {
    const v = e.target.closest('[data-sgv]'); if (v) { st.view = v.dataset.sgv; return draw(); }
    const c = e.target.closest('[data-sgcell]');
    if (c && canEdit) {
      const [pid, k] = c.dataset.sgcell.split('|'), p = D.partnerships.find((x) => x.id === pid); if (!p) return;
      const s = pStrat(p), on = s.goals.includes(k);
      const goals = on ? s.goals.filter((x) => x !== k) : [...s.goals, k];
      const inits = on ? s.inits.filter((x) => stratInitGoal(x) !== k) : s.inits;
      p.stratLinks = { goals, inits, by: Session.userName(), at: nowISO() };
      c.classList.toggle('on', !on); c.setAttribute('aria-pressed', !on);
      await Repo.save('partnerships', p); await Repo.log('partnership.strategy', 'partnership', p.id, p.code, `${on ? 'إلغاء الربط بـ' : 'ربط بـ'}${k}`);
      return;
    }
    const l = e.target.closest('[data-sglink]'); if (l) { const p = D.partnerships.find((x) => x.id === l.dataset.sglink); if (p) stratLinkDlg(p, draw); }
  };
}

/* نافذة ربط شراكة بالأهداف ومبادراتها */
function stratLinkDlg(p, done) {
  const s = pStrat(p), G = stratGoals();
  const on = (t) => s.inits.some((x) => normAr(x) === normAr(t));
  const m = Modal.open({
    title: `الارتباط الاستراتيجي — ${partnerName(p)}`, size: 'lg',
    body: `<p class="small muted" style="margin:0 0 12px">اختر الأهداف التي تخدمها الشراكة، ثم المبادرات تحت كل هدف إن وُجدت.${s.src && s.src !== 'manual' ? ` الاختيار الحالي مأخوذ من ${STRAT_SRC[s.src]}.` : ''}</p>
      <div class="sg-dlg">${G.map((g) => `<div class="sg-dg ${s.goals.includes(g.k) ? 'on' : ''}"><label class="sg-dgh"><input type="checkbox" data-g="${g.k}" ${s.goals.includes(g.k) ? 'checked' : ''}><span class="sg-code">${esc(g.k)}</span><b>${esc(g.t)}</b></label>
        ${g.inits.length ? `<div class="sg-di">${g.inits.map((i) => `<label><input type="checkbox" data-i="${esc(i.t)}" data-ig="${g.k}" ${on(i.t) ? 'checked' : ''}><span>${esc(i.t)}</span></label>`).join('')}</div>` : ''}</div>`).join('')}</div>`,
    foot: `<button class="btn" data-x>إلغاء</button><button class="btn primary" data-save>حفظ الربط</button>`,
  });
  m.el.addEventListener('change', (e) => {
    const i = e.target.closest('[data-i]'); if (i && i.checked) { const g = $(`[data-g="${i.dataset.ig}"]`, m.el); g.checked = true; }
    const g = e.target.closest('[data-g]'); if (g && !g.checked) $$(`[data-ig="${g.dataset.g}"]`, m.el).forEach((x) => { x.checked = false; });
    $$('.sg-dg', m.el).forEach((d) => d.classList.toggle('on', $('[data-g]', d).checked));
  });
  m.el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-x]')) return m.close();
    if (!e.target.closest('[data-save]')) return;
    const goals = $$('[data-g]:checked', m.el).map((x) => x.dataset.g), inits = $$('[data-i]:checked', m.el).map((x) => x.dataset.i);
    p.stratLinks = { goals, inits, by: Session.userName(), at: nowISO() };
    await Repo.save('partnerships', p); await Repo.log('partnership.strategy', 'partnership', p.id, p.code, goals.length ? goals.join('، ') : 'بلا ارتباط');
    m.close(); toast('حُفظ الارتباط الاستراتيجي'); if (done) done();
  });
}

/* قسم صفحة الشراكة */
function stratSectionHTML(p, canEdit) {
  const s = pStrat(p), G = stratGoals().filter((g) => s.goals.includes(g.k));
  return `<section class="dsec" id="strat"><h2>الارتباط الاستراتيجي ${s.src ? `<span class="src">${STRAT_SRC[s.src]}</span>` : ''}</h2>
    ${G.length ? `<div class="sg-pg">${G.map((g) => { const its = g.inits.filter((i) => s.inits.some((x) => normAr(x) === normAr(i.t))); return `<div class="sg-pgi"><span class="sg-code">${esc(g.k)}</span><div><b>${esc(g.t)}</b>${its.length ? `<ul>${its.map((i) => `<li>${esc(i.t)}</li>`).join('')}</ul>` : ''}</div></div>`; }).join('')}</div>`
      : `<p class="muted small">لم تُربط الشراكة بأهداف المؤسسة الاستراتيجية بعد.</p>`}
    <div class="row" style="gap:8px;margin-top:12px">${canEdit ? `<button type="button" class="btn sm" data-sgedit>${icon('edit')} ${G.length ? 'تعديل الربط' : 'ربط بالأهداف'}</button>` : ''}<a class="btn sm ghost" href="#/strategy">${icon('flag')} الارتباط الاستراتيجي للمحفظة</a></div></section>`;
}
