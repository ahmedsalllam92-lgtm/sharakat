/* =====================================================================
   مساعد الشراكات
   — يفهم الأسئلة بأي صيغة (فصحى أو عامية) عن الشراكات والجهات والمواعيد والمقترحات والمهام، ويجيب من بيانات المنصة.
   — ينفّذ: يفتح الصفحات، يضيف الاجتماعات، يصدّر التقويم، يكتب المسودات (خطاب تجديد، تقرير ربع سنوي، تهنئة، شكر، دعوة اجتماع).
   — يفهم أكثر من طلب في رسالة واحدة ويحوّلها لمهام تُنفَّذ أمامك خطوة بخطوة في لوحة «مهام المساعد».
   — يقدّم المنصة بنفسه (عرض موجَّه بين الصفحات)، أو يشغّل الجولة التعريفية.
   — أي سؤال مفتوح: يُحال إلى Claude عبر دالة Supabase «assistant» (إن فُعّلت)، بسياق من البيانات المرئية لهذا الحساب فقط.
   ===================================================================== */
const AS = { open: false, big: false, msgs: [], busy: false, tasks: [], tour: null, aiHist: [] };
const asN = (s) => String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[؟?!،,.:؛"'«»()]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const AS_STOP = new Set(['ال', 'في', 'من', 'على', 'عن', 'الى', 'الي', 'مع', 'هل', 'كم', 'ما', 'ماذا', 'وش', 'ايش', 'اي', 'لو', 'سمحت', 'ممكن', 'عايز', 'ابغي', 'ابي', 'اريد', 'عاوز', 'يا', 'هو', 'هي', 'دي', 'ده', 'هذا', 'هذه', 'الشراكه', 'الشراكات', 'شراكه', 'شراكات', 'جهه', 'الجهه', 'مع', 'لي', 'لنا', 'كل', 'و']);
const asTok = (s) => asN(s).split(' ').map((w) => w.replace(/^(وال|بال|لل|فال|كال|ال|و)(?=..)/, '')).filter((w) => w.length >= 2 && !AS_STOP.has(w));
const asHas = (q, ...ws) => ws.some((w) => q.includes(asN(w)));
const asPlural = (n, w) => plural(n, `${w.one}`, `${w.two}`, `${w.few}`, `${w.many}`);
const AS_P = { one: 'شراكة واحدة', two: 'شراكتان', few: 'شراكات', many: 'شراكة' };

/* ===== الواجهة ===== */
function asMount() {
  if ($('#asFab') || !(D.settings && D.settings.assistantOn) || App.share && !shareHas('home')) return; // مخفي حتى يُفعَّل من الإعدادات العامة
  const fab = document.createElement('button'); fab.id = 'asFab'; fab.type = 'button'; fab.setAttribute('aria-label', 'مساعد الشراكات');
  fab.innerHTML = `<span class="as-orb"><i></i><i></i><i></i></span><span class="as-fab-t">مساعد الشراكات</span>`;
  document.body.appendChild(fab);
  const win = document.createElement('section'); win.id = 'asWin'; win.setAttribute('role', 'dialog'); win.setAttribute('aria-label', 'مساعد الشراكات'); win.hidden = true;
  win.innerHTML = `<header class="as-h"><span class="as-orb sm"><i></i><i></i><i></i></span><div class="as-ht"><b>مساعد الشراكات</b><small id="asSub">اسأل أو اطلب أكثر من أمر في رسالة واحدة</small></div>
      <button type="button" class="as-hb" data-as="big" title="تكبير">${icon('expand')}</button><button type="button" class="as-hb" data-as="clear" title="محادثة جديدة">${icon('history')}</button><button type="button" class="as-hb" data-as="close" title="إغلاق">${icon('x')}</button></header>
    <div class="as-body" id="asBody"></div>
    <div class="as-tasks" id="asTasks" hidden></div>
    <form class="as-in" id="asForm"><textarea id="asTxt" rows="1" placeholder="مثال: كم شراكة تنتهي خلال 3 أشهر؟ واكتب خطاب تجديد لأقربها"></textarea>
      ${'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? `<button type="button" class="as-mic" data-as="mic" title="تحدّث">${icon('msg')}</button>` : ''}
      <button type="submit" class="as-send" title="إرسال">${icon('send')}</button></form>`;
  document.body.appendChild(win);
  fab.onclick = () => asToggle();
  win.addEventListener('click', asClick);
  $('#asForm').onsubmit = (e) => { e.preventDefault(); const t = $('#asTxt'); const v = t.value.trim(); if (!v) return; t.value = ''; asAutoSize(); asAsk(v); };
  $('#asTxt').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#asForm').requestSubmit(); } });
  $('#asTxt').addEventListener('input', asAutoSize);
  addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'j' && $('#asFab')) { e.preventDefault(); asToggle(true); } });
}
function asAutoSize() { const t = $('#asTxt'); if (!t) return; t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight) + 'px'; }
function asToggle(force) {
  const win = $('#asWin'); if (!win) return;
  AS.open = force !== undefined ? force : !AS.open; win.hidden = !AS.open; $('#asFab').classList.toggle('on', AS.open);
  if (AS.open) { if (!AS.msgs.length) asWelcome(); setTimeout(() => $('#asTxt').focus(), 60); }
}
function asWelcome() {
  asBot(`<div class="as-hello"><b>أهلًا بك 👋</b><p>أنا مساعد الشراكات. أجيب من بيانات المنصة، وأنفّذ أكثر من طلب في رسالة واحدة، وأكتب الخطابات والتقارير، وأقدّم لك المنصة.</p></div>
    <div class="as-chips">${['ما وضع الشراكات الآن؟', 'الشراكات اللي تنتهي خلال 3 أشهر', 'مواعيد هذا الشهر', 'مهامي', 'اكتب خطاب تجديد لأقرب شراكة تنتهي', 'قدّم لي المنصة', 'افتح الخريطة'].map((c) => `<button type="button" class="as-chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>`, { raw: true });
}
function asClick(e) {
  const a = e.target.closest('[data-as]');
  if (a) {
    const k = a.dataset.as;
    if (k === 'close') asToggle(false);
    if (k === 'big') { AS.big = !AS.big; $('#asWin').classList.toggle('big', AS.big); }
    if (k === 'clear') { AS.msgs = []; AS.aiHist = []; $('#asBody').innerHTML = ''; asWelcome(); }
    if (k === 'mic') asMic(a);
    return;
  }
  const q = e.target.closest('[data-q]'); if (q) { asAsk(q.dataset.q); return; }
  const go = e.target.closest('[data-go]'); if (go) { e.preventDefault(); location.hash = go.dataset.go; if (!AS.big && innerWidth < 900) asToggle(false); return; }
  const dc = e.target.closest('[data-doc]'); if (dc) { const d = AS.docs && AS.docs[dc.dataset.doc]; if (d) asDocOpen(d); return; }
  const act = e.target.closest('[data-act]'); if (act && AS.acts && AS.acts[act.dataset.act]) { const f = AS.acts[act.dataset.act]; delete AS.acts[act.dataset.act]; act.disabled = true; f(); return; }
  const lk = e.target.closest('.as-msg a[href^="#/"]'); if (lk && innerWidth < 900 && !AS.big) asToggle(false);
}
function asMic(btn) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) return;
  const r = new R(); r.lang = 'ar-SA'; r.interimResults = true; btn.classList.add('rec');
  r.onresult = (e) => { $('#asTxt').value = [...e.results].map((x) => x[0].transcript).join(' '); asAutoSize(); };
  r.onend = () => { btn.classList.remove('rec'); const v = $('#asTxt').value.trim(); if (v) { $('#asTxt').value = ''; asAsk(v); } };
  r.start();
}
function asScroll() { const b = $('#asBody'); if (b) b.scrollTop = b.scrollHeight; }
function asUser(t) { AS.msgs.push({ who: 'u', t }); $('#asBody').insertAdjacentHTML('beforeend', `<div class="as-msg u"><div class="as-bb">${esc(t).replace(/\n/g, '<br>')}</div></div>`); asScroll(); }
function asBot(html, { raw = false } = {}) {
  AS.msgs.push({ who: 'b', t: html });
  $('#asBody').insertAdjacentHTML('beforeend', `<div class="as-msg b"><span class="as-av"><span class="as-orb xs"><i></i><i></i><i></i></span></span><div class="as-bb">${raw ? html : asMd(html)}</div></div>`);
  hydrateFiles($('#asBody')); asScroll();
}
function asTyping(on) {
  const b = $('#asBody'); const t = $('#asTyping', b);
  if (on && !t) { b.insertAdjacentHTML('beforeend', '<div class="as-msg b" id="asTyping"><span class="as-av"><span class="as-orb xs spin"><i></i><i></i><i></i></span></span><div class="as-bb as-dots"><i></i><i></i><i></i></div></div>'); asScroll(); }
  if (!on && t) t.remove();
}
/* Markdown مبسط وآمن: عناوين، نقاط، خط عريض، روابط داخلية، جداول */
function asMd(src) {
  const lines = String(src || '').split('\n'); let out = '', list = null, tbl = [];
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((#\/[^)\s]+|https?:\/\/[^)\s]+)\)/g, (m, t, h) => (h.startsWith('#') ? `<a href="${h}">${t}</a>` : `<a href="${h}" target="_blank" rel="noopener">${t}</a>`));
  const flushT = () => { if (!tbl.length) return; const rows = tbl.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map((r) => r.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim()));
    out += `<div class="as-tw"><table class="as-tbl"><thead><tr>${rows[0].map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; tbl = []; };
  const flushL = () => { if (list) { out += `</${list}>`; list = null; } };
  for (const ln of lines) {
    if (/^\s*\|.*\|\s*$/.test(ln)) { flushL(); tbl.push(ln); continue; } flushT();
    const h = /^\s*(#{1,4})\s+(.*)/.exec(ln); if (h) { flushL(); out += `<h4>${inline(h[2])}</h4>`; continue; }
    const li = /^\s*[-*•]\s+(.*)/.exec(ln), ol = /^\s*\d+[.)]\s+(.*)/.exec(ln);
    if (li || ol) { const tag = li ? 'ul' : 'ol'; if (list !== tag) { flushL(); out += `<${tag}>`; list = tag; } out += `<li>${inline((li || ol)[1])}</li>`; continue; }
    flushL(); out += ln.trim() ? `<p>${inline(ln)}</p>` : '';
  }
  flushL(); flushT(); return out;
}

/* ===== البيانات ===== */
const asPts = () => visiblePartnerships().filter((p) => !p.isDraft && p.stage !== 'cancel');
const asStatusL = { active: 'سارية', soon: 'تنتهي قريبًا', expired: 'منتهية', prep: 'قيد الإعداد', sign: 'بانتظار التوقيع' };
/* كلمات عامة لا تكفي وحدها لتمييز جهة */
const AS_WEAK = new Set(['جمعيه', 'هيئه', 'مؤسسه', 'شركه', 'وزاره', 'مركز', 'وطني', 'وطنيه', 'سعودي', 'سعوديه', 'خيريه', 'عامه', 'عام', 'اداره', 'مديريه', 'جامعه', 'بيئه', 'بيئيه', 'تنميه', 'تطوير', 'منطقه', 'مجموعه', 'صندوق', 'برنامج', 'مبادره', 'اهليه', 'الملك', 'ملك', 'الامير', 'امير', 'المملكه', 'مملكه', 'للتنميه', 'استدامه', 'للاستدامه', 'اثر', 'الشراكات', 'شراكات', 'شراكه', 'طريقه', 'افضل', 'قياس', 'لقياس']);
const AS_WEAKN = new Set([...AS_WEAK].map((w) => asN(w)));
/* الصيغة الأساسية (بلا «ال» وأخواتها) وصيغة بلا حرف جر ملتصق (لحرس ← حرس) */
const asPrim = (w) => (w.length > 4 ? w.replace(/^(وال|بال|لل|فال|كال|ال)/, '') : w.replace(/^ال(?=...)/, ''));
const asStrip = (w) => (w.length > 3 ? w.replace(/^[وبلفك]/, '') : w);
const asWords = (s) => asN(s).split(' ').map(asPrim).filter((w) => w.length >= 3);
function asFindPartner(q) {
  const qn = asN(q), qP = new Set(asWords(q)), qAll = new Set([...qP, ...[...qP].map(asStrip)]);
  let best = null, bs = 0;
  for (const p of asPts()) {
    const pr = partnerById(p.partnerId); const names = [partnerName(p), p.title, p.code, ...(pr && pr.aliases ? [].concat(pr.aliases) : [])].filter(Boolean);
    for (const nm of names) {
      const nn = asN(nm); if (!nn) continue;
      let s = 0;
      if (nn.length > 3 && qn.includes(nn)) s = 100 + nn.length;
      else {
        const w = [...new Set(asWords(nm))]; if (!w.length) continue;
        const hit = (x) => qAll.has(x) || qP.has(asStrip(x));
        const weak = (x) => AS_WEAKN.has(x) || AS_WEAKN.has(asStrip(x));
        const strong = w.filter((x) => !weak(x)), hitS = strong.filter(hit).length, hitW = w.filter((x) => weak(x) && hit(x)).length;
        if (hitS) s = (hitS / Math.max(1, strong.length)) * 60 + hitS * 14 + hitW * 4;
        else if (!strong.length && hitW >= 2) s = 36 + hitW * 4; /* اسم كله كلمات عامة: «صندوق أثر» */
      }
      if (s > bs) { bs = s; best = p; }
    }
  }
  return bs >= 34 ? best : null;
}
function asCard(p) {
  const pr = partnerById(p.partnerId), dl = daysLeft(p), g = pRegion(p);
  return `<a class="as-card" href="#/partnerships/${p.id}">${plateHTML(pr, 44)}<span class="as-ct"><b>${esc(partnerName(p))}</b><small>${esc(p.code || '')}${pSector(p) ? ' · ' + esc(pSector(p)) : ''}${g.r ? ' · ' + esc(g.r) : ''}</small>
    <small>${p.startDate ? fmtDate(p.startDate) : '—'} ← ${p.endDate ? fmtDate(p.endDate) : '—'}${dl !== null && dl >= 0 && p.stage === 'signed' ? ` · متبقٍ ${dl} يومًا` : ''}</small></span>${statusChip(p)}</a>`;
}
const asList = (L_, max = 8) => `<div class="as-cards">${L_.slice(0, max).map(asCard).join('')}</div>${L_.length > max ? `<p class="as-more">و${L_.length - max} غيرها…</p>` : ''}`;
const asGo = (h, t) => `<button type="button" class="as-go" data-go="${h}">${t} ${icon('arrowL')}</button>`;

/* ===== فهم الطلبات ===== */
const AS_PAGES = [
  [['الرئيسيه', 'الصفحه الرئيسيه', 'البدايه'], '#/', 'الرئيسية'], [['لوحه الاداء', 'لوحه المؤشرات', 'الداشبورد', 'المؤشرات', 'الاداء'], '#/dashboard', 'لوحة الأداء'],
  [['السجل', 'سجل الشراكات'], '#/partnerships', 'سجل الشراكات'], [['الجهات الشريكه', 'الجهات', 'الشركاء'], '#/partners', 'الجهات الشريكة'],
  [['التقارير', 'تقرير'], '#/reports', 'التقارير'], [['الخريطه', 'خريطه'], '#/map', 'خريطة الشراكات'], [['التقويم', 'الكالندر', 'تقويم'], '#/calendar', 'تقويم الشراكات'],
  [['المقترحات', 'الطلبات الوارده', 'المقترحات الوارده'], '#/proposals', 'المقترحات الواردة'], [['مهامي', 'المهام'], '#/tasks', 'مهامي'], [['حكايه الشراكه', 'الفيلم', 'العرض التعريفي'], '#/tale', 'حكاية الشراكة'],
  [['الاعدادات'], '#/settings', 'الإعدادات'], [['شارك', 'مقترح جديد'], '#/share/new', 'شارك بمقترح'], [['المعرض', 'معرض الاثر'], '#/gallery', 'معرض الأثر'], [['الانجازات', 'قصص الاثر'], '#/stories', 'الإنجازات'], [['مركز الصور', 'الصور'], '#/media', 'مركز الصور'],
];
/* تقسيم رسالة فيها أكثر من طلب */
function asSplit(t) {
  const parts = String(t).split(/\n+|؛|\s+(?:ثم|وبعدين|وبعد كده|وبعد ذلك|وكمان|وايضا|وأيضًا|وأيضا)\s+|،\s*(?=(?:و?(?:افتح|اكتب|حدد|اضف|أضف|صدر|صدّر|اعرض|اعطني|قدم|قدّم|كم|ما|وش|ايش|هات|اعمل|جهز|جهّز|ابعت)))|\s+و(?=(?:افتح|اكتب|حدد|اضف|أضف|صدّر|صدر|اعرض|قدّم|قدم|هات|اعمل|جهز|جهّز)\s)/).map((x) => x && x.trim()).filter((x) => x && x.length > 1);
  return parts.length ? parts : [t];
}
function asIntent(t) {
  const q = asN(t);
  const days = (() => { const m = /(\d+)\s*(يوم|ايام|اسبوع|اسابيع|شهر|شهور|اشهر)/.exec(q); if (m) { const n = +m[1]; return /اسبوع|اسابيع/.test(m[2]) ? n * 7 : /شهر|شهور|اشهر/.test(m[2]) ? n * 30 : n; } if (/الشهر الجاي|الشهر القادم|شهر/.test(q)) return 30; if (/الاسبوع|اسبوع/.test(q)) return 7; if (/السنه|سنه|العام/.test(q)) return 365; if (/ربع|3 شهور/.test(q)) return 90; return null; })();
  /* كتابة مسودات */
  const DOCS = [['renew', ['تجديد']], ['quarter', ['ربع سنوي', 'ربعي', 'تقرير دوري', 'تقرير متابعه', 'تقرير عن', 'تقرير انجاز', 'تقرير لشراكه', 'تقرير ل']], ['congrats', ['تهنئه', 'نهني', 'مبروك']], ['thanks', ['شكر']], ['invite', ['دعوه', 'دعوة اجتماع']]];
  if (asHas(q, 'اكتب', 'جهز', 'صيغ', 'اصيغ', 'مسوده', 'خطاب', 'رساله', 'تقرير', 'ابعت', 'حضر') && !asHas(q, 'صدر التقويم')) {
    for (const [k, ws] of DOCS) if (ws.some((w) => q.includes(asN(w))) && (asHas(q, 'اكتب', 'جهز', 'صيغ', 'مسوده', 'خطاب', 'رساله', 'حضر') || k === 'quarter')) return { k: 'doc', doc: k, t };
  }
  if (asHas(q, 'جوله', 'قدم لي', 'قدملي', 'قدم المنصه', 'عرفني', 'اشرح المنصه', 'استعراض', 'اعرض المنصه', 'وريني المنصه', 'خدني')) return { k: 'tour', t };
  if (asHas(q, 'اجتماع', 'ميتنج', 'موعد') && asHas(q, 'حدد', 'اضف', 'ضيف', 'احجز', 'سجل', 'رتب', 'اعمل', 'جدول')) return { k: 'meet', t };
  if (asHas(q, 'صدر', 'نزل', 'تصدير') && asHas(q, 'تقويم', 'مواعيد', 'اوتلوك', 'outlook', 'جوجل', 'google')) return { k: 'ics', t, days };
  if (asHas(q, 'افتح', 'روح', 'اذهب', 'وديني', 'ودني', 'انتقل', 'خذني', 'وريني صفحه', 'اعرض صفحه')) { for (const [ws, h, l] of AS_PAGES) if (ws.some((w) => q.includes(asN(w)))) return { k: 'go', h, l }; const p = asFindPartner(t); if (p) return { k: 'go', h: '#/partnerships/' + p.id, l: partnerName(p) }; }
  if (asHas(q, 'مهامي', 'مهام', 'بانتظاري', 'المطلوب مني', 'اللي علي')) return { k: 'tasks' };
  if (asHas(q, 'موعد', 'مواعيد', 'اجتماع', 'اجتماعات', 'جدول', 'تقويم', 'الاسبوع', 'هالاسبوع') && !asHas(q, 'تنتهي', 'انتهاء')) return { k: 'cal', days: days || 30 };
  if (asHas(q, 'تنتهي', 'انتهاء', 'هتخلص', 'تخلص', 'قربت', 'قاربت', 'التجديد', 'تجديد')) return { k: 'expiring', days: days || 90 };
  if (asHas(q, 'مقترح', 'مقترحات', 'طلبات', 'الوارد')) return { k: 'props' };
  const reg = KSA_REGION_NAMES.find((r) => q.includes(asN(r).replace(/^المنطقه /, '')) || q.includes(asN(r)));
  if (reg || asHas(q, 'منطقه', 'مناطق')) return { k: 'region', reg };
  const sec = L('sectors').find((s) => q.includes(asN(s)));
  const dep = L('departments').find((d) => q.includes(asN(d)));
  const own = L('team').find((m) => asTok(m).some((w) => w.length > 2 && q.includes(w)));
  const st = asHas(q, 'ساريه', 'فعاله', 'شغاله', 'قائمه') ? 'active' : asHas(q, 'منتهيه', 'انتهت', 'خلصت') ? 'expired' : asHas(q, 'قيد الاعداد', 'تحت الاعداد', 'جديده') ? 'prep' : null;
  const yr = (/(20\d\d)/.exec(q) || [])[1];
  const p = asFindPartner(t);
  if (p && !sec && !dep) return { k: 'partner', p, t };
  if (sec || dep || own || st || yr || asHas(q, 'كم', 'عدد', 'اجمالي', 'وضع', 'ملخص', 'احصائيات', 'ارقام', 'كام', 'قد ايش')) return { k: 'stats', sec, dep, own, st, yr, q };
  if (asHas(q, 'مرحبا', 'اهلا', 'السلام', 'هلا', 'صباح', 'مساء', 'ازيك', 'كيفك')) return { k: 'hi' };
  if (asHas(q, 'مساعده', 'تقدر تعمل', 'تعرف تعمل', 'وش تقدر', 'ايش تقدر', 'بتعمل ايه')) return { k: 'help' };
  return { k: 'ai', t };
}

/* ===== التنفيذ ===== */
async function asAsk(text) {
  if (!AS.open) asToggle(true);
  asUser(text);
  const parts = asSplit(text).map((t) => ({ t, it: asIntent(t) }));
  const actionable = parts.filter((x) => x.it.k !== 'ai' && x.it.k !== 'hi');
  if (parts.length > 1 && actionable.length > 1) return asRunTasks(parts);
  const it = parts.length === 1 ? parts[0].it : asIntent(text);
  asTyping(true); await sleep(260 + Math.random() * 260);
  try { const r = await asDo(it, text); asTyping(false); if (r) asBot(r, { raw: true }); }
  catch (e) { asTyping(false); asBot(`<p>حدث خطأ أثناء التنفيذ: ${esc(e.message || e)}</p>`, { raw: true }); }
}
async function asRunTasks(parts) {
  const T = parts.map((x) => ({ label: asTaskLabel(x.it, x.t), it: x.it, t: x.t, st: 'wait' }));
  AS.tasks = T; asTasksDraw();
  asBot(`<p>فهمت ${T.length} طلبات — أنفّذها الآن بالترتيب، وتابعها في لوحة «مهام المساعد».</p>`, { raw: true });
  for (const x of T) {
    x.st = 'run'; asTasksDraw(); await sleep(450);
    try { const r = await asDo(x.it, x.t, { inTask: true }); x.st = 'done'; if (r) asBot(`<div class="as-tk-h">${icon('check')} ${esc(x.label)}</div>${r}`, { raw: true }); }
    catch (e) { x.st = 'fail'; x.msg = e.message; }
    asTasksDraw(); await sleep(350);
  }
  setTimeout(() => { if (AS.tasks === T && T.every((x) => x.st !== 'run')) { $('#asTasks').classList.add('done'); } }, 600);
}
function asTaskLabel(it, t) {
  return ({ doc: 'كتابة ' + ({ renew: 'خطاب التجديد', quarter: 'التقرير الربع سنوي', congrats: 'خطاب التهنئة', thanks: 'خطاب الشكر', invite: 'دعوة الاجتماع' }[it.doc] || 'المسودة'), go: 'فتح ' + (it.l || 'الصفحة'), tasks: 'عرض مهامي', cal: 'المواعيد القادمة', expiring: 'الشراكات القريبة من الانتهاء', props: 'ملخص المقترحات', region: 'الشراكات حسب المنطقة', stats: 'الأرقام المطلوبة', partner: 'بيانات ' + (it.p ? partnerName(it.p) : 'الشراكة'), meet: 'إضافة اجتماع', ics: 'تصدير التقويم', tour: 'تقديم المنصة', ai: 'الإجابة عن: ' + t.slice(0, 40) }[it.k]) || t.slice(0, 50);
}
function asTasksDraw() {
  const el = $('#asTasks'); const T = AS.tasks; if (!T.length) { el.hidden = true; return; }
  el.hidden = false; el.classList.remove('done');
  const done = T.filter((x) => x.st === 'done').length;
  el.innerHTML = `<div class="as-tkh"><b>مهام المساعد</b><span>${done} / ${T.length}</span><button type="button" data-asclose title="إخفاء">${icon('x')}</button></div><div class="as-tkb"><i style="width:${(done / T.length) * 100}%"></i></div>
    <ol>${T.map((x) => `<li class="${x.st}"><span class="as-tki">${x.st === 'done' ? icon('check') : x.st === 'fail' ? icon('x') : ''}</span>${esc(x.label)}${x.msg ? `<small>${esc(x.msg)}</small>` : ''}</li>`).join('')}</ol>`;
  $('[data-asclose]', el).onclick = () => { AS.tasks = []; el.hidden = true; };
}
async function asDo(it, text, { inTask = false } = {}) {
  const L_ = asPts();
  switch (it.k) {
    case 'hi': return `<p>أهلًا بك! اسألني عن أي شراكة أو رقم أو موعد، أو اطلب مني أكثر من مهمة في رسالة واحدة.</p>`;
    case 'help': return `<p>أستطيع أن:</p><ul><li>أجيب عن <b>الأرقام والحالات</b>: السارية، المنتهية، القريبة من الانتهاء، حسب القطاع أو الإدارة أو المسؤول أو المنطقة أو السنة.</li><li>أعرض <b>بيانات أي شراكة</b> بذكر اسم الجهة.</li><li>أعرض <b>مهامك</b> و<b>المواعيد</b> و<b>المقترحات</b>.</li><li><b>أكتب</b>: خطاب تجديد، تقريرًا ربع سنويًا، تهنئة بإنجاز، خطاب شكر، دعوة اجتماع.</li><li><b>أنفّذ</b>: أفتح الصفحات، أضيف اجتماعًا للتقويم، أصدّر التقويم لـ Outlook وGoogle.</li><li><b>أقدّم المنصة</b> بعرض موجَّه بين صفحاتها.</li><li>وأي سؤال مفتوح آخر${asAiOn() ? ' — أجيبه بالذكاء الاصطناعي من بيانات المنصة' : ''}.</li></ul><p class="as-hint">جرّب: «كم شراكة سارية في القطاع الحكومي؟ واكتب تقريرًا ربع سنويًا لشراكة حرس الحدود»</p>`;
    case 'go': location.hash = it.h; return `<p>فتحت لك <a href="${it.h}">${esc(it.l)}</a>.</p>`;
    case 'tasks': {
      const T = typeof wfTasks === 'function' ? wfTasks() : [];
      if (!T.length) return '<p>لا توجد مهام بانتظارك الآن 👌</p>';
      return `<p>بانتظارك <b>${T.length}</b> ${T.length > 10 ? 'مهمة' : 'مهام'}:</p><ul class="as-ul">${T.slice(0, 8).map((x) => `<li><a href="${x.href}">${esc(x.name || x.rec.partnerName || x.rec.ref || '')}</a> — ${esc(x.step.t)}${x.since ? ` <small>(${relDays(x.since)})</small>` : ''}</li>`).join('')}</ul>${asGo('#/tasks', 'كل المهام')}`;
    }
    case 'cal': {
      const td = isoDate(today()), to = isoDate(addDays(today(), it.days)); const E = calEvents().filter((e) => e.date >= td && e.date <= to);
      if (!E.length) return `<p>لا مواعيد خلال ${it.days} يومًا القادمة.</p>${asGo('#/calendar', 'التقويم')}`;
      return `<p>المواعيد خلال <b>${it.days}</b> يومًا القادمة (${E.length}):</p><ul class="as-ul">${E.slice(0, 10).map((e) => `<li><b>${fmtDate(e.date)}</b>${e.time ? ' ' + e.time : ''} — <a href="${e.href}">${esc(e.t)}</a></li>`).join('')}</ul>${E.length > 10 ? `<p class="as-more">و${E.length - 10} غيرها…</p>` : ''}<div class="as-row">${asGo('#/calendar', 'افتح التقويم')}${asActBtn('تصدير لـ Outlook/Google', () => calDownload(E, 'مواعيد-الشراكات'))}</div>`;
    }
    case 'ics': { const td = isoDate(today()); const E = calEvents().filter((e) => e.date >= td && (!it.days || e.date <= isoDate(addDays(today(), it.days)))); if (!E.length) return '<p>لا مواعيد قادمة للتصدير.</p>'; calDownload(E); return `<p>صدّرت <b>${E.length}</b> موعدًا في ملف ‎.ics‎ — افتحه ليُضاف إلى Outlook أو Google أو تقويم الجوال.</p>`; }
    case 'expiring': {
      const E = L_.filter((p) => p.stage === 'signed' && daysLeft(p) !== null && daysLeft(p) >= 0 && daysLeft(p) <= it.days).sort((a, b) => daysLeft(a) - daysLeft(b));
      if (!E.length) return `<p>لا توجد شراكات تنتهي خلال ${it.days} يومًا القادمة 👍</p>`;
      AS.last = E[0];
      return `<p><b>${asPlural(E.length, AS_P)}</b> تنتهي خلال ${it.days} يومًا القادمة — أقربها <b>${esc(partnerName(E[0]))}</b> بعد ${daysLeft(E[0])} يومًا:</p>${asList(E)}<div class="as-row">${asActBtn('اكتب خطاب تجديد لأقربها', () => asAsk('اكتب خطاب تجديد لشراكة ' + partnerName(E[0])))}${asGo('#/partnerships?status=soon', 'افتحها في السجل')}</div>`;
    }
    case 'props': {
      const P = visibleProposals().filter((x) => x.status !== 'draft'); const by = (s) => P.filter((x) => x.status === s).length;
      return `<p>المقترحات: <b>${P.length}</b> — جديدة ${by('submitted')}، قيد الدراسة ${by('review')}، بانتظار استكمال ${by('info')}، مقبولة ${by('accepted')}، محوّلة لشراكات ${by('converted')}، غير مقبولة ${by('rejected')}.${P.filter((x) => x.external).length ? ` منها ${P.filter((x) => x.external).length} من جهات خارجية.` : ''}</p>${asGo('#/proposals', 'المقترحات الواردة')}`;
    }
    case 'region': {
      if (it.reg) { const R = L_.filter((p) => pRegion(p).r === it.reg); App.map = { ...(App.map || {}), sel: it.reg }; return R.length ? `<p>في <b>${esc(it.reg)}</b> ${asPlural(R.length, AS_P)}:</p>${asList(R)}${asGo('#/map', 'اعرضها على الخريطة')}` : `<p>لا توجد شراكات مسجّلة في ${esc(it.reg)}.</p>${asGo('#/map', 'الخريطة')}`; }
      const m = {}; L_.forEach((p) => { const r = pRegion(p).r || 'بلا منطقة'; m[r] = (m[r] || 0) + 1; });
      return `<p>توزيع الشراكات على المناطق:</p><ul class="as-ul">${Object.entries(m).sort((a, b) => b[1] - a[1]).map(([r, n]) => `<li>${esc(r)}: <b>${n}</b></li>`).join('')}</ul>${asGo('#/map', 'خريطة الشراكات')}`;
    }
    case 'partner': {
      const p = it.p; AS.last = p; const pr = partnerById(p.partnerId); const outs = typeof richItems === 'function' ? richItems(p.outputs).length : 0; const reps = (p.partnerReports || []).length;
      const st = typeof wfStateOf === 'function' ? wfStateOf('partnership', p) : null;
      return `${asCard(p)}<ul class="as-ul"><li>الحالة: <b>${asStatusL[pStatus(p)] || pStatus(p)}</b>${st && st.cur ? ` — الخطوة الحالية: ${esc(st.cur.t)}` : ''}</li>${(p.owners || []).length ? `<li>المسؤول: ${esc(p.owners.join('، '))}</li>` : ''}${(p.departments || []).length ? `<li>الإدارات المشاركة: ${esc(p.departments.join('، '))}</li>` : ''}<li>المخرجات المستهدفة: <b>${outs}</b>${reps ? ` · تقارير من الشريك: <b>${reps}</b>` : ''}${(p.meetings || []).length ? ` · اجتماعات: ${p.meetings.length}` : ''}</li>${pr && pr.website ? `<li>الموقع: <a href="${esc(pr.website)}" target="_blank" rel="noopener">${esc(pr.website)}</a></li>` : ''}</ul>
        <div class="as-row">${asActBtn('تقرير ربع سنوي', () => asAsk('اكتب تقرير ربع سنوي لشراكة ' + partnerName(p)))}${asActBtn('خطاب تجديد', () => asAsk('اكتب خطاب تجديد لشراكة ' + partnerName(p)))}${asGo('#/partnerships/' + p.id, 'فتح الشراكة')}</div>`;
    }
    case 'stats': {
      let R = L_; const f = [];
      if (it.sec) { R = R.filter((p) => pSector(p) === it.sec); f.push('القطاع ' + it.sec); }
      if (it.dep) { R = R.filter((p) => (p.departments || []).includes(it.dep)); f.push('بمشاركة ' + it.dep); }
      if (it.own) { R = R.filter((p) => (p.owners || []).includes(it.own)); f.push('بمسؤولية ' + it.own); }
      if (it.yr) { R = R.filter((p) => String(p.startDate || '').startsWith(it.yr)); f.push('بدأت ' + it.yr); }
      const S = (s) => R.filter((p) => (s === 'active' ? ['active', 'soon'].includes(pStatus(p)) : s === 'prep' ? ['prep', 'sign'].includes(pStatus(p)) : pStatus(p) === s));
      if (it.st) { const X = S(it.st); return `<p>${f.length ? f.join('، ') + ': ' : ''}<b>${asPlural(X.length, AS_P)}</b> ${asStatusL[it.st]}${it.st === 'active' ? '' : ''}.</p>${X.length ? asList(X) : ''}`; }
      const partners = new Set(R.map((p) => p.partnerId)).size;
      return `<p>${f.length ? `<b>${esc(f.join('، '))}</b>: ` : 'الوضع الآن: '}</p><div class="as-kpis">${[[R.filter((p) => p.stage === 'signed').length, 'موقّعة'], [S('active').length, 'سارية'], [S('soon').length, 'تنتهي قريبًا'], [S('expired').length, 'منتهية'], [S('prep').length, 'قيد الإعداد'], [partners, 'جهة شريكة']].map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div>
        ${f.length && R.length ? asList(R, 6) : ''}<div class="as-row">${asGo('#/dashboard', 'لوحة الأداء')}${f.length ? '' : asActBtn('ما الذي ينتهي قريبًا؟', () => asAsk('الشراكات التي تنتهي خلال 90 يوم'))}</div>`;
    }
    case 'meet': return asMeet(text);
    case 'doc': return asDoc(it.doc, text, inTask);
    case 'tour': asTourStart(); return `<p>أبدأ الآن عرضًا موجَّهًا للمنصة، أنقلك فيه بين الصفحات وأشرح كل واحدة. ${asActBtn('أو شغّل الجولة التفاعلية التفصيلية', () => { asTourStop(); asToggle(false); startTour(); })}</p>`;
    default: return asAI(text);
  }
}
function asActBtn(label, fn) { AS.acts = AS.acts || {}; const id = uid('a'); AS.acts[id] = fn; return `<button type="button" class="as-go alt" data-act="${id}">${esc(label)}</button>`; }

/* ===== إضافة اجتماع من جملة ===== */
function asParseDate(q) {
  const n = asN(q), t = today();
  let d = null;
  if (/بعد بكره|بعد غد/.test(n)) d = addDays(t, 2); else if (/بكره|غدا|بكرا/.test(n)) d = addDays(t, 1); else if (/اليوم|النهارده/.test(n)) d = t;
  const W = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعه', 'السبت'];
  W.forEach((w, i) => { if (!d && n.includes(w)) { const k = (i - t.getDay() + 7) % 7 || 7; d = addDays(t, k); } });
  const m = /(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/.exec(n); if (m) { const y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : t.getFullYear(); d = new Date(y, +m[2] - 1, +m[1]); }
  const mi = MONTHS.findIndex((x) => n.includes(asN(x))); const dm = /(\d{1,2})\s+(?=[^\d]*$)/.exec(n.split(asN(MONTHS[mi] || '@@'))[0] || ''); if (!d && mi > -1 && dm) d = new Date(t.getFullYear() + (mi < t.getMonth() ? 1 : 0), mi, +dm[1]);
  const tm = /(?:الساعه\s*)?(\d{1,2})(?::(\d{2}))?\s*(صباحا|الصبح|ص|مساء|المسا|م|الظهر|العصر)?/.exec(n.replace(/(\d{1,2})[\/-](\d{1,2})([\/-]\d{2,4})?/, ''));
  let time = ''; if (tm && /الساعه|:|صباح|مساء|الصبح|الظهر|العصر|\sص|\sم/.test(tm[0])) { let h = +tm[1]; if (/مساء|المسا|^م$|العصر/.test(tm[3] || '') && h < 12) h += 12; if (/الظهر/.test(tm[3] || '') && h < 11) h += 12; if (!tm[3] && h >= 1 && h <= 6) h += 12; time = `${pad(h)}:${tm[2] || '00'}`; }
  return { date: d ? isoDate(d) : '', time };
}
function asMeet(text) {
  if (!can('edit.partnership') || App.share) return '<p>إضافة الاجتماعات متاحة لإدارة الشراكات وفريقها.</p>';
  const p = asFindPartner(text) || AS.last; const { date, time } = asParseDate(text);
  if (!p) return `<p>مع أي جهة الاجتماع؟ اكتب مثلًا: «حدد اجتماع مع وزارة التجارة يوم الأحد الساعة 10».</p>`;
  if (!date) { calMeetingDlg(p, { time: time || '10:00' }); return `<p>فتحت لك نموذج الاجتماع مع <b>${esc(partnerName(p))}</b> — حدّد التاريخ واحفظ.</p>`; }
  const title = (/(?:عن|بخصوص|لمناقشه|لمراجعه)\s+(.+)$/.exec(text) || [])[1];
  const rec = { id: uid('mt'), title: title ? `اجتماع: ${title.trim()}` : `اجتماع مع ${partnerName(p)}`, date, time: time || '10:00', dur: 60, place: '', notes: 'أُضيف عبر مساعد الشراكات', by: Session.userName(), at: nowISO() };
  p.meetings = [...(p.meetings || []), rec];
  Repo.save('partnerships', p).then(() => Repo.log('meeting.create', 'partnership', p.id, p.code, rec.title));
  const ev = { id: 'meet-' + rec.id, type: 'meet', date: rec.date, time: rec.time, dur: 60, t: rec.title, code: p.code, notes: rec.notes };
  return `<p>أضفت إلى التقويم: <b>${esc(rec.title)}</b> يوم ${CAL_WD[parseDate(date).getDay()]} ${fmtDate(date)} الساعة ${rec.time}.</p><div class="as-row"><a class="as-go alt" href="${calGoogleURL(ev)}" target="_blank" rel="noopener">إلى Google</a><a class="as-go alt" href="${calOutlookURL(ev)}" target="_blank" rel="noopener">إلى Outlook</a>${asGo('#/calendar?d=' + date, 'التقويم')}</div>`;
}

/* ===== كتابة المسودات من بيانات الشراكة ===== */
function asDocPick(text) {
  return asFindPartner(text) || (/(اقرب|أقرب|اول|أول)/.test(text) ? asPts().filter((p) => p.stage === 'signed' && daysLeft(p) !== null && daysLeft(p) >= 0).sort((a, b) => daysLeft(a) - daysLeft(b))[0] : null) || AS.last;
}
function asDoc(kind, text, inTask = false) {
  const p = asDocPick(text);
  if (!p) return `<p>لأي شراكة؟ اكتب اسم الجهة، مثل: «اكتب ${({ renew: 'خطاب تجديد', quarter: 'تقريرًا ربع سنوي', congrats: 'تهنئة', thanks: 'خطاب شكر', invite: 'دعوة اجتماع' })[kind]} لشراكة وزارة التجارة».</p>`;
  AS.last = p;
  const d = asDocBuild(kind, p); AS.docs = AS.docs || {}; const id = uid('d'); AS.docs[id] = d;
  if (!inTask) setTimeout(() => asDocOpen(d), 150);
  return `<div class="as-doc"><span class="as-doc-ic">${icon('file')}</span><div><b>${esc(d.title)}</b><small>من بيانات شراكة ${esc(partnerName(p))} — جاهزة للتعديل والتنزيل</small></div><button type="button" class="as-go" data-doc="${id}">فتح المسودة</button></div>`;
}
function asDocBuild(kind, p) {
  const o = D.settings.org || {}, pr = partnerById(p.partnerId), nm = partnerName(p), td = fmtDate(isoDate(today()));
  const outs = (typeof richItems === 'function' ? richItems(p.outputs) : []).map((x) => (typeof x === 'string' ? x : x.t || x.text || '')).filter(Boolean);
  const areas = String(p.cooperationAreas || '').split(/\n+/).map((x) => x.replace(/^\s*[\d.)\-•]+\s*/, '').trim()).filter(Boolean);
  const head = `<p class="dd-h"><b>${esc(o.name || 'مؤسسة مروج الأهلية')}</b><br>${esc(o.dept || 'إدارة الشراكات')}</p><p class="dd-meta">التاريخ: ${td}<br>المرجع: ${esc(p.code || '')}</p>`;
  const to = `<p>سعادة / ${esc(p.contactName || '[اسم المسؤول]')}${p.contactName ? '' : ''}<br>${esc(nm)}</p><p>السلام عليكم ورحمة الله وبركاته،</p>`;
  const sign = `<p>وتفضلوا بقبول خالص التحية والتقدير،</p><p class="dd-sign"><b>${esc(o.dept || 'إدارة الشراكات')}</b><br>${esc(o.name || 'مؤسسة مروج الأهلية')}</p>`;
  const term = `${p.startDate ? fmtDate(p.startDate) : '[تاريخ البدء]'} حتى ${p.endDate ? fmtDate(p.endDate) : '[تاريخ الانتهاء]'}`;
  const reps = (p.partnerReports || []).filter((x) => new Date(x.at) > addDays(today(), -92));
  const D_ = {
    renew: ['خطاب طلب تجديد مذكرة التعاون — ' + nm, `${head}${to}<p>نشير إلى مذكرة التعاون المبرمة بين ${esc(o.name || 'المؤسسة')} و${esc(nm)}${p.code ? ` (المرجع ${esc(p.code)})` : ''}، السارية خلال الفترة من ${term}، وما تحقق في إطارها من تعاون مثمر.</p>
      ${outs.length ? `<p>وقد شملت المذكرة العمل على المخرجات الآتية:</p><ol>${outs.slice(0, 6).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
      <p>وانطلاقًا من حرصنا على استدامة هذه الشراكة وتعظيم أثرها في تنمية الغطاء النباتي، نود إبداء رغبتنا في <b>تجديد مذكرة التعاون</b> لمدة [مدة التجديد]، مع تطوير نطاقها بما يلي: [المجالات المقترحة للتطوير].</p>
      <p>ونقترح عقد اجتماع تنسيقي لمراجعة مخرجات المرحلة الماضية والاتفاق على خطة المرحلة القادمة، في الموعد الذي ترونه مناسبًا.</p>${sign}`],
    quarter: ['التقرير الربع سنوي — ' + nm, `<h2>التقرير الربع سنوي لشراكة ${esc(nm)}</h2><p class="dd-meta">${esc(p.code || '')} · ${td} · ${esc(o.dept || 'إدارة الشراكات')}</p>
      <h3>أولًا: بيانات الشراكة</h3><table><tr><th>الجهة الشريكة</th><td>${esc(nm)}</td></tr><tr><th>القطاع</th><td>${esc(pSector(p) || '—')}</td></tr><tr><th>مدة المذكرة</th><td>${term}</td></tr><tr><th>الحالة</th><td>${asStatusL[pStatus(p)] || ''}${daysLeft(p) > 0 ? ` — متبقٍ ${daysLeft(p)} يومًا` : ''}</td></tr><tr><th>المسؤول</th><td>${esc((p.owners || []).join('، ') || '—')}</td></tr><tr><th>الإدارات المشاركة</th><td>${esc((p.departments || []).join('، ') || '—')}</td></tr></table>
      <h3>ثانيًا: المخرجات المستهدفة ومستوى التقدم</h3>${outs.length ? `<table><tr><th>المخرج</th><th>الحالة</th><th>ملاحظات</th></tr>${outs.map((x) => `<tr><td>${esc(x)}</td><td>[منجز / قيد التنفيذ / لم يبدأ]</td><td>[ملاحظات]</td></tr>`).join('')}</table>` : '<p>[لم تُسجّل مخرجات في المنصة]</p>'}
      <h3>ثالثًا: أبرز ما تم خلال الربع</h3>${reps.length ? `<ul>${reps.map((x) => `<li>${fmtDate(String(x.at).slice(0, 10))}: ${esc(x.text || (PORTAL_KINDS[x.kind] || ['تقرير'])[0])}${(x.files || []).length ? ` (${x.files.length} مرفق)` : ''}</li>`).join('')}</ul>` : '<p>[أبرز الأنشطة والإنجازات خلال الربع]</p>'}
      ${(p.meetings || []).length ? `<h3>رابعًا: الاجتماعات</h3><ul>${p.meetings.map((m) => `<li>${fmtDate(m.date)}: ${esc(m.title || '')}</li>`).join('')}</ul>` : ''}
      <h3>${(p.meetings || []).length ? 'خامسًا' : 'رابعًا'}: التحديات والتوصيات</h3><p>${esc(p.challenges || '[التحديات]')}</p><p>${esc(p.recommendations || '[التوصيات للربع القادم]')}</p>`],
    congrats: ['خطاب تهنئة بإنجاز — ' + nm, `${head}${to}<p>يسرّنا في ${esc(o.name || 'المؤسسة')} أن نتقدم إليكم بخالص التهنئة بمناسبة [الإنجاز]، الذي تحقق في إطار الشراكة القائمة بيننا${areas.length ? ` في مجال ${esc(areas[0])}` : ''}.</p><p>ويعكس هذا الإنجاز ما تتميز به شراكتنا من التزام وتكامل، ويسهم في تحقيق مستهدفات تنمية الغطاء النباتي ورؤية المملكة 2030. ونتطلع إلى مزيد من النجاحات المشتركة.</p>${sign}`],
    thanks: ['خطاب شكر — ' + nm, `${head}${to}<p>يطيب لنا أن نتقدم إليكم بجزيل الشكر والتقدير على تعاونكم المثمر ودعمكم المتواصل في إطار مذكرة التعاون بيننا${p.code ? ` (المرجع ${esc(p.code)})` : ''}.</p>${outs.length ? `<p>وقد أسهم هذا التعاون في العمل على: ${esc(outs.slice(0, 3).join('؛ '))}.</p>` : ''}<p>ونثمّن ما لمسناه من حرص واهتمام، ونتطلع إلى استمرار الشراكة وتوسيع أثرها.</p>${sign}`],
    invite: ['دعوة لحضور اجتماع — ' + nm, `${head}${to}<p>في إطار متابعة مذكرة التعاون بين ${esc(o.name || 'المؤسسة')} و${esc(nm)}، يسرّنا دعوتكم لحضور اجتماع [تنسيقي / لمراجعة المخرجات] وذلك:</p><table><tr><th>الموعد</th><td>[اليوم والتاريخ] — الساعة [الوقت]</td></tr><tr><th>المكان</th><td>[مقر المؤسسة / رابط الاجتماع]</td></tr><tr><th>جدول الأعمال</th><td>1) مراجعة ما تم إنجازه<br>2) المخرجات المستهدفة للمرحلة القادمة<br>3) ما يستجد من أعمال</td></tr></table><p>نأمل التكرم بتأكيد الحضور وتسمية ممثليكم.</p>${sign}`],
  }[kind];
  return { title: D_[0], html: D_[1], p };
}
function asDocOpen(d) {
  const m = Modal.open({ title: d.title, size: 'lg',
    body: `<div class="as-docw"><div class="as-paper" contenteditable="true" id="asPaper">${d.html}</div><p class="small muted" style="margin-top:8px">${icon('edit')} المسودة قابلة للتعديل مباشرة. ما بين [قوسين] يُستكمل قبل الإرسال.</p></div>`,
    foot: `<button class="btn primary" type="button" data-dword>${icon('download')} تنزيل Word</button><button class="btn" type="button" data-dprint>${icon('print')} طباعة / PDF</button><button class="btn" type="button" data-dcopy>${icon('copy')} نسخ</button>${asAiOn() ? `<button class="btn" type="button" data-dai>${icon('spark')} تحسين الصياغة بالذكاء الاصطناعي</button>` : ''}<button class="btn ghost" type="button" data-mclose>إغلاق</button>` });
  const paper = () => $('#asPaper', m.el).innerHTML;
  const docHTML = () => `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(d.title)}</title><style>body{font-family:'Sakkal Majalla','Traditional Arabic','Arial',sans-serif;font-size:16pt;line-height:1.8;direction:rtl;padding:24px}h2{font-size:20pt;color:#173A2E}h3{font-size:16pt;color:#173A2E;margin-top:18px}table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #bbb;padding:6px 10px;text-align:right;vertical-align:top}th{background:#F1F6F2}.dd-h{text-align:left}.dd-meta{color:#555;font-size:12pt}.dd-sign{margin-top:30px}</style></head><body>${paper()}</body></html>`;
  m.el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-dword]')) { const b = new Blob(['﻿' + docHTML()], { type: 'application/msword' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = d.title.replace(/[\\/:*?"<>|]/g, '-') + '.doc'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
    if (e.target.closest('[data-dprint]')) { const w = window.open('', '_blank'); if (w) { w.document.write(docHTML()); w.document.close(); setTimeout(() => w.print(), 300); } }
    if (e.target.closest('[data-dcopy]')) { try { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([paper()], { type: 'text/html' }), 'text/plain': new Blob([$('#asPaper', m.el).innerText], { type: 'text/plain' }) })]); } catch (_) { try { await navigator.clipboard.writeText($('#asPaper', m.el).innerText); } catch (__) { /* */ } } toast('نُسخت المسودة'); }
    const ai = e.target.closest('[data-dai]'); if (ai) {
      ai.disabled = true; ai.textContent = 'جارٍ التحسين…';
      const r = await asAICall([{ role: 'user', content: `حسّن صياغة هذه المسودة الرسمية بالعربية الفصحى، واملأ ما بين [قوسين] من بيانات الشراكة إن كانت متوفرة في بيانات المنصة، واترك الباقي بين قوسين. أعد المسودة كاملة بصيغة HTML بسيطة (p, h2, h3, ol, ul, table) دون أي شرح:\n\n${paper()}` }]);
      if (r.text) { $('#asPaper', m.el).innerHTML = asSafeHTML(r.text.replace(/^```(?:html)?\s*|\s*```$/g, '')); toast('حُسّنت الصياغة'); } else toast(r.err || 'تعذّر التحسين', 'err');
      ai.disabled = false; ai.innerHTML = `${icon('spark')} تحسين الصياغة بالذكاء الاصطناعي`;
    }
  });
}
/* تنظيف HTML العائد من النموذج: الوسوم النصية فقط */
function asSafeHTML(h) {
  const t = document.createElement('template'); t.innerHTML = h;
  const ok = new Set(['P', 'H2', 'H3', 'H4', 'OL', 'UL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'B', 'STRONG', 'BR', 'EM', 'SPAN']);
  const walk = (n) => { [...n.children].forEach((c) => { if (!ok.has(c.tagName)) { c.replaceWith(...c.childNodes); } else { [...c.attributes].forEach((a) => c.removeAttribute(a.name)); walk(c); } }); };
  walk(t.content); return t.innerHTML;
}

/* ===== الذكاء الاصطناعي (دالة Supabase) ===== */
const asAiOn = () => !!(Cloud.on && Cloud.token && Cloud.token() && (!D.settings.ai || D.settings.ai.on !== false));
function asContext() {
  const td = isoDate(today()), L_ = asPts();
  const pts = L_.map((p) => ({ id: p.id, code: p.code, partner: partnerName(p), title: p.title && p.title !== partnerName(p) ? p.title : undefined, sector: pSector(p) || undefined, status: asStatusL[pStatus(p)] || pStatus(p), start: p.startDate || undefined, end: p.endDate || undefined,
    region: pRegion(p).r || undefined, owners: (p.owners || []).join('، ') || undefined, departments: (p.departments || []).join('، ') || undefined, classification: p.classification || undefined, categories: (p.categories || []).join('، ') || undefined,
    outputs: (typeof richItems === 'function' ? richItems(p.outputs) : []).map((x) => (typeof x === 'string' ? x : x.t || x.text || '')).filter(Boolean).slice(0, 8).map((x) => x.slice(0, 160)),
    cooperation: String(p.cooperationAreas || '').slice(0, 400) || undefined, meetings: (p.meetings || []).filter((m) => m.date >= td).map((m) => `${m.date} ${m.title || ''}`), partnerReports: (p.partnerReports || []).length || undefined }));
  const props = visibleProposals().filter((x) => x.status !== 'draft').map((x) => ({ ref: x.ref, partner: x.partnerName, status: x.status, department: x.department, at: String(x.submittedAt || x.createdAt || '').slice(0, 10) }));
  const ev = calEvents().filter((e) => e.date >= td && e.date <= isoDate(addDays(today(), 120))).slice(0, 80).map((e) => `${e.date}${e.time ? ' ' + e.time : ''} — ${e.t}`);
  return JSON.stringify({ today: td, org: (D.settings.org || {}).name, user: Session.userName ? Session.userName() : '', role: Session.role(), page: location.hash, partnerships: pts, proposals: props, upcoming: ev, stories: publicStories().map((s) => s.title).slice(0, 30) });
}
async function asAICall(messages) {
  if (!asAiOn()) return { err: 'off' };
  try {
    const r = await fetch(`${Cloud.url}/functions/v1/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: Cloud.key, Authorization: `Bearer ${Cloud.key}` }, body: JSON.stringify({ token: Cloud.token(), messages, context: asContext() }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.text) return { text: j.text };
    return { err: { limit: 'وصلت للحد اليومي لأسئلة الذكاء الاصطناعي، جرّب غدًا.', no_key: 'لم يُضَف مفتاح Claude في أسرار Supabase بعد.', busy: 'الخدمة مشغولة الآن، جرّب بعد قليل.', invalid_token: 'انتهت جلستك، سجّل الدخول من جديد.' }[j.error] || (r.status === 404 ? 'not_deployed' : 'تعذّر الوصول للذكاء الاصطناعي الآن.') };
  } catch (_) { return { err: 'not_deployed' }; }
}
async function asAI(text) {
  if (!asAiOn()) return `<p>لم أفهم الطلب بدقة. جرّب صيغة أخرى أو اختر من هذه:</p><div class="as-chips">${['ما وضع الشراكات الآن؟', 'الشراكات اللي تنتهي خلال شهر', 'مهامي', 'قدّم لي المنصة'].map((c) => `<button type="button" class="as-chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div><p class="as-hint">للأسئلة المفتوحة بلا حدود يعمل الذكاء الاصطناعي على المنصة المشتركة بعد تفعيله.</p>`;
  AS.aiHist.push({ role: 'user', content: text });
  const r = await asAICall(AS.aiHist.slice(-12));
  if (r.text) { AS.aiHist.push({ role: 'assistant', content: r.text }); return `<div class="as-ai">${asMd(r.text)}</div><div class="as-src">${icon('spark')} إجابة بالذكاء الاصطناعي من بيانات المنصة — راجِع الأرقام المهمة.</div>`; }
  AS.aiHist.pop();
  if (r.err === 'not_deployed') return `<p>هذا سؤال مفتوح يحتاج الذكاء الاصطناعي، ودالته لم تُنشر بعد على Supabase.</p><p class="as-hint">لتفعيله: شغّل <b>supabase/assistant.sql</b>، وأضف مفتاح Claude في أسرار الدوال، ثم انشر الدالة <b>assistant</b> (الخطوات في رأس الملف supabase/functions/assistant/index.ts).</p>`;
  return `<p>${esc(r.err)}</p>`;
}

/* ===== المساعد يقدّم المنصة ===== */
const AS_TOUR = [
  ['#/', 'الرئيسية', 'واجهة المنصة: الأرقام الحية، والشراكات المختارة، وقصص الأثر، وشركاؤنا — كل ما تحتاجه القيادة في نظرة.'],
  ['#/dashboard', 'لوحة الأداء', 'مؤشرات المحفظة: السارية والمنتهية والقريبة من الانتهاء، والتوزيع على القطاعات والإدارات، وصحة كل شراكة.'],
  ['#/partnerships', 'سجل الشراكات', 'كل الشراكات بفلاتر مترابطة وبحث فوري — ومن هنا تُفتح صفحة كل شراكة بمسارها وملفاتها ومخرجاتها.'],
  ['#/map', 'خريطة الشراكات', 'انتشار الشراكات على مناطق المملكة؛ اضغط أي منطقة لترى شراكاتها.'],
  ['#/calendar', 'تقويم الشراكات', 'التوقيع والانتهاء وتقييم التجديد والاجتماعات في مكان واحد، مع التصدير إلى Outlook وGoogle.'],
  ['#/proposals', 'المقترحات الواردة', 'مقترحات الإدارات والجهات الخارجية تسير في مسار معتمد حتى تتحول إلى شراكة.'],
  ['#/reports', 'التقارير', 'تقارير تسويقية وقيادية وتفصيلية بنقرة — PDF وPowerPoint.'],
  ['#/tale', 'حكاية الشراكة', 'العرض السينمائي للقيادات: من الرمل إلى الأثر، بأرقام المنصة الحية.'],
];
function asTourStart() {
  asTourStop();
  const steps = AS_TOUR.filter(([h]) => { const p = h.slice(1).split('?')[0] || '/'; const d = ROUTES.find((r) => r.re.test(p)); return d && (!App.share || shareRouteOk(d.name)); });
  AS.tour = { i: 0, steps, paused: false };
  const bar = document.createElement('div'); bar.id = 'asTour'; document.body.appendChild(bar);
  const show = () => {
    const T = AS.tour; if (!T) return; const [h, t, s] = T.steps[T.i]; location.hash = h;
    bar.innerHTML = `<span class="as-orb sm"><i></i><i></i><i></i></span><div class="as-tt"><small>مساعد الشراكات يقدّم المنصة · ${T.i + 1} / ${T.steps.length}</small><b>${esc(t)}</b><p>${esc(s)}</p><div class="as-tp"><i style="animation-duration:${T.paused ? 0 : 7}s" class="${T.paused ? 'pz' : ''}"></i></div></div>
      <div class="as-tbtn"><button type="button" data-t="prev" title="السابق" ${T.i ? '' : 'disabled'}>${icon('chevR')}</button><button type="button" data-t="pause" title="إيقاف مؤقت">${icon(T.paused ? 'play' : 'pause')}</button><button type="button" data-t="next" title="التالي">${icon('chevL')}</button><button type="button" data-t="stop" title="إنهاء">${icon('x')}</button></div>`;
    clearTimeout(T.tm); if (!T.paused) T.tm = setTimeout(() => { if (AS.tour !== T) return; if (T.i < T.steps.length - 1) { T.i++; show(); } else { asTourStop(); asBot('<p>انتهى العرض 🎉 اسألني عن أي تفصيل.</p>', { raw: true }); } }, 7000);
  };
  bar.onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; const T = AS.tour; const k = b.dataset.t;
    if (k === 'stop') return asTourStop(); if (k === 'pause') { T.paused = !T.paused; return show(); } if (k === 'next' && T.i < T.steps.length - 1) T.i++; if (k === 'prev' && T.i) T.i--; show(); };
  if (innerWidth < 1100) asToggle(false);
  show();
}
function asTourStop() { if (AS.tour) clearTimeout(AS.tour.tm); AS.tour = null; const b = $('#asTour'); if (b) b.remove(); }
