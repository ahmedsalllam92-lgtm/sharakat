import asyncio, json, subprocess, os, zipfile
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
OUT='/home/claude/shots/dos'; os.makedirs(OUT, exist_ok=True)
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
def pdf_pages(f): return int([l for l in subprocess.run(['pdfinfo',f],capture_output=True,text=True).stdout.splitlines() if l.startswith('Pages')][0].split()[-1])
def pdf_size(f): return [l for l in subprocess.run(['pdfinfo',f],capture_output=True,text=True).stdout.splitlines() if l.startswith('Page size')][0]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        t = await (await b.new_context()).new_page()
        await t.set_content('<html dir="rtl"><body style="font-family:sans-serif;padding:40px"><h1>مذكرة تفاهم موقعة</h1><p>البند الأول</p><div style="page-break-after:always"></div><h1>صفحة التوقيعات</h1></body></html>')
        await t.pdf(path=OUT+'/mou.pdf', format='A4')
        open(OUT+'/notes.docx','wb').write(b'PK\x03\x04 docx')
        ctx = await b.new_context(viewport={'width':1440,'height':900}, accept_downloads=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('console: '+m.text) if m.type=='error' else None)
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(800)
        E=pg.evaluate
        async def go(h, w=1200): await E(f"location.hash={json.dumps(h)}"); await pg.wait_for_timeout(w)
        async def pdf(name):
            await E("window.dispatchEvent(new Event('beforeprint'))"); await pg.wait_for_timeout(200)
            await pg.emulate_media(media='print'); f=f'{OUT}/{name}.pdf'
            await pg.pdf(path=f, prefer_css_page_size=True, print_background=True)
            await pg.emulate_media(media='screen'); await E("window.dispatchEvent(new Event('afterprint'))"); return f
        # ===== الطباعة: السجل
        for d in ['classic','board']:
            await E(f"applyDesign('{d}')"); await pg.wait_for_timeout(600)
            await go('#/partnerships')
            await pg.emulate_media(media='print')
            hidden = await E("['#regSort','.reg-meta .seg'].every(s=>{const e=document.querySelector(s); return !e || getComputedStyle(e).display==='none'})")
            noscroll = await E("getComputedStyle(document.querySelector('#regBody .tbl-wrap')).overflowX==='visible'")
            nowrap = await E("getComputedStyle(document.querySelector('#regBody .tbl td .small')).whiteSpace==='nowrap'")
            await pg.emulate_media(media='screen')
            ok(f'{d}: register print hides sort & view controls', hidden)
            ok(f'{d}: register table prints without scrollbar', noscroll)
            ok(f'{d}: register dates do not wrap', nowrap)
            f = await pdf(f'reg-{d}')
            ok(f'{d}: register prints A4 landscape', '841.92 x 594.96' in pdf_size(f), pdf_size(f))
        # board: partnership title dark on paper, dashboard cover with TOC
        pid = await E("D.partnerships.find(p=>p.title==='المديرية العامة لحرس الحدود').id")
        await go(f'#/partnerships/{pid}')
        await pg.emulate_media(media='print')
        ok('board: partnership title is dark in print', await E("getComputedStyle(document.querySelector('.dhead h1')).color") == 'rgb(15, 68, 51)')
        await pg.emulate_media(media='screen')
        await go('#/dashboard?v=alt', 1500)
        await pg.emulate_media(media='print')
        ok('board: briefing cover lists the chapters in print', await E("getComputedStyle(document.querySelector('.bo-cover .bo-toc')).display==='grid' && document.querySelectorAll('.bo-cover .bo-toc a').length===8"))
        await pg.emulate_media(media='screen')
        await go('#/process', 1200)
        f = await pdf('process-board')
        ok('process map prints on 3 landscape pages', pdf_pages(f) <= 3, pdf_pages(f))
        # ===== لوحة المؤشرات: القيمة والأداء وسير الإجراءات
        await go('#/dashboard?v=alt', 1500)
        ok('board: 8 chapters incl. «سير الإجراءات»', await E("document.querySelectorAll('.bo-ch').length===8 && !!document.querySelector('.bo-ch[data-ch=proc] .pl')"))
        n_items = await E("wfPipeline(visiblePartnerships()).items.length")
        ok('pipeline lists requests and MoUs in progress', n_items > 0 and await E("document.querySelectorAll('.bo-ch[data-ch=proc] .pl-it').length") > 0, n_items)
        ok('pipeline items open the workflow step', await E("[...document.querySelectorAll('.bo-ch[data-ch=proc] .pl-it')].some(a=>a.getAttribute('href').includes('?wf=1'))"))
        await E("applyDesign('classic')"); await pg.wait_for_timeout(600); await go('#/dashboard?v=alt', 1500)
        ok('classic: value & performance section', await E("!!document.querySelector('.dv .dv-type') && !!document.querySelector('.dv .dv-dom') && !!document.querySelector('.dv .dv-ev') && !!document.querySelector('.dv .dv-fin') && !!document.querySelector('.dv .dv-pipe .pl')"))
        ok('classic: dashboard filters include type and domain', await E("!!document.querySelector('#dashF [data-dim=ptype], #dashF [data-fdim=ptype], #dashF [data-k=ptype]') || document.querySelector('#dashF').textContent.includes('مجال الجهة')"))
        n0 = await E("App.lastDashN || document.querySelector('.dz2-scope b').textContent")
        await pg.click('.dv-type .dv-split button[data-cf]'); await pg.wait_for_timeout(700)
        ok('classic: clicking a type cross-filters', (await E("App.dashF.ptype||[]")) != [] and await E("document.querySelector('.dz2-scope b').textContent") != n0)
        await E("for (const k of Object.keys(App.dashF)) delete App.dashF[k]"); await go('#/partnerships', 300)
        # ===== الملف الشامل
        await go(f'#/partnerships/{pid}')
        ok('facts strip under partnership header', await E("document.querySelectorAll('.pfacts .pfx').length>=4"))
        await pg.set_input_files('[data-fup="الاتفاقية"]', [OUT+'/mou.pdf', OUT+'/notes.docx']); await pg.wait_for_timeout(1200)
        await pg.click('[data-dossier]'); await pg.wait_for_timeout(400)
        ok('dossier options dialog', await E("document.querySelectorAll('.dos-opts input').length===14 && !document.querySelector('#dosPdf').disabled"))
        await pg.click('[data-dosgo]')
        await pg.wait_for_function("document.querySelector('[data-dsprint]') && !document.querySelector('[data-dsprint]').disabled", timeout=60000)
        ok('dossier preview ready', await E("!!document.querySelector('#dossier .ds-cover') && document.querySelectorAll('#dossier .ds-ch').length>=5"))
        ok('dossier embeds PDF pages as images', await E("document.querySelectorAll('#dossier .ds-att-pg').length") == 2)
        ok('dossier has workflow table, gallery and documents list', await E("!!document.querySelector('#ds-wf .ds-tbl') && document.querySelectorAll('#ds-photos .ds-gal img').length>0 && document.querySelector('#ds-docs').textContent.includes('notes.docx')"))
        ok('dossier TOC matches chapters', await E("document.querySelectorAll('.ds-toc li').length===document.querySelectorAll('#dossier .ds-ch').length"))
        await E("document.documentElement.classList.add('printing-dossier')")
        f = await pdf('dossier')
        await E("document.documentElement.classList.remove('printing-dossier')")
        txt = subprocess.run(['pdftotext',f,'-'],capture_output=True,text=True).stdout
        ok('dossier prints as A4 multi-page file', pdf_pages(f) >= 6 and 'A4' in pdf_size(f), (pdf_pages(f), pdf_size(f)))
        ok('printed dossier hides the app', 'سجل الشراكات' not in txt.split('\n')[0] and 'منظومة الشراكات' not in txt[:200])
        await pg.click('[data-dsclose]'); await pg.wait_for_timeout(300)
        ok('closing preview restores page', await E("!document.querySelector('#dossier') && !document.documentElement.classList.contains('dossier-open')"))
        # with forms: fill an evaluation partnership
        gp = await E("D.partnerships.find(p=>partnerName(p).includes('الأفق')).id")
        await go(f'#/partnerships/{gp}')
        await pg.click('[data-dossier]'); await pg.wait_for_timeout(300); await pg.click('[data-dosgo]')
        await pg.wait_for_function("document.querySelector('[data-dsprint]') && !document.querySelector('[data-dsprint]').disabled", timeout=60000)
        ok('dossier includes the official evaluation form', await E("document.querySelectorAll('#ds-evals .ds-form .fdoc').length>=1"))
        await pg.click('[data-dsclose]'); await pg.wait_for_timeout(300)
        # zip
        await go(f'#/partnerships/{pid}')
        await pg.click('[data-dossier]'); await pg.wait_for_timeout(300)
        async with pg.expect_download(timeout=60000) as dl:
            await pg.click('[data-doszip]')
        d = await dl.value; await d.save_as(OUT+'/pack.zip')
        names = zipfile.ZipFile(OUT+'/pack.zip').namelist()
        ok('ZIP pack has dossier HTML + original attachments', any(n.endswith('.html') for n in names) and any(n.endswith('mou.pdf') for n in names) and any(n.endswith('notes.docx') for n in names), names)
        await pg.keyboard.press('Escape')
        ok('audit logs dossier', await E(f"D.audit.some(a=>a.action==='partnership.dossier' && a.entityId==='{pid}')"))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
