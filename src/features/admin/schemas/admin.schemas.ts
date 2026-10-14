import { z } from 'zod';

import { isValidPhone } from '@/shared/lib/phone';

export const updateDoctorSchema = z.object({
  specialty: z.string().min(1, 'specialtyRequired'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  branchId: z.string().min(1, 'branchRequired'),
  languages: z.string().min(2, 'languagesMin'),
  sharePercent: z
    .string()
    .regex(/^\d+$/, 'specialtyRequired')
    .refine((value) => Number(value) <= 100, 'specialtyRequired'),
});

export const updatePatientSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email('invalidEmail').optional().or(z.literal('')),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
});

export const createDoctorSchema = z.object({
  firstName: z.string().min(2, 'firstNameMin'),
  lastName: z.string().min(2, 'lastNameMin'),
  phone: z.string().refine(isValidPhone, 'invalidPhone'),
  specialty: z.string().min(1, 'specialtyRequired'),
  branchId: z.string().optional(),
  languages: z.string().optional(),
  bio: z.string().optional(),
});

export const createSecretarySchema = z.object({
  firstName: z.string().min(2, 'firstNameMin'),
  lastName: z.string().min(2, 'lastNameMin'),
  phone: z.string().refine(isValidPhone, 'invalidPhone'),
});

export const addClinicSchema = z.object({
  name: z.string().min(2, 'firstNameMin'),
  phone: z.string().refine(isValidPhone, 'invalidPhone'),
  street: z.string().min(2, 'firstNameMin'),
  city: z.string().min(2, 'firstNameMin'),
  locationUrl: z.string().optional(),
  specialty: z.string().min(1, 'specialtyRequired'),
});

const dateOfBirthPattern = /^\d{4}-\d{2}-\d{2}$/;

export const createPatientSchema = z.object({
  firstName: z.string().min(2, 'firstNameMin'),
  lastName: z.string().min(2, 'lastNameMin'),
  email: z.string().email('invalidEmail'),
  phone: z.string().optional(),
  dateOfBirth: z
    .string()
    .regex(dateOfBirthPattern, 'dateOfBirthInvalid')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'dateOfBirthInvalid'),
  gender: z.enum(['male', 'female', 'other']),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
});

export type UpdateDoctorFormData = z.infer<typeof updateDoctorSchema>;
export type UpdatePatientFormData = z.infer<typeof updatePatientSchema>;
export type CreateDoctorFormData = z.infer<typeof createDoctorSchema>;
export type CreatePatientFormData = z.infer<typeof createPatientSchema>;

export function parseCommaList(value?: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
