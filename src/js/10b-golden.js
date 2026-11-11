/* =====================================================================
   الشراكات الذهبية: نجمة في رأس كل شراكة تضيفها إلى قسم «الشراكات الذهبية» في الرئيسية
   (في الاتجاهين)، مع حركة احتفالية عند التمييز.
   ===================================================================== */
const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>';
const goldenList = () => visiblePartnerships().filter((p) => p.golden && !p.isDraft && (showDemo() || !p.demo)).sort((a, b) => ((a.golden.at || '') < (b.golden.at || '') ? 1 : -1));
const canGold = () => can('manage.content');
function goldStarHTML(p) {
  const on = !!p.golden;
  if (!canGold()) return on ? `<span class="gstar on ro" title="شراكة ذهبية">${STAR_SVG}</span>` : '';
  return `<button type="button" class="gstar ${on ? 'on' : ''} no-print" data-gstar aria-pressed="${on}" title="${on ? 'إزالة من الشراكات الذهبية' : 'إضافة إلى الشراكات الذهبية'}">${STAR_SVG}<span class="gstar-l">${on ? 'شراكة ذهبية' : 'تمييز كذهبية'}</span></button>`;
}
/* الحركة: النجمة تقفز وتدور، وحلقة تتسع، وشرارات ذهبية تتطاير */
function goldBurst(btn) {
  const fx = document.createElement('span'); fx.className = 'gburst';
  fx.innerHTML = '<i class="ring"></i>' + Array.from({ length: 14 }, (_, i) => `<i class="sp" style="--a:${(i / 14) * 360}deg;--d:${(i % 3) * 8 + 34}px;--s:${(i % 2) ? 5 : 7}px"></i>`).join('');
  btn.appendChild(fx);
  btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
  setTimeout(() => fx.remove(), 1100);
}
/* تمييز رسمي عند إضافة شراكة ذهبية: يخفت ما حولها قليلًا، ويظهر إطار ذهبي كامل يضم الشعار والاسم،
   وتتطاير منه نفس الشرارات الذهبية التي تخرج من النجمة، وتعبر لمعة فوقه ثم يعود كل شيء */
