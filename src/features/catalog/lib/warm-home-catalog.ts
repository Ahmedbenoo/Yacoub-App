import { clinicsService } from '@/features/clinic/services/clinics.service';
import { doctorsService } from '@/features/catalog/doctors/services/doctors.service';
import { queryClient } from '@/shared/lib/query-client';
import { queryKeys } from '@/shared/api/query-keys';

const CLINICS_KEY = queryKeys.clinics.search({});
const DOCTORS_KEY = queryKeys.doctors.list({ allClinics: true });

export async function warmHomeCatalog(): Promise<void> {
  const hasClinics = Boolean(queryClient.getQueryData(CLINICS_KEY));
  const hasDoctors = Boolean(queryClient.getQueryData(DOCTORS_KEY));

  const clinics = queryClient.prefetchQuery({
    queryKey: CLINICS_KEY,
    queryFn: () => clinicsService.search({}),
    staleTime: 1000 * 60 * 5,
  });
  const doctors = queryClient.prefetchQuery({
    queryKey: DOCTORS_KEY,
    queryFn: () => doctorsService.list({ allClinics: true }),
    staleTime: 1000 * 60 * 5,
  });

  if (hasClinics && hasDoctors) {
    void Promise.all([clinics, doctors]);
    return;
  }

  await Promise.race([
    Promise.all([clinics, doctors]),
    new Promise<void>((resolve) => setTimeout(resolve, 4000)),
  ]);
}
