export interface DoctorProfile {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  branchId: string;
  branchName: string;
  avatarUrl?: string;
  gender?: 'male' | 'female';
  languages: string[];
  sharePercent?: number;
  isActive?: boolean;
}

export interface DoctorFilters {
  page?: number;
  limit?: number;
  search?: string;
  specialty?: string;
  clinicId?: string;
  allClinics?: boolean;
  includeInactive?: boolean;
}

export interface BookingSlot {
  scheduledAt: string;
  label: string;
}
