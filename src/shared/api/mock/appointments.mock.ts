import { AppointmentStatus, NotificationType } from '@/shared/types/enums';
import type { Appointment, AppointmentFilters, CreateAppointmentPayload } from '@/shared/types/models/appointment';
import { getMockDoctorById } from '@/shared/api/mock/doctors.mock';
import { pushMockNotification } from '@/shared/api/mock/notifications.mock';
import type { PaginatedResponse } from '@/shared/types/models';
import { sleep } from '@/shared/lib/utils';

import { cloneSeed, resetArray } from './clone';
import { MOCK_CLINIC_IDS } from './constants';
import { getMockClinicScope } from './helpers';

const DOCTOR_ID = 'user-doctor-001';
const DOCTOR_ID_DOWNTOWN = 'user-doctor-005';
const PATIENT_ID = 'user-patient-001';
const PATIENT_ID_2 = 'user-patient-002';
const PATIENT_ID_DOWNTOWN = 'user-patient-004';

function isSameCalendarDay(iso: string, day = new Date()) {
  const date = new Date(iso);
  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  );
}

function isoAt(hours: number, minutes: number, dayOffset = 0): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}

function buildAppointment(
  partial: Omit<Appointment, 'clinicId' | 'createdAt' | 'updatedAt'>,
  clinicId: string,
): Appointment {
  const now = new Date().toISOString();
  return {
    ...partial,
    clinicId,
    createdAt: now,
    updatedAt: now,
  };
}

