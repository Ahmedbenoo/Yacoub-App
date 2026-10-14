import { useQuery } from '@tanstack/react-query';

import { patientRecordsService } from '@/features/patients/services/patient-records.service';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

function usePatientUserId() {
  const userId = useAuthStore((s) => s.user?.id);
  const activeRole = useAuthStore((s) => s.activeRole);
  return activeRole === UserRole.PATIENT ? userId : undefined;
}

export function useMyPatientProfileQuery() {
  const userId = usePatientUserId();

  return useQuery({
    queryKey: queryKeys.patients.me(),
    queryFn: () => patientRecordsService.getMyProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyMedicalHistoryQuery() {
  const userId = usePatientUserId();

  return useQuery({
    queryKey: queryKeys.patients.history('me'),
    queryFn: () => patientRecordsService.getMyHistory(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
