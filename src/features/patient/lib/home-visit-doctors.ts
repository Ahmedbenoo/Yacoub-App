import { findClinicSpecialty, isHomeVisitSpecialty } from '@/shared/catalog/clinic-specialties';
import type { DoctorProfile } from '@/shared/types/models/doctor';

const HOME_VISIT_BRANCH = 'كشف منزلي';

export const HOME_VISIT_CATALOG_DOCTORS: DoctorProfile[] = [
  {
    id: 'hv-doc-generalMedicine',
    clinicId: 'home-visit',
    firstName: 'أحمد',
    lastName: 'منصور',
    email: 'home.gp@munjez.med',
    phone: '+201011110001',
    specialty: 'General Medicine',
    offersHomeVisits: true,
    bio: 'طبيب باطنة عامة للكشف المنزلي والمتابعة الدورية.',
    rating: 4.8,
    reviewCount: 64,
    yearsExperience: 12,
    branchId: 'home-visit',
    branchName: HOME_VISIT_BRANCH,
    gender: 'male',
    languages: ['Arabic', 'English'],
  },
  {
    id: 'hv-doc-internalMedicine',
    clinicId: 'home-visit',
    firstName: 'هناء',
    lastName: 'مصطفى',
    email: 'home.internal@munjez.med',
    phone: '+201011110002',
    specialty: 'Internal Medicine',
    offersHomeVisits: true,
    bio: 'طبيبة باطنة للكشف المنزلي ومتابعة الأمراض المزمنة.',
    rating: 4.7,
    reviewCount: 51,
    yearsExperience: 10,
    branchId: 'home-visit',
    branchName: HOME_VISIT_BRANCH,
    gender: 'female',
    languages: ['Arabic', 'English'],
  },
  {
    id: 'hv-doc-urology',
    clinicId: 'home-visit',
    firstName: 'كريم',
    lastName: 'عادل',
    email: 'home.urology@munjez.med',
    phone: '+201011110003',
    specialty: 'Urology',
    offersHomeVisits: true,
    bio: 'طبيب مسالك بولية للكشف المنزلي.',
    rating: 4.6,
    reviewCount: 38,
    yearsExperience: 9,
    branchId: 'home-visit',
    branchName: HOME_VISIT_BRANCH,
    gender: 'male',
    languages: ['Arabic', 'English'],
  },
  {
    id: 'hv-doc-physiotherapy',
    clinicId: 'home-visit',
    firstName: 'نورا',
    lastName: 'حسن',
    email: 'home.physio@munjez.med',
    phone: '+201011110004',
    specialty: 'Physiotherapy',
    offersHomeVisits: true,
    bio: 'أخصائية علاج طبيعي للجلسات المنزلية.',
    rating: 4.9,
    reviewCount: 72,
    yearsExperience: 8,
    branchId: 'home-visit',
    branchName: HOME_VISIT_BRANCH,
    gender: 'female',
    languages: ['Arabic', 'English'],
  },
];

export function isHomeVisitDoctor(doctor: DoctorProfile) {
  if (doctor.isActive === false) return false;
  return doctor.offersHomeVisits === true || isHomeVisitSpecialty(doctor.specialty);
}

function matchesSpecialty(doctor: DoctorProfile, specialty?: string) {
  if (!specialty) return true;
  if (doctor.specialty === specialty) return true;
  const left = findClinicSpecialty(doctor.specialty);
  const right = findClinicSpecialty(specialty);
  return Boolean(left && right && left.id === right.id);
}

export function listHomeVisitCatalogDoctors(search = '', specialty?: string) {
  const query = search.trim().toLowerCase();
  return HOME_VISIT_CATALOG_DOCTORS.filter((doctor) => {
    if (!matchesSpecialty(doctor, specialty)) return false;
    if (!query) return true;
    const name = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
    return name.includes(query) || doctor.specialty.toLowerCase().includes(query);
  });
}
