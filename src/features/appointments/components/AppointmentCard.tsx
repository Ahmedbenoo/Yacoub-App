import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge';
import { getParticipantName } from '@/features/appointments/lib/formatters';
import { formatDisplayDateTimeCompact } from '@/shared/lib/datetime';
import { Row } from '@/shared/components/layout/Row';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { getAppointmentHref } from '@/shared/navigation/routes';
import type { Appointment } from '@/shared/types/models/appointment';
import { UserRole } from '@/shared/types/enums';
import { useLocaleStore } from '@/shared/stores';

interface AppointmentCardProps {
  appointment: Appointment;
  viewerRole: UserRole;
  href?: Href;
  onPress?: () => void;
}

export function AppointmentCard({ appointment, viewerRole, href, onPress }: AppointmentCardProps) {
  const { t } = useTranslation('appointments');
  const locale = useLocaleStore((s) => s.locale);
  const { isRtl } = useLayoutDirection();
  const interactive = Boolean(href || onPress);

  const counterpart =
    viewerRole === UserRole.DOCTOR
      ? appointment.patient
      : appointment.doctor;

  const counterpartLabel =
    viewerRole === UserRole.DOCTOR
      ? t('patient')
      : viewerRole === UserRole.PATIENT
        ? t('doctor')
        : `${t('doctor')} / ${t('patient')}`;

  const title =
    viewerRole === UserRole.ADMIN || viewerRole === UserRole.SECRETARY
      ? `${getParticipantName(appointment.patient.firstName, appointment.patient.lastName)} · ${getParticipantName(appointment.doctor.firstName, appointment.doctor.lastName)}`
      : getParticipantName(counterpart.firstName, counterpart.lastName);

  const body = (
    <>
      <View
        className="absolute bottom-0 top-0 w-1 bg-primary-500"
        style={isRtl ? { right: 0 } : { left: 0 }}
      />

      <Row className={`items-start gap-2.5 ${isRtl ? 'pe-1.5' : 'ps-1.5'}`}>
        <Avatar firstName={counterpart.firstName} lastName={counterpart.lastName} size="sm" />

        <View className="min-w-0 flex-1 gap-1.5">
          <Row className="items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <Text variant="bodySm" className="font-semibold" numberOfLines={1}>
                {title}
              </Text>
              <Text variant="caption" muted>
                {counterpartLabel}
              </Text>
            </View>
            <AppointmentStatusBadge status={appointment.status} />
          </Row>

          <View className="gap-1">
            <Row className="min-w-0 items-center gap-1.5">
              <Icon name="clock" size={14} color="#64748B" />
              <Text variant="caption" numberOfLines={1} className="min-w-0 flex-1 shrink">
                {formatDisplayDateTimeCompact(appointment.scheduledAt, locale)}
              </Text>
            </Row>
            <Row className="items-center gap-1.5">
              <Icon name="location" size={14} color="#64748B" />
              <Text variant="caption" muted numberOfLines={1} className="min-w-0 flex-1 shrink">
                {appointment.branchName} · {t('minutes', { count: appointment.durationMinutes })}
              </Text>
            </Row>
          </View>

          {appointment.reason ? (
            <Text variant="caption" muted numberOfLines={1}>
              {appointment.reason}
            </Text>
          ) : null}
        </View>
      </Row>
    </>
  );

  if (!interactive) {
    return <Card className="gap-2 overflow-hidden p-3">{body}</Card>;
  }

  return (
    <Card className="overflow-hidden p-0">
      <Pressable
        accessibilityRole="button"
        className="gap-2 p-3 active:opacity-80"
        onPress={() => {
          if (onPress) {
            onPress();
            return;
          }

          const id = String(appointment.id);
          if (!id) {
            return;
          }

          router.push(getAppointmentHref(viewerRole, id));
        }}
      >
        {body}
      </Pressable>
    </Card>
  );
}
