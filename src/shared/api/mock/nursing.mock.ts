import AsyncStorage from '@react-native-async-storage/async-storage';

import { getNursingService, quoteNursingServices } from '@/shared/catalog/nursing-services';
import { pushMockNotification } from '@/shared/api/mock/notifications.mock';
import { queryClient } from '@/shared/lib/query-client';
import { sleep } from '@/shared/lib/utils';
import { HomeNursingStatus, NotificationType, NurseVerification } from '@/shared/types/enums';
import type {
  CreateHomeNursingRequestPayload,
  HomeNursingRequest,
  NurseProfile,
} from '@/shared/types/models/nursing';

const now = new Date().toISOString();

const nurseProfiles: NurseProfile[] = [
  {
    userId: 'user-nurse-001',
    email: 'nurse@clinsync.com',
    phone: '+201000000202',
    firstName: 'منى',
    lastName: 'حسن',
    proof: 'كارنيه نقابة التمريض 45821',
    verification: NurseVerification.APPROVED,
    createdAt: now,
  },
  {
    userId: 'user-nurse-002',
    email: 'nurse.pending@clinsync.com',
    phone: '+201000000203',
    firstName: 'أحمد',
    lastName: 'ناصر',
    proof: 'شهادة تخرج كلية تمريض',
    verification: NurseVerification.PENDING,
    createdAt: now,
  },
];

const REQUESTS_KEY = 'clinify-nursing-requests';
const requests: HomeNursingRequest[] = [];

function isNursingRequest(value: unknown): value is HomeNursingRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as HomeNursingRequest;
  return Boolean(request.id && request.patientUserId && request.serviceId && request.scheduledAt && request.status);
}

function persistRequests() {
  void AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

function mergeCachedRequests() {
  for (const query of queryClient.getQueryCache().getAll()) {
    const data = query.state.data;
    if (!Array.isArray(data)) continue;
    for (const item of data) {
      if (isNursingRequest(item) && !requests.some((request) => request.id === item.id)) {
        requests.push(item);
      }
    }
  }
}

let loaded: Promise<void> | null = null;

function ensureRequestsLoaded() {
  if (!loaded) {
    loaded = (async () => {
      try {
        const raw = await AsyncStorage.getItem(REQUESTS_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (isNursingRequest(item) && !requests.some((request) => request.id === item.id)) {
              requests.push(item);
            }
          }
        }
      } catch {
        // Keep the in-memory list if storage cannot be read.
      }
      mergeCachedRequests();
      persistRequests();
    })();
  }
  return loaded;
}

function touch(request: HomeNursingRequest): HomeNursingRequest {
  request.updatedAt = new Date().toISOString();
  persistRequests();
  return request;
}

export function insertNurseProfile(profile: NurseProfile) {
  if (!nurseProfiles.some((item) => item.userId === profile.userId)) {
    nurseProfiles.push(profile);
  }
}

