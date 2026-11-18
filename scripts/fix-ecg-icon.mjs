import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const root = process.cwd();
const src = PNG.sync.read(fs.readFileSync(path.join(root, 'assets', 'images', 'logo-munjiz-source.png')));

function sample(srcPng, x, y) {
  const ix = Math.max(0, Math.min(srcPng.width - 1, Math.round(x)));
  const iy = Math.max(0, Math.min(srcPng.height - 1, Math.round(y)));
  const i = (iy * srcPng.width + ix) * 4;
  return [srcPng.data[i], srcPng.data[i + 1], srcPng.data[i + 2], srcPng.data[i + 3]];
}

function cropResize(left, top, size, outSize) {
  const out = new PNG({ width: outSize, height: outSize });
  for (let y = 0; y < outSize; y += 1) {
    const sy = top + ((y + 0.5) * size) / outSize - 0.5;
    for (let x = 0; x < outSize; x += 1) {
      const sx = left + ((x + 0.5) * size) / outSize - 0.5;
      const [r, g, b, a] = sample(src, sx, sy);
      const i = (y * outSize + x) * 4;
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = a;
    }
  }
  return out;
}

function fill(png, r, g, b, a) {
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = a;
  }
}

function paste(dst, srcPng, ox, oy) {
  for (let y = 0; y < srcPng.height; y += 1) {
    for (let x = 0; x < srcPng.width; x += 1) {
      const dx = ox + x;
      const dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
      const si = (y * srcPng.width + x) * 4;
      const di = (dy * dst.width + dx) * 4;
      dst.data[di] = srcPng.data[si];
      dst.data[di + 1] = srcPng.data[si + 1];
      dst.data[di + 2] = srcPng.data[si + 2];
      dst.data[di + 3] = srcPng.data[si + 3];
    }
  }
}

// Center of the ECG mark in the 1024 source (from previous crop math).
const size = 300;
const left = 376;
const top = 354;
const mark = cropResize(left, top, size, 780);

const icon = new PNG({ width: 1024, height: 1024 });
fill(icon, 2, 12, 14, 255);
paste(icon, mark, 122, 122);
fs.writeFileSync(path.join(root, 'assets', 'images', 'icon.png'), PNG.sync.write(icon));

const fav = cropResize(left, top, size, 192);
const favBg = new PNG({ width: 192, height: 192 });
fill(favBg, 2, 12, 14, 255);
paste(favBg, fav, 0, 0);
fs.writeFileSync(path.join(root, 'assets', 'images', 'favicon.png'), PNG.sync.write(favBg));

const fg = new PNG({ width: 1024, height: 1024 });
fill(fg, 0, 0, 0, 0);
const fgMark = cropResize(left, top, size, 640);
paste(fg, fgMark, 192, 192);
fs.writeFileSync(path.join(root, 'assets', 'images', 'android-icon-foreground.png'), PNG.sync.write(fg));

const mono = new PNG({ width: 1024, height: 1024 });
fill(mono, 0, 0, 0, 0);
for (let y = 0; y < 640; y += 1) {
  for (let x = 0; x < 640; x += 1) {
    const si = (y * 640 + x) * 4;
    const lum = 0.2126 * fgMark.data[si] + 0.7152 * fgMark.data[si + 1] + 0.0722 * fgMark.data[si + 2];
    const di = ((y + 192) * 1024 + (x + 192)) * 4;
    const on = lum > 28;
    mono.data[di] = 255;
    mono.data[di + 1] = 255;
    mono.data[di + 2] = 255;
    mono.data[di + 3] = on ? 255 : 0;
  }
}
fs.writeFileSync(path.join(root, 'assets', 'images', 'android-icon-monochrome.png'), PNG.sync.write(mono));
console.log('icons updated', { left, top, size });
