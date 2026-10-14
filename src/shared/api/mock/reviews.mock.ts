import { applyDoctorRating } from '@/shared/api/mock/doctors.mock';
import type { CreateDoctorReviewPayload, DoctorReview } from '@/shared/types/models/review';
import { sleep } from '@/shared/lib/utils';

const mockReviews: DoctorReview[] = [
  {
    id: 'review-001',
    doctorId: 'user-doctor-001',
    appointmentId: 'seed-review-001',
    patientId: 'user-patient-002',
    patientName: 'يوسف كمال',
    rating: 5,
    comment: 'الكشف كان واضح والانتظار قليل.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'review-002',
    doctorId: 'user-doctor-001',
    appointmentId: 'seed-review-002',
    patientId: 'user-patient-004',
    patientName: 'فاطمة علي',
    rating: 4,
    comment: 'الدكتور شرح الحالة بهدوء.',
    createdAt: new Date().toISOString(),
  },
];

export const mockReviewsService = {
  async listForDoctor(doctorId: string): Promise<DoctorReview[]> {
    await sleep(200);
    return mockReviews.filter((review) => review.doctorId === doctorId);
  },

  async getForAppointment(appointmentId: string): Promise<DoctorReview | null> {
    await sleep(150);
    return mockReviews.find((review) => review.appointmentId === appointmentId) ?? null;
  },

  async create(payload: CreateDoctorReviewPayload): Promise<DoctorReview> {
    await sleep(300);
    const existing = mockReviews.find((review) => review.appointmentId === payload.appointmentId);
    if (existing) return existing;

    const review: DoctorReview = {
      id: `review-${Date.now()}`,
      doctorId: payload.doctorId,
      appointmentId: payload.appointmentId,
      patientId: payload.patientId,
      patientName: payload.patientName,
      rating: payload.rating,
      comment: payload.comment?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    mockReviews.unshift(review);
    applyDoctorRating(payload.doctorId, payload.rating);
    return review;
  },
};
