export interface UltrasoundReport {
  id: string;
  labRequestId: string;
  visitId: string;
  pregnancyId?: string;
  authorUserId: string;
  gestationalAgeByUltrasound?: string;
  fetalHeartActivity?: string;
  placenta?: string;
  amnioticFluid?: string;
  presentation?: string;
  impression?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveUltrasoundInput {
  gestationalAgeByUltrasound?: string;
  fetalHeartActivity?: string;
  placenta?: string;
  amnioticFluid?: string;
  presentation?: string;
  impression?: string;
}
