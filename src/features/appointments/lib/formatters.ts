import { AppointmentStatus } from '@/shared/types/enums';

export {
  formatDisplayDate as formatAppointmentDate,
  formatDisplayTime as formatAppointmentTime,
  formatDisplayDateTime as formatAppointmentDateTime,
  formatDisplayDateTimeCompact as formatAppointmentDateTimeCompact,
} from '@/shared/lib/datetime';

export function getParticipantName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function isUpcomingAppointment(status: AppointmentStatus, scheduledAt: string): boolean {
  const now = new Date();
  return (
    new Date(scheduledAt) >= now &&
    ![AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW].includes(
      status,
    )
  );
}

export function canCancelAppointment(status: AppointmentStatus): boolean {
  return ![
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.NO_SHOW,
  ].includes(status);
}

export function canRescheduleAppointment(status: AppointmentStatus): boolean {
  return canCancelAppointment(status);
}

export function canConfirmAppointment(
  status: AppointmentStatus,
  awaiting?: 'secretary' | 'patient',
): boolean {
  return status === AppointmentStatus.SCHEDULED && awaiting !== 'patient';
}

export function canAdminCancelAppointment(status: AppointmentStatus): boolean {
  return canCancelAppointment(status);
}

export function getRescheduleOptions(): string[] {
  const options: string[] = [];
  const base = new Date();

  for (let day = 1; day <= 3; day += 1) {
    for (const hour of [10, 14, 16]) {
      const slot = new Date(base);
      slot.setDate(base.getDate() + day);
      slot.setHours(hour, 0, 0, 0);
      options.push(slot.toISOString());
    }
  }

  return options;
}
