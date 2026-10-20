const MALE_PHOTO = require('../../../assets/doctors/doctor-male.jpg');
const FEMALE_PHOTO = require('../../../assets/doctors/doctor-female.jpg');

const FEMALE_NAMES = new Set(['Mona', 'Layla', 'Hana', 'فاطمه', 'فاطمة', 'منى', 'ليلى']);

export function getDoctorPortrait(gender?: string | null, firstName?: string) {
  if (gender === 'female') return FEMALE_PHOTO;
  if (gender === 'male') return MALE_PHOTO;
  return FEMALE_NAMES.has(firstName ?? '') ? FEMALE_PHOTO : MALE_PHOTO;
}
