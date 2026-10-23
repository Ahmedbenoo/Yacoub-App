import { normalizePhone } from '@/shared/lib/phone';
import { sleep } from '@/shared/lib/utils';
import { Gender, UserRole } from '@/shared/types/enums';
import type { PaginatedResponse } from '@/shared/types/models';
import {
  getPrescriptionDisplayDate,
  isIssuedVisiblePrescription,
} from '@/shared/types/models/prescription';
import type { MedicalHistoryEntry, PatientFilters, PatientProfile } from '@/shared/types/models/patient';
import type { Prescription } from '@/shared/types/models/prescription';

import { useAuthStore } from '@/shared/stores/auth-store';

import { MOCK_CLINIC_IDS } from './constants';
import { cloneSeed, resetArray } from './clone';
import { getMockClinicScope } from './helpers';
import { mockLabRequests } from './lab-requests.mock';
import { mockPrescriptions } from './prescriptions.mock';
import { mockVisits } from './visits.mock';

const DOCTOR_ID = 'user-doctor-001';

const SEED_PATIENTS: PatientProfile[] = [
  {
    id: 'patient-001',
    userId: 'user-patient-001',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Ahmed',
    lastName: 'Fathy',
    email: 'patient@clinic.com',
    phone: '+201000000001',
    dateOfBirth: '1995-06-08',
    gender: Gender.MALE,
    bloodType: 'A+',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    lastVisitAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'patient-002',
    userId: 'user-patient-002',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Youssef',
    lastName: 'Kamal',
    email: 'youssef.kamal@email.com',
    phone: '+201000000002',
    dateOfBirth: '1988-09-23',
    gender: Gender.MALE,
    bloodType: 'O+',
    allergies: [],
    chronicConditions: ['Type 2 Diabetes'],
    lastVisitAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'patient-003',
    userId: 'user-patient-003',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Nour',
    lastName: 'Adel',
    email: 'nour.adel@email.com',
    phone: '+201000000003',
    dateOfBirth: '1998-01-05',
    gender: Gender.FEMALE,
    bloodType: 'B+',
    allergies: ['Latex'],
    chronicConditions: [],
    lastVisitAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'patient-004',
    userId: 'user-patient-004',
    clinicId: MOCK_CLINIC_IDS.DOWNTOWN,
    firstName: 'Fatima',
    lastName: 'Ali',
    email: 'fatima.ali@email.com',
    phone: '+201000000004',
    dateOfBirth: '1990-06-18',
    gender: Gender.FEMALE,
    bloodType: 'AB+',
    allergies: [],
    chronicConditions: ['Asthma'],
    lastVisitAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'patient-child-001',
    userId: 'user-child-001',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Lina',
    lastName: 'Adel',
    dateOfBirth: '2026-05-08',
    gender: Gender.FEMALE,
    allergies: [],
    chronicConditions: [],
    createdAt: '2026-05-08T10:00:00.000Z',
    updatedAt: '2026-05-08T10:00:00.000Z',
  },
];

const mockPatients: PatientProfile[] = cloneSeed(SEED_PATIENTS);

export function insertMockPatient(patient: PatientProfile) {
  if (!mockPatients.some((item) => item.id === patient.id)) {
    mockPatients.unshift(patient);
  }
}

export function resetMockPatients() {
  resetArray(mockPatients, SEED_PATIENTS);
}

export function linkPatientFilesByPhone(userId: string, phone: string): boolean {
  const normalized = normalizePhone(phone);
  let linked = false;

  for (const patient of mockPatients) {
    if (!patient.phone || normalizePhone(patient.phone) !== normalized) continue;
    patient.userId = userId;
    linked = true;
  }

  return linked;
}

export function getPatientIdsForUser(userId: string): string[] {
  return mockPatients.filter((patient) => patient.userId === userId).map((patient) => patient.id);
}

export function getPatientPhone(patientId: string): string | undefined {
  return mockPatients.find((patient) => patient.id === patientId || patient.userId === patientId)?.phone;
}

export function syncPatientIdentity(user: {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
}) {
  const now = new Date().toISOString();
  for (const patient of mockPatients) {
    if (patient.userId !== user.id && patient.id !== user.id) continue;
    patient.firstName = user.firstName;
    patient.lastName = user.lastName;
    if (user.phone) patient.phone = user.phone;
    if (user.email) patient.email = user.email;
    patient.avatarUrl = user.avatarUrl;
    patient.updatedAt = now;
  }
}

export function ensurePatientForUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  clinicId?: string;
}): PatientProfile {
  const existing = mockPatients.find((p) => p.userId === user.id || p.id === user.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const patient: PatientProfile = {
    id: `patient-${user.id.replace(/^user-/, '')}`,
    userId: user.id,
    clinicId: user.clinicId ?? getMockClinicScope(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    dateOfBirth: '1990-01-01',
    gender: Gender.OTHER,
    allergies: [],
    chronicConditions: [],
    createdAt: now,
    updatedAt: now,
  };

  mockPatients.push(patient);
  return patient;
}

function toPrescriptionHistoryEntry(prescription: Prescription): MedicalHistoryEntry {
  const first = prescription.medications[0];
  return {
    id: `hist-rx-${prescription.id}`,
    patientId: prescription.patientId,
    type: 'prescription',
    title: first ? `${first.name} ${first.dosage}`.trim() : 'Prescription',
    description: first?.frequency ?? prescription.instructions ?? '',
    date: getPrescriptionDisplayDate(prescription),
    resourceId: prescription.id,
    doctorId: prescription.doctorId,
  };
}

function filterPatients(filters: PatientFilters): PatientProfile[] {
  let result = mockPatients.filter((patient) => {
    if (patient.isActive === false && !filters.includeInactive) return false;
    return patient.clinicId === getMockClinicScope(filters.clinicId);
  });

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.phone?.replace(/\D/g, '').includes(q.replace(/\D/g, '')),
    );
  }

  return result;
}

