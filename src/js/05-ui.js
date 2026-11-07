/* ===== مكونات مشتركة ===== */
const MONO_STOP = new Set(['شركة', 'جمعية', 'مؤسسة', 'هيئة', 'وزارة', 'مركز', 'المديرية', 'العامة', 'مجموعة', 'كلية', 'بلدية', 'صندوق', 'وقف', 'الأمير', 'إدارة', 'الإدارة'].map(normAr));
function monogram(name) {
  const ws = String(name || '').trim().split(/\s+/);
  for (const w of ws) {
    if (MONO_STOP.has(normAr(w))) continue;
    let x = w.replace(/^(لل|ال)/, '');
    if (/^ل/.test(x) && x.length > 3) x = x.slice(1);
    if (x.startsWith('ال')) x = x.slice(2);
    return x.charAt(0);
  }
  return (ws[0] || '').charAt(0);
}
function toneFor(partner) { const s = partner && partner.sector; return s === 'خاص' ? 'mist' : s === 'غير ربحي' ? 'sand' : 'dark'; }
function plateHTML(partner, size = 56) {
  if (!partner) return `<div class="plate typo s${size}"><span class="pt">—</span></div>`;
  if (partner.logoFileId) return `<div class="plate s${size}"><img data-file="${esc(partner.logoFileId)}" alt="${esc(partner.name)}"></div>`;
  if (size <= 56) return `<div class="plate mono s${size}" title="${esc(partner.name)}"><span class="mg">${esc(monogram(partner.name))}</span></div>`;
  return `<div class="plate typo s${size}" title="${esc(partner.name)}"><span class="pt">${esc(partner.name)}</span></div>`;
}
const demoTag = (x) => (x && x.demo ? '<span class="demo-tag" title="بيانات تجريبية لإظهار التصميم">تجريبي</span>' : '');
function emptyHTML({ ic = 'search', title, text = '', actions = '' }) {
  return `<div class="empty"><div class="eic">${icon(ic)}</div><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ''}${actions ? `<div class="row wrap" style="justify-content:center">${actions}</div>` : ''}</div>`;
}
function avatar(name) { return `<span class="av">${esc(initials(name))}</span>`; }

/* ===== الصور ===== */
const isImg = (a) => a && /^image\//.test(a.type || '');
function partnershipPhotos(p) {
  const out = [], seen = new Set();
  const add = (fileId, sub) => { if (fileId && !seen.has(fileId)) { seen.add(fileId); out.push({ fileId, caption: partnerName(p), sub, href: '#/partnerships/' + p.id }); } };
  add(p.coverFileId, 'صورة الغلاف');
  (p.attachments || []).filter((a) => isImg(a) && a.category === 'صور الشراكة').forEach((a) => add(a.fileId, a.name));
  (p.attachments || []).filter((a) => isImg(a) && a.category !== 'صور الشراكة').forEach((a) => add(a.fileId, a.category));
  return out;
}
function fieldPhotos() {
  const out = [], seen = new Set();
  for (const p of publicPartnerships()) {
    (p.attachments || []).filter((a) => isImg(a) && a.category === 'صور الشراكة').forEach((a) => { if (!seen.has(a.fileId)) { seen.add(a.fileId); out.push({ fileId: a.fileId, caption: partnerName(p), sub: a.name, href: '#/partnerships/' + p.id, demo: p.demo }); } });
  }
  for (const s of publicStories()) (s.gallery || []).forEach((g) => { if (seen.has(g)) return; seen.add(g); const pr = storyPartner(s); out.push({ fileId: g, caption: s.title, sub: pr ? pr.name : '', demo: s.demo }); });
  return out;
}

