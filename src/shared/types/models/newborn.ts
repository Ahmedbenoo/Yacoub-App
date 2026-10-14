export interface NewbornLink {
  id: string;
  pregnancyId: string;
  motherPatientId: string;
  childPatientId: string;
  deliveredAt: string;
  clinicId: string;
  authorUserId: string;
}

export interface VaccinationDose {
  id: string;
  childPatientId: string;
  label: string;
  dueAt: string;
  appointmentId?: string;
  status: 'due' | 'given';
}

export interface ChildChart {
  link: NewbornLink;
  childName: string;
  dateOfBirth: string;
  doses: VaccinationDose[];
  visits: Array<{
    id: string;
    startedAt: string;
    diagnosis?: string;
    doctorId: string;
  }>;
  appointments: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    doctorId: string;
  }>;
}

export interface AddVaccinationDoseInput {
  label: string;
  dueAt: string;
}
