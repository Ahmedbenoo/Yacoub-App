import AsyncStorage from '@react-native-async-storage/async-storage';

import { sleep } from '@/shared/lib/utils';
import { HomeNursingStatus, NotificationType } from '@/shared/types/enums';
import type { PaginatedResponse } from '@/shared/types/models';
import type { Notification } from '@/shared/types/models/notification';

import { cloneSeed, resetArray } from './clone';

const NOTIFICATIONS_KEY = 'clinify-notifications';

function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    userId: 'user-doctor-001',
    type: NotificationType.APPOINTMENT,
    messageKey: 'newAppointment',
    title: 'New appointment booked',
    body: 'Sara Mohamed booked an appointment for today at 9:00 AM',
    data: { appointmentId: 'appt-001', patientName: 'Sara Mohamed', time: '9:00 AM' },
    createdAt: hoursAgo(2),
  },
  {
    id: 'notif-002',
    userId: 'user-doctor-001',
    type: NotificationType.APPOINTMENT,
    messageKey: 'reminder',
    title: 'Appointment reminder',
    body: 'You have a follow-up with Youssef Kamal at 11:30 AM',
    data: { appointmentId: 'appt-002', patientName: 'Youssef Kamal', time: '11:30 AM' },
    createdAt: hoursAgo(5),
  },
  {
    id: 'notif-003',
    userId: 'user-patient-001',
    type: NotificationType.APPOINTMENT,
    messageKey: 'appointmentConfirmed',
    title: 'Appointment confirmed',
    body: 'Your appointment with Dr. Ahmed Fathy is confirmed for tomorrow',
    data: { appointmentId: 'appt-003', doctorName: 'Ahmed Fathy' },
    createdAt: hoursAgo(8),
  },
  {
    id: 'notif-004',
    userId: 'user-patient-001',
    type: NotificationType.SYSTEM,
    messageKey: 'welcome',
    title: 'Welcome to Yacoub',
    body: 'Manage your appointments and medical records in one place',
    createdAt: hoursAgo(24),
    readAt: hoursAgo(20),
  },
  {
    id: 'notif-005',
    userId: 'user-admin-001',
    type: NotificationType.SYSTEM,
    messageKey: 'weeklyReport',
    title: 'Weekly clinic report ready',
    body: 'Your weekly operations summary is available in reports',
    createdAt: hoursAgo(12),
  },
];

const mockNotifications: Notification[] = cloneSeed(SEED_NOTIFICATIONS);
let loaded: Promise<void> | null = null;
let sequence = 0;

function isStoredNotification(value: unknown): value is Notification {
  if (!value || typeof value !== 'object') return false;
  const item = value as Notification;
  return Boolean(item.id && item.userId && item.type && item.title && item.createdAt);
}

function persistNotifications() {
  const extras = mockNotifications.filter(
    (item) => !SEED_NOTIFICATIONS.some((seed) => seed.id === item.id),
  );
  void AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(extras));
}

function ensureNotificationsLoaded() {
  if (!loaded) {
    loaded = (async () => {
      try {
        const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (isStoredNotification(item) && !mockNotifications.some((current) => current.id === item.id)) {
              mockNotifications.push(item);
            }
          }
        }
      } catch {
        // Keep the in-memory list if storage cannot be read.
      }
    })();
  }
  return loaded;
}

export async function pushMockNotification(input: {
  userId: string;
  type: Notification['type'];
  messageKey: string;
  title: string;
  body: string;
  data?: Notification['data'];
}): Promise<Notification | null> {
  await ensureNotificationsLoaded();
  const nursingRequestId = input.data?.nursingRequestId;
  const duplicate = mockNotifications.find(
    (item) =>
      item.userId === input.userId &&
      item.messageKey === input.messageKey &&
      nursingRequestId != null &&
      item.data?.nursingRequestId === nursingRequestId,
  );
  if (duplicate) return null;

  const notification: Notification = {
    id: `notif-${Date.now()}-${++sequence}`,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    messageKey: input.messageKey,
    data: input.data,
    createdAt: new Date().toISOString(),
  };
  mockNotifications.unshift(notification);
  persistNotifications();
  return notification;
}

/** Backfills alerts for requests that were already priced or accepted. */
export async function syncPatientNursingNotifications(
  userId: string,
  requests: Array<{
    id: string;
    patientUserId: string;
    status: string;
    price?: number;
    nurseName?: string;
  }>,
): Promise<void> {
  for (const request of requests) {
    if (request.patientUserId !== userId) continue;
    const confirmed =
      request.status === HomeNursingStatus.PRICED ||
      request.status === HomeNursingStatus.ASSIGNED ||
      request.status === HomeNursingStatus.ACCEPTED ||
      request.status === HomeNursingStatus.COMPLETED;
    if (confirmed && request.price != null) {
      await pushMockNotification({
        userId,
        type: NotificationType.SYSTEM,
        messageKey: 'nursingPriced',
        title: 'Nursing request confirmed',
        body: `The visit was confirmed at ${request.price} EGP.`,
        data: { nursingRequestId: request.id, price: String(request.price) },
      });
    }
    if (request.status === HomeNursingStatus.ACCEPTED || request.status === HomeNursingStatus.COMPLETED) {
      await pushMockNotification({
        userId,
        type: NotificationType.SYSTEM,
        messageKey: 'nursingAccepted',
        title: 'The nurse accepted the request',
        body: request.nurseName
          ? `${request.nurseName} accepted the home visit.`
          : 'A nurse accepted the home visit.',
        data: { nursingRequestId: request.id, nurseName: request.nurseName ?? '' },
      });
    }
  }
}

export function resetMockNotifications() {
  resetArray(mockNotifications, SEED_NOTIFICATIONS);
  loaded = Promise.resolve();
  void AsyncStorage.removeItem(NOTIFICATIONS_KEY);
}

export const mockNotificationsService = {
  async list(userId: string): Promise<PaginatedResponse<Notification>> {
    await ensureNotificationsLoaded();
    const { mockNursingService } = await import('./nursing.mock');
    const requests = await mockNursingService.listForPatient(userId);
    await syncPatientNursingNotifications(userId, requests);
    await sleep(400);
    const data = mockNotifications
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      data,
      meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
    };
  },

  async markRead(id: string, userId: string): Promise<Notification> {
    await ensureNotificationsLoaded();
    await sleep(200);
    const notification = mockNotifications.find((item) => item.id === id && item.userId === userId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (!notification.readAt) {
      notification.readAt = new Date().toISOString();
      persistNotifications();
    }

    return notification;
  },

  async markAllRead(userId: string): Promise<void> {
    await ensureNotificationsLoaded();
    await sleep(300);
    const now = new Date().toISOString();

    mockNotifications.forEach((item) => {
      if (item.userId === userId && !item.readAt) {
        item.readAt = now;
      }
    });
    persistNotifications();
  },
};
