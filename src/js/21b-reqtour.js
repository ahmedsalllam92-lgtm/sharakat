/* =====================================================================
   استعراض «مسار طلب الشراكة»
   يولّد مشاهده وقت التشغيل من تعريف المسار نفسه (WF_STEPS) ومن تعريف حقول «شارك» (SHARE_FIELDS):
   أي مرحلة تُضاف أو تُحذف أو يُغيَّر اسمها، وأي حقل إلزامي جديد، يظهر في الاستعراض تلقائيًا.
   يجري داخل نسختين معزولتين من المنصة (iframe) تعملان على نسخة في الذاكرة من البيانات:
   لا تخزين، ولا إشعارات حقيقية، ولا أثر في السجلات أو العدادات بعد الانتهاء.
   ===================================================================== */
const RQ = { token: 0 };
const RQ_W = 1280; // العرض المنطقي لكل نسخة قبل تصغيرها داخل نصف الشاشة

/* قائمة زر «استعراض المنصة» في الشريط العلوي: استعراضان منفصلان */
function toggleTourMenu() {
  let m = $('#tourMenu'); if (m) { m.remove(); return null; }
  const fin = wfFinal();
  m = document.createElement('div'); m.id = 'tourMenu'; m.className = 'tour-menu'; m.setAttribute('role', 'menu');
  m.innerHTML = `<div class="tm-h">اختر الاستعراض</div>
    <button type="button" role="menuitem" data-tour-start><span class="tm-ic">${icon('play')}</span><span class="tm-t"><b>استعراض المنصة</b><small>جولة على صفحات المنصة ومميزاتها</small></span><kbd>Alt+T</kbd></button>
    <button type="button" role="menuitem" data-rqtour-start><span class="tm-ic">${icon('convert')}</span><span class="tm-t"><b>مسار طلب الشراكة</b><small>من «شارك» حتى الاعتماد أو الرفض — ${WF_STEPS.indexOf(fin) + 1} مراحل، في شاشة مقسومة</small></span></button>`;
  document.body.appendChild(m);
  const b = $('#topbar [data-tourmenu]');
  if (b) { const r = b.getBoundingClientRect(); m.style.top = Math.round(r.bottom + 8) + 'px'; m.style.left = Math.max(12, Math.min(innerWidth - 332, Math.round(r.left + r.width / 2 - 160))) + 'px'; }
  m.onclick = (e) => {
    if (e.target.closest('[data-tour-start]')) { m.remove(); return startTour(); }
    if (e.target.closest('[data-rqtour-start]')) { m.remove(); return startReqTour(); }
  };
  return m;
}
document.addEventListener('mousedown', (e) => { const m = $('#tourMenu'); if (m && !e.target.closest('#tourMenu') && !e.target.closest('[data-tourmenu]')) m.remove(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const m = $('#tourMenu'); m && m.remove(); } });

/* — الجهات والحسابات المشتقة من المسار — */
function rqRequesterDept() {
  const own = D.settings.org.dept, duty = Object.keys(WF_DEPT_DEFAULTS).map(wfDept);
  const opts = L('departments').filter((d) => d !== own);
  return opts.find((d) => !duty.includes(d)) || opts[0] || 'الإدارة الطالبة';
}
function rqSess(actor, req) {
  if (actor === 'partnerships' || wfExternal(actor)) return { role: 'admin', dept: D.settings.org.dept, member: L('team')[0] || '', accountId: 'admin' };
  if (actor === 'requester' || actor === 'concerned') return { role: 'dept', dept: req, member: '', accountId: 'dept:' + req };
  const d = wfDept(actor); return { role: 'dept', dept: d, member: '', accountId: 'dept:' + d };
}
const rqSide = (actor) => (actor === 'requester' || actor === 'concerned' ? 'r' : 'l');
/* الإجراء الذي يُنفَّذ في الخطوة حسب نوعها في التعريف */
function rqAct(s, side) {
  if (s.kind === 'decision' || (s.kind === 'review' && s.yes)) return { act: 'yes', label: s.yes || 'اعتماد' };
  if (s.kind === 'review') return { act: 'yes', label: 'اعتماد' };
  if (s.kind === 'multi') return side === 'r' ? { act: 'dept', label: 'إرسال ملاحظات الإدارة' } : { act: 'close', label: 'اعتماد الملاحظات والانتقال' };
  return { act: 'done', label: 'إتمام الخطوة' };
}
/* قيمة المثال لكل حقل: من التعريف، وإلا حسب نوعه */
function rqDemo(f, doc) {
  if (f.demo) return f.demo.replace(/\\n/g, '\n');
  if (f.type === 'email') return 'demo@example.org';
  if (['dept', 'sector', 'select', 'goal', 'init'].includes(f.kind)) { const o = [...doc.querySelectorAll(`#s_${f.k} option`)].map((x) => x.value).filter(Boolean); return o[0] || ''; }
  return 'بيانات تجريبية للاستعراض';
}

/* — المشاهد: تُبنى من التعريف — */
function rqScenes() {
  const req = rqRequesterDept();
  const fin = wfFinal();
  const steps = WF_STEPS.slice();
  const first = steps[0];
  const sc = [];
  sc.push({ k: 'intro', stage: first && first.id, t: 'مسار طلب الشراكة', run: rqIntro });
  sc.push({ k: 'share', stage: first && first.id, t: 'تعبئة طلب «شارك»', run: rqShare });
  sc.push({ k: 'submit', stage: first && first.id, t: 'إرسال الطلب', run: rqSubmit });
  let backShown = false, converted = false;
  steps.slice(1).forEach((s, i, arr) => {
    if (s.on === 'partnership' && !converted) { converted = true; sc.push({ k: 'convert', stage: s.id, t: 'تحويل الطلب إلى سجل شراكة', run: rqConvert }); }
    if (s.back && !backShown && wfStep(s.back) && s !== fin) { backShown = true; sc.push({ k: 'back:' + s.id, stage: s.id, step: s, t: s.t + ' — إعادة ثم اعتماد', run: rqReturn }); return; }
    if (s === fin) sc.push({ k: 'final', stage: s.id, step: s, t: s.t, run: rqFinal });
    else sc.push({ k: 'step:' + s.id, stage: s.id, step: s, t: s.t, run: rqStep });
  });
  sc.push({ k: 'end', stage: (steps[steps.length - 1] || {}).id, t: 'الخلاصة', run: rqEnd });
  sc.forEach((x, i) => { x.i = i; });
  RQ.req = req;
  return sc;
}

