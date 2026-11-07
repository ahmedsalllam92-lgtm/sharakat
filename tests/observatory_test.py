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
        pg.on('console', lambda m: errs.append('console: '+m.text) if m.type=='error' else None)
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        E=pg.evaluate
        async def go(h, w=1400): await E(f"location.hash={json.dumps(h)}"); await pg.wait_for_timeout(w)
        for d in ['classic','board']:
            await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(600)
            await go('#/dashboard?v=obs', 2200)
            ok(f'{d}: «حلقات النمو» is the default dashboard', await E("!!document.querySelector('.ob .ob-rings svg') && document.querySelector('.ob-views a.on').dataset.dview==='obs'"))
            n_dated = await E("visiblePartnerships().filter(p=>!p.isDraft&&parseDate(p.startDate)&&parseDate(p.endDate)).length")
            ok(f'{d}: one ray per dated partnership', await E("document.querySelectorAll('.ob-ray').length") == n_dated, n_dated)
            act = await E("visiblePartnerships().filter(p=>!p.isDraft&&['active','soon'].includes(pStatus(p))).length")
            ok(f'{d}: core shows active count', await E("document.querySelector('.ob-cn').textContent") == str(act))
            ok(f'{d}: pulse tiles + actions', await E("document.querySelectorAll('.ob-t').length===6 && !!document.querySelector('[data-tour=dash-actions]') && !!document.querySelector('[data-tour=dash-kpis]')"))
            ok(f'{d}: metro has 13 stations', await E("document.querySelectorAll('.ob-st').length===13"))
            ok(f'{d}: metro tokens equal pipeline items (up to 5 + more per station)', await E("(()=>{const P=wfPipeline(applyFilters(visiblePartnerships(),App.dashF)); const c={}; P.items.forEach(i=>c[i.step.id]=(c[i.step.id]||0)+1); return Object.values(c).reduce((t,n)=>t+Math.min(n,5)+(n>5?1:0),0)===document.querySelectorAll('.ob-tk').length})()"))
            ok(f'{d}: compass plots evaluated partnerships', await E("document.querySelectorAll('.ob-pt').length===valueData(visiblePartnerships().filter(p=>!p.isDraft)).ev.length"))
            ok(f'{d}: mosaic tile per partnership', await E("document.querySelectorAll('.ob-tile').length===visiblePartnerships().filter(p=>!p.isDraft).length"))
            ok(f'{d}: switch to the other view', await E("document.querySelector('.ob-views a:not(.on)').getAttribute('href')") == '#/dashboard?v=' + ('brief' if d=='board' else 'classic'))
        # cross-filter from sector label + rays dim
        await E("applyDesign('classic')"); await pg.wait_for_timeout(500); await go('#/dashboard?v=obs', 2000)
        await E("document.querySelector('.ob-slab').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(800)
        ok('sector label filters dashboard', len(await E("App.dashF.sector||[]")) == 1)
        ok('rays outside filter are dimmed, not removed', await E("document.querySelectorAll('.ob-ray.dim').length>0 && document.querySelectorAll('.ob-ray').length===visiblePartnerships().filter(p=>!p.isDraft&&parseDate(p.startDate)&&parseDate(p.endDate)).length"))
        await pg.click('[data-reset]'); await pg.wait_for_timeout(700)
        ok('reset filters', not await E("Object.keys(App.dashF).length"))
        # status legend filter
        await pg.click('.ob-lg button[data-cf="status|active"]'); await pg.wait_for_timeout(700)
        ok('legend filters by status', await E("JSON.stringify(App.dashF.status)") == '["active"]')
        await pg.click('[data-reset]'); await pg.wait_for_timeout(700)
        # time machine
        cnt = await E("(()=>{const t=new Date(2025,2,1).getTime(); const i=document.querySelector('.ob-time input'); i.value=t; i.dispatchEvent(new Event('input',{bubbles:true})); return [document.querySelector('.ob-cn').textContent, visiblePartnerships().filter(p=>!p.isDraft&&parseDate(p.startDate)&&parseDate(p.endDate)&&parseDate(p.startDate).getTime()<=t&&parseDate(p.endDate).getTime()>=t).length]})()")
        ok('time machine counts partnerships active on chosen date', cnt[0] == str(cnt[1]), cnt)
        ok('time machine label + return button', 'مارس 2025' in await E("document.querySelector('.ob-cl').textContent") and not await E("document.querySelector('[data-obnow]').hidden"))
        await pg.click('[data-obnow]'); await pg.wait_for_timeout(300)
        ok('return to today', await E("document.querySelector('.ob-cl').textContent") == 'سارية الآن')
        # tiles
        await pg.click('.ob-t[data-drawer="act"]'); await pg.wait_for_timeout(500)
        ok('active tile opens drawer', await E("!!document.querySelector('#dzDrawer')")); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.click('.ob-t[data-obscroll="obMetro"]'); await pg.wait_for_timeout(900)
        ok('pipeline tile scrolls to metro', await E("Math.abs(document.querySelector('#obMetro').getBoundingClientRect().top - 90) < 40"))
        href = await E("document.querySelector('.ob-tk').getAttribute('href')")
        await pg.click('.ob-tk'); await pg.wait_for_timeout(900)
        ok('metro token opens the item', (await E("location.hash")) == href, href)
        # بطاقة المحطة عند الوقوف عليها
        await go('#/dashboard', 2000)
        await E("document.querySelector('#obMetro').scrollIntoView(); scrollBy(0,-200)"); await pg.wait_for_timeout(300)
        idx = await E("[...document.querySelectorAll('.ob-st')].findIndex(s=>s.classList.contains('has'))")
        await pg.locator('.ob-st').nth(idx).locator('.ob-sl').hover(); await pg.wait_for_timeout(400)
        n_tok = await E(f"(()=>{{const P=wfPipeline(applyFilters(visiblePartnerships(),App.dashF)); return P.items.filter(i=>i.step.id===WF_STEPS[{idx}].id).length}})()")
        ok('hovering a station shows its items with details', await E("document.querySelector('#obPop').classList.contains('on')") and await E("document.querySelectorAll('#obPop .ob-pi').length") == n_tok and await E("!!document.querySelector('#obPop .ob-pi small.w')"), n_tok)
        await pg.locator('.ob-pb').nth(0).hover(); await pg.wait_for_timeout(400)
        ok('hovering a phase lists all its items', await E("document.querySelectorAll('#obPop .ob-pi').length") == await E("wfPipeline(applyFilters(visiblePartnerships(),App.dashF)).phases[0].items.length"))
        await pg.mouse.move(5, 880); await pg.wait_for_timeout(500)
        ok('card hides when the pointer leaves', not await E("document.querySelector('#obPop').classList.contains('on')"))
        # ray click opens partnership
        await go('#/dashboard', 2000)
        ok('dashboard remembers «حلقات النمو»', await E("!!document.querySelector('.ob-rings')"))
        rid = await E("document.querySelector('.ob-ray').dataset.href")
        await E("document.querySelector('.ob-ray .hit').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(900)
        ok('ray opens partnership', (await E("location.hash")) == rid)
        # switch to detailed and back
        await go('#/dashboard?v=classic', 1500)
        ok('detailed view still available with switch', await E("!!document.querySelector('.dz3') && !!document.querySelector('.dz-tools .ob-views')"))
        await go('#/dashboard?v=obs', 1500)
        # print: landscape
        await E("window.dispatchEvent(new Event('beforeprint'))")
        ok('prints A4 landscape', 'landscape' in await E("(document.querySelector('#landPage')||{}).textContent||''"))
        await E("window.dispatchEvent(new Event('afterprint'))")
        # dark + mobile
        await pg.click('#topbar [data-themetoggle]'); await pg.wait_for_timeout(700)
        ok('dark theme renders', await E("document.documentElement.dataset.theme==='dark' && !!document.querySelector('.ob-hero')"))
        await pg.click('#topbar [data-themetoggle]'); await pg.wait_for_timeout(500)
        m = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); mp = await m.new_page()
        await mp.goto(URL); await mp.wait_for_selector('#main .page'); await mp.wait_for_timeout(500)
        for d in ['classic','board']:
            await mp.evaluate(f"applyDesign('{d}')"); await mp.wait_for_timeout(500)
            await mp.evaluate("location.hash='#/dashboard?v=obs'"); await mp.wait_for_timeout(1800)
            ok(f'mobile {d}: no horizontal page overflow', await mp.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        await m.close()
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
