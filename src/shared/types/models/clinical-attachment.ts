export interface ClinicalAttachment {
  id: string;
  patientId: string;
  clinicId: string;
  visitId?: string;
  labRequestId?: string;
  pregnancyId?: string;
  childPatientId?: string;
  mediaType: string;
  fileName?: string;
  /** In-memory data URL for the mock session. This is not an uploaded file. */
  dataUrl: string;
  patientVisible: boolean;
  createdByUserId: string;
  createdAt: string;
}

export interface AddClinicalAttachmentInput {
  visitId: string;
  labRequestId?: string;
  pregnancyId?: string;
  dataUrl: string;
  mediaType: string;
  fileName?: string;
  patientVisible: boolean;
}
