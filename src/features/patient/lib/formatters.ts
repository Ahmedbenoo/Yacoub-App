import type { TFunction } from 'i18next';

import { findClinicSpecialty } from '@/shared/catalog/clinic-specialties';
import type { AvailabilitySlot } from '@/shared/types/models/availability';
import type { BookingSlot } from '@/shared/types/models/doctor';

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function formatDoctorTitle(
  firstName: string,
  lastName: string,
  t: TFunction<'patient'>,
): string {
  return t('search.doctorTitle', { name: getFullName(firstName, lastName) });
}

export function formatSpecialty(specialty: string, t: TFunction<'patient'>): string {
  const match = findClinicSpecialty(specialty);
  return match ? t(`specialties.${match.id}`) : specialty;
}

export function formatRating(rating: number, reviewCount: number): string {
  return `${rating.toFixed(1)} (${reviewCount})`;
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

function minuteStamp(iso: string): number {
  const date = new Date(iso);
  date.setSeconds(0, 0);
  return date.getTime();
}

export function generateBookingSlots(
  slots: AvailabilitySlot[],
  locale = 'en',
  daysAhead = 60,
  options?: { minutes?: number; taken?: string[] },
): BookingSlot[] {
  const results: BookingSlot[] = [];
  const now = new Date();
  const step = options?.minutes && options.minutes > 0 ? options.minutes : 60;
  const taken = new Set((options?.taken ?? []).map(minuteStamp));

  for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset += 1) {
    const date = new Date();
    date.setDate(now.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);

    for (const slot of daySlots) {
      const start = parseTime(slot.startTime);
      const end = parseTime(slot.endTime);
      const startMinutes = start.hours * 60 + start.minutes;
      const endMinutes = end.hours * 60 + end.minutes;

      for (let cursor = startMinutes; cursor + step <= endMinutes; cursor += step) {
        const appointmentDate = new Date(date);
        appointmentDate.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);

        if (appointmentDate <= now) continue;
        if (taken.has(appointmentDate.getTime())) continue;

        results.push({
          scheduledAt: appointmentDate.toISOString(),
          label: new Intl.DateTimeFormat(locale, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }).format(appointmentDate),
        });
      }
    }
  }

  return results;
}

export function getDateDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getSlotDayKey(iso: string): string {
  return getDateDayKey(new Date(iso));
}

export function groupBookingSlotsByDay(slots: BookingSlot[]): { key: string; slots: BookingSlot[] }[] {
  const groups = new Map<string, BookingSlot[]>();

  for (const slot of slots) {
    const key = getSlotDayKey(slot.scheduledAt);
    const current = groups.get(key) ?? [];
    current.push(slot);
    groups.set(key, current);
  }

  return [...groups.entries()].map(([key, daySlots]) => ({ key, slots: daySlots }));
}

export function formatSlotTime(iso: string, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function getDayOffset(iso: string): number {
  const slot = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  slot.setHours(0, 0, 0, 0);
  return Math.round((slot.getTime() - today.getTime()) / 86400000);
}
