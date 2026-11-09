/* =====================================================================
   الحسابات وتسجيل الدخول
   - «مدير النظام»: الحساب الرئيسي. كلمة مروره مثبتة في الشيفرة كبصمة فقط،
     لا تُخزَّن في البيانات، ولا تظهر لأحد، ولا تُغيَّر من أي شاشة.
   - «إدارة الشراكات»: كامل الصلاحيات، ويدير كلمات مرور بقية الحسابات.
   - حساب لكل عضو في فريق الشراكات، ولكل إدارة، وحساب للاطلاع.
   كلمات المرور تُحفظ بصمات SHA-256 مملّحة باسم الحساب، لا نصًا.
   تنبيه: هذه حماية على مستوى الواجهة؛ الحماية الكاملة تحتاج خادمًا (مثل Supabase).
   ===================================================================== */
const SYS_ID = 'sysadmin';
const SYS_HASH = 'ef6180e6e7e0cddebc7860caf955eb9dd68c3417de90503a5f1671988e62ecd5';
/* كلمات المرور الافتراضية لكل مجموعة (تُستبدل من «الإعدادات ← الحسابات والصلاحيات») */
/* بصمات فقط — كلمات المرور نفسها لا تُكتب في الشيفرة */
const AUTH_DEFAULT_HASH = { admin: '520595d6dd125f1e3fb1c8740ed8530e4f2c8f435696b26acc2a8c4b92305850', team: '3ee81765d183282d81cfd3ce6d45ae6c9075c8a688537c27e001a7b616cdfbe9', dept: 'e571c5e3bc0315783b2d6342bb1a389619405d0bd6d713f09fd2a4a1f671196a', viewer: 'ed8721b848affbf0c60f9df85027af582b7add162ed97f7383a3b0791fe98db3' };
const AUTH_KEY = 'shk_auth';
const AUTH = { dev: false, fails: 0, lockUntil: 0 };

