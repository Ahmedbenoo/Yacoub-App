import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { findClinicSpecialty } from '@/shared/catalog/clinic-specialties';

const SPECIALTY_ICONS: Record<string, AndroidSymbol> = {
  'General Medicine': 'medical_services',
  'Family Medicine': 'family_restroom',
  'Internal Medicine': 'stethoscope',
  Cardiology: 'cardiology',
  'Pediatric Cardiology': 'cardiology',
  Dermatology: 'dermatology',
  'Dermatology and Cosmetology': 'spa',
  Pediatrics: 'child_care',
  Neonatology: 'crib',
  Orthopedics: 'orthopedics',
  'Obstetrics and Gynecology': 'gynecology',
  Fertility: 'pregnant_woman',
  ENT: 'hearing',
  Ophthalmology: 'ophthalmology',
  Optometry: 'visibility',
  Dentistry: 'dentistry',
  Orthodontics: 'dentistry',
  'Pediatric Dentistry': 'dentistry',
  'Oral and Maxillofacial Surgery': 'dentistry',
  Neurology: 'neurology',
  Neurosurgery: 'neurology',
  Psychiatry: 'psychiatry',
  'Clinical Psychology': 'psychology',
  Urology: 'urology',
  Andrology: 'urology',
  Gastroenterology: 'gastroenterology',
  Hepatology: 'gastroenterology',
  Pulmonology: 'pulmonology',
  Endocrinology: 'endocrinology',
  Nephrology: 'nephrology',
  Rheumatology: 'rheumatology',
  Hematology: 'hematology',
  Oncology: 'oncology',
  'Allergy and Immunology': 'allergy',
  'Infectious Diseases': 'vaccines',
  'General Surgery': 'surgical',
  'Pediatric Surgery': 'child_care',
  'Plastic Surgery': 'spa',
  'Vascular Surgery': 'bloodtype',
  'Cardiothoracic Surgery': 'monitor_heart',
  'Bariatric Surgery': 'nutrition',
  Physiotherapy: 'orthopedics',
  'Clinical Nutrition': 'nutrition',
  Radiology: 'radiology',
  'Clinical Pathology': 'bloodtype',
  Phoniatrics: 'voice_selection',
  Audiology: 'hearing_aid',
  'Pain Medicine': 'pill',
  'Sports Medicine': 'sports_soccer',
  Geriatrics: 'elderly',
  Anesthesia: 'pill',
  'Emergency Medicine': 'emergency',
};

function resolveSpecialtyIcon(specialty: string): AndroidSymbol {
  const direct = SPECIALTY_ICONS[specialty];
  if (direct) return direct;
  const match = findClinicSpecialty(specialty);
  return (match && SPECIALTY_ICONS[match.nameEn]) || 'medical_services';
}

export function SpecialtyGlyph({
  specialty,
  color,
  size = 16,
}: {
  specialty: string;
  color: string;
  size?: number;
}) {
  const android = resolveSpecialtyIcon(specialty);

  return (
    <SymbolView
      name={{
        ios: 'stethoscope' as SFSymbol,
        android,
        web: android,
      }}
      size={size}
      tintColor={color}
      resizeMode="scaleAspectFit"
    />
  );
}
