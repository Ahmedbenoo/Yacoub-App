import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 items-center justify-center bg-black/45 px-6" onPress={onCancel}>
        <Pressable
          className={`w-full max-w-sm rounded-2xl p-5 ${themeBg(isDark, 'bg-white', 'bg-slate-900')}`}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="gap-4">
            <View className="gap-2">
              <Text variant="titleSm">{title}</Text>
              <Text variant="body" muted>
                {message}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Button
                title={cancelLabel ?? t('cancel')}
                variant="secondary"
                testID="confirm-dialog-cancel"
                onPress={onCancel}
                disabled={loading}
                className="flex-1"
              />
              <Button
                title={confirmLabel ?? t('confirm')}
                variant={destructive ? 'danger' : 'primary'}
                testID="confirm-dialog-confirm"
                onPress={onConfirm}
                loading={loading}
                className="flex-1"
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
