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
            await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(500)
            await E("location.hash='#/process'"); await pg.wait_for_timeout(1500)
            ok(f'{d}: hero with live stats', await E("!!document.querySelector('.js-hero') && document.querySelectorAll('.js-stats dd').length===5"))
            live = await E("WF_STEPS.reduce((t,x)=>t+prAt(x.id).length,0)")
            ok(f'{d}: «in the path now» equals records at all steps', await E("document.querySelectorAll('.js-stats dd')[3].textContent") == str(live), live)
            ok(f'{d}: 13 stairs in order, rising', await E("(()=>{const s=[...document.querySelectorAll('.js-st')]; if(s.length!==13) return false; const h=s.map(x=>x.querySelector('.js-blk').getBoundingClientRect().height); return h.every((v,i)=>i===0||v>h[i-1]) && s.every((x,i)=>x.dataset.jstep===WF_STEPS[i].id)})()"))
            bad = await E("[...document.querySelectorAll('.js-st')].filter(s=>{const n=prAt(s.dataset.jstep).length; const b=s.querySelector('.js-now b'); return n ? !b || +b.textContent!==n : !!b}).map(s=>s.dataset.jstep)")
            ok(f'{d}: counts on stairs match the workflow state', not bad, bad)
            ok(f'{d}: decision/approval stairs marked', await E("document.querySelectorAll('.js-st.dec').length") == await E("WF_STEPS.filter(x=>x.kind==='decision'||x.kind==='review').length"))
            ok(f'{d}: return arcs for every «back» transition', await E("document.querySelectorAll('.js-arc').length") == await E("PR_EDGES.filter(e=>e[3]==='back').length"))
            ok(f'{d}: phases span their steps', await E("[...document.querySelectorAll('.js-phases > div:not(.js-ph-end)')].map(x=>+getComputedStyle(x).getPropertyValue('--n')).join()") == await E("WF_PHASES.map(ph=>WF_STEPS.filter(x=>x.ph===ph.id).length).join()"))
            ok(f'{d}: impact goal shows activated MoUs', await E("document.querySelector('.js-goal b').textContent") == str(await E("visiblePartnerships().filter(p=>p.activation==='مفعّلة'&&['active','soon'].includes(pStatus(p))).length")))
        await pg.click('.js-st[data-jstep="legal"]'); await pg.wait_for_timeout(500)
        ok('clicking a stair opens the step panel', await E("!!document.querySelector('#prDrawer') && document.querySelector('#prDrawer h3').textContent.includes('اعتماد القانونية')"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.click('.js-nav [data-jgo="prRaci"]'); await pg.wait_for_timeout(900)
        ok('section nav scrolls to the matrix', await E("Math.abs(document.querySelector('#prRaci').getBoundingClientRect().top - 80) < 60"))
        sums = await E("""(()=>{ const M=prRaci(); return PR_ROLES.every((r,i)=>{ const c={R:0,A:0,C:0,I:0}; WF_STEPS.forEach(x=>{const v=(M[x.id]||{})[r.k]; if(v) c[v]++;}); const cell=document.querySelectorAll('.pr-mx tfoot td')[i]; const shown=[...cell.querySelectorAll('.rc')].map(e=>+e.textContent).reduce((t,n)=>t+n,0); return shown===c.R+c.A+c.C+c.I; }) })()""")
        ok('matrix footer sums each role', sums)
        await pg.hover('.pr-mx tbody tr:nth-child(3) td:nth-child(4)'); await pg.wait_for_timeout(200)
        ok('matrix crosshair highlights row and column', await E("document.querySelectorAll('.pr-mx .hx').length") > 5)
        await E("window.dispatchEvent(new Event('beforeprint'))")
        ok('prints A4 landscape', 'landscape' in await E("(document.querySelector('#landPage')||{}).textContent||''"))
        await E("window.dispatchEvent(new Event('afterprint'))")
        m = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); mp = await m.new_page()
        await mp.goto(URL); await mp.wait_for_selector('#main .page'); await mp.wait_for_timeout(500)
        await mp.evaluate("location.hash='#/process'"); await mp.wait_for_timeout(1500)
        ok('mobile: no horizontal page overflow', await mp.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        await m.close()
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
