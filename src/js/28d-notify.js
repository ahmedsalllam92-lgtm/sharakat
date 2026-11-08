/* =====================================================================
   الإشعارات: تصل للحساب المعني عند كل انتقال في مسار الشراكة،
   وعند تقديم طلب عبر «شارك» أو طلب استكماله أو تحويله إلى شراكة.
   المستلم: { grp: 'partnerships' } لإدارة الشراكات وفريقها، أو { dept: 'اسم الإدارة' }.
   تُحفظ في الإعدادات (آخر 300 إشعار)، وحالة القراءة لكل حساب على حدة.
   ===================================================================== */
const NOTIF_MAX = 300;
function notifStore() { D.settings.notifs = D.settings.notifs || []; return D.settings.notifs; }
/* المستلمون لخطوة حسب الجهة المسؤولة عنها في تعريف المسار */
function wfTargets(actor, kind, rec) {
  if (actor === 'partnerships') return [{ grp: 'partnerships' }];
  if (actor === 'requester') return [{ dept: kind === 'proposal' ? rec.department : wfReqDept(rec) }];
  if (actor === 'concerned') return kind === 'partnership' ? wfConcerned(rec).map((d) => ({ dept: d })) : [];
  const d = wfDept(actor); return d ? [{ dept: d }] : [];
}
const notifReqDept = (kind, rec) => (kind === 'proposal' ? rec.department : wfReqDept(rec));
async function notify(to, { t, b = '', href = '', ic = 'bell' }) {
  const list = (to || []).filter((x) => x && (x.grp || x.dept));
  if (!list.length || !D.settings) return null;
  const seen = new Set(), uniq = list.filter((x) => { const k = x.grp ? 'g:' + x.grp : 'd:' + x.dept; if (seen.has(k)) return false; seen.add(k); return true; });
  const n = { id: uid('ntf'), at: nowISO(), to: uniq, t, b, href, ic, by: Session.userName(), read: {} };
  const S = notifStore(); S.unshift(n); if (S.length > NOTIF_MAX) S.length = NOTIF_MAX;
  await Repo.saveSettings();
  refreshBell(n);
  return n;
}
/* هل الإشعار موجّه للحساب الحالي؟ */
function notifForMe(n) {
  const r = Session.role();
  return (n.to || []).some((x) => (x.grp === 'partnerships' && ['admin', 'team'].includes(r)) || (x.dept && r === 'dept' && x.dept === Session.dept()));
}
const myNotifs = () => (D.settings && D.settings.notifs ? D.settings.notifs : []).filter(notifForMe);
const notifUnread = () => { const me = currentAccountId(); return myNotifs().filter((n) => !(n.read || {})[me]).length; };

/* بعد كل إجراء في المسار: من يلزمه أن يعرف؟ */
async function wfNotifyStep(kind, rec, s, cur, note) {
  const name = kind === 'proposal' ? `${rec.ref} — ${rec.partnerName}` : `${rec.code || ''} — ${partnerName(rec)}`;
  const href = kind === 'proposal' ? '#/proposals/' + rec.id : '#/partnerships/' + rec.id + '?wf=1';
  const reqDept = notifReqDept(kind, rec);
  const req = reqDept && reqDept !== D.settings.org.dept ? [{ dept: reqDept }] : [];
  if (cur.decision === 'reject' || (s.kind === 'decision' && cur.decision === 'no')) {
    return notify([...req, { grp: 'partnerships' }], { t: `${s.kind === 'decision' ? s.no : s.reject}: ${name}`, b: note || '', href, ic: 'x' });
  }
  if (cur.status === 'returned') {
    const back = s.back && wfStep(s.back);
    return notify([...wfTargets(back ? back.actor : 'partnerships', kind, rec), { grp: 'partnerships' }], { t: `أُعيدت «${s.t}» بملاحظات`, b: `${name}${note ? ' — ' + note : ''}`, href, ic: 'msg' });
  }
  if (cur.status !== 'done') return null;
  const st = wfStateOf(kind, rec);
  const next = st.cur;
  const out = [];
  if (next && next.id !== s.id) out.push(notify(wfTargets(next.actor, kind, rec), { t: `بانتظاركم: ${next.t}`, b: name, href, ic: 'flag' }));
  if (!next && kind === 'proposal' && rec.status === 'accepted') out.push(notify([{ grp: 'partnerships' }], { t: `جاهز للتحويل إلى سجل شراكة: ${rec.ref}`, b: name, href, ic: 'convert' }));
  if (req.length) out.push(notify(req, { t: s.final && cur.decision === 'yes' ? `${s.yes || 'اعتُمد'}: ${name}` : `تقدّم طلبكم: اكتملت «${s.t}»`, b: next ? `الخطوة التالية: ${next.t} — لدى ${wfActorName(next.actor)}` : name, href, ic: s.final ? 'check' : 'chart' }));
  return Promise.all(out);
}

