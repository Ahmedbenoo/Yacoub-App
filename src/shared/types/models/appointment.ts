import { AppointmentStatus } from '../enums';

export interface AppointmentParticipant {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  branchId: string;
  branchName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  source?: 'online' | 'desk';
  awaiting?: 'secretary' | 'patient';
  queue?: 'waiting' | 'serving' | 'done';
  queueNumber?: number;
  arrivedAt?: string;
  doctor: AppointmentParticipant;
  patient: AppointmentParticipant;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: AppointmentStatus | AppointmentStatus[];
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  clinicId?: string;
  scope?: 'today' | 'upcoming' | 'past' | 'all';
}

export interface RescheduleAppointmentPayload {
  scheduledAt: string;
  by?: 'secretary' | 'patient';
}

export interface CreateAppointmentPayload {
  doctorId: string;
  branchId: string;
  scheduledAt: string;
  durationMinutes?: number;
  reason: string;
  notes?: string;
  patientId?: string;
  desk?: boolean;
}