function pickLibImage(current) {
  return new Promise((res) => {
    const m = Modal.open({
      title: 'المكتبة التوضيحية', size: 'lg',
      body: `<p class="small muted" style="margin-bottom:14px">صور جوية مولّدة لأغراض العرض، تظهر عليها عبارة «صورة توضيحية». استبدلها بصور فعلية من الميدان متى توفرت.</p>
        <div class="libgrid">${Object.entries(IMG_LIB).map(([k, v]) => `<button class="${current === 'lib:' + k ? 'on' : ''}" data-lk="${k}"><img src="${v.src}" alt=""><span>${esc(v.title.replace(' — صورة توضيحية', ''))}</span></button>`).join('')}</div>`,
      onClose: (v) => res(v || null),
    });
    m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-lk]'); if (b) m.close(b.dataset.lk); });
  });
}

/* ===== شريط الفلاتر المترابطة ===== */
class FilterBar {
  constructor(el, { dims, getList, state, onChange }) {
    Object.assign(this, { el, dims, getList, state, onChange });
    this.render();
  }
  render() {
    const base = this.getList();
    this.el.innerHTML = this.dims.map((d) => {
      const sel = this.state[d] || [];
      const lbl = sel.length === 1 ? (FILTER_DIMS[d].fmt ? FILTER_DIMS[d].fmt(sel[0]) : sel[0]) : sel.length ? `${sel.length} مختارة` : '';
      return `<button class="fbtn ${sel.length ? 'on' : ''}" data-dim="${d}" type="button">${esc(FILTER_DIMS[d].label)}${lbl ? `: ${esc(lbl)}` : ''} ${icon('chevD')}</button>`;
    }).join('') + (Object.values(this.state).some((v) => v && v.length) ? `<button class="btn ghost sm" data-fclear type="button">مسح الفلاتر</button>` : '');
    this.el.onclick = (e) => {
      if (e.target.closest('[data-fclear]')) { for (const k of Object.keys(this.state)) delete this.state[k]; this.render(); this.onChange(); return; }
      const b = e.target.closest('.fbtn');
      if (b && !e.target.closest('.fpop')) this.open(b, base);
    };
  }
  open(btn, base) {
    const was = btn.querySelector('.fpop');
    $$('.fpop', this.el).forEach((p) => p.remove());
    if (was) return;
    const d = btn.dataset.dim;
    const pool = applyFilters(base, this.state, d);
    const counts = countBy(pool, d);
    const allKeys = countBy(base, d).map((x) => x.k);
    const sel = new Set(this.state[d] || []);
    const opts = allKeys.map((k) => ({ k, label: FILTER_DIMS[d].fmt ? FILTER_DIMS[d].fmt(k) : k, n: (counts.find((c) => c.k === k) || {}).n || 0 }));
    const pop = document.createElement('div');
    pop.className = 'fpop';
    pop.innerHTML = `${opts.length > 7 ? '<input class="fs" placeholder="بحث…">' : ''}<div class="fos">${opts.map((o) => `<label class="fo ${o.n ? '' : 'zero'}" data-k="${esc(o.k)}"><input type="checkbox" ${sel.has(o.k) ? 'checked' : ''}> <span>${esc(o.label)}</span><span class="n">${o.n}</span></label>`).join('') || '<div class="cb-empty">لا توجد قيم.</div>'}</div>
      <div class="ff"><button class="btn ghost sm" data-clr type="button">مسح</button><button class="btn primary sm" data-done type="button">تم</button></div>`;
    btn.appendChild(pop);
    const fs = pop.querySelector('.fs');
    if (fs) { fs.focus(); fs.oninput = () => $$('.fo', pop).forEach((o) => { o.style.display = matchQ(o.textContent, fs.value) ? '' : 'none'; }); }
    pop.addEventListener('click', (e) => e.stopPropagation());
    pop.addEventListener('change', () => {
      const v = $$('.fo', pop).filter((o) => o.querySelector('input').checked).map((o) => o.dataset.k);
      if (v.length) this.state[d] = v; else delete this.state[d];
      this.onChange(true);
    });
    pop.querySelector('[data-clr]').onclick = () => { delete this.state[d]; this.render(); this.onChange(); };
    pop.querySelector('[data-done]').onclick = () => { this.render(); this.onChange(); };
    const outside = (e) => { if (!btn.contains(e.target)) { document.removeEventListener('mousedown', outside); if (pop.isConnected) { this.render(); this.onChange(); } } };
    setTimeout(() => document.addEventListener('mousedown', outside), 0);
  }
}

