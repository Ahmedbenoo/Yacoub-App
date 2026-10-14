import { LabRequestStatus, LabRequestType } from '../enums';

export interface LabRequest {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  type: LabRequestType;
  testName: string;
  priority: 'routine' | 'urgent';
  notes?: string;
  status: LabRequestStatus;
  requestedAt: string;
  completedAt?: string;
  resultSummary?: string;
}

export interface CreateLabRequestPayload {
  visitId: string;
  type: LabRequestType;
  testName: string;
  priority: 'routine' | 'urgent';
  notes?: string;
}
