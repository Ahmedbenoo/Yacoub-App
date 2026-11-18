import { Image, type ImageSourcePropType, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { getPatientSearchHref } from '@/shared/navigation/routes';

const SERVICE_IMAGES = {
  homeVisit: require('../../../../assets/images/service-home-visit.png') as ImageSourcePropType,
  nursing: require('../../../../assets/images/service-home-nursing.png') as ImageSourcePropType,
  labs: require('../../../../assets/images/service-labs.png') as ImageSourcePropType,
  radiology: require('../../../../assets/images/service-radiology.png') as ImageSourcePropType,
};

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

function TealCardBackdrop({ variant = 'search' }: { variant?: 'search' | 'mini' }) {
  if (variant === 'mini') {
    return (
      <>
        <View
          pointerEvents="none"
          className="absolute -left-4 -bottom-6 h-16 w-16 rounded-full bg-white/10"
        />
        <View
          pointerEvents="none"
          className="absolute -right-6 -top-10 h-24 w-24 rounded-full bg-[#134E4A]/50"
        />
      </>
    );
  }

  return (
    <>
      <View
        pointerEvents="none"
        className="absolute -left-8 -top-10 h-36 w-36 rounded-full bg-white/10"
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-14 -right-6 h-32 w-32 rounded-full bg-[#134E4A]/50"
      />
    </>
  );
}

function MiniCard({
  image,
  title,
  onPress,
}: {
  image: ImageSourcePropType;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="min-w-0 items-center active:opacity-90"
      style={{ flex: 1, minWidth: 0, gap: 8 }}
    >
      <View
        className="w-full overflow-hidden rounded-[24px] bg-[#0F766E]"
        style={[{ aspectRatio: 1 }, searchShadow]}
      >
        <TealCardBackdrop variant="mini" />
        <Image
          source={image}
          resizeMode="contain"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <Text variant="caption" className="text-center font-semibold" numberOfLines={2}>
        {title}
      </Text>
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
          <TealCardBackdrop />
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

      <View className="flex-row items-start" style={{ flexGrow: 0, gap: 8 }}>
        <MiniCard
          image={SERVICE_IMAGES.homeVisit}
          title={t('guest.pathHomeDoctorTitle')}
          onPress={() => goLoginOr('/(patient)/home-visit/new')}
        />
        <MiniCard
          image={SERVICE_IMAGES.nursing}
          title={t('guest.pathNursingTitle')}
          onPress={() => goLoginOr('/(patient)/nursing')}
        />
        <MiniCard
          image={SERVICE_IMAGES.labs}
          title={t('guest.pathLabsTitle')}
          onPress={() =>
            router.push(getPatientSearchHref({ tab: 'labs' }))
          }
        />
        <MiniCard
          image={SERVICE_IMAGES.radiology}
          title={t('guest.pathRadiologyTitle')}
          onPress={() =>
            router.push(getPatientSearchHref({ tab: 'radiology' }))
          }
        />
      </View>
    </View>
  );
}
