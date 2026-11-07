import asyncio, json, os
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
R=[]
def TOUR_SPOT_SMALL(info): return bool(info['sel']) and info['found'] and info['spotH'] < min(info['elH'] * 0.9, 120)
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vw,vh,label in [x for x in [(1440,900,'desktop'),(390,844,'mobile')] if os.environ.get('ONLY','') in ('',x[2])]:
            ctx = await b.new_context(viewport={'width':vw,'height':vh}, is_mobile=(label=='mobile'), has_touch=(label=='mobile'))
            pg = await ctx.new_page(); errs=[]
            pg.on('pageerror', lambda e: errs.append(str(e)+' '+str(getattr(e,'stack',''))[:300]))
            await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
            E=pg.evaluate
            designs = ['classic','board']
            for d in designs:
                await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(500)
                await E("location.hash='#/partnerships?sector=خاص'"); await pg.wait_for_timeout(600)
                before = await E("[D.proposals.length, D.partnerships.length, JSON.stringify(D.proposals.map(x=>x.status))]")
                await E("location.hash='#/settings/tour'"); await pg.wait_for_timeout(500)
                start_hash = '#/settings/tour'
                await pg.click('#sbody [data-tour-start]'); await pg.wait_for_timeout(1500)
                ok(f'[{label}/{d}] tour started', await E("App.tour && !!document.querySelector('#tour')"))
                ok(f'[{label}/{d}] tour UI follows design', await E(f"document.documentElement.dataset.design==='{d}' && document.querySelector('.tour-design').textContent===DESIGNS['{d}'].name"))
                n = await E("TOUR.steps.length")
                ok(f'[{label}/{d}] 12 steps for admin (incl. reports)', n == 12 and 'reports' in await E("TOUR.steps.map(s=>s.key)"), n)
                txt = await E("document.querySelector('.tb-txt').textContent")
                ok(f'[{label}/{d}] progress label', txt.startswith('الخطوة 1 من 12'), txt)
                await E("TOUR.playing=false; updateBar()")
                missing=[]; overlaps=[]
                total_parts = await E("TOUR.steps.reduce((t,s)=>t+s.parts.length,0)")
                for k in range(total_parts):
                    await pg.wait_for_timeout(250)
                    for _ in range(40):
                        if not await E("TOUR.busy"): break
                        await pg.wait_for_timeout(100)
                    await pg.wait_for_timeout(750)
                    info = await E("""(()=>{const s=TOUR.steps[TOUR.i],p=s.parts[TOUR.part]; const W=document.documentElement.clientWidth,H=document.documentElement.clientHeight; const c=document.querySelector('.tour-card').getBoundingClientRect(); const sp=document.querySelector('.tour-spot'); let ov=0; if(TOUR.el && !sp.hidden){const r=sp.getBoundingClientRect(); const ix=Math.max(0,Math.min(c.right,r.right)-Math.max(c.left,r.left)), iy=Math.max(0,Math.min(c.bottom,r.bottom)-Math.max(c.top,r.top)); ov=ix*iy/Math.max(1,r.width*r.height);} return {key:s.key, part:TOUR.part, sel:p.sel, found:!!TOUR.el || !p.sel, ov, spotH: TOUR.el? sp.getBoundingClientRect().height:0, elH: TOUR.el? TOUR.el.getBoundingClientRect().height:0, cardIn:c.left>=-1&&c.right<=W+1&&c.top>=-1&&c.bottom<=H+1}})()""")
                    if TOUR_SPOT_SMALL(info): overlaps.append((info['key'],'tiny-spot'))
                    if not info['found']: missing.append(info['key'])
                    if info['ov'] > 0.04: overlaps.append((info['key'], round(info['ov'],2)))
                    if not info['cardIn']: overlaps.append((info['key'],'card-offscreen'))
                    if k < total_parts-1:
                        await E("nextTour()")
                ok(f'[{label}/{d}] every step target found', not missing, missing)
                ok(f'[{label}/{d}] card avoids covering target', not overlaps, overlaps)
                ok(f'[{label}/{d}] final summary screen', await E("document.querySelector('#tour').classList.contains('final') && !!document.querySelector('.tour-final')"))
                # prev / jump / play / speed
                await E("prevTour()"); await pg.wait_for_timeout(900)
                ok(f'[{label}/{d}] previous works', await E("TOUR.i===TOUR.steps.length-2"))
                await pg.click('.tb-track button >> nth=2'); await pg.wait_for_timeout(1500)
                ok(f'[{label}/{d}] jump to step', await E("TOUR.i===2"))
                await pg.click('.tour-bar [data-t="play"]'); await pg.wait_for_timeout(200)
                ok(f'[{label}/{d}] play toggled on', await E("TOUR.playing"))
                await pg.select_option('.tour-bar [data-t="speed"]', '1.5')
                await E("TOUR.elapsed = 99999"); await pg.wait_for_timeout(1500)
                ok(f'[{label}/{d}] autoplay advances', await E("TOUR.i>2 || TOUR.part>0"), await E("[TOUR.i,TOUR.part]"))
                await pg.click('.tour-bar [data-t="play"]'); await pg.wait_for_timeout(200)
                ok(f'[{label}/{d}] pause', await E("!TOUR.playing && document.querySelector('#tour').classList.contains('paused')"))
                await pg.keyboard.press('Space'); await pg.wait_for_timeout(150)
                ok(f'[{label}/{d}] space resumes', await E("TOUR.playing"))
                await pg.click('.tour-bar [data-t="restart"]'); await pg.wait_for_timeout(1400)
                ok(f'[{label}/{d}] restart', await E("TOUR.i===0 && TOUR.part===0"))
                await pg.keyboard.press('Escape'); await pg.wait_for_timeout(800)
                ok(f'[{label}/{d}] escape ends tour', await E("!App.tour && !document.querySelector('#tour')"))
                ok(f'[{label}/{d}] returns to start page', (await E("location.hash")) == start_hash, await E("location.hash"))
                after = await E("[D.proposals.length, D.partnerships.length, JSON.stringify(D.proposals.map(x=>x.status))]")
                ok(f'[{label}/{d}] no records modified', before == after)
                ok(f'[{label}/{d}] design kept', await E(f"design()==='{d}'"))
                ok(f'[{label}/{d}] no dirty flag', await E("!App.dirty"))
            # role-aware: dept
            await E("switchRole('dept','الإدارة العامة للمشاريع')"); await pg.wait_for_timeout(500)
            await E("startTour()"); await pg.wait_for_timeout(1200)
            keys = await E("TOUR.steps.map(s=>s.key)")
            ok(f'[{label}] dept tour skips dashboard & partners', 'dash' not in keys and 'partners' not in keys and 'share' in keys and 'proposals' in keys, keys)
            await E("endTour()"); await pg.wait_for_timeout(500)
            await E("switchRole('viewer')"); await pg.wait_for_timeout(400)
            keys = await E("tourSteps().map(s=>s.key)")
            ok(f'[{label}] viewer tour skips proposals', 'proposals' not in keys and 'dash' in keys, keys)
            await E("switchRole('admin')"); await pg.wait_for_timeout(300)
            # alt+t from floating switcher
            await pg.click('#dsw [data-dsw-toggle]'); await pg.wait_for_timeout(200)
            await pg.click('#dsw [data-tour-start]'); await pg.wait_for_timeout(900)
            ok(f'[{label}] start from floating switcher', await E("App.tour"))
            await pg.click('.tour-bar [data-t="end"]'); await pg.wait_for_timeout(600)
            ok(f'[{label}] end button', await E("!App.tour"))
            ok(f'[{label}] no page errors', not errs, errs[:3])
            await ctx.close()
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
