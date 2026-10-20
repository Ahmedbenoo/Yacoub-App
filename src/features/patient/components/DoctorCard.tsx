import { View } from 'react-native';
import { type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { formatDoctorTitle, formatRating, formatSpecialty } from '@/features/patient/lib/formatters';
import { getDoctorPortrait } from '@/shared/lib/doctor-portrait';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { useLocaleStore } from '@/shared/stores';
import type { DoctorProfile } from '@/shared/types/models/doctor';

interface DoctorCardProps {
  doctor: DoctorProfile;
  href?: Href;
  onPress?: () => void;
}

export function DoctorCard({ doctor, href, onPress }: DoctorCardProps) {
  const { t } = useTranslation('patient');
  const isRtl = useLocaleStore((s) => s.isRtl);
  const interactive = Boolean(href || onPress);

  const body = (
    <View className="flex-row items-center gap-3">
      <Avatar
        firstName={doctor.firstName}
        lastName={doctor.lastName}
        imageUrl={doctor.avatarUrl}
        source={getDoctorPortrait(doctor.gender, doctor.firstName)}
        size="md"
      />

      <View className="min-w-0 flex-1 gap-1">
        <Text variant="titleSm" numberOfLines={1}>
          {formatDoctorTitle(doctor.firstName, doctor.lastName, t)}
        </Text>
        <View className="flex-row flex-wrap items-center gap-1">
          <Badge label={formatSpecialty(doctor.specialty, t)} variant="info" />
          {doctor.isActive === false && (
            <Badge label={t('search.inactive')} variant="warning" />
          )}
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="location" size={14} color="#64748B" />
          <Text variant="caption" muted numberOfLines={1}>
            {doctor.branchName}
          </Text>
        </View>
        <View className="mt-0.5 flex-row flex-wrap items-center gap-x-3 gap-y-0.5">
          <Text variant="caption" muted>
            {t('search.rating', { rating: formatRating(doctor.rating, doctor.reviewCount) })}
          </Text>
          <Text variant="caption" muted>
            {t('search.experience', { years: doctor.yearsExperience })}
          </Text>
        </View>
      </View>

      {interactive && (
        <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={18} color="#94A3B8" />
      )}
    </View>
  );

  if (!interactive) {
    return <Card className="gap-2">{body}</Card>;
  }

  return (
    <Card className="p-0">
      <HrefPressable href={href} onPress={onPress} className="self-stretch p-4 active:opacity-80">
        {body}
      </HrefPressable>
    </Card>
  );
}