/* جرس الإشعارات */
function bellHTML() {
  if (!D.settings || Session.role() === 'viewer') return '';
  const n = notifUnread();
  return `<button class="icon-btn bell-btn" data-bell type="button" title="الإشعارات" aria-label="الإشعارات${n ? ` — ${n} غير مقروءة` : ''}">${icon('bell')}<span class="bell-n" ${n ? '' : 'hidden'}>${n}</span></button>`;
}
function refreshBell(added) {
  const b = $('#topbar [data-bell]'); if (!b) return;
  const n = notifUnread(), c = b.querySelector('.bell-n');
  c.textContent = n; c.hidden = !n;
  if (added && notifForMe(added)) { b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); }
  const p = $('#bellPanel'); if (p) p.innerHTML = bellPanelHTML();
}
function bellPanelHTML() {
  const me = currentAccountId(), L_ = myNotifs().slice(0, 30);
  return `<div class="bp-h"><b>الإشعارات</b>${L_.some((n) => !(n.read || {})[me]) ? '<button type="button" class="linkbtn" data-bellall>تعليم الكل كمقروء</button>' : ''}</div>
    <div class="bp-l">${L_.length ? L_.map((n) => `<a class="bp-i ${(n.read || {})[me] ? '' : 'new'}" href="${esc(n.href || '#/')}" data-bellid="${n.id}"><span class="bp-ic">${icon(n.ic || 'bell')}</span><span class="bp-t"><b>${esc(n.t)}</b>${n.b ? `<small>${esc(n.b)}</small>` : ''}<em>${relDays(n.at)}</em></span></a>`).join('') : '<div class="bp-empty">لا توجد إشعارات.</div>'}</div>`;
}
function toggleBell(force) {
  let p = $('#bellPanel');
  if (p && force !== true) { p.remove(); return null; }
  if (!p) { p = document.createElement('div'); p.id = 'bellPanel'; p.className = 'bell-panel'; document.body.appendChild(p); }
  p.innerHTML = bellPanelHTML();
  const b = $('#topbar [data-bell]'); if (b) { const r = b.getBoundingClientRect(); p.style.top = Math.round(r.bottom + 8) + 'px'; p.style.left = Math.max(12, Math.round(r.left + r.width / 2 - 170)) + 'px'; }
  p.onclick = async (e) => {
    const me = currentAccountId();
    if (e.target.closest('[data-bellall]')) { myNotifs().forEach((n) => { n.read = { ...(n.read || {}), [me]: 1 }; }); await Repo.saveSettings(); return refreshBell(); }
    const a = e.target.closest('[data-bellid]'); if (a) { const n = notifStore().find((x) => x.id === a.dataset.bellid); if (n) { n.read = { ...(n.read || {}), [me]: 1 }; await Repo.saveSettings(); } p.remove(); refreshBell(); }
  };
  return p;
}
document.addEventListener('mousedown', (e) => { const p = $('#bellPanel'); if (p && !e.target.closest('#bellPanel') && !e.target.closest('[data-bell]')) p.remove(); });
