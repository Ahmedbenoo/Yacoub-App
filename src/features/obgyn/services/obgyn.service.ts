import { env } from '@/config/env';
import { mockObgynService } from '@/shared/api/mock/obgyn.mock';
import {
  addVaccinationDose,
  listNewbornsForMother,
  readChildChart,
} from '@/shared/api/mock/newborn.mock';
import { getPatientIdsForUser } from '@/shared/api/mock/patients.mock';
import { useAuthStore } from '@/shared/stores/auth-store';
import { UserRole } from '@/shared/types/enums';
import type { AddClinicalAttachmentInput } from '@/shared/types/models/clinical-attachment';
import type { AddVaccinationDoseInput } from '@/shared/types/models/newborn';
import type { ClosePregnancyInput, CreatePregnancyInput, SaveObgynEncounterInput } from '@/shared/types/models/obgyn';
import type { SaveUltrasoundInput } from '@/shared/types/models/ultrasound-report';

function liveUnsupported(): never {
  throw { code: 'NOT_SUPPORTED', message: 'Obstetrics records are not available on the live API yet' };
}

export const obgynService = {
  listPregnancies: (patientId: string) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.listPregnancies(patientId);
  },
  createPregnancy: (patientId: string, input: CreatePregnancyInput) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.createPregnancy(patientId, input);
  },
  closePregnancy: (id: string, input: ClosePregnancyInput) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.closePregnancy(id, input);
  },
  childLink: (pregnancyId: string) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.childLink(pregnancyId);
  },
  getEncounter: (visitId: string) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.getEncounter(visitId);
  },
  saveEncounter: (visitId: string, input: SaveObgynEncounterInput) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.saveEncounter(visitId, input);
  },
  priorMeasurements: (pregnancyId: string, beforeIso: string) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.priorMeasurements(pregnancyId, beforeIso);
  },
  visitSummary: (visitId: string) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.visitSummary(visitId);
  },
  saveUltrasound: (labRequestId: string, input: SaveUltrasoundInput) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.saveUltrasound(labRequestId, input);
  },
  getUltrasound: (labRequestId: string) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.getUltrasound(labRequestId);
  },
  addAttachment: (input: AddClinicalAttachmentInput) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.addAttachment(input);
  },
  listAttachments: (visitId: string) => {
    if (!env.useMockApi) liveUnsupported();
    return mockObgynService.listAttachments(visitId);
  },
  childChart: (childPatientId: string) => {
    if (!env.useMockApi) liveUnsupported();
    return readChildChart(childPatientId);
  },
  listMyChildren: () => {
    if (!env.useMockApi) liveUnsupported();
    const userId = useAuthStore.getState().user?.id;
    if (!userId || useAuthStore.getState().activeRole !== UserRole.PATIENT) return Promise.resolve([]);
    return Promise.resolve(listNewbornsForMother(getPatientIdsForUser(userId)));
  },
  addDose: async (childPatientId: string, input: AddVaccinationDoseInput) => {
    if (!env.useMockApi) liveUnsupported();
    if (useAuthStore.getState().activeRole !== UserRole.DOCTOR) {
      throw { code: 'FORBIDDEN', message: 'Only the treating doctor can update doses' };
    }
    await readChildChart(childPatientId);
    return addVaccinationDose(childPatientId, input);
  },
};
