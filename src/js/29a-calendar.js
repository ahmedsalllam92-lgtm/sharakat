/* =====================================================================
   تقويم الشراكات: كل المواعيد في مكان واحد
   — توقيع/بدء السريان، الانتهاء، تقييم التجديد (قبل 60 يومًا)، فترة خطة التفعيل، والاجتماعات المضافة.
   — عرض شهري وأجندة، وفلاتر بالنوع، والتاريخ الهجري تحت الميلادي.
   — تصدير ملف ‎.ics‎ (يُفتح في Outlook وGoogle وتقويم الجوال)، وإضافة أي موعد لتقويم Google أو Outlook مباشرة.
   الاجتماعات تُحفظ داخل سجل الشراكة (p.meetings) فتتزامن مع المنصة المشتركة.
   ===================================================================== */
const CAL_TYPES = {
  sign: { l: 'توقيع وبدء السريان', c: '#2F7A5E', ic: 'check' },
  end: { l: 'انتهاء الشراكة', c: '#B5543C', ic: 'flag' },
  renew: { l: 'تقييم التجديد', c: '#B88A3B', ic: 'history' },
  act: { l: 'خطة التفعيل', c: '#3E7C93', ic: 'layers' },
  meet: { l: 'اجتماع', c: '#5B5BA8', ic: 'users' },
};
const CAL_WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const calHijri = (d) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long' }).format(d); } catch (_) { return ''; } };
const calHijriMonth = (d) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { month: 'long', year: 'numeric' }).format(d); } catch (_) { return ''; } };

/* كل الأحداث من السجلات المرئية للحساب الحالي */
function calEvents() {
  const E = [];
  const list = visiblePartnerships().filter((p) => !p.isDraft && p.stage !== 'cancel');
  for (const p of list) {
    const nm = partnerName(p), base = { pid: p.id, name: nm, code: p.code || '', href: '#/partnerships/' + p.id };
    if (p.startDate) E.push({ ...base, id: 'sign-' + p.id, type: 'sign', date: String(p.startDate).slice(0, 10), t: `${p.stage === 'signed' ? 'بدء سريان الشراكة' : 'موعد بدء الشراكة'} مع ${nm}` });
    if (p.endDate) {
      E.push({ ...base, id: 'end-' + p.id, type: 'end', date: String(p.endDate).slice(0, 10), t: `انتهاء الشراكة مع ${nm}` });
      const e = parseDate(p.endDate); if (e) E.push({ ...base, id: 'renew-' + p.id, type: 'renew', date: isoDate(addDays(e, -60)), t: `تقييم تجديد الشراكة مع ${nm}`, sub: 'قبل الانتهاء بـ60 يومًا' });
    }
    const act = p.forms && p.forms.activation && p.forms.activation.data;
    if (act && act.from) E.push({ ...base, id: 'actf-' + p.id, type: 'act', date: String(act.from).slice(0, 10), t: `بدء خطة التفعيل — ${nm}`, ...(act.to ? { endDate: String(act.to).slice(0, 10) } : {}) });
    if (act && act.to) E.push({ ...base, id: 'actt-' + p.id, type: 'act', date: String(act.to).slice(0, 10), t: `نهاية خطة التفعيل — ${nm}` });
    (p.meetings || []).forEach((m) => E.push({ ...base, id: 'meet-' + m.id, mid: m.id, type: 'meet', date: m.date, time: m.time || '', dur: +m.dur || 60, place: m.place || '', notes: m.notes || '', t: m.title || `اجتماع مع ${nm}` }));
  }
  return E.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date)).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
}

