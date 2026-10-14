import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Row } from '@/shared/components/layout/Row';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import type { ClinicStats } from '@/shared/types/models/admin';

interface ClinicStatsGridProps {
  stats: ClinicStats;
}

type StatTone = 'primary' | 'success';

const STAT_TONES: Record<StatTone, { icon: string; iconBg: string; ring: string }> = {
  primary: {
    icon: '#0D9488',
    iconBg: '#CCFBF1',
    ring: '#99F6E4',
  },
  success: {
    icon: '#059669',
    iconBg: '#D1FAE5',
    ring: '#A7F3D0',
  },
};

function StatTile({
  icon,
  label,
  value,
  tone,
  wide = false,
  onPress,
}: {
  icon: 'doctors' | 'patients' | 'calendar' | 'records';
  label: string;
  value: number;
  tone: StatTone;
  wide?: boolean;
  onPress: () => void;
}) {
  const colors = STAT_TONES[tone];
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`overflow-hidden rounded-2xl border active:opacity-80 ${themeBg(isDark, 'bg-white', 'bg-slate-800')} ${wide ? 'w-full' : 'min-w-0 flex-1 basis-[48%]'}`}
      style={{ borderColor: colors.ring }}
    >
      <Row className="items-center gap-2.5 px-3 py-3">
        <View
          className="h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.iconBg }}
        >
          <Icon name={icon} size={17} color={colors.icon} />
        </View>

        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="titleSm" numberOfLines={1}>
            {value}
          </Text>
          <Text variant="caption" muted numberOfLines={2}>
            {label}
          </Text>
        </View>
      </Row>
    </Pressable>
  );
}

export function ClinicStatsGrid({ stats }: ClinicStatsGridProps) {
  const { t } = useTranslation('admin');

  const openAppointments = (scope: 'today' | 'completed') => {
    router.push({
      pathname: '/(admin)/(tabs)/appointments',
      params: { scope, focus: String(Date.now()) },
    } as never);
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      <StatTile
        icon="doctors"
        label={t('stats.doctors')}
        value={stats.doctorsCount}
        tone="primary"
        onPress={() => router.push('/(admin)/(tabs)/doctors' as never)}
      />
      <StatTile
        icon="patients"
        label={t('stats.patients')}
        value={stats.patientsCount}
        tone="primary"
        onPress={() => router.push('/(admin)/(tabs)/patients' as never)}
      />
      <StatTile
        icon="calendar"
        label={t('stats.today')}
        value={stats.appointmentsToday}
        tone="primary"
        onPress={() => openAppointments('today')}
      />
      <StatTile
        icon="records"
        label={t('stats.completed')}
        value={stats.completedThisMonth}
        tone="success"
        wide
        onPress={() => openAppointments('completed')}
      />
    </View>
  );
}
