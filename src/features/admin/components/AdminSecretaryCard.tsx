import { View } from 'react-native';
import { type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { useLocaleStore } from '@/shared/stores';
import type { SecretaryProfile } from '@/shared/types/models/admin';

export function AdminSecretaryCard({
  secretary,
  href,
}: {
  secretary: SecretaryProfile;
  href?: Href;
}) {
  const { t } = useTranslation('admin');
  const locale = useLocaleStore((s) => s.locale);
  const { isRtl, rowStyle } = useLayoutDirection();
  const clinicName =
    locale === 'ar' ? secretary.clinicNameAr || secretary.clinicName : secretary.clinicName || secretary.clinicNameAr;

  const body = (
    <View className="items-center gap-3" style={rowStyle}>
      <Avatar
        firstName={secretary.firstName}
        lastName={secretary.lastName}
        imageUrl={secretary.avatarUrl}
        size="md"
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text variant="titleSm" numberOfLines={1}>
          {secretary.firstName} {secretary.lastName}
        </Text>
        <View className="flex-row flex-wrap items-center gap-1">
          <Badge label={t('staff.roleSecretary')} variant="purple" />
        </View>
        {clinicName ? (
          <View className="flex-row items-center gap-1">
            <Icon name="location" size={14} color="#64748B" />
            <Text variant="caption" muted numberOfLines={1}>
              {clinicName}
            </Text>
          </View>
        ) : null}
        {secretary.phone ? (
          <Text variant="caption" muted>
            {secretary.phone}
          </Text>
        ) : null}
      </View>
      {href ? <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={18} color="#94A3B8" /> : null}
    </View>
  );

  if (!href) {
    return <Card className="gap-2">{body}</Card>;
  }

  return (
    <Card className="p-0">
      <HrefPressable href={href} className="self-stretch p-4 active:opacity-80">
        {body}
      </HrefPressable>
    </Card>
  );
}
