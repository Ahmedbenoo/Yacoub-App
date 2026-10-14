import { PrescriptionStatus } from '@/shared/types/enums';
import type { Prescription } from '@/shared/types/models/prescription';

import { TEST_CLINIC_LOGO_URL } from './clinic-logo';
import { cloneSeed, resetArray } from './clone';

const issuedRecent = new Date(Date.now() - 2 * 86400000).toISOString();
const issuedOlder = new Date(Date.now() - 30 * 86400000).toISOString();

const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    visitId: 'visit-001',
    patientId: 'patient-001',
    doctorId: 'user-doctor-001',
    doctorName: 'Dr. Eslam Shaban',
    number: 'RX-2026-0001',
    clinicId: 'clinic-001',
    clinicName: 'Clinsync Main Clinic',
    clinicNameAr: 'العيادة الرئيسية',
    clinicLogoUrl: TEST_CLINIC_LOGO_URL,
    medications: [
      {
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once daily',
        frequencyAr: 'مرة يومياً',
        duration: '30 days',
        durationAr: '٣٠ يوماً',
        instructions: 'Take in the morning with food',
        instructionsAr: 'صباحاً مع الأكل',
      },
      {
        name: 'Aspirin',
        dosage: '81mg',
        frequency: 'Once daily',
        frequencyAr: 'مرة يومياً',
        duration: '30 days',
        durationAr: '٣٠ يوماً',
        instructions: 'After lunch',
        instructionsAr: 'بعد الغداء',
      },
    ],
    instructions: 'Monitor blood pressure weekly and report any dizziness.',
    instructionsAr: 'راقب ضغط الدم كل اسبوع وابلغ لو حصل دوخه.',
    status: PrescriptionStatus.ISSUED,
    issuedAt: issuedRecent,
    createdAt: issuedRecent,
    updatedAt: issuedRecent,
  },
  {
    id: 'rx-002',
    visitId: 'visit-001',
    patientId: 'patient-001',
    doctorId: 'user-doctor-001',
    doctorName: 'Dr. Ahmed Fathy',
    number: 'RX-2026-0002',
    clinicId: 'clinic-001',
    clinicName: 'Clinsync Main Clinic',
    clinicNameAr: 'العيادة الرئيسية',
    clinicLogoUrl: TEST_CLINIC_LOGO_URL,
    medications: [
      {
        name: 'Vitamin D3',
        dosage: '1000 IU',
        frequency: 'Once daily',
        frequencyAr: 'مرة يومياً',
        duration: '90 days',
        durationAr: '٩٠ يوماً',
        instructions: 'With the largest meal',
        instructionsAr: 'مع وجبه اكبر',
      },
      {
        name: 'Calcium',
        dosage: '500 mg',
        frequency: 'Twice daily',
        frequencyAr: 'مرتين يومياً',
        duration: '30 days',
        durationAr: '٣٠ يوماً',
      },
      {
        name: 'Omega-3',
        dosage: '1000 mg',
        frequency: 'Once daily',
        frequencyAr: 'مرة يومياً',
        duration: '60 days',
        durationAr: '٦٠ يوماً',
      },
    ],
    instructions: 'Take with the largest meal of the day.',
    instructionsAr: 'تؤخذ مع وجبه اكبر فى اليوم.',
    status: PrescriptionStatus.ISSUED,
    issuedAt: issuedOlder,
    createdAt: issuedOlder,
    updatedAt: issuedOlder,
  },
];

export const mockPrescriptions: Prescription[] = cloneSeed(SEED_PRESCRIPTIONS);

export function resetMockPrescriptions() {
  resetArray(mockPrescriptions, SEED_PRESCRIPTIONS);
}
