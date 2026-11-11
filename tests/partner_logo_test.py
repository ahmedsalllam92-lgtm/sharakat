import asyncio, json, os
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
LOGO=os.environ.get('LOGO','/home/claude/shots/testlogo.png')
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    if not os.path.exists(LOGO):
        from PIL import Image, ImageDraw
        os.makedirs(os.path.dirname(LOGO), exist_ok=True)
        im=Image.new('RGBA',(400,200),(0,0,0,0)); d=ImageDraw.Draw(im); d.rounded_rectangle((10,10,390,190),30,fill=(15,68,51,255)); d.ellipse((40,50,140,150),fill=(217,180,103,255)); im.save(LOGO)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width':1440,'height':900})).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('console: '+m.text) if m.type=='error' else None)
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        E=pg.evaluate
        async def go(h, w=1300): await E(f"location.hash={json.dumps(h)}"); await pg.wait_for_timeout(w)
        pid = await E("D.partnerships.find(p=>p.title==='المديرية العامة لحرس الحدود').id")
        prid = await E(f"D.partnerships.find(p=>p.id==='{pid}').partnerId")
        await go(f'#/partnerships/{pid}')
        ok('upload control on the header plate', await E("!!document.querySelector('.dhead .plate-ed [data-logoup]')"))
        await pg.set_input_files('.dhead [data-logoup]', LOGO); await pg.wait_for_timeout(1200)
        ok('logo saved on the partner', await E(f"!!partnerById('{prid}').logoFileId"))
        ok('logo shows in partnership header', await E("!!document.querySelector('.dhead .plate img') && document.querySelector('.dhead .plate img').src.startsWith('blob:')"))
        ok('upload is logged', await E(f"D.audit.some(a=>a.entityId==='{prid}' && a.details==='رفع شعار الجهة')"))
        await go('#/partnerships'); await pg.click('[data-view="table"]'); await pg.wait_for_timeout(400)
        ok('register row shows logo', await E(f"[...document.querySelectorAll('#regBody tr')].some(tr=>tr.dataset.row==='{pid}' && tr.querySelector('.plate img'))"))
        await go('#/partners')
        ok('partners list shows logo', await E("document.querySelectorAll('#main .plate img').length>=1"))
        await go(f'#/partners/{prid}')
        ok('partner page header shows logo + change control', await E("!!document.querySelector('.ph .plate img') && !!document.querySelector('.ph [data-logoup]')"))
        await go('#/dashboard?v=obs', 2200)
        ok('dashboard partner map shows logo', await E(f"[...document.querySelectorAll('.mz3-p')].some(t=>t.getAttribute('href')==='#/partnerships/{pid}' && t.querySelector('img.lg'))"))
        await E("applyDesign('board')"); await pg.wait_for_timeout(700)
        await go('#/', 1800)
        ok('board home «شركاؤنا» wall shows logo', await E("document.querySelectorAll('#main .plate img').length>=1"))
        await go('#/dashboard?v=brief', 2000)
        ok('board briefing network shows logo', await E("[...document.querySelectorAll('.bo-orb .orb-n img')].some(i=>(i.getAttribute('src')||'').startsWith('blob:') || (i.getAttribute('src')||'').startsWith('data:'))"))
        # dossier cover
        await go(f'#/partnerships/{pid}')
        await pg.click('[data-dossier]'); await pg.wait_for_timeout(300); await pg.click('[data-dosgo]')
        await pg.wait_for_function("!document.querySelector('[data-dsprint]').disabled", timeout=60000)
        ok('dossier cover shows logo', await E("!!document.querySelector('#dossier .ds-cv-lg img')"))
        await pg.click('[data-dsclose]'); await pg.wait_for_timeout(300)
        # remove
        await pg.hover('.dhead .plate-ed'); await pg.click('.dhead [data-logox]'); await pg.wait_for_timeout(300)
        await pg.click('.modal [data-ok]'); await pg.wait_for_timeout(900)
        ok('logo can be removed', await E(f"!partnerById('{prid}').logoFileId") and await E("!document.querySelector('.dhead .plate img')"))
        # viewer cannot upload
        await E("switchRole('viewer')"); await pg.wait_for_timeout(500); await go(f'#/partnerships/{pid}')
        ok('viewer has no upload control', await E("!document.querySelector('[data-logoup]')"))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
