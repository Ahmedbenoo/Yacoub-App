import type { Clinic, ClinicFilters, PaginatedResponse } from '@/shared/types/models';
import { clinicPhotoDataUrl } from '@/shared/lib/clinic-photo';
import { sleep } from '@/shared/lib/utils';

import { TEST_CLINIC_LOGO_URL } from './clinic-logo';
import { MOCK_CLINIC_IDS } from './constants';

const now = new Date().toISOString();

const mockClinics: Clinic[] = [
  {
    id: MOCK_CLINIC_IDS.MAIN,
    clinicId: MOCK_CLINIC_IDS.MAIN,
    name: 'Clinsync Main Clinic',
    nameAr: 'العيادة الرئيسية',
    slug: 'main-clinic',
    description: 'Full-service primary care clinic with specialists in cardiology, dermatology, and pediatrics.',
    descriptionAr: 'عيادة رعاية أولية فيها تخصصات القلب والجلدية والأطفال.',
    phone: '+20 2 1234 5678',
    email: 'main@clinic.com',
    logoUrl: TEST_CLINIC_LOGO_URL,
    address: {
      street: '15 Tahrir Square',
      streetAr: '15 ميدان التحرير',
      city: 'Cairo',
      cityAr: 'القاهرة',
      country: 'Egypt',
      countryAr: 'مصر',
    },
    isActive: true,
    specialty: 'General Medicine',
    consultationFee: 300,
    openingHours: 'السبت–الخميس، 10:00 ص – 10:00 م',
    locationUrl: 'https://www.google.com/maps/search/?api=1&query=Tahrir+Square+Cairo',
    photoUrls: [
      clinicPhotoDataUrl('#0F766E', 'الاستقبال'),
      clinicPhotoDataUrl('#115E59', 'غرفة الكشف'),
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: MOCK_CLINIC_IDS.NORTH,
    clinicId: MOCK_CLINIC_IDS.NORTH,
    name: 'North Branch',
    nameAr: 'الفرع الشمالي',
    slug: 'north-branch',
    description: 'North branch offering family medicine and pediatrics.',
    descriptionAr: 'الفرع الشمالي فيه طب أسرة وأطفال.',
    phone: '+20 2 5555 0101',
    email: 'north@clinic.com',
    address: {
      street: '8 Abbas El Akkad',
      streetAr: '8 شارع عباس العقاد',
      city: 'Cairo',
      cityAr: 'القاهرة',
      country: 'Egypt',
      countryAr: 'مصر',
    },
    isActive: true,
    specialty: 'Pediatrics',
    consultationFee: 250,
    openingHours: 'السبت–الخميس، 9:00 ص – 5:00 م',
    locationUrl: 'https://www.google.com/maps/search/?api=1&query=Abbas+El+Akkad+Cairo',
    photoUrls: [clinicPhotoDataUrl('#0F766E', 'الفرع الشمالي')],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: MOCK_CLINIC_IDS.DOWNTOWN,
    clinicId: MOCK_CLINIC_IDS.DOWNTOWN,
    name: 'Downtown Branch',
    nameAr: 'فرع وسط البلد',
    slug: 'downtown-branch',
    description: 'Downtown branch offering orthopedics, internal medicine, and same-day appointments.',
    descriptionAr: 'فرع وسط البلد فيه عظام وباطنة، ومواعيد في نفس اليوم.',
    phone: '+20 2 8765 4321',
    email: 'downtown@clinic.com',
    address: {
      street: '42 Nile Corniche',
      streetAr: '42 كورنيش النيل',
      city: 'Cairo',
      cityAr: 'القاهرة',
      country: 'Egypt',
      countryAr: 'مصر',
    },
    isActive: true,
    specialty: 'Orthopedics',
    consultationFee: 400,
    openingHours: 'كل يوم، 12:00 م – 10:00 م',
    locationUrl: 'https://www.google.com/maps/search/?api=1&query=Nile+Corniche+Cairo',
    photoUrls: [clinicPhotoDataUrl('#115E59', 'فرع وسط البلد')],
    createdAt: now,
    updatedAt: now,
  },
];

interface ClinicOrganization {
  id: string;
  name: string;
  ownerUserId: string;
}

const organizations: ClinicOrganization[] = [];

const userClinicIds: Record<string, string[]> = {
  'user-doctor-001': [MOCK_CLINIC_IDS.MAIN],
  'user-patient-001': [MOCK_CLINIC_IDS.MAIN],
  'user-admin-001': [MOCK_CLINIC_IDS.MAIN, MOCK_CLINIC_IDS.NORTH, MOCK_CLINIC_IDS.DOWNTOWN],
  'user-multi-001': [MOCK_CLINIC_IDS.MAIN, MOCK_CLINIC_IDS.NORTH, MOCK_CLINIC_IDS.DOWNTOWN],
  'user-secretary-001': [MOCK_CLINIC_IDS.MAIN],
  'user-doctor-007': [MOCK_CLINIC_IDS.MAIN],
};

function filterClinics(filters: ClinicFilters): Clinic[] {
  let result = mockClinics.filter((clinic) => clinic.isActive);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (clinic) =>
        clinic.name.toLowerCase().includes(q) ||
        clinic.nameAr?.toLowerCase().includes(q) ||
        clinic.address.city.toLowerCase().includes(q),
    );
  }

  if (filters.city) {
    result = result.filter((clinic) => clinic.address.city === filters.city);
  }

  return result;
}

