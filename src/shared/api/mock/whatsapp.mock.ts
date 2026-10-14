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
  if (kind === 'confirmation') {
    return `تم تأكيد ميعادك مع د. ${doctor}، ${when}، في ${appointment.branchName}.`;
  }
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

export function queueAppointmentWhatsApp(appointment: Appointment) {
  const hasConfirmation = messages.some(
    (item) => item.appointmentId === appointment.id && item.kind === 'confirmation',
  );
  if (hasConfirmation) return;

  const now = new Date().toISOString();
  const reminderAtDate = new Date(new Date(appointment.scheduledAt).getTime() - 24 * 60 * 60 * 1000);
  const reminderReference = reminderAtDate.getTime() <= Date.now() ? new Date() : reminderAtDate;
  const reminderAt = reminderAtDate.toISOString();
  messages.unshift(
    {
      id: `wa-${appointment.id}-confirm`,
      appointmentId: appointment.id,
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      kind: 'confirmation',
      body: messageBody(appointment, 'confirmation'),
      status: 'sent',
      scheduledFor: now,
      sentAt: now,
    },
    {
      id: `wa-${appointment.id}-remind`,
      appointmentId: appointment.id,
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      kind: 'reminder',
      body: messageBody(appointment, 'reminder', reminderReference),
      status: 'scheduled',
      scheduledFor: reminderAt,
    },
  );
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
