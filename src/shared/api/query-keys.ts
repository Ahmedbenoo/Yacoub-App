export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.appointments.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.appointments.all, 'detail', id] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.patients.all, 'list', filters] as const,
    me: () => [...queryKeys.patients.all, 'me'] as const,
    detail: (id: string) => [...queryKeys.patients.all, 'detail', id] as const,
    history: (id: string) => [...queryKeys.patients.all, 'history', id] as const,
    prescriptions: (userId: string) => [...queryKeys.patients.all, 'prescriptions', userId] as const,
    prescriptionDetail: (id: string) => [...queryKeys.patients.all, 'prescription-guide', id] as const,
    labResults: (userId: string) => [...queryKeys.patients.all, 'lab-results', userId] as const,
    labResultDetail: (id: string) => [...queryKeys.patients.all, 'lab-result', id] as const,
    visitDetail: (id: string) => [...queryKeys.patients.all, 'visit', id] as const,
  },
  visits: {
    all: ['visits'] as const,
    detail: (id: string) => [...queryKeys.visits.all, 'detail', id] as const,
    byPatient: (patientId: string) => [...queryKeys.visits.all, 'patient', patientId] as const,
  },
  prescriptions: {
    all: ['prescriptions'] as const,
    byVisit: (visitId: string) => [...queryKeys.prescriptions.all, 'visit', visitId] as const,
  },
  labRequests: {
    all: ['lab-requests'] as const,
    byVisit: (visitId: string) => [...queryKeys.labRequests.all, 'visit', visitId] as const,
  },
  doctors: {
    all: ['doctors'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.doctors.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.doctors.all, 'detail', id] as const,
    availability: (id: string) => [...queryKeys.doctors.all, 'availability', 'hours', id] as const,
  },
  clinics: {
    all: ['clinics'] as const,
    list: (userId: string) => [...queryKeys.clinics.all, 'list', userId] as const,
    search: (filters: Record<string, unknown>) =>
      [...queryKeys.clinics.all, 'search', filters] as const,
    detail: (id: string) => [...queryKeys.clinics.all, 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  admin: {
    all: ['admin'] as const,
    stats: (clinicId: string) => [...queryKeys.admin.all, 'stats', clinicId] as const,
    reports: (clinicId: string) => [...queryKeys.admin.all, 'reports', 'live', clinicId] as const,
    reportDetail: (clinicId: string, id: string) =>
      [...queryKeys.admin.all, 'report', 'live', clinicId, id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    forAppointment: (appointmentId: string) => [...queryKeys.invoices.all, 'appointment', appointmentId] as const,
    today: (clinicId: string) => [...queryKeys.invoices.all, 'today', clinicId] as const,
    dayClose: (clinicId: string) => [...queryKeys.invoices.all, 'day-close', clinicId] as const,
  },
  whatsapp: {
    all: ['whatsapp'] as const,
    forAppointment: (appointmentId: string) => [...queryKeys.whatsapp.all, 'appointment', appointmentId] as const,
  },
  queue: {
    all: ['queue'] as const,
    today: (clinicId: string) => [...queryKeys.queue.all, 'today', clinicId] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    forDoctor: (doctorId: string) => [...queryKeys.reviews.all, 'doctor', doctorId] as const,
    forAppointment: (appointmentId: string) =>
      [...queryKeys.reviews.all, 'appointment', appointmentId] as const,
  },
  homeVisits: {
    all: ['home-visits'] as const,
    list: (scope: string) => [...queryKeys.homeVisits.all, 'list', scope] as const,
    detail: (id: string) => [...queryKeys.homeVisits.all, 'detail', id] as const,
    setting: ['home-visits', 'setting'] as const,
  },
  nursing: {
    all: ['nursing'] as const,
    list: (scope: string) => [...queryKeys.nursing.all, 'list', scope] as const,
    detail: (id: string) => [...queryKeys.nursing.all, 'detail', id] as const,
    nurses: () => [...queryKeys.nursing.all, 'nurses'] as const,
    nurse: (userId: string) => [...queryKeys.nursing.all, 'nurse', userId] as const,
  },
  clinical: {
    all: ['clinical'] as const,
    prescription: (id: string) => [...queryKeys.clinical.all, 'prescription-guide', id] as const,
    labResult: (id: string) => [...queryKeys.clinical.all, 'lab-result', id] as const,
    visit: (id: string) => [...queryKeys.clinical.all, 'visit', id] as const,
  },
  obgyn: {
    all: ['obgyn'] as const,
    pregnancies: (patientId: string) => [...queryKeys.obgyn.all, 'pregnancies', patientId] as const,
    encounter: (visitId: string) => [...queryKeys.obgyn.all, 'encounter', visitId] as const,
    summary: (visitId: string) => [...queryKeys.obgyn.all, 'summary', visitId] as const,
    prior: (pregnancyId: string, before: string) => [...queryKeys.obgyn.all, 'prior', pregnancyId, before] as const,
    ultrasound: (labRequestId: string) => [...queryKeys.obgyn.all, 'ultrasound', labRequestId] as const,
    attachments: (visitId: string) => [...queryKeys.obgyn.all, 'attachments', visitId] as const,
    child: (id: string) => [...queryKeys.obgyn.all, 'child', id] as const,
    myChildren: () => [...queryKeys.obgyn.all, 'my-children'] as const,
  },
} as const;
