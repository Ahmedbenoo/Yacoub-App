import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useUpdateProfileMutation } from '@/features/auth/hooks/useAuthMutations';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { pickProfileImage } from '@/shared/lib/pick-profile-image';
import { useAuthStore } from '@/shared/stores';

interface EditableAvatarProps {
  size?: 'lg' | 'xl';
  showLabel?: boolean;
}

export function EditableAvatar({ size = 'xl', showLabel = true }: EditableAvatarProps) {
  const { t } = useTranslation('auth');
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfileMutation();

  const handlePick = async () => {
    if (!user || updateProfile.isPending) return;

    const avatarUrl = await pickProfileImage();
    if (!avatarUrl) return;

    updateProfile.mutate({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      avatarUrl,
    });
  };

  if (!user) return null;

  return (
    <Pressable
      onPress={handlePick}
      disabled={updateProfile.isPending}
      accessibilityRole="button"
      accessibilityLabel={t('editProfile.changePhoto')}
      className="items-center gap-2 active:opacity-80"
    >
      <View>
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          imageUrl={user.avatarUrl}
          size={size}
        />
        <View className="absolute -bottom-0.5 -end-0.5 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary-600 dark:border-slate-900">
          <Icon name="camera" size={14} color="#FFFFFF" />
        </View>
      </View>
      {showLabel ? (
        <Text variant="label" className="text-primary-600 dark:text-primary-400">
          {updateProfile.isPending ? t('editProfile.saving') : t('editProfile.changePhoto')}
        </Text>
      ) : null}
    </Pressable>
  );
}
