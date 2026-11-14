/* =====================================================================
   الارتباط الاستراتيجي: كيف تخدم الشراكات أهداف المؤسسة ومبادراتها.
   لكل شراكة هدف أو مبادرة واحدة مع قائمة تحقق (29c2-stratcrit.js)؛ تُعدّ تابعة
   لها إذا حققت 75% على الأقل. المقترح الآلي يُبنى من نصوص الشراكة ويظهر إلى أن
   تعتمده إدارة الشراكات أو تعدّله. مصادر قديمة (نموذج المواءمة/المقترح) تُحترم.
   ===================================================================== */
if (typeof AUDIT_LABELS === 'object') AUDIT_LABELS['partnership.strategy'] = 'الارتباط الاستراتيجي';

const stratGoals = () => goalCodes().map((g) => ({ k: g.k, t: String(g.t).replace(/^[A-Z]{1,3}\d?\s*[:：]\s*/, ''), full: g.t, inits: goalInits(g.t) }));
function stratInitGoal(txt) {
  const n = normAr(txt || ''); if (!n) return '';
  for (const g of stratGoals()) if (g.inits.some((i) => normAr(i.t) === n)) return g.k;
  return '';
}
const STRAT_SRC = { strategy: 'حدّدته الإدارة العامة للاستراتيجية (نموذج المواءمة)', manual: 'معتمد من إدارة الشراكات', auto: 'مقترح آلي — بانتظار المراجعة', form: 'نموذج المواءمة الاستراتيجية', proposal: 'المقترح الأصلي' };

function pStrat(p) {
  /* 1) تقييم بقائمة التحقق (معتمد أو مقترح) */
  const propS = p.proposalId && D.proposals.find((x) => x.id === p.proposalId);
  const legacy = !p.stratAssess && !(propS && propS.stratAssess) && (() => {
    const prop = p.proposalId ? D.proposals.find((x) => x.id === p.proposalId) : null;
    const G = new Set(), I = new Set(); let src = '';
    [p, prop].filter(Boolean).forEach((r) => {
      (r.goalsLinked || []).forEach((k) => { G.add(k); src = src || 'form'; });
      if (r.strategicGoal) { G.add(goalCode(r.strategicGoal)); src = src || 'proposal'; }
      if (r.initiative) { I.add(r.initiative); const g = stratInitGoal(r.initiative); if (g) G.add(g); }
    });
    if (p.stratLinks) { (p.stratLinks.goals || []).forEach((k) => G.add(k)); (p.stratLinks.inits || []).forEach((t) => I.add(t)); src = 'manual'; }
    return G.size ? { goals: [...G], inits: [...I], src } : null;
  })();
  if (legacy) { const valid = new Set(stratGoals().map((g) => g.k)); return { ...legacy, goals: legacy.goals.filter((k) => valid.has(k)), linked: true, legacy: true }; }
  const a = stratAssessOf(p), T = a && stratTarget(a.target);
  if (!T) return { goals: [], inits: [], src: '', linked: false };
  const pct = stratPct(a.checks), linked = pct >= STRAT_PASS;
  return { goals: linked ? [T.goal.k] : [], inits: linked && T.init ? [T.init.t] : [], src: a.src || 'manual', target: a.target, T, checks: a.checks, pct, linked };
}

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
  const pending = rows.filter((r) => r.s.src === 'auto').map((r) => r.p);
  const initsAll = goals.flatMap((g) => g.inits), initsOn = initsAll.filter((i) => i.ps.length).length;
  return { goals, linked, unlinked, pending, total: list.length, goalsOn: goals.filter((g) => g.ps.length).length, initsAll: initsAll.length, initsOn };
}

/* الشارة الصغيرة: رمز الهدف/المبادرة وحلقة نسبة التحقق */
function stratMiniHTML(p) {
  const s = pStrat(p);
  if (s.legacy) return `<button type="button" class="sg-mini ok" data-sgpop="${p.id}" title="الارتباط الاستراتيجي: ${esc(s.goals.join('، '))} (${STRAT_SRC[s.src] || ''})">${icon('flag')}<b>${esc(s.goals[0] || '')}</b></button>`;
  if (!s.T) return '';
  const C = 2 * Math.PI * 7, code = s.T.init ? s.T.init.c.replace('.I', '·') : s.T.goal.k;
  return `<button type="button" class="sg-mini ${s.linked ? 'ok' : 'no'} ${s.src === 'auto' ? 'auto' : ''} ${s.src === 'strategy' ? 'lock' : ''}" data-sgpop="${p.id}" title="${esc(`${s.T.kind}: ${s.T.label} — تحقق ${s.checks.filter(Boolean).length} من ${s.checks.length}${s.src === 'auto' ? ' (مقترح آلي)' : ''}`)}"><svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7" class="t"/><circle cx="9" cy="9" r="7" class="v" stroke-dasharray="${(s.pct * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 9 9)"/></svg><b>${esc(code)}</b></button>`;
}

