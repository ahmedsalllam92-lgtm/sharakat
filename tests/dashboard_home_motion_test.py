import asyncio
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
        # dashboard lower surface
        await E("App.dashF={}; App.dashHist=[]; App.dashDim='sector'; location.hash='#/dashboard'"); await pg.wait_for_timeout(1500)
        ok('lower part is one joined surface with 5 sections', await E("document.querySelectorAll('.dz3-deep:not(.dv) > .dz3-dc').length") == 5)
        nsec = await E("countBy(visiblePartnerships().filter(p=>!p.isDraft),'sector').filter(r=>r.n).length")
        ok('treemap shows one block per sector', await E("document.querySelectorAll('.tm .tm-b').length") == nsec)
        await pg.click('[data-tmdim="category"]'); await pg.wait_for_timeout(700)
        ncat = await E("countBy(visiblePartnerships().filter(p=>!p.isDraft),'category').filter(r=>r.n).length")
        ok('treemap switcher changes dimension', await E("document.querySelectorAll('.tm .tm-b').length") == ncat and await E("App.dashDim") == 'category')
        ok('switching dimension does not add undo history', await E("App.dashHist.length") == 0)
        v = int(await E("document.querySelector('.tm .tm-b b').textContent"))
        await pg.click('.tm .tm-b >> nth=0'); await pg.wait_for_timeout(800)
        ok('treemap block cross-filters', bool(await E("App.dashF.category && App.dashF.category.length===1")) and int(await E("document.querySelector('.dz2-scope b').textContent")) == v)
        await pg.click('[data-reset]'); await pg.wait_for_timeout(700)
        await pg.click('.rg-c >> nth=0'); await pg.wait_for_timeout(800)
        ok('owner ring cross-filters', bool(await E("App.dashF.owner && App.dashF.owner.length===1")))
        await pg.click('[data-reset]'); await pg.wait_for_timeout(700)
        exp = await E("visiblePartnerships().filter(p=>!p.isDraft&&p.stage==='signed'&&p.endDate&&daysLeft(p)>=0&&daysLeft(p)<=365).length")
        ok('countdown cards match expiries (max 4)', await E("document.querySelectorAll('.ct-c').length") == min(4, exp))
        nd = await E("visiblePartnerships().filter(p=>!p.isDraft).length")
        ok('quality matrix: one dot per field × partnership', await E("document.querySelectorAll('.qm-d').length") == await E("CORE_FIELDS.length") * min(30, nd))
        ok('missing dots match missing fields', await E("document.querySelectorAll('.qm-d.x').length") == await E("visiblePartnerships().filter(p=>!p.isDraft).reduce((t,p)=>t+missingFields(p).length,0)"))
        ok('proposal flow nodes link to proposals', await E("[...document.querySelectorAll('.pf-s')].every(a=>a.getAttribute('href').startsWith('#/proposals?status='))"))
        # settings tabs horizontal
        await E("location.hash='#/settings/lists'"); await pg.wait_for_timeout(700)
        ok('settings sub-menu is horizontal tabs', await E("getComputedStyle(document.querySelector('.set-nav')).flexDirection") == 'row' and await E("document.querySelector('#sbody').getBoundingClientRect().top > document.querySelector('.set-nav').getBoundingClientRect().bottom - 2"))
        ok('settings content uses full width', await E("document.querySelector('#sbody').getBoundingClientRect().width > document.querySelector('.set-wrap').getBoundingClientRect().width - 4"))
        # home hero extras + reveal
        await E("location.hash='#/'"); await pg.wait_for_timeout(2500)
        ok('hero: light pulses on contours + network between live numbers', await E("document.querySelectorAll('.hfx-comet').length") >= 2 and await E("document.querySelectorAll('.hfx-net path').length") >= 3)
        n_rv = await E("document.querySelectorAll('[data-rv]').length")
        ok('scroll reveal applied with varied effects', n_rv > 10 and len(set(await E("[...document.querySelectorAll('[data-rv]')].map(x=>x.dataset.rv)"))) >= 3, n_rv)
        hidden = await E("[...document.querySelectorAll('[data-rv]')].filter(x=>x.getBoundingClientRect().top > innerHeight*1.2 && !x.classList.contains('rv-in')).length")
        ok('content below the fold waits for scroll', hidden > 0, hidden)
        await E("window.scrollTo(0, document.body.scrollHeight)"); await pg.wait_for_timeout(300)
        for y in range(0, 6000, 500):
            await E(f"window.scrollTo(0,{y})"); await pg.wait_for_timeout(120)
        await pg.wait_for_timeout(1300)
        left = await E("[...document.querySelectorAll('[data-rv]')].filter(x=>!x.classList.contains('rv-in')).map(x=>x.dataset.rv+'|'+x.className.slice(0,30)+'|'+Math.round(x.getBoundingClientRect().top+scrollY)+'|'+document.documentElement.scrollHeight)")
        ok('all content revealed after scrolling', not left, left[:5])
        ok('revealed numbers end at real values', await E("[...document.querySelectorAll('[data-rvn]')].every(v=>v.textContent===nf(+v.dataset.rvn))"))
        await pg.emulate_media(media='print')
        ok('print shows everything regardless of reveal', await E("[...document.querySelectorAll('[data-rv]')].every(x=>getComputedStyle(x).opacity==='1')"))
        await pg.emulate_media(media='screen')
        # reduced motion
        rm = await (await b.new_context(viewport={'width':1440,'height':900}, reduced_motion='reduce')).new_page()
        await rm.goto(URL); await rm.wait_for_selector('#main .page'); await rm.wait_for_timeout(1200)
        ok('reduced motion: no reveal hiding, no hero pulses', await rm.evaluate("document.querySelectorAll('[data-rv]').length===0 && document.querySelectorAll('.hfx-comet,.hfx-net').length===0"))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
