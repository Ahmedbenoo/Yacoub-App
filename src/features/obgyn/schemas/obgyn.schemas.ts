import { z } from 'zod';

export const pregnancyCreateSchema = z.object({
  lmp: z.string().min(8, 'lmpRequired'),
  edd: z.string().optional(),
  gravida: z.string().optional(),
  para: z.string().optional(),
  riskNotes: z.string().optional(),
});

export const pregnancyCloseSchema = z
  .object({
    outcomeKind: z.enum(['live_birth', 'ended']),
    outcome: z.string().min(2, 'outcomeRequired'),
    childFirstName: z.string().optional(),
    childGender: z.enum(['male', 'female']).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.outcomeKind === 'live_birth' && !value.childFirstName?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['childFirstName'], message: 'childNameRequired' });
    }
    if (value.outcomeKind === 'live_birth' && !value.childGender) {
      ctx.addIssue({ code: 'custom', path: ['childGender'], message: 'childGenderRequired' });
    }
  });

export const obgynEncounterSchema = z
  .object({
    kind: z.enum(['gynecology', 'obstetric']),
    pregnancyId: z.string().optional(),
    lmp: z.string().optional(),
    cycleLengthDays: z.string().optional(),
    bleedingDays: z.string().optional(),
    regularity: z.enum(['regular', 'irregular', 'absent']).optional(),
    gravida: z.string().optional(),
    para: z.string().optional(),
    abortions: z.string().optional(),
    living: z.string().optional(),
    relevantHistory: z.string().optional(),
    currentMedicationsNote: z.string().optional(),
    abdomen: z.string().optional(),
    breast: z.string().optional(),
    speculum: z.string().optional(),
    pelvic: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
    followUpNote: z.string().optional(),
    gestationalAgeWeeks: z.string().optional(),
    fundalHeightCm: z.string().optional(),
    fetalHeartRate: z.string().optional(),
    fetalMovement: z.enum(['present', 'absent', 'not_applicable']).optional(),
    presentation: z.string().optional(),
    ultrasoundLabRequestId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'obstetric' && !value.pregnancyId) {
      ctx.addIssue({ code: 'custom', path: ['pregnancyId'], message: 'pregnancyRequired' });
    }
    if (value.kind === 'gynecology' && value.regularity && value.regularity !== 'absent' && !value.lmp?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['lmp'], message: 'lmpRequired' });
    }
    const weeks = Number(value.gestationalAgeWeeks);
    if (value.kind === 'obstetric' && Number.isFinite(weeks) && weeks >= 20 && !value.fetalMovement) {
      ctx.addIssue({ code: 'custom', path: ['fetalMovement'], message: 'fetalMovementRequired' });
    }
  });

export const ultrasoundSchema = z.object({
  gestationalAgeByUltrasound: z.string().optional(),
  fetalHeartActivity: z.string().optional(),
  placenta: z.string().optional(),
  amnioticFluid: z.string().optional(),
  presentation: z.string().optional(),
  impression: z.string().min(2, 'impressionRequired'),
});

export type PregnancyCreateForm = z.infer<typeof pregnancyCreateSchema>;
export type PregnancyCloseForm = z.infer<typeof pregnancyCloseSchema>;
export type ObgynEncounterForm = z.infer<typeof obgynEncounterSchema>;
export type UltrasoundForm = z.infer<typeof ultrasoundSchema>;
