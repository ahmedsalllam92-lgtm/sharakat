/* ===== طبقة التخزين =====
   كل الوصول إلى البيانات يمر عبر Repo؛ عند إضافة خادم لاحقًا تُستبدل دوال Store بطلبات API دون تغيير الصفحات. */
const DB_NAME = 'sharakat-platform-local';
const DB_VER = 1;
const COLS = ['settings', 'partners', 'partnerships', 'proposals', 'achievements', 'news', 'audit'];

const Store = {
  mode: 'idb', db: null, err: null,
  memFiles: new Map(),
  async open() {
    try {
      if (!('indexedDB' in window) || !window.indexedDB) throw new Error('IndexedDB غير متاح');
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open(DB_NAME, DB_VER);
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
async function saveUpload(file) {
  if (file.size > MAX_FILE) throw new Error(`حجم الملف «${file.name}» يتجاوز 15 ميجابايت.`);
  const rec = { id: uid('f'), name: file.name, type: file.type || 'application/octet-stream', size: file.size, blob: file, at: nowISO() };
  await Store.putFile(rec);
  return rec;
}

const Repo = {
  async load() {
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
