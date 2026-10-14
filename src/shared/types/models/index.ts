import { Locale, ThemeMode, UserRole } from '../enums';

export interface TenantEntity {
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  streetAr?: string;
  city: string;
  cityAr?: string;
  state?: string;
  country: string;
  countryAr?: string;
  postalCode?: string;
}

export interface User extends TenantEntity {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  roles: UserRole[];
  locale: Locale;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Clinic extends TenantEntity {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  descriptionAr?: string;
  phone: string;
  email: string;
  address: Address;
  isActive: boolean;
  approvalStatus?: 'pending' | 'approved';
  specialty?: string;
  locationUrl?: string;
  consultationFee?: number;
  openingHours?: string;
  photoUrls?: string[];
  organizationId?: string;
  ownerUserId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  locale: Locale;
  onboardingCompleted: boolean;
}

export type {
  LoginPayload,
  RegisterPayload,
  BookingAuthPayload,
  ForgotPasswordPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from './auth-payloads';
export type { ClinicStats, ClinicReport, UpdateDoctorPayload, UpdatePatientPayload, CreateDoctorPayload, CreatePatientPayload } from './admin';
export type { ClinicFilters } from './clinic';
export type { DoctorProfile, DoctorFilters, BookingSlot } from './doctor';
export type { Appointment, AppointmentFilters, AppointmentParticipant, RescheduleAppointmentPayload, CreateAppointmentPayload } from './appointment';
export type { Notification } from './notification';
export type { PatientProfile, PatientFilters, MedicalHistoryEntry } from './patient';
export type { Visit, Vitals, UpdateVisitPayload, StartVisitPayload, PatientVisitDetail } from './visit';
export type { PregnancyRecord, ObgynEncounter, ObgynVisitSummary, PriorObgynMeasurement } from './obgyn';
export type { UltrasoundReport } from './ultrasound-report';
export type { ClinicalAttachment } from './clinical-attachment';
export type { NewbornLink, ChildChart, VaccinationDose } from './newborn';
export type { Prescription, Medication, CreatePrescriptionPayload, UpdatePrescriptionPayload } from './prescription';
export { isIssuedVisiblePrescription, isPrescriptionDeleted, getPrescriptionDisplayDate } from './prescription';
export type { LabRequest, CreateLabRequestPayload } from './lab-request';
export type { DoctorAvailability, AvailabilitySlot, UpdateAvailabilityPayload } from './availability';
export type { HomeVisitRequest, CreateHomeVisitPayload, AcceptHomeVisitPayload } from './home-visit';
export type { DoctorReview, CreateDoctorReviewPayload } from './review';
export type { Invoice, InvoicePaymentMethod, InvoiceStatus, DayCloseSummary } from './invoice';
export type { WhatsAppMessage, WhatsAppMessageKind } from './whatsapp';
