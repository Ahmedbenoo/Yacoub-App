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

export interface MedicalHistoryEntry {
  id: string;
  patientId: string;
  type: 'visit' | 'prescription' | 'lab';
  title: string;
  description: string;
  date: string;
  resourceId?: string;
  doctorId?: string;
}

export type MedicalRecordFilter = 'all' | 'prescription' | 'lab' | 'visit';
