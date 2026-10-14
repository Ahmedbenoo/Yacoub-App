import type { Gender } from '../enums';
import type { DoctorProfile } from './doctor';

export interface ClinicStats {
  doctorsCount: number;
  patientsCount: number;
  appointmentsToday: number;
  appointmentsPending: number;
  completedThisMonth: number;
}

export interface ReportMetric {
  label: string;
  labelAr?: string;
  value: string;
  valueAr?: string;
  tone?: 'primary' | 'success' | 'warning' | 'default';
}

export interface ClinicReport {
  id: string;
  clinicId: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  period: string;
  periodAr?: string;
  generatedAt: string;
  summary?: string;
  summaryAr?: string;
  metrics?: ReportMetric[];
  highlights?: string[];
  highlightsAr?: string[];
}

export interface UpdateDoctorPayload {
  specialty: string;
  phone?: string;
  bio?: string;
  branchName: string;
  languages: string[];
  sharePercent?: number;
}

export interface UpdatePatientPayload {
  phone?: string;
  email?: string;
  allergies: string[];
  chronicConditions: string[];
}

export interface CreateDoctorPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  specialty: string;
  branchName: string;
  languages: string[];
  bio?: string;
}

export interface CreateDoctorResult extends DoctorProfile {
  linkedExisting: boolean;
  credentialsWhatsApp?: string;
}

export interface CreateSecretaryPayload {
  firstName: string;
  lastName: string;
  phone: string;
  password?: string;
}

export interface CreateSecretaryResult {
  userId: string;
  email: string;
  phone: string;
  linkedExisting: boolean;
  credentialsWhatsApp?: string;
}

export interface RegisterDoctorPayload {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  specialty: string;
}

export interface RegisterOwnerPayload {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  placeKind: 'clinic' | 'center';
  placeName: string;
  clinicName?: string;
  clinicPhone: string;
  street: string;
  city: string;
  locationUrl?: string;
  specialty: string;
  openingHours: string;
  consultationFee: number;
  practices: boolean;
}

export interface AddOwnerClinicPayload {
  name: string;
  phone: string;
  street: string;
  city: string;
  locationUrl?: string;
  specialty: string;
}

export interface CreatePatientPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: Gender;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
}
