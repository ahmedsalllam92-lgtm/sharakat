"""بوابة الشريك: رابط خاص لكل شراكة، يرى الشريك شراكته ويرسل تقارير وصورًا تصل لإدارة الشراكات.
يتطلب ما يتطلبه cloud_test.py (Postgres محلي عليه supabase/schema.sql + partner_portal.sql وخادم يحاكي PostgREST)."""
import asyncio, json, os
import psycopg2
PW = json.load(open(os.environ['SHK_TEST_PW']))
CURL = os.environ.get('SHK_CLOUD_URL', 'http://127.0.0.1:54400'); CKEY = os.environ.get('SHK_CLOUD_KEY', 'sb_publishable_test')
from playwright.async_api import async_playwright
URL = 'file:///home/claude/shots/app.html'
R = []
def ok(n, c, x=''): R.append(bool(c)); print('PASS' if c else 'FAIL', n, x, flush=True)
def sql(q, *a):
    c = psycopg2.connect(host=os.environ['SHK_PG'], port=int(os.environ.get('SHK_PG_PORT', 54329)), user='postgres', dbname='postgres'); c.autocommit = True
    cur = c.cursor(); cur.execute(q, a or None); r = cur.fetchall() if cur.description else None; c.close(); return r
CFG = f"localStorage.setItem('shk_auth_force','1');localStorage.setItem('shk_cloud_force','1');localStorage.setItem('shk_cloud_url','{CURL}');localStorage.setItem('shk_cloud_key','{CKEY}')"
async def main():
    sql('truncate shk_records, shk_files, shk_sessions, shk_login_fails, shk_portals'); sql("delete from shk_accounts where id <> 'sysadmin'")
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        errs = []
        async def device():
            ctx = await b.new_context(viewport={'width': 1366, 'height': 900}); pg = await ctx.new_page(); pg.set_default_timeout(15000)
            pg.on('pageerror', lambda e: errs.append(str(e))); return ctx, pg
        _, A = await device()
        await A.goto(URL); await A.evaluate(CFG); await A.reload(); await A.wait_for_selector('#shkLogin #lgPw')
        await A.fill('#lgUser', await A.evaluate("accUser(authAccounts().find(a=>a.id==='admin'))")); await A.fill('#lgPw', PW['admin']); await A.click('#shkLogin .lg-go'); await A.wait_for_timeout(1200)
        if await A.evaluate("!!document.querySelector('.modal [data-ok]')"): await A.click('.modal [data-ok]'); await A.wait_for_timeout(2500)
        await A.evaluate("Cloud.kick && Cloud.kick()"); await A.wait_for_timeout(3000)
        pid = await A.evaluate("(D.partnerships.find(p=>p.stage==='signed'&&!p.isDraft&&p.endDate&&p.outputs)||D.partnerships.find(p=>!p.isDraft)).id")
        await A.evaluate(f"(async()=>{{const p=D.partnerships.find(x=>x.id==='{pid}'); p.notes='ملاحظة داخلية سرية للاختبار'; p.meetings=[{{id:'mt1',date:isoDate(addDays(today(),10)),time:'10:00',title:'اجتماع مراجعة المخرجات',place:'مقر المؤسسة'}}]; await Repo.save('partnerships',p); Cloud.kick(); }})()")
        await A.wait_for_timeout(2500)
        await A.evaluate(f"location.hash='#/partnerships/{pid}'"); await A.wait_for_timeout(1800)
        ok('partnership page has the «بوابة الشريك» section', await A.evaluate("!!document.querySelector('#portal [data-ptmake]')"))
        await A.click('#portal [data-ptmake]'); await A.wait_for_timeout(1800)
        url = await A.evaluate("(document.querySelector('#ptlUrl')||{}).value||''")
        ok('portal link created and shown once', '?portal=' in url)
        key = url.split('?portal=')[1]
        ok('only a hash of the link is stored', sql("select count(*) from shk_portals")[0][0] == 1 and not sql("select 1 from shk_portals where token_hash=%s", key))
        ok('link listed with its validity', await A.evaluate("document.querySelectorAll('#ptlList .ptl-it').length") == 1)
        # الشريك
        _, X = await device()
        await X.goto(URL); await X.evaluate(CFG); await X.goto(URL + '?portal=' + key); await X.wait_for_timeout(2600)
        ok('portal opens with no login', await X.evaluate("!!document.querySelector('.pt-hero') && !document.getElementById('shkLogin')"))
        txt = await X.evaluate("document.body.innerText")
        ok('shows the partnership, term and upcoming meeting', 'اجتماع مراجعة المخرجات' in txt and ('متبقٍ' in txt or 'انتهت' in txt or 'تنتهي' in txt))
        ok('internal notes are not exposed', 'ملاحظة داخلية سرية' not in txt and 'سرية' not in json.dumps(await X.evaluate(f"Cloud.rpc('shk_portal_view',{{p_key:'{key}'}})"), ensure_ascii=False))
        await X.click('#ptGo'); await X.wait_for_timeout(300)
        ok('empty submission is blocked', await X.evaluate("document.querySelector('.pt-form .ext-f.bad')!==null"))
        await X.fill('#ptTxt', 'نُفّذت زراعة 500 شتلة في الموقع الأول بتاريخ اليوم'); await X.fill('#ptBy', 'م. خالد — منسق المشروع')
        await X.set_input_files('#ptFiles input[type=file]', files=[{'name': 'تقرير-الإنجاز.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4 report'}])
        await X.click('#ptGo'); await X.wait_for_timeout(3000)
        ok('partner sees the sent report as received', await X.evaluate("!!document.querySelector('.pt-reps li') && document.querySelector('.pt-reps').textContent.includes('بانتظار الاطلاع')"))
        row = sql("select jsonb_array_length(data->'partnerReports'), data->'partnerReports'->0->>'by', (select count(*) from jsonb_array_elements(data->'attachments') a where a->>'category'='تقارير الشريك') from shk_records where col='partnerships' and id=%s", pid)[0]
        ok('server stored the report and attached the file to the partnership', row == (1, 'م. خالد — منسق المشروع', 1), row)
        ok('notification sent to partnerships', 'من الشريك' in (sql("select data->'notifs'->0->>'t' from shk_records where col='settings' and id='main'")[0][0] or ''))
        # الإدارة تراجع وترد
        await A.evaluate("cloudTick()"); await A.wait_for_timeout(2200)
        await A.evaluate(f"location.hash='#/'; setTimeout(()=>location.hash='#/partnerships/{pid}',300)"); await A.wait_for_timeout(2000)
        ok('admin sees the new report in the section', await A.evaluate("!!document.querySelector('#portal .ptl-rep.new')"))
        await A.fill('#portal [data-reply]', 'شكرًا لكم، تم الاطلاع ونرجو إرفاق صور الموقع')
        await A.click('#portal [data-seen]'); await A.wait_for_timeout(1500); await A.evaluate("Cloud.kick && Cloud.kick()"); await A.wait_for_timeout(2500)
        await X.reload(); await X.wait_for_timeout(2500)
        t2 = await X.evaluate("document.querySelector('.pt-reps').textContent")
        ok('partner sees «reviewed» and the reply', 'اطّلعت عليه الإدارة' in t2 and 'نرجو إرفاق صور الموقع' in t2)
        # الإيقاف
        await A.click('#portal [data-ptrev]'); await A.wait_for_timeout(300); await A.click('.modal [data-ok]'); await A.wait_for_timeout(1500)
        await X.reload(); await X.wait_for_timeout(2200)
        ok('revoked link shows a clear message', 'أُوقف رابط البوابة' in await X.evaluate("document.body.textContent"))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
