import { db } from './db.js';
import { absoluteUrl } from './files.js';
import { getVisit } from './visits.js';

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

type HistoryEntry = {
  id: string;
  patientId: string;
  type: 'visit' | 'prescription' | 'lab';
  title: string;
  description: string;
  date: string;
  resourceId: string;
  doctorId: string;
};

type Viewer = {
  userId: string;
  doctorOnly: boolean;
  redactVisits: boolean;
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

function placeholders(start: number, count: number): string {
  return Array.from({ length: count }, (_, index) => `$${start + index}`).join(', ');
}

async function filesForUser(userId: string): Promise<{ id: string; clinic_id: string }[]> {
  const result = await db.query<{ id: string; clinic_id: string }>(
    'SELECT id, clinic_id FROM patients WHERE user_id = $1 OR id = $1',
    [userId],
  );
  return result.rows;
}

async function findPatient(patientKey: string): Promise<{ id: string; clinic_id: string; user_id: string | null } | undefined> {
  const result = await db.query<{ id: string; clinic_id: string; user_id: string | null }>(
    'SELECT id, clinic_id, user_id FROM patients WHERE id = $1 OR user_id = $1 ORDER BY id LIMIT 1',
    [patientKey],
  );
  return result.rows[0];
}

function ownsDoctor(userId: string, row: { doctor_id: string; doctor_user_id: string | null }): boolean {
  return row.doctor_id === userId || row.doctor_user_id === userId;
}

async function entriesFor(patientIds: string[], viewer: Viewer): Promise<HistoryEntry[]> {
  if (patientIds.length === 0) return [];
  const ids = placeholders(1, patientIds.length);
  const visits = await db.query<{
    id: string;
    patient_id: string;
    doctor_id: string;
    doctor_user_id: string | null;
    chief_complaint: string | null;
    diagnosis: string | null;
    started_at: string | Date;
    completed_at: string | Date | null;
  }>(
    `SELECT v.id, v.patient_id, v.doctor_id, d.user_id AS doctor_user_id, v.chief_complaint, v.diagnosis,
            v.started_at, v.completed_at
     FROM visits v JOIN doctors d ON d.id = v.doctor_id
     WHERE v.patient_id IN (${ids})`,
    patientIds,
  );
  const prescriptions = await db.query<{
    id: string;
    patient_id: string;
    doctor_id: string;
    doctor_user_id: string | null;
    medications: string;
    instructions: string | null;
    issued_at: string | Date | null;
    updated_at: string | Date;
    created_at: string | Date;
  }>(
    `SELECT rx.id, rx.patient_id, rx.doctor_id, d.user_id AS doctor_user_id, rx.medications, rx.instructions,
            rx.issued_at, rx.updated_at, rx.created_at
     FROM prescriptions rx JOIN doctors d ON d.id = rx.doctor_id
     WHERE rx.patient_id IN (${ids}) AND rx.deleted_at IS NULL AND rx.status = 'issued'`,
    patientIds,
  );
  const labs = await db.query<{
    id: string;
    patient_id: string;
    doctor_id: string;
    doctor_user_id: string | null;
    test_name: string;
    result_summary: string | null;
    notes: string | null;
    requested_at: string | Date;
    completed_at: string | Date | null;
  }>(
    `SELECT l.id, l.patient_id, l.doctor_id, d.user_id AS doctor_user_id, l.test_name, l.result_summary, l.notes,
            l.requested_at, l.completed_at
     FROM lab_requests l JOIN doctors d ON d.id = l.doctor_id
     WHERE l.patient_id IN (${ids})`,
    patientIds,
  );

  const visitEntries: HistoryEntry[] = visits.rows
    .filter((row) => !viewer.doctorOnly || ownsDoctor(viewer.userId, row))
    .map((row) => ({
      id: `hist-visit-${row.id}`,
      patientId: row.patient_id,
      type: 'visit',
      title: viewer.redactVisits ? 'Visit' : row.diagnosis || row.chief_complaint || 'Visit',
      description: viewer.redactVisits ? '' : row.chief_complaint ?? '',
      date: iso(row.completed_at ?? row.started_at),
      resourceId: row.id,
      doctorId: row.doctor_id,
    }));
  const prescriptionEntries: HistoryEntry[] = prescriptions.rows
    .filter((row) => !viewer.doctorOnly || ownsDoctor(viewer.userId, row))
    .map((row) => {
      const first = readMedications(row.medications)[0];
      return {
        id: `hist-rx-${row.id}`,
        patientId: row.patient_id,
        type: 'prescription' as const,
        title: first ? `${first.name} ${first.dosage}`.trim() : 'Prescription',
        description: first?.frequency ?? row.instructions ?? '',
        date: iso(row.issued_at ?? row.updated_at ?? row.created_at),
        resourceId: row.id,
        doctorId: row.doctor_id,
      };
    });
  const labEntries: HistoryEntry[] = labs.rows
    .filter((row) => !viewer.doctorOnly || ownsDoctor(viewer.userId, row))
    .map((row) => ({
      id: `hist-lab-${row.id}`,
      patientId: row.patient_id,
      type: 'lab',
      title: row.test_name,
      description: row.result_summary ?? row.notes ?? '',
      date: iso(row.completed_at ?? row.requested_at),
      resourceId: row.id,
      doctorId: row.doctor_id,
    }));

  return [...visitEntries, ...prescriptionEntries, ...labEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

async function viewerFor(userId: string, patient: { id: string; clinic_id: string; user_id: string | null }): Promise<Viewer> {
  const roles = await rolesAt(userId, patient.clinic_id);
  const owns = patient.user_id === userId || patient.id === userId;
  const staff = roles.some((role) => role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'nurse' || role === 'nursing_admin');
  if (!staff && !(roles.includes('patient') && owns)) {
    throw httpError(403, 'FORBIDDEN', 'You cannot open this file');
  }
  return {
    userId,
    doctorOnly: roles.includes('doctor') && !roles.includes('admin') && !roles.includes('secretary'),
    redactVisits: (roles.includes('admin') || roles.includes('secretary')) && !roles.includes('doctor'),
  };
}

export async function historyForPatient(userId: string, patientKey: string): Promise<HistoryEntry[]> {
  const patient = await findPatient(patientKey);
  if (!patient) throw httpError(404, 'NOT_FOUND', 'Patient not found');
  const viewer = await viewerFor(userId, patient);
  return entriesFor([patient.id], viewer);
}

export async function myHistory(userId: string): Promise<HistoryEntry[]> {
  const files = await filesForUser(userId);
  return entriesFor(
    files.map((file) => file.id),
    { userId, doctorOnly: false, redactVisits: false },
  );
}

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
  patient_user_id: string | null;
  clinic_id_visit: string;
};

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

const PRESCRIPTION_SELECT = `
  SELECT rx.*, p.user_id AS patient_user_id, v.clinic_id AS clinic_id_visit
  FROM prescriptions rx
  JOIN visits v ON v.id = rx.visit_id
  JOIN patients p ON p.id = rx.patient_id
`;

async function visiblePrescription(userId: string, id: string, base: string) {
  const result = await db.query<PrescriptionRow>(`${PRESCRIPTION_SELECT} WHERE rx.id = $1`, [id]);
  const row = result.rows[0];
  if (!row || row.deleted_at || row.status !== 'issued') throw httpError(404, 'NOT_FOUND', 'Prescription not found');
  const roles = await rolesAt(userId, row.clinic_id_visit);
  const staff = roles.some((role) => role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'nurse');
  const owns = row.patient_user_id === userId || row.patient_id === userId;
  if (!staff && !(roles.includes('patient') && owns)) throw httpError(403, 'FORBIDDEN', 'You cannot open this prescription');
  return toPrescription(row, base);
}

export async function myPrescriptions(userId: string, base: string) {
  const files = await filesForUser(userId);
  if (files.length === 0) return [];
  const ids = placeholders(1, files.length);
  const result = await db.query<PrescriptionRow>(
    `${PRESCRIPTION_SELECT} WHERE rx.patient_id IN (${ids}) AND rx.deleted_at IS NULL AND rx.status = 'issued'
     ORDER BY rx.issued_at DESC`,
    files.map((file) => file.id),
  );
  return result.rows.map((row) => toPrescription(row, base));
}

export async function myPrescription(userId: string, id: string, base: string) {
  const prescription = await visiblePrescription(userId, id, base);
  const files = await filesForUser(userId);
  if (!files.some((file) => file.id === prescription.patientId)) {
    throw httpError(404, 'NOT_FOUND', 'Prescription not found');
  }
  return prescription;
}

export async function staffPrescription(userId: string, id: string, base: string) {
  return visiblePrescription(userId, id, base);
}

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
  patient_user_id: string | null;
  clinic_id: string;
};

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

const LAB_SELECT = `
  SELECT l.*, p.user_id AS patient_user_id, v.clinic_id
  FROM lab_requests l
  JOIN visits v ON v.id = l.visit_id
  JOIN patients p ON p.id = l.patient_id
`;

async function visibleLab(userId: string, id: string) {
  const result = await db.query<LabRow>(`${LAB_SELECT} WHERE l.id = $1`, [id]);
  const row = result.rows[0];
  if (!row) throw httpError(404, 'NOT_FOUND', 'Lab result not found');
  const roles = await rolesAt(userId, row.clinic_id);
  const staff = roles.some((role) => role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'nurse');
  const owns = row.patient_user_id === userId || row.patient_id === userId;
  if (!staff && !(roles.includes('patient') && owns)) throw httpError(403, 'FORBIDDEN', 'You cannot open this lab result');
  return row;
}

export async function myLabResults(userId: string) {
  const files = await filesForUser(userId);
  if (files.length === 0) return [];
  const ids = placeholders(1, files.length);
  const result = await db.query<LabRow>(
    `${LAB_SELECT} WHERE l.patient_id IN (${ids}) ORDER BY l.requested_at DESC`,
    files.map((file) => file.id),
  );
  return result.rows.map(toLab);
}

export async function myLabResult(userId: string, id: string) {
  const row = await visibleLab(userId, id);
  const files = await filesForUser(userId);
  if (!files.some((file) => file.id === row.patient_id)) throw httpError(404, 'NOT_FOUND', 'Lab result not found');
  return toLab(row);
}

export async function staffLabResult(userId: string, id: string) {
  return toLab(await visibleLab(userId, id));
}

export async function recordLabResult(userId: string, id: string, resultSummary: string) {
  const row = await visibleLab(userId, id);
  const roles = await rolesAt(userId, row.clinic_id);
  if (!roles.includes('admin') && !roles.includes('secretary')) {
    throw httpError(403, 'FORBIDDEN', 'Only the clinic desk can record a result');
  }
  const summary = resultSummary.trim();
  if (!summary) throw httpError(400, 'VALIDATION_ERROR', 'Result is required');
  await db.query(
    `UPDATE lab_requests SET result_summary = $2, status = 'completed', completed_at = now() WHERE id = $1`,
    [id, summary],
  );
  return toLab((await db.query<LabRow>(`${LAB_SELECT} WHERE l.id = $1`, [id])).rows[0]);
}

export async function visitDetail(userId: string, id: string) {
  const visit = await getVisit(userId, id);
  const doctor = await db.query<{ first_name: string; last_name: string }>(
    'SELECT first_name, last_name FROM doctors WHERE id = $1',
    [visit.doctorId],
  );
  const name = doctor.rows[0];
  const prescriptions = await db.query<{ id: string }>(
    `SELECT id FROM prescriptions WHERE visit_id = $1 AND deleted_at IS NULL AND status = 'issued'`,
    [id],
  );
  const labs = await db.query<{ id: string }>('SELECT id FROM lab_requests WHERE visit_id = $1', [id]);
  const roles = await rolesAt(userId, visit.clinicId);
  const redact = (roles.includes('admin') || roles.includes('secretary')) && !roles.includes('doctor');
  return {
    ...visit,
    chiefComplaint: redact ? undefined : visit.chiefComplaint,
    diagnosis: redact ? undefined : visit.diagnosis,
    symptoms: redact ? undefined : visit.symptoms,
    notes: redact ? undefined : visit.notes,
    vitals: redact ? undefined : visit.vitals,
    doctorName: name ? `Dr. ${name.first_name} ${name.last_name}`.trim() : 'Unknown doctor',
    linkedPrescriptionIds: prescriptions.rows.map((row) => row.id),
    linkedLabResultIds: labs.rows.map((row) => row.id),
  };
}
