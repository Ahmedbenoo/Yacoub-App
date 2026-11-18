import { normalizePhone } from '@/shared/lib/phone';
import { sleep } from '@/shared/lib/utils';
import { AppointmentStatus, Gender, LabRequestStatus, LabRequestType, UserRole } from '@/shared/types/enums';
import type { PaginatedResponse } from '@/shared/types/models';
import {
  getPrescriptionDisplayDate,
  isIssuedVisiblePrescription,
} from '@/shared/types/models/prescription';
import type {
  MedicalHistoryEntry,
  PatientFilters,
  PatientProfile,
  PatientVisitLink,
  UploadMedicalDocumentPayload,
} from '@/shared/types/models/patient';
import type { Prescription } from '@/shared/types/models/prescription';

import { useAuthStore } from '@/shared/stores/auth-store';

import { listAppointmentsForPatient } from './appointments.mock';
import { MOCK_CLINIC_IDS } from './constants';
import { cloneSeed, resetArray } from './clone';
import { getMockDoctorById } from './doctors.mock';
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
    allergies: [],
    chronicConditions: [],
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
    allergies: [],
    chronicConditions: [],
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
    allergies: [],
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
    allergies: [],
    chronicConditions: [],
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
const mockDocuments: MedicalHistoryEntry[] = [];

export function insertMockPatient(patient: PatientProfile) {
  if (!mockPatients.some((item) => item.id === patient.id)) {
    mockPatients.unshift(patient);
  }
}

export function resetMockPatients() {
  resetArray(mockPatients, SEED_PATIENTS);
  mockDocuments.length = 0;
}

