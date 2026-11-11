/* =====================================================================
   بوابة الشريك: رابط خاص لكل شراكة (?portal=…) تفتحه الجهة الشريكة بلا حساب.
   ترى: شراكتها ومدتها، ومجالات التعاون، والمخرجات المشتركة، والمواعيد القادمة، وما أرسلته من قبل وردّ الإدارة عليه.
   ترسل: تقرير إنجاز (لمخرج محدد) أو صورًا ميدانية أو رسالة — مع مرفقات — فتصل بإشعار وتُضاف لملفات الشراكة.
   لا ترى الجهة أي بيانات داخلية. الخادم يتحقق من كل شيء (supabase/partner_portal.sql).
   ===================================================================== */
const PORTAL_KINDS = { report: ['تقرير إنجاز', 'file'], photos: ['صور ميدانية', 'image'], message: ['رسالة', 'msg'] };
const portalLines = (t) => String(t || '').split(/\n+|(?=\s\d+[.)-]\s)/).map((x) => x.replace(/^\s*(\d+[.)-]|[-•●▪])\s*/, '').trim()).filter((x) => x.length > 2);

async function portalBoot() {
  const key = new URLSearchParams(location.search).get('portal');
  if (!key) return true;
  if (!Cloud.on) { extMsg('الرابط يعمل على المنصة المشتركة فقط'); return false; }
  await portalPage(key);
  return false;
}
async function portalPage(key, opts = {}) {
  let r; try { r = opts.view ? opts.view() : await Cloud.rpc('shk_portal_view', { p_key: key }); } catch (_) { extMsg('تعذّر فتح البوابة', 'تحقق من الاتصال بالإنترنت ثم أعد المحاولة.'); return; }
  if (!r || r.error) { extMsg({ expired: 'انتهت صلاحية رابط البوابة', revoked: 'أُوقف رابط البوابة' }[r && r.error] || 'رابط البوابة غير صالح', 'تواصلوا مع إدارة الشراكات في مؤسسة مروج الأهلية للحصول على رابط جديد.'); return; }
  const p = r.p || {}, fmt = (t) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(t)); } catch (_) { return String(t || '').slice(0, 10); } };
  const s0 = parseDate(p.startDate), e0 = parseDate(p.endDate), now = today();
  const pct = s0 && e0 ? Math.max(0, Math.min(100, Math.round((now - s0) / Math.max(1, e0 - s0) * 100))) : null;
  const left = e0 ? daysBetween(now, e0) : null;
  const status = p.stage !== 'signed' ? ['قيد الإعداد', 'prep'] : left !== null && left < 0 ? ['منتهية', 'ended'] : left !== null && left <= 90 ? ['تنتهي قريبًا', 'soon'] : ['سارية', 'active'];
  const outs = portalLines(typeof p.outputs === 'string' ? p.outputs : (p.outputs || []).map((x) => x.t || x.text || x).join('\n'));
  const areas = portalLines(typeof p.cooperationAreas === 'string' ? p.cooperationAreas : '');
  const ev = [...(p.meetings || []).map((m) => ({ d: m.date, t: m.title, sub: [m.time, m.place].filter(Boolean).join(' · ') })),
    ...(e0 && left > 0 && left <= 120 ? [{ d: p.endDate, t: 'انتهاء مدة الشراكة', sub: 'نتواصل معكم قبلها لتقييم التجديد' }] : [])].sort((a, b) => String(a.d).localeCompare(String(b.d)));
  const reps = (p.reports || []).slice().reverse();
  const orgName = (r.org && r.org.name) || 'مؤسسة مروج الأهلية';
  const d = extShell(`<div class="pt-hero"><div class="pt-hero-in">
      <div class="pt-logo">${r.partner && r.partner.logo ? '<img id="ptLogo" alt="">' : `<span>${esc((r.partner && r.partner.name || 'ج').trim().charAt(0))}</span>`}</div>
      <div class="pt-ht"><small>بوابة الشريك · ${esc(orgName)}</small><h1>${esc((r.partner && r.partner.name) || p.title || '')}</h1>
        <p>${p.title && r.partner && p.title !== r.partner.name ? esc(p.title) + ' · ' : ''}<span dir="ltr">${esc(p.code || '')}</span>${p.classification ? ' · ' + esc(p.classification) : ''}</p></div>
      <span class="pt-st st-${status[1]}">${status[0]}</span></div>
      ${pct !== null ? `<div class="pt-term"><div class="pt-term-l"><span>${fmt(p.startDate)}</span><b>${left > 0 ? `متبقٍ ${left} يومًا` : left === 0 ? 'تنتهي اليوم' : 'انتهت المدة'}</b><span>${fmt(p.endDate)}</span></div><div class="pt-bar"><i style="width:${pct}%"></i></div></div>` : ''}</div>
    <div class="pt-grid">
      ${outs.length ? `<section class="ext-card pt-card"><h2>${icon('flag')} المخرجات المشتركة</h2><ol class="pt-outs">${outs.map((o) => `<li>${esc(o)}</li>`).join('')}</ol></section>` : ''}
      <section class="ext-card pt-card"><h2>${icon('calendar')} المواعيد القادمة</h2>${ev.length ? `<ul class="pt-ev">${ev.map((x) => `<li><span class="pt-evd"><b>${parseDate(x.d) ? parseDate(x.d).getDate() : ''}</b><small>${parseDate(x.d) ? MONTHS[parseDate(x.d).getMonth()] : ''}</small></span><div><b>${esc(x.t || '')}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</div></li>`).join('')}</ul>` : '<p class="ext-faint">لا مواعيد قادمة مسجّلة حاليًا.</p>'}
      ${areas.length ? `<h2 style="margin-top:22px">${icon('layers')} مجالات التعاون</h2><ul class="pt-areas">${areas.slice(0, 8).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}</section>
    </div>
    <section class="ext-card pt-send" id="ptSend"><h2>${icon('send')} أرسلوا إلى إدارة الشراكات</h2><p class="ext-faint">تقارير الإنجاز والصور الميدانية تُضاف مباشرة إلى ملف الشراكة لدينا، ويصلنا إشعار بها.</p>
      <div class="pt-kinds">${Object.entries(PORTAL_KINDS).map(([k, [l, ic]], i) => `<button type="button" class="${i ? '' : 'on'}" data-pk="${k}">${icon(ic)}<span>${l}</span></button>`).join('')}</div>
      <div class="ext-form pt-form">
        ${outs.length ? `<label class="ext-f full" data-only="report"><span>المخرج المرتبط</span><select id="ptOut"><option value="">عام — لا يرتبط بمخرج محدد</option>${outs.map((o) => `<option>${esc(o.slice(0, 120))}</option>`).join('')}</select></label>` : ''}
        <label class="ext-f full"><span id="ptTxtL">ما الذي أُنجز؟</span><textarea id="ptTxt" rows="5" placeholder="اكتبوا ملخص الإنجاز: ما نُفّذ، والأرقام، والموقع، والتاريخ…"></textarea><em class="err"></em></label>
        <label class="ext-f"><span>اسم المرسل</span><input id="ptBy" placeholder="الاسم والمنصب"></label>
        ${extFilesHTML('ptFiles')}
        <div class="ext-actions"><button type="button" class="btn primary" id="ptGo">${icon('send')} إرسال</button></div></div></section>
    ${reps.length ? `<section class="ext-card"><h2>${icon('history')} ما أرسلتموه</h2><ul class="pt-reps">${reps.map((x) => `<li><div class="pt-rh"><span class="pt-k">${icon((PORTAL_KINDS[x.kind] || PORTAL_KINDS.report)[1])} ${(PORTAL_KINDS[x.kind] || PORTAL_KINDS.report)[0]}</span><small>${fmt(x.at)}${x.by ? ' · ' + esc(x.by) : ''}</small><span class="pt-seen ${x.seen ? 'y' : ''}">${x.seen ? 'اطّلعت عليه الإدارة' : 'وصل — بانتظار الاطلاع'}</span></div>
      ${x.output ? `<div class="pt-ro">${icon('flag')} ${esc(x.output)}</div>` : ''}${x.text ? `<p>${esc(x.text).replace(/\n/g, '<br>')}</p>` : ''}${(x.files || []).length ? `<div class="pt-fl">${x.files.map((f) => `<span>${icon('file')} ${esc(f.name || '')}</span>`).join('')}</div>` : ''}
      ${x.reply ? `<div class="pt-reply"><b>ردّ إدارة الشراكات</b><p>${esc(x.reply).replace(/\n/g, '<br>')}</p></div>` : ''}</li>`).join('')}</ul></section>` : ''}`);
  d.classList.add('pt-page');
  if (r.partner && r.partner.logo && !opts.view) { Cloud.rpc('shk_portal_file', { p_key: key, p_id: r.partner.logo }).then((f) => { if (f && f.data) { const m = f.meta || {}; const im = $('#ptLogo', d); if (im) im.src = `data:${m.type || 'image/png'};base64,${f.data}`; } }).catch(() => {}); }
  else if (opts.logo) { const im = $('#ptLogo', d); if (im) im.src = opts.logo; }
  let kind = 'report';
  const getFiles = extFilesBind($('#ptFiles', d));
  const setKind = (k) => {
    kind = k; $$('[data-pk]', d).forEach((b) => b.classList.toggle('on', b.dataset.pk === k));
    $$('[data-only]', d).forEach((x) => { x.hidden = x.dataset.only !== k; });
    $('#ptTxtL', d).textContent = { report: 'ما الذي أُنجز؟', photos: 'وصف الصور (اختياري)', message: 'الرسالة' }[k];
    $('#ptTxt', d).placeholder = { report: 'اكتبوا ملخص الإنجاز: ما نُفّذ، والأرقام، والموقع، والتاريخ…', photos: 'مثال: زراعة 500 شتلة في … بتاريخ …', message: 'اكتبوا رسالتكم لإدارة الشراكات…' }[k];
  };
  d.addEventListener('click', (e) => { const b = e.target.closest('[data-pk]'); if (b) setKind(b.dataset.pk); });
  const go = $('#ptGo', d), ta = $('#ptTxt', d);
  go.onclick = async () => {
    const text = ta.value.trim(), fl = getFiles(), f = ta.closest('.ext-f');
    f.classList.remove('bad'); f.querySelector('.err').textContent = '';
    if (!text && !fl.length) { f.classList.add('bad'); f.querySelector('.err').textContent = kind === 'photos' ? 'أرفقوا صورة واحدة على الأقل.' : 'اكتبوا التفاصيل أو أرفقوا ملفًا.'; return; }
    go.disabled = true; go.textContent = 'جارٍ الإرسال…';
    let res; try {
      if (opts.submit) res = await opts.submit({ kind, text, by: $('#ptBy', d).value.trim(), output: ($('#ptOut', d) || {}).value || '', files: fl });
      else {
        const ids = await extUpload(key, fl, (n, t) => { go.textContent = `جارٍ رفع الملفات ${n} / ${t}…`; }, { rpc: 'shk_portal_file_put', prefix: 'f-ptl-', max: 'بلغتم الحد الأقصى للملفات في هذا الرابط.' });
        res = await Cloud.rpc('shk_portal_submit', { p_key: key, p_kind: kind, p_text: text, p_by: $('#ptBy', d).value.trim(), p_output: ($('#ptOut', d) || {}).value || '', p_files: ids });
      }
    } catch (e) { res = { error: 'net', msg: e && e.message }; }
    if (!res || res.error) { go.disabled = false; go.innerHTML = `${icon('send')} إرسال`; alert((res && res.msg) || 'تعذّر الإرسال، حاولوا مرة أخرى.'); return; }
    portalPage(key, opts).then(() => { const t = document.querySelector('.pt-reps'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  };
}

/* ===== داخل المنصة: قسم «بوابة الشريك» في صفحة الشراكة ===== */
function portalSectionHTML(p) {
  const reps = (p.partnerReports || []).slice().reverse(), unseen = reps.filter((x) => !x.seen).length;
  return `<section class="dsec" id="portal"><h2>بوابة الشريك ${unseen ? `<span class="chip gold plain">${unseen} جديد</span>` : ''} <span class="src">رابط خاص ترفع منه الجهة تقاريرها وصورها</span></h2>
    <div class="ptl-box"><div class="ptl-make">${Cloud.on ? `<span>رابط جديد صالح لمدة</span><div class="seg">${[['90', '3 أشهر'], ['180', '6 أشهر'], ['365', 'سنة'], ['end', 'حتى نهاية الشراكة']].map(([k, l], i) => `<button type="button" class="${i === 2 ? 'on' : ''}" data-ptdur="${k}">${l}</button>`).join('')}</div><button class="btn primary sm" type="button" data-ptmake>${icon('link')} إنشاء رابط البوابة</button>`
      : `<span class="muted small">${icon('info')} روابط البوابة تعمل على المنصة المشتركة (عند فتح المنصة من رابطها على الإنترنت).</span>`}</div>
      <div id="ptlNew"></div><div id="ptlList" class="ptl-list"></div></div>
    ${reps.length ? `<div class="ptl-reps">${reps.map((x) => `<div class="ptl-rep ${x.seen ? '' : 'new'}" data-rep="${esc(x.id)}"><div class="pt-rh"><span class="pt-k">${icon((PORTAL_KINDS[x.kind] || PORTAL_KINDS.report)[1])} ${(PORTAL_KINDS[x.kind] || PORTAL_KINDS.report)[0]}</span><small>${fmtDT(x.at)}${x.by ? ' · ' + esc(x.by) : ''}</small>${x.seen ? '<span class="chip ok plain">تمت المراجعة</span>' : '<span class="chip gold plain">جديد</span>'}</div>
      ${x.output ? `<div class="pt-ro">${icon('flag')} ${esc(x.output)}</div>` : ''}${x.text ? `<p>${esc(x.text).replace(/\n/g, '<br>')}</p>` : ''}
      ${(x.files || []).length ? `<div class="pt-fl">${x.files.map((f) => `<button type="button" class="pt-flb" data-dl="${esc(f.fileId)}" data-name="${esc(f.name || '')}">${icon(/^image\//.test(f.type || '') ? 'image' : 'file')} ${esc(f.name || '')}</button>`).join('')}</div>` : ''}
      ${x.reply ? `<div class="pt-reply"><b>ردّكم</b><p>${esc(x.reply)}</p></div>` : ''}
      ${!x.seen ? `<div class="ptl-act"><textarea class="in" rows="2" data-reply="${esc(x.id)}" placeholder="ردّ يظهر للشريك في البوابة (اختياري)"></textarea><button class="btn sm primary" type="button" data-seen="${esc(x.id)}">${icon('check')} تمت المراجعة</button></div>` : ''}</div>`).join('')}</div>` : '<p class="muted small" style="margin-top:12px">لم يُرسل الشريك شيئًا بعد.</p>'}</section>`;
}
function portalBind(el, p) {
  const box = $('#portal', el); if (!box) return;
  const list = async () => {
    const L_ = $('#ptlList', box); if (!L_ || !Cloud.on) return;
    let r = []; try { r = await Cloud.rpc('shk_portal_list', { p_token: Cloud.token(), p_pid: p.id }) || []; } catch (_) { L_.innerHTML = '<p class="muted small">تعذّر جلب الروابط — تأكد من تشغيل ملف partner_portal.sql في Supabase.</p>'; return; }
    L_.innerHTML = r.length ? r.map((x) => { const ex = new Date(x.expires) < new Date(); return `<div class="ptl-it ${x.revoked || ex ? 'off' : ''}"><span>${icon('link')} ${esc(x.label || 'رابط البوابة')}</span><small>${x.revoked ? 'موقوف' : ex ? 'منتهٍ' : `صالح حتى ${fmtDate(String(x.expires).slice(0, 10))}`} · فُتح ${x.opens || 0} مرة${x.last ? ` · آخرها ${relDays(x.last)}` : ''}</small>${!x.revoked && !ex ? `<button class="btn sm ghost" type="button" data-ptrev="${x.id}">إيقاف</button>` : ''}</div>`; }).join('') : '';
  };
  list();
  let dur = '365';
  box.addEventListener('click', async (e) => {
    const dd = e.target.closest('[data-ptdur]'); if (dd) { dur = dd.dataset.ptdur; $$('[data-ptdur]', box).forEach((b) => b.classList.toggle('on', b === dd)); return; }
    if (e.target.closest('[data-ptmake]')) {
      const ex = dur === 'end' ? (parseDate(p.endDate) && parseDate(p.endDate) > today() ? new Date(parseDate(p.endDate).getTime() + 864e5 * 30) : new Date(Date.now() + 365 * 864e5)) : new Date(Date.now() + (+dur) * 864e5);
      try {
        const r = await Cloud.rpc('shk_portal_create', { p_token: Cloud.token(), p_pid: p.id, p_label: `بوابة ${partnerName(p)}`, p_expires_at: ex.toISOString() });
        const url = `${location.origin}${location.pathname}?portal=${r.token}`;
        $('#ptlNew', box).innerHTML = `<div class="ptl-url"><b>${icon('check')} رابط البوابة — يظهر مرة واحدة فقط، انسخه الآن وأرسله لضابط الاتصال لدى الشريك:</b><div class="ext-link"><input readonly value="${esc(url)}" id="ptlUrl"><button class="btn" type="button" data-ptcopy>${icon('copy')} نسخ</button></div></div>`;
        list();
      } catch (err) { toast(err && err.code === 'P0001' || /forbidden/.test(err && err.message) ? 'لا تملك صلاحية إنشاء رابط البوابة' : 'تعذّر إنشاء الرابط — تأكد من تشغيل ملف partner_portal.sql في Supabase', 'err'); }
      return;
    }
    if (e.target.closest('[data-ptcopy]')) { const i = $('#ptlUrl', box); i.select(); try { await navigator.clipboard.writeText(i.value); } catch (_) { document.execCommand('copy'); } toast('نُسخ الرابط'); return; }
    const rv = e.target.closest('[data-ptrev]'); if (rv) { if (!(await confirmDlg('إيقاف هذا الرابط؟ لن يتمكن الشريك من فتح البوابة به.', { title: 'إيقاف رابط البوابة', ok: 'إيقاف', danger: true }))) return; await Cloud.rpc('shk_portal_revoke', { p_token: Cloud.token(), p_id: rv.dataset.ptrev }); toast('أُوقف الرابط'); list(); return; }
    const sn = e.target.closest('[data-seen]'); if (sn) {
      const id = sn.dataset.seen, rep = (p.partnerReports || []).find((x) => x.id === id); if (!rep) return;
      const ta = $(`[data-reply="${id}"]`, box); rep.seen = true; rep.seenAt = nowISO(); rep.seenBy = Session.userName(); if (ta && ta.value.trim()) rep.reply = ta.value.trim();
      await Repo.save('partnerships', p); await Repo.log('portal.review', 'partnership', p.id, p.code, (PORTAL_KINDS[rep.kind] || PORTAL_KINDS.report)[0]); toast(rep.reply ? 'حُفظ الرد وسيظهر للشريك في البوابة' : 'عُلّم كمراجَع'); route();
    }
  });
}
