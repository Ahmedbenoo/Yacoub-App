import { randomUUID } from 'node:crypto';

import { db } from './db.js';
import { isSameClinicDay } from './clinic-time.js';

type InvoiceRow = {
  id: string;
  appointment_id: string;
  clinic_id: string;
  doctor_id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  amount: number;
  doctor_share_percent: number;
  doctor_share: number;
  clinic_share: number;
  payment_method: string | null;
  status: string;
  paid_at: string | Date | null;
  created_at: string | Date;
};

export type PublicInvoice = {
  id: string;
  appointmentId: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  amount: number;
  doctorSharePercent: number;
  doctorShare: number;
  clinicShare: number;
  paymentMethod?: 'cash' | 'instapay' | 'wallet';
  status: 'open' | 'paid' | 'void';
  createdAt: string;
  paidAt?: string;
};

type AppointmentContext = {
  id: string;
  clinic_id: string;
  doctor_id: string;
  patient_id: string;
  status: string;
  doctor_user_id: string | null;
  patient_user_id: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
  patient_first_name: string;
  patient_last_name: string;
  share_percent: number | null;
  consultation_fee: number | null;
};

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function isSameDay(value: string | Date, day = new Date()): boolean {
  return isSameClinicDay(value, day);
}

function toPublic(row: InvoiceRow): PublicInvoice {
  const method = row.payment_method;
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    clinicId: row.clinic_id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    doctorName: row.doctor_name,
    amount: Number(row.amount),
    doctorSharePercent: Number(row.doctor_share_percent),
    doctorShare: Number(row.doctor_share),
    clinicShare: Number(row.clinic_share),
    paymentMethod: method === 'cash' || method === 'instapay' || method === 'wallet' ? method : undefined,
    status: row.status === 'paid' || row.status === 'void' ? row.status : 'open',
    createdAt: iso(row.created_at),
    paidAt: row.paid_at ? iso(row.paid_at) : undefined,
  };
}

function hideShare(invoice: PublicInvoice): PublicInvoice {
  return { ...invoice, doctorSharePercent: 0, doctorShare: 0, clinicShare: 0 };
}

async function rolesAt(userId: string, clinicId: string): Promise<string[]> {
  const result = await db.query<{ role: string }>(
    'SELECT role FROM memberships WHERE user_id = $1 AND clinic_id = $2',
    [userId, clinicId],
  );
  return result.rows.map((row) => row.role);
}

async function appointmentContext(appointmentId: string): Promise<AppointmentContext | undefined> {
  const result = await db.query<AppointmentContext>(
    `SELECT a.id, a.clinic_id, a.doctor_id, a.patient_id, a.status,
            d.user_id AS doctor_user_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
            d.share_percent, p.user_id AS patient_user_id, p.first_name AS patient_first_name,
            p.last_name AS patient_last_name, c.consultation_fee
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN patients p ON p.id = a.patient_id
     JOIN clinics c ON c.id = a.clinic_id
     WHERE a.id = $1`,
    [appointmentId],
  );
  return result.rows[0];
}

function canSeeAppointment(roles: string[], userId: string, row: AppointmentContext): boolean {
  if (roles.some((role) => role === 'admin' || role === 'secretary' || role === 'nurse' || role === 'nursing_admin')) {
    return true;
  }
  if (roles.includes('doctor') && (row.doctor_id === userId || row.doctor_user_id === userId)) return true;
  if (roles.includes('patient') && (row.patient_id === userId || row.patient_user_id === userId)) return true;
  return false;
}

function canSeeShare(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('doctor');
}

async function currentInvoice(appointmentId: string): Promise<InvoiceRow | undefined> {
  const result = await db.query<InvoiceRow>(
    `SELECT * FROM invoices
     WHERE appointment_id = $1 AND status <> 'void'
     ORDER BY created_at DESC
     LIMIT 1`,
    [appointmentId],
  );
  return result.rows[0];
}

export async function ensureInvoice(appointmentId: string): Promise<PublicInvoice> {
  const existing = await currentInvoice(appointmentId);
  if (existing) return toPublic(existing);

  const appointment = await appointmentContext(appointmentId);
  if (!appointment) throw httpError(404, 'NOT_FOUND', 'Appointment not found');
  if (!['confirmed', 'in_progress', 'completed'].includes(appointment.status)) {
    throw httpError(400, 'INVALID_STATUS', 'An invoice can be issued for a confirmed appointment');
  }

  const amount = Number(appointment.consultation_fee ?? 0);
  const sharePercent = Math.min(100, Math.max(0, Math.round(Number(appointment.share_percent ?? 60))));
  const doctorShare = Math.round((amount * sharePercent) / 100);
  const id = `inv-${randomUUID()}`;
  await db.query(
    `INSERT INTO invoices (
       id, appointment_id, clinic_id, doctor_id, patient_id, patient_name, doctor_name,
       amount, doctor_share_percent, doctor_share, clinic_share, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'open')`,
    [
      id,
      appointment.id,
      appointment.clinic_id,
      appointment.doctor_id,
      appointment.patient_id,
      `${appointment.patient_first_name} ${appointment.patient_last_name}`.trim(),
      `${appointment.doctor_first_name} ${appointment.doctor_last_name}`.trim(),
      amount,
      sharePercent,
      doctorShare,
      amount - doctorShare,
    ],
  );
  const created = await currentInvoice(appointmentId);
  if (!created) throw httpError(500, 'UNKNOWN_ERROR', 'Invoice was not saved');
  return toPublic(created);
}

