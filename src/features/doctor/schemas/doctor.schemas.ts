import { z } from 'zod';

export const visitNotesSchema = z.object({
  chiefComplaint: z.string().min(2, 'chiefComplaintMin'),
  symptoms: z.string().optional(),
  diagnosis: z.string().min(2, 'diagnosisMin'),
  notes: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
});

export const prescriptionSchema = z.object({
  name: z.string().min(2, 'medicationNameMin'),
  dosage: z.string().min(1, 'dosageRequired'),
  frequency: z.string().min(1, 'frequencyRequired'),
  duration: z.string().min(1, 'durationRequired'),
  instructions: z.string().optional(),
});

export const labRequestSchema = z.object({
  type: z.enum(['lab', 'imaging']),
  testName: z.string().min(2, 'testNameMin'),
  priority: z.enum(['routine', 'urgent']),
  notes: z.string().optional(),
});

export type VisitNotesFormData = z.infer<typeof visitNotesSchema>;
export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;
export type LabRequestFormData = z.infer<typeof labRequestSchema>;
