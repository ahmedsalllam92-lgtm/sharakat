/* ===== أدوات عامة ===== */
const App = { ui: { regView: 'table', regSort: 'updated' }, dashF: {}, dirty: false, heroDrawn: false, route: null };
const go = (href) => { if (location.hash === href) route(); else location.hash = href; };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = 'id') => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowISO = () => new Date().toISOString();
const pad = (n) => String(n).padStart(2, '0');
const nf = (n) => Number(n || 0).toLocaleString('en-US');
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const clone = (o) => JSON.parse(JSON.stringify(o));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function isoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function parseDate(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d) ? null : d;
}
function fmtDate(s, style = 'long') {
  const d = parseDate(s) || (s && !/^\d{4}-/.test(s) ? new Date(s) : null);
  if (!d || isNaN(d)) return '—';
  if (style === 'short') return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (style === 'month') return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtDT(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}، ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function relDays(iso) {
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const n = daysBetween(d, today());
  if (n <= 0) return 'اليوم';
  if (n === 1) return 'أمس';
  if (n === 2) return 'قبل يومين';
  if (n <= 10) return `قبل ${n} أيام`;
  return `قبل ${n} يومًا`;
}
function plural(n, one, two, few, many) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${nf(n)} ${few}`;
  return `${nf(n)} ${many}`;
}
function fmtSize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
function debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function initials(name) {
  const w = String(name || '').replace(/^(ال)/, '').trim().split(/\s+/);
  return (w[0] || '').slice(0, 2);
}

/* تطبيع النص العربي للبحث ومطابقة الأسماء */
function normAr(s) {
  return String(s || '').toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s@.]/gu, ' ').replace(/\s+/g, ' ').trim();
}
const NAME_STOP = new Set(['شركة', 'جمعية', 'مؤسسة', 'هيئة', 'وزارة', 'مركز', 'الخيرية', 'الأهلية', 'لل', 'و', 'في', 'من', 'بن', 'بنت'].map(normAr));
function nameTokens(s) {
  return normAr(s).split(' ').map((w) => w.replace(/^(وال|بال|لل|ال)/, '')).filter((w) => w.length > 1 && !NAME_STOP.has(w));
}
function nameSimilarity(a, b) {
  const A = new Set(nameTokens(a)), B = new Set(nameTokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((x) => { if (B.has(x)) inter++; });
  const j = inter / Math.min(A.size, B.size);
  const na = normAr(a), nb = normAr(b);
  if (na === nb) return 1;
  if (na.length > 4 && nb.length > 4 && (na.includes(nb) || nb.includes(na))) return Math.max(j, 0.85);
  return j;
}
function matchQ(hay, q) {
  if (!q) return true;
  const h = normAr(hay);
  return normAr(q).split(' ').every((t) => h.includes(t));
}

/* ===== الأيقونات (خطية) ===== */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
  building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M8 7h4M8 11h4M8 15h4M2 21h20"/>',
  inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/>',
  send: '<path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  filter: '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
  clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15.5 7"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  arrowL: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  arrowR: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  convert: '<path d="M4 7h13l-3-3"/><path d="M20 17H7l3 3"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
  merge: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 7v10M6 7c0 5 6 5 10 5"/>',
  db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.2 13.6 7 22l5-3 5 3-1.2-8.4"/>',
  sidebar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.7 0-.5-.2-.9-.5-1.2a1.7 1.7 0 0 1 1.2-2.9H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15.5" cy="7.5" r="1.2"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
};
function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}
const BRAND_MARK = '<svg viewBox="0 0 24 24"><path d="M3 15c3-4 6-4 9 0s6 4 9 0"/><path d="M3 10c3-4 6-4 9 0s6 4 9 0" opacity=".55"/><circle cx="12" cy="18.5" r="1.2"/></svg>';

/* ===== التنبيهات والنوافذ ===== */
function toast(msg, type = 'ok') {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + (type === 'err' ? 'err' : '');
  t.innerHTML = icon(type === 'err' ? 'alert' : 'check') + `<span>${esc(msg)}</span>`;
  box.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, type === 'err' ? 5200 : 3000);
}

const Modal = {
  stack: [],
  open({ title, body = '', foot = '', size = '', cls = '', onClose, noHead } = {}) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${size} ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title || '')}">
      ${noHead ? '' : `<div class="modal-h"><h3>${esc(title || '')}</h3><button class="icon-btn" data-mclose aria-label="إغلاق">${icon('x')}</button></div>`}
      <div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
    document.body.appendChild(bg);
    const m = { el: bg, close: (v) => { bg.remove(); Modal.stack = Modal.stack.filter((x) => x !== m); onClose && onClose(v); } };
    bg.addEventListener('mousedown', (e) => { if (e.target === bg) m.close(); });
    bg.addEventListener('click', (e) => { if (e.target.closest('[data-mclose]')) m.close(); });
    Modal.stack.push(m);
    setTimeout(() => { const f = bg.querySelector('[autofocus],input:not([type=hidden]),textarea,select'); f && f.focus(); }, 30);
    return m;
  },
  top() { return Modal.stack[Modal.stack.length - 1]; },
};
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if ($('.lightbox')) return; const m = Modal.top(); m && m.close(); } });

function confirmDlg(msg, { title = 'تأكيد', ok = 'تأكيد', danger = false, cancel = 'إلغاء' } = {}) {
  return new Promise((res) => {
    const m = Modal.open({
      title, body: `<p style="line-height:1.9">${msg}</p>`,
      foot: `<button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button><button class="btn ghost" data-mclose>${esc(cancel)}</button>`,
      onClose: (v) => res(!!v),
    });
    m.el.querySelector('[data-ok]').onclick = () => m.close(true);
  });
}
function inputDlg({ title, label, hint = '', ok = 'حفظ', required = true, value = '', multiline = true, extra = '' }) {
  return new Promise((res) => {
    const m = Modal.open({
      title,
      body: `<div class="field"><label>${esc(label)}</label>${multiline ? `<textarea class="in" id="dlgIn" rows="5">${esc(value)}</textarea>` : `<input class="in" id="dlgIn" value="${esc(value)}">`}
        ${hint ? `<span class="hint">${hint}</span>` : ''}<span class="err">هذا الحقل مطلوب لإتمام الإجراء.</span></div>${extra}`,
      foot: `<button class="btn primary" data-ok>${esc(ok)}</button><button class="btn ghost" data-mclose>إلغاء</button>`,
      onClose: (v) => res(v === undefined ? null : v),
    });
    m.el.querySelector('[data-ok]').onclick = () => {
      const v = m.el.querySelector('#dlgIn').value.trim();
      if (required && !v) { m.el.querySelector('.field').classList.add('invalid'); return; }
      const ex = {}; m.el.querySelectorAll('[data-ex]').forEach((i) => { ex[i.dataset.ex] = i.type === 'checkbox' ? i.checked : i.value; });
      m.close({ value: v, ...ex });
    };
  });
}
function lightbox(src) { openGallery([{ src }], 0); }
/* معرض صور بتنقل ولوحة مصغّرات — items: [{fileId|src, caption, sub}] */
async function openGallery(items, start = 0) {
  if (!items.length) return;
  $$('.lightbox').forEach((x) => x.remove());
  const srcs = await Promise.all(items.map(async (it) => it.src || (await FileCache.url(it.fileId))));
  let i = Math.max(0, Math.min(start, items.length - 1));
  const d = document.createElement('div'); d.className = 'lightbox gal'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'معرض الصور');
  const many = items.length > 1;
  d.innerHTML = `<div class="gal-top"><span class="gal-count"></span><button class="gal-x" aria-label="إغلاق">${icon('x')}</button></div>
    <div class="gal-stage">${many ? `<button class="gal-nav prev" aria-label="السابقة">${icon('chevR')}</button>` : ''}<figure><img alt=""><figcaption></figcaption></figure>${many ? `<button class="gal-nav next" aria-label="التالية">${icon('chevL')}</button>` : ''}</div>
    ${many ? `<div class="gal-thumbs">${srcs.map((s, k) => `<button data-k="${k}"><img src="${s || ''}" alt=""></button>`).join('')}</div>` : ''}`;
  document.body.appendChild(d);
  const show = (k) => {
    i = (k + items.length) % items.length;
    const img = d.querySelector('figure img'); img.classList.remove('gal-in'); void img.offsetWidth;
    img.src = srcs[i] || ''; img.classList.add('gal-in');
    const it = items[i];
    const illus = it.fileId && it.fileId.startsWith('lib:');
    d.querySelector('figcaption').innerHTML = `${it.caption ? `<b>${esc(it.caption)}</b>` : ''}${it.sub ? `<span>${esc(it.sub)}</span>` : ''}${illus ? '<span class="illus-c">صورة توضيحية مولّدة، وليست صورة فعلية من الميدان</span>' : ''}`;
    d.querySelector('.gal-count').textContent = many ? `${i + 1} من ${items.length}` : '';
    $$('.gal-thumbs button', d).forEach((b, k) => { b.classList.toggle('on', k === i); if (k === i) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
  };
  const close = () => { d.remove(); document.removeEventListener('keydown', key, true); };
  const key = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    else if (e.key === 'ArrowLeft') show(i + 1);
    else if (e.key === 'ArrowRight') show(i - 1);
  };
  document.addEventListener('keydown', key, true);
  d.addEventListener('click', (e) => {
    if (e.target.closest('.gal-x') || e.target === d || e.target.classList.contains('gal-stage')) return close();
    if (e.target.closest('.gal-nav.next')) return show(i + 1);
    if (e.target.closest('.gal-nav.prev')) return show(i - 1);
    const t = e.target.closest('.gal-thumbs button'); if (t) show(+t.dataset.k);
  });
  let sx = null;
  d.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  d.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(dx > 0 ? i + 1 : i - 1); sx = null; });
  show(i);
}

/* ===== النصوص الطويلة: تحويل الأسطر المرقمة إلى قائمة منظمة ===== */
function parseRich(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').map((l) => l.replace(/\t/g, ' ').trim()).filter((l) => l && l !== '-');
  const out = [];
  for (const l of lines) {
    const isHead = /^(أولا|اولا|ثانيا|ثالثا|رابعا|خامسا)/.test(normAr(l).replace(/ً/g, '')) || (/[:：]$/.test(l) && l.length < 70 && !/^[\d\-•–]/.test(l));
    if (isHead) { out.push({ t: 'h', text: l.replace(/[:：]\s*$/, '') }); continue; }
    const m = /^(?:(\d+)\s*[\.\-\)]\s*|[-•–]\s*)(.*)$/.exec(l);
    const body = m ? m[2] : l;
    const tm = /^([^:：]{3,70})[:：]\s*(.+)$/.exec(body);
    out.push({ t: m ? 'li' : 'p', num: m && m[1] ? +m[1] : null, title: tm ? tm[1].trim() : '', text: tm ? tm[2].trim() : body });
  }
  return out;
}
function richHTML(text, { empty = 'لم تُسجَّل بيانات.' } = {}) {
  const items = parseRich(text);
  if (!items.length) return `<div class="rich"><span class="empty-v faint">${esc(empty)}</span></div>`;
  let html = '', open = null;
  const close = () => { if (open) { html += open === 'ol' ? '</ol>' : '</ul>'; open = null; } };
  for (const it of items) {
    if (it.t === 'li') {
      const kind = it.num ? 'ol' : 'ul';
      if (open !== kind) { close(); html += kind === 'ol' ? '<ol>' : '<ul>'; open = kind; }
      html += `<li>${it.title ? `<b>${esc(it.title)}:</b> ` : ''}${esc(it.text)}</li>`;
    } else { close(); html += it.t === 'h' ? `<h5>${esc(it.text)}</h5>` : `<p>${it.title ? `<b>${esc(it.title)}:</b> ` : ''}${esc(it.text)}</p>`; }
  }
  close();
  return `<div class="rich">${html}</div>`;
}
function richItems(text) { return parseRich(text).filter((x) => x.t !== 'h'); }
function firstItem(text) { const it = richItems(text)[0]; return it ? (it.title ? it.title + ': ' + it.text : it.text) : ''; }

/* ===== الغلاف المولّد: خطوط كنتورية من حقل ارتفاعات ===== */
function rng(seed) { let h = 2166136261 >>> 0; for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const TOPO_CACHE = new Map();
function topoPaths(seed, W = 800, H = 450, { levels = 14, cols = 64, focus = 'left' } = {}) {
  const key = [seed, W, H, levels, cols, focus].join('|');
  if (TOPO_CACHE.has(key)) return TOPO_CACHE.get(key);
  const r = rng(seed);
  const bumps = [];
  const nb = 4 + Math.floor(r() * 3);
  for (let i = 0; i < nb; i++) {
    const fx = focus === 'left' ? r() * 0.6 : focus === 'center' ? 0.15 + r() * 0.7 : r();
    bumps.push({ x: fx * W, y: r() * H, s: (0.16 + r() * 0.26) * Math.max(W, H), a: (r() > 0.25 ? 1 : -0.55) * (0.6 + r() * 0.6) });
  }
  const tilt = (r() - 0.5) * 0.6;
  const rows = Math.round(cols * H / W);
  const dx = W / cols, dy = H / rows;
  const f = [];
  let mn = Infinity, mx = -Infinity;
  for (let j = 0; j <= rows; j++) {
    const row = [];
    for (let i = 0; i <= cols; i++) {
      const x = i * dx, y = j * dy;
      let v = tilt * (x / W) + 0.08 * Math.sin(x / W * 7 + seed.length) * Math.cos(y / H * 5);
      for (const b of bumps) { const d2 = ((x - b.x) ** 2 + (y - b.y) ** 2) / (b.s * b.s); v += b.a * Math.exp(-d2); }
      row.push(v); mn = Math.min(mn, v); mx = Math.max(mx, v);
    }
    f.push(row);
  }
  const paths = [];
  for (let L = 1; L <= levels; L++) {
    const iso = mn + (mx - mn) * (L / (levels + 1));
    const segs = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = f[j][i], b = f[j][i + 1], c = f[j + 1][i + 1], d = f[j + 1][i];
      const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const x = i * dx, y = j * dy;
      const lerp = (p, q) => (iso - p) / (q - p);
      const T = [x + dx * lerp(a, b), y], R = [x + dx, y + dy * lerp(b, c)], B = [x + dx * lerp(d, c), y + dy], Lf = [x, y + dy * lerp(a, d)];
      const map = { 1: [[Lf, B]], 2: [[B, R]], 3: [[Lf, R]], 4: [[T, R]], 5: [[Lf, T], [B, R]], 6: [[T, B]], 7: [[Lf, T]], 8: [[Lf, T]], 9: [[T, B]], 10: [[T, R], [Lf, B]], 11: [[T, R]], 12: [[Lf, R]], 13: [[B, R]], 14: [[Lf, B]] };
      for (const s of map[idx]) segs.push(s);
    }
    // ربط المقاطع في مسارات متصلة
    const k = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);
    const ends = new Map();
    segs.forEach((s, n) => { [0, 1].forEach((e) => { const kk = k(s[e]); if (!ends.has(kk)) ends.set(kk, []); ends.get(kk).push([n, e]); }); });
    const used = new Uint8Array(segs.length);
    let d = '', len = 0;
    for (let n = 0; n < segs.length; n++) {
      if (used[n]) continue;
      used[n] = 1;
      const line = [segs[n][0], segs[n][1]];
      for (const dir of [1, 0]) {
        let guard = 0;
        while (guard++ < 5000) {
          const tip = dir ? line[line.length - 1] : line[0];
          const cand = (ends.get(k(tip)) || []).find(([m]) => !used[m]);
          if (!cand) break;
          used[cand[0]] = 1;
          const nxt = segs[cand[0]][1 - cand[1]];
          dir ? line.push(nxt) : line.unshift(nxt);
        }
      }
      if (line.length < 4) continue;
      d += 'M' + line.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
      for (let q = 1; q < line.length; q++) len += Math.hypot(line[q][0] - line[q - 1][0], line[q][1] - line[q - 1][1]);
    }
    if (d) paths.push({ d, hi: L === Math.round(levels * 0.62), len: Math.ceil(len) });
  }
  TOPO_CACHE.set(key, paths);
  return paths;
}
function topoSVG(seed, { W = 800, H = 450, levels = 13, cols = 56, focus = 'any', draw = false, cls = 'topo' } = {}) {
  const ps = topoPaths(String(seed), W, H, { levels, cols, focus });
  return `<svg class="${cls}${draw ? ' draw' : ''}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${ps.map((p, i) => `<path class="topo-path${p.hi ? ' hi' : ''}" d="${p.d}" style="--len:${p.len};--d:${(i * 0.07).toFixed(2)}s"/>`).join('')}</svg>`;
}
function coverHTML(seed, fileId, { W = 800, H = 450, levels = 12, cols = 48, tone = 'dark' } = {}) {
  const illus = fileId && fileId.startsWith('lib:');
  return `<div class="cover t-${tone}">${fileId ? `<img class="photo" data-file="${esc(fileId)}" alt="">${illus ? '<span class="illus">صورة توضيحية</span>' : ''}` : topoSVG(seed, { W, H, levels, cols })}</div>`;
}