export async function voidOpenInvoice(appointmentId: string): Promise<void> {
  await db.query(
    `UPDATE invoices SET status = 'void' WHERE appointment_id = $1 AND status = 'open'`,
    [appointmentId],
  );
}

export async function getInvoiceForAppointment(userId: string, appointmentId: string): Promise<PublicInvoice | null> {
  const appointment = await appointmentContext(appointmentId);
  if (!appointment) throw httpError(404, 'NOT_FOUND', 'Appointment not found');
  const roles = await rolesAt(userId, appointment.clinic_id);
  if (!canSeeAppointment(roles, userId, appointment)) {
    throw httpError(403, 'FORBIDDEN', 'You cannot open this invoice');
  }
  const row = await currentInvoice(appointmentId);
  if (!row) return null;
  const invoice = toPublic(row);
  return canSeeShare(roles) ? invoice : hideShare(invoice);
}

export async function issueInvoice(userId: string, appointmentId: string): Promise<PublicInvoice> {
  const appointment = await appointmentContext(appointmentId);
  if (!appointment) throw httpError(404, 'NOT_FOUND', 'Appointment not found');
  const roles = await rolesAt(userId, appointment.clinic_id);
  if (!roles.includes('admin') && !roles.includes('secretary')) {
    throw httpError(403, 'FORBIDDEN', 'Only the secretary or admin can issue an invoice');
  }
  const invoice = await ensureInvoice(appointmentId);
  return canSeeShare(roles) ? invoice : hideShare(invoice);
}

export async function payInvoice(
  userId: string,
  appointmentId: string,
  paymentMethod: 'cash' | 'instapay' | 'wallet',
): Promise<PublicInvoice> {
  const appointment = await appointmentContext(appointmentId);
  if (!appointment) throw httpError(404, 'NOT_FOUND', 'Appointment not found');
  const roles = await rolesAt(userId, appointment.clinic_id);
  if (!roles.includes('admin') && !roles.includes('secretary')) {
    throw httpError(403, 'FORBIDDEN', 'Only the secretary or admin can record a payment');
  }
  const row = await currentInvoice(appointmentId);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Invoice not found');
  if (row.status !== 'paid') {
    await db.query(
      `UPDATE invoices SET status = 'paid', payment_method = $2, paid_at = now() WHERE id = $1`,
      [row.id, paymentMethod],
    );
  }
  const paid = await currentInvoice(appointmentId);
  if (!paid) throw httpError(404, 'NOT_FOUND', 'Invoice not found');
  const invoice = toPublic(paid);
  return canSeeShare(roles) ? invoice : hideShare(invoice);
}

async function todayInvoices(clinicId: string): Promise<PublicInvoice[]> {
  const result = await db.query<InvoiceRow>(
    `SELECT * FROM invoices WHERE clinic_id = $1 AND status <> 'void' ORDER BY created_at`,
    [clinicId],
  );
  const now = new Date();
  return result.rows.map(toPublic).filter((invoice) => isSameDay(invoice.paidAt ?? invoice.createdAt, now));
}

async function requireMoneyReader(userId: string, clinicId: string): Promise<void> {
  const roles = await rolesAt(userId, clinicId);
  if (!roles.some((role) => role === 'admin' || role === 'secretary' || role === 'doctor')) {
    throw httpError(403, 'FORBIDDEN', 'You cannot open the day close');
  }
}

export async function listTodayInvoices(userId: string, clinicId: string): Promise<PublicInvoice[]> {
  await requireMoneyReader(userId, clinicId);
  return todayInvoices(clinicId);
}

export async function dayClose(userId: string, clinicId: string) {
  await requireMoneyReader(userId, clinicId);
  const rows = await todayInvoices(clinicId);
  const paid = rows.filter((item) => item.status === 'paid');
  const open = rows.filter((item) => item.status === 'open');
  const byDoctor = new Map<string, {
    doctorId: string;
    doctorName: string;
    sharePercent: number;
    amount: number;
    doctorShare: number;
    clinicShare: number;
  }>();
  for (const invoice of paid) {
    const current = byDoctor.get(invoice.doctorId) ?? {
      doctorId: invoice.doctorId,
      doctorName: invoice.doctorName,
      sharePercent: invoice.doctorSharePercent,
      amount: 0,
      doctorShare: 0,
      clinicShare: 0,
    };
    current.amount += invoice.amount;
    current.doctorShare += invoice.doctorShare;
    current.clinicShare += invoice.clinicShare;
    current.sharePercent = invoice.doctorSharePercent;
    byDoctor.set(invoice.doctorId, current);
  }
  return {
    collected: paid.reduce((sum, item) => sum + item.amount, 0),
    open: open.reduce((sum, item) => sum + item.amount, 0),
    doctorShare: paid.reduce((sum, item) => sum + item.doctorShare, 0),
    clinicShare: paid.reduce((sum, item) => sum + item.clinicShare, 0),
    invoiceCount: paid.length,
    doctors: [...byDoctor.values()],
  };
}
