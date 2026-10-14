export {
  usePatientsQuery,
  usePatientDetailQuery,
  usePatientHistoryQuery,
} from '@/features/patients/hooks/usePatientQueries';
export {
  useVisitQuery,
  useUpdateVisitMutation,
  useCompleteVisitMutation,
} from '@/features/clinical/visits/hooks/useVisitQueries';
export {
  usePrescriptionsQuery,
  useCreatePrescriptionMutation,
  useUpdatePrescriptionMutation,
  useIssuePrescriptionMutation,
  useDeletePrescriptionMutation,
} from '@/features/clinical/prescriptions/hooks/usePrescriptionsQueries';
export { useLabRequestsQuery } from '@/features/clinical/lab-orders/hooks/useLabRequestsQueries';
export {
  useAvailabilityQuery,
  useStartVisitMutation,
  useCreateLabRequestMutation,
  useUpdateAvailabilityMutation,
  mapVisitFormToPayload,
} from './useDoctorQueries';
