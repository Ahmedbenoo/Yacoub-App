import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { reportCopy } from '@/features/admin/lib/report-copy';
import { formatDisplayDate } from '@/shared/lib/datetime';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { getAdminReportHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import type { ClinicReport } from '@/shared/types/models/admin';

interface ReportsListProps {
  reports: ClinicReport[];
}

export function ReportsList({ reports }: ReportsListProps) {
  const { t } = useTranslation('admin');
  const locale = useLocaleStore((s) => s.locale);

  if (reports.length === 0) {
    return (
      <Text variant="bodySm" muted>
        {t('reports.empty')}
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {reports.map((report) => {
        const copy = reportCopy(report, locale);
        return (
        <Card key={report.id} className="p-0">
          <HrefPressable href={getAdminReportHref(report.id)} className="gap-1 p-4 active:opacity-80">
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="label" className="flex-1 text-primary-600 dark:text-primary-400">
                {copy.period}
              </Text>
              <Text variant="caption" muted>
                {formatDisplayDate(report.generatedAt, locale)}
              </Text>
            </View>
            <Text variant="titleSm">{copy.title}</Text>
            <Text variant="bodySm" muted>
              {copy.description}
            </Text>
          </HrefPressable>
        </Card>
        );
      })}
    </View>
  );
}
