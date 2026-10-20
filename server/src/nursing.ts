import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { db } from './db.js';
import { pushNotification } from './notifications.js';

const PRICES: Record<string, number> = {
  injection: 125,
  cannulaIv: 175,
  ivDrip: 300,
  woundSimple: 250,
  woundLarge: 425,
  catheter: 375,
  ngTube: 350,
  nebulizer: 175,
  labSample: 200,
  vitals: 175,
  shift8: 700,
  shift12: 1050,
  shift24: 2050,
};

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

type RequestRow = {
  id: string;
  patient_user_id: string;
  patient_name: string;
  patient_phone: string | null;
  service_id: string;
  service_ids: string;
  address: string;
  scheduled_at: string | Date;
  status: string;
  price_min: number | null;
  price_max: number | null;
  price: number | null;
  patient_notified: boolean;
  nurse_user_id: string | null;
  nurse_name: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toRequest(row: RequestRow) {
  return {
    id: row.id,
    patientUserId: row.patient_user_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone ?? undefined,
    serviceId: row.service_id,
    serviceIds: JSON.parse(row.service_ids) as string[],
    address: row.address,
    scheduledAt: iso(row.scheduled_at),
    status: row.status,
    priceMin: row.price_min ?? undefined,
    priceMax: row.price_max ?? undefined,
    price: row.price ?? undefined,
    patientNotified: row.patient_notified,
    nurseUserId: row.nurse_user_id ?? undefined,
    nurseName: row.nurse_name ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

async function byId(id: string): Promise<RequestRow> {
  const result = await db.query<RequestRow>('SELECT * FROM nursing_requests WHERE id = $1', [id]);
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'Request was not found');
  return result.rows[0];
}

function quote(ids: string[]) {
  const known = ids.filter((id) => PRICES[id] != null);
  if (!known.length) return null;
  const total = known.reduce((sum, id) => sum + PRICES[id], 0);
  return { priceMin: total, priceMax: total };
}

export async function listNursing(userId: string, filters: { patientUserId?: string; nurseUserId?: string }) {
  const roles = await db.query<{ role: string }>('SELECT role FROM memberships WHERE user_id = $1', [userId]);
  const roleNames = roles.rows.map((row) => row.role);
  let rows: RequestRow[];
  if (filters.nurseUserId || roleNames.includes('nurse')) {
    const nurseId = filters.nurseUserId || userId;
    const result = await db.query<RequestRow>(
      'SELECT * FROM nursing_requests WHERE nurse_user_id = $1 ORDER BY created_at DESC',
      [nurseId],
    );
    rows = result.rows;
  } else if (filters.patientUserId || (roleNames.includes('patient') && !roleNames.includes('nursing_admin') && !roleNames.includes('admin'))) {
    const patientId = filters.patientUserId || userId;
    const result = await db.query<RequestRow>(
      'SELECT * FROM nursing_requests WHERE patient_user_id = $1 ORDER BY created_at DESC',
      [patientId],
    );
    rows = result.rows;
  } else if (roleNames.includes('nursing_admin') || roleNames.includes('admin')) {
    const result = await db.query<RequestRow>('SELECT * FROM nursing_requests ORDER BY created_at DESC');
    rows = result.rows;
  } else {
    throw httpError(403, 'FORBIDDEN', 'You cannot open nursing requests');
  }
  return rows.map(toRequest);
}

export async function getNursing(id: string) {
  return toRequest(await byId(id));
}

export async function createNursing(
  userId: string,
  input: { patientName: string; patientPhone?: string; serviceId: string; serviceIds?: string[]; address: string; scheduledAt: string },
) {
  const ids = input.serviceIds?.length ? input.serviceIds : [input.serviceId];
  const prices = quote(ids);
  if (!prices) throw httpError(400, 'INVALID_SERVICE', 'Choose a nursing service');
  const id = `nursing-${randomUUID()}`;
  await db.query(
    `INSERT INTO nursing_requests (
       id, patient_user_id, patient_name, patient_phone, service_id, service_ids, address, scheduled_at,
       status, price_min, price_max
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'requested', $9, $10)`,
    [id, userId, input.patientName, input.patientPhone ?? null, ids[0], JSON.stringify(ids), input.address, input.scheduledAt, prices.priceMin, prices.priceMax],
  );
  return toRequest(await byId(id));
}

async function requireNursingAdmin(userId: string) {
  const roles = await db.query<{ role: string }>(
    `SELECT role FROM memberships WHERE user_id = $1 AND role IN ('nursing_admin', 'admin')`,
    [userId],
  );
  if (!roles.rows[0]) throw httpError(403, 'FORBIDDEN', 'Only the nursing desk can do this');
}

export async function priceNursing(userId: string, id: string, price: number) {
  await requireNursingAdmin(userId);
  const request = await byId(id);
  if (request.status !== 'requested' && request.status !== 'priced') {
    throw httpError(400, 'INVALID_STATUS', 'This request can no longer be priced');
  }
  if (!Number.isFinite(price) || price <= 0) throw httpError(400, 'INVALID_PRICE', 'Enter a valid price');
  await db.query(
    `UPDATE nursing_requests SET price = $2, patient_notified = true, status = 'priced', updated_at = now() WHERE id = $1`,
    [id, Math.round(price)],
  );
  await pushNotification({
    userId: request.patient_user_id,
    type: 'system',
    messageKey: 'nursingPriced',
    title: 'تم تأكيد طلب التمريض',
    body: `الإدارة أكدت الطلب بسعر ${Math.round(price)} ج.م`,
    data: { nursingRequestId: id, price: String(Math.round(price)) },
  });
  return toRequest(await byId(id));
}

export async function assignNursing(userId: string, id: string, nurseUserId: string) {
  await requireNursingAdmin(userId);
  const request = await byId(id);
  if (request.status !== 'priced' && request.status !== 'declined') {
    throw httpError(400, 'INVALID_STATUS', 'Tell the patient the price before sending a nurse');
  }
  const nurse = await db.query<{ first_name: string; last_name: string; verification: string }>(
    'SELECT first_name, last_name, verification FROM nurse_profiles WHERE user_id = $1',
    [nurseUserId],
  );
  if (!nurse.rows[0] || nurse.rows[0].verification !== 'approved') {
    throw httpError(400, 'NURSE_NOT_VERIFIED', 'Choose a verified nurse');
  }
  await db.query(
    `UPDATE nursing_requests SET nurse_user_id = $2, nurse_name = $3, status = 'assigned', updated_at = now() WHERE id = $1`,
    [id, nurseUserId, `${nurse.rows[0].first_name} ${nurse.rows[0].last_name}`.trim()],
  );
  return toRequest(await byId(id));
}

export async function acceptNursing(userId: string, id: string) {
  const request = await byId(id);
  if (request.nurse_user_id !== userId) throw httpError(403, 'FORBIDDEN', 'This request is assigned to another nurse');
  if (request.status !== 'assigned') throw httpError(400, 'INVALID_STATUS', 'This request cannot be accepted');
  await db.query(`UPDATE nursing_requests SET status = 'accepted', updated_at = now() WHERE id = $1`, [id]);
  await pushNotification({
    userId: request.patient_user_id,
    type: 'system',
    messageKey: 'nursingAccepted',
    title: 'الممرض قبل الطلب',
    body: `${request.nurse_name ?? ''} قبل زيارة التمريض المنزلى`,
    data: { nursingRequestId: id, nurseName: request.nurse_name ?? '' },
  });
  return toRequest(await byId(id));
}

export async function declineNursing(userId: string, id: string) {
  const request = await byId(id);
  if (request.nurse_user_id !== userId) throw httpError(403, 'FORBIDDEN', 'This request is assigned to another nurse');
  if (request.status !== 'assigned') throw httpError(400, 'INVALID_STATUS', 'This request cannot be declined');
  await db.query(
    `UPDATE nursing_requests SET status = 'declined', nurse_user_id = NULL, nurse_name = NULL, updated_at = now() WHERE id = $1`,
    [id],
  );
  return toRequest(await byId(id));
}

export async function completeNursing(userId: string, id: string) {
  const request = await byId(id);
  if (request.nurse_user_id !== userId) throw httpError(403, 'FORBIDDEN', 'This request is assigned to another nurse');
  if (request.status !== 'accepted') throw httpError(400, 'INVALID_STATUS', 'This request cannot be completed');
  await db.query(`UPDATE nursing_requests SET status = 'completed', updated_at = now() WHERE id = $1`, [id]);
  return toRequest(await byId(id));
}

type NurseRow = {
  user_id: string;
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
  proof: string;
  verification: string;
  created_at: string | Date;
};

function toNurse(row: NurseRow) {
  return {
    userId: row.user_id,
    email: row.email ?? '',
    phone: row.phone ?? undefined,
    firstName: row.first_name,
    lastName: row.last_name,
    proof: row.proof,
    verification: row.verification,
    createdAt: iso(row.created_at),
  };
}

export async function listNurses() {
  const result = await db.query<NurseRow>('SELECT * FROM nurse_profiles ORDER BY created_at');
  return result.rows.map(toNurse);
}

export async function getNurse(userId: string) {
  const result = await db.query<NurseRow>('SELECT * FROM nurse_profiles WHERE user_id = $1', [userId]);
  return result.rows[0] ? toNurse(result.rows[0]) : null;
}

export async function setNurseVerification(actorId: string, userId: string, verification: string) {
  await requireNursingAdmin(actorId);
  if (!['pending', 'approved', 'rejected'].includes(verification)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Verification is invalid');
  }
  const result = await db.query<NurseRow>(
    'UPDATE nurse_profiles SET verification = $2 WHERE user_id = $1 RETURNING *',
    [userId, verification],
  );
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'Nurse not found');
  return toNurse(result.rows[0]);
}

export async function registerNurse(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  proof: string;
}) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [input.email, input.phone]);
  if (existing.rows[0]) throw httpError(409, 'PHONE_EXISTS', 'An account with this phone already exists');
  const id = `user-nurse-${randomUUID()}`;
  await db.query(
    `INSERT INTO users (
       id, email, phone, password_hash, first_name, last_name, locale, is_phone_verified
     ) VALUES ($1, $2, $3, $4, $5, $6, 'ar', true)`,
    [id, input.email, input.phone, await bcrypt.hash(input.password, 10), input.firstName.trim(), input.lastName.trim()],
  );
  await db.query(
    `INSERT INTO nurse_profiles (user_id, email, phone, first_name, last_name, proof, verification)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
    [id, input.email, input.phone, input.firstName.trim(), input.lastName.trim(), input.proof],
  );
  await db.query(
    `INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, 'clinic-001', 'nurse')`,
    [`mem-${id}`, id],
  );
  return { userId: id };
}

export async function seedNurseProfiles(): Promise<void> {
  const nurses = await db.query<{ id: string; email: string | null; phone: string | null; first_name: string; last_name: string }>(
    `SELECT DISTINCT u.id, u.email, u.phone, u.first_name, u.last_name
     FROM users u JOIN memberships m ON m.user_id = u.id
     WHERE m.role IN ('nurse', 'nursing_admin')`,
  );
  for (const nurse of nurses.rows) {
    const pending = (nurse.email ?? '').includes('pending');
    await db.query(
      `INSERT INTO nurse_profiles (user_id, email, phone, first_name, last_name, proof, verification)
       VALUES ($1, $2, $3, $4, $5, 'seed', $6)
       ON CONFLICT (user_id) DO NOTHING`,
      [nurse.id, nurse.email, nurse.phone, nurse.first_name, nurse.last_name, pending ? 'pending' : 'approved'],
    );
  }
}
