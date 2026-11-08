"""استعراض «مسار طلب الشراكة»: المساران (اعتماد/رفض)، وعدم المساس بالبيانات الحقيقية،
وتغيّر الاستعراض تلقائيًا عند تعديل تعريف المسار أو حقول «شارك» في نسخة اختبار من الملف."""
import asyncio, os, re, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
SHOTS=os.environ.get('RQ_SHOTS')  # مجلد لحفظ لقطة لكل مرحلة (اختياري)
R=[]
def ok(n,c,x=''): R.append(bool(c)); print('PASS' if c else 'FAIL', n, x, flush=True)

SNAP = """(async()=>{
  const idb = await new Promise((res)=>{ const r=indexedDB.open(DB_NAME); r.onsuccess=async()=>{ const db=r.result; const out={}; for (const c of [...COLS,'files']) { out[c] = await new Promise((rs)=>{ const t=db.transaction(c,'readonly').objectStore(c).getAll(); t.onsuccess=()=>rs(t.result.length+':'+JSON.stringify(t.result).length); }); } db.close(); res(out); }; r.onerror=()=>res('err'); });
  const ls = Object.keys(localStorage).sort().map(k=>k+'='+localStorage.getItem(k).length).join('|');
  return JSON.stringify({ mem: JSON.stringify({...D, audit: D.audit.length}), idb, ls, notifs:(D.settings.notifs||[]).length, unread: notifUnread(), tasks: wfTasks().length, nav: [...document.querySelectorAll('.nav-a .cnt')].map(e=>e.textContent).join(',') });
})()"""

async def run_tour(pg, choice, shots=None, tag=''):
    """يشغّل الاستعراض حتى النهاية ويعيد قائمة المراحل التي ظهرت في الفقاعات"""
    await pg.evaluate("window.__rqSpeed=6; startReqTour()")
    seen=[]; last=''; stages=set(); errs=0; n=0
    import time; t0=time.time()
    while time.time()-t0 < 480:
        await pg.wait_for_timeout(250)
        st = await pg.evaluate("""(()=>{ if(!document.getElementById('rqTour')) return {gone:1};
          const c=document.querySelector('#rqTour .rq-card'); const on=document.querySelector('#rqTour .rq-stages li.on');
          return { i:RQ.i, step:c&&!c.hidden?c.querySelector('.tour-step').textContent:'', t:c&&!c.hidden?c.querySelector('h3').textContent:'', wait:!!RQ.waitChoice, stage: on? on.dataset.rqst:'', ended: !!RQ.ended };})()""")
        if st.get('gone'): break
        if st['stage']: stages.add(st['stage'])
        key=f"{st['i']}|{st['t']}"
        if key!=last:
            last=key; seen.append((st['i'], st['step'], st['t']))
            if shots: n+=1; await pg.screenshot(path=f"{shots}/{tag}{n:03d}.png")
        if 'تعذّر' in st['step']: break
        if st['wait']: await pg.click(f'#rqTour [data-rqchoice="{choice}"]')
        if st['ended'] and 'نهاية' in st['step']: break
    return seen, stages