/* SHA-256 بلغة JS خالصة: يعمل في file:// وفي أي متصفح دون الاعتماد على crypto.subtle */
function sha256(str) {
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const bytes = new TextEncoder().encode(str);
  const l = bytes.length, n = ((l + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(n); m.set(bytes); m[l] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(n - 4, l * 8); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const W = new Uint32Array(64);
  const r = (x, k) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10); W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
const pwHash = (id, pw) => sha256('shk|' + id + '|' + pw);

/* كل حسابات الدخول: مدير النظام أولًا، ثم حسابات المسار (إدارة الشراكات، الفريق، الإدارات، الاطلاع) */
function authAccounts() {
  return [{ id: SYS_ID, t: 'مدير النظام', s: 'الحساب الرئيسي للمنصة', role: 'admin', dept: D.settings.org.dept, g: 'النظام', sys: true }, ...wfAccounts()];
}
const authGroupOf = (a) => (a.sys ? null : a.role);
function authStore() { D.settings.auth = D.settings.auth || { pw: {} }; D.settings.auth.pw = D.settings.auth.pw || {}; return D.settings.auth; }
function authIsDefault(a) { if (a.sys) return false; if (Cloud.on) return !(Cloud.pwSet && Cloud.pwSet.has(a.id)); return !authStore().pw[a.id]; }
function authCheck(a, pw) {
  if (!a || !pw) return false;
  if (Cloud.on) return false; // في المنصة المشتركة يتم التحقق على الخادم فقط
  if (a.sys) return pwHash(SYS_ID, pw) === SYS_HASH;
  const h = authStore().pw[a.id];
  return h ? h === pwHash(a.id, pw) : sha256('shk|default:' + authGroupOf(a) + '|' + pw) === AUTH_DEFAULT_HASH[authGroupOf(a)];
}
async function authSetPassword(id, pw, by, old) {
  if (id === SYS_ID) throw new Error('كلمة مرور مدير النظام محمية ولا يمكن تغييرها.');
  const a = authAccounts().find((x) => x.id === id); if (!a) throw new Error('الحساب غير موجود');
  const self = currentLogin() && currentLogin().id === id;
  if (!self && !authCanManage()) throw new Error('ليست لديك صلاحية تغيير كلمات مرور الحسابات الأخرى.');
  if (Cloud.on) {
    try { await Cloud.rpc('shk_set_password', { p_token: Cloud.token(), p_target: id, p_new: pw, p_old: old == null ? null : old }); }
    catch (e) { throw new Error({ bad_old: 'كلمة المرور الحالية غير صحيحة.', forbidden: 'ليست لديك صلاحية تغيير كلمات مرور الحسابات الأخرى.', protected: 'كلمة مرور مدير النظام محمية ولا يمكن تغييرها.', short: 'كلمة المرور قصيرة.' }[e.code] || (e.offline ? 'تعذّر الاتصال بالخادم — حاول مرة أخرى.' : e.message)); }
    if (Cloud.pwSet) { if (pw === null) Cloud.pwSet.delete(id); else Cloud.pwSet.add(id); }
  } else {
    if (pw === null) delete authStore().pw[id]; else authStore().pw[id] = pwHash(id, pw);
    await Repo.saveSettings();
  }
  await Repo.log('auth.password', 'account', id, a.t, pw === null ? 'إعادة إلى كلمة المرور الافتراضية' : self ? 'غيّر كلمة مروره' : 'عُيّنت من ' + (by || accountLabel()));
}
const authCanManage = () => can('manage.accounts');
const isSysAdmin = () => !!(D.settings && D.settings.session && D.settings.session.accountId === SYS_ID);

/* الجلسة على هذا الجهاز فقط (لا تُشارك مع البيانات) */
function authSaved() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY) || 'null'); } catch (_) { return null; } }
function currentLogin() { const s = authSaved(); if (!s || (Cloud.on && !s.tk)) return null; return authAccounts().find((a) => a.id === s.id) || null; }
function authApply(a) {
  D.settings.session = { role: a.role, dept: a.role === 'dept' ? a.dept : (a.dept || (D.settings.session || {}).dept), member: a.member || (D.settings.session || {}).member, accountId: a.id };
}
/* يُستدعى عند الإقلاع: يعيد true إن كان المستخدم مسجلًا (أو في وضع الاختبار الآلي) */
function authBoot() {
  let auto = false; try { auto = !!navigator.webdriver && !localStorage.getItem('shk_auth_force'); } catch (_) { auto = !!navigator.webdriver; }
  if (window.__SBX) { AUTH.dev = true; const a = authAccounts().find((x) => x.id === window.__SBX.account); if (a) authApply(a); return true; }
  if (auto) { AUTH.dev = true; return true; }
  const a = currentLogin(); if (!a) return false;
  authApply(a); return true;
}
async function authLogin(a, remember, cl) {
  const rec = JSON.stringify({ id: a.id, at: nowISO(), ...(cl ? { tk: cl.token, grp: cl.grp } : {}) });
  try { localStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(AUTH_KEY); (remember ? localStorage : sessionStorage).setItem(AUTH_KEY, rec); localStorage.setItem('shk_last_acc', a.id); } catch (_) { /* */ }
  authApply(a);
  if (!cl) await Repo.log('auth.login', 'account', a.id, a.t, '');
}
async function authLogout() {
  if (App.dirty && !(await confirmDlg('لديك تعديلات غير محفوظة. تسجيل الخروج سيغلق النموذج دون حفظ.', { ok: 'تسجيل الخروج', danger: true }))) return;
  try { await Repo.log('auth.logout', 'account', currentAccountId(), accountLabel(), ''); } catch (_) { /* */ }
  let wiped = false;
  if (Cloud.on) { try { await Cloud.flush(); } catch (_) { /* */ } await Cloud.logout(); if (!localStorage.getItem(AUTH_KEY)) { try { wiped = await Store.wipeLocal(); } catch (_) { /* */ } } }
  try { localStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(AUTH_KEY); } catch (_) { /* */ }
  if (wiped) { history.replaceState(null, '', '#/'); location.reload(); return; } // جهاز مشترك: لا تبقى بيانات المنصة بعد الخروج
  App.dirty = false;
  location.hash = '#/';
  ['#side', '#topbar', '#main'].forEach((s) => { const e = $(s); if (e) e.innerHTML = ''; });
  showLogin();
}

