import { env } from '@/config/env';
import { apiClient, normalizeApiError } from '@/shared/api/client';
import {
  approveClinic,
  listPendingClinics,
  mockClinicsService,
  ownerHasCenter,
  setClinicLogo,
  updateClinicListing,
} from '@/shared/api/mock/clinics.mock';
import { mockDoctorsService } from '@/shared/api/mock/doctors.mock';
import { endpoints } from '@/shared/api/endpoints';
import { getAuthToken } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import type { ApiResponse, Clinic, ClinicFilters, PaginatedResponse } from '@/shared/types/models';
import type { AddOwnerClinicPayload } from '@/shared/types/models/admin';
import { ownerRegistrationMock } from '@/shared/api/mock/owner-registration.mock';

function usesRealClinicApi(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const clinicsService = {
  listForUser: async (userId: string, role?: UserRole | null): Promise<Clinic[]> => {
    if (!usesRealClinicApi()) {
      const clinics = await mockClinicsService.listForUser(userId);
      if (role !== UserRole.DOCTOR) return clinics;
      const memberIds = mockDoctorsService.listMembershipClinicIds(userId);
      if (!memberIds.length) return clinics;
      return clinics.filter((clinic) => memberIds.includes(clinic.id));
    }
    const response = await apiClient.get<ApiResponse<Clinic[]>>(endpoints.clinics.list);
    return response.data.data;
  },

  search: async (filters: ClinicFilters = {}): Promise<PaginatedResponse<Clinic>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Clinic>>>(
      endpoints.clinics.search,
      { params: filters },
    );
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(endpoints.clinics.detail(id));
  },

  getById: async (id: string): Promise<Clinic | null> => {
    try {
      const response = await apiClient.get<ApiResponse<Clinic>>(endpoints.clinics.detail(id));
      return response.data.data;
    } catch (error) {
      if (normalizeApiError(error).code === 'NOT_FOUND') return null;
      throw error;
    }
  },

  getCities: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>(endpoints.clinics.cities);
    return response.data.data;
  },

  ownerHasCenter: (userId: string): boolean => {
    if (env.useMockApi) return ownerHasCenter(userId);
    return false;
  },

  listPending: async (ownerUserId: string): Promise<Clinic[]> => {
    if (!usesRealClinicApi()) return listPendingClinics(ownerUserId);
    const response = await apiClient.get<ApiResponse<Clinic[]>>(endpoints.clinics.pending);
    return response.data.data;
  },

  approve: async (id: string): Promise<Clinic> => {
    if (!usesRealClinicApi()) return approveClinic(id);
    const response = await apiClient.post<ApiResponse<Clinic>>(endpoints.clinics.detail(id));
    return response.data.data;
  },

  updateListing: async (
    clinicId: string,
    patch: {
      openingHours?: string;
      consultationFee?: number;
      locationUrl?: string;
      photoUrl?: string;
      coverUrl?: string;
      replacePhotoIndex?: number;
      replacePhotoUrl?: string;
    },
  ): Promise<Clinic> => {
    if (!usesRealClinicApi()) return updateClinicListing(clinicId, patch);
    const response = await apiClient.patch<ApiResponse<Clinic>>(endpoints.clinics.detail(clinicId), patch);
    return response.data.data;
  },

  setLogo: async (clinicId: string, logoUrl: string): Promise<Clinic> => {
    if (!usesRealClinicApi()) return setClinicLogo(clinicId, logoUrl);
    const response = await apiClient.patch<ApiResponse<Clinic>>(endpoints.clinics.detail(clinicId), {
      logoUrl,
    });
    return response.data.data;
  },

  addClinic: async (ownerUserId: string, payload: AddOwnerClinicPayload): Promise<Clinic> => {
    if (!usesRealClinicApi()) return ownerRegistrationMock.addClinic(ownerUserId, payload);
    const response = await apiClient.post<ApiResponse<Clinic>>(endpoints.clinics.list, payload);
    return response.data.data;
  },
};
