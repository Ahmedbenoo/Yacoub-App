export { useClinicStatsQuery, useClinicReportsQuery, useClinicReportDetailQuery } from './useAdminQueries';
export {
  useAdminDoctorsQuery,
  useAdminPatientsQuery,
  useAdminSecretariesQuery,
  useAdminSecretaryQuery,
} from './useAdminStaffQueries';
export { useBranchOptions } from './useBranchOptions';
export { useHomeVisitSpecialtyOptions, useSpecialtyOptions } from './useSpecialtyOptions';
export {
  useUpdateDoctorMutation,
  useUpdatePatientMutation,
  useCreateDoctorMutation,
  useCreateSecretaryMutation,
  useUpdateSecretaryMutation,
  useDeleteSecretaryMutation,
  useCreatePatientMutation,
  useDeactivateDoctorMutation,
  useDeactivatePatientMutation,
  useReactivateDoctorMutation,
  useReactivatePatientMutation,
} from './useAdminMutations';
