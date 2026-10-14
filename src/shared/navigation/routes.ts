import { useLocalSearchParams, type Href } from 'expo-router';

import { UserRole } from '@/shared/types/enums';
import type { MedicalHistoryEntry } from '@/shared/types/models/patient';

function idHref(pathname: string, id: string): Href {
  return { pathname, params: { id } } as Href;
}

export function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function useRouteIdParam(): string {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return getRouteParam(id);
}

export function getHomeRouteForRole(role: UserRole | null): string {
  switch (role) {
    case UserRole.DOCTOR:
      return '/(doctor)/(tabs)/dashboard';
    case UserRole.PATIENT:
      return '/(patient)/(tabs)/home';
    case UserRole.ADMIN:
      return '/(admin)/(tabs)/dashboard';
    case UserRole.SECRETARY:
      return '/(secretary)/(tabs)/appointments';
    case UserRole.NURSE:
      return '/(nurse)/(tabs)/orders';
    case UserRole.NURSING_ADMIN:
      return '/(nursing-admin)/(tabs)/orders';
    default:
      return '/(auth)/login';
  }
}

export function getRoleSelectionRoute(): string {
  return '/(auth)/role-selection';
}

export function getEditProfileRoute(role: UserRole | null): string {
  switch (role) {
    case UserRole.DOCTOR:
      return '/(doctor)/edit-profile';
    case UserRole.PATIENT:
      return '/(patient)/edit-profile';
    case UserRole.ADMIN:
      return '/(admin)/edit-profile';
    case UserRole.SECRETARY:
      return '/(secretary)/edit-profile';
    case UserRole.NURSE:
      return '/(nurse)/edit-profile';
    case UserRole.NURSING_ADMIN:
      return '/(nursing-admin)/edit-profile';
    default:
      return '/(auth)/login';
  }
}

export function getChangePasswordRoute(role: UserRole | null): string {
  switch (role) {
    case UserRole.DOCTOR:
      return '/(doctor)/change-password';
    case UserRole.PATIENT:
      return '/(patient)/change-password';
    case UserRole.ADMIN:
      return '/(admin)/change-password';
    case UserRole.SECRETARY:
      return '/(secretary)/change-password';
    case UserRole.NURSE:
      return '/(nurse)/change-password';
    case UserRole.NURSING_ADMIN:
      return '/(nursing-admin)/change-password';
    default:
      return '/(auth)/login';
  }
}

export function getAdminDoctorScheduleHref(doctorId: string): Href {
  return idHref('/(admin)/doctor/[id]/schedule', doctorId);
}

export function getNotificationsHref(role: UserRole): Href {
  switch (role) {
    case UserRole.DOCTOR:
      return '/(doctor)/notifications' as Href;
    case UserRole.ADMIN:
      return '/(admin)/notifications' as Href;
    case UserRole.PATIENT:
      return '/(patient)/notifications' as Href;
    case UserRole.SECRETARY:
      return '/(secretary)/notifications' as Href;
    default:
      return '/(auth)/login' as Href;
  }
}

export function getAppointmentHref(role: UserRole, appointmentId: string): Href {
  const id = String(appointmentId);

  switch (role) {
    case UserRole.DOCTOR:
      return { pathname: '/(doctor)/appointment/[id]', params: { id } } as Href;
    case UserRole.ADMIN:
      return { pathname: '/(admin)/appointment/[id]', params: { id } } as Href;
    case UserRole.PATIENT:
      return { pathname: '/(patient)/appointment/[id]', params: { id } } as Href;
    case UserRole.SECRETARY:
      return { pathname: '/(secretary)/appointment/[id]', params: { id } } as Href;
    default:
      return '/(auth)/login' as Href;
  }
}

export function getDoctorPatientHref(patientId: string): Href {
  return idHref('/(doctor)/patient/[id]', patientId);
}

export function getAdminPatientHref(patientId: string): Href {
  return idHref('/(admin)/patient/[id]', patientId);
}

export function getAdminPatientEditHref(patientId: string): Href {
  return `/(admin)/patient/${patientId}/edit` as Href;
}

export function getAdminPatientCreateHref(): Href {
  return '/(admin)/patient/create' as Href;
}

export function getSecretaryPatientCreateHref(): Href {
  return '/(secretary)/patient/create' as Href;
}

export function getSecretaryBookHref(patientId: string): Href {
  return idHref('/(secretary)/book/[id]', patientId);
}

export function getSecretaryPatientHref(patientId: string): Href {
  return idHref('/(secretary)/patient/[id]', patientId);
}

export function getSecretaryPrescriptionHref(prescriptionId: string): Href {
  return idHref('/(secretary)/prescriptions/[id]', prescriptionId);
}

