import { Locale, PrescriptionStatus } from '../enums';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  frequencyAr?: string;
  duration: string;
  durationAr?: string;
  instructions?: string;
  instructionsAr?: string;
}

export interface Prescription {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  /** Frozen when the prescription is issued, so each clinic keeps its own sheet. */
  number?: string;
  clinicId?: string;
  clinicName?: string;
  clinicNameAr?: string;
  clinicLogoUrl?: string;
  doctorSignatureUrl?: string;
  doctorStampUrl?: string;
  medications: Medication[];
  instructions?: string;
  instructionsAr?: string;
  status: PrescriptionStatus;
  issuedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreatePrescriptionPayload {
  visitId: string;
  medications: Medication[];
  instructions?: string;
}

export interface UpdatePrescriptionPayload {
  medications: Medication[];
  instructions?: string;
}

export function isPrescriptionDeleted(prescription: Prescription): boolean {
  return Boolean(prescription.deletedAt);
}

/** Patient and secretary read this same issued record. Drafts and soft-deleted rows are hidden. */
export function isIssuedVisiblePrescription(prescription: Prescription): boolean {
  return prescription.status === PrescriptionStatus.ISSUED && !isPrescriptionDeleted(prescription);
}

export function getPrescriptionDisplayDate(prescription: Prescription): string {
  return prescription.issuedAt ?? prescription.updatedAt ?? prescription.createdAt;
}

export function localizedMedicationText(
  english: string | undefined,
  arabic: string | undefined,
  locale: string,
) {
  if (locale === Locale.AR) return arabic || english || '';
  return english || arabic || '';
}
