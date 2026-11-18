import fs from 'node:fs';
import path from 'node:path';

const destDir = path.join(process.cwd(), 'assets', 'images');
const candidates = [
  String.raw`C:\Users\compusoft\AppData\Roaming\Cursor\User\workspaceStorage\48f1bf10696694c20cb68817efd4c518\images\image-8e23d256-b012-4bcc-8336-decf8f8808c5.png`,
  String.raw`C:\Users\compusoft\.cursor\projects\d-AhmedFathy-Doctors-Project-doctors-app\assets\c__Users_compusoft_AppData_Roaming_Cursor_User_workspaceStorage_48f1bf10696694c20cb68817efd4c518_images_image-8e23d256-b012-4bcc-8336-decf8f8808c5.png`,
];

const src = candidates.find((file) => fs.existsSync(file));
if (!src) {
  console.error('source missing');
  process.exit(1);
}

const names = [
  'logo-munjiz-source.png',
  'logo-munjiz.png',
  'logo-munjiz-on-dark.png',
  'splash-icon.png',
  'icon.png',
  'favicon.png',
  'android-icon-foreground.png',
];

for (const name of names) {
  fs.copyFileSync(src, path.join(destDir, name));
}

for (const extra of [
  path.join(process.cwd(), 'server', 'public', 'site', 'logo-munjiz.png'),
  path.join(process.cwd(), 'server', 'public', 'ops', 'logo-munjiz.png'),
]) {
  if (fs.existsSync(path.dirname(extra))) fs.copyFileSync(src, extra);
}

console.log('copied from', src, fs.statSync(src).size);
