import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import type { MedicalHistoryEntry } from '@/shared/types/models/patient';

interface MedicalRecordImageModalProps {
  entry: MedicalHistoryEntry | null;
  onClose: () => void;
  visitHref?: Href | null;
  canReply?: boolean;
  replyLoading?: boolean;
  onReply?: (message: string) => void;
}

export function MedicalRecordImageModal({
  entry,
  onClose,
  visitHref,
  canReply,
  replyLoading,
  onReply,
}: MedicalRecordImageModalProps) {
  const { t } = useTranslation('patient');
  const isDark = useResolvedColorScheme() === 'dark';
  const [reply, setReply] = useState('');

  useEffect(() => {
    setReply(entry?.doctorReply ?? '');
  }, [entry]);

  return (
    <Modal visible={Boolean(entry?.imageUrl)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/70" onPress={onClose}>
        <Pressable
          className={`rounded-t-3xl p-5 ${themeBg(isDark, 'bg-white', 'bg-slate-900')}`}
          onPress={(event) => event.stopPropagation()}
        >
          <Text variant="titleSm" className="mb-1 text-center">
            {entry ? t(`history.types.${entry.type}`) : ''}
          </Text>
          {entry?.title ? (
            <Text variant="bodySm" muted className="mb-1 text-center">
              {entry.title}
            </Text>
          ) : null}
          {entry?.description ? (
            <Text variant="caption" muted className="mb-3 text-center">
              {t('records.linkedTo', { doctor: entry.description })}
            </Text>
          ) : null}
          {entry?.imageUrl ? (
            <Image
              source={{ uri: entry.imageUrl }}
              className="mb-4 h-80 w-full rounded-2xl bg-slate-100"
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          ) : null}
          {entry?.doctorReply ? (
            <View className="mb-3 rounded-2xl bg-primary-50 px-4 py-3 dark:bg-primary-900/20">
              <Text variant="caption" className="mb-1 text-primary-700 dark:text-primary-300">
                {t('records.doctorReply')}
              </Text>
              <Text variant="bodySm">{entry.doctorReply}</Text>
            </View>
          ) : null}
          {canReply ? (
            <Input
              label={t('records.replyLabel')}
              value={reply}
              onChangeText={setReply}
              placeholder={t('records.replyPlaceholder')}
            />
          ) : null}
          <View className="mt-3 gap-2">
            {canReply ? (
              <Button
                title={t('records.sendReply')}
                loading={replyLoading}
                onPress={() => {
                  const message = reply.trim();
                  if (!message) return;
                  onReply?.(message);
                }}
              />
            ) : null}
            {visitHref ? (
              <Button
                title={t('records.openVisit')}
                variant="outline"
                onPress={() => {
                  onClose();
                  router.push(visitHref);
                }}
              />
            ) : null}
            <Button title={t('records.closePreview')} variant={canReply ? 'ghost' : 'primary'} onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
