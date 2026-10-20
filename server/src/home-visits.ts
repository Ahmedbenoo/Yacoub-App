import { randomUUID } from 'node:crypto';

import { db } from './db.js';

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

type Row = {
  id: string;
  patient_user_id: string;
  patient_name: string;
  patient_phone: string | null;
  specialty: string;
  address: string;
  scheduled_at: string | Date;
  notes: string | null;
  status: string;
  price: number | null;
  doctor_id: string | null;
  doctor_name: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toPublic(row: Row) {
  return {
    id: row.id,
    patientUserId: row.patient_user_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone ?? undefined,
    specialty: row.specialty,
    address: row.address,
    scheduledAt: iso(row.scheduled_at),
    notes: row.notes ?? undefined,
    status: row.status,
    price: row.price ?? undefined,
    doctorId: row.doctor_id ?? undefined,
    doctorName: row.doctor_name ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function homeVisitSetting(userId: string) {
  const result = await db.query<{ offers_home_visits: boolean | null }>(
    'SELECT offers_home_visits FROM doctors WHERE id = $1 OR user_id = $1 LIMIT 1',
    [userId],
  );
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'Doctor profile was not found');
  return { enabled: result.rows[0].offers_home_visits === true };
}

export async function enableHomeVisits(userId: string) {
  const result = await db.query<{ id: string }>(
    `UPDATE doctors SET offers_home_visits = true, updated_at = now()
     WHERE id = $1 OR user_id = $1
     RETURNING id`,
    [userId],
  );
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'Doctor profile was not found');
  return { enabled: true };
}

export async function listHomeVisits(userId: string, filters: { patientUserId?: string; doctorId?: string }) {
  if (filters.doctorId) {
    if (filters.doctorId !== userId) return [];
    const access = await homeVisitSetting(userId);
    if (!access.enabled) return [];
    const result = await db.query<Row>(
      `SELECT * FROM home_visit_requests
       WHERE status = 'requested' OR doctor_id = $1
       ORDER BY created_at DESC`,
      [filters.doctorId],
    );
    return result.rows.map(toPublic);
  }
  const patientId = filters.patientUserId || userId;
  const result = await db.query<Row>(
    'SELECT * FROM home_visit_requests WHERE patient_user_id = $1 ORDER BY created_at DESC',
    [patientId],
  );
  return result.rows.map(toPublic);
}

export async function getHomeVisit(id: string) {
  const result = await db.query<Row>('SELECT * FROM home_visit_requests WHERE id = $1', [id]);
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'Request was not found');
  return toPublic(result.rows[0]);
}

export async function createHomeVisit(
  userId: string,
  input: { patientName: string; patientPhone?: string; specialty: string; address: string; scheduledAt: string; notes?: string },
) {
  const id = `home-${randomUUID()}`;
  await db.query(
    `INSERT INTO home_visit_requests (
       id, patient_user_id, patient_name, patient_phone, specialty, address, scheduled_at, notes, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'requested')`,
    [id, userId, input.patientName, input.patientPhone ?? null, input.specialty, input.address, input.scheduledAt, input.notes ?? null],
  );
  return getHomeVisit(id);
}

export async function acceptHomeVisit(userId: string, id: string, input: { doctorId: string; doctorName: string; price: number }) {
  const current = await getHomeVisit(id);
  if (current.status !== 'requested') throw httpError(400, 'INVALID_STATUS', 'This request is no longer open');
  if (input.doctorId !== userId) throw httpError(403, 'FORBIDDEN', 'You can only accept as yourself');
  const access = await homeVisitSetting(userId);
  if (!access.enabled) throw httpError(403, 'FORBIDDEN', 'Home visits are not enabled');
  if (!Number.isFinite(input.price) || input.price <= 0) throw httpError(400, 'INVALID_PRICE', 'Enter a valid price');
  await db.query(
    `UPDATE home_visit_requests
     SET status = 'accepted', doctor_id = $2, doctor_name = $3, price = $4, updated_at = now()
     WHERE id = $1`,
    [id, input.doctorId, input.doctorName, Math.round(input.price)],
  );
  return getHomeVisit(id);
}

export async function completeHomeVisit(userId: string, id: string) {
  const current = await getHomeVisit(id);
  if (current.status !== 'accepted' || current.doctorId !== userId) {
    throw httpError(400, 'INVALID_STATUS', 'This request cannot be completed');
  }
  await db.query(`UPDATE home_visit_requests SET status = 'completed', updated_at = now() WHERE id = $1`, [id]);
  return getHomeVisit(id);
}
