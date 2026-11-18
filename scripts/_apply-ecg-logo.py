from PIL import Image
import json
import os

src = r"C:\Users\compusoft\AppData\Roaming\Cursor\User\workspaceStorage\48f1bf10696694c20cb68817efd4c518\images\image-125bb862-49fc-4946-97ce-096ecef9c274.png"
out = r"D:\AhmedFathy\Doctors Project\doctors-app\assets\images"

im = Image.open(src).convert("RGBA")
px = im.load()
w, h = im.size
minx, miny, maxx, maxy = w, h, 0, 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        if lum < 18:
            px[x, y] = (r, g, b, 0)
            continue
        if lum < 58:
            na = int(min(255, (lum - 18) / 40 * 255))
            px[x, y] = (r, g, b, max(a, na))
        r, g, b, a = px[x, y]
        if a > 12:
            minx, miny, maxx, maxy = min(minx, x), min(miny, y), max(maxx, x), max(maxy, y)

pad = 36
minx, miny = max(0, minx - pad), max(0, miny - pad)
maxx, maxy = min(w - 1, maxx + pad), min(h - 1, maxy + pad)
word = im.crop((minx, miny, maxx + 1, maxy + 1))
word.thumbnail((1600, 480), Image.Resampling.LANCZOS)
word.save(os.path.join(out, "logo-munjiz-on-dark.png"))
word.save(os.path.join(out, "logo-munjiz.png"))
word.save(os.path.join(out, "splash-icon.png"))

cx = (minx + maxx) // 2
cy = (miny + maxy) // 2
half = int(min(maxx - minx, maxy - miny) * 0.38)
mark = im.crop((max(0, cx - half), max(0, cy - half), min(w, cx + half), min(h, cy + half))).resize(
    (820, 820), Image.Resampling.LANCZOS
)


def square(bg, size=1024, inner=780):
    canvas = Image.new("RGBA", (size, size), bg)
    m = mark.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas.alpha_composite(m, ((size - inner) // 2, (size - inner) // 2))
    return canvas


icon_light = square((255, 255, 255, 255))
icon_light.save(os.path.join(out, "icon.png"))
icon_light.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(out, "favicon.png"))
square((0, 0, 0, 0), inner=640).save(os.path.join(out, "android-icon-foreground.png"))

mono = mark.convert("L").point(lambda p: 255 if p > 12 else 0)
mono_rgba = Image.new("RGBA", mark.size, (255, 255, 255, 0))
mono_rgba.putalpha(mono)
mc = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
mm = mono_rgba.resize((640, 640), Image.Resampling.LANCZOS)
mc.alpha_composite(mm, (192, 192))
mc.save(os.path.join(out, "android-icon-monochrome.png"))
Image.new("RGB", (1024, 1024), (2, 12, 14)).save(os.path.join(out, "android-icon-background.png"))

print(json.dumps({"w": word.size[0], "h": word.size[1], "aspect": word.size[0] / word.size[1]}))
