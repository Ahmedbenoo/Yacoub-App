import { useTranslation } from 'react-i18next';

import { useHomeVisitSettingQuery } from '@/features/home-visit/hooks/useHomeVisitQueries';
import { SettingsNavRow } from '@/shared/components/layout/SettingsNavRow';

export function DoctorHomeVisitNavRow() {
  const { t } = useTranslation('homeVisit');
  const setting = useHomeVisitSettingQuery();
  const enabled = Boolean(setting.data?.enabled);

  return (
    <SettingsNavRow
      title={t('doctorEntryTitle')}
      subtitle={enabled ? t('doctorEntrySubtitleOn') : t('doctorEntrySubtitleOff')}
      icon="location"
      href="/(doctor)/home-visits"
    />
  );
}
