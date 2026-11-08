"""التقرير التسويقي «أثرٌ يُروى»: الشرائح مبنية من البيانات، والنطاقات، والتعديل، والعرض، وPDF"""
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
        await E("location.hash='#/reports'"); await pg.wait_for_timeout(800)
        ok('entry card in the reports studio', await E("!!document.querySelector('a.mk-entry[href=\"#/reports/marketing\"]')"))
        await pg.click('a.mk-entry'); await pg.wait_for_timeout(1200)
        kinds = await E("[...document.querySelectorAll('#mkDeck .rs2.mk')].map(s=>s.dataset.mk)")
        ok('cinematic deck built (cover first, invitation last)', len(kinds) >= 8 and kinds[0]=='cover' and kinds[-1]=='close', kinds)
        ok('numbers come from the data', await E("(()=>{const X=mkData(); const b=[...document.querySelectorAll('.mks-numbers .mk-bento b')].map(x=>x.textContent); return b[0]===String(X.partners.length) && b[1]===String(X.act.length)})()"))
        ok('every slide is 1280×720 and nothing overflows it', await E("[...document.querySelectorAll('#mkDeck .rs2.mk')].every(s=>s.scrollWidth<=1281 && s.scrollHeight<=721)"))
        # النطاق
        await pg.click('[data-mkscope="golden"]') if await E("!document.querySelector('[data-mkscope=golden]').disabled") else None
        await pg.click('[data-mkscope="active"]'); await pg.wait_for_timeout(700)
        ok('scope switch rebuilds from active partnerships only', await E("MK.scope==='active' && document.querySelector('.mks-numbers .mk-bento .b2 b').textContent===String(mkData().act.length)"))
        await pg.click('[data-mkscope="all"]'); await pg.wait_for_timeout(700)
        # التعديل
        await E("(()=>{const t=document.querySelector('.mks-cover h1 .mk-ed'); t.textContent='عنوان معدّل للعرض'; t.dispatchEvent(new Event('input',{bubbles:true}))})()")
        await pg.click('[data-mkscope="active"]'); await pg.wait_for_timeout(500); await pg.click('[data-mkscope="all"]'); await pg.wait_for_timeout(500)
        ok('edited headline survives a rebuild', await E("document.querySelector('.mks-cover h1').textContent.includes('عنوان معدّل للعرض')"))
        await pg.click('[data-mkreset]'); await pg.wait_for_timeout(500)
        ok('restore original texts', await E("!document.querySelector('.mks-cover h1').textContent.includes('عنوان معدّل')"))
        # العرض
        await pg.click('[data-mkshow]'); await pg.wait_for_timeout(800)
        ok('fullscreen show opens with all slides', await E("!!document.getElementById('rptShow') && document.querySelectorAll('#rptShow .rshow-slide').length===document.querySelectorAll('#mkDeck .rs2').length"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # PDF
        await E("window.print=()=>{}")
        await pg.click('[data-mkpdf]'); await pg.wait_for_timeout(600)
        ok('PDF prepares one page per slide', await E("document.documentElement.classList.contains('printing-report') && document.querySelectorAll('#rptPrint .rs2.mk').length===document.querySelectorAll('#mkDeck .rs2').length && !document.querySelector('#rptPrint [contenteditable]')"))
        await E("window.dispatchEvent(new Event('afterprint'))")
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
