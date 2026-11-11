/* =====================================================================
   مقترحات الجهات الخارجية
   - ?propose=… : نموذج «اقتراح شراكة» لجهة من خارج المؤسسة، بلا حساب. يصل المقترح إلى «المقترحات الواردة».
   - ?track=…   : صفحة متابعة المقترح: الحالة والرسائل الموجهة للجهة فقط.
   - الإعدادات ← «مقترحات الجهات الخارجية»: إنشاء روابط الدعوة ومتابعتها وإيقافها.
   ===================================================================== */
const EXT_STATUS = { submitted: ['تم الاستلام', 'وصل مقترحكم وسيُدرس قريبًا.', 1], review: ['قيد الدراسة', 'تدرس إدارة الشراكات مقترحكم.', 2], info: ['مطلوب معلومات إضافية', 'تواصلت معكم إدارة الشراكات لاستكمال بعض البيانات.', 2], accepted: ['مقبول مبدئيًا', 'قُبل المقترح مبدئيًا، وستتواصل معكم إدارة الشراكات للخطوات التالية.', 3], converted: ['مقبول — بدأت إجراءات الشراكة', 'بدأت إجراءات الشراكة رسميًا.', 3], rejected: ['نعتذر عن عدم القبول', 'شكرًا لاهتمامكم؛ لم يُقبل المقترح في الوقت الحالي.', 3] };
const extEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function extShell(inner) {
  const b = $('#boot'); if (b) b.remove();
  ['#app', '#shkLogin', '#shkSplash'].forEach((s) => { const e = $(s); if (e) e.remove(); });
  document.documentElement.classList.remove('sp-lock');
  const logo = (ASSET_IMG['murooj-logo'] || {}).src;
  const d = document.createElement('div'); d.className = 'ext-page'; d.id = 'extPage';
  d.innerHTML = `<header class="ext-hd">${logo ? `<img src="${logo}" alt="">` : ''}<span>منظومة الشراكات</span></header><main class="ext-main">${inner}</main><footer class="ext-ft">مؤسسة مروج الأهلية — إدارة الشراكات</footer>`;
  document.body.appendChild(d); return d;
}
const extMsg = (t, s) => extShell(`<div class="ext-card ext-center"><span class="ext-ic">${icon('info')}</span><h1>${extEsc(t)}</h1><p>${extEsc(s || 'تواصل مع إدارة الشراكات في مؤسسة مروج الأهلية للحصول على رابط جديد.')}</p></div>`);
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
function extFormPage(inv, info) {
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
    <form class="ext-form" novalidate>${F.map(field).join('')}<div class="ext-actions"><button type="submit" class="btn primary">${icon('send')} إرسال المقترح</button></div></form></div>`);
  const form = d.querySelector('form');
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
    let r; try { r = await Cloud.rpc('shk_ext_submit', { p_invite: inv, p_data: data }); } catch (_) { r = { error: 'net' }; }
    if (!r || r.error) { btn.disabled = false; btn.innerHTML = `${icon('send')} إرسال المقترح`; alert(r && r.error === 'missing' ? 'استكملوا الحقول المطلوبة.' : r && r.error === 'invalid' ? 'انتهت صلاحية رابط الدعوة.' : 'تعذّر الإرسال، حاولوا مرة أخرى.'); return; }
    const link = `${location.origin}${location.pathname}?track=${r.track}`;
    history.replaceState(null, '', location.pathname + '?track=' + r.track);
    d.querySelector('.ext-main').innerHTML = `<div class="ext-card ext-center"><span class="ext-ic ok">${icon('check')}</span><h1>وصل مقترحكم</h1><p>رقم المقترح <b dir="ltr">${extEsc(r.ref)}</b>. احتفظوا برابط المتابعة لمعرفة الحالة ورد إدارة الشراكات:</p>
      <div class="ext-link"><input readonly value="${extEsc(link)}"><button type="button" class="btn" data-copy>${icon('copy')} نسخ</button></div><a class="btn primary" href="${extEsc(link)}">متابعة المقترح</a></div>`;
    d.querySelector('[data-copy]').onclick = async (ev) => { const i = d.querySelector('.ext-link input'); i.select(); try { await navigator.clipboard.writeText(i.value); } catch (_) { document.execCommand('copy'); } ev.target.closest('button').textContent = 'نُسخ'; };
  };
}
async function extTrackPage(trk) {
  let r; try { r = await Cloud.rpc('shk_ext_status', { p_track: trk }); } catch (_) { extMsg('تعذّر فتح صفحة المتابعة', 'تحقق من الاتصال بالإنترنت ثم أعد المحاولة.'); return; }
  if (!r || r.error) { extMsg('رابط المتابعة غير صالح'); return; }
  const S = EXT_STATUS[r.status] || EXT_STATUS.submitted, step = S[2];
  const steps = [['تم الاستلام', 1], ['قيد الدراسة', 2], ['القرار', 3]];
  const msgs = (r.events || []).filter((e) => e.message).slice().reverse();
  const fmt = (t) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(t)); } catch (_) { return String(t || '').slice(0, 10); } };
  extShell(`<div class="ext-card"><div class="ext-intro"><small>متابعة مقترح شراكة · ${extEsc(r.org || 'مؤسسة مروج الأهلية')}</small><h1>${extEsc(r.partnerName || '')}</h1><p>رقم المقترح <b dir="ltr">${extEsc(r.ref || '')}</b> · قُدّم في ${fmt(r.submittedAt)}</p></div>
    <ol class="ext-steps">${steps.map(([l, n]) => `<li class="${n < step ? 'd' : n === step ? 'c' : ''} ${n === 3 && step === 3 ? (r.status === 'rejected' ? 'no' : 'yes') : ''}"><i>${n < step || (n === 3 && step === 3) ? '✓' : n}</i><span>${n === 3 && step === 3 ? S[0] : l}</span></li>`).join('')}</ol>
    <div class="ext-status st-${extEsc(r.status)}"><b>${S[0]}</b><p>${S[1]}</p></div>
    <h2>رسائل إدارة الشراكات</h2>${msgs.length ? `<ul class="ext-msgs">${msgs.map((e) => `<li><small>${fmt(e.at)}${e.to && EXT_STATUS[e.to] ? ' · ' + EXT_STATUS[e.to][0] : ''}</small><p>${extEsc(e.message).replace(/\n/g, '<br>')}</p></li>`).join('')}</ul>` : '<p class="ext-faint">لا توجد رسائل بعد. ستظهر هنا ردود إدارة الشراكات.</p>'}
    <div class="ext-actions"><button type="button" class="btn" onclick="location.reload()">${icon('history')} تحديث</button></div></div>`);
}

/* ===== الإعدادات ← مقترحات الجهات الخارجية ===== */
function setExtTab(b) {
  if (!Cloud.on) { b.innerHTML = `<div class="panel"><div class="panel-b">${emptyHTML({ ic: 'send', title: 'روابط الجهات الخارجية تعمل على المنصة المشتركة', text: 'افتح المنصة من رابطها على الإنترنت وسجّل الدخول بحساب إدارة الشراكات.' })}</div></div>`; return; }
  const st = { label: '', days: '30', uses: '1', made: null, list: null, err: '' };
  const draw = () => {
    b.innerHTML = `<div class="panel sh-new"><div class="panel-h"><h3>${icon('send')} رابط دعوة لجهة خارجية</h3><span class="sub">تقترح الجهة شراكة دون حساب، وتتابع الرد من رابط خاص بها</span></div><div class="panel-b">
      <div class="grid2"><div class="field"><label for="exLabel">اسم الجهة المدعوة</label><input class="in" id="exLabel" maxlength="120" placeholder="مثال: شركة …" value="${esc(st.label)}"><span class="hint">يظهر مسبقًا في خانة «اسم الجهة» ويمكنها تعديله.</span></div>
        <div class="field"><label>صلاحية الرابط</label><div class="sh-chips">${[['7', 'أسبوع'], ['30', 'شهر'], ['90', '3 أشهر']].map(([k, l]) => `<button type="button" class="ff-chip ${st.days === k ? 'on' : ''}" data-exd="${k}">${l}</button>`).join('')}</div></div>
        <div class="field"><label>عدد المقترحات المسموح بها من الرابط</label><div class="sh-chips">${[['1', 'مقترح واحد'], ['5', 'حتى 5'], ['50', 'مفتوح']].map(([k, l]) => `<button type="button" class="ff-chip ${st.uses === k ? 'on' : ''}" data-exu="${k}">${l}</button>`).join('')}</div></div></div>
      ${st.err ? `<div class="note warn">${icon('alert')}<span>${esc(st.err)}</span></div>` : ''}
      <button type="button" class="btn primary" data-exmake>${icon('plus')} إنشاء رابط الدعوة</button>
      ${st.made ? `<div class="sh-made"><b>${icon('check')} الرابط جاهز — انسخه وأرسله للجهة</b><div class="sh-url"><input class="in" readonly value="${esc(st.made)}" id="exUrl"><button type="button" class="btn" data-excopy>${icon('copy')} نسخ</button></div><small>تصل مقترحات الجهة إلى «المقترحات الواردة» بوسم «جهة خارجية»، والرسالة التي تكتبها عند تغيير حالة المقترح تظهر لها في صفحة المتابعة.</small></div>` : ''}
    </div></div>
    <div class="panel"><div class="panel-h"><h3>روابط الدعوة</h3><span class="sub">${st.list ? st.list.length : '…'}</span></div><div class="panel-b">${!st.list ? '<p class="muted small">جارٍ التحميل…</p>' : !st.list.length ? '<p class="muted small">لم يُنشأ أي رابط بعد.</p>' : `<div class="tbl-wrap"><table class="tbl sh-tbl"><thead><tr><th>الجهة</th><th>الاستخدام</th><th>ينتهي</th><th>الحالة</th><th></th></tr></thead><tbody>${st.list.map((x) => { const live = !x.revoked && new Date(x.expires) > new Date() && x.uses < x.max; return `<tr class="${live ? '' : 'off'}"><td><b>${esc(x.label || 'جهة خارجية')}</b><small class="muted xs" style="display:block">${esc(fmtDT(x.at))}</small></td><td class="small">${x.uses} من ${x.max >= 50 ? '∞' : x.max}</td><td class="small">${esc(fmtDT(x.expires))}</td><td>${x.revoked ? '<span class="chip">موقوف</span>' : live ? '<span class="chip ok">سارٍ</span>' : '<span class="chip">منتهٍ</span>'}</td><td>${live ? `<button type="button" class="btn sm ghost" data-exrevoke="${esc(x.id)}">${icon('x')} إيقاف</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`}</div></div>`;
  };
  const load = async () => { try { st.list = await Cloud.rpc('shk_invite_list', { p_token: Cloud.token() }); } catch (e) { st.list = []; st.err = e.code === 'forbidden' ? 'متاح لإدارة الشراكات ومدير النظام.' : 'لم تُفعَّل روابط الجهات الخارجية على الخادم بعد — يلزم تشغيل ملف supabase/external_proposals.sql مرة واحدة.'; } draw(); };
  draw(); load();
  b.oninput = (e) => { if (e.target.id === 'exLabel') st.label = e.target.value; };
  b.onclick = async (e) => {
    const d = e.target.closest('[data-exd]'); if (d) { st.days = d.dataset.exd; draw(); return; }
    const u = e.target.closest('[data-exu]'); if (u) { st.uses = u.dataset.exu; draw(); return; }
    if (e.target.closest('[data-excopy]')) { const i = $('#exUrl', b); i.select(); try { await navigator.clipboard.writeText(i.value); } catch (_) { document.execCommand('copy'); } toast('نُسخ الرابط'); return; }
    if (e.target.closest('[data-exmake]')) {
      try {
        const r = await Cloud.rpc('shk_invite_create', { p_token: Cloud.token(), p_label: st.label.trim(), p_expires_at: new Date(Date.now() + (+st.days) * 864e5).toISOString(), p_uses: +st.uses });
        st.made = `${location.origin}${location.pathname}?propose=${r.token}`; st.err = '';
        await Repo.log('invite.create', 'invite', r.id, st.label.trim() || 'جهة خارجية', `صلاحية ${st.days} يومًا`);
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
