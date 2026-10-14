import { createOwnerCredential, createStaffCredential, sessionForUser } from './auth.mock';
import { addClinicForOwner, assignUserClinic, createOwnedPlace, ownerHasCenter } from './clinics.mock';
import { insertDoctorProfile } from './doctors.mock';
import type {
  AddOwnerClinicPayload,
  RegisterDoctorPayload,
  RegisterOwnerPayload,
} from '@/shared/types/models/admin';
import type { AuthSession } from '@/shared/types/models';
import type { DoctorProfile } from '@/shared/types/models/doctor';
import { UserRole } from '@/shared/types/enums';
import { normalizePhone } from '@/shared/lib/phone';
import { getMockClinicScope } from './helpers';

export const ownerRegistrationMock = {
  async register(data: RegisterOwnerPayload): Promise<AuthSession> {
    const account = createOwnerCredential({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      password: data.password,
      practices: data.practices,
    });

    const clinic = createOwnedPlace({
      ownerUserId: account.userId,
      placeKind: data.placeKind,
      placeName: data.placeName,
      clinicName: data.clinicName,
      phone: data.clinicPhone,
      street: data.street,
      city: data.city,
      locationUrl: data.locationUrl,
      specialty: data.specialty,
      openingHours: data.openingHours,
      consultationFee: data.consultationFee,
    });

    if (data.practices) {
      const doctor: DoctorProfile = {
        id: account.userId,
        clinicId: clinic.id,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: account.email,
        phone: normalizePhone(data.phone),
        specialty: data.specialty,
        rating: 0,
        reviewCount: 0,
        yearsExperience: 0,
        branchId: clinic.id,
        branchName: clinic.name,
        languages: ['Arabic'],
        isActive: true,
      };
      insertDoctorProfile(doctor);
    }

    return sessionForUser(account.userId, clinic.id);
  },

  async registerDoctor(data: RegisterDoctorPayload): Promise<AuthSession> {
    const account = createStaffCredential({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      password: data.password,
      role: UserRole.DOCTOR,
      clinicId: 'self',
    });

    const clinic = createOwnedPlace({
      ownerUserId: account.userId,
      placeKind: 'clinic',
      placeName: `${data.firstName.trim()} ${data.lastName.trim()}`,
      phone: data.phone,
      street: '',
      city: '',
      specialty: data.specialty,
    });

    const doctor: DoctorProfile = {
      id: account.userId,
      clinicId: clinic.id,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: account.email,
      phone: normalizePhone(data.phone),
      specialty: data.specialty,
      rating: 0,
      reviewCount: 0,
      yearsExperience: 0,
      branchId: clinic.id,
      branchName: clinic.name,
      languages: ['Arabic'],
      isActive: true,
    };
    insertDoctorProfile(doctor);

    return sessionForUser(account.userId, clinic.id);
  },

  async addClinic(ownerUserId: string, data: AddOwnerClinicPayload) {
    return addClinicForOwner({
      ownerUserId,
      name: data.name,
      phone: data.phone,
      street: data.street,
      city: data.city,
      locationUrl: data.locationUrl,
      specialty: data.specialty,
    });
  },

  hasCenter: ownerHasCenter,

  async createSecretary(input: {
    firstName: string;
    lastName: string;
    phone: string;
    password?: string;
  }) {
    const clinicId = getMockClinicScope();
    const account = createStaffCredential({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      password: input.password?.trim() || '',
      role: UserRole.SECRETARY,
      clinicId,
    });
    assignUserClinic(account.userId, clinicId);
    let credentialsWhatsApp: string | undefined;
    if (!account.linkedExisting && account.password) {
      const clinic = (await import('./clinics.mock')).getMockClinicById(clinicId);
      const { queueStaffAccessWhatsApp } = await import('./whatsapp.mock');
      credentialsWhatsApp = queueStaffAccessWhatsApp({
        clinicName: clinic?.nameAr || clinic?.name || 'العيادة',
        phone: account.phone,
        password: account.password,
        role: 'secretary',
        personName: `${input.firstName} ${input.lastName}`.trim(),
      });
    }
    return { ...account, credentialsWhatsApp };
  },
};
