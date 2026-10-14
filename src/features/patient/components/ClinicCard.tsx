import { Image, View } from 'react-native';
import { type Href } from 'expo-router';

import { getClinicAddressLine, getClinicDescription, getClinicName } from '@/features/clinic/lib/formatters';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { useLocaleStore } from '@/shared/stores';
import type { Clinic } from '@/shared/types/models';

interface ClinicCardProps {
  clinic: Clinic;
  href?: Href;
  onPress?: () => void;
}

export function ClinicCard({ clinic, href, onPress }: ClinicCardProps) {
  const locale = useLocaleStore((s) => s.locale);
  const isRtl = useLocaleStore((s) => s.isRtl);
  const interactive = Boolean(href || onPress);

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