/* — التشغيل — */
async function startReqTour() {
  if ($('#rqTour')) return;
  if (!window.__APP_SRC) return toast('تعذّر تجهيز نسخة الاستعراض.', 'err');
  if (App.tour) endTour();
  RQ.token++; const tk = RQ.token;
  Object.assign(RQ, { tk, scenes: rqScenes(), i: 0, ended: false, waitChoice: null, accs: {}, paused: false, fast: false, snaps: [], choice: null, rec: null, kind: 'proposal', speed: window.__rqSpeed || +(D.settings.tourSpeed || 1) });
  window.__shkGetFile = (id) => Store.getFile(id);
  RQ.base = new Set((D.settings.notifs || []).map((n) => n.id)); RQ.shown = new Set();
  const data = sbxExport();
  window.__shkSbx = { data: () => data };
  const fin = wfFinal(), finI = fin ? WF_STEPS.indexOf(fin) : WF_STEPS.length - 1;
  const root = document.createElement('div');
  root.id = 'rqTour'; root.className = 'tour rq';
  root.innerHTML = `<div class="rq-top"><div class="rq-ttl"><span class="rq-eye">استعراض</span><b>مسار طلب الشراكة</b></div>
      <ol class="rq-stages" aria-label="مراحل المسار">${WF_STEPS.map((s, i) => `<li data-rqst="${esc(s.id)}" class="${i > finI ? 'after' : ''} ${s.final ? 'fin' : ''}" title="${esc(s.n + '. ' + s.t + ' — ' + wfActorName(s.actor))}"><em>${s.n}</em><span>${esc(s.t)}</span></li>`).join('')}</ol></div>
    <div class="rq-panes">
      <section class="rq-pane" data-side="r"><header><span class="rq-tag">الجهة الطالبة</span><b class="rq-who"></b></header><div class="rq-view"><div class="rq-load">جارٍ تجهيز نسخة معزولة…</div></div></section>
      <section class="rq-pane" data-side="l"><header><span class="rq-tag">الجهة التي عليها الدور</span><b class="rq-who"></b></header><div class="rq-view"><div class="rq-load">جارٍ تجهيز نسخة معزولة…</div></div></section>
    </div>
    <div class="rq-spot" hidden></div>
    <div class="tour-card rq-card" role="dialog" aria-live="polite" hidden><div class="tour-ch"><span class="tour-step"></span><span class="tour-design">نسخة معزولة</span></div><h3></h3><div class="tour-body"></div><div class="rq-choice" hidden></div></div>
    <div class="tour-bar" role="toolbar" aria-label="التحكم في الاستعراض">
      <button class="tb" data-rq="prev" title="السابق (→)">${icon('chevR')}</button>
      <button class="tb main" data-rq="play" title="تشغيل / إيقاف مؤقت (مسافة)">${icon('pause')}</button>
      <button class="tb" data-rq="next" title="التالي (←)">${icon('chevL')}</button>
      <div class="tb-prog"><span class="tb-txt"></span><div class="tb-track rq-track"></div></div>
      <label class="tb-speed" title="سرعة الاستعراض"><select data-rq="speed" aria-label="سرعة الاستعراض"><option value="0.75">بطيء</option><option value="1">عادي</option><option value="1.5">سريع</option></select></label>
      <button class="tb end" data-rq="end" title="إنهاء الاستعراض (Esc)">${icon('x')}<span>إنهاء</span></button></div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('rq-on');
  $('[data-rq="speed"]', root).value = String(RQ.speed);
  $('.rq-track', root).innerHTML = RQ.scenes.map((s, k) => `<button data-rqjump="${k}" title="${esc(s.t)}"></button>`).join('');
  root.addEventListener('click', rqClick);
  $('[data-rq="speed"]', root).onchange = (e) => { RQ.speed = +e.target.value; };
  document.addEventListener('keydown', rqKeys, true);
  window.addEventListener('resize', rqLayout);
  try {
    const [r, l] = await Promise.all([rqFrame('r', rqSess('requester', RQ.req), '#/share'), rqFrame('l', rqSess('partnerships', RQ.req), '#/proposals')]);
    if (tk !== RQ.token) return;
    RQ.f = { r, l };
    rqLayout();
    rqLoop(0);
  } catch (e) { if (e !== 'rq-abort' && tk === RQ.token) { console.error(e); toast('تعذّر تشغيل الاستعراض: ' + (e.message || e), 'err'); endReqTour(); } }
}
function rqFrame(side, sess, hash) {
  const tk = RQ.tk;
  return new Promise((res, rej) => {
    const view = $(`#rqTour .rq-pane[data-side="${side}"] .rq-view`);
    const f = document.createElement('iframe');
    f.className = 'rq-frame'; f.setAttribute('title', side === 'r' ? 'الجهة الطالبة' : 'الجهة التي عليها الدور'); f.setAttribute('tabindex', '-1');
    const boot = `<script>(function(){var mk=function(){var m=new Map();return{getItem:function(k){return m.has(k)?m.get(k):null},setItem:function(k,v){m.set(k,String(v))},removeItem:function(k){m.delete(k)},clear:function(){m.clear()},key:function(i){return Array.from(m.keys())[i]||null},get length(){return m.size}}};
      try{Object.defineProperty(window,'localStorage',{configurable:true,value:mk()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:mk()});}catch(e){}
      document.addEventListener('keydown',function(e){if(['Escape',' ','ArrowLeft','ArrowRight'].indexOf(e.key)>-1&&!(e.target.closest&&e.target.closest('input,textarea,select'))){e.preventDefault();e.stopPropagation();try{parent.document.dispatchEvent(new parent.KeyboardEvent('keydown',{key:e.key,bubbles:true}));}catch(_){}}},true);
      window.__SBX={side:${JSON.stringify(side)},account:${JSON.stringify(sess.accountId)},sess:${JSON.stringify(sess)},data:function(){return parent.__shkSbx.data();}};
      location.hash=${JSON.stringify(hash)};})();<\/script>`;
    f.srcdoc = '<!DOCTYPE html>' + window.__APP_SRC.replace(/<head>/i, '<head>' + boot);
    view.appendChild(f);
    const t0 = Date.now();
    const wait = () => {
      if (RQ.token !== tk || !view.isConnected) return rej('rq-abort');
      let w; try { w = f.contentWindow; } catch (_) { /* */ }
      if (w && w.document && w.document.querySelector('#main .page') && typeof w.sbxAs === 'function') {
        w.sbxAs(sess); view.querySelector('.rq-load') && view.querySelector('.rq-load').remove();
        f.contentDocument.documentElement.classList.add('rq-in');
        return res(f);
      }
      if (Date.now() - t0 > 30000) return rej(new Error('انتهت مهلة تحميل النسخة المعزولة'));
      setTimeout(wait, 120);
    };
    setTimeout(wait, 200);
  });
}
function rqLayout() {
  if (!RQ.f) return;
  ['r', 'l'].forEach((sd) => {
    const f = RQ.f[sd], v = f.parentElement, W = v.clientWidth, H = v.clientHeight, k = W / RQ_W;
    f.style.width = RQ_W + 'px'; f.style.height = Math.round(H / k) + 'px'; f.style.transform = `scale(${k})`;
    f._k = k;
  });
  rqPlace();
}
const rqW = (sd) => RQ.f[sd].contentWindow;
const rqDoc = (sd) => RQ.f[sd].contentDocument;

