import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':1440,'height':900}, accept_downloads=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)+' '+str(getattr(e,'stack',''))[:300]))
        pg.on('console', lambda m: errs.append('console: '+m.text) if m.type=='error' else None)
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        E=pg.evaluate
        async def go(h, w=700): await E(f"location.hash={json.dumps(h)}"); await pg.wait_for_timeout(w)
        ok('default design is classic', await E("design()==='classic' && document.documentElement.dataset.design==='classic'"))
        # settings cards
        await go('#/settings/design')
        ok('two design cards with previews', await E("document.querySelectorAll('.dcard').length===2 && document.querySelectorAll('.dcard svg.dprev').length===2"))
        ok('active card marked', await E("document.querySelector('.dcard.on').dataset.dk==='classic'"))
        # preserve page/filters/role
        await E("switchRole('team','الإدارة العامة للمشاريع','رنيم')"); await pg.wait_for_timeout(400)
        await go('#/partnerships?sector=خاص&status=active|soon')
        n_classic = await E("App.lastRegList.length")
        await pg.keyboard.press('Alt+2'); await pg.wait_for_timeout(1000)
        ok('Alt+2 → board', await E("design()==='board'"))
        ok('page & filters kept', (await E("location.hash")).startswith('#/partnerships?sector=') and await E("App.lastRegList.length") == n_classic)
        ok('role kept', await E("Session.role()==='team'"))
        ok('board shows top nav, no sidebar', await E("!!document.querySelector('#topbar nav, #topbar .bo-nav') && getComputedStyle(document.querySelector('.side')).display==='none'"))
        await pg.reload(); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(800)
        ok('design persists after reload', await E("design()==='board' && document.documentElement.dataset.design==='board'"))
        await pg.keyboard.press('Alt+1'); await pg.wait_for_timeout(900)
        ok('Alt+1 → classic', await E("design()==='classic'"))
        await E("switchRole('admin')"); await pg.wait_for_timeout(400)
        pid = await E("D.partnerships.find(p=>p.title==='المديرية العامة لحرس الحدود').id")
        # every page renders in every design
        prid = await E("D.proposals.find(x=>x.status==='review').id")
        prtid = await E("D.partners[0].id")
        pages = ['#/','#/dashboard?v=alt','#/partnerships','#/partnerships/new',f'#/partnerships/{pid}',f'#/partnerships/{pid}/edit','#/partners',f'#/partners/{prtid}','#/stories','#/content','#/share','#/share/new','#/proposals',f'#/proposals/{prid}','#/settings/general','#/settings/design','#/settings/tour','#/settings/home','#/settings/lists','#/settings/roles','#/settings/data','#/settings/audit']
        for d in ['classic','board']:
            await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(600)
            bad=[]
            for h in pages:
                await go(h, 450)
                okp = await E("!document.querySelector('#main .empty h3') || !document.querySelector('#main .empty h3').textContent.includes('تعذّر')")
                if not okp: bad.append(h)
            ok(f'all {len(pages)} pages render in {d}', not bad, bad)
            await go('#/'); await pg.wait_for_timeout(900)
            await pg.mouse.move(300,300); await pg.wait_for_timeout(150); await pg.mouse.move(500,420); await pg.wait_for_timeout(500)
            fx = await E("(()=>{const h=document.querySelector('[data-hfx]'); return h? {lines:!!h.querySelector('.hfx-lines svg'), beacons:h.querySelectorAll('.hfx-b').length, mx:getComputedStyle(h).getPropertyValue('--mx'), on:h.classList.contains('hfx-on')}:null})()")
            if d == 'classic': ok(f'{d}: hero has animated graphics + beacons + parallax', fx and fx['lines'] and fx['beacons']>=3 and fx['on'] and fx['mx'].strip() not in ('','0','0.0000'), fx)
            # modal & theme in each design
            await pg.click('#topbar [data-role]'); await pg.wait_for_timeout(250)
            ok(f'{d}: modal opens', await E("!!document.querySelector('.modal')")); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
            t0 = await E("document.documentElement.dataset.theme")
            await pg.click('#topbar [data-themetoggle]'); await pg.wait_for_timeout(800)
            dark_bg = await E("document.documentElement.dataset.theme + '|' + getComputedStyle(document.body).backgroundColor")
            await pg.click('#topbar [data-themetoggle]'); await pg.wait_for_timeout(800)
            light_bg = await E("document.documentElement.dataset.theme + '|' + getComputedStyle(document.body).backgroundColor")
            ok(f'{d}: theme toggles', dark_bg != light_bg, (dark_bg, light_bg))
            # print
            await go('#/dashboard?v=alt', 1200); await pg.emulate_media(media='print')
            ok(f'{d}: print hides switcher', await E("getComputedStyle(document.querySelector('#dsw')).display==='none'"))
            await pg.pdf(path=f'/home/claude/shots/j/dash-{d}.pdf', format='A4', print_background=True)
            await pg.emulate_media(media='screen')
        # distinct fonts per design
        fonts = {}
        for d in ['classic','board']:
            await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(500); await go('#/partnerships', 500)
            fonts[d] = await E("[getComputedStyle(document.querySelector('.ph h1')).fontFamily, getComputedStyle(document.body).fontFamily]")
        ok('designs differ in typography', len({tuple(v) for v in fonts.values()}) == 2, fonts)
        # classic collapsed sidebar hover reveals labels
        await E("applyDesign('classic')"); await pg.wait_for_timeout(700)
        await pg.click('[data-collapse]'); await pg.mouse.move(800,500); await pg.wait_for_timeout(500)
        w0 = await E("document.querySelector('.side').getBoundingClientRect().width")
        ok('collapse button is icon-only', await E("document.querySelector('[data-collapse]').textContent.trim()===''"))
        ok('collapsed rail narrow + labels hidden', w0 < 80 and await E("getComputedStyle(document.querySelector('.side .nav-a span')).display==='none'"), w0)
        await pg.hover('.side .nav-a[href="#/partnerships"]'); await pg.wait_for_timeout(450)
        w1 = await E("document.querySelector('.side').getBoundingClientRect().width")
        ok('hover expands rail and shows labels', w1 > 200 and await E("getComputedStyle(document.querySelector('.side .nav-a span')).display!=='none'"), w1)
        await pg.mouse.move(800,500); await pg.wait_for_timeout(400)
        ok('rail collapses again on leave', await E("document.querySelector('.side').getBoundingClientRect().width") < 80)
        await pg.click('[data-collapse]'); await pg.wait_for_timeout(300)
        ok('expanded sidebar width 236', abs(await E("document.querySelector('.side').getBoundingClientRect().width") - 236) < 2)
        # floating switcher click
        await pg.click('#dsw [data-dsw-toggle]'); await pg.wait_for_timeout(200)
        await pg.click('#dsw [data-dsw="board"]'); await pg.wait_for_timeout(900)
        ok('floating switcher applies design', await E("design()==='board'"))
        # dirty form guard on switch
        await go(f'#/partnerships/{pid}/edit'); await pg.fill('#f_title', 'تعديل غير محفوظ'); await pg.wait_for_timeout(150)
        await E("document.activeElement.blur()")
        await pg.keyboard.press('Alt+1'); await pg.wait_for_timeout(400)
        ok('switching with unsaved changes asks first', await E("!!document.querySelector('.modal') && design()==='board'"))
        await pg.click('.modal [data-mclose]:has-text("إلغاء")'); await pg.wait_for_timeout(200)
        ok('cancel keeps design and form', await E("design()==='board' && document.querySelector('#f_title').value==='تعديل غير محفوظ'"))
        await E("App.dirty=false")
        # reduced motion
        rm = await b.new_context(viewport={'width':1440,'height':900}, reduced_motion='reduce'); rp = await rm.new_page()
        await rp.goto(URL); await rp.wait_for_selector('#main .page'); await rp.wait_for_timeout(700)
        ok('reduced motion: no parallax, beacons visible', await rp.evaluate("!document.querySelector('[data-hfx]').classList.contains('hfx-on') && getComputedStyle(document.querySelector('.hfx-b')).opacity==='1'"))
        await rm.close()
        # mobile drawers per design
        for d in ['classic','board']:
            m = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); mp = await m.new_page()
            await mp.goto(URL); await mp.wait_for_selector('#main .page'); await mp.wait_for_timeout(500)
            await mp.evaluate(f"applyDesign('{d}')"); await mp.wait_for_timeout(700)
            await mp.click('[data-menu]'); await mp.wait_for_timeout(400)
            vis = await mp.evaluate("(()=>{const s=document.querySelector('.side'); const r=s.getBoundingClientRect(); return getComputedStyle(s).display!=='none' && r.right<=innerWidth+1 && r.left>=0 && getComputedStyle(document.querySelector('.side .nav-a span')).display!=='none'})()")
            ok(f'mobile {d}: drawer opens with labels', vis)
            over = await mp.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1")
            ok(f'mobile {d}: no horizontal overflow', over)
            await m.close()
        ok('no page errors', not errs, errs[:4])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