/* بطاقة قائمة التحقق المنبثقة */
function stratPop(p, anchor, onChange) {
  $('#sgPop') && $('#sgPop').remove();
  const canEdit0 = can('edit.partnership') && !App.share;
  let canEdit = canEdit0;
  const el = document.createElement('div'); el.id = 'sgPop'; el.className = 'sg-pop'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'الارتباط الاستراتيجي');
  document.body.appendChild(el);
  const place = () => {
    const r = anchor.getBoundingClientRect(), w = Math.min(380, innerWidth - 24); el.style.width = w + 'px';
    let left = r.right - w; left = Math.max(12, Math.min(innerWidth - w - 12, left));
    let top = r.bottom + 8; if (top + el.offsetHeight > innerHeight - 12) top = Math.max(12, r.top - el.offsetHeight - 8);
    el.style.left = left + 'px'; el.style.top = top + 'px';
  };
  const save = async (a, msg) => {
    p.stratAssess = { target: a.target, checks: a.checks.slice(), src: 'manual', by: Session.userName(), at: nowISO() };
    await Repo.save('partnerships', p);
    const T = stratTarget(a.target);
    await Repo.log('partnership.strategy', 'partnership', p.id, p.code, `${T ? T.label : a.target} — ${a.checks.filter(Boolean).length}/${a.checks.length}`);
    if (msg) toast(msg);
    if (onChange) onChange();
  };
  const draw = () => {
    const s = pStrat(p);
    if (s.legacy) {
      el.innerHTML = `<header class="sg-pop-h"><b>الارتباط الاستراتيجي</b><button type="button" class="sg-x" aria-label="إغلاق">${icon('x')}</button></header>
        <p class="small">${s.goals.map((k) => `<span class="sg-code">${esc(k)}</span>`).join(' ')} <span class="muted">من ${esc(STRAT_SRC[s.src] || '')}</span></p>
        ${canEdit ? `<button type="button" class="btn sm" data-sgconv>${icon('check')} التقييم بقائمة التحقق</button>` : ''}`;
      return place();
    }
    const a = stratAssessOf(p); canEdit = canEdit0 && a.src !== 'strategy'; const T = stratTarget(a.target), items = stratItems(a.target), n = a.checks.filter(Boolean).length, pct = stratPct(a.checks), ok = pct >= STRAT_PASS;
    el.innerHTML = `<header class="sg-pop-h"><span class="sg-code">${esc(T.goal.k)}</span><div><small>${T.kind}${T.init ? ` · ${esc(T.goal.t)}` : ''}</small><b>${esc(T.label)}</b></div><button type="button" class="sg-x" aria-label="إغلاق">${icon('x')}</button></header>
      <div class="sg-pop-st ${ok ? 'ok' : 'no'}"><span class="sg-pop-bar"><i style="width:${Math.round(pct * 100)}%"></i><em style="inset-inline-start:${STRAT_PASS * 100}%"></em></span><b>${n}/${items.length}</b><span>${ok ? 'تُحتسب تابعة' : 'دون الحد (75%)'}</span></div>
      <ul class="sg-ck">${items.map((it, i) => `<li><button type="button" class="${a.checks[i] ? 'on' : ''}" data-sgck="${i}" ${canEdit ? '' : 'disabled'} aria-pressed="${!!a.checks[i]}"><i>${icon('check')}</i><span>${esc(it.t)}</span></button></li>`).join('')}</ul>
      ${canEdit ? `<label class="sg-pop-sel"><span>الهدف أو المبادرة</span><select class="in" data-sgsel>${stratGoals().map((g) => `<optgroup label="${esc(g.k)} — ${esc(g.t.slice(0, 60))}"><option value="${g.k}" ${a.target === g.k ? 'selected' : ''}>${esc(g.k)} · الهدف كاملًا</option>${g.inits.map((i) => `<option value="${i.c}" ${a.target === i.c ? 'selected' : ''}>${esc(i.c.split('.')[1])} · ${esc(i.t)}</option>`).join('')}</optgroup>`).join('')}</select></label>` : ''}
      ${a.src === 'strategy' ? `<p class="sg-lock">${icon('lock')} حُدِّد في نموذج المواءمة الاستراتيجية، ويُعدَّل من النموذج نفسه.${canEdit0 && typeof openForm === 'function' ? ` <button type="button" class="linkbtn" data-sgform>فتح النموذج</button>` : ''}</p>` : ''}<footer class="sg-pop-f"><span class="sg-src ${a.src}">${esc(STRAT_SRC[a.src] || '')}</span>${canEdit && a.src === 'auto' ? `<button type="button" class="btn sm primary" data-sgok>${icon('check')} اعتماد</button>` : ''}${canEdit && a.src !== 'auto' ? `<button type="button" class="linkbtn" data-sgreset>المقترح الآلي</button>` : ''}<a class="linkbtn" href="#/strategy">${icon('flag')} المحفظة</a></footer>`;
    place();
  };
  draw();
  el.addEventListener('click', async (e) => {
    if (e.target.closest('.sg-x')) return close();
    if (e.target.closest('[data-sgform]')) { close(); return openForm('partnership', p, 'alignment', { onDone: () => { if (onChange) onChange(); } }); }
    if (e.target.closest('[data-sgconv]')) { const s = stratSuggest(p); p.stratLinks = null; p.goalsLinked = []; await save(s, 'حُوّل الارتباط إلى قائمة التحقق'); return draw(); }
    const ck = e.target.closest('[data-sgck]');
    if (ck) {
      const a0 = stratAssessOf(p), a = { target: a0.target, checks: a0.checks.slice() }, i = +ck.dataset.sgck;
      a.checks[i] = !a.checks[i];
      if (stratPct(a.checks) < STRAT_PASS && stratPct(a0.checks) >= STRAT_PASS) {
        /* خرجت من الهدف/المبادرة: تنتقل إلى أقرب هدف أو مبادرة تحقق الحد إن وُجدت */
        const alt = stratSuggestExcept(p, a.target);
        if (alt) { const from = stratTarget(a.target).label; await save(alt, `لم تعد تحقق 75% من «${from}» — نُقلت إلى «${stratTarget(alt.target).label}»`); return draw(); }
        await save(a, 'لم تعد الشراكة تحقق 75% — أصبحت غير مرتبطة'); return draw();
      }
      await save(a); return draw();
    }
    if (e.target.closest('[data-sgok]')) { const a = stratAssessOf(p); await save(a, 'اعتُمد الارتباط الاستراتيجي'); return draw(); }
    if (e.target.closest('[data-sgreset]')) { p.stratAssess = null; await Repo.save('partnerships', p); delete p._sgSug; toast('أُعيد المقترح الآلي'); if (onChange) onChange(); return draw(); }
  });
  el.addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-sgsel]'); if (!sel) return;
    await save({ target: sel.value, checks: stratAutoChecks(p, sel.value) }); draw();
  });
  const away = (e) => { if (!el.contains(e.target) && !anchor.contains(e.target)) close(); };
  const esc_ = (e) => { if (e.key === 'Escape') close(); };
  function close() { el.remove(); document.removeEventListener('mousedown', away, true); document.removeEventListener('keydown', esc_); }
  setTimeout(() => { document.addEventListener('mousedown', away, true); document.addEventListener('keydown', esc_); }, 0);
}
function stratSuggestExcept(p, key) {
  const txt = stratText(p); let best = null;
  stratGoals().forEach((g) => [...g.inits.map((i) => i.c), g.k].forEach((k) => {
    if (k === key) return; const ch = stratAutoChecks(p, k, txt), pc = stratPct(ch); if (pc < STRAT_PASS) return;
    const sc = pc * 100 + (k.includes('.') ? 2 : 0) + (k.split('.')[0] === String(key).split('.')[0] ? 3 : 0) - (k.startsWith('EO') ? 6 : 0);
    if (!best || sc > best.sc) best = { target: k, checks: ch, sc };
  }));
  return best;
}
/* أي شارة في أي صفحة تفتح البطاقة */
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-sgpop]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const p = D.partnerships.find((x) => x.id === b.dataset.sgpop); if (!p) return;
  stratPop(p, b, () => { const nb = $(`[data-sgpop="${p.id}"]`); if (nb) nb.outerHTML = stratMiniHTML(p); if (App.route && App.route.name === 'strategy') route(); });
}, true);

