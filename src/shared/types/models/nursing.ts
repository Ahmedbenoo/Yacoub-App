import type { HomeNursingStatus, NurseVerification } from '@/shared/types/enums';

export interface HomeNursingRequest {
  id: string;
  patientUserId: string;
  patientName: string;
  patientPhone?: string;
  serviceId: string;
  serviceIds?: string[];
  address: string;
  scheduledAt: string;
  status: HomeNursingStatus;
  priceMin?: number;
  priceMax?: number;
  price?: number;
  patientNotified: boolean;
  nurseUserId?: string;
  nurseName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NurseProfile {
  userId: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  proof: string;
  verification: NurseVerification;
  createdAt: string;
}

export interface CreateHomeNursingRequestPayload {
  patientUserId: string;
  patientName: string;
  patientPhone?: string;
  serviceId: string;
  serviceIds: string[];
  address: string;
  scheduledAt: string;
}

export interface RegisterNursePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  proof: string;
}
