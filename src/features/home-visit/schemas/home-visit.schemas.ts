import { z } from 'zod';

export const homeVisitRequestSchema = z.object({
  specialty: z.string().min(1, 'specialtyRequired'),
  address: z.string().min(4, 'addressRequired'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateRequired'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'timeRequired'),
  notes: z.string().optional(),
});

export type HomeVisitRequestForm = z.infer<typeof homeVisitRequestSchema>;
