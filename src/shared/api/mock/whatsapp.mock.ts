import { listMockAppointments } from '@/shared/api/mock/appointments.mock';
import type { Appointment } from '@/shared/types/models/appointment';
import type { WhatsAppMessage, WhatsAppMessageKind } from '@/shared/types/models/whatsapp';
import { AppointmentStatus } from '@/shared/types/enums';
import { formatPhoneForDisplay, normalizePhone } from '@/shared/lib/phone';
import { sleep } from '@/shared/lib/utils';

const messages: WhatsAppMessage[] = [];

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function dayWord(appointmentAt: string, reference: Date) {
  const appointmentDay = new Date(appointmentAt);
  const referenceDay = new Date(reference);
  appointmentDay.setHours(0, 0, 0, 0);
  referenceDay.setHours(0, 0, 0, 0);
  const offset = Math.round((appointmentDay.getTime() - referenceDay.getTime()) / (24 * 60 * 60 * 1000));
  if (offset === 0) return 'النهاردة';
  if (offset === 1) return 'بكرة';
  return '';
}

function messageBody(appointment: Appointment, kind: WhatsAppMessageKind, reference = new Date()) {
  const doctor = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`.trim();
  const when = formatWhen(appointment.scheduledAt);
  const place = `مع د. ${doctor}، ${when}، في ${appointment.branchName}`;
  if (kind === 'request') return `طلب الحجز وصل وبانتظار تأكيد العيادة. ${place}.`;
  if (kind === 'confirmation') return `تم تأكيد ميعادك ${place}.`;
  if (kind === 'cancellation') return `ميعادك ${when} مع د. ${doctor}، في ${appointment.branchName}، اتلغى.`;
  if (kind === 'reschedule') return `ميعادك اتغير إلى ${when} مع د. ${doctor}، في ${appointment.branchName}.`;
  const lead = dayWord(appointment.scheduledAt, reference);
  const whenWord = lead ? `ميعادك ${lead}` : 'ميعادك';
  return `تذكير: ${whenWord} مع د. ${doctor}، ${when}، في ${appointment.branchName}.`;
}

function dispatchDue() {
  const now = Date.now();
  for (const message of messages) {
    if (message.status === 'scheduled' && new Date(message.scheduledFor).getTime() <= now) {
      message.status = 'sent';
      message.sentAt = new Date().toISOString();
    }
  }
}

function pushMessage(
  appointment: Appointment,
  kind: WhatsAppMessageKind,
  id: string,
  status: 'sent' | 'scheduled',
  scheduledFor: string,
  reference?: Date,
) {
  messages.unshift({
    id,
    appointmentId: appointment.id,
    clinicId: appointment.clinicId,
    patientId: appointment.patientId,
    kind,
    body: messageBody(appointment, kind, reference),
    status,
    scheduledFor,
    sentAt: status === 'sent' ? scheduledFor : undefined,
  });
}

export function queueAppointmentRequest(appointment: Appointment) {
  if (messages.some((item) => item.appointmentId === appointment.id && item.kind === 'request')) return;
  pushMessage(appointment, 'request', `wa-${appointment.id}-request`, 'sent', new Date().toISOString());
}

export function queueAppointmentWhatsApp(appointment: Appointment, resend = false) {
  const now = new Date().toISOString();
  const confirmation = messages.find((item) => item.appointmentId === appointment.id && item.kind === 'confirmation');
  const confirmBody = messageBody(appointment, 'confirmation');
  if (!confirmation) {
    pushMessage(appointment, 'confirmation', `wa-${appointment.id}-confirm`, 'sent', now);
  } else if (resend && confirmation.body !== confirmBody) {
    confirmation.body = confirmBody;
    confirmation.status = 'sent';
    confirmation.sentAt = now;
  }

  if (!messages.some((item) => item.appointmentId === appointment.id && item.kind === 'reminder')) {
    const reminderAtDate = new Date(new Date(appointment.scheduledAt).getTime() - 24 * 60 * 60 * 1000);
    const reminderReference = reminderAtDate.getTime() <= Date.now() ? new Date() : reminderAtDate;
    pushMessage(
      appointment,
      'reminder',
      `wa-${appointment.id}-remind`,
      'scheduled',
      reminderAtDate.toISOString(),
      reminderReference,
    );
  }
  dispatchDue();
}

export function notifyAppointmentCancelled(appointment: Appointment) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (item.appointmentId === appointment.id && item.kind === 'reminder' && item.status === 'scheduled') {
      messages.splice(index, 1);
    }
  }
  if (messages.some((item) => item.appointmentId === appointment.id && item.kind === 'cancellation')) return;
  pushMessage(appointment, 'cancellation', `wa-${appointment.id}-cancel`, 'sent', new Date().toISOString());
}

export function notifyAppointmentRescheduled(appointment: Appointment) {
  const now = new Date();
  pushMessage(appointment, 'reschedule', `wa-${appointment.id}-move-${now.getTime()}`, 'sent', now.toISOString());
  const reminder = messages.find((item) => item.appointmentId === appointment.id && item.kind === 'reminder');
  if (reminder) {
    const reminderAtDate = new Date(new Date(appointment.scheduledAt).getTime() - 24 * 60 * 60 * 1000);
    const reminderReference = reminderAtDate.getTime() <= now.getTime() ? now : reminderAtDate;
    reminder.body = messageBody(appointment, 'reminder', reminderReference);
    reminder.status = 'scheduled';
    reminder.scheduledFor = reminderAtDate.toISOString();
    reminder.sentAt = undefined;
  }
  dispatchDue();
}

function seedMessages() {
  for (const appointment of listMockAppointments()) {
    if (
      appointment.status === AppointmentStatus.CONFIRMED ||
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.IN_PROGRESS
    ) {
      queueAppointmentWhatsApp(appointment);
    }
  }
}

const staffMessages: { id: string; phone: string; body: string; sentAt: string }[] = [];

export function queueStaffAccessWhatsApp(input: {
  clinicName: string;
  phone: string;
  password: string;
  role: 'doctor' | 'secretary';
  personName: string;
}): string {
  const username = formatPhoneForDisplay(normalizePhone(input.phone));
  const greeting = input.role === 'doctor' ? `د. ${input.personName}` : input.personName;
  const body = [
    `أهلاً ${greeting}، اتضاف حسابك في ${input.clinicName}.`,
    `اسم المستخدم: ${username}`,
    `كلمة المرور: ${input.password}`,
    'تقدر تغيّر كلمة المرور من البروفايل بعد تسجيل الدخول.',
  ].join('\n');
  staffMessages.unshift({
    id: `wa-staff-${Date.now()}`,
    phone: normalizePhone(input.phone),
    body,
    sentAt: new Date().toISOString(),
  });
  return body;
}

export const mockWhatsAppService = {
  async listForAppointment(appointmentId: string): Promise<WhatsAppMessage[]> {
    await sleep(150);
    seedMessages();
    dispatchDue();
    return messages
      .filter((item) => item.appointmentId === appointmentId)
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  },
};
