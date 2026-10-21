import { db } from './db.js';
import { isSameClinicDay } from './clinic-time.js';

type AppointmentRow = {
  status: string;
  source: string | null;
  scheduled_at: string | Date;
};

type InvoiceRow = {
  amount: number;
  doctor_share: number;
  clinic_share: number;
  status: string;
  paid_at: string | Date | null;
  created_at: string | Date;
};

export type ClinicStats = {
  doctorsCount: number;
  patientsCount: number;
  appointmentsToday: number;
  appointmentsPending: number;
  completedThisMonth: number;
};

export type ClinicReport = {
  id: string;
  clinicId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  period: string;
  periodAr: string;
  generatedAt: string;
  summary: string;
  summaryAr: string;
  metrics: {
    label: string;
    labelAr: string;
    value: string;
    valueAr?: string;
    tone: 'primary' | 'success' | 'warning' | 'default';
  }[];
  highlights: string[];
  highlightsAr: string[];
};

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function isSameDay(value: string | Date, day = new Date()): boolean {
  return isSameClinicDay(value, day);
}

function inMonth(value: string | Date, day = new Date()): boolean {
  const date = asDate(value);
  return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth();
}

async function requireAdmin(userId: string, clinicId: string): Promise<void> {
  const result = await db.query<{ role: string }>(
    `SELECT role FROM memberships WHERE user_id = $1 AND clinic_id = $2 AND role = 'admin'`,
    [userId, clinicId],
  );
  if (!result.rows[0]) throw httpError(403, 'FORBIDDEN', 'Only the clinic admin can open this report');
}

async function appointmentsFor(clinicId: string): Promise<AppointmentRow[]> {
  const result = await db.query<AppointmentRow>(
    'SELECT status, source, scheduled_at FROM appointments WHERE clinic_id = $1',
    [clinicId],
  );
  return result.rows;
}

async function invoicesFor(clinicId: string): Promise<InvoiceRow[]> {
  const result = await db.query<InvoiceRow>(
    'SELECT amount, doctor_share, clinic_share, status, paid_at, created_at FROM invoices WHERE clinic_id = $1',
    [clinicId],
  );
  return result.rows;
}

function countAppointments(rows: AppointmentRow[]) {
  const completed = rows.filter((row) => row.status === 'completed').length;
  const cancelled = rows.filter((row) => row.status === 'cancelled').length;
  const noShow = rows.filter((row) => row.status === 'no_show').length;
  const online = rows.filter((row) => row.source === 'online').length;
  const decided = completed + cancelled + noShow;
  const showRate = decided === 0 ? 0 : Math.round((completed / decided) * 100);
  return { completed, cancelled, noShow, online, showRate, total: rows.length };
}

function moneyOf(rows: InvoiceRow[]) {
  const paid = rows.filter((row) => row.status === 'paid');
  const open = rows.filter((row) => row.status === 'open');
  return {
    collected: paid.reduce((sum, row) => sum + Number(row.amount), 0),
    doctorShare: paid.reduce((sum, row) => sum + Number(row.doctor_share), 0),
    clinicShare: paid.reduce((sum, row) => sum + Number(row.clinic_share), 0),
    open: open.reduce((sum, row) => sum + Number(row.amount), 0),
  };
}

function egp(amount: number): string {
  return `${amount.toLocaleString('en-US')} EGP`;
}

function egpAr(amount: number): string {
  return `${amount.toLocaleString('en-US')} ج.م`;
}

