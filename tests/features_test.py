import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1440,'height':900})
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)+' '+str(getattr(e,'stack',''))[:300]))
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(500)
        E=pg.evaluate
        async def go(h): await E(f"location.hash={json.dumps(h)}"); await pg.wait_for_timeout(400)
        # global search
        await pg.fill('#gq', 'حرس'); await pg.wait_for_timeout(400)
        ok('global search finds partnership', 'حرس الحدود' in await pg.inner_text('.gs-res'))
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(400)
        ok('enter opens result', '/partnerships/' in await E('location.hash'))
        # import note confirm
        await pg.click('[data-confirmnote="0"]'); await pg.wait_for_timeout(400)
        ok('import note confirmed', await E("D.partnerships.find(p=>p.importNotes.length).importNotes[0].confirmed"))
        # register empty search
        await go('#/partnerships'); await pg.fill('#regQ', 'كلمةغيرموجودة'); await pg.wait_for_timeout(400)
        ok('empty search state', 'لا توجد نتائج' in await pg.inner_text('#regBody'))
        await pg.click('[data-reset]'); await pg.wait_for_timeout(200)
        ok('reset clears', 'شراكة' in await pg.inner_text('#regCount'))
        await pg.fill('#regQ', 'الاعمال'); await pg.wait_for_timeout(400)
        ok('search ignores hamza (الاعمال→الأعمال)', await E("App.lastRegList.length") > 0, await E("App.lastRegList.length"))
        # filters linked + url
        await go('#/partnerships?sector=خاص&status=active|soon')
        n = await E("App.lastRegList.length"); ok('url filters applied', n>0 and all(await E("App.lastRegList.map(p=>pSector(p)==='خاص')")), n)
        # story modal
        await go('#/'); await pg.click('.story-lead'); await pg.wait_for_timeout(300)
        ok('story modal opens', await E("!!document.querySelector('.story-modal')"))
        await pg.keyboard.press('Escape')
        await pg.click('[data-spotgo]:nth-child(2)'); await pg.wait_for_timeout(300)
        ok('spotlight switches', 'وقف الأمير' in await pg.inner_text('#spotBox'))
        # home settings: hide news, move featured
        await go('#/settings/home')
        await pg.click('.order-i:has-text("آخر المستجدات") .switch i'); await pg.wait_for_timeout(300)
        await pg.click('[data-secmv^="share:-1"]'); await pg.wait_for_timeout(300)
        await go('#/'); 
        ok('news section hidden on home', await E("!document.querySelector('.news')"))
        await go('#/settings/home'); await pg.click('.order-i:has-text("آخر المستجدات") .switch i'); await pg.wait_for_timeout(300)
        # lists rename propagation
        await go('#/settings/lists')
        await pg.fill('[data-ren="classifications:0"]', 'مذكرة تعاون مشترك'); await pg.press('[data-ren="classifications:0"]', 'Tab'); await pg.wait_for_timeout(500)
        ok('rename propagates to records', await E("D.partnerships.filter(p=>p.classification==='مذكرة تعاون مشترك').length") >= 3 and await E("D.partnerships.filter(p=>p.classification==='مذكرة تعاون').length") == 0)
        await pg.click('[data-del="classifications:0"]'); await pg.wait_for_timeout(300)
        ok('used value cannot be deleted', await E("L('classifications').includes('مذكرة تعاون مشترك')"))
        await pg.fill('[data-ren="classifications:0"]', 'مذكرة تعاون'); await pg.press('[data-ren="classifications:0"]', 'Tab'); await pg.wait_for_timeout(400)
        # partners: add exact duplicate blocked, merge
        await go('#/partners'); await pg.click('[data-addp]'); await pg.fill('#pn', 'جمعية عيني لإعادة تدوير النفايات'); await pg.wait_for_timeout(300)
        ok('similar shown in partner dialog', 'جهات مشابهة' in await pg.inner_text('#psim'))
        await pg.click('.modal [data-ok]'); await pg.wait_for_timeout(300)
        ok('exact duplicate blocked', await E("D.partners.filter(x=>normAr(x.name)===normAr('جمعية عيني لاعادة تدوير النفايات')).length") == 1)
        await pg.fill('#pn', 'جمعية عيني لتدوير النفايات'); await pg.click('.modal [data-ok]'); await pg.wait_for_timeout(400)
        dup = await E("D.partners.find(x=>x.name==='جمعية عيني لتدوير النفايات').id")
        ok('near-duplicate pair flagged', 'قد تكون مكررة' in await pg.inner_text('#dupBox'))
        await pg.click(f'#dupBox [data-merge]'); await pg.wait_for_timeout(300)
        await pg.click('.modal [data-ok]'); await pg.wait_for_timeout(500)
        ok('merge removes duplicate & keeps alias', await E(f"!partnerById('{dup}')") and await E("D.partners.some(x=>(x.aliases||[]).includes('جمعية عيني لتدوير النفايات') || (x.aliases||[]).includes('جمعية عيني لاعادة تدوير النفايات'))"))
        # content: add news
        await go('#/content?tab=news'); await pg.click('[data-add]'); await pg.fill('#nt', 'ورشة تعريفية بخدمة شارك'); await pg.click('.modal [data-ok]'); await pg.wait_for_timeout(400)
        ok('news added', await E("D.news.some(n=>n.title==='ورشة تعريفية بخدمة شارك' && !n.demo)"))
        await go('#/'); ok('news on home', 'ورشة تعريفية' in await pg.inner_text('.news'))
        # reject + reopen
        await go('#/proposals?status=submitted'); await pg.click('#ibody tr[data-prop]'); await pg.wait_for_timeout(300)
        pid = await E("location.hash.split('/')[2]")
        await pg.click('[data-act="rejected"]'); await pg.fill('#dlgIn', 'خارج نطاق الشراكات.'); await pg.click('.modal [data-ok]'); await pg.wait_for_timeout(400)
        ok('rejected with reason', await E(f"D.proposals.find(x=>x.id==='{pid}').status") == 'rejected')
        await pg.click('[data-act="review"]'); await pg.wait_for_timeout(300)
        ok('reopened', await E(f"D.proposals.find(x=>x.id==='{pid}').status") == 'review')
        # audit log
        await go('#/settings/audit'); ok('audit lists actions', await E("document.querySelectorAll('#alist tr').length") > 5)
        # dept draft visibility: draft by dept not visible to team
        ok('team inbox hides dept drafts', await E("!visibleProposals().filter(x=>x.status==='draft').some(x=>propVisibleToMe(x))"))
        # present mode
        await go('#/'); await pg.click('[data-present]'); await pg.wait_for_timeout(300)
        ok('present mode hides chrome', await E("getComputedStyle(document.querySelector('.side')).display==='none'"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        # storage fallback: simulate memory mode banner
        p2 = await ctx.new_page(); await p2.add_init_script("Object.defineProperty(window,'indexedDB',{value:undefined})")
        await p2.goto(URL); await p2.wait_for_selector('#main .page'); await p2.wait_for_timeout(600)
        ok('memory fallback with warning', await p2.evaluate("Store.mode")=='memory' and 'الحفظ المحلي غير متاح' in await p2.inner_text('#warn'))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
