"""يحوّل «ملف حصر الشراكات» الفعلي إلى src/seed_real2.js
الاستخدام: python3 tools/extract_real_v2.py <ملف.xlsx>

القواعد المتفق عليها:
- كل شراكة لها تاريخ بداية تُعد موقّعة (المنصة تحسب «لم يبدأ سريانها» إن كان التاريخ لم يأتِ بعد، و«منتهية» إن انقضت مدتها).
- الشراكات بلا تاريخ تُستنتج حالتها من الملف نفسه (الملاحظات والتوصيات وخانة القطاع التي كُتبت فيها الحالة أحيانًا).
- الجهات المدرجة بلا أي بيانات (ولا عمل عليها) جهات مستهدفة: تُضاف إلى سجل الجهات لا إلى سجل الشراكات.
- تُصحَّح الأخطاء الإملائية الواضحة في الأسماء، وتُوحَّد القطاعات والتصنيفات وأسماء المسؤولين، ويُحفظ الأصل كما ورد في «importRaw».
"""
import sys, json, re, datetime, os
import openpyxl

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'seed_real2.js')
wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb.worksheets[0]
HEAD = [' '.join(str(ws.cell(2, c).value or '').split()) for c in range(1, 16)]

def clean(v):
    if v is None: return ''
    if isinstance(v, datetime.datetime): return f"{v.day}/{v.month}/{v.year}"
    return str(v).replace('\r', '').strip()
def one(v): return ' '.join(clean(v).split())

NAME_FIX = [('فهلا', 'فهد'), ('لاعدارة', 'لإدارة'), ('االسعودية', 'السعودية'), ('الاتزام', 'الالتزام'), ('أكادمية', 'أكاديمية'),
            ('المنتدى السعودية', 'المنتدى السعودي'), ('عبدلله', 'عبدالله'), ('لإلسكان', 'للإسكان'), ('(مدن )', '(مدن)'), ('الاصحاح البيئية', 'الإصحاح البيئي'),
            ('قوات الامن البيئي', 'القوات الخاصة للأمن البيئي'), ('شركة السعودية للاوزون', 'الشركة السعودية للأوزون'), ('جامعة الملك فهد البترول', 'جامعة الملك فهد للبترول'), ('للابنية', 'للأبنية'), ('لاعادة', 'لإعادة')]
def fix_name(s):
    s = one(s)
    for a, b in NAME_FIX: s = s.replace(a, b)
    if s == 'المركز الوطني لإدارة النفايات موان 2026': s = 'المركز الوطني لإدارة النفايات (موان)'
    return s
def partner_of(title):
    if 'ممثلة' in title: return title.split('ممثلة')[0].strip()
    if '(برنامج' in title: return title.split('(')[0].strip()
    return title

def sector_of(raw, name):
    s = one(raw)
    if any(k in s for k in ['حكومي']): return 'حكومي'
    if any(k in s for k in ['غير ربحي', 'غير رحبي', 'خيري', 'وقف']): return 'غير ربحي'
    if 'اكاديمي' in s or 'أكاديمي' in s: return 'تعليمي'
    if any(k in s for k in ['خاص', 'عقارية', 'رياض']): return 'خاص'
    # بلا قطاع: يُستنتج من اسم الجهة
    n = name
    if n.startswith('جامعة'): return 'تعليمي'
    if re.match(r'^(وزارة|هيئة|الهيئة|المركز الوطني|مركز|المؤسسة العامة|الإدارة العامة|أمانة|وكالة|المكتب الاستراتيجي|اللجنة الوطنية|الأكاديمية الوطنية|القوات|المديرية|غرفة|صندوق)', n): return 'حكومي'
    if re.match(r'^(جمعية|الجمعية|مؤسسة .*الخيرية|مؤسسة الأميرة|مؤسسة جاهز)', n) or 'الخيرية' in n or 'غير الربحية' in n: return 'غير ربحي'
    if re.match(r'^(شركة|الشركة|بنك|الخطوط|مجموعة)', n): return 'خاص'
    if n.startswith('مؤسسة'): return 'غير ربحي'
    return ''
def cls_of(raw):
    s = one(raw)
    if not s: return ''
    if 'تفاهم' in s: return 'مذكرة تفاهم'
    if 'تعاون' in s: return 'مذكرة تعاون'
    return s
TEAM = ['وعد', 'رنيم', 'عبدالله', 'العنود']
def owners_of(raw):
    s = one(raw)
    out = []
    for part in re.split(r'[+،,]|\s+و(?=[^\s])', s):
        p = part.strip()
        if not p: continue
        for t in TEAM:
            key = 'عبدال' if t == 'عبدالله' else t[:3] if t != 'وعد' else 'وعد'
            if key in p and t not in out: out.append(t)
    # «رنيم ووعد»
    for t in TEAM:
        if t in s and t not in out: out.append(t)
    return out
def iso(v, notes, label):
    if v is None or v == '': return ''
    if isinstance(v, datetime.datetime): return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4,5})$', s)
    if m:
        d, mo, y = int(m[1]), int(m[2]), m[3]
        if len(y) == 5:
            fixed = y[:3] + y[4:] if y.startswith('202') else y[:4]
            notes.append({'field': label, 'original': s, 'fixed': f"{d}/{mo}/{fixed}", 'msg': f'ورد {label} في الملف «⁦{s}⁩» وفُسِّر على أنه ⁦{d}/{mo}/{fixed}⁩. يُرجى التأكد منه.', 'confirmed': False})
            y = fixed
        return f"{int(y):04d}-{mo:02d}-{d:02d}"
    notes.append({'field': label, 'original': s, 'msg': f'تعذّرت قراءة {label}: «{s}».', 'confirmed': False})
    return ''
