const COVERS = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=900&q=80',
];

function hashId(id: string): number {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function defaultClinicCover(clinicId: string, specialty?: string | null): string {
  const key = `${specialty ?? ''}`.toLowerCase();
  if (key.includes('gyn') || key.includes('obstetric') || key.includes('نسا')) return COVERS[3];
  if (key.includes('pedia') || key.includes('child') || key.includes('أطفال')) return COVERS[4];
  if (key.includes('urol') || key.includes('مسالك')) return COVERS[5];
  return COVERS[hashId(clinicId) % 3];
}

export function clinicCoverList(clinicId: string, specialty?: string | null): string[] {
  const first = defaultClinicCover(clinicId, specialty);
  const second = COVERS[(hashId(clinicId) + 2) % COVERS.length];
  return first === second ? [first] : [first, second];
}
