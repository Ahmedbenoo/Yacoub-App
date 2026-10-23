import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { getPatientIdsForUser, mockPatientsService } from '@/shared/api/mock/patients.mock';
import { getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type { MedicalHistoryEntry, PatientProfile } from '@/shared/types/models/patient';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const patientRecordsService = {
  getMyProfile: async (userId: string): Promise<PatientProfile> => {
    if (!usesRealSession()) return mockPatientsService.getMe(userId);
    const response = await apiClient.get<ApiResponse<PatientProfile>>(endpoints.patients.me);
    return response.data.data;
  },

  getMyHistory: async (userId: string): Promise<MedicalHistoryEntry[]> => {
    if (!usesRealSession()) {
      const patientIds = getPatientIdsForUser(userId);
      if (patientIds.length === 0) return [];
      const histories = await Promise.all(patientIds.map((id) => mockPatientsService.getHistory(id)));
      return histories.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    const response = await apiClient.get<ApiResponse<MedicalHistoryEntry[]>>(`${endpoints.patients.me}/history`);
    return response.data.data;
  },
};