export function getMockClinicById(id: string): Clinic | undefined {
  return mockClinics.find((clinic) => clinic.id === id);
}

export function listMockClinicsMainFirst(): Clinic[] {
  const active = mockClinics.filter((clinic) => clinic.isActive);
  const main = active.filter((clinic) => clinic.id === MOCK_CLINIC_IDS.MAIN);
  const rest = active.filter((clinic) => clinic.id !== MOCK_CLINIC_IDS.MAIN);
  return [...main, ...rest];
}

export function assignUserClinic(userId: string, clinicId: string) {
  const current = userClinicIds[userId] ?? [];
  if (!current.includes(clinicId)) {
    userClinicIds[userId] = [...current, clinicId];
  }
}

export function listAssignedClinicIds(userId: string): string[] {
  return userClinicIds[userId] ?? [];
}

export function ownerHasCenter(userId: string): boolean {
  return organizations.some((organization) => organization.ownerUserId === userId);
}

function buildClinic(input: {
  ownerUserId: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  locationUrl?: string;
  specialty: string;
  openingHours?: string;
  consultationFee?: number;
  organizationId?: string;
}): Clinic {
  const now = new Date().toISOString();
  const id = `clinic-${Date.now()}`;

  return {
    id,
    clinicId: id,
    name: input.name,
    slug: id,
    phone: input.phone,
    email: '',
    address: {
      street: input.street,
      city: input.city,
      country: 'Egypt',
    },
    isActive: true,
    specialty: input.specialty,
    openingHours: input.openingHours?.trim() || undefined,
    consultationFee: input.consultationFee,
    locationUrl: input.locationUrl?.trim() || undefined,
    organizationId: input.organizationId,
    ownerUserId: input.ownerUserId,
    createdAt: now,
    updatedAt: now,
  };
}

export function createOwnedPlace(input: {
  ownerUserId: string;
  placeKind: 'clinic' | 'center';
  placeName: string;
  clinicName?: string;
  phone: string;
  street: string;
  city: string;
  locationUrl?: string;
  specialty: string;
  openingHours?: string;
  consultationFee?: number;
}): Clinic {
  let organizationId: string | undefined;

  if (input.placeKind === 'center') {
    organizationId = `org-${Date.now()}`;
    organizations.push({
      id: organizationId,
      name: input.placeName,
      ownerUserId: input.ownerUserId,
    });
  }

  const clinic = buildClinic({
    ownerUserId: input.ownerUserId,
    name: input.placeKind === 'center' ? input.clinicName || input.placeName : input.placeName,
    phone: input.phone,
    street: input.street,
    city: input.city,
    locationUrl: input.locationUrl,
    specialty: input.specialty,
    openingHours: input.openingHours,
    consultationFee: input.consultationFee,
    organizationId,
  });

  mockClinics.push(clinic);
  assignUserClinic(input.ownerUserId, clinic.id);
  return clinic;
}

