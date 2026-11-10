/* =====================================================================
   روابط الاطلاع المؤقتة
   - تُنشئها إدارة الشراكات من «الإعدادات ← روابط الاطلاع»: مدة محددة، وأقسام مختارة، بلا كلمة مرور.
   - من يفتح الرابط يرى المنصة للاطلاع فقط (لا تعديل ولا رفع)، بشكل «القائمة العلوية» دائمًا.
   - الخادم يحفظ بصمة الرابط فقط، ويفتح جلسة «اطلاع» تنتهي مع الرابط؛ وإيقاف الرابط ينهي جلساته فورًا.
   ===================================================================== */
const SHARE_KEY = 'shk_share';
const SHARE_SECTIONS = [
  { k: 'home', l: 'الرئيسية', m: ['home'], on: true },
  { k: 'dashboard', l: 'لوحة الأداء', m: ['dashboard'], on: true },
  { k: 'partnerships', l: 'سجل الشراكات وصفحات الشراكات', m: ['partnerships', 'partnership'], on: true },
  { k: 'partners', l: 'الجهات الشريكة', m: ['partners', 'partner'], on: true },
  { k: 'reports', l: 'التقارير والتقرير التسويقي', m: ['reports', 'reportsMk'], on: true },
  { k: 'stories', l: 'الإنجازات', m: ['stories'], on: true },
  { k: 'gallery', l: 'معرض الأثر', m: ['gallery'], on: true },
  { k: 'media', l: 'مركز الصور', m: ['media'], on: false },
  { k: 'process', l: 'مسار الشراكة', m: ['process'], on: false },
];
const SHARE_EXTRAS = [{ k: 'contacts', l: 'إظهار بيانات التواصل (ضابط الاتصال والبريد والجوال)', on: false }];
const SHARE_DUR = [['1', 'يوم'], ['3', '3 أيام'], ['7', 'أسبوع'], ['30', 'شهر'], ['date', 'حتى تاريخ']];

const shareSaved = () => { try { return JSON.parse(sessionStorage.getItem(SHARE_KEY) || 'null'); } catch (_) { return null; } };
const shareHas = (k) => !!(App.share && (App.share.sections || []).includes(k));
const shareRouteOk = (name) => SHARE_SECTIONS.some((s) => shareHas(s.k) && s.m.includes(name));
const shareFirst = () => { const s = SHARE_SECTIONS.find((x) => shareHas(x.k)); return s ? ({ home: '#/', dashboard: '#/dashboard', partnerships: '#/partnerships', partners: '#/partners', reports: '#/reports', stories: '#/stories', gallery: '#/gallery', media: '#/media', process: '#/process' })[s.k] : '#/'; };
/* صلاحيات جلسة الرابط: قراءة الأقسام المختارة فقط، دون تصدير أو تعديل */
function shareCan(perm) {
  if (perm === 'view.dashboard') return shareHas('dashboard');
  if (perm === 'view.reports') return shareHas('reports');
  if (perm === 'view.register') return shareHas('partnerships');
  if (perm === 'view.partners') return shareHas('partners');
  if (perm === 'view.internal') return true;
  if (perm === 'view.contacts') return shareHas('contacts');
  return false;
}
const shareNavOk = (it) => it.m.some((n) => shareRouteOk(n));

