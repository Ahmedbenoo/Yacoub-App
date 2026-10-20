import { randomUUID } from 'node:crypto';

import { db } from './db.js';

export function digitsPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `20${digits.slice(1)}`;
  return digits;
}

type QueuedAppointment = {
  id: string;
  clinicId: string;
  patientId: string;
  scheduledAt: string;
  branchName: string;
  doctor: { firstName: string; lastName: string };
};

type MessageRow = {
  id: string;
  appointment_id: string;
  clinic_id: string;
  patient_id: string;
  kind: string;
  body: string;
  status: string;
  scheduled_for: string | Date;
  sent_at: string | Date | null;
};

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function formatWhen(isoValue: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoValue));
}

function dayWord(appointmentAt: string, reference: Date): string {
  const appointmentDay = new Date(appointmentAt);
  const referenceDay = new Date(reference);
  appointmentDay.setHours(0, 0, 0, 0);
  referenceDay.setHours(0, 0, 0, 0);
  const offset = Math.round((appointmentDay.getTime() - referenceDay.getTime()) / (24 * 60 * 60 * 1000));
  if (offset === 0) return 'النهاردة';
  if (offset === 1) return 'بكرة';
  return '';
}

function messageBody(
  appointment: QueuedAppointment,
  kind: 'request' | 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
  reference = new Date(),
): string {
  const doctor = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`.trim();
  const when = formatWhen(appointment.scheduledAt);
  const place = `مع د. ${doctor}، ${when}، في ${appointment.branchName}`;
  if (kind === 'request') return `طلب الحجز وصل وبانتظار تأكيد العيادة. ${place}.`;
  if (kind === 'confirmation') return `تم تأكيد ميعادك ${place}.`;
  if (kind === 'cancellation') return `ميعادك ${when} مع د. ${doctor}، في ${appointment.branchName}، اتلغى.`;
  if (kind === 'reschedule') return `ميعادك اتغير إلى ${when} مع د. ${doctor}، في ${appointment.branchName}.`;
  const lead = dayWord(appointment.scheduledAt, reference);
  const whenWord = lead ? `ميعادك ${lead}` : 'ميعادك';
  return `تذكير: ${whenWord} مع د. ${doctor}، ${when}، في ${appointment.branchName}.`;
}

async function patientPhone(patientId: string): Promise<string> {
  const result = await db.query<{ phone: string | null; user_phone: string | null }>(
    `SELECT p.phone, u.phone AS user_phone
     FROM patients p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    [patientId],
  );
  return digitsPhone(result.rows[0]?.phone || result.rows[0]?.user_phone || '');
}

async function clinicSender(clinicId: string): Promise<{ token: string; phoneNumberId: string } | null> {
  const result = await db.query<{ whatsapp_phone_number_id: string | null }>(
    'SELECT whatsapp_phone_number_id FROM clinics WHERE id = $1',
    [clinicId],
  );
  const phoneNumberId = (result.rows[0]?.whatsapp_phone_number_id || '').trim();
  const token = (process.env.WHATSAPP_TOKEN || '').trim();
  if (!phoneNumberId || !token) return null;
  return { token, phoneNumberId };
}

async function deliver(body: string, to: string, clinicId: string): Promise<void> {
  const sender = await clinicSender(clinicId);
  if (!sender || !to) return;
  await fetch(`https://graph.facebook.com/v21.0/${sender.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sender.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  }).catch(() => undefined);
}

export async function deliverWhatsApp(body: string, to: string, clinicId: string): Promise<void> {
  await deliver(body, digitsPhone(to), clinicId);
}

export async function deliverAppWhatsApp(body: string, to: string): Promise<boolean> {
  const token = (process.env.WHATSAPP_TOKEN || '').trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const destination = digitsPhone(to);
  if (!token || !phoneNumberId || !destination) return false;
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: destination,
      type: 'text',
      text: { body },
    }),
  }).catch(() => null);
  return Boolean(response?.ok);
}

async function dispatchDue(): Promise<void> {
  const due = await db.query<{ id: string; body: string; to_phone: string | null; clinic_id: string }>(
    `SELECT id, body, to_phone, clinic_id FROM whatsapp_messages WHERE status = 'scheduled' AND scheduled_for <= now()`,
  );
  if (!due.rows.length) return;
  await db.query(
    `UPDATE whatsapp_messages
     SET status = 'sent', sent_at = now()
     WHERE status = 'scheduled' AND scheduled_for <= now()`,
  );
  for (const row of due.rows) await deliver(row.body, row.to_phone || '', row.clinic_id);
}

async function insertMessage(
  appointment: QueuedAppointment,
  kind: 'request' | 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
  id: string,
  body: string,
  status: 'sent' | 'scheduled',
  scheduledFor: string,
  to: string,
): Promise<void> {
  await db.query(
    `INSERT INTO whatsapp_messages (
       id, appointment_id, clinic_id, patient_id, kind, body, status, scheduled_for, sent_at, to_phone
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      appointment.id,
      appointment.clinicId,
      appointment.patientId,
      kind,
      body,
      status,
      scheduledFor,
      status === 'sent' ? scheduledFor : null,
      to,
    ],
  );
}

export async function queueAppointmentRequest(appointment: QueuedAppointment): Promise<void> {
  const existing = await db.query<{ id: string }>(
    `SELECT id FROM whatsapp_messages WHERE appointment_id = $1 AND kind = 'request' LIMIT 1`,
    [appointment.id],
  );
  if (existing.rows[0]) return;
  const to = await patientPhone(appointment.patientId);
  const now = new Date().toISOString();
  const body = messageBody(appointment, 'request');
  await insertMessage(appointment, 'request', `wa-${appointment.id}-request`, body, 'sent', now, to);
  await deliver(body, to, appointment.clinicId);
}

