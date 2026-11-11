/* =====================================================================
   مقترحات الجهات الخارجية
   - ?propose=… : نموذج «اقتراح شراكة» لجهة من خارج المؤسسة، بلا حساب. يصل المقترح إلى «المقترحات الواردة».
   - ?track=…   : صفحة متابعة المقترح: الحالة والرسائل الموجهة للجهة فقط.
   - الإعدادات ← «مقترحات الجهات الخارجية»: إنشاء روابط الدعوة ومتابعتها وإيقافها.
   ===================================================================== */
const EXT_STATUS = { submitted: ['تم الاستلام', 'وصل مقترحكم وسيُدرس قريبًا.', 1], review: ['قيد الدراسة', 'تدرس إدارة الشراكات مقترحكم.', 2], info: ['مطلوب معلومات إضافية', 'تواصلت معكم إدارة الشراكات لاستكمال بعض البيانات.', 2], accepted: ['مقبول مبدئيًا', 'قُبل المقترح مبدئيًا، وستتواصل معكم إدارة الشراكات للخطوات التالية.', 3], converted: ['مقبول — بدأت إجراءات الشراكة', 'بدأت إجراءات الشراكة رسميًا.', 3], rejected: ['نعتذر عن عدم القبول', 'شكرًا لاهتمامكم؛ لم يُقبل المقترح في الوقت الحالي.', 3] };
const extEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function extShell(inner) {
  const old = $('#extPage'); if (old) old.remove();
  if (window.__SBX) { /* الاستعراض: الصفحة الخارجية فوق النسخة المعزولة دون إزالتها */ }
  else { const b = $('#boot'); if (b) b.remove(); ['#app', '#shkLogin', '#shkSplash'].forEach((s) => { const e = $(s); if (e) e.remove(); }); document.documentElement.classList.remove('sp-lock'); }
  const logo = (ASSET_IMG['murooj-logo'] || {}).src;
  const d = document.createElement('div'); d.className = 'ext-page' + (window.__SBX ? ' ext-overlay' : ''); d.id = 'extPage';
  d.innerHTML = `<header class="ext-hd">${logo ? `<img src="${logo}" alt="">` : ''}<span>منظومة الشراكات</span></header><main class="ext-main">${inner}</main><footer class="ext-ft">مؤسسة مروج الأهلية — إدارة الشراكات</footer>`;
  document.body.appendChild(d); return d;
}
const extMsg = (t, s) => extShell(`<div class="ext-card ext-center"><span class="ext-ic">${icon('info')}</span><h1>${extEsc(t)}</h1><p>${extEsc(s || 'تواصل مع إدارة الشراكات في مؤسسة مروج الأهلية للحصول على رابط جديد.')}</p></div>`);
/* مرفقات الجهة الخارجية: حتى 5 ميجابايت للملف و10 ملفات */
const EXT_MAX_FILE = 5 * 1024 * 1024, EXT_MAX_FILES = 10;
const extFmtSize = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' م.ب' : Math.max(1, Math.round(n / 1024)) + ' ك.ب');
function extFilesHTML(id) {
  return `<div class="ext-files" id="${id}"><label class="ext-drop"><input type="file" multiple hidden>${icon('upload')}<span><b>إرفاق ملفات</b><small>عرض تقديمي، ملف تعريفي، خطاب… حتى 5 ميجابايت للملف</small></span></label><ul class="ext-flist"></ul></div>`;
}
/* يربط صندوق الملفات ويعيد دالة تُرجع الملفات المختارة */
function extFilesBind(box) {
  const files = [];
  const draw = () => { box.querySelector('.ext-flist').innerHTML = files.map((f, i) => `<li><span class="ext-fic">${icon('file')}</span><b title="${extEsc(f.name)}">${extEsc(f.name)}</b><small>${extFmtSize(f.size)}</small><button type="button" data-rm="${i}" aria-label="إزالة">${icon('x')}</button></li>`).join(''); };
  const add = async (list) => {
    for (let f of list) {
      if (files.length >= EXT_MAX_FILES) { alert('الحد الأقصى 10 ملفات.'); break; }
      if (/^image\//.test(f.type) && typeof compressImage === 'function') { try { f = await compressImage(f); } catch (_) { /* */ } }
      if (f.size > EXT_MAX_FILE) { alert(`حجم «${f.name}» أكبر من 5 ميجابايت.`); continue; }
      files.push(f);
    }
    draw();
  };
  const inp = box.querySelector('input[type=file]');
  inp.onchange = () => { add([...inp.files]); inp.value = ''; };
  box.addEventListener('dragover', (e) => { e.preventDefault(); box.classList.add('over'); });
  box.addEventListener('dragleave', () => box.classList.remove('over'));
  box.addEventListener('drop', (e) => { e.preventDefault(); box.classList.remove('over'); add([...e.dataTransfer.files]); });
  box.querySelector('.ext-flist').onclick = (e) => { const b = e.target.closest('[data-rm]'); if (b) { files.splice(+b.dataset.rm, 1); draw(); } };
  box.__add = add;
  return () => files;
}
/* رفع الملفات إلى الخادم بمفتاح الدعوة أو المتابعة، ويعيد معرّفاتها */
async function extUpload(key, files, onStep) {
  const ids = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i]; onStep && onStep(i + 1, files.length);
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(f); });
    const id = 'f-ext-' + [...crypto.getRandomValues(new Uint8Array(10))].map((x) => x.toString(16).padStart(2, '0')).join('');
    const r = await Cloud.rpc('shk_ext_file_put', { p_key: key, p_id: id, p_meta: { name: f.name, type: f.type || 'application/octet-stream', size: f.size }, p_data: b64 });
    if (!r || r.error) throw new Error(r && r.error === 'too_many' ? 'الحد الأقصى 10 ملفات.' : `تعذّر رفع «${f.name}».`);
    ids.push(id);
  }
  return ids;
}
/* عند الإقلاع: تعيد false إن عُرضت صفحة خارجية وتوقف الإقلاع العادي */
async function extBoot() {
  const q = new URLSearchParams(location.search), inv = q.get('propose'), trk = q.get('track');
  if (!inv && !trk) return true;
  if (!Cloud.on) { extMsg('الرابط يعمل على المنصة المشتركة فقط'); return false; }
  if (trk) { await extTrackPage(trk); return false; }
  let r; try { r = await Cloud.rpc('shk_invite_check', { p_invite: inv }); } catch (_) { extMsg('تعذّر فتح الرابط', 'تحقق من الاتصال بالإنترنت ثم أعد فتح الرابط.'); return false; }
  if (!r || r.error) { extMsg({ expired: 'انتهت صلاحية رابط الدعوة', revoked: 'أُوقف رابط الدعوة', used: 'استُخدم رابط الدعوة من قبل' }[r && r.error] || 'رابط الدعوة غير صالح'); return false; }
  extFormPage(inv, r); return false;
}
function extFormPage(inv, info, opts = {}) {
  const sectors = (info.sectors && info.sectors.length ? info.sectors : ['حكومي', 'شبه حكومي', 'خاص', 'غير ربحي', 'تعليمي']);
  const F = [
    ['h', 'بيانات الجهة'],
    ['partnerName', 'اسم الجهة', 'text', true, info.label || ''], ['partnerSector', 'قطاع الجهة', 'select', false, '', sectors], ['about', 'نبذة عن الجهة', 'area', false],
    ['h', 'مقدم الطلب'],
    ['requesterName', 'الاسم', 'text', true], ['requesterTitle', 'المنصب', 'text', false], ['requesterEmail', 'البريد الإلكتروني', 'email', true], ['contactPhone', 'رقم الجوال', 'tel', false],
    ['h', 'المقترح'],
    ['targets', 'مجالات التعاون المقترحة', 'area', true, '', null, 'كل مجال في سطر (مثال: حملات تشجير مشتركة).'], ['addedValue', 'القيمة المضافة والأثر المتوقع', 'area', false], ['duration', 'المدة المقترحة للشراكة', 'text', false], ['notes', 'ملاحظات إضافية', 'area', false],
  ];
  const field = ([k, l, t, req, def = '', opts, hint]) => k === 'h' ? `<h2>${l}</h2>` : `<label class="ext-f ${t === 'area' ? 'full' : ''}"><span>${l}${req ? ' <i>*</i>' : ''}</span>${t === 'area' ? `<textarea data-k="${k}" rows="4">${extEsc(def)}</textarea>` : t === 'select' ? `<select data-k="${k}"><option value="">اختر</option>${opts.map((o) => `<option>${extEsc(o)}</option>`).join('')}</select>` : `<input data-k="${k}" type="${t}" value="${extEsc(def)}" ${t === 'email' || t === 'tel' ? 'dir="ltr"' : ''}>`}${hint ? `<small>${hint}</small>` : ''}<em class="err"></em></label>`;
  const d = extShell(`<div class="ext-card"><div class="ext-intro"><small>دعوة من ${extEsc((info.org && info.org.name) || 'مؤسسة مروج الأهلية')}</small><h1>اقتراح شراكة</h1><p>يسعدنا اهتمامكم بالشراكة مع المؤسسة. عبّئوا النموذج وسيصل مباشرة إلى إدارة الشراكات، وتحصلون بعد الإرسال على رابط لمتابعة المقترح والرد عليه.</p></div>
    <form class="ext-form" novalidate>${F.map(field).join('')}<h2>المرفقات <small>(اختياري)</small></h2>${extFilesHTML('exFiles')}<div class="ext-actions"><button type="submit" class="btn primary">${icon('send')} إرسال المقترح</button></div></form></div>`);
  const form = d.querySelector('form'), getFiles = extFilesBind(d.querySelector('#exFiles'));
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = {}; form.querySelectorAll('[data-k]').forEach((x) => { data[x.dataset.k] = x.value.trim(); });
    let bad = false;
    form.querySelectorAll('.ext-f').forEach((f) => { f.classList.remove('bad'); f.querySelector('.err').textContent = ''; });
    F.filter((x) => x[0] !== 'h' && x[3]).forEach(([k, l]) => { if (!data[k]) { const f = form.querySelector(`[data-k="${k}"]`).closest('.ext-f'); f.classList.add('bad'); f.querySelector('.err').textContent = `يلزم ${l}.`; bad = true; } });
    if (data.requesterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.requesterEmail)) { const f = form.querySelector('[data-k="requesterEmail"]').closest('.ext-f'); f.classList.add('bad'); f.querySelector('.err').textContent = 'صيغة البريد غير صحيحة.'; bad = true; }
    if (bad) { const f = form.querySelector('.ext-f.bad'); f && f.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    data.contactName = data.requesterName; data.contactEmail = data.requesterEmail;
    const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'جارٍ الإرسال…';
    let r; try {
      const fl = getFiles();
      if (opts.submit) r = await opts.submit(data, fl);
      else { data.files = await extUpload(inv, fl, (n, t) => { btn.textContent = `جارٍ رفع الملفات ${n} / ${t}…`; }); btn.textContent = 'جارٍ الإرسال…'; r = await Cloud.rpc('shk_ext_submit', { p_invite: inv, p_data: data }); }
    } catch (e) { r = { error: 'net', msg: e && e.message }; }
    if (!r || r.error) { btn.disabled = false; btn.innerHTML = `${icon('send')} إرسال المقترح`; alert(r && r.error === 'missing' ? 'استكملوا الحقول المطلوبة.' : r && r.error === 'invalid' ? 'انتهت صلاحية رابط الدعوة.' : (r && r.msg) || 'تعذّر الإرسال، حاولوا مرة أخرى.'); return; }
    const link = `${location.origin}${location.pathname}?track=${r.track}`;
    if (!opts.submit) history.replaceState(null, '', location.pathname + '?track=' + r.track);
    d.querySelector('.ext-main').innerHTML = `<div class="ext-card ext-center"><span class="ext-ic ok">${icon('check')}</span><h1>وصل مقترحكم</h1><p>رقم المقترح <b dir="ltr">${extEsc(r.ref)}</b>. احتفظوا برابط المتابعة لمعرفة الحالة ورد إدارة الشراكات:</p>
      <div class="ext-link"><input readonly value="${extEsc(link)}"><button type="button" class="btn" data-copy>${icon('copy')} نسخ</button></div><a class="btn primary" href="${extEsc(link)}">متابعة المقترح</a></div>`;
    d.querySelector('[data-copy]').onclick = async (ev) => { const i = d.querySelector('.ext-link input'); i.select(); try { await navigator.clipboard.writeText(i.value); } catch (_) { document.execCommand('copy'); } ev.target.closest('button').textContent = 'نُسخ'; };
  };
}
async function extTrackPage(trk, opts = {}) {
  let r; try { r = opts.status ? opts.status() : await Cloud.rpc('shk_ext_status', { p_track: trk }); } catch (_) { extMsg('تعذّر فتح صفحة المتابعة', 'تحقق من الاتصال بالإنترنت ثم أعد المحاولة.'); return; }
  if (!r || r.error) { extMsg('رابط المتابعة غير صالح'); return; }
  const S = EXT_STATUS[r.status] || EXT_STATUS.submitted, step = S[2];
  const steps = [['تم الاستلام', 1], ['قيد الدراسة', 2], ['القرار', 3]];
  const msgs = (r.events || []).filter((e) => e.message).slice().reverse();
  const fmt = (t) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(t)); } catch (_) { return String(t || '').slice(0, 10); } };
  const last = (r.events || [])[(r.events || []).length - 1], replied = r.status === 'submitted' && last && last.type === 'resubmitted';
  const ask = r.canReply ? [...(r.events || [])].reverse().find((e) => e.type === 'status' && e.to === 'info') : null;
  const d = extShell(`<div class="ext-card"><div class="ext-intro"><small>متابعة مقترح شراكة · ${extEsc(r.org || 'مؤسسة مروج الأهلية')}</small><h1>${extEsc(r.partnerName || '')}</h1><p>رقم المقترح <b dir="ltr">${extEsc(r.ref || '')}</b> · قُدّم في ${fmt(r.submittedAt)}</p></div>
    <ol class="ext-steps">${steps.map(([l, n]) => `<li class="${n < step ? 'd' : n === step ? 'c' : ''} ${n === 3 && step === 3 ? (r.status === 'rejected' ? 'no' : 'yes') : ''}"><i>${n < step || (n === 3 && step === 3) ? '✓' : n}</i><span>${n === 3 && step === 3 ? S[0] : l}</span></li>`).join('')}</ol>
    <div class="ext-status st-${extEsc(r.status)}"><b>${replied ? 'وصل ردّكم' : S[0]}</b><p>${replied ? 'أُرسل ردّكم إلى إدارة الشراكات وسيُستكمل دراسة المقترح.' : S[1]}</p></div>
    ${r.canReply ? `<section class="ext-reply" id="exReply"><h2>${icon('msg')} ردّكم على طلب الاستكمال</h2>${ask && ask.message ? `<blockquote>${extEsc(ask.message).replace(/\n/g, '<br>')}</blockquote>` : ''}
      <label class="ext-f full"><span>الرد</span><textarea rows="4" id="exReplyT" placeholder="اكتبوا ردّكم أو المعلومات المطلوبة…"></textarea><em class="err"></em></label>${extFilesHTML('exReplyF')}
      <div class="ext-actions"><button type="button" class="btn primary" id="exReplyGo">${icon('send')} إرسال الرد</button></div></section>` : ''}
    <h2>المراسلات</h2>${msgs.length ? `<ul class="ext-msgs">${msgs.map((e) => `<li class="${e.type === 'resubmitted' ? 'mine' : ''}"><small>${e.type === 'resubmitted' ? 'ردّكم · ' : ''}${fmt(e.at)}${e.to && EXT_STATUS[e.to] ? ' · ' + EXT_STATUS[e.to][0] : ''}</small><p>${extEsc(e.message).replace(/\n/g, '<br>')}</p></li>`).join('')}</ul>` : '<p class="ext-faint">لا توجد رسائل بعد. ستظهر هنا ردود إدارة الشراكات.</p>'}
    ${(r.files || []).length ? `<h2>الملفات المرسلة</h2><ul class="ext-flist ro">${r.files.map((f) => `<li><span class="ext-fic">${icon('file')}</span><b>${extEsc(f.name)}</b><small>${extFmtSize(+f.size || 0)}</small></li>`).join('')}</ul>` : ''}
    <div class="ext-actions"><button type="button" class="btn" ${opts.status ? 'disabled' : 'onclick="location.reload()"'}>${icon('history')} تحديث</button></div></div>`);
  if (!r.canReply) return;
  const getFiles = extFilesBind(d.querySelector('#exReplyF')), go = d.querySelector('#exReplyGo'), ta = d.querySelector('#exReplyT');
  go.onclick = async () => {
    const msg = ta.value.trim(), fl = getFiles(), f = ta.closest('.ext-f');
    f.classList.remove('bad'); f.querySelector('.err').textContent = '';
    if (!msg && !fl.length) { f.classList.add('bad'); f.querySelector('.err').textContent = 'اكتبوا ردًّا أو أرفقوا ملفًا.'; return; }
    go.disabled = true; go.textContent = 'جارٍ الإرسال…';
    let res; try {
      if (opts.reply) res = await opts.reply(msg, fl);
      else { const ids = await extUpload(trk, fl, (n, t) => { go.textContent = `جارٍ رفع الملفات ${n} / ${t}…`; }); res = await Cloud.rpc('shk_ext_reply', { p_track: trk, p_message: msg, p_files: ids }); }
    } catch (e) { res = { error: 'net', msg: e && e.message }; }
    if (!res || res.error) { go.disabled = false; go.innerHTML = `${icon('send')} إرسال الرد`; alert(res && res.error === 'closed' ? 'لم يعد المقترح بانتظار ردّكم.' : (res && res.msg) || 'تعذّر الإرسال، حاولوا مرة أخرى.'); return; }
    extTrackPage(trk, opts);
  };
}

