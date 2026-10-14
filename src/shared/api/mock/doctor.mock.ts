import { getActiveClinicId, useAuthStore } from '@/shared/stores/auth-store';
import { LabRequestStatus, PrescriptionStatus, UserRole, VisitStatus } from '@/shared/types/enums';
import type { CreateLabRequestPayload, LabRequest } from '@/shared/types/models/lab-request';
import type {
  CreatePrescriptionPayload,
  Prescription,
  UpdatePrescriptionPayload,
} from '@/shared/types/models/prescription';
import { isPrescriptionDeleted } from '@/shared/types/models/prescription';
import type { StartVisitPayload, UpdateVisitPayload, Visit } from '@/shared/types/models/visit';
import { getMockDoctorBranding } from '@/shared/api/mock/auth.mock';
import { getMockClinicById } from '@/shared/api/mock/clinics.mock';
import { getMockDoctorById, listMembershipClinicIds } from '@/shared/api/mock/doctors.mock';
import { mockLabRequests } from '@/shared/api/mock/lab-requests.mock';
import { mockPrescriptions } from '@/shared/api/mock/prescriptions.mock';
import { mockVisits } from '@/shared/api/mock/visits.mock';
import { sleep } from '@/shared/lib/utils';

import { cloneSeed } from './clone';

const DOCTOR_ID = 'user-doctor-001';

const SEED_AVAILABILITY = {
  doctorId: DOCTOR_ID,
  branchId: 'branch-001',
  branchName: 'Main Clinic',
  slots: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: '09:00',
    endTime: '17:00',
  })),
};

const availabilityByDoctor = new Map<string, { slots: typeof SEED_AVAILABILITY.slots; slotMinutes: number }>();

function availabilityFor(doctorId: string) {
  return (
    availabilityByDoctor.get(doctorId) ?? {
      slots: cloneSeed(SEED_AVAILABILITY.slots),
      slotMinutes: 30,
    }
  );
}

export function resetMockAvailability() {
  availabilityByDoctor.clear();
}

function now() {
  return new Date().toISOString();
}

function sessionUserId(): string | undefined {
  return useAuthStore.getState().user?.id;
}

async function resolveVisitOwner(payload: StartVisitPayload): Promise<{ doctorId: string; clinicId: string }> {
  let doctorId: string | undefined;
  let clinicId: string | undefined;

  if (payload.appointmentId) {
    const { mockAppointmentsService } = await import('./appointments.mock');
    const appointment = await mockAppointmentsService.getById(payload.appointmentId);
    doctorId = appointment.doctorId;
    clinicId = appointment.clinicId;
  } else {
    doctorId = sessionUserId();
    const profile = doctorId ? getMockDoctorById(doctorId) : undefined;
    clinicId = getActiveClinicId() ?? profile?.clinicId ?? useAuthStore.getState().user?.clinicId;
  }

  if (!doctorId || !clinicId) {
    throw { code: 'UNAUTHORIZED', message: 'Doctor session is required' };
  }

  const actor = sessionUserId();
  if (actor && actor !== doctorId) {
    throw { code: 'FORBIDDEN', message: 'You can only open your own visit' };
  }

  const doctor = getMockDoctorById(doctorId);
  if (!doctor) throw { code: 'NOT_FOUND', message: 'Doctor not found' };

  const memberClinics = new Set([doctor.clinicId, ...listMembershipClinicIds(doctorId)]);
  if (!memberClinics.has(clinicId)) {
    throw { code: 'FORBIDDEN', message: 'Doctor is not a member of this clinic' };
  }

  return { doctorId, clinicId };
}

function assertVisitDoctor(visit: Visit) {
  const actor = sessionUserId();
  if (actor && actor !== visit.doctorId) {
    throw { code: 'FORBIDDEN', message: 'This record belongs to another doctor' };
  }
}