const SEED_APPOINTMENTS: Appointment[] = [
  buildAppointment({
    id: 'appt-001',
    doctorId: DOCTOR_ID,
    patientId: PATIENT_ID,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    scheduledAt: isoAt(9, 0, 0),
    durationMinutes: 30,
    status: AppointmentStatus.CONFIRMED,
    reason: 'General checkup',
    doctor: { id: DOCTOR_ID, firstName: 'Ahmed', lastName: 'Hassan', specialty: 'General Medicine' },
    patient: { id: PATIENT_ID, firstName: 'Sara', lastName: 'Mohamed' },
  }, MOCK_CLINIC_IDS.MAIN),
  buildAppointment({
    id: 'appt-002',
    doctorId: DOCTOR_ID,
    patientId: PATIENT_ID_2,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    scheduledAt: isoAt(11, 30, 0),
    durationMinutes: 45,
    status: AppointmentStatus.SCHEDULED,
    reason: 'Follow-up consultation',
    doctor: { id: DOCTOR_ID, firstName: 'Ahmed', lastName: 'Hassan', specialty: 'General Medicine' },
    patient: { id: PATIENT_ID_2, firstName: 'Youssef', lastName: 'Kamal' },
  }, MOCK_CLINIC_IDS.MAIN),
  buildAppointment({
    id: 'appt-003',
    doctorId: DOCTOR_ID,
    patientId: PATIENT_ID,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    scheduledAt: isoAt(14, 0, 1),
    durationMinutes: 30,
    status: AppointmentStatus.CONFIRMED,
    reason: 'Lab results review',
    doctor: { id: DOCTOR_ID, firstName: 'Ahmed', lastName: 'Hassan', specialty: 'General Medicine' },
    patient: { id: PATIENT_ID, firstName: 'Sara', lastName: 'Mohamed' },
  }, MOCK_CLINIC_IDS.MAIN),
  buildAppointment({
    id: 'appt-004',
    doctorId: DOCTOR_ID,
    patientId: PATIENT_ID_2,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    scheduledAt: isoAt(10, 0, 3),
    durationMinutes: 30,
    status: AppointmentStatus.SCHEDULED,
    reason: 'Annual physical',
    doctor: { id: DOCTOR_ID, firstName: 'Ahmed', lastName: 'Hassan', specialty: 'General Medicine' },
    patient: { id: PATIENT_ID_2, firstName: 'Youssef', lastName: 'Kamal' },
  }, MOCK_CLINIC_IDS.MAIN),
  buildAppointment({
    id: 'appt-005',
    doctorId: DOCTOR_ID,
    patientId: PATIENT_ID,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    scheduledAt: isoAt(16, 0, -2),
    durationMinutes: 30,
    status: AppointmentStatus.COMPLETED,
    reason: 'Blood pressure check',
    doctor: { id: DOCTOR_ID, firstName: 'Ahmed', lastName: 'Hassan', specialty: 'General Medicine' },
    patient: { id: PATIENT_ID, firstName: 'Sara', lastName: 'Mohamed' },
  }, MOCK_CLINIC_IDS.MAIN),
  buildAppointment({
    id: 'appt-006',
    doctorId: DOCTOR_ID,
    patientId: PATIENT_ID_2,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    scheduledAt: isoAt(9, 30, -5),
    durationMinutes: 30,
    status: AppointmentStatus.CANCELLED,
    reason: 'Skin rash',
    doctor: { id: DOCTOR_ID, firstName: 'Ahmed', lastName: 'Hassan', specialty: 'General Medicine' },
    patient: { id: PATIENT_ID_2, firstName: 'Youssef', lastName: 'Kamal' },
  }, MOCK_CLINIC_IDS.MAIN),
  buildAppointment({
    id: 'appt-007',
    doctorId: DOCTOR_ID_DOWNTOWN,
    patientId: PATIENT_ID_DOWNTOWN,
    branchId: 'branch-downtown',
    branchName: 'Downtown Branch',
    scheduledAt: isoAt(10, 0, 0),
    durationMinutes: 30,
    status: AppointmentStatus.CONFIRMED,
    reason: 'Knee pain evaluation',
    doctor: { id: DOCTOR_ID_DOWNTOWN, firstName: 'Omar', lastName: 'Rashid', specialty: 'Orthopedics' },
    patient: { id: PATIENT_ID_DOWNTOWN, firstName: 'Fatima', lastName: 'Ali' },
  }, MOCK_CLINIC_IDS.DOWNTOWN),
  buildAppointment({
    id: 'appt-008',
    doctorId: DOCTOR_ID_DOWNTOWN,
    patientId: PATIENT_ID_DOWNTOWN,
    branchId: 'branch-downtown',
    branchName: 'Downtown Branch',
    scheduledAt: isoAt(15, 0, 2),
    durationMinutes: 30,
    status: AppointmentStatus.SCHEDULED,
    reason: 'Follow-up orthopedics',
    doctor: { id: DOCTOR_ID_DOWNTOWN, firstName: 'Omar', lastName: 'Rashid', specialty: 'Orthopedics' },
    patient: { id: PATIENT_ID_DOWNTOWN, firstName: 'Fatima', lastName: 'Ali' },
  }, MOCK_CLINIC_IDS.DOWNTOWN),
  buildAppointment({
    id: 'appt-009',
    doctorId: 'user-doctor-006',
    patientId: PATIENT_ID_DOWNTOWN,
    branchId: 'branch-downtown',
    branchName: 'Downtown Branch',
    scheduledAt: isoAt(11, 0, -3),
    durationMinutes: 30,
    status: AppointmentStatus.COMPLETED,
    reason: 'Asthma review',
    doctor: { id: 'user-doctor-006', firstName: 'Hana', lastName: 'Mostafa', specialty: 'Internal Medicine' },
    patient: { id: PATIENT_ID_DOWNTOWN, firstName: 'Fatima', lastName: 'Ali' },
  }, MOCK_CLINIC_IDS.DOWNTOWN),
];

let mockAppointments: Appointment[] = cloneSeed(SEED_APPOINTMENTS);

export function resetMockAppointments() {
  resetArray(mockAppointments, SEED_APPOINTMENTS);
}