/* ===== الإعدادات ← مقترحات الجهات الخارجية ===== */
function extExpiry(st) { if (st.days === 'date') { if (!st.date) return null; const d = new Date(st.date + 'T23:59:59'); return d > new Date() ? d : null; } return new Date(Date.now() + (+st.days) * 864e5); }
function setExtTab(b) {
  if (!Cloud.on && !window.__SBX) { b.innerHTML = `<div class="panel"><div class="panel-b">${emptyHTML({ ic: 'send', title: 'روابط الجهات الخارجية تعمل على المنصة المشتركة', text: 'افتح المنصة من رابطها على الإنترنت وسجّل الدخول بحساب إدارة الشراكات.' })}</div></div>`; return; }
  const st = { label: '', days: '30', date: '', uses: '1', made: null, list: null, err: '' };
  const draw = () => {
    b.innerHTML = `<div class="panel sh-new"><div class="panel-h"><h3>${icon('send')} رابط دعوة لجهة خارجية</h3><span class="sub">تقترح الجهة شراكة دون حساب، وتتابع الرد من رابط خاص بها</span></div><div class="panel-b">
      <div class="ex-grid">
        <div class="field"><label for="exLabel">اسم الجهة المدعوة</label><input class="in" id="exLabel" maxlength="120" placeholder="مثال: شركة …" value="${esc(st.label)}"><span class="hint">يظهر مسبقًا في خانة «اسم الجهة» ويمكنها تعديله.</span></div>
        <div class="field"><label>صلاحية الرابط</label><div class="sh-chips">${[['1', 'يوم'], ['7', 'أسبوع'], ['30', 'شهر'], ['90', '3 أشهر'], ['date', 'حتى تاريخ']].map(([k, l]) => `<button type="button" class="ff-chip ${st.days === k ? 'on' : ''}" data-exd="${k}">${l}</button>`).join('')}${st.days === 'date' ? `<input class="in" type="date" id="exDate" min="${isoDate(new Date(Date.now() + 864e5))}" max="${isoDate(new Date(Date.now() + 180 * 864e5))}" value="${esc(st.date)}">` : ''}</div>
          <span class="hint">${(() => { const ex = extExpiry(st); return ex ? `ينتهي الرابط ${esc(fmtDT(ex.toISOString()))} — ويمكن إيقافه في أي وقت من القائمة أدناه` : 'اختر تاريخ الانتهاء من التقويم'; })()}</span></div>
        <div class="field"><label>عدد المقترحات المسموح بها من الرابط</label><div class="sh-chips">${[['1', 'مقترح واحد'], ['5', 'حتى 5'], ['50', 'مفتوح']].map(([k, l]) => `<button type="button" class="ff-chip ${st.uses === k ? 'on' : ''}" data-exu="${k}">${l}</button>`).join('')}</div></div>
      </div>
      ${st.err ? `<div class="note warn">${icon('alert')}<span>${esc(st.err)}</span></div>` : ''}
      <div class="ex-make"><button type="button" class="btn primary" data-exmake ${extExpiry(st) ? '' : 'disabled'}>${icon('plus')} إنشاء رابط الدعوة</button></div>
      ${st.made ? `<div class="sh-made"><b>${icon('check')} الرابط جاهز — انسخه وأرسله للجهة</b><div class="sh-url"><input class="in" readonly value="${esc(st.made)}" id="exUrl"><button type="button" class="btn" data-excopy>${icon('copy')} نسخ</button></div><small>تصل مقترحات الجهة إلى «المقترحات الواردة» بوسم «جهة خارجية»، والرسالة التي تكتبها عند تغيير حالة المقترح تظهر لها في صفحة المتابعة.</small></div>` : ''}
    </div></div>
    <div class="panel"><div class="panel-h"><h3>روابط الدعوة</h3><span class="sub">${st.list ? st.list.length : '…'}</span></div><div class="panel-b">${!st.list ? '<p class="muted small">جارٍ التحميل…</p>' : !st.list.length ? '<p class="muted small">لم يُنشأ أي رابط بعد.</p>' : `<div class="tbl-wrap"><table class="tbl sh-tbl"><thead><tr><th>الجهة</th><th>الاستخدام</th><th>ينتهي</th><th>الحالة</th><th></th></tr></thead><tbody>${st.list.map((x) => { const live = !x.revoked && new Date(x.expires) > new Date() && x.uses < x.max; return `<tr class="${live ? '' : 'off'}"><td><b>${esc(x.label || 'جهة خارجية')}</b><small class="muted xs" style="display:block">${esc(fmtDT(x.at))}</small></td><td class="small">${x.uses} من ${x.max >= 50 ? '∞' : x.max}</td><td class="small">${esc(fmtDT(x.expires))}</td><td>${x.revoked ? '<span class="chip">موقوف</span>' : live ? '<span class="chip ok">سارٍ</span>' : '<span class="chip">منتهٍ</span>'}</td><td>${live ? `<button type="button" class="btn sm ghost" data-exrevoke="${esc(x.id)}">${icon('x')} إيقاف</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`}</div></div>`;
  };
  const demo = !!window.__SBX; window.__extDemoList = window.__extDemoList || [];
  const load = async () => { if (demo) { st.list = window.__extDemoList.slice(); draw(); return; } try { st.list = await Cloud.rpc('shk_invite_list', { p_token: Cloud.token() }); } catch (e) { st.list = []; st.err = e.code === 'forbidden' ? 'متاح لإدارة الشراكات ومدير النظام.' : 'لم تُفعَّل روابط الجهات الخارجية على الخادم بعد — يلزم تشغيل ملف supabase/external_proposals.sql مرة واحدة.'; } draw(); };
  draw(); load();
  b.oninput = (e) => { if (e.target.id === 'exLabel') st.label = e.target.value; if (e.target.id === 'exDate') { st.date = e.target.value; draw(); } };
  b.onclick = async (e) => {
    const d = e.target.closest('[data-exd]'); if (d) { st.days = d.dataset.exd; draw(); return; }
    const u = e.target.closest('[data-exu]'); if (u) { st.uses = u.dataset.exu; draw(); return; }
    if (e.target.closest('[data-excopy]')) { const i = $('#exUrl', b); i.select(); try { await navigator.clipboard.writeText(i.value); } catch (_) { document.execCommand('copy'); } toast('نُسخ الرابط'); return; }
    if (e.target.closest('[data-exmake]')) {
      if (demo) { const ex = extExpiry(st); if (!ex) return; st.made = `${location.origin.replace(/^null|^about:?/, 'https://sharakat-murooj.github.io')}/?propose=a1b2c3d4e5f6…`; window.__extDemoList.unshift({ id: 'demo', label: st.label || 'جهة خارجية', at: nowISO(), expires: ex.toISOString(), max: +st.uses, uses: 0, revoked: false }); await load(); return; }
      try {
        const ex = extExpiry(st); if (!ex) return;
        const r = await Cloud.rpc('shk_invite_create', { p_token: Cloud.token(), p_label: st.label.trim(), p_expires_at: ex.toISOString(), p_uses: +st.uses });
        st.made = `${location.origin}${location.pathname}?propose=${r.token}`; st.err = '';
        await Repo.log('invite.create', 'invite', r.id, st.label.trim() || 'جهة خارجية', `حتى ${fmtDT(ex.toISOString())}`);
      } catch (err) { st.err = err.code === 'forbidden' ? 'متاح لإدارة الشراكات ومدير النظام.' : 'تعذّر إنشاء الرابط.'; }
      await load(); return;
    }
    const rv = e.target.closest('[data-exrevoke]');
    if (rv && await confirmDlg('إيقاف رابط الدعوة؟ لن تتمكن الجهة من إرسال مقترحات جديدة به (روابط المتابعة تبقى تعمل).', { ok: 'إيقاف', danger: true })) {
      try { await Cloud.rpc('shk_invite_revoke', { p_token: Cloud.token(), p_id: rv.dataset.exrevoke }); toast('أُوقف الرابط'); } catch (_) { toast('تعذّر الإيقاف', 'err'); }
      await load();
    }
  };
}

/* الاستعراض: إرسال المقترح ومتابعته داخل النسخة المعزولة (بلا خادم) */
async function extDemoSubmit(data) {
  const t = nowISO(), n = D.proposals.filter((x) => x.external).length + 1;
  const rec = { ...data, id: uid('pr-ext'), ref: `EXT-${today().getFullYear()}-${String(n).padStart(4, '0')}`, status: 'submitted', external: true, extLabel: data.partnerName, department: 'جهة خارجية', createdAt: t, submittedAt: t, updatedAt: t, createdByRole: 'external', demo: false, partnershipId: null, attachments: [],
    events: [{ id: uid('ev'), at: t, by: data.requesterName, role: 'external', type: 'submitted', message: 'قُدّم المقترح عبر رابط الدعوة الخارجي' }] };
  await Repo.save('proposals', rec);
  await notify([{ grp: 'partnerships' }], { t: `مقترح شراكة من جهة خارجية ${rec.ref}`, b: `جهة خارجية — ${rec.partnerName}`, href: '#/proposals/' + rec.id, ic: 'send' });
  return { ref: rec.ref, track: 'demo' };
}
function extDemoStatus() {
  const x = D.proposals.filter((p) => p.external).pop(); if (!x) return { error: 'invalid' };
  return { ref: x.ref, partnerName: x.partnerName, status: x.status, submittedAt: x.submittedAt, org: D.settings.org.name, canReply: x.status === 'info', files: (x.attachments || []).filter((a) => a.category === 'مرفقات الجهة الخارجية').map((a) => ({ name: a.name, size: a.size })), events: (x.events || []).filter((e) => ['status', 'submitted', 'resubmitted'].includes(e.type) && (e.vis || 'all') === 'all').map((e) => ({ at: e.at, type: e.type, to: e.to, message: e.message })) };
}
/* الاستعراض: رد الجهة على طلب الاستكمال داخل النسخة المعزولة */
async function extDemoReply(msg) {
  const x = D.proposals.filter((p) => p.external).pop(); if (!x || x.status !== 'info') return { error: 'closed' };
  x.status = 'submitted'; x.updatedAt = nowISO();
  x.events = [...(x.events || []), { id: uid('ev'), at: nowISO(), by: x.requesterName, role: 'external', type: 'resubmitted', vis: 'all', message: msg }];
  await Repo.save('proposals', x);
  await notify([{ grp: 'partnerships' }], { t: `ردّت الجهة الخارجية على طلب الاستكمال: ${x.ref}`, b: `جهة خارجية — ${x.partnerName}`, href: '#/proposals/' + x.id, ic: 'msg' });
  return { ok: true };
}
