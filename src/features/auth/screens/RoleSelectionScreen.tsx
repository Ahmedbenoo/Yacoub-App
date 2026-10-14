import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { resolvePostAuthNavigation } from '@/features/clinic/lib/navigation';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import { useRequireAuth } from '@/shared/navigation/guards';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Logo } from '@/shared/components/brand/Logo';

const ROLE_OPTIONS = [
  {
    role: UserRole.DOCTOR,
    titleKey: 'roleSelection.doctor',
    descKey: 'roleSelection.doctorDescription',
    icon: '🩺',
  },
  {
    role: UserRole.PATIENT,
    titleKey: 'roleSelection.patient',
    descKey: 'roleSelection.patientDescription',
    icon: '👤',
  },
  {
    role: UserRole.ADMIN,
    titleKey: 'roleSelection.admin',
    descKey: 'roleSelection.adminDescription',
    icon: '🏥',
  },
  {
    role: UserRole.SECRETARY,
    titleKey: 'roleSelection.secretary',
    descKey: 'roleSelection.secretaryDescription',
    icon: '📋',
  },
  {
    role: UserRole.NURSE,
    titleKey: 'roleSelection.nurse',
    descKey: 'roleSelection.nurseDescription',
    icon: '💉',
  },
  {
    role: UserRole.NURSING_ADMIN,
    titleKey: 'roleSelection.nursing_admin',
    descKey: 'roleSelection.nursing_adminDescription',
    icon: '🏠',
  },
] as const;

export function RoleSelectionScreen() {
  useRequireAuth();
  const { t } = useTranslation('auth');
  const { user, isLoading } = useCurrentUser();
  const activeRole = useAuthStore((s) => s.activeRole);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(activeRole);
  const [isSaving, setIsSaving] = useState(false);

  const availableRoles = ROLE_OPTIONS.filter((option) => user?.roles.includes(option.role));

  if (isLoading && !user) {
    return (
      <Screen>
        <Spinner fullScreen message={t('roleSelection.loading')} />
      </Screen>
    );
  }

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsSaving(true);
    try {
      await setActiveRole(selectedRole);
      if (user) {
        await resolvePostAuthNavigation(user);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen scroll>
      <View className="flex-1 py-8">
        <View className="mb-8 items-center">
          <Logo size="md" className="mb-4" />
          <Text variant="titleLg" className="mb-2 text-center">
            {t('roleSelection.title')}
          </Text>
          <Text variant="body" muted className="text-center">
            {t('roleSelection.subtitle')}
          </Text>
        </View>

        <View className="gap-3">
          {availableRoles.map((option) => {
            const isSelected = selectedRole === option.role;
            return (
              <Card
                key={option.role}
                className={`p-0 ${isSelected ? 'border-2 border-primary-600' : ''}`}
              >
                <Pressable
                  onPress={() => setSelectedRole(option.role)}
                  className="flex-row items-center gap-4 p-4 active:opacity-80"
                >
                  <Text variant="titleLg">{option.icon}</Text>
                  <View className="flex-1">
                    <Text variant="titleSm">{t(option.titleKey)}</Text>
                    <Text variant="bodySm" muted>
                      {t(option.descKey)}
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-600">
                      <Text variant="caption" className="text-center text-white">
                        ✓
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Card>
            );
          })}
        </View>

        <View className="mt-8">
          <Button
            title={t('roleSelection.continue')}
            onPress={handleContinue}
            disabled={!selectedRole}
            loading={isSaving}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </Screen>
  );
}
