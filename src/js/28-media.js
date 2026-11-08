/* =====================================================================
   مركز الصور: كل صور المنصة في مكان واحد — من الشراكات والإنجازات والرئيسية
   ===================================================================== */
const MEDIA_SRC = { att: 'صور الشراكات', cover: 'أغلفة الشراكات', story: 'الإنجازات', home: 'الرئيسية' };
const isIllus = (fid) => /^lib:/.test(fid || '');

/* تجميع الصور مع مواضع استخدامها؛ الصورة الواحدة قد تُستخدم في أكثر من موضع */
function mediaItems() {
  const map = new Map();
  const internal = can('view.internal');
  const put = (fileId, use, meta) => {
    if (!fileId) return;
    const key = fileId + '|' + (meta.pid || ''); // الصورة نفسها في شراكتين تظهر في ألبوم كل منهما
    let it = map.get(key);
    if (!it) { it = { fileId, uses: [], illus: isIllus(fileId), ...meta }; map.set(key, it); }
    else { for (const [k, v] of Object.entries(meta)) if (it[k] == null || it[k] === '' || (use.src === 'att' && ['title', 'date', 'by', 'cat', 'size'].includes(k))) it[k] = v; } // اسم المرفق أدق من «غلاف الشراكة»
    it.uses.push(use);
  };
  const plist = internal ? visiblePartnerships({ includeDrafts: can('view.drafts') }) : publicPartnerships();
  for (const p of plist) {
    const pr = partnerById(p.partnerId);
    const base = { pid: p.id, pname: partnerName(p), sector: pSector(p), demo: !!p.demo, year: (p.startDate || '').slice(0, 4) };
    if (p.coverFileId) put(p.coverFileId, { src: 'cover', t: 'غلاف الشراكة', href: '#/partnerships/' + p.id }, { ...base, title: partnerName(p), date: p.updatedAt || p.createdAt });
    (p.attachments || []).filter((a) => isImg(a) && (internal || a.category === 'صور الشراكة')).forEach((a) =>
      put(a.fileId, { src: 'att', t: a.category || 'صور الشراكة', href: '#/partnerships/' + p.id, attId: a.id }, { ...base, title: a.name.replace(/\.(jpe?g|png|webp|gif|heic)$/i, ''), date: a.addedAt, by: a.by, cat: a.category, size: a.size }));
    void pr;
  }
  for (const s of publicStories().concat(can('manage.content') ? D.achievements.filter((a) => !a.public && (showDemo() || !a.demo)) : [])) {
    const p = D.partnerships.find((x) => x.id === s.partnershipId);
    const base = { pid: p ? p.id : '', pname: p ? partnerName(p) : '', sector: p ? pSector(p) : '', demo: !!s.demo, year: (s.date || '').slice(0, 4) };
    [s.coverFileId, ...(s.gallery || [])].filter(Boolean).forEach((f, k) => put(f, { src: 'story', t: k === 0 && f === s.coverFileId ? 'غلاف إنجاز' : 'معرض إنجاز', story: s.id, label: s.title }, { ...base, title: s.title, date: s.date }));
  }
  const h = D.settings.home;
  if (h.heroImageFileId) put(h.heroImageFileId, { src: 'home', t: 'صورة الواجهة الرئيسية', href: '#/' }, { title: 'صورة الواجهة الرئيسية', date: '' });
  return [...map.values()].filter((it) => showDemo() || !it.demo || !it.illus).sort((a, b) => ((a.date || '') < (b.date || '') ? 1 : -1));
}

