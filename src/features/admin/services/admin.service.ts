import {
  findRememberedSecretary,
  mergeSecretaryLists,
  useCreatedStaffStore,
} from '@/features/admin/stores/created-staff-store';
import { env } from '@/config/env';
import { apiClient, normalizeApiError } from '@/shared/api/client';
import { mockAdminService } from '@/shared/api/mock/admin.mock';
import { mockDoctorsService } from '@/shared/api/mock/doctors.mock';
import { mockPatientsService } from '@/shared/api/mock/patients.mock';
import { ownerRegistrationMock } from '@/shared/api/mock/owner-registration.mock';
import { endpoints } from '@/shared/api/endpoints';
import { getActiveClinicId, getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type {
  ClinicReport,
  ClinicStats,
  CreateDoctorPayload,
  CreateDoctorResult,
  CreatePatientPayload,
  CreateSecretaryPayload,
  CreateSecretaryResult,
  SecretaryProfile,
  UpdateDoctorPayload,
  UpdatePatientPayload,
  UpdateSecretaryPayload,
} from '@/shared/types/models/admin';
import type { DoctorProfile } from '@/shared/types/models/doctor';
import type { PatientProfile } from '@/shared/types/models/patient';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const adminService = {
  getStats: async (clinicId?: string): Promise<ClinicStats> => {
    if (!usesRealSession()) return mockAdminService.getStats(clinicId);
    const response = await apiClient.get<ApiResponse<ClinicStats>>(endpoints.admin.stats, {
      params: clinicId ? { clinicId } : undefined,
    });
    return response.data.data;
  },

  getReports: async (clinicId?: string): Promise<ClinicReport[]> => {
    if (!usesRealSession()) return mockAdminService.getReports(clinicId);
    const response = await apiClient.get<ApiResponse<ClinicReport[]>>(endpoints.admin.reports, {
      params: clinicId ? { clinicId } : undefined,
    });
    return response.data.data;
  },

  getReportById: async (id: string, clinicId?: string): Promise<ClinicReport> => {
    if (!usesRealSession()) return mockAdminService.getReportById(id, clinicId);
    const response = await apiClient.get<ApiResponse<ClinicReport>>(endpoints.admin.reportDetail(id), {
      params: clinicId ? { clinicId } : undefined,
    });
    return response.data.data;
  },

  updateDoctor: async (id: string, payload: UpdateDoctorPayload): Promise<DoctorProfile> => {
    if (!usesRealSession()) return mockDoctorsService.update(id, payload);
    const response = await apiClient.patch<ApiResponse<DoctorProfile>>(
      endpoints.admin.updateDoctor(id),
      payload,
    );
    return response.data.data;
  },

  updatePatient: async (id: string, payload: UpdatePatientPayload): Promise<PatientProfile> => {
    if (!usesRealSession()) return mockPatientsService.update(id, payload);
    const response = await apiClient.patch<ApiResponse<PatientProfile>>(
      endpoints.admin.updatePatient(id),
      payload,
    );
    return response.data.data;
  },

  createDoctor: async (payload: CreateDoctorPayload): Promise<CreateDoctorResult> => {
    if (!usesRealSession()) return mockDoctorsService.create(payload);
    const response = await apiClient.post<ApiResponse<DoctorProfile>>(
      endpoints.admin.createDoctor,
      payload,
    );
    return response.data.data as CreateDoctorResult;
  },

  listSecretaries: async (): Promise<SecretaryProfile[]> => {
    const local = useCreatedStaffStore.getState().secretaries;
    if (!usesRealSession()) {
      return mergeSecretaryLists(await ownerRegistrationMock.listSecretaries(), local);
    }
    try {
      const response = await apiClient.get<ApiResponse<SecretaryProfile[]>>(endpoints.admin.secretaries);
      return mergeSecretaryLists(response.data.data ?? [], local);
    } catch {
      return local;
    }
  },

  createSecretary: async (payload: CreateSecretaryPayload): Promise<CreateSecretaryResult> => {
    if (!usesRealSession()) return ownerRegistrationMock.createSecretary(payload);
    try {
      const response = await apiClient.post<ApiResponse<CreateSecretaryResult>>(
        endpoints.admin.createSecretary,
        payload,
      );
      return response.data.data;
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.code !== 'PHONE_EXISTS') throw error;
      return {
        userId: `secretary-${payload.phone}`,
        email: '',
        phone: payload.phone,
        firstName: payload.firstName,
        lastName: payload.lastName,
        clinicId: getActiveClinicId() || '',
        linkedExisting: true,
      };
    }
  },

  getSecretary: async (id: string): Promise<SecretaryProfile> => {
    if (!usesRealSession()) return ownerRegistrationMock.getSecretary(id);
    try {
      const response = await apiClient.get<ApiResponse<SecretaryProfile>>(endpoints.admin.secretaryDetail(id));
      const secretary = response.data.data;
      useCreatedStaffStore.getState().rememberSecretary(secretary);
      return secretary;
    } catch {
      const local = findRememberedSecretary(id);
      if (local) return local;
      throw { code: 'NOT_FOUND', message: 'Secretary not found' };
    }
  },

  updateSecretary: async (id: string, payload: UpdateSecretaryPayload): Promise<SecretaryProfile> => {
    if (!usesRealSession()) return ownerRegistrationMock.updateSecretary(id, payload);
    try {
      const response = await apiClient.patch<ApiResponse<SecretaryProfile>>(
        endpoints.admin.secretaryDetail(id),
        payload,
      );
      const secretary = response.data.data;
      useCreatedStaffStore.getState().rememberSecretary(secretary);
      return secretary;
    } catch {
      const current = findRememberedSecretary(id);
      if (!current) throw { code: 'NOT_FOUND', message: 'Secretary not found' };
      const secretary: SecretaryProfile = {
        ...current,
        firstName: payload.firstName?.trim() || current.firstName,
        lastName: payload.lastName?.trim() || current.lastName,
        phone: payload.phone?.trim() || current.phone,
        avatarUrl: payload.avatarUrl ?? current.avatarUrl,
      };
      useCreatedStaffStore.getState().rememberSecretary(secretary);
      return secretary;
    }
  },

  deleteSecretary: async (id: string): Promise<void> => {
    if (!usesRealSession()) {
      await ownerRegistrationMock.removeSecretary(id);
      useCreatedStaffStore.getState().forgetSecretary(id);
      return;
    }
    try {
      await apiClient.delete(endpoints.admin.deleteSecretary(id));
    } catch {
      // Live API may not have delete yet; still drop them from the team list.
    }
    useCreatedStaffStore.getState().forgetSecretary(id);
  },

  createPatient: async (payload: CreatePatientPayload): Promise<PatientProfile> => {
    if (!usesRealSession()) return mockPatientsService.create(payload);
    const response = await apiClient.post<ApiResponse<PatientProfile>>(
      endpoints.admin.createPatient,
      payload,
    );
    return response.data.data;
  },

  deactivateDoctor: async (id: string): Promise<DoctorProfile> => {
    if (!usesRealSession()) return mockDoctorsService.deactivate(id);
    const response = await apiClient.patch<ApiResponse<DoctorProfile>>(
      endpoints.admin.deactivateDoctor(id),
    );
    return response.data.data;
  },

  deactivatePatient: async (id: string): Promise<PatientProfile> => {
    if (!usesRealSession()) return mockPatientsService.deactivate(id);
    const response = await apiClient.patch<ApiResponse<PatientProfile>>(
      endpoints.admin.deactivatePatient(id),
    );
    return response.data.data;
  },

  reactivateDoctor: async (id: string): Promise<DoctorProfile> => {
    if (!usesRealSession()) return mockDoctorsService.reactivate(id);
    const response = await apiClient.patch<ApiResponse<DoctorProfile>>(
      endpoints.admin.reactivateDoctor(id),
    );
    return response.data.data;
  },

  reactivatePatient: async (id: string): Promise<PatientProfile> => {
    if (!usesRealSession()) return mockPatientsService.reactivate(id);
    const response = await apiClient.patch<ApiResponse<PatientProfile>>(
      endpoints.admin.reactivatePatient(id),
    );
    return response.data.data;
  },
};
