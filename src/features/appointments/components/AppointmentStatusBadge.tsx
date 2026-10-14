import { useTranslation } from 'react-i18next';

import { Badge } from '@/shared/components/ui/Badge';
import { AppointmentStatus } from '@/shared/types/enums';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
}

const statusVariantMap: Record<AppointmentStatus, 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'> = {
  [AppointmentStatus.SCHEDULED]: 'info',
  [AppointmentStatus.CONFIRMED]: 'success',
  [AppointmentStatus.IN_PROGRESS]: 'purple',
  [AppointmentStatus.COMPLETED]: 'default',
  [AppointmentStatus.CANCELLED]: 'error',
  [AppointmentStatus.NO_SHOW]: 'warning',
};

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const { t } = useTranslation('appointments');

  return <Badge label={t(`status.${status}`)} variant={statusVariantMap[status]} />;
}
