import { getMockClinicById } from '@/shared/api/mock/clinics.mock';
import { doctorSharePercent, getMockDoctorById } from '@/shared/api/mock/doctors.mock';
import { listMockAppointments } from '@/shared/api/mock/appointments.mock';
import type { Appointment } from '@/shared/types/models/appointment';
import type { DayCloseSummary, Invoice, InvoicePaymentMethod } from '@/shared/types/models/invoice';
import { AppointmentStatus } from '@/shared/types/enums';
import { sleep } from '@/shared/lib/utils';

const invoices: Invoice[] = [];

function personName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function sameDay(iso: string, day = new Date()) {
  const date = new Date(iso);
  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  );
}

export function issueInvoiceForAppointment(appointment: Appointment): Invoice {
  const existing = invoices.find((item) => item.appointmentId === appointment.id && item.status !== 'void');
  if (existing) return existing;

  const clinic = getMockClinicById(appointment.clinicId);
  const doctor = getMockDoctorById(appointment.doctorId);
  const amount = clinic?.consultationFee ?? 0;
  const sharePercent = doctorSharePercent(doctor);
  const doctorShare = Math.round((amount * sharePercent) / 100);
  const invoice: Invoice = {
    id: `inv-${Date.now()}-${appointment.id}`,
    appointmentId: appointment.id,
    clinicId: appointment.clinicId,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    patientName: personName(appointment.patient.firstName, appointment.patient.lastName),
    doctorName: personName(appointment.doctor.firstName, appointment.doctor.lastName),
    amount,
    doctorSharePercent: sharePercent,
    doctorShare,
    clinicShare: amount - doctorShare,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  invoices.unshift(invoice);
  return invoice;
}

function seedPaidInvoices() {
  if (invoices.length) return;
  for (const appointment of listMockAppointments()) {
    if (appointment.status !== AppointmentStatus.COMPLETED) continue;
    const invoice = issueInvoiceForAppointment(appointment);
    invoice.status = 'paid';
    invoice.paymentMethod = 'cash';
    invoice.paidAt = appointment.updatedAt;
  }
}

export function voidOpenInvoice(appointmentId: string) {
  const invoice = invoices.find((item) => item.appointmentId === appointmentId && item.status === 'open');
  if (invoice) invoice.status = 'void';
}

export function summarizeInvoices(clinicId?: string): DayCloseSummary {
  seedPaidInvoices();
  const rows = invoices.filter((item) => !clinicId || item.clinicId === clinicId);
  const paid = rows.filter((item) => item.status === 'paid');
  const open = rows.filter((item) => item.status === 'open');
  const byDoctor = new Map<string, DayCloseSummary['doctors'][number]>();

  for (const invoice of paid) {
    const current = byDoctor.get(invoice.doctorId) ?? {
      doctorId: invoice.doctorId,
      doctorName: invoice.doctorName,
      sharePercent: invoice.doctorSharePercent,
      amount: 0,
      doctorShare: 0,
      clinicShare: 0,
    };
    current.amount += invoice.amount;
    current.doctorShare += invoice.doctorShare;
    current.clinicShare += invoice.clinicShare;
    current.sharePercent = invoice.doctorSharePercent;
    byDoctor.set(invoice.doctorId, current);
  }

  return {
    collected: paid.reduce((sum, item) => sum + item.amount, 0),
    open: open.reduce((sum, item) => sum + item.amount, 0),
    doctorShare: paid.reduce((sum, item) => sum + item.doctorShare, 0),
    clinicShare: paid.reduce((sum, item) => sum + item.clinicShare, 0),
    invoiceCount: paid.length,
    doctors: [...byDoctor.values()],
  };
}

export const mockInvoicesService = {
  async getForAppointment(appointmentId: string): Promise<Invoice | null> {
    await sleep(150);
    seedPaidInvoices();
    return invoices.find((item) => item.appointmentId === appointmentId && item.status !== 'void') ?? null;
  },

  async issue(appointmentId: string): Promise<Invoice> {
    await sleep(300);
    const appointment = listMockAppointments().find((item) => item.id === appointmentId);
    if (!appointment) throw { code: 'NOT_FOUND', message: 'Appointment not found' };
    return issueInvoiceForAppointment(appointment);
  },

  async pay(appointmentId: string, paymentMethod: InvoicePaymentMethod): Promise<Invoice> {
    await sleep(300);
    seedPaidInvoices();
    const invoice = invoices.find((item) => item.appointmentId === appointmentId && item.status !== 'void');
    if (!invoice) throw { code: 'NOT_FOUND', message: 'Invoice not found' };
    if (invoice.status === 'paid') return invoice;
    invoice.status = 'paid';
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = new Date().toISOString();
    return invoice;
  },

  async listToday(clinicId?: string): Promise<Invoice[]> {
    await sleep(250);
    seedPaidInvoices();
    return invoices.filter(
      (item) =>
        item.status !== 'void' &&
        (!clinicId || item.clinicId === clinicId) &&
        sameDay(item.paidAt ?? item.createdAt),
    );
  },

  async dayClose(clinicId?: string): Promise<DayCloseSummary> {
    await sleep(200);
    const today = (await this.listToday(clinicId)).filter((item) => item.status === 'paid' || item.status === 'open');
    const paid = today.filter((item) => item.status === 'paid');
    const open = today.filter((item) => item.status === 'open');
    const byDoctor = new Map<string, DayCloseSummary['doctors'][number]>();
    for (const invoice of paid) {
      const current = byDoctor.get(invoice.doctorId) ?? {
        doctorId: invoice.doctorId,
        doctorName: invoice.doctorName,
        sharePercent: invoice.doctorSharePercent,
        amount: 0,
        doctorShare: 0,
        clinicShare: 0,
      };
      current.amount += invoice.amount;
      current.doctorShare += invoice.doctorShare;
      current.clinicShare += invoice.clinicShare;
      byDoctor.set(invoice.doctorId, current);
    }
    return {
      collected: paid.reduce((sum, item) => sum + item.amount, 0),
      open: open.reduce((sum, item) => sum + item.amount, 0),
      doctorShare: paid.reduce((sum, item) => sum + item.doctorShare, 0),
      clinicShare: paid.reduce((sum, item) => sum + item.clinicShare, 0),
      invoiceCount: paid.length,
      doctors: [...byDoctor.values()],
    };
  },
};
