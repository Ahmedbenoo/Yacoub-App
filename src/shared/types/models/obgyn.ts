export type PregnancyStatus = 'active' | 'delivered' | 'ended';

export type ObgynEncounterKind = 'gynecology' | 'obstetric';

export type MenstrualRegularity = 'regular' | 'irregular' | 'absent';

export type FetalMovement = 'present' | 'absent' | 'not_applicable';

export interface PregnancyRecord {
  id: string;
  patientId: string;
  clinicId: string;
  authorUserId: string;
  status: PregnancyStatus;
  lmp: string;
  edd?: string;
  gravida?: number;
  para?: number;
  riskNotes?: string;
  outcome?: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePregnancyInput {
  lmp: string;
  edd?: string;
  gravida?: number;
  para?: number;
  riskNotes?: string;
}

export type PregnancyCloseKind = 'live_birth' | 'ended';

export interface ClosePregnancyInput {
  outcomeKind: PregnancyCloseKind;
  outcome: string;
  childFirstName?: string;
  childGender?: 'male' | 'female';
}

export interface ObgynEncounter {
  id: string;
  visitId: string;
  patientId: string;
  authorUserId: string;
  kind: ObgynEncounterKind;
  pregnancyId?: string;
  lmp?: string;
  cycleLengthDays?: number;
  bleedingDays?: number;
  regularity?: MenstrualRegularity;
  gravida?: number;
  para?: number;
  abortions?: number;
  living?: number;
  relevantHistory?: string;
  currentMedicationsNote?: string;
  abdomen?: string;
  breast?: string;
  speculum?: string;
  pelvic?: string;
  assessment?: string;
  plan?: string;
  followUpNote?: string;
  gestationalAgeWeeks?: number;
  fundalHeightCm?: number;
  fetalHeartRate?: number;
  fetalMovement?: FetalMovement;
  presentation?: string;
  ultrasoundLabRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveObgynEncounterInput {
  kind: ObgynEncounterKind;
  pregnancyId?: string;
  lmp?: string;
  cycleLengthDays?: number;
  bleedingDays?: number;
  regularity?: MenstrualRegularity;
  gravida?: number;
  para?: number;
  abortions?: number;
  living?: number;
  relevantHistory?: string;
  currentMedicationsNote?: string;
  abdomen?: string;
  breast?: string;
  speculum?: string;
  pelvic?: string;
  assessment?: string;
  plan?: string;
  followUpNote?: string;
  gestationalAgeWeeks?: number;
  fundalHeightCm?: number;
  fetalHeartRate?: number;
  fetalMovement?: FetalMovement;
  presentation?: string;
  ultrasoundLabRequestId?: string;
}

export interface PriorObgynMeasurement {
  visitId: string;
  startedAt: string;
  gestationalAgeWeeks?: number;
  fundalHeightCm?: number;
  fetalHeartRate?: number;
  bloodPressure?: string;
  weight?: number;
}

export interface ObgynVisitSummary {
  visitId: string;
  kind: ObgynEncounterKind;
  gestationalAgeWeeks?: number;
  fetalHeartRate?: number;
  fetalMovement?: FetalMovement;
  edd?: string;
  lmp?: string;
  pregnancyStatus?: PregnancyStatus;
  outcome?: string;
  plan?: string;
  followUpNote?: string;
}