/* ===== الرسوم ===== */
function hbarsHTML(data, { dim, colorFn, max, total } = {}) {
  const rows = data.filter((d) => d.n > 0);
  if (!rows.length) return '<div class="empty-chart">لا توجد بيانات ضمن الفلاتر الحالية.</div>';
  const m = max || Math.max(...rows.map((d) => d.n));
  return `<div class="hbars">${rows.map((d, i) => `<div class="hbar" data-drill="${dim}" data-k="${esc(d.k)}" title="${esc(d.label)}: ${d.n}${total ? ` من ${total}` : ''}">
      <span class="lb">${esc(d.label)}</span><span class="tr"><span class="fl" style="width:${(d.n / m * 100).toFixed(1)}%;background:${colorFn ? colorFn(d, i) : 'var(--chart-1)'}"></span></span><span class="vv">${d.n}</span></div>`).join('')}</div>`;
}
function donutHTML(data, { dim, size = 168, colorFn, centerLabel = 'الإجمالي' } = {}) {
  const rows = data.filter((d) => d.n > 0);
  const tot = rows.reduce((a, b) => a + b.n, 0);
  if (!tot) return '<div class="empty-chart">لا توجد بيانات ضمن الفلاتر الحالية.</div>';
  const R = size / 2, r = R - 18, C = 2 * Math.PI * r;
  let off = 0;
  const segs = rows.map((d, i) => {
    const len = d.n / tot * C;
    const gap = rows.length > 1 ? Math.min(2.5, len * 0.3) : 0;
    const s = `<circle class="donut-seg" data-drill="${dim}" data-k="${esc(d.k)}" cx="${R}" cy="${R}" r="${r}" fill="none" stroke="${colorFn(d, i)}" stroke-width="18" stroke-dasharray="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${R} ${R})"><title>${esc(d.label)}: ${d.n}</title></circle>`;
    off += len; return s;
  }).join('');
  return `<div class="donut-wrap"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(centerLabel)} ${tot}">
      <circle cx="${R}" cy="${R}" r="${r}" fill="none" stroke="var(--paper-3)" stroke-width="18"/>${segs}
      <text x="${R}" y="${R - 2}" text-anchor="middle" font-size="30" font-weight="400" fill="var(--ink)" style="font-family:var(--font)">${tot}</text>
      <text x="${R}" y="${R + 20}" text-anchor="middle" font-size="12" fill="var(--muted)" style="font-family:var(--font)">${esc(centerLabel)}</text></svg>
    <div class="legend">${rows.map((d, i) => `<div class="li" data-drill="${dim}" data-k="${esc(d.k)}"><span class="sw" style="background:${colorFn(d, i)}"></span><span>${esc(d.label)}</span><span class="n">${d.n}</span><span class="faint xs">${Math.round(d.n / tot * 100)}%</span></div>`).join('')}</div></div>`;
}
const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-3)', 'var(--chart-6)', 'var(--chart-5)', 'var(--chart-8)', 'var(--chart-7)'];
function timelineHTML(list) {
  const rows = list.filter((p) => p.startDate && p.endDate).sort((a, b) => (a.endDate < b.endDate ? -1 : 1));
  if (!rows.length) return '<div class="empty-chart">لا توجد شراكات بتواريخ بدء وانتهاء ضمن الفلاتر الحالية.</div>';
  const t = today();
  let mn = Math.min(...rows.map((p) => parseDate(p.startDate))), mx = Math.max(...rows.map((p) => parseDate(p.endDate)), +t);
  mn = Math.min(mn, +t);
  const y0 = new Date(mn).getFullYear(), y1 = new Date(mx).getFullYear() + 1;
  const a = +new Date(y0, 0, 1), b = +new Date(y1, 0, 1), span = b - a;
  const pos = (d) => ((+d - a) / span * 100);
  const years = []; for (let y = y0; y < y1; y++) years.push(y);
  const grid = years.map((y) => `<span class="tl-grid" style="right:${pos(new Date(y, 0, 1))}%"></span>`).join('');
  return `<div class="tl">
    <div class="tl-row" style="cursor:default;background:none"><span></span><div class="tl-axis" style="grid-template-columns:repeat(${years.length},1fr)">${years.map((y) => `<span>${y}</span>`).join('')}</div></div>
    ${rows.map((p, i) => {
      const st = pStatus(p);
      const cls = st === 'soon' ? 'soon' : st === 'ended' ? 'ended' : st === 'upcoming' ? 'future' : '';
      const s = pos(parseDate(p.startDate)), e = pos(parseDate(p.endDate));
      return `<div class="tl-row" data-open="${p.id}" title="${esc(partnerName(p))}: ${fmtDate(p.startDate, 'short')} – ${fmtDate(p.endDate, 'short')}">
        <span class="nm">${esc(partnerName(p))}</span>
        <div class="tl-track">${grid}<span class="tl-bar ${cls}" style="right:${s}%;width:${Math.max(0.8, e - s)}%"></span>${i === 0 ? `<span class="tl-today" style="right:${pos(t)}%"><span>اليوم</span></span>` : `<span class="tl-today" style="right:${pos(t)}%"></span>`}</div></div>`;
    }).join('')}</div>`;
}