/* — التوقيت: إيقاف مؤقت، وتسريع عند «التالي»، وإلغاء عند الخروج أو الرجوع — */
function rqSleep(ms) {
  const tk = RQ.tk, my = RQ.sceneTk;
  return new Promise((res, rej) => {
    let left = RQ.fast ? 0 : ms / (RQ.speed || 1);
    let last = performance.now();
    const tick = () => {
      if (RQ.token !== tk || RQ.sceneTk !== my) return rej('rq-abort');
      const now = performance.now();
      if (!RQ.paused) left -= RQ.fast ? 1e9 : now - last;
      last = now;
      if (left <= 0) return res();
      setTimeout(tick, 40);
    };
    tick();
  });
}
async function rqLoop(i) {
  RQ.sceneTk = (RQ.sceneTk || 0) + 1;
  const my = RQ.sceneTk;
  for (let k = i; k < RQ.scenes.length; k++) {
    if (RQ.sceneTk !== my) return;
    RQ.i = k; RQ.fast = false;
    const sc = RQ.scenes[k];
    RQ.snaps[k] = rqSnap();
    rqProgress();
    try { await sc.run(sc); } catch (e) { if (e === 'rq-abort') return; console.error(e); rqCard({ step: 'تعذّر عرض هذه المرحلة', t: sc.t, b: String(e.message || e) }); return; }
    if (RQ.sceneTk !== my) return;
    if (RQ.ended) return;
  }
}
function rqSnap() { return { data: rqW('r').sbxExport(), rs: rqW('r').sbxSession(), ls: rqW('l').sbxSession(), rh: rqW('r').location.hash, lh: rqW('l').location.hash, rec: RQ.rec && RQ.rec.id, kind: RQ.kind, rAcc: RQ.accs && RQ.accs.r, lAcc: RQ.accs && RQ.accs.l, choice: RQ.choice, shown: [...(RQ.shown || [])] }; }
function rqRestore(sn) {
  ['r', 'l'].forEach((sd) => { const w = rqW(sd); w.sbxImport(sn.data); w.location.hash = sd === 'r' ? sn.rh : sn.lh; });
  RQ.kind = sn.kind; RQ.choice = sn.choice; RQ.shown = new Set(sn.shown || []); RQ.rec = sn.rec ? { id: sn.rec } : null; RQ.ended = false;
  if (sn.rAcc) rqAs('r', sn.rAcc.sess, sn.rAcc.label, true);
  if (sn.lAcc) rqAs('l', sn.lAcc.sess, sn.lAcc.label, true);
}
function rqJump(k) {
  k = Math.max(0, Math.min(RQ.scenes.length - 1, k));
  const sn = RQ.snaps[k]; if (!sn) return;
  RQ.sceneTk++; rqCloseModals(); rqRestore(sn); RQ.paused = false; rqPlayIcon(); rqLoop(k);
}
function rqNext() { if (RQ.ended) return; if (RQ.waitChoice) return; RQ.fast = true; RQ.paused = false; rqPlayIcon(); }
function rqClick(e) {
  const b = e.target.closest('[data-rq]'), j = e.target.closest('[data-rqjump]');
  if (j) { const k = +j.dataset.rqjump; if (RQ.snaps[k]) rqJump(k); return; }
  const c = e.target.closest('[data-rqchoice]'); if (c && RQ.waitChoice) { RQ.waitChoice(c.dataset.rqchoice); return; }
  if (e.target.closest('[data-rqreplay]')) return rqJump(0);
  if (e.target.closest('[data-rqclose]')) return endReqTour();
  if (!b) return;
  const a = b.dataset.rq;
  if (a === 'end') return endReqTour();
  if (a === 'play') { RQ.paused = !RQ.paused; rqPlayIcon(); return; }
  if (a === 'next') return rqNext();
  if (a === 'prev') return rqJump(RQ.i - 1);
}
function rqKeys(e) {
  if (!$('#rqTour')) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return endReqTour(); }
  if (e.target.closest && e.target.closest('select,input,textarea')) return;
  if (e.key === ' ') { e.preventDefault(); RQ.paused = !RQ.paused; rqPlayIcon(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); rqNext(); }
  if (e.key === 'ArrowRight') { e.preventDefault(); rqJump(RQ.i - 1); }
}
function rqPlayIcon() { const b = $('#rqTour [data-rq="play"]'); if (b) b.innerHTML = icon(RQ.paused ? 'play' : 'pause'); }
function rqProgress() {
  const sc = RQ.scenes[RQ.i], root = $('#rqTour'); if (!root) return;
  $('.tb-txt', root).textContent = `${RQ.i + 1} / ${RQ.scenes.length} · ${sc.t}`;
  $$('.rq-track button', root).forEach((b, k) => { b.classList.toggle('on', k === RQ.i); b.classList.toggle('done', k < RQ.i); });
  const si = WF_STEPS.findIndex((s) => s.id === sc.stage);
  $$('.rq-stages li', root).forEach((li, k) => { li.classList.toggle('on', k === si); li.classList.toggle('done', k < si); });
  const on = $('.rq-stages li.on', root); on && on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}
function endReqTour() {
  RQ.token++; RQ.sceneTk = (RQ.sceneTk || 0) + 1; RQ.ended = true;
  document.removeEventListener('keydown', rqKeys, true);
  window.removeEventListener('resize', rqLayout);
  const root = $('#rqTour'); if (root) { root.querySelectorAll('iframe').forEach((f) => { try { f.srcdoc = ''; } catch (_) { /* */ } f.remove(); }); root.remove(); }
  document.documentElement.classList.remove('rq-on');
  delete window.__shkSbx; delete window.__shkGetFile;
  RQ.f = null; RQ.snaps = []; RQ.rec = null;
}

