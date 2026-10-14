import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getDayName } from '@/features/doctor/lib/formatters';
import { Select, type SelectOption } from '@/shared/components/form/Select';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { cn, themeBg } from '@/shared/lib/utils';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

interface AvailabilityDayCardProps {
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  timeOptions: SelectOption[];
  onToggle: () => void;
  onChangeHours: (startTime: string, endTime: string) => void;
  disabled?: boolean;
}

export function AvailabilityDayCard({
  dayOfWeek,
  startTime,
  endTime,
  timeOptions,
  onToggle,
  onChangeHours,
  disabled,
}: AvailabilityDayCardProps) {
  const { t } = useTranslation('doctor');
  const isDark = useResolvedColorScheme() === 'dark';
  const isActive = Boolean(startTime && endTime);

  return (
    <Card
      className={cn(
        'gap-3 p-4',
        isActive && (isDark ? 'border-primary-800' : 'border-primary-200'),
        disabled && 'opacity-60',
      )}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            'h-11 w-11 items-center justify-center rounded-xl',
            isActive
              ? themeBg(isDark, 'bg-primary-100', 'bg-primary-900/40')
              : themeBg(isDark, 'bg-slate-100', 'bg-slate-800'),
          )}
        >
          <Icon name="calendar" size={20} color={isActive ? '#0D9488' : '#94A3B8'} />
        </View>

        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <Text variant="titleSm">{getDayName(dayOfWeek)}</Text>
          <Badge
            label={isActive ? t('availability.available') : t('availability.off')}
            variant={isActive ? 'success' : 'default'}
          />
        </View>

        <Pressable onPress={onToggle} disabled={disabled} className="active:opacity-70">
          <Text variant="caption" className="text-primary-700">
            {isActive ? t('availability.turnOff') : t('availability.turnOn')}
          </Text>
        </Pressable>
      </View>

      {isActive && startTime && endTime ? (
        <View className="flex-row gap-3">
          <View className="min-w-0 flex-1">
            <Select
              label={t('availability.from')}
              value={startTime}
              options={timeOptions}
              onChange={(nextStart) => onChangeHours(nextStart, endTime)}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Select
              label={t('availability.to')}
              value={endTime}
              options={timeOptions}
              onChange={(nextEnd) => onChangeHours(startTime, nextEnd)}
            />
          </View>
        </View>
      ) : (
        <Text variant="caption" muted>
          {t('availability.noSlots')}
        </Text>
      )}
    </Card>
  );
}
