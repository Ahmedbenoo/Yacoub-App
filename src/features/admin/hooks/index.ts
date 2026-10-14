export { useClinicStatsQuery, useClinicReportsQuery, useClinicReportDetailQuery } from './useAdminQueries';
export { useAdminDoctorsQuery, useAdminPatientsQuery } from './useAdminStaffQueries';
export { useBranchOptions } from './useBranchOptions';
export { useSpecialtyOptions } from './useSpecialtyOptions';
export {
  useUpdateDoctorMutation,
  useUpdatePatientMutation,
  useCreateDoctorMutation,
  useCreateSecretaryMutation,
  useCreatePatientMutation,
  useDeactivateDoctorMutation,
  useDeactivatePatientMutation,
  useReactivateDoctorMutation,
  useReactivatePatientMutation,
} from './useAdminMutations';
