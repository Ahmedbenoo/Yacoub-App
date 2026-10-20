import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { db } from './db.js';
import { sessionForUser } from './users.js';

function httpError(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('20') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length >= 10) return `+20${digits.slice(1)}`;
  if (digits.startsWith('1') && digits.length === 10) return `+20${digits}`;
  return `+${digits}`;
}

function staffEmail(phone: string, kind: 'doctor' | 'owner'): string {
  return `${phone.replace(/\D/g, '')}@${kind}.clinsync`;
}

async function defaultSlots(doctorId: string): Promise<void> {
  for (let day = 0; day < 7; day += 1) {
    await db.query(
      `INSERT INTO doctor_slots (id, doctor_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, '09:00', '17:00')`,
      [`${doctorId}-day-${day}`, doctorId, day],
    );
  }
}

async function insertUser(input: {
  id: string;
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  try {
    await db.query(
      `INSERT INTO users (
         id, email, phone, password_hash, first_name, last_name, locale, is_email_verified, is_phone_verified
       ) VALUES ($1, $2, $3, $4, $5, $6, 'ar', true, true)`,
      [input.id, input.email, input.phone, await bcrypt.hash(input.password, 10), input.firstName, input.lastName],
    );
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === '23505') throw httpError(409, 'PHONE_EXISTS', 'An account with this phone already exists');
    throw error;
  }
}

async function insertClinic(input: {
  ownerId: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  locationUrl?: string;
  specialty: string;
  openingHours?: string;
  consultationFee?: number;
  placeKind: 'clinic' | 'center';
}): Promise<string> {
  const id = `clinic-${randomUUID()}`;
  await db.query(
    `INSERT INTO clinics (
       id, name, name_ar, slug, phone, street, city, country, country_ar, location_url, specialty,
       opening_hours, consultation_fee, is_active, approval_status, owner_user_id, place_kind
     ) VALUES ($1, $2, $2, $1, $3, $4, $5, 'Egypt', 'مصر', $6, $7, $8, $9, true, 'approved', $10, $11)`,
    [
      id,
      input.name.trim(),
      input.phone,
      input.street.trim() || null,
      input.city.trim() || null,
      input.locationUrl?.trim() || null,
      input.specialty.trim(),
      input.openingHours?.trim() || null,
      input.consultationFee ?? null,
      input.ownerId,
      input.placeKind,
    ],
  );
  return id;
}

async function insertDoctor(
  userId: string,
  clinicId: string,
  clinicName: string,
  phone: string,
  specialty: string,
  email: string,
  firstName: string,
  lastName: string,
  offersHomeVisits = false,
) {
  await db.query(`INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, $3, 'doctor')`, [
    `mem-${userId}-doctor`,
    userId,
    clinicId,
  ]);
  await db.query(
    `INSERT INTO doctors (
       id, user_id, clinic_id, first_name, last_name, email, phone, specialty, branch_id, branch_name, languages, offers_home_visits
     ) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $2, $8, '["Arabic"]', $9)`,
    [userId, clinicId, firstName, lastName, email, phone, specialty, clinicName, offersHomeVisits],
  );
  await defaultSlots(userId);
}

export async function registerOwnerAccount(input: {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  placeKind: 'clinic' | 'center';
  placeName: string;
  clinicName?: string;
  clinicPhone: string;
  street: string;
  city: string;
  locationUrl?: string;
  specialty: string;
  openingHours: string;
  consultationFee: number;
  practices: boolean;
}) {
  const phone = normalizePhone(input.phone);
  if (!/^\+\d{10,15}$/.test(phone)) throw httpError(400, 'VALIDATION_ERROR', 'Phone number is invalid');
  const userId = `user-owner-${randomUUID()}`;
  const email = staffEmail(phone, 'owner');
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  await insertUser({ id: userId, email, phone, password: input.password, firstName, lastName });
  const clinicName = (input.placeKind === 'center' ? input.clinicName || input.placeName : input.placeName).trim();
  const clinicId = await insertClinic({
    ownerId: userId,
    name: clinicName,
    phone: normalizePhone(input.clinicPhone) || input.clinicPhone.trim(),
    street: input.street,
    city: input.city,
    locationUrl: input.locationUrl,
    specialty: input.specialty,
    openingHours: input.openingHours,
    consultationFee: input.consultationFee,
    placeKind: input.placeKind,
  });
  await db.query(`INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, $3, 'admin')`, [
    `mem-${userId}-admin`,
    userId,
    clinicId,
  ]);
  if (input.practices) {
    await insertDoctor(userId, clinicId, clinicName, phone, input.specialty, email, firstName, lastName);
  }
  return sessionForUser(userId);
}

export async function registerDoctorAccount(input: {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  specialty: string;
}) {
  const phone = normalizePhone(input.phone);
  if (!/^\+\d{10,15}$/.test(phone)) throw httpError(400, 'VALIDATION_ERROR', 'Phone number is invalid');
  const userId = `user-doctor-${randomUUID()}`;
  const email = staffEmail(phone, 'doctor');
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const clinicName = `${firstName} ${lastName}`.trim();
  await insertUser({ id: userId, email, phone, password: input.password, firstName, lastName });
  const clinicId = await insertClinic({
    ownerId: userId,
    name: clinicName,
    phone,
    street: '',
    city: '',
    specialty: input.specialty,
    placeKind: 'clinic',
  });
  await db.query(`INSERT INTO memberships (id, user_id, clinic_id, role) VALUES ($1, $2, $3, 'admin')`, [
    `mem-${userId}-admin`,
    userId,
    clinicId,
  ]);
  await insertDoctor(userId, clinicId, clinicName, phone, input.specialty, email, firstName, lastName, true);
  return sessionForUser(userId);
}
