/* ===== الإنجازات والمستجدات ===== */
function renderContent(el, r) {
  if (!can('manage.content')) { el.innerHTML = noAccessHTML(); return; }
  const tab = (r.query && r.query.tab) || 'stories';
  el.innerHTML = `<div class="ph"><div><h1>الإنجازات والمستجدات</h1><p>محتوى الواجهة التعريفية. يظهر في الرئيسية ما يُنشر فقط، وكل إنجاز مرتبط بالشراكة الخاصة به.</p></div>
    <div class="ph-actions"><a class="btn" href="#/settings/home">${icon('settings')} ترتيب الرئيسية</a><button class="btn primary" data-add>${icon('plus')} ${tab === 'news' ? 'خبر جديد' : 'إنجاز جديد'}</button></div></div>
    <div class="inbox-tabs"><button class="${tab === 'stories' ? 'on' : ''}" data-t="stories">الإنجازات وقصص النجاح <span class="n">${D.achievements.filter((a) => showDemo() || !a.demo).length}</span></button><button class="${tab === 'news' ? 'on' : ''}" data-t="news">المستجدات <span class="n">${D.news.filter((a) => showDemo() || !a.demo).length}</span></button></div>
    <div id="cbody"></div>`;
  const draw = () => {
    const body = $('#cbody', el);
    if (tab === 'stories') {
      const list = D.achievements.filter((a) => showDemo() || !a.demo).sort((a, b) => (a.date < b.date ? 1 : -1));
      const feat = D.settings.home.stories || [];
      body.innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الإنجاز</th><th>الشراكة</th><th>الرقم الأبرز</th><th>التاريخ</th><th>النشر</th><th></th></tr></thead><tbody>
        ${list.map((a) => { const p = D.partnerships.find((x) => x.id === a.partnershipId); return `<tr data-edit="${a.id}"><td><div class="t-name"><div style="width:64px;height:44px;border-radius:4px;overflow:hidden;position:relative;flex:none">${coverHTML('story' + a.id, a.coverFileId, { W: 200, H: 140, levels: 6, cols: 20 })}</div><div><b>${esc(a.title)} ${demoTag(a)}</b><span>${esc((a.summary || '').slice(0, 80))}${(a.summary || '').length > 80 ? '…' : ''}</span></div></div></td>
          <td class="small">${p ? esc(partnerName(p)) : '<span class="faint">—</span>'}</td><td class="small">${esc(a.metricValue || '')} ${esc(a.metricLabel || '')}</td><td class="small">${fmtDate(a.date)}</td>
          <td>${a.public ? `<span class="chip ok">منشور</span>${feat.includes(a.id) ? ' <span class="chip gold plain">في الرئيسية</span>' : ''}` : '<span class="chip muted">غير منشور</span>'}</td><td><button class="btn sm ghost" data-edit="${a.id}">${icon('edit')}</button></td></tr>`; }).join('')}</tbody></table></div>`
        : `<div class="panel">${emptyHTML({ ic: 'award', title: 'لا توجد إنجازات بعد', text: 'أضف إنجازًا متحققًا واربطه بالشراكة الخاصة به، ثم اختر نشره في الرئيسية.', actions: `<button class="btn primary" data-add>${icon('plus')} إنجاز جديد</button>` })}</div>`;
    } else {
      const list = D.news.filter((a) => showDemo() || !a.demo).sort((a, b) => (a.date < b.date ? 1 : -1));
      body.innerHTML = `<div class="note" style="margin-bottom:14px">${icon('info')}<span>تُضاف إلى المستجدات تلقائيًا أخبار بدء سريان الشراكات المنشورة، مأخوذة من تواريخ البدء في السجل.</span></div>` + (list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الخبر</th><th>الشراكة</th><th>التاريخ</th><th>النشر</th><th></th></tr></thead><tbody>
        ${list.map((n) => { const p = D.partnerships.find((x) => x.id === n.partnershipId); return `<tr data-edit="${n.id}"><td><b style="font-weight:600">${esc(n.title)}</b> ${demoTag(n)}<div class="small muted">${esc((n.body || '').slice(0, 90))}</div></td><td class="small">${p ? esc(partnerName(p)) : '—'}</td><td class="small">${fmtDate(n.date)}</td><td>${n.public ? '<span class="chip ok">منشور</span>' : '<span class="chip muted">غير منشور</span>'}</td><td><button class="btn sm ghost" data-edit="${n.id}">${icon('edit')}</button></td></tr>`; }).join('')}</tbody></table></div>`
        : `<div class="panel">${emptyHTML({ ic: 'news', title: 'لا توجد أخبار مضافة', actions: `<button class="btn primary" data-add>${icon('plus')} خبر جديد</button>` })}</div>`);
    }
    hydrateFiles(body);
  };
  draw();
  el.onclick = async (e) => {
    const t = e.target.closest('[data-t]'); if (t) return go('#/content?tab=' + t.dataset.t);
    if (e.target.closest('[data-add]')) { if (await (tab === 'news' ? newsDialog(null) : storyDialog(null))) route(); return; }
    const ed = e.target.closest('[data-edit]'); if (ed) { const ok = tab === 'news' ? await newsDialog(D.news.find((x) => x.id === ed.dataset.edit)) : await storyDialog(D.achievements.find((x) => x.id === ed.dataset.edit)); if (ok) route(); }
  };
}
function partnershipOptions() { return visiblePartnerships({ includeDrafts: false }).map((p) => ({ value: p.id, label: partnerName(p), sub: p.code })); }
function storyDialog(a) {
  return new Promise((res) => {
    const isNew = !a;
    const v = a ? clone(a) : { title: '', partnershipId: '', date: isoDate(today()), metricValue: '', metricLabel: '', summary: '', body: '', coverFileId: null, gallery: [], public: false };
    const feat = (D.settings.home.stories || []).includes(v.id);
    const m = Modal.open({
      title: isNew ? 'إنجاز جديد' : 'تعديل الإنجاز', size: 'lg',
      body: `<div class="grid2">
        <div class="field span2" data-f="title"><label>عنوان الإنجاز</label><input class="in" id="at" value="${esc(v.title)}"><span class="err">اكتب عنوان الإنجاز.</span></div>
        <div class="field" data-f="pt"><label>الشراكة المرتبطة</label>${comboHTML('pt', { options: partnershipOptions(), value: v.partnershipId })}<span class="err">اربط الإنجاز بالشراكة الخاصة به.</span></div>
        <div class="field"><label>التاريخ</label><input type="date" class="in" id="ad" value="${esc(v.date)}"></div>
        <div class="field"><label>الرقم الأبرز</label><input class="in" id="amv" value="${esc(v.metricValue)}" placeholder="مثل 4,800"></div>
        <div class="field"><label>وحدة الرقم</label><input class="in" id="aml" value="${esc(v.metricLabel)}" placeholder="مثل شجرة محلية"></div>
        <div class="field span2"><label>الملخص</label><textarea class="in" id="as" rows="3" style="min-height:76px">${esc(v.summary)}</textarea></div>
        <div class="field span2"><label>القصة الكاملة</label><textarea class="in" id="ab" rows="6">${esc(v.body)}</textarea><span class="hint">اكتب كل نقطة في سطر مستقل لتظهر قائمةً منظمة.</span></div>
        <div class="field"><label>صورة الغلاف</label><div class="row" id="acov">${v.coverFileId ? `<img data-file="${esc(v.coverFileId)}" style="width:110px;height:64px;object-fit:cover;border-radius:6px" alt="">` : '<span class="small muted">غلاف مولّد</span>'}<label class="btn sm">${icon('upload')} رفع<input type="file" accept="image/*" hidden id="acf"></label><button type="button" class="btn sm" id="aclib">${icon('image')} من المكتبة</button></div></div>
        <div class="field"><label>معرض الصور</label><div class="row wrap" id="agal">${(v.gallery || []).map((g) => `<img data-file="${esc(g)}" style="width:52px;height:40px;object-fit:cover;border-radius:4px" alt="">`).join('')}<label class="btn sm">${icon('plus')} صور<input type="file" accept="image/*" multiple hidden id="agf"></label></div></div>
        <label class="row span2" style="gap:12px"><span class="switch"><input type="checkbox" id="apub" ${v.public ? 'checked' : ''}><i></i></span><span>منشور في الواجهة التعريفية</span></label>
        <label class="row span2" style="gap:12px"><span class="switch"><input type="checkbox" id="afeat" ${feat ? 'checked' : ''}><i></i></span><span>ضمن الإنجازات المختارة في الرئيسية</span></label>
        ${a && a.demo ? '<div class="note span2">' + icon('info') + '<span>هذا إنجاز تجريبي لإظهار التصميم، ولا يمثل نتيجة فعلية.</span></div>' : ''}
      </div>`,
      foot: `<button class="btn primary" data-ok>حفظ</button><button class="btn ghost" data-mclose>إلغاء</button>${!isNew ? `<span class="sp"></span><button class="btn danger" data-del>${icon('trash')} حذف</button>` : ''}`,
      onClose: (x) => res(!!x),
    });
    bindCombos(m.el); hydrateFiles(m.el);
    $('#acf', m.el).onchange = async (e) => { try { const f = await saveUpload(e.target.files[0]); v.coverFileId = f.id; $('#acov', m.el).firstElementChild.outerHTML = `<img data-file="${f.id}" style="width:110px;height:64px;object-fit:cover;border-radius:6px" alt="">`; hydrateFiles(m.el); } catch (er) { toast(er.message, 'err'); } };
    $('#aclib', m.el).onclick = async () => { const k = await pickLibImage(v.coverFileId); if (k) { v.coverFileId = 'lib:' + k; $('#acov', m.el).firstElementChild.outerHTML = `<img data-file="lib:${k}" style="width:110px;height:64px;object-fit:cover;border-radius:6px" alt="">`; hydrateFiles(m.el); } };
    $('#agf', m.el).onchange = async (e) => { for (const file of e.target.files) { try { const f = await saveUpload(file); v.gallery.push(f.id); $('#agal', m.el).insertAdjacentHTML('afterbegin', `<img data-file="${f.id}" style="width:52px;height:40px;object-fit:cover;border-radius:4px" alt="">`); } catch (er) { toast(er.message, 'err'); } } hydrateFiles(m.el); };
    m.el.querySelector('[data-ok]').onclick = async () => {
      v.title = $('#at', m.el).value.trim(); v.partnershipId = $('[data-cb="pt"]', m.el).value;
      let bad = false;
      if (!v.title) { $('[data-f="title"]', m.el).classList.add('invalid'); bad = true; }
      if (!v.partnershipId) { $('[data-f="pt"]', m.el).classList.add('invalid'); bad = true; }
      if (bad) return;
      Object.assign(v, { date: $('#ad', m.el).value, metricValue: $('#amv', m.el).value.trim(), metricLabel: $('#aml', m.el).value.trim(), summary: $('#as', m.el).value.trim(), body: $('#ab', m.el).value, public: $('#apub', m.el).checked });
      const rec = a ? Object.assign(a, v) : { ...v, id: uid('ach'), createdAt: nowISO(), demo: false };
      await Repo.save('achievements', rec);
      const fl = D.settings.home.stories || (D.settings.home.stories = []);
      const want = $('#afeat', m.el).checked && rec.public;
      if (want && !fl.includes(rec.id)) fl.push(rec.id);
      if (!want) D.settings.home.stories = fl.filter((x) => x !== rec.id);
      await Repo.saveSettings();
      await Repo.log('content.save', 'achievement', rec.id, rec.title);
      toast('حُفظ الإنجاز'); m.close(true);
    };
    const d = m.el.querySelector('[data-del]');
    if (d) d.onclick = async () => { if (!(await confirmDlg('حذف الإنجاز نهائيًا؟', { danger: true, ok: 'حذف' }))) return; await Repo.remove('achievements', a.id); D.settings.home.stories = (D.settings.home.stories || []).filter((x) => x !== a.id); await Repo.saveSettings(); await Repo.log('content.delete', 'achievement', a.id, a.title); toast('حُذف الإنجاز'); m.close(true); };
  });
}
function newsDialog(n) {
  return new Promise((res) => {
    const isNew = !n;
    const v = n ? clone(n) : { title: '', date: isoDate(today()), body: '', partnershipId: '', public: true };
    const m = Modal.open({
      title: isNew ? 'خبر جديد' : 'تعديل الخبر',
      body: `<div class="stack"><div class="field" data-f="title"><label>العنوان</label><input class="in" id="nt" value="${esc(v.title)}"><span class="err">اكتب عنوان الخبر.</span></div>
        <div class="grid2"><div class="field"><label>التاريخ</label><input type="date" class="in" id="nd" value="${esc(v.date)}"></div><div class="field"><label>الشراكة (اختياري)</label>${comboHTML('npt', { options: partnershipOptions(), value: v.partnershipId })}</div></div>
        <div class="field"><label>النص</label><textarea class="in" id="nb" rows="4">${esc(v.body)}</textarea></div>
        <label class="row" style="gap:12px"><span class="switch"><input type="checkbox" id="npub" ${v.public ? 'checked' : ''}><i></i></span><span>منشور في الرئيسية</span></label></div>`,
      foot: `<button class="btn primary" data-ok>حفظ</button><button class="btn ghost" data-mclose>إلغاء</button>${!isNew ? `<span class="sp"></span><button class="btn danger" data-del>${icon('trash')} حذف</button>` : ''}`,
      onClose: (x) => res(!!x),
    });
    bindCombos(m.el);
    m.el.querySelector('[data-ok]').onclick = async () => {
      v.title = $('#nt', m.el).value.trim(); if (!v.title) { $('[data-f="title"]', m.el).classList.add('invalid'); return; }
      Object.assign(v, { date: $('#nd', m.el).value, body: $('#nb', m.el).value.trim(), partnershipId: $('[data-cb="npt"]', m.el).value || null, public: $('#npub', m.el).checked });
      const rec = n ? Object.assign(n, v) : { ...v, id: uid('nw'), demo: false };
      await Repo.save('news', rec); await Repo.log('content.save', 'news', rec.id, rec.title);
      toast('حُفظ الخبر'); m.close(true);
    };
    const d = m.el.querySelector('[data-del]');
    if (d) d.onclick = async () => { if (!(await confirmDlg('حذف الخبر؟', { danger: true, ok: 'حذف' }))) return; await Repo.remove('news', n.id); await Repo.log('content.delete', 'news', n.id, n.title); m.close(true); };
  });
}
