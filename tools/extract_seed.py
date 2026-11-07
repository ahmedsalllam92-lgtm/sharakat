import openpyxl, json, datetime, re
wb = openpyxl.load_workbook('/mnt/user-data/uploads/ملف_مثال_الشراكات_للمنصة.xlsx')
ws = wb.worksheets[0]
headers = [ (ws.cell(2,c).value or '').strip() for c in range(1,20) ]
def raw(v):
    if v is None: return ''
    if isinstance(v, datetime.datetime): return f"{v.day}/{v.month}/{v.year}"
    return str(v)
def iso(v, notes, label):
    if v is None or v == '': return ''
    if isinstance(v, datetime.datetime): return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4,5})$', s)
    if m:
        d, mo, y = int(m[1]), int(m[2]), m[3]
        if len(y) == 5:
            fixed = y[:3] + y[4:] if y.startswith('202') else y[:4]
            notes.append({'field': label, 'original': s, 'fixed': f"{d}/{mo}/{fixed}", 'msg': f'ورد {label} في الملف «\u2066{s}\u2069» وفُسِّر على أنه \u2066{d}/{mo}/{fixed}\u2069. يُرجى التأكد منه.', 'confirmed': False})
            y = fixed
        return f"{int(y):04d}-{mo:02d}-{d:02d}"
    notes.append({'field': label, 'original': s, 'msg': f'تعذّرت قراءة {label}: «{s}».', 'confirmed': False})
    return ''
DEPTS = [('المشاريع','إدارة المشاريع'),('تطوير الاعمال','إدارة تطوير الأعمال'),('الاتصال المؤسسي','إدارة الاتصال المؤسسي'),('المشاركة المجتمعية','إدارة المشاركة المجتمعية'),('للاستراتيجية','الإدارة العامة للاستراتيجية')]
recs = []
for r in range(3, 6):
    vals = [ws.cell(r,c).value for c in range(1,20)]
    notes = []
    clean = lambda v: (str(v).strip() if v is not None else '')
    phone = clean(vals[7])
    if re.fullmatch(r'5\d{8}', phone): phone = '0' + phone
    owners = [o.strip() for o in re.split(r'[+،,]', clean(vals[15])) if o.strip()]
    inter = clean(vals[16])
    depts = [full for key, full in DEPTS if key in inter]
    cls = re.sub(r'\s+', ' ', clean(vals[3]))
    recs.append({
        'seq': int(vals[0]),
        'title': clean(vals[1]),
        'sector': clean(vals[2]),
        'classification': cls,
        'cooperationAreas': clean(vals[4]),
        'contactName': re.sub(r'\s+', ' ', clean(vals[5])),
        'contactEmail': clean(vals[6]),
        'contactPhone': phone,
        'startDate': iso(vals[8], notes, 'تاريخ بدء الشراكة'),
        'endDate': iso(vals[9], notes, 'تاريخ انتهاء الشراكة'),
        'expectedImpact': clean(vals[10]),
        'outputs': clean(vals[11]),
        'notes': clean(vals[12]),
        'recommendations': clean(vals[13]),
        'challenges': clean(vals[14]),
        'owners': owners,
        'departments': depts,
        'activation': clean(vals[17]),
        'importNotes': notes,
        'importRaw': [{'h': headers[i], 'v': raw(vals[i])} for i in range(19)],
    })
share_spec = ws['C9'].value.strip()
out = {'sheetTitle': ws['A1'].value.strip(), 'headers': headers, 'records': recs, 'shareSpec': share_spec, 'reportsSpec': ws['S3'].value.strip()}
open('src/seed_real.js','w',encoding='utf-8').write('const REAL_SAMPLE = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
for x in recs: print(x['seq'], x['title'], x['sector'], x['classification'], x['startDate'], x['endDate'], x['owners'], x['departments'], x['contactPhone'], x['importNotes'])
print(headers)
