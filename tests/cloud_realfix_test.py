"""إصلاح سجلات ملف الحصر الناقصة على الخادم: تُضاف الناقصة فقط بعد السحب، ولا يُعدَّل سجل قائم.
المتغيرات مثل cloud_test: SHK_TEST_PW، SHK_CLOUD_URL، SHK_CLOUD_KEY، SHK_PG، SHK_PG_PORT."""
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
FORCE = f"localStorage.setItem('shk_auth_force','1');localStorage.setItem('shk_cloud_force','1');localStorage.setItem('shk_cloud_url','{CURL}');localStorage.setItem('shk_cloud_key','{CKEY}')"
async def main():
    sql('truncate shk_records, shk_files, shk_sessions, shk_login_fails'); sql("delete from shk_accounts where id <> 'sysadmin'")
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        async def device():
            ctx = await b.new_context(viewport={'width': 1366, 'height': 860}); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e))); return ctx, pg
        async def login(pg, acc, pw, wait=2500):
            await pg.wait_for_selector('#shkLogin #lgPw')
            await pg.fill('#lgUser', await pg.evaluate("(id)=>accUser(authAccounts().find(a=>a.id===id))", acc)); await pg.fill('#lgPw', pw); await pg.click('#shkLogin .lg-go'); await pg.wait_for_timeout(wait)
        # الجهاز A يهيّئ الخادم
        ctxA, A = await device(); await A.goto(URL); await A.wait_for_timeout(600)
        await A.evaluate(FORCE); await A.reload(); await A.wait_for_timeout(900)
        await login(A, 'admin', PW['admin'], 1200)
        await A.click('.modal [data-ok]'); await A.wait_for_timeout(4000)
        print('A local file records', await A.evaluate("D.partnerships.filter(p=>String(p.id).startsWith('pt-r2-')).length"), 'pending', await A.evaluate("Object.keys(Cloud.out||{}).length"), 'realV', await A.evaluate("D.settings.realV"))
        await A.evaluate("Cloud.flush()"); await A.wait_for_timeout(3000)
        full = sql("select count(*) from shk_records where col='partnerships' and not deleted and id like 'pt-r2-%'")[0][0]
        ok('server initialized with the file records', full > 40, full)
        # محاكاة الخلل: سجلات الملف لم تصل إلى الخادم، والإعدادات تقول إنها طُبّقت
        keep = 'pt-r2-42'
        sql("update shk_records set data = jsonb_set(data, '{title}', '\"عنوان عدّلته الإدارة\"') where col='partnerships' and id=%s", keep)
        sql("delete from shk_records where col='partnerships' and id like 'pt-r2-%%' and id <> %s", keep)
        sql("update shk_records set data = data - 'realFix1', rev = (select max(rev)+1 from shk_records) where col='settings' and id='main'")
        left = sql("select count(*) from shk_records where col='partnerships' and not deleted and id like 'pt-r2-%'")[0][0]
        ok('broken state reproduced (only one file record left on the server)', left == 1, left)
        # جهاز جديد يدخل: تُستكمل الناقصة وتُرفع
        ctxB, B = await device(); await B.goto(URL); await B.wait_for_timeout(600)
        await B.evaluate(FORCE); await B.reload(); await B.wait_for_timeout(900)
        await login(B, 'admin', PW['admin'], 4000)
        await B.wait_for_timeout(3000)
        local = await B.evaluate("D.partnerships.filter(p=>!p.demo && String(p.id).startsWith('pt-r2-')).length")
        ok('device restores the missing file records', local == full, (local, full))
        await B.evaluate("Cloud.flush && Cloud.flush()"); await B.wait_for_timeout(2500)
        srv = sql("select count(*) from shk_records where col='partnerships' and not deleted and id like 'pt-r2-%'")[0][0]
        ok('restored records are pushed to the server', srv == full, (srv, full))
        t = sql("select data->>'title' from shk_records where col='partnerships' and id=%s", keep)[0][0]
        ok('an existing record is not overwritten', t == 'عنوان عدّلته الإدارة', t)
        flag = sql("select data->>'realFix1' from shk_records where col='settings' and id='main'")[0][0]
        ok('repair runs once (flag saved on the server)', flag == 'true', flag)
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
