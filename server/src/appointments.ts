import { randomUUID } from 'node:crypto';

import { db } from './db.js';
import { ensureBookingPatient } from './users.js';
import { isSameClinicDay } from './clinic-time.js';
import { ensureInvoice, voidOpenInvoice } from './invoices.js';
import { notifySavedAppointment } from './notifications.js';
import {
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  queueAppointmentRequest,
  queueAppointmentWhatsApp,
} from './whatsapp.js';

type AppointmentRow = {
  id: string;
  clinic_id: string;
  doctor_id: string;
  patient_id: string;
  branch_id: string;
  branch_name: string;
  scheduled_at: string | Date;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
  source: string | null;
  awaiting: string | null;
  queue: string | null;
  queue_number: number | null;
  arrived_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty: string;
  doctor_user_id: string | null;
  patient_first_name: string;
  patient_last_name: string;
  patient_user_id: string | null;
};

export type PublicAppointment = {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  branchId: string;
  branchName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  reason?: string;
  notes?: string;
  source?: 'online' | 'desk';
  awaiting?: 'secretary' | 'patient';
  queue?: 'waiting' | 'serving' | 'done';
  queueNumber?: number;
  arrivedAt?: string;
  doctor: { id: string; firstName: string; lastName: string; specialty?: string };
  patient: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
};

const OPEN_STATUSES = ['scheduled', 'confirmed', 'in_progress'];
const SELECT_APPOINTMENT = `
  SELECT a.*,
         d.first_name AS doctor_first_name,
         d.last_name AS doctor_last_name,
         d.specialty AS doctor_specialty,
         d.user_id AS doctor_user_id,
         p.first_name AS patient_first_name,
         p.last_name AS patient_last_name,
         p.user_id AS patient_user_id
  FROM appointments a
  JOIN doctors d ON d.id = a.doctor_id
  JOIN patients p ON p.id = a.patient_id
`;

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function iso(value: string | Date): string {
  return asDate(value).toISOString();
}

function isSameDay(a: Date, b: Date): boolean {
  return isSameClinicDay(a, b);
}

function isoAt(hours: number, minutes: number, dayOffset: number): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}

function toPublic(row: AppointmentRow): PublicAppointment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    branchId: row.branch_id,
    branchName: row.branch_name,
    scheduledAt: iso(row.scheduled_at),
    durationMinutes: row.duration_minutes,
    status: row.status,
    reason: row.reason ?? undefined,
    notes: row.notes ?? undefined,
    source: row.source === 'online' || row.source === 'desk' ? row.source : undefined,
    awaiting: row.awaiting === 'secretary' || row.awaiting === 'patient' ? row.awaiting : undefined,
    queue: row.queue === 'waiting' || row.queue === 'serving' || row.queue === 'done' ? row.queue : undefined,
    queueNumber: row.queue_number ?? undefined,
    arrivedAt: row.arrived_at ? iso(row.arrived_at) : undefined,
    doctor: {
      id: row.doctor_id,
      firstName: row.doctor_first_name,
      lastName: row.doctor_last_name,
      specialty: row.doctor_specialty,
    },
    patient: {
      id: row.patient_id,
      firstName: row.patient_first_name,
      lastName: row.patient_last_name,
    },
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

async function rolesAt(userId: string, clinicId: string): Promise<string[]> {
  const result = await db.query<{ role: string }>(
    'SELECT role FROM memberships WHERE user_id = $1 AND clinic_id = $2',
    [userId, clinicId],
  );
  return result.rows.map((row) => row.role);
}

async function requireMember(userId: string, clinicId: string): Promise<string[]> {
  const roles = await rolesAt(userId, clinicId);
  if (roles.length === 0) throw httpError(403, 'FORBIDDEN', 'You are not a member of this clinic');
  return roles;
}

function managesClinic(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('secretary');
}

function canSee(roles: string[], callerId: string, row: AppointmentRow): boolean {
  if (roles.some((role) => role === 'admin' || role === 'secretary' || role === 'nurse' || role === 'nursing_admin')) {
    return true;
  }
  if (roles.includes('doctor') && (row.doctor_id === callerId || row.doctor_user_id === callerId)) return true;
  if (roles.includes('patient') && (row.patient_id === callerId || row.patient_user_id === callerId)) return true;
  return false;
}

