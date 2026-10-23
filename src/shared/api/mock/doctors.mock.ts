import { sleep } from '@/shared/lib/utils';
import { UserRole } from '@/shared/types/enums';
import type { PaginatedResponse } from '@/shared/types/models';
import type { DoctorFilters, DoctorProfile } from '@/shared/types/models/doctor';

import { getBranchByName } from '@/shared/lib/clinic-branches';
import { normalizePhone } from '@/shared/lib/phone';

import { createStaffCredential } from './auth.mock';
import { assignUserClinic, getMockClinicById, ownerClinicCount } from './clinics.mock';
import { MOCK_CLINIC_IDS } from './constants';
import { cloneSeed, resetArray } from './clone';
import { getMockClinicScope } from './helpers';

const SEED_DOCTORS: DoctorProfile[] = [
  {
    id: 'user-doctor-001',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Eslam',
    lastName: 'Shaban',
    email: 'doctor@clinic.com',
    phone: '+201000000010',
    specialty: 'General Medicine',
    bio: 'Experienced general practitioner focused on preventive care and chronic disease management.',
    rating: 4.8,
    reviewCount: 124,
    yearsExperience: 12,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    languages: ['English', 'Arabic'],
  },
  {
    id: 'user-doctor-002',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Mona',
    lastName: 'Farid',
    email: 'mona.farid@clinic.com',
    phone: '+201000000011',
    specialty: 'Dermatology',
    bio: 'Specialist in skin conditions, cosmetic dermatology, and allergy-related skin care.',
    rating: 4.9,
    reviewCount: 89,
    yearsExperience: 9,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    languages: ['English', 'Arabic'],
  }, 
  {
    id: 'user-doctor-003',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Karim',
    lastName: 'Salah',
    email: 'karim.salah@clinic.com',
    phone: '+201000000012',
    specialty: 'Pediatrics',
    bio: 'Dedicated pediatrician providing comprehensive care for infants, children, and adolescents.',
    rating: 4.7,
    reviewCount: 156,
    yearsExperience: 15,
    branchId: 'branch-002',
    branchName: 'North Branch',
    languages: ['Arabic', 'English'],
  },
  {
    id: 'user-doctor-004',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Layla',
    lastName: 'Nabil',
    email: 'layla.nabil@clinic.com',
    phone: '+201000000013',
    specialty: 'Cardiology',
    bio: 'Cardiologist specializing in hypertension, heart disease prevention, and cardiac rehabilitation.',
    rating: 4.6,
    reviewCount: 67,
    yearsExperience: 11,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    languages: ['English', 'Arabic', 'French'],
  },
  {
    id: 'user-doctor-005',
    clinicId: MOCK_CLINIC_IDS.DOWNTOWN,
    firstName: 'Omar',
    lastName: 'Rashid',
    email: 'omar.rashid@clinic.com',
    phone: '+201000000014',
    specialty: 'Orthopedics',
    bio: 'Orthopedic surgeon specializing in sports injuries, joint care, and rehabilitation.',
    rating: 4.8,
    reviewCount: 52,
    yearsExperience: 10,
    branchId: 'branch-downtown',
    branchName: 'Downtown Branch',
    languages: ['Arabic', 'English'],
  },
  {
    id: 'user-doctor-006',
    clinicId: MOCK_CLINIC_IDS.DOWNTOWN,
    firstName: 'Hana',
    lastName: 'Mostafa',
    email: 'hana.mostafa@clinic.com',
    phone: '+201000000015',
    specialty: 'Internal Medicine',
    bio: 'Internist focused on chronic disease management and preventive health screenings.',
    rating: 4.7,
    reviewCount: 41,
    yearsExperience: 8,
    branchId: 'branch-downtown',
    branchName: 'Downtown Branch',
    languages: ['English', 'Arabic'],
  },
  {
    id: 'user-doctor-007',
    clinicId: MOCK_CLINIC_IDS.MAIN,
    firstName: 'Mariam',
    lastName: 'Saleh',
    email: 'obgyn@clinic.com',
    phone: '+201000000016',
    specialty: 'Obstetrics and Gynecology',
    bio: 'Obstetrician and gynecologist for antenatal care and gynecology consultations.',
    rating: 4.8,
    reviewCount: 36,
    yearsExperience: 11,
    branchId: 'branch-001',
    branchName: 'Main Clinic',
    languages: ['Arabic', 'English'],
  },
];

