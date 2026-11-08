/* =====================================================================
   الشاشة الافتتاحية: تظهر عند كل فتح أو إعادة تحميل.
   صورة كبيرة بحركة بطيئة، ونجمة هندسية تُرسم، وحلقات نمو تتسع من المركز،
   وجملة تُعدَّل من الإعدادات، وأرقام حية من آخر جلسة تُحدَّث فور تحميل البيانات.
   ملف مستقل لا يعتمد على بقية الشيفرة لأنه يعمل قبل تحميل البيانات.
   ===================================================================== */
const SPLASH_DEF = { on: true, text: 'نبني شراكات… تصنع أثرًا يبقى', sub: 'منظومة الشراكات — مؤسسة مروج الأهلية', bg: 'splash-bond', stats: true, dur: 3.4 };
const SPLASH_BGS = [['splash-bond', 'فجر الشراكة — لوحة فنية (نهران من الضوء يلتقيان)'], ['signings', 'لحظات توقيع الشراكات (صور متتابعة)'], ['splash-aerial', 'صورة جوية للغطاء النباتي'], ['splash-forest', 'غابة ومسطحات خضراء'], ['border-guard-signing', 'صورة توقيع مذكرة'], ['waqf-saitah-signing', 'صورة توقيع شراكة']];
function splashCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem('shk_splash') || '{}') || {}; } catch (e) { c = {}; } return { ...SPLASH_DEF, ...c }; }
function splashShow(force) {
  if (window.__SBX) return null;
  const cfg = splashCfg();
  let auto = false; try { auto = navigator.webdriver && !localStorage.getItem('shk_splash_force'); } catch (e) { auto = !!navigator.webdriver; }
  if (!force && (!cfg.on || auto)) return null;
  const old = document.getElementById('shkSplash'); if (old) old.remove();
  const esc_ = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const img = (k) => ((typeof ASSET_IMG !== 'undefined' && ASSET_IMG[k]) || {}).src || '';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = Math.max(1.5, Math.min(8, +cfg.dur || 3)) * (reduce ? 0.6 : 1);
  const el = document.createElement('div'); el.id = 'shkSplash'; el.setAttribute('role', 'presentation');
  if (document.documentElement.dataset.theme === 'dark') el.classList.add('dk');
  if (reduce) el.classList.add('rm');
  el.style.setProperty('--dur', dur + 's');
  const words = String(cfg.text || SPLASH_DEF.text).split(/\s+/).filter(Boolean);
  const S = cfg.statsVals;
  const stats = cfg.stats && S ? [[S.act, 'شراكة سارية'], [S.partners, 'جهة شريكة'], [S.sectors, 'قطاعات']].filter((x) => x[0] != null) : [];
  /* «لحظات التوقيع»: صور توقيع الشراكات الحقيقية تتعاقب ببطء، وفوقها حلقتان ذهبيتان تقتربان حتى تتشابكا (رمز الشراكة) */
  const SIGN = ['waqf-saitah-signing', 'border-guard-signing'].map(img).filter(Boolean);
  const bgs = cfg.bg === 'signings' && SIGN.length ? SIGN : [img(cfg.bg) || img('splash-aerial')];
  el.innerHTML = `${bgs.map((u, i) => `<div class="sp-bg ${bgs.length > 1 ? 'xf' : ''}" style="background-image:url('${u}');--k:${i};--n:${bgs.length}"></div>`).join('')}<div class="sp-veil ${bgs.length > 1 ? 'warm' : ''} ${cfg.bg === 'splash-bond' ? 'art' : ''}"></div>
    <svg class="sp-geo" viewBox="-300 -300 600 600" aria-hidden="true">
      ${[110, 165, 220, 275].map((r, i) => `<circle r="${r}" class="ring" style="--i:${i}"/>`).join('')}
      <g class="bond"><circle class="b1" r="118"/><circle class="b2" r="118"/><circle class="knot" cy="-100" r="6"/><circle class="knot" cy="100" r="6"/></g>
      ${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle class="dot" r="3" cx="${(Math.cos(a) * 220).toFixed(1)}" cy="${(Math.sin(a) * 220).toFixed(1)}" style="--i:${i}"/>`; }).join('')}
    </svg>
    <div class="sp-in">
      ${img('murooj-logo-white') ? `<img class="sp-logo" src="${img('murooj-logo-white')}" alt="مؤسسة مروج الأهلية">` : ''}
      <span class="sp-rule"></span>
      <h1>${words.map((w, i) => `<span style="animation-delay:${(0.45 + i * 0.12).toFixed(2)}s">${esc_(w)}</span>`).join(' ')}</h1>
      ${cfg.sub ? `<p>${esc_(cfg.sub)}</p>` : ''}
      <div class="sp-stats">${stats.map(([v, l], i) => `<span style="animation-delay:${(1.1 + i * 0.12).toFixed(2)}s"><b data-to="${+v || 0}">0</b>${esc_(l)}</span>`).join('')}</div>
    </div>
    <div class="sp-bar"><i></i></div><small class="sp-skip">اضغط للمتابعة</small>`;
  const put = () => {
    document.documentElement.classList.add('sp-lock'); // لا شريط تمرير ولا تمرير خلف الشاشة الافتتاحية
    document.body.appendChild(el);
    const count = () => el.querySelectorAll('.sp-stats b').forEach((b) => { const to = +b.dataset.to || 0, t0 = performance.now(), d = reduce ? 1 : 900; const step = (t) => { const k = Math.min(1, (t - t0) / d); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; setTimeout(() => requestAnimationFrame(step), reduce ? 0 : 1100); });
    count(); el._count = count;
    el._t = setTimeout(close, dur * 1000);
  };
  const close = () => { if (el.classList.contains('out')) return; clearTimeout(el._t); el.classList.add('out'); setTimeout(() => { el.remove(); if (!document.getElementById('shkSplash')) document.documentElement.classList.remove('sp-lock'); }, 700); document.removeEventListener('keydown', key); };
  const key = () => close();
  el.addEventListener('click', close);
  document.addEventListener('keydown', key);
  if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
  return el;
}
/* تُستدعى بعد تحميل البيانات: تحفظ الإعدادات والأرقام لتظهر فورًا في الفتح التالي، وتحدّث الأرقام إن كانت الشاشة ما زالت ظاهرة */
function splashSync() {
  if (window.__SBX) return;
  try {
    const s = (D.settings && D.settings.splash) || {};
    const nd = visiblePartnerships().filter((p) => !p.isDraft);
    const statsVals = { act: nd.filter((p) => ['active', 'soon'].includes(pStatus(p))).length, partners: new Set(nd.map((p) => p.partnerId)).size, sectors: new Set(nd.filter((p) => p.stage === 'signed').map(pSector).filter(Boolean)).size };
    localStorage.setItem('shk_splash', JSON.stringify({ ...SPLASH_DEF, ...s, statsVals }));
    const el = document.getElementById('shkSplash');
    if (el && !el.classList.contains('out') && s.stats !== false) {
      const box = el.querySelector('.sp-stats');
      const want = [[statsVals.act, 'شراكة سارية'], [statsVals.partners, 'جهة شريكة'], [statsVals.sectors, 'قطاعات']];
      if (box && !box.children.length) { box.innerHTML = want.map(([v, l], i) => `<span style="animation-delay:${(0.2 + i * 0.12).toFixed(2)}s"><b data-to="${v}">0</b>${l}</span>`).join(''); el._count && el._count(); }
      else box && box.querySelectorAll('b').forEach((b, i) => { b.dataset.to = want[i][0]; b.textContent = want[i][0]; });
    }
  } catch (e) { /* الشاشة الافتتاحية ليست حرجة */ }
}
splashShow();
