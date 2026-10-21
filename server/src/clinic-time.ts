const CLINIC_TIME_ZONE = 'Africa/Cairo';

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function clinicDayKey(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(asDate(value));
}

export function isSameClinicDay(value: string | Date, day: string | Date = new Date()): boolean {
  return clinicDayKey(value) === clinicDayKey(day);
}
