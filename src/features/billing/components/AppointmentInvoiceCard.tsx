import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  useAppointmentInvoiceQuery,
  useIssueInvoiceMutation,
  usePayInvoiceMutation,
} from '@/features/billing/hooks/useBillingQueries';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import type { InvoicePaymentMethod } from '@/shared/types/models/invoice';

function money(amount: number) {
  return `${amount.toLocaleString('en-US')} ج.م`;
}

const METHODS: InvoicePaymentMethod[] = ['cash', 'instapay', 'wallet'];

export function AppointmentInvoiceCard({
  appointmentId,
  canManage,
  canIssue,
  canSeeShare = false,
}: {
  appointmentId: string;
  canManage: boolean;
  canIssue: boolean;
  canSeeShare?: boolean;
}) {
  const { t } = useTranslation('appointments');
  const invoiceQuery = useAppointmentInvoiceQuery(appointmentId);
  const issue = useIssueInvoiceMutation();
  const pay = usePayInvoiceMutation();
  const invoice = invoiceQuery.data;

  if (!invoice && !canIssue) return null;

  return (
    <Card className="gap-3">
      <Text variant="titleSm">{t('billing.title')}</Text>
      {!invoice ? (
        <Button
          title={t('billing.issue')}
          fullWidth
          loading={issue.isPending}
          onPress={() => issue.mutate(appointmentId)}
        />
      ) : (
        <View className="gap-2">
          <Text variant="bodySm">
            {invoice.patientName} — {invoice.doctorName}
          </Text>
          <Text variant="titleSm" style={{ writingDirection: 'ltr' }}>
            {money(invoice.amount)}
          </Text>
          {canSeeShare ? (
            <View className="gap-1">
              <Text variant="caption" muted>
                {t('billing.doctorShare', { percent: invoice.doctorSharePercent, amount: money(invoice.doctorShare) })}
              </Text>
              <Text variant="caption" muted>
                {t('billing.clinicShare', { amount: money(invoice.clinicShare) })}
              </Text>
            </View>
          ) : null}
          <Text variant="caption">
            {invoice.status === 'paid'
              ? t('billing.paidWith', { method: t(`billing.methods.${invoice.paymentMethod ?? 'cash'}`) })
              : t('billing.open')}
          </Text>
          {canManage && invoice.status === 'open' ? (
            <View className="gap-2">
              {METHODS.map((method) => (
                <Button
                  key={method}
                  title={t('billing.payWith', { method: t(`billing.methods.${method}`) })}
                  variant="outline"
                  fullWidth
                  loading={pay.isPending}
                  onPress={() => pay.mutate({ appointmentId, paymentMethod: method })}
                />
              ))}
            </View>
          ) : null}
        </View>
      )}
    </Card>
  );
}
