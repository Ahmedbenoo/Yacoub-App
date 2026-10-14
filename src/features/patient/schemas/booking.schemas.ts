import { z } from 'zod';

export const bookingSchema = z.object({
  scheduledAt: z.string().min(1, 'slotRequired'),
  reason: z.string().min(3, 'reasonMin'),
  notes: z.string().optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