/* ===== حقل الاختيار القابل للبحث (فردي أو متعدد) ===== */
function comboHTML(name, { options = [], value, multi = false, placeholder = 'اختر أو ابحث…', allowAdd = false, addLabel = 'إضافة' } = {}) {
  const vals = multi ? (value || []) : (value ? [value] : []);
  const lab = (v) => { const o = options.find((x) => (typeof x === 'string' ? x : x.value) === v); return o ? (typeof o === 'string' ? o : o.label) : (v || ''); };
  return `<div class="cb" data-cb="${esc(name)}" data-multi="${multi ? 1 : 0}" data-add="${allowAdd ? 1 : 0}" data-addlabel="${esc(addLabel)}">
    <div class="cb-box">${multi ? vals.map((v) => `<span class="cb-tag" data-v="${esc(v)}">${esc(v)}<button type="button" aria-label="إزالة">${icon('x')}</button></span>`).join('') : ''}
      <input type="text" autocomplete="off" placeholder="${esc(vals.length && multi ? '' : placeholder)}" value="${multi ? '' : esc(lab(vals[0]))}">
    </div>
    <script type="application/json">${JSON.stringify({ options, vals }).replace(/</g, '\\u003c')}</script>
  </div>`;
}
function bindCombos(root, onChange) {
  $$('.cb', root).forEach((cb) => {
    if (cb._bound) return; cb._bound = true;
    const cfg = JSON.parse(cb.querySelector('script').textContent);
    const multi = cb.dataset.multi === '1', allowAdd = cb.dataset.add === '1';
    let vals = cfg.vals.slice(), opts = cfg.options.slice();
    const input = cb.querySelector('input'), box = cb.querySelector('.cb-box');
    let pop = null, act = -1;
    const optLabel = (o) => (typeof o === 'string' ? o : o.label);
    const optVal = (o) => (typeof o === 'string' ? o : o.value);
    const optSub = (o) => (typeof o === 'string' ? '' : o.sub || '');
    const emit = () => { cb.value = multi ? vals.slice() : (vals[0] || ''); cb.dispatchEvent(new CustomEvent('cbchange', { bubbles: true, detail: cb.value })); onChange && onChange(cb.dataset.cb, cb.value); };
    cb.value = multi ? vals.slice() : (vals[0] || '');
    cb.setOptions = (o) => { opts = o.slice(); };
    cb.setValue = (v) => { vals = multi ? (v || []).slice() : (v ? [v] : []); renderTags(); if (!multi) input.value = vals[0] ? optLabel(opts.find((o) => optVal(o) === vals[0]) || vals[0]) : ''; cb.value = multi ? vals.slice() : (vals[0] || ''); };
    const renderTags = () => {
      if (!multi) return;
      $$('.cb-tag', box).forEach((t) => t.remove());
      vals.forEach((v) => { const s = document.createElement('span'); s.className = 'cb-tag'; s.dataset.v = v; s.innerHTML = `${esc(v)}<button type="button" aria-label="إزالة">${icon('x')}</button>`; box.insertBefore(s, input); });
      input.placeholder = vals.length ? '' : 'اختر أو ابحث…';
    };
    const close = () => { pop && pop.remove(); pop = null; cb.classList.remove('open'); act = -1; if (!multi) { input.value = vals[0] ? (optLabel(opts.find((o) => optVal(o) === vals[0]) || vals[0])) : ''; } };
    const pick = (v) => {
      if (multi) { vals = vals.includes(v) ? vals.filter((x) => x !== v) : [...vals, v]; renderTags(); input.value = ''; draw(); input.focus(); }
      else { vals = v ? [v] : []; close(); }
      emit();
    };
    const draw = () => {
      const q = multi || cb.classList.contains('typing') ? input.value.trim() : '';
      const list = opts.filter((o) => matchQ(optLabel(o) + ' ' + optSub(o), q));
      if (!pop) { pop = document.createElement('div'); pop.className = 'cb-pop'; cb.appendChild(pop); cb.classList.add('open'); }
      const exact = opts.some((o) => normAr(optLabel(o)) === normAr(q));
      pop.innerHTML = (list.length ? list.map((o, i) => `<div class="cb-opt ${vals.includes(optVal(o)) ? 'sel' : ''} ${i === act ? 'act' : ''}" data-v="${esc(optVal(o))}">${esc(optLabel(o))}${optSub(o) ? `<span class="sub">${esc(optSub(o))}</span>` : ''}${vals.includes(optVal(o)) ? icon('check') : ''}</div>`).join('') : `<div class="cb-empty">لا توجد خيارات مطابقة.</div>`)
        + (!multi && vals.length ? `<div class="cb-opt" data-clear style="color:var(--muted)">مسح الاختيار</div>` : '')
        + (allowAdd && q && !exact ? `<div class="cb-add"><div class="cb-opt" data-addv="${esc(q)}">${icon('plus')}&nbsp;${esc(cb.dataset.addlabel)} «${esc(q)}»</div></div>` : '')
        + (allowAdd && !q ? `<div class="cb-add"><div class="cb-opt cb-new" data-addnew>${icon('plus')}&nbsp;${esc(cb.dataset.addlabel)}…</div></div>` : ''); // إضافة ظاهرة دائمًا، لا تحتاج البدء بالكتابة
    };
    box.addEventListener('mousedown', (e) => {
      const rm = e.target.closest('.cb-tag button');
      if (rm) { e.preventDefault(); vals = vals.filter((x) => x !== rm.parentElement.dataset.v); renderTags(); emit(); return; }
      if (e.target !== input) { e.preventDefault(); input.focus(); }
      if (!pop) { cb.classList.remove('typing'); draw(); }
    });
    input.addEventListener('focus', () => { if (!pop) { cb.classList.remove('typing'); draw(); } if (!multi) input.select(); });
    input.addEventListener('input', () => { cb.classList.add('typing'); act = -1; draw(); });
    input.addEventListener('keydown', (e) => {
      if (!pop && (e.key === 'ArrowDown' || e.key === 'Enter')) { draw(); e.preventDefault(); return; }
      const items = pop ? $$('.cb-opt', pop) : [];
      if (e.key === 'ArrowDown') { act = Math.min(items.length - 1, act + 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { act = Math.max(0, act - 1); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = items[act] || (items.length === 1 ? items[0] : null) || $('[data-addv]', pop || document.createElement('div')); if (it) it.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); }
      else if (e.key === 'Escape') { if (pop) { e.stopPropagation(); close(); } }
      else if (e.key === 'Backspace' && multi && !input.value && vals.length) { vals.pop(); renderTags(); emit(); }
    });
    input.addEventListener('blur', () => setTimeout(() => { if (!cb.contains(document.activeElement)) close(); }, 120));
    cb.addEventListener('mousedown', (e) => {
      const o = e.target.closest('.cb-opt'); if (!o || !pop || !pop.contains(o)) return;
      e.preventDefault();
      if (o.hasAttribute('data-clear')) { vals = []; close(); emit(); return; }
      const doAdd = (nv) => {
        const ev = new CustomEvent('cbadd', { bubbles: true, cancelable: true, detail: { value: nv, accept: (label) => { opts.push(label || nv); pick(label || nv); if (multi) close(); } } });
        cb.dispatchEvent(ev);
        if (!ev.defaultPrevented) { opts.push(nv); pick(nv); if (multi) { close(); input.blur(); } }
      };
      if (o.dataset.addv) { doAdd(o.dataset.addv); return; }
      if (o.hasAttribute('data-addnew')) {
        close(); input.blur();
        inputDlg({ title: cb.dataset.addlabel, label: 'الاسم', ok: 'إضافة', multiline: false, hint: 'تُضاف إلى القائمة وتظهر في الاختيارات بعد ذلك.' }).then((r) => {
          const nv = String((r && typeof r === 'object' ? r.value : r) || '').trim(); if (!nv) return;
          const ex = opts.find((x) => normAr(optLabel(x)) === normAr(nv));
          if (ex) { if (!vals.includes(optVal(ex))) pick(optVal(ex)); if (multi) close(); return; }
          doAdd(nv);
        });
        return;
      }
      pick(o.dataset.v);
    });
  });
}

/* ===== حدود الحجم ونوع الملف ===== */
const MAX_FILE = 50 * 1024 * 1024;
function fileKind(type, name) {
  if (/^image\//.test(type)) return 'image';
  if (/pdf/.test(type) || /\.pdf$/i.test(name)) return 'pdf';
  return 'file';
}
function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
