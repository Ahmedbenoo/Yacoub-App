import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { nativeLayoutMatchesLocale } from '@/shared/hooks/useLayoutDirection';
import { getPatientSearchHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';

interface PatientPathChoicesProps {
  isAuthenticated: boolean;
}

const PATHS: {
  key: 'search' | 'nursing' | 'homeDoctor';
  icon: AppIconName;
  titleKey: string;
  frozen?: boolean;
}[] = [
  {
    key: 'search',
    icon: 'search',
    titleKey: 'guest.searchCardTitle',
  },
  {
    key: 'nursing',
    icon: 'home',
    titleKey: 'guest.pathNursingTitle',
  },
  {
    key: 'homeDoctor',
    icon: 'doctors',
    titleKey: 'guest.pathHomeDoctorTitle',
    frozen: true,
  },
];

function PathRow({
  icon,
  title,
  description,
  isRtl,
  frozen,
  stacked,
}: {
  icon: AppIconName;
  title: string;
  description?: string;
  isRtl: boolean;
  frozen?: boolean;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <View className="items-center gap-3">
        <Icon name={icon} size={26} color="#FFFFFF" />
        <Text variant="titleSm" className="text-center text-white">
          {title}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-3">
      <View className="h-12 w-12 items-center justify-center bg-white/20" style={{ borderRadius: 6 }}>
        <Icon name={icon} size={22} color="#FFFFFF" />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text variant="titleSm" className="text-white">
          {title}
        </Text>
        {description ? (
          <Text variant="bodySm" className="text-white/80">
            {description}
          </Text>
        ) : null}
        {frozen ? (
          <Text variant="caption" className="text-white">
            Coming soon
          </Text>
        ) : null}
      </View>
      <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={20} color="#FFFFFF" />
    </View>
  );
}

export function PatientPathChoices({ isAuthenticated }: PatientPathChoicesProps) {
  const { t } = useTranslation('patient');
  const isRtl = useLocaleStore((s) => s.isRtl);
  const [search, nursing, homeDoctor] = PATHS;

  const open = (key: 'nursing' | 'search' | 'homeDoctor', frozen?: boolean) => {
    if (frozen) {
      Toast.show({ type: 'info', text1: 'Coming soon', text2: t('guest.pathHomeDoctorDescription') });
      return;
    }
    if (key === 'nursing') {
      router.push((isAuthenticated ? '/(patient)/nursing' : '/(auth)/login') as never);
      return;
    }
    router.push(getPatientSearchHref({ tab: 'clinics' }));
  };

  const topCards =
    isRtl && !nativeLayoutMatchesLocale(isRtl) ? [nursing, search] : [search, nursing];

  return (
    <View className="gap-3">
      <Text variant="titleSm">{t('dashboard.pathsTitle')}</Text>

      <View className="overflow-hidden bg-primary-600" style={{ borderRadius: 6 }}>
        <View style={{ flexDirection: 'row', minHeight: 112 }}>
          {topCards.map((option, index) => (
            <View key={option.key} style={{ flex: 1, flexDirection: 'row' }}>
              {index > 0 ? <View style={{ width: 2, backgroundColor: '#FFFFFF' }} /> : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => open(option.key, option.frozen)}
                style={{ flex: 1, minHeight: 112, justifyContent: 'center', padding: 16 }}
              >
                <PathRow
                  icon={option.icon}
                  title={t(option.titleKey)}
                  isRtl={isRtl}
                  frozen={option.frozen}
                  stacked
                />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable accessibilityRole="button" onPress={() => open(homeDoctor.key, homeDoctor.frozen)}>
          <View className="p-4" style={{ borderTopWidth: 2, borderTopColor: '#FFFFFF' }}>
            <PathRow
              icon={homeDoctor.icon}
              title={t(homeDoctor.titleKey)}
              description={t('guest.pathHomeDoctorDescription')}
              isRtl={isRtl}
              frozen={homeDoctor.frozen}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