export function listMockDocumentsForVisit(visitId: string): MedicalHistoryEntry[] {
  return mockDocuments.filter((item) => item.visitId === visitId);
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
    source: 'clinic',
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
        source: 'clinic',
      }));
    const labEntries: MedicalHistoryEntry[] = mockLabRequests
      .filter((item) => item.patientId === resolvedId)
      .map((item) => ({
        id: `hist-lab-${item.id}`,
        patientId: item.patientId,
        type: item.type === LabRequestType.IMAGING ? ('radiology' as const) : ('lab' as const),
        title: item.testName,
        description: item.resultSummary ?? item.notes ?? '',
        date: item.completedAt ?? item.requestedAt,
        resourceId: item.id,
        doctorId: item.doctorId,
        source: 'clinic',
      }));
    const prescriptionEntries = mockPrescriptions
      .filter((item) => item.patientId === resolvedId && isIssuedVisiblePrescription(item))
      .map(toPrescriptionHistoryEntry);
    let entries = [...visitEntries, ...labEntries, ...prescriptionEntries];
    if (role === UserRole.DOCTOR && userId) {
      entries = entries.filter((entry) => entry.doctorId === userId);
    }
    const file = mockPatients.find((item) => item.id === resolvedId);
    const uploaded = mockDocuments.filter((item) => {
      if (item.patientId === resolvedId || item.patientId === patientId) return true;
      const owner = mockPatients.find((patient) => patient.id === item.patientId);
      return Boolean(file?.userId && owner?.userId === file.userId);
    });
    return [...entries, ...uploaded].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async listVisitLinks(userId: string): Promise<PatientVisitLink[]> {
    await sleep(200);
    const files = mockPatients.filter((item) => item.userId === userId || item.id === userId);
    const ids = new Set(files.flatMap((item) => [item.id, item.userId]));
    const doctorName = (doctorId: string) => {
      const doctor = getMockDoctorById(doctorId);
      return doctor ? `${doctor.firstName} ${doctor.lastName}` : '';
    };
    const labs: PatientVisitLink[] = mockLabRequests
      .filter((item) => ids.has(item.patientId) && item.status !== LabRequestStatus.CANCELLED)
      .map((item) => ({
        id: item.id,
        kind: 'lab' as const,
        labRequestId: item.id,
        visitId: item.visitId,
        doctorId: item.doctorId,
        doctorName: doctorName(item.doctorId) || item.doctorName.replace(/^Dr\.\s*/, ''),
        date: item.requestedAt,
        testName: item.testName,
      }));
    const usedVisits = new Set(labs.map((item) => item.visitId));
    const visits = mockVisits
      .filter((visit) => ids.has(visit.patientId) && !usedVisits.has(visit.id))
      .map((visit) => ({
        id: visit.id,
        kind: 'visit' as const,
        visitId: visit.id,
        appointmentId: visit.appointmentId,
        doctorId: visit.doctorId,
        doctorName: doctorName(visit.doctorId),
        date: visit.completedAt ?? visit.startedAt,
      }));
    const usedAppointments = new Set(visits.map((item) => item.appointmentId).filter(Boolean));
    const appointments = files
      .flatMap((file) => [
        ...listAppointmentsForPatient(file.id),
        ...listAppointmentsForPatient(file.userId),
      ])
      .filter(
        (item, index, list) =>
          list.findIndex((row) => row.id === item.id) === index &&
          item.status !== AppointmentStatus.CANCELLED &&
          item.status !== AppointmentStatus.NO_SHOW &&
          !usedAppointments.has(item.id),
      )
      .map((item) => ({
        id: item.id,
        kind: 'appointment' as const,
        appointmentId: item.id,
        doctorId: item.doctorId,
        doctorName: item.doctor
          ? `${item.doctor.firstName} ${item.doctor.lastName}`
          : doctorName(item.doctorId),
        date: item.scheduledAt,
      }));
    return [...labs, ...visits, ...appointments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },

  async uploadDocument(userId: string, payload: UploadMedicalDocumentPayload): Promise<MedicalHistoryEntry> {
    await sleep(400);
    const patient = mockPatients.find((item) => item.userId === userId || item.id === userId);
    if (!patient) throw { code: 'NOT_FOUND', message: 'Patient not found' };
    const titles = {
      prescription: 'Prescription photo',
      lab: 'Lab result photo',
      radiology: 'Scan photo',
    } as const;
    let visitId = payload.visitId;
    let doctorId: string | undefined;
    let doctorName = '';
    if (visitId) {
      const visit = mockVisits.find((item) => item.id === visitId);
      if (visit) {
        doctorId = visit.doctorId;
        doctorName = getMockDoctorById(visit.doctorId)
          ? `${getMockDoctorById(visit.doctorId)!.firstName} ${getMockDoctorById(visit.doctorId)!.lastName}`
          : '';
      }
    } else if (payload.labRequestId) {
      const lab = mockLabRequests.find((item) => item.id === payload.labRequestId);
      if (lab) {
        doctorId = lab.doctorId;
        doctorName = lab.doctorName.replace(/^Dr\.\s*/, '');
        visitId = lab.visitId;
      }
    } else if (payload.appointmentId) {
      const files = [patient.id, patient.userId];
      const appointment = files
        .flatMap((id) => listAppointmentsForPatient(id))
        .find((item) => item.id === payload.appointmentId);
      if (appointment) {
        doctorId = appointment.doctorId;
        doctorName = appointment.doctor
          ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
          : '';
        visitId = mockVisits.find((item) => item.appointmentId === appointment.id)?.id;
      }
    }
    const entry: MedicalHistoryEntry = {
      id: `hist-doc-${Date.now()}`,
      patientId: patient.id,
      type: payload.kind,
      title: payload.note?.trim() || titles[payload.kind],
      description: doctorName,
      date: new Date().toISOString(),
      resourceId: `doc-${Date.now()}`,
      doctorId,
      visitId,
      source: 'patient',
      imageUrl: payload.image,
    };
    mockDocuments.unshift(entry);
    return entry;
  },

  async replyDocument(_patientId: string, documentId: string, message: string): Promise<MedicalHistoryEntry> {
    await sleep(300);
    const entry = mockDocuments.find((item) => item.resourceId === documentId || item.id === documentId);
    if (!entry) throw { code: 'NOT_FOUND', message: 'Document not found' };
    entry.doctorReply = message.trim();
    return entry;
  },

  async getMe(userId: string): Promise<PatientProfile> {
    await sleep(400);
    const existing = mockPatients.find((p) => p.id === userId || p.userId === userId);
    if (existing) return existing;

    throw { code: 'NOT_FOUND', message: 'Patient not found' };
  },

  async updateHealthProfile(
    id: string,
    payload: import('@/shared/types/models/patient').UpdateHealthProfilePayload,
  ): Promise<PatientProfile> {
    await sleep(300);
    const index = mockPatients.findIndex((p) => p.id === id || p.userId === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Patient not found' };

    mockPatients[index] = {
      ...mockPatients[index],
      bloodType: payload.bloodType?.trim() || undefined,
      allergies: payload.allergies,
      chronicConditions: payload.chronicConditions,
      updatedAt: new Date().toISOString(),
    };

    return mockPatients[index];
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