async def layout_ok(pg):
    """الفقاعة داخل الشاشة ولا يُقص نصها، والإطار حول عنصر ظاهر"""
    return await pg.evaluate("""(()=>{ const c=document.querySelector('#rqTour .rq-card'); if(!c||c.hidden) return true; const r=c.getBoundingClientRect();
      const inside = r.left>=0 && r.top>=0 && r.right<=innerWidth+1 && r.bottom<=innerHeight+1;
      const clip = [...c.querySelectorAll('h3,p')].every(e=>e.scrollWidth<=e.clientWidth+2);
      return inside && clip && c.scrollHeight<=c.clientHeight+2; })()""")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':1600,'height':900})
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        E = pg.evaluate
        await pg.goto(URL); await pg.wait_for_selector('#main .page')
        await E("location.hash='#/settings/tour'"); await pg.wait_for_timeout(600)
        ok('listed as a separate tour in the tours list', await E("!!document.querySelector('[data-rqtour-start]') && !!document.querySelector('[data-tour-start]')"))
        ok('tour list built from the path definition', await E("document.querySelectorAll('.rq-set .tour-list li').length === WF_STEPS.indexOf(wfFinal())+1"))
        before = await E(SNAP)
        # — مسار الاعتماد —
        seen, stages = await run_tour(pg, 'yes', SHOTS, 'yes_')
        titles=[t for _,_,t in seen]
        ok('approve path reaches its ending', any('اعتُمدت' in t for t in titles), titles[-3:])
        want = await E("WF_STEPS.slice(0, WF_STEPS.indexOf(wfFinal())+1).map(s=>s.id)")
        ok('every stage up to final approval was shown, in order', set(want) <= stages, sorted(set(want)-stages))
        ok('the share form typed every required field', all(any(l in t for t in titles) for l in await E("shareReq().map(f=>f.l)")))
        ok('reference number and first status shown', any('الرقم المرجعي' in t for t in titles))
        ok('notifications arrive on both sides', sum('إشعار' in s for _,s,_ in seen) >= 6, sum('إشعار' in s for _,s,_ in seen))
        ok('one return-for-completion is shown', any('استكمال الملاحظات' in t for t in titles))
        ok('controls present (prev, pause, next, exit)', await E("['prev','play','next','end'].every(k=>!!document.querySelector(`#rqTour [data-rq=\"${k}\"]`))"))
        ok('bubble inside the screen, text not clipped (end card)', await layout_ok(pg))
        # الرجوع ثم الخروج
        await pg.click('#rqTour [data-rq="prev"]'); await pg.wait_for_timeout(1200)
        ok('previous replays the previous stage', await E("!!document.getElementById('rqTour') && !RQ.ended"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        ok('exit removes the tour and both sandboxes', await E("!document.getElementById('rqTour') && !document.querySelector('iframe') && !window.__shkSbx"), await E("[!!document.getElementById('rqTour'), document.querySelectorAll('iframe').length, !!window.__shkSbx]"))
        after = await E(SNAP)
        ok('real data, storage, notifications and counters unchanged after approve path', after == before, (before[:200], after[:200]) if after!=before else '')
        # — مسار الرفض —
        seen, _ = await run_tour(pg, 'reject', SHOTS, 'rej_')
        titles=[t for _,_,t in seen]
        ok('reject path reaches its ending with reason', any('بالرفض' in t for t in titles), titles[-3:])
        ok('rejection notification reached the requester', any('الرفض' in t for t in titles))
        await E("endReqTour()"); await pg.wait_for_timeout(300)
        after2 = await E(SNAP)
        ok('real data unchanged after reject path too', after2 == before)
        ok('no page errors', not errs, errs[:3])
        await ctx.close()

        # — نسخ اختبار معدّلة من الملف: الاستعراض يتبع التعريف تلقائيًا —
        src = open('/home/claude/shots/app.html', encoding='utf-8').read()
        def variant(name, fn):
            s2 = fn(src); assert s2 != src, name
            path = f'/home/claude/shots/rq_{name}.html'; open(path, 'w', encoding='utf-8').write(s2); return 'file://' + path
        mut = {
          'add': variant('add', lambda s: s.replace("  { id: 'partner', n: 8,", "  { id: 'finance', n: 0, ph: 'rev', on: 'partnership', actor: 'partnerships', t: 'مراجعة الأثر المالي', d: 'تراجع إدارة الشراكات الأثر المالي للمذكرة قبل إرسالها للشريك.', docs: [{ k: 'financeNote', l: 'مذكرة الأثر المالي', req: true }] },\n  { id: 'partner', n: 8,", 1)),
          'rename': variant('rename', lambda s: s.replace("t: 'مشاركة المذكرة مع الشريك'", "t: 'إرسال المذكرة للجهة الشريكة'", 1)),
          'remove': variant('remove', lambda s: re.sub(r"\n  \{ id: 'partner', n: 8,[^\n]*", "", s, count=1)),
          'field': variant('field', lambda s: s.replace("  { k: 'contactName', step: 'entity', l: 'الاسم', kind: 'text', demo: 'خالد الشمري' },", "  { k: 'contactName', step: 'entity', l: 'الاسم', kind: 'text', demo: 'خالد الشمري' },\n  { k: 'budget', step: 'idea', l: 'الميزانية التقديرية', kind: 'text', req: true, demo: '250,000 ريال' },", 1)),
        }
        for name, url in mut.items():
            ctx = await b.new_context(viewport={'width':1600,'height':900}); pg = await ctx.new_page(); errs=[]
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(url); await pg.wait_for_selector('#main .page')
            ids = await pg.evaluate("WF_STEPS.map(s=>s.id)")
            bar = await pg.evaluate("(async()=>{ window.__rqSpeed=6; startReqTour(); await new Promise(r=>setTimeout(r,800)); return [...document.querySelectorAll('#rqTour .rq-stages li')].map(li=>li.dataset.rqst+'|'+li.textContent) })()")
            await pg.evaluate("endReqTour()")
            seen, stages = await run_tour(pg, 'yes')
            titles=[t for _,_,t in seen]
            done = any('اعتُمدت' in t for t in titles)
            dbg = (len(titles), titles[-2:], sorted(stages)[:3], bar[:2])
            if name == 'add':
                ok('test copy: added stage appears in the bar and is played', any(x.startswith('finance|') for x in bar) and 'finance' in stages and any('مراجعة الأثر المالي' in t for t in titles) and done, dbg)
                ok('test copy: numbering follows the new order', any('9مشاركة المذكرة مع الشريك' in x.replace(' ','') or x.startswith('partner|9') for x in bar), [x for x in bar if x.startswith('partner')])
            if name == 'rename':
                ok('test copy: renamed stage shows the new name', any('إرسال المذكرة للجهة الشريكة' in x for x in bar) and any('إرسال المذكرة للجهة الشريكة' in t for t in titles) and not any('مشاركة المذكرة مع الشريك' in t for t in titles) and done, dbg)
            if name == 'remove':
                ok('test copy: removed stage disappears and the path still completes', 'partner' not in ids and not any(x.startswith('partner|') for x in bar) and 'partner' not in stages and done, dbg)
            if name == 'field':
                ok('test copy: new required شارك field is typed in the tour', any('الميزانية التقديرية (إلزامي)' in t for t in titles) and done, dbg)
            ok(f'test copy {name}: no page errors', not errs, errs[:2])
            await ctx.close()
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
