import type { HomeVisitStatus } from '@/shared/types/enums';

export interface HomeVisitRequest {
  id: string;
  patientUserId: string;
  patientName: string;
  patientPhone?: string;
  specialty: string;
  address: string;
  scheduledAt: string;
  notes?: string;
  status: HomeVisitStatus;
  price?: number;
  doctorId?: string;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeVisitPayload {
  patientUserId: string;
  patientName: string;
  patientPhone?: string;
  specialty: string;
  address: string;
  scheduledAt: string;
  notes?: string;
}

export interface AcceptHomeVisitPayload {
  doctorId: string;
  doctorName: string;
  price: number;
}
