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
/* كشاف مسرح: يُطفأ المسرح تدريجيًا، ثم يضيء كشاف من الأعلى ويتأرجح حتى يستقر على الشراكة ببقعة ضوء ناعمة الحواف،
   ويبقى لحظة ثم يخفت كل شيء بهدوء. الشعاع مرسوم بتمويه SVG فحوافه ناعمة. */
function goldSpotlight(btn) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const tgt = (btn && (btn.closest('.gcard, .pc, .pcard, .st-card, .bo-card, .sh-card, tr') || ((document.querySelector('#main .dhead h1') || {}).parentElement || document.querySelector('#main .dhead-in, #main .dhead')))) || btn;
  if (!tgt) return;
  const old = document.querySelector('.gspot'); if (old) old.remove();
  const r = tgt.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const cx = Math.min(W - 40, Math.max(40, r.left + r.width / 2)), cy = Math.min(H - 40, Math.max(70, r.top + r.height / 2));
  const rx = Math.max(180, Math.min(W * 0.42, r.width * 0.6)), ry = Math.max(110, Math.min(H * 0.32, r.height * 0.7));
  const sx = cx < W / 2 ? Math.min(W - 80, cx + W * 0.18) : Math.max(80, cx - W * 0.18), sy = -60;
  const ang = Math.atan2(cx - sx, cy - sy) * 180 / Math.PI;
  const el = document.createElement('div'); el.className = 'gspot'; el.setAttribute('aria-hidden', 'true');
  el.style.cssText = `--x:${cx}px;--y:${cy}px;--rx:${rx}px;--ry:${ry}px;--sx:${sx}px;--sy:${sy}px;--ang:${(-ang).toFixed(1)}deg`;
  const len = Math.hypot(cx - sx, cy - sy) + ry * 0.4, half = rx * 0.92;
  el.innerHTML = `<i class="gspot-veil"></i>
    <svg class="gspot-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
      <filter id="gsBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter><filter id="gsBlur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(rx * 0.07)}"/></filter>
      <linearGradient id="gsBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E0" stop-opacity=".9"/><stop offset=".55" stop-color="#FFEAB8" stop-opacity=".45"/><stop offset="1" stop-color="#FFE6B0" stop-opacity=".12"/></linearGradient>
      <radialGradient id="gsPool"><stop offset="0" stop-color="#FFF1D2" stop-opacity=".7"/><stop offset=".55" stop-color="#FFE3A8" stop-opacity=".22"/><stop offset="1" stop-color="#FFE3A8" stop-opacity="0"/></radialGradient></defs>
      <g class="gspot-cone" style="transform-origin:${sx}px ${sy}px"><polygon points="${sx - 14},${sy} ${sx + 14},${sy} ${sx + half},${sy + len} ${sx - half},${sy + len}" fill="url(#gsBeam)" filter="url(#gsBlur)" transform="rotate(${(-ang).toFixed(1)} ${sx} ${sy})"/></g>
      <ellipse class="gspot-pool" cx="${cx}" cy="${cy}" rx="${rx * 1.05}" ry="${ry * 1.05}" fill="url(#gsPool)" filter="url(#gsBlur2)"/>
      <circle cx="${sx}" cy="${sy + 24}" r="26" class="gspot-src" fill="#FFF6E0" filter="url(#gsBlur)"/></svg>
    ${Array.from({ length: 18 }, () => { const t = 0.15 + Math.random() * 0.8, x = sx + (cx - sx) * t + (Math.random() - 0.5) * half * t * 1.4, y = sy + (cy - sy) * t; return `<b class="gspot-dust" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--d:${(0.9 + Math.random() * 0.9).toFixed(2)}s"></b>`; }).join('')}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3300);
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