def activation_of(text):
    t = text
    if re.search(r'تم تفعيل|تم عمل مبادر', t): return 'مفعّلة'
    if 'تفعيل' in t: return 'قيد التفعيل'
    return ''
def stage_of(start, cls, coop, sec_raw, notes, recs):
    """الحالة: موقّعة إن وُجد تاريخ بداية، وإلا تُستنتج من نصوص الملف"""
    t = ' '.join([sec_raw, notes, recs])
    if start: return 'signed', ''
    if 'التوقيع الاحتفالي' in t: return 'signed', 'وُقّعت توقيعًا احتفاليًا ولم تُحدَّد تواريخ سريانها في الملف'
    if recs.strip() == 'تفعيل المذكرة': return 'signed', 'التوصية في الملف «تفعيل المذكرة»، ولم تُحدَّد تواريخ سريانها'
    if re.search(r'استكمال إجراءات التوقيع|العمل عليها والتوقيع', t): return 'sign', ''
    if 'لم يتم العمل' in t: return 'target', 'لم يُبدأ العمل عليها'
    if 'في انتظار الرد' in t: return 'prep', 'في انتظار رد الجهة'
    if re.search(r'العمل عليها|تباحث|التباحث|لم تصلنا|استكمال|تحديث البيانات|تتحديث', t): return 'prep', ''
    if cls or coop: return 'prep', ''
    return 'target', ''

records, targets = [], []
for r in range(3, ws.max_row + 1):
    v = [ws.cell(r, c).value for c in range(1, 16)]
    if not v[1] or not one(v[1]): continue
    notes_imp = []
    title = fix_name(v[1]); sec_raw = one(v[2])
    status_words = re.search(r'في انتظار|لم يتم العمل|العمل عليها', sec_raw)
    start = iso(v[8], notes_imp, 'تاريخ بدء الشراكة'); end = iso(v[9], notes_imp, 'تاريخ انتهاء الشراكة')
    notes_t, recs_t = clean(v[12]), clean(v[13])
    owners = owners_of(v[14])
    # «جامعة الجوف»: المسؤولون وردوا في خانة التوصيات
    if not owners and re.fullmatch(r'[\sء-ي+]+', recs_t or '-') and any(t in recs_t for t in TEAM): owners = owners_of(recs_t); recs_t = ''
    cls = cls_of(v[3]); coop = clean(v[4])
    stage, why = stage_of(start, cls, coop, sec_raw if status_words else '', notes_t, recs_t)
    phone = one(v[7]); phone = '0' + phone if re.fullmatch(r'5\d{8}', phone) else phone
    raw = [{'h': HEAD[i], 'v': clean(v[i])} for i in range(15)]
    base = {'row': r, 'title': title, 'partner': partner_of(title), 'sector': sector_of('' if status_words else sec_raw, partner_of(title)), 'owners': owners, 'importRaw': raw}
    if stage == 'target':
        targets.append({**base, 'note': why or 'جهة مستهدفة في ملف الحصر'})
        continue
    if stage in ('prep', 'sign') and status_words and not why: why = sec_raw
    records.append({**base, 'classification': cls, 'cooperationAreas': coop,
        'contactName': one(v[5]), 'contactEmail': one(v[6]), 'contactPhone': phone,
        'startDate': start, 'endDate': end, 'expectedImpact': clean(v[10]), 'outputs': clean(v[11]),
        'notes': notes_t, 'recommendations': recs_t, 'stage': stage, 'stageNote': why,
        'activation': activation_of(notes_t + ' ' + recs_t) if stage == 'signed' else '', 'importNotes': notes_imp})

# جهة مستهدفة مكررة لجهة لها شراكة (مثل «جمعية وعي» و«جمعية وعي البيئية»): تُضاف اسمًا بديلًا بدل جهة جديدة
def norm(s): return re.sub(r'[\u064B-\u0652]', '', s).replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه').replace('ى', 'ي').strip()
keep = []
for t in targets:
    hit = next((x for x in records if norm(t['partner']).startswith(norm(x['partner'])) or norm(x['partner']).startswith(norm(t['partner']))), None)
    if hit: hit.setdefault('aliases', []).append(t['partner'])
    else: keep.append(t)
targets = keep
# بيانات التواصل الشخصية لا تُكتب في الشيفرة (المستودع عام): تُستورد من داخل المنصة إلى قاعدة البيانات المحمية
PII = ('بيانات ضابط الاتصال', 'البريد الالكتروني للشريك', 'رقم الجوال')
for x in records:
    x['contactName'] = x['contactEmail'] = x['contactPhone'] = ''
    x['importRaw'] = [c for c in x['importRaw'] if c['h'] not in PII]
for x in targets: x['importRaw'] = [c for c in x['importRaw'] if c['h'] not in PII]
out = {'sheetTitle': one(ws['A1'].value) or 'ملف حصر الشراكات', 'version': 2, 'headers': HEAD, 'records': records, 'targets': targets}
open(OUT, 'w', encoding='utf-8').write('/* مولّد من ملف حصر الشراكات الفعلي بالأداة tools/extract_real_v2.py — لا يُعدَّل يدويًا */\nconst REAL_V2 = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
from collections import Counter
print('records', len(records), Counter(x['stage'] for x in records), 'targets', len(targets))
for x in records: print(x['row'], x['stage'], '|', x['title'][:44], '|', x['sector'], '|', x['classification'], '|', x['startDate'], x['endDate'], '|', x['owners'], '|', x['activation'], '|', x['stageNote'][:40], '|', [n['original'] for n in x['importNotes']])
print('--- targets'); [print(t['row'], t['title'], '|', t['sector'], '|', t['owners'], '|', t['note']) for t in targets]