async function buildReport(clinicId: string): Promise<ClinicReport> {
  const now = new Date();
  const monthAppointments = (await appointmentsFor(clinicId)).filter((row) => inMonth(row.scheduled_at, now));
  const monthInvoices = (await invoicesFor(clinicId)).filter((row) => {
    if (row.status === 'void') return false;
    return inMonth(row.paid_at ?? row.created_at, now);
  });
  const stats = countAppointments(monthAppointments);
  const money = moneyOf(monthInvoices);
  const period = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(now);
  const periodAr = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(now);

  return {
    id: `report-live-${clinicId}`,
    clinicId,
    title: 'Branch report',
    titleAr: 'تقرير الفرع',
    description: `${stats.completed} completed, ${stats.cancelled} cancelled, ${stats.online} online bookings`,
    descriptionAr: `اكتمل ${stats.completed}، واتلغى ${stats.cancelled}، والحجز الاونلاين ${stats.online}`,
    period,
    periodAr,
    generatedAt: now.toISOString(),
    summary: `Show-up rate is ${stats.showRate}%. Online bookings are counted separately from desk bookings.`,
    summaryAr: `نسبة الحضور ${stats.showRate}%. عدد الحجز الاونلاين متسجل لوحده عن حجز الاستقبال.`,
    metrics: [
      { label: 'Completed', labelAr: 'مكتمل', value: String(stats.completed), tone: 'success' },
      { label: 'Cancelled', labelAr: 'ملغى', value: String(stats.cancelled), tone: 'warning' },
      { label: 'No-show', labelAr: 'لم يحضر', value: String(stats.noShow), tone: 'warning' },
      { label: 'Show-up rate', labelAr: 'نسبة الحضور', value: `${stats.showRate}%`, tone: 'primary' },
      { label: 'Online bookings', labelAr: 'حجوزات اونلاين', value: String(stats.online), tone: 'default' },
      { label: 'All bookings', labelAr: 'كل الحجوزات', value: String(stats.total), tone: 'default' },
      { label: 'Collected', labelAr: 'المحصّل', value: egp(money.collected), valueAr: egpAr(money.collected), tone: 'success' },
      { label: 'Doctor share', labelAr: 'نصيب الدكاترة', value: egp(money.doctorShare), valueAr: egpAr(money.doctorShare), tone: 'primary' },
      { label: 'Clinic share', labelAr: 'نصيب العيادة', value: egp(money.clinicShare), valueAr: egpAr(money.clinicShare), tone: 'primary' },
      { label: 'Open invoices', labelAr: 'فواتير مفتوحة', value: egp(money.open), valueAr: egpAr(money.open), tone: 'warning' },
    ],
    highlights: [
      'Each branch keeps its own numbers',
      'Doctor share is taken from paid visit invoices this month',
    ],
    highlightsAr: [
      'كل فرع له ارقامه لوحده',
      'نصيب الدكتور بيتحسب من فواتير الكشف المدفوعة في الشهر',
    ],
  };
}

export async function clinicStats(userId: string, clinicId: string): Promise<ClinicStats> {
  await requireAdmin(userId, clinicId);
  const now = new Date();
  const [doctors, patients, appointments] = await Promise.all([
    db.query<{ total: number }>('SELECT count(*)::int AS total FROM doctors WHERE clinic_id = $1 AND is_active = true', [clinicId]),
    db.query<{ total: number }>('SELECT count(*)::int AS total FROM patients WHERE clinic_id = $1 AND is_active = true', [clinicId]),
    appointmentsFor(clinicId),
  ]);
  const upcomingPending = appointments.filter(
    (row) =>
      asDate(row.scheduled_at) >= now &&
      (row.status === 'scheduled' || row.status === 'confirmed'),
  ).length;
  return {
    doctorsCount: Number(doctors.rows[0]?.total ?? 0),
    patientsCount: Number(patients.rows[0]?.total ?? 0),
    appointmentsToday: appointments.filter((row) => isSameDay(row.scheduled_at, now)).length,
    appointmentsPending: upcomingPending,
    completedThisMonth: appointments.filter((row) => row.status === 'completed' && inMonth(row.scheduled_at, now)).length,
  };
}

export async function clinicReports(userId: string, clinicId: string): Promise<ClinicReport[]> {
  await requireAdmin(userId, clinicId);
  return [await buildReport(clinicId)];
}

export async function clinicReport(userId: string, clinicId: string, id: string): Promise<ClinicReport> {
  await requireAdmin(userId, clinicId);
  const report = await buildReport(clinicId);
  if (report.id !== id) throw httpError(404, 'NOT_FOUND', 'Report not found');
  return report;
}
