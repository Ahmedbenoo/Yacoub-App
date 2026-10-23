import { Alert, Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useDeleteAccountMutation, useUpdateProfileMutation } from '@/features/auth/hooks/useAuthMutations';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '@/features/auth/schemas/auth.schemas';
import { Header } from '@/shared/components/layout/Header';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { pickProfileImage } from '@/shared/lib/pick-profile-image';
import { getChangePasswordRoute } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import { cn } from '@/shared/lib/utils';

const AVATAR_PRESETS = [
  'https://i.pravatar.cc/150?u=clinify-1',
  'https://i.pravatar.cc/150?u=clinify-2',
  'https://i.pravatar.cc/150?u=clinify-3',
  'https://i.pravatar.cc/150?u=clinify-4',
];

export function EditProfileScreen() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { user, isLoading } = useCurrentUser();
  const activeRole = useAuthStore((s) => s.activeRole);
  const updateProfile = useUpdateProfileMutation();
  const deleteAccount = useDeleteAccountMutation();

  const { control, handleSubmit, reset, setValue } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      avatarUrl: user?.avatarUrl ?? '',
      signatureUrl: user?.signatureUrl ?? '',
      stampUrl: user?.stampUrl ?? '',
    },
    values: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone ?? '',
          avatarUrl: user.avatarUrl ?? '',
          signatureUrl: user.signatureUrl ?? '',
          stampUrl: user.stampUrl ?? '',
        }
      : undefined,
  });

  const avatarUrl = useWatch({ control, name: 'avatarUrl' });
  const signatureUrl = useWatch({ control, name: 'signatureUrl' });
  const stampUrl = useWatch({ control, name: 'stampUrl' });
  const isDoctor = user?.roles.includes(UserRole.DOCTOR);
  const accountPhoto = activeRole !== UserRole.ADMIN;

  if (isLoading && !user) {
    return (
      <Screen>
        <Spinner fullScreen message={t('profile.syncing')} />
      </Screen>
    );
  }

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfile.mutate(
      {
        ...data,
        avatarUrl: accountPhoto ? data.avatarUrl : undefined,
        signatureUrl: isDoctor ? data.signatureUrl : undefined,
        stampUrl: isDoctor ? data.stampUrl : undefined,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen scroll className="px-5">
      <Header showBack title={t('editProfile.title')} />

      <View className="gap-4 pb-10 pt-4">
        <Text variant="body" muted>
          {t('editProfile.subtitle')}
        </Text>

        {accountPhoto ? (
        <Card className="items-center gap-4 py-4">
          <Avatar
            firstName={user?.firstName ?? ''}
            lastName={user?.lastName ?? ''}
            imageUrl={avatarUrl || user?.avatarUrl}
            size="xl"
          />
          <Button
            title={t('editProfile.changePhoto')}
            variant="outline"
            size="sm"
            onPress={async () => {
              const nextUrl = await pickProfileImage();
              if (nextUrl) {
                setValue('avatarUrl', nextUrl, { shouldDirty: true });
              }
            }}
          />
          <Text variant="label">{t('editProfile.avatar')}</Text>
          <Row className="flex-wrap justify-center gap-3">
            {AVATAR_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setValue('avatarUrl', preset, { shouldDirty: true })}
                className={cn(
                  'rounded-full border-2 p-0.5',
                  avatarUrl === preset ? 'border-primary-600' : 'border-transparent',
                )}
              >
                <Avatar imageUrl={preset} firstName="" lastName="" size="md" />
              </Pressable>
            ))}
          </Row>
        </Card>
        ) : null}

        {isDoctor ? (
          <Card className="gap-4">
            <View className="gap-2">
              <Text variant="label">{t('editProfile.signature')}</Text>
              <Text variant="caption" muted>
                {t('editProfile.signatureHint')}
              </Text>
              {signatureUrl ? (
                <Image source={{ uri: signatureUrl }} style={{ height: 72, width: '100%' }} resizeMode="contain" />
              ) : null}
              <Button
                title={t('editProfile.uploadSignature')}
                variant="outline"
                onPress={async () => {
                  const nextUrl = await pickProfileImage([4, 1]);
                  if (nextUrl) setValue('signatureUrl', nextUrl, { shouldDirty: true });
                }}
              />
            </View>
            <View className="gap-2">
              <Text variant="label">{t('editProfile.stamp')}</Text>
              <Text variant="caption" muted>
                {t('editProfile.stampHint')}
              </Text>
              {stampUrl ? (
                <Image source={{ uri: stampUrl }} style={{ height: 96, width: 96 }} resizeMode="contain" />
              ) : null}
              <Button
                title={t('editProfile.uploadStamp')}
                variant="outline"
                onPress={async () => {
                  const nextUrl = await pickProfileImage([1, 1]);
                  if (nextUrl) setValue('stampUrl', nextUrl, { shouldDirty: true });
                }}
              />
            </View>
          </Card>
        ) : null}

        <Card className="gap-4">
          <FormInput
            control={control}
            name="firstName"
            label={t('register.firstName')}
            placeholder={t('register.firstNamePlaceholder')}
            autoCapitalize="words"
          />
          <FormInput
            control={control}
            name="lastName"
            label={t('register.lastName')}
            placeholder={t('register.lastNamePlaceholder')}
            autoCapitalize="words"
          />
          <FormInput
            control={control}
            name="phone"
            label={t('register.phone')}
            placeholder={t('register.phonePlaceholder')}
            keyboardType="phone-pad"
          />
          {user && (
            <View className="gap-1">
              <Text variant="caption" muted>
                {t('register.email')}
              </Text>
              <Text variant="body" style={{ writingDirection: 'ltr' }}>
                {`\u2066${user.email}\u2069`}
              </Text>
            </View>
          )}
        </Card>

        <Button
          title={t('changePassword.title')}
          variant="outline"
          onPress={() => router.push(getChangePasswordRoute(activeRole) as never)}
          fullWidth
        />

        <Button
          title={updateProfile.isPending ? t('editProfile.saving') : t('editProfile.save')}
          onPress={handleSubmit(onSubmit)}
          loading={updateProfile.isPending}
          fullWidth
          size="lg"
        />

        <Button
          title={t('editProfile.discard')}
          variant="ghost"
          onPress={() => {
            reset();
            router.back();
          }}
          fullWidth
        />

        {activeRole === UserRole.PATIENT ? (
          <Button
            title={t('editProfile.deleteAccount')}
            variant="danger"
            loading={deleteAccount.isPending}
            onPress={() => {
              Alert.alert(t('editProfile.deleteTitle'), t('editProfile.deleteMessage'), [
                { text: tc('cancel'), style: 'cancel' },
                {
                  text: t('editProfile.deleteAccount'),
                  style: 'destructive',
                  onPress: () => deleteAccount.mutate(),
                },
              ]);
            }}
            fullWidth
          />
        ) : null}
      </View>
    </Screen>
  );
}
