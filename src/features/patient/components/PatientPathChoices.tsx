import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { getPatientSearchHref } from '@/shared/navigation/routes';

interface PatientPathChoicesProps {
  isAuthenticated: boolean;
}

const searchShadow = Platform.select({
  ios: {
    shadowColor: '#0F766E',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 4 },
  web: { boxShadow: '0 12px 28px rgba(15, 118, 110, 0.16)' },
  default: {},
});

function cardShadow(glow: string, tint: string) {
  return Platform.select({
    ios: {
      shadowColor: tint,
      shadowOpacity: 0.38,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
    },
    android: { elevation: 7 },
    web: { boxShadow: `0 16px 34px ${glow}` },
    default: {},
  });
}

const MINI_CARD_HEIGHT = 220;

function MiniCard({
  icon,
  title,
  description,
  badge,
  from,
  to,
  glow,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  description: string;
  badge: string;
  from: string;
  to: string;
  glow: string;
  onPress: () => void;
}) {
  const { forwardIconName } = useLayoutDirection();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-w-0 active:opacity-90"
      style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, height: MINI_CARD_HEIGHT }}
    >
      <View
        className="h-full justify-between overflow-hidden rounded-[26px] p-4"
        style={[
          {
            height: MINI_CARD_HEIGHT,
            backgroundColor: to,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
            ...(Platform.OS === 'web'
              ? { backgroundImage: `linear-gradient(165deg, ${from} 0%, ${to} 100%)` }
              : {}),
          },
          cardShadow(glow, to),
        ]}
      >
        <View
          pointerEvents="none"
          className="absolute -end-10 -top-12 h-40 w-40 rounded-full border-[22px]"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        />
        <View
          pointerEvents="none"
          className="absolute -start-14 -bottom-16 h-44 w-44 rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.16)' }}
        />
        <View pointerEvents="none" className="absolute -bottom-4 -end-3 opacity-[0.16]">
          <Icon name={icon} size={118} color="#FFFFFF" />
        </View>

        <View className="self-start rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
          <Text variant="caption" className="text-white">
            {badge}
          </Text>
        </View>

        <View className="mt-4 justify-start gap-1.5" style={{ minHeight: 76 }}>
          <Text variant="titleSm" className="text-white" numberOfLines={2}>
            {title}
          </Text>
          <Text variant="caption" className="text-white/75" numberOfLines={2}>
            {description}
          </Text>
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
            <Icon name={icon} size={20} color="#FFFFFF" />
          </View>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
            <Icon name={forwardIconName} size={16} color={to} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function PatientPathChoices({ isAuthenticated }: PatientPathChoicesProps) {
  const { t } = useTranslation('patient');
  const { forwardIconName } = useLayoutDirection();

  const goLoginOr = (href: string) => {
    router.push((isAuthenticated ? href : '/(auth)/login') as never);
  };

  return (
    <View className="gap-3">
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(getPatientSearchHref({ tab: 'clinics' }))}
        className="active:opacity-95"
      >
        <View className="overflow-hidden rounded-[24px] bg-[#0F766E] px-5 py-5" style={searchShadow}>
          <View
            pointerEvents="none"
            className="absolute -left-8 -top-10 h-36 w-36 rounded-full bg-white/10"
          />
          <View
            pointerEvents="none"
            className="absolute -bottom-14 -right-6 h-32 w-32 rounded-full bg-[#134E4A]/50"
          />
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <Icon name="search" size={26} color="#FFFFFF" />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text variant="titleMd" className="text-white">
                {t('guest.searchCardTitle')}
              </Text>
              <Text variant="bodySm" className="text-white/75" numberOfLines={2}>
                {t('guest.searchCardDescription')}
              </Text>
            </View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Icon name={forwardIconName} size={18} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </Pressable>

      <View className="flex-row items-start gap-3" style={{ flexGrow: 0 }}>
        <MiniCard
          icon="doctors"
          title={t('guest.pathHomeDoctorTitle')}
          description={t('guest.pathHomeDoctorDescription')}
          badge={t('guest.pathHomeDoctorBadge')}
          from="#2DD4BF"
          to="#0F766E"
          glow="rgba(15, 118, 110, 0.34)"
          onPress={() => goLoginOr('/(patient)/home-visit/new')}
        />
        <MiniCard
          icon="home"
          title={t('guest.pathNursingTitle')}
          description={t('guest.pathNursingDescription')}
          badge={t('guest.pathNursingBadge')}
          from="#2DD4BF"
          to="#0F766E"
          glow="rgba(15, 118, 110, 0.34)"
          onPress={() => goLoginOr('/(patient)/nursing')}
        />
      </View>
    </View>
  );
}
