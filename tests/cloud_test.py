"""المنصة المشتركة: يتطلب Postgres محليًا عليه supabase/schema.sql وكلمات المرور الأولية، وخادمًا يحاكي PostgREST.
المتغيرات: SHK_TEST_PW (ملف كلمات المرور)، SHK_CLOUD_URL، SHK_CLOUD_KEY، SHK_PG (مسار مقبس Postgres)، SHK_PG_PORT."""
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
    cur = c.cursor(); cur.execute(q, a); r = cur.fetchall() if cur.description else None; c.close(); return r
FORCE = f"localStorage.setItem('shk_auth_force','1');localStorage.setItem('shk_cloud_force','1');localStorage.setItem('shk_cloud_url','{CURL}');localStorage.setItem('shk_cloud_key','{CKEY}')"
async def main():
    sql('truncate shk_records, shk_files, shk_sessions, shk_login_fails'); sql("delete from shk_accounts where id <> 'sysadmin'")
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        async def device():
            ctx = await b.new_context(viewport={'width': 1366, 'height': 860}); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e))); return ctx, pg
        async def login(pg, acc, pw, wait=1200):
            await pg.wait_for_selector('#shkLogin #lgPw')
            await pg.select_option('#lgAcc', acc); await pg.fill('#lgPw', pw); await pg.click('#shkLogin .lg-go'); await pg.wait_for_timeout(wait)
        # ===== الجهاز A: بيانات قديمة محفوظة محليًا قبل الربط =====
        ctxA, A = await device()
        await A.goto(URL); await A.wait_for_timeout(900)
        await A.evaluate("(async()=>{const p=D.partnerships[0]; p.title='شراكة محفوظة قبل الربط'; await Repo.save('partnerships', p);})()"); await A.wait_for_timeout(300)
        old_id = await A.evaluate("D.partnerships[0].id")
        await A.evaluate(FORCE); await A.reload(); await A.wait_for_timeout(900)
        ok('cloud mode: login screen first, no data shown', await A.evaluate("Cloud.on && !!document.getElementById('shkLogin') && !document.querySelector('#main .page')"))
        ok('separate local cache database for the shared platform', await A.evaluate("Store.dbName") == 'sharakat-platform-cloud')
        await login(A, 'admin', 'wrong', 700)
        ok('wrong password rejected by the server', await A.evaluate("document.getElementById('lgErr').textContent.includes('غير صحيحة')"))
        await login(A, 'admin', PW['admin'], 900)
        ok('empty server: partnerships is asked to initialise it', await A.evaluate("!!document.querySelector('.modal') && document.querySelector('.modal').textContent.includes('تهيئة المنصة المشتركة')"))
        await A.click('.modal [data-ok]'); await A.wait_for_timeout(2500)
        n_srv = sql("select count(*) from shk_records where not deleted")[0][0]
        n_loc = await A.evaluate("D.partners.length+D.partnerships.length+D.proposals.length+D.achievements.length+D.news.length+D.audit.length+1")
        ok('all data uploaded to the server', n_srv >= n_loc - 1 and n_srv > 20, f'{n_srv} vs {n_loc}')
        t = sql("select data->>'title' from shk_records where col='partnerships' and id=%s", old_id)
        ok('old browser data (pre-link) became the shared starting point', t and t[0][0] == 'شراكة محفوظة قبل الربط')
        st = sql("select data from shk_records where col='settings' and id='main'")[0][0]
        ok('session and local password hashes are never uploaded', 'session' not in st and 'auth' not in st)
        ok('app running, synced badge shown', await A.evaluate("!!document.querySelector('#main .page') && document.querySelector('#topbar [data-cloud]').dataset.cloud==='ok'"))
        # ===== الجهاز B: إدارة على جهاز آخر =====
        dept = await A.evaluate("wfAccounts().find(a=>a.role==='dept').id")
        ctxB, B = await device()
        await B.goto(URL); await B.evaluate(FORCE); await B.reload(); await B.wait_for_timeout(1200)
        ok('login list comes from the server settings', await B.evaluate(f"[...document.querySelectorAll('#lgAcc option')].some(o=>o.value==={json.dumps(dept)})"))
        await login(B, dept, PW['dept'], 1800)
        ok('department on another device sees the shared data', await B.evaluate(f"!!document.querySelector('#main .page') && (D.partnerships.find(p=>p.id==='{old_id}')||{{}}).title==='شراكة محفوظة قبل الربط'"))
        ok('department session applied', await B.evaluate("Session.role()") == 'dept')
        # تعديل من B يظهر في A
        await B.evaluate(f"(async()=>{{const p=D.partnerships.find(x=>x.id==='{old_id}'); p.title='عُدّلت من جهاز الإدارة'; await Repo.save('partnerships', p);}})()"); await B.wait_for_timeout(1200)
        await A.evaluate("cloudTick()"); await A.wait_for_timeout(1200)
        ok("another account's edit reaches this device", await A.evaluate(f"D.partnerships.find(p=>p.id==='{old_id}').title") == 'عُدّلت من جهاز الإدارة')
        # تعديلان متزامنان على الإعدادات من جهازين: يُدمجان
        await A.evaluate("Cloud.stop(); Cloud.ready=true; D.settings.alertDays=45; Repo.saveSettings()")
        await B.evaluate("Cloud.stop(); Cloud.ready=true; notify([{grp:'partnerships'}],{t:'اختبار دمج',b:'من الإدارة'})")
        await A.wait_for_timeout(1500); await B.wait_for_timeout(1500)
        await A.evaluate("cloudTick()"); await B.evaluate("cloudTick()"); await A.wait_for_timeout(1500)
        st = sql("select data from shk_records where col='settings' and id='main'")[0][0]
        ok('concurrent settings edits from two devices are merged', st.get('alertDays') == 45 and any(n.get('t') == 'اختبار دمج' for n in st.get('notifs', [])), (st.get('alertDays'), len(st.get('notifs', []))))
        ok('both devices converge on the merged settings', await A.evaluate("D.settings.alertDays===45 && D.settings.notifs.some(n=>n.t==='اختبار دمج')") and await B.evaluate("D.settings.alertDays===45"))
        ok('each device keeps its own session', await A.evaluate("Session.role()") == 'admin' and await B.evaluate("Session.role()") == 'dept')
        # حذف
        nid = await A.evaluate("D.news[0] && D.news[0].id")
        if nid:
            await A.evaluate(f"Repo.remove('news','{nid}')"); await A.wait_for_timeout(1200); await B.evaluate("cloudTick()"); await B.wait_for_timeout(900)
            ok('deletes propagate', await B.evaluate(f"!D.news.some(x=>x.id==='{nid}')"))
        # المرفقات
        fid = await A.evaluate("saveUpload(new File([new Uint8Array([137,80,78,71,1,2,3,4])],'صورة.png',{type:'image/png'})).then(r=>r.id)"); await A.wait_for_timeout(1500)
        ok('attachment uploaded', sql("select count(*) from shk_files where id=%s", fid)[0][0] == 1)
        got = await B.evaluate(f"Store.getFile('{fid}').then(f=>f? f.name+'|'+f.size : null)")
        ok('another device downloads the attachment on demand', got == 'صورة.png|8', got)
        # انقطاع الاتصال: التعديلات تبقى في الصادر ثم تُرفع
        await A.evaluate("Cloud._u=Cloud.url; Cloud.url='http://127.0.0.1:9'")
        await A.evaluate(f"(async()=>{{const p=D.partnerships.find(x=>x.id==='{old_id}'); p.title='تعديل أثناء الانقطاع'; await Repo.save('partnerships', p);}})()"); await A.wait_for_timeout(1200)
        ok('offline: change kept in outbox, badge shows offline', await A.evaluate("Cloud.pending()>0 && document.querySelector('#topbar [data-cloud]').dataset.cloud==='off'"))
        await A.evaluate("Cloud.url=Cloud._u; cloudTick()"); await A.wait_for_timeout(1500)
        ok('back online: outbox flushed', await A.evaluate("Cloud.pending()") == 0 and sql("select data->>'title' from shk_records where col='partnerships' and id=%s", old_id)[0][0] == 'تعديل أثناء الانقطاع')
        # كلمات المرور
        r = await A.evaluate("Cloud.rpc('shk_set_password',{p_token:Cloud.token(),p_target:'sysadmin',p_new:'hack1234'}).then(()=>'changed').catch(e=>e.code)")
        ok('system admin password cannot be changed, even via the API', r == 'protected', r)
        await A.evaluate("location.hash='#/settings/roles'"); await A.wait_for_timeout(1500)
        ok('accounts panel shows server password status', await A.evaluate(f"(()=>{{const r=document.querySelector('[data-pwrow=\"{dept}\"]'); return !!r && r.textContent.includes('افتراضية')}})()"))
        await A.click(f'[data-pwset="{dept}"]'); await A.wait_for_selector('#pwNew')
        await A.fill('#pwNew', 'legal99'); await A.fill('#pwNew2', 'legal99'); await A.click('.modal [data-ok]'); await A.wait_for_timeout(900)
        h = sql("select pw_hash from shk_accounts where id=%s", dept)
        ok('partnerships sets a department password (bcrypt on the server)', h and h[0][0].startswith('$2') and 'legal99' not in json.dumps(sql("select data from shk_records")))
        await B.evaluate("cloudTick()"); await B.wait_for_timeout(1200)
        ok("changing a password ends that account's other sessions", await B.evaluate("!!document.getElementById('shkLogin')"))
        await login(B, dept, PW['dept'], 900)
        ok('old password no longer works', await B.evaluate("document.getElementById('lgErr').textContent.includes('غير صحيحة')"))
        await login(B, dept, 'legal99', 1800)
        ok('new password works', await B.evaluate("!document.getElementById('shkLogin') && !!document.querySelector('#main .page')"))
        # تغيير كلمة المرور الذاتي يتطلب الحالية
        r = await B.evaluate(f"authSetPassword({json.dumps(dept)},'zz9999',undefined,'wrong').then(()=>'ok').catch(e=>e.message)")
        ok('self password change needs the current password', 'الحالية' in r, r)
        r = await B.evaluate("Cloud.rpc('shk_set_password',{p_token:Cloud.token(),p_target:'admin',p_new:'hack1234'}).then(()=>'changed').catch(e=>e.code)")
        ok("a department cannot change another account's password", r == 'forbidden', r)
        # حساب الاطلاع لا يكتب
        await B.evaluate("authLogout()"); await B.wait_for_timeout(800)
        await login(B, 'viewer', PW['viewer'], 1800)
        r = await B.evaluate("Cloud.rpc('shk_push',{p_token:Cloud.token(),p_rows:[{col:'news',id:'x',data:{}}]}).then(()=>'written').catch(e=>e.code)")
        ok('viewer account is read-only on the server', r == 'forbidden', r)
        # الحماية المباشرة
        r = await B.evaluate("Cloud.rpc('shk_pull',{p_token:'forged',p_since:0}).then(()=>'read').catch(e=>e.code)")
        ok('forged token rejected', r == 'invalid_token', r)
        await B.wait_for_timeout(300)
        # القفل بعد محاولات خاطئة
        await B.evaluate("authLogout()"); await B.wait_for_timeout(600)
        for i in range(5): await login(B, 'viewer', 'bad' + str(i), 500)
        await login(B, 'viewer', PW['viewer'], 700)
        ok('account locked after 5 wrong attempts', await B.evaluate("document.getElementById('lgErr').textContent.includes('مقفل')"))
        sql('truncate shk_login_fails')
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
