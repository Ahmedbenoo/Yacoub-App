import { randomUUID } from 'node:crypto';

import { db } from './db.js';
import { absoluteUrl, storeImage, writeSeedImage } from './files.js';

type ClinicRow = {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string | null;
  description: string | null;
  description_ar: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  street: string | null;
  street_ar: string | null;
  city: string | null;
  city_ar: string | null;
  country: string | null;
  country_ar: string | null;
  is_active: boolean;
  approval_status: string | null;
  specialty: string | null;
  location_url: string | null;
  consultation_fee: number | null;
  opening_hours: string | null;
  photo_urls: string | null;
  owner_user_id: string | null;
  place_kind: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicClinic = {
  id: string;
  clinicId: string;
  name: string;
  nameAr?: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  descriptionAr?: string;
  phone: string;
  email: string;
  address: {
    street: string;
    streetAr?: string;
    city: string;
    cityAr?: string;
    country: string;
    countryAr?: string;
  };
  isActive: boolean;
  approvalStatus?: 'pending' | 'approved';
  specialty?: string;
  locationUrl?: string;
  consultationFee?: number;
  openingHours?: string;
  photoUrls?: string[];
  ownerUserId?: string;
  placeKind?: 'clinic' | 'center';
  createdAt: string;
  updatedAt: string;
};

export type ClinicPatch = {
  openingHours?: string;
  consultationFee?: number;
  locationUrl?: string;
  photoUrl?: string;
  coverUrl?: string;
  replacePhotoIndex?: number;
  replacePhotoUrl?: string;
  logoUrl?: string;
};

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function svg(color: string, label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="${color}"/><text x="320" y="188" text-anchor="middle" font-family="Tahoma, Segoe UI, sans-serif" font-size="36" fill="#FFFFFF">${label}</text></svg>`;
}

function readPhotos(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function toPublicClinic(row: ClinicRow, baseUrl: string): PublicClinic {
  const photos = readPhotos(row.photo_urls).map((url) => absoluteUrl(baseUrl, url)).filter((url): url is string => Boolean(url));
  return {
    id: row.id,
    clinicId: row.id,
    name: row.name,
    nameAr: row.name_ar ?? undefined,
    slug: row.slug ?? row.id,
    logoUrl: absoluteUrl(baseUrl, row.logo_url),
    description: row.description ?? undefined,
    descriptionAr: row.description_ar ?? undefined,
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: {
      street: row.street ?? '',
      streetAr: row.street_ar ?? undefined,
      city: row.city ?? '',
      cityAr: row.city_ar ?? undefined,
      country: row.country ?? '',
      countryAr: row.country_ar ?? undefined,
    },
    isActive: row.is_active,
    approvalStatus: row.approval_status === 'pending' ? 'pending' : 'approved',
    specialty: row.specialty ?? undefined,
    locationUrl: row.location_url ?? undefined,
    consultationFee: row.consultation_fee ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    photoUrls: photos,
    ownerUserId: row.owner_user_id ?? undefined,
    placeKind: row.place_kind === 'center' ? 'center' : 'clinic',
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function clinicById(id: string): Promise<ClinicRow | undefined> {
  const result = await db.query<ClinicRow>('SELECT * FROM clinics WHERE id = $1', [id]);
  return result.rows[0];
}

export async function seedClinicDetails(): Promise<void> {
  const logo = writeSeedImage(
    'clinics/clinic-001-logo.svg',
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="40" viewBox="0 0 128 40"><text x="64" y="29" text-anchor="middle" font-family="Tahoma, Segoe UI, sans-serif" font-size="28" font-weight="700" fill="#0F172A">العياده</text></svg>',
  );
  const mainCover = writeSeedImage('clinics/clinic-001-cover.svg', svg('#0F766E', 'الاستقبال'));
  const mainRoom = writeSeedImage('clinics/clinic-001-room.svg', svg('#115E59', 'غرفة الكشف'));
  const northPhoto = writeSeedImage('clinics/clinic-003-cover.svg', svg('#0F766E', 'الفرع الشمالي'));
  const downtownPhoto = writeSeedImage('clinics/clinic-002-cover.svg', svg('#115E59', 'فرع وسط البلد'));

  const profiles = [
    {
      id: 'clinic-001',
      slug: 'main-clinic',
      description: 'Full-service primary care clinic with specialists in cardiology, dermatology, and pediatrics.',
      descriptionAr: 'عيادة رعاية أولية فيها تخصصات القلب والجلدية والأطفال.',
      phone: '+20 2 1234 5678',
      email: 'main@clinic.com',
      logo,
      street: '15 Tahrir Square',
      streetAr: '15 ميدان التحرير',
      city: 'Cairo',
      cityAr: 'القاهرة',
      specialty: 'General Medicine',
      locationUrl: 'https://www.google.com/maps/search/?api=1&query=Tahrir+Square+Cairo',
      fee: 300,
      hours: 'السبت–الخميس، 10:00 ص – 10:00 م',
      photos: [mainCover, mainRoom],
    },
    {
      id: 'clinic-003',
      slug: 'north-branch',
      description: 'North branch offering family medicine and pediatrics.',
      descriptionAr: 'الفرع الشمالي فيه طب أسرة وأطفال.',
      phone: '+20 2 5555 0101',
      email: 'north@clinic.com',
      logo: null,
      street: '8 Abbas El Akkad',
      streetAr: '8 شارع عباس العقاد',
      city: 'Cairo',
      cityAr: 'القاهرة',
      specialty: 'Pediatrics',
      locationUrl: 'https://www.google.com/maps/search/?api=1&query=Abbas+El+Akkad+Cairo',
      fee: 250,
      hours: 'السبت–الخميس، 9:00 ص – 5:00 م',
      photos: [northPhoto],
    },
    {
      id: 'clinic-002',
      slug: 'downtown-branch',
      description: 'Downtown branch offering orthopedics, internal medicine, and same-day appointments.',
      descriptionAr: 'فرع وسط البلد فيه عظام وباطنة، ومواعيد في نفس اليوم.',
      phone: '+20 2 8765 4321',
      email: 'downtown@clinic.com',
      logo: null,
      street: '42 Nile Corniche',
      streetAr: '42 كورنيش النيل',
      city: 'Cairo',
      cityAr: 'القاهرة',
      specialty: 'Orthopedics',
      locationUrl: 'https://www.google.com/maps/search/?api=1&query=Nile+Corniche+Cairo',
      fee: 400,
      hours: 'كل يوم، 12:00 م – 10:00 م',
      photos: [downtownPhoto],
    },
  ];

  for (const clinic of profiles) {
    await db.query(
      `UPDATE clinics
       SET slug = $2,
           description = $3,
           description_ar = $4,
           phone = $5,
           email = $6,
           logo_url = $7,
           street = $8,
           street_ar = $9,
           city = $10,
           city_ar = $11,
           country = 'Egypt',
           country_ar = 'مصر',
           is_active = true,
           approval_status = 'approved',
           specialty = $12,
           location_url = $13,
           consultation_fee = $14,
           opening_hours = $15,
           photo_urls = $16,
           updated_at = now()
       WHERE id = $1 AND street IS NULL`,
      [
        clinic.id,
        clinic.slug,
        clinic.description,
        clinic.descriptionAr,
        clinic.phone,
        clinic.email,
        clinic.logo,
        clinic.street,
        clinic.streetAr,
        clinic.city,
        clinic.cityAr,
        clinic.specialty,
        clinic.locationUrl,
        clinic.fee,
        clinic.hours,
        JSON.stringify(clinic.photos),
      ],
    );
  }
}

export async function listClinicsForUser(userId: string, baseUrl: string): Promise<PublicClinic[]> {
  const result = await db.query<ClinicRow>(
    `SELECT * FROM clinics
     WHERE id IN (SELECT clinic_id FROM memberships WHERE user_id = $1)
       AND (is_active = true OR owner_user_id = $1)
     ORDER BY created_at`,
    [userId],
  );
  return result.rows.map((row) => toPublicClinic(row, baseUrl));
}

export async function getClinic(id: string, baseUrl: string): Promise<PublicClinic> {
  const row = await clinicById(id);
  if (!row || !row.is_active) throw httpError(404, 'NOT_FOUND', 'Clinic not found');
  return toPublicClinic(row, baseUrl);
}

export async function searchClinics(
  filters: { search?: string; city?: string; page?: number; limit?: number },
  baseUrl: string,
): Promise<{ data: PublicClinic[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const search = filters.search?.trim() ?? '';
  const city = filters.city?.trim() ?? '';
  const like = `%${search}%`;
  const where = `is_active = true
    AND approval_status = 'approved'
    AND ($1 = '' OR name ILIKE $2 OR name_ar ILIKE $2 OR city ILIKE $2 OR city_ar ILIKE $2)
    AND ($3 = '' OR city = $3 OR city_ar = $3)`;
  const params = [search, like, city];
  const totalResult = await db.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM clinics WHERE ${where}`,
    params,
  );
  const total = Number(totalResult.rows[0]?.total ?? 0);
  const result = await db.query<ClinicRow>(
    `SELECT * FROM clinics
     WHERE ${where}
     ORDER BY created_at
     LIMIT $4 OFFSET $5`,
    [...params, limit, (page - 1) * limit],
  );
  return {
    data: result.rows.map((row) => toPublicClinic(row, baseUrl)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function requireClinicAdmin(userId: string, clinicId: string): Promise<ClinicRow> {
  const clinic = await clinicById(clinicId);
  if (!clinic) throw httpError(404, 'NOT_FOUND', 'Clinic not found');
  const membership = await db.query<{ role: string }>(
    `SELECT role FROM memberships WHERE user_id = $1 AND clinic_id = $2 AND role = 'admin'`,
    [userId, clinicId],
  );
  if (!membership.rows[0]) throw httpError(403, 'FORBIDDEN', 'Only the clinic admin can edit this page');
  return clinic;
}

export async function updateClinic(userId: string, clinicId: string, patch: ClinicPatch, baseUrl: string): Promise<PublicClinic> {
  const clinic = await requireClinicAdmin(userId, clinicId);
  const folder = `clinics/${clinicId}`;
  let photos = readPhotos(clinic.photo_urls);
  let logo = clinic.logo_url;
  let openingHours = clinic.opening_hours;
  let fee = clinic.consultation_fee;
  let locationUrl = clinic.location_url;

  if (patch.openingHours !== undefined) openingHours = patch.openingHours.trim();
  if (patch.consultationFee !== undefined) fee = patch.consultationFee;
  if (patch.locationUrl !== undefined) locationUrl = patch.locationUrl.trim() || null;
  if (patch.logoUrl) logo = storeImage(patch.logoUrl, folder);
  if (patch.photoUrl) photos = [...photos, storeImage(patch.photoUrl, folder)];
  if (patch.replacePhotoUrl !== undefined && patch.replacePhotoIndex != null) {
    if (patch.replacePhotoIndex >= 0 && patch.replacePhotoIndex < photos.length) {
      photos = photos.map((url, index) => (index === patch.replacePhotoIndex ? storeImage(patch.replacePhotoUrl!, folder) : url));
    }
  }
  if (patch.coverUrl) {
    const cover = storeImage(patch.coverUrl, folder);
    photos = photos.length ? [cover, ...photos.slice(1)] : [cover];
  }

  await db.query(
    `UPDATE clinics
     SET opening_hours = $2,
         consultation_fee = $3,
         location_url = $4,
         logo_url = $5,
         photo_urls = $6,
         updated_at = now()
     WHERE id = $1`,
    [clinicId, openingHours, fee, locationUrl, logo, JSON.stringify(photos)],
  );

  return getClinic(clinicId, baseUrl);
}

export async function deactivateClinic(userId: string, clinicId: string): Promise<void> {
  await requireClinicAdmin(userId, clinicId);
  await db.query('UPDATE clinics SET is_active = false, updated_at = now() WHERE id = $1', [clinicId]);
  await db.query('UPDATE doctors SET is_active = false, updated_at = now() WHERE clinic_id = $1', [clinicId]);
}

export async function seedClinicOwners(): Promise<void> {
  const clinics = await db.query<{ id: string }>('SELECT id FROM clinics WHERE owner_user_id IS NULL');
  for (const clinic of clinics.rows) {
    const admin = await db.query<{ user_id: string }>(
      `SELECT user_id FROM memberships WHERE clinic_id = $1 AND role = 'admin' LIMIT 1`,
      [clinic.id],
    );
    if (!admin.rows[0]) continue;
    await db.query('UPDATE clinics SET owner_user_id = $2 WHERE id = $1 AND owner_user_id IS NULL', [
      clinic.id,
      admin.rows[0].user_id,
    ]);
  }
}

export async function addOwnerClinic(
  userId: string,
  input: { name: string; phone: string; street: string; city: string; locationUrl?: string; specialty: string },
  baseUrl: string,
): Promise<PublicClinic> {
  const owned = await db.query<{ id: string }>('SELECT id FROM clinics WHERE owner_user_id = $1 AND is_active = true', [userId]);
  if (!owned.rows[0]) throw httpError(403, 'NOT_A_CENTER', 'Only a clinic owner can add another branch');
  const id = `clinic-${randomUUID()}`;
  await db.query(`UPDATE clinics SET place_kind = 'center' WHERE owner_user_id = $1`, [userId]);
  await db.query(
    `INSERT INTO clinics (
       id, name, name_ar, phone, street, city, location_url, specialty, is_active, approval_status, owner_user_id, place_kind
     ) VALUES ($1, $2, $2, $3, $4, $5, $6, $7, false, 'pending', $8, 'center')`,
    [id, input.name.trim(), input.phone.trim(), input.street.trim(), input.city.trim(), input.locationUrl?.trim() || null, input.specialty.trim(), userId],
  );
  await db.query(
    `INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (user_id, clinic_id, role) DO NOTHING`,
    [`mem-${id}`, userId, id],
  );
  const row = await clinicById(id);
  return toPublicClinic(row!, baseUrl);
}

export async function listPendingClinics(userId: string, baseUrl: string): Promise<PublicClinic[]> {
  const result = await db.query<ClinicRow>(
    `SELECT * FROM clinics WHERE owner_user_id = $1 AND approval_status = 'pending' ORDER BY created_at`,
    [userId],
  );
  return result.rows.map((row) => toPublicClinic(row, baseUrl));
}

export async function approveClinic(userId: string, clinicId: string, baseUrl: string): Promise<PublicClinic> {
  const row = await clinicById(clinicId);
  if (!row || row.owner_user_id !== userId) throw httpError(403, 'FORBIDDEN', 'Only the owner can approve this branch');
  await db.query(
    `UPDATE clinics SET approval_status = 'approved', is_active = true, updated_at = now() WHERE id = $1`,
    [clinicId],
  );
  return getClinic(clinicId, baseUrl);
}

export async function listClinicCities(): Promise<string[]> {
  const result = await db.query<{ name: string }>(
    `SELECT DISTINCT name FROM (
       SELECT city AS name FROM clinics WHERE is_active = true AND city IS NOT NULL AND btrim(city) <> ''
       UNION
       SELECT city_ar AS name FROM clinics WHERE is_active = true AND city_ar IS NOT NULL AND btrim(city_ar) <> ''
     ) cities
     ORDER BY name`,
  );
  return result.rows.map((row) => row.name);
}