function renderMedia(el) {
  App.ui.media = App.ui.media || { q: '', src: '', pid: '', sector: '', real: false, view: 'grid' };
  const S = App.ui.media;
  const canUp = can('edit.partnership');
  el.innerHTML = `<div class="ph"><div><h1>مركز الصور</h1><p>كل صور المنصة في مكان واحد: صور الشراكات وأغلفتها، والإنجازات، والواجهة الرئيسية. اضغط أي صورة لعرضها بملء الشاشة.</p></div>
      <div class="ph-actions">${canUp ? `<button class="btn primary" data-mupload type="button">${icon('upload')} رفع صور</button>` : ''}</div></div>
    <div id="mStats"></div>
    <div class="m-tools">
      <div class="searchbox m-q">${icon('search')}<input class="in" id="mQ" type="search" placeholder="ابحث باسم الجهة أو عنوان الصورة…" value="${esc(S.q)}"></div>
      <select class="in m-sel" id="mSrc" aria-label="المصدر"><option value="">كل المصادر</option>${Object.entries(MEDIA_SRC).map(([k, v]) => `<option value="${k}" ${S.src === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select class="in m-sel" id="mPid" aria-label="الشراكة"><option value="">كل الشراكات</option></select>
      <select class="in m-sel" id="mSec" aria-label="القطاع"><option value="">كل القطاعات</option>${L('sectors').map((s) => `<option ${S.sector === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
      <label class="m-chk"><input type="checkbox" id="mReal" ${S.real ? 'checked' : ''}> الصور الفعلية فقط</label>
      <span class="grow"></span>
      <div class="seg" role="tablist" aria-label="طريقة العرض">${[['grid', 'grid', 'شبكة'], ['albums', 'layers', 'ألبومات']].map(([k, ic, l]) => `<button type="button" data-mview="${k}" class="${S.view === k ? 'on' : ''}">${icon(ic)}<span>${l}</span></button>`).join('')}</div>
    </div>
    <div id="mBody"></div>
    <div id="mGaps"></div>`;
  const all = () => mediaItems();
  const fill = (items) => {
    const ps = [...new Map(items.filter((i) => i.pid).map((i) => [i.pid, i.pname])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'ar'));
    $('#mPid', el).innerHTML = `<option value="">كل الشراكات</option>${ps.map(([id, n]) => `<option value="${id}" ${S.pid === id ? 'selected' : ''}>${esc(n)}</option>`).join('')}`;
  };
  const filt = (items) => items.filter((i) => (!S.src || i.uses.some((u) => u.src === S.src)) && (!S.pid || i.pid === S.pid) && (!S.sector || i.sector === S.sector) && (!S.real || !i.illus)
    && (!S.q || matchQ(`${i.title || ''} ${i.pname || ''} ${i.uses.map((u) => u.t + ' ' + (u.label || '')).join(' ')}`, S.q)));
  let shown = [];
  const draw = () => {
    const items = all(); fill(items);
    shown = filt(items);
    const real = items.filter((i) => !i.illus).length;
    const withP = new Set(items.filter((i) => i.pid && !i.illus).map((i) => i.pid));
    const plist = visiblePartnerships().filter((p) => !p.isDraft && p.stage === 'signed');
    $('#mStats', el).innerHTML = `<div class="m-stats">
      <div><b>${items.length}</b><span>صورة في المنصة</span></div>
      <div><b>${real}</b><span>صورة فعلية من الميدان</span></div>
      <div><b>${items.length - real}</b><span>صورة توضيحية مولّدة</span></div>
      <div><b>${withP.size}<small> / ${plist.length}</small></b><span>شراكة موقّعة لها صور فعلية</span><i class="m-bar"><em style="width:${plist.length ? Math.round(plist.filter((p) => withP.has(p.id)).length / plist.length * 100) : 0}%"></em></i></div></div>`;
    const tile = (i, k) => `<button type="button" class="m-tile" data-mi="${k}" title="${esc(i.title || '')}">
        <span class="m-img"><img data-file="${esc(i.fileId)}" alt="${esc(i.title || '')}" loading="lazy">${i.illus ? '<span class="illus">صورة توضيحية</span>' : ''}</span>
        <span class="m-cap"><b>${esc(i.title || i.pname || '')}</b><small>${esc(i.pname && i.pname !== i.title ? i.pname : '')}${i.date ? `${i.pname && i.pname !== i.title ? ' · ' : ''}${fmtDate(String(i.date).slice(0, 10), 'short')}` : ''}</small>
          <span class="m-uses">${[...new Set(i.uses.map((u) => u.t))].map((t) => `<em>${esc(t)}</em>`).join('')}${i.demo ? '<em class="demo">تجريبي</em>' : ''}</span></span></button>`;
    const body = $('#mBody', el);
    if (!shown.length) body.innerHTML = emptyHTML({ ic: 'image', title: 'لا توجد صور مطابقة', text: 'غيّر البحث أو الفلاتر، أو ارفع صورًا جديدة.', actions: '<button class="btn" data-mreset type="button">مسح الفلاتر</button>' });
    else if (S.view === 'albums') {
      const groups = new Map();
      shown.forEach((i, k) => { const key = i.pid || '_' + (i.uses[0] || {}).src; const g = groups.get(key) || { t: i.pname || MEDIA_SRC[(i.uses[0] || {}).src] || 'أخرى', pid: i.pid, items: [] }; g.items.push([i, k]); groups.set(key, g); });
      body.innerHTML = `<div class="m-albums">${[...groups.values()].map((g) => `<section class="m-album"><header><h3>${esc(g.t)}</h3><span>${plural(g.items.length, 'صورة واحدة', 'صورتان', 'صور', 'صورة')}</span>${g.pid ? `<a class="linkbtn" href="#/partnerships/${g.pid}">${icon('arrowL')} الشراكة</a>` : ''}${g.pid && canUp ? `<button class="linkbtn" type="button" data-mupload="${g.pid}">${icon('upload')} إضافة</button>` : ''}</header>
        <div class="m-grid sm">${g.items.map(([i, k]) => tile(i, k)).join('')}</div></section>`).join('')}</div>`;
    } else body.innerHTML = `<div class="m-count">${plural(shown.length, 'صورة واحدة', 'صورتان', 'صور', 'صورة')}</div><div class="m-grid">${shown.map(tile).join('')}</div>`;
    // شراكات موقّعة بلا صور فعلية: دعوة للتوثيق
    const gaps = plist.filter((p) => !withP.has(p.id));
    $('#mGaps', el).innerHTML = gaps.length && can('view.internal') ? `<section class="panel m-gaps"><div class="panel-h"><h3>شراكات تحتاج توثيقًا بالصور</h3><span class="sub">${plural(gaps.length, 'شراكة موقّعة واحدة', 'شراكتان موقّعتان', 'شراكات موقّعة', 'شراكة موقّعة')} بلا صور فعلية من الميدان</span></div>
      <div class="panel-b"><div class="m-gap-l">${gaps.map((p) => `<div class="m-gap">${plateHTML(partnerById(p.partnerId), 40)}<span class="grow"><b>${esc(partnerName(p))} ${demoTag(p)}</b><small>${esc(statusLabel(pStatus(p)))}${p.owners && p.owners.length ? ' · ' + esc(p.owners.join('، ')) : ''}</small></span>${canUp ? `<button class="btn sm" type="button" data-mupload="${p.id}">${icon('upload')} رفع صور</button>` : `<a class="btn sm" href="#/partnerships/${p.id}">فتح</a>`}</div>`).join('')}</div></div></section>` : '';
    hydrateFiles(el);
  };
  draw();
  if (App.route && App.route.query && App.route.query.upload && can('edit.partnership')) { history.replaceState(null, '', '#/media'); App.route.query = {}; setTimeout(async () => { if (await mediaUploadDlg('')) draw(); }, 120); }
  const set = (k, v) => { S[k] = v; draw(); };
  $('#mQ', el).addEventListener('input', debounce((e) => set('q', e.target.value.trim()), 200));
  $('#mSrc', el).onchange = (e) => set('src', e.target.value);
  $('#mPid', el).onchange = (e) => set('pid', e.target.value);
  $('#mSec', el).onchange = (e) => set('sector', e.target.value);
  $('#mReal', el).onchange = (e) => set('real', e.target.checked);
  el.onclick = async (e) => {
    const v = e.target.closest('[data-mview]'); if (v) { S.view = v.dataset.mview; $$('[data-mview]', el).forEach((b) => b.classList.toggle('on', b === v)); return draw(); }
    if (e.target.closest('[data-mreset]')) { Object.assign(S, { q: '', src: '', pid: '', sector: '', real: false }); return renderMedia(el); }
    const up = e.target.closest('[data-mupload]'); if (up) { const ok = await mediaUploadDlg(up.dataset.mupload || S.pid || ''); if (ok) draw(); return; }
    const t = e.target.closest('[data-mi]'); if (t) return mediaDetail(shown, +t.dataset.mi, draw);
  };
}

/* — تفاصيل الصورة: عرض بملء الشاشة، ومواضع الاستخدام، والإجراءات — */
function mediaDetail(list, k, redraw) {
  const it = list[k]; if (!it) return;
  const att = it.uses.find((u) => u.attId);
  const p = it.pid ? D.partnerships.find((x) => x.id === it.pid) : null;
  const canEdit = can('edit.partnership') && p;
  const m = Modal.open({
    title: it.title || 'صورة', size: 'lg', cls: 'm-modal',
    body: `<div class="m-det"><button type="button" class="m-det-img" data-mview-full title="عرض بملء الشاشة"><img data-file="${esc(it.fileId)}" alt="">${it.illus ? '<span class="illus">صورة توضيحية</span>' : ''}<span class="m-zoom">${icon('expand')}</span></button>
      <div class="m-det-b"><dl class="kv">
        ${it.pname ? `<div><dt>الشراكة</dt><dd><a href="#/partnerships/${it.pid}">${esc(it.pname)}</a></dd></div>` : ''}
        ${it.sector ? `<div><dt>القطاع</dt><dd>${esc(it.sector)}</dd></div>` : ''}
        ${it.date ? `<div><dt>التاريخ</dt><dd>${fmtDate(String(it.date).slice(0, 10))}</dd></div>` : ''}
        ${it.by ? `<div><dt>أضافها</dt><dd>${esc(it.by)}</dd></div>` : ''}
        ${it.size ? `<div><dt>الحجم</dt><dd>${fmtSize(it.size)}</dd></div>` : ''}
        <div><dt>النوع</dt><dd>${it.illus ? 'صورة توضيحية مولّدة، وليست صورة فعلية' : 'صورة فعلية'}</dd></div></dl>
        <h4 class="m-h4">مستخدمة في</h4><ul class="m-usel">${it.uses.map((u) => `<li>${icon(u.src === 'story' ? 'award' : u.src === 'home' ? 'home' : 'layers')}<span>${esc(u.t)}${u.label ? ` — ${esc(u.label)}` : ''}</span>${u.href ? `<a href="${u.href}" class="linkbtn">فتح</a>` : u.story ? `<button class="linkbtn" type="button" data-mstory="${u.story}">فتح</button>` : ''}</li>`).join('')}</ul>
        <div class="m-acts">${!it.fileId.startsWith('lib:') && !it.fileId.startsWith('asset:') ? `<button class="btn sm" type="button" data-mdl>${icon('download')} تنزيل</button>` : ''}
          ${canEdit && p.coverFileId !== it.fileId ? `<button class="btn sm" type="button" data-mcover>${icon('image')} اجعلها غلاف الشراكة</button>` : ''}
          ${canEdit && att ? `<button class="btn sm ghost m-del" type="button" data-mdel>${icon('trash')} حذف من الشراكة</button>` : ''}</div></div></div>`,
  });
  hydrateFiles(m.el);
  m.el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-mview-full]')) return openGallery(list.map((i) => ({ fileId: i.fileId, caption: i.title, sub: i.pname })), k);
    const st = e.target.closest('[data-mstory]'); if (st) { m.close(); return openStory(st.dataset.mstory); }
    if (e.target.closest('a[href]')) return m.close();
    if (e.target.closest('[data-mdl]')) return downloadStored(it.fileId, it.title || 'صورة');
    if (e.target.closest('[data-mcover]')) { p.coverFileId = it.fileId; await Repo.save('partnerships', p); await Repo.log('update', 'partnership', p.id, partnerName(p), 'تغيير صورة الغلاف من مركز الصور'); toast('أصبحت الصورة غلاف الشراكة'); m.close(); return redraw(); }
    if (e.target.closest('[data-mdel]')) {
      if (!(await confirmDlg(`حذف الصورة «${esc(it.title || '')}» من مرفقات الشراكة مع «${esc(partnerName(p))}»؟`, { title: 'حذف صورة', ok: 'حذف', danger: true }))) return;
      p.attachments = (p.attachments || []).filter((a) => a.id !== att.attId);
      if (p.coverFileId === it.fileId) p.coverFileId = null;
      await Repo.save('partnerships', p); await Repo.log('update', 'partnership', p.id, partnerName(p), 'حذف صورة من مركز الصور');
      toast('حُذفت الصورة'); m.close(); return redraw();
    }
  });
}

