import { randomUUID } from 'node:crypto';

import { db } from './db.js';

type PatientRow = {
  id: string;
  user_id: string | null;
  clinic_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string;
  gender: string;
  blood_type: string | null;
  allergies: string;
  chronic_conditions: string;
  last_visit_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicPatient = {
  id: string;
  userId: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  lastVisitAt?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
};

type SeedPatient = {
  id: string;
  userId?: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  lastVisitDaysAgo?: number;
};

const SEED_PATIENTS: SeedPatient[] = [
  {
    id: 'patient-001',
    userId: 'user-patient-001',
    clinicId: 'clinic-001',
    firstName: 'Ahmed',
    lastName: 'Fathy',
    email: 'patient@clinic.com',
    phone: '+201000000001',
    dateOfBirth: '1995-06-08',
    gender: 'male',
    bloodType: 'A+',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    lastVisitDaysAgo: 2,
  },
  {
    id: 'patient-002',
    userId: 'user-patient-002',
    clinicId: 'clinic-001',
    firstName: 'Youssef',
    lastName: 'Kamal',
    email: 'youssef.kamal@email.com',
    phone: '+201000000002',
    dateOfBirth: '1988-09-23',
    gender: 'male',
    bloodType: 'O+',
    allergies: [],
    chronicConditions: ['Type 2 Diabetes'],
    lastVisitDaysAgo: 10,
  },
  {
    id: 'patient-003',
    userId: 'user-patient-003',
    clinicId: 'clinic-001',
    firstName: 'Nour',
    lastName: 'Adel',
    email: 'nour.adel@email.com',
    phone: '+201000000003',
    dateOfBirth: '1998-01-05',
    gender: 'female',
    bloodType: 'B+',
    allergies: ['Latex'],
    chronicConditions: [],
    lastVisitDaysAgo: 30,
  },
  {
    id: 'patient-004',
    userId: 'user-patient-004',
    clinicId: 'clinic-002',
    firstName: 'Fatima',
    lastName: 'Ali',
    email: 'fatima.ali@email.com',
    phone: '+201000000004',
    dateOfBirth: '1990-06-18',
    gender: 'female',
    bloodType: 'AB+',
    allergies: [],
    chronicConditions: ['Asthma'],
    lastVisitDaysAgo: 4,
  },
  {
    id: 'patient-child-001',
    userId: 'user-child-001',
    clinicId: 'clinic-001',
    firstName: 'Lina',
    lastName: 'Adel',
    dateOfBirth: '2026-05-08',
    gender: 'female',
    allergies: [],
    chronicConditions: [],
  },
];

const STAFF_ROLES = new Set(['admin', 'secretary', 'doctor', 'nurse', 'nursing_admin']);

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function readList(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function birthDate(value: string | Date): string {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  return value.slice(0, 10);
}

function toPublicPatient(row: PatientRow): PublicPatient {
  const birth = birthDate(row.date_of_birth);
  return {
    id: row.id,
    userId: row.user_id ?? '',
    clinicId: row.clinic_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    dateOfBirth: birth,
    gender: row.gender,
    bloodType: row.blood_type ?? undefined,
    allergies: readList(row.allergies),
    chronicConditions: readList(row.chronic_conditions),
    lastVisitAt: row.last_visit_at ? new Date(row.last_visit_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    isActive: row.is_active,
  };
}

async function rolesAtClinic(userId: string, clinicId: string): Promise<string[]> {
  const result = await db.query<{ role: string }>(
    'SELECT role FROM memberships WHERE user_id = $1 AND clinic_id = $2',
    [userId, clinicId],
  );
  return result.rows.map((row) => row.role);
}

function isStaff(roles: string[]): boolean {
  return roles.some((role) => STAFF_ROLES.has(role));
}

async function patientById(id: string): Promise<PatientRow | undefined> {
  const result = await db.query<PatientRow>(
    'SELECT * FROM patients WHERE id = $1 OR user_id = $1 ORDER BY id LIMIT 1',
    [id],
  );
  return result.rows[0];
}

export async function seedPatients(): Promise<void> {
  for (const patient of SEED_PATIENTS) {
    const lastVisitAt =
      patient.lastVisitDaysAgo == null ? null : new Date(Date.now() - patient.lastVisitDaysAgo * 86400000).toISOString();
    await db.query(
      `INSERT INTO patients (
         id, user_id, clinic_id, first_name, last_name, email, phone, date_of_birth, gender,
         blood_type, allergies, chronic_conditions, last_visit_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z')
       ON CONFLICT (id) DO NOTHING`,
      [
        patient.id,
        patient.userId ?? null,
        patient.clinicId,
        patient.firstName,
        patient.lastName,
        patient.email ?? null,
        patient.phone ?? null,
        patient.dateOfBirth,
        patient.gender,
        patient.bloodType ?? null,
        JSON.stringify(patient.allergies),
        JSON.stringify(patient.chronicConditions),
        lastVisitAt,
      ],
    );
  }
}

export async function ensurePatientForAccount(input: {
  userId: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  const existing = await db.query<{ id: string }>('SELECT id FROM patients WHERE user_id = $1', [input.userId]);
  if (existing.rows[0]) return;
  await db.query(
    `INSERT INTO patients (
       id, user_id, clinic_id, first_name, last_name, email, phone, date_of_birth, gender
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, '1990-01-01', 'other')`,
    [
      `patient-${randomUUID()}`,
      input.userId,
      input.clinicId,
      input.firstName,
      input.lastName,
      input.email ?? null,
      input.phone ?? null,
    ],
  );
}

export async function listPatients(
  userId: string,
  filters: { clinicId: string; search?: string; includeInactive?: boolean; page?: number; limit?: number },
): Promise<{ data: PublicPatient[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const roles = await rolesAtClinic(userId, filters.clinicId);
  if (!isStaff(roles)) throw httpError(403, 'FORBIDDEN', 'You cannot list patients for this clinic');

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const search = filters.search?.trim() ?? '';
  const where = `clinic_id = $1
    AND ($2 = true OR is_active = true)
    AND (
      $3 = ''
      OR first_name ILIKE $4
      OR last_name ILIKE $4
      OR email ILIKE $4
      OR phone ILIKE $4
    )`;
  const params = [filters.clinicId, Boolean(filters.includeInactive), search, `%${search}%`];
  const totalResult = await db.query<{ total: number }>(`SELECT count(*)::int AS total FROM patients WHERE ${where}`, params);
  const total = Number(totalResult.rows[0]?.total ?? 0);
  const result = await db.query<PatientRow>(
    `SELECT * FROM patients WHERE ${where} ORDER BY first_name, last_name LIMIT $5 OFFSET $6`,
    [...params, limit, (page - 1) * limit],
  );
  return {
    data: result.rows.map(toPublicPatient),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getPatient(userId: string, id: string): Promise<PublicPatient> {
  const row = await patientById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Patient not found');
  const roles = await rolesAtClinic(userId, row.clinic_id);
  if (!isStaff(roles) && row.user_id !== userId) {
    throw httpError(403, 'FORBIDDEN', 'You cannot open this patient file');
  }
  return toPublicPatient(row);
}

export async function getMyPatient(userId: string): Promise<PublicPatient> {
  const result = await db.query<PatientRow>('SELECT * FROM patients WHERE user_id = $1 ORDER BY created_at LIMIT 1', [userId]);
  const row = result.rows[0];
  if (!row) throw httpError(404, 'NOT_FOUND', 'Patient not found');
  return toPublicPatient(row);
}

async function requireEditor(userId: string, clinicId: string): Promise<void> {
  const roles = await rolesAtClinic(userId, clinicId);
  if (!roles.includes('admin') && !roles.includes('secretary')) {
    throw httpError(403, 'FORBIDDEN', 'Only the clinic admin or secretary can edit patient files');
  }
}

export async function createPatient(
  userId: string,
  clinicId: string,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth: string;
    gender: string;
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
  },
): Promise<PublicPatient> {
  if (!clinicId) throw httpError(400, 'VALIDATION_ERROR', 'Clinic is required');
  await requireEditor(userId, clinicId);
  const id = `patient-${randomUUID()}`;
  await db.query(
    `INSERT INTO patients (
       id, clinic_id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, allergies, chronic_conditions
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      clinicId,
      input.firstName.trim(),
      input.lastName.trim(),
      input.email.trim(),
      input.phone?.trim() || null,
      input.dateOfBirth,
      input.gender,
      input.bloodType?.trim() || null,
      JSON.stringify(input.allergies),
      JSON.stringify(input.chronicConditions),
    ],
  );
  return getPatient(userId, id);
}

export async function updatePatient(
  userId: string,
  id: string,
  input: { phone?: string; email?: string; allergies: string[]; chronicConditions: string[] },
): Promise<PublicPatient> {
  const row = await patientById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Patient not found');
  await requireEditor(userId, row.clinic_id);
  await db.query(
    `UPDATE patients
     SET phone = $2, email = $3, allergies = $4, chronic_conditions = $5, updated_at = now()
     WHERE id = $1`,
    [row.id, input.phone?.trim() || null, input.email?.trim() || row.email, JSON.stringify(input.allergies), JSON.stringify(input.chronicConditions)],
  );
  return getPatient(userId, row.id);
}

export async function setPatientActive(userId: string, id: string, isActive: boolean): Promise<PublicPatient> {
  const row = await patientById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Patient not found');
  const roles = await rolesAtClinic(userId, row.clinic_id);
  if (!roles.includes('admin')) throw httpError(403, 'FORBIDDEN', 'Only the clinic admin can change this file');
  await db.query('UPDATE patients SET is_active = $2, updated_at = now() WHERE id = $1', [row.id, isActive]);
  return getPatient(userId, row.id);
}
