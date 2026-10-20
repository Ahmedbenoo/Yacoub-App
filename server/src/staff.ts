import { randomBytes, randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { db } from './db.js';
import { deliverWhatsApp, digitsPhone } from './whatsapp.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('20') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length >= 10) return `+20${digits.slice(1)}`;
  if (digits.startsWith('1') && digits.length === 10) return `+20${digits}`;
  return `+${digits}`;
}

function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length >= 11) return `0${digits.slice(2)}`;
  return digits;
}

function staffEmail(phone: string, kind: 'doctor' | 'secretary'): string {
  return `${normalizePhone(phone).replace(/\D/g, '')}@${kind}.clinsync`;
}

function password(): string {
  const bytes = randomBytes(10);
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join('');
}

async function rolesAt(userId: string, clinicId: string): Promise<string[]> {
  const result = await db.query<{ role: string }>('SELECT role FROM memberships WHERE user_id = $1 AND clinic_id = $2', [
    userId,
    clinicId,
  ]);
  return result.rows.map((row) => row.role);
}

async function requireAdmin(userId: string, clinicId: string): Promise<void> {
  const roles = await rolesAt(userId, clinicId);
  if (!roles.includes('admin')) throw httpError(403, 'FORBIDDEN', 'Only the clinic admin can do this');
}

async function clinicName(clinicId: string): Promise<string> {
  const result = await db.query<{ name_ar: string | null; name: string }>(
    'SELECT name, name_ar FROM clinics WHERE id = $1',
    [clinicId],
  );
  return result.rows[0]?.name_ar || result.rows[0]?.name || 'العيادة';
}

async function enforceDoctorCap(clinicId: string): Promise<void> {
  const clinic = await db.query<{ owner_user_id: string | null }>(
    'SELECT owner_user_id FROM clinics WHERE id = $1',
    [clinicId],
  );
  const ownerId = clinic.rows[0]?.owner_user_id;
  if (!ownerId) return;
  const owned = await db.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM clinics
     WHERE owner_user_id = $1 AND approval_status <> 'pending' AND is_active = true`,
    [ownerId],
  );
  if (Number(owned.rows[0]?.total ?? 0) > 2) return;
  const doctors = await db.query<{ total: number }>(
    'SELECT count(*)::int AS total FROM doctors WHERE clinic_id = $1 AND is_active = true',
    [clinicId],
  );
  if (Number(doctors.rows[0]?.total ?? 0) >= 3) {
    throw httpError(400, 'DOCTOR_LIMIT', 'العياده تقدر تسجل 3 دكاتره بس');
  }
}

async function credentialsMessage(input: {
  clinicId: string;
  clinicName: string;
  phone: string;
  password: string;
  role: 'doctor' | 'secretary';
  personName: string;
}): Promise<string> {
  const greeting = input.role === 'doctor' ? `د. ${input.personName}` : input.personName;
  const body = [
    `أهلاً ${greeting}، اتضاف حسابك في ${input.clinicName}.`,
    `اسم المستخدم: ${displayPhone(input.phone)}`,
    `كلمة المرور: ${input.password}`,
    'تقدر تغيّر كلمة المرور من البروفايل بعد تسجيل الدخول.',
  ].join('\n');
  const to = digitsPhone(input.phone);
  await db.query('INSERT INTO staff_whatsapp (id, to_phone, body) VALUES ($1, $2, $3)', [
    `staff-wa-${randomUUID()}`,
    to,
    body,
  ]);
  await deliverWhatsApp(body, to, input.clinicId);
  return body;
}

async function defaultSlots(doctorId: string): Promise<void> {
  for (let day = 0; day < 7; day += 1) {
    await db.query(
      `INSERT INTO doctor_slots (id, doctor_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, '09:00', '17:00')`,
      [`${doctorId}-day-${day}`, doctorId, day],
    );
  }
}

type DoctorRow = {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  specialty: string;
  bio: string | null;
  rating: number | string;
  review_count: number;
  years_experience: number;
  branch_id: string;
  branch_name: string;
  languages: string;
  share_percent: number | null;
  is_active: boolean;
};

function toDoctor(row: DoctorRow) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email ?? '',
    phone: row.phone ?? undefined,
    specialty: row.specialty,
    bio: row.bio ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    yearsExperience: row.years_experience,
    branchId: row.branch_id,
    branchName: row.branch_name,
    languages: JSON.parse(row.languages) as string[],
    sharePercent: row.share_percent ?? undefined,
    isActive: row.is_active,
  };
}

export async function createDoctor(
  actorId: string,
  clinicId: string,
  input: {
    firstName: string;
    lastName: string;
    phone?: string;
    specialty: string;
    branchName: string;
    languages: string[];
    bio?: string;
  },
) {
  await requireAdmin(actorId, clinicId);
  const phone = normalizePhone(input.phone ?? '');
  if (!phone) throw httpError(400, 'PHONE_REQUIRED', 'Phone is required');
  const clinic = await db.query<{ specialty: string | null; name: string }>(
    'SELECT specialty, name FROM clinics WHERE id = $1',
    [clinicId],
  );
  const specialty = clinic.rows[0]?.specialty || input.specialty;
  const existing = await db.query<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM users WHERE phone = $1 OR email = $2',
    [phone, staffEmail(phone, 'doctor')],
  );
  const found = existing.rows[0];
  if (found) {
    const roles = await db.query<{ role: string }>('SELECT role FROM memberships WHERE user_id = $1', [found.id]);
    if (!roles.rows.some((row) => row.role === 'doctor')) {
      throw httpError(409, 'PHONE_EXISTS', 'An account with this phone already exists');
    }
    await db.query(
      `INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, $3, 'doctor')
       ON CONFLICT (user_id, clinic_id, role) DO NOTHING`,
      [`mem-${randomUUID()}`, found.id, clinicId],
    );
    const doctor = await db.query<DoctorRow>('SELECT * FROM doctors WHERE id = $1 OR user_id = $1 LIMIT 1', [found.id]);
    if (!doctor.rows[0]) throw httpError(404, 'NOT_FOUND', 'Doctor not found');
    return { ...toDoctor(doctor.rows[0]), linkedExisting: true };
  }

  await enforceDoctorCap(clinicId);
  const generated = password();
  const userId = `user-doctor-${randomUUID()}`;
  const email = staffEmail(phone, 'doctor');
  await db.query(
    `INSERT INTO users (
       id, email, phone, password_hash, first_name, last_name, locale, is_email_verified, is_phone_verified
     ) VALUES ($1, $2, $3, $4, $5, $6, 'ar', true, true)`,
    [userId, email, phone, await bcrypt.hash(generated, 10), input.firstName.trim(), input.lastName.trim()],
  );
  await db.query(`INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, $3, 'doctor')`, [
    `mem-${randomUUID()}`,
    userId,
    clinicId,
  ]);
  const languages = input.languages.length ? input.languages : ['Arabic'];
  await db.query(
    `INSERT INTO doctors (
       id, user_id, clinic_id, first_name, last_name, email, phone, specialty, bio,
       branch_id, branch_name, languages
     ) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      userId,
      clinicId,
      input.firstName.trim(),
      input.lastName.trim(),
      email,
      phone,
      specialty,
      input.bio?.trim() || null,
      clinicId,
      input.branchName || clinic.rows[0]?.name || 'Clinic',
      JSON.stringify(languages),
    ],
  );
  await defaultSlots(userId);
  const credentialsWhatsApp = await credentialsMessage({
    clinicId,
    clinicName: await clinicName(clinicId),
    phone,
    password: generated,
    role: 'doctor',
    personName: `${input.firstName} ${input.lastName}`.trim(),
  });
  const doctor = await db.query<DoctorRow>('SELECT * FROM doctors WHERE id = $1', [userId]);
  return { ...toDoctor(doctor.rows[0]), linkedExisting: false, credentialsWhatsApp };
}