export const mockVisitsService = {
  async getById(id: string): Promise<Visit> {
    await sleep(300);
    const visit = mockVisits.find((v) => v.id === id);
    if (!visit) throw { code: 'NOT_FOUND', message: 'Visit not found' };
    const role = useAuthStore.getState().activeRole;
    const actor = sessionUserId();
    if (role === UserRole.DOCTOR && actor && visit.doctorId !== actor) {
      throw { code: 'FORBIDDEN', message: 'This visit belongs to another doctor' };
    }
    return visit;
  },

  async getByPatient(patientId: string): Promise<Visit[]> {
    await sleep(300);
    return mockVisits.filter((v) => v.patientId === patientId);
  },

  async getActiveByPatient(patientId: string): Promise<Visit | null> {
    await sleep(200);
    return mockVisits.find((v) => v.patientId === patientId && v.status === VisitStatus.IN_PROGRESS) ?? null;
  },

  async start(payload: StartVisitPayload): Promise<Visit> {
    await sleep(500);
    const owner = await resolveVisitOwner(payload);
    const existing = mockVisits.find(
      (v) =>
        v.patientId === payload.patientId &&
        v.doctorId === owner.doctorId &&
        v.status === VisitStatus.IN_PROGRESS,
    );
    if (existing) return existing;

    const visit: Visit = {
      id: `visit-${Date.now()}`,
      appointmentId: payload.appointmentId,
      patientId: payload.patientId,
      doctorId: owner.doctorId,
      clinicId: owner.clinicId,
      status: VisitStatus.IN_PROGRESS,
      chiefComplaint: payload.chiefComplaint,
      startedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    };
    mockVisits.unshift(visit);
    return visit;
  },

  async update(id: string, payload: UpdateVisitPayload): Promise<Visit> {
    await sleep(400);
    const index = mockVisits.findIndex((v) => v.id === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Visit not found' };

    mockVisits[index] = {
      ...mockVisits[index],
      ...payload,
      updatedAt: now(),
    };
    return mockVisits[index];
  },

  async complete(id: string): Promise<Visit> {
    await sleep(500);
    const index = mockVisits.findIndex((v) => v.id === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Visit not found' };

    mockVisits[index] = {
      ...mockVisits[index],
      status: VisitStatus.COMPLETED,
      completedAt: now(),
      updatedAt: now(),
    };
    return mockVisits[index];
  },
};

function nextPrescriptionNumber(): string {
  const year = new Date().getFullYear();
  const max = mockPrescriptions.reduce((highest, item) => {
    const match = item.number?.match(/(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `RX-${year}-${String(max + 1).padStart(4, '0')}`;
}

function requireActivePrescription(id: string): { index: number; prescription: Prescription } {
  const index = mockPrescriptions.findIndex((item) => item.id === id);
  if (index === -1) throw { code: 'NOT_FOUND', message: 'Prescription not found' };
  const prescription = mockPrescriptions[index];
  if (isPrescriptionDeleted(prescription)) {
    throw { code: 'NOT_FOUND', message: 'Prescription not found' };
  }
  return { index, prescription };
}

export const mockPrescriptionsService = {
  async byVisit(visitId: string): Promise<Prescription[]> {
    await sleep(300);
    return mockPrescriptions.filter((p) => p.visitId === visitId && !isPrescriptionDeleted(p));
  },

  async create(payload: CreatePrescriptionPayload): Promise<Prescription> {
    await sleep(400);
    const visit = mockVisits.find((v) => v.id === payload.visitId);
    if (!visit) throw { code: 'NOT_FOUND', message: 'Visit not found' };
    assertVisitDoctor(visit);

    const doctor = getMockDoctorById(visit.doctorId);
    const createdAt = now();
    const prescription: Prescription = {
      id: `rx-${Date.now()}`,
      visitId: payload.visitId,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : undefined,
      medications: payload.medications,
      instructions: payload.instructions,
      status: PrescriptionStatus.DRAFT,
      createdAt,
      updatedAt: createdAt,
    };
    mockPrescriptions.unshift(prescription);
    return prescription;
  },

  async update(id: string, payload: UpdatePrescriptionPayload): Promise<Prescription> {
    await sleep(400);
    const { index, prescription } = requireActivePrescription(id);

    mockPrescriptions[index] = {
      ...prescription,
      medications: payload.medications,
      instructions: payload.instructions,
      updatedAt: now(),
    };
    return mockPrescriptions[index];
  },

  async issue(id: string): Promise<Prescription> {
    await sleep(400);
    const { index, prescription } = requireActivePrescription(id);

    if (prescription.status === PrescriptionStatus.ISSUED) {
      return prescription;
    }

    if (
      prescription.status !== PrescriptionStatus.DRAFT &&
      prescription.status !== PrescriptionStatus.FINALIZED
    ) {
      throw { code: 'INVALID_STATE', message: 'Prescription cannot be issued' };
    }

    const issuedAt = now();
    const visit = mockVisits.find((item) => item.id === prescription.visitId);
    const clinic = visit?.clinicId ? getMockClinicById(visit.clinicId) : undefined;
    const branding = getMockDoctorBranding(prescription.doctorId);
    mockPrescriptions[index] = {
      ...prescription,
      number: prescription.number ?? nextPrescriptionNumber(),
      clinicId: clinic?.id ?? visit?.clinicId,
      clinicName: clinic?.name,
      clinicNameAr: clinic?.nameAr,
      clinicLogoUrl: clinic?.logoUrl,
      doctorSignatureUrl: branding.signatureUrl,
      doctorStampUrl: branding.stampUrl,
      status: PrescriptionStatus.ISSUED,
      issuedAt: prescription.issuedAt ?? issuedAt,
      updatedAt: issuedAt,
    };
    return mockPrescriptions[index];
  },

  async remove(id: string): Promise<void> {
    await sleep(350);
    const { index, prescription } = requireActivePrescription(id);
    const deletedAt = now();
    mockPrescriptions[index] = {
      ...prescription,
      deletedAt,
      updatedAt: deletedAt,
    };
  },
};

export const mockLabRequestsService = {
  async byVisit(visitId: string): Promise<LabRequest[]> {
    await sleep(300);
    return mockLabRequests.filter((l) => l.visitId === visitId);
  },

  async create(payload: CreateLabRequestPayload): Promise<LabRequest> {
    await sleep(400);
    const visit = mockVisits.find((v) => v.id === payload.visitId);
    if (!visit) throw { code: 'NOT_FOUND', message: 'Visit not found' };
    assertVisitDoctor(visit);

    const request: LabRequest = {
      id: `lab-${Date.now()}`,
      visitId: payload.visitId,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      type: payload.type,
      testName: payload.testName,
      priority: payload.priority,
      notes: payload.notes,
      status: LabRequestStatus.PENDING,
      requestedAt: now(),
    };
    mockLabRequests.unshift(request);
    return request;
  },
};

export const mockAvailabilityService = {
  async get(doctorId: string) {
    await sleep(300);
    const { getOccupiedSlotIsos } = await import('./appointments.mock');
    const doctor = getMockDoctorById(doctorId);
    const stored = availabilityFor(doctor?.id ?? doctorId);
    return {
      doctorId: doctor?.id ?? doctorId,
      branchId: doctor?.branchId ?? 'branch-001',
      branchName: doctor?.branchName ?? 'Main Clinic',
      slotMinutes: stored.slotMinutes,
      takenSlots: getOccupiedSlotIsos(doctor?.id ?? doctorId),
      slots: stored.slots,
    };
  },

  async update(
    doctorId: string,
    payload: { slots: typeof SEED_AVAILABILITY.slots; slotMinutes?: number },
  ) {
    await sleep(400);
    const current = availabilityFor(doctorId);
    availabilityByDoctor.set(doctorId, {
      slots: payload.slots,
      slotMinutes: payload.slotMinutes && payload.slotMinutes > 0 ? payload.slotMinutes : current.slotMinutes,
    });
    return this.get(doctorId);
  },
};
