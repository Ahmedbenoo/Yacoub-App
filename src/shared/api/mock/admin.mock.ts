import { sleep } from '@/shared/lib/utils';
import { AppointmentStatus } from '@/shared/types/enums';
import type { ClinicReport, ClinicStats } from '@/shared/types/models/admin';

import { listMockAppointments, mockAppointmentsService } from './appointments.mock';
import { summarizeInvoices } from './invoices.mock';
import { MOCK_CLINIC_IDS } from './constants';
import { mockDoctorsService } from './doctors.mock';
import { getMockClinicScope } from './helpers';
import { mockPatientsService } from './patients.mock';

const mockReports: ClinicReport[] = [
  {
    id: 'report-001',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    title: 'Monthly Appointments Summary',
    titleAr: 'ملخص مواعيد الشهر',
    description: '142 appointments completed, 8 cancellations, 94% show-up rate',
    descriptionAr: 'اكتمل 142 موعد، واتلغى 8، ونسبة الحضور 94%',
    period: 'July 2026',
    periodAr: 'يوليو 2026',
    generatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    summary:
      'Overall clinic throughput remained strong with high patient attendance and stable cancellation rates.',
    summaryAr: 'الشغل فى العياده فضل قوى، والحضور كان عالى، ونسبة الالغاء ثابته.',
    metrics: [
      { label: 'Completed', labelAr: 'مكتمل', value: '142', tone: 'success' },
      { label: 'Cancelled', labelAr: 'ملغى', value: '8', tone: 'warning' },
      { label: 'Show-up rate', labelAr: 'نسبة الحضور', value: '94%', tone: 'primary' },
      { label: 'New bookings', labelAr: 'حجوزات جديده', value: '56', tone: 'default' },
    ],
    highlights: [
      'Tuesday and Wednesday were the busiest days',
      'General medicine accounted for 48% of visits',
      'Average wait time improved by 6 minutes vs last month',
    ],
    highlightsAr: [
      'التلات والاربع كانوا اكتر الايام زحمه',
      'الطب العام كان 48% من الزيارات',
      'متوسط الانتظار قل 6 دقايق عن الشهر اللى فات',
    ],
  },
  {
    id: 'report-002',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    title: 'Doctor Utilization',
    titleAr: 'استخدام الاطباء',
    description: 'Average 28 appointments per doctor, peak hours 10 AM – 2 PM',
    descriptionAr: 'متوسط 28 موعد لكل دكتور، واكتر وقت من 10 الصبح لحد 2 الظهر',
    period: 'July 2026',
    periodAr: 'يوليو 2026',
    generatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    summary: 'Doctor schedules were well utilized during midday slots with room to add evening capacity.',
    summaryAr: 'جداول الدكاتره كانت مليانه فى نص اليوم، ولسه فيه مكان لمواعيد بالليل.',
    metrics: [
      { label: 'Avg / doctor', labelAr: 'المتوسط لكل دكتور', value: '28', tone: 'primary' },
      { label: 'Peak hour', labelAr: 'ساعة الذروه', value: '11 AM', valueAr: '11 ص', tone: 'default' },
      { label: 'Open slots', labelAr: 'مواعيد فاضيه', value: '12%', tone: 'warning' },
      { label: 'Overtime visits', labelAr: 'زيارات اضافيه', value: '4', tone: 'success' },
    ],
    highlights: [
      'Dr. Ahmed Fathy led utilization at 92%',
      'Pediatrics had the highest no-show rate at 9%',
      'Recommend opening one extra slot on Thursdays',
    ],
    highlightsAr: [
      'د. احمد فتحى كان الاعلى استخداما بنسبة 92%',
      'الاطفال كان اعلى عدم حضور بنسبة 9%',
      'ينفع نفتح ميعاد زيادة يوم الخميس',
    ],
  },
  {
    id: 'report-003',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    title: 'Patient Growth',
    titleAr: 'نمو المرضى',
    description: '12 new patients registered, 68% return visit rate',
    descriptionAr: 'اتسجل 12 مريض جديد، ونسبة الرجوع 68%',
    period: 'July 2026',
    periodAr: 'يوليو 2026',
    generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    summary: 'Patient retention improved while new registrations stayed steady.',
    summaryAr: 'المرضى رجعوا اكتر، والتسجيل الجديد فضل ثابت.',
    metrics: [
      { label: 'New patients', labelAr: 'مرضى جدد', value: '12', tone: 'success' },
      { label: 'Return rate', labelAr: 'نسبة الرجوع', value: '68%', tone: 'primary' },
      { label: 'Referrals', labelAr: 'تحويلات', value: '5', tone: 'default' },
      { label: 'Churn risk', labelAr: 'معرضين للمغادرة', value: '3', tone: 'warning' },
    ],
    highlights: [
      'Most new patients came from online booking',
      'Hypertension follow-ups drove repeat visits',
      'Two patients completed their first lab result review online',
    ],
    highlightsAr: [
      'اغلب المرضى الجدد جاءوا من الحجز الاونلاين',
      'متابعات الضغط هى اللى زودت الزيارات',
      'مريضين خلصوا مراجعة اول تحليل اونلاين',
    ],
  },
  {
    id: 'report-004',
    clinicId: MOCK_CLINIC_IDS.DOWNTOWN,
    title: 'Downtown Branch Summary',
    titleAr: 'ملخص فرع وسط البلد',
    description: '38 appointments completed, 2 cancellations, 91% show-up rate',
    descriptionAr: 'اكتمل 38 موعد، واتلغى 2، ونسبة الحضور 91%',
    period: 'July 2026',
    periodAr: 'يوليو 2026',
    generatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    summary: 'The downtown branch maintained solid performance with minimal cancellations.',
    summaryAr: 'فرع وسط البلد فضل مستقر، والالغاءات كانت قليله.',
    metrics: [
      { label: 'Completed', labelAr: 'مكتمل', value: '38', tone: 'success' },
      { label: 'Cancelled', labelAr: 'ملغى', value: '2', tone: 'warning' },
      { label: 'Show-up rate', labelAr: 'نسبة الحضور', value: '91%', tone: 'primary' },
      { label: 'Doctors on duty', labelAr: 'اطباء فى الشيفت', value: '2', tone: 'default' },
    ],
    highlights: [
      'Evening slots were fully booked twice this month',
      'Dermatology consults increased by 15%',
    ],
    highlightsAr: ['مواعيد المساء اكتملت مرتين الشهر ده', 'استشارات الجلديه زادت 15%'],
  },
];

