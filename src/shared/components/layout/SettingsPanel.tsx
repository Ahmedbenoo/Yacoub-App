import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { canToggleDoctorAndAdmin, DoctorAdminRoleToggle } from '@/features/auth/components/DoctorAdminRoleToggle';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogoutMutation } from '@/features/auth/hooks/useAuthMutations';
import { ClinicSwitcher } from '@/features/clinic/components/ClinicSwitcher';
import { resolvePostAuthNavigation } from '@/features/clinic/lib/navigation';
import { EditableAvatar } from '@/shared/components/profile/EditableAvatar';
import { PushNotificationSetting } from '@/shared/components/settings/PushNotificationSetting';
import { NotificationCategoryPreferences } from '@/shared/components/settings/NotificationCategoryPreferences';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Row } from '@/shared/components/layout/Row';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { cn, themeBg } from '@/shared/lib/utils';
import { getChangePasswordRoute, getEditProfileRoute } from '@/shared/navigation/routes';
import { useAuthStore, useLocaleStore, useThemeStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { Locale, ThemeMode, UserRole } from '@/shared/types/enums';

interface SettingsPanelProps {
  showAvatar?: boolean;
  showAccountCard?: boolean;
}

export function SettingsPanel({ showAvatar = true, showAccountCard = true }: SettingsPanelProps) {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { user, isLoading } = useCurrentUser();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const isDark = useResolvedColorScheme() === 'dark';
  const logoutMutation = useLogoutMutation();
  const activeRole = useAuthStore((s) => s.activeRole);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);

  const showDoctorAdminToggle = canToggleDoctorAndAdmin(user?.roles, activeRole);
  const otherRoles =
    user?.roles.filter(
      (role) =>
        role !== activeRole &&
        !(showDoctorAdminToggle && (role === UserRole.DOCTOR || role === UserRole.ADMIN)),
    ) ?? [];

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: tc('settings.themeLight'), value: ThemeMode.LIGHT },
    { label: tc('settings.themeDark'), value: ThemeMode.DARK },
    { label: tc('settings.themeSystem'), value: ThemeMode.SYSTEM },
  ];

  return (
    <View className="gap-4 py-4">
      {!user && (
        <Card className="gap-3">
          <Text variant="titleSm">{t('login.staffEntryTitle')}</Text>
          <Text variant="bodySm" muted>
            {t('login.staffEntrySubtitle')}
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="items-center justify-center rounded-xl bg-primary-600 py-3 active:opacity-80"
          >
            <Text variant="label" className="text-center text-white">
              {t('login.staffSignIn')}
            </Text>
          </Pressable>
        </Card>
      )}

      {user && showAccountCard && (
        <Card className="gap-3">
          {showAvatar && activeRole !== UserRole.ADMIN ? (
            <View className="items-center">
              <EditableAvatar size="xl" />
            </View>
          ) : null}
          <View className="items-center">
            <Text variant="label" muted className="mb-1 text-center">
              {t('profile.signedInAs')}
            </Text>
            <Text variant="titleSm" className="text-center">
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="bodySm" muted className="text-center">
              {user.email}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(getEditProfileRoute(activeRole) as never, { withAnchor: true })}
            className="w-full items-center justify-center rounded-xl bg-primary-600 py-3 active:opacity-80"
          >
            <Text variant="label" className="text-center text-white">
              {t('editProfile.title')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push(getChangePasswordRoute(activeRole) as never, { withAnchor: true })
            }
            className={`w-full items-center justify-center rounded-xl py-3 active:opacity-80 ${themeBg(isDark, 'bg-slate-100', 'bg-slate-700')}`}
          >
            <Text variant="label" className="text-center">
              {t('changePassword.title')}
            </Text>
          </Pressable>
        </Card>
      )}

      {showDoctorAdminToggle ? (
        <Card className="gap-3">
          <Text variant="label">{t('roleSwitch')}</Text>
          <DoctorAdminRoleToggle appearance="segmented" />
        </Card>
      ) : null}

      {user && otherRoles.length > 0 ? (
        <Card className="gap-2">
          {otherRoles.map((role) => (
            <Pressable
              key={role}
              onPress={async () => {
                await setActiveRole(role);
                await resolvePostAuthNavigation(user);
              }}
              className={`items-center rounded-xl py-3 ${themeBg(isDark, 'bg-slate-100', 'bg-slate-700')}`}
            >
              <Text variant="label">{t(`roleSelection.${role as UserRole}`)}</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {isLoading && (
        <View className="py-2">
          <Spinner message={t('profile.syncing')} />
        </View>
      )}

      <Card>
        <Text variant="label" className="mb-3">
          {tc('settings.pushNotifications')}
        </Text>
        <PushNotificationSetting />
      </Card>

      <Card>
        <Text variant="label" className="mb-3">
          {tc('settings.notificationCategories.title')}
        </Text>
        <NotificationCategoryPreferences />
      </Card>

      {activeRole !== UserRole.PATIENT && activeRole !== UserRole.NURSE && activeRole !== UserRole.NURSING_ADMIN ? (
        <Card>
          <ClinicSwitcher compact />
        </Card>
      ) : null}

      <Card>
        <Text variant="label" className="mb-3">
          {tc('settings.language')}
        </Text>
        <Row className="gap-2">
          {[
            { label: tc('settings.languageAr'), value: Locale.AR },
            { label: tc('settings.languageEn'), value: Locale.EN },
          ].map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setLocale(option.value)}
              className={`flex-1 items-center justify-center rounded-xl py-3 ${
                locale === option.value
                  ? 'bg-primary-600'
                  : themeBg(isDark, 'bg-slate-100', 'bg-slate-700')
              }`}
            >
              <Text
                variant="label"
                className={cn('text-center', locale === option.value ? 'text-white' : undefined)}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </Row>
      </Card>

      <Card>
        <Text variant="label" className="mb-3">
          {tc('settings.theme')}
        </Text>
        <Row className="gap-2">
          {themeOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setMode(option.value)}
              className={`flex-1 items-center justify-center rounded-xl py-3 ${
                mode === option.value ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-700')
              }`}
            >
              <Text
                variant="caption"
                className={cn('text-center', mode === option.value ? 'text-white' : undefined)}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </Row>
      </Card>

      <Pressable
        onPress={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="items-center justify-center rounded-xl bg-status-error/10 py-4 active:opacity-80"
      >
        <Text variant="label" className="text-center text-status-error">
          {logoutMutation.isPending ? t('logoutLoading') : t('logout')}
        </Text>
      </Pressable>

      <Text variant="caption" muted className="text-center">
        {tc('appName')} v1.0.0
      </Text>
    </View>
  );
}
