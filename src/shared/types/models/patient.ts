import { Gender } from '../enums';

export interface PatientProfile {
  id: string;
  userId: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth: string;
  gender: Gender;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  lastVisitAt?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

export interface PatientFilters {
  search?: string;
  page?: number;
  limit?: number;
  doctorId?: string;
  clinicId?: string;
  includeInactive?: boolean;
}

export interface UpdateHealthProfilePayload {
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
}

export type MedicalRecordType = 'visit' | 'prescription' | 'lab' | 'radiology';
export type MedicalRecordSource = 'clinic' | 'patient';
export type MedicalDocumentKind = 'prescription' | 'lab' | 'radiology';

export interface MedicalHistoryEntry {
  id: string;
  patientId: string;
  type: MedicalRecordType;
  title: string;
  description: string;
  date: string;
  resourceId?: string;
  doctorId?: string;
  visitId?: string;
  source?: MedicalRecordSource;
  imageUrl?: string;
  doctorReply?: string;
}

export type MedicalRecordFilter = 'all' | MedicalRecordType;

export interface PatientVisitLink {
  id: string;
  kind: 'visit' | 'appointment' | 'lab';
  visitId?: string;
  appointmentId?: string;
  labRequestId?: string;
  doctorId: string;
  doctorName: string;
  date: string;
  testName?: string;
}

export interface LinkedPatientDocument {
  id: string;
  kind: MedicalDocumentKind;
  imageUrl: string;
  note?: string;
  date: string;
}

export interface UploadMedicalDocumentPayload {
  kind: MedicalDocumentKind;
  image: string;
  note?: string;
  visitId?: string;
  appointmentId?: string;
  labRequestId?: string;
  doctorId?: string;
}
