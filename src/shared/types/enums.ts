export enum UserRole {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  ADMIN = 'admin',
  SECRETARY = 'secretary',
  NURSE = 'nurse',
  NURSING_ADMIN = 'nursing_admin',
}

export enum HomeNursingStatus {
  REQUESTED = 'requested',
  PRICED = 'priced',
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COMPLETED = 'completed',
}

export enum HomeVisitStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
}

export enum NurseVerification {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum Locale {
  EN = 'en',
  AR = 'ar',
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum NotificationType {
  APPOINTMENT = 'appointment',
  PRESCRIPTION = 'prescription',
  LAB_RESULT = 'lab_result',
  SYSTEM = 'system',
}

export enum VisitStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum LabRequestType {
  LAB = 'lab',
  IMAGING = 'imaging',
}

export enum LabRequestStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PrescriptionStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  ISSUED = 'issued',
}
