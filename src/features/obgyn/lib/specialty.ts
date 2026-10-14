import { findClinicSpecialty } from '@/shared/catalog/clinic-specialties';

export function isObstetricsGynecology(specialty?: string): boolean {
  return findClinicSpecialty(specialty ?? '')?.id === 'obstetricsGynecology';
}

export function eddFromLmp(lmp: string): string {
  const date = new Date(`${lmp}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 280);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function ltr(value: string | number): string {
  return `\u2066${value}\u2069`;
}
