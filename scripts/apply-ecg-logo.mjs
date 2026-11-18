import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const src = String.raw`C:\Users\compusoft\AppData\Roaming\Cursor\User\workspaceStorage\48f1bf10696694c20cb68817efd4c518\images\image-125bb862-49fc-4946-97ce-096ecef9c274.png`;
const outDir = path.join(root, 'assets', 'images');

function trySharp() {
  try {
    const require = createRequire(import.meta.url);
    return require('sharp');
  } catch {
    return null;
  }
}

async function withSharp(sharp) {
  const img = sharp(src).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  const out = Buffer.from(data);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum < 18) {
        out[i + 3] = 0;
        continue;
      }
      const alpha = Math.min(255, Math.round(((lum - 18) / 40) * 255));
      if (lum < 58) out[i + 3] = Math.max(out[i + 3] * (alpha / 255), alpha);
      if (out[i + 3] > 12) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 28;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const transparent = await sharp(out, { raw: { width, height, channels } })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .png()
    .toBuffer();

  const wordmark = await sharp(transparent)
    .resize({ width: 1400, height: 420, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(outDir, 'logo-munjiz-on-dark.png'), wordmark);
  fs.writeFileSync(path.join(outDir, 'logo-munjiz.png'), wordmark);

  const cx = Math.round((minX + maxX) / 2);
  const markHalf = Math.round(Math.min(cropW, cropH) * 0.42);
  const markLeft = Math.max(0, cx - markHalf);
  const markTop = Math.max(0, Math.round((minY + maxY) / 2) - markHalf);
  const markSize = Math.min(width - markLeft, height - markTop, markHalf * 2);

  const mark = await sharp(out, { raw: { width, height, channels } })
    .extract({ left: markLeft, top: markTop, width: markSize, height: markSize })
    .resize(820, 820, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const iconDark = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 2, g: 12, b: 14, alpha: 255 } },
  })
    .composite([{ input: await sharp(mark).resize(780, 780).png().toBuffer(), gravity: 'centre' }])
    .png()
    .toBuffer();

  const iconLight = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } },
  })
    .composite([{ input: await sharp(mark).resize(780, 780).png().toBuffer(), gravity: 'centre' }])
    .png()
    .toBuffer();

  const foreground = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: await sharp(mark).resize(640, 640).png().toBuffer(), gravity: 'centre' }])
    .png()
    .toBuffer();

  const mono = await sharp(mark)
    .resize(640, 640)
    .greyscale()
    .threshold(12)
    .png()
    .toBuffer();

  const monoFg = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mono, gravity: 'centre' }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(outDir, 'icon.png'), iconLight);
  fs.writeFileSync(path.join(outDir, 'favicon.png'), await sharp(iconLight).resize(192, 192).png().toBuffer());
  fs.writeFileSync(path.join(outDir, 'android-icon-foreground.png'), foreground);
  fs.writeFileSync(path.join(outDir, 'android-icon-monochrome.png'), monoFg);
  fs.writeFileSync(path.join(outDir, 'android-icon-background.png'), await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: { r: 2, g: 12, b: 14 } },
  }).png().toBuffer());
  fs.writeFileSync(path.join(outDir, 'splash-icon.png'), wordmark);

  const meta = await sharp(wordmark).metadata();
  console.log(JSON.stringify({ cropW, cropH, logoW: meta.width, logoH: meta.height, aspect: (meta.width ?? 1) / (meta.height ?? 1) }));
}

const sharp = trySharp();
if (sharp) {
  await withSharp(sharp);
} else {
  const pip = spawnSync('python', ['-c', 'from PIL import Image, ImageFilter, ImageChops; print("ok")'], { encoding: 'utf8' });
  if (pip.status !== 0) {
    console.error('Need sharp or Pillow');
    process.exit(1);
  }
  const py = `
from PIL import Image
import json, os
src = r'''${src}'''
out = r'''${outDir}'''
im = Image.open(src).convert('RGBA')
px = im.load()
w, h = im.size
minx, miny, maxx, maxy = w, h, 0, 0
for y in range(h):
    for x in range(w):
        r,g,b,a = px[x,y]
        lum = 0.2126*r + 0.7152*g + 0.0722*b
        if lum < 18:
            px[x,y] = (r,g,b,0)
            continue
        if lum < 58:
            na = int(min(255, (lum-18)/40*255))
            px[x,y] = (r,g,b,max(a if a else 0, na))
        r,g,b,a = px[x,y]
        if a > 12:
            minx, miny, maxx, maxy = min(minx,x), min(miny,y), max(maxx,x), max(maxy,y)
pad = 28
minx, miny = max(0,minx-pad), max(0,miny-pad)
maxx, maxy = min(w-1,maxx+pad), min(h-1,maxy+pad)
word = im.crop((minx,miny,maxx+1,maxy+1))
word.thumbnail((1400,420), Image.Resampling.LANCZOS)
word.save(os.path.join(out,'logo-munjiz-on-dark.png'))
word.save(os.path.join(out,'logo-munjiz.png'))
word.save(os.path.join(out,'splash-icon.png'))
cx = (minx+maxx)//2
cy = (miny+maxy)//2
half = int(min(maxx-minx, maxy-miny)*0.42)
mark = im.crop((max(0,cx-half), max(0,cy-half), min(w,cx+half), min(h,cy+half))).resize((820,820), Image.Resampling.LANCZOS)
def square(bg, size=1024, inner=780):
    canvas = Image.new('RGBA', (size,size), bg)
    m = mark.resize((inner,inner), Image.Resampling.LANCZOS)
    canvas.alpha_composite(m, ((size-inner)//2,(size-inner)//2))
    return canvas
icon = square((255,255,255,255))
icon.save(os.path.join(out,'icon.png'))
icon.resize((192,192), Image.Resampling.LANCZOS).save(os.path.join(out,'favicon.png'))
fg = square((0,0,0,0), inner=640)
fg.save(os.path.join(out,'android-icon-foreground.png'))
mono = mark.convert('L').point(lambda p: 255 if p>12 else 0).convert('RGBA')
mono.putalpha(mono.split()[0])
mc = Image.new('RGBA', (1024,1024), (0,0,0,0))
mm = mono.resize((640,640), Image.Resampling.LANCZOS)
mc.alpha_composite(mm, (192,192))
mc.save(os.path.join(out,'android-icon-monochrome.png'))
Image.new('RGB', (1024,1024), (2,12,14)).save(os.path.join(out,'android-icon-background.png'))
print(json.dumps({'w': word.size[0], 'h': word.size[1], 'aspect': word.size[0]/word.size[1]}))
`;
  fs.writeFileSync(path.join(root, 'scripts', '_apply-ecg-logo.py'), py);
  const run = spawnSync('python', [path.join(root, 'scripts', '_apply-ecg-logo.py')], { encoding: 'utf8' });
  process.stdout.write(run.stdout);
  process.stderr.write(run.stderr);
  if (run.status !== 0) process.exit(run.status ?? 1);
}
