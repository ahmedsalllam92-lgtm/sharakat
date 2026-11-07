import asyncio, json, zipfile, re
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
OUT='/home/claude/shots'
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width':1440,'height':900}, accept_downloads=True)).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        E=pg.evaluate
        for d in ['classic','board']:
            await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(500)
            await E("location.hash='#/reports'"); await pg.wait_for_timeout(1200)
            ok(f'{d}: studio hero + 4 story presets + quick picks', await E("!!document.querySelector('.rx-hero') && document.querySelectorAll('[data-rpreset]').length===4 && document.querySelectorAll('[data-rquick]').length===4"))
        # quick pick
        await pg.click('[data-rquick="strategic"]'); await pg.wait_for_timeout(1500)
        exp = await E("visiblePartnerships({includeDrafts:can('view.drafts')}).filter(p=>(p.ptype||'').includes('استراتيجي')).map(p=>p.id).sort().join()")
        ok('quick pick selects exactly the strategic partnerships', await E("RPT.ids.slice().sort().join()") == exp and await E("document.querySelector('[data-rquick=strategic]').classList.contains('on')"))
        # preset
        await pg.click('[data-rpreset="story"]'); await pg.wait_for_timeout(1200)
        ok('«قصة أثر» preset sets its components', await E("RPT.sections") == ['cover','pcover','story','hero','impact','activity','photos','end'] and await E("document.querySelector('[data-rpreset=story]').classList.contains('on')"))
        kinds = await E("[...document.querySelectorAll('#rpSlides .rs2')].map(s=>s.dataset.st)")
        n_story = await E("RPT.ids.map(id=>D.partnerships.find(p=>p.id===id)).filter(p=>p.showcaseGoal||richItems(p.expectedImpact).length).length")
        n_hero = await E("RPT.ids.map(id=>D.partnerships.find(p=>p.id===id)).filter(p=>p.highlight&&p.highlight.value).length")
        ok('one «قصة الأثر» slide per partnership with a goal or impact', kinds.count('story') == n_story, (kinds.count('story'), n_story))
        ok('one «الرقم البطل» slide per partnership with a highlight', kinds.count('hero') == n_hero, (kinds.count('hero'), n_hero))
        ok('no slides outside the preset', set(kinds) <= {'cover','pcover','story','hero','cols','activity','photos','end'}, set(kinds))
        # hero number matches record
        hv = await E("(()=>{const s=document.querySelector('.rs2[data-st=hero]'); const k=s.querySelector('[data-ek$=\".hlv\"]'); const id=k.dataset.ek.split('.')[0]; return [k.innerText.trim(), D.partnerships.find(p=>p.id===id).highlight.value]})()")
        ok('hero number is the partnership highlight', hv[0] == hv[1], hv)
        # inline edit on the story quote
        q = pg.locator('.rs2[data-st=story] [data-ek$=".quote"]').first
        await q.click(); await pg.keyboard.press('End'); await pg.keyboard.type(' — نص مضاف'); await pg.wait_for_timeout(200)
        ok('story quote is editable inline', 'نص مضاف' in await q.inner_text())
        # cover uses partnership photos
        ok('cover slide shows partnership photos', await E("[...document.querySelectorAll('.rs2[data-st=cover] img.rs2-i')].filter(i=>!i.src.startsWith('data:image/svg')).length>=2"))
        # pptx parity via the floating dock
        nS = await E("document.querySelectorAll('#rpSlides .rs-frame').length")
        async with pg.expect_download(timeout=120000) as dl:
            await pg.click('[data-rpptx2]')
        d_ = await dl.value; await d_.save_as(OUT+'/studio.pptx')
        z = zipfile.ZipFile(OUT+'/studio.pptx'); slides = [n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n)]
        x = ''.join(z.read(n).decode('utf8') for n in slides)
        ok('PowerPoint from the dock has the same number of slides', len(slides) == nS, (len(slides), nS))
        ok('edited quote reaches PowerPoint', 'نص مضاف' in x)
        ok('hero number reaches PowerPoint', hv[1] in x)
        # brief preset
        await pg.click('[data-rpreset="brief"]'); await pg.wait_for_timeout(1200)
        kinds2 = await E("[...document.querySelectorAll('#rpSlides .rs2')].map(s=>s.dataset.st)")
        ok('«إحاطة تنفيذية» preset builds the brief', kinds2[0] == 'cover' and 'portfolio' in kinds2 and 'exec' in kinds2 and 'story' not in kinds2, kinds2[:6])
        # print still prints only slides
        await E("window.dispatchEvent(new Event('beforeprint'))"); await pg.wait_for_timeout(200)
        ok('printing prints the slides only', await E("document.documentElement.classList.contains('printing-report') && document.querySelectorAll('#rptPrint .rs2').length===document.querySelectorAll('#rpSlides .rs2').length"))
        await E("window.dispatchEvent(new Event('afterprint'))")
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