const mockDoctors: DoctorProfile[] = cloneSeed(SEED_DOCTORS);
const SPECIALTIES = [...new Set(SEED_DOCTORS.map((d) => d.specialty))];

interface DoctorMembership {
  userId: string;
  clinicId: string;
  specialty: string;
}

const doctorMemberships: DoctorMembership[] = SEED_DOCTORS.map((doctor) => ({
  userId: doctor.id,
  clinicId: doctor.clinicId,
  specialty: doctor.specialty,
}));

function membershipFor(userId: string, clinicId: string): DoctorMembership | undefined {
  return doctorMemberships.find((item) => item.userId === userId && item.clinicId === clinicId);
}

function servesClinic(doctor: DoctorProfile, clinicId: string): boolean {
  return doctor.clinicId === clinicId || Boolean(membershipFor(doctor.id, clinicId));
}

function withClinicSpecialty(doctor: DoctorProfile, clinicId: string): DoctorProfile {
  const membership = membershipFor(doctor.id, clinicId);
  if (!membership) return doctor;
  return { ...doctor, clinicId, specialty: membership.specialty };
}

export function insertDoctorProfile(doctor: DoctorProfile) {
  if (!mockDoctors.some((item) => item.id === doctor.id)) {
    mockDoctors.push(doctor);
  }
  if (!membershipFor(doctor.id, doctor.clinicId)) {
    doctorMemberships.push({
      userId: doctor.id,
      clinicId: doctor.clinicId,
      specialty: doctor.specialty,
    });
  }
}

export function listMembershipClinicIds(userId: string): string[] {
  return doctorMemberships.filter((item) => item.userId === userId).map((item) => item.clinicId);
}

export function resetMockDoctors() {
  resetArray(mockDoctors, SEED_DOCTORS);
}

function filterDoctors(filters: DoctorFilters): DoctorProfile[] {
  const scopedClinicId =
    filters.allClinics && !filters.clinicId ? undefined : getMockClinicScope(filters.clinicId);

  let result = mockDoctors.filter((doctor) => {
    if (doctor.isActive === false && !filters.includeInactive) return false;
    if (!scopedClinicId) return true;
    return servesClinic(doctor, scopedClinicId);
  });

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (d) =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q),
    );
  }

  if (filters.specialty) {
    result = result.filter((doctor) => {
      const specialty = scopedClinicId
        ? withClinicSpecialty(doctor, scopedClinicId).specialty
        : doctor.specialty;
      return specialty === filters.specialty;
    });
  }

  return result;
}

