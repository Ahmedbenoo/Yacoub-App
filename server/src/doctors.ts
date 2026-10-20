import { randomUUID } from 'node:crypto';

import { occupiedSlotIsos } from './appointments.js';
import { db } from './db.js';

type DoctorRow = {
  id: string;
  user_id: string | null;
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
  avatar_url: string | null;
  gender?: string | null;
  languages: string;
  share_percent: number | null;
  is_active: boolean;
  slot_minutes: number;
  created_at: string;
  updated_at: string;
};

type SlotRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type PublicDoctor = {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  branchId: string;
  branchName: string;
  avatarUrl?: string;
  gender?: 'male' | 'female';
  languages: string[];
  sharePercent?: number;
  isActive?: boolean;
};

export type PublicAvailability = {
  doctorId: string;
  branchId: string;
  branchName: string;
  slotMinutes: number;
  takenSlots: string[];
  slots: { dayOfWeek: number; startTime: string; endTime: string }[];
};

type SeedDoctor = {
  id: string;
  userId?: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  branchId: string;
  branchName: string;
  languages: string[];
};

const SEED_DOCTORS: SeedDoctor[] = [
  {
    id: 'user-doctor-001',
    userId: 'user-doctor-001',
    clinicId: 'clinic-001',
    firstName: 'Eslam',
    lastName: 'Shaban',
    email: 'doctor@clinic.com',
    phone: '+201000000010',
    specialty: 'General Medicine',
    bio: 'Experienced general practitioner focused on preventive care and chronic disease management.',
    rating: 4.8,
    reviewCount: 124,
    yearsExperience: 12,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    languages: ['English', 'Arabic'],
  },
  {
    id: 'user-doctor-002',
    clinicId: 'clinic-001',
    firstName: 'Mona',
    lastName: 'Farid',
    email: 'mona.farid@clinic.com',
    phone: '+201000000011',
    specialty: 'Dermatology',
    bio: 'Specialist in skin conditions, cosmetic dermatology, and allergy-related skin care.',
    rating: 4.9,
    reviewCount: 89,
    yearsExperience: 9,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    languages: ['English', 'Arabic'],
  },
  {
    id: 'user-doctor-003',
    clinicId: 'clinic-001',
    firstName: 'Karim',
    lastName: 'Salah',
    email: 'karim.salah@clinic.com',
    phone: '+201000000012',
    specialty: 'Pediatrics',
    bio: 'Dedicated pediatrician providing comprehensive care for infants, children, and adolescents.',
    rating: 4.7,
    reviewCount: 156,
    yearsExperience: 15,
    branchId: 'branch-002',
    branchName: 'North Branch',
    languages: ['Arabic', 'English'],
  },
  {
    id: 'user-doctor-004',
    clinicId: 'clinic-001',
    firstName: 'Layla',
    lastName: 'Nabil',
    email: 'layla.nabil@clinic.com',
    phone: '+201000000013',
    specialty: 'Cardiology',
    bio: 'Cardiologist specializing in hypertension, heart disease prevention, and cardiac rehabilitation.',
    rating: 4.6,
    reviewCount: 67,
    yearsExperience: 11,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    languages: ['English', 'Arabic', 'French'],
  },
  {
    id: 'user-doctor-005',
    clinicId: 'clinic-002',
    firstName: 'Omar',
    lastName: 'Rashid',
    email: 'omar.rashid@clinic.com',
    phone: '+201000000014',
    specialty: 'Orthopedics',
    bio: 'Orthopedic surgeon specializing in sports injuries, joint care, and rehabilitation.',
    rating: 4.8,
    reviewCount: 52,
    yearsExperience: 10,
    branchId: 'branch-downtown',
    branchName: 'Downtown Branch',
    languages: ['Arabic', 'English'],
  },
  {
    id: 'user-doctor-006',
    clinicId: 'clinic-002',
    firstName: 'Hana',
    lastName: 'Mostafa',
    email: 'hana.mostafa@clinic.com',
    phone: '+201000000015',
    specialty: 'Internal Medicine',
    bio: 'Internist focused on chronic disease management and preventive health screenings.',
    rating: 4.7,
    reviewCount: 41,
    yearsExperience: 8,
    branchId: 'branch-downtown',
    branchName: 'Downtown Branch',
    languages: ['English', 'Arabic'],
  },
  {
    id: 'user-doctor-007',
    userId: 'user-doctor-007',
    clinicId: 'clinic-001',
    firstName: 'Mariam',
    lastName: 'Saleh',
    email: 'obgyn@clinic.com',
    phone: '+201000000016',
    specialty: 'Obstetrics and Gynecology',
    bio: 'Obstetrician and gynecologist for antenatal care and gynecology consultations.',
    rating: 4.8,
    reviewCount: 36,
    yearsExperience: 11,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    languages: ['Arabic', 'English'],
  },
];

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function readLanguages(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function applyUserAvatars(rows: DoctorRow[]): Promise<DoctorRow[]> {
  const missing = rows.filter((row) => !row.avatar_url);
  if (!missing.length) return rows;
  const ids = [...new Set(missing.flatMap((row) => [row.id, row.user_id].filter((id): id is string => Boolean(id))))];
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
  const users = await db.query<{ id: string; avatar_url: string | null }>(
    `SELECT id, avatar_url FROM users WHERE id IN (${placeholders})`,
    ids,
  );
  const byId = new Map(users.rows.map((user) => [user.id, user.avatar_url]));
  return rows.map((row) => {
    if (row.avatar_url) return row;
    return { ...row, avatar_url: byId.get(row.user_id ?? '') || byId.get(row.id) || null };
  });
}

function toPublicDoctor(row: DoctorRow): PublicDoctor {
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
    avatarUrl: row.avatar_url ?? undefined,
    gender: row.gender === 'male' || row.gender === 'female' ? row.gender : undefined,
    languages: readLanguages(row.languages),
    sharePercent: row.share_percent ?? undefined,
    isActive: row.is_active,
  };
}