export function addClinicForOwner(input: {
  ownerUserId: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  locationUrl?: string;
  specialty: string;
}): Clinic {
  const organization = organizations.find((item) => item.ownerUserId === input.ownerUserId);
  if (!organization) {
    throw { code: 'NOT_A_CENTER', message: 'Only a center owner can add another clinic' };
  }

  const clinic = buildClinic({
    ...input,
    organizationId: organization.id,
  });
  clinic.isActive = false;
  clinic.approvalStatus = 'pending';
  mockClinics.push(clinic);
  assignUserClinic(input.ownerUserId, clinic.id);
  return clinic;
}

export function ownerClinicCount(ownerUserId: string): number {
  return mockClinics.filter(
    (clinic) => clinic.ownerUserId === ownerUserId && clinic.approvalStatus !== 'pending',
  ).length;
}

export function listPendingClinics(ownerUserId: string): Clinic[] {
  return mockClinics.filter(
    (clinic) => clinic.ownerUserId === ownerUserId && clinic.approvalStatus === 'pending',
  );
}

export function approveClinic(id: string): Clinic {
  const clinic = mockClinics.find((item) => item.id === id);
  if (!clinic) throw { code: 'NOT_FOUND', message: 'Clinic not found' };
  clinic.isActive = true;
  clinic.approvalStatus = 'approved';
  clinic.updatedAt = new Date().toISOString();
  return clinic;
}

export function updateClinicListing(
  clinicId: string,
  patch: {
    openingHours?: string;
    consultationFee?: number;
    locationUrl?: string;
    photoUrl?: string;
    coverUrl?: string;
    replacePhotoIndex?: number;
    replacePhotoUrl?: string;
  },
): Clinic {
  const clinic = mockClinics.find((item) => item.id === clinicId);
  if (!clinic) throw { code: 'NOT_FOUND', message: 'Clinic not found' };
  if (patch.openingHours !== undefined) clinic.openingHours = patch.openingHours.trim();
  if (patch.consultationFee !== undefined) clinic.consultationFee = patch.consultationFee;
  if (patch.locationUrl !== undefined) clinic.locationUrl = patch.locationUrl.trim() || undefined;
  if (patch.photoUrl) clinic.photoUrls = [...(clinic.photoUrls ?? []), patch.photoUrl];
  if (patch.replacePhotoUrl && patch.replacePhotoIndex != null) {
    const photos = [...(clinic.photoUrls ?? [])];
    if (patch.replacePhotoIndex >= 0 && patch.replacePhotoIndex < photos.length) {
      photos[patch.replacePhotoIndex] = patch.replacePhotoUrl;
      clinic.photoUrls = photos;
    }
  }
  if (patch.coverUrl) {
    const photos = clinic.photoUrls ?? [];
    clinic.photoUrls = photos.length ? [patch.coverUrl, ...photos.slice(1)] : [patch.coverUrl];
  }
  clinic.updatedAt = new Date().toISOString();
  return clinic;
}

export function setClinicLogo(clinicId: string, logoUrl: string): Clinic {
  const clinic = mockClinics.find((item) => item.id === clinicId);
  if (!clinic) throw { code: 'NOT_FOUND', message: 'Clinic not found' };
  clinic.logoUrl = logoUrl;
  clinic.updatedAt = new Date().toISOString();
  return clinic;
}

export const mockClinicsService = {
  async listForUser(userId: string): Promise<Clinic[]> {
    await sleep(300);
    const ids = listAssignedClinicIds(userId);
    return mockClinics.filter((clinic) => ids.includes(clinic.id) && clinic.isActive);
  },

  async search(filters: ClinicFilters = {}): Promise<PaginatedResponse<Clinic>> {
    await sleep(400);
    const filtered = filterClinics(filters);
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

  async getById(id: string): Promise<Clinic | null> {
    await sleep(200);
    return mockClinics.find((clinic) => clinic.id === id) ?? null;
  },

  getCities: (): string[] => [...new Set(mockClinics.map((clinic) => clinic.address.city))],
};
