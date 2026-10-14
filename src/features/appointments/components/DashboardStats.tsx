import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppointmentsQuery } from '@/features/appointments/hooks/useAppointmentQueries';
import { Row } from '@/shared/components/layout/Row';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import { AppointmentStatus, UserRole } from '@/shared/types/enums';

interface DashboardStatsProps {
  role: UserRole.DOCTOR | UserRole.PATIENT;
}

type StatTone = 'primary' | 'warning';

const STAT_TONES: Record<StatTone, { icon: string; iconBg: string; ring: string }> = {
  primary: {
    icon: '#0D9488',
    iconBg: '#CCFBF1',
    ring: '#99F6E4',
  },
  warning: {
    icon: '#D97706',
    iconBg: '#FEF3C7',
    ring: '#FDE68A',
  },
};

function StatTile({
  icon,
  label,
  value,
  tone,
  onPress,
}: {
  icon: 'calendar' | 'clock';
  label: string;
  value: number;
  tone: StatTone;
  onPress: () => void;
}) {
  const colors = STAT_TONES[tone];
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-w-0 flex-1 overflow-hidden rounded-2xl border ${themeBg(isDark, 'bg-white', 'bg-slate-800')}`}
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

export function DashboardStats({ role }: DashboardStatsProps) {
  const { t } = useTranslation('appointments');
  const user = useAuthStore((s) => s.user);

  const todayFilters = {
    scope: 'today' as const,
    doctorId: role === UserRole.DOCTOR ? user?.id : undefined,
    patientId: role === UserRole.PATIENT ? user?.id : undefined,
  };

  const awaitingFilters = {
    status: AppointmentStatus.SCHEDULED,
    doctorId: role === UserRole.DOCTOR ? user?.id : undefined,
    patientId: role === UserRole.PATIENT ? user?.id : undefined,
  };

  const { data: todayData } = useAppointmentsQuery(todayFilters, Boolean(user));
  const { data: awaitingData } = useAppointmentsQuery(awaitingFilters, Boolean(user));
  const todayCount = todayData?.data.length ?? 0;
  const awaitingCount = awaitingData?.data.length ?? 0;

  const openAppointments = (scope: 'today' | 'scheduled') => {
    const pathname =
      role === UserRole.DOCTOR ? '/(doctor)/(tabs)/appointments' : '/(patient)/(tabs)/appointments';
    router.push({ pathname, params: { scope, focus: String(Date.now()) } } as never);
  };

  return (
    <Row className="gap-2">
      <StatTile
        icon="calendar"
        label={t('stats.today')}
        value={todayCount}
        tone="primary"
        onPress={() => openAppointments('today')}
      />
      <StatTile
        icon="clock"
        label={t('stats.awaitingConfirmation')}
        value={awaitingCount}
        tone="warning"
        onPress={() => openAppointments('scheduled')}
      />
    </Row>
  );
}
