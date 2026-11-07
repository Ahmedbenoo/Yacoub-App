import { Image, View } from 'react-native';
import { type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { formatDoctorTitle, formatRating, formatSpecialty } from '@/features/patient/lib/formatters';
import { getDoctorPortrait } from '@/shared/lib/doctor-portrait';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/lib/utils';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { useLocaleStore } from '@/shared/stores';
import type { DoctorProfile } from '@/shared/types/models/doctor';

interface DoctorCardProps {
  doctor: DoctorProfile;
  href?: Href;
  onPress?: () => void;
  variant?: 'row' | 'tile';
  tileWidth?: number;
  className?: string;
}

function doctorCover(doctor: DoctorProfile) {
  return doctor.avatarUrl ? { uri: doctor.avatarUrl } : getDoctorPortrait(doctor.gender, doctor.firstName);
}

export function DoctorCard({ doctor, href, onPress, variant = 'row', tileWidth, className }: DoctorCardProps) {
  const { t } = useTranslation('patient');
  const isRtl = useLocaleStore((s) => s.isRtl);
  const interactive = Boolean(href || onPress);

  if (variant === 'tile') {
    const cover = doctorCover(doctor);
    const ratingLabel = doctor.reviewCount
      ? formatRating(doctor.rating ?? 0, doctor.reviewCount)
      : doctor.rating
        ? doctor.rating.toFixed(1)
        : '—';
    const body = (
      <View>
        <View className="h-[118px] w-full items-center justify-center overflow-hidden bg-primary-50 dark:bg-primary-900/30">
          {cover ? (
            <Image
              source={cover}
              style={{ width: '100%', height: 118 }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Icon name="doctors" size={36} color="#0D9488" />
          )}
        </View>
        <View className="p-3" style={{ gap: 8 }}>
          <Text variant="titleSm" numberOfLines={2}>
            {formatDoctorTitle(doctor.firstName, doctor.lastName, t)}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Icon name="clinic" size={13} color="#0F766E" />
            <Text variant="caption" muted numberOfLines={1} className="min-w-0 flex-1">
              {doctor.branchName}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {doctor.specialty ? (
              <Text
                variant="caption"
                className="min-w-0 flex-1 text-primary-700 dark:text-primary-300"
                numberOfLines={1}
              >
                {formatSpecialty(doctor.specialty, t)}
              </Text>
            ) : (
              <View className="min-w-0 flex-1" />
            )}
            <View className="flex-row items-center gap-1 rounded-full bg-black/60 px-2 py-1">
              <Icon name="star" size={12} color="#FBBF24" />
              <Text variant="caption" className="text-white" style={{ color: '#FFFFFF' }}>
                {ratingLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );

    return (
      <Card className={cn('overflow-hidden p-0', className)} style={{ width: tileWidth ?? 168 }}>
        {interactive ? (
          <HrefPressable href={href} onPress={onPress} className="active:opacity-85">
            {body}
          </HrefPressable>
        ) : (
          body
        )}
      </Card>
    );
  }

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
    return <Card className={cn('gap-2', className)}>{body}</Card>;
  }

  return (
    <Card className={cn('p-0', className)}>
      <HrefPressable href={href} onPress={onPress} className="self-stretch p-4 active:opacity-80">
        {body}
      </HrefPressable>
    </Card>
  );
}
