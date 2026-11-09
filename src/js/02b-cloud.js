/* =====================================================================
   المنصة المشتركة (Supabase)
   - كل الحسابات تعمل على نفس البيانات: أي حفظ يُرفع فورًا، وتعديلات الآخرين تُسحب كل بضع ثوانٍ.
   - تسجيل الدخول يتم على الخادم (كلمات المرور bcrypt هناك)، والجلسة رمز يُتحقق منه في كل طلب.
   - المتصفح يحتفظ بنسخة محلية (IndexedDB) للعرض السريع وللعمل عند انقطاع الاتصال،
     والتعديلات غير المرفوعة تُحفظ في «صندوق الصادر» وتُرفع عند عودة الاتصال.
   - الإعدادات وثيقة واحدة يعدّلها الجميع (الإشعارات مثلًا)، فتُدمج التعديلات المتزامنة بدل أن تطغى إحداها على الأخرى.
   - بيانات الجلسة (الحساب الحالي) وبصمات كلمات المرور المحلية لا تُرفع أبدًا.
   المفتاح أدناه هو المفتاح العام (publishable): مصمَّم ليكون داخل الواجهة، ولا يفتح أي جدول مباشرة.
   ===================================================================== */
const CLOUD_DEF = { url: 'https://rrxbshacfuacokrvqtmc.supabase.co', key: 'sb_publishable_PXEDuOzZDCV-yn_F-fFB7g_EoRqDMt6' };
const CLOUD_DB = 'sharakat-platform-cloud';
const Cloud = {
  on: false, ready: false, applying: false, busy: false, url: '', key: '',
  rev: 0, sRev: 0, sBase: null, out: {}, fout: [], grp: null, state: 'idle', pwSet: null, pendingUI: false, expiredShown: false,
  kickT: null, pollT: null,
};
const CLOUD_RAW = { put: Store.put, putMany: Store.putMany, del: Store.del, clear: Store.clear, putFile: Store.putFile, getFile: Store.getFile, delFile: Store.delFile };
const CLOUD_CHUNK = 4 * 1024 * 1024; // كل جزء ≈ 5.6 ميجا بعد base64
/* ضغط بلا فقد للمستندات أثناء النقل والتخزين (gzip): الملف يعود مطابقًا للأصل بايتًا ببايت */
async function cloudGzip(blob, type) {
  if (typeof CompressionStream === 'undefined' || /^(image|video|audio)\/|zip|compressed|officedocument|opendocument|rar|7z/.test(type || '')) return null;
  try { const z = await new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob(); return z.size < blob.size * 0.95 ? z : null; } catch (_) { return null; }
}
async function cloudGunzip(blob) { return new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).blob(); }
const cloudB64 = async (blob) => String(await blobToDataURL(blob)).replace(/^data:[^,]*,/, '');
const cloudFromB64 = async (b64, type) => (await fetch(`data:${type || 'application/octet-stream'};base64,${b64}`)).blob();
const cloudRaw = (m, ...a) => CLOUD_RAW[m].apply(Store, a);

