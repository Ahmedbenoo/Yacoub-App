import { LabRequestStatus, LabRequestType } from '@/shared/types/enums';
import type { LabRequest } from '@/shared/types/models/lab-request';

import { cloneSeed, resetArray } from './clone';

const SEED_LAB_REQUESTS: LabRequest[] = [
  {
    id: 'lab-001',
    visitId: 'visit-001',
    patientId: 'patient-001',
    doctorId: 'user-doctor-001',
    doctorName: 'Dr. Ahmed Fathy',
    type: LabRequestType.LAB,
    testName: 'Complete Blood Count',
    priority: 'routine',
    status: LabRequestStatus.COMPLETED,
    requestedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    resultSummary:
      'Hemoglobin 13.8 g/dL, WBC 6.2 x10^9/L, Platelets 245 x10^9/L — all values within normal range.',
  },
  {
    id: 'lab-002',
    visitId: 'visit-001',
    patientId: 'patient-001',
    doctorId: 'user-doctor-001',
    doctorName: 'Dr. Ahmed Fathy',
    type: LabRequestType.LAB,
    testName: 'Lipid Panel',
    priority: 'routine',
    status: LabRequestStatus.COMPLETED,
    requestedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    resultSummary:
      'Total cholesterol 198 mg/dL, LDL 118 mg/dL, HDL 52 mg/dL — borderline LDL, lifestyle advice given.',
  },
];

export const mockLabRequests: LabRequest[] = cloneSeed(SEED_LAB_REQUESTS);

export function resetMockLabRequests() {
  resetArray(mockLabRequests, SEED_LAB_REQUESTS);
}
