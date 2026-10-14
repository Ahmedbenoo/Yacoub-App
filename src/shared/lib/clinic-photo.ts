export function clinicPhotoDataUrl(color: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="${color}"/><text x="320" y="188" text-anchor="middle" font-family="Tahoma, Segoe UI, sans-serif" font-size="36" fill="#FFFFFF">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