export function listAppointmentsForPatient(patientId: string) {
  return mockAppointments.filter((item) => item.patientId === patientId);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function filterAppointments(items: Appointment[], filters: AppointmentFilters = {}): Appointment[] {
  const clinicScope = getMockClinicScope(filters.clinicId);
  let result = items.filter((item) => item.clinicId === clinicScope);
  const now = new Date();

  if (filters.doctorId) {
    result = result.filter((item) => item.doctorId === filters.doctorId);
  }

  if (filters.patientId) {
    result = result.filter((item) => item.patientId === filters.patientId);
  }

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    result = result.filter((item) => statuses.includes(item.status));
  }

  if (filters.scope === 'today') {
    result = result.filter((item) => isSameDay(new Date(item.scheduledAt), now));
  } else if (filters.scope === 'upcoming') {
    result = result.filter(
      (item) =>
        new Date(item.scheduledAt) >= now &&
        ![AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED].includes(item.status),
    );
  } else if (filters.scope === 'past') {
    result = result.filter(
      (item) =>
        new Date(item.scheduledAt) < now ||
        [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(
          item.status,
        ),
    );
  }

  if (filters.dateFrom) {
    result = result.filter((item) => new Date(item.scheduledAt) >= new Date(filters.dateFrom!));
  }

  if (filters.dateTo) {
    result = result.filter((item) => new Date(item.scheduledAt) <= new Date(filters.dateTo!));
  }

  result.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  return result;
}

const OPEN_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
];

export function listMockAppointments(): Appointment[] {
  return mockAppointments;
}

export function getOccupiedSlotIsos(doctorId: string): string[] {
  return mockAppointments
    .filter((item) => item.doctorId === doctorId && OPEN_STATUSES.includes(item.status))
    .map((item) => item.scheduledAt);
}

function slotIsTaken(doctorId: string, scheduledAt: string, ignoreId?: string): boolean {
  const start = new Date(scheduledAt).getTime();
  return mockAppointments.some((item) => {
    if (item.id === ignoreId || item.doctorId !== doctorId) return false;
    if (!OPEN_STATUSES.includes(item.status)) return false;
    return Math.abs(new Date(item.scheduledAt).getTime() - start) < (item.durationMinutes || 30) * 60 * 1000;
  });
}