async function rowsForClinic(clinicId: string): Promise<AppointmentRow[]> {
  const result = await db.query<AppointmentRow>(
    `${SELECT_APPOINTMENT} WHERE a.clinic_id = $1 ORDER BY a.scheduled_at`,
    [clinicId],
  );
  return result.rows;
}

async function rowById(id: string): Promise<AppointmentRow | undefined> {
  const result = await db.query<AppointmentRow>(`${SELECT_APPOINTMENT} WHERE a.id = $1`, [id]);
  return result.rows[0];
}

async function requireVisible(userId: string, id: string): Promise<AppointmentRow> {
  const row = await rowById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Appointment not found');
  const roles = await requireMember(userId, row.clinic_id);
  if (!canSee(roles, userId, row)) throw httpError(403, 'FORBIDDEN', 'You cannot open this appointment');
  return row;
}

function slotIsTaken(rows: AppointmentRow[], doctorId: string, scheduledAt: string, durationMinutes: number, ignoreId?: string): boolean {
  const start = new Date(scheduledAt).getTime();
  if (Number.isNaN(start)) return false;
  return rows.some((row) => {
    if (row.id === ignoreId || row.doctor_id !== doctorId) return false;
    if (!OPEN_STATUSES.includes(row.status)) return false;
    const distance = Math.abs(asDate(row.scheduled_at).getTime() - start);
    return distance < Math.max(row.duration_minutes, durationMinutes) * 60 * 1000;
  });
}

export async function occupiedSlotIsos(doctorId: string): Promise<string[]> {
  const result = await db.query<{ scheduled_at: string | Date }>(
    `SELECT scheduled_at FROM appointments
     WHERE doctor_id = $1 AND status IN ('scheduled', 'confirmed', 'in_progress')`,
    [doctorId],
  );
  return result.rows.map((row) => iso(row.scheduled_at));
}

