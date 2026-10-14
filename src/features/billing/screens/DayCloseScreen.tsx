import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDayCloseQuery, useTodayInvoicesQuery } from '@/features/billing/hooks/useBillingQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useAuthStore } from '@/shared/stores';

function money(amount: number) {
  return `${amount.toLocaleString('en-US')} ج.م`;
}

export function DayCloseScreen() {
  const { t } = useTranslation('appointments');
  const clinicId = useAuthStore((state) => state.activeClinicId);
  const summaryQuery = useDayCloseQuery(clinicId ?? undefined);
  const invoicesQuery = useTodayInvoicesQuery(clinicId ?? undefined);
  const summary = summaryQuery.data;

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={t('billing.dayClose')} />
      <View className="gap-4 pb-10">
        {summaryQuery.isLoading ? <Spinner /> : null}
        {summary ? (
          <Card className="gap-2">
            <Text variant="titleSm">{t('billing.today')}</Text>
            <Text variant="bodySm">{t('billing.collected', { amount: money(summary.collected) })}</Text>
            <Text variant="bodySm">{t('billing.openAmount', { amount: money(summary.open) })}</Text>
            <Text variant="bodySm">{t('billing.doctorsTotal', { amount: money(summary.doctorShare) })}</Text>
            <Text variant="bodySm">{t('billing.clinicTotal', { amount: money(summary.clinicShare) })}</Text>
          </Card>
        ) : null}
        {(summary?.doctors ?? []).map((doctor) => (
          <Card key={doctor.doctorId} className="gap-1">
            <Text variant="label">{doctor.doctorName}</Text>
            <Text variant="caption" muted>
              {t('billing.doctorLine', {
                percent: doctor.sharePercent,
                doctor: money(doctor.doctorShare),
                clinic: money(doctor.clinicShare),
              })}
            </Text>
          </Card>
        ))}
        {(invoicesQuery.data ?? []).map((invoice) => (
          <Card key={invoice.id} className="gap-1">
            <Text variant="bodySm">
              {invoice.patientName} — {invoice.doctorName}
            </Text>
            <Text variant="caption" style={{ writingDirection: 'ltr' }}>
              {money(invoice.amount)}
            </Text>
            <Text variant="caption" muted>
              {invoice.status === 'paid'
                ? t('billing.paidWith', { method: t(`billing.methods.${invoice.paymentMethod ?? 'cash'}`) })
                : t('billing.open')}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