const stratChip = (p) => { const pr = partnerById(p.partnerId), s = pStrat(p); return `<a class="sg-p ${s.src === 'auto' ? 'auto' : ''}" href="#/partnerships/${p.id}" title="${esc(partnerName(p))}${s.src === 'auto' ? ' — مقترح آلي' : ''}">${plateHTML(pr, 28)}<span>${esc(partnerName(p))}</span></a>`; };

function renderStrategy(el) {
  const st = App.strat = App.strat || { view: 'map' };
  const canEdit = can('edit.partnership') && !App.share, canLists = can('manage.lists') && !App.share;
  const base = () => visiblePartnerships().filter((p) => !p.isDraft && p.stage !== 'cancel');
  const draw = () => {
    const list = base(), S = stratSummary(list), pct = S.total ? Math.round(S.linked.length / S.total * 100) : 0;
    const maxG = Math.max(1, ...S.goals.map((g) => g.ps.length));
    const kpi = (v, l, s, tone = '') => `<div class="sg-k ${tone}"><b>${v}</b><span>${l}</span>${s ? `<small>${s}</small>` : ''}</div>`;
    const mapView = `<div class="sg-goals">${S.goals.map((g) => `<section class="sg-g ${g.ps.length ? '' : 'gap'}">
        <header><span class="sg-code">${esc(g.k)}</span><h3>${esc(g.t)}</h3><div class="sg-n"><b>${g.ps.length}</b><small>${g.ps.length === 1 ? 'شراكة' : 'شراكات'}</small></div></header>
        <div class="sg-bar"><i style="width:${(g.ps.length / maxG * 100).toFixed(1)}%"></i></div>
        ${g.inits.length ? `<ul class="sg-inits">${g.inits.map((i) => `<li class="${i.ps.length ? '' : 'gap'}"><span class="sg-it"><em>${esc(i.c.split('.')[1] || '')}</em>${esc(i.t)}</span><span class="sg-ps">${i.ps.length ? i.ps.slice(0, 5).map(stratChip).join('') + (i.ps.length > 5 ? `<span class="sg-more">+${i.ps.length - 5}</span>` : '') : '<span class="sg-gap">فجوة: لا توجد شراكة</span>'}</span></li>`).join('')}</ul>` : ''}
        ${g.noInit.length ? `<div class="sg-noinit"><small>مرتبطة بالهدف كاملًا دون مبادرة بعينها</small><div class="sg-ps">${g.noInit.map(stratChip).join('')}</div></div>` : ''}
      </section>`).join('')}</div>
      <section class="panel sg-un"><h2>${icon('flag')} شراكات لا تحقق 75% من أي هدف أو مبادرة <span class="muted small">${S.unlinked.length}</span></h2>
        ${S.unlinked.length ? `<div class="sg-ps wrap">${S.unlinked.map((p) => `<span class="sg-unp">${stratChip(p)}${stratMiniHTML(p)}</span>`).join('')}</div>` : '<p class="muted small">كل الشراكات تحقق الحد الأدنى لهدف أو مبادرة.</p>'}</section>`;
    const rows = list.map((p) => ({ p, s: pStrat(p) })).sort((a, b) => (a.s.src === 'auto' ? 0 : 1) - (b.s.src === 'auto' ? 0 : 1) || (a.s.linked ? 1 : 0) - (b.s.linked ? 1 : 0) || partnerName(a.p).localeCompare(partnerName(b.p), 'ar'));
    const review = `<div class="panel sg-mx-w"><div class="row" style="justify-content:space-between;margin:0 0 12px;gap:10px;flex-wrap:wrap"><p class="small muted" style="margin:0">لكل شراكة هدف أو مبادرة واحدة. اضغط الشارة لفتح قائمة التحقق: علّم أو ألغِ العناصر، أو غيّر الهدف. تحت 75% تنتقل الشراكة تلقائيًا إلى أقرب هدف أو مبادرة تحققه.</p>${canEdit && S.pending.length ? `<button type="button" class="btn sm primary" data-sgall>${icon('check')} اعتماد كل المقترحات (${S.pending.length})</button>` : ''}</div>
      <div class="sg-mx-s"><table class="sg-mx sg-rv"><thead><tr><th>الشراكة</th><th>الهدف أو المبادرة</th><th>التحقق</th><th>الحالة</th></tr></thead><tbody>
      ${rows.map(({ p, s }) => `<tr><td><span class="sg-mx-p">${plateHTML(partnerById(p.partnerId), 28)}<a href="#/partnerships/${p.id}">${esc(partnerName(p))}</a></span></td>
        <td class="sg-rv-t">${s.T ? `<span class="sg-code sm">${esc(s.T.goal.k)}</span>${esc(s.T.label)}` : s.legacy ? s.goals.map((k) => `<span class="sg-code sm">${esc(k)}</span>`).join(' ') : '—'}</td>
        <td>${stratMiniHTML(p)}</td>
        <td><span class="sg-src ${s.src}">${s.src === 'auto' ? 'مقترح آلي' : s.src === 'strategy' ? 'الاستراتيجية' : s.legacy ? esc(STRAT_SRC[s.src] || '') : 'معتمد'}</span>${s.T && !s.linked ? ' <span class="sg-gap">دون 75%</span>' : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
    const crit = `<div class="sg-crit">${stratGoals().map((g) => `<section class="sg-g"><header><span class="sg-code">${esc(g.k)}</span><h3>${esc(g.t)}</h3>${canLists ? `<button type="button" class="icon-btn" data-sgedit="${g.k}" title="تعديل البنود">${icon('edit')}</button>` : ''}</header>
        <ol class="sg-cl">${stratItems(g.k).map((it) => `<li>${esc(it.t)}</li>`).join('')}</ol>
        ${g.inits.map((i) => `<div class="sg-ci"><div class="sg-ci-h"><em>${esc(i.c.split('.')[1])}</em><b>${esc(i.t)}</b>${canLists ? `<button type="button" class="icon-btn sm" data-sgedit="${i.c}" title="تعديل البنود">${icon('edit')}</button>` : ''}</div><ol class="sg-cl">${stratItems(i.c).map((it) => `<li>${esc(it.t)}</li>`).join('')}</ol></div>`).join('')}</section>`).join('')}</div>`;
    el.innerHTML = `<div class="ph"><div><h1>الارتباط الاستراتيجي</h1><p>كيف تخدم الشراكات أهداف المؤسسة ومبادراتها. لكل هدف ومبادرة قائمة تحقق من أربعة عناصر؛ تُعدّ الشراكة تابعة إذا حققت 75% منها على الأقل.</p></div>
      <div class="ph-actions"><div class="seg sg-vw"><button type="button" data-sgv="map" class="${st.view === 'map' ? 'on' : ''}">${icon('flag')} الخريطة</button><button type="button" data-sgv="rv" class="${st.view === 'rv' ? 'on' : ''}">${icon('check')} مراجعة الربط${S.pending.length ? ` <em class="sg-badge">${S.pending.length}</em>` : ''}</button><button type="button" data-sgv="crit" class="${st.view === 'crit' ? 'on' : ''}">${icon('list')} معايير الربط</button></div><button class="btn" type="button" onclick="window.print()">${icon('print')} طباعة</button></div></div>
      <div class="sg-kpis">${kpi(pct + '%', 'من الشراكات تحقق 75% لهدف أو مبادرة', `${S.linked.length} من ${S.total}`, 'pri')}${kpi(`${S.goalsOn}/${S.goals.length}`, 'أهداف تخدمها شراكات', S.goals.length - S.goalsOn ? `${S.goals.length - S.goalsOn} بلا شراكات` : 'كل الأهداف مغطاة')}${kpi(`${S.initsOn}/${S.initsAll}`, 'مبادرات تخدمها شراكات', S.initsAll - S.initsOn ? `${S.initsAll - S.initsOn} فجوة` : '')}${kpi(S.pending.length, 'مقترح آلي بانتظار الاعتماد', S.pending.length ? 'من «مراجعة الربط»' : 'كل الارتباطات معتمدة', S.pending.length ? 'warn' : '')}</div>
      ${st.view === 'rv' ? review : st.view === 'crit' ? crit : mapView}`;
    hydrateFiles(el);
  };
  draw();
  el.onclick = async (e) => {
    const v = e.target.closest('[data-sgv]'); if (v) { st.view = v.dataset.sgv; return draw(); }
    if (e.target.closest('[data-sgall]')) {
      const L_ = base().filter((p) => pStrat(p).src === 'auto'); if (!L_.length) return;
      if (!(await confirmDlg(`اعتماد ${L_.length} ارتباطًا مقترحًا آليًا كما هي؟ يمكن تعديل أي منها لاحقًا.`))) return;
      for (const p of L_) { const a = stratAssessOf(p); p.stratAssess = { target: a.target, checks: a.checks.slice(), src: 'manual', by: Session.userName(), at: nowISO() }; await Repo.save('partnerships', p); }
      await Repo.log('partnership.strategy', 'settings', 'strategy', 'الارتباط الاستراتيجي', `اعتماد ${L_.length} مقترحًا آليًا`);
      toast(`اعتُمد ${L_.length} ارتباطًا`); return draw();
    }
    const ed = e.target.closest('[data-sgedit]'); if (ed) stratCritDlg(ed.dataset.sgedit, draw);
  };
}

/* تعديل بنود قائمة تحقق هدف أو مبادرة */
function stratCritDlg(key, done) {
  const T = stratTarget(key), cur = stratItems(key).map((x) => x.t);
  const m = Modal.open({
    title: `معايير الربط — ${T ? T.label : key}`,
    body: `<p class="small muted" style="margin:0 0 10px">أربعة عناصر يُفضَّل؛ تُعدّ الشراكة تابعة إذا حققت 75% منها. العناصر المعدّلة لا تُعلَّم آليًا في المقترحات؛ تُعلَّم يدويًا.</p>${[0, 1, 2, 3].map((i) => `<input class="in" data-ci="${i}" value="${esc(cur[i] || '')}" placeholder="العنصر ${i + 1}" style="margin-bottom:8px">`).join('')}`,
    foot: `<button class="btn" data-x>إلغاء</button><button class="btn" data-def>الافتراضي</button><button class="btn primary" data-save>حفظ</button>`,
  });
  m.el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-x]')) return m.close();
    const def = e.target.closest('[data-def]'), sv = e.target.closest('[data-save]'); if (!def && !sv) return;
    D.settings.stratCrit = D.settings.stratCrit || {};
    if (def) delete D.settings.stratCrit[key];
    else { const v = $$('[data-ci]', m.el).map((x) => x.value.trim()).filter(Boolean); if (v.length < 2) return toast('أدخل عنصرين على الأقل.', 'err'); D.settings.stratCrit[key] = v; }
    await Repo.saveSettings(); await Repo.log('partnership.strategy', 'settings', 'strategy', 'معايير الربط', T ? T.label : key);
    m.close(); toast('حُفظت المعايير'); if (done) done();
  });
}