/* ===== المرفقات ===== */
function attIcon(a) { return a.type && /^image\//.test(a.type) ? `<img data-file="${esc(a.fileId)}" alt="">` : icon(fileKind(a.type, a.name) === 'pdf' ? 'file' : 'clip'); }
function attachmentsView(list, { cats = L('attachmentCats'), editable = false, emptyText = 'لا توجد مرفقات.' } = {}) {
  if (!list || !list.length) return `<p class="muted small">${esc(emptyText)}</p>`;
  const groups = {};
  list.forEach((a) => { (groups[a.category || 'أخرى'] = groups[a.category || 'أخرى'] || []).push(a); });
  const order = [...cats.filter((c) => groups[c]), ...Object.keys(groups).filter((c) => !cats.includes(c))];
  return `<div class="att-cats">${order.map((c) => `<div class="att-cat"><h4>${esc(c)} <span class="n">${groups[c].length}</span></h4>
    ${groups[c].some(isImg) ? `<div class="gallery" data-galbox>${groups[c].filter(isImg).map((a) => `<div class="g" data-zoom="${esc(a.fileId)}" data-cap="${esc(a.name)}" data-sub="${esc(c)}"><img data-file="${esc(a.fileId)}" alt="${esc(a.name)}">${a.fileId.startsWith('lib:') ? '<span class="illus">توضيحية</span>' : ''}</div>`).join('')}</div>` : ''}
    <div class="att-list">${groups[c].map((a) => `<div class="att" data-att="${esc(a.id)}"><span class="fi">${attIcon(a)}</span>
      <div class="grow"><div class="nm" title="${esc(a.name)}">${esc(a.name)}</div><div class="mt"><span class="num">${fmtSize(a.size || 0)}</span> — ${fmtDate(a.addedAt || a.at)}${a.fromProposal ? ` — من المقترح ${esc(a.fromProposal)}` : ''}</div></div>
      <button class="icon-btn" data-dl="${esc(a.fileId)}" data-name="${esc(a.name)}" title="تنزيل" type="button">${icon('download')}</button>
      ${editable ? `<button class="icon-btn" data-rmatt="${esc(a.id)}" title="إزالة" type="button">${icon('trash')}</button>` : ''}</div>`).join('')}</div></div>`).join('')}</div>`;
}
async function downloadStored(fileId, name) {
  const f = await Store.getFile(fileId);
  if (!f) return toast('تعذّر العثور على الملف في التخزين المحلي.', 'err');
  download(name || f.name, f.blob);
}
document.addEventListener('click', (e) => {
  const dl = e.target.closest('[data-dl]');
  if (dl) { e.preventDefault(); e.stopPropagation(); downloadStored(dl.dataset.dl, dl.dataset.name); return; }
  const z = e.target.closest('[data-zoom]');
  if (z) {
    const box = z.closest('[data-galbox]') || z.parentElement;
    const all = $$('[data-zoom]', box);
    openGallery(all.map((x) => ({ fileId: x.dataset.zoom, caption: x.dataset.cap || '', sub: x.dataset.sub || '' })), all.indexOf(z));
  }
});

/* محرر المرفقات داخل النماذج */
function attachEditorHTML(id, { cats, defaultCat }) {
  return `<div class="att-editor" id="${id}">
    <div class="row wrap" style="margin-bottom:10px"><label class="flabel" style="margin:0">التصنيف</label>
      <select class="in" data-attcat style="width:auto;min-width:200px">${cats.map((c) => `<option ${c === defaultCat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    <label class="drop" data-drop><input type="file" multiple hidden>${icon('upload')}<div>اسحب الملفات هنا أو <b>اختر من جهازك</b></div><div class="xs faint">حتى 15 ميجابايت للملف — تُحفظ في هذا المتصفح</div></label>
    <div class="att-out" style="margin-top:14px"></div></div>`;
}
function bindAttachEditor(root, getList, setList, { onChange } = {}) {
  const box = root; if (!box) return;
  const out = box.querySelector('.att-out'), drop = box.querySelector('[data-drop]'), inp = drop.querySelector('input');
  const draw = () => { out.innerHTML = attachmentsView(getList(), { editable: true, emptyText: 'لم تُرفق ملفات بعد.' }); hydrateFiles(out); };
  const add = async (files) => {
    const cat = box.querySelector('[data-attcat]').value;
    for (const f of files) {
      try {
        const rec = await saveUpload(f);
        setList([...getList(), { id: uid('att'), fileId: rec.id, name: rec.name, type: rec.type, size: rec.size, category: cat, addedAt: nowISO(), by: Session.userName() }]);
      } catch (e) { toast(e.message, 'err'); }
    }
    draw(); onChange && onChange();
  };
  inp.onchange = () => { add([...inp.files]); inp.value = ''; };
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => add([...e.dataTransfer.files]));
  out.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rmatt]');
    if (rm) { setList(getList().filter((a) => a.id !== rm.dataset.rmatt)); draw(); onChange && onChange(); }
  });
  draw();
}

/* ===== رأس الطباعة ===== */
function printHead(title, filtersText = '', { compact = false } = {}) {
  const o = D.settings.org;
  return `<div class="print-head">${compact ? '' : `<h1>${esc(title)}</h1>`}<div class="pm">${esc(o.name)} — ${esc(o.dept)} — طُبع في ${fmtDate(isoDate(today()))}${showDemo() ? ' — يتضمن بيانات تجريبية مميزة بوسم «تجريبي»' : ''}</div>${filtersText ? `<div class="pf">${esc(filtersText)}</div>` : ''}</div>`;
}
function filtersText(f) {
  const parts = Object.entries(f).filter(([, v]) => v && v.length).map(([k, v]) => `${FILTER_DIMS[k].label}: ${v.map((x) => (FILTER_DIMS[k].fmt ? FILTER_DIMS[k].fmt(x) : x)).join('، ')}`);
  return parts.length ? 'الفلاتر المطبقة — ' + parts.join(' | ') : 'دون فلاتر — جميع السجلات المتاحة';
}