function cloudInit() {
  if (window.__SBX) return;
  const cfg = { ...CLOUD_DEF };
  try {
    if (localStorage.getItem('shk_cloud_off') || sessionStorage.getItem('shk_cloud_skip')) return;
    if (navigator.webdriver) { // الاختبارات الآلية تعمل محليًا إلا إذا طُلب غير ذلك صراحة
      if (!localStorage.getItem('shk_cloud_force')) return;
      cfg.url = localStorage.getItem('shk_cloud_url') || cfg.url; cfg.key = localStorage.getItem('shk_cloud_key') || cfg.key;
    }
  } catch (_) { return; }
  Cloud.on = true; Cloud.url = cfg.url.replace(/\/+$/, ''); Cloud.key = cfg.key;
  Store.dbName = CLOUD_DB;
  try {
    const st = JSON.parse(localStorage.getItem('shk_cloud') || 'null');
    if (st && st.url === Cloud.url) { Cloud.rev = +st.rev || 0; Cloud.sRev = +st.sRev || 0; Cloud.out = st.out || {}; Cloud.fout = st.fout || []; }
  } catch (_) { /* حالة تالفة: نبدأ من جديد */ }
  window.addEventListener('online', () => Cloud.kick());
  window.addEventListener('focus', () => cloudTick());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cloudTick(); });
}
/* مسح نسخة البيانات المحفوظة على هذا الجهاز (عند الخروج دون «تذكّرني»)؛ لا يمسح إن بقيت تعديلات لم تُرفع */
Store.wipeLocal = async function () {
  if (Object.keys(Cloud.out || {}).length || Object.keys(Cloud.fout || {}).length) return false;
  try { if (Store.db) Store.db.close(); } catch (_) { /* */ }
  await new Promise((r) => { const q = indexedDB.deleteDatabase(CLOUD_DB); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  Cloud.rev = 0; Cloud.sRev = 0; Cloud.save();
  return true;
};
Cloud.save = function () { try { localStorage.setItem('shk_cloud', JSON.stringify({ url: this.url, rev: this.rev, sRev: this.sRev, out: this.out, fout: this.fout })); } catch (_) { /* */ } };
Cloud.token = function () { try { const s = JSON.parse(localStorage.getItem('shk_auth') || sessionStorage.getItem('shk_auth') || 'null'); return (s && s.tk) || null; } catch (_) { return null; } };
Cloud.pending = function () { return Object.keys(this.out).length + this.fout.length; };

Cloud.rpc = async function (fn, args = {}) {
  const ctl = new AbortController(), big = /file/.test(fn);
  const t = setTimeout(() => ctl.abort(), big ? 180000 : 30000);
  let r;
  try { r = await fetch(`${this.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: this.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: ctl.signal }); }
  catch (e) { const er = new Error('تعذّر الاتصال بالخادم'); er.offline = true; throw er; }
  finally { clearTimeout(t); }
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (_) { /* */ }
  if (!r.ok) {
    const er = new Error((j && (j.message || j.msg)) || 'HTTP ' + r.status); er.code = j && j.message; er.status = r.status;
    if (er.code === 'invalid_token') this.expired();
    throw er;
  }
  return j;
};
Cloud.setState = function (s) {
  this.state = s;
  const el = document.querySelector('#topbar [data-cloud]'); if (!el) return;
  el.dataset.cloud = s; el.title = cloudStateText(); el.setAttribute('aria-label', el.title);
};
function cloudStateText() {
  const n = Cloud.pending();
  return { ok: 'متصل — كل التعديلات محفوظة على المنصة المشتركة', sync: 'جارٍ الحفظ على المنصة المشتركة…', off: `غير متصل — ${n ? `${n} تعديل محفوظ على هذا الجهاز وسيُرفع تلقائيًا عند عودة الاتصال` : 'تعرض آخر نسخة محفوظة على الجهاز'}`, local: 'المنصة المشتركة لم تُهيّأ بعد — التعديلات على هذا الجهاز فقط', idle: 'المنصة المشتركة' }[Cloud.state] || '';
}
function cloudBadgeHTML() {
  if (!Cloud.on) return '';
  return `<button class="icon-btn cloud-st" type="button" data-cloud="${Cloud.state}" data-cloudbtn title="${esc(cloudStateText())}" aria-label="${esc(cloudStateText())}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 9.5z"/><path class="cs-ok" d="m9.5 13.2 2 2 3.5-3.7"/><path class="cs-off" d="M9.5 11.5l5 5m0-5-5 5"/></svg><i class="cs-dot"></i></button>`;
}

/* ===== تسجيل التعديلات المحلية في صندوق الصادر ===== */
Cloud.mark = function (col, id, del) {
  if (!this.on || !this.ready || this.applying || this.grp === 'viewer' || !id) return;
  if (col === 'settings' && id !== 'main') return;
  const k = col + '|' + id, e = this.out[k];
  this.out[k] = { col, id, del: !!del, v: (e ? e.v : 0) + 1 };
  this.save(); this.kick();
};
Cloud.markFile = function (id) {
  if (!this.on || !this.ready || this.applying || this.grp === 'viewer' || !id || /^(lib|asset|sbx):/.test(id)) return;
  if (!this.fout.includes(id)) this.fout.push(id);
  this.save(); this.kick();
};
Cloud.kick = function () { if (!this.on || !this.ready) return; clearTimeout(this.kickT); this.kickT = setTimeout(() => this.flush().catch(() => {}), 350); };

Store.put = async function (c, o) { await cloudRaw('put', c, o); Cloud.mark(c, o && o.id); };
Store.putMany = async function (c, arr) { await cloudRaw('putMany', c, arr); (arr || []).forEach((o) => Cloud.mark(c, o && o.id)); };
Store.del = async function (c, id) { await cloudRaw('del', c, id); Cloud.mark(c, id, true); };
Store.putFile = async function (rec) { await cloudRaw('putFile', rec); Cloud.markFile(rec && rec.id); };
Store.delFile = async function (id) {
  await cloudRaw('delFile', id);
  if (!Cloud.on || !Cloud.ready || !id || /^(lib|asset|sbx):/.test(id)) return;
  Cloud.fout = Cloud.fout.filter((x) => x !== id); Cloud.save();
  if (Cloud.token() && Cloud.grp !== 'viewer') Cloud.rpc('shk_file_del', { p_token: Cloud.token(), p_id: id }).catch(() => {}); // توفير المساحة؛ إن فشل يبقى الملف دون ضرر
};
/* مرفق غير موجود على هذا الجهاز: يُجلب من الخادم مرة واحدة ثم يُحفظ محليًا */
Store.getFile = async function (id) {
  const r = await cloudRaw('getFile', id);
  if (r || !Cloud.on || !Cloud.token() || !id || /^(lib|asset|sbx):/.test(id)) return r;
  try {
    const f = await Cloud.rpc('shk_file_get', { p_token: Cloud.token(), p_id: id });
    if (!f) return null;
    const m = f.meta || {};
    let blob;
    if (m.chunks) { const parts = []; for (let n = 0; n < m.chunks; n++) { const d = await Cloud.rpc('shk_file_chunk_get', { p_token: Cloud.token(), p_id: id, p_n: n }); if (d == null) return null; parts.push(await cloudFromB64(d)); } blob = new Blob(parts); }
    else if (f.data) blob = await cloudFromB64(f.data);
    else return null;
    if (m.gz) blob = await cloudGunzip(blob);
    blob = new Blob([blob], { type: m.type || 'application/octet-stream' });
    const rec = { id, name: m.name || id, type: m.type || blob.type, size: m.size || blob.size, at: m.at, blob };
    await cloudRaw('putFile', rec);
    return rec;
  } catch (_) { return null; }
};

/* ===== أدوات المقارنة والدمج ===== */
function cloudEq(a, b) {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return a === b || (a == null && b == null);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => cloudEq(x, b[i]));
  const ka = Object.keys(a).filter((k) => a[k] !== undefined), kb = Object.keys(b).filter((k) => b[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => cloudEq(a[k], b[k]));
}
const cloudIdArr = (x) => Array.isArray(x) && x.length > 0 && x.every((o) => o && typeof o === 'object' && !Array.isArray(o) && o.id != null);
/* دمج ثلاثي: ما غيّره هذا الجهاز منذ آخر مزامنة يُطبَّق فوق نسخة الخادم */
function cloudMerge(base, mine, theirs) {
  if (cloudEq(mine, base)) return theirs;
  if (cloudEq(theirs, base) || theirs === undefined) return mine;
  if ((cloudIdArr(mine) || cloudIdArr(theirs)) && Array.isArray(mine) && Array.isArray(theirs)) {
    const B = new Map((Array.isArray(base) ? base : []).filter((o) => o && o.id != null).map((o) => [o.id, o]));
    const M = new Map(mine.map((o) => [o.id, o])), T = new Map(theirs.map((o) => [o.id, o]));
    const out = [];
    const ids = [...new Set([...theirs.map((o) => o.id), ...mine.map((o) => o.id)])];
    for (const id of ids) {
      const b = B.get(id), m = M.get(id), t = T.get(id);
      if (m && t) out.push(cloudMerge(b, m, t));
      else if (m && !t) { if (!b || !cloudEq(b, m)) out.push(m); } // حذفه الآخر ولم أعدّله: يبقى محذوفًا
      else if (t && !m) { if (!b || !cloudEq(b, t)) out.push(t); } // حذفته أنا ولم يعدّله الآخر: يبقى محذوفًا
    }
    return out;
  }
  if (mine && theirs && typeof mine === 'object' && typeof theirs === 'object' && !Array.isArray(mine) && !Array.isArray(theirs)) {
    const b = base && typeof base === 'object' ? base : {}, out = {};
    for (const k of new Set([...Object.keys(theirs), ...Object.keys(mine)])) {
      const v = cloudMerge(b[k], mine[k], theirs[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return mine;
}
const cloudCleanSettings = (s) => { const c = { ...(s || {}) }; delete c.session; delete c.auth; return JSON.parse(JSON.stringify(c)); };

/* ===== الرفع ===== */
Cloud.flush = async function () {
  if (!this.on || !this.ready || this.busy || !this.token() || this.grp === 'viewer') return;
  if (!this.pending()) { if (this.state !== 'ok') this.setState('ok'); return; }
  this.busy = true; this.setState('sync');
  try {
    for (let guard = 0; guard < 12 && Object.keys(this.out).length; guard++) {
      const batch = [], sent = {}; let size = 0, sentSettings = null;
      for (const k of Object.keys(this.out)) {
        const e = this.out[k]; let row;
        if (e.col === 'settings') { sentSettings = cloudCleanSettings(D.settings); row = { col: 'settings', id: 'main', data: sentSettings, base: this.sRev }; }
        else { const rec = e.del ? null : (D[e.col] || []).find((x) => x.id === e.id); row = rec ? { col: e.col, id: e.id, data: rec } : { col: e.col, id: e.id, deleted: true }; }
        const sz = JSON.stringify(row).length;
        if (batch.length && (size + sz > 2500000 || batch.length >= 250)) break;
        batch.push(row); size += sz; sent[k] = e.v;
      }
      const res = await this.rpc('shk_push', { p_token: this.token(), p_rows: batch });
      for (const r of res.revs || []) {
        const k = r.col + '|' + r.id;
        if (r.col === 'settings') { this.sRev = r.rev; this.sBase = sentSettings; cloudRaw('put', 'settings', { id: '__base', rev: r.rev, data: sentSettings }).catch(() => {}); }
        if (this.out[k] && this.out[k].v === sent[k]) delete this.out[k];
      }
      this.save();
      if ((res.conflicts || []).length) await this.pull(); // أحد عدّل الإعدادات قبلنا: نسحب وندمج ثم نعيد الرفع
    }
    for (const id of [...this.fout]) {
      const f = await cloudRaw('getFile', id);
      if (f && f.blob) {
        try { await cloudUploadFile(f); }
        catch (e) { if (e.offline || e.code === 'invalid_token') throw e; if (this.needUpdate) continue; throw e; } // ملف كبير ينتظر تحديث الخادم: لا يعطّل بقية الملفات
      }
      this.fout = this.fout.filter((x) => x !== id); this.save();
    }
    this.setState(Object.keys(this.out).length || (this.fout.length && !this.needUpdate) ? 'sync' : 'ok');
  } catch (e) {
    this.setState(e.offline ? 'off' : e.code === 'invalid_token' ? 'idle' : 'off');
    if (!e.offline && e.code !== 'invalid_token') console.warn('cloud push', e);
  } finally { this.busy = false; }
  if (this.state === 'sync' && (Object.keys(this.out).length || (this.fout.length && !this.needUpdate))) this.kick();
};

/* رفع مرفق: يُضغط بلا فقد إن أمكن، ثم يُرفع على أجزاء، وتُسجَّل بياناته الوصفية في النهاية (فوجودها يعني اكتمال الملف) */
async function cloudUploadFile(f) {
  const meta = { name: f.name, type: f.type, size: f.size, at: f.at };
  let body = f.blob;
  const z = await cloudGzip(body, f.type); if (z) { body = z; meta.gz = true; }
  try {
    const n = Math.max(1, Math.ceil(body.size / CLOUD_CHUNK));
    for (let i = 0; i < n; i++) await Cloud.rpc('shk_file_chunk_put', { p_token: Cloud.token(), p_id: f.id, p_n: i, p_data: await cloudB64(body.slice(i * CLOUD_CHUNK, (i + 1) * CLOUD_CHUNK)) });
    meta.chunks = n;
    await Cloud.rpc('shk_file_put', { p_token: Cloud.token(), p_id: f.id, p_meta: meta, p_data: '' });
  } catch (e) {
    /* خادم لم يُحدَّث بعد (لا توجد دوال الأجزاء): نرفع الملفات الصغيرة بالطريقة القديمة */
    if (e.status !== 404 || body.size > 15 * 1024 * 1024) { if (e.status === 404) { Cloud.needUpdate = true; Cloud.nuAt = Date.now(); } throw e; }
    delete meta.chunks;
    await Cloud.rpc('shk_file_put', { p_token: Cloud.token(), p_id: f.id, p_meta: meta, p_data: await cloudB64(body) });
  }
}

/* ===== السحب ===== */
Cloud.pull = async function () {
  if (!this.on || !this.token()) return { changed: false };
  const res = await this.rpc('shk_pull', { p_token: this.token(), p_since: this.rev });
  if ((res.rev || 0) < this.rev) { this.rev = 0; this.save(); return this.pull(); } // الخادم أُعيدت تهيئته
  const rows = res.rows || [];
  const full = this.rev === 0, hasSettings = rows.some((r) => r.col === 'settings' && r.id === 'main' && !r.deleted);
  let changed = false;
  this.applying = true;
  try {
    const keepSes = D.settings && D.settings.session, keepAuth = D.settings && D.settings.auth;
    if (full && hasSettings) { // أول مزامنة على هذا الجهاز: نسخة الخادم تحل محل النسخة المحلية بالكامل
      for (const c of COLS) { await cloudRaw('clear', c); D[c] = c === 'settings' ? D.settings : []; }
      changed = true;
    }
    if (!this.sBase && !full) { try { const b = await Store.tx('settings', 'readonly', (s) => s.get('__base')); if (b) this.sBase = b.data; } catch (_) { /* */ } }
    for (const r of rows) {
      if (r.col === 'settings') {
        if (r.id !== 'main' || r.deleted) continue;
        const mine = this.out['settings|main'] && D.settings ? cloudCleanSettings(D.settings) : null;
        const next = mine ? cloudMerge(this.sBase || {}, mine, r.data) : r.data;
        if (!D.settings || !cloudEq(cloudCleanSettings(D.settings), next)) changed = true;
        D.settings = { ...next, ...(keepSes ? { session: keepSes } : {}), ...(keepAuth ? { auth: keepAuth } : {}) };
        this.sBase = r.data; this.sRev = r.rev;
        await cloudRaw('put', 'settings', D.settings); await cloudRaw('put', 'settings', { id: '__base', rev: r.rev, data: r.data });
        continue;
      }
      const arr = D[r.col]; if (!arr || r.col === 'settings') continue;
      if (this.out[r.col + '|' + r.id]) continue; // لدينا تعديل أحدث لم يُرفع بعد
      const i = arr.findIndex((x) => x.id === r.id);
      if (r.deleted) { if (i >= 0) { arr.splice(i, 1); changed = true; } await cloudRaw('del', r.col, r.id); }
      else {
        if (i < 0) { arr.push(r.data); changed = true; } else if (!cloudEq(arr[i], r.data)) { arr[i] = r.data; changed = true; }
        await cloudRaw('put', r.col, r.data);
      }
    }
    if (changed) D.audit.sort((a, b) => (a.at < b.at ? 1 : -1));
  } finally { this.applying = false; }
  this.rev = Math.max(this.rev, res.rev || 0); this.save();
  return { changed, empty: full && !hasSettings && this.rev === 0, me: res.me };
};

/* ===== دورة المزامنة أثناء العمل ===== */
async function cloudTick() {
  if (!Cloud.on || !Cloud.ready || !Cloud.token() || document.visibilityState === 'hidden') return;
  if (Cloud.needUpdate && Date.now() - (Cloud.nuAt || 0) > 120000) Cloud.needUpdate = false; // نعيد المحاولة كل دقيقتين: ربما حُدّث الخادم
  try {
    if (Cloud.pending()) await Cloud.flush();
    const r = await Cloud.pull();
    if (r.changed || Cloud.pendingUI) cloudRefreshUI();
    if (Cloud.state !== 'sync') Cloud.setState(Cloud.pending() ? 'off' : 'ok');
  } catch (e) { if (e.offline) Cloud.setState('off'); }
}
Cloud.startPoll = function () { clearInterval(this.pollT); this.pollT = setInterval(cloudTick, 15000); };
Cloud.stop = function () { clearInterval(this.pollT); this.pollT = null; this.ready = false; };
/* إعادة رسم الصفحة بعد وصول تعديلات من حسابات أخرى — تُؤجَّل إن كان المستخدم يكتب أو داخل نافذة أو استعراض */
function cloudRefreshUI() {
  if (!$('#main') || !$('#topbar') || $('#shkLogin')) return;
  const a = document.activeElement;
  const busy = (Modal.stack && Modal.stack.length) || App.dirty || $('#tour') || $('#rqTour') || $('#tourMenu') || (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) || document.fullscreenElement;
  if (typeof refreshBell === 'function') try { refreshBell(); } catch (_) { /* */ }
  if (busy) { Cloud.pendingUI = true; return; }
  Cloud.pendingUI = false;
  const y = window.scrollY;
  renderShell(); route();
  requestAnimationFrame(() => window.scrollTo(0, y));
}
Cloud.expired = function () {
  if (this.expiredShown) return; this.expiredShown = true;
  this.stop();
  try { localStorage.removeItem('shk_auth'); sessionStorage.removeItem('shk_auth'); } catch (_) { /* */ }
  setTimeout(() => {
    ['#side', '#topbar', '#main'].forEach((s) => { const e = $(s); if (e) e.innerHTML = ''; });
    if (typeof showLogin === 'function' && D.settings) showLogin();
    toast('انتهت الجلسة — سجّل الدخول مرة أخرى', 'err');
    this.expiredShown = false;
  }, 0);
};

/* ===== الدخول والتهيئة ===== */
Cloud.login = async function (id, pw) { return this.rpc('shk_login', { p_id: id, p_pw: pw }); };
Cloud.logout = async function () { const t = this.token(); this.stop(); if (t) { try { await this.rpc('shk_logout', { p_token: t }); } catch (_) { /* */ } } };
/* أسماء الإدارات وأعضاء الفريق من الخادم لقائمة الحسابات في شاشة الدخول (قبل تسجيل الدخول) */
Cloud.loadPublic = async function () {
  let p;
  try { p = await this.rpc('shk_public', {}); }
  catch (e) {
    /* الخادم لم يُجهَّز بعد (ملف الإعداد لم يُشغَّل): نعمل محليًا في هذه الجلسة حتى لا يتوقف الدخول */
    if (e.status === 404 && !sessionStorage.getItem('shk_cloud_skip')) { sessionStorage.setItem('shk_cloud_skip', '1'); location.reload(); }
    throw e;
  }
  if (!p || p.empty || !D.settings) return false;
  if (p.org) D.settings.org = { ...D.settings.org, ...p.org };
  if (p.lists) { if (Array.isArray(p.lists.team)) D.settings.lists.team = p.lists.team; if (Array.isArray(p.lists.departments)) D.settings.lists.departments = p.lists.departments; }
  if (p.wfDepts) D.settings.wfDepts = p.wfDepts;
  return true;
};
Cloud.loadPwStatus = async function () { try { this.pwSet = new Set(await this.rpc('shk_pw_status', { p_token: this.token() })); } catch (_) { this.pwSet = this.pwSet || null; } return this.pwSet; };

/* بعد تسجيل الدخول: سحب بيانات المنصة المشتركة (أو تهيئتها أول مرة) ثم بدء المزامنة. تعيد false إن انتهت الجلسة */
async function cloudEnter() {
  if (!Cloud.on) return true;
  const saved = (() => { try { return JSON.parse(localStorage.getItem('shk_auth') || sessionStorage.getItem('shk_auth') || 'null'); } catch (_) { return null; } })() || {};
  Cloud.grp = saved.grp || null;
  let ready = true;
  try {
    const r = await Cloud.pull();
    if (r.empty) {
      if (['sys', 'admin'].includes(Cloud.grp)) ready = await cloudFirstUpload();
      else { ready = false; toast('المنصة المشتركة لم تُهيّأ بعد — تحتاج دخول إدارة الشراكات أو مدير النظام أولًا', 'err'); }
    }
    Cloud.setState(ready ? 'ok' : 'local');
  } catch (e) {
    if (e.code === 'invalid_token') return false;
    Cloud.setState('off');
    toast('تعذّر الاتصال بالمنصة المشتركة — تعمل الآن على آخر نسخة محفوظة في الجهاز، وستُرفع تعديلاتك عند عودة الاتصال', 'err');
  }
  if (!D.settings) await seedAll();
  Cloud.ready = ready;
  if (ready) {
    if (migrate()) { await Repo.saveSettings(); for (const c of ['partnerships', 'achievements', 'partners']) await Store.putMany(c, D[c]); }
    Cloud.startPoll(); Cloud.kick();
  }
  const a = typeof currentLogin === 'function' && currentLogin(); if (a) authApply(a);
  return true;
}
/* قراءة بيانات المنصة القديمة المحفوظة في هذا المتصفح (قبل الربط) دون إنشاء قاعدة جديدة */
async function cloudReadOldLocal() {
  const db = await new Promise((res) => {
    let r; try { r = indexedDB.open(DB_NAME); } catch (_) { return res(null); }
    r.onupgradeneeded = () => { try { r.transaction.abort(); } catch (_) { /* */ } };
    r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null);
  });
  if (!db) return null;
  const all = (c) => new Promise((res) => { try { const q = db.transaction(c, 'readonly').objectStore(c).getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); } catch (_) { res([]); } });
  const out = { files: await all('files') };
  for (const c of COLS) out[c] = await all(c);
  out.settings = (out.settings || []).find((x) => x.id === 'main') || null;
  db.close();
  return out.settings ? out : null;
}
async function cloudFirstUpload() {
  const old = await cloudReadOldLocal();
  const src = old || { settings: D.settings, files: [] };
  const n = (old ? old.partnerships : D.partnerships).length;
  const ok = await confirmDlg(`المنصة المشتركة جديدة وفارغة. سيتم رفع ${old ? 'بيانات المنصة المحفوظة في هذا المتصفح' : 'البيانات الحالية'} (${n} شراكة) لتكون بداية المنصة، ويراها كل الحسابات من أي جهاز.`, { title: 'تهيئة المنصة المشتركة', ok: 'رفع البيانات وبدء العمل' });
  if (!ok) { toast('لم تُرفع البيانات — تعمل الآن على هذا الجهاز فقط', 'err'); return false; }
  if (old) {
    const ses = D.settings && D.settings.session;
    for (const c of COLS) { await cloudRaw('clear', c); D[c] = c === 'settings' ? { ...src.settings, session: ses } : (src[c] || []); if (c !== 'settings') await cloudRaw('putMany', c, D[c]); }
    await cloudRaw('put', 'settings', D.settings);
    for (const f of src.files) await cloudRaw('putFile', f);
    D.audit.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  Cloud.ready = true;
  Cloud.out = {};
  for (const c of COLS) { if (c === 'settings') Cloud.out['settings|main'] = { col: 'settings', id: 'main', v: 1 }; else D[c].forEach((x) => { Cloud.out[c + '|' + x.id] = { col: c, id: x.id, v: 1 }; }); }
  Cloud.fout = (await Store.allFiles()).map((f) => f.id).filter((id) => !/^(lib|asset|sbx):/.test(id));
  Cloud.sRev = 0; Cloud.save();
  toast('جارٍ رفع البيانات إلى المنصة المشتركة…');
  await Cloud.flush();
  if (Cloud.pending()) { toast('رُفع جزء من البيانات وسيكتمل الباقي تلقائيًا', 'err'); }
  else toast('تمت تهيئة المنصة المشتركة — كل الحسابات تعمل الآن على نفس البيانات');
  await Repo.log('cloud.init', 'system', 'cloud', 'تهيئة المنصة المشتركة', `${D.partnerships.length} شراكة، ${Cloud.fout.length} مرفق متبقٍ`);
  return true;
}
/* دمج بيانات قديمة من هذا المتصفح في المنصة المشتركة (ما ليس موجودًا أو الأحدث) */
async function cloudMergeOldLocal() {
  const old = await cloudReadOldLocal();
  if (!old) return toast('لا توجد بيانات قديمة محفوظة في هذا المتصفح', 'err');
  let n = 0;
  for (const c of COLS.filter((x) => x !== 'settings')) {
    for (const r of old[c] || []) {
      const cur = D[c].find((x) => x.id === r.id);
      if (!cur || (r.updatedAt && (!cur.updatedAt || r.updatedAt > cur.updatedAt))) { await Repo.save(c, r, { touch: false }); n++; }
    }
  }
  let f = 0;
  for (const file of old.files || []) { if (!(await cloudRaw('getFile', file.id))) { await Store.putFile(file); f++; } }
  await Repo.log('cloud.merge', 'system', 'cloud', 'دمج بيانات المتصفح في المنصة المشتركة', `${n} سجل، ${f} مرفق`);
  toast(n || f ? `دُمج ${n} سجل و${f} مرفق — جارٍ رفعها` : 'لا جديد: كل بيانات هذا المتصفح موجودة على المنصة');
}
