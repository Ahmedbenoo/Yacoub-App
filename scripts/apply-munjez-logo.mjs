import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const src = PNG.sync.read(fs.readFileSync('assets/images/logo-munjiz-source.png'));
const W = src.width;
const H = src.height;
const data = Buffer.from(src.data);

function tealScore(r, g, b) {
  const chroma = Math.max(g, b);
  if (chroma < 24) return 0;
  if (chroma <= r + 6) return 0;
  const extra = chroma - r;
  if (extra < 10) return 0;
  return Math.min(1, extra / 80);
}

let minX = W;
let minY = H;
let maxX = 0;
let maxY = 0;

for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const i = (y * W + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const score = tealScore(r, g, b);
    const alpha = Math.round(score * 255);
    data[i + 3] = alpha;
    if (alpha > 24) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 18;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(W - 1, maxX + pad);
maxY = Math.min(H - 1, maxY + pad);
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

const cropped = new PNG({ width: cropW, height: cropH });
for (let y = 0; y < cropH; y += 1) {
  for (let x = 0; x < cropW; x += 1) {
    const si = ((minY + y) * W + (minX + x)) * 4;
    const di = (y * cropW + x) * 4;
    cropped.data[di] = data[si];
    cropped.data[di + 1] = data[si + 1];
    cropped.data[di + 2] = data[si + 2];
    cropped.data[di + 3] = data[si + 3];
  }
}

function sample(png, x, y) {
  const ix = Math.max(0, Math.min(png.width - 1, x));
  const iy = Math.max(0, Math.min(png.height - 1, y));
  const i = (Math.round(iy) * png.width + Math.round(ix)) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
}

function bilinear(png, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const c00 = sample(png, x0, y0);
  const c10 = sample(png, x0 + 1, y0);
  const c01 = sample(png, x0, y0 + 1);
  const c11 = sample(png, x0 + 1, y0 + 1);
  const out = [0, 0, 0, 0];
  for (let k = 0; k < 4; k += 1) {
    const top = c00[k] + (c10[k] - c00[k]) * tx;
    const bot = c01[k] + (c11[k] - c01[k]) * tx;
    out[k] = Math.round(top + (bot - top) * ty);
  }
  return out;
}

function fitCanvas(png, tw, th) {
  const canvas = new PNG({ width: tw, height: th });
  canvas.data.fill(0);
  const scale = Math.min((tw * 0.92) / png.width, (th * 0.86) / png.height);
  const dw = Math.max(1, Math.round(png.width * scale));
  const dh = Math.max(1, Math.round(png.height * scale));
  const ox = Math.round((tw - dw) / 2);
  const oy = Math.round((th - dh) / 2);
  for (let y = 0; y < dh; y += 1) {
    const sy = ((y + 0.5) * png.height) / dh - 0.5;
    for (let x = 0; x < dw; x += 1) {
      const sx = ((x + 0.5) * png.width) / dw - 0.5;
      const [r, g, b, a] = bilinear(png, sx, sy);
      const di = ((oy + y) * tw + (ox + x)) * 4;
      canvas.data[di] = r;
      canvas.data[di + 1] = g;
      canvas.data[di + 2] = b;
      canvas.data[di + 3] = a;
    }
  }
  return canvas;
}

const TARGET_W = 1024;
const TARGET_H = 558;
const wordmark = fitCanvas(cropped, TARGET_W, TARGET_H);
fs.writeFileSync('assets/images/logo-munjiz.png', PNG.sync.write(wordmark));
fs.writeFileSync('assets/images/logo-munjiz-on-dark.png', PNG.sync.write(wordmark));
fs.writeFileSync('assets/images/splash-icon.png', PNG.sync.write(wordmark));

const markW = Math.round(cropH * 0.78);
const markLeft = Math.max(0, Math.round((cropW - markW) / 2));
const markTop = 0;
const mark = new PNG({ width: markW, height: markW });
for (let y = 0; y < markW; y += 1) {
  for (let x = 0; x < markW; x += 1) {
    const sx = Math.min(cropW - 1, markLeft + x);
    const sy = Math.min(cropH - 1, markTop + y);
    const si = (sy * cropW + sx) * 4;
    const di = (y * markW + x) * 4;
    mark.data[di] = cropped.data[si];
    mark.data[di + 1] = cropped.data[si + 1];
    mark.data[di + 2] = cropped.data[si + 2];
    mark.data[di + 3] = cropped.data[si + 3];
  }
}

const icon = fitCanvas(mark, 1024, 1024);
const iconWhite = new PNG({ width: 1024, height: 1024 });
for (let i = 0; i < iconWhite.data.length; i += 4) {
  const a = icon.data[i + 3] / 255;
  iconWhite.data[i] = Math.round(icon.data[i] * a + 255 * (1 - a));
  iconWhite.data[i + 1] = Math.round(icon.data[i + 1] * a + 255 * (1 - a));
  iconWhite.data[i + 2] = Math.round(icon.data[i + 2] * a + 255 * (1 - a));
  iconWhite.data[i + 3] = 255;
}
fs.writeFileSync('assets/images/icon.png', PNG.sync.write(iconWhite));
fs.writeFileSync('assets/images/android-icon-foreground.png', PNG.sync.write(fitCanvas(mark, 1024, 1024)));

function resize(png, tw, th) {
  const out = new PNG({ width: tw, height: th });
  for (let y = 0; y < th; y += 1) {
    const sy = ((y + 0.5) * png.height) / th - 0.5;
    for (let x = 0; x < tw; x += 1) {
      const sx = ((x + 0.5) * png.width) / tw - 0.5;
      const [r, g, b, a] = bilinear(png, sx, sy);
      const i = (y * tw + x) * 4;
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = a;
    }
  }
  return out;
}

fs.writeFileSync('assets/images/favicon.png', PNG.sync.write(resize(iconWhite, 192, 192)));

const mono = new PNG({ width: 1024, height: 1024 });
for (let i = 0; i < icon.data.length; i += 4) {
  const on = icon.data[i + 3] > 40;
  mono.data[i] = 255;
  mono.data[i + 1] = 255;
  mono.data[i + 2] = 255;
  mono.data[i + 3] = on ? 255 : 0;
}
fs.writeFileSync('assets/images/android-icon-monochrome.png', PNG.sync.write(mono));

console.log(JSON.stringify({ cropW, cropH, minX, minY, maxX, maxY, out: [TARGET_W, TARGET_H] }));
