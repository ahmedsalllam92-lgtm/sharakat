import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width':1440,'height':900})).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        E=pg.evaluate
        pid = await E("D.partnerships.find(p=>p.title==='المديرية العامة لحرس الحدود').id")
        await E(f"App.ui.rpt.ids=['{pid}']; App.ui.rpt.sections=RPT_SECTIONS.map(s=>s.k).filter(k=>k!=='end'); App.ui.regView_classic='table'")
        before = await E("JSON.stringify([D.partnerships.length, D.proposals.length, D.partners.length])")
        rpt0 = await E("JSON.stringify(App.ui.rpt)")
        await E("location.hash='#/settings/tour'"); await pg.wait_for_timeout(500)
        await E("startTour(); TOUR.playing=false;"); await pg.wait_for_timeout(900)
        reg = await E("TOUR.steps.findIndex(s=>s.key==='register')")
        # search demo
        await E(f"setTimeout(()=>showStep({reg},0),0)")
        seen_q = False
        for _ in range(40):
            await pg.wait_for_timeout(150)
            v = await E("(document.querySelector('.reg-tools .searchbox input')||{}).value")
            if v == 'حرس': seen_q = True; n = await E("App.lastRegList.length")
            if seen_q and not await E("TOUR.acting"): break
        ok('search demo types into the real search box', seen_q)
        ok('results filtered live during demo', seen_q and n < await E("visiblePartnerships({includeDrafts:true}).length"), n if seen_q else None)
        ok('search cleared after demo', await E("document.querySelector('.reg-tools .searchbox input').value") == '')
        # filter demo
        await E(f"setTimeout(()=>showStep({reg},1),0)")
        saw_pop = False
        for _ in range(60):
            await pg.wait_for_timeout(150)
            if await E("!!document.querySelector('#regF .fpop')"): saw_pop = True; spot = await E("(()=>{const s=document.querySelector('.tour-spot').getBoundingClientRect(), p=document.querySelector('#regF .fpop').getBoundingClientRect(); return s.top<=p.top+1 && s.bottom>=p.bottom-1})()")
            if saw_pop and not await E("TOUR.acting"): break
        ok('filter demo opens the real filter menu', saw_pop)
        ok('spotlight expands to include the open menu', saw_pop and spot)
        ok('filters reset after demo', await E("location.hash") == '#/partnerships' and await E("App.lastRegList.length") == await E("visiblePartnerships({includeDrafts:true}).length"))
        # view demo
        await E(f"setTimeout(()=>showStep({reg},2),0)")
        flipped = False
        for _ in range(60):
            await pg.wait_for_timeout(150)
            if await E("App.ui.regView_classic") == 'cards': flipped = True
            if flipped and not await E("TOUR.acting"): break
        ok('view demo switches view', flipped)
        ok('view restored after demo', await E("App.ui.regView_classic") == 'table')
        # reports components demo
        rp = await E("TOUR.steps.findIndex(s=>s.key==='reports')")
        await E(f"setTimeout(()=>showStep({rp},1),0)")
        dropped = False
        for _ in range(80):
            await pg.wait_for_timeout(150)
            if not await E("App.ui.rpt.sections.includes('photos')"): dropped = True
            if dropped and not await E("TOUR.acting"): break
        ok('report demo toggles a component off', dropped)
        ok('component restored after demo', await E("App.ui.rpt.sections.includes('photos')"))
        # proposals tabs demo
        pr = await E("TOUR.steps.findIndex(s=>s.key==='proposals')")
        await E(f"setTimeout(()=>showStep({pr},0),0)")
        multi = False
        for _ in range(80):
            await pg.wait_for_timeout(150)
            if await E("document.querySelectorAll('#itabs button.on').length") == 2: multi = True
            if multi and not await E("TOUR.acting"): break
        ok('proposals demo selects two statuses', multi)
        ok('back to all after demo', await E("document.querySelector('#itabs [data-tab=\"all\"]').classList.contains('on')"))
        # share demo
        sh = await E("TOUR.steps.findIndex(s=>s.key==='share')")
        await E(f"setTimeout(()=>showStep({sh},1),0)")
        for _ in range(60):
            await pg.wait_for_timeout(150)
            if not await E("TOUR.acting"): break
        await E("endTour()"); await pg.wait_for_timeout(800)
        ok('no records created or changed', await E("JSON.stringify([D.partnerships.length, D.proposals.length, D.partners.length])") == before)
        ok('report selection restored exactly', await E("JSON.stringify(App.ui.rpt)") == rpt0)
        ok('returns to start page', await E("location.hash") == '#/settings/tour')
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
