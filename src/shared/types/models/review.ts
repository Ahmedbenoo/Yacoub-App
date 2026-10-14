export interface DoctorReview {
  id: string;
  doctorId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateDoctorReviewPayload {
  doctorId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment?: string;
}
