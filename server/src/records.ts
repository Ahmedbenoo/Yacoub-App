import { randomUUID } from 'node:crypto';

import { db } from './db.js';
import { absoluteUrl, storeImage } from './files.js';
import { pushNotification } from './notifications.js';
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
  type: 'visit' | 'prescription' | 'lab' | 'radiology';
  title: string;
  description: string;
  date: string;
  resourceId: string;
  doctorId?: string;
  visitId?: string;
  source: 'clinic' | 'patient';
  imageUrl?: string;
  doctorReply?: string;
};

export type PatientVisitLink = {
  id: string;
  kind: 'visit' | 'appointment' | 'lab';
  visitId?: string;
  appointmentId?: string;
  labRequestId?: string;
  doctorId: string;
  doctorName: string;
  date: string;
  testName?: string;
};

function doctorDisplayName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ').trim();
}

const DOCUMENT_TITLES: Record<'prescription' | 'lab' | 'radiology', string> = {
  prescription: 'Prescription photo',
  lab: 'Lab result photo',
  radiology: 'Scan photo',
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
    type: string;
    test_name: string;
    result_summary: string | null;
    notes: string | null;
    requested_at: string | Date;
    completed_at: string | Date | null;
  }>(
    `SELECT l.id, l.patient_id, l.doctor_id, d.user_id AS doctor_user_id, l.type, l.test_name, l.result_summary, l.notes,
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
      source: 'clinic',
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
        source: 'clinic',
      };
    });
  const labEntries: HistoryEntry[] = labs.rows
    .filter((row) => !viewer.doctorOnly || ownsDoctor(viewer.userId, row))
    .map((row) => {
      const radiology = row.type === 'imaging';
      return {
        id: `hist-lab-${row.id}`,
        patientId: row.patient_id,
        type: radiology ? ('radiology' as const) : ('lab' as const),
        title: row.test_name,
        description: row.result_summary ?? row.notes ?? '',
        date: iso(row.completed_at ?? row.requested_at),
        resourceId: row.id,
        doctorId: row.doctor_id,
        source: 'clinic' as const,
      };
    });

  return [...visitEntries, ...prescriptionEntries, ...labEntries];
}

async function documentEntries(
  patientIds: string[],
  userIds: string[],
  base: string,
): Promise<HistoryEntry[]> {
  if (patientIds.length === 0 && userIds.length === 0) return [];
  const clauses: string[] = [];
  const params: string[] = [];
  if (patientIds.length > 0) {
    clauses.push(`pd.patient_id IN (${placeholders(params.length + 1, patientIds.length)})`);
    params.push(...patientIds);
  }
  if (userIds.length > 0) {
    clauses.push(`pd.patient_user_id IN (${placeholders(params.length + 1, userIds.length)})`);
    params.push(...userIds);
  }
  const result = await db.query<{
    id: string;
    patient_id: string;
    kind: string;
    image_url: string;
    note: string | null;
    created_at: string | Date;
    visit_id: string | null;
    doctor_id: string | null;
    doctor_reply: string | null;
    first_name: string | null;
    last_name: string | null;
  }>(
    `SELECT pd.id, pd.patient_id, pd.kind, pd.image_url, pd.note, pd.created_at, pd.visit_id, pd.doctor_id,
            pd.doctor_reply, d.first_name, d.last_name
     FROM patient_documents pd
     LEFT JOIN doctors d ON d.id = pd.doctor_id
     WHERE ${clauses.join(' OR ')}
     ORDER BY pd.created_at DESC`,
    params,
  );
  const seen = new Set<string>();
  const entries: HistoryEntry[] = [];
  for (const row of result.rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const kind = row.kind === 'prescription' || row.kind === 'radiology' ? row.kind : 'lab';
    const doctorName = doctorDisplayName(row.first_name, row.last_name);
    entries.push({
      id: `hist-doc-${row.id}`,
      patientId: row.patient_id,
      type: kind,
      title: row.note?.trim() || DOCUMENT_TITLES[kind],
      description: doctorName,
      date: iso(row.created_at),
      resourceId: row.id,
      doctorId: row.doctor_id ?? undefined,
      visitId: row.visit_id ?? undefined,
      source: 'patient',
      imageUrl: absoluteUrl(base, row.image_url),
      doctorReply: row.doctor_reply ?? undefined,
    });
  }
  return entries;
}

function sortHistory(entries: HistoryEntry[]): HistoryEntry[] {
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

export async function historyForPatient(userId: string, patientKey: string, base: string): Promise<HistoryEntry[]> {
  const patient = await findPatient(patientKey);
  if (!patient) throw httpError(404, 'NOT_FOUND', 'Patient not found');
  const viewer = await viewerFor(userId, patient);
  const clinic = await entriesFor([patient.id], viewer);
  const uploaded = await documentEntries(
    [patient.id],
    patient.user_id ? [patient.user_id] : [],
    base,
  );
  return sortHistory([...clinic, ...uploaded]);
}

export async function myHistory(userId: string, base: string): Promise<HistoryEntry[]> {
  const files = await filesForUser(userId);
  const ids = files.map((file) => file.id);
  const clinic = await entriesFor(ids, { userId, doctorOnly: false, redactVisits: false });
  const uploaded = await documentEntries(ids, [userId], base);
  return sortHistory([...clinic, ...uploaded]);
}

async function notifyDoctorUpload(input: {
  doctorId: string;
  actorUserId: string;
  patientId: string;
  documentId: string;
  kind: string;
  patientName: string;
}) {
  const doctor = await db.query<{ user_id: string | null }>(
    'SELECT user_id FROM doctors WHERE id = $1',
    [input.doctorId],
  );
  const target = doctor.rows[0]?.user_id || input.doctorId;
  if (!target || target === input.actorUserId) return;
  const kindLabel = input.kind === 'radiology' ? 'أشعة' : input.kind === 'lab' ? 'تحليل' : 'روشتة';
  await pushNotification({
    userId: target,
    type: 'lab_result',
    messageKey: 'patientDocumentUploaded',
    title: `صورة ${kindLabel} من ${input.patientName}`,
    body: `${input.patientName} رفع صورة ${kindLabel} عشان تشوفها وترد`,
    data: { patientId: input.patientId, documentId: input.documentId, patientName: input.patientName },
  });
}

async function notifyPatientReply(input: { patientUserId: string; actorUserId: string; doctorName: string; kind: string }) {
  if (!input.patientUserId || input.patientUserId === input.actorUserId) return;
  const kindLabel = input.kind === 'radiology' ? 'الأشعة' : input.kind === 'lab' ? 'التحليل' : 'الروشتة';
  await pushNotification({
    userId: input.patientUserId,
    type: 'lab_result',
    messageKey: 'doctorDocumentReply',
    title: `رد د. ${input.doctorName} على ${kindLabel}`,
    body: `الدكتور شاف الصورة ورد عليك في السجل الطبي`,
    data: { doctorName: input.doctorName },
  });
}

async function resolveDocumentLink(
  userId: string,
  files: { id: string }[],
  payload: { visitId?: string; appointmentId?: string; labRequestId?: string; doctorId?: string },
): Promise<{
  patientId: string;
  visitId: string | null;
  doctorId: string | null;
  appointmentId: string | null;
  labRequestId: string | null;
  doctorName: string;
}> {
  if (payload.visitId) {
    const visit = await getVisit(userId, payload.visitId);
    if (!files.some((file) => file.id === visit.patientId)) {
      throw httpError(403, 'FORBIDDEN', 'You cannot attach this visit');
    }
    const doctor = await db.query<{ first_name: string; last_name: string }>(
      'SELECT first_name, last_name FROM doctors WHERE id = $1',
      [visit.doctorId],
    );
    return {
      patientId: visit.patientId,
      visitId: visit.id,
      doctorId: visit.doctorId,
      appointmentId: visit.appointmentId ?? null,
      labRequestId: null,
      doctorName: doctorDisplayName(doctor.rows[0]?.first_name, doctor.rows[0]?.last_name),
    };
  }

  if (payload.labRequestId) {
    const result = await db.query<{
      id: string;
      visit_id: string;
      doctor_id: string;
      patient_id: string;
      first_name: string | null;
      last_name: string | null;
    }>(
      `SELECT l.id, l.visit_id, l.doctor_id, l.patient_id, d.first_name, d.last_name
       FROM lab_requests l
       JOIN doctors d ON d.id = l.doctor_id
       WHERE l.id = $1`,
      [payload.labRequestId],
    );
    const row = result.rows[0];
    if (!row || !files.some((file) => file.id === row.patient_id)) {
      throw httpError(403, 'FORBIDDEN', 'You cannot attach this request');
    }
    const visit = await db.query<{ appointment_id: string | null }>(
      'SELECT appointment_id FROM visits WHERE id = $1',
      [row.visit_id],
    );
    return {
      patientId: row.patient_id,
      visitId: row.visit_id,
      doctorId: row.doctor_id,
      appointmentId: visit.rows[0]?.appointment_id ?? null,
      labRequestId: row.id,
      doctorName: doctorDisplayName(row.first_name, row.last_name),
    };
  }

  if (payload.appointmentId) {
    const result = await db.query<{
      id: string;
      doctor_id: string;
      patient_id: string;
      first_name: string | null;
      last_name: string | null;
    }>(
      `SELECT a.id, a.doctor_id, a.patient_id, d.first_name, d.last_name
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       WHERE a.id = $1`,
      [payload.appointmentId],
    );
    const row = result.rows[0];
    if (!row || !files.some((file) => file.id === row.patient_id)) {
      throw httpError(403, 'FORBIDDEN', 'You cannot attach this appointment');
    }
    const visit = await db.query<{ id: string }>(
      'SELECT id FROM visits WHERE appointment_id = $1 LIMIT 1',
      [row.id],
    );
    return {
      patientId: row.patient_id,
      visitId: visit.rows[0]?.id ?? null,
      doctorId: row.doctor_id,
      appointmentId: row.id,
      labRequestId: null,
      doctorName: doctorDisplayName(row.first_name, row.last_name),
    };
  }

  if (payload.doctorId) {
    const visit = await db.query<{
      id: string;
      appointment_id: string | null;
      doctor_id: string;
      patient_id: string;
      first_name: string | null;
      last_name: string | null;
    }>(
      `SELECT v.id, v.appointment_id, v.doctor_id, v.patient_id, d.first_name, d.last_name
       FROM visits v
       JOIN doctors d ON d.id = v.doctor_id
       WHERE (d.id = $1 OR d.user_id = $1) AND v.patient_id = ANY($2::text[])
       ORDER BY v.started_at DESC
       LIMIT 1`,
      [payload.doctorId, files.map((file) => file.id)],
    );
    const row = visit.rows[0];
    if (row) {
      return {
        patientId: row.patient_id,
        visitId: row.id,
        doctorId: row.doctor_id,
        appointmentId: row.appointment_id,
        labRequestId: null,
        doctorName: doctorDisplayName(row.first_name, row.last_name),
      };
    }
    const appointment = await db.query<{
      id: string;
      doctor_id: string;
      patient_id: string;
      first_name: string | null;
      last_name: string | null;
    }>(
      `SELECT a.id, a.doctor_id, a.patient_id, d.first_name, d.last_name
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       WHERE (d.id = $1 OR d.user_id = $1) AND (a.patient_id = ANY($2::text[]) OR a.patient_id = $3)
       ORDER BY a.scheduled_at DESC
       LIMIT 1`,
      [payload.doctorId, files.map((file) => file.id), userId],
    );
    const apt = appointment.rows[0];
    if (apt && files.some((file) => file.id === apt.patient_id || apt.patient_id === userId)) {
      return {
        patientId: files.some((file) => file.id === apt.patient_id) ? apt.patient_id : files[0].id,
        visitId: null,
        doctorId: apt.doctor_id,
        appointmentId: apt.id,
        labRequestId: null,
        doctorName: doctorDisplayName(apt.first_name, apt.last_name),
      };
    }
    const doctor = await db.query<{ id: string; first_name: string; last_name: string }>(
      'SELECT id, first_name, last_name FROM doctors WHERE id = $1 OR user_id = $1',
      [payload.doctorId],
    );
    if (doctor.rows[0]) {
      return {
        patientId: files[0].id,
        visitId: null,
        doctorId: doctor.rows[0].id,
        appointmentId: null,
        labRequestId: null,
        doctorName: doctorDisplayName(doctor.rows[0].first_name, doctor.rows[0].last_name),
      };
    }
  }

  return {
    patientId: files[0].id,
    visitId: null,
    doctorId: null,
    appointmentId: null,
    labRequestId: null,
    doctorName: '',
  };
}

export async function myVisitLinks(userId: string): Promise<PatientVisitLink[]> {
  const owner = `p.user_id = $1 OR p.id = $1`;

  const labs = await db.query<{
    id: string;
    visit_id: string;
    doctor_id: string;
    type: string;
    test_name: string;
    requested_at: string | Date;
    first_name: string | null;
    last_name: string | null;
  }>(
    `SELECT l.id, l.visit_id, l.doctor_id, l.type, l.test_name, l.requested_at, d.first_name, d.last_name
     FROM lab_requests l
     JOIN doctors d ON d.id = l.doctor_id
     LEFT JOIN patients p ON p.id = l.patient_id
     WHERE (${owner} OR l.patient_id = $1) AND l.status <> 'cancelled'
     ORDER BY l.requested_at DESC
     LIMIT 40`,
    [userId],
  );

  const visits = await db.query<{
    id: string;
    appointment_id: string | null;
    doctor_id: string;
    started_at: string | Date;
    completed_at: string | Date | null;
    first_name: string | null;
    last_name: string | null;
  }>(
    `SELECT v.id, v.appointment_id, v.doctor_id, v.started_at, v.completed_at, d.first_name, d.last_name
     FROM visits v
     JOIN doctors d ON d.id = v.doctor_id
     LEFT JOIN patients p ON p.id = v.patient_id
     WHERE ${owner} OR v.patient_id = $1
     ORDER BY v.started_at DESC
     LIMIT 40`,
    [userId],
  );

  const usedAppointments = new Set(
    visits.rows.map((row) => row.appointment_id).filter((value): value is string => Boolean(value)),
  );

  const appointments = await db.query<{
    id: string;
    doctor_id: string;
    scheduled_at: string | Date;
    first_name: string | null;
    last_name: string | null;
  }>(
    `SELECT a.id, a.doctor_id, a.scheduled_at, d.first_name, d.last_name
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     LEFT JOIN patients p ON p.id = a.patient_id
     WHERE (${owner} OR a.patient_id = $1) AND a.status NOT IN ('cancelled', 'no_show')
     ORDER BY a.scheduled_at DESC
     LIMIT 40`,
    [userId],
  );

  const usedVisits = new Set(labs.rows.map((row) => row.visit_id));
  const links: PatientVisitLink[] = labs.rows.map((row) => ({
    id: row.id,
    kind: 'lab' as const,
    labRequestId: row.id,
    visitId: row.visit_id,
    doctorId: row.doctor_id,
    doctorName: doctorDisplayName(row.first_name, row.last_name),
    date: iso(row.requested_at),
    testName: row.test_name,
  }));

  for (const row of visits.rows) {
    if (usedVisits.has(row.id)) continue;
    links.push({
      id: row.id,
      kind: 'visit',
      visitId: row.id,
      appointmentId: row.appointment_id ?? undefined,
      doctorId: row.doctor_id,
      doctorName: doctorDisplayName(row.first_name, row.last_name),
      date: iso(row.completed_at ?? row.started_at),
    });
  }

  for (const row of appointments.rows) {
    if (usedAppointments.has(row.id)) continue;
    links.push({
      id: row.id,
      kind: 'appointment',
      appointmentId: row.id,
      doctorId: row.doctor_id,
      doctorName: doctorDisplayName(row.first_name, row.last_name),
      date: iso(row.scheduled_at),
    });
  }

  return links.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 40);
}

export async function uploadMyDocument(
  userId: string,
  payload: {
    kind: string;
    image: string;
    note?: string;
    visitId?: string;
    appointmentId?: string;
    labRequestId?: string;
    doctorId?: string;
  },
  base: string,
): Promise<HistoryEntry> {
  const files = await filesForUser(userId);
  if (files.length === 0) {
    throw httpError(400, 'VALIDATION_ERROR', 'Create a patient file before uploading records');
  }
  const kind =
    payload.kind === 'prescription' || payload.kind === 'radiology' ? payload.kind : payload.kind === 'lab' ? 'lab' : null;
  if (!kind) throw httpError(400, 'VALIDATION_ERROR', 'Choose a document type');
  if (
    (kind === 'lab' || kind === 'radiology') &&
    !payload.visitId &&
    !payload.appointmentId &&
    !payload.labRequestId &&
    !payload.doctorId
  ) {
    throw httpError(400, 'VALIDATION_ERROR', 'Pick the doctor visit first');
  }
  const link = await resolveDocumentLink(userId, files, payload);
  const imageUrl = storeImage(payload.image, 'records');
  const note = payload.note?.trim() || null;
  const id = `doc-${randomUUID()}`;
  try {
    await db.query(
      `INSERT INTO patient_documents
         (id, patient_id, patient_user_id, kind, image_url, note, visit_id, doctor_id, appointment_id, lab_request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, link.patientId, userId, kind, imageUrl, note, link.visitId, link.doctorId, link.appointmentId, link.labRequestId],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!/column|does not exist/i.test(message)) throw error;
    await db.query(
      `INSERT INTO patient_documents (id, patient_id, patient_user_id, kind, image_url, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, link.patientId, userId, kind, imageUrl, note],
    );
  }
  const person = await db.query<{ first_name: string; last_name: string }>(
    'SELECT first_name, last_name FROM patients WHERE id = $1',
    [link.patientId],
  );
  const patientName = doctorDisplayName(person.rows[0]?.first_name, person.rows[0]?.last_name) || 'مريض';
  if (link.doctorId) {
    void notifyDoctorUpload({
      doctorId: link.doctorId,
      actorUserId: userId,
      patientId: link.patientId,
      documentId: id,
      kind,
      patientName,
    }).catch(() => undefined);
  }
  return {
    id: `hist-doc-${id}`,
    patientId: link.patientId,
    type: kind,
    title: note || DOCUMENT_TITLES[kind],
    description: link.doctorName,
    date: new Date().toISOString(),
    resourceId: id,
    doctorId: link.doctorId ?? undefined,
    visitId: link.visitId ?? undefined,
    source: 'patient',
    imageUrl: absoluteUrl(base, imageUrl),
  };
}

export async function replyToPatientDocument(
  userId: string,
  documentId: string,
  message: string,
  base: string,
): Promise<HistoryEntry> {
  const reply = message.trim();
  if (!reply) throw httpError(400, 'VALIDATION_ERROR', 'Write a reply');
  const result = await db.query<{
    id: string;
    patient_id: string;
    patient_user_id: string;
    kind: string;
    image_url: string;
    note: string | null;
    visit_id: string | null;
    doctor_id: string | null;
    created_at: string | Date;
    clinic_id: string;
    user_id: string | null;
  }>(
    `SELECT pd.*, p.clinic_id, p.user_id
     FROM patient_documents pd
     JOIN patients p ON p.id = pd.patient_id
     WHERE pd.id = $1`,
    [documentId],
  );
  const row = result.rows[0];
  if (!row) throw httpError(404, 'NOT_FOUND', 'Document not found');
  const viewer = await viewerFor(userId, { id: row.patient_id, clinic_id: row.clinic_id, user_id: row.user_id });
  if (viewer.redactVisits) throw httpError(403, 'FORBIDDEN', 'Only the doctor can reply');
  await db.query(
    `UPDATE patient_documents SET doctor_reply = $2, doctor_replied_at = now() WHERE id = $1`,
    [documentId, reply],
  );
  const doctor = await db.query<{ first_name: string; last_name: string }>(
    'SELECT first_name, last_name FROM doctors WHERE id = $1 OR user_id = $1',
    [userId],
  );
  const doctorName = doctorDisplayName(doctor.rows[0]?.first_name, doctor.rows[0]?.last_name);
  if (row.patient_user_id) {
    void notifyPatientReply({
      patientUserId: row.patient_user_id,
      actorUserId: userId,
      doctorName: doctorName || 'الطبيب',
      kind: row.kind,
    }).catch(() => undefined);
  }
  const kind = row.kind === 'prescription' || row.kind === 'radiology' ? row.kind : 'lab';
  return {
    id: `hist-doc-${row.id}`,
    patientId: row.patient_id,
    type: kind,
    title: row.note?.trim() || DOCUMENT_TITLES[kind],
    description: doctorName,
    date: iso(row.created_at),
    resourceId: row.id,
    doctorId: row.doctor_id ?? undefined,
    visitId: row.visit_id ?? undefined,
    source: 'patient',
    imageUrl: absoluteUrl(base, row.image_url),
    doctorReply: reply,
  };
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

export async function visitDetail(userId: string, id: string, base?: string) {
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
  const documents = await db.query<{
    id: string;
    kind: string;
    image_url: string;
    note: string | null;
    created_at: string | Date;
  }>(
    `SELECT id, kind, image_url, note, created_at
     FROM patient_documents
     WHERE visit_id = $1
     ORDER BY created_at DESC`,
    [id],
  );
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
    linkedDocuments: documents.rows.map((row) => ({
      id: row.id,
      kind: row.kind === 'prescription' || row.kind === 'radiology' ? row.kind : 'lab',
      imageUrl: base ? absoluteUrl(base, row.image_url) : row.image_url,
      note: row.note ?? undefined,
      date: iso(row.created_at),
    })),
  };
}