/* — أسماء المستخدمين بصيغة البريد (مثل admin@murooj): بدل قائمة الحسابات في شاشة الدخول.
   الثابت منها للحسابات المعروفة، ويمكن لإدارة الشراكات تعديل أي اسم من «الحسابات وكلمات المرور»
   (يُحفظ في org.usernames فيظهر قبل الدخول)، والحساب الجديد يأخذ اسمًا منقولًا من اسمه العربي. — */
const LG_DOMAIN = 'murooj';
const LG_FIXED = {
  sysadmin: 'sysadmin', admin: 'admin', viewer: 'board',
  'team:وعد': 'waad', 'team:رنيم': 'raneem', 'team:عبدالله': 'abdullah', 'team:العنود': 'alanoud',
  'dept:الإدارة العامة للمشاريع': 'projects', 'dept:إدارة المشاريع': 'projects', 'dept:إدارة تطوير الأعمال': 'bizdev',
  'dept:الإدارة العامة للاتصال المؤسسي': 'comms', 'dept:إدارة الاتصال المؤسسي': 'comms', 'dept:الإدارة العامة للمشاركة المجتمعية': 'community', 'dept:إدارة المشاركة المجتمعية': 'community',
  'dept:الإدارة العامة للاستراتيجية': 'strategy', 'dept:الإدارة العامة للموارد البشرية والشؤون الإدارية': 'hr', 'dept:الإدارة القانونية': 'legal', 'dept:الإدارة المالية': 'finance',
};
function lgTranslit(s) {
  const M = { 'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'e', 'ؤ': 'o', 'ء': '' };
  const t = String(s || '').replace(/^(الإدارة العامة ل?ل?|إدارة |الإدارة )/, '').replace(/[ً-ْـ]/g, '').split('').map((c) => (M[c] !== undefined ? M[c] : /[a-z0-9]/i.test(c) ? c.toLowerCase() : c === ' ' ? '.' : '')).join('');
  return t.replace(/\.+/g, '.').replace(/^\.|\.$/g, '').slice(0, 24) || 'user';
}
/* خريطة الحساب ← اسم المستخدم، بلا تكرار */
function accUsers() {
  const own = (D.settings.org && D.settings.org.usernames) || {}, used = new Set(), out = new Map();
  authAccounts().forEach((a) => {
    let u = String(own[a.id] || LG_FIXED[a.id] || lgTranslit(a.role === 'team' ? a.member : a.t)).toLowerCase().replace(/@.*$/, '');
    let k = u, n = 2; while (used.has(k)) k = u + n++;
    used.add(k); out.set(a.id, k + '@' + LG_DOMAIN);
  });
  return out;
}
const accUser = (a) => (a ? accUsers().get(a.id) || '' : '');
function accByUser(v) {
  let u = String(v || '').trim().toLowerCase().replace(/\s+/g, ''); if (!u) return null;
  if (!u.includes('@')) u += '@' + LG_DOMAIN;
  for (const [id, x] of accUsers()) if (x === u) return authAccounts().find((a) => a.id === id) || null;
  return null;
}

/* — خلفية الدخول الحية: «شبكة الشراكات» — نقاط تسبح ببطء وتتصل كلما اقتربت، وومضات ذهبية تسري على الروابط،
   وتتجاوب الشبكة مع مؤشر الفأرة. تتوقف تلقائيًا عند إغلاق الشاشة، وتثبت لمن فعّل تقليل الحركة. — */
function lgNet(root) {
  const cv = root.querySelector('.lg-net'); if (!cv || !cv.getContext) return;
  const cx = cv.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, P = [], pulses = [], mouse = null, raf = 0, t0 = performance.now();
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, Math.max(34, W * H / 17000)));
    P = Array.from({ length: n }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22, r: 1 + Math.random() * 1.8, g: i % 7 === 0, ph: Math.random() * 6.28 })); };
  size();
  const D2 = () => Math.min(170, Math.max(120, W / 9));
  const frame = (now) => {
    if (!root.isConnected) { cancelAnimationFrame(raf); removeEventListener('resize', size); return; }
    const t = (now - t0) / 1000, L = D2();
    cx.clearRect(0, 0, W, H);
    for (const p of P) {
      if (!still) { p.x += p.vx; p.y += p.vy; if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20; if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20; }
      if (mouse) { const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy); if (d < 140 && d > 0.1) { p.x += dx / d * 0.35; p.y += dy / d * 0.35; } }
    }
    cx.lineWidth = 1;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d > L) continue;
      const k = 1 - d / L; cx.strokeStyle = (a.g || b.g) ? `rgba(230,199,134,${0.28 * k})` : `rgba(168,214,196,${0.2 * k})`;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
      if (!still && k > 0.55 && Math.random() < 0.0009 && pulses.length < 10) pulses.push({ a: i, b: j, s: 0 });
    }
    if (mouse) for (const p of P) { const d = Math.hypot(p.x - mouse.x, p.y - mouse.y); if (d < 190) { cx.strokeStyle = `rgba(230,199,134,${0.32 * (1 - d / 190)})`; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(mouse.x, mouse.y); cx.stroke(); } }
    for (const p of P) {
      const tw = 0.55 + 0.45 * Math.sin(t * 1.6 + p.ph);
      cx.fillStyle = p.g ? `rgba(240,217,160,${0.55 + 0.4 * tw})` : `rgba(200,232,218,${0.35 + 0.35 * tw})`;
      cx.beginPath(); cx.arc(p.x, p.y, p.r * (p.g ? 1.35 : 1), 0, 6.283); cx.fill();
      if (p.g) { cx.fillStyle = `rgba(240,217,160,${0.08 * tw})`; cx.beginPath(); cx.arc(p.x, p.y, p.r * 6, 0, 6.283); cx.fill(); }
    }
    pulses = pulses.filter((q) => {
      const a = P[q.a], b = P[q.b]; if (!a || !b) return false; q.s += 0.012;
      const x = a.x + (b.x - a.x) * q.s, y = a.y + (b.y - a.y) * q.s;
      const g = cx.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, 'rgba(255,236,190,.95)'); g.addColorStop(1, 'rgba(255,236,190,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, 9, 0, 6.283); cx.fill();
      return q.s < 1;
    });
    if (!still) raf = requestAnimationFrame(frame);
  };
  addEventListener('resize', size);
  root.addEventListener('pointermove', (e) => { mouse = { x: e.clientX, y: e.clientY }; });
  root.addEventListener('pointerleave', () => { mouse = null; });
  raf = requestAnimationFrame(frame);
}

