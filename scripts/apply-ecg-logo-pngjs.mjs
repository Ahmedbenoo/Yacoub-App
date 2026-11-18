import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const root = process.cwd();
const srcPath = path.join(root, 'assets', 'images', 'logo-munjiz-source.png');
const outDir = path.join(root, 'assets', 'images');

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function writePng(file, png) {
  fs.writeFileSync(file, PNG.sync.write(png));
}

function sample(src, x, y) {
  const ix = Math.max(0, Math.min(src.width - 1, x));
  const iy = Math.max(0, Math.min(src.height - 1, y));
  const i = (iy * src.width + ix) * 4;
  return [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function bilinear(src, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const c00 = sample(src, x0, y0);
  const c10 = sample(src, x0 + 1, y0);
  const c01 = sample(src, x0, y0 + 1);
  const c11 = sample(src, x0 + 1, y0 + 1);
  const out = [0, 0, 0, 0];
  for (let k = 0; k < 4; k += 1) {
    const top = lerp(c00[k], c10[k], tx);
    const bot = lerp(c01[k], c11[k], tx);
    out[k] = Math.round(lerp(top, bot, ty));
  }
  return out;
}

function crop(src, left, top, width, height) {
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const si = ((top + y) * src.width + (left + x)) * 4;
      const di = (y * width + x) * 4;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
}

function resize(src, width, height) {
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    const sy = ((y + 0.5) * src.height) / height - 0.5;
    for (let x = 0; x < width; x += 1) {
      const sx = ((x + 0.5) * src.width) / width - 0.5;
      const [r, g, b, a] = bilinear(src, sx, sy);
      const i = (y * width + x) * 4;
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = a;
    }
  }
  return out;
}

function composite(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const dx = ox + x;
      const dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
      const si = (y * src.width + x) * 4;
      const di = (dy * dst.width + dx) * 4;
      const sa = src.data[si + 3] / 255;
      const da = dst.data[di + 3] / 255;
      const outA = sa + da * (1 - sa);
      if (outA <= 0) continue;
      for (let k = 0; k < 3; k += 1) {
        const sc = src.data[si + k];
        const dc = dst.data[di + k];
        dst.data[di + k] = Math.round((sc * sa + dc * da * (1 - sa)) / outA);
      }
      dst.data[di + 3] = Math.round(outA * 255);
    }
  }
}

function fill(png, r, g, b, a) {
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = a;
  }
}

const src = readPng(srcPath);
let minX = src.width;
let minY = src.height;
let maxX = 0;
let maxY = 0;

for (let y = 0; y < src.height; y += 1) {
  for (let x = 0; x < src.width; x += 1) {
    const i = (y * src.width + x) * 4;
    const r = src.data[i];
    const g = src.data[i + 1];
    const b = src.data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < 16) {
      src.data[i + 3] = 0;
      continue;
    }
    if (lum < 52) {
      src.data[i + 3] = Math.max(src.data[i + 3], Math.round(((lum - 16) / 36) * 255));
    }
    if (src.data[i + 3] > 14) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 32;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(src.width - 1, maxX + pad);
maxY = Math.min(src.height - 1, maxY + pad);

const word = crop(src, minX, minY, maxX - minX + 1, maxY - minY + 1);
writePng(path.join(outDir, 'logo-munjiz-on-dark.png'), word);
writePng(path.join(outDir, 'logo-munjiz.png'), word);
writePng(path.join(outDir, 'splash-icon.png'), word);

const cx = Math.round((minX + maxX) / 2);
const cy = Math.round((minY + maxY) / 2);
const half = Math.round(Math.min(maxX - minX, maxY - minY) * 0.36);
const mark = crop(
  src,
  Math.max(0, cx - half),
  Math.max(0, cy - half),
  Math.min(src.width, cx + half) - Math.max(0, cx - half),
  Math.min(src.height, cy + half) - Math.max(0, cy - half),
);
const mark820 = resize(mark, 820, 820);

function makeIcon(bg, inner = 780) {
  const canvas = new PNG({ width: 1024, height: 1024 });
  fill(canvas, bg[0], bg[1], bg[2], bg[3]);
  const innerMark = resize(mark820, inner, inner);
  composite(canvas, innerMark, Math.round((1024 - inner) / 2), Math.round((1024 - inner) / 2));
  return canvas;
}

const iconLight = makeIcon([255, 255, 255, 255]);
writePng(path.join(outDir, 'icon.png'), iconLight);
writePng(path.join(outDir, 'favicon.png'), resize(iconLight, 192, 192));
writePng(path.join(outDir, 'android-icon-foreground.png'), makeIcon([0, 0, 0, 0], 640));

const mono = new PNG({ width: 640, height: 640 });
const smallMark = resize(mark820, 640, 640);
for (let i = 0; i < smallMark.data.length; i += 4) {
  const lum = 0.2126 * smallMark.data[i] + 0.7152 * smallMark.data[i + 1] + 0.0722 * smallMark.data[i + 2];
  const on = lum > 18 && smallMark.data[i + 3] > 20;
  mono.data[i] = 255;
  mono.data[i + 1] = 255;
  mono.data[i + 2] = 255;
  mono.data[i + 3] = on ? 255 : 0;
}
const monoCanvas = new PNG({ width: 1024, height: 1024 });
fill(monoCanvas, 0, 0, 0, 0);
composite(monoCanvas, mono, 192, 192);
writePng(path.join(outDir, 'android-icon-monochrome.png'), monoCanvas);

const bg = new PNG({ width: 1024, height: 1024 });
fill(bg, 2, 12, 14, 255);
writePng(path.join(outDir, 'android-icon-background.png'), bg);

const siteDir = path.join(root, 'server', 'public', 'site');
const opsDir = path.join(root, 'server', 'public', 'ops');
if (fs.existsSync(siteDir)) writePng(path.join(siteDir, 'logo-munjiz.png'), word);
if (fs.existsSync(opsDir)) writePng(path.join(opsDir, 'logo-munjiz.png'), word);

console.log(
  JSON.stringify({
    crop: { w: word.width, h: word.height, aspect: word.width / word.height },
    mark: { w: mark.width, h: mark.height },
  }),
);
