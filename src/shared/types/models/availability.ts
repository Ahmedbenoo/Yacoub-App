export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface DoctorAvailability {
  doctorId: string;
  branchId: string;
  branchName: string;
  slotMinutes: number;
  takenSlots: string[];
  slots: AvailabilitySlot[];
}

export interface UpdateAvailabilityPayload {
  slots: AvailabilitySlot[];
  slotMinutes?: number;
}