export const mockNursingService = {
  async listRequests(): Promise<HomeNursingRequest[]> {
    await sleep(300);
    await ensureRequestsLoaded();
    mergeCachedRequests();
    return [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listForPatient(patientUserId: string): Promise<HomeNursingRequest[]> {
    const all = await this.listRequests();
    return all.filter((request) => request.patientUserId === patientUserId);
  },

  async listForNurse(nurseUserId: string): Promise<HomeNursingRequest[]> {
    const all = await this.listRequests();
    return all.filter((request) => request.nurseUserId === nurseUserId);
  },

  async getRequest(id: string): Promise<HomeNursingRequest> {
    await sleep(200);
    await ensureRequestsLoaded();
    const request = requests.find((item) => item.id === id);
    if (!request) throw { code: 'NOT_FOUND', message: 'Request was not found' };
    return request;
  },

  async createRequest(input: CreateHomeNursingRequestPayload): Promise<HomeNursingRequest> {
    await sleep(400);
    const ids = input.serviceIds?.length ? input.serviceIds : [input.serviceId];
    const services = ids.map((id) => getNursingService(id)).filter((service) => service !== undefined);
    const quote = quoteNursingServices(services.map((service) => service.id));
    if (!services.length || !quote) throw { code: 'INVALID_SERVICE', message: 'Choose a nursing service' };
    const timestamp = new Date().toISOString();
    const request: HomeNursingRequest = {
      id: `nursing-${Date.now()}`,
      patientUserId: input.patientUserId,
      patientName: input.patientName,
      patientPhone: input.patientPhone,
      serviceId: services[0].id,
      serviceIds: services.map((service) => service.id),
      address: input.address.trim(),
      scheduledAt: input.scheduledAt,
      status: HomeNursingStatus.REQUESTED,
      priceMin: quote.priceMin,
      priceMax: quote.priceMax,
      patientNotified: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    requests.unshift(request);
    persistRequests();
    return request;
  },

  async priceAndNotify(id: string, price: number): Promise<HomeNursingRequest> {
    await sleep(300);
    const request = requests.find((item) => item.id === id);
    if (!request) throw { code: 'NOT_FOUND', message: 'Request was not found' };
    if (request.status !== HomeNursingStatus.REQUESTED && request.status !== HomeNursingStatus.PRICED) {
      throw { code: 'INVALID_STATUS', message: 'This request can no longer be priced' };
    }
    if (!Number.isFinite(price) || price <= 0) {
      throw { code: 'INVALID_PRICE', message: 'Enter a valid price' };
    }
    request.price = price;
    request.patientNotified = true;
    request.status = HomeNursingStatus.PRICED;
    const saved = touch(request);
    void pushMockNotification({
      userId: saved.patientUserId,
      type: NotificationType.SYSTEM,
      messageKey: 'nursingPriced',
      title: 'Nursing request confirmed',
      body: `The visit was confirmed at ${saved.price} EGP.`,
      data: { nursingRequestId: saved.id, price: String(saved.price ?? '') },
    });
    return saved;
  },

  async assignNurse(id: string, nurseUserId: string): Promise<HomeNursingRequest> {
    await sleep(300);
    const request = requests.find((item) => item.id === id);
    if (!request) throw { code: 'NOT_FOUND', message: 'Request was not found' };
    if (request.status !== HomeNursingStatus.PRICED && request.status !== HomeNursingStatus.DECLINED) {
      throw { code: 'INVALID_STATUS', message: 'Tell the patient the price before sending a nurse' };
    }
    const nurse = nurseProfiles.find((item) => item.userId === nurseUserId);
    if (!nurse || nurse.verification !== NurseVerification.APPROVED) {
      throw { code: 'NURSE_NOT_VERIFIED', message: 'Choose a verified nurse' };
    }
    request.nurseUserId = nurse.userId;
    request.nurseName = `${nurse.firstName} ${nurse.lastName}`;
    request.status = HomeNursingStatus.ASSIGNED;
    return touch(request);
  },

  async accept(id: string, nurseUserId: string): Promise<HomeNursingRequest> {
    await sleep(300);
    const request = requests.find((item) => item.id === id);
    if (!request || request.nurseUserId !== nurseUserId) {
      throw { code: 'NOT_FOUND', message: 'Request was not found' };
    }
    if (request.status !== HomeNursingStatus.ASSIGNED) {
      throw { code: 'INVALID_STATUS', message: 'This request is not waiting for a response' };
    }
    request.status = HomeNursingStatus.ACCEPTED;
    const saved = touch(request);
    void pushMockNotification({
      userId: saved.patientUserId,
      type: NotificationType.SYSTEM,
      messageKey: 'nursingAccepted',
      title: 'The nurse accepted the request',
      body: saved.nurseName
        ? `${saved.nurseName} accepted the home visit.`
        : 'A nurse accepted your home visit.',
      data: { nursingRequestId: saved.id, nurseName: saved.nurseName ?? '' },
    });
    return saved;
  },

  async decline(id: string, nurseUserId: string): Promise<HomeNursingRequest> {
    await sleep(300);
    const request = requests.find((item) => item.id === id);
    if (!request || request.nurseUserId !== nurseUserId) {
      throw { code: 'NOT_FOUND', message: 'Request was not found' };
    }
    if (request.status !== HomeNursingStatus.ASSIGNED) {
      throw { code: 'INVALID_STATUS', message: 'This request is not waiting for a response' };
    }
    request.status = HomeNursingStatus.DECLINED;
    return touch(request);
  },

  async complete(id: string, nurseUserId: string): Promise<HomeNursingRequest> {
    await sleep(300);
    const request = requests.find((item) => item.id === id);
    if (!request || request.nurseUserId !== nurseUserId) {
      throw { code: 'NOT_FOUND', message: 'Request was not found' };
    }
    if (request.status !== HomeNursingStatus.ACCEPTED) {
      throw { code: 'INVALID_STATUS', message: 'Accept the request before completing it' };
    }
    request.status = HomeNursingStatus.COMPLETED;
    return touch(request);
  },

  async listNurses(): Promise<NurseProfile[]> {
    await sleep(250);
    return [...nurseProfiles];
  },

  async getNurse(userId: string): Promise<NurseProfile | null> {
    await sleep(200);
    return nurseProfiles.find((item) => item.userId === userId) ?? null;
  },

  async setNurseVerification(userId: string, verification: NurseVerification): Promise<NurseProfile> {
    await sleep(300);
    const nurse = nurseProfiles.find((item) => item.userId === userId);
    if (!nurse) throw { code: 'NOT_FOUND', message: 'Nurse was not found' };
    nurse.verification = verification;
    return nurse;
  },
};