export const mockAdminService = {
  async getStats(clinicId?: string): Promise<ClinicStats> {
    await sleep(400);
    const scope = getMockClinicScope(clinicId);

    const [doctors, patients, today, upcoming, past] = await Promise.all([
      mockDoctorsService.list({ clinicId: scope }),
      mockPatientsService.list({ clinicId: scope }),
      mockAppointmentsService.list({ scope: 'today', clinicId: scope }),
      mockAppointmentsService.list({ scope: 'upcoming', clinicId: scope }),
      mockAppointmentsService.list({ scope: 'past', clinicId: scope }),
    ]);

    const pending = upcoming.data.filter((a) =>
      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(a.status),
    ).length;

    const completedThisMonth = past.data.filter((a) => a.status === AppointmentStatus.COMPLETED).length;

    return {
      doctorsCount: doctors.meta.total,
      patientsCount: patients.meta.total,
      appointmentsToday: today.meta.total,
      appointmentsPending: pending,
      completedThisMonth,
    };
  },

  async getReports(clinicId?: string): Promise<ClinicReport[]> {
    await sleep(300);
    const scope = getMockClinicScope(clinicId);
    return [...liveReports(scope), ...mockReports.filter((report) => report.clinicId === scope)];
  },

  async getReportById(id: string, clinicId?: string): Promise<ClinicReport> {
    await sleep(350);
    const scope = getMockClinicScope(clinicId);
    const report =
      liveReports(scope).find((item) => item.id === id) ??
      mockReports.find((item) => item.id === id && item.clinicId === scope);

    if (!report) {
      throw { code: 'NOT_FOUND', message: 'Report not found' };
    }

    return report;
  },
};

function countReport(items: ReturnType<typeof listMockAppointments>) {
  const completed = items.filter((item) => item.status === AppointmentStatus.COMPLETED).length;
  const cancelled = items.filter((item) => item.status === AppointmentStatus.CANCELLED).length;
  const noShow = items.filter((item) => item.status === AppointmentStatus.NO_SHOW).length;
  const online = items.filter((item) => item.source === 'online').length;
  const attended = completed;
  const decided = completed + cancelled + noShow;
  const showRate = decided === 0 ? 0 : Math.round((attended / decided) * 100);
  return { completed, cancelled, noShow, online, showRate, total: items.length };
}

function liveReports(scope: string): ClinicReport[] {
  const all = listMockAppointments();
  const branch = all.filter((item) => item.clinicId === scope);
  const now = new Date().toISOString();
  const period = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date());
  const periodAr = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(new Date());

  const make = (
    id: string,
    title: string,
    titleAr: string,
    items: ReturnType<typeof listMockAppointments>,
    clinicId?: string,
  ): ClinicReport => {
    const stats = countReport(items);
    const money = summarizeInvoices(clinicId);
    const egp = (amount: number) => `${amount.toLocaleString('en-US')} EGP`;
    const egpAr = (amount: number) => `${amount.toLocaleString('en-US')} ج.م`;
    return {
      id,
      clinicId: scope,
      title,
      titleAr,
      description: `${stats.completed} completed, ${stats.cancelled} cancelled, ${stats.online} online bookings`,
      descriptionAr: `اكتمل ${stats.completed}، واتلغى ${stats.cancelled}، والحجز الاونلاين ${stats.online}`,
      period,
      periodAr,
      generatedAt: now,
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
        'Doctor share is taken from paid visit invoices',
      ],
      highlightsAr: [
        'كل فرع له ارقامه لوحده',
        'نصيب الدكتور بيتحسب من فواتير الكشف المدفوعة',
      ],
    };
  };

  return [
    make(`report-live-${scope}`, 'Branch report', 'تقرير الفرع', branch, scope),
    make('report-live-all', 'All clinics', 'تقرير كل العيادات', all),
  ];
}
