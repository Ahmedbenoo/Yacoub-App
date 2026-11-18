import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { formatSpecialty } from '@/features/patient/lib/formatters';
import { SpecialtyGlyph } from '@/features/patient/lib/specialty-icons';
import { CLINIC_SPECIALTIES, CORE_SPECIALTY_IDS } from '@/shared/catalog/clinic-specialties';
import { Text } from '@/shared/components/ui/Text';
import { getPatientSearchHref } from '@/shared/navigation/routes';

const CORE_SPECIALTIES = CORE_SPECIALTY_IDS.map((id) =>
  CLINIC_SPECIALTIES.find((specialty) => specialty.id === id),
).filter((specialty): specialty is NonNullable<typeof specialty> => Boolean(specialty));

export function HomeSpecialtyIcons() {
  const { t } = useTranslation('patient');

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-1 pe-1"
    >
      {CORE_SPECIALTIES.map((specialty) => (
        <Pressable
          key={specialty.id}
          accessibilityRole="button"
          accessibilityLabel={formatSpecialty(specialty.nameEn, t)}
          onPress={() =>
            router.push(getPatientSearchHref({ tab: 'clinics', specialty: specialty.nameEn }))
          }
          className="items-center active:opacity-80"
          style={{ width: 60, gap: 2 }}
        >
          <View className="h-10 w-10 items-center justify-center">
            <SpecialtyGlyph specialty={specialty.nameEn} size={28} color="#0D9488" />
          </View>
          <Text variant="caption" className="text-center font-medium" numberOfLines={2}>
            {formatSpecialty(specialty.nameEn, t)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
