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
        ok('cinematic deck built (seed first, interlocking rings last)', len(kinds) >= 8 and kinds[0]=='seed' and kinds[-1]=='bond', kinds)
        ok('numbers come from the data', await E("(()=>{const X=mkData(); const b=[...document.querySelectorAll('.mks-three .mx-gi b')].map(x=>x.textContent); return b[0]===String(X.partners.length) && b[1]===String(X.act.length) && document.querySelectorAll('.mks-seed .mx-tree .lf').length===(X.sectors.length ? X.sectors.slice(0,6).reduce((t,[s_])=>t+Math.min(14, X.L.filter(p=>pSector(p)===s_).length),0) : Math.min(14, X.L.length))})()"))
        ok('every slide is 1280×720 and nothing overflows it', await E("[...document.querySelectorAll('#mkDeck .rs2.mk')].every(s=>s.scrollWidth<=1281 && s.scrollHeight<=721)"))
        # النطاق
        await pg.click('[data-mkscope="golden"]') if await E("!document.querySelector('[data-mkscope=golden]').disabled") else None
        await pg.click('[data-mkscope="active"]'); await pg.wait_for_timeout(700)
        ok('scope switch rebuilds from active partnerships only', await E("MK.scope==='active' && document.querySelectorAll('.mks-three .mx-gi b')[1].textContent===String(mkData().act.length)"))
        await pg.click('[data-mkscope="all"]'); await pg.wait_for_timeout(700)
        # التعديل
        await E("(()=>{const t=document.querySelector('.mks-seed h1 .mk-ed'); t.textContent='عنوان معدّل للعرض'; t.dispatchEvent(new Event('input',{bubbles:true}))})()")
        await pg.click('[data-mkscope="active"]'); await pg.wait_for_timeout(500); await pg.click('[data-mkscope="all"]'); await pg.wait_for_timeout(500)
        ok('edited headline survives a rebuild', await E("document.querySelector('.mks-seed h1').textContent.includes('عنوان معدّل للعرض')"))
        await pg.click('[data-mkreset]'); await pg.wait_for_timeout(500)
        ok('restore original texts', await E("!document.querySelector('.mks-seed h1').textContent.includes('عنوان معدّل')"))
        # العرض
        await pg.click('[data-mkshow]'); await pg.wait_for_timeout(800)
        ok('fullscreen show opens with all slides', await E("!!document.getElementById('rptShow') && document.querySelectorAll('#rptShow .rshow-slide').length===document.querySelectorAll('#mkDeck .rs2').length"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # PDF
        await E("window.print=()=>{}")
        await pg.click('[data-mkpdf]'); await pg.wait_for_timeout(600)
        ok('scenes animate in preview and print in their final state', await E("document.querySelector('#mkDeck .rs2.mk').classList.contains('mk-anim') && ![...document.querySelectorAll('#rptPrint .rs2.mk')].some(x=>x.classList.contains('mk-anim'))"))
        ok('PDF prepares one page per slide', await E("document.documentElement.classList.contains('printing-report') && document.querySelectorAll('#rptPrint .rs2.mk').length===document.querySelectorAll('#mkDeck .rs2').length && !document.querySelector('#rptPrint [contenteditable]')"))
        await E("window.dispatchEvent(new Event('afterprint'))")
        # تقرير شراكة واحدة
        await E("location.hash='#/'"); await pg.wait_for_timeout(400)
        pid = await E("visiblePartnerships().filter(p=>!p.isDraft && pProfile(p).total)[0].id")
        await E(f"location.hash='#/partnerships/{pid}'"); await pg.wait_for_timeout(900)
        await pg.click('a[href^="#/reports/marketing?p="]'); await pg.wait_for_timeout(1500)
        ok('partnership page opens its own marketing report', await E("MK.scope") == 'one' and await E("MK.pid") == pid and await E(f"document.querySelector('.mk-head h1').textContent===partnerName(D.partnerships.find(p=>p.id==='{pid}'))"))
        kinds = await E("[...document.querySelectorAll('#mkDeck .rs2.mk')].map(s=>s.dataset.mk)")
        ok('single-partnership scenes: cover, summary, partner, value, closing', all(k in kinds for k in ['pcover', 'line', 'ppartner', 'mult', 'bond']), kinds)
        ok('cover carries the partnership name and partner logo', await E(f"document.querySelector('.mks-pcover .px-name').textContent.includes(partnerName(D.partnerships.find(p=>p.id==='{pid}'))) && !!document.querySelector('.mks-pcover .px-plg')"))
        others = await E(f"partnerName(visiblePartnerships().find(p=>!p.isDraft && p.partnerId!==D.partnerships.find(x=>x.id==='{pid}').partnerId))")
        ok('only this partnership: no other partner in the deck', others not in await E("document.getElementById('mkDeck').innerText"), others)
        # تبديل الشراكة من القائمة
        other = await E(f"visiblePartnerships().filter(p=>!p.isDraft && p.id!=='{pid}')[0].id")
        await pg.select_option('#mkPick', other); await pg.wait_for_timeout(900)
        ok('switch partnership from the picker', await E(f"document.querySelector('.mks-pcover .px-name').textContent.includes(partnerName(D.partnerships.find(p=>p.id==='{other}')))"))
        # العودة لكل الشراكات
        await pg.click('[data-mkmode="all"]'); await pg.wait_for_timeout(900)
        ok('back to all partnerships', await E("MK.scope") != 'one' and await E("!!document.querySelector('.mks-seed')"))
        deck = await E("document.getElementById('mkDeck').innerText")
        ok('plain titles: no figurative phrases', not any(w in deck for w in ['نهر', 'لا يتوقف', 'بذرة', 'كوكبة', 'حلقات تتسع', 'الأفضل لم', 'قد تكون أنت', 'تكفي', 'مرآة']))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
