import { appointmentsService } from '@/features/appointments/services/appointments.service';
import { env } from '@/config/env';
import { apiClient } from '@/shared/api/client';
import { endpoints } from '@/shared/api/endpoints';
import { getPatientIdsForUser, mockPatientsService } from '@/shared/api/mock/patients.mock';
import { AppointmentStatus } from '@/shared/types/enums';
import { getActiveClinicId, getAuthToken } from '@/shared/stores';
import type { ApiResponse } from '@/shared/types/models';
import type {
  MedicalHistoryEntry,
  PatientProfile,
  PatientVisitLink,
  UploadMedicalDocumentPayload,
  UpdateHealthProfilePayload,
} from '@/shared/types/models/patient';

function usesRealSession(): boolean {
  const token = getAuthToken();
  return !env.useMockApi || Boolean(token && !token.startsWith('mock-'));
}

async function fallbackVisitLinks(): Promise<PatientVisitLink[]> {
  const links: PatientVisitLink[] = [];
  const seen = new Set<string>();

  try {
    const response = await apiClient.get<ApiResponse<MedicalHistoryEntry[]>>(`${endpoints.patients.me}/history`);
    for (const entry of response.data.data ?? []) {
      if (
        (entry.type === 'lab' || entry.type === 'radiology') &&
        entry.source === 'clinic' &&
        entry.resourceId &&
        !seen.has(entry.resourceId)
      ) {
        seen.add(entry.resourceId);
        links.push({
          id: entry.resourceId,
          kind: 'lab',
          labRequestId: entry.resourceId,
          visitId: entry.visitId,
          doctorId: entry.doctorId ?? '',
          doctorName: entry.description || '',
          date: entry.date,
          testName: entry.title,
        });
      }
    }
  } catch {
    // History may be empty or unavailable.
  }

  const clinicId = getActiveClinicId();
  if (clinicId) {
    try {
      const result = await appointmentsService.list({ clinicId, scope: 'all', limit: 50 });
      for (const item of result.data) {
        if (item.status === AppointmentStatus.CANCELLED || item.status === AppointmentStatus.NO_SHOW) continue;
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        links.push({
          id: item.id,
          kind: 'appointment',
          appointmentId: item.id,
          doctorId: item.doctorId,
          doctorName: `${item.doctor.firstName} ${item.doctor.lastName}`.trim(),
          date: item.scheduledAt,
        });
      }
    } catch {
      // Appointments are optional when building the picker.
    }
  }

  return links.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const patientRecordsService = {
  getMyProfile: async (userId: string): Promise<PatientProfile> => {
    if (!usesRealSession()) return mockPatientsService.getMe(userId);
    const response = await apiClient.get<ApiResponse<PatientProfile>>(endpoints.patients.me);
    return response.data.data;
  },

  updateMyHealthProfile: async (userId: string, payload: UpdateHealthProfilePayload): Promise<PatientProfile> => {
    if (!usesRealSession()) return mockPatientsService.updateHealthProfile(userId, payload);
    const response = await apiClient.patch<ApiResponse<PatientProfile>>(
      endpoints.patients.myHealthProfile,
      payload,
    );
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

  listVisitLinks: async (userId: string): Promise<PatientVisitLink[]> => {
    if (!usesRealSession()) return mockPatientsService.listVisitLinks(userId);
    const fromApi = await apiClient
      .get<ApiResponse<PatientVisitLink[]>>(endpoints.patients.visitLinks)
      .then((response) => response.data.data)
      .catch(() => [] as PatientVisitLink[]);
    if (fromApi.length > 0) return fromApi;
    return fallbackVisitLinks();
  },

  uploadDocument: async (userId: string, payload: UploadMedicalDocumentPayload): Promise<MedicalHistoryEntry> => {
    if (!usesRealSession()) return mockPatientsService.uploadDocument(userId, payload);
    const response = await apiClient.post<ApiResponse<MedicalHistoryEntry>>(
      endpoints.patients.uploadDocument,
      payload,
      { timeout: 12000 },
    );
    return response.data.data;
  },
};
