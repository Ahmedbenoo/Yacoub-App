import { z } from 'zod';

import { isValidPhone } from '@/shared/lib/phone';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'identifierRequired'),
  password: z.string().min(8, 'passwordMin'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'firstNameMin'),
    lastName: z.string().min(2, 'lastNameMin'),
    phone: z.string().refine(isValidPhone, 'invalidPhone'),
    password: z.string().min(8, 'passwordMin'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export const bookingAuthSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().refine(isValidPhone, 'invalidPhone'),
  password: z.string().min(8, 'passwordMin'),
});

export const forgotPasswordSchema = z.object({
  phone: z.string().min(8, 'invalidPhone'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(8, 'invalidPhone'),
  otp: z.string().length(6, 'otpLength'),
});

export const resendOtpSchema = z.object({
  phone: z.string().min(8, 'invalidPhone'),
});

export const resetPasswordSchema = z
  .object({
    phone: z.string().min(8, 'invalidPhone'),
    resetToken: z.string().min(1, 'resetTokenRequired'),
    password: z.string().min(8, 'passwordMin'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'firstNameMin'),
  lastName: z.string().min(2, 'lastNameMin'),
  phone: z.string().optional(),
  avatarUrl: z.string().optional().or(z.literal('')),
  signatureUrl: z.string().optional().or(z.literal('')),
  stampUrl: z.string().optional().or(z.literal('')),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, 'passwordMin'),
    password: z.string().min(8, 'passwordMin'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.password, {
    message: 'passwordSameAsCurrent',
    path: ['password'],
  });

export const registerDoctorSchema = z
  .object({
    firstName: z.string().min(2, 'firstNameMin'),
    lastName: z.string().min(2, 'lastNameMin'),
    email: z.string().email('invalidEmail'),
    phone: z.string().refine(isValidPhone, 'invalidPhone'),
    gender: z.enum(['male', 'female'], { message: 'genderRequired' }),
    password: z.string().min(8, 'passwordMin'),
    confirmPassword: z.string(),
    specialty: z.string().min(1, 'specialtyRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export const registerOwnerSchema = z
  .object({
    placeKind: z.enum(['clinic', 'center']),
    firstName: z.string().min(2, 'firstNameMin'),
    lastName: z.string().min(2, 'lastNameMin'),
    email: z.string().email('invalidEmail'),
    phone: z.string().refine(isValidPhone, 'invalidPhone'),
    gender: z.enum(['male', 'female'], { message: 'genderRequired' }),
    password: z.string().min(8, 'passwordMin'),
    confirmPassword: z.string(),
    placeName: z.string().min(2, 'firstNameMin'),
    clinicName: z.string().optional(),
    clinicPhone: z.string().refine(isValidPhone, 'invalidPhone'),
    street: z.string().min(2, 'firstNameMin'),
    city: z.string().min(2, 'firstNameMin'),
    locationUrl: z.string().optional(),
    specialty: z.string().min(1, 'specialtyRequired'),
    openingHours: z.string().min(2, 'firstNameMin'),
    consultationFee: z.string().regex(/^\d+$/, 'firstNameMin'),
    practices: z.enum(['yes', 'no']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  })
  .refine((data) => data.placeKind === 'clinic' || Boolean(data.clinicName && data.clinicName.trim().length >= 2), {
    message: 'firstNameMin',
    path: ['clinicName'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterDoctorFormData = z.infer<typeof registerDoctorSchema>;
export type RegisterOwnerFormData = z.infer<typeof registerOwnerSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type BookingAuthFormData = z.infer<typeof bookingAuthSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type ResendOtpFormData = z.infer<typeof resendOtpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export type ResetPasswordPayload = ResetPasswordFormData;