/* قسم صفحة الشراكة */
function stratSectionHTML(p) {
  const s = pStrat(p);
  if (s.legacy) return `<section class="dsec" id="strat"><h2>الارتباط الاستراتيجي <span class="src">${esc(STRAT_SRC[s.src] || '')}</span></h2><div class="row" style="gap:8px;align-items:center">${s.goals.map((k) => `<span class="sg-code">${esc(k)}</span>`).join('')}${stratMiniHTML(p)}</div></section>`;
  if (!s.T) return '';
  const items = stratItems(s.target);
  return `<section class="dsec" id="strat"><h2>الارتباط الاستراتيجي <span class="src">${esc(STRAT_SRC[s.src] || '')}</span></h2>
    <div class="sg-sec"><div class="sg-sec-h"><span class="sg-code">${esc(s.T.goal.k)}</span><div><small>${s.T.kind}${s.T.init ? ` ضمن هدف: ${esc(s.T.goal.t)}` : ''}</small><b>${esc(s.T.label)}</b></div>${stratMiniHTML(p)}</div>
      <ul class="sg-ck ro">${items.map((it, i) => `<li><span class="${s.checks[i] ? 'on' : ''}"><i>${icon('check')}</i><span>${esc(it.t)}</span></span></li>`).join('')}</ul>
      <p class="xs muted" style="margin:8px 0 0">${s.linked ? `تحقق ${s.checks.filter(Boolean).length} من ${items.length} — تُحتسب تابعة لهذا ${s.T.kind}.` : `تحقق ${s.checks.filter(Boolean).length} من ${items.length} فقط — دون الحد (75%)، فلا تُحتسب تابعة.`} اضغط الشارة للتعديل.</p></div></section>`;
}
