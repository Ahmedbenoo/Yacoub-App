import { z } from 'zod';

import { isValidPhone } from '@/shared/lib/phone';

export const homeNursingRequestSchema = z.object({
  serviceIds: z.array(z.string().min(1)).min(1, 'specialtyRequired'),
  address: z.string().min(4, 'addressRequired'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateRequired'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'timeRequired'),
});

export const nurseRegisterSchema = z
  .object({
    firstName: z.string().min(2, 'firstNameMin'),
    lastName: z.string().min(2, 'lastNameMin'),
    email: z.string().email('invalidEmail'),
    phone: z.string().refine(isValidPhone, 'invalidPhone'),
    proof: z.string().min(4, 'proofRequired'),
    password: z.string().min(8, 'passwordMin'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export type HomeNursingRequestForm = z.infer<typeof homeNursingRequestSchema>;
export type NurseRegisterForm = z.infer<typeof nurseRegisterSchema>;
