"""يولّد مكتبة صور توضيحية جوية (ليست صورًا فعلية لمشاريع) لاستخدامها أغلفةً ومعارض في المنصة."""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy.ndimage import gaussian_filter, zoom
import os, json, base64, io

W, H = 1400, 875
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
os.makedirs(OUT, exist_ok=True)

def fbm(h, w, seed, octaves=6, base=4, persistence=0.5):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w)); amp = 1.0; tot = 0
    for o in range(octaves):
        n = base * (2 ** o)
        g = rng.random((n + 2, int(n * w / h) + 2))
        z = zoom(g, (h / g.shape[0] * 1.02, w / g.shape[1] * 1.02), order=3)[:h, :w]
        if z.shape != (h, w):
            z = np.pad(z, ((0, h - z.shape[0]), (0, w - z.shape[1])), mode='edge')
        out += amp * z; tot += amp; amp *= persistence
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-9)

def lerp(a, b, t):
    t = t[..., None]
    return np.array(a)[None, None, :] * (1 - t) + np.array(b)[None, None, :] * t

def ramp(t, stops):
    """stops: [(pos,(r,g,b)),...]"""
    out = np.zeros(t.shape + (3,))
    for (p0, c0), (p1, c1) in zip(stops[:-1], stops[1:]):
        m = (t >= p0) & (t <= p1)
        tt = np.clip((t - p0) / (p1 - p0 + 1e-9), 0, 1)
        out[m] = (np.array(c0) * (1 - tt[..., None]) + np.array(c1) * tt[..., None])[m]
    out[t < stops[0][0]] = stops[0][1]; out[t > stops[-1][0]] = stops[-1][1]
    return out

def shade(height, light=(-1, -1), strength=6.0):
    gy, gx = np.gradient(height)
    l = np.array(light, float); l /= np.linalg.norm(l)
    s = -(gx * l[0] + gy * l[1]) * strength * max(height.shape)
    return np.clip(0.5 + s, 0, 1)

def finish(img, seed, grain=5, vignette=0.22, warm=0.0):
    rng = np.random.default_rng(seed + 99)
    img = img + rng.normal(0, grain, img.shape)
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    img = img * (1 - vignette * np.clip(d - 0.35, 0, 1)[..., None])
    if warm: img[..., 0] += warm; img[..., 2] -= warm
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

def sand(seed, c1=(214, 184, 140), c2=(176, 140, 98), streak=True):
    n = fbm(H, W, seed, 7, 3)
    img = lerp(c2, c1, n)
    if streak:
        s = fbm(H, W, seed + 1, 5, 2)
        s2 = gaussian_filter(np.random.default_rng(seed).random((H, W)), (1, 18))
        img += ((s2 - 0.5) * 50)[..., None] * 0.5 + ((s - .5) * 26)[..., None]
    return img

# 1) دوائر الري المحوري
def pivots(seed=11):
    rng = np.random.default_rng(seed)
    img = sand(seed)
    yy, xx = np.mgrid[0:H, 0:W]
    R = 132
    greens = [(62, 104, 52), (86, 128, 62), (110, 140, 70), (48, 86, 46), (140, 150, 82), (160, 132, 90)]
    for row in range(-1, 5):
        for col in range(-1, 7):
            cx = col * (2 * R + 26) + (row % 2) * 40 + rng.normal(0, 8) + 90
            cy = row * (2 * R + 22) + rng.normal(0, 8) + 80
            if rng.random() < 0.12: continue
            r = R * rng.uniform(0.86, 1.0)
            d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
            ang = (np.arctan2(yy - cy, xx - cx) + np.pi) / (2 * np.pi)
            mask = d < r
            if not mask.any(): continue
            base = np.array(greens[rng.integers(len(greens))], float)
            split = rng.random()
            col2 = np.array(greens[rng.integers(len(greens))], float)
            tex = fbm(H, W, seed + row * 13 + col, 4, 6)
            rings = (np.sin(d / 3.1) * 0.5 + 0.5) * 10
            c = np.where((ang < split)[..., None] & (rng.random() < 0.55), col2[None, None, :], base[None, None, :])
            c = c + ((tex - .5) * 34)[..., None] - rings[..., None] * 0.6
            edge = np.clip((r - d) / 3.0, 0, 1)[..., None]
            img = np.where(mask[..., None], img * (1 - edge) + c * edge, img)
            arm = (np.abs((np.cos(split * 2 * np.pi) * (yy - cy) - np.sin(split * 2 * np.pi) * (xx - cx))) < 1.6) & mask & (((xx - cx) * np.cos(split * 2 * np.pi) + (yy - cy) * np.sin(split * 2 * np.pi)) > 0)
            img[arm] = img[arm] * 0.55 + np.array([60, 60, 50]) * 0.45
    # طرق ترابية
    return finish(img, seed, 6, 0.25)

