export {
  useDoctorAvailabilityQuery,
  useDoctorDetailQuery,
  useDoctorSpecialties,
  useDoctorsQuery,
} from '@/features/catalog/doctors/hooks/useDoctorsQueries';
export {
  useClinicCities,
  useClinicDetailQuery,
  useClinicsSearchQuery,
} from '@/features/catalog/clinics/hooks/useClinicsQueries';
export {
  useMyPrescriptionsQuery,
  usePrescriptionDetailQuery,
} from '@/features/clinical/prescriptions/hooks/usePatientPrescriptionQueries';
export {
  useLabResultDetailQuery,
  useMyLabResultsQuery,
} from '@/features/clinical/lab-orders/hooks/usePatientLabResultQueries';
export { useVisitDetailQuery } from '@/features/clinical/visits/hooks/usePatientVisitQueries';
export {
  useMyMedicalHistoryQuery,
  useMyPatientProfileQuery,
} from '@/features/patients/hooks/usePatientRecordsQueries';
