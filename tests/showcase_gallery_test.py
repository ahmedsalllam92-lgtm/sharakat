"""الواجهة المتحركة ومعرض الأثر: الصور من سجلات الشراكات وتتحدث معها"""
import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
R=[]
def ok(n,c,x=''): R.append(bool(c)); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1440,'height':900}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); E=pg.evaluate
        await pg.goto(URL); await pg.wait_for_selector('#main .page')
        for d in ['board','classic']:
            await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(700); await E("location.hash='#/'"); await pg.wait_for_timeout(1200)
            n = await E("document.querySelectorAll('.hrot-s').length")
            ok(f'{d}: hero rotates through partnership photos', n >= 2 and await E("heroSlides().filter(x=>x.p).length") >= 2, n)
            await pg.mouse.move(5, 5)
            first = await E("[...document.querySelectorAll('.hrot-s')].findIndex(s=>s.classList.contains('on'))")
            await pg.wait_for_timeout(6500)
            ok(f'{d}: switches by itself after a few seconds', await E("[...document.querySelectorAll('.hrot-s')].findIndex(s=>s.classList.contains('on'))") != first)
            for _ in range(8):
                if await E("!!document.querySelector('.hrot-s.on[data-hpid]')"): break
                await E("document.querySelector('[data-hd].on').nextElementSibling ? document.querySelector('[data-hd].on').nextElementSibling.click() : document.querySelector('[data-hd]').click()"); await pg.wait_for_timeout(300)
            await pg.click('.hrot-s.on[data-hpid]'); await pg.wait_for_timeout(400)
            ok(f'{d}: click opens partnership details card', await E("!!document.getElementById('hrotPop') && !!document.querySelector('#hrotPop a[href^=\"#/partnerships/\"]')"))
            await E("document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))"); await pg.wait_for_timeout(400)
            ok(f'{d}: click outside closes it', await E("!document.getElementById('hrotPop')"))
            ok(f'{d}: gallery icon on the hero', await E("!!document.querySelector('.hrot-gal[href=\"#/gallery\"]')"))
        await pg.click('.hrot-gal'); await pg.wait_for_timeout(1200)
        tot = await E("showcasePhotos().length")
        ok('gallery shows every partnership photo', await E("document.querySelectorAll('.gal-t').length") == tot, tot)
        # تحديث تلقائي: صورة جديدة في شراكة تظهر فورًا
        await E("(()=>{const p=D.partnerships.find(x=>!x.isDraft && !x.coverFileId); p.attachments=[...(p.attachments||[]), {id:'t1', fileId:'asset:splash-forest', name:'صورة.jpg', type:'image/jpeg', category:'صور الشراكة'}]; route();})()"); await pg.wait_for_timeout(900)
        ok('a photo added to a partnership appears in the gallery', await E("document.querySelectorAll('.gal-t').length") == tot + 1)
        await pg.click('[data-gview="reels"]'); await pg.wait_for_timeout(600)
        ok('per-partnership reels view', await E("document.querySelectorAll('.gal-reel').length") >= 2)
        await pg.click('[data-gview="wall"]'); await pg.wait_for_timeout(500)
        await pg.click('[data-gcine]'); await pg.wait_for_timeout(900)
        ok('cinematic viewer with partner card and thumbnails', await E("!!document.getElementById('galV') && !!document.querySelector('.galv-info b') && document.querySelectorAll('.galv-thumbs button').length") == tot + 1)
        await pg.keyboard.press('ArrowLeft'); await pg.wait_for_timeout(500)
        ok('keyboard navigation', await E("document.querySelector('.galv-n').textContent.startsWith('2')"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
