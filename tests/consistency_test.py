import asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/shots/app.html'
R=[]
def ok(n,c,x=''): R.append(c); print('PASS' if c else 'FAIL', n, x, flush=True)
TRUTH = """(()=>{const nd=visiblePartnerships().filter(p=>!p.isDraft); const st=k=>nd.filter(p=>k.includes(pStatus(p))).length; const sg=nd.filter(p=>p.stage==='signed');
  return {act:st(['active','soon']), soon:st(['soon']), partners:new Set(nd.map(p=>p.partnerId)).size, outputs:sg.reduce((t,p)=>t+richItems(p.outputs).length,0),
    depts:new Set(sg.flatMap(p=>p.departments||[])).size, nd:nd.length, proc:visibleProposals().filter(x=>['submitted','review','info'].includes(x.status)).length,
    tasks:wfTasks().filter(t=>!t.follow).length, pipe:wfPipeline(nd).items.length}})()"""
INTEGRITY = """(async()=>{const bad=[]; const pIds=new Set(D.partners.map(x=>x.id)), ps=new Set(D.partnerships.map(x=>x.id)), pr=new Set(D.proposals.map(x=>x.id));
  D.partnerships.forEach(p=>{ if(!p.isDraft && !pIds.has(p.partnerId)) bad.push('partner:'+p.code); if(p.proposalId && (!pr.has(p.proposalId) || D.proposals.find(x=>x.id===p.proposalId).partnershipId!==p.id)) bad.push('prop:'+p.code); });
  D.proposals.forEach(x=>{ if(x.partnershipId && !ps.has(x.partnershipId)) bad.push('ps:'+x.ref); if(x.status==='converted' && !x.partnershipId) bad.push('conv:'+x.ref); });
  D.achievements.forEach(a=>{ if(a.partnershipId && !ps.has(a.partnershipId)) bad.push('ach:'+a.title); }); D.news.forEach(n=>{ if(n.partnershipId && !ps.has(n.partnershipId)) bad.push('news:'+n.title); });
  for (const p of D.partnerships) for (const a of (p.attachments||[])) if(!(await FileCache.url(a.fileId))) bad.push('file:'+p.code);
  return bad;})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width':1440,'height':900})).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_selector('#main .page'); await pg.wait_for_timeout(700)
        E=pg.evaluate
        async def go(h, w=1800):
            await E(f"location.hash={json.dumps(h)}"); await pg.wait_for_timeout(w)
            await E("document.querySelectorAll('.cu').forEach(c=>{if(c.dataset.v!==undefined) c.textContent=c.dataset.v})")
        num = lambda s: int(''.join(ch for ch in s if ch.isdigit()) or -1)
        ok('data integrity: every relation resolves', not await E(INTEGRITY))
        async def check_all(tag):
            T = await E(TRUTH)
            await E("applyDesign('classic')"); await pg.wait_for_timeout(500)
            await go('#/', 2600)  # العدّادات تتحرك حتى تبلغ قيمتها
            k = await E("Object.fromEntries([...document.querySelectorAll('.kpi')].map(k=>[k.querySelector('.l').textContent, k.querySelector('.v').textContent]))")
            ok(f'{tag} classic home: active/partners/outputs/depts', num(k.get('شراكة سارية','')) == T['act'] and num(k.get('جهة شريكة','')) == T['partners'] and num(k.get('مخرجًا مستهدفًا','')) == T['outputs'] and num(k.get('إدارة تتقاطع مع الشراكات','')) == T['depts'], (k, T))
            nav = await E("(()=>{const a=document.querySelector('.side .nav-a[href=\"#/tasks\"]'); const c=a&&a.querySelector('.cnt,.badge,.nb'); return c?+c.textContent:0})()")
            ok(f'{tag} nav tasks badge = waiting tasks', nav == T['tasks'], (nav, T['tasks']))
            await go('#/tasks', 1000)
            ok(f'{tag} tasks page summary = badge', num(await E("(document.querySelector('.tk-sum b')||{textContent:'0'}).textContent")) == T['tasks'] or T['tasks'] == 0)
            await go('#/dashboard?v=obs', 2400)
            tiles = await E("Object.fromEntries([...document.querySelectorAll('.ob-t')].map(t=>[t.querySelector('.ob-tl').textContent.trim(), t.querySelector('.ob-tv').textContent.trim()]))")
            soonKey = [x for x in tiles if x.startswith('تنتهي خلال')][0]
            ok(f'{tag} rings dashboard: core, active, soon, pipeline, partners', num(await E("document.querySelector('.ob-cn').textContent")) == T['act'] and num(tiles['سارية الآن']) == T['act'] and num(tiles[soonKey]) == T['soon'] and num(tiles['في المسار المعتمد']) == T['pipe'] and num(tiles['الجهات الشريكة']) == T['partners'], (tiles, T))
            ok(f'{tag} rings dashboard scope excludes drafts', num(await E("document.querySelector('.dz2-scope b').textContent")) == T['nd'])
            await go('#/dashboard?v=classic', 2400)
            cells = await E("Object.fromEntries([...document.querySelectorAll('.dz3-cell')].map(t=>[t.querySelector('.dz3-cl').textContent.trim(), t.querySelector('.dz3-cv').textContent.trim()]))")
            sk = [x for x in cells if x.startswith('تنتهي خلال')][0]
            ok(f'{tag} detailed dashboard: active, soon, partners, proposals', num(cells['الشراكات السارية']) == T['act'] and num(cells[sk]) == T['soon'] and num(cells['الجهات الشريكة']) == T['partners'] and num(cells['مقترحات قيد المعالجة']) == T['proc'], (cells, T))
            await E("applyDesign('board')"); await pg.wait_for_timeout(600)
            await go('#/', 2200)
            figs = await E("Object.fromEntries([...document.querySelectorAll('.bo-fig')].map(f=>[f.querySelector('.bo-fig-l').textContent, f.querySelector('b').textContent]))")
            ok(f'{tag} board home figures', num(figs['شراكة سارية']) == T['act'] and num(figs['جهة شريكة']) == T['partners'] and num(figs['مخرجًا مستهدفًا']) == T['outputs'] and num(figs['إدارة متقاطعة']) == T['depts'], (figs, T))
            await go('#/dashboard?v=brief', 2400)
            kp = await E("[...document.querySelectorAll('.bo-kpi')].map(k=>k.innerText)")
            ok(f'{tag} board briefing KPIs', any(x.startswith('شراكة سارية') and num(x.split('\\n')[1] if '\\n' in x else x.split(' ')[2]) == T['act'] for x in kp) or any(('شراكة سارية' in x and str(T['act']) in x) for x in kp), kp[:2])
            ok(f'{tag} briefing scope excludes drafts', (await E("document.querySelector('#boScope').textContent")).startswith(f"{T['nd']} من"))
            await go('#/partnerships', 1500)
            strip = await E("Object.fromEntries([...document.querySelectorAll('.bo-sst')].map(b=>{const t=b.innerText.split('\\n'); return [t.slice(1).join(' ').trim()||t[0], +t[0]]}))")
            ok(f'{tag} register strip: active + soon = active KPI', (strip.get('سارية',0) + strip.get('تنتهي قريبًا',0)) == T['act'], strip)
            await E("applyDesign('classic')"); await pg.wait_for_timeout(500)
            return T
        T0 = await check_all('before')
        # — تغيير البيانات: تقريب انتهاء شراكة سارية، وإضافة شراكة جديدة لجهة جديدة
        await E("""(async()=>{ const p=visiblePartnerships().find(x=>pStatus(x)==='active'); p.endDate=isoDate(addDays(today(),20)); await Repo.save('partnerships',p);
          const pr={id:uid('pr'),name:'جهة اختبار الاتساق',sector:'خاص',aliases:[],createdAt:nowISO()}; await Repo.save('partners',pr);
          const np={id:uid('ps'),partnerId:pr.id,title:'شراكة اختبار',code:'PT-TEST-1',stage:'signed',startDate:isoDate(addDays(today(),-10)),endDate:isoDate(addDays(today(),400)),outputs:'1. مخرج أول\\n2. مخرج ثانٍ',departments:['الإدارة العامة للمشاريع'],owners:[],categories:[],attachments:[],createdAt:nowISO()}; await Repo.save('partnerships',np); })()""")
        T1 = await check_all('after edit')
        ok('changes propagate: soon +1, partners +1, outputs +2', T1['soon'] == T0['soon'] + 1 and T1['partners'] == T0['partners'] + 1 and T1['outputs'] == T0['outputs'] + 2 and T1['act'] == T0['act'] + 1, (T0, T1))
        ok('data integrity after edits', not await E(INTEGRITY))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
