/* ===== الجهات الشريكة ===== */
function partnerStats(pr) {
  const ps = D.partnerships.filter((p) => p.partnerId === pr.id && (can('view.drafts') || !p.isDraft));
  const props = D.proposals.filter((x) => x.partnerId === pr.id || nameSimilarity(x.partnerName, pr.name) >= 0.85 || (pr.aliases || []).some((a) => nameSimilarity(x.partnerName, a) >= 0.85));
  return { ps, props };
}
function dupPairs() {
  const list = D.partners.filter((x) => showDemo() || !x.demo);
  const out = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const s = nameSimilarity(list[i].name, list[j].name);
    if (s < 0.6) continue;
    const n = (x) => D.partnerships.filter((p) => p.partnerId === x.id).length;
    const [a, b] = n(list[i]) > n(list[j]) || (n(list[i]) === n(list[j]) && (list[i].createdAt || '') < (list[j].createdAt || '')) ? [list[j], list[i]] : [list[i], list[j]];
    out.push([a, b, s]);
  }
  return out;
}
function renderPartners(el) {
  if (!can('view.partners')) { el.innerHTML = noAccessHTML(); return; }
  const st = { q: '', sector: '', kind: '' };
  const manage = can('manage.partners');
  el.innerHTML = `<div class="ph"><div><h1>الجهات الشريكة</h1><p>سجل موحد للجهات يمنع تكرار الجهة بأسماء مختلفة، ويربط كل جهة بشراكاتها ومقترحاتها.</p></div>
    <div class="ph-actions">${manage ? `<button class="btn primary" data-addp>${icon('plus')} جهة جديدة</button>` : ''}</div></div>
    <div id="dupBox"></div>
    <div class="reg-tools"><div class="searchbox">${icon('search')}<input id="pq" type="search" placeholder="بحث بالاسم أو الاسم البديل…" aria-label="بحث في الجهات"></div>
      <div class="seg" id="pkind"><button class="on" data-k="">كل الجهات</button><button data-k="has">لها شراكات</button><button data-k="target">مستهدفة <b class="pk-n">${D.partners.filter((x) => x.target && (showDemo() || !x.demo) && !D.partnerships.some((p) => p.partnerId === x.id)).length}</b></button></div>
      <div class="seg" id="psec"><button class="on" data-s="">الكل</button>${L('sectors').map((s) => `<button data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
    <div id="pbody" data-tour="partners-list"></div>`;
  const draw = () => {
    const pairs = manage ? dupPairs() : [];
    $('#dupBox', el).innerHTML = pairs.length ? `<div class="note warn" style="margin-bottom:16px">${icon('merge')}<span class="grow">جهات بأسماء متقاربة قد تكون مكررة: ${pairs.slice(0, 4).map(([a, b]) => `<b>${esc(a.name)}</b> و<b>${esc(b.name)}</b> <button class="btn sm" data-merge="${a.id}" data-into="${b.id}" style="margin-inline-start:6px">مراجعة ودمج</button>`).join(' — ')}</span></div>` : '';
    const isT = (x) => !!x.target && !D.partnerships.some((p) => p.partnerId === x.id);
    const list = D.partners.filter((x) => (showDemo() || !x.demo) && (!st.sector || x.sector === st.sector) && (!st.kind || (st.kind === 'target' ? isT(x) : D.partnerships.some((p) => p.partnerId === x.id))) && matchQ(x.name + ' ' + (x.aliases || []).join(' '), st.q)).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    if (!list.length) { $('#pbody', el).innerHTML = `<div class="panel">${emptyHTML({ ic: 'building', title: st.q ? `لا توجد جهة باسم «${st.q}»` : 'لا توجد جهات', text: st.q ? 'يتجاهل البحث الفروق بين الهمزات والتاء المربوطة وكلمات مثل «شركة» و«جمعية».' : '', actions: manage ? `<button class="btn primary" data-addp>${icon('plus')} إضافة جهة</button>` : '' })}</div>`; return; }
    $('#pbody', el).innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الجهة</th><th>القطاع</th><th>الشراكات</th><th>المقترحات</th><th>أسماء بديلة</th>${manage ? '<th></th>' : ''}</tr></thead><tbody>
      ${list.map((pr) => { const s = partnerStats(pr); return `<tr data-prow="${pr.id}"><td><div class="t-name">${plateHTML(pr, 40)}<div><b>${esc(pr.name)} ${demoTag(pr)}${isT(pr) ? ` <span class="chip pk-t" title="${esc(pr.targetNote || 'جهة مستهدفة')}">مستهدفة</span>` : ''}</b>${isT(pr) && pr.targetNote && pr.targetNote !== 'جهة مستهدفة في ملف الحصر' ? `<span>${esc(pr.targetNote)}</span>` : ''}${pr.website ? `<span dir="ltr">${esc(pr.website)}</span>` : ''}</div></div></td>
        <td>${esc(pr.sector || '—')}</td><td>${s.ps.length ? `<a href="#/partnerships?partner=${pr.id}">${s.ps.length}</a>` : '<span class="faint">0</span>'}</td><td>${s.props.length || '<span class="faint">0</span>'}</td>
        <td class="small muted">${esc((pr.aliases || []).join('، ') || '—')}</td>${manage ? `<td style="white-space:nowrap"><button class="btn sm ghost" data-editp="${pr.id}">${icon('edit')} تعديل</button></td>` : ''}</tr>`; }).join('')}</tbody></table></div>`;
    hydrateFiles($('#pbody', el));
  };
  draw();
  $('#pq', el).oninput = debounce((e) => { st.q = e.target.value.trim(); draw(); }, 150);
  el.onclick = async (e) => {
    const k = e.target.closest('[data-k]'); if (k) { st.kind = k.dataset.k; $$('#pkind button', el).forEach((b) => b.classList.toggle('on', b === k)); draw(); return; }
    const s = e.target.closest('[data-s]'); if (s) { st.sector = s.dataset.s; $$('#psec button', el).forEach((b) => b.classList.toggle('on', b === s)); draw(); return; }
    if (e.target.closest('[data-addp]')) { const r = await partnerDialog(null); if (r) draw(); return; }
    const ed = e.target.closest('[data-editp]'); if (ed) { e.stopPropagation(); const r = await partnerDialog(partnerById(ed.dataset.editp)); if (r) draw(); return; }
    const mg = e.target.closest('[data-merge]'); if (mg) { const ok = await mergeDialog(partnerById(mg.dataset.merge), partnerById(mg.dataset.into)); if (ok) draw(); return; }
    const row = e.target.closest('[data-prow]'); if (row && !e.target.closest('a,button')) go('#/partners/' + row.dataset.prow);
  };
}
function partnerDialog(pr) {
  return new Promise((res) => {
    const isNew = !pr;
    const v = pr ? clone(pr) : { name: '', sector: '', aliases: [], website: '', notes: '', logoFileId: null };
    const m = Modal.open({
      title: isNew ? 'جهة جديدة' : 'تعديل الجهة', size: 'lg',
      body: `<div class="grid2">
        <div class="field span2" data-f="name"><label>اسم الجهة</label><input class="in" id="pn" value="${esc(v.name)}"><span class="err">اكتب اسم الجهة.</span><div id="psim"></div></div>
        <div class="field"><label>القطاع</label><select class="in" id="ps"><option value="">غير محدد</option>${L('sectors').map((s) => `<option ${s === v.sector ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
        <div class="field"><label>الموقع الإلكتروني</label><input class="in" id="pw" dir="ltr" value="${esc(v.website || '')}" placeholder="https://"></div>
        <div class="field span2"><label>أسماء بديلة</label>${comboHTML('aliases', { options: v.aliases || [], value: v.aliases || [], multi: true, allowAdd: true, addLabel: 'إضافة اسم بديل' })}<span class="hint">الأسماء الأخرى التي ترد بها الجهة في المراسلات والملفات؛ تُستخدم في البحث وكشف التكرار.</span></div>
        <div class="field"><label>الشعار</label><div class="row" id="plogo">${v.logoFileId ? `<div class="plate s56"><img data-file="${esc(v.logoFileId)}" alt=""></div>` : plateHTML(v.name ? v : null, 56)}<label class="btn sm">${icon('upload')} رفع شعار<input type="file" accept="image/*" hidden id="pl"></label>${v.logoFileId ? '<button class="btn sm ghost" id="plx" type="button">إزالة</button>' : ''}</div><span class="hint">يُفضَّل PNG أو SVG بخلفية شفافة.</span></div>
        <div class="field"><label>ملاحظات</label><textarea class="in" id="pnotes" rows="3" style="min-height:70px">${esc(v.notes || '')}</textarea></div>
      </div>`,
      foot: `<button class="btn primary" data-ok>${isNew ? 'إضافة الجهة' : 'حفظ'}</button><button class="btn ghost" data-mclose>إلغاء</button>${!isNew && can('manage.partners') ? `<span class="sp"></span><button class="btn ghost" data-mergeit>${icon('merge')} دمج في جهة أخرى</button>${partnerStats(pr).ps.length ? '' : `<button class="btn danger" data-delp>${icon('trash')} حذف</button>`}` : ''}`,
      onClose: (x) => res(x),
    });
    bindCombos(m.el);
    hydrateFiles(m.el);
    const sim = () => { const list = findSimilarPartners($('#pn', m.el).value, pr && pr.id); $('#psim', m.el).innerHTML = list.length ? `<div class="dup-warn">${icon('alert')}<span>جهات مشابهة موجودة: ${list.map((x) => `<b>${esc(x.name)}</b>`).join('، ')}</span></div>` : ''; };
    $('#pn', m.el).oninput = debounce(sim, 200); sim();
    $('#pl', m.el).onchange = async (e) => { try { const f = await saveUpload(e.target.files[0]); v.logoFileId = f.id; $('#plogo .plate', m.el).outerHTML = `<div class="plate s56"><img data-file="${f.id}" alt=""></div>`; hydrateFiles(m.el); } catch (er) { toast(er.message, 'err'); } };
    const px = $('#plx', m.el); if (px) px.onclick = () => { v.logoFileId = null; px.remove(); $('#plogo .plate', m.el).outerHTML = plateHTML(v, 56); };
    m.el.querySelector('[data-ok]').onclick = async () => {
      const name = $('#pn', m.el).value.trim();
      if (!name) { $('[data-f="name"]', m.el).classList.add('invalid'); return; }
      const dupExact = D.partners.find((x) => x.id !== (pr && pr.id) && normAr(x.name) === normAr(name));
      if (dupExact) { toast(`الجهة «${dupExact.name}» مسجلة بالفعل.`, 'err'); return; }
      const rec = pr || { id: uid('ptr'), createdAt: nowISO(), demo: false };
      Object.assign(rec, { name, sector: $('#ps', m.el).value, website: $('#pw', m.el).value.trim(), notes: $('#pnotes', m.el).value.trim(), aliases: $('[data-cb="aliases"]', m.el).value || [], logoFileId: v.logoFileId });
      await Repo.save('partners', rec);
      await Repo.log(isNew ? 'partner.create' : 'partner.update', 'partner', rec.id, rec.name);
      toast(isNew ? 'أُضيفت الجهة' : 'حُفظت بيانات الجهة');
      m.close(rec);
    };
    const mg = m.el.querySelector('[data-mergeit]');
    if (mg) mg.onclick = async () => { m.el.remove(); Modal.stack = Modal.stack.filter((x) => x !== m); res(await mergeDialog(pr, null)); };
    const dl = m.el.querySelector('[data-delp]');
    if (dl) dl.onclick = async () => { if (await confirmDlg(`حذف الجهة «${esc(pr.name)}»؟ لا ترتبط بها أي شراكة.`, { danger: true, ok: 'حذف' })) { await Repo.remove('partners', pr.id); await Repo.log('partner.delete', 'partner', pr.id, pr.name); toast('حُذفت الجهة'); m.close(true); } };
  });
}
function mergeDialog(from, into) {
  return new Promise((res) => {
    const opts = D.partners.filter((x) => x.id !== from.id && (showDemo() || !x.demo)).map((x) => ({ value: x.id, label: x.name, sub: x.sector || '' }));
    const fs = partnerStats(from);
    const m = Modal.open({
      title: 'دمج جهتين',
      body: `<p style="margin-bottom:14px;line-height:1.9">تُنقل ${plural(fs.ps.length, 'شراكة واحدة', 'شراكتان', 'شراكات', 'شراكة')} من <b>${esc(from.name)}</b> إلى الجهة المختارة، ويُضاف «${esc(from.name)}» إلى أسمائها البديلة، ثم تُحذف الجهة المكررة.</p>
        <div class="field"><label>الجهة المعتمدة</label>${comboHTML('into', { options: opts, value: into ? into.id : '' })}</div>`,
      foot: `<button class="btn primary" data-ok>${icon('merge')} دمج</button><button class="btn ghost" data-mclose>إلغاء</button>`,
      onClose: (x) => res(!!x),
    });
    bindCombos(m.el);
    m.el.querySelector('[data-ok]').onclick = async () => {
      const tid = $('[data-cb="into"]', m.el).value;
      if (!tid) return toast('اختر الجهة المعتمدة', 'err');
      const to = partnerById(tid);
      for (const p of D.partnerships.filter((x) => x.partnerId === from.id)) { p.partnerId = to.id; await Repo.save('partnerships', p, { touch: false }); }
      for (const x of D.proposals.filter((y) => y.partnerId === from.id)) { x.partnerId = to.id; await Repo.save('proposals', x, { touch: false }); }
      to.aliases = [...new Set([...(to.aliases || []), from.name, ...(from.aliases || [])])];
      if (!to.sector && from.sector) to.sector = from.sector;
      if (!to.logoFileId && from.logoFileId) to.logoFileId = from.logoFileId;
      await Repo.save('partners', to);
      await Repo.remove('partners', from.id);
      await Repo.log('partner.merge', 'partner', to.id, to.name, `دُمجت «${from.name}» فيها`);
      toast('دُمجت الجهتان');
      m.close(true);
    };
  });
}
function renderPartner(el, r) {
  const pr = partnerById(r.params.id);
  if (!pr || (pr.demo && !showDemo())) { el.innerHTML = emptyHTML({ ic: 'search', title: 'لم يُعثر على الجهة', actions: '<a class="btn" href="#/partners">سجل الجهات</a>' }); return; }
  const s = partnerStats(pr);
  el.innerHTML = `<div class="ph"><div class="row" style="gap:18px;align-items:center">${plateEditHTML(pr, 96, can('manage.partners'))}<div><h1>${esc(pr.name)} ${demoTag(pr)}</h1><p>${esc(pr.sector || 'قطاع غير محدد')}${(pr.aliases || []).length ? ` — يُعرف أيضًا بـ: ${esc(pr.aliases.join('، '))}` : ''}</p>${pr.website ? `<a href="${esc(pr.website)}" target="_blank" rel="noopener" dir="ltr" class="small">${esc(pr.website)}</a>` : ''}</div></div>
    <div class="ph-actions"><a class="btn ghost" href="#/partners">${icon('arrowR')} الجهات</a>${can('manage.partners') ? `<button class="btn" data-editp>${icon('edit')} تعديل</button>` : ''}${can('edit.partnership') ? `<a class="btn primary" href="#/partnerships/new">${icon('plus')} شراكة جديدة</a>` : ''}</div></div>
    <div class="dgrid"><div class="panel c8"><div class="panel-h"><h3>شراكات الجهة</h3><span class="sub">${s.ps.length}</span></div><div class="panel-b">
      ${s.ps.length ? regTable(s.ps) : '<p class="muted small">لا ترتبط بالجهة شراكات مسجلة.</p>'}</div></div>
    <div class="panel c4"><div class="panel-h"><h3>المقترحات المرتبطة</h3><span class="sub">${s.props.length}</span></div><div class="panel-b">
      ${s.props.length ? `<div class="acts">${s.props.map((x) => `<a class="act" href="#/proposals/${x.id}" style="grid-template-columns:1fr auto"><span><div class="t">${esc(x.ref)}</div><div class="d">${esc(x.department)}</div></span>${propChip(x.status)}</a>`).join('')}</div>` : '<p class="muted small">لا توجد مقترحات بهذه الجهة.</p>'}
      ${pr.notes ? `<div class="note" style="margin-top:14px">${icon('info')}<span>${esc(pr.notes)}</span></div>` : ''}</div></div></div>`;
  hydrateFiles(el);
  bindLogoUpload(el, () => route());
  el.onclick = async (e) => {
    if (e.target.closest('[data-editp]')) { const x = await partnerDialog(pr); if (x) route(); return; }
    const row = e.target.closest('[data-row]'); if (row) go('#/partnerships/' + row.dataset.row);
  };
}