/* — العرض: الحساب في كل جهة، والتعتيم، وفقاعة الشرح — */
function rqAs(sd, sess, label, quiet) {
  RQ.accs = RQ.accs || {}; RQ.accs[sd] = { sess, label };
  const pane = $(`#rqTour .rq-pane[data-side="${sd}"]`); if (!pane) return;
  $('.rq-who', pane).textContent = label;
  if (sd === 'l') $('.rq-tag', pane).textContent = 'عليها الدور الآن';
  const w = rqW(sd), cur = w.sbxSession();
  if (cur.role !== sess.role || cur.dept !== sess.dept || !quiet) w.sbxAs(sess);
}
function rqActive(sd) { $$('#rqTour .rq-pane').forEach((p) => p.classList.toggle('dim', sd && p.dataset.side !== sd)); }
function rqCard({ step, t, b, side, el, wide }) {
  const root = $('#rqTour'); if (!root) return;
  const c = $('.rq-card', root); c.hidden = false;
  $('.tour-step', c).textContent = step || '';
  $('h3', c).textContent = t || '';
  $('.tour-body', c).innerHTML = b || '';
  $('.rq-choice', c).hidden = true;
  c.classList.toggle('wide', !!wide);
  RQ.target = el ? { side, el } : side ? { side } : null;
  rqPlace();
}
function rqPlace() {
  const root = $('#rqTour'); if (!root || !RQ.f) return;
  const c = $('.rq-card', root), spot = $('.rq-spot', root);
  const tg = RQ.target;
  const vw = innerWidth, vh = innerHeight, cw = Math.min(c.classList.contains('wide') ? 520 : 380, vw - 24);
  c.style.width = cw + 'px';
  const ch = c.offsetHeight;
  if (!tg) { spot.hidden = true; c.style.left = Math.round((vw - cw) / 2) + 'px'; c.style.top = Math.round((vh - ch) / 2) + 'px'; return; }
  const f = RQ.f[tg.side], fr = f.getBoundingClientRect(), k = f._k || 1;
  const pane = f.closest('.rq-pane').getBoundingClientRect();
  if (!tg.el || !tg.el.isConnected) {
    spot.hidden = true;
    c.style.left = Math.round(pane.left + (pane.width - cw) / 2) + 'px'; c.style.top = Math.round(pane.top + 70) + 'px'; return;
  }
  const r = tg.el.getBoundingClientRect();
  const box = { l: fr.left + r.left * k, t: fr.top + r.top * k, w: r.width * k, h: r.height * k };
  const top0 = pane.top + 36, bot0 = pane.bottom;
  box.t = Math.max(top0, box.t); box.h = Math.max(8, Math.min(box.h, bot0 - box.t));
  spot.hidden = false;
  Object.assign(spot.style, { left: box.l - 5 + 'px', top: box.t - 5 + 'px', width: box.w + 10 + 'px', height: box.h + 10 + 'px' });
  let top = box.t + box.h + 14;
  if (top + ch > vh - 76) top = box.t - ch - 14;
  if (top < top0) top = Math.min(vh - 76 - ch, Math.max(top0, box.t + 20));
  let left = box.l + box.w / 2 - cw / 2;
  left = Math.max(pane.left + 8, Math.min(pane.right - cw - 8, left));
  c.style.left = Math.round(left) + 'px'; c.style.top = Math.round(Math.max(8, top)) + 'px';
}
async function rqPoint(sd, sel, card, ms = 3200) {
  const d = rqDoc(sd);
  const el = typeof sel === 'string' ? d.querySelector(sel) : sel;
  if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  rqActive(sd);
  await new Promise((r) => requestAnimationFrame(r));
  rqCard({ ...card, side: sd, el });
  await rqSleep(ms);
  return el;
}
const rqWaitFor = async (sd, sel, ms = 4000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const e = rqDoc(sd).querySelector(sel); if (e) return e; await new Promise((r) => setTimeout(r, 60)); if (RQ.token !== RQ.tk) throw 'rq-abort'; } return null; };
async function rqGo(sd, hash) { const w = rqW(sd); if (w.location.hash !== hash) w.location.hash = hash; else w.route(); await new Promise((r) => setTimeout(r, 380)); }
async function rqType(sd, el, text) {
  if (!el) return;
  const w = rqW(sd);
  el.scrollIntoView({ block: 'center', behavior: 'instant' }); el.focus();
  if (el.tagName === 'SELECT') {
    rqCard({ step: RQ.cardStep, t: RQ.cardT, b: RQ.cardB, side: sd, el });
    await rqSleep(500); el.value = text; el.dispatchEvent(new w.Event('change', { bubbles: true })); await rqSleep(400); return;
  }
  el.value = '';
  const chunk = Math.max(1, Math.ceil(text.length / 40));
  for (let i = 0; i < text.length; i += chunk) {
    el.value = text.slice(0, i + chunk);
    el.dispatchEvent(new w.Event('input', { bubbles: true }));
    if (i === 0) rqCard({ step: RQ.cardStep, t: RQ.cardT, b: RQ.cardB, side: sd, el });
    await rqSleep(32);
  }
  el.value = text; el.dispatchEvent(new w.Event('input', { bubbles: true }));
  await rqSleep(250);
  try { el.blur(); window.focus(); } catch (_) { /* */ }
}
function rqCloseModals() { ['r', 'l'].forEach((sd) => { try { const w = rqW(sd); rqDoc(sd).querySelectorAll('.modal-bg').forEach((m) => m.remove()); const p = rqDoc(sd).getElementById('bellPanel'); p && p.remove(); w.App.dirty = false; } catch (_) { /* */ } }); }
/* مزامنة البيانات من جهة إلى الأخرى، ثم إظهار الإشعار الجديد في جرس المستلم */
async function rqSync(from, to, { bell = true, title } = {}) {
  const wf = rqW(from), wt = rqW(to);
  if (from !== to) { wt.sbxImport(wf.sbxExport()); wt.renderShell(); wt.route(); await rqSleep(350); }
  return bell ? rqBell(to, title) : null;
}
/* يُظهر أحدث إشعار وصل لحساب هذه الجهة ولم يُعرض بعد في الاستعراض */
async function rqBell(to, title) {
  const wt = rqW(to);
  RQ.shown = RQ.shown || new Set();
  const fresh = (wt.sbxD().settings.notifs || []).filter((n) => !RQ.base.has(n.id) && !RQ.shown.has(n.id) && wt.notifForMe(n));
  if (!fresh.length) return null;
  fresh.forEach((n) => RQ.shown.add(n.id));
  const b = rqDoc(to).querySelector('#topbar [data-bell]');
  if (b) { b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); }
  await rqPoint(to, b, { step: 'إشعار', t: title || 'وصل إشعار جديد', b: `<p>${esc(fresh[0].t)}</p>` }, 1400);
  const p = wt.toggleBell(true);
  await new Promise((r) => setTimeout(r, 60));
  const it = p && p.querySelector(`[data-bellid="${fresh[0].id}"]`);
  await rqPoint(to, it || p, { step: 'إشعار', t: title || 'وصل إشعار جديد', b: `<p><b>${esc(fresh[0].t)}</b></p>${fresh[0].b ? `<p class="small">${esc(fresh[0].b)}</p>` : ''}<p class="small muted">الإشعار يصل للحساب المعني فقط، ويفتح السجل مباشرة.</p>` }, 3000);
  p && p.remove();
  return fresh[0];
}
const rqRecOf = (sd) => { const D_ = rqW(sd).sbxD(); return (RQ.kind === 'proposal' ? D_.proposals : D_.partnerships).find((x) => x.id === RQ.rec.id); };
const rqHref = () => (RQ.kind === 'proposal' ? '#/proposals/' + RQ.rec.id : '#/partnerships/' + RQ.rec.id);
const rqSig = (sd) => JSON.stringify((rqRecOf(sd).wf || {}).steps || {});
const rqStepLbl = (s) => `المرحلة ${s.n} من ${WF_STEPS.length}`;
function rqAccLabel(actor) { return wfExternal(actor) ? `${wfActorName('partnerships')} — تسجيل خطاب ${wfActorName(actor)}` : actor === 'partnerships' ? wfActorName('partnerships') : actor === 'requester' || actor === 'concerned' ? RQ.req : wfActorName(actor); }

