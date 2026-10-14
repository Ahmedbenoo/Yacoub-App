import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { LabResultDetailView } from '@/features/clinical/lab-orders/components/LabResultDetailView';
import { useStaffLabResultQuery } from '@/features/clinical/hooks/useClinicalQueries';
import { clinicalService } from '@/features/clinical/services/clinical.service';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { queryKeys } from '@/shared/api/query-keys';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

export function StaffLabResultDetailScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('patient');
  const { t: tc } = useTranslation('common');
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  const canEnter =
    roles.includes(UserRole.ADMIN) || roles.includes(UserRole.SECRETARY);
  const [summary, setSummary] = useState('');
  const queryClient = useQueryClient();
  const { data: labResult, isLoading, isError, refetch } = useStaffLabResultQuery(id ?? '');
  const saveResult = useMutation({
    mutationFn: () => clinicalService.recordLabResult(id ?? '', summary),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.clinical.labResult(result.id), result);
      queryClient.invalidateQueries({ queryKey: queryKeys.clinical.all });
      setSummary('');
      Toast.show({ type: 'success', text1: 'النتيجة اتسجلت' });
    },
  });

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen message={tc('loading')} />
      </Screen>
    );
  }

  if (isError || !labResult) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('labResult.error')} onRetry={() => refetch()} retryLabel={tc('retry')} />
      </Screen>
    );
  }

  return (
    <LabResultDetailView labResult={labResult}>
      {canEnter ? (
        <Card className="gap-3">
          <Input
            label="نتيجة التحليل"
            value={summary}
            onChangeText={setSummary}
            multiline
          />
          <Button
            title="حفظ النتيجة"
            onPress={() => saveResult.mutate()}
            loading={saveResult.isPending}
            disabled={!summary.trim()}
            fullWidth
          />
        </Card>
      ) : null}
    </LabResultDetailView>
  );
}
