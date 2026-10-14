import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LabResultSummary } from '@/features/clinical/lab-orders/components/LabResultSummary';
import { formatDisplayDate } from '@/shared/lib/datetime';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { LabRequestStatus } from '@/shared/types/enums';
import type { LabRequest } from '@/shared/types/models/lab-request';
import { useLocaleStore } from '@/shared/stores';

export function LabResultDetailView({
  labResult,
  children,
}: {
  labResult: LabRequest;
  children?: ReactNode;
}) {
  const { t } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);
  const isCompleted = labResult.status === LabRequestStatus.COMPLETED;

  return (
    <Screen scroll className="px-5">
      <Header showBack title={labResult.testName} />

      <View className="gap-4 py-4">
        <Card className="gap-3">
          <View style={{ width: '100%', flexDirection: 'row', direction: 'ltr', justifyContent: 'flex-start' }}>
            <Badge
              label={t(`labResult.status.${labResult.status}`)}
              variant={isCompleted ? 'success' : 'info'}
            />
          </View>

          {labResult.doctorName ? (
            <View className="gap-1">
              <Text variant="label" muted>
                {t('labResult.doctor')}
              </Text>
              <Text variant="body">{labResult.doctorName}</Text>
            </View>
          ) : null}

          <View className="gap-1">
            <Text variant="label" muted>
              {t('labResult.requestedAt')}
            </Text>
            <Text variant="body">{formatDisplayDate(labResult.requestedAt, locale)}</Text>
          </View>

          {labResult.completedAt ? (
            <View className="gap-1">
              <Text variant="label" muted>
                {t('labResult.completedAt')}
              </Text>
              <Text variant="body">{formatDisplayDate(labResult.completedAt, locale)}</Text>
            </View>
          ) : null}

          <View className="gap-1">
            <Text variant="label" muted>
              {t('labResult.priority')}
            </Text>
            <Text variant="body">{t(`labResult.priorityValues.${labResult.priority}`)}</Text>
          </View>

          {labResult.resultSummary ? (
            <View className="gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Text variant="label" muted>
                {t('labResult.summary')}
              </Text>
              <LabResultSummary summary={labResult.resultSummary} />
            </View>
          ) : null}

          {labResult.notes ? (
            <View className="gap-1">
              <Text variant="label" muted>
                {t('labResult.notes')}
              </Text>
              <Text variant="body" muted>
                {labResult.notes}
              </Text>
            </View>
          ) : null}
        </Card>
        {children}
      </View>
    </Screen>
  );
}