# 2) صفوف تشجير
def afforest(seed=23):
    rng = np.random.default_rng(seed)
    img = sand(seed, (220, 192, 150), (186, 152, 110))
    big = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dsh = ImageDraw.Draw(sh)
    tr = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dtr = ImageDraw.Draw(tr)
    lines = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lines)
    ang = np.deg2rad(-14); sp = 34
    dens = fbm(H, W, seed + 5, 3, 2)
    for i in range(-30, 70):
        x0 = i * sp
        pts = [(x0 + t * np.sin(ang), t * np.cos(ang)) for t in (-200, H + 200)]
        dl.line(pts, fill=(120, 96, 66, 70), width=2)
        for t in range(-100, H + 100, 26):
            x = x0 + t * np.sin(ang) + rng.normal(0, 1.2); y = t * np.cos(ang)
            if not (0 <= x < W and 0 <= y < H): continue
            if rng.random() > 0.35 + 0.65 * dens[int(y), int(x)]: continue
            r = rng.uniform(6, 11) * (0.6 + 0.6 * dens[int(y), int(x)])
            dsh.ellipse([x - r + 5, y - r * 0.8 + 6, x + r + 9, y + r * 0.8 + 8], fill=(70, 50, 30, 110))
            g = rng.integers(0, 40)
            dtr.ellipse([x - r, y - r, x + r, y + r], fill=(46 + g, 84 + g, 44 + g // 2, 255))
            dtr.ellipse([x - r * 0.55 - 1, y - r * 0.6 - 1, x + r * 0.2, y + r * 0.1], fill=(86 + g, 126 + g, 70, 200))
    big = Image.alpha_composite(big, lines)
    big = Image.alpha_composite(big, sh.filter(ImageFilter.GaussianBlur(2.2)))
    big = Image.alpha_composite(big, tr.filter(ImageFilter.GaussianBlur(0.7)))
    d = ImageDraw.Draw(big)
    d.line([(W * 0.62, -20), (W * 0.58, H * 0.4), (W * 0.66, H * 0.75), (W * 0.6, H + 20)], fill=(232, 212, 178, 255), width=16, joint='curve')
    return finish(np.array(big.convert('RGB'), float), seed, 5, 0.2)

# 3) كثبان
def dunes(seed=37):
    yy, xx = np.mgrid[0:H, 0:W]
    warp = (fbm(H, W, seed, 5, 2) - 0.5) * 2.2
    a = np.deg2rad(62)
    t = (xx * np.cos(a) + yy * np.sin(a)) / 150.0 + warp
    f = t - np.floor(t)
    prof = np.where(f < 0.78, (f / 0.78) ** 1.6, (1 - f) / 0.22)
    amp = 0.55 + 0.45 * fbm(H, W, seed + 1, 4, 2)
    h = gaussian_filter(prof * amp + fbm(H, W, seed + 2, 6, 3) * 0.25, 1.4)
    gy, gx = np.gradient(h)
    s = -(gx * np.cos(a) + gy * np.sin(a))
    lo, hi = np.percentile(s, 2), np.percentile(s, 98)
    s = np.clip((s - lo) / (hi - lo), 0, 1)
    img = ramp(s, [(0, (150, 92, 52)), (0.3, (196, 132, 78)), (0.55, (224, 170, 110)), (0.8, (240, 198, 142)), (1, (250, 224, 178))])
    img += ((fbm(H, W, seed + 3, 4, 10) - .5) * 14)[..., None]
    return finish(img, seed, 4, 0.26, warm=3)

# 4) ساحل ومانجروف
def mangrove(seed=41):
    yy, xx = np.mgrid[0:H, 0:W]
    n = fbm(H, W, seed, 6, 3)
    shore = (xx / W) * 0.9 + (n - 0.5) * 0.55
    land = shore < 0.5
    dist = np.clip((shore - 0.5) * 4, 0, 1)
    water = lerp((112, 196, 190), (22, 92, 118), dist)
    water += ((fbm(H, W, seed + 2, 5, 10) - .5) * 14)[..., None]
    sandc = lerp((206, 188, 148), (232, 214, 176), fbm(H, W, seed + 4, 4, 5))
    img = np.where(land[..., None], sandc, water)
    veg = fbm(H, W, seed + 6, 6, 6)
    near = np.abs(shore - 0.5) < 0.12 + veg * 0.08
    vm = near & (veg > 0.45) & (shore < 0.62)
    vc = lerp((34, 74, 44), (78, 118, 62), fbm(H, W, seed + 8, 5, 18))
    img = np.where(vm[..., None], vc, img)
    img = gaussian_filter(img, (0.7, 0.7, 0))
    edge = np.abs(shore - 0.5) < 0.006
    img[edge] = img[edge] * 0.5 + np.array([240, 236, 220]) * 0.5
    return finish(img, seed, 5, 0.22)

# 5) مدرجات جبلية
def terraces(seed=53):
    rng = np.random.default_rng(seed)
    h = gaussian_filter(fbm(H, W, seed, 6, 2, 0.5), 6)
    h = (h - h.min()) / (h.max() - h.min())
    L = 34
    band = np.floor(h * L).astype(int)
    frac = h * L - band
    gy, gx = np.gradient(gaussian_filter(h, 2))
    sh = np.clip(0.5 - (gx * -0.8 + gy * -0.6) * 900, 0, 1)
    pal = [(78, 108, 56), (98, 124, 64), (122, 136, 74), (140, 132, 84), (110, 120, 66), (88, 112, 58)]
    cols = np.array([pal[rng.integers(len(pal))] for _ in range(L + 1)], float)
    img = cols[band]
    img = img * (0.8 + 0.4 * sh[..., None]) + ((fbm(H, W, seed + 4, 4, 28) - .5) * 22)[..., None]
    wall = frac < 0.09
    img[wall] = img[wall] * 0.55 + np.array([122, 104, 82]) * 0.45
    rock = h > 0.86
    rockc = lerp((120, 100, 80), (170, 150, 124), sh)
    img = np.where(rock[..., None], rockc, img)
    return finish(img, seed, 5, 0.25)

# 6) واحة نخيل
def palms(seed=67):
    rng = np.random.default_rng(seed)
    base = sand(seed, (196, 170, 128), (160, 128, 92))
    plots = fbm(H, W, seed + 2, 3, 2)
    farm = lerp((92, 118, 64), (126, 140, 78), fbm(H, W, seed + 3, 5, 12))
    yy, xx = np.mgrid[0:H, 0:W]
    grid = ((np.floor(xx / 230) + np.floor(yy / 190)) % 3 == 0) & (plots > 0.35)
    base = np.where(grid[..., None], farm, base)
    im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert('RGBA')
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dsh = ImageDraw.Draw(sh)
    fr = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dfr = ImageDraw.Draw(fr)
    for y in range(20, H, 46):
        for x in range(20, W, 46):
            if rng.random() < 0.18: continue
            cx, cy = x + rng.normal(0, 3), y + rng.normal(0, 3); r = rng.uniform(15, 22)
            dsh.ellipse([cx - r + 8, cy - r * 0.6 + 10, cx + r + 14, cy + r * 0.6 + 14], fill=(60, 44, 26, 120))
            k = rng.integers(9, 13); rot = rng.random() * np.pi
            g = rng.integers(0, 36)
            for j in range(k):
                a = rot + j * 2 * np.pi / k
                tip = (cx + np.cos(a) * r, cy + np.sin(a) * r)
                l1 = (cx + np.cos(a + 0.22) * r * 0.45, cy + np.sin(a + 0.22) * r * 0.45)
                l2 = (cx + np.cos(a - 0.22) * r * 0.45, cy + np.sin(a - 0.22) * r * 0.45)
                dfr.polygon([(cx, cy), l1, tip, l2], fill=(52 + g, 92 + g, 46 + g // 2, 255))
            dfr.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=(120, 110, 60, 255))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(3)))
    im = Image.alpha_composite(im, fr.filter(ImageFilter.GaussianBlur(0.6)))
    return finish(np.array(im.convert('RGB'), float), seed, 5, 0.22)

# 7) مشتل
def nursery(seed=79):
    rng = np.random.default_rng(seed)
    img = sand(seed, (210, 186, 146), (182, 154, 116))
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')
    d = ImageDraw.Draw(im)
    for bx in range(40, W, 330):
        for by in range(40, H, 270):
            if rng.random() < 0.15: continue
            # مظلة شبكية
            if rng.random() < 0.45:
                d.rectangle([bx, by, bx + 290, by + 220], fill=(212, 216, 210, 255), outline=(170, 172, 168, 255))
                for k in range(bx + 10, bx + 290, 22): d.line([(k, by), (k, by + 220)], fill=(190, 194, 188, 255), width=2)
            else:
                for k in range(by, by + 220, 18):
                    g = rng.integers(0, 30)
                    d.rectangle([bx, k, bx + 290, k + 11], fill=(60 + g, 104 + g, 54, 255))
    im = im.filter(ImageFilter.GaussianBlur(0.8))
    return finish(np.array(im.convert('RGB'), float), seed, 5, 0.2)


# 8) ممرات خضراء في حي سكني
def urban(seed=91):
    rng = np.random.default_rng(seed)
    base = sand(seed, (204, 188, 160), (178, 160, 130), streak=False)
    im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert('RGBA')
    d = ImageDraw.Draw(im)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    tr = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dt = ImageDraw.Draw(tr)
    bw, bh, st = 170, 120, 26
    park_col = 3
    for gy in range(-1, H // (bh + st) + 2):
        for gx in range(-1, W // (bw + st) + 2):
            x0 = gx * (bw + st) + 30; y0 = gy * (bh + st) + 20
            if gx == park_col:
                d.rectangle([x0, y0, x0 + bw, y0 + bh], fill=(156, 150, 112, 255))
                for k in range(30):
                    cx, cy = x0 + rng.uniform(8, bw - 8), y0 + rng.uniform(8, bh - 8); r = rng.uniform(7, 12)
                    ds.ellipse([cx - r + 5, cy - r + 6, cx + r + 8, cy + r + 8], fill=(60, 50, 30, 110))
                    g = rng.integers(0, 36); dt.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(52 + g, 96 + g, 48, 255))
                d.line([(x0, y0 + bh / 2), (x0 + bw, y0 + bh / 2)], fill=(222, 210, 182, 255), width=5)
                continue
            # مبانٍ داخل البلوك
            for bx in range(2):
                for by in range(2):
                    px = x0 + 8 + bx * (bw / 2); py = y0 + 8 + by * (bh / 2)
                    w_, h_ = bw / 2 - 16, bh / 2 - 16
                    c = int(rng.integers(214, 238))
                    ds.rectangle([px + 6, py + 7, px + w_ + 6, py + h_ + 7], fill=(80, 66, 46, 120))
                    d.rectangle([px, py, px + w_, py + h_], fill=(c, c - 4, c - 12, 255), outline=(190, 182, 166, 255))
                    d.rectangle([px + w_ * .3, py + h_ * .3, px + w_ * .45, py + h_ * .45], fill=(176, 186, 190, 255))
    # الشوارع
    for gy in range(-1, H // (bh + st) + 2):
        y = gy * (bh + st) + 20 + bh
        d.rectangle([0, y, W, y + st], fill=(118, 116, 112, 255))
        d.line([(0, y + st / 2), (W, y + st / 2)], fill=(206, 200, 186, 255), width=1)
        for x in range(0, W, 34):
            cx = x + rng.normal(0, 3); r = rng.uniform(6, 9)
            for yy in (y - 6, y + st + 6):
                ds.ellipse([cx - r + 4, yy - r + 5, cx + r + 7, yy + r + 7], fill=(60, 50, 30, 100))
                g = rng.integers(0, 30); dt.ellipse([cx - r, yy - r, cx + r, yy + r], fill=(56 + g, 100 + g, 52, 255))
    for gx in range(-1, W // (bw + st) + 2):
        x = gx * (bw + st) + 30 + bw
        d.rectangle([x, 0, x + st, H], fill=(118, 116, 112, 255))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(2.4)))
    im = Image.alpha_composite(im, tr.filter(ImageFilter.GaussianBlur(0.7)))
    im = im.rotate(-9, resample=Image.BICUBIC, expand=False, fillcolor=(190, 176, 150, 255))
    im = im.crop((110, 80, W - 110, H - 80)).resize((W, H), Image.LANCZOS)
    return finish(np.array(im.convert('RGB'), float), seed, 4, 0.22)

LIB = [
    ('pivots', 'مزارع بالري المحوري — صورة توضيحية', pivots),
    ('afforest', 'صفوف تشجير بالري بالتنقيط — صورة توضيحية', afforest),
    ('dunes', 'كثبان رملية — صورة توضيحية', dunes),
    ('mangrove', 'ساحل وغابات مانجروف — صورة توضيحية', mangrove),
    ('terraces', 'مدرجات زراعية جبلية — صورة توضيحية', terraces),
    ('palms', 'واحة نخيل — صورة توضيحية', palms),
    ('nursery', 'مشتل ومظلات إنتاج الشتلات — صورة توضيحية', nursery),
    ('urban', 'ممرات خضراء في حي سكني — صورة توضيحية', urban),
]
if __name__ == '__main__':
    import sys
    only = sys.argv[1:]
    meta = []
    for key, title, fn in LIB:
        if only and key not in only: continue
        im = fn()
        im.save(os.path.join(OUT, key + '.jpg'), quality=74, optimize=True, progressive=True)
        im.resize((W // 2, H // 2), Image.LANCZOS).save(os.path.join(OUT, key + '-sm.jpg'), quality=72, optimize=True)
        print(key, os.path.getsize(os.path.join(OUT, key + '.jpg')) // 1024, 'KB')
