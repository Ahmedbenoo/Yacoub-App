import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useObgynSummaryQuery } from '@/features/obgyn/hooks/useObgynQueries';
import { ltr } from '@/features/obgyn/lib/specialty';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';

export function ObgynSummaryCard({ visitId, audience }: { visitId: string; audience: 'patient' | 'staff' }) {
  const { t } = useTranslation(audience === 'patient' ? 'patient' : 'doctor');
  const summary = useObgynSummaryQuery(visitId);
  if (!summary.data) return null;
  const row = summary.data;
  const prefix = audience === 'patient' ? 'obgyn' : 'obgyn';

  return (
    <Card className="gap-2">
      <Text variant="label">{t(`${prefix}.title`)}</Text>
      {row.edd ? <Text variant="bodySm">{t(`${prefix}.edd`)} {ltr(row.edd)}</Text> : null}
      {audience === 'patient' && row.gestationalAgeWeeks != null ? (
        <Text variant="bodySm">{t('obgyn.ga')} {ltr(t('obgyn.weeks', { value: row.gestationalAgeWeeks }))}</Text>
      ) : null}
      {audience === 'patient' && row.fetalHeartRate != null ? (
        <View>
          <Text variant="bodySm">{t('obgyn.fhr')} {ltr(row.fetalHeartRate)}</Text>
        </View>
      ) : null}
      {audience === 'patient' && row.plan ? <Text variant="bodySm">{row.plan}</Text> : null}
      {audience === 'staff' && row.pregnancyStatus ? <Text variant="bodySm">{row.pregnancyStatus}</Text> : null}
      {audience === 'staff' && row.outcome ? <Text variant="bodySm">{row.outcome}</Text> : null}
    </Card>
  );
}