export async function seedAppointments(): Promise<void> {
  const seeds = [
    ['appt-001', 'clinic-001', 'user-doctor-001', 'patient-001', 'branch-001', 'Main Clinic', isoAt(9, 0, 0), 30, 'confirmed', 'General checkup'],
    ['appt-002', 'clinic-001', 'user-doctor-001', 'patient-002', 'branch-001', 'Main Clinic', isoAt(11, 30, 0), 45, 'scheduled', 'Follow-up consultation'],
    ['appt-003', 'clinic-001', 'user-doctor-001', 'patient-001', 'branch-001', 'Main Clinic', isoAt(14, 0, 1), 30, 'confirmed', 'Lab results review'],
    ['appt-004', 'clinic-001', 'user-doctor-001', 'patient-002', 'branch-001', 'Main Clinic', isoAt(10, 0, 3), 30, 'scheduled', 'Annual physical'],
    ['appt-005', 'clinic-001', 'user-doctor-001', 'patient-001', 'branch-001', 'Main Clinic', isoAt(16, 0, -2), 30, 'completed', 'Blood pressure check'],
    ['appt-006', 'clinic-001', 'user-doctor-001', 'patient-002', 'branch-001', 'Main Clinic', isoAt(9, 30, -5), 30, 'cancelled', 'Skin rash'],
    ['appt-007', 'clinic-002', 'user-doctor-005', 'patient-004', 'branch-downtown', 'Downtown Branch', isoAt(10, 0, 0), 30, 'confirmed', 'Knee pain evaluation'],
    ['appt-008', 'clinic-002', 'user-doctor-005', 'patient-004', 'branch-downtown', 'Downtown Branch', isoAt(15, 0, 2), 30, 'scheduled', 'Follow-up orthopedics'],
    ['appt-009', 'clinic-002', 'user-doctor-006', 'patient-004', 'branch-downtown', 'Downtown Branch', isoAt(11, 0, -3), 30, 'completed', 'Asthma review'],
  ] as const;

  for (const [id, clinicId, doctorId, patientId, branchId, branchName, scheduledAt, duration, status, reason] of seeds) {
    const awaiting = status === 'scheduled' ? 'secretary' : null;
    const source = status === 'scheduled' ? 'online' : null;
    await db.query(
      `INSERT INTO appointments (
         id, clinic_id, doctor_id, patient_id, branch_id, branch_name, scheduled_at,
         duration_minutes, status, reason, source, awaiting
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [id, clinicId, doctorId, patientId, branchId, branchName, scheduledAt, duration, status, reason, source, awaiting],
    );
  }
}

export async function listAppointments(
  userId: string,
  filters: {
    clinicId: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    doctorId?: string;
    patientId?: string;
    scope?: 'today' | 'upcoming' | 'past' | 'all';
    page?: number;
    limit?: number;
  },
): Promise<{ data: PublicAppointment[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const roles = await requireMember(userId, filters.clinicId);
  let doctorId = filters.doctorId?.trim() ?? '';
  let patientId = filters.patientId?.trim() ?? '';
  const manager = managesClinic(roles);
  if (!manager && roles.includes('patient') && !roles.includes('doctor')) {
    patientId = userId;
    doctorId = '';
  } else if (!manager && roles.includes('doctor')) {
    if (doctorId && doctorId !== userId) throw httpError(403, 'FORBIDDEN', 'You can only see your own appointments');
    doctorId = userId;
  }

  const now = new Date();
  let rows = await rowsForClinic(filters.clinicId);
  if (doctorId) {
    rows = rows.filter((row) => row.doctor_id === doctorId || row.doctor_user_id === doctorId);
  }
  if (patientId) {
    rows = rows.filter((row) => row.patient_id === patientId || row.patient_user_id === patientId);
  }
  if (filters.status) {
    rows = rows.filter((row) => row.status === filters.status);
  }
  if (filters.scope === 'today') {
    rows = rows.filter((row) => isSameDay(asDate(row.scheduled_at), now));
  } else if (filters.scope === 'upcoming') {
    rows = rows.filter(
      (row) => asDate(row.scheduled_at) >= now && row.status !== 'cancelled' && row.status !== 'completed',
    );
  } else if (filters.scope === 'past') {
    rows = rows.filter(
      (row) =>
        asDate(row.scheduled_at) < now || row.status === 'completed' || row.status === 'cancelled' || row.status === 'no_show',
    );
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    rows = rows.filter((row) => asDate(row.scheduled_at) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    rows = rows.filter((row) => asDate(row.scheduled_at) <= to);
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit).map(toPublic);
  return {
    data,
    meta: { page, limit, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) },
  };
}

export async function getAppointment(userId: string, id: string): Promise<PublicAppointment> {
  return toPublic(await requireVisible(userId, id));
}

export async function createAppointment(
  userId: string,
  input: {
    doctorId: string;
    branchId: string;
    scheduledAt: string;
    durationMinutes?: number;
    reason: string;
    notes?: string;
    patientId?: string;
    desk?: boolean;
  },
): Promise<PublicAppointment> {
  const when = new Date(input.scheduledAt);
  if (Number.isNaN(when.getTime())) throw httpError(400, 'VALIDATION_ERROR', 'Appointment time is invalid');

  const doctorResult = await db.query<{ id: string; clinic_id: string; branch_id: string; branch_name: string }>(
    'SELECT id, clinic_id, branch_id, branch_name FROM doctors WHERE (id = $1 OR user_id = $1) AND is_active = true ORDER BY id LIMIT 1',
    [input.doctorId],
  );
  const doctor = doctorResult.rows[0];
  if (!doctor) throw httpError(404, 'NOT_FOUND', 'Doctor not found');

  await ensureBookingPatient(userId, doctor.clinic_id);
  const roles = await requireMember(userId, doctor.clinic_id);
  const manager = managesClinic(roles);
  const desk = Boolean(input.desk) && manager;
  if (!manager && !roles.includes('patient')) {
    throw httpError(403, 'FORBIDDEN', 'Only a patient or the clinic staff can book');
  }

  const requestedPatient = input.patientId?.trim() || (desk ? '' : userId);
  if (!requestedPatient) throw httpError(400, 'VALIDATION_ERROR', 'Patient is required');
  const patientResult = await db.query<{ id: string; user_id: string | null }>(
    `SELECT id, user_id FROM patients
     WHERE clinic_id = $1 AND is_active = true AND (id = $2 OR user_id = $2)
     ORDER BY id LIMIT 1`,
    [doctor.clinic_id, requestedPatient],
  );
  const patient = patientResult.rows[0];
  if (!patient) throw httpError(404, 'NOT_FOUND', 'Patient file not found');
  if (!manager && patient.user_id !== userId) {
    throw httpError(403, 'FORBIDDEN', 'You can only book for your own file');
  }

  const duration = input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : 30;
  const existing = await rowsForClinic(doctor.clinic_id);
  if (slotIsTaken(existing, doctor.id, input.scheduledAt, duration)) {
    throw httpError(409, 'SLOT_TAKEN', 'السلوت ده محجوز');
  }

  const id = `appt-${randomUUID()}`;
  await db.query(
    `INSERT INTO appointments (
       id, clinic_id, doctor_id, patient_id, branch_id, branch_name, scheduled_at,
       duration_minutes, status, reason, notes, source, awaiting
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      id,
      doctor.clinic_id,
      doctor.id,
      patient.id,
      input.branchId || doctor.branch_id,
      doctor.branch_name,
      when.toISOString(),
      duration,
      desk ? 'confirmed' : 'scheduled',
      input.reason.trim(),
      input.notes?.trim() || null,
      desk ? 'desk' : 'online',
      desk ? null : 'secretary',
    ],
  );
  const created = toPublic((await rowById(id))!);
  if (desk) await queueAppointmentWhatsApp(created, true);
  else await queueAppointmentRequest(created);
  await notifySavedAppointment(
    userId,
    created.id,
    desk ? 'appointmentConfirmed' : 'newAppointment',
    desk ? 'تم تأكيد الموعد' : 'موعد جديد',
    desk ? 'تم حجز الميعاد من الاستقبال' : 'تم حجز ميعاد جديد',
  );
  return created;
}

export async function confirmAppointment(userId: string, id: string): Promise<PublicAppointment> {
  const row = await requireVisible(userId, id);
  const roles = await rolesAt(userId, row.clinic_id);
  if (!managesClinic(roles)) throw httpError(403, 'FORBIDDEN', 'Only the secretary or admin can confirm');
  if (row.status !== 'scheduled') {
    throw httpError(400, 'INVALID_STATUS', 'Only scheduled appointments can be confirmed');
  }
  if (row.awaiting === 'patient') {
    throw httpError(400, 'AWAITING_PATIENT', 'المريض لازم يوافق على الوقت الاول');
  }
  await db.query(
    `UPDATE appointments SET status = 'confirmed', awaiting = NULL, updated_at = now() WHERE id = $1`,
    [id],
  );
  const confirmed = toPublic((await rowById(id))!);
  await queueAppointmentWhatsApp(confirmed, true);
  await notifySavedAppointment(userId, confirmed.id, 'appointmentConfirmed', 'تم تأكيد الموعد', 'تم تأكيد الميعاد');
  return confirmed;
}

export async function cancelAppointment(userId: string, id: string): Promise<PublicAppointment> {
  const row = await requireVisible(userId, id);
  const roles = await rolesAt(userId, row.clinic_id);
  const ownPatient = row.patient_id === userId || row.patient_user_id === userId;
  const ownDoctor = row.doctor_id === userId || row.doctor_user_id === userId;
  const allowed = managesClinic(roles) || (roles.includes('patient') && ownPatient) || (roles.includes('doctor') && ownDoctor);
  if (!allowed) throw httpError(403, 'FORBIDDEN', 'You cannot cancel this appointment');
  if (['completed', 'cancelled', 'in_progress', 'no_show'].includes(row.status)) {
    throw httpError(400, 'INVALID_STATUS', 'This appointment cannot be cancelled');
  }
  await db.query(
    `UPDATE appointments
     SET status = 'cancelled', awaiting = NULL, queue = NULL, updated_at = now()
     WHERE id = $1`,
    [id],
  );
  await voidOpenInvoice(id);
  const cancelled = toPublic((await rowById(id))!);
  await notifyAppointmentCancelled(cancelled);
  await notifySavedAppointment(userId, id, 'appointmentCancelled', 'الموعد اتلغى', 'اتلغى الموعد');
  return cancelled;
}

export async function markNoShow(userId: string, id: string): Promise<PublicAppointment> {
  const row = await requireVisible(userId, id);
  const roles = await rolesAt(userId, row.clinic_id);
  if (!managesClinic(roles)) throw httpError(403, 'FORBIDDEN', 'Only the secretary or admin can mark a no-show');
  if (row.status !== 'confirmed') {
    throw httpError(400, 'INVALID_STATUS', 'Only a confirmed appointment can be marked as a no-show');
  }
  if (row.queue || row.arrived_at) {
    throw httpError(400, 'INVALID_STATUS', 'A checked-in appointment cannot be marked as a no-show');
  }
  await db.query(`UPDATE appointments SET status = 'no_show', updated_at = now() WHERE id = $1`, [id]);
  return toPublic((await rowById(id))!);
}

export async function rescheduleAppointment(
  userId: string,
  id: string,
  input: { scheduledAt: string; by?: 'secretary' | 'patient' },
): Promise<PublicAppointment> {
  const row = await requireVisible(userId, id);
  const when = new Date(input.scheduledAt);
  if (Number.isNaN(when.getTime())) throw httpError(400, 'VALIDATION_ERROR', 'Appointment time is invalid');
  const roles = await rolesAt(userId, row.clinic_id);
  const ownPatient = roles.includes('patient') && (row.patient_id === userId || row.patient_user_id === userId);
  if (!managesClinic(roles) && !ownPatient) {
    throw httpError(403, 'FORBIDDEN', 'You cannot reschedule this appointment');
  }
  if (['completed', 'cancelled', 'in_progress', 'no_show'].includes(row.status)) {
    throw httpError(400, 'INVALID_STATUS', 'This appointment cannot be rescheduled');
  }
  const existing = await rowsForClinic(row.clinic_id);
  if (slotIsTaken(existing, row.doctor_id, input.scheduledAt, row.duration_minutes, row.id)) {
    throw httpError(409, 'SLOT_TAKEN', 'السلوت ده محجوز');
  }
  const by = ownPatient && !managesClinic(roles) ? 'patient' : input.by === 'patient' ? 'patient' : 'secretary';
  await db.query(
    `UPDATE appointments
     SET scheduled_at = $2, status = 'scheduled', awaiting = $3, updated_at = now()
     WHERE id = $1`,
    [id, when.toISOString(), by === 'secretary' ? 'patient' : 'secretary'],
  );
  const moved = toPublic((await rowById(id))!);
  await notifyAppointmentRescheduled(moved);
  return moved;
}

export async function checkInAppointment(userId: string, id: string): Promise<PublicAppointment> {
  const row = await requireVisible(userId, id);
  const roles = await rolesAt(userId, row.clinic_id);
  if (!managesClinic(roles)) throw httpError(403, 'FORBIDDEN', 'Only the secretary or admin can check in');
  if (row.status !== 'confirmed') {
    throw httpError(400, 'INVALID_STATUS', 'Only a confirmed appointment can be checked in');
  }
  if (!isSameDay(asDate(row.scheduled_at), new Date())) {
    throw httpError(400, 'NOT_TODAY', 'Check-in is only available on the appointment day');
  }
  if (!row.queue) {
    const today = (await rowsForClinic(row.clinic_id)).filter(
      (item) => item.arrived_at && isSameDay(asDate(item.arrived_at), new Date()) && item.queue_number,
    );
    const queueNumber = (today.length ? Math.max(...today.map((item) => item.queue_number ?? 0)) : 0) + 1;
    await db.query(
      `UPDATE appointments
       SET queue = 'waiting', queue_number = $2, arrived_at = now(), updated_at = now()
       WHERE id = $1`,
      [id, queueNumber],
    );
  }
  await ensureInvoice(id);
  return toPublic((await rowById(id))!);
}

export async function queueAppointments(userId: string, clinicId: string): Promise<PublicAppointment[]> {
  await requireMember(userId, clinicId);
  const now = new Date();
  return (await rowsForClinic(clinicId))
    .filter(
      (row) =>
        row.arrived_at &&
        isSameDay(asDate(row.arrived_at), now) &&
        (row.queue === 'waiting' || row.queue === 'serving'),
    )
    .sort((a, b) => (a.queue_number ?? 0) - (b.queue_number ?? 0))
    .map(toPublic);
}

export async function callNextAppointment(userId: string, clinicId: string): Promise<PublicAppointment[]> {
  const roles = await requireMember(userId, clinicId);
  if (!managesClinic(roles)) throw httpError(403, 'FORBIDDEN', 'Only the secretary or admin can call the next patient');
  const now = new Date();
  const room = (await rowsForClinic(clinicId)).filter(
    (row) => row.arrived_at && isSameDay(asDate(row.arrived_at), now) && row.queue,
  );
  const serving = room.find((row) => row.queue === 'serving');
  if (serving) {
    await db.query(`UPDATE appointments SET queue = 'done', updated_at = now() WHERE id = $1`, [serving.id]);
  }
  const next = room
    .filter((row) => row.queue === 'waiting')
    .sort((a, b) => (a.queue_number ?? 0) - (b.queue_number ?? 0))[0];
  if (next) {
    await db.query(`UPDATE appointments SET queue = 'serving', updated_at = now() WHERE id = $1`, [next.id]);
  }
  return queueAppointments(userId, clinicId);
}
