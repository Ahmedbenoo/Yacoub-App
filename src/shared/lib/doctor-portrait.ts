const MALE_PHOTO = require('../../../assets/doctors/doctor-male.jpg');
const FEMALE_PHOTO = require('../../../assets/doctors/doctor-female.jpg');

const FEMALE_NAMES = new Set(['Mona', 'Layla', 'Hana', 'فاطمه', 'فاطمة', 'منى', 'ليلى']);

export function getDoctorPortrait(firstName: string) {
  return FEMALE_NAMES.has(firstName) ? FEMALE_PHOTO : MALE_PHOTO;
}
