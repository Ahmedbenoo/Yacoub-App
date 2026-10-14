import i18n from 'i18next';

import { Gender } from '@/shared/types/enums';

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function formatGender(gender: Gender): string {
  return i18n.t(`gender.${gender}`, { ns: 'common' });
}

export function formatPatientSubtitle(
  dateOfBirth: string,
  gender: Gender,
  bloodType: string | undefined,
  ageLabel: string,
): string {
  const age = calculateAge(dateOfBirth);
  const genderLabel = formatGender(gender);
  const base = ageLabel.replace('{{age}}', String(age)).replace('{{gender}}', genderLabel);
  return bloodType ? `${base} · ${bloodType}` : base;
}

export function getDayName(dayOfWeek: number): string {
  const key = DAY_KEYS[dayOfWeek];
  return key ? i18n.t(`days.${key}`, { ns: 'common' }) : '';
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