/* — رفع الصور إلى شراكة محددة بتصنيف — */
function mediaUploadDlg(pid = '') {
  return new Promise((res) => {
    const ps = visiblePartnerships({ includeDrafts: true }).sort((a, b) => partnerName(a).localeCompare(partnerName(b), 'ar'));
    const cats = L('attachmentCats');
    const m = Modal.open({
      title: 'رفع صور', size: 'md',
      body: `<div class="field"><label>الشراكة</label><select class="in" id="muP"><option value="">اختر الشراكة…</option>${ps.map((p) => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${esc(partnerName(p))}${p.code ? ' — ' + esc(p.code) : ''}</option>`).join('')}</select><span class="err">اختر الشراكة التي تتبعها الصور.</span></div>
        <div class="field"><label>التصنيف</label><select class="in" id="muC">${cats.map((c) => `<option ${c === 'صور الشراكة' ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><span class="hint">«صور الشراكة» تظهر في الواجهة إذا كانت الشراكة منشورة، وبقية التصنيفات داخلية.</span></div>
        <div class="field"><label>وصف موحّد (اختياري)</label><input class="in" id="muT" placeholder="مثال: زيارة ميدانية لموقع التشجير — مارس 2026"></div>
        <label class="drop" id="muDrop"><input type="file" accept="image/*" multiple hidden>${icon('upload')}<div>اسحب الصور هنا أو <b>اختر من جهازك</b></div><div class="xs faint">صور فقط، حتى 50 ميجابايت — تُضغط تلقائيًا مع الحفاظ على جودتها</div></label>
        <div class="m-prev" id="muPrev"></div>`,
      foot: `<button class="btn primary" data-ok type="button">${icon('upload')} حفظ الصور</button><button class="btn ghost" data-mclose type="button">إلغاء</button>`,
      onClose: (v) => res(!!v),
    });
    const q = (s) => m.el.querySelector(s);
    let files = [];
    const prev = () => { q('#muPrev').innerHTML = files.map((f, i) => `<span><img src="${URL.createObjectURL(f)}" alt=""><button type="button" data-rmf="${i}" aria-label="إزالة">${icon('x')}</button></span>`).join(''); };
    const add = (list) => { const imgs = [...list].filter((f) => /^image\//.test(f.type)); if (imgs.length < list.length) toast('تُقبل ملفات الصور فقط في مركز الصور', 'err'); files = files.concat(imgs); prev(); };
    const drop = q('#muDrop'), inp = drop.querySelector('input');
    inp.onchange = () => { add(inp.files); inp.value = ''; };
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => add(e.dataTransfer.files));
    q('#muPrev').addEventListener('click', (e) => { const b = e.target.closest('[data-rmf]'); if (b) { files.splice(+b.dataset.rmf, 1); prev(); } });
    q('[data-ok]').onclick = async () => {
      const p = D.partnerships.find((x) => x.id === q('#muP').value);
      if (!p) { q('#muP').closest('.field').classList.add('invalid'); return; }
      if (!files.length) { toast('أضف صورة واحدة على الأقل', 'err'); return; }
      const cat = q('#muC').value, t = q('#muT').value.trim();
      p.attachments = p.attachments || [];
      let n = 0;
      for (const [i, f] of files.entries()) {
        try { const rec = await saveUpload(f); p.attachments.push({ id: uid('att'), fileId: rec.id, name: t ? (files.length > 1 ? `${t} (${i + 1})` : t) : rec.name, type: rec.type, size: rec.size, category: cat, addedAt: nowISO(), by: Session.userName() }); n++; }
        catch (err) { toast(err.message, 'err'); }
      }
      if (!n) return;
      await Repo.save('partnerships', p);
      await Repo.log('update', 'partnership', p.id, partnerName(p), `رفع ${n} ${n === 1 ? 'صورة' : 'صور'} من مركز الصور (${cat})`);
      toast(`حُفظت ${plural(n, 'صورة واحدة', 'صورتان', 'صور', 'صورة')} في شراكة «${partnerName(p)}»`);
      m.close(true);
    };
  });
}
