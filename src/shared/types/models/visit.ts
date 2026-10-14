import { VisitStatus } from '../enums';

export interface Vitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
}

export interface Visit {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  status: VisitStatus;
  chiefComplaint?: string;
  diagnosis?: string;
  symptoms?: string;
  notes?: string;
  vitals?: Vitals;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVisitPayload {
  chiefComplaint?: string;
  diagnosis?: string;
  symptoms?: string;
  notes?: string;
  vitals?: Vitals;
}

export interface StartVisitPayload {
  appointmentId?: string;
  patientId: string;
  chiefComplaint?: string;
}

export interface PatientVisitDetail extends Visit {
  doctorName: string;
  linkedPrescriptionIds: string[];
  linkedLabResultIds: string[];
}