/* — المشاهد — */
async function rqIntro() {
  rqAs('r', rqSess('requester', RQ.req), RQ.req, true);
  rqAs('l', rqSess('partnerships', RQ.req), wfActorName('partnerships'), true);
  rqActive(null);
  const fin = wfFinal();
  rqCard({ step: 'نسخة معزولة — لا تُحفظ أي بيانات', t: 'مسار طلب الشراكة', wide: true, b: `<p>نتابع طلبًا واحدًا من تقديمه عبر «شارك» حتى قراره النهائي، في ${WF_STEPS.indexOf(fin) + 1} مراحل مأخوذة من تعريف المسار المعتمد في المنصة.</p>
    <ul class="rq-ul"><li><b>يمين:</b> الجهة الطالبة (${esc(RQ.req)}).</li><li><b>يسار:</b> الجهة التي عليها الدور، ويتغير عنوانها مع كل مرحلة.</li><li>الشريط العلوي يبيّن المرحلة الحالية، والجهة الخاملة تظهر باهتة.</li></ul>` });
  await rqSleep(5200);
}
async function rqShare() {
  const sd = 'r';
  rqAs('r', rqSess('requester', RQ.req), RQ.req, true);
  await rqGo(sd, '#/share/new');
  const d = rqDoc(sd);
  const req = shareReq();
  await rqPoint(sd, '.wiz-wrap', { step: 'الجهة الطالبة', t: 'نموذج «شارك»', b: `<p>تبدأ الإدارة طلبها من خدمة «شارك». الحقول الإلزامية: ${req.map((f) => `<b>${esc(f.l)}</b>`).join('، ')}.</p>` }, 2600);
  const fields = shareFields().filter((f) => f.req || f.demo || ['goal', 'init'].includes(f.kind));
  for (const st of S_STEPS.filter((x) => x.id !== 'review')) {
    const fl = fields.filter((f) => f.step === st.id); if (!fl.length) continue;
    const tab = d.querySelector(`[data-ws="${st.id}"]`); if (tab && !tab.classList.contains('on')) { tab.click(); await rqSleep(350); }
    for (const f of fl) {
      RQ.cardStep = 'الجهة الطالبة · ' + st.t; RQ.cardT = f.l + (f.req ? ' (إلزامي)' : ''); RQ.cardB = `<p>${f.req ? 'حقل إلزامي لا يُرسل الطلب بدونه.' : 'حقل اختياري يساعد إدارة الشراكات في الدراسة.'}</p>`;
      const el = d.getElementById('s_' + f.k);
      if (el && el.tagName === 'SELECT' && el.value && f.kind === 'dept') { await rqPoint(sd, el, { step: RQ.cardStep, t: RQ.cardT, b: '<p>محددة تلقائيًا من حساب الإدارة.</p>' }, 1500); continue; }
      await rqType(sd, el, rqDemo(f, d));
    }
  }
  const rv = d.querySelector('[data-ws="review"]'); rv && rv.click(); await rqSleep(400);
  await rqPoint(sd, '.review-sum', { step: 'الجهة الطالبة', t: 'مراجعة قبل الإرسال', b: '<p>ملخص الطلب كما سيصل إلى إدارة الشراكات، ويمكن تعديل أي قسم قبل الإرسال.</p>' }, 2600);
}
async function rqSubmit() {
  const sd = 'r', d = rqDoc(sd);
  if (!d.querySelector('[data-submit]')) { await rqShare(); }
  const btn = rqDoc(sd).querySelector('[data-submit]');
  await rqPoint(sd, btn, { step: 'الجهة الطالبة', t: 'إرسال الطلب', b: '<p>يتحقق النظام من الحقول الإلزامية ثم يرسل الطلب.</p>' }, 1600);
  btn.click();
  const ref = await rqWaitFor(sd, '#refv', 5000);
  const D_ = rqW(sd).sbxD();
  const x = D_.proposals[D_.proposals.length - 1];
  if (!ref || !x) throw new Error('لم يُرسل الطلب: ' + [...rqDoc(sd).querySelectorAll('.err-sum li')].map((l) => l.textContent).join('، '));
  RQ.rec = { id: x.id }; RQ.kind = 'proposal';
  await rqPoint(sd, '.ref', { step: 'الجهة الطالبة', t: 'الرقم المرجعي والحالة الأولى', b: `<p>حصل الطلب على الرقم <b dir="ltr">${esc(x.ref)}</b>، وحالته الأولى «${esc(propStatusLabel(x.status))}».</p>` }, 3200);
  rqAs('l', rqSess('partnerships', RQ.req), wfActorName('partnerships'), true);
  await rqSync('r', 'l', { title: 'وصل الطلب إلى ' + wfActorName('partnerships') });
}
async function rqConvert() {
  const sd = 'l';
  rqAs(sd, rqSess('partnerships', RQ.req), wfActorName('partnerships'));
  await rqGo(sd, '#/proposals/' + RQ.rec.id);
  const w = rqW(sd), x = w.sbxD().proposals.find((p) => p.id === RQ.rec.id);
  await rqPoint(sd, '.wf-wrap', { step: 'تحويل الطلب', t: 'من طلب إلى سجل شراكة', b: `<p>بعد قبول الطلب تحوّله ${esc(wfActorName('partnerships'))} إلى سجل شراكة تُستكمل فيه بقية المراحل، وتنتقل إليه البيانات والمستندات.</p>` }, 3000);
  const sim = w.findSimilarPartners(x.partnerName);
  const p = await w.convertProposal(x, sim.length ? { partnerId: sim[0].id } : { newPartner: { name: x.partnerName, sector: x.partnerSector } });
  RQ.rec = { id: p.id }; RQ.kind = 'partnership';
  await rqGo(sd, rqHref());
  await rqPoint(sd, '#wf', { step: 'تحويل الطلب', t: 'سجل الشراكة ' + (p.code || ''), b: '<p>أُنشئ السجل بمرحلة «قيد الإعداد»، ويظهر فيه مسار المذكرة كاملًا.</p>' }, 2800);
  await rqSync('l', 'r', { title: 'إشعار للجهة الطالبة' });
}
/* — نماذج الخطوة: يُفتح النموذج للتعبئة، ثم يظهر مستنده المكتمل بتصميم المنظومة (داخل النسخة المعزولة) — */
const rqG = (w, name) => w.eval(name); // ثوابت النسخة المعزولة (const لا تظهر على window)
const RQ_TXT = {
  m1: 'دعم مشروعات التشجير وتنمية الغطاء النباتي بخبرات فنية وتطوعية.', m2: 'للجهة برامج مجتمعية وبيئية قائمة تتوافق مع أهداف المؤسسة.', m3: 'فريق فني متخصص ومتطوعون مدرَّبون.',
  m4: 'رفع أعداد المتطوعين، وتوسيع أثر التشجير، ونقل المعرفة.', m5: 'عُقد اجتماع تنسيقي لتحديد المجالات ذات الأولوية.', m6: 'برامج تشجير مشتركة، وتطوع، وتوعية مجتمعية.',
  m7: 'إعداد المذكرة ومراجعتها من الإدارات المعنية والقانونية.', m8: 'خطة تفعيل بمبادرات ربعية ومؤشرات قياس.', purpose: 'تعزيز التعاون في التشجير والتوعية البيئية والعمل التطوعي.',
  impact: 'زيادة الغطاء النباتي ورفع مشاركة المجتمع في المبادرات البيئية.', recNote: 'الجهة ذات سمعة جيدة وبرامجها متوافقة مع رسالة المؤسسة.', notes: 'لا ملاحظات جوهرية.',
};
function rqFormData(w, kind, rec, key) {
  const F = rqG(w, 'FORMS')[key], R = w.fRecInfo(kind, rec), d = {};
  const opts = (f) => (typeof f.opts === 'function' ? f.opts() : f.opts) || [];
  F.sections(R, rec).forEach((sec) => sec.fields.forEach((f) => {
    const def = typeof f.def === 'function' ? f.def() : f.def;
    if (def !== undefined && def !== '' && !(Array.isArray(def) && !def.length)) { d[f.k] = def; return; }
    const o = opts(f);
    if (f.type === 'checklist') d[f.k] = Object.fromEntries(f.items.map((_, i) => [i, { v: (f.opts[0] || [])[0] }]));
    else if (f.type === 'scores') d[f.k] = Object.fromEntries(f.items.map((c) => [c.k, { v: 4 }]));
    else if (f.type === 'clauses') { const G = rqG(w, 'goalCodes')(); d[f.k] = (R.coop.length ? R.coop : ['برامج تشجير مشتركة', 'التوعية البيئية والعمل التطوعي']).map((t, i) => ({ text: t, goals: G.length ? [G[i % G.length].k] : [], note: '' })); }
    else if (f.type === 'multi') d[f.k] = o.slice(0, 2);
    else if (f.type === 'chips' || f.type === 'select') { if (f.auto) return; d[f.k] = o[0] || ''; }
    else if (f.type === 'date') d[f.k] = new Date().toISOString().slice(0, 10);
    else if (f.type === 'number') d[f.k] = f.req ? 250000 : '';
    else if (f.type === 'textarea' || f.type === 'text') d[f.k] = RQ_TXT[f.k] || (f.req ? (f.type === 'text' ? rqG(w, 'Session').userName() : 'بيانات للاستعراض.') : '');
  }));
  if (key === 'initialEval') { const sc = w.ievScore(d); d.rec = w.ievResult(sc); }
  return d;
}
async function rqForms(sd, s) {
  const w = rqW(sd), d = rqDoc(sd);
  for (const doc of s.docs.filter((x) => x.form && rqG(w, 'FORMS')[x.form])) {
    const key = doc.form, F = rqG(w, 'FORMS')[key];
    const [kind, rec] = w.wfFormOwner ? w.wfFormOwner(RQ.kind, rqRecOf(sd), key) : [RQ.kind, rqRecOf(sd)];
    if (((rec.forms || {})[key] || {}).status === 'done') continue;
    /* 1) نافذة التعبئة كما يراها المسؤول */
    w.openForm(kind, rec, key, { onDone: () => {} });
    const m = await rqWaitFor(sd, '.modal-bg .modal');
    if (m) {
      await rqPoint(sd, m, { step: rqStepLbl(s), t: F.title, b: `<p>${esc(doc.l)} يُعبّأ داخل المنظومة في هذه المرحلة${doc.req ? ' (مستند إلزامي)' : ''}.</p><p class="small">الحقول تأتي معبأة من بيانات الطلب والشراكة قدر الإمكان، ويكمل المسؤول الباقي ثم «إتمام النموذج».</p>` }, 3600);
      const body = m.querySelector('.modal-b, .modal-body'); if (body) { body.scrollTo({ top: body.scrollHeight / 2, behavior: 'smooth' }); await rqSleep(1300); }
    }
    d.querySelectorAll('.modal-bg').forEach((x) => x.remove());
    /* 2) حفظ النموذج مكتملًا ثم عرض مستنده المصمم */
    const data = rqFormData(w, kind, rec, key);
    rec.forms = rec.forms || {};
    rec.forms[key] = { data, status: 'done', at: new Date().toISOString(), by: rqG(w, 'Session').userName(), byDept: D.settings.org.dept, no: w.formNumber(key) };
    if (F.out) F.out(rec, data, kind);
    w.formPreview(kind, rec, key);
    const pv = await rqWaitFor(sd, '.fdoc-modal .modal, .modal-bg .modal');
    if (pv) {
      await rqPoint(sd, pv, { step: rqStepLbl(s), t: F.title + ' — بعد الإتمام', b: `<p>هذا مستند النموذج كما يُحفظ في ملف ${RQ.kind === 'proposal' ? 'الطلب' : 'الشراكة'} برقم <b dir="ltr">${esc(rec.forms[key].no)}</b>، بتصميم نماذج المنظومة.</p><p class="small">يُطبع أو يُنزّل Word من النافذة نفسها، ويظهر في «الملف الشامل».</p>` }, 3000);
      const b2 = pv.querySelector('.fdoc-prev, .modal-b'); if (b2) { b2.scrollTo({ top: b2.scrollHeight, behavior: 'smooth' }); await rqSleep(2200); }
    }
    d.querySelectorAll('.modal-bg').forEach((x) => x.remove());
  }
}
/* مشهد الختام بعد التفعيل */
async function rqEnd() {
  const rec = rqRecOf('l') || rqRecOf('r'); RQ.ended = true; rqActive(null);
  const forms = Object.keys((rec && rec.forms) || {}).concat(Object.keys(((rqW('l').sbxD().proposals.find((x) => rec && x.id === rec.proposalId) || {}).forms) || {}));
  rqCard({ step: 'نهاية الاستعراض', t: 'اكتمل المسار من الطلب إلى التفعيل', wide: true, b: `<p>مرّ الطلب بـ${WF_STEPS.length} مرحلة: من «شارك» إلى التقييم والمذكرة والاعتماد والتوقيع، ثم خطة التفعيل وتقارير الإدارات.</p>
    ${forms.length ? `<p class="small"><b>النماذج التي عُبّئت في المسار:</b> ${[...new Set(forms)].map((k) => esc((FORMS[k] || {}).short || (FORMS[k] || {}).title || k)).join('، ')}.</p>` : ''}
    <p class="small muted">كل ما جرى كان في نسخة معزولة؛ بيانات المنصة وإشعاراتها كما هي.</p><div class="row" style="gap:8px;margin-top:12px"><button class="btn" type="button" data-rqreplay>${icon('history')} إعادة الاستعراض</button><button class="btn primary" type="button" data-rq="end">إنهاء</button></div>` });
  rqPlace();
}
/* تجهيز مستندات المثال المطلوبة للخطوة (داخل النسخة المعزولة فقط) */
function rqDocs(sd, s) {
  const w = rqW(sd), rec = rqRecOf(sd), sess = w.sbxSession();
  rec.attachments = rec.attachments || [];
  s.docs.filter((d) => d.req && !d.form && !rec.attachments.some((a) => a.doc === d.k && (s.kind !== 'multi' || a.byDept === sess.dept))).forEach((d) => rec.attachments.push({ id: 'sbx-' + Math.random().toString(36).slice(2), fileId: 'sbx:' + d.k, name: d.l + '.pdf', type: 'application/pdf', size: 120000, category: WF_CAT, wf: s.id, doc: d.k, byDept: sess.role === 'dept' ? sess.dept : D.settings.org.dept, addedAt: new Date().toISOString(), by: 'استعراض' }));
}
function rqFill(sd, s) {
  const d = rqDoc(sd), today_ = new Date(), iso = (dt) => dt.toISOString().slice(0, 10);
  const set = (sel, v) => { const e = d.querySelector(sel); if (e) { e.value = v; e.dispatchEvent(new (rqW(sd).Event)('input', { bubbles: true })); } };
  (s.fields || []).forEach((f) => {
    if (f === 'date') set('#wfDate', iso(today_));
    if (f === 'intersection') set('#wfInt', 'التشجير وزيادة الغطاء النباتي');
    if (f === 'coop') set('#wfCoop', 'برامج تشجير مشتركة، وتطوع، وتوعية مجتمعية.');
    if (f === 'dates') { const e = new Date(today_); e.setFullYear(e.getFullYear() + 2); set('#wfStart', iso(today_)); set('#wfEnd', iso(e)); }
  });
}
async function rqOpenStep(sd, s, intro) {
  const actor = sd === 'r' ? (s.actor === 'concerned' ? 'concerned' : 'requester') : s.actor;
  rqAs(sd, rqSess(actor === 'concerned' || actor === 'requester' ? actor : s.actor, RQ.req), rqAccLabel(actor));
  await rqGo(sd, rqHref());
  const w = rqW(sd);
  if (intro !== false) await rqBell(sd, 'وصل إشعار إلى ' + rqAccLabel(actor));
  const row = rqDoc(sd).querySelector(`[data-wfs="${s.id}"]`);
  if (intro !== false) {
    const docs = s.docs.filter((d) => d.req).map((d) => d.l);
    await rqPoint(sd, row || '#wf', { step: rqStepLbl(s), t: s.t, b: `<p>${esc(wfDesc(s))}</p><p class="small"><b>المسؤول:</b> ${esc(wfActorName(s.actor))}${docs.length ? `<br><b>المطلوب:</b> ${docs.map(esc).join('، ')}` : ''}</p>` }, 4200);
  }
  if (intro !== false) await rqForms(sd, s);
  rqDocs(sd, s);
  w.wfStepDialog(RQ.kind, rqRecOf(sd), s.id, () => w.route());
  await rqWaitFor(sd, '.wf-modal');
  rqFill(sd, s);
  return w;
}
async function rqDo(sd, s, act, note, label) {
  const d = rqDoc(sd);
  if (note) { RQ.cardStep = rqStepLbl(s); RQ.cardT = act === 'reject' ? 'سبب الرفض' : act === 'dept' ? 'ملاحظات الإدارة' : 'ملاحظة الإعادة'; RQ.cardB = `<p>${act === 'dept' ? 'تكتب الإدارة ملاحظاتها من حسابها.' : 'الملاحظة إلزامية عند الإعادة أو الرفض، وتظهر للجهة المعنية في الإشعار.'}</p>`; await rqType(sd, d.querySelector('#wfNote'), note); }
  const b = d.querySelector(`.wf-modal [data-wfdo="${act}"]`);
  if (!b) throw new Error(`لا يوجد إجراء «${label || act}» في المرحلة «${s.t}» لهذا الحساب`);
  await rqPoint(sd, b, { step: rqStepLbl(s), t: label || b.textContent.trim(), b: `<p>${act === 'return' || act === 'no' ? 'تُعاد الخطوة بالملاحظة المكتوبة، ويصل إشعار للجهة المطلوب منها الاستكمال.' : act === 'reject' ? 'يُغلق الطلب بالسبب المكتوب، ويصل الإشعار للجهة الطالبة.' : 'تُسجَّل الخطوة باسم الحساب ووقته، وتنتقل المعاملة تلقائيًا للمرحلة التالية.'}</p>` }, 1800);
  const sig = rqSig(sd);
  b.click();
  for (let k = 0; k < 40 && rqSig(sd) === sig; k++) await new Promise((r) => setTimeout(r, 60));
  if (rqSig(sd) === sig) throw new Error('لم يكتمل الإجراء: ' + ([...d.querySelectorAll('.toast')].map((t) => t.textContent).pop() || 'تحقق من متطلبات المرحلة'));
  await rqSleep(400);
  d.querySelectorAll('.modal-bg').forEach((m) => m.remove());
}
async function rqAfter(sd, s) {
  await rqGo(sd, rqHref());
  const w = rqW(sd), st = w.wfStateOf(RQ.kind, rqRecOf(sd));
  await rqPoint(sd, '.wf-cur', { step: rqStepLbl(s), t: 'تغيّرت الحالة', b: `<p>${st.closed ? 'أُغلق المسار.' : st.cur ? `انتقلت المعاملة إلى المرحلة ${st.cur.n}: <b>${esc(st.cur.t)}</b> — لدى ${esc(wfActorName(st.cur.actor))}.` : 'اكتمل المسار.'}</p>` }, 2600);
  return st;
}
async function rqStep(sc) {
  const s = sc.step;
  const sd = rqSide(s.actor);
  if (s.kind === 'multi') {
    // كل إدارة معنية ترسل ملاحظاتها من حسابها، ثم تعتمدها إدارة الشراكات إن لزم
    await rqOpenStep('r', s);
    await rqDo('r', s, 'dept', 'لا ملاحظات جوهرية، ونقترح إضافة مؤشر لعدد المتطوعين.', 'إرسال ملاحظات الإدارة');
    await rqSync('r', 'l', { title: 'وصلت ملاحظات الإدارة' });
    const st = rqW('l').wfStateOf(RQ.kind, rqRecOf('l'));
    if (st.cur && st.cur.id === s.id) { await rqOpenStep('l', { ...s, actor: 'partnerships' }, false); await rqDo('l', s, 'close', '', 'اعتماد الملاحظات والانتقال'); await rqAfter('l', s); await rqSync('l', 'r', { title: 'إشعار للجهة الطالبة' }); }
    else await rqAfter('r', s);
    return;
  }
  await rqOpenStep(sd, s);
  const { act, label } = rqAct(s, sd);
  await rqDo(sd, s, act, '', label);
  await rqAfter(sd, s);
  await rqSync(sd, sd === 'l' ? 'r' : 'l', { title: sd === 'l' ? 'إشعار للجهة الطالبة' : 'إشعار للجهة التالية' });
}
async function rqReturn(sc) {
  const s = sc.step, back = wfStep(s.back), sd = rqSide(s.actor);
  await rqOpenStep(sd, s);
  await rqDo(sd, s, s.kind === 'review' && !s.yes ? 'return' : 'no', 'يُرجى ربط بند المبادرات بالهدف الاستراتيجي الثاني.', s.backLabel || s.no || 'إعادة بملاحظات');
  await rqAfter(sd, s);
  // الجهة المطلوب منها الاستكمال تتلقى الإشعار وتحدّث المستند
  const bs = rqSide(back.actor);
  rqAs(bs, rqSess(back.actor, RQ.req), rqAccLabel(back.actor));
  await rqSync(sd, bs, { title: 'إعادة للاستكمال' });
  if (bs !== 'r') await rqSync(sd, 'r', { bell: false });
  await rqGo(bs, rqHref());
  const w = rqW(bs), rec = rqRecOf(bs);
  const doc = back.docs.find((d) => d.req) || back.docs[0];
  if (doc) rec.attachments.push({ id: 'sbx-' + Math.random().toString(36).slice(2), fileId: 'sbx:' + doc.k + '2', name: doc.l + ' (محدّثة).pdf', type: 'application/pdf', size: 130000, category: WF_CAT, wf: s.id, doc: (s.docs.find((d) => d.by === 'partnerships') || doc).k, byDept: D.settings.org.dept, addedAt: new Date().toISOString(), by: 'استعراض' });
  w.route(); await rqSleep(300);
  await rqPoint(bs, `[data-wfs="${s.id}"]`, { step: rqStepLbl(s), t: 'استكمال الملاحظات', b: `<p>${esc(wfActorName(back.actor))} تعالج الملاحظة وترفع ${doc ? `«${esc(doc.l)}» محدّثة` : 'النسخة المحدّثة'}، فتعود المرحلة للمراجعة دون فتح طلب جديد.</p>` }, 3400);
  if (bs !== sd) await rqSync(bs, sd, { bell: false });
  // ثم الاعتماد بعد الاستكمال
  await rqOpenStep(sd, s, false);
  const { act, label } = rqAct(s, sd);
  await rqDo(sd, s, act, '', label);
  await rqAfter(sd, s);
  await rqSync(sd, sd === 'l' ? 'r' : 'l', { title: 'إشعار للجهة الطالبة' });
}
async function rqFinal(sc) {
  const s = sc.step, sd = rqSide(s.actor);
  await rqOpenStep(sd, s);
  rqActive(sd);
  const c = $('#rqTour .rq-card');
  rqCard({ step: rqStepLbl(s) + ' · الاعتماد النهائي', t: 'القرار النهائي', side: sd, b: `<p>${esc(wfActorName(s.actor))} هي جهة الاعتماد النهائي${wfExternal(s.actor) ? `، ويصل ردها بخطاب تسجّله ${esc(wfActorName('partnerships'))} بإرفاقه` : ''}. اختر النهاية التي تريد مشاهدتها:</p>` });
  const ch = $('.rq-choice', c); ch.hidden = false;
  ch.innerHTML = `<button class="btn primary" type="button" data-rqchoice="yes">${icon('check')} ${esc(s.yes || 'اعتماد')}</button>${s.reject ? `<button class="btn danger" type="button" data-rqchoice="reject">${icon('x')} ${esc(s.reject)}</button>` : ''}`;
  rqPlace();
  const choice = RQ.fast && RQ.choice ? RQ.choice : await new Promise((res) => { RQ.waitChoice = res; });
  RQ.waitChoice = null; RQ.choice = choice; ch.hidden = true;
  if (choice === 'reject') await rqDo(sd, s, 'reject', 'لا تتوافق مدة المذكرة مع خطة المؤسسة للعام القادم.', s.reject);
  else await rqDo(sd, s, rqAct(s, sd).act, '', s.yes || 'اعتماد');
  const st = await rqAfter(sd, s);
  await rqSync(sd, 'r', { title: choice === 'reject' ? 'إشعار الرفض للجهة الطالبة' : 'إشعار الاعتماد للجهة الطالبة' });
  const rec = rqRecOf('r');
  const after = WF_STEPS.slice(WF_STEPS.indexOf(s) + 1);
  if (choice !== 'reject' && after.length) {
    rqActive(null);
    rqCard({ step: rqStepLbl(s), t: 'اعتُمدت المذكرة', wide: true, b: `<p>نكمل ما بعد الاعتماد: ${after.map((x) => esc(x.t)).join(' ← ')}.</p>` });
    rqPlace(); await rqSleep(3200); return;
  }
  rqActive(null); RQ.ended = true;
  rqCard({ step: 'نهاية الاستعراض', t: choice === 'reject' ? 'أُغلق الطلب بالرفض' : 'اعتُمدت الشراكة', wide: true, b: choice === 'reject'
    ? `<p>الحالة النهائية: <b>${esc(stageLabel(rec.stage))}</b>. السبب: ${esc(rec.closedReason || '')}</p><p class="small">وصل إشعار بالسبب إلى ${esc(RQ.req)} وإلى ${esc(wfActorName('partnerships'))}.</p>`
    : `<p>الحالة: <b>${esc(s.yes || 'معتمدة')}</b>${st.cur ? ` — التالي: ${esc(st.cur.t)}` : ''}.</p>${after.length ? `<p class="small">بعد الاعتماد: ${after.map((x) => esc(x.t)).join(' ← ')}.</p>` : ''}<p class="small">وصل إشعار الاعتماد إلى ${esc(RQ.req)}.</p>`
    + '' });
  const b = $('#rqTour .rq-card .tour-body');
  b.insertAdjacentHTML('beforeend', `<p class="small muted">كل ما جرى كان في نسخة معزولة؛ بيانات المنصة وإشعاراتها كما هي.</p><div class="row" style="gap:8px;margin-top:12px"><button class="btn" type="button" data-rqreplay>${icon('history')} إعادة</button><button class="btn primary" type="button" data-rqclose>إنهاء</button></div>`);
  rqPlace();
}
