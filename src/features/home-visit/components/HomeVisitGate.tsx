import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { HOME_VISITS_ENABLED } from '@/features/home-visit/home-visits-enabled';
import { ComingSoon } from '@/shared/components/feedback/ComingSoon';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';

export function HomeVisitGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation('homeVisit');

  if (HOME_VISITS_ENABLED) return children;

  return (
    <Screen>
      <Header showBack title={t('title')} />
      <ComingSoon title={t('frozenTitle')} description={t('frozenDescription')} />
    </Screen>
  );
}
