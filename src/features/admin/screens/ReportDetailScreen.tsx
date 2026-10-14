import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { reportCopy } from '@/features/admin/lib/report-copy';
import { formatDisplayDate } from '@/shared/lib/datetime';
import { useClinicReportDetailQuery } from '@/features/admin/hooks/useAdminQueries';
import { Header } from '@/shared/components/layout/Header';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import type { ReportMetric } from '@/shared/types/models/admin';

function MetricTile({ metric }: { metric: ReportMetric }) {
  const tone = metric.tone ?? 'default';
  const isDark = useResolvedColorScheme() === 'dark';
  const toneClass =
    tone === 'primary'
      ? themeBg(isDark, 'border-primary-200 bg-primary-50', 'border-primary-800 bg-primary-950/40')
      : tone === 'success'
        ? 'border-status-success/30 bg-status-success/10'
        : tone === 'warning'
          ? 'border-status-warning/30 bg-status-warning/10'
          : themeBg(isDark, 'border-slate-200 bg-slate-50', 'border-slate-700 bg-slate-800');

  return (
    <View
      className={`min-w-0 flex-1 basis-[48%] rounded-2xl border px-3 py-3 ${toneClass}`}
    >
      <Text variant="titleSm" style={{ writingDirection: 'ltr', alignSelf: 'auto' }}>
        {metric.value}
      </Text>
      <Text variant="caption" muted numberOfLines={2}>
        {metric.label}
      </Text>
    </View>
  );
}

export function ReportDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const locale = useLocaleStore((s) => s.locale);
  const { data: report, isLoading, isError, refetch } = useClinicReportDetailQuery(id ?? '');
  const copy = report ? reportCopy(report, locale) : null;

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen message={tc('loading')} />
      </Screen>
    );
  }

  if (isError || !report) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('reports.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={t('reports.detailTitle')} />

      <View className="gap-4 pb-10">
        <View className="gap-1">
          <Text variant="label" className="text-primary-600 dark:text-primary-400">
            {copy?.period}
          </Text>
          <Text variant="titleLg">{copy?.title}</Text>
          <Text variant="caption" muted>
            {t('reports.generatedAt', {
              date: formatDisplayDate(report.generatedAt, locale),
            })}
          </Text>
        </View>

        <Card className="gap-2">
          <Text variant="body">{copy?.description}</Text>
          {copy?.summary ? (
            <Text variant="bodySm" muted>
              {copy.summary}
            </Text>
          ) : null}
        </Card>

        {copy?.metrics && copy.metrics.length > 0 && (
          <View className="gap-3">
            <Text variant="label">{t('reports.metrics')}</Text>
            <Row className="flex-wrap gap-2">
              {copy.metrics.map((metric) => (
                <MetricTile key={`${metric.label}-${metric.value}`} metric={metric} />
              ))}
            </Row>
          </View>
        )}

        {copy?.highlights && copy.highlights.length > 0 && (
          <Card className="gap-3">
            <Text variant="label">{t('reports.highlights')}</Text>
            {copy.highlights.map((highlight) => (
              <Row key={highlight} className="items-start gap-2">
                <Text variant="bodySm" className="text-primary-600 dark:text-primary-400">
                  •
                </Text>
                <Text variant="bodySm" className="flex-1">
                  {highlight}
                </Text>
              </Row>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}
