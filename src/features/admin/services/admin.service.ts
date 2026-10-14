import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockAdminService } from '@/shared/api/mock/admin.mock';
import { mockDoctorsService } from '@/shared/api/mock/doctors.mock';
import { mockPatientsService } from '@/shared/api/mock/patients.mock';
import { ownerRegistrationMock } from '@/shared/api/mock/owner-registration.mock';
import { endpoints } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types/models';
import type {
  ClinicReport,
  ClinicStats,
  CreateDoctorPayload,
  CreateDoctorResult,
  CreatePatientPayload,
  CreateSecretaryPayload,
  CreateSecretaryResult,
  UpdateDoctorPayload,
  UpdatePatientPayload,
} from '@/shared/types/models/admin';
import type { DoctorProfile } from '@/shared/types/models/doctor';
import type { PatientProfile } from '@/shared/types/models/patient';

export const adminService = {
  getStats: async (clinicId?: string): Promise<ClinicStats> => {
    if (env.useMockApi) return mockAdminService.getStats(clinicId);
    const response = await apiClient.get<ApiResponse<ClinicStats>>(endpoints.admin.stats);
    return response.data.data;
  },

  getReports: async (clinicId?: string): Promise<ClinicReport[]> => {
    if (env.useMockApi) return mockAdminService.getReports(clinicId);
    const response = await apiClient.get<ApiResponse<ClinicReport[]>>(endpoints.admin.reports);
    return response.data.data;
  },

  getReportById: async (id: string, clinicId?: string): Promise<ClinicReport> => {
    if (env.useMockApi) return mockAdminService.getReportById(id, clinicId);
    const response = await apiClient.get<ApiResponse<ClinicReport>>(
      endpoints.admin.reportDetail(id),
    );
    return response.data.data;
  },

  updateDoctor: async (id: string, payload: UpdateDoctorPayload): Promise<DoctorProfile> => {
    if (env.useMockApi) return mockDoctorsService.update(id, payload);
    const response = await apiClient.patch<ApiResponse<DoctorProfile>>(
      endpoints.admin.updateDoctor(id),
      payload,
    );
    return response.data.data;
  },

  updatePatient: async (id: string, payload: UpdatePatientPayload): Promise<PatientProfile> => {
    if (env.useMockApi) return mockPatientsService.update(id, payload);
    const response = await apiClient.patch<ApiResponse<PatientProfile>>(
      endpoints.admin.updatePatient(id),
      payload,
    );
    return response.data.data;
  },

  createDoctor: async (payload: CreateDoctorPayload): Promise<CreateDoctorResult> => {
    if (env.useMockApi) return mockDoctorsService.create(payload);
    const response = await apiClient.post<ApiResponse<DoctorProfile>>(
      endpoints.admin.createDoctor,
      payload,
    );
    return response.data.data as CreateDoctorResult;
  },

  createSecretary: async (payload: CreateSecretaryPayload): Promise<CreateSecretaryResult> => {
    if (env.useMockApi) return ownerRegistrationMock.createSecretary(payload);
    throw { code: 'UNSUPPORTED', message: 'Secretary creation requires the mock API' };
  },

  createPatient: async (payload: CreatePatientPayload): Promise<PatientProfile> => {
    if (env.useMockApi) return mockPatientsService.create(payload);
    const response = await apiClient.post<ApiResponse<PatientProfile>>(
      endpoints.admin.createPatient,
      payload,
    );
    return response.data.data;
  },

  deactivateDoctor: async (id: string): Promise<DoctorProfile> => {
    if (env.useMockApi) return mockDoctorsService.deactivate(id);
    const response = await apiClient.patch<ApiResponse<DoctorProfile>>(
      endpoints.admin.deactivateDoctor(id),
    );
    return response.data.data;
  },

  deactivatePatient: async (id: string): Promise<PatientProfile> => {
    if (env.useMockApi) return mockPatientsService.deactivate(id);
    const response = await apiClient.patch<ApiResponse<PatientProfile>>(
      endpoints.admin.deactivatePatient(id),
    );
    return response.data.data;
  },

  reactivateDoctor: async (id: string): Promise<DoctorProfile> => {
    if (env.useMockApi) return mockDoctorsService.reactivate(id);
    const response = await apiClient.patch<ApiResponse<DoctorProfile>>(
      endpoints.admin.reactivateDoctor(id),
    );
    return response.data.data;
  },

  reactivatePatient: async (id: string): Promise<PatientProfile> => {
    if (env.useMockApi) return mockPatientsService.reactivate(id);
    const response = await apiClient.patch<ApiResponse<PatientProfile>>(
      endpoints.admin.reactivatePatient(id),
    );
    return response.data.data;
  },
};
