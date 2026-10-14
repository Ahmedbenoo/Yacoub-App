import { NotificationType } from '../enums';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** i18n key under appointments.notifications.items — used when the payload is a template */
  messageKey?: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}
