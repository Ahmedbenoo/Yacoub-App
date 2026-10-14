import { VisitStatus } from '@/shared/types/enums';
import type { Visit } from '@/shared/types/models/visit';

import { cloneSeed, resetArray } from './clone';

const MOCK_CLINIC_ID = 'clinic-001';
const DOCTOR_ID = 'user-doctor-001';

const SEED_VISITS: Visit[] = [
  {
    id: 'visit-001',
    appointmentId: 'appt-005',
    patientId: 'patient-001',
    doctorId: DOCTOR_ID,
    clinicId: MOCK_CLINIC_ID,
    status: VisitStatus.COMPLETED,
    chiefComplaint: 'Blood pressure check',
    diagnosis: 'Hypertension — controlled',
    symptoms: 'Mild headache',
    notes: 'Continue current medication',
    vitals: { bloodPressure: '130/85', heartRate: 78, temperature: 36.8, weight: 62 },
    startedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'visit-002',
    appointmentId: 'appt-006',
    patientId: 'patient-002',
    doctorId: DOCTOR_ID,
    clinicId: MOCK_CLINIC_ID,
    status: VisitStatus.COMPLETED,
    chiefComplaint: 'Diabetes follow-up',
    diagnosis: 'Type 2 Diabetes — stable',
    symptoms: 'Increased thirst',
    notes: 'Continue metformin, review diet plan',
    vitals: { bloodPressure: '125/80', heartRate: 72, temperature: 36.6, weight: 78 },
    startedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 10 * 86400000 + 1800000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'visit-003',
    patientId: 'patient-003',
    doctorId: 'user-doctor-007',
    clinicId: MOCK_CLINIC_ID,
    status: VisitStatus.COMPLETED,
    chiefComplaint: 'Antenatal follow-up',
    diagnosis: 'Intrauterine pregnancy',
    symptoms: 'Mild nausea',
    notes: 'Routine antenatal visit',
    vitals: { bloodPressure: '110/70', heartRate: 82, temperature: 36.7, weight: 64 },
    startedAt: '2026-09-26T09:00:00.000Z',
    completedAt: '2026-09-26T09:30:00.000Z',
    createdAt: '2026-09-26T09:00:00.000Z',
    updatedAt: '2026-09-26T09:30:00.000Z',
  },
];

export const mockVisits: Visit[] = cloneSeed(SEED_VISITS);

export function resetMockVisits() {
  resetArray(mockVisits, SEED_VISITS);
}
