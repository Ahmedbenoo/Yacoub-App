import { getMockDoctorBranding } from '@/shared/api/mock/auth.mock';
import { getMockClinicById } from '@/shared/api/mock/clinics.mock';
import { mockVisitsService } from '@/shared/api/mock/doctor.mock';
import { getMockDoctorById } from '@/shared/api/mock/doctors.mock';
import { mockLabRequests } from '@/shared/api/mock/lab-requests.mock';
import { getPatientIdsForUser, getPatientIdByUserId } from '@/shared/api/mock/patients.mock';
import { mockPrescriptions } from '@/shared/api/mock/prescriptions.mock';
import { sleep } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/stores/auth-store';
import { LabRequestStatus, UserRole } from '@/shared/types/enums';
import type { LabRequest } from '@/shared/types/models/lab-request';
import type { Prescription } from '@/shared/types/models/prescription';
import {
  getPrescriptionDisplayDate,
  isIssuedVisiblePrescription,
} from '@/shared/types/models/prescription';
import type { PatientVisitDetail } from '@/shared/types/models/visit';

async function resolvePatientIds(userId: string): Promise<string[]> {
  const ids = getPatientIdsForUser(userId);
  if (ids.length) return ids;
  const patientId = getPatientIdByUserId(userId);
  if (!patientId) {
    throw { code: 'NOT_FOUND', message: 'Patient profile not found' };
  }
  return [patientId];
}

function withIssuedIdentity(prescription: Prescription): Prescription {
  const clinic = prescription.clinicId ? getMockClinicById(prescription.clinicId) : undefined;
  const branding = getMockDoctorBranding(prescription.doctorId);
  return {
    ...prescription,
    clinicName: prescription.clinicName || clinic?.name,
    clinicNameAr: prescription.clinicNameAr || clinic?.nameAr,
    clinicLogoUrl: prescription.clinicLogoUrl || clinic?.logoUrl,
    doctorSignatureUrl: prescription.doctorSignatureUrl || branding.signatureUrl,
    doctorStampUrl: prescription.doctorStampUrl || branding.stampUrl,
  };
}

function buildPatientVisitDetail(visit: Awaited<ReturnType<typeof mockVisitsService.getById>>): PatientVisitDetail {
  const doctor = getMockDoctorById(visit.doctorId);
  const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown doctor';

  return {
    ...visit,
    doctorName,
    linkedPrescriptionIds: mockPrescriptions
      .filter(
        (item) =>
          item.visitId === visit.id &&
          item.patientId === visit.patientId &&
          isIssuedVisiblePrescription(item),
      )
      .map((item) => item.id),
    linkedLabResultIds: mockLabRequests
      .filter((item) => item.visitId === visit.id && item.patientId === visit.patientId)
      .map((item) => item.id),
  };
}

export const mockPatientClinicalService = {
  async listPrescriptions(userId: string): Promise<Prescription[]> {
    await sleep(400);
    const patientIds = await resolvePatientIds(userId);
    return mockPrescriptions
      .filter((item) => patientIds.includes(item.patientId) && isIssuedVisiblePrescription(item))
      .map(withIssuedIdentity)
      .sort(
        (a, b) =>
          new Date(getPrescriptionDisplayDate(b)).getTime() -
          new Date(getPrescriptionDisplayDate(a)).getTime(),
      );
  },

  async getPrescription(userId: string, id: string): Promise<Prescription> {
    await sleep(300);
    const patientIds = await resolvePatientIds(userId);
    const prescription = mockPrescriptions.find(
      (item) => item.id === id && patientIds.includes(item.patientId) && isIssuedVisiblePrescription(item),
    );
    if (!prescription) {
      throw { code: 'NOT_FOUND', message: 'Prescription not found' };
    }
    return withIssuedIdentity(prescription);
  },

  async listLabResults(userId: string): Promise<LabRequest[]> {
    await sleep(400);
    const patientIds = await resolvePatientIds(userId);
    return mockLabRequests
      .filter((item) => patientIds.includes(item.patientId))
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  },

  async getLabResult(userId: string, id: string): Promise<LabRequest> {
    await sleep(300);
    const patientIds = await resolvePatientIds(userId);
    const labResult = mockLabRequests.find((item) => item.id === id && patientIds.includes(item.patientId));
    if (!labResult) {
      throw { code: 'NOT_FOUND', message: 'Lab result not found' };
    }
    return labResult;
  },

  async getVisit(userId: string, id: string): Promise<PatientVisitDetail> {
    await sleep(350);
    const patientIds = await resolvePatientIds(userId);
    const visit = await mockVisitsService.getById(id);

    if (!patientIds.includes(visit.patientId)) {
      throw { code: 'NOT_FOUND', message: 'Visit not found' };
    }

    return buildPatientVisitDetail(visit);
  },

  async getPrescriptionById(id: string): Promise<Prescription> {
    await sleep(300);
    const prescription = mockPrescriptions.find(
      (item) => item.id === id && isIssuedVisiblePrescription(item),
    );
    if (!prescription) {
      throw { code: 'NOT_FOUND', message: 'Prescription not found' };
    }
    return withIssuedIdentity(prescription);
  },

  async getLabResultById(id: string): Promise<LabRequest> {
    await sleep(300);
    const labResult = mockLabRequests.find((item) => item.id === id);
    if (!labResult) {
      throw { code: 'NOT_FOUND', message: 'Lab result not found' };
    }
    return labResult;
  },

  async recordLabResult(id: string, resultSummary: string): Promise<LabRequest> {
    await sleep(400);
    const labResult = mockLabRequests.find((item) => item.id === id);
    if (!labResult) {
      throw { code: 'NOT_FOUND', message: 'Lab result not found' };
    }
    labResult.resultSummary = resultSummary.trim();
    labResult.status = LabRequestStatus.COMPLETED;
    labResult.completedAt = new Date().toISOString();
    return labResult;
  },

  async getVisitById(id: string): Promise<PatientVisitDetail> {
    await sleep(350);
    const visit = await mockVisitsService.getById(id);
    const detail = buildPatientVisitDetail(visit);
    const role = useAuthStore.getState().activeRole;
    if (role === UserRole.ADMIN || role === UserRole.SECRETARY) {
      return {
        ...detail,
        chiefComplaint: undefined,
        diagnosis: undefined,
        symptoms: undefined,
        notes: undefined,
        vitals: undefined,
      };
    }
    return detail;
  },
};
