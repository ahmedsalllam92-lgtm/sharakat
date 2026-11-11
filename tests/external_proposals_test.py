"""مقترحات الجهات الخارجية: رابط دعوة، نموذج بلا حساب، وصول المقترح للمقترحات الواردة، متابعة الحالة والرد.
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
    sql('truncate shk_records, shk_files, shk_sessions, shk_login_fails, shk_invites, shk_ext_tracks'); sql("delete from shk_accounts where id <> 'sysadmin'")
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        errs = []
        async def device():
            ctx = await b.new_context(viewport={'width': 1366, 'height': 860}); pg = await ctx.new_page(); pg.set_default_timeout(15000)
            pg.on('pageerror', lambda e: errs.append(str(e))); return ctx, pg
        ctxA, A = await device()
        await A.goto(URL); await A.evaluate(CFG); await A.reload(); await A.wait_for_selector('#shkLogin #lgPw')
        await A.fill('#lgUser', await A.evaluate("accUser(authAccounts().find(a=>a.id==='admin'))")); await A.fill('#lgPw', PW['admin']); await A.click('#shkLogin .lg-go'); await A.wait_for_timeout(1200)
        if await A.evaluate("!!document.querySelector('.modal [data-ok]')"): await A.click('.modal [data-ok]'); await A.wait_for_timeout(2500)
        await A.evaluate("location.hash='#/settings/external'"); await A.wait_for_timeout(1500)
        ok('settings tab «مقترحات الجهات الخارجية»', await A.evaluate("!!document.querySelector('[data-exmake]')"))
        await A.fill('#exLabel', 'شركة الاختبار الخارجية'); await A.click('[data-exmake]'); await A.wait_for_timeout(1500)
        link = await A.evaluate("(document.querySelector('#exUrl')||{}).value||''")
        ok('invite link created', '?propose=' in link)
        tok = link.split('?propose=')[1]
        ok('only a hash of the link is stored', not sql("select 1 from shk_invites where token_hash=%s", tok) and sql("select count(*) from shk_invites")[0][0] == 1)
        # الجهة الخارجية
        ctxE, X = await device()
        await X.goto(URL); await X.evaluate(CFG); await X.goto(URL + '?propose=' + tok); await X.wait_for_timeout(2500)
        ok('external form opens with no login', await X.evaluate("!!document.querySelector('.ext-form') && !document.getElementById('shkLogin')"))
        ok('partner name prefilled from the invite', await X.evaluate("document.querySelector('[data-k=partnerName]').value") == 'شركة الاختبار الخارجية')
        await X.click('.ext-form [type=submit]'); await X.wait_for_timeout(400)
        ok('required fields validated', await X.evaluate("document.querySelectorAll('.ext-f.bad').length") >= 2)
        await X.fill('[data-k=requesterName]', 'سارة العتيبي'); await X.fill('[data-k=requesterEmail]', 'sara@example.com')
        await X.fill('[data-k=targets]', 'حملات تشجير مشتركة\nبرامج توعية'); await X.fill('[data-k=addedValue]', 'زيادة الغطاء النباتي')
        await X.set_input_files('#exFiles input[type=file]', files=[{'name': 'نبذة.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4 test'}])
        await X.wait_for_timeout(300)
        ok('file chosen in the external form', await X.evaluate("document.querySelectorAll('#exFiles .ext-flist li').length") == 1)
        await X.click('.ext-form [type=submit]'); await X.wait_for_timeout(2500)
        ok('submitted: reference + tracking link shown', await X.evaluate("!!document.querySelector('.ext-link input') && document.querySelector('.ext-card').textContent.includes('EXT-')"))
        track = (await X.evaluate("document.querySelector('.ext-link input').value")).split('?track=')[1]
        row = sql("select data->>'status', data->>'department', data->>'partnerName', data->>'external' from shk_records where col='proposals' and data->>'external'='true'")
        ok('proposal stored as submitted external proposal', row and row[0] == ('submitted', 'جهة خارجية', 'شركة الاختبار الخارجية', 'true'), row)
        ok('uploaded file attached to the proposal', sql("select jsonb_array_length(data->'attachments'), data->'attachments'->0->>'name' from shk_records where col='proposals' and data->>'external'='true'")[0] == (1, 'نبذة.pdf'))
        ok('notification added for partnerships', 'جهة خارجية' in (sql("select data->'notifs'->0->>'t' from shk_records where col='settings' and id='main'")[0][0] or ''))
        ok('invite single-use consumed', sql("select uses from shk_invites")[0][0] == 1)
        ctxF, Y = await device()
        await Y.goto(URL); await Y.evaluate(CFG); await Y.goto(URL + '?propose=' + tok); await Y.wait_for_timeout(2000)
        ok('used invite cannot submit again', 'استُخدم' in await Y.evaluate("document.body.textContent"))
        # الإدارة ترى المقترح وترد
        await A.evaluate("cloudTick()"); await A.wait_for_timeout(1800)
        pid = await A.evaluate("(D.proposals.find(x=>x.external)||{}).id")
        ok('admin receives it in the proposals inbox', bool(pid))
        ok('notification shows in the admin bell', await A.evaluate("myNotifs().some(n=>n.t.includes('جهة خارجية'))"))
        await A.evaluate("location.hash='#/proposals'"); await A.wait_for_timeout(1200)
        ok('inbox marks it «جهة خارجية»', await A.evaluate("!!document.querySelector('.ext-chip')"))
        await A.evaluate(f"location.hash='#/proposals/{pid}'"); await A.wait_for_timeout(1200)
        ok('proposal page explains the external reply', await A.evaluate("!!document.querySelector('.ext-note')"))
        await A.click('[data-act=info]'); await A.wait_for_timeout(500)
        await A.fill('.modal textarea, .modal input', 'نرجو إرسال نبذة عن مشاريعكم السابقة'); await A.click('.modal [data-ok]'); await A.wait_for_timeout(2000)
        await A.evaluate("Cloud.kick && Cloud.kick()"); await A.wait_for_timeout(2500)
        # المتابعة
        await X.goto(URL + '?track=' + track); await X.wait_for_timeout(2500)
        txt = await X.evaluate("document.body.textContent")
        ok('tracking page shows status and the reply', 'مطلوب معلومات إضافية' in txt and 'نرجو إرسال نبذة' in txt, txt[:0])
        await X.screenshot(path='/tmp/claude-0/-home-user/f89444e8-a801-5e25-ad85-0de653cd9a60/scratchpad/ext-track.png', full_page=True) if os.path.isdir('/tmp/claude-0') else None
        ok('tracking page hides internal data', 'sara@example.com' not in txt)
        ok('reply box shown while info is requested', await X.evaluate("!!document.querySelector('#exReply')"))
        await X.fill('#exReplyT', 'مرفق ملف المشاريع السابقة')
        await X.set_input_files('#exReplyF input[type=file]', files=[{'name': 'مشاريع.png', 'mimeType': 'image/png', 'buffer': bytes.fromhex('89504e470d0a1a0a0000000d4948445200000001000000010806000000') + b'\x00'*20}])
        await X.click('#exReplyGo'); await X.wait_for_timeout(2500)
        ok('reply sent: status back to submitted, reply shown as theirs', await X.evaluate("!document.querySelector('#exReply') && !!document.querySelector('.ext-msgs li.mine')"))
        row = sql("select data->>'status', jsonb_array_length(data->'attachments') from shk_records where col='proposals' and data->>'external'='true'")[0]
        ok('server: proposal resubmitted with the new file', row == ('submitted', 2), row)
        await A.evaluate("cloudTick()"); await A.wait_for_timeout(2000)
        ok('admin gets the reply notification and the files', await A.evaluate(f"myNotifs().some(n=>n.t.includes('ردّت الجهة الخارجية')) && D.proposals.find(x=>x.id==='{pid}').attachments.length===2"))
        ok('tracking link cannot reply again after resubmission', 'closed' in json.dumps(sql("select shk_ext_reply(%s, 'x', '[]'::jsonb)", track)[0][0]))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
