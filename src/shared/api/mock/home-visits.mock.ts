import { sleep } from '@/shared/lib/utils';
import { HomeVisitStatus } from '@/shared/types/enums';
import type { AcceptHomeVisitPayload, CreateHomeVisitPayload, HomeVisitRequest } from '@/shared/types/models/home-visit';

import { getMockDoctorById } from './doctors.mock';

const seedTime = '2026-10-01T10:00:00.000Z';

const requests: HomeVisitRequest[] = [
  {
    id: 'hv-001',
    patientUserId: 'user-patient-001',
    patientName: 'Ahmed Fathy',
    patientPhone: '+201092313486',
    specialty: 'General Medicine',
    address: 'مدينة نصر، القاهرة',
    scheduledAt: '2026-10-06 18:00',
    notes: 'سخونة من يومين',
    status: HomeVisitStatus.REQUESTED,
    createdAt: seedTime,
    updatedAt: seedTime,
  },
];

function touch(request: HomeVisitRequest) {
  request.updatedAt = new Date().toISOString();
  return request;
}

export const mockHomeVisitService = {
  async listForPatient(patientUserId: string): Promise<HomeVisitRequest[]> {
    await sleep(300);
    return requests
      .filter((request) => request.patientUserId === patientUserId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listForDoctor(doctorId: string): Promise<HomeVisitRequest[]> {
    await sleep(300);
    const doctor = getMockDoctorById(doctorId);
    if (!doctor) return [];
    return requests
      .filter(
        (request) =>
          request.specialty === doctor.specialty &&
          (request.status === HomeVisitStatus.REQUESTED || request.doctorId === doctorId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getRequest(id: string): Promise<HomeVisitRequest> {
    await sleep(200);
    const request = requests.find((item) => item.id === id);
    if (!request) throw { code: 'NOT_FOUND', message: 'Request was not found' };
    return request;
  },

  async createRequest(input: CreateHomeVisitPayload): Promise<HomeVisitRequest> {
    await sleep(400);
    const timestamp = new Date().toISOString();
    const request: HomeVisitRequest = {
      id: `hv-${Date.now()}`,
      patientUserId: input.patientUserId,
      patientName: input.patientName,
      patientPhone: input.patientPhone,
      specialty: input.specialty,
      address: input.address.trim(),
      scheduledAt: input.scheduledAt,
      notes: input.notes?.trim() || undefined,
      status: HomeVisitStatus.REQUESTED,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    requests.unshift(request);
    return request;
  },

  async accept(id: string, input: AcceptHomeVisitPayload): Promise<HomeVisitRequest> {
    await sleep(400);
    const request = requests.find((item) => item.id === id);
    if (!request) throw { code: 'NOT_FOUND', message: 'Request was not found' };
    if (request.status !== HomeVisitStatus.REQUESTED) {
      throw { code: 'INVALID_STATE', message: 'Request is no longer open' };
    }
    const doctor = getMockDoctorById(input.doctorId);
    if (!doctor || doctor.specialty !== request.specialty) {
      throw { code: 'FORBIDDEN', message: 'This visit is outside your specialty' };
    }
    if (!Number.isFinite(input.price) || input.price <= 0) {
      throw { code: 'INVALID_PRICE', message: 'Enter a price' };
    }
    request.status = HomeVisitStatus.ACCEPTED;
    request.price = input.price;
    request.doctorId = input.doctorId;
    request.doctorName = input.doctorName;
    return touch(request);
  },

  async complete(id: string, doctorId: string): Promise<HomeVisitRequest> {
    await sleep(300);
    const request = requests.find((item) => item.id === id);
    if (!request) throw { code: 'NOT_FOUND', message: 'Request was not found' };
    if (request.status !== HomeVisitStatus.ACCEPTED || request.doctorId !== doctorId) {
      throw { code: 'INVALID_STATE', message: 'Visit cannot be completed' };
    }
    request.status = HomeVisitStatus.COMPLETED;
    return touch(request);
  },
};