async function notifyOthers(
  appointment: Appointment,
  actorUserId: string | undefined,
  messageKey: string,
  title: string,
  body: string,
) {
  const ids = new Set([
    appointment.patientId,
    appointment.doctorId,
    'user-secretary-001',
    'user-admin-001',
  ]);
  if (actorUserId) ids.delete(actorUserId);
  for (const userId of ids) {
    await pushMockNotification({
      userId,
      type: NotificationType.APPOINTMENT,
      messageKey,
      title,
      body,
      data: {
        appointmentId: appointment.id,
        time: appointment.scheduledAt,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
        doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`.trim(),
      },
    });
  }
}

function paginate<T>(items: T[], page = 1, limit = 20): PaginatedResponse<T> {
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return {
    data,
    meta: {
      page,
      limit,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
    },
  };
}

export const mockAppointmentsService = {
  async list(filters: AppointmentFilters = {}): Promise<PaginatedResponse<Appointment>> {
    await sleep(600);
    const filtered = filterAppointments(mockAppointments, filters);
    return paginate(filtered, filters.page ?? 1, filters.limit ?? 20);
  },

  async getById(id: string): Promise<Appointment> {
    await sleep(400);
    const appointment = mockAppointments.find((item) => item.id === id);
    if (!appointment) {
      throw { code: 'NOT_FOUND', message: 'Appointment not found' };
    }
    return appointment;
  },

  async cancel(id: string, actorUserId?: string): Promise<Appointment> {
    await sleep(500);
    const index = mockAppointments.findIndex((item) => item.id === id);
    if (index === -1) {
      throw { code: 'NOT_FOUND', message: 'Appointment not found' };
    }

    const appointment = mockAppointments[index];
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(appointment.status)) {
      throw { code: 'INVALID_STATUS', message: 'This appointment cannot be cancelled' };
    }

    mockAppointments[index] = {
      ...appointment,
      status: AppointmentStatus.CANCELLED,
      awaiting: undefined,
      queue: undefined,
      updatedAt: new Date().toISOString(),
    };
    const { voidOpenInvoice } = await import('./invoices.mock');
    voidOpenInvoice(appointment.id);
    await notifyOthers(
      mockAppointments[index],
      actorUserId,
      'appointmentCancelled',
      'Appointment cancelled',
      'The appointment was cancelled.',
    );

    return mockAppointments[index];
  },

  async confirm(id: string, actorUserId?: string): Promise<Appointment> {
    await sleep(500);
    const index = mockAppointments.findIndex((item) => item.id === id);
    if (index === -1) {
      throw { code: 'NOT_FOUND', message: 'Appointment not found' };
    }

    const appointment = mockAppointments[index];
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw { code: 'INVALID_STATUS', message: 'Only scheduled appointments can be confirmed' };
    }
    if (appointment.awaiting === 'patient') {
      throw { code: 'AWAITING_PATIENT', message: 'المريض لازم يوافق على الوقت الاول' };
    }

    mockAppointments[index] = {
      ...appointment,
      status: AppointmentStatus.CONFIRMED,
      awaiting: undefined,
      updatedAt: new Date().toISOString(),
    };
    await notifyOthers(
      mockAppointments[index],
      actorUserId,
      'appointmentConfirmed',
      'Appointment confirmed',
      'The secretary confirmed the appointment.',
    );
    const { queueAppointmentWhatsApp } = await import('./whatsapp.mock');
    queueAppointmentWhatsApp(mockAppointments[index]);

    return mockAppointments[index];
  },

  async checkIn(id: string): Promise<Appointment> {
    await sleep(400);
    const index = mockAppointments.findIndex((item) => item.id === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Appointment not found' };
    const appointment = mockAppointments[index];
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw { code: 'INVALID_STATUS', message: 'Only a confirmed appointment can be checked in' };
    }
    if (!isSameCalendarDay(appointment.scheduledAt)) {
      throw { code: 'NOT_TODAY', message: 'Check-in is only available on the appointment day' };
    }
    if (appointment.queue) return appointment;

    const todayNumbers = mockAppointments
      .filter(
        (item) =>
          item.clinicId === appointment.clinicId &&
          item.arrivedAt &&
          isSameCalendarDay(item.arrivedAt) &&
          item.queueNumber,
      )
      .map((item) => item.queueNumber ?? 0);
    const queueNumber = (todayNumbers.length ? Math.max(...todayNumbers) : 0) + 1;
    mockAppointments[index] = {
      ...appointment,
      queue: 'waiting',
      queueNumber,
      arrivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const { issueInvoiceForAppointment } = await import('./invoices.mock');
    issueInvoiceForAppointment(mockAppointments[index]);
    return mockAppointments[index];
  },

  async callNext(clinicId: string): Promise<Appointment[]> {
    await sleep(300);
    const room = mockAppointments.filter(
      (item) => item.clinicId === clinicId && item.arrivedAt && isSameCalendarDay(item.arrivedAt) && item.queue,
    );
    const serving = room.find((item) => item.queue === 'serving');
    if (serving) {
      const index = mockAppointments.findIndex((item) => item.id === serving.id);
      mockAppointments[index] = { ...serving, queue: 'done', updatedAt: new Date().toISOString() };
    }
    const next = room
      .filter((item) => item.queue === 'waiting')
      .sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0))[0];
    if (next) {
      const index = mockAppointments.findIndex((item) => item.id === next.id);
      mockAppointments[index] = { ...next, queue: 'serving', updatedAt: new Date().toISOString() };
    }
    return this.queue(clinicId);
  },

  async queue(clinicId: string): Promise<Appointment[]> {
    await sleep(200);
    return mockAppointments
      .filter(
        (item) =>
          item.clinicId === clinicId &&
          item.arrivedAt &&
          isSameCalendarDay(item.arrivedAt) &&
          (item.queue === 'waiting' || item.queue === 'serving'),
      )
      .sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0));
  },

  async markNoShow(id: string, actorUserId?: string): Promise<Appointment> {
    await sleep(500);
    const index = mockAppointments.findIndex((item) => item.id === id);
    if (index === -1) {
      throw { code: 'NOT_FOUND', message: 'Appointment not found' };
    }

    const appointment = mockAppointments[index];
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw { code: 'INVALID_STATUS', message: 'Only a confirmed appointment can be marked as a no-show' };
    }

    mockAppointments[index] = {
      ...appointment,
      status: AppointmentStatus.NO_SHOW,
      updatedAt: new Date().toISOString(),
    };
    await notifyOthers(
      mockAppointments[index],
      actorUserId,
      'appointmentNoShow',
      'Patient did not show',
      'The patient did not attend the appointment.',
    );

    return mockAppointments[index];
  },

  async reschedule(
    id: string,
    scheduledAt: string,
    by?: 'secretary' | 'patient',
    actorUserId?: string,
  ): Promise<Appointment> {
    await sleep(500);
    const index = mockAppointments.findIndex((item) => item.id === id);
    if (index === -1) {
      throw { code: 'NOT_FOUND', message: 'Appointment not found' };
    }

    const appointment = mockAppointments[index];
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(appointment.status)) {
      throw { code: 'INVALID_STATUS', message: 'This appointment cannot be rescheduled' };
    }
    if (slotIsTaken(appointment.doctorId, scheduledAt, appointment.id)) {
      throw { code: 'SLOT_TAKEN', message: 'السلوت ده محجوز' };
    }

    const awaiting = by === 'secretary' ? 'patient' : 'secretary';
    mockAppointments[index] = {
      ...appointment,
      scheduledAt,
      status: AppointmentStatus.SCHEDULED,
      awaiting,
      updatedAt: new Date().toISOString(),
    };
    await notifyOthers(
      mockAppointments[index],
      actorUserId,
      by === 'secretary' ? 'appointmentProposed' : 'appointmentAwaiting',
      by === 'secretary' ? 'New time proposed' : 'Patient replied',
      by === 'secretary'
        ? 'The secretary proposed another time.'
        : 'The patient sent the time back to the secretary.',
    );

    return mockAppointments[index];
  },

  async create(payload: CreateAppointmentPayload, patientUserId: string, patientName: { firstName: string; lastName: string }): Promise<Appointment> {
    await sleep(600);
    const doctor = getMockDoctorById(payload.doctorId);
    if (!doctor) throw { code: 'NOT_FOUND', message: 'Doctor not found' };

    const { mockPatientsService } = await import('./patients.mock');
    let resolvedPatientId = payload.patientId ?? patientUserId;
    let resolvedName = patientName;

    if (payload.patientId) {
      try {
        const patient = await mockPatientsService.getById(payload.patientId);
        resolvedPatientId = patient.id;
        resolvedName = { firstName: patient.firstName, lastName: patient.lastName };
      } catch {
        resolvedPatientId = payload.patientId;
      }
    }

    const durationMinutes = payload.durationMinutes ?? 30;
    if (slotIsTaken(payload.doctorId, payload.scheduledAt)) {
      throw { code: 'SLOT_TAKEN', message: 'السلوت ده محجوز' };
    }

    const desk = Boolean(payload.desk);
    const appointment = buildAppointment({
      id: `appt-${Date.now()}`,
      doctorId: payload.doctorId,
      patientId: resolvedPatientId,
      branchId: payload.branchId,
      branchName: doctor.branchName,
      scheduledAt: payload.scheduledAt,
      durationMinutes,
      status: desk ? AppointmentStatus.CONFIRMED : AppointmentStatus.SCHEDULED,
      source: desk ? 'desk' : 'online',
      awaiting: desk ? undefined : 'secretary',
      reason: payload.reason,
      notes: payload.notes,
      doctor: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialty: doctor.specialty,
      },
      patient: { id: resolvedPatientId, firstName: resolvedName.firstName, lastName: resolvedName.lastName },
    }, doctor.clinicId);

    mockAppointments.unshift(appointment);
    await notifyOthers(
      appointment,
      desk ? undefined : resolvedPatientId,
      desk ? 'appointmentConfirmed' : 'newAppointment',
      desk ? 'Desk booking' : 'New appointment',
      desk ? 'A walk-in was booked at reception.' : 'A patient booked online and is waiting for the secretary.',
    );
    if (desk) {
      const { queueAppointmentWhatsApp } = await import('./whatsapp.mock');
      queueAppointmentWhatsApp(appointment);
    }
    return appointment;
  },
};
