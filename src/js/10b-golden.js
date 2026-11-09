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
async function toggleGolden(p, btn) {
  const on = !p.golden;
  p.golden = on ? { at: nowISO(), by: Session.userName() } : null;
  await Repo.save('partnerships', p);
  await Repo.log('partnership.golden', 'partnership', p.id, p.code || partnerName(p), on ? 'أُضيفت إلى الشراكات الذهبية' : 'أُزيلت من الشراكات الذهبية');
  if (btn) {
    btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on);
    btn.title = on ? 'إزالة من الشراكات الذهبية' : 'إضافة إلى الشراكات الذهبية';
    const l = btn.querySelector('.gstar-l'); if (l) l.textContent = on ? 'شراكة ذهبية' : 'تمييز كذهبية';
    if (on) goldBurst(btn);
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
