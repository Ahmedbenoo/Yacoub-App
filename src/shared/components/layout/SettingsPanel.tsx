import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { canToggleDoctorAndAdmin } from '@/features/auth/components/DoctorAdminRoleToggle';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useDeleteAccountMutation, useLogoutMutation } from '@/features/auth/hooks/useAuthMutations';
import { DoctorHomeVisitNavRow } from '@/features/home-visit/components/DoctorHomeVisitNavRow';
import { EditableAvatar } from '@/shared/components/profile/EditableAvatar';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Row } from '@/shared/components/layout/Row';
import { SettingsNavRow } from '@/shared/components/layout/SettingsNavRow';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { cn, themeBg } from '@/shared/lib/utils';
import { getChangePasswordRoute, getEditProfileRoute, getSettingsPageHref } from '@/shared/navigation/routes';
import { useAuthStore, useLocaleStore, useThemeStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { Locale, ThemeMode, UserRole } from '@/shared/types/enums';

interface SettingsPanelProps {
  showAvatar?: boolean;
  showAccountCard?: boolean;
  className?: string;
}

export function AccountSettingsCard({ showAvatar = true }: { showAvatar?: boolean }) {
  const { t } = useTranslation('auth');
  const { user } = useCurrentUser();
  const isDark = useResolvedColorScheme() === 'dark';
  const activeRole = useAuthStore((s) => s.activeRole);

  if (!user) return null;

  return (
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
        onPress={() => router.push(getChangePasswordRoute(activeRole) as never, { withAnchor: true })}
        className={`w-full items-center justify-center rounded-xl py-3 active:opacity-80 ${themeBg(isDark, 'bg-slate-100', 'bg-slate-700')}`}
      >
        <Text variant="label" className="text-center">
          {t('changePassword.title')}
        </Text>
      </Pressable>
    </Card>
  );
}

export function LanguageSettingsCard() {
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const isDark = useResolvedColorScheme() === 'dark';

  return (
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
  );
}

export function ThemeSettingsCard() {
  const { t: tc } = useTranslation('common');
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const isDark = useResolvedColorScheme() === 'dark';
  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: tc('settings.themeLight'), value: ThemeMode.LIGHT },
    { label: tc('settings.themeDark'), value: ThemeMode.DARK },
    { label: tc('settings.themeSystem'), value: ThemeMode.SYSTEM },
  ];

  return (
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
  );
}

export function SettingsPanel({ showAvatar = true, showAccountCard = true, className }: SettingsPanelProps) {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { user, isLoading } = useCurrentUser();
  const logoutMutation = useLogoutMutation();
  const deleteAccount = useDeleteAccountMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const activeRole = useAuthStore((s) => s.activeRole);

  const showDoctorAdminToggle = canToggleDoctorAndAdmin(user?.roles, activeRole);
  const otherRoles =
    user?.roles.filter(
      (role) =>
        role !== activeRole &&
        !(showDoctorAdminToggle && (role === UserRole.DOCTOR || role === UserRole.ADMIN)),
    ) ?? [];
  const showRolesRow = activeRole !== UserRole.ADMIN && (showDoctorAdminToggle || otherRoles.length > 0);
  const showClinicRow =
    activeRole !== UserRole.ADMIN &&
    activeRole !== UserRole.PATIENT &&
    activeRole !== UserRole.NURSE &&
    activeRole !== UserRole.NURSING_ADMIN;
  const showSharedSettings = activeRole !== UserRole.ADMIN;

  return (
    <View className={cn('gap-3 py-4', className)}>
      {showAccountCard ? <AccountSettingsCard showAvatar={showAvatar} /> : null}

      {isLoading && (
        <View className="py-2">
          <Spinner message={t('profile.syncing')} />
        </View>
      )}

      {activeRole === UserRole.DOCTOR ? <DoctorHomeVisitNavRow /> : null}

      {showRolesRow ? (
        <SettingsNavRow
          title={tc('settings.rolesTitle')}
          subtitle={tc('settings.rolesSubtitle')}
          icon="doctors"
          href={getSettingsPageHref(activeRole, 'roles')}
        />
      ) : null}

      {showSharedSettings ? (
        <SettingsNavRow
          title={tc('settings.pushNotifications')}
          subtitle={tc('settings.notificationsSubtitle')}
          icon="bell"
          href={getSettingsPageHref(activeRole, 'notification-settings')}
        />
      ) : null}

      {showClinicRow ? (
        <SettingsNavRow
          title={tc('settings.branchesTitle')}
          subtitle={tc('settings.branchesSubtitle')}
          icon="clinic"
          href={getSettingsPageHref(activeRole, 'active-clinic')}
        />
      ) : null}

      {showSharedSettings ? (
        <>
          <SettingsNavRow
            title={tc('settings.language')}
            subtitle={tc('settings.languageSubtitle')}
            icon="language"
            href={getSettingsPageHref(activeRole, 'language')}
          />
          <SettingsNavRow
            title={tc('settings.theme')}
            subtitle={tc('settings.themeSubtitle')}
            icon="sun"
            href={getSettingsPageHref(activeRole, 'theme')}
          />
        </>
      ) : null}

      <Pressable
        onPress={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="items-center justify-center rounded-xl bg-status-error/10 py-4 active:opacity-80"
      >
        <Text variant="label" className="text-center text-status-error">
          {logoutMutation.isPending ? t('logoutLoading') : t('logout')}
        </Text>
      </Pressable>

      {activeRole === UserRole.PATIENT ? (
        <>
          <Pressable
            onPress={() => setConfirmDelete(true)}
            disabled={deleteAccount.isPending}
            className="items-center justify-center rounded-xl py-4 active:opacity-80"
          >
            <Text variant="label" className="text-center text-status-error">
              {t('editProfile.deleteAccount')}
            </Text>
          </Pressable>
          <ConfirmDialog
            visible={confirmDelete}
            title={t('editProfile.deleteTitle')}
            message={t('editProfile.deleteMessage')}
            confirmLabel={t('editProfile.deleteAccount')}
            destructive
            loading={deleteAccount.isPending}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => deleteAccount.mutate()}
          />
        </>
      ) : null}

      <Text variant="caption" muted className="text-center">
        {tc('appName')} v1.0.3
      </Text>
    </View>
  );
}