export const mockPatientsService = {
  async list(filters: PatientFilters = {}): Promise<PaginatedResponse<PatientProfile>> {
    await sleep(500);
    const filtered = filterPatients(filters);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit),
      meta: { page, limit, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / limit)) },
    };
  },

  async getById(id: string): Promise<PatientProfile> {
    await sleep(400);
    const patient = mockPatients.find((p) => p.id === id || p.userId === id);
    if (!patient) throw { code: 'NOT_FOUND', message: 'Patient not found' };
    return patient;
  },

  async getHistory(patientId: string): Promise<MedicalHistoryEntry[]> {
    await sleep(400);
    const resolvedId = mockPatients.find((p) => p.id === patientId || p.userId === patientId)?.id ?? patientId;
    const role = useAuthStore.getState().activeRole;
    const userId = useAuthStore.getState().user?.id;
    const visitEntries: MedicalHistoryEntry[] = mockVisits
      .filter((visit) => visit.patientId === resolvedId)
      .map((visit) => ({
        id: `hist-visit-${visit.id}`,
        patientId: visit.patientId,
        type: 'visit' as const,
        title:
          role === UserRole.ADMIN || role === UserRole.SECRETARY
            ? 'Visit'
            : visit.diagnosis || visit.chiefComplaint || 'Visit',
        description:
          role === UserRole.ADMIN || role === UserRole.SECRETARY ? '' : visit.chiefComplaint ?? '',
        date: visit.completedAt ?? visit.startedAt,
        resourceId: visit.id,
        doctorId: visit.doctorId,
      }));
    const labEntries: MedicalHistoryEntry[] = mockLabRequests
      .filter((item) => item.patientId === resolvedId)
      .map((item) => ({
        id: `hist-lab-${item.id}`,
        patientId: item.patientId,
        type: 'lab' as const,
        title: item.testName,
        description: item.resultSummary ?? item.notes ?? '',
        date: item.completedAt ?? item.requestedAt,
        resourceId: item.id,
        doctorId: item.doctorId,
      }));
    const prescriptionEntries = mockPrescriptions
      .filter((item) => item.patientId === resolvedId && isIssuedVisiblePrescription(item))
      .map(toPrescriptionHistoryEntry);
    let entries = [...visitEntries, ...labEntries, ...prescriptionEntries];
    if (role === UserRole.DOCTOR && userId) {
      entries = entries.filter((entry) => entry.doctorId === userId);
    }
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getMe(userId: string): Promise<PatientProfile> {
    await sleep(400);
    const existing = mockPatients.find((p) => p.id === userId || p.userId === userId);
    if (existing) return existing;

    throw { code: 'NOT_FOUND', message: 'Patient not found' };
  },

  async update(id: string, payload: import('@/shared/types/models/admin').UpdatePatientPayload): Promise<PatientProfile> {
    await sleep(500);
    const index = mockPatients.findIndex((p) => p.id === id || p.userId === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Patient not found' };

    mockPatients[index] = {
      ...mockPatients[index],
      phone: payload.phone,
      email: payload.email || mockPatients[index].email,
      allergies: payload.allergies,
      chronicConditions: payload.chronicConditions,
      updatedAt: new Date().toISOString(),
    };

    return mockPatients[index];
  },

  async deactivate(id: string): Promise<PatientProfile> {
    await sleep(500);
    const index = mockPatients.findIndex((p) => p.id === id || p.userId === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Patient not found' };

    mockPatients[index] = {
      ...mockPatients[index],
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    return mockPatients[index];
  },

  async reactivate(id: string): Promise<PatientProfile> {
    await sleep(500);
    const index = mockPatients.findIndex((p) => p.id === id || p.userId === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Patient not found' };

    mockPatients[index] = {
      ...mockPatients[index],
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    return mockPatients[index];
  },

  async create(payload: import('@/shared/types/models/admin').CreatePatientPayload): Promise<PatientProfile> {
    await sleep(500);

    const id = `patient-${String(mockPatients.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const patient: PatientProfile = {
      id,
      userId: `user-${id}`,
      clinicId: getMockClinicScope(),
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      bloodType: payload.bloodType,
      allergies: payload.allergies,
      chronicConditions: payload.chronicConditions,
      lastVisitAt: undefined,
      createdAt: now,
      updatedAt: now,
    };

    mockPatients.push(patient);
    return patient;
  },

  getDoctorId: () => DOCTOR_ID,
};

export function getPatientIdByUserId(userId: string): string | undefined {
  return mockPatients.find((p) => p.userId === userId)?.id;
}
