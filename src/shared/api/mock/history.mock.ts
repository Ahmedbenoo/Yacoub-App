import type { MedicalHistoryEntry } from '@/shared/types/models/patient';

import { cloneSeed, resetArray } from './clone';

const SEED_HISTORY: MedicalHistoryEntry[] = [
  {
    id: 'hist-001',
    patientId: 'patient-001',
    type: 'visit',
    title: 'General checkup',
    description: 'Blood pressure monitoring, medication review',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    resourceId: 'visit-001',
  },
  {
    id: 'hist-002',
    patientId: 'patient-001',
    type: 'prescription',
    title: 'Amlodipine 5mg',
    description: 'Once daily for hypertension',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    resourceId: 'rx-001',
  },
  {
    id: 'hist-003',
    patientId: 'patient-001',
    type: 'lab',
    title: 'Complete Blood Count',
    description: 'Routine panel — results normal',
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    resourceId: 'lab-001',
  },
  {
    id: 'hist-005',
    patientId: 'patient-001',
    type: 'prescription',
    title: 'Vitamin D3',
    description: 'Once daily supplement',
    date: new Date(Date.now() - 30 * 86400000).toISOString(),
    resourceId: 'rx-002',
  },
  {
    id: 'hist-006',
    patientId: 'patient-001',
    type: 'lab',
    title: 'Lipid Panel',
    description: 'Borderline LDL — lifestyle advice given',
    date: new Date(Date.now() - 14 * 86400000).toISOString(),
    resourceId: 'lab-002',
  },
  {
    id: 'hist-004',
    patientId: 'patient-002',
    type: 'visit',
    title: 'Diabetes follow-up',
    description: 'HbA1c discussed, diet counseling provided',
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    resourceId: 'visit-002',
  },
];

export const mockHistory: MedicalHistoryEntry[] = cloneSeed(SEED_HISTORY);

export function resetMockHistory() {
  resetArray(mockHistory, SEED_HISTORY);
}
