import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { getPatientSearchHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';

interface PatientPathChoicesProps {
  isAuthenticated: boolean;
}

const PATHS: {
  key: 'search' | 'nursing' | 'homeDoctor';
  icon: AppIconName;
  titleKey: string;
  descriptionKey: string;
  frozen?: boolean;
}[] = [
  {
    key: 'search',
    icon: 'search',
    titleKey: 'guest.searchCardTitle',
    descriptionKey: 'guest.searchCardDescription',
  },
  {
    key: 'nursing',
    icon: 'home',
    titleKey: 'guest.pathNursingTitle',
    descriptionKey: 'guest.pathNursingDescription',
  },
  {
    key: 'homeDoctor',
    icon: 'doctors',
    titleKey: 'guest.pathHomeDoctorTitle',
    descriptionKey: 'guest.pathHomeDoctorDescription',
    frozen: true,
  },
];

function PathRow({
  icon,
  title,
  description,
  isRtl,
  frozen,
}: {
  icon: AppIconName;
  title: string;
  description: string;
  isRtl: boolean;
  frozen?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-12 w-12 items-center justify-center bg-white/20" style={{ borderRadius: 6 }}>
        <Icon name={icon} size={22} color="#FFFFFF" />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text variant="titleSm" className="text-white">
          {title}
        </Text>
        <Text variant="bodySm" className="text-white/80">
          {description}
        </Text>
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

  return (
    <View className="gap-3">
      <Text variant="titleSm">{t('dashboard.pathsTitle')}</Text>

      <View className="overflow-hidden bg-primary-600" style={{ borderRadius: 6 }}>
        {PATHS.map((option, index) => (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            onPress={() => open(option.key, option.frozen)}
          >
            <View
              className="p-4"
              style={index > 0 ? { borderTopWidth: 2, borderTopColor: '#FFFFFF' } : undefined}
            >
              <PathRow
                icon={option.icon}
                title={t(option.titleKey)}
                description={t(option.descriptionKey)}
                isRtl={isRtl}
                frozen={option.frozen}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
