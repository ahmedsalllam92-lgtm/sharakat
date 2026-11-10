"""روابط الاطلاع المؤقتة: إنشاء من الإعدادات، فتح بلا كلمة مرور، اطلاع فقط على الأقسام المختارة بشكل القائمة العلوية، إيقاف وانتهاء.
يتطلب ما يتطلبه cloud_test.py (Postgres محلي عليه supabase/schema.sql وخادم يحاكي PostgREST)."""
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
    sql('truncate shk_records, shk_files, shk_sessions, shk_login_fails, shk_shares'); sql("delete from shk_accounts where id <> 'sysadmin'")
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        errs = []
        async def device():
            ctx = await b.new_context(viewport={'width': 1366, 'height': 860}); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e))); return ctx, pg
        # ===== إدارة الشراكات تهيئ المنصة وتنشئ رابطًا =====
        ctxA, A = await device()
        await A.goto(URL); await A.evaluate(CFG); await A.reload(); await A.wait_for_selector('#shkLogin #lgPw')
        await A.fill('#lgUser', await A.evaluate("accUser(authAccounts().find(a=>a.id==='admin'))")); await A.fill('#lgPw', PW['admin']); await A.click('#shkLogin .lg-go'); await A.wait_for_timeout(1000)
        if await A.evaluate("!!document.querySelector('.modal [data-ok]')"): await A.click('.modal [data-ok]'); await A.wait_for_timeout(2500)
        await A.evaluate("location.hash='#/settings/share'"); await A.wait_for_timeout(1500)
        ok('settings has the «روابط الاطلاع» tab for partnerships admin', await A.evaluate("!!document.querySelector('.sh-new') && [...document.querySelectorAll('.set-nav a')].some(a=>a.textContent.includes('روابط الاطلاع'))"))
        await A.fill('#shLabel', 'وفد تجريبي')
        await A.click('[data-shdur="3"]'); await A.wait_for_timeout(200)
        await A.click('[data-shsec="reports"]'); await A.wait_for_timeout(200)   # إلغاء التقارير
        await A.click('[data-shmake]'); await A.wait_for_timeout(1500)
        link = await A.evaluate("(document.querySelector('#shUrl')||{}).value||''")
        ok('link created and shown once', '?view=' in link, link[-20:])
        row = sql("select label, sections, expires_at > now() + interval '2 days', expires_at < now() + interval '4 days', token_hash <> '' from shk_shares")
        ok('server stores label, sections, expiry (3 days) and only a hash', row and row[0][0] == 'وفد تجريبي' and 'reports' not in row[0][1] and 'home' in row[0][1] and row[0][2] and row[0][3] and row[0][4], row)
        tok = link.split('?view=')[1]
        ok('the raw link is not stored on the server', not sql("select 1 from shk_shares where token_hash = %s", tok))
        ok('links list shows it as active', await A.evaluate("document.querySelectorAll('.sh-tbl tbody tr').length===1 && document.querySelector('.sh-tbl .chip.ok')!==null"))
        # ===== الضيف يفتح الرابط بلا كلمة مرور =====
        ctxG, G = await device()
        await G.goto(URL); await G.evaluate(CFG.replace("localStorage.setItem('shk_auth_force','1');", "localStorage.setItem('shk_auth_force','1');"))
        await G.goto(URL + '?view=' + tok); await G.wait_for_timeout(3500)
        ok('guest enters with no login screen', await G.evaluate("!document.getElementById('shkLogin') && !!document.querySelector('#main .page')"))
        ok('token removed from the address bar', await G.evaluate("!location.search.includes('view=')"))
        ok('share mode, viewer session, top-menu look', await G.evaluate("!!App.share && document.documentElement.classList.contains('share-mode') && design()==='board' && Session.role()==='viewer'"))
        ok('read-only: no edit/create/export permissions', await G.evaluate("!can('edit.partnership') && !can('manage.content') && !can('proposal.create') && !can('export') && !can('manage.accounts')"))
        ok('contacts hidden (not selected)', await G.evaluate("!can('view.contacts')"))
        nav = await G.evaluate("[...document.querySelectorAll('#topbar a.nav-a')].map(a=>a.getAttribute('href'))")
        ok('menu shows only the chosen sections', '#/reports' not in nav and '#/settings' not in nav and '#/tasks' not in nav and '#/share' not in nav and '#/partnerships' in nav, nav)
        await G.evaluate("location.hash='#/reports'"); await G.wait_for_timeout(900)
        ok('a hidden section redirects away', await G.evaluate("location.hash") != '#/reports')
        await G.evaluate("location.hash='#/settings'"); await G.wait_for_timeout(900)
        ok('settings not reachable', not (await G.evaluate("location.hash")).startswith('#/settings'))
        pid = await G.evaluate("D.partnerships.find(p=>!p.isDraft).id")
        await G.evaluate(f"location.hash='#/partnerships/{pid}'"); await G.wait_for_timeout(1500)
        ok('partnership page opens without edit buttons', await G.evaluate("!!document.querySelector('.dhead') && !document.querySelector('.dhead a[href$=\"/edit\"], [data-del], [data-gstar]')"))
        ok('share bar with expiry and end button', await G.evaluate("!!document.querySelector('#shareBar [data-shareend]') && document.querySelector('#shareBar').textContent.includes('وضع الاطلاع')"))
        ok('account and tour tools hidden', await G.evaluate("[...document.querySelectorAll('.rolebox, .tour-top')].every(e=>!e.offsetParent)"))
        # الخادم يرفض أي تعديل من جلسة الرابط
        res = await G.evaluate("Cloud.rpc('shk_push',{p_token:Cloud.token(),p_rows:[{col:'partners',id:'x',data:{name:'x'}}]}).then(()=>'ok').catch(e=>e.code)")
        ok('server rejects writes from the link session', res == 'forbidden', res)
        ok('server counted the open', sql("select opens from shk_shares")[0][0] == 1)
        # ===== الإيقاف =====
        await A.evaluate("location.hash='#/settings/share'"); await A.wait_for_timeout(1500)
        await A.click('[data-shrevoke]'); await A.wait_for_timeout(400); await A.click('.modal [data-ok]'); await A.wait_for_timeout(1500)
        ok('revoked on the server and its sessions closed', sql("select revoked from shk_shares")[0][0] and not sql("select 1 from shk_sessions where account_id like 'share:%%'"))
        await G.evaluate("cloudTick()"); await G.wait_for_timeout(2000)
        ok('guest session ends with a clear message', await G.evaluate("!!document.querySelector('.share-screen') && !document.querySelector('#main .page')"))
        ctxH, H = await device()
        await H.goto(URL); await H.evaluate(CFG); await H.goto(URL + '?view=' + tok); await H.wait_for_timeout(2500)
        ok('revoked link cannot be reopened', await H.evaluate("(document.querySelector('.share-screen h1')||{}).textContent||''") == 'أُوقف رابط الاطلاع')
        # ===== الانتهاء =====
        await A.evaluate("location.hash='#/settings/share'"); await A.wait_for_timeout(1200)
        await A.click('[data-shmake]'); await A.wait_for_timeout(1500)
        tok2 = (await A.evaluate("document.querySelector('#shUrl').value")).split('?view=')[1]
        sql("update shk_shares set expires_at = now() - interval '1 minute' where not revoked")
        ctxE, E = await device()
        await E.goto(URL); await E.evaluate(CFG); await E.goto(URL + '?view=' + tok2); await E.wait_for_timeout(2500)
        ok('expired link shows «انتهت مدة رابط الاطلاع»', await E.evaluate("(document.querySelector('.share-screen h1')||{}).textContent||''") == 'انتهت مدة رابط الاطلاع')
        ok('admin session unaffected', await A.evaluate("!App.share && can('manage.accounts')"))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
