import { randomUUID } from 'node:crypto';

import { db } from './db.js';

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

type ReviewRow = {
  id: string;
  doctor_id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  rating: number;
  comment: string | null;
  created_at: string | Date;
};

function toReview(row: ReviewRow) {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: iso(row.created_at),
  };
}

export async function listReviews(doctorId: string) {
  const result = await db.query<ReviewRow>(
    'SELECT * FROM reviews WHERE doctor_id = $1 ORDER BY created_at DESC',
    [doctorId],
  );
  return result.rows.map(toReview);
}

export async function reviewForAppointment(userId: string, appointmentId: string) {
  const appointment = await db.query<{ patient_id: string; patient_user_id: string | null; clinic_id: string }>(
    `SELECT a.patient_id, p.user_id AS patient_user_id, a.clinic_id
     FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id = $1`,
    [appointmentId],
  );
  const row = appointment.rows[0];
  if (!row) throw httpError(404, 'NOT_FOUND', 'Appointment not found');
  const roles = await db.query<{ role: string }>('SELECT role FROM memberships WHERE user_id = $1 AND clinic_id = $2', [
    userId,
    row.clinic_id,
  ]);
  const staff = roles.rows.some((item) => item.role === 'admin' || item.role === 'secretary' || item.role === 'doctor');
  const owns = row.patient_id === userId || row.patient_user_id === userId;
  if (!staff && !owns) throw httpError(403, 'FORBIDDEN', 'You cannot open this review');
  const review = await db.query<ReviewRow>('SELECT * FROM reviews WHERE appointment_id = $1', [appointmentId]);
  return review.rows[0] ? toReview(review.rows[0]) : null;
}

export async function createReview(
  userId: string,
  input: { doctorId: string; appointmentId: string; patientId: string; patientName: string; rating: number; comment?: string },
) {
  if (input.rating < 1 || input.rating > 5) throw httpError(400, 'VALIDATION_ERROR', 'Rating must be from 1 to 5');
  const appointment = await db.query<{
    id: string;
    status: string;
    doctor_id: string;
    patient_id: string;
    patient_user_id: string | null;
  }>(
    `SELECT a.id, a.status, a.doctor_id, a.patient_id, p.user_id AS patient_user_id
     FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id = $1`,
    [input.appointmentId],
  );
  const row = appointment.rows[0];
  if (!row) throw httpError(404, 'NOT_FOUND', 'Appointment not found');
  if (row.patient_user_id !== userId && row.patient_id !== userId) {
    throw httpError(403, 'FORBIDDEN', 'Only the patient can review this visit');
  }
  if (row.status !== 'completed') throw httpError(400, 'INVALID_STATUS', 'Review the visit after it is completed');
  const existing = await db.query<ReviewRow>('SELECT * FROM reviews WHERE appointment_id = $1', [input.appointmentId]);
  if (existing.rows[0]) return toReview(existing.rows[0]);
  const id = `review-${randomUUID()}`;
  await db.query(
    `INSERT INTO reviews (id, doctor_id, appointment_id, patient_id, patient_name, rating, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, row.doctor_id, row.id, row.patient_id, input.patientName, Math.round(input.rating), input.comment?.trim() || null],
  );
  const stats = await db.query<{ rating: number | string; review_count: number }>(
    'SELECT rating, review_count FROM doctors WHERE id = $1',
    [row.doctor_id],
  );
  const current = stats.rows[0];
  if (current) {
    const count = Number(current.review_count) + 1;
    const rating = (Number(current.rating) * Number(current.review_count) + input.rating) / count;
    await db.query('UPDATE doctors SET rating = $2, review_count = $3, updated_at = now() WHERE id = $1', [
      row.doctor_id,
      Math.round(rating * 10) / 10,
      count,
    ]);
  }
  const created = await db.query<ReviewRow>('SELECT * FROM reviews WHERE id = $1', [id]);
  return toReview(created.rows[0]);
}
