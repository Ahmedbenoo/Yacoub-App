import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useMyChildrenQuery } from '@/features/obgyn/hooks/useObgynQueries';
import { useMyPatientProfileQuery } from '@/features/patients/hooks/usePatientRecordsQueries';
import { WalletPanel } from '@/features/wallet/components/WalletPanel';
import { Screen } from '@/shared/components/layout/Screen';
import { SettingsPanel } from '@/shared/components/layout/SettingsPanel';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/shared/stores';
import { EditableAvatar } from '@/shared/components/profile/EditableAvatar';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { formatPhoneForDisplay } from '@/shared/lib/phone';
import { getEditProfileRoute, getPatientChildHref } from '@/shared/navigation/routes';

export function PatientProfileTabScreen() {
  const { t } = useTranslation(['patient', 'auth']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const activeRole = useAuthStore((s) => s.activeRole);
  const { data: profile, isLoading } = useMyPatientProfileQuery();
  const children = useMyChildrenQuery(isAuthenticated);
  const phone = user?.phone || profile?.phone;
  const firstName = user?.firstName || profile?.firstName;
  const lastName = user?.lastName || profile?.lastName;

  return (
    <Screen scroll>
      <Text variant="titleLg" className="py-4">
        {t('tabs.profile')}
      </Text>

      {!isAuthenticated && (
        <Card elevated className="mb-4 gap-3">
          <Text variant="titleSm">{t('guest.profileTitle')}</Text>
          <Text variant="bodySm" muted>
            {t('guest.profileDescription')}
          </Text>
          <Button title={t('auth:login.signIn')} onPress={() => router.push('/(auth)/login')} fullWidth />
        </Card>
      )}

      {isAuthenticated && isLoading && <Spinner />}

      {isAuthenticated && (profile || user) && (
        <Card elevated className="mb-4 items-center gap-3 py-5">
          <EditableAvatar size="xl" />
          {firstName || lastName ? (
            <Text variant="titleMd" className="text-center">
              {firstName} {lastName}
            </Text>
          ) : null}
          {phone ? (
            <Text variant="bodySm" muted className="text-center" style={{ writingDirection: 'ltr' }}>
              {`\u2066${formatPhoneForDisplay(phone)}\u2069`}
            </Text>
          ) : null}
          <Button
            title={t('auth:editProfile.title')}
            variant="outline"
            onPress={() => router.push(getEditProfileRoute(activeRole) as never)}
            fullWidth
          />
        </Card>
      )}

      {isAuthenticated ? <WalletPanel mode="self" /> : null}
      {(children.data ?? []).length > 0 ? (
        <Card className="mb-4 gap-2">
          <Text variant="label">{t('obgyn.children')}</Text>
          {(children.data ?? []).map((child) => (
            <Button
              key={child.id}
              title={t('obgyn.childPage')}
              variant="outline"
              onPress={() => router.push(getPatientChildHref(child.childPatientId))}
            />
          ))}
        </Card>
      ) : null}
      <SettingsPanel showAvatar={false} showAccountCard={false} />
    </Screen>
  );
}