async function doctorById(id: string): Promise<DoctorRow | undefined> {
  const result = await db.query<DoctorRow>(
    'SELECT * FROM doctors WHERE id = $1 OR user_id = $1 ORDER BY id LIMIT 1',
    [id],
  );
  const [row] = await applyUserAvatars(result.rows);
  return row;
}

async function slotsFor(doctorId: string): Promise<SlotRow[]> {
  const result = await db.query<SlotRow>(
    `SELECT day_of_week, start_time, end_time
     FROM doctor_slots
     WHERE doctor_id = $1
     ORDER BY day_of_week, start_time`,
    [doctorId],
  );
  return result.rows;
}

function toAvailability(row: DoctorRow, slots: SlotRow[], takenSlots: string[]): PublicAvailability {
  return {
    doctorId: row.id,
    branchId: row.branch_id,
    branchName: row.branch_name,
    slotMinutes: row.slot_minutes,
    takenSlots,
    slots: slots.map((slot) => ({
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
    })),
  };
}

export async function seedDoctors(): Promise<void> {
  for (const doctor of SEED_DOCTORS) {
    await db.query(
      `INSERT INTO doctors (
         id, user_id, clinic_id, first_name, last_name, email, phone, specialty, bio,
         rating, review_count, years_experience, branch_id, branch_name, languages
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        doctor.id,
        doctor.userId ?? null,
        doctor.clinicId,
        doctor.firstName,
        doctor.lastName,
        doctor.email,
        doctor.phone,
        doctor.specialty,
        doctor.bio,
        doctor.rating,
        doctor.reviewCount,
        doctor.yearsExperience,
        doctor.branchId,
        doctor.branchName,
        JSON.stringify(doctor.languages),
      ],
    );

    const existing = await db.query<{ total: number }>(
      'SELECT count(*)::int AS total FROM doctor_slots WHERE doctor_id = $1',
      [doctor.id],
    );
    if (Number(existing.rows[0]?.total ?? 0) > 0) continue;

    for (let day = 0; day < 7; day += 1) {
      await db.query(
        `INSERT INTO doctor_slots (id, doctor_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, '09:00', '17:00')`,
        [`${doctor.id}-day-${day}`, doctor.id, day],
      );
    }
  }
}

export async function listDoctors(filters: {
  search?: string;
  specialty?: string;
  clinicId?: string;
  allClinics?: boolean;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: PublicDoctor[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const search = filters.search?.trim() ?? '';
  const specialty = filters.specialty?.trim() ?? '';
  const clinicId = filters.clinicId?.trim() ?? '';
  const where = `($1 = true OR is_active = true)
    AND ($2 = '' OR clinic_id = $2)
    AND ($3 = '' OR specialty = $3)
    AND (
      $4 = ''
      OR first_name ILIKE $5
      OR last_name ILIKE $5
      OR specialty ILIKE $5
    )`;
  const params = [Boolean(filters.includeInactive), clinicId, specialty, search, `%${search}%`];
  const totalResult = await db.query<{ total: number }>(`SELECT count(*)::int AS total FROM doctors WHERE ${where}`, params);
  const total = Number(totalResult.rows[0]?.total ?? 0);
  const result = await db.query<DoctorRow>(
    `SELECT * FROM doctors
     WHERE ${where}
     ORDER BY id
     LIMIT $6 OFFSET $7`,
    [...params, limit, (page - 1) * limit],
  );
  const rows = await applyUserAvatars(result.rows);
  return {
    data: rows.map(toPublicDoctor),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getDoctor(id: string): Promise<PublicDoctor> {
  const row = await doctorById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Doctor not found');
  return toPublicDoctor(row);
}

export async function getAvailability(id: string): Promise<PublicAvailability> {
  const row = await doctorById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Doctor not found');
  return toAvailability(row, await slotsFor(row.id), await occupiedSlotIsos(row.id));
}

function validTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function updateAvailability(
  userId: string,
  doctorId: string,
  payload: { slots: { dayOfWeek: number; startTime: string; endTime: string }[]; slotMinutes?: number },
): Promise<PublicAvailability> {
  const doctor = await doctorById(doctorId);
  if (!doctor) throw httpError(404, 'NOT_FOUND', 'Doctor not found');

  const membership = await db.query<{ role: string }>(
    `SELECT role FROM memberships
     WHERE user_id = $1 AND clinic_id = $2 AND role = 'admin'`,
    [userId, doctor.clinic_id],
  );
  const ownsProfile = doctor.user_id === userId || doctor.id === userId;
  if (!membership.rows[0] && !ownsProfile) {
    throw httpError(403, 'FORBIDDEN', 'Only the clinic admin or the doctor can edit this schedule');
  }

  for (const slot of payload.slots) {
    if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6 || !validTime(slot.startTime) || !validTime(slot.endTime) || slot.startTime >= slot.endTime) {
      throw httpError(400, 'VALIDATION_ERROR', 'Schedule hours are invalid');
    }
  }

  const slotMinutes = payload.slotMinutes && payload.slotMinutes > 0 ? payload.slotMinutes : doctor.slot_minutes;
  await db.query('UPDATE doctors SET slot_minutes = $2, updated_at = now() WHERE id = $1', [doctor.id, slotMinutes]);
  await db.query('DELETE FROM doctor_slots WHERE doctor_id = $1', [doctor.id]);
  for (const slot of payload.slots) {
    await db.query(
      `INSERT INTO doctor_slots (id, doctor_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), doctor.id, slot.dayOfWeek, slot.startTime, slot.endTime],
    );
  }

  return toAvailability(
    { ...doctor, slot_minutes: slotMinutes },
    await slotsFor(doctor.id),
    await occupiedSlotIsos(doctor.id),
  );
}
