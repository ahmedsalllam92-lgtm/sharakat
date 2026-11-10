/* ===== الإعدادات ===== */
const SET_TABS = [
  { id: 'general', t: 'عام', perm: 'manage.lists' },
  { id: 'design', t: 'شكل المنصة', perm: null },
  { id: 'tour', t: 'استعراض المنصة', perm: null },
  { id: 'home', t: 'محتوى الرئيسية', perm: 'manage.content' },
  { id: 'lists', t: 'القوائم', perm: 'manage.lists' },
  { id: 'forms', t: 'إعدادات النماذج', perm: 'manage.accounts' },
  { id: 'roles', t: 'الحسابات والصلاحيات', perm: null },
  { id: 'share', t: 'روابط الاطلاع', perm: 'manage.accounts' },
  { id: 'data', t: 'البيانات والنسخ الاحتياطي', perm: 'manage.backup' },
  { id: 'audit', t: 'سجل التغييرات', perm: 'view.audit' },
];
function renderSettings(el, r) {
  const tabs = SET_TABS.filter((t) => !t.perm || can(t.perm));
  let tab = r.params.tab || tabs[0].id;
  if (!tabs.find((t) => t.id === tab)) tab = tabs[0].id;
  el.innerHTML = `<div class="ph"><div><h1>الإعدادات</h1><p>إدارة التصنيفات والجهات والإدارات ومحتوى الرئيسية والبيانات، مع سجل مبسط للتغييرات.</p></div></div>
    <div class="set-wrap"><nav class="set-nav">${tabs.map((t) => `<a href="#/settings/${t.id}" class="${t.id === tab ? 'on' : ''}">${t.t}</a>`).join('')}<a href="#/partners">الجهات الشريكة</a></nav><div id="sbody"></div></div>`;
  const body = $('#sbody', el);
  ({ general: setGeneral, design: setDesignTab, tour: setTourTab, home: setHome, lists: setLists, forms: setFormsCfg, roles: setRoles, share: setShareTab, data: setData, audit: setAudit })[tab](body);
}
/* إعدادات النماذج: معايير التقييم المبدئي وأوزانها وحدود النتيجة */
function setFormsCfg(b) {
  const c = ievCfg(); let rows = c.crit.map((x) => ({ ...x }));
  const draw = () => {
    const tot = rows.reduce((t, r) => t + (+r.w || 0), 0);
    b.innerHTML = `<div class="panel" id="ievCfg"><div class="panel-h"><h3>معايير التقييم المبدئي للشريك</h3><span class="sub">الدرجة = مجموع أوزان المعايير «المناسبة» ÷ مجموع الأوزان</span></div><div class="panel-b">
      <div class="tbl-wrap"><table class="tbl iev-tbl"><thead><tr><th>م</th><th>المعيار</th><th>الوزن (%)</th><th></th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr><td class="c">${i + 1}</td><td><input class="in" data-ievt="${i}" value="${esc(r.t)}"></td><td style="width:120px"><input class="in num" type="number" min="0" max="100" data-ievw="${i}" value="${+r.w || 0}"></td><td style="width:60px"><button class="btn sm ghost" type="button" data-ievdel="${i}" ${rows.length < 2 ? 'disabled' : ''} title="حذف">${icon('trash')}</button></td></tr>`).join('')}
      </tbody><tfoot><tr><td></td><td><button class="btn sm" type="button" data-ievadd>${icon('plus')} إضافة معيار</button></td><td><b class="${tot === 100 ? 'ok-t' : 'warn-t'}" id="ievTot">${tot}%</b></td><td></td></tr></tfoot></table></div>
      <p class="xs muted" style="margin:6px 0 16px">يُفضّل أن يكون مجموع الأوزان 100%، وإن لم يكن تُحسب الدرجة نسبةً من المجموع.</p>
      <div class="grid2"><div class="field"><label>أقل من هذه النسبة: «${esc(IEV_RES[2])}»</label><input class="in num" type="number" min="1" max="99" id="ievTh0" value="${c.th[0]}"></div>
        <div class="field"><label>أكثر من هذه النسبة: «${esc(IEV_RES[0])}» (وما بينهما «${esc(IEV_RES[1])}»)</label><input class="in num" type="number" min="1" max="99" id="ievTh1" value="${c.th[1]}"></div></div>
      <div class="row" style="margin-top:14px;gap:8px"><button class="btn primary" type="button" data-ievsave>حفظ</button><button class="btn ghost" type="button" data-ievreset>استعادة الافتراضي</button></div>
      <p class="xs muted" style="margin-top:10px">التعديل يسري على النماذج الجديدة وما يُعاد فتحه للتعديل؛ النماذج المكتملة تحتفظ بأوزانها وقت التقييم.</p></div></div>`;
  };
  draw();
  b.oninput = (e) => {
    if (e.target.dataset.ievt !== undefined) rows[+e.target.dataset.ievt].t = e.target.value;
    if (e.target.dataset.ievw !== undefined) { rows[+e.target.dataset.ievw].w = Math.max(0, +e.target.value || 0); const t = $('#ievTot', b), tot = rows.reduce((a, r) => a + (+r.w || 0), 0); t.textContent = tot + '%'; t.className = tot === 100 ? 'ok-t' : 'warn-t'; }
  };
  b.onclick = async (e) => {
    if (e.target.closest('[data-ievadd]')) { rows.push({ t: '', w: 0 }); return draw(); }
    const d = e.target.closest('[data-ievdel]'); if (d) { rows.splice(+d.dataset.ievdel, 1); return draw(); }
    if (e.target.closest('[data-ievreset]')) { rows = IEV_DEF.crit.map((x) => ({ ...x })); $('#ievTh0', b).value = IEV_DEF.th[0]; $('#ievTh1', b).value = IEV_DEF.th[1]; const th = [...IEV_DEF.th]; draw(); $('#ievTh0', b).value = th[0]; $('#ievTh1', b).value = th[1]; return; }
    if (e.target.closest('[data-ievsave]')) {
      const crit = rows.map((r) => ({ t: String(r.t || '').trim(), w: +r.w || 0 })).filter((r) => r.t);
      const th = [+$('#ievTh0', b).value, +$('#ievTh1', b).value];
      if (!crit.length) return toast('أضف معيارًا واحدًا على الأقل.', 'err');
      if (!(th[0] > 0 && th[1] < 100 && th[0] < th[1])) return toast('الحد الأدنى يجب أن يكون أقل من الحد الأعلى، وكلاهما بين 1 و99.', 'err');
      D.settings.ievCfg = { crit, th };
      await saveSet('معايير التقييم المبدئي', `${crit.length} معايير — الحدود ${th[0]}% و${th[1]}%`);
      toast('حُفظت معايير التقييم المبدئي'); rows = crit.map((x) => ({ ...x })); draw();
    }
  };
}
async function saveSet(label, details = '') { await Repo.saveSettings(); await Repo.log('settings.update', 'settings', 'main', label, details); }

function setGeneral(b) {
  const o = D.settings.org;
  b.innerHTML = `<div class="panel"><div class="panel-h"><h3>بيانات الجهة والمنصة</h3></div><div class="panel-b"><div class="grid2">
      <div class="field"><label>اسم الجهة</label><input class="in" id="gname" value="${esc(o.name)}"></div>
      <div class="field"><label>اسم الإدارة</label><input class="in" id="gdept" value="${esc(o.dept)}"></div>
      <div class="field"><label>اسم المنصة</label><input class="in" id="gplat" value="${esc(o.platform)}"></div>
      <div class="field"><label>شعار الجهة</label><div class="row">${o.logoFileId ? `<div class="plate s56"><img data-file="${esc(o.logoFileId)}" alt=""></div>` : '<span class="small muted">لم يُرفع شعار — يظهر الاسم نصيًا</span>'}<label class="btn sm">${icon('upload')} رفع الشعار<input type="file" accept="image/*" hidden id="glogo"></label>${o.logoFileId ? '<button class="btn sm ghost" id="glogox">إزالة</button>' : ''}</div><span class="hint">لا تُستخدم أي هوية بديلة؛ يظهر الشعار عند رفعه فقط.</span></div>
    </div></div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>قواعد التنبيه</h3></div><div class="panel-b"><div class="grid2">
      <div class="field"><label>مدة «قريبة الانتهاء» (بالأيام)</label><input type="number" min="7" max="365" class="in" id="gexp" value="${D.settings.expiryDays}"><span class="hint">تظهر الشراكة ضمن «تنتهي قريبًا» إذا بقي على انتهائها هذا العدد من الأيام أو أقل.</span></div>
      <div class="field"><label>تنبيه عاجل داخل الشراكة قبل انتهائها (بالأيام)</label><input type="number" min="1" max="180" class="in" id="galert" value="${D.settings.alertDays || 30}"><span class="hint">يظهر تنبيه بارز في صفحة الشراكة وفي السجل ومركز الإجراءات عندما يبقى على انتهائها هذا العدد من الأيام أو أقل.</span></div>
      <div class="field"><label>تنبيه المقترحات بانتظار الاستكمال بعد (أيام)</label><input type="number" min="1" max="90" class="in" id="ginfo" value="${D.settings.infoAgeDays || 7}"></div>
    </div></div></div>
    <div class="panel sp-set" style="margin-top:18px"><div class="panel-h"><h3>الشاشة الافتتاحية</h3><span class="sub">تظهر عند فتح المنصة أو إعادة تحميلها</span><button class="btn sm" type="button" id="gsplprev">${icon('play')} معاينة</button></div><div class="panel-b"><div class="grid2">
      <label class="row" style="justify-content:space-between;grid-column:1/-1"><span>إظهار الشاشة الافتتاحية</span><span class="switch"><input type="checkbox" id="gspl_on" ${D.settings.splash.on !== false ? 'checked' : ''}><i></i></span></label>
      <div class="field" style="grid-column:1/-1"><label>الجملة الرئيسية</label><input class="in" id="gspl_t" maxlength="90" value="${esc(D.settings.splash.text || '')}" placeholder="${esc(SPLASH_DEF.text)}"><span class="hint">تظهر كلمة كلمة بحركة متتابعة.</span></div>
      <div class="field" style="grid-column:1/-1"><label>السطر الفرعي</label><input class="in" id="gspl_s" maxlength="120" value="${esc(D.settings.splash.sub || '')}" placeholder="اتركه فارغًا لإخفائه"></div>
      <div class="field"><label>صورة الخلفية</label><select class="in" id="gspl_bg">${SPLASH_BGS.filter(([k]) => k === 'signings' || ASSET_IMG[k]).map(([k, l]) => `<option value="${k}" ${D.settings.splash.bg === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="field"><label>مدة الظهور (ثوانٍ)</label><input type="number" min="2" max="8" class="in" id="gspl_d" value="${D.settings.splash.dur || 3}"></div>
      <label class="row" style="justify-content:space-between;grid-column:1/-1"><span>إظهار الأرقام الحية (السارية، الجهات، القطاعات)</span><span class="switch"><input type="checkbox" id="gspl_n" ${D.settings.splash.stats !== false ? 'checked' : ''}><i></i></span></label>
    </div></div></div>
    <div class="row" style="margin-top:18px"><button class="btn primary" id="gsave">حفظ الإعدادات</button></div>`;
  hydrateFiles(b);
  const readSpl = () => ({ bgV2: true, bgV3: true, bgV4: true, on: $('#gspl_on', b).checked, text: $('#gspl_t', b).value.trim() || SPLASH_DEF.text, sub: $('#gspl_s', b).value.trim(), bg: $('#gspl_bg', b).value, stats: $('#gspl_n', b).checked, dur: Math.max(2, Math.min(8, +$('#gspl_d', b).value || 3)), bgV2: true });
  $('#gsplprev', b).onclick = () => { const keep = localStorage.getItem('shk_splash'); D.settings.splash = { ...D.settings.splash }; const tmp = readSpl(); try { localStorage.setItem('shk_splash', JSON.stringify({ ...JSON.parse(keep || '{}'), ...tmp })); } catch (e) { /* */ } splashShow(true); try { if (keep) localStorage.setItem('shk_splash', keep); } catch (e) { /* */ } };
  $('#glogo', b).onchange = async (e) => { try { const f = await saveUpload(e.target.files[0]); o.logoFileId = f.id; await saveSet('شعار الجهة'); renderShell(); route(); } catch (er) { toast(er.message, 'err'); } };
  const gx = $('#glogox', b); if (gx) gx.onclick = async () => { o.logoFileId = null; await saveSet('إزالة الشعار'); renderShell(); route(); };
  $('#gsave', b).onclick = async () => {
    o.name = $('#gname', b).value.trim() || o.name; o.dept = $('#gdept', b).value.trim() || o.dept; o.platform = $('#gplat', b).value.trim() || o.platform;
    D.settings.expiryDays = Math.max(7, Math.min(365, +$('#gexp', b).value || 90));
    D.settings.infoAgeDays = Math.max(1, Math.min(90, +$('#ginfo', b).value || 7));
    D.settings.alertDays = Math.max(1, Math.min(180, +$('#galert', b).value || 30));
    D.settings.splash = readSpl(); splashSync();
    await saveSet('الإعدادات العامة'); toast('حُفظت الإعدادات'); renderShell(); route();
  };
}

const SEC_NAMES = { hero: 'الواجهة الافتتاحية', kpis: 'الأرقام الرئيسية', golden: 'الشراكات الذهبية', featured: 'الشراكات المختارة', gallery: 'من الميدان (معرض الصور)', stories: 'الإنجازات وقصص النجاح', logos: 'شعارات الشركاء', news: 'آخر المستجدات', share: 'دعوة الإدارات للمشاركة' };
function setHome(b) {
  const h = D.settings.home;
  const eligibleP = publicPartnerships();
  const eligibleS = publicStories();
  const orderList = (ids, all, kind) => {
    const items = ids.map((id) => all.find((x) => x.id === id)).filter(Boolean);
    return `<div class="order-list">${items.map((x, i) => `<div class="order-i"><span class="faint small" style="width:18px">${i + 1}</span><span class="nm">${esc(kind === 'p' ? partnerName(x) : x.title)} ${demoTag(x)}<small>${kind === 'p' ? esc(x.code) : esc(fmtDate(x.date))}</small></span>
      <button class="icon-btn" data-mv="${kind}:${x.id}:-1" ${i === 0 ? 'disabled' : ''} title="أعلى">${icon('up')}</button><button class="icon-btn" data-mv="${kind}:${x.id}:1" ${i === items.length - 1 ? 'disabled' : ''} title="أسفل">${icon('down')}</button><button class="icon-btn" data-rmf="${kind}:${x.id}" title="إزالة">${icon('x')}</button></div>`).join('') || '<p class="small muted">لم يُختر شيء بعد.</p>'}</div>
      <div class="row" style="margin-top:10px"><select class="in" data-addsel="${kind}" style="max-width:420px"><option value="">إضافة…</option>${all.filter((x) => !ids.includes(x.id)).map((x) => `<option value="${x.id}">${esc(kind === 'p' ? partnerName(x) : x.title)}${x.demo ? ' (تجريبي)' : ''}</option>`).join('')}</select></div>`;
  };
  b.innerHTML = `<div class="panel"><div class="panel-h"><h3>ترتيب أقسام الرئيسية وإظهارها</h3><span class="sub">الواجهة الافتتاحية تبقى أولًا</span></div><div class="panel-b"><div class="order-list">
      ${h.sections.map((s, i) => `<div class="order-i"><label class="switch" title="إظهار القسم"><input type="checkbox" data-secon="${s.id}" ${s.on ? 'checked' : ''}><i></i></label><span class="nm">${SEC_NAMES[s.id]}</span>
        ${s.id === 'hero' ? '' : `<button class="icon-btn" data-secmv="${s.id}:-1" ${i <= 1 ? 'disabled' : ''}>${icon('up')}</button><button class="icon-btn" data-secmv="${s.id}:1" ${i === h.sections.length - 1 ? 'disabled' : ''}>${icon('down')}</button>`}</div>`).join('')}</div></div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>الواجهة الافتتاحية</h3></div><div class="panel-b"><div class="grid2">
      <div class="field span2"><label>العنوان</label><input class="in" id="hT" value="${esc(h.heroTitle)}"></div>
      <div class="field span2"><label>النص التعريفي</label><textarea class="in" id="hX" rows="3" style="min-height:80px">${esc(h.heroText)}</textarea></div>
      <div class="field span2"><label>صورة الواجهة</label><div class="row">${h.heroImageFileId ? `<img data-file="${esc(h.heroImageFileId)}" style="width:180px;height:90px;object-fit:cover;border-radius:6px" alt="">` : '<span class="small muted">تكوين كنتوري مولّد من هوية المنصة</span>'}<label class="btn sm">${icon('upload')} رفع صورة<input type="file" accept="image/*" hidden id="hImg"></label><button class="btn sm" id="hImgLib">${icon('image')} من المكتبة التوضيحية</button>${h.heroImageFileId ? '<button class="btn sm ghost" id="hImgX">استخدام التكوين الكنتوري بدل الصورة</button>' : ''}</div><span class="hint">يُفضَّل صورة أفقية عالية الدقة لمشروع ميداني (1600×900 أو أكبر).</span></div>
    </div></div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>الأرقام الرئيسية</h3></div><div class="panel-b"><div class="grid2">
      <div class="field"><label>بداية الفترة</label><input type="date" class="in" id="hF" value="${esc(h.periodFrom)}"></div>
      <div class="field"><label>نهاية الفترة</label><input type="date" class="in" id="hTo" value="${esc(h.periodTo)}"><span class="hint">اتركه فارغًا ليكون «حتى اليوم».</span></div>
      <div class="field span2"><label>الأرقام المعروضة (حتى 5)</label><div class="row wrap" style="gap:14px">${Object.entries(HOME_KPIS).map(([k, K]) => `<label class="check"><input type="checkbox" data-kpi="${k}" ${h.kpis.includes(k) ? 'checked' : ''}> ${esc(K.label)} <span class="faint xs">${esc(K.sub)}</span></label>`).join('')}</div></div>
    </div></div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>الشراكات المختارة</h3><span class="sub">من الشراكات المنشورة فقط</span></div><div class="panel-b">${orderList(h.featured || [], eligibleP, 'p')}</div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>الإنجازات المختارة</h3><span class="sub">أول إنجاز يُعرض بحجم كبير</span></div><div class="panel-b">${orderList(h.stories || [], eligibleS, 's')}</div></div>
    <div class="row" style="margin-top:18px"><button class="btn primary" id="hSave">حفظ</button><a class="btn" href="#/">معاينة الرئيسية</a></div>`;
  hydrateFiles(b);
  const persist = async (label) => { await saveSet('محتوى الرئيسية', label); setHome(b); };
  b.onclick = async (e) => {
    const sm = e.target.closest('[data-secmv]');
    if (sm) { const [id, d] = sm.dataset.secmv.split(':'); const i = h.sections.findIndex((s) => s.id === id); const j = i + +d; if (j < 1 || j >= h.sections.length) return; [h.sections[i], h.sections[j]] = [h.sections[j], h.sections[i]]; return persist('ترتيب الأقسام'); }
    const mv = e.target.closest('[data-mv]');
    if (mv) { const [k, id, d] = mv.dataset.mv.split(':'); const arr = k === 'p' ? h.featured : h.stories; const i = arr.indexOf(id), j = i + +d; [arr[i], arr[j]] = [arr[j], arr[i]]; return persist('ترتيب المختارات'); }
    const rm = e.target.closest('[data-rmf]');
    if (rm) { const [k, id] = rm.dataset.rmf.split(':'); if (k === 'p') h.featured = h.featured.filter((x) => x !== id); else h.stories = h.stories.filter((x) => x !== id); return persist('إزالة من المختارات'); }
    if (e.target.id === 'hImgX') { h.heroImageFileId = null; return persist('صورة الواجهة'); }
    if (e.target.closest('#hImgLib')) { const k = await pickLibImage(h.heroImageFileId); if (k) { h.heroImageFileId = 'lib:' + k; return persist('صورة الواجهة'); } return; }
    if (e.target.id === 'hSave') {
      h.heroTitle = $('#hT', b).value.trim() || h.heroTitle; h.heroText = $('#hX', b).value.trim();
      h.periodFrom = $('#hF', b).value; h.periodTo = $('#hTo', b).value;
      const k = $$('[data-kpi]', b).filter((x) => x.checked).map((x) => x.dataset.kpi);
      if (k.length > 5) return toast('اختر خمسة أرقام على الأكثر.', 'err');
      h.kpis = k; await persist('النصوص والأرقام'); toast('حُفظ محتوى الرئيسية');
    }
  };
  b.onchange = async (e) => {
    if (e.target.dataset.secon) { const s = h.sections.find((x) => x.id === e.target.dataset.secon); s.on = e.target.checked; return persist('إظهار الأقسام'); }
    const as = e.target.dataset.addsel;
    if (as && e.target.value) { (as === 'p' ? h.featured : h.stories).push(e.target.value); return persist('إضافة إلى المختارات'); }
    if (e.target.id === 'hImg' && e.target.files[0]) { try { const f = await saveUpload(e.target.files[0]); h.heroImageFileId = f.id; persist('صورة الواجهة'); } catch (er) { toast(er.message, 'err'); } }
  };
}

const LIST_DEFS = [
  { k: 'sectors', t: 'القطاعات', src: 'من ملف الحصر', use: (v) => D.partners.filter((p) => p.sector === v).length, ren: (a, b) => { D.partners.forEach((p) => { if (p.sector === a) p.sector = b; }); D.proposals.forEach((x) => { if (x.partnerSector === a) x.partnerSector = b; }); return ['partners', 'proposals']; } },
  { k: 'categories', t: 'تصنيفات الشراكة', src: 'حقل إضافي — يُضاف إليه من داخل أي شراكة', use: (v) => D.partnerships.filter((p) => (p.categories || []).includes(v)).length, ren: (a, b) => { D.partnerships.forEach((p) => { p.categories = (p.categories || []).map((d) => (d === a ? b : d)); }); return ['partnerships']; } },
  { k: 'classifications', t: 'تصنيفات المذكرات', src: 'من ملف الحصر', use: (v) => D.partnerships.filter((p) => p.classification === v).length, ren: (a, b) => { D.partnerships.forEach((p) => { if (p.classification === a) p.classification = b; }); return ['partnerships']; } },
  { k: 'departments', t: 'الإدارات', src: 'من ملف الحصر', use: (v) => D.partnerships.filter((p) => (p.departments || []).includes(v)).length + D.proposals.filter((x) => x.department === v).length, ren: (a, b) => { D.partnerships.forEach((p) => { p.departments = (p.departments || []).map((d) => (d === a ? b : d)); }); D.proposals.forEach((x) => { if (x.department === a) x.department = b; }); if (D.settings.session.dept === a) D.settings.session.dept = b; return ['partnerships', 'proposals']; } },
  { k: 'team', t: 'فريق إدارة الشراكات', src: 'من ملف الحصر', use: (v) => D.partnerships.filter((p) => (p.owners || []).includes(v)).length, ren: (a, b) => { D.partnerships.forEach((p) => { p.owners = (p.owners || []).map((d) => (d === a ? b : d)); }); return ['partnerships']; } },
  { k: 'activation', t: 'حالات التفعيل', src: 'العمود فارغ في العينة — قيم مقترحة', use: (v) => D.partnerships.filter((p) => p.activation === v).length, ren: (a, b) => { D.partnerships.forEach((p) => { if (p.activation === a) p.activation = b; }); return ['partnerships']; } },
  { k: 'attachmentCats', t: 'تصنيفات الملفات', src: 'من ملاحظة «تقارير الشراكة» + مقترحة', use: (v) => D.partnerships.reduce((n, p) => n + (p.attachments || []).filter((a) => a.category === v).length, 0), ren: (a, b) => { D.partnerships.forEach((p) => (p.attachments || []).forEach((x) => { if (x.category === a) x.category = b; })); return ['partnerships']; } },
  { k: 'partnerTypes', t: 'تصنيف الشراكة', src: 'شريك استراتيجي أو شريك خدمات', use: (v) => D.partnerships.filter((p) => p.ptype === v).length, ren: (a, b) => { D.partnerships.forEach((p) => { if (p.ptype === a) p.ptype = b; }); return ['partnerships']; } },
  { k: 'domains', t: 'مجالات عمل الجهات', src: 'تصنيف الشريك: بيئة، سياحة، طاقة…', use: (v) => D.partners.filter((p) => p.domain === v).length, ren: (a, b) => { D.partners.forEach((p) => { if (p.domain === a) p.domain = b; }); return ['partners']; } },
  { k: 'originTypes', t: 'بداية العلاقة', src: 'من فتح الباب: شخصيًا أو عن طريق بناء شراكة', use: (v) => D.partnerships.filter((p) => p.origin === v).length, ren: (a, b) => { D.partnerships.forEach((p) => { if (p.origin === a) p.origin = b; }); return ['partnerships']; } },
  { k: 'valueTypes', t: 'أنواع القيمة', src: 'في نموذجي التقييم المبدئي وتقييم الشراكة', use: (v) => D.partnerships.filter((p) => (p.valueTypes || []).includes(v)).length, ren: (a, b) => { D.partnerships.forEach((p) => { p.valueTypes = (p.valueTypes || []).map((d) => (d === a ? b : d)); }); return ['partnerships']; } },
  { k: 'financeModels', t: 'النماذج المالية', src: 'الوضع المالي للشراكة', use: (v) => D.partnerships.filter((p) => (p.finance || {}).model === v).length, ren: (a, b) => { D.partnerships.forEach((p) => { if (p.finance && p.finance.model === a) p.finance.model = b; }); return ['partnerships']; } },
  { k: 'financeStatus', t: 'حالات الوضع المالي', src: 'الوضع المالي للشراكة', use: (v) => D.partnerships.filter((p) => (p.finance || {}).status === v).length, ren: (a, b) => { D.partnerships.forEach((p) => { if (p.finance && p.finance.status === a) p.finance.status = b; }); return ['partnerships']; } },
  { k: 'goals', t: 'الأهداف الاستراتيجية', src: 'تُستخدم في «شارك» ونموذج المواءمة — ابدأ كل هدف برمزه مثل «SO1:»', use: (v) => D.proposals.filter((x) => x.strategicGoal === v).length, ren: (a, b) => { D.proposals.forEach((x) => { if (x.strategicGoal === a) x.strategicGoal = b; }); return ['proposals']; } },
];
function setLists(b) {
  const meta = (k, v) => ((D.settings.listMeta || {})[k] || {})[v];
  b.innerHTML = `<div class="note" style="margin-bottom:16px">${icon('info')}<span>هذه القوائم تغذي القوائم المنسدلة في المنصة. ما يُضاف من داخل أي شراكة يظهر هنا فورًا مع مصدره. تغيير اسم قيمة يُحدِّث جميع السجلات التي تستخدمها، ولا يمكن حذف قيمة مستخدمة قبل نقل سجلاتها.</span></div>
    <div class="dgrid">${LIST_DEFS.map((d) => `<div class="panel c6" id="list-${d.k}"><div class="panel-h"><h3>${d.t} <span class="faint small">(${L(d.k).length})</span></h3><span class="sub">${esc(d.src)}</span></div><div class="panel-b">
      <div class="lst">${L(d.k).map((v, i) => { const m = meta(d.k, v); return `<div class="lst-i ${m && (Date.now() - new Date(m.at)) < 7 * 864e5 ? 'fresh' : ''}"><div class="grow"><input value="${esc(v)}" data-ren="${d.k}:${i}">${m ? `<div class="lst-m">أُضيفت من ${esc(m.from)} — ${esc(m.by)} — ${relDays(m.at)}</div>` : ''}</div><span class="u">${d.use(v) ? plural(d.use(v), 'سجل واحد', 'سجلان', 'سجلات', 'سجلًا') : 'غير مستخدمة'}</span><button class="icon-btn" data-del="${d.k}:${i}" title="حذف">${icon('trash')}</button></div>`; }).join('') || '<div class="lst-i"><span class="small muted" style="padding:6px 8px">القائمة فارغة.</span></div>'}</div>
      <div class="row" style="margin-top:10px"><input class="in" placeholder="قيمة جديدة" data-newv="${d.k}"><button class="btn" data-addv="${d.k}">${icon('plus')} إضافة</button></div></div></div>`).join('')}
    <div class="panel c6"><div class="panel-h"><h3>مراحل الشراكة</h3><span class="sub">حقل إداري مقترح</span></div><div class="panel-b"><div class="lst">${D.settings.stages.map((s) => `<div class="lst-i"><input value="${esc(s.label)}" data-stage="${s.id}"><span class="u">${D.partnerships.filter((p) => p.stage === s.id).length || ''}</span></div>`).join('')}</div><p class="xs muted" style="margin-top:8px">يمكن تعديل أسماء المراحل. «موقّعة» تُفعّل حساب السريان من التواريخ.</p></div></div>
    <div class="panel c6"><div class="panel-h"><h3>حالات المقترح</h3><span class="sub">${prelimNote()}</span></div><div class="panel-b"><div class="lst">${D.settings.proposalStatuses.map((s) => `<div class="lst-i"><input value="${esc(s.label)}" data-pst="${s.id}"><span class="u">${D.proposals.filter((x) => x.status === s.id).length || ''}</span></div>`).join('')}</div></div></div></div>`;
  b.onchange = async (e) => {
    const rn = e.target.dataset.ren;
    if (rn) {
      const [k, i] = rn.split(':'); const old = D.settings.lists[k][+i]; const nv = e.target.value.trim();
      if (!nv || nv === old) { e.target.value = old; return; }
      if (L(k).includes(nv)) { toast('القيمة موجودة بالفعل في القائمة.', 'err'); e.target.value = old; return; }
      const def = LIST_DEFS.find((d) => d.k === k);
      D.settings.lists[k][+i] = nv;
      const lm = (D.settings.listMeta || {})[k]; if (lm && lm[old]) { lm[nv] = lm[old]; delete lm[old]; }
      const cols = def.ren(old, nv);
      for (const c of cols) await Store.putMany(c, D[c]);
      await saveSet('تغيير اسم قيمة', `${def.t}: ${old} ← ${nv}`); toast('حُدّثت القيمة في جميع السجلات'); setLists(b); return;
    }
    if (e.target.dataset.stage) { const s = D.settings.stages.find((x) => x.id === e.target.dataset.stage); const nv = e.target.value.trim(); if (nv) { s.label = nv; await saveSet('اسم مرحلة', nv); toast('حُفظ'); } return; }
    if (e.target.dataset.pst) { const s = D.settings.proposalStatuses.find((x) => x.id === e.target.dataset.pst); const nv = e.target.value.trim(); if (nv) { s.label = nv; await saveSet('اسم حالة مقترح', nv); toast('حُفظ'); } }
  };
  b.onclick = async (e) => {
    const ad = e.target.closest('[data-addv]');
    if (ad) { const k = ad.dataset.addv; const inp = $(`[data-newv="${k}"]`, b); const v = inp.value.trim(); if (!v) return; if (L(k).some((x) => normAr(x) === normAr(v))) return toast('القيمة موجودة بالفعل.', 'err'); await addListValue(k, v, 'صفحة القوائم'); setLists(b); return; }
    const dl = e.target.closest('[data-del]');
    if (dl) { const [k, i] = dl.dataset.del.split(':'); const v = D.settings.lists[k][+i]; const def = LIST_DEFS.find((d) => d.k === k); if (def.use(v)) return toast(`لا يمكن حذف «${v}» لأنها مستخدمة في ${def.use(v)} سجل. غيّر اسمها أو انقل السجلات أولًا.`, 'err'); D.settings.lists[k].splice(+i, 1); const lm = (D.settings.listMeta || {})[k]; if (lm) delete lm[v]; await saveSet('حذف قيمة', v); setLists(b); }
  };
}

function wfSettingsHTML() {
  const admin = can('manage.accounts');
  const A = wfAccounts();
  const depts = [...new Set(L('departments'))];
  const docs = WF_STEPS.flatMap((st) => st.docs.map((d) => ({ ...d, st })));
  return `<div class="panel" id="setAccounts"><div class="panel-h"><h3>حسابات الإدارات</h3><span class="sub">حساب لكل إدارة في قائمة «الإدارات»، يُضاف تلقائيًا عند إضافة إدارة من صفحة القوائم</span></div><div class="panel-b">
      <div class="tbl-wrap"><table class="tbl acc-tbl"><thead><tr><th>الحساب</th><th>الدور في المنصة</th><th>مهامه في مسار الشراكة</th><th></th></tr></thead><tbody>
      ${A.map((a) => { const steps = WF_STEPS.filter((st) => (a.role === 'admin' ? false : a.role === 'team' ? st.actor === 'partnerships' : a.role === 'dept' ? (a.duties || []).some((k) => st.actor === k) || ['requester', 'concerned'].includes(st.actor) : false)); return `<tr><td><b>${esc(a.t)}</b><small class="faint" style="display:block">${esc(a.g)}</small></td><td>${esc(ROLES[a.role].label)}</td>
        <td><div class="acc-steps">${a.role === 'admin' ? '<span class="faint small">كل الخطوات، وينفّذ نيابة عن أي جهة</span>' : a.role === 'viewer' ? '<span class="faint small">اطلاع فقط</span>' : steps.map((st) => `<span class="chip ${['requester', 'concerned'].includes(st.actor) ? '' : 'ok'}" title="${esc(st.t)}">${st.n}. ${esc(st.t.length > 26 ? st.t.slice(0, 25) + '…' : st.t)}</span>`).join('')}</div></td>
        <td>${isSysAdmin() || AUTH.dev ? `<button class="btn sm ghost" type="button" data-asacc="${esc(a.id)}">معاينة بهذا الحساب</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="xs muted" style="margin-top:10px">خطوات «الإدارة الطالبة» و«الإدارات المعنية» تظهر لأي إدارة عندما تكون طالبة الشراكة أو ضمن الإدارات المتقاطعة معها.</p></div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>جهات المراجعة والاعتماد في المسار</h3><span class="sub">${admin ? 'حدد الحساب المسؤول عن كل خطوة اعتماد' : 'تحددها إدارة الشراكات'}</span></div><div class="panel-b"><div class="grid2">
      ${Object.keys(WF_DEPT_DEFAULTS).map((k) => `<div class="field"><label>${esc(WF_KEYS[k])} <small class="faint">— الخطوة ${WF_STEPS.filter((st) => st.actor === k).map((st) => st.n).join('، ')}</small></label>${k === 'excellency' ? `<input class="in" data-wfdept="${k}" value="${esc(wfDept(k))}" ${admin ? '' : 'disabled'}>` : `<select class="in" data-wfdept="${k}" ${admin ? '' : 'disabled'}>${depts.map((d) => `<option ${d === wfDept(k) ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>`}</div>`).join('')}</div></div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>بيانات خطاب طلب موافقة المعالي</h3><span class="sub">تُستخدم افتراضيًا عند توليد الخطاب في الخطوة ${(wfStep('legal') || {}).n || ''}</span></div><div class="panel-b"><div class="grid2">
      ${[['to1', 'المخاطَب'], ['to2', 'الصفة'], ['signTitle', 'صفة الموقِّع'], ['signName', 'اسم الموقِّع']].map(([k, l]) => `<div class="field"><label>${l}</label><input class="in" data-letter="${k}" value="${esc((D.settings.letter || {})[k] || '')}" ${admin ? '' : 'disabled'}></div>`).join('')}</div></div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>نماذج المسار</h3><span class="sub">النماذج الفارغة المعتمدة؛ تظهر للتنزيل داخل كل خطوة</span></div><div class="panel-b"><div class="tpl-list">
      ${docs.map((d) => { const f = (D.settings.wfTemplates || {})[d.k]; return `<div class="tpl ${f ? 'ok' : ''}">${icon(f ? 'check' : 'file')}<span class="grow"><b>${esc(d.l)}</b><small>الخطوة ${d.st.n}: ${esc(d.st.t)}</small></span>${f ? `<button class="btn sm ghost" type="button" data-tpldl="${esc(f)}">${icon('download')}</button>` : ''}${admin ? `<label class="btn sm">${icon('upload')} ${f ? 'استبدال' : 'رفع النموذج'}<input type="file" hidden data-tplup="${d.k}"></label>` : ''}</div>`; }).join('')}</div></div></div>`;
}
function setRoles(b) {
  const cur = Session.role();
  b.innerHTML = authSettingsHTML() + `<div style="margin-top:18px"></div>` + wfSettingsHTML() + `
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>مصفوفة الصلاحيات</h3></div><div class="panel-b" style="overflow:auto"><table class="perm-tbl"><thead><tr><th>الصلاحية</th>${Object.values(ROLES).map((r) => `<th>${r.label}</th>`).join('')}</tr></thead><tbody>
      ${Object.entries(PERMS).map(([p, rs]) => `<tr><td>${esc(PERM_LABELS[p] || p)}</td>${Object.keys(ROLES).map((k) => `<td class="${rs.includes(k) ? 'y' : 'n'}">${rs.includes(k) ? '✓' : '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  b.onclick = async (e) => {
    if (authSettingsClick(e)) return;
    const ac = e.target.closest('[data-asacc]'); if (ac) return switchAccount(ac.dataset.asacc);
    const dl = e.target.closest('[data-tpldl]'); if (dl) return downloadStored(dl.dataset.tpldl, 'نموذج');
  };
  b.onchange = async (e) => {
    const lt = e.target.closest('[data-letter]');
    if (lt) { D.settings.letter = { ...(D.settings.letter || {}), [lt.dataset.letter]: lt.value.trim() }; await saveSet('بيانات خطاب طلب موافقة المعالي', lt.value.trim()); toast('حُفظ'); return; }
    const wd = e.target.closest('[data-wfdept]');
    if (wd) { D.settings.wfDepts = { ...(D.settings.wfDepts || {}), [wd.dataset.wfdept]: wd.value.trim() || WF_DEPT_DEFAULTS[wd.dataset.wfdept] }; await saveSet('جهات الاعتماد في مسار الشراكة', `${WF_KEYS[wd.dataset.wfdept]}: ${wd.value}`); return setRoles(b); }
    const tu = e.target.closest('[data-tplup]');
    if (tu && tu.files.length) { try { const rec = await saveUpload(tu.files[0]); D.settings.wfTemplates = { ...(D.settings.wfTemplates || {}), [tu.dataset.tplup]: rec.id }; await saveSet('نماذج مسار الشراكة', tu.files[0].name); toast('رُفع النموذج'); } catch (err) { toast(err.message, 'err'); } return setRoles(b); }
  };
}
async function switchRole(role, dept, member) {
  if (!AUTH.dev && !(currentLogin() || {}).sys) return toast('تبديل الحساب متاح لمدير النظام فقط.', 'err');
  D.settings.session = { role, dept: dept || Session.dept(), member: member || Session.member() };
  await Repo.saveSettings();
  await Repo.log('role.switch', 'system', 'session', ROLES[role].label, role === 'dept' ? D.settings.session.dept : role === 'team' ? D.settings.session.member : '');
  App.dirty = false;
  renderShell();
  toast(`الدور الحالي: ${ROLES[role].label}${role === 'dept' ? ' — ' + D.settings.session.dept : ''}`);
  route();
}

function setData(b) {
  b.innerHTML = `<div class="panel"><div class="panel-h"><h3>البيانات التجريبية</h3></div><div class="panel-b">
      <label class="row" style="gap:12px;justify-content:space-between"><span><b style="font-weight:600">إظهار البيانات التجريبية</b><div class="small muted">${D.partnerships.filter((p) => p.demo).length} شراكة و${D.proposals.filter((p) => p.demo).length} مقترحات و${D.achievements.filter((p) => p.demo).length} إنجازات تجريبية، مميزة بوسم «تجريبي» ولا تمثل بيانات فعلية.</div></span><span class="switch"><input type="checkbox" id="dDemo" ${showDemo() ? 'checked' : ''}><i></i></span></label>
      <p class="small muted" style="margin-top:12px">السجلات الثلاثة المستوردة من ملف الحصر تبقى ظاهرة دائمًا. عند الإخفاء تُحسب المؤشرات من البيانات الفعلية فقط.</p>
      <div class="row" style="margin-top:12px"><button class="btn danger" id="dPurge">${icon('trash')} حذف البيانات التجريبية نهائيًا</button></div></div></div>
    ${can('edit.partnership') ? `<div class="panel" style="margin-top:18px" id="dContacts"><div class="panel-h"><h3>بيانات التواصل من ملف الحصر</h3><span class="sub">ضباط الاتصال: الاسم والبريد والجوال</span></div><div class="panel-b">
      <p class="small muted" style="margin-bottom:12px">بيانات التواصل الشخصية لا تُحفظ في شيفرة المنصة المنشورة. اختر «ملف حصر الشراكات» من جهازك لتُقرأ منه أعمدة ضابط الاتصال والبريد والجوال وتُحفظ في بيانات المنصة${Cloud.on ? ' المشتركة المحمية بتسجيل الدخول' : ''}. لا يُرفع الملف نفسه ولا يتغير شيء غير بيانات التواصل.</p>
      <label class="btn">${icon('upload')} اختيار ملف الحصر (xlsx)<input type="file" accept=".xlsx" hidden id="dCImp"></label>
      <span class="small muted" id="dCStat" style="margin-inline-start:10px">${D.partnerships.filter((p) => !p.demo && (p.contactEmail || p.contactPhone)).length} شراكة لها بيانات تواصل حاليًا</span></div></div>` : ''}
    ${can('edit.partnership') ? `<div class="panel" style="margin-top:18px" id="dPkg"><div class="panel-h"><h3>استيراد حزمة شراكة</h3><span class="sub">مستندات وصور ونماذج معبأة لشراكة قائمة</span></div><div class="panel-b">
      <p class="small muted" style="margin-bottom:12px">ملف حزمة (.json) يضم مستندات شراكة ونماذجها جاهزة. تُضاف المرفقات إلى ملف الشراكة في مراحل مسارها، وتُنشأ النماذج بتصميم المنظومة. الاستيراد آمن للتكرار: لا يتكرر ملف موجود ولا يُستبدل نموذج مكتمل.</p>
      <label class="btn">${icon('upload')} اختيار ملف الحزمة<input type="file" accept=".json,application/json" hidden id="dPkgImp"></label>
      <span class="small muted" id="dPkgStat" style="margin-inline-start:10px"></span></div></div>` : ''}
    <div class="panel" style="margin-top:18px" id="dAppDl"><div class="panel-h"><h3>نسخة المنصة على جهازك</h3><span class="sub">ملف واحد يعمل من الجهاز مباشرة</span></div><div class="panel-b">
      <p class="small muted" style="margin-bottom:12px">ينزّل المنصة نفسها في ملف HTML واحد يُفتح بأي متصفح دون تثبيت. ${Cloud.on ? 'عند فتحه وتسجيل الدخول يتصل بالبيانات المشتركة نفسها (يحتاج إنترنت)، ويعرض آخر نسخة محفوظة على الجهاز عند انقطاع الاتصال.' : 'يعمل دون إنترنت، وبياناته تُحفظ في المتصفح الذي يُفتح فيه.'} الملف لا يحتوي بيانات الشراكات ولا كلمات المرور؛ للاحتفاظ بنسخة من البيانات استخدم «تصدير نسخة احتياطية».</p>
      <button class="btn" type="button" id="dAppSave">${icon('download')} تنزيل نسخة المنصة (HTML)</button></div></div>
    <div class="panel" style="margin-top:18px"><div class="panel-h"><h3>النسخ الاحتياطي والاستعادة</h3></div><div class="panel-b">
      <p class="small muted" style="margin-bottom:14px">${Cloud.on ? 'البيانات محفوظة على خادم المنصة المشتركة، مع نسخة على هذا الجهاز للعرض السريع. صدّر نسخة احتياطية دورية للاحتفاظ بها خارج المنصة.' : `تُحفظ البيانات والمرفقات في متصفح هذا الجهاز (${Store.mode === 'idb' ? 'IndexedDB' : 'ذاكرة مؤقتة — لن تبقى بعد إغلاق الصفحة'}). صدّر نسخة احتياطية دورية، أو لنقل البيانات إلى جهاز آخر.`}</p>
      <div class="row wrap"><button class="btn primary" id="dExp">${icon('download')} تصدير نسخة احتياطية (JSON مع المرفقات)</button>
        <label class="btn">${icon('upload')} استعادة من نسخة<input type="file" accept=".json,application/json" hidden id="dImp"></label></div>
      <div id="dStat" class="small muted" style="margin-top:12px"></div></div></div>
    ${Cloud.on ? `<div class="panel" style="margin-top:18px" id="dCloud"><div class="panel-h"><h3>المنصة المشتركة</h3><span class="sub">كل الحسابات تعمل على نفس البيانات من أي جهاز</span></div><div class="panel-b">
      <p class="small" style="margin-bottom:8px"><span class="cloud-pill" data-st="${Cloud.state}"></span> ${esc(cloudStateText())}</p>
      <div class="cl-usage" id="dUsage"></div>
      ${Cloud.needUpdate ? `<p class="small" style="color:var(--danger,#b4462f);margin-bottom:10px">${Cloud.fout.length} ملف أكبر من 15 ميجا ينتظر تحديث الخادم (ملف «supabase-update-files.sql»)، وسيُرفع تلقائيًا بعد التحديث.</p>` : ''}
      <div class="row wrap"><button class="btn" id="dSync">${icon('history')} مزامنة الآن</button>
        ${['sys', 'admin'].includes(Cloud.grp) ? `<button class="btn ghost" id="dMergeOld">${icon('upload')} دمج بيانات قديمة من هذا المتصفح</button>` : ''}</div>
      <p class="xs muted" style="margin-top:10px">«دمج البيانات القديمة» يرفع ما كان محفوظًا في هذا المتصفح قبل الربط بالمنصة المشتركة (ما ليس موجودًا على المنصة أو الأحدث منه فقط). إعادة التهيئة الكاملة غير متاحة من الواجهة حمايةً لبيانات كل الحسابات.</p></div></div>` : `<div class="panel" style="margin-top:18px"><div class="panel-h"><h3>إعادة التهيئة</h3></div><div class="panel-b">
      <p class="small muted" style="margin-bottom:12px">يحذف كل البيانات والمرفقات في هذا المتصفح ويعيد المنصة إلى حالتها الأولى (السجلات المستوردة من ملف الحصر + البيانات التجريبية).</p>
      <button class="btn danger" id="dReset">إعادة تهيئة المنصة</button></div></div>`}`;
  if (Cloud.on && Cloud.token()) Cloud.rpc('shk_usage', { p_token: Cloud.token() }).then((u) => {
    const el = $('#dUsage', b); if (!el || !u) return;
    const lim = 500 * 1024 * 1024, pct = Math.min(100, Math.round((u.db / lim) * 100));
    el.innerHTML = `<div class="cl-bar ${pct >= 80 ? 'warn' : ''}"><i style="width:${pct}%"></i></div><span class="xs muted">المساحة المستخدمة ${fmtSize(u.db)} من 500 ميجا (الخطة المجانية) — ${u.files} مرفق${pct >= 80 ? ' · اقتربت المساحة من الامتلاء: احذف المرفقات غير المهمة أو انتقل للخطة المدفوعة' : ''}</span>`;
  }).catch(() => {});
  Store.allFiles().then((fs) => { const tot = fs.reduce((a, f) => a + (f.size || 0), 0); $('#dStat', b) && ($('#dStat', b).textContent = `المرفقات المحفوظة: ${fs.length} ملف (${fmtSize(tot)}).`); });
  b.onchange = async (e) => {
    if (e.target.id === 'dDemo') { await setDemo(e.target.checked); setData(b); }
    if (e.target.id === 'dPkgImp' && e.target.files[0]) {
      const st = $('#dPkgStat', b); st.textContent = 'جارٍ الاستيراد…';
      try {
        const r = await importPartnerPackage(e.target.files[0], (i, n, nm) => { st.textContent = `رفع ${i} من ${n}: ${nm}`; });
        st.innerHTML = `${icon('check')} ${esc(partnerName(r.p))}: أُضيف ${r.added} مرفق${r.skipped ? ` (${r.skipped} موجود مسبقًا)` : ''}${r.forms ? ` و${r.forms} نموذج` : ''} — <a href="#/partnerships/${r.p.id}">فتح الشراكة</a>`;
        toast('اكتمل استيراد الحزمة');
      } catch (er) { st.textContent = er.message; toast(er.message, 'err'); }
      e.target.value = ''; return;
    }
    if (e.target.id === 'dCImp' && e.target.files[0]) {
      const st = $('#dCStat', b); st.textContent = 'جارٍ القراءة…';
      try { const r = await importContactsFromXlsx(e.target.files[0]); toast(r.n ? `حُدّثت بيانات التواصل لـ ${r.n} شراكة` : 'لا جديد: بيانات التواصل مطابقة للملف'); setData(b); }
      catch (er) { st.textContent = er.message; toast(er.message, 'err'); }
      e.target.value = ''; return;
    }
    if (e.target.id === 'dImp' && e.target.files[0]) {
      if (!(await confirmDlg('ستُستبدل جميع البيانات الحالية في هذا المتصفح بمحتوى النسخة الاحتياطية. يُنصح بتصدير نسخة من الوضع الحالي أولًا.', { title: 'استعادة نسخة احتياطية', ok: 'استعادة', danger: true }))) { e.target.value = ''; return; }
      try { $('#dStat', b).innerHTML = '<span class="spinner" style="width:16px;height:16px;display:inline-block;vertical-align:middle"></span> جارٍ الاستعادة…'; await restoreBackup(e.target.files[0]); applyTheme(); renderShell(); toast('استُعيدت النسخة الاحتياطية'); go('#/'); }
      catch (er) { toast(er.message, 'err'); $('#dStat', b).textContent = er.message; }
    }
  };
  b.onclick = async (e) => {
    if (e.target.closest('#dExp')) { try { await exportBackup(); toast('صُدّرت النسخة الاحتياطية'); } catch (er) { toast('تعذّر التصدير: ' + er.message, 'err'); } }
    if (e.target.closest('#dPurge')) {
      if (!(await confirmDlg('سيُحذف كل ما يحمل وسم «تجريبي» (شراكات، جهات، مقترحات، إنجازات، أخبار) نهائيًا. تبقى السجلات الفعلية وما أضفته أنت.', { title: 'حذف البيانات التجريبية', ok: 'حذف نهائيًا', danger: true }))) return;
      for (const c of ['partnerships', 'partners', 'proposals', 'achievements', 'news']) { for (const x of D[c].filter((y) => y.demo)) await Store.del(c, x.id); D[c] = D[c].filter((y) => !y.demo); }
      const ids = new Set(D.partnerships.map((p) => p.id)); D.settings.home.featured = (D.settings.home.featured || []).filter((x) => ids.has(x));
      const sids = new Set(D.achievements.map((p) => p.id)); D.settings.home.stories = (D.settings.home.stories || []).filter((x) => sids.has(x));
      await saveSet('حذف البيانات التجريبية'); toast('حُذفت البيانات التجريبية'); renderShell(); setData(b);
    }
    if (e.target.closest('#dAppSave')) {
      if (!window.__APP_SRC) return toast('تعذّر تجهيز نسخة المنصة في هذا المتصفح.', 'err');
      download(`${D.settings.org.platform || 'منظومة الشراكات'} — نسخة محلية.html`, new Blob(['<!DOCTYPE html>\n' + window.__APP_SRC], { type: 'text/html;charset=utf-8' }));
      toast('نُزّلت نسخة المنصة'); return;
    }
    if (e.target.closest('#dSync')) { await cloudTick(); toast(cloudStateText(), Cloud.state === 'ok' ? '' : 'err'); setData(b); return; }
    if (e.target.closest('#dMergeOld')) { if (await confirmDlg('رفع البيانات القديمة المحفوظة في هذا المتصفح إلى المنصة المشتركة؟ يُضاف ما ليس موجودًا ويُحدَّث الأقدم فقط، ولا يُحذف شيء.', { title: 'دمج بيانات المتصفح', ok: 'دمج' })) { await cloudMergeOldLocal(); setData(b); } return; }
    if (e.target.closest('#dReset')) {
      if (Cloud.on) return toast('إعادة التهيئة غير متاحة في المنصة المشتركة', 'err');
      if (!(await confirmDlg('سيُحذف كل شيء في هذا المتصفح، بما في ذلك ما أضفته من شراكات ومقترحات ومرفقات.', { title: 'إعادة تهيئة المنصة', ok: 'إعادة التهيئة', danger: true }))) return;
      for (const c of COLS) await Store.clear(c);
      if (Store.db) await Store.tx('files', 'readwrite', (s) => s.clear());
      Store.memFiles.clear(); FileCache.urls.clear();
      for (const c of COLS) D[c] = c === 'settings' ? null : [];
      await seedAll(); if (migrate()) { await Repo.saveSettings(); for (const c of ['partnerships', 'achievements', 'partners']) await Store.putMany(c, D[c]); } applyTheme(); renderShell(); toast('أُعيدت تهيئة المنصة'); go('#/');
    }
  };
}
async function setDemo(on) {
  D.settings.showDemo = on;
  await Repo.saveSettings();
  await Repo.log('demo.toggle', 'system', 'demo', on ? 'إظهار البيانات التجريبية' : 'إخفاء البيانات التجريبية');
  renderShell();
  toast(on ? 'البيانات التجريبية ظاهرة' : 'البيانات التجريبية مخفية — تُعرض البيانات الفعلية فقط');
}

function setAudit(b) {
  const st = { q: '', ent: '' };
  const ENT = { partnership: 'الشراكات', proposal: 'المقترحات', partner: 'الجهات', settings: 'الإعدادات', achievement: 'الإنجازات', news: 'الأخبار', system: 'النظام' };
  b.innerHTML = `<div class="panel"><div class="panel-h"><h3>سجل التغييرات والإجراءات</h3><span class="sub">${D.audit.length} إجراء</span></div><div class="panel-b">
    <div class="reg-tools"><div class="searchbox">${icon('search')}<input id="aq" type="search" placeholder="بحث في السجل…"></div><select class="in" id="ae" style="width:auto"><option value="">الكل</option>${Object.entries(ENT).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
    <div id="alist"></div></div></div>`;
  const draw = () => {
    const list = D.audit.filter((a) => (!st.ent || a.entity === st.ent) && matchQ([a.label, a.details, a.user, AUDIT_LABELS[a.action]].join(' '), st.q)).slice(0, 300);
    $('#alist', b).innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الوقت</th><th>المستخدم</th><th>الإجراء</th><th>السجل</th><th>التفاصيل</th></tr></thead><tbody>
      ${list.map((a) => { const href = a.entity === 'partnership' ? `#/partnerships/${a.entityId}` : a.entity === 'proposal' ? `#/proposals/${a.entityId}` : a.entity === 'partner' ? `#/partners/${a.entityId}` : ''; return `<tr style="cursor:default"><td class="small" style="white-space:nowrap">${fmtDT(a.at)}</td><td class="small">${esc(a.user)}</td><td class="small">${esc(AUDIT_LABELS[a.action] || a.action)}</td><td class="small">${href ? `<a href="${href}">${esc(a.label)}</a>` : esc(a.label)}</td><td class="small muted">${esc(a.details || '')}</td></tr>`; }).join('')}</tbody></table></div>` : emptyHTML({ ic: 'history', title: 'لا توجد إجراءات مطابقة' });
  };
  draw();
  $('#aq', b).oninput = debounce((e) => { st.q = e.target.value; draw(); }, 150);
  $('#ae', b).onchange = (e) => { st.ent = e.target.value; draw(); };
}
