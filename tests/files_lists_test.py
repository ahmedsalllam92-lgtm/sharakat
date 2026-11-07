import asyncio, json, os
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1440,'height':900}, accept_downloads=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)+' '+str(getattr(e,'stack',''))[:300]))
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        E=pg.evaluate
        async def go(h): await E(f"location.hash={json.dumps(h)}"); await pg.wait_for_timeout(500)
        # real photos
        bg = await E("D.partnerships.find(p=>p.title==='المديرية العامة لحرس الحدود')")
        wq = await E("D.partnerships.find(p=>p.title==='وقف الأمير صيته بنت عبدالعزيز')")
        ok('border guard real photo as cover + photo', bg['coverFileId']=='asset:border-guard-signing' and any(a['fileId']=='asset:border-guard-signing' and a['category']=='صور الشراكة' for a in bg['attachments']))
        ok('waqf real photo as cover + photo', wq['coverFileId']=='asset:waqf-saitah-signing')
        ok('real photos appear in home gallery', await E("fieldPhotos().filter(x=>x.fileId.startsWith('asset:')).length") == 2)
        await go(f"#/partnerships/{bg['id']}")
        ok('no illustrative label on real photo', await E("!document.querySelector('.dhead .illus')"))
        # upload PDF to الاتفاقية
        open('/tmp/agreement.pdf','wb').write(b'%PDF-1.4\n%test agreement\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')
        await pg.set_input_files('[data-fup="الاتفاقية"]', '/tmp/agreement.pdf'); await pg.wait_for_timeout(700)
        ok('PDF uploaded into الاتفاقية', await E(f"D.partnerships.find(p=>p.id==='{bg['id']}').attachments.some(a=>a.category==='الاتفاقية' && a.name==='agreement.pdf')"))
        ok('shown in category card', 'agreement.pdf' in await pg.inner_text('.fcat[data-fcat="الاتفاقية"]'))
        await E("window.__opened=[]; window.__open0=window.open; window.open=(u)=>{window.__opened.push(u); return {}}; 0")
        await pg.click('.fcat[data-fcat="الاتفاقية"] [data-viewf]'); await pg.wait_for_timeout(400)
        ok('view opens file in new tab (blob URL)', await E("(window.__opened[0]||'').startsWith('blob:')"))
        await E("window.open=window.__open0; 0")
        async with pg.expect_download() as dl:
            await pg.click('.fcat[data-fcat="الاتفاقية"] [data-dl]')
        ok('download works', (await dl.value).suggested_filename == 'agreement.pdf')
        # report via drag & drop
        await E("""(()=>{const dt=new DataTransfer(); dt.items.add(new File(['report body'],'تقرير-الربع-الثالث.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})); const t=document.querySelector('.fcat[data-fcat="تقرير الشراكة العام"]'); t.dispatchEvent(new DragEvent('dragover',{dataTransfer:dt,bubbles:true,cancelable:true})); t.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));})()""")
        await pg.wait_for_timeout(700)
        ok('drag & drop upload into report category', await E(f"D.partnerships.find(p=>p.id==='{bg['id']}').attachments.some(a=>a.category==='تقرير الشراكة العام' && a.name==='تقرير-الربع-الثالث.docx')"))
        # non-image into photos rejected
        await pg.set_input_files('[data-fup="صور الشراكة"]', '/tmp/agreement.pdf'); await pg.wait_for_timeout(500)
        ok('non-image rejected from photos', await E(f"!D.partnerships.find(p=>p.id==='{bg['id']}').attachments.some(a=>a.category==='صور الشراكة' && a.name==='agreement.pdf')"))
        # image upload replaces illustrative cover
        from PIL import Image; Image.new('RGB',(800,500),(30,90,70)).save('/tmp/site.jpg')
        rid = await E("D.partnerships.find(p=>p.title.startsWith('جمعية عيني')).id")
        await go(f'#/partnerships/{rid}')
        before = await E(f"D.partnerships.find(p=>p.id==='{rid}').coverFileId")
        await pg.set_input_files('[data-fup="صور الشراكة"]', '/tmp/site.jpg'); await pg.wait_for_timeout(800)
        after = await E(f"D.partnerships.find(p=>p.id==='{rid}').coverFileId")
        ok('real upload replaces illustrative cover', before.startswith('lib:') and not after.startswith('lib:'), (before, after))
        # delete file
        await go(f"#/partnerships/{bg['id']}")
        fid = await E(f"D.partnerships.find(p=>p.id==='{bg['id']}').attachments.find(a=>a.name==='agreement.pdf').fileId")
        await pg.click('.fcat[data-fcat="الاتفاقية"] [data-delatt]'); await pg.click('.modal [data-ok]'); await pg.wait_for_timeout(600)
        ok('file deleted from record', await E(f"!D.partnerships.find(p=>p.id==='{bg['id']}').attachments.some(a=>a.name==='agreement.pdf')"))
        ok('blob removed from storage', await E(f"(async()=>!(await Store.getFile('{fid}')))()"))
        # inline-add category inside partnership A
        await go(f"#/partnerships/{bg['id']}/edit")
        await pg.click('[data-cb="categories"] input'); await pg.keyboard.type('حماية المناطق الحدودية'); await pg.wait_for_timeout(200)
        await pg.click('.cb-pop [data-addv]'); await pg.wait_for_timeout(400)
        ok('new category added to list immediately', await E("L('categories').includes('حماية المناطق الحدودية')"))
        await pg.click('[data-save="final"]'); await pg.wait_for_timeout(700)
        ok('category saved on partnership', await E(f"D.partnerships.find(p=>p.id==='{bg['id']}').categories.includes('حماية المناطق الحدودية')"))
        ok('category shown in detail header', 'حماية المناطق الحدودية' in await pg.inner_text('.dhead'))
        # available in partnership B
        await go(f'#/partnerships/{rid}/edit'); await pg.click('[data-cb="categories"] input'); await pg.wait_for_timeout(200)
        ok('available in another partnership', 'حماية المناطق الحدودية' in await pg.inner_text('.cb-pop'))
        await pg.keyboard.press('Escape')
        # duplicate with spelling variant not offered as new
        await pg.fill('[data-cb="categories"] input', 'حمايه المناطق الحدوديه'); await pg.wait_for_timeout(200)
        ok('spelling variant not added as duplicate', await E("!document.querySelector('.cb-pop [data-addv]')"))
        await pg.keyboard.press('Escape')
        # inline add memo classification
        await pg.click('[data-cb="classification"] input'); await pg.fill('[data-cb="classification"] input', 'اتفاقية شراكة'); await pg.wait_for_timeout(200)
        await pg.click('.cb-pop [data-addv]'); await pg.wait_for_timeout(400)
        ok('memo classification inline add → lists', await E("L('classifications').includes('اتفاقية شراكة')"))
        await pg.click('[data-save="final"]'); await pg.wait_for_timeout(600)
        # lists page
        await go('#/settings/lists')
        lt = await pg.inner_text('#list-categories')
        vals = await E("[...document.querySelectorAll('#list-categories input[data-ren]')].map(i=>i.value)")
        ok('lists page shows value with its source', 'حماية المناطق الحدودية' in vals and 'أُضيفت من الشراكة PT-' in lt, lt[:120])
        ok('lists nav item active', await E("document.querySelector('.nav-a[href=\"#/settings/lists\"]').classList.contains('on') && !document.querySelector('.nav-a[href=\"#/settings\"]').classList.contains('on')"))
        idx = await E("L('categories').indexOf('حماية المناطق الحدودية')")
        await pg.click(f'[data-del="categories:{idx}"]'); await pg.wait_for_timeout(300)
        ok('used category cannot be deleted', await E("L('categories').includes('حماية المناطق الحدودية')"))
        await pg.fill(f'[data-ren="categories:{idx}"]', 'تأمين المناطق الحدودية'); await pg.press(f'[data-ren="categories:{idx}"]', 'Tab'); await pg.wait_for_timeout(500)
        ok('rename propagates to partnership', await E(f"D.partnerships.find(p=>p.id==='{bg['id']}').categories.includes('تأمين المناطق الحدودية')"))
        ok('meta follows rename', await E("!!(D.settings.listMeta.categories||{})['تأمين المناطق الحدودية']"))
        # register filter + dashboard
        await go('#/partnerships?category=' + 'تأمين المناطق الحدودية')
        ok('register filters by category', await E("App.lastRegList.length") == 1)
        await go('#/dashboard?v=alt'); await pg.wait_for_timeout(1300)
        await pg.click('[data-tmdim="category"]'); await pg.wait_for_timeout(700)
        ok('dashboard category panel', 'تأمين المناطق الحدودية' in await pg.inner_text('.dz3-deep:not(.dv)'))
        # team can add inline but no lists page
        await E("switchRole('team','الإدارة العامة للمشاريع','وعد')"); await pg.wait_for_timeout(500)
        ok('team: lists nav hidden', await E("!document.querySelector('.nav-a[href=\"#/settings/lists\"]')"))
        await go(f'#/partnerships/{rid}/edit'); await pg.click('[data-cb="categories"] input'); await pg.keyboard.type('تقنيات الري'); await pg.wait_for_timeout(200)
        ok('team: inline add offered', await E("!!document.querySelector('.cb-pop [data-addv]')"))
        await pg.keyboard.press('Escape'); await E("App.dirty=false; switchRole('admin')"); await pg.wait_for_timeout(400)
        # excel includes category column
        async with pg.expect_download() as dl:
            await go('#/partnerships'); await pg.click('[data-xls]')
        d = await dl.value; await d.save_as('/tmp/exp.xlsx')
        import openpyxl; ws = openpyxl.load_workbook('/tmp/exp.xlsx').active
        hdr = [c.value for c in ws[2]]
        ok('excel has تصنيف الشراكة column', 'تصنيف الشراكة' in hdr)
        # migration from v3
        await E("""(async()=>{ D.settings.schema=3; delete D.settings.lists.categories; D.settings.lists.attachmentCats=D.settings.lists.attachmentCats.map(c=>c==='الاتفاقية'?'وثيقة المذكرة':c); const p=D.partnerships.find(x=>x.title==='وقف الأمير صيته بنت عبدالعزيز'); p.coverFileId='lib:afforest'; p.attachments=[{id:'a1',fileId:'lib:palms',name:'x',type:'image/jpeg',size:1,category:'وثيقة المذكرة'}]; D.partnerships.forEach(x=>delete x.categories); await Repo.saveSettings(); await Store.putMany('partnerships',D.partnerships); })()""")
        await pg.reload(); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        m = await E("(()=>{const p=D.partnerships.find(x=>x.title==='وقف الأمير صيته بنت عبدالعزيز'); return {schema:D.settings.schema, cats:L('categories').length, ac:L('attachmentCats').includes('الاتفاقية') && !L('attachmentCats').includes('وثيقة المذكرة'), cover:p.coverFileId, renamed:p.attachments.some(a=>a.category==='الاتفاقية'), realAtt:p.attachments.some(a=>a.fileId==='asset:waqf-saitah-signing')}})()")
        ok('migration v3→v4', m['schema']>=4 and m['cats']>0 and m['ac'] and m['cover']=='asset:waqf-saitah-signing' and m['renamed'] and m['realAtt'], m)
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
