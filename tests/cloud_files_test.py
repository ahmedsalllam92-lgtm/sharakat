"""مرفقات المنصة المشتركة: ملفات حتى 50 ميجا على أجزاء، ضغط الصور، ضغط المستندات بلا فقد، الحذف، المساحة، النسخة الاحتياطية.
نفس متطلبات cloud_test.py (Postgres محلي + خادم يحاكي PostgREST)."""
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
HASH = "async (id)=>{const f=await Store.getFile(id); if(!f) return null; const d=await crypto.subtle.digest('SHA-256', await f.blob.arrayBuffer()); return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')+'|'+f.blob.size+'|'+f.name}"
async def main():
    sql('truncate shk_records, shk_files, shk_file_chunks, shk_sessions, shk_login_fails'); sql("delete from shk_accounts where id <> 'sysadmin'")
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        async def device():
            ctx = await b.new_context(viewport={'width': 1366, 'height': 860}); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e))); return pg
        async def login(pg, acc, pw, wait=1500):
            await pg.wait_for_selector('#shkLogin #lgPw'); await pg.fill('#lgUser', await pg.evaluate("(id)=>accUser(authAccounts().find(a=>a.id===id))", acc)); await pg.fill('#lgPw', pw); await pg.click('#shkLogin .lg-go'); await pg.wait_for_timeout(wait)
        A = await device(); await A.goto(URL); await A.evaluate(FORCE); await A.reload(); await A.wait_for_timeout(900)
        await login(A, 'admin', PW['admin'], 900); await A.click('.modal [data-ok]'); await A.wait_for_timeout(2500)
        ok('platform initialised', await A.evaluate("Cloud.ready && Cloud.pending()===0"))
        # ملف كبير غير قابل للضغط (عقد ممسوح ضوئيًا مثلًا) 30 ميجا
        big = await A.evaluate("""(async()=>{const n=30*1024*1024, u=new Uint8Array(n); for(let i=0;i<n;i+=65536) crypto.getRandomValues(u.subarray(i,Math.min(n,i+65536)));
            const r=await saveUpload(new File([u],'عقد-موقّع.pdf',{type:'application/pdf'})); return r.id})()""")
        await A.wait_for_function("Cloud.fout.length===0 && !Cloud.busy", timeout=120000)
        ch = sql("select count(*), sum(length(data)) from shk_file_chunks where id=%s", big)[0]
        ok('30 MB contract uploaded in chunks', ch[0] == 8 and sql("select (meta->>'chunks')::int from shk_files where id=%s", big)[0][0] == 8, ch)
        hA = await A.evaluate(f"({HASH})('{big}')")
        r = await A.evaluate("saveUpload(new File([new Uint8Array(51*1024*1024)],'كبير.pdf',{type:'application/pdf'})).then(()=>'saved').catch(e=>e.message)")
        ok('files over 50 MB are refused with a clear message', '50' in r, r)
        # مستند نصي قابل للضغط: يُضغط بلا فقد ويعود مطابقًا
        doc = await A.evaluate("""(async()=>{const t='بند التعاون الأول: يلتزم الطرفان بتنفيذ البرنامج وفق الخطة المعتمدة. '.repeat(60000); const r=await saveUpload(new File([t],'مسودة-اتفاقية.txt',{type:'text/plain'})); return r.id})()""")
        await A.wait_for_function("Cloud.fout.length===0 && !Cloud.busy", timeout=60000)
        meta = sql("select meta from shk_files where id=%s", doc)[0][0]
        stored = sql("select sum(length(data)) from shk_file_chunks where id=%s", doc)[0][0]
        ok('documents compressed losslessly for transfer and storage', meta.get('gz') is True and stored < meta['size'] * 0.2, (stored, meta['size']))
        hDocA = await A.evaluate(f"({HASH})('{doc}')")
        # ضغط الصور
        img = await A.evaluate("""(async()=>{const c=document.createElement('canvas'); c.width=4000; c.height=3000; const x=c.getContext('2d');
            const g=x.createLinearGradient(0,0,4000,3000); g.addColorStop(0,'#0b5'); g.addColorStop(1,'#fc3'); x.fillStyle=g; x.fillRect(0,0,4000,3000);
            for(let i=0;i<4000;i++){x.fillStyle=`hsl(${i%360},60%,50%)`; x.fillRect(Math.random()*4000,Math.random()*3000,30,30);}
            const blob=await new Promise(r=>c.toBlob(r,'image/png')); const r=await saveUpload(new File([blob],'زيارة-ميدانية.png',{type:'image/png'}));
            const bm=await createImageBitmap(r.blob); return {orig:blob.size,size:r.size,type:r.type,name:r.name,w:bm.width,h:bm.height}})()""")
        ok('large photo compressed on upload (≤2560 px, JPEG)', img['type'] == 'image/jpeg' and img['size'] < img['orig'] * 0.5 and max(img['w'], img['h']) == 2560 and img['name'].endswith('.jpg'), img)
        logo = await A.evaluate("""(async()=>{const c=document.createElement('canvas'); c.width=2400; c.height=1400; const x=c.getContext('2d');
            for(let i=0;i<3000;i++){x.fillStyle=`hsla(${i%360},70%,45%,.9)`; x.beginPath(); x.arc(Math.random()*2400,Math.random()*1400,18,0,7); x.fill();}
            const blob=await new Promise(r=>c.toBlob(r,'image/png')); const r=await saveUpload(new File([blob],'شعار.png',{type:'image/png'})); return {orig:blob.size,size:r.size,type:r.type}})()""")
        ok('transparent images stay transparent (WebP) when compressed', logo['type'] in ('image/webp', 'image/png') and (logo['type'] == 'image/png' or logo['size'] < logo['orig']), logo)
        small = await A.evaluate("saveUpload(new File([new Uint8Array(1000)],'صغير.png',{type:'image/png'})).then(r=>r.size)")
        ok('small images untouched', small == 1000)
        await A.wait_for_function("Cloud.fout.length===0 && !Cloud.busy", timeout=60000)
        # جهاز آخر يحمّل الملفات ويطابقها
        B = await device(); await B.goto(URL); await B.evaluate(FORCE); await B.reload(); await B.wait_for_timeout(900)
        await login(B, 'viewer', PW['viewer'], 1800)
        hB = await B.evaluate(f"({HASH})('{big}')")
        ok('another device downloads the 30 MB file identical byte-for-byte', hB and hB == hA, (hA or '')[:20])
        ok('compressed document arrives identical to the original', await B.evaluate(f"({HASH})('{doc}')") == hDocA)
        # المساحة في الإعدادات
        await A.evaluate("location.hash='#/settings/data'"); await A.wait_for_timeout(1500)
        ok('settings show storage used of the free 500 MB', await A.evaluate("!!document.querySelector('#dUsage .cl-bar') && document.getElementById('dUsage').textContent.includes('500')"))
        # النسخة الاحتياطية تكمل المرفقات غير المحمّلة
        C = await device(); await C.goto(URL); await C.evaluate(FORCE); await C.reload(); await C.wait_for_timeout(900)
        await login(C, 'admin', PW['admin'], 1800)
        n0 = await C.evaluate("Store.allFiles().then(f=>f.length)")
        await C.evaluate("exportBackup()"); await C.wait_for_timeout(8000)
        n1 = await C.evaluate("Store.allFiles().then(f=>f.length)")
        ok('backup on a fresh device first fetches every attachment from the server', n1 >= n0 + 5, (n0, n1))
        # الحذف يحرر المساحة
        await A.evaluate(f"Store.delFile('{big}')"); await A.wait_for_timeout(1200)
        ok('deleting an unused attachment frees it on the server', sql("select count(*) from shk_file_chunks where id=%s", big)[0][0] == 0 and sql("select count(*) from shk_files where id=%s", big)[0][0] == 0)
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print('SUMMARY', sum(R), '/', len(R))
asyncio.run(main())
