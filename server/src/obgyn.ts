import { randomUUID } from 'node:crypto';

import { db } from './db.js';

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function eddFromLmp(lmp: string): string {
  const date = new Date(lmp);
  if (Number.isNaN(date.getTime())) return lmp;
  date.setDate(date.getDate() + 280);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

type PregnancyRow = {
  id: string;
  patient_id: string;
  clinic_id: string;
  author_user_id: string;
  status: string;
  lmp: string;
  edd: string | null;
  gravida: number | null;
  para: number | null;
  risk_notes: string | null;
  outcome: string | null;
  started_at: string | Date;
  ended_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toPregnancy(row: PregnancyRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    clinicId: row.clinic_id,
    authorUserId: row.author_user_id,
    status: row.status,
    lmp: row.lmp,
    edd: row.edd ?? undefined,
    gravida: row.gravida ?? undefined,
    para: row.para ?? undefined,
    riskNotes: row.risk_notes ?? undefined,
    outcome: row.outcome ?? undefined,
    startedAt: iso(row.started_at),
    endedAt: row.ended_at ? iso(row.ended_at) : undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

async function requireObgynDoctor(userId: string) {
  const doctor = await db.query<{ id: string; specialty: string; user_id: string | null }>(
    'SELECT id, specialty, user_id FROM doctors WHERE (id = $1 OR user_id = $1) AND is_active = true LIMIT 1',
    [userId],
  );
  const row = doctor.rows[0];
  if (!row) throw httpError(403, 'FORBIDDEN', 'Only the treating doctor can update this record');
  const specialty = row.specialty.toLowerCase();
  if (!specialty.includes('obstet') && !specialty.includes('gynec')) {
    throw httpError(403, 'FORBIDDEN', 'This form belongs to obstetrics and gynecology');
  }
  return row.id;
}

export async function listPregnancies(patientId: string) {
  const result = await db.query<PregnancyRow>(
    'SELECT * FROM pregnancies WHERE patient_id = $1 ORDER BY started_at DESC',
    [patientId],
  );
  return result.rows.map(toPregnancy);
}

export async function createPregnancy(
  userId: string,
  patientId: string,
  input: { lmp: string; edd?: string; gravida?: number; para?: number; riskNotes?: string },
) {
  const doctorId = await requireObgynDoctor(userId);
  const patient = await db.query<{ id: string; clinic_id: string; gender: string }>(
    'SELECT id, clinic_id, gender FROM patients WHERE id = $1 OR user_id = $1 ORDER BY id LIMIT 1',
    [patientId],
  );
  const file = patient.rows[0];
  if (!file) throw httpError(404, 'NOT_FOUND', 'Patient not found');
  if (file.gender === 'male') throw httpError(403, 'FORBIDDEN', 'Pregnancy is recorded on a female patient file');
  const active = await db.query('SELECT id FROM pregnancies WHERE patient_id = $1 AND status = $2', [file.id, 'active']);
  if (active.rows[0]) throw httpError(400, 'ACTIVE_PREGNANCY_EXISTS', 'This clinic file already has an active pregnancy');
  const id = `pregnancy-${randomUUID()}`;
  const now = new Date().toISOString();
  await db.query(
    `INSERT INTO pregnancies (
       id, patient_id, clinic_id, author_user_id, status, lmp, edd, gravida, para, risk_notes, started_at
     ) VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8, $9, $10)`,
    [id, file.id, file.clinic_id, doctorId, input.lmp, input.edd || eddFromLmp(input.lmp), input.gravida ?? null, input.para ?? null, input.riskNotes ?? null, now],
  );
  const created = await db.query<PregnancyRow>('SELECT * FROM pregnancies WHERE id = $1', [id]);
  return toPregnancy(created.rows[0]);
}

export async function closePregnancy(
  userId: string,
  id: string,
  input: { outcomeKind: 'live_birth' | 'ended'; outcome: string; childFirstName?: string; childGender?: string },
) {
  const doctorId = await requireObgynDoctor(userId);
  const current = await db.query<PregnancyRow>('SELECT * FROM pregnancies WHERE id = $1', [id]);
  const row = current.rows[0];
  if (!row) throw httpError(404, 'NOT_FOUND', 'Pregnancy not found');
  if (row.author_user_id !== doctorId && row.author_user_id !== userId) {
    throw httpError(403, 'FORBIDDEN', 'Only the doctor who opened this pregnancy can close it');
  }
  if (row.status !== 'active') throw httpError(400, 'INVALID_STATE', 'This pregnancy is already closed');
  const endedAt = new Date().toISOString();
  const status = input.outcomeKind === 'live_birth' ? 'delivered' : 'ended';
  await db.query(
    `UPDATE pregnancies SET status = $2, outcome = $3, ended_at = $4, updated_at = $4 WHERE id = $1`,
    [id, status, input.outcome, endedAt],
  );
  if (input.outcomeKind === 'live_birth' && input.childFirstName && input.childGender) {
    const mother = await db.query<{ last_name: string; clinic_id: string }>(
      'SELECT last_name, clinic_id FROM patients WHERE id = $1',
      [row.patient_id],
    );
    const childId = `patient-child-${randomUUID()}`;
    await db.query(
      `INSERT INTO patients (
         id, clinic_id, first_name, last_name, date_of_birth, gender, allergies, chronic_conditions
       ) VALUES ($1, $2, $3, $4, $5, $6, '[]', '[]')`,
      [childId, row.clinic_id, input.childFirstName.trim(), mother.rows[0]?.last_name ?? '', endedAt.slice(0, 10), input.childGender],
    );
    await db.query(
      `INSERT INTO newborn_links (
         id, pregnancy_id, mother_patient_id, child_patient_id, delivered_at, clinic_id, author_user_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [`newborn-${randomUUID()}`, row.id, row.patient_id, childId, endedAt, row.clinic_id, doctorId],
    );
  }
  const next = await db.query<PregnancyRow>('SELECT * FROM pregnancies WHERE id = $1', [id]);
  return toPregnancy(next.rows[0]);
}

export async function childLink(userId: string, pregnancyId: string) {
  const doctorId = await requireObgynDoctor(userId);
  const pregnancy = await db.query<PregnancyRow>('SELECT * FROM pregnancies WHERE id = $1', [pregnancyId]);
  if (!pregnancy.rows[0] || (pregnancy.rows[0].author_user_id !== doctorId && pregnancy.rows[0].author_user_id !== userId)) {
    return null;
  }
  const link = await db.query<{
    id: string;
    pregnancy_id: string;
    mother_patient_id: string;
    child_patient_id: string;
    delivered_at: string | Date;
    clinic_id: string;
    author_user_id: string;
  }>('SELECT * FROM newborn_links WHERE pregnancy_id = $1', [pregnancyId]);
  const row = link.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    pregnancyId: row.pregnancy_id,
    motherPatientId: row.mother_patient_id,
    childPatientId: row.child_patient_id,
    deliveredAt: iso(row.delivered_at),
    clinicId: row.clinic_id,
    authorUserId: row.author_user_id,
  };
}

export async function getEncounter(visitId: string) {
  const result = await db.query<{ payload: string }>('SELECT payload FROM obgyn_encounters WHERE visit_id = $1', [visitId]);
  return result.rows[0] ? JSON.parse(result.rows[0].payload) : null;
}

export async function saveEncounter(userId: string, visitId: string, input: Record<string, unknown>) {
  const doctorId = await requireObgynDoctor(userId);
  const visit = await db.query<{ id: string; patient_id: string; doctor_id: string }>(
    'SELECT id, patient_id, doctor_id FROM visits WHERE id = $1',
    [visitId],
  );
  if (!visit.rows[0]) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  if (visit.rows[0].doctor_id !== doctorId && visit.rows[0].doctor_id !== userId) {
    throw httpError(403, 'FORBIDDEN', 'You can only write your own visit');
  }
  if (input.kind === 'obstetric') {
    const pregnancyId = typeof input.pregnancyId === 'string' ? input.pregnancyId : '';
    const active = await db.query(
      `SELECT id FROM pregnancies WHERE patient_id = $1 AND (id = $2 OR status = 'active') LIMIT 1`,
      [visit.rows[0].patient_id, pregnancyId],
    );
    if (!active.rows[0]) throw httpError(400, 'PREGNANCY_REQUIRED', 'Open a pregnancy before an obstetric visit');
    const weeks = Number(input.gestationalAgeWeeks ?? 0);
    if (weeks >= 20 && !input.fetalMovement) {
      throw httpError(400, 'FETAL_MOVEMENT_REQUIRED', 'Record fetal movement from week 20');
    }
  }
  const existing = await db.query<{ id: string; payload: string }>(
    'SELECT id, payload FROM obgyn_encounters WHERE visit_id = $1',
    [visitId],
  );
  const previous = existing.rows[0] ? (JSON.parse(existing.rows[0].payload) as { id: string; createdAt: string }) : null;
  const stamp = new Date().toISOString();
  const next = {
    id: previous?.id ?? `obgyn-${randomUUID()}`,
    visitId,
    patientId: visit.rows[0].patient_id,
    authorUserId: doctorId,
    ...input,
    createdAt: previous?.createdAt ?? stamp,
    updatedAt: stamp,
  };
  if (previous) {
    await db.query('UPDATE obgyn_encounters SET payload = $2 WHERE visit_id = $1', [visitId, JSON.stringify(next)]);
  } else {
    await db.query('INSERT INTO obgyn_encounters (id, visit_id, payload) VALUES ($1, $2, $3)', [
      next.id,
      visitId,
      JSON.stringify(next),
    ]);
  }
  return next;
}

export async function priorMeasurements(pregnancyId: string, beforeIso: string) {
  const result = await db.query<{ payload: string }>(
    `SELECT e.payload FROM obgyn_encounters e
     JOIN visits v ON v.id = e.visit_id
     WHERE v.started_at < $2`,
    [pregnancyId, beforeIso],
  );
  return result.rows
    .map((row) => JSON.parse(row.payload) as { visitId: string; pregnancyId?: string; createdAt: string; gestationalAgeWeeks?: number; fundalHeightCm?: number; fetalHeartRate?: number })
    .filter((item) => item.pregnancyId === pregnancyId)
    .map((item) => ({
      visitId: item.visitId,
      startedAt: item.createdAt,
      gestationalAgeWeeks: item.gestationalAgeWeeks,
      fundalHeightCm: item.fundalHeightCm,
      fetalHeartRate: item.fetalHeartRate,
    }));
}

export async function visitSummary(visitId: string) {
  const encounter = await getEncounter(visitId);
  if (!encounter) return null;
  return {
    visitId,
    kind: encounter.kind,
    gestationalAgeWeeks: encounter.gestationalAgeWeeks,
    fetalHeartRate: encounter.fetalHeartRate,
    fetalMovement: encounter.fetalMovement,
    edd: encounter.edd,
    lmp: encounter.lmp,
    plan: encounter.plan,
    followUpNote: encounter.followUpNote,
  };
}

export async function saveUltrasound(userId: string, labRequestId: string, input: Record<string, unknown>) {
  const doctorId = await requireObgynDoctor(userId);
  const lab = await db.query<{ visit_id: string }>('SELECT visit_id FROM lab_requests WHERE id = $1', [labRequestId]);
  if (!lab.rows[0]) throw httpError(404, 'NOT_FOUND', 'Lab request not found');
  const existing = await db.query<{ payload: string }>('SELECT payload FROM ultrasound_reports WHERE lab_request_id = $1', [
    labRequestId,
  ]);
  const previous = existing.rows[0] ? (JSON.parse(existing.rows[0].payload) as { id: string; createdAt: string }) : null;
  const stamp = new Date().toISOString();
  const next = {
    id: previous?.id ?? `us-${randomUUID()}`,
    labRequestId,
    visitId: lab.rows[0].visit_id,
    authorUserId: doctorId,
    ...input,
    createdAt: previous?.createdAt ?? stamp,
    updatedAt: stamp,
  };
  if (previous) {
    await db.query('UPDATE ultrasound_reports SET payload = $2 WHERE lab_request_id = $1', [labRequestId, JSON.stringify(next)]);
  } else {
    await db.query('INSERT INTO ultrasound_reports (id, lab_request_id, payload) VALUES ($1, $2, $3)', [
      next.id,
      labRequestId,
      JSON.stringify(next),
    ]);
  }
  return next;
}

export async function getUltrasound(labRequestId: string) {
  const result = await db.query<{ payload: string }>('SELECT payload FROM ultrasound_reports WHERE lab_request_id = $1', [
    labRequestId,
  ]);
  return result.rows[0] ? JSON.parse(result.rows[0].payload) : null;
}

export async function addAttachment(userId: string, input: Record<string, unknown> & { visitId: string; dataUrl: string; mediaType: string }) {
  const visit = await db.query<{ patient_id: string; clinic_id: string }>('SELECT patient_id, clinic_id FROM visits WHERE id = $1', [
    input.visitId,
  ]);
  if (!visit.rows[0]) throw httpError(404, 'NOT_FOUND', 'Visit not found');
  const attachment = {
    id: `file-${randomUUID()}`,
    patientId: visit.rows[0].patient_id,
    clinicId: visit.rows[0].clinic_id,
    visitId: input.visitId,
    labRequestId: input.labRequestId,
    pregnancyId: input.pregnancyId,
    mediaType: input.mediaType,
    fileName: input.fileName,
    dataUrl: input.dataUrl,
    patientVisible: Boolean(input.patientVisible),
    createdByUserId: userId,
    createdAt: new Date().toISOString(),
  };
  await db.query('INSERT INTO clinical_attachments (id, payload) VALUES ($1, $2)', [attachment.id, JSON.stringify(attachment)]);
  return attachment;
}

export async function listAttachments(visitId: string) {
  const result = await db.query<{ payload: string }>('SELECT payload FROM clinical_attachments ORDER BY created_at');
  return result.rows
    .map((row) => JSON.parse(row.payload) as { visitId?: string })
    .filter((item) => item.visitId === visitId);
}

export async function childChart(childPatientId: string) {
  const link = await db.query<{
    id: string;
    pregnancy_id: string;
    mother_patient_id: string;
    child_patient_id: string;
    delivered_at: string | Date;
    clinic_id: string;
    author_user_id: string;
  }>('SELECT * FROM newborn_links WHERE child_patient_id = $1', [childPatientId]);
  const row = link.rows[0];
  if (!row) throw httpError(404, 'NOT_FOUND', 'Child chart not found');
  const child = await db.query<{ first_name: string; last_name: string; date_of_birth: string }>(
    'SELECT first_name, last_name, date_of_birth FROM patients WHERE id = $1',
    [childPatientId],
  );
  const doses = await db.query<{ id: string; label: string; due_at: string | Date; status: string }>(
    'SELECT * FROM vaccination_doses WHERE child_patient_id = $1 ORDER BY due_at',
    [childPatientId],
  );
  const visits = await db.query<{ id: string; started_at: string | Date; diagnosis: string | null; doctor_id: string }>(
    'SELECT id, started_at, diagnosis, doctor_id FROM visits WHERE patient_id = $1 ORDER BY started_at DESC',
    [childPatientId],
  );
  const appointments = await db.query<{ id: string; scheduled_at: string | Date; status: string; doctor_id: string }>(
    'SELECT id, scheduled_at, status, doctor_id FROM appointments WHERE patient_id = $1 ORDER BY scheduled_at DESC',
    [childPatientId],
  );
  return {
    link: {
      id: row.id,
      pregnancyId: row.pregnancy_id,
      motherPatientId: row.mother_patient_id,
      childPatientId: row.child_patient_id,
      deliveredAt: iso(row.delivered_at),
      clinicId: row.clinic_id,
      authorUserId: row.author_user_id,
    },
    childName: `${child.rows[0]?.first_name ?? ''} ${child.rows[0]?.last_name ?? ''}`.trim(),
    dateOfBirth: child.rows[0]?.date_of_birth ?? iso(row.delivered_at).slice(0, 10),
    doses: doses.rows.map((dose) => ({
      id: dose.id,
      childPatientId,
      label: dose.label,
      dueAt: iso(dose.due_at),
      status: dose.status,
    })),
    visits: visits.rows.map((visit) => ({
      id: visit.id,
      startedAt: iso(visit.started_at),
      diagnosis: visit.diagnosis ?? undefined,
      doctorId: visit.doctor_id,
    })),
    appointments: appointments.rows.map((appointment) => ({
      id: appointment.id,
      scheduledAt: iso(appointment.scheduled_at),
      status: appointment.status,
      doctorId: appointment.doctor_id,
    })),
  };
}

export async function listMyChildren(userId: string) {
  const files = await db.query<{ id: string }>('SELECT id FROM patients WHERE user_id = $1 OR id = $1', [userId]);
  const charts = [];
  for (const file of files.rows) {
    const links = await db.query<{ child_patient_id: string }>(
      'SELECT child_patient_id FROM newborn_links WHERE mother_patient_id = $1',
      [file.id],
    );
    for (const link of links.rows) charts.push(await childChart(link.child_patient_id));
  }
  return charts;
}

export async function addDose(userId: string, childPatientId: string, input: { label: string; dueAt: string }) {
  await requireObgynDoctor(userId);
  await childChart(childPatientId);
  const id = `dose-${randomUUID()}`;
  await db.query(
    `INSERT INTO vaccination_doses (id, child_patient_id, label, due_at, status) VALUES ($1, $2, $3, $4, 'due')`,
    [id, childPatientId, input.label.trim(), input.dueAt],
  );
  return childChart(childPatientId);
}