function goldTargetRect(btn) {
  const head = btn && btn.closest('.dhead-in');
  if (head) { /* رأس الشراكة: الشعار + الاسم والبيانات معًا */
    const parts = [head.querySelector(':scope > :first-child'), head.querySelector(':scope > .grow')].filter(Boolean).map((e) => e.getBoundingClientRect()).filter((r) => r.width);
    if (parts.length) return { left: Math.min(...parts.map((r) => r.left)), top: Math.min(...parts.map((r) => r.top)), right: Math.max(...parts.map((r) => r.right)), bottom: Math.max(...parts.map((r) => r.bottom)) };
  }
  const t = btn && btn.closest('.gcard, .pc, .pcard, .st-card, .bo-card, .sh-card, tr');
  return (t || btn) ? (t || btn).getBoundingClientRect() : null;
}
function goldSpotlight(btn) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = goldTargetRect(btn); if (!r) return;
  const old = document.querySelector('.gspot'); if (old) old.remove();
  const pad = 16, x = r.left - pad, y = r.top - pad, w = (r.right - r.left) + pad * 2, h = (r.bottom - r.top) + pad * 2, rad = 20;
  /* شرارات نجمية على محيط الإطار تنطلق للخارج */
  const per = 2 * (w + h), N = Math.max(22, Math.min(46, Math.round(per / 70)));
  const sparks = Array.from({ length: N }, (_, k) => {
    let d = (k + 0.5) / N * per, px, py, nx, ny;
    if (d < w) { px = x + d; py = y; nx = 0; ny = -1; } else if ((d -= w) < h) { px = x + w; py = y + d; nx = 1; ny = 0; } else if ((d -= h) < w) { px = x + w - d; py = y + h; nx = 0; ny = 1; } else { d -= w; px = x; py = y + h - d; nx = -1; ny = 0; }
    const dist = 34 + (k * 37) % 52, sz = k % 3 ? 9 : 13, jit = ((k * 53) % 21 - 10) / 10;
    return `<i class="gsf-sp" style="left:${px.toFixed(0)}px;top:${py.toFixed(0)}px;--dx:${(nx * dist + (ny ? jit * 14 : 0)).toFixed(0)}px;--dy:${(ny * dist + (nx ? jit * 14 : 0)).toFixed(0)}px;--s:${sz}px;--d:${(380 + (k % 7) * 60)}ms"></i>`;
  }).join('');
  const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([cx, cy], k) => `<i class="gsf-ring" style="left:${cx}px;top:${cy}px;--d:${300 + k * 90}ms"></i>`).join('');
  const el = document.createElement('div'); el.className = 'gspot gspot-formal'; el.setAttribute('aria-hidden', 'true');
  el.style.cssText = `--x:${x + w / 2}px;--y:${y + h / 2}px;--w:${w}px;--h:${h}px`;
  el.innerHTML = `<i class="gsf-veil"></i>
    <span class="gsf-box" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${rad}px"><i class="gsf-sh"></i><b class="c1"></b><b class="c2"></b><b class="c3"></b><b class="c4"></b></span>
    ${corners}${sparks}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
async function toggleGolden(p, btn) {
  const on = !p.golden;
  p.golden = on ? { at: nowISO(), by: Session.userName() } : null;
  await Repo.save('partnerships', p);
  await Repo.log('partnership.golden', 'partnership', p.id, p.code || partnerName(p), on ? 'أُضيفت إلى الشراكات الذهبية' : 'أُزيلت من الشراكات الذهبية');
  if (btn) {
    btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on);
    btn.title = on ? 'إزالة من الشراكات الذهبية' : 'إضافة إلى الشراكات الذهبية';
    const l = btn.querySelector('.gstar-l'); if (l) l.textContent = on ? 'شراكة ذهبية' : 'تمييز كذهبية';
    if (on) { goldBurst(btn); goldSpotlight(btn); }
  }
  toast(on ? `★ أُضيفت «${partnerName(p)}» إلى الشراكات الذهبية في الرئيسية` : 'أُزيلت من الشراكات الذهبية');
}
function goldCardHTML(p, i) {
  const pr = partnerById(p.partnerId) || {};
  const st = pStatus(p), dl = daysLeft(p);
  const s0 = parseDate(p.startDate), e0 = parseDate(p.endDate);
  const pct = s0 && e0 ? Math.max(0, Math.min(100, Math.round((today() - s0) / (e0 - s0) * 100))) : null;
  const ev = typeof lastEval === 'function' ? lastEval(p) : null;
  const outs = richItems(p.outputs).length;
  return `<a class="gcard" href="#/partnerships/${p.id}" style="--i:${i}">
    <span class="gc-shine" aria-hidden="true"></span>
    <span class="gc-star" aria-hidden="true">${STAR_SVG}</span>
    <div class="gc-top"><span class="gc-logo">${logoOrMono(pr, partnerName(p))}</span>
      <div class="gc-t"><b>${esc(partnerName(p))}</b><small>${[p.classification, pSector(p)].filter(Boolean).map(esc).join(' · ') || '&nbsp;'}</small></div></div>
    ${p.showcaseGoal || firstItem(p.cooperationAreas) ? `<p class="gc-q">${esc(trimP(p.showcaseGoal || firstItem(p.cooperationAreas)))}</p>` : ''}
    <div class="gc-facts">
      <div><span>الحالة</span><b>${esc(statusLabel(st))}</b></div>
      <div><span>آخر تقييم</span><b>${ev && ev.score !== null ? ev.score + '<small>/100</small>' : '—'}</b></div>
      <div><span>المخرجات</span><b>${outs || '—'}</b></div>
    </div>
    ${pct !== null ? `<div class="gc-term"><i style="width:${pct}%"></i></div><div class="gc-tl"><span>${fmtDate(p.startDate, 'short')}</span><span>${dl !== null && dl >= 0 ? `متبقٍ ${plural(dl, 'يوم', 'يومان', 'أيام', 'يومًا')}` : 'انتهت المدة'}</span><span>${fmtDate(p.endDate, 'short')}</span></div>` : ''}
  </a>`;
}
function goldSectionHTML(board) {
  const L_ = goldenList();
  if (!L_.length) {
    if (!canGold()) return '';
    return `<section class="hsec gold-sec empty ${board ? 'bo' : ''}"><div class="gold-head"><span class="gold-crest">${STAR_SVG}</span><div><h2>الشراكات الذهبية</h2><p>اضغط النجمة ★ في رأس أي شراكة لتظهر هنا.</p></div></div></section>`;
  }
  return `<section class="hsec gold-sec ${board ? 'bo bo-rv' : ''}" aria-label="الشراكات الذهبية">
    <div class="gold-bg" aria-hidden="true">${Array.from({ length: 18 }, (_, k) => `<i style="--x:${(k * 37) % 100}%;--y:${(k * 53) % 100}%;--k:${k}"></i>`).join('')}</div>
    <div class="gold-head"><span class="gold-crest">${STAR_SVG}</span><div><h2>الشراكات الذهبية</h2><p>شراكات نوعية اختارتها ${esc(D.settings.org.dept)} لأثرها وقيمتها الاستراتيجية</p></div><span class="gold-n">${L_.length}</span>${pshowBtn('golden')}</div>
    <div class="gold-grid ${L_.length === 1 ? 'one' : ''}">${L_.map(goldCardHTML).join('')}</div>
  </section>`;
}
/* شارة «شراكة ذهبية» في البطاقات والجدول: تتطاير منها شرارات النجمة نفسها عند ظهورها، ثم كل بضع ثوانٍ، وعند المرور عليها */
function goldBadgesLive(root = document) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...root.querySelectorAll('.pc-gold, .rt-gold')].filter((x) => !x._gl); if (!els.length) return;
  const fire = (b) => { if (b.isConnected && b._vis && !document.hidden) { goldBurst(b); b.classList.remove('gpop'); void b.offsetWidth; b.classList.add('gpop'); } };
  const io = new IntersectionObserver((ents) => ents.forEach((e) => { const b = e.target; b._vis = e.isIntersecting; if (e.isIntersecting && !b._first) { b._first = true; setTimeout(() => fire(b), 300 + Math.random() * 500); } }), { threshold: 0.6 });
  els.forEach((b, i) => {
    b._gl = true; io.observe(b);
    const card = b.closest('.pc, tr'); if (card) card.addEventListener('mouseenter', () => fire(b));
    const t = setInterval(() => { if (!b.isConnected) { clearInterval(t); io.unobserve(b); return; } fire(b); }, 6000 + i * 700);
  });
}
