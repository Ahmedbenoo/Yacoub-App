import { Image, View } from 'react-native';
import { type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getClinicAddressLine, getClinicDescription, getClinicName } from '@/features/clinic/lib/formatters';
import { formatRating, formatSpecialty } from '@/features/patient/lib/formatters';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/lib/utils';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { useLocaleStore } from '@/shared/stores';
import type { Clinic } from '@/shared/types/models';

interface ClinicCardProps {
  clinic: Clinic;
  href?: Href;
  onPress?: () => void;
  variant?: 'row' | 'tile';
  tileWidth?: number;
  className?: string;
}

function coverUri(clinic: Clinic): string | undefined {
  return clinic.photoUrls?.[0] || clinic.logoUrl;
}

export function ClinicCard({
  clinic,
  href,
  onPress,
  variant = 'row',
  tileWidth,
  className,
}: ClinicCardProps) {
  const { t } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);
  const isRtl = useLocaleStore((s) => s.isRtl);
  const interactive = Boolean(href || onPress);

  if (variant === 'tile') {
    const cover = coverUri(clinic);
    const body = (
      <View>
        <View className="h-[118px] w-full items-center justify-center overflow-hidden bg-primary-50 dark:bg-primary-900/30">
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={{ width: '100%', height: 118 }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Icon name="clinic" size={36} color="#0D9488" />
          )}
          <View className="absolute bottom-2 start-2 flex-row items-center gap-1 rounded-full bg-black/60 px-2 py-1">
            <Icon name="star" size={12} color="#FBBF24" />
            <Text variant="caption" className="text-white">
              {clinic.reviewCount
                ? formatRating(clinic.rating ?? 0, clinic.reviewCount)
                : clinic.rating
                  ? clinic.rating.toFixed(1)
                  : '—'}
            </Text>
          </View>
        </View>
        <View className="gap-1 p-3">
          <Text variant="titleSm" numberOfLines={2}>
            {getClinicName(clinic, locale)}
          </Text>
          <View className="flex-row items-center gap-1">
            <Icon name="location" size={12} color="#64748B" />
            <Text variant="caption" muted numberOfLines={1} className="min-w-0 flex-1">
              {getClinicAddressLine(clinic, locale)}
            </Text>
          </View>
          {clinic.specialty ? (
            <Text variant="caption" className="text-primary-700 dark:text-primary-300" numberOfLines={1}>
              {formatSpecialty(clinic.specialty, t)}
            </Text>
          ) : null}
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
      {clinic.logoUrl ? (
        <View className="h-16 w-16 overflow-hidden rounded-2xl">
          <Image
            source={{ uri: clinic.logoUrl }}
            style={{ width: 64, height: 64 }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
          <Icon name="clinic" size={24} color="#0D9488" />
        </View>
      )}

      <View className="min-w-0 flex-1 gap-1">
        <Text variant="titleSm" numberOfLines={1}>
          {getClinicName(clinic, locale)}
        </Text>
        <View className="flex-row items-center gap-1">
          <Icon name="location" size={14} color="#64748B" />
          <Text variant="caption" muted numberOfLines={1}>
            {getClinicAddressLine(clinic, locale)}
          </Text>
        </View>
        {getClinicDescription(clinic, locale) ? (
          <Text variant="caption" muted numberOfLines={2} className="min-w-0">
            {getClinicDescription(clinic, locale)}
          </Text>
        ) : null}
      </View>

      {interactive && <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={18} color="#94A3B8" />}
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