export async function createSecretary(
  actorId: string,
  clinicId: string,
  input: { firstName: string; lastName: string; phone: string },
) {
  await requireAdmin(actorId, clinicId);
  const phone = normalizePhone(input.phone);
  if (!phone) throw httpError(400, 'PHONE_REQUIRED', 'Phone is required');
  const existing = await db.query<{ id: string }>('SELECT id FROM users WHERE phone = $1', [phone]);
  if (existing.rows[0]) throw httpError(409, 'PHONE_EXISTS', 'An account with this phone already exists');
  const generated = password();
  const userId = `user-secretary-${randomUUID()}`;
  const email = staffEmail(phone, 'secretary');
  await db.query(
    `INSERT INTO users (
       id, email, phone, password_hash, first_name, last_name, locale, is_email_verified, is_phone_verified
     ) VALUES ($1, $2, $3, $4, $5, $6, 'ar', true, true)`,
    [userId, email, phone, await bcrypt.hash(generated, 10), input.firstName.trim(), input.lastName.trim()],
  );
  await db.query(`INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, $3, 'secretary')`, [
    `mem-${randomUUID()}`,
    userId,
    clinicId,
  ]);
  const credentialsWhatsApp = await credentialsMessage({
    clinicId,
    clinicName: await clinicName(clinicId),
    phone,
    password: generated,
    role: 'secretary',
    personName: `${input.firstName} ${input.lastName}`.trim(),
  });
  return { userId, email, phone, linkedExisting: false, credentialsWhatsApp };
}

export async function updateDoctor(
  actorId: string,
  clinicId: string,
  id: string,
  input: { specialty: string; phone?: string; bio?: string; branchName: string; languages: string[]; sharePercent?: number },
) {
  await requireAdmin(actorId, clinicId);
  const phone = input.phone ? normalizePhone(input.phone) : null;
  const share = input.sharePercent == null ? null : Math.min(100, Math.max(0, Math.round(input.sharePercent)));
  const result = await db.query<DoctorRow>(
    `UPDATE doctors
     SET specialty = $2, phone = COALESCE($3, phone), bio = $4, branch_name = $5, languages = $6,
         share_percent = $7, updated_at = now()
     WHERE (id = $1 OR user_id = $1) AND clinic_id = $8
     RETURNING *`,
    [id, input.specialty, phone, input.bio?.trim() || null, input.branchName, JSON.stringify(input.languages), share, clinicId],
  );
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'Doctor not found');
  return toDoctor(result.rows[0]);
}

export async function setDoctorActive(actorId: string, clinicId: string, id: string, active: boolean) {
  await requireAdmin(actorId, clinicId);
  const result = await db.query<DoctorRow>(
    `UPDATE doctors SET is_active = $2, updated_at = now()
     WHERE (id = $1 OR user_id = $1) AND clinic_id = $3 RETURNING *`,
    [id, active, clinicId],
  );
  if (!result.rows[0]) throw httpError(404, 'NOT_FOUND', 'Doctor not found');
  return toDoctor(result.rows[0]);
}