export function getAdminDoctorHref(doctorId: string): Href {
  return idHref('/(admin)/doctor/[id]', doctorId);
}

export function getAdminDoctorEditHref(doctorId: string): Href {
  return `/(admin)/doctor/${doctorId}/edit` as Href;
}

export function getAdminDoctorCreateHref(): Href {
  return '/(admin)/doctor/create' as Href;
}

export function getAdminReportHref(reportId: string): Href {
  return idHref('/(admin)/reports/[id]', reportId);
}

export function getAdminReportsListHref(): Href {
  return '/(admin)/reports' as Href;
}

export function getVisitHref(role: UserRole.DOCTOR | UserRole.ADMIN, visitId: string): Href {
  return role === UserRole.DOCTOR
    ? idHref('/(doctor)/visits/[id]', visitId)
    : idHref('/(admin)/visits/[id]', visitId);
}

export function getPrescriptionHref(
  role: UserRole.DOCTOR | UserRole.ADMIN | UserRole.SECRETARY,
  prescriptionId: string,
): Href {
  if (role === UserRole.DOCTOR) return idHref('/(doctor)/prescriptions/[id]', prescriptionId);
  if (role === UserRole.SECRETARY) return getSecretaryPrescriptionHref(prescriptionId);
  return idHref('/(admin)/prescriptions/[id]', prescriptionId);
}

export function getLabResultHref(role: UserRole.DOCTOR | UserRole.ADMIN, labResultId: string): Href {
  return role === UserRole.DOCTOR
    ? idHref('/(doctor)/lab-results/[id]', labResultId)
    : idHref('/(admin)/lab-results/[id]', labResultId);
}

export function getClinicalRecordHref(
  role: UserRole.DOCTOR | UserRole.ADMIN | UserRole.SECRETARY,
  entry: MedicalHistoryEntry,
): Href | null {
  if (!entry.resourceId) return null;

  if (role === UserRole.SECRETARY) {
    return entry.type === 'prescription' ? getSecretaryPrescriptionHref(entry.resourceId) : null;
  }

  switch (entry.type) {
    case 'visit':
      return getVisitHref(role, entry.resourceId);
    case 'prescription':
      return getPrescriptionHref(role, entry.resourceId);
    case 'lab':
      return getLabResultHref(role, entry.resourceId);
    default:
      return null;
  }
}

export function getPatientSearchHref(options?: {
  specialty?: string;
  tab?: 'clinics' | 'doctors';
}): Href {
  const params: Record<string, string> = {};
  if (options?.specialty) params.specialty = options.specialty;
  if (options?.tab) params.tab = options.tab;

  return {
    pathname: '/(patient)/(tabs)/search',
    params,
  } as Href;
}

export function getPatientDoctorHref(doctorId: string): Href {
  return idHref('/(patient)/doctors/[id]', doctorId);
}

export function getPatientDoctorBookHref(doctorId: string): Href {
  return `/(patient)/doctors/${doctorId}/book` as Href;
}

export function getPatientClinicHref(clinicId: string): Href {
  return idHref('/(patient)/clinics/[id]', clinicId);
}

export function getPatientVisitHref(visitId: string): Href {
  return idHref('/(patient)/visit/[id]', visitId);
}

export function getDoctorChildHref(childPatientId: string): Href {
  return idHref('/(doctor)/child/[id]', childPatientId);
}

export function getPatientChildHref(childPatientId: string): Href {
  return idHref('/(patient)/child/[id]', childPatientId);
}

export function getPatientHealthProfileHref(): Href {
  return { pathname: '/(patient)/health-profile' } as Href;
}

export function getPatientPrescriptionsHref(visitId: string): Href {
  return { pathname: '/(patient)/prescriptions', params: { visitId } } as Href;
}

export function getPatientLabResultsHref(visitId: string): Href {
  return { pathname: '/(patient)/lab-results', params: { visitId } } as Href;
}

export function getPatientPrescriptionHref(prescriptionId: string): Href {
  return idHref('/(patient)/prescription/[id]', prescriptionId);
}

export function getPatientLabResultHref(labResultId: string): Href {
  return idHref('/(patient)/lab-result/[id]', labResultId);
}

export function getPatientRecordHref(entry: MedicalHistoryEntry): Href | null {
  if (!entry.resourceId) return null;

  switch (entry.type) {
    case 'visit':
      return getPatientVisitHref(entry.resourceId);
    case 'prescription':
      return getPatientPrescriptionHref(entry.resourceId);
    case 'lab':
      return getPatientLabResultHref(entry.resourceId);
    default:
      return null;
  }
}
