import { randomUUID } from 'node:crypto';

import { db } from './db.js';
import { absoluteUrl } from './files.js';

type Medication = {
  name: string;
  dosage: string;
  frequency: string;
  frequencyAr?: string;
  duration: string;
  durationAr?: string;
  instructions?: string;
  instructionsAr?: string;
};

type VisitContext = {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  doctor_user_id: string | null;
  patient_user_id: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
  clinic_name: string;
  clinic_name_ar: string | null;
  clinic_logo_url: string | null;
  signature_url: string | null;
  stamp_url: string | null;
};

type PrescriptionRow = {
  id: string;
  visit_id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string | null;
  number: string | null;
  clinic_id: string | null;
  clinic_name: string | null;
  clinic_name_ar: string | null;
  clinic_logo_url: string | null;
  doctor_signature_url: string | null;
  doctor_stamp_url: string | null;
  medications: string;
  instructions: string | null;
  status: string;
  issued_at: string | Date | null;
  deleted_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  doctor_user_id: string | null;
  patient_user_id: string | null;
  clinic_id_visit: string;
};

type LabRow = {
  id: string;
  visit_id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string | null;
  type: string;
  test_name: string;
  priority: string;
  notes: string | null;
  status: string;
  result_summary: string | null;
  requested_at: string | Date;
  completed_at: string | Date | null;
  doctor_user_id: string | null;
  patient_user_id: string | null;
  clinic_id: string;
};

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function readMedications(value: string): Medication[] {
  try {
    const parsed = JSON.parse(value) as Medication[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function rolesAt(userId: string, clinicId: string): Promise<string[]> {
  const result = await db.query<{ role: string }>('SELECT role FROM memberships WHERE user_id = $1 AND clinic_id = $2', [
    userId,
    clinicId,
  ]);
  return result.rows.map((row) => row.role);
}

async function visitContext(visitId: string): Promise<VisitContext | undefined> {
  const result = await db.query<VisitContext>(
    `SELECT v.id, v.patient_id, v.doctor_id, v.clinic_id,
            d.user_id AS doctor_user_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
            p.user_id AS patient_user_id,
            c.name AS clinic_name, c.name_ar AS clinic_name_ar, c.logo_url AS clinic_logo_url,
            u.signature_url, u.stamp_url
     FROM visits v
     JOIN doctors d ON d.id = v.doctor_id
     JOIN patients p ON p.id = v.patient_id
     JOIN clinics c ON c.id = v.clinic_id
     LEFT JOIN users u ON u.id = d.user_id
     WHERE v.id = $1`,
    [visitId],
  );
  return result.rows[0];
}

function ownsDoctor(userId: string, row: { doctor_id: string; doctor_user_id: string | null }): boolean {
  return row.doctor_id === userId || row.doctor_user_id === userId;
}

function ownsPatient(userId: string, row: { patient_id: string; patient_user_id: string | null }): boolean {
  return row.patient_id === userId || row.patient_user_id === userId;
}

async function requireVisitDoctor(userId: string, visit: VisitContext): Promise<void> {
  const roles = await rolesAt(userId, visit.clinic_id);
  if (!roles.includes('doctor') || !ownsDoctor(userId, visit)) {
    throw httpError(403, 'FORBIDDEN', 'You can only write your own visit');
  }
}

function toPrescription(row: PrescriptionRow, base: string) {
  return {
    id: row.id,
    visitId: row.visit_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name ?? undefined,
    number: row.number ?? undefined,
    clinicId: row.clinic_id ?? undefined,
    clinicName: row.clinic_name ?? undefined,
    clinicNameAr: row.clinic_name_ar ?? undefined,
    clinicLogoUrl: absoluteUrl(base, row.clinic_logo_url),
    doctorSignatureUrl: absoluteUrl(base, row.doctor_signature_url),
    doctorStampUrl: absoluteUrl(base, row.doctor_stamp_url),
    medications: readMedications(row.medications),
    instructions: row.instructions ?? undefined,
    status: row.status,
    issuedAt: row.issued_at ? iso(row.issued_at) : undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    deletedAt: row.deleted_at ? iso(row.deleted_at) : undefined,
  };
}

function toLab(row: LabRow) {
  return {
    id: row.id,
    visitId: row.visit_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name ?? undefined,
    type: row.type,
    testName: row.test_name,
    priority: row.priority === 'urgent' ? 'urgent' : 'routine',
    notes: row.notes ?? undefined,
    status: row.status,
    requestedAt: iso(row.requested_at),
    completedAt: row.completed_at ? iso(row.completed_at) : undefined,
    resultSummary: row.result_summary ?? undefined,
  };
}

const PRESCRIPTION_SELECT = `
  SELECT rx.*, d.user_id AS doctor_user_id, p.user_id AS patient_user_id, v.clinic_id AS clinic_id_visit
  FROM prescriptions rx
  JOIN visits v ON v.id = rx.visit_id
  JOIN doctors d ON d.id = rx.doctor_id
  JOIN patients p ON p.id = rx.patient_id
`;

async function prescriptionById(id: string): Promise<PrescriptionRow | undefined> {
  const result = await db.query<PrescriptionRow>(`${PRESCRIPTION_SELECT} WHERE rx.id = $1`, [id]);
  return result.rows[0];
}

async function nextPrescriptionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await db.query<{ number: string | null }>(
    `SELECT number FROM prescriptions WHERE number LIKE $1`,
    [`RX-${year}-%`],
  );
  const max = result.rows.reduce((highest, row) => {
    const match = row.number?.match(/(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `RX-${year}-${String(max + 1).padStart(4, '0')}`;
}

export async function listPrescriptions(userId: string, visitId: string, base: string) {
  const visit = await visitContext(visitId);
  if (!visit) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  const roles = await rolesAt(userId, visit.clinic_id);
  const staff = roles.some((role) => role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'nurse');
  const patient = roles.includes('patient') && ownsPatient(userId, visit);
  if (!staff && !patient) throw httpError(403, 'FORBIDDEN', 'You cannot open these prescriptions');
  const result = await db.query<PrescriptionRow>(
    `${PRESCRIPTION_SELECT} WHERE rx.visit_id = $1 AND rx.deleted_at IS NULL ORDER BY rx.created_at DESC`,
    [visitId],
  );
  const rows = ownsDoctor(userId, visit) || roles.some((role) => role === 'admin' || role === 'secretary')
    ? result.rows
    : result.rows.filter((row) => row.status === 'issued');
  return rows.map((row) => toPrescription(row, base));
}

export async function createPrescription(
  userId: string,
  input: { visitId: string; medications: Medication[]; instructions?: string },
  base: string,
) {
  const visit = await visitContext(input.visitId);
  if (!visit) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  await requireVisitDoctor(userId, visit);
  const id = `rx-${randomUUID()}`;
  await db.query(
    `INSERT INTO prescriptions (
       id, visit_id, patient_id, doctor_id, doctor_name, medications, instructions, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')`,
    [
      id,
      visit.id,
      visit.patient_id,
      visit.doctor_id,
      `Dr. ${visit.doctor_first_name} ${visit.doctor_last_name}`.trim(),
      JSON.stringify(input.medications),
      input.instructions?.trim() || null,
    ],
  );
  return toPrescription((await prescriptionById(id))!, base);
}

export async function updatePrescription(
  userId: string,
  id: string,
  input: { medications: Medication[]; instructions?: string },
  base: string,
) {
  const row = await prescriptionById(id);
  if (!row || row.deleted_at) throw httpError(404, 'NOT_FOUND', 'Prescription not found');
  if (!ownsDoctor(userId, row)) throw httpError(403, 'FORBIDDEN', 'You can only write your own visit');
  if (row.status === 'issued') throw httpError(400, 'INVALID_STATE', 'An issued prescription cannot be edited');
  await db.query(
    `UPDATE prescriptions SET medications = $2, instructions = $3, updated_at = now() WHERE id = $1`,
    [id, JSON.stringify(input.medications), input.instructions?.trim() || null],
  );
  return toPrescription((await prescriptionById(id))!, base);
}

export async function issuePrescription(userId: string, id: string, base: string) {
  const row = await prescriptionById(id);
  if (!row || row.deleted_at) throw httpError(404, 'NOT_FOUND', 'Prescription not found');
  if (!ownsDoctor(userId, row)) throw httpError(403, 'FORBIDDEN', 'You can only write your own visit');
  if (row.status === 'issued') return toPrescription(row, base);
  if (row.status !== 'draft' && row.status !== 'finalized') {
    throw httpError(400, 'INVALID_STATE', 'Prescription cannot be issued');
  }
  const visit = await visitContext(row.visit_id);
  if (!visit) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  const number = row.number ?? (await nextPrescriptionNumber());
  await db.query(
    `UPDATE prescriptions
     SET number = $2, clinic_id = $3, clinic_name = $4, clinic_name_ar = $5, clinic_logo_url = $6,
         doctor_signature_url = $7, doctor_stamp_url = $8, status = 'issued',
         issued_at = COALESCE(issued_at, now()), updated_at = now()
     WHERE id = $1`,
    [
      id,
      number,
      visit.clinic_id,
      visit.clinic_name,
      visit.clinic_name_ar,
      absoluteUrl(base, visit.clinic_logo_url) ?? null,
      absoluteUrl(base, visit.signature_url) ?? null,
      absoluteUrl(base, visit.stamp_url) ?? null,
    ],
  );
  return toPrescription((await prescriptionById(id))!, base);
}

export async function removePrescription(userId: string, id: string): Promise<void> {
  const row = await prescriptionById(id);
  if (!row || row.deleted_at) throw httpError(404, 'NOT_FOUND', 'Prescription not found');
  if (!ownsDoctor(userId, row)) throw httpError(403, 'FORBIDDEN', 'You can only write your own visit');
  await db.query(`UPDATE prescriptions SET deleted_at = now(), updated_at = now() WHERE id = $1`, [id]);
}

const LAB_SELECT = `
  SELECT l.*, d.user_id AS doctor_user_id, p.user_id AS patient_user_id, v.clinic_id
  FROM lab_requests l
  JOIN visits v ON v.id = l.visit_id
  JOIN doctors d ON d.id = l.doctor_id
  JOIN patients p ON p.id = l.patient_id
`;

export async function listLabRequests(userId: string, visitId: string) {
  const visit = await visitContext(visitId);
  if (!visit) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  const roles = await rolesAt(userId, visit.clinic_id);
  const staff = roles.some((role) => role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'nurse');
  const patient = roles.includes('patient') && ownsPatient(userId, visit);
  if (!staff && !patient) throw httpError(403, 'FORBIDDEN', 'You cannot open these lab requests');
  const result = await db.query<LabRow>(
    `${LAB_SELECT} WHERE l.visit_id = $1 ORDER BY l.requested_at DESC`,
    [visitId],
  );
  return result.rows.map(toLab);
}

export async function createLabRequest(
  userId: string,
  input: { visitId: string; type: 'lab' | 'imaging'; testName: string; priority: 'routine' | 'urgent'; notes?: string },
) {
  const visit = await visitContext(input.visitId);
  if (!visit) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  await requireVisitDoctor(userId, visit);
  const id = `lab-${randomUUID()}`;
  await db.query(
    `INSERT INTO lab_requests (
       id, visit_id, patient_id, doctor_id, doctor_name, type, test_name, priority, notes, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
    [
      id,
      visit.id,
      visit.patient_id,
      visit.doctor_id,
      `Dr. ${visit.doctor_first_name} ${visit.doctor_last_name}`.trim(),
      input.type,
      input.testName.trim(),
      input.priority,
      input.notes?.trim() || null,
    ],
  );
  const created = await db.query<LabRow>(`${LAB_SELECT} WHERE l.id = $1`, [id]);
  return toLab(created.rows[0]);
}
