import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width':1440,'height':900})).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        E=pg.evaluate
        for d in ['classic','board']:
            await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(600)
            await E("location.hash='#/partnerships'"); await pg.wait_for_timeout(1000)
            await pg.click('[data-view="cards"]'); await pg.wait_for_timeout(1200)
            ok(f'{d}: one card per listed partnership', await E("document.querySelectorAll('#regBody .pc').length===App.lastRegList.length"))
            ok(f'{d}: cover photos load', await E("[...document.querySelectorAll('#regBody .pc-media img.photo')].some(i=>i.getBoundingClientRect().height>100)"))
            acc = await E("""(()=>{ let bad=[]; App.lastRegList.forEach((p,i)=>{ const c=document.querySelectorAll('#regBody .pc')[i]; const tp=termProgress(p); const v=c.querySelector('.pc-ring .v');
                if (tp===null ? !!v : !v) bad.push(p.id);
                const st=pStatus(p), dl=daysLeft(p); const t=c.querySelector('.pc-facts > div:first-child dd').textContent;
                if (['active','soon'].includes(st) && dl!==null && !t.includes(nf(dl))) bad.push('dl:'+p.id);
                const ev=lastEval(p); const e=c.querySelector('.pc-facts > div:nth-child(2) dd').textContent;
                if (ev && ev.score!==null && !e.includes(String(ev.score))) bad.push('ev:'+p.id);
                if (wfInvolved(p)) { const S=wfStateOf('partnership',p).S; const n=WF_STEPS.filter(s=>S[s.id]&&S[s.id].status==='done').length; if (c.querySelectorAll('.pc-wfl i.d').length!==n) bad.push('wf:'+p.id); }
              }); return bad; })()""")
            ok(f'{d}: ring, remaining days, evaluation and workflow match the data', not acc, acc[:4])
        href = await E("document.querySelector('#regBody .pc .pc-link').getAttribute('href')")
        await pg.click('#regBody .pc >> nth=0', position={'x':150,'y':230}); await pg.wait_for_timeout(900)
        ok('clicking the card opens the partnership', (await E("location.hash")) == href)
        await E("location.hash='#/partnerships'"); await pg.wait_for_timeout(1200)
        await pg.hover('#regBody .pc >> nth=0'); await pg.click('#regBody .pc [data-pcdos] >> nth=0'); await pg.wait_for_timeout(500)
        ok('card dossier button opens the dossier dialog', await E("!!document.querySelector('.dos-dlg')") and (await E("location.hash")) == '#/partnerships')
        await pg.keyboard.press('Escape')
        ok('board nav calls the dashboard «لوحة الأداء»', 'لوحة الأداء' in await E("document.querySelector('.bo-row2').textContent") and 'لوحة المجلس' not in await E("document.querySelector('.bo-row2').textContent"))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
