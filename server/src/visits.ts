import { randomUUID } from 'node:crypto';

import { db } from './db.js';

type VisitRow = {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  status: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  symptoms: string | null;
  notes: string | null;
  vitals: string;
  started_at: string | Date;
  completed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  doctor_user_id: string | null;
  patient_user_id: string | null;
};

type Vitals = {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
};

export type PublicVisit = {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  status: 'in_progress' | 'completed';
  chiefComplaint?: string;
  diagnosis?: string;
  symptoms?: string;
  notes?: string;
  vitals?: Vitals;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function readVitals(value: string): Vitals | undefined {
  try {
    const parsed = JSON.parse(value) as Vitals;
    if (!parsed || typeof parsed !== 'object') return undefined;
    const vitals: Vitals = {};
    if (typeof parsed.bloodPressure === 'string' && parsed.bloodPressure) vitals.bloodPressure = parsed.bloodPressure;
    if (typeof parsed.heartRate === 'number') vitals.heartRate = parsed.heartRate;
    if (typeof parsed.temperature === 'number') vitals.temperature = parsed.temperature;
    if (typeof parsed.weight === 'number') vitals.weight = parsed.weight;
    return Object.keys(vitals).length ? vitals : undefined;
  } catch {
    return undefined;
  }
}

const SELECT_VISIT = `
  SELECT v.*, d.user_id AS doctor_user_id, p.user_id AS patient_user_id
  FROM visits v
  JOIN doctors d ON d.id = v.doctor_id
  JOIN patients p ON p.id = v.patient_id
`;

function toPublic(row: VisitRow): PublicVisit {
  return {
    id: row.id,
    appointmentId: row.appointment_id ?? undefined,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    clinicId: row.clinic_id,
    status: row.status === 'completed' ? 'completed' : 'in_progress',
    chiefComplaint: row.chief_complaint ?? undefined,
    diagnosis: row.diagnosis ?? undefined,
    symptoms: row.symptoms ?? undefined,
    notes: row.notes ?? undefined,
    vitals: readVitals(row.vitals),
    startedAt: iso(row.started_at),
    completedAt: row.completed_at ? iso(row.completed_at) : undefined,
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

function ownsDoctor(userId: string, row: { doctor_id: string; doctor_user_id: string | null }): boolean {
  return row.doctor_id === userId || row.doctor_user_id === userId;
}

function ownsPatient(userId: string, row: { patient_id: string; patient_user_id: string | null }): boolean {
  return row.patient_id === userId || row.patient_user_id === userId;
}

async function rowById(id: string): Promise<VisitRow | undefined> {
  const result = await db.query<VisitRow>(`${SELECT_VISIT} WHERE v.id = $1`, [id]);
  return result.rows[0];
}

async function requireVisible(userId: string, id: string): Promise<VisitRow> {
  const row = await rowById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  const roles = await rolesAt(userId, row.clinic_id);
  const staff = roles.some((role) => role === 'admin' || role === 'secretary' || role === 'nurse' || role === 'nursing_admin');
  const allowed = staff || (roles.includes('doctor') && ownsDoctor(userId, row)) || (roles.includes('patient') && ownsPatient(userId, row));
  if (!allowed) throw httpError(403, 'FORBIDDEN', 'You cannot open this visit');
  return row;
}

async function requireOwningDoctor(userId: string, row: VisitRow): Promise<void> {
  const roles = await rolesAt(userId, row.clinic_id);
  if (!roles.includes('doctor') || !ownsDoctor(userId, row)) {
    throw httpError(403, 'FORBIDDEN', 'You can only open your own visit');
  }
}

export async function getVisit(userId: string, id: string): Promise<PublicVisit> {
  return toPublic(await requireVisible(userId, id));
}

export async function listVisits(userId: string, patientId: string): Promise<PublicVisit[]> {
  const patient = await db.query<{ id: string; clinic_id: string; user_id: string | null }>(
    'SELECT id, clinic_id, user_id FROM patients WHERE id = $1 OR user_id = $1 ORDER BY id LIMIT 1',
    [patientId],
  );
  const file = patient.rows[0];
  if (!file) return [];
  const roles = await rolesAt(userId, file.clinic_id);
  const staff = roles.some((role) => role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'nurse' || role === 'nursing_admin');
  if (!staff && file.user_id !== userId && file.id !== userId) {
    throw httpError(403, 'FORBIDDEN', 'You cannot open this file');
  }
  const result = await db.query<VisitRow>(
    `${SELECT_VISIT} WHERE v.patient_id = $1 ORDER BY v.started_at DESC`,
    [file.id],
  );
  if (roles.includes('doctor') && !roles.includes('admin') && !roles.includes('secretary')) {
    return result.rows.filter((row) => ownsDoctor(userId, row)).map(toPublic);
  }
  return result.rows.map(toPublic);
}

export async function activeVisit(userId: string, patientId: string): Promise<PublicVisit | null> {
  const visits = await listVisits(userId, patientId);
  return visits.find((visit) => visit.status === 'in_progress') ?? null;
}

export async function startVisit(
  userId: string,
  input: { appointmentId?: string; patientId: string; chiefComplaint?: string },
): Promise<PublicVisit> {
  const doctorResult = await db.query<{ id: string; clinic_id: string; user_id: string | null }>(
    'SELECT id, clinic_id, user_id FROM doctors WHERE (id = $1 OR user_id = $1) AND is_active = true ORDER BY id LIMIT 1',
    [userId],
  );
  const doctor = doctorResult.rows[0];
  if (!doctor) throw httpError(403, 'FORBIDDEN', 'You can only open your own visit');

  let clinicId = doctor.clinic_id;
  let patientLookup = input.patientId;
  let appointmentId: string | null = null;

  if (input.appointmentId) {
    const appointment = await db.query<{
      id: string;
      clinic_id: string;
      doctor_id: string;
      patient_id: string;
      status: string;
      doctor_user_id: string | null;
    }>(
      `SELECT a.id, a.clinic_id, a.doctor_id, a.patient_id, a.status, d.user_id AS doctor_user_id
       FROM appointments a JOIN doctors d ON d.id = a.doctor_id WHERE a.id = $1`,
      [input.appointmentId],
    );
    const row = appointment.rows[0];
    if (!row) throw httpError(404, 'NOT_FOUND', 'Appointment not found');
    if (row.doctor_id !== doctor.id && row.doctor_user_id !== userId) {
      throw httpError(403, 'FORBIDDEN', 'You can only open your own visit');
    }
    if (!['scheduled', 'confirmed', 'in_progress'].includes(row.status)) {
      throw httpError(400, 'INVALID_STATUS', 'This appointment cannot be started');
    }
    clinicId = row.clinic_id;
    patientLookup = row.patient_id;
    appointmentId = row.id;
    await db.query(
      `UPDATE appointments SET status = 'in_progress', updated_at = now()
       WHERE id = $1 AND status IN ('scheduled', 'confirmed', 'in_progress')`,
      [row.id],
    );
  }

  const patient = await db.query<{ id: string }>(
    `SELECT id FROM patients
     WHERE clinic_id = $1 AND is_active = true AND (id = $2 OR user_id = $2)
     ORDER BY id LIMIT 1`,
    [clinicId, patientLookup],
  );
  const file = patient.rows[0];
  if (!file) throw httpError(404, 'NOT_FOUND', 'Patient file not found');
  if (input.appointmentId && input.patientId && input.patientId !== file.id && input.patientId !== patientLookup) {
    const same = await db.query<{ id: string }>(
      'SELECT id FROM patients WHERE id = $1 AND (id = $2 OR user_id = $2)',
      [file.id, input.patientId],
    );
    if (!same.rows[0]) throw httpError(400, 'VALIDATION_ERROR', 'The patient does not match the appointment');
  }

  const open = await db.query<VisitRow>(
    `${SELECT_VISIT}
     WHERE v.patient_id = $1 AND v.doctor_id = $2 AND v.status = 'in_progress'
       AND ($3::text IS NULL OR v.appointment_id = $3)
     ORDER BY v.started_at DESC LIMIT 1`,
    [file.id, doctor.id, appointmentId],
  );
  if (open.rows[0]) return toPublic(open.rows[0]);

  const id = `visit-${randomUUID()}`;
  await db.query(
    `INSERT INTO visits (
       id, appointment_id, patient_id, doctor_id, clinic_id, status, chief_complaint, vitals
     ) VALUES ($1, $2, $3, $4, $5, 'in_progress', $6, '{}')`,
    [id, appointmentId, file.id, doctor.id, clinicId, input.chiefComplaint?.trim() || null],
  );
  return toPublic((await rowById(id))!);
}

export async function updateVisit(
  userId: string,
  id: string,
  input: { chiefComplaint?: string; diagnosis?: string; symptoms?: string; notes?: string; vitals?: Vitals },
): Promise<PublicVisit> {
  const row = await rowById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  await requireOwningDoctor(userId, row);
  if (row.status !== 'in_progress') throw httpError(400, 'INVALID_STATUS', 'This visit is already complete');
  await db.query(
    `UPDATE visits
     SET chief_complaint = COALESCE($2, chief_complaint),
         diagnosis = COALESCE($3, diagnosis),
         symptoms = COALESCE($4, symptoms),
         notes = COALESCE($5, notes),
         vitals = COALESCE($6, vitals),
         updated_at = now()
     WHERE id = $1`,
    [
      id,
      input.chiefComplaint ?? null,
      input.diagnosis ?? null,
      input.symptoms ?? null,
      input.notes ?? null,
      input.vitals ? JSON.stringify(input.vitals) : null,
    ],
  );
  return toPublic((await rowById(id))!);
}

export async function completeVisit(userId: string, id: string): Promise<PublicVisit> {
  const row = await rowById(id);
  if (!row) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  await requireOwningDoctor(userId, row);
  if (row.status !== 'in_progress') throw httpError(400, 'INVALID_STATUS', 'This visit is already complete');
  await db.query(
    `UPDATE visits SET status = 'completed', completed_at = now(), updated_at = now() WHERE id = $1`,
    [id],
  );
  if (row.appointment_id) {
    await db.query(
      `UPDATE appointments SET status = 'completed', updated_at = now()
       WHERE id = $1 AND status IN ('scheduled', 'confirmed', 'in_progress')`,
      [row.appointment_id],
    );
  }
  return toPublic((await rowById(id))!);
}