/* شاشة رسالة (رابط منتهٍ أو غير صالح) */
function shareScreen(msg, sub) {
  const b = $('#boot'); if (b) b.remove();
  ['#app', '#shkLogin'].forEach((s) => { const e = $(s); if (e) e.remove(); });
  const logo = (ASSET_IMG['murooj-logo'] || {}).src;
  const d = document.createElement('div'); d.className = 'share-screen';
  d.innerHTML = `<div class="ss-card">${logo ? `<img src="${logo}" alt="">` : ''}<span class="ss-ic">${icon('eye')}</span><h1>${esc(msg)}</h1><p>${esc(sub || 'تواصل مع إدارة الشراكات في مؤسسة مروج الأهلية للحصول على رابط اطلاع جديد.')}</p></div>`;
  document.body.appendChild(d);
}
async function shareEnd(msg) {
  try { sessionStorage.removeItem(SHARE_KEY); sessionStorage.removeItem('shk_auth'); } catch (_) { /* */ }
  try { Cloud.stop(); } catch (_) { /* */ }
  let own = false; try { own = !!localStorage.getItem('shk_auth'); } catch (_) { /* */ }
  if (!own) { try { await Store.wipeLocal(); } catch (_) { /* */ } } // جهاز الضيف: لا تبقى بيانات المنصة بعد انتهاء الاطلاع
  App.share = null; document.documentElement.classList.remove('share-mode');
  shareScreen(msg || 'انتهى الاطلاع', msg ? undefined : 'شكرًا لاطلاعك على منظومة الشراكات.');
}
/* عند الإقلاع: فتح الرابط (?view=...) أو استكمال جلسة الرابط في نفس التبويب. تعيد false إن عُرضت رسالة وتوقف الإقلاع */
async function shareBoot() {
  const q = new URLSearchParams(location.search).get('view');
  const clean = () => history.replaceState(null, '', location.pathname + (location.hash || '#/'));
  if (q) {
    clean(); // لا يبقى الرابط في شريط العنوان
    if (!Cloud.on) { shareScreen('روابط الاطلاع تعمل على المنصة المشتركة فقط'); return false; }
    let r;
    try { r = await Cloud.rpc('shk_share_open', { p_share: q }); } catch (_) { shareScreen('تعذّر فتح رابط الاطلاع', 'تحقق من الاتصال بالإنترنت ثم أعد فتح الرابط.'); return false; }
    if (!r || r.error) { shareScreen({ expired: 'انتهت مدة رابط الاطلاع', revoked: 'أُوقف رابط الاطلاع' }[r && r.error] || 'رابط الاطلاع غير صالح'); return false; }
    try { sessionStorage.setItem(SHARE_KEY, JSON.stringify({ label: r.label || '', sections: r.sections || [], exp: r.expires, tk: r.token })); } catch (_) { /* */ }
  }
  const s = shareSaved(); if (!s) return true;
  if (!s.tk || new Date(s.exp) <= new Date()) { await shareEnd('انتهت مدة رابط الاطلاع'); return false; }
  App.share = s;
  document.documentElement.classList.add('share-mode');
  /* الجلسة من الرابط وحده، ولا تختلط بحساب محفوظ في هذا المتصفح */
  Cloud.token = () => (App.share && App.share.tk) || null;
  authSaved = () => (App.share ? { id: 'viewer', at: nowISO(), tk: App.share.tk, grp: 'viewer' } : null);
  const left = new Date(s.exp) - Date.now(); if (left < 2 ** 31) setTimeout(() => { if (App.share) shareEnd('انتهت مدة رابط الاطلاع'); }, left);
  return true;
}
/* الشريط السفلي في وضع الاطلاع */
function shareShell() {
  if (!App.share) return;
  let bar = $('#shareBar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'shareBar'; bar.className = 'share-bar no-print'; document.body.appendChild(bar); }
  bar.innerHTML = `<span class="sb-ic">${icon('eye')}</span><span><b>وضع الاطلاع فقط</b>${App.share.label ? ` · ${esc(App.share.label)}` : ''}</span><span class="sb-exp">ينتهي ${esc(fmtDT(App.share.exp))}</span><button type="button" class="sb-end" data-shareend>إنهاء</button>`;
  bar.onclick = async (e) => { if (e.target.closest('[data-shareend]') && await confirmDlg('إنهاء الاطلاع وإغلاق المنصة في هذا التبويب؟', { ok: 'إنهاء' })) shareEnd(); };
}

/* ===== الإعدادات ← روابط الاطلاع ===== */
function shareLink(tk) { return `${location.origin}${location.pathname}?view=${tk}`; }
function setShareTab(b) {
  if (!Cloud.on) { b.innerHTML = `<div class="panel"><div class="panel-b">${emptyHTML({ ic: 'eye', title: 'روابط الاطلاع تعمل على المنصة المشتركة', text: 'افتح المنصة من رابطها على الإنترنت وسجّل الدخول بحساب إدارة الشراكات لإنشاء روابط الاطلاع.' })}</div></div>`; return; }
  const st = { dur: '7', date: '', label: '', secs: new Set([...SHARE_SECTIONS, ...SHARE_EXTRAS].filter((s) => s.on).map((s) => s.k)), made: null, list: null, err: '' };
  const expiry = () => { if (st.dur === 'date') { if (!st.date) return null; const d = new Date(st.date + 'T23:59:59'); return d > new Date() ? d : null; } return new Date(Date.now() + (+st.dur) * 864e5); };
  const draw = () => {
    const ex = expiry();
    b.innerHTML = `<div class="panel sh-new"><div class="panel-h"><h3>${icon('eye')} رابط اطلاع جديد</h3><span class="sub">بلا كلمة مرور · للاطلاع فقط · بشكل القائمة العلوية</span></div><div class="panel-b">
      <div class="field"><label for="shLabel">اسم الرابط (لمن سيُرسل)</label><input class="in" id="shLabel" maxlength="120" placeholder="مثال: وفد مؤسسة …، أو عرض مجلس الإدارة" value="${esc(st.label)}"></div>
      <div class="field"><label>المدة</label><div class="sh-chips">${SHARE_DUR.map(([k, l]) => `<button type="button" class="ff-chip ${st.dur === k ? 'on' : ''}" data-shdur="${k}">${l}</button>`).join('')}${st.dur === 'date' ? `<input class="in" type="date" id="shDate" min="${isoDate(new Date(Date.now() + 864e5))}" max="${isoDate(new Date(Date.now() + 90 * 864e5))}" value="${esc(st.date)}">` : ''}</div>
        <span class="hint">${ex ? `ينتهي الرابط ${esc(fmtDT(ex.toISOString()))} — أقصى مدة 90 يومًا` : 'اختر تاريخ الانتهاء'}</span></div>
      <div class="field"><label>الأقسام التي يراها</label><div class="sh-secs">${SHARE_SECTIONS.map((s) => `<label class="check"><input type="checkbox" data-shsec="${s.k}" ${st.secs.has(s.k) ? 'checked' : ''}><span>${esc(s.l)}</span></label>`).join('')}</div>
        <div class="sh-secs ex">${SHARE_EXTRAS.map((s) => `<label class="check"><input type="checkbox" data-shsec="${s.k}" ${st.secs.has(s.k) ? 'checked' : ''}><span>${esc(s.l)}</span></label>`).join('')}</div></div>
      ${st.err ? `<div class="note warn">${icon('alert')}<span>${esc(st.err)}</span></div>` : ''}
      <button type="button" class="btn primary" data-shmake ${ex && SHARE_SECTIONS.some((s) => st.secs.has(s.k)) ? '' : 'disabled'}>${icon('plus')} إنشاء الرابط</button>
      ${st.made ? `<div class="sh-made"><b>${icon('check')} الرابط جاهز — انسخه الآن، فلا يُعرض مرة أخرى</b><div class="sh-url"><input class="in" readonly value="${esc(st.made)}" id="shUrl"><button type="button" class="btn" data-shcopy>${icon('copy')} نسخ</button></div><small>من يفتحه يرى الأقسام المختارة فقط دون أي تعديل، حتى انتهاء المدة أو إيقافه من القائمة أدناه.</small></div>` : ''}
    </div></div>
    <div class="panel"><div class="panel-h"><h3>الروابط المُنشأة</h3><span class="sub">${st.list ? st.list.length : '…'}</span></div><div class="panel-b">${shareListHTML(st.list)}</div></div>`;
  };
  const load = async () => { try { st.list = await Cloud.rpc('shk_share_list', { p_token: Cloud.token() }); } catch (e) { st.list = []; st.err = e.code === 'forbidden' ? 'إنشاء روابط الاطلاع متاح لإدارة الشراكات ومدير النظام.' : (/shk_share/.test(e.message || '') || e.status === 404 ? 'لم تُفعَّل روابط الاطلاع على الخادم بعد — يلزم تشغيل ملف supabase/share_links.sql مرة واحدة.' : 'تعذّر تحميل الروابط.'); } draw(); };
  draw(); load();
  b.oninput = (e) => { if (e.target.id === 'shLabel') st.label = e.target.value; if (e.target.id === 'shDate') { st.date = e.target.value; draw(); } };
  b.onchange = (e) => { const k = e.target.dataset.shsec; if (k) { e.target.checked ? st.secs.add(k) : st.secs.delete(k); draw(); } };
  b.onclick = async (e) => {
    const d = e.target.closest('[data-shdur]'); if (d) { st.dur = d.dataset.shdur; draw(); return; }
    if (e.target.closest('[data-shcopy]')) { const i = $('#shUrl', b); i.select(); try { await navigator.clipboard.writeText(i.value); } catch (_) { document.execCommand('copy'); } toast('نُسخ الرابط'); return; }
    if (e.target.closest('[data-shmake]')) {
      const ex = expiry(); if (!ex) return;
      const secs = [...SHARE_SECTIONS, ...SHARE_EXTRAS].map((s) => s.k).filter((k) => st.secs.has(k));
      try {
        const r = await Cloud.rpc('shk_share_create', { p_token: Cloud.token(), p_label: st.label.trim(), p_sections: secs, p_expires_at: ex.toISOString() });
        st.made = shareLink(r.token); st.err = '';
        await Repo.log('share.create', 'share', r.id, st.label.trim() || 'رابط اطلاع', `حتى ${fmtDT(ex.toISOString())} · ${secs.length} أقسام`);
      } catch (err) { st.err = { forbidden: 'إنشاء روابط الاطلاع متاح لإدارة الشراكات ومدير النظام.', bad_expiry: 'مدة الرابط غير صحيحة (أقصى 90 يومًا).' }[err.code] || 'تعذّر إنشاء الرابط.'; }
      await load(); return;
    }
    const rv = e.target.closest('[data-shrevoke]');
    if (rv && await confirmDlg('إيقاف هذا الرابط؟ لن يعمل بعد الآن، وتُغلق جلسات من يتصفح به.', { ok: 'إيقاف الرابط', danger: true })) {
      try { await Cloud.rpc('shk_share_revoke', { p_token: Cloud.token(), p_id: rv.dataset.shrevoke }); await Repo.log('share.revoke', 'share', rv.dataset.shrevoke, 'رابط اطلاع', 'أُوقف'); toast('أُوقف الرابط'); } catch (_) { toast('تعذّر إيقاف الرابط', 'err'); }
      await load();
    }
  };
}
function shareListHTML(list) {
  if (!list) return '<p class="muted small">جارٍ التحميل…</p>';
  if (!list.length) return '<p class="muted small">لم يُنشأ أي رابط بعد.</p>';
  const lab = (k) => ([...SHARE_SECTIONS, ...SHARE_EXTRAS].find((s) => s.k === k) || {}).l || k;
  return `<div class="tbl-wrap"><table class="tbl sh-tbl"><thead><tr><th>الرابط</th><th>الأقسام</th><th>ينتهي</th><th>الفتح</th><th>الحالة</th><th></th></tr></thead><tbody>${list.map((x) => {
    const live = !x.revoked && new Date(x.expires) > new Date();
    return `<tr class="${live ? '' : 'off'}"><td><b>${esc(x.label || 'رابط اطلاع')}</b><small class="muted xs" style="display:block">${esc(fmtDT(x.at))}</small></td>
      <td><div class="sh-tags">${(x.sections || []).map((k) => `<em>${esc(lab(k).split(' ')[0] === 'إظهار' ? 'بيانات التواصل' : lab(k))}</em>`).join('')}</div></td>
      <td class="small">${esc(fmtDT(x.expires))}</td><td class="small">${x.opens ? `${nf(x.opens)} مرة${x.last ? `<small class="muted xs" style="display:block">آخرها ${esc(fmtDT(x.last))}</small>` : ''}` : '—'}</td>
      <td>${x.revoked ? '<span class="chip">موقوف</span>' : live ? '<span class="chip ok">سارٍ</span>' : '<span class="chip">منتهٍ</span>'}</td>
      <td>${live ? `<button type="button" class="btn sm ghost" data-shrevoke="${esc(x.id)}">${icon('x')} إيقاف</button>` : ''}</td></tr>`;
  }).join('')}</tbody></table></div><p class="xs muted" style="margin-top:8px">لا يُحفظ الرابط نفسه على الخادم؛ لإرساله مرة أخرى أنشئ رابطًا جديدًا.</p>`;
}