export const mockDoctorsService = {
  async list(filters: DoctorFilters = {}): Promise<PaginatedResponse<DoctorProfile>> {
    await sleep(500);
    const scopedClinicId =
      filters.allClinics && !filters.clinicId ? undefined : getMockClinicScope(filters.clinicId);
    const filtered = filterDoctors(filters).map((doctor) =>
      scopedClinicId ? withClinicSpecialty(doctor, scopedClinicId) : doctor,
    );
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit),
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  },

  async getById(id: string): Promise<DoctorProfile> {
    await sleep(400);
    const doctor = mockDoctors.find((d) => d.id === id);
    if (!doctor) throw { code: 'NOT_FOUND', message: 'Doctor not found' };
    return doctor;
  },

  async update(id: string, payload: import('@/shared/types/models/admin').UpdateDoctorPayload): Promise<DoctorProfile> {
    await sleep(500);
    const index = mockDoctors.findIndex((d) => d.id === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Doctor not found' };

    const branch = getBranchByName(payload.branchName);

    mockDoctors[index] = {
      ...mockDoctors[index],
      specialty: payload.specialty,
      phone: payload.phone,
      bio: payload.bio,
      branchId: branch?.id ?? mockDoctors[index].branchId,
      branchName: payload.branchName,
      languages: payload.languages,
      avatarUrl: payload.avatarUrl ?? mockDoctors[index].avatarUrl,
      sharePercent:
        payload.sharePercent == null
          ? mockDoctors[index].sharePercent
          : Math.min(100, Math.max(0, Math.round(payload.sharePercent))),
    };

    return mockDoctors[index];
  },

  async deactivate(id: string): Promise<DoctorProfile> {
    await sleep(500);
    const index = mockDoctors.findIndex((d) => d.id === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Doctor not found' };

    mockDoctors[index] = {
      ...mockDoctors[index],
      isActive: false,
    };

    return mockDoctors[index];
  },

  async reactivate(id: string): Promise<DoctorProfile> {
    await sleep(500);
    const index = mockDoctors.findIndex((d) => d.id === id);
    if (index === -1) throw { code: 'NOT_FOUND', message: 'Doctor not found' };

    mockDoctors[index] = {
      ...mockDoctors[index],
      isActive: true,
    };

    return mockDoctors[index];
  },

  async create(
    payload: import('@/shared/types/models/admin').CreateDoctorPayload,
  ): Promise<import('@/shared/types/models/admin').CreateDoctorResult> {
    await sleep(500);

    if (!payload.phone || !normalizePhone(payload.phone)) {
      throw { code: 'PHONE_REQUIRED', message: 'Phone is required' };
    }

    const clinicId = getMockClinicScope();
    const clinicForCap = getMockClinicById(clinicId);
    const doctorsInClinic = doctorMemberships.filter((item) => item.clinicId === clinicId).length;
    const ownedClinics = clinicForCap?.ownerUserId ? ownerClinicCount(clinicForCap.ownerUserId) : 0;
    if (clinicForCap?.ownerUserId && ownedClinics <= 2 && doctorsInClinic >= 3) {
      throw { code: 'DOCTOR_LIMIT', message: 'العياده تقدر تسجل 3 دكاتره بس' };
    }
    const clinic = getMockClinicById(clinicId);
    const specialty = clinic?.specialty || payload.specialty;
    const account = createStaffCredential({
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      password: payload.password?.trim() || '',
      role: UserRole.DOCTOR,
      clinicId,
    });

    assignUserClinic(account.userId, clinicId);

    if (!membershipFor(account.userId, clinicId)) {
      doctorMemberships.push({
        userId: account.userId,
        clinicId,
        specialty,
      });
    }

    const existing = mockDoctors.find((doctor) => doctor.id === account.userId);
    if (existing) {
      const credentialsWhatsApp = await staffAccessMessage(account, {
        clinicName: clinic?.nameAr || clinic?.name || payload.branchName || 'العيادة',
        role: 'doctor',
        personName: `${payload.firstName} ${payload.lastName}`.trim(),
      });
      return {
        ...withClinicSpecialty(existing, clinicId),
        linkedExisting: account.linkedExisting,
        credentialsWhatsApp,
      };
    }

    const branch = getBranchByName(payload.branchName);
    const doctor: DoctorProfile = {
      id: account.userId,
      clinicId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: account.email,
      phone: normalizePhone(payload.phone),
      specialty,
      bio: payload.bio,
      rating: 0,
      reviewCount: 0,
      yearsExperience: 0,
      branchId: branch?.id ?? clinicId,
      branchName: payload.branchName || clinic?.name || 'Clinic',
      languages: payload.languages.length ? payload.languages : ['Arabic'],
      isActive: true,
    };

    mockDoctors.push(doctor);
    const credentialsWhatsApp = await staffAccessMessage(account, {
      clinicName: clinic?.nameAr || clinic?.name || payload.branchName || 'العيادة',
      role: 'doctor',
      personName: `${payload.firstName} ${payload.lastName}`.trim(),
    });
    return { ...doctor, linkedExisting: account.linkedExisting, credentialsWhatsApp };
  },

  listMembershipClinicIds,

  getSpecialties: () => SPECIALTIES,
};

export function getMockDoctorById(id: string): DoctorProfile | undefined {
  return mockDoctors.find((d) => d.id === id);
}

async function staffAccessMessage(
  account: { linkedExisting: boolean; password?: string; phone: string },
  input: { clinicName: string; role: 'doctor' | 'secretary'; personName: string },
) {
  if (account.linkedExisting || !account.password) return undefined;
  const { queueStaffAccessWhatsApp } = await import('./whatsapp.mock');
  return queueStaffAccessWhatsApp({
    clinicName: input.clinicName,
    phone: account.phone,
    password: account.password,
    role: input.role,
    personName: input.personName,
  });
}

export function doctorSharePercent(doctor?: DoctorProfile): number {
  const value = doctor?.sharePercent;
  if (value == null || Number.isNaN(value)) return 60;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function applyDoctorRating(doctorId: string, rating: number) {
  const doctor = mockDoctors.find((item) => item.id === doctorId);
  if (!doctor) return;
  const nextCount = doctor.reviewCount + 1;
  const nextRating = (doctor.rating * doctor.reviewCount + rating) / nextCount;
  doctor.rating = Math.round(nextRating * 10) / 10;
  doctor.reviewCount = nextCount;
}
