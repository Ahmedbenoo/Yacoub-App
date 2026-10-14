export type WhatsAppMessageKind = 'confirmation' | 'reminder';
export type WhatsAppMessageStatus = 'scheduled' | 'sent';

export interface WhatsAppMessage {
  id: string;
  appointmentId: string;
  clinicId: string;
  patientId: string;
  kind: WhatsAppMessageKind;
  body: string;
  status: WhatsAppMessageStatus;
  scheduledFor: string;
  sentAt?: string;
}
