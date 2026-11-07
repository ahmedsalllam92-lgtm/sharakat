#!/usr/bin/env python3
"""يجمع المصادر في ملف HTML واحد يعمل محليًا دون إنترنت (الخطوط مضمّنة)."""
import base64, glob, os, re
ROOT = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(ROOT, 'node_modules/@fontsource/ibm-plex-sans-arabic/files')
AR = "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"
LAT = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
faces = []
for w in (300, 400, 500, 600, 700):
    for sub, rng in (('arabic', AR), ('latin', LAT)):
        b = open(f'{FONT_DIR}/ibm-plex-sans-arabic-{sub}-{w}-normal.woff2', 'rb').read()
        faces.append(f"@font-face{{font-family:'IBM Plex Sans Arabic';font-style:normal;font-display:swap;font-weight:{w};src:url(data:font/woff2;base64,{base64.b64encode(b).decode()}) format('woff2');unicode-range:{rng}}}")
EXTRA_FONTS = [
    ('IBM Plex Mono', 'ibm-plex-mono', [500, 600], ['latin']),
    ('Noto Naskh Arabic', 'noto-naskh-arabic', [600, 700], ['arabic']),
]
for fam, pkg, weights, subs in EXTRA_FONTS:
    for w in weights:
        for sub in subs:
            fp = os.path.join(ROOT, f'node_modules/@fontsource/{pkg}/files/{pkg}-{sub}-{w}-normal.woff2')
            if not os.path.exists(fp): continue
            rng = AR if sub == 'arabic' else LAT
            faces.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-display:swap;font-weight:{w};src:url(data:font/woff2;base64,{base64.b64encode(open(fp,'rb').read()).decode()}) format('woff2');unicode-range:{rng}}}")
css = open(os.path.join(ROOT, 'src/styles.css'), encoding='utf-8').read()
for extra in ['src/designs.css', 'src/board.css', 'src/pages.css']:
    ep = os.path.join(ROOT, extra)
    if os.path.exists(ep): css += '\n' + open(ep, encoding='utf-8').read()
import json as _json
sys_path = os.path.join(ROOT, 'tools'); import sys; sys.path.insert(0, sys_path)
from gen_images import LIB as _LIB
lib = {}
for key, title, _fn in _LIB:
    pth = os.path.join(ROOT, 'assets/img', key + '.jpg')
    lib[key] = {'title': title, 'src': 'data:image/jpeg;base64,' + base64.b64encode(open(pth, 'rb').read()).decode()}
ASSETS = [('border-guard-signing', 'توقيع مذكرة التعاون مع المديرية العامة لحرس الحدود'), ('waqf-saitah-signing', 'توقيع الشراكة مع وقف الأمير صيته بنت عبدالعزيز'), ('murooj-logo', 'شعار مؤسسة مروج الأهلية'), ('murooj-logo-dark', 'شعار مؤسسة مروج الأهلية — للخلفية الداكنة')]
assets = {}
for key, title in ASSETS:
    for ext, mime in (('.jpg', 'image/jpeg'), ('.png', 'image/png')):
        pth = os.path.join(ROOT, 'assets/photos', key + ext)
        if os.path.exists(pth): assets[key] = {'title': title, 'src': f'data:{mime};base64,' + base64.b64encode(open(pth, 'rb').read()).decode()}; break
lib_js = 'const IMG_LIB = ' + _json.dumps(lib, ensure_ascii=False) + ';\nconst ASSET_IMG = ' + _json.dumps(assets, ensure_ascii=False) + ';\n'
js_files = [os.path.join(ROOT, 'src/seed_real.js')] + sorted(glob.glob(os.path.join(ROOT, 'src/js/*.js')))
js = lib_js + '\n'.join(f'/* —— {os.path.basename(f)} —— */\n' + open(f, encoding='utf-8').read() for f in js_files)
js = js.replace('</script', '<\\/script')
vendor = ''
vp = os.path.join(ROOT, 'node_modules/pptxgenjs/dist/pptxgen.bundle.js')
if os.path.exists(vp):
    import re as _re
    vendor = _re.sub(r'//# sourceMappingURL=.*', '', open(vp, encoding='utf-8').read()).replace('</script', '<\\/script')
# pdf.js: يُضمَّن نصًا ولا يُنفَّذ إلا عند تجهيز الملف الشامل للشراكة
pdfjs = ''
pp = os.path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/')
if os.path.exists(pp + 'pdf.min.js'):
    import re as _re
    rd_ = lambda n: _re.sub(r'//# sourceMappingURL=.*', '', open(pp + n, encoding='utf-8').read()).replace('</script', '<\\/script')
    pdfjs = f'<script type="text/plain" id="vendor-pdfjs">{rd_("pdf.min.js")}</script>\n<script type="text/plain" id="vendor-pdfjs-worker">{rd_("pdf.worker.min.js")}</script>'
html = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>منظومة الشراكات — نسخة محلية</title>
<style>{''.join(faces)}</style>
<style>{css}</style>
</head>
<body>
<div class="boot" id="boot"><div class="boot-in"><div class="spinner"></div><span>جارٍ تحميل المنصة…</span></div></div>
<noscript><p style="padding:40px;text-align:center">تحتاج المنصة إلى تفعيل JavaScript في المتصفح.</p></noscript>
<script>{vendor}</script>
{pdfjs}
<script>
'use strict';
{js}
</script>
</body>
</html>
"""
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'منصة-الشراكات-نسخة-محلية.html')
open(out, 'w', encoding='utf-8').write(html)
print('built', out, round(len(html.encode())/1024), 'KB')
