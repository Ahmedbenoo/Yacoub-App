import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

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
  'General Surgery': 'content_cut',
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

export function SpecialtyGlyph({ specialty, color }: { specialty: string; color: string }) {
  const android = SPECIALTY_ICONS[specialty] ?? 'medical_services';

  return (
    <SymbolView
      name={{
        ios: 'stethoscope' as SFSymbol,
        android,
        web: android,
      }}
      size={16}
      tintColor={color}
    />
  );
}
