import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import type { MedicalDocumentKind } from '@/shared/types/models/patient';

interface UploadRecordsCardProps {
  onPick: (kind: MedicalDocumentKind) => void;
}

const OPTIONS: { kind: MedicalDocumentKind; icon: 'records' | 'clinic' | 'star' }[] = [
  { kind: 'prescription', icon: 'records' },
  { kind: 'lab', icon: 'clinic' },
  { kind: 'radiology', icon: 'star' },
];

export function UploadRecordsCard({ onPick }: UploadRecordsCardProps) {
  const { t } = useTranslation('patient');
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <Card elevated className="mb-4 gap-3 p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-600">
          <Icon name="camera" size={22} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text variant="titleSm">{t('records.upload.cardTitle')}</Text>
          <Text variant="bodySm" muted>
            {t('records.upload.cardSubtitle')}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        {OPTIONS.map((option) => (
          <Pressable
            key={option.kind}
            accessibilityRole="button"
            accessibilityLabel={t(`records.filters.${option.kind}`)}
            onPress={() => onPick(option.kind)}
            className={`min-h-[72px] flex-1 items-center justify-center gap-1 rounded-2xl px-2 py-3 active:opacity-80 ${themeBg(
              isDark,
              'bg-slate-100',
              'bg-slate-800',
            )}`}
          >
            <Icon name={option.icon} size={20} color="#0D9488" />
            <Text variant="caption" className="text-center">
              {t(`records.filters.${option.kind}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