/* شاشة الدخول */
function lgOpts(A, sel) { return [...new Set(A.map((a) => a.g))].map((g) => `<optgroup label="${esc(g)}">${A.filter((a) => a.g === g).map((a) => `<option value="${esc(a.id)}" ${a.id === sel ? 'selected' : ''}>${esc(a.t)}</option>`).join('')}</optgroup>`).join(''); }
function showLogin(done) {
  const old = $('#shkLogin'); if (old) old.remove();
  let A = authAccounts();
  let last = ''; try { last = localStorage.getItem('shk_last_user') || ''; } catch (_) { /* */ }
  const img = (k) => ((typeof ASSET_IMG !== 'undefined' && ASSET_IMG[k]) || {}).src || '';
  const o = D.settings.org;
  const el = document.createElement('div'); el.id = 'shkLogin'; el.className = 'lg-glass';
  el.innerHTML = `<div class="lg-bg lg-calm"></div><div class="calm-deco fixed" aria-hidden="true"><i class="cd-a"></i><i class="cd-b"></i><i class="cd-c"></i><span class="cd-lines"></span></div><div class="lg-veil lg-calm"></div><canvas class="lg-net" aria-hidden="true"></canvas>
    <form class="lg-card" autocomplete="off" novalidate><span class="lg-ring" aria-hidden="true"></span>
      ${img('murooj-logo-white') ? `<img class="lg-logo" src="${img('murooj-logo-white')}" alt="${esc(o.name)}">` : ''}
      <h1>${esc(o.platform)}</h1><p class="lg-sub">${esc(o.name)}</p>
      <div class="field"><label for="lgUser">اسم المستخدم</label><div class="lg-user"><input class="in" id="lgUser" type="text" dir="ltr" inputmode="email" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="name@${LG_DOMAIN}" value="${esc(last)}"><span class="lg-at">${icon('users')}</span></div></div>
      <div class="field"><label for="lgPw">كلمة المرور</label><div class="lg-pw"><input class="in" id="lgPw" type="password" autocomplete="current-password" dir="ltr"><button type="button" class="icon-btn" data-lgeye aria-label="إظهار كلمة المرور">${icon('eye')}</button></div></div>
      <label class="lg-rem"><input type="checkbox" id="lgRem" checked> تذكّرني على هذا الجهاز</label>
      <div class="lg-err" id="lgErr" role="alert"></div>
      <button class="btn primary lg-go" type="submit">${icon('lock')} دخول</button>
      <small class="lg-note">لنسيان كلمة المرور تواصل مع إدارة الشراكات.</small>
    </form>`;
  document.body.appendChild(el);
  lgNet(el);
  const boot = $('#boot'); if (boot) { boot.classList.add('out'); setTimeout(() => boot.remove(), 400); }
  const pw = $('#lgPw', el), err = $('#lgErr', el);
  setTimeout(() => ($('#lgUser', el).value ? pw : $('#lgUser', el)).focus(), 60);
  /* المنصة المشتركة: قائمة الإدارات وأعضاء الفريق كما هي على الخادم */
  if (Cloud.on) Cloud.loadPublic().catch(() => {});
  $('[data-lgeye]', el).onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; };
  $('form', el).onsubmit = async (e) => {
    e.preventDefault();
    if (Date.now() < AUTH.lockUntil) { err.textContent = `محاولات كثيرة. حاول بعد ${Math.ceil((AUTH.lockUntil - Date.now()) / 1000)} ثانية.`; return; }
    const a = accByUser($('#lgUser', el).value);
    try { if ($('#lgRem', el).checked && a) localStorage.setItem('shk_last_user', accUser(a)); else localStorage.removeItem('shk_last_user'); } catch (_) { /* */ }
    if (!$('#lgUser', el).value.trim()) { err.textContent = 'اكتب اسم المستخدم.'; $('#lgUser', el).focus(); return; }
    if (Cloud.on) return cloudLoginSubmit(el, a, done);
    if (!a || !authCheck(a, pw.value)) {
      AUTH.fails++; if (AUTH.fails >= 5) { AUTH.lockUntil = Date.now() + 30000; AUTH.fails = 0; }
      err.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.'; pw.select(); el.querySelector('.lg-card').classList.remove('shake'); void el.offsetWidth; el.querySelector('.lg-card').classList.add('shake'); return;
    }
    AUTH.fails = 0;
    await authLogin(a, $('#lgRem', el).checked);
    el.classList.add('out'); setTimeout(() => el.remove(), 500);
    renderShell(); route();
    if (done) done();
    const n = wfTasks().filter((t) => !t.follow).length;
    toast(`مرحبًا — ${a.t}${n ? ` · ${plural(n, 'مهمة واحدة', 'مهمتان', 'مهام', 'مهمة')} بانتظارك` : ''}`);
  };
}

