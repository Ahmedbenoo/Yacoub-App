import { Gender, UserRole } from '@/shared/types/enums';
import { useAuthStore } from '@/shared/stores/auth-store';
import type { PatientProfile } from '@/shared/types/models/patient';
import type { AddVaccinationDoseInput, ChildChart, NewbornLink, VaccinationDose } from '@/shared/types/models/newborn';

import { listAppointmentsForPatient } from './appointments.mock';
import { cloneSeed, resetArray } from './clone';
import { getPatientIdsForUser, insertMockPatient, mockPatientsService } from './patients.mock';
import { mockVisits } from './visits.mock';

const SEED_LINKS: NewbornLink[] = [
  {
    id: 'newborn-001',
    pregnancyId: 'pregnancy-delivered',
    motherPatientId: 'patient-003',
    childPatientId: 'patient-child-001',
    deliveredAt: '2026-05-08T10:00:00.000Z',
    clinicId: 'clinic-001',
    authorUserId: 'user-doctor-007',
  },
];

const SEED_DOSES: VaccinationDose[] = [
  {
    id: 'dose-001',
    childPatientId: 'patient-child-001',
    label: 'Birth dose',
    dueAt: '2026-05-08',
    status: 'given',
  },
];

const links: NewbornLink[] = cloneSeed(SEED_LINKS);
const doses: VaccinationDose[] = cloneSeed(SEED_DOSES);

export function resetMockNewborns() {
  resetArray(links, SEED_LINKS);
  resetArray(doses, SEED_DOSES);
}

export function createChildFromDelivery(input: {
  pregnancyId: string;
  mother: PatientProfile;
  deliveredAt: string;
  firstName: string;
  gender: 'male' | 'female';
  authorUserId: string;
}): NewbornLink {
  const stamp = Date.now();
  const childId = `patient-child-${stamp}`;
  const child: PatientProfile = {
    id: childId,
    userId: `user-child-${stamp}`,
    clinicId: input.mother.clinicId,
    firstName: input.firstName.trim(),
    lastName: input.mother.lastName,
    dateOfBirth: input.deliveredAt.slice(0, 10),
    gender: input.gender === 'male' ? Gender.MALE : Gender.FEMALE,
    allergies: [],
    chronicConditions: [],
    createdAt: input.deliveredAt,
    updatedAt: input.deliveredAt,
  };
  insertMockPatient(child);
  const link: NewbornLink = {
    id: `newborn-${stamp}`,
    pregnancyId: input.pregnancyId,
    motherPatientId: input.mother.id,
    childPatientId: childId,
    deliveredAt: input.deliveredAt,
    clinicId: input.mother.clinicId,
    authorUserId: input.authorUserId,
  };
  links.unshift(link);
  return link;
}

export function listNewbornsForMother(motherPatientIds: string[]): NewbornLink[] {
  return links.filter((link) => motherPatientIds.includes(link.motherPatientId));
}

export function getNewbornLink(childPatientId: string): NewbornLink | undefined {
  return links.find((link) => link.childPatientId === childPatientId);
}

export function findNewbornByPregnancy(pregnancyId: string): NewbornLink | undefined {
  return links.find((link) => link.pregnancyId === pregnancyId);
}

export async function readChildChart(childPatientId: string): Promise<ChildChart> {
  const link = getNewbornLink(childPatientId);
  if (!link) throw { code: 'NOT_FOUND', message: 'Child chart not found' };
  const { activeRole, user } = useAuthStore.getState();
  if (!user) throw { code: 'UNAUTHORIZED', message: 'Sign in required' };
  const child = await mockPatientsService.getById(childPatientId);
  const name = `${child.firstName} ${child.lastName}`;
  if (activeRole === UserRole.PATIENT) {
    const ids = getPatientIdsForUser(user.id);
    if (!ids.includes(link.motherPatientId)) {
      throw { code: 'FORBIDDEN', message: 'Child chart is not available' };
    }
    return buildChildChart(link, name, child.dateOfBirth);
  }
  if (activeRole === UserRole.DOCTOR) {
    const hasVisit = mockVisits.some((visit) => visit.patientId === childPatientId && visit.doctorId === user.id);
    const hasAppointment = listAppointmentsForPatient(childPatientId).some((item) => item.doctorId === user.id);
    if (!hasVisit && !hasAppointment && link.authorUserId !== user.id) {
      throw { code: 'FORBIDDEN', message: 'Open this chart from your own visit or appointment' };
    }
    return buildChildChart(link, name, child.dateOfBirth, user.id);
  }
  throw { code: 'FORBIDDEN', message: 'Child chart is not available' };
}

export function buildChildChart(link: NewbornLink, childName: string, dateOfBirth: string, doctorId?: string): ChildChart {
  const visits = mockVisits
    .filter((visit) => visit.patientId === link.childPatientId && (!doctorId || visit.doctorId === doctorId))
    .map((visit) => ({
      id: visit.id,
      startedAt: visit.startedAt,
      diagnosis: visit.diagnosis,
      doctorId: visit.doctorId,
    }))
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  return {
    link,
    childName,
    dateOfBirth,
    doses: doses
      .filter((dose) => dose.childPatientId === link.childPatientId)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    visits,
    appointments: listAppointmentsForPatient(link.childPatientId).map((appointment) => ({
      id: appointment.id,
      scheduledAt: appointment.scheduledAt,
      status: appointment.status,
      doctorId: appointment.doctorId,
    })),
  };
}

export function addVaccinationDose(childPatientId: string, input: AddVaccinationDoseInput): VaccinationDose {
  const dose: VaccinationDose = {
    id: `dose-${Date.now()}`,
    childPatientId,
    label: input.label.trim(),
    dueAt: input.dueAt,
    status: 'due',
  };
  doses.unshift(dose);
  return dose;
}
