import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { canToggleDoctorAndAdmin, DoctorAdminRoleToggle } from '@/features/auth/components/DoctorAdminRoleToggle';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { resolvePostAuthNavigation } from '@/features/clinic/lib/navigation';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { themeBg } from '@/shared/lib/utils';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

export function AdminRolesScreen() {
  const { t } = useTranslation('auth');
  const { user } = useCurrentUser();
  const isDark = useResolvedColorScheme() === 'dark';
  const activeRole = useAuthStore((s) => s.activeRole);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const showDoctorAdminToggle = canToggleDoctorAndAdmin(user?.roles, activeRole);
  const otherRoles =
    user?.roles.filter(
      (role) =>
        role !== activeRole &&
        !(showDoctorAdminToggle && (role === UserRole.DOCTOR || role === UserRole.ADMIN)),
    ) ?? [];

  return (
    <Screen scroll>
      <Header showBack title="الأدوار" />
      <View className="gap-4 pb-8">
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
      </View>
    </Screen>
  );
}