/* الدخول عبر الخادم: التحقق هناك، ثم سحب بيانات المنصة المشتركة */
async function cloudLoginSubmit(el, a, done) {
  const pw = $('#lgPw', el), err = $('#lgErr', el), btn = $('.lg-go', el);
  const shake = () => { const c = el.querySelector('.lg-card'); c.classList.remove('shake'); void el.offsetWidth; c.classList.add('shake'); };
  if (!pw.value) { err.textContent = 'اكتب كلمة المرور.'; return; }
  if (!a) { await new Promise((r) => setTimeout(r, 600)); err.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.'; pw.select(); shake(); return; }
  btn.disabled = true; err.textContent = ''; btn.classList.add('busy');
  let r;
  try { r = await Cloud.login(a.id, pw.value); }
  catch (e) { btn.disabled = false; btn.classList.remove('busy'); err.textContent = e.offline ? 'تعذّر الاتصال بالخادم. تأكد من الإنترنت ثم حاول مرة أخرى.' : 'تعذّر تسجيل الدخول: ' + e.message; return; }
  if (!r || r.error) {
    btn.disabled = false; btn.classList.remove('busy');
    err.textContent = r && r.error === 'locked' ? `محاولات خاطئة كثيرة — الحساب مقفل مؤقتًا. حاول بعد ${Math.ceil((r.wait || 60) / 60)} دقيقة.` : 'اسم المستخدم أو كلمة المرور غير صحيحة.';
    pw.select(); shake(); return;
  }
  await authLogin(a, $('#lgRem', el).checked, r);
  btn.innerHTML = `${icon('db')} جارٍ تحميل بيانات المنصة…`;
  if (!(await cloudEnter())) return;
  await Repo.log('auth.login', 'account', a.id, a.t, '');
  applyTheme();
  el.classList.add('out'); setTimeout(() => el.remove(), 500);
  renderShell(); route(); splashSync();
  if (done) done();
  const n = wfTasks().filter((t) => !t.follow).length;
  toast(`مرحبًا — ${a.t}${n ? ` · ${plural(n, 'مهمة واحدة', 'مهمتان', 'مهام', 'مهمة')} بانتظارك` : ''}`);
}

/* قائمة الحساب في الشريط العلوي */
function accountMenu() {
  if (AUTH.dev && !currentLogin()) return roleDialog();
  const a = authAccounts().find((x) => x.id === currentAccountId()) || {};
  const sys = isSysAdmin();
  const m = Modal.open({
    title: 'حسابي', size: 'sm', cls: 'acc-menu',
    body: `<div class="am-who"><span class="av">${icon(sys ? 'lock' : 'user')}</span><div><b>${esc(accountLabel())}</b><small>${esc(sys ? 'الحساب الرئيسي — كل الصلاحيات' : (ROLES[Session.role()] || {}).label || '')}</small></div></div>
      <div class="am-acts">
        ${sys || (currentLogin() || {}).sys ? '' : `<button class="btn" type="button" data-am="pw">${icon('lock')} تغيير كلمة المرور</button>`}
        ${sys ? `<button class="btn" type="button" data-am="as">${icon('users')} الدخول بحساب آخر للمعاينة</button>` : ''}
        ${!sys && (currentLogin() || {}).sys ? `<button class="btn primary" type="button" data-am="back">${icon('lock')} العودة إلى مدير النظام</button>` : ''}
        ${authCanManage() ? `<a class="btn ghost" href="#/settings/roles" data-mclose>${icon('settings')} إدارة الحسابات</a>` : ''}
        <button class="btn danger" type="button" data-am="out">${icon('x')} تسجيل الخروج</button>
      </div>
      ${sys ? '<p class="xs muted" style="margin-top:10px">كلمة مرور مدير النظام محمية: لا تظهر لأي حساب ولا تُغيَّر من المنصة.</p>' : ''}`,
  });
  m.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-am]'); if (!b) return;
    m.close();
    if (b.dataset.am === 'out') return authLogout();
    if (b.dataset.am === 'as') return roleDialog();
    if (b.dataset.am === 'back') { authApply(currentLogin()); await Repo.saveSettings(); App.dirty = false; renderShell(); route(); return toast('عدت إلى حساب مدير النظام'); }
    if (b.dataset.am === 'pw') return passwordDialog(a, true);
  });
  return m;
}
function passwordDialog(a, self) {
  if (!a || a.sys) return toast('كلمة مرور مدير النظام محمية ولا يمكن تغييرها.', 'err');
  const m = Modal.open({
    title: self ? 'تغيير كلمة المرور' : 'تعيين كلمة مرور — ' + a.t, size: 'sm',
    body: `${self ? `<div class="field"><label>كلمة المرور الحالية</label><input class="in" type="password" id="pwOld" dir="ltr" autocomplete="current-password"></div>` : `<p class="small muted" style="margin-bottom:10px">ستحل محل كلمة المرور الحالية لحساب «${esc(a.t)}». أبلغ صاحب الحساب بها.</p>`}
      <div class="field"><label>كلمة المرور الجديدة</label><input class="in" type="password" id="pwNew" dir="ltr" autocomplete="new-password"><span class="hint">4 أحرف على الأقل.</span></div>
      <div class="field"><label>تأكيد كلمة المرور</label><input class="in" type="password" id="pwNew2" dir="ltr" autocomplete="new-password"></div>
      <div class="lg-err" id="pwErr" role="alert"></div>`,
    foot: `<button class="btn primary" data-ok>حفظ</button><button class="btn ghost" data-mclose>إلغاء</button>`,
  });
  m.el.querySelector('[data-ok]').onclick = async () => {
    const er = $('#pwErr', m.el), nv = $('#pwNew', m.el).value;
    if (self && !Cloud.on && !authCheck(a, $('#pwOld', m.el).value)) { er.textContent = 'كلمة المرور الحالية غير صحيحة.'; return; }
    if (nv.length < 4) { er.textContent = 'كلمة المرور قصيرة.'; return; }
    if (nv !== $('#pwNew2', m.el).value) { er.textContent = 'التأكيد لا يطابق كلمة المرور الجديدة.'; return; }
    try { await authSetPassword(a.id, nv, undefined, self ? $('#pwOld', m.el).value : undefined); m.close(); toast('حُفظت كلمة المرور'); if (App.route && App.route.name === 'settings') route(); } catch (e) { er.textContent = e.message; }
  };
}
/* لوحة الحسابات في الإعدادات */
function authSettingsHTML() {
  const me = currentLogin() || authAccounts().find((x) => x.id === currentAccountId());
  if (!authCanManage()) {
    return `<div class="panel" id="setMyAcc"><div class="panel-h"><h3>حسابي</h3><span class="sub">${esc(accountLabel())}</span></div><div class="panel-b">
      <p class="small muted" style="margin-bottom:12px">يمكنك تغيير كلمة مرور حسابك. لإعادة تعيينها عند نسيانها تواصل مع إدارة الشراكات.</p>
      ${me && !me.sys ? `<button class="btn" type="button" data-pwself>${icon('lock')} تغيير كلمة المرور</button>` : ''}</div></div>`;
  }
  const A = authAccounts();
  if (Cloud.on && !Cloud.pwSet && !Cloud.pwLoading) { Cloud.pwLoading = true; Cloud.loadPwStatus().then(() => { Cloud.pwLoading = false; const p = $('#setPw'); if (p && Cloud.pwSet) p.outerHTML = authSettingsHTML(); }); }
  return `<div class="panel" id="setPw"><div class="panel-h"><h3>الحسابات وكلمات المرور</h3><span class="sub">إدارة الشراكات تملك كامل الصلاحيات وتعيّن كلمات مرور الحسابات؛ حساب مدير النظام محمي</span></div><div class="panel-b">
    <div class="tbl-wrap"><table class="tbl pw-tbl"><thead><tr><th>الحساب</th><th>اسم المستخدم</th><th>المجموعة</th><th>الصلاحية</th><th>كلمة المرور</th><th></th></tr></thead><tbody>
    ${A.map((a) => `<tr data-pwrow="${esc(a.id)}"><td><b>${esc(a.t)}</b></td><td><code class="pw-user" dir="ltr">${esc(accUser(a))}</code>${a.sys ? '' : ` <button class="linkbtn xs" type="button" data-userset="${esc(a.id)}" title="تغيير اسم المستخدم">${icon('edit')}</button>`}</td><td>${esc(a.g)}</td><td>${esc(a.sys ? 'كل الصلاحيات (الحساب الرئيسي)' : a.role === 'admin' ? 'كامل الصلاحيات' : ROLES[a.role].label)}</td>
      <td>${a.sys ? `<span class="chip pw-lock">${icon('lock')} محمية — لا تظهر ولا تُغيَّر</span>` : Cloud.on && !Cloud.pwSet ? '<span class="chip">…</span>' : authIsDefault(a) ? '<span class="chip warn">افتراضية</span>' : '<span class="chip ok">مخصّصة</span>'}</td>
      <td class="pw-acts">${a.sys ? '' : `<button class="btn sm" type="button" data-pwset="${esc(a.id)}">تعيين</button>${authIsDefault(a) ? '' : `<button class="btn sm ghost" type="button" data-pwreset="${esc(a.id)}">الافتراضية</button>`}`}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="xs muted" style="margin-top:10px">${Cloud.on ? 'كلمات المرور محفوظة على خادم المنصة المشتركة مشفّرة (bcrypt) ولا يمكن عرضها لأحد؛ يمكن فقط تعيين كلمة جديدة، وتغييرها يُنهي جلسات الحساب المفتوحة على الأجهزة الأخرى. يُقفل الحساب 5 دقائق بعد 5 محاولات دخول خاطئة.' : 'كلمات المرور تُحفظ مشفّرة (بصمة) ولا يمكن عرضها؛ يمكن فقط تعيين كلمة جديدة. هذه حماية على مستوى المنصة في المتصفح، والحماية الكاملة تكون بربط المنصة بخادم.'}</p>
  </div></div>`;
}
function authSettingsClick(e) {
  const s = e.target.closest('[data-pwset]'); if (s) { passwordDialog(authAccounts().find((x) => x.id === s.dataset.pwset), !!(currentLogin() && currentLogin().id === s.dataset.pwset)); return true; }
  const r = e.target.closest('[data-pwreset]');
  if (r) { const a = authAccounts().find((x) => x.id === r.dataset.pwreset); confirmDlg(`إعادة كلمة مرور «${a.t}» إلى الافتراضية؟`, { ok: 'إعادة' }).then(async (y) => { if (!y) return; await authSetPassword(a.id, null); toast('أُعيدت إلى الافتراضية'); route(); }); return true; }
  const us = e.target.closest('[data-userset]');
  if (us) {
    const a = authAccounts().find((x) => x.id === us.dataset.userset);
    inputDlg({ title: 'اسم المستخدم — ' + a.t, label: `أحرف إنجليزية وأرقام فقط، ويُضاف @${LG_DOMAIN} تلقائيًا`, value: accUser(a).replace('@' + LG_DOMAIN, '') }).then(async (v) => {
      if (v === null || v === undefined) return;
      const u = String(v).trim().toLowerCase().replace(/@.*$/, '');
      if (!/^[a-z0-9][a-z0-9._-]{1,29}$/.test(u)) return toast('اسم المستخدم: من 2 إلى 30 حرفًا إنجليزيًا أو رقمًا (ويُسمح بالنقطة والشرطة).', 'err');
      const other = accByUser(u); if (other && other.id !== a.id) return toast('هذا الاسم مستخدم لحساب آخر.', 'err');
      D.settings.org.usernames = { ...(D.settings.org.usernames || {}), [a.id]: u };
      await saveSet('اسم المستخدم', `${a.t}: ${u}@${LG_DOMAIN}`); toast('حُفظ اسم المستخدم'); route();
    });
    return true;
  }
  if (e.target.closest('[data-pwself]')) { passwordDialog(currentLogin() || authAccounts().find((x) => x.id === currentAccountId()), true); return true; }
  return false;
}