/* ===== التصدير للتقاويم ===== */
const calICSDate = (d) => d.replace(/-/g, '');
const calICSEsc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => '\\' + m);
function calTimes(e) {
  if (!e.time) { const d = parseDate(e.date), n = addDays(d, 1); return { allDay: true, s: calICSDate(e.date), e: calICSDate(isoDate(n)) }; }
  const [h, mi] = e.time.split(':').map(Number); const d = parseDate(e.date); d.setHours(h, mi || 0, 0, 0); const n = new Date(d.getTime() + (e.dur || 60) * 60000);
  const f = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  return { allDay: false, s: f(d), e: f(n) };
}
function calICS(events) {
  const L_ = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Murooj//Sharakat Calendar//AR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:تقويم الشراكات — مروج', 'X-WR-TIMEZONE:Asia/Riyadh'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  for (const e of events) {
    const T = calTimes(e);
    L_.push('BEGIN:VEVENT', `UID:${e.id}@sharakat-murooj`, `DTSTAMP:${stamp}`,
      T.allDay ? `DTSTART;VALUE=DATE:${T.s}` : `DTSTART;TZID=Asia/Riyadh:${T.s}`, T.allDay ? `DTEND;VALUE=DATE:${T.e}` : `DTEND;TZID=Asia/Riyadh:${T.e}`,
      `SUMMARY:${calICSEsc(e.t)}`, `DESCRIPTION:${calICSEsc([CAL_TYPES[e.type].l, e.code, e.sub, e.notes].filter(Boolean).join(' — '))}`, ...(e.place ? [`LOCATION:${calICSEsc(e.place)}`] : []),
      ...(e.type === 'renew' || e.type === 'end' ? ['BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', `DESCRIPTION:${calICSEsc(e.t)}`, 'END:VALARM'] : []), 'END:VEVENT');
  }
  L_.push('END:VCALENDAR');
  return L_.join('\r\n');
}
function calDownload(events, name = 'تقويم-الشراكات') {
  const blob = new Blob([calICS(events)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.ics'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(`صُدّر ${events.length} موعدًا — افتح الملف لإضافته إلى Outlook أو Google أو تقويم الجوال`);
}
function calGoogleURL(e) {
  const T = calTimes(e);
  return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: e.t, dates: `${T.s}/${T.e}`, details: [CAL_TYPES[e.type].l, e.code, e.notes].filter(Boolean).join(' — '), location: e.place || '', ctz: 'Asia/Riyadh' });
}
function calOutlookURL(e) {
  const T = calTimes(e), iso = (s) => (s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:00`);
  return 'https://outlook.office.com/calendar/0/deeplink/compose?' + new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: e.t, startdt: iso(T.s), enddt: iso(T.e), allday: T.allDay ? 'true' : 'false', body: [CAL_TYPES[e.type].l, e.code, e.notes].filter(Boolean).join(' — '), location: e.place || '' });
}

/* ===== الصفحة ===== */
function renderCalendar(el, r) {
  const st = App.cal = App.cal || { view: 'month', y: today().getFullYear(), m: today().getMonth(), off: new Set() };
  const q = r.query || {}; if (q.d && /^\d{4}-\d{2}/.test(q.d)) { st.y = +q.d.slice(0, 4); st.m = +q.d.slice(5, 7) - 1; }
  const all = calEvents();
  const canEdit = can('edit.partnership') && !App.share;
  const draw = () => {
    const ev = all.filter((e) => !st.off.has(e.type));
    const td = isoDate(today());
    const upcoming = ev.filter((e) => e.date >= td);
    const in30 = upcoming.filter((e) => e.date <= isoDate(addDays(today(), 30)));
    const first = new Date(st.y, st.m, 1), startPad = first.getDay(), days = new Date(st.y, st.m + 1, 0).getDate();
    const cells = []; for (let i = 0; i < startPad; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(new Date(st.y, st.m, d)); while (cells.length % 7) cells.push(null);
    const byDay = {}; ev.forEach((e) => { (byDay[e.date] = byDay[e.date] || []).push(e); });
    const chip = (e) => `<button type="button" class="cal-ev t-${e.type}" data-ev="${esc(e.id)}" style="--c:${CAL_TYPES[e.type].c}" title="${esc(e.t)}"><i></i><span>${e.time ? `<b>${e.time}</b> ` : ''}${esc(e.t)}</span></button>`;
    const month = `<div class="cal-grid"><div class="cal-wd">${CAL_WD.map((w) => `<span>${w}</span>`).join('')}</div><div class="cal-days">${cells.map((d) => {
      if (!d) return '<div class="cal-d out"></div>';
      const k = isoDate(d), L_ = byDay[k] || [];
      return `<div class="cal-d ${k === td ? 'today' : ''} ${d.getDay() === 5 || d.getDay() === 6 ? 'we' : ''}" data-day="${k}"><div class="cal-dh"><b>${d.getDate()}</b><small>${calHijri(d)}</small>${canEdit ? `<button type="button" class="cal-add" data-addday="${k}" title="إضافة اجتماع">${icon('plus')}</button>` : ''}</div>
        <div class="cal-evs">${L_.slice(0, 3).map(chip).join('')}${L_.length > 3 ? `<button type="button" class="cal-more" data-more="${k}">+${L_.length - 3} أخرى</button>` : ''}</div></div>`;
    }).join('')}</div></div>`;
    const groups = {}; upcoming.slice(0, 160).forEach((e) => { const k = e.date.slice(0, 7); (groups[k] = groups[k] || []).push(e); });
    const agenda = upcoming.length ? `<div class="cal-agenda">${Object.entries(groups).map(([k, L_]) => `<section><h3>${MONTHS[+k.slice(5) - 1]} ${k.slice(0, 4)} <small>${calHijriMonth(parseDate(k + '-15'))}</small></h3>
      ${L_.map((e) => { const d = parseDate(e.date), left = daysBetween(today(), d); return `<button type="button" class="cal-row" data-ev="${esc(e.id)}" style="--c:${CAL_TYPES[e.type].c}">
        <span class="cal-date"><b>${d.getDate()}</b><small>${CAL_WD[d.getDay()]}</small></span><span class="cal-ic">${icon(CAL_TYPES[e.type].ic)}</span>
        <span class="cal-tx"><b>${esc(e.t)}</b><small>${CAL_TYPES[e.type].l}${e.time ? ` · ${e.time}` : ''}${e.place ? ` · ${esc(e.place)}` : ''}${e.code ? ` · ${esc(e.code)}` : ''}</small></span>
        <span class="cal-left ${left <= 7 ? 'hot' : ''}">${left === 0 ? 'اليوم' : left === 1 ? 'غدًا' : `بعد ${left} يومًا`}</span></button>`; }).join('')}</section>`).join('')}</div>`
      : emptyHTML({ ic: 'calendar', title: 'لا مواعيد قادمة', text: 'تظهر هنا مواعيد التوقيع والانتهاء والتجديد والاجتماعات.' });
    el.innerHTML = `<div class="ph"><div><h1>تقويم الشراكات</h1><p>كل المواعيد في مكان واحد: التوقيع والانتهاء وتقييم التجديد وخطط التفعيل والاجتماعات — مع التاريخ الهجري.</p></div>
      <div class="ph-actions">${canEdit ? `<button class="btn primary" type="button" data-addmeet>${icon('plus')} اجتماع جديد</button>` : ''}<div class="st-dd"><button class="btn st-ddt" type="button">${icon('download')} تصدير للتقويم</button><div class="st-ddm cal-exp">
        <button type="button" class="nav-a" data-m="" data-ics="all">${icon('calendar')}<span><b>كل المواعيد القادمة</b><small>ملف ‎.ics‎ — ${upcoming.length} موعدًا</small></span></button>
        <button type="button" class="nav-a" data-m="" data-ics="month">${icon('calendar')}<span><b>مواعيد ${MONTHS[st.m]}</b><small>الشهر المعروض فقط</small></span></button>
        <div class="cal-exp-n">${icon('info')}<span>افتح الملف بعد تنزيله: يُضاف تلقائيًا إلى Outlook أو تقويم Google أو تقويم الجوال، مع تذكير قبل الانتهاء والتجديد بأسبوع.</span></div></div></div></div></div>
      <div class="cal-kpis">${[['in30', 'خلال 30 يومًا', in30.length], ['renew', 'تقييمات تجديد قادمة', upcoming.filter((e) => e.type === 'renew').length], ['end', 'شراكات تنتهي', upcoming.filter((e) => e.type === 'end').length], ['meet', 'اجتماعات قادمة', upcoming.filter((e) => e.type === 'meet').length]].map(([k, l, n]) => `<div class="cal-kpi k-${k}"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
      <div class="cal-bar"><div class="cal-nav">${st.view === 'month' ? `<button class="icon-btn" type="button" data-mv="-1" title="الشهر السابق">${icon('chevR')}</button><button class="btn sm" type="button" data-mv="0">اليوم</button><button class="icon-btn" type="button" data-mv="1" title="الشهر التالي">${icon('chevL')}</button>
        <h2>${MONTHS[st.m]} ${st.y} <small>${calHijriMonth(new Date(st.y, st.m, 15))}</small></h2>` : '<h2>المواعيد القادمة</h2>'}</div>
        <div class="cal-types">${Object.entries(CAL_TYPES).map(([k, t]) => `<button type="button" class="cal-ty ${st.off.has(k) ? 'off' : ''}" data-ty="${k}" style="--c:${t.c}"><i></i>${t.l}</button>`).join('')}</div>
        <div class="seg cal-vw"><button type="button" class="${st.view === 'month' ? 'on' : ''}" data-vw="month">شهري</button><button type="button" class="${st.view === 'agenda' ? 'on' : ''}" data-vw="agenda">أجندة</button></div></div>
      <div class="panel cal-panel">${st.view === 'month' ? month : agenda}</div>`;
    st.visible = ev;
  };
  draw();
  el.onclick = async (e) => {
    const t = e.target;
    const mv = t.closest('[data-mv]'); if (mv) { const v = +mv.dataset.mv; if (!v) { st.y = today().getFullYear(); st.m = today().getMonth(); } else { const d = new Date(st.y, st.m + v, 1); st.y = d.getFullYear(); st.m = d.getMonth(); } return draw(); }
    const vw = t.closest('[data-vw]'); if (vw) { st.view = vw.dataset.vw; return draw(); }
    const ty = t.closest('[data-ty]'); if (ty) { const k = ty.dataset.ty; st.off.has(k) ? st.off.delete(k) : st.off.add(k); return draw(); }
    const ics = t.closest('[data-ics]'); if (ics) { const td = isoDate(today()); const L_ = ics.dataset.ics === 'month' ? st.visible.filter((x) => x.date.startsWith(`${st.y}-${pad(st.m + 1)}`)) : st.visible.filter((x) => x.date >= td); return L_.length ? calDownload(L_, ics.dataset.ics === 'month' ? `تقويم-الشراكات-${MONTHS[st.m]}-${st.y}` : 'تقويم-الشراكات') : toast('لا مواعيد للتصدير', 'err'); }
    const evb = t.closest('[data-ev]'); if (evb) { const x = all.find((y) => y.id === evb.dataset.ev); if (x) calEventDlg(x, () => route()); return; }
    const more = t.closest('[data-more]'); if (more) { st.view = 'agenda'; return draw(); }
    const ad = t.closest('[data-addday]'); if (ad) { e.stopPropagation(); return calMeetingDlg(null, { date: ad.dataset.addday }); }
    if (t.closest('[data-addmeet]')) return calMeetingDlg(null, {});
  };
}

/* تفاصيل موعد */
function calEventDlg(e, after) {
  const T = CAL_TYPES[e.type], d = parseDate(e.date), left = daysBetween(today(), d);
  const canEdit = e.type === 'meet' && can('edit.partnership') && !App.share;
  const m = Modal.open({
    title: e.t, size: 'md',
    body: `<div class="cal-dlg" style="--c:${T.c}"><div class="cal-dlg-t"><span class="cal-ic">${icon(T.ic)}</span><b>${T.l}</b>${e.code ? `<span class="code">${esc(e.code)}</span>` : ''}</div>
      <dl class="cal-dl"><dt>التاريخ</dt><dd>${CAL_WD[d.getDay()]} ${fmtDate(e.date)} <small>(${calHijri(d)})</small>${e.time ? ` — الساعة ${e.time}` : ''}</dd>
      <dt>المتبقي</dt><dd>${left < 0 ? `مضى منذ ${-left} يومًا` : left === 0 ? 'اليوم' : `بعد ${left} يومًا`}</dd>
      ${e.place ? `<dt>المكان</dt><dd>${/^https?:\/\//.test(e.place) ? `<a href="${esc(e.place)}" target="_blank" rel="noopener">${esc(e.place)}</a>` : esc(e.place)}</dd>` : ''}
      ${e.sub ? `<dt>ملاحظة</dt><dd>${esc(e.sub)}</dd>` : ''}${e.notes ? `<dt>التفاصيل</dt><dd style="white-space:pre-wrap">${esc(e.notes)}</dd>` : ''}</dl>
      <div class="cal-add-to"><span>إضافة إلى:</span><a class="btn sm" href="${calGoogleURL(e)}" target="_blank" rel="noopener">Google</a><a class="btn sm" href="${calOutlookURL(e)}" target="_blank" rel="noopener">Outlook</a><button class="btn sm" type="button" data-one>ملف ‎.ics‎</button></div></div>`,
    foot: `<a class="btn primary" href="${e.href}" data-go>${icon('layers')} فتح الشراكة</a>${canEdit ? `<button class="btn" type="button" data-edit>${icon('edit')} تعديل</button><span class="sp"></span><button class="btn danger" type="button" data-del>${icon('trash')} حذف</button>` : ''}<button class="btn ghost" type="button" data-mclose>إغلاق</button>`,
  });
  m.el.addEventListener('click', async (ev) => {
    if (ev.target.closest('[data-one]')) calDownload([e], e.t.slice(0, 40));
    if (ev.target.closest('[data-go]')) m.close();
    if (ev.target.closest('[data-edit]')) { m.close(); const p = D.partnerships.find((x) => x.id === e.pid); calMeetingDlg(p, (p.meetings || []).find((x) => x.id === e.mid)); }
    if (ev.target.closest('[data-del]')) {
      if (!(await confirmDlg('حذف هذا الاجتماع من التقويم؟', { title: 'حذف الاجتماع', ok: 'حذف', danger: true }))) return;
      const p = D.partnerships.find((x) => x.id === e.pid); p.meetings = (p.meetings || []).filter((x) => x.id !== e.mid);
      await Repo.save('partnerships', p); await Repo.log('meeting.delete', 'partnership', p.id, p.code, e.t); m.close(); toast('حُذف الاجتماع'); after && after();
    }
  });
}

/* إضافة اجتماع أو تعديله */
function calMeetingDlg(p, cur = {}) {
  const isNew = !cur.id;
  const opts = visiblePartnerships().filter((x) => !x.isDraft && x.stage !== 'cancel').map((x) => ({ value: x.id, label: partnerName(x), sub: x.code || '' }));
  const m = Modal.open({
    title: isNew ? 'اجتماع جديد' : 'تعديل الاجتماع', size: 'md',
    body: `<div class="fgrid">
      <div class="field span2"><label>الشراكة</label>${comboHTML('cal_p', { options: opts, value: p ? p.id : '', placeholder: 'اختر الشراكة أو ابحث…' })}</div>
      <div class="field span2"><label for="cal_t">عنوان الاجتماع</label><input class="in" id="cal_t" value="${esc(cur.title || '')}" placeholder="مثال: الاجتماع التعريفي، مراجعة المخرجات الربعية…"></div>
      <div class="field"><label for="cal_d">التاريخ</label><input class="in" type="date" id="cal_d" value="${esc(cur.date || isoDate(today()))}"></div>
      <div class="field"><label for="cal_h">الوقت</label><input class="in" type="time" id="cal_h" value="${esc(cur.time || '10:00')}"></div>
      <div class="field"><label for="cal_u">المدة</label><select class="in" id="cal_u">${[[30, 'نصف ساعة'], [60, 'ساعة'], [90, 'ساعة ونصف'], [120, 'ساعتان'], [180, 'ثلاث ساعات']].map(([v, l]) => `<option value="${v}" ${+(cur.dur || 60) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="cal_pl">المكان أو رابط الاجتماع</label><input class="in" id="cal_pl" value="${esc(cur.place || '')}" placeholder="مقر المؤسسة أو رابط Teams/Zoom"></div>
      <div class="field span2"><label for="cal_n">ملاحظات</label><textarea class="in" id="cal_n" rows="3">${esc(cur.notes || '')}</textarea></div></div>`,
    foot: `<button class="btn primary" type="button" data-ok>${icon('check')} حفظ</button><button class="btn ghost" type="button" data-mclose>إلغاء</button>`,
  });
  bindCombos(m.el);
  $('[data-ok]', m.el).onclick = async () => {
    const pid = ($('.cb', m.el) || {}).value || (p && p.id), date = $('#cal_d', m.el).value;
    if (!pid) return toast('اختر الشراكة', 'err');
    if (!date) return toast('حدد التاريخ', 'err');
    const P = D.partnerships.find((x) => x.id === pid); if (!P) return;
    const rec = { id: cur.id || uid('mt'), title: $('#cal_t', m.el).value.trim() || `اجتماع مع ${partnerName(P)}`, date, time: $('#cal_h', m.el).value, dur: +$('#cal_u', m.el).value, place: $('#cal_pl', m.el).value.trim(), notes: $('#cal_n', m.el).value.trim(), by: Session.userName(), at: nowISO() };
    if (p && p.id !== P.id) p.meetings = (p.meetings || []).filter((x) => x.id !== rec.id);
    P.meetings = [...(P.meetings || []).filter((x) => x.id !== rec.id), rec];
    if (p && p.id !== P.id) await Repo.save('partnerships', p);
    await Repo.save('partnerships', P); await Repo.log(isNew ? 'meeting.create' : 'meeting.update', 'partnership', P.id, P.code, rec.title);
    m.close(); toast(isNew ? 'أُضيف الاجتماع إلى التقويم' : 'حُفظ الاجتماع'); route();
  };
}
