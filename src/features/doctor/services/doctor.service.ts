import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { mockAvailabilityService } from '@/shared/api/mock/doctor.mock';
import { endpoints } from '@/shared/api/endpoints';
import { getAuthToken, useAuthStore } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type { UpdateAvailabilityPayload, DoctorAvailability } from '@/shared/types/models/availability';

export { visitsService } from '@/features/clinical/visits/services/visits.service';
export { prescriptionsService } from '@/features/clinical/prescriptions/services/prescriptions.service';
export { labRequestsService } from '@/features/clinical/lab-orders/services/lab-requests.service';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

export const availabilityService = {
  get: async (): Promise<DoctorAvailability> => {
    const doctorId = useAuthStore.getState().user?.id ?? '';
    if (!usesRealSession()) return mockAvailabilityService.get(doctorId);
    const response = await apiClient.get<ApiResponse<DoctorAvailability>>(
      endpoints.doctors.availability(doctorId),
    );
    return response.data.data;
  },

  updateFor: async (doctorId: string, payload: UpdateAvailabilityPayload): Promise<DoctorAvailability> => {
    if (!usesRealSession()) return mockAvailabilityService.update(doctorId, payload);
    const response = await apiClient.put<ApiResponse<DoctorAvailability>>(
      endpoints.doctors.availability(doctorId),
      payload,
    );
    return response.data.data;
  },

  update: async (payload: UpdateAvailabilityPayload): Promise<DoctorAvailability> => {
    const doctorId = useAuthStore.getState().user?.id ?? '';
    return availabilityService.updateFor(doctorId, payload);
  },
};
