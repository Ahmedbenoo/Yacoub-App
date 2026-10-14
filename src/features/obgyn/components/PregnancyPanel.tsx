import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  useClosePregnancyMutation,
  useCreatePregnancyMutation,
  usePregnanciesQuery,
} from '@/features/obgyn/hooks/useObgynQueries';
import { eddFromLmp, ltr } from '@/features/obgyn/lib/specialty';
import { pregnancyCloseSchema, pregnancyCreateSchema } from '@/features/obgyn/schemas/obgyn.schemas';
import { obgynService } from '@/features/obgyn/services/obgyn.service';
import { Select } from '@/shared/components/form/Select';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { getDoctorChildHref } from '@/shared/navigation/routes';
import type { PregnancyRecord } from '@/shared/types/models/obgyn';

function ChildLink({ pregnancyId }: { pregnancyId: string }) {
  const { t } = useTranslation('doctor');
  const link = useQuery({
    queryKey: ['obgyn', 'child-link', pregnancyId],
    queryFn: () => obgynService.childLink(pregnancyId),
  });
  if (!link.data) return null;
  return (
    <Button
      title={t('obgyn.childPage')}
      variant="outline"
      onPress={() => router.push(getDoctorChildHref(link.data!.childPatientId))}
    />
  );
}

function PregnancyCard({ pregnancy, patientId }: { pregnancy: PregnancyRecord; patientId: string }) {
  const { t } = useTranslation('doctor');
  const close = useClosePregnancyMutation(patientId);
  const [outcome, setOutcome] = useState('');
  const [outcomeKind, setOutcomeKind] = useState<'live_birth' | 'ended'>('live_birth');
  const [childFirstName, setChildFirstName] = useState('');
  const [childGender, setChildGender] = useState<'male' | 'female' | ''>('');
  const [error, setError] = useState<string>();
  const statusKey = pregnancy.status === 'ended' ? 'closed' : pregnancy.status;

  return (
    <View className="gap-2">
      <Text variant="label">{t(`obgyn.${statusKey}`)}</Text>
      <Text variant="bodySm">{t('obgyn.lmp')} {ltr(pregnancy.lmp)}</Text>
      {pregnancy.edd ? <Text variant="bodySm">{t('obgyn.edd')} {ltr(pregnancy.edd)}</Text> : null}
      {pregnancy.outcome ? <Text variant="bodySm">{pregnancy.outcome}</Text> : null}
      {pregnancy.status === 'delivered' ? <ChildLink pregnancyId={pregnancy.id} /> : null}
      {pregnancy.status === 'active' ? (
        <>
          <Select
            label={t('obgyn.outcome')}
            value={outcomeKind}
            onChange={(value) => setOutcomeKind(value as 'live_birth' | 'ended')}
            options={[
              { value: 'live_birth', label: t('obgyn.liveBirth') },
              { value: 'ended', label: t('obgyn.ended') },
            ]}
          />
          <Input label={t('obgyn.outcome')} value={outcome} onChangeText={setOutcome} />
          {outcomeKind === 'live_birth' ? (
            <>
              <Input label={t('obgyn.childName')} value={childFirstName} onChangeText={setChildFirstName} />
              <Select
                label={t('obgyn.childGender')}
                value={childGender}
                onChange={(value) => setChildGender(value as 'male' | 'female')}
                options={[
                  { value: 'female', label: t('obgyn.female') },
                  { value: 'male', label: t('obgyn.male') },
                ]}
              />
            </>
          ) : null}
          {error ? <Text variant="caption" className="text-status-error">{error}</Text> : null}
          <Button
            title={t('obgyn.closePregnancy')}
            variant="outline"
            loading={close.isPending}
            onPress={() => {
              const parsed = pregnancyCloseSchema.safeParse({
                outcomeKind,
                outcome,
                childFirstName,
                childGender: childGender || undefined,
              });
              if (!parsed.success) {
                const key = parsed.error.issues[0]?.message ?? 'outcomeRequired';
                setError(t(`obgyn.errors.${key}`, { defaultValue: key }));
                return;
              }
              setError(undefined);
              close.mutate({ id: pregnancy.id, input: parsed.data });
            }}
          />
        </>
      ) : null}
    </View>
  );
}

export function PregnancyPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation('doctor');
  const pregnancies = usePregnanciesQuery(patientId);
  const create = useCreatePregnancyMutation(patientId);
  const [lmp, setLmp] = useState('');
  const [gravida, setGravida] = useState('');
  const [para, setPara] = useState('');
  const [error, setError] = useState<string>();
  const hasActive = (pregnancies.data ?? []).some((item) => item.status === 'active');

  return (
    <Card className="gap-3">
      <Text variant="titleSm">{t('obgyn.title')}</Text>
      {(pregnancies.data ?? []).map((pregnancy) => (
        <PregnancyCard key={pregnancy.id} pregnancy={pregnancy} patientId={patientId} />
      ))}
      {!hasActive ? (
        <>
          <Input label={t('obgyn.lmp')} value={lmp} onChangeText={setLmp} placeholder="2026-08-01" />
          <Input label={t('obgyn.gravida')} value={gravida} onChangeText={setGravida} keyboardType="number-pad" />
          <Input label={t('obgyn.para')} value={para} onChangeText={setPara} keyboardType="number-pad" />
          {error ? <Text variant="caption" className="text-status-error">{error}</Text> : null}
          <Button
            title={t('obgyn.createPregnancy')}
            loading={create.isPending}
            onPress={() => {
              const parsed = pregnancyCreateSchema.safeParse({ lmp, gravida, para });
              if (!parsed.success) {
                const key = parsed.error.issues[0]?.message ?? 'lmpRequired';
                setError(t(`obgyn.errors.${key}`, { defaultValue: key }));
                return;
              }
              setError(undefined);
              create.mutate({
                lmp: parsed.data.lmp,
                edd: eddFromLmp(parsed.data.lmp),
                gravida: parsed.data.gravida ? Number(parsed.data.gravida) : undefined,
                para: parsed.data.para ? Number(parsed.data.para) : undefined,
              });
            }}
          />
        </>
      ) : null}
    </Card>
  );
}