export async function queueAppointmentWhatsApp(appointment: QueuedAppointment, resend = false): Promise<void> {
  const to = await patientPhone(appointment.patientId);
  const now = new Date();
  const confirmBody = messageBody(appointment, 'confirmation');
  const existing = await db.query<{ id: string; body: string }>(
    `SELECT id, body FROM whatsapp_messages WHERE appointment_id = $1 AND kind = 'confirmation' LIMIT 1`,
    [appointment.id],
  );
  if (!existing.rows[0]) {
    await insertMessage(appointment, 'confirmation', `wa-${appointment.id}-confirm`, confirmBody, 'sent', now.toISOString(), to);
    await deliver(confirmBody, to, appointment.clinicId);
  } else if (resend && existing.rows[0].body !== confirmBody) {
    await db.query(
      `UPDATE whatsapp_messages SET body = $2, status = 'sent', sent_at = now(), to_phone = $3 WHERE id = $1`,
      [existing.rows[0].id, confirmBody, to],
    );
    await deliver(confirmBody, to, appointment.clinicId);
  }

  const reminder = await db.query<{ id: string }>(
    `SELECT id FROM whatsapp_messages WHERE appointment_id = $1 AND kind = 'reminder' LIMIT 1`,
    [appointment.id],
  );
  if (!reminder.rows[0]) {
    const reminderAt = new Date(new Date(appointment.scheduledAt).getTime() - 24 * 60 * 60 * 1000);
    const reminderReference = reminderAt.getTime() <= now.getTime() ? now : reminderAt;
    await insertMessage(
      appointment,
      'reminder',
      `wa-${appointment.id}-remind`,
      messageBody(appointment, 'reminder', reminderReference),
      'scheduled',
      reminderAt.toISOString(),
      to,
    );
  }
  await dispatchDue();
}

export async function notifyAppointmentCancelled(appointment: QueuedAppointment): Promise<void> {
  await db.query(
    `DELETE FROM whatsapp_messages WHERE appointment_id = $1 AND kind = 'reminder' AND status = 'scheduled'`,
    [appointment.id],
  );
  const existing = await db.query<{ id: string }>(
    `SELECT id FROM whatsapp_messages WHERE appointment_id = $1 AND kind = 'cancellation' LIMIT 1`,
    [appointment.id],
  );
  if (existing.rows[0]) return;
  const to = await patientPhone(appointment.patientId);
  const now = new Date().toISOString();
  const body = messageBody(appointment, 'cancellation');
  await insertMessage(appointment, 'cancellation', `wa-${appointment.id}-cancel`, body, 'sent', now, to);
  await deliver(body, to, appointment.clinicId);
}

export async function notifyAppointmentRescheduled(appointment: QueuedAppointment): Promise<void> {
  const to = await patientPhone(appointment.patientId);
  const now = new Date();
  const body = messageBody(appointment, 'reschedule');
  await insertMessage(
    appointment,
    'reschedule',
    `wa-${appointment.id}-move-${randomUUID()}`,
    body,
    'sent',
    now.toISOString(),
    to,
  );
  await deliver(body, to, appointment.clinicId);

  const reminderAt = new Date(new Date(appointment.scheduledAt).getTime() - 24 * 60 * 60 * 1000);
  const reminderReference = reminderAt.getTime() <= now.getTime() ? now : reminderAt;
  await db.query(
    `UPDATE whatsapp_messages
     SET body = $2, status = 'scheduled', scheduled_for = $3, sent_at = NULL, to_phone = $4
     WHERE appointment_id = $1 AND kind = 'reminder'`,
    [appointment.id, messageBody(appointment, 'reminder', reminderReference), reminderAt.toISOString(), to],
  );
  await dispatchDue();
}

export async function seedWhatsAppMessages(): Promise<void> {
  const result = await db.query<{
    id: string;
    clinic_id: string;
    patient_id: string;
    branch_name: string;
    scheduled_at: string | Date;
    first_name: string;
    last_name: string;
  }>(
    `SELECT a.id, a.clinic_id, a.patient_id, a.branch_name, a.scheduled_at, d.first_name, d.last_name
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.status IN ('confirmed', 'completed', 'in_progress')
       AND NOT EXISTS (
         SELECT 1 FROM whatsapp_messages m WHERE m.appointment_id = a.id AND m.kind = 'confirmation'
       )`,
  );
  for (const row of result.rows) {
    await queueAppointmentWhatsApp({
      id: row.id,
      clinicId: row.clinic_id,
      patientId: row.patient_id,
      scheduledAt: iso(row.scheduled_at),
      branchName: row.branch_name,
      doctor: { firstName: row.first_name, lastName: row.last_name },
    });
  }
}

export async function listAppointmentWhatsApp(appointmentId: string) {
  await dispatchDue();
  const result = await db.query<MessageRow>(
    `SELECT * FROM whatsapp_messages WHERE appointment_id = $1 ORDER BY scheduled_for ASC`,
    [appointmentId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    appointmentId: row.appointment_id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    kind: row.kind,
    body: row.body,
    status: row.status,
    scheduledFor: iso(row.scheduled_for),
    sentAt: row.sent_at ? iso(row.sent_at) : undefined,
  }));
}
