import { findClinicSpecialty } from '@/shared/catalog/clinic-specialties';
import { useAuthStore } from '@/shared/stores/auth-store';
import { Gender, UserRole } from '@/shared/types/enums';
import type { AddClinicalAttachmentInput, ClinicalAttachment } from '@/shared/types/models/clinical-attachment';
import type {
  ClosePregnancyInput,
  CreatePregnancyInput,
  ObgynEncounter,
  ObgynVisitSummary,
  PregnancyRecord,
  PriorObgynMeasurement,
  SaveObgynEncounterInput,
} from '@/shared/types/models/obgyn';
import type { SaveUltrasoundInput, UltrasoundReport } from '@/shared/types/models/ultrasound-report';
import { getPatientIdsForUser, mockPatientsService } from '@/shared/api/mock/patients.mock';

import { cloneSeed, resetArray } from './clone';
import { mockVisitsService } from './doctor.mock';
import { mockLabRequests } from './lab-requests.mock';
import { createChildFromDelivery, findNewbornByPregnancy } from './newborn.mock';
import { mockVisits } from './visits.mock';

function isObgynSpecialty(specialty?: string) {
  return findClinicSpecialty(specialty ?? '')?.id === 'obstetricsGynecology';
}

function eddFromLmp(lmp: string): string {
  const date = new Date(`${lmp}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 280);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const nowIso = () => new Date().toISOString();

const SEED_PREGNANCIES: PregnancyRecord[] = [
  {
    id: 'pregnancy-delivered',
    patientId: 'patient-003',
    clinicId: 'clinic-001',
    authorUserId: 'user-doctor-007',
    status: 'delivered',
    lmp: '2025-08-01',
    edd: '2026-05-08',
    gravida: 1,
    para: 0,
    outcome: 'Live birth',
    startedAt: '2025-08-15T09:00:00.000Z',
    endedAt: '2026-05-08T10:00:00.000Z',
    createdAt: '2025-08-15T09:00:00.000Z',
    updatedAt: '2026-05-08T10:00:00.000Z',
  },
  {
    id: 'pregnancy-active',
    patientId: 'patient-003',
    clinicId: 'clinic-001',
    authorUserId: 'user-doctor-007',
    status: 'active',
    lmp: '2026-08-01',
    edd: '2027-05-08',
    gravida: 2,
    para: 1,
    startedAt: '2026-08-20T09:00:00.000Z',
    createdAt: '2026-08-20T09:00:00.000Z',
    updatedAt: '2026-08-20T09:00:00.000Z',
  },
];

const SEED_ENCOUNTERS: ObgynEncounter[] = [
  {
    id: 'obgyn-enc-001',
    visitId: 'visit-003',
    patientId: 'patient-003',
    authorUserId: 'user-doctor-007',
    kind: 'obstetric',
    pregnancyId: 'pregnancy-active',
    gestationalAgeWeeks: 8,
    fetalHeartRate: 160,
    fetalMovement: 'not_applicable',
    plan: 'Continue antenatal follow-up',
    createdAt: '2026-09-26T09:00:00.000Z',
    updatedAt: '2026-09-26T09:00:00.000Z',
  },
];

const pregnancies: PregnancyRecord[] = cloneSeed(SEED_PREGNANCIES);
const encounters: ObgynEncounter[] = cloneSeed(SEED_ENCOUNTERS);
const ultrasounds: UltrasoundReport[] = [];
const attachments: ClinicalAttachment[] = [];

export function resetMockObgyn() {
  resetArray(pregnancies, SEED_PREGNANCIES);
  resetArray(encounters, SEED_ENCOUNTERS);
  ultrasounds.splice(0, ultrasounds.length);
  attachments.splice(0, attachments.length);
}

function actor() {
  return useAuthStore.getState().user;
}

function requireDoctorId(): string {
  const user = actor();
  const role = useAuthStore.getState().activeRole;
  if (!user || role !== UserRole.DOCTOR) {
    throw { code: 'FORBIDDEN', message: 'Only the treating doctor can change this record' };
  }
  return user.id;
}

function optionalNumber(value?: number) {
  return value == null || Number.isNaN(value) ? undefined : value;
}

export const mockObgynService = {
  async listPregnancies(patientId: string): Promise<PregnancyRecord[]> {
    const role = useAuthStore.getState().activeRole;
    const user = actor();
    const patient = await mockPatientsService.getById(patientId);
    let rows = pregnancies.filter((item) => item.patientId === patient.id);

    if (role === UserRole.PATIENT && user) {
      const ids = getPatientIdsForUser(user.id);
      if (!ids.includes(patient.id)) throw { code: 'FORBIDDEN', message: 'Pregnancy records are not available' };
    } else if (role === UserRole.DOCTOR && user) {
      rows = rows.filter(
        (item) =>
          item.authorUserId === user.id ||
          encounters.some((encounter) => encounter.pregnancyId === item.id && encounter.authorUserId === user.id),
      );
    } else if (role === UserRole.ADMIN || role === UserRole.SECRETARY) {
      return [];
    }

    return rows.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  },

  async createPregnancy(patientId: string, input: CreatePregnancyInput): Promise<PregnancyRecord> {
    const doctorId = requireDoctorId();
    const patient = await mockPatientsService.getById(patientId);
    if (patient.gender === Gender.MALE) {
      throw { code: 'FORBIDDEN', message: 'Pregnancy is recorded on a female patient file' };
    }
    if (pregnancies.some((item) => item.patientId === patient.id && item.status === 'active')) {
      throw { code: 'ACTIVE_PREGNANCY_EXISTS', message: 'This clinic file already has an active pregnancy' };
    }
    const stamp = nowIso();
    const record: PregnancyRecord = {
      id: `pregnancy-${Date.now()}`,
      patientId: patient.id,
      clinicId: patient.clinicId,
      authorUserId: doctorId,
      status: 'active',
      lmp: input.lmp,
      edd: input.edd || eddFromLmp(input.lmp),
      gravida: input.gravida,
      para: input.para,
      riskNotes: input.riskNotes,
      startedAt: stamp,
      createdAt: stamp,
      updatedAt: stamp,
    };
    pregnancies.unshift(record);
    return record;
  },

  async closePregnancy(id: string, input: ClosePregnancyInput): Promise<PregnancyRecord> {
    const doctorId = requireDoctorId();
    const index = pregnancies.findIndex((item) => item.id === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Pregnancy not found' };
    const current = pregnancies[index];
    if (current.authorUserId !== doctorId) {
      throw { code: 'FORBIDDEN', message: 'Only the doctor who opened this pregnancy can close it' };
    }
    if (current.status !== 'active') {
      throw { code: 'INVALID_STATE', message: 'This pregnancy is already closed' };
    }
    const endedAt = nowIso();
    const next: PregnancyRecord = {
      ...current,
      status: input.outcomeKind === 'live_birth' ? 'delivered' : 'ended',
      outcome: input.outcome,
      endedAt,
      updatedAt: endedAt,
    };
    pregnancies[index] = next;
    if (input.outcomeKind === 'live_birth' && input.childFirstName && input.childGender) {
      const mother = await mockPatientsService.getById(current.patientId);
      createChildFromDelivery({
        pregnancyId: current.id,
        mother,
        deliveredAt: endedAt,
        firstName: input.childFirstName,
        gender: input.childGender,
        authorUserId: doctorId,
      });
    }
    return next;
  },

  async childLink(pregnancyId: string) {
    const doctorId = requireDoctorId();
    const pregnancy = pregnancies.find((item) => item.id === pregnancyId);
    if (!pregnancy || pregnancy.authorUserId !== doctorId) return null;
    return findNewbornByPregnancy(pregnancyId) ?? null;
  },

  async getEncounter(visitId: string): Promise<ObgynEncounter | null> {
    const visit = await mockVisitsService.getById(visitId);
    const encounter = encounters.find((item) => item.visitId === visit.id) ?? null;
    const role = useAuthStore.getState().activeRole;
    const user = actor();
    if (!encounter) return null;
    if (role === UserRole.DOCTOR && user?.id === encounter.authorUserId) return encounter;
    return null;
  },

  async saveEncounter(visitId: string, input: SaveObgynEncounterInput): Promise<ObgynEncounter> {
    const doctorId = requireDoctorId();
    const visit = await mockVisitsService.getById(visitId);
    if (visit.doctorId !== doctorId) {
      throw { code: 'FORBIDDEN', message: 'You can only write your own visit' };
    }
    const { getMockDoctorById } = await import('./doctors.mock');
    const doctor = getMockDoctorById(doctorId);
    if (!isObgynSpecialty(doctor?.specialty)) {
      throw { code: 'FORBIDDEN', message: 'This form belongs to obstetrics and gynecology' };
    }
    if (input.kind === 'obstetric') {
      const pregnancy = pregnancies.find((item) => item.id === input.pregnancyId && item.patientId === visit.patientId);
      if (!pregnancy) throw { code: 'NOT_FOUND', message: 'Pregnancy not found for this patient' };
    }
    const weeks = input.gestationalAgeWeeks;
    if (input.kind === 'obstetric' && weeks != null && weeks >= 20 && !input.fetalMovement) {
      throw { code: 'VALIDATION', message: 'fetalMovementRequired' };
    }
    const existing = encounters.findIndex((item) => item.visitId === visit.id);
    const stamp = nowIso();
    const next: ObgynEncounter = {
      id: existing === -1 ? `obgyn-${Date.now()}` : encounters[existing].id,
      visitId: visit.id,
      patientId: visit.patientId,
      authorUserId: doctorId,
      ...input,
      cycleLengthDays: optionalNumber(input.cycleLengthDays),
      bleedingDays: optionalNumber(input.bleedingDays),
      gravida: optionalNumber(input.gravida),
      para: optionalNumber(input.para),
      abortions: optionalNumber(input.abortions),
      living: optionalNumber(input.living),
      gestationalAgeWeeks: optionalNumber(input.gestationalAgeWeeks),
      fundalHeightCm: optionalNumber(input.fundalHeightCm),
      fetalHeartRate: optionalNumber(input.fetalHeartRate),
      createdAt: existing === -1 ? stamp : encounters[existing].createdAt,
      updatedAt: stamp,
    };
    if (existing === -1) encounters.unshift(next);
    else encounters[existing] = next;
    return next;
  },

  async priorMeasurements(pregnancyId: string, beforeIso: string): Promise<PriorObgynMeasurement[]> {
    const doctorId = requireDoctorId();
    return encounters
      .filter((item) => item.pregnancyId === pregnancyId && item.authorUserId === doctorId)
      .map((item) => {
        const visit = mockVisits.find((row) => row.id === item.visitId);
        return { item, visit };
      })
      .filter((row) => row.visit && row.visit.startedAt < beforeIso)
      .sort((a, b) => new Date(a.visit!.startedAt).getTime() - new Date(b.visit!.startedAt).getTime())
      .map(({ item, visit }) => ({
        visitId: item.visitId,
        startedAt: visit!.startedAt,
        gestationalAgeWeeks: item.gestationalAgeWeeks,
        fundalHeightCm: item.fundalHeightCm,
        fetalHeartRate: item.fetalHeartRate,
        bloodPressure: visit!.vitals?.bloodPressure,
        weight: visit!.vitals?.weight,
      }));
  },

  async visitSummary(visitId: string): Promise<ObgynVisitSummary | null> {
    const role = useAuthStore.getState().activeRole;
    const user = actor();
    const encounter = encounters.find((item) => item.visitId === visitId);
    if (!encounter) return null;
    const pregnancy = encounter.pregnancyId
      ? pregnancies.find((item) => item.id === encounter.pregnancyId)
      : undefined;
    const base: ObgynVisitSummary = {
      visitId,
      kind: encounter.kind,
      edd: pregnancy?.edd,
      lmp: pregnancy?.lmp ?? encounter.lmp,
      pregnancyStatus: pregnancy?.status,
      outcome: pregnancy?.outcome,
    };
    if (role === UserRole.PATIENT && user) {
      const visit = mockVisits.find((item) => item.id === visitId);
      const ids = getPatientIdsForUser(user.id);
      if (!visit || !ids.includes(visit.patientId)) return null;
      return {
        ...base,
        gestationalAgeWeeks: encounter.gestationalAgeWeeks,
        fetalHeartRate: encounter.fetalHeartRate,
        fetalMovement: encounter.fetalMovement,
        plan: encounter.plan,
        followUpNote: encounter.followUpNote,
      };
    }
    if (role === UserRole.ADMIN || role === UserRole.SECRETARY) return base;
    if (role === UserRole.DOCTOR && user?.id === encounter.authorUserId) {
      return {
        ...base,
        gestationalAgeWeeks: encounter.gestationalAgeWeeks,
        fetalHeartRate: encounter.fetalHeartRate,
        fetalMovement: encounter.fetalMovement,
        plan: encounter.plan,
        followUpNote: encounter.followUpNote,
      };
    }
    return null;
  },

  async saveUltrasound(labRequestId: string, input: SaveUltrasoundInput): Promise<UltrasoundReport> {
    const doctorId = requireDoctorId();
    const request = mockLabRequests.find((item) => item.id === labRequestId);
    if (!request) throw { code: 'NOT_FOUND', message: 'Imaging request not found' };
    if (request.doctorId !== doctorId) {
      throw { code: 'FORBIDDEN', message: 'Only the ordering doctor writes the ultrasound report' };
    }
    const encounter = encounters.find((item) => item.visitId === request.visitId);
    const stamp = nowIso();
    const existing = ultrasounds.findIndex((item) => item.labRequestId === labRequestId);
    const next: UltrasoundReport = {
      id: existing === -1 ? `us-${Date.now()}` : ultrasounds[existing].id,
      labRequestId,
      visitId: request.visitId,
      pregnancyId: encounter?.pregnancyId,
      authorUserId: doctorId,
      ...input,
      createdAt: existing === -1 ? stamp : ultrasounds[existing].createdAt,
      updatedAt: stamp,
    };
    if (existing === -1) ultrasounds.unshift(next);
    else ultrasounds[existing] = next;
    return next;
  },

  async getUltrasound(labRequestId: string): Promise<UltrasoundReport | null> {
    const report = ultrasounds.find((item) => item.labRequestId === labRequestId) ?? null;
    if (!report) return null;
    const role = useAuthStore.getState().activeRole;
    const user = actor();
    if (role === UserRole.DOCTOR && user?.id === report.authorUserId) return report;
    if (role === UserRole.PATIENT && user) {
      const visit = mockVisits.find((item) => item.id === report.visitId);
      const ids = getPatientIdsForUser(user.id);
      if (visit && ids.includes(visit.patientId)) {
        return { ...report, placenta: undefined, amnioticFluid: undefined, fetalHeartActivity: undefined };
      }
    }
    return null;
  },

  async addAttachment(input: AddClinicalAttachmentInput): Promise<ClinicalAttachment> {
    const doctorId = requireDoctorId();
    const visit = await mockVisitsService.getById(input.visitId);
    if (visit.doctorId !== doctorId) throw { code: 'FORBIDDEN', message: 'You can only attach files to your visit' };
    const attachment: ClinicalAttachment = {
      id: `file-${Date.now()}`,
      patientId: visit.patientId,
      clinicId: visit.clinicId,
      visitId: visit.id,
      labRequestId: input.labRequestId,
      pregnancyId: input.pregnancyId,
      mediaType: input.mediaType,
      fileName: input.fileName,
      dataUrl: input.dataUrl,
      patientVisible: input.patientVisible,
      createdByUserId: doctorId,
      createdAt: nowIso(),
    };
    attachments.unshift(attachment);
    return attachment;
  },

  async listAttachments(visitId: string): Promise<ClinicalAttachment[]> {
    const role = useAuthStore.getState().activeRole;
    const user = actor();
    const rows = attachments.filter((item) => item.visitId === visitId);
    if (role === UserRole.DOCTOR && user) return rows.filter((item) => item.createdByUserId === user.id);
    if (role === UserRole.PATIENT && user) {
      const visit = mockVisits.find((item) => item.id === visitId);
      const ids = getPatientIdsForUser(user.id);
      if (!visit || !ids.includes(visit.patientId)) return [];
      return rows.filter((item) => item.patientVisible);
    }
    return [];
  },
};
