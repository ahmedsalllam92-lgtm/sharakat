/* ===== طبقة التخزين =====
   كل الوصول إلى البيانات يمر عبر Repo؛ عند إضافة خادم لاحقًا تُستبدل دوال Store بطلبات API دون تغيير الصفحات. */
const DB_NAME = 'sharakat-platform-local';
const DB_VER = 1;
const COLS = ['settings', 'partners', 'partnerships', 'proposals', 'achievements', 'news', 'audit'];

const Store = {
  mode: 'idb', db: null, err: null,
  memFiles: new Map(),
  async open() {
    if (window.__SBX) { this.mode = 'sandbox'; this.db = null; return; } // نسخة الاستعراض المعزولة: لا تخزين إطلاقًا
    try {
      if (!('indexedDB' in window) || !window.indexedDB) throw new Error('IndexedDB غير متاح');
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open(this.dbName || DB_NAME, DB_VER);
        r.onupgradeneeded = () => {
          const db = r.result;
          COLS.forEach((c) => { if (!db.objectStoreNames.contains(c)) db.createObjectStore(c, { keyPath: 'id' }); });
          if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error || new Error('open failed'));
        r.onblocked = () => rej(new Error('blocked'));
        setTimeout(() => rej(new Error('timeout')), 4000);
      });
      await this.tx('settings', 'readonly', (s) => s.count());
    } catch (e) { this.mode = 'memory'; this.db = null; this.err = e; }
  },
  tx(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('abort'));
    });
  },
  async all(c) { return this.db ? (await this.tx(c, 'readonly', (s) => s.getAll())) || [] : []; },
  async put(c, obj) { if (this.db) await this.tx(c, 'readwrite', (s) => s.put(obj)); },
  async putMany(c, arr) { if (!this.db || !arr.length) return; await new Promise((res, rej) => { const t = this.db.transaction(c, 'readwrite'); const s = t.objectStore(c); arr.forEach((o) => s.put(o)); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
  async del(c, id) { if (this.db) await this.tx(c, 'readwrite', (s) => s.delete(id)); },
  async clear(c) { if (this.db) await this.tx(c, 'readwrite', (s) => s.clear()); },
  async putFile(rec) { this.memFiles.set(rec.id, rec); if (this.db) await this.tx('files', 'readwrite', (s) => s.put(rec)); },
  async getFile(id) {
    if (id && id.startsWith('asset:')) { const A_ = ASSET_IMG[id.slice(6)]; if (!A_) return null; const blob = await (await fetch(A_.src)).blob(); return { id, name: A_.title + '.jpg', type: 'image/jpeg', size: blob.size, blob }; }
    if (id && id.startsWith('lib:')) { const L_ = IMG_LIB[id.slice(4)]; if (!L_) return null; const blob = await (await fetch(L_.src)).blob(); return { id, name: L_.title + '.jpg', type: 'image/jpeg', size: blob.size, blob }; }
    if (this.memFiles.has(id)) return this.memFiles.get(id);
    if (window.__SBX) { try { return id && !String(id).startsWith('sbx:') ? (parent.__shkGetFile ? await parent.__shkGetFile(id) : null) : null; } catch (_) { return null; } } // قراءة فقط من المنصة الأصلية
    if (!this.db) return null;
    const r = await this.tx('files', 'readonly', (s) => s.get(id));
    if (r) this.memFiles.set(id, r);
    return r || null;
  },
  async allFiles() { return this.db ? (await this.tx('files', 'readonly', (s) => s.getAll())) || [] : [...this.memFiles.values()]; },
  async delFile(id) { this.memFiles.delete(id); if (this.db) await this.tx('files', 'readwrite', (s) => s.delete(id)); },
};

const D = { settings: null, partners: [], partnerships: [], proposals: [], achievements: [], news: [], audit: [] };

const FileCache = {
  urls: new Map(),
  async url(id) {
    if (!id) return null;
    if (id.startsWith('lib:')) { const L_ = IMG_LIB[id.slice(4)]; return L_ ? L_.src : null; }
    if (id.startsWith('asset:')) { const A_ = ASSET_IMG[id.slice(6)]; return A_ ? A_.src : null; }
    if (this.urls.has(id)) return this.urls.get(id);
    const f = await Store.getFile(id);
    if (!f || !f.blob) return null;
    const u = URL.createObjectURL(f.blob);
    this.urls.set(id, u);
    return u;
  },
};
async function hydrateFiles(root = document) {
  const els = $$('[data-file]', root);
  await Promise.all(els.map(async (el) => {
    const u = await FileCache.url(el.dataset.file);
    if (u) { if (el.tagName.toLowerCase() === 'image') el.setAttribute('href', u); else el.src = u; el.removeAttribute('data-file'); }
    else if (el.tagName === 'IMG') { el.style.display = 'none'; }
  }));
}
/* ضغط الصور عند الرفع: أطول ضلع 2560 بكسل وجودة 85% — يكفي للعرض والطباعة ويوفر غالبًا 70–90% من الحجم.
   الصور الشفافة (PNG بخلفية شفافة كالشعارات) تُحفظ WebP لتبقى شفافة. لا يُستبدل الأصل إلا إذا وفّر الضغط 10% على الأقل.
   المستندات (PDF والعقود…) لا تُعدَّل أبدًا: تبقى مطابقة للأصل حرفيًا. */
async function compressImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024 || typeof createImageBitmap !== 'function') return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 2560 / Math.max(bmp.width, bmp.height)), w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    let type = 'image/jpeg';
    if (file.type !== 'image/jpeg') {
      x.drawImage(bmp, 0, 0, w, h);
      const px = x.getImageData(0, 0, w, h).data; let alpha = false;
      for (let i = 3; i < px.length; i += 4 * 7) if (px[i] < 250) { alpha = true; break; }
      if (alpha) type = 'image/webp'; else x.clearRect(0, 0, w, h);
    }
    if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(bmp, 0, 0, w, h); }
    if (bmp.close) bmp.close();
    const blob = await new Promise((r) => c.toBlob(r, type, 0.85));
    if (!blob || blob.type !== type || blob.size > file.size * 0.9) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + (type === 'image/jpeg' ? '.jpg' : '.webp'), { type });
  } catch (_) { return file; }
}
async function saveUpload(file) {
  const orig = file.size;
  if (/^image\//.test(file.type)) file = await compressImage(file);
  if (file.size > MAX_FILE) throw new Error(`حجم الملف «${file.name}» يتجاوز 50 ميجابايت.`);
  const rec = { id: uid('f'), name: file.name, type: file.type || 'application/octet-stream', size: file.size, blob: file, at: nowISO(), ...(file.size < orig ? { orig } : {}) };
  await Store.putFile(rec);
  return rec;
}

const Repo = {
  async load() {
    if (window.__SBX) { sbxImport(window.__SBX.data()); return; }
    for (const c of COLS) {
      const rows = await Store.all(c);
      if (c === 'settings') D.settings = rows.find((r) => r.id === 'main') || null;
      else D[c] = rows;
    }
    D.audit.sort((a, b) => (a.at < b.at ? 1 : -1));
  },
  async save(col, rec, { touch = true } = {}) {
    if (touch) { rec.updatedAt = nowISO(); rec.updatedBy = Session.userName(); }
    const arr = D[col];
    const i = arr.findIndex((x) => x.id === rec.id);
    if (i >= 0) arr[i] = rec; else arr.push(rec);
    try { await Store.put(col, rec); }
    catch (e) { toast('تعذّر الحفظ في المتصفح: ' + (e && e.message || ''), 'err'); throw e; }
    return rec;
  },
  async remove(col, id) { D[col] = D[col].filter((x) => x.id !== id); await Store.del(col, id); },
  async saveSettings() { await Store.put('settings', D.settings); },
  async log(action, entity, entityId, label, details = '') {
    const e = { id: uid('log'), at: nowISO(), user: Session.userName(), role: Session.role(), action, entity, entityId, label, details };
    D.audit.unshift(e);
    try { await Store.put('audit', e); } catch (_) { /* السجل غير حرج */ }
    return e;
  },
};

/* ===== النسخ الاحتياطي ===== */
function blobToDataURL(blob) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); }); }
async function dataURLToBlob(u) { return (await fetch(u)).blob(); }
async function exportBackup() {
  /* المنصة المشتركة: تُجلب المرفقات غير المحمّلة على هذا الجهاز أولًا حتى تكون النسخة كاملة */
  if (typeof Cloud !== 'undefined' && Cloud.on && Cloud.token()) {
    try { const have = new Set((await Store.allFiles()).map((f) => f.id)); const ids = (await Cloud.rpc('shk_file_ids', { p_token: Cloud.token() })) || []; const miss = ids.filter((id) => !have.has(id)); if (miss.length) toast(`جارٍ تحميل ${miss.length} مرفق من المنصة لإكمال النسخة…`); for (const id of miss) await Store.getFile(id); } catch (_) { toast('تعذّر تحميل بعض المرفقات من المنصة — ستضم النسخة المرفقات المحفوظة على هذا الجهاز فقط', 'err'); }
  }
  const files = await Store.allFiles();
  const fileData = [];
  for (const f of files) fileData.push({ id: f.id, name: f.name, type: f.type, size: f.size, at: f.at, data: await blobToDataURL(f.blob) });
  const payload = { app: 'sharakat-platform', version: 1, exportedAt: nowISO(), data: { settings: D.settings, partners: D.partners, partnerships: D.partnerships, proposals: D.proposals, achievements: D.achievements, news: D.news, audit: D.audit }, files: fileData };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const d = today();
  download(`نسخة-احتياطية-منصة-الشراكات-${isoDate(d)}.json`, blob);
  await Repo.log('backup', 'system', 'backup', 'تصدير نسخة احتياطية', `${D.partnerships.length} شراكة، ${D.proposals.length} مقترح، ${files.length} مرفق`);
}
async function restoreBackup(file) {
  const txt = await file.text();
  let p;
  try { p = JSON.parse(txt); } catch (_) { throw new Error('الملف ليس نسخة احتياطية صالحة (تعذّرت قراءة JSON).'); }
  if (!p || p.app !== 'sharakat-platform' || !p.data || !p.data.settings) throw new Error('الملف لا يخص منظومة الشراكات أو ينقصه جزء من البيانات.');
  for (const c of COLS) await Store.clear(c);
  if (Store.db) await Store.tx('files', 'readwrite', (s) => s.clear());
  Store.memFiles.clear(); FileCache.urls.clear();
  for (const f of p.files || []) await Store.putFile({ id: f.id, name: f.name, type: f.type, size: f.size, at: f.at, blob: await dataURLToBlob(f.data) });
  D.settings = p.data.settings; await Store.put('settings', D.settings);
  for (const c of COLS.filter((x) => x !== 'settings')) { D[c] = p.data[c] || []; await Store.putMany(c, D[c]); }
  await Repo.log('restore', 'system', 'restore', 'استعادة نسخة احتياطية', `نسخة بتاريخ ${fmtDT(p.exportedAt)}`);
}

/* أي صورة ملف تُضاف للصفحة لاحقًا (نوافذ منبثقة، قوائم، بطاقات…) تُحمّل تلقائيًا حتى لو نسي الكود استدعاء hydrateFiles */
(() => {
  if (typeof MutationObserver !== 'function') return;
  let q = new Set(), t = 0;
  const flush = () => { t = 0; const roots = [...q]; q = new Set(); roots.forEach((r) => { if (r.isConnected) hydrateFiles(r); }); };
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      if ((n.matches && n.matches('[data-file]')) || (n.querySelector && n.querySelector('[data-file]'))) q.add(n.matches('[data-file]') ? n.parentNode || n : n);
    }
    if (q.size && !t) t = requestAnimationFrame(flush);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
