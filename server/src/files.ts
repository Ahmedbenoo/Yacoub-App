import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const uploadsRoot = path.join(here, '..', 'uploads');

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function extensionFor(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('svg')) return 'svg';
  return 'bin';
}

export function writeUpload(folder: string, filename: string, body: Buffer | string): string {
  const directory = path.join(uploadsRoot, folder);
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, filename), body);
  return `/uploads/${folder}/${filename}`;
}

export function writeSeedImage(relativePath: string, svg: string): string {
  const filePath = path.join(uploadsRoot, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, svg, 'utf8');
  return `/uploads/${relativePath.replaceAll('\\', '/')}`;
}

export function storeImage(value: string, folder: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw httpError(400, 'VALIDATION_ERROR', 'Image is required');
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const svg = trimmed.match(/^data:image\/svg\+xml;(?:charset=utf-8)?,([\s\S]+)$/);
  if (svg?.[1]) {
    return writeUpload(folder, `${randomUUID()}.svg`, decodeURIComponent(svg[1]));
  }

  const encoded = trimmed.match(/^data:([^;,]+);base64,([\s\S]+)$/);
  if (!encoded?.[1] || !encoded[2]) {
    throw httpError(400, 'VALIDATION_ERROR', 'Image must be a file');
  }

  const body = Buffer.from(encoded[2], 'base64');
  if (body.length > 8 * 1024 * 1024) {
    throw httpError(400, 'VALIDATION_ERROR', 'Image is too large');
  }
  return writeUpload(folder, `${randomUUID()}.${extensionFor(encoded[1])}`, body);
}

export function absoluteUrl(base: string, url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${base}${url}`;
}
