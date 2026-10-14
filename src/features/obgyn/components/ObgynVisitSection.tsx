import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  useAddAttachmentMutation,
  useObgynEncounterQuery,
  usePregnanciesQuery,
  usePriorMeasurementsQuery,
  useSaveEncounterMutation,
  useSaveUltrasoundMutation,
  useUltrasoundQuery,
  useVisitAttachmentsQuery,
} from '@/features/obgyn/hooks/useObgynQueries';
import { ltr } from '@/features/obgyn/lib/specialty';
import {
  obgynEncounterSchema,
  ultrasoundSchema,
  type ObgynEncounterForm,
} from '@/features/obgyn/schemas/obgyn.schemas';
import { Select } from '@/shared/components/form/Select';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { pickProfileImage } from '@/shared/lib/pick-profile-image';
import { LabRequestType } from '@/shared/types/enums';
import type { LabRequest } from '@/shared/types/models/lab-request';
import type { SaveObgynEncounterInput } from '@/shared/types/models/obgyn';
import type { Visit } from '@/shared/types/models/visit';

const emptyForm: ObgynEncounterForm = {
  kind: 'gynecology',
  pregnancyId: '',
  lmp: '',
  regularity: undefined,
  plan: '',
  followUpNote: '',
  gestationalAgeWeeks: '',
  fundalHeightCm: '',
  fetalHeartRate: '',
  presentation: '',
  pelvic: '',
  speculum: '',
  abdomen: '',
  breast: '',
  relevantHistory: '',
  currentMedicationsNote: '',
  assessment: '',
};

function num(value?: string) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toInput(form: ObgynEncounterForm): SaveObgynEncounterInput {
  return {
    kind: form.kind,
    pregnancyId: form.pregnancyId || undefined,
    lmp: form.lmp || undefined,
    cycleLengthDays: num(form.cycleLengthDays),
    bleedingDays: num(form.bleedingDays),
    regularity: form.regularity,
    gravida: num(form.gravida),
    para: num(form.para),
    abortions: num(form.abortions),
    living: num(form.living),
    relevantHistory: form.relevantHistory || undefined,
    currentMedicationsNote: form.currentMedicationsNote || undefined,
    abdomen: form.abdomen || undefined,
    breast: form.breast || undefined,
    speculum: form.speculum || undefined,
    pelvic: form.pelvic || undefined,
    assessment: form.assessment || undefined,
    plan: form.plan || undefined,
    followUpNote: form.followUpNote || undefined,
    gestationalAgeWeeks: num(form.gestationalAgeWeeks),
    fundalHeightCm: num(form.fundalHeightCm),
    fetalHeartRate: num(form.fetalHeartRate),
    fetalMovement: form.fetalMovement,
    presentation: form.presentation || undefined,
    ultrasoundLabRequestId: form.ultrasoundLabRequestId || undefined,
  };
}

function UltrasoundEditor({ labRequestId, readOnly }: { labRequestId: string; readOnly: boolean }) {
  const { t } = useTranslation('doctor');
  const report = useUltrasoundQuery(labRequestId);
  const save = useSaveUltrasoundMutation(labRequestId);
  const [impression, setImpression] = useState('');
  const [placenta, setPlacenta] = useState('');
  const [fluid, setFluid] = useState('');
  const [heart, setHeart] = useState('');
  const [ga, setGa] = useState('');
  const [presentation, setPresentation] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!report.data) return;
    setImpression(report.data.impression ?? '');
    setPlacenta(report.data.placenta ?? '');
    setFluid(report.data.amnioticFluid ?? '');
    setHeart(report.data.fetalHeartActivity ?? '');
    setGa(report.data.gestationalAgeByUltrasound ?? '');
    setPresentation(report.data.presentation ?? '');
  }, [report.data]);

  return (
    <View className="gap-2">
      <Input label={t('obgyn.gaUltrasound')} value={ga} onChangeText={setGa} editable={!readOnly} />
      <Input label={t('obgyn.heartActivity')} value={heart} onChangeText={setHeart} editable={!readOnly} />
      <Input label={t('obgyn.placenta')} value={placenta} onChangeText={setPlacenta} editable={!readOnly} />
      <Input label={t('obgyn.fluid')} value={fluid} onChangeText={setFluid} editable={!readOnly} />
      <Input label={t('obgyn.presentation')} value={presentation} onChangeText={setPresentation} editable={!readOnly} />
      <Input label={t('obgyn.impression')} value={impression} onChangeText={setImpression} editable={!readOnly} error={error} />
      {!readOnly ? (
        <Button
          title={t('obgyn.saveUltrasound')}
          variant="outline"
          loading={save.isPending}
          onPress={() => {
            const parsed = ultrasoundSchema.safeParse({
              impression,
              placenta,
              amnioticFluid: fluid,
              fetalHeartActivity: heart,
              gestationalAgeByUltrasound: ga,
              presentation,
            });
            if (!parsed.success) {
              const key = parsed.error.issues[0]?.message ?? 'impressionRequired';
              setError(t(`obgyn.errors.${key}`));
              return;
            }
            setError(undefined);
            save.mutate(parsed.data);
          }}
        />
      ) : null}
    </View>
  );
}

export function ObgynVisitSection({
  visit,
  labRequests,
  readOnly,
}: {
  visit: Visit;
  labRequests: LabRequest[];
  readOnly: boolean;
}) {
  const { t } = useTranslation('doctor');
  const encounter = useObgynEncounterQuery(visit.id);
  const pregnancies = usePregnanciesQuery(visit.patientId);
  const [form, setForm] = useState<ObgynEncounterForm>(emptyForm);
  const [error, setError] = useState<string>();
  const [patientVisible, setPatientVisible] = useState(false);
  const save = useSaveEncounterMutation(visit.id);
  const prior = usePriorMeasurementsQuery(form.kind === 'obstetric' ? form.pregnancyId : undefined, visit.startedAt);
  const attachments = useVisitAttachmentsQuery(visit.id);
  const addAttachment = useAddAttachmentMutation(visit.id);
  const imaging = labRequests.filter((item) => item.type === LabRequestType.IMAGING);

  useEffect(() => {
    if (!encounter.data) return;
    const row = encounter.data;
    setForm({
      kind: row.kind,
      pregnancyId: row.pregnancyId ?? '',
      lmp: row.lmp ?? '',
      cycleLengthDays: row.cycleLengthDays?.toString() ?? '',
      bleedingDays: row.bleedingDays?.toString() ?? '',
      regularity: row.regularity,
      gravida: row.gravida?.toString() ?? '',
      para: row.para?.toString() ?? '',
      abortions: row.abortions?.toString() ?? '',
      living: row.living?.toString() ?? '',
      relevantHistory: row.relevantHistory ?? '',
      currentMedicationsNote: row.currentMedicationsNote ?? '',
      abdomen: row.abdomen ?? '',
      breast: row.breast ?? '',
      speculum: row.speculum ?? '',
      pelvic: row.pelvic ?? '',
      assessment: row.assessment ?? '',
      plan: row.plan ?? '',
      followUpNote: row.followUpNote ?? '',
      gestationalAgeWeeks: row.gestationalAgeWeeks?.toString() ?? '',
      fundalHeightCm: row.fundalHeightCm?.toString() ?? '',
      fetalHeartRate: row.fetalHeartRate?.toString() ?? '',
      fetalMovement: row.fetalMovement,
      presentation: row.presentation ?? '',
      ultrasoundLabRequestId: row.ultrasoundLabRequestId ?? '',
    });
  }, [encounter.data]);

  const set = (patch: Partial<ObgynEncounterForm>) => setForm((current) => ({ ...current, ...patch }));

  return (
    <Card className="gap-3">
      <Text variant="titleSm">{t('obgyn.title')}</Text>
      <Select
        label={t('obgyn.kind')}
        value={form.kind}
        onChange={(kind) => set({ kind: kind as ObgynEncounterForm['kind'] })}
        options={[
          { value: 'gynecology', label: t('obgyn.gynecology') },
          { value: 'obstetric', label: t('obgyn.obstetric') },
        ]}
      />
      {form.kind === 'obstetric' ? (
        <Select
          label={t('obgyn.pregnancy')}
          value={form.pregnancyId}
          onChange={(pregnancyId) => set({ pregnancyId })}
          options={(pregnancies.data ?? []).map((item) => ({
            value: item.id,
            label: `${t(`obgyn.${item.status === 'ended' ? 'closed' : item.status}`)} · ${ltr(item.lmp)}`,
          }))}
          placeholder={t('obgyn.openPregnancy')}
        />
      ) : (
        <>
          <Input label={t('obgyn.lmp')} value={form.lmp} onChangeText={(lmp) => set({ lmp })} editable={!readOnly} />
          <Select
            label={t('obgyn.regularity')}
            value={form.regularity}
            onChange={(regularity) => set({ regularity: regularity as ObgynEncounterForm['regularity'] })}
            options={[
              { value: 'regular', label: t('obgyn.regular') },
              { value: 'irregular', label: t('obgyn.irregular') },
              { value: 'absent', label: t('obgyn.absent') },
            ]}
          />
          <Input label={t('obgyn.cycle')} value={form.cycleLengthDays} onChangeText={(cycleLengthDays) => set({ cycleLengthDays })} keyboardType="number-pad" editable={!readOnly} />
        </>
      )}
      {form.kind === 'obstetric' && form.pregnancyId ? (
        <View className="gap-2">
          <Text variant="label">{t('obgyn.prior')}</Text>
          {(prior.data ?? []).length === 0 ? <Text variant="bodySm" muted>{t('obgyn.noPrior')}</Text> : null}
          {(prior.data ?? []).map((item) => (
            <Text key={item.visitId} variant="bodySm">
              {ltr(item.gestationalAgeWeeks ?? '—')} {t('obgyn.ga')} · {ltr(item.bloodPressure ?? '—')} · {ltr(item.weight ?? '—')}
            </Text>
          ))}
          <Input label={t('obgyn.ga')} value={form.gestationalAgeWeeks} onChangeText={(gestationalAgeWeeks) => set({ gestationalAgeWeeks })} keyboardType="number-pad" editable={!readOnly} />
          <Input label={t('obgyn.fundal')} value={form.fundalHeightCm} onChangeText={(fundalHeightCm) => set({ fundalHeightCm })} keyboardType="number-pad" editable={!readOnly} />
          <Input label={t('obgyn.fhr')} value={form.fetalHeartRate} onChangeText={(fetalHeartRate) => set({ fetalHeartRate })} keyboardType="number-pad" editable={!readOnly} />
          <Select
            label={t('obgyn.movement')}
            value={form.fetalMovement}
            onChange={(fetalMovement) => set({ fetalMovement: fetalMovement as ObgynEncounterForm['fetalMovement'] })}
            options={[
              { value: 'present', label: t('obgyn.present') },
              { value: 'absent', label: t('obgyn.movementAbsent') },
              { value: 'not_applicable', label: t('obgyn.notApplicable') },
            ]}
          />
          <Input label={t('obgyn.presentation')} value={form.presentation} onChangeText={(presentation) => set({ presentation })} editable={!readOnly} />
        </View>
      ) : null}
      <Input label={t('obgyn.history')} value={form.relevantHistory} onChangeText={(relevantHistory) => set({ relevantHistory })} editable={!readOnly} />
      <Input label={t('obgyn.medications')} value={form.currentMedicationsNote} onChangeText={(currentMedicationsNote) => set({ currentMedicationsNote })} editable={!readOnly} />
      <Input label={t('obgyn.abdomen')} value={form.abdomen} onChangeText={(abdomen) => set({ abdomen })} editable={!readOnly} />
      <Input label={t('obgyn.breast')} value={form.breast} onChangeText={(breast) => set({ breast })} editable={!readOnly} />
      <Input label={t('obgyn.speculum')} value={form.speculum} onChangeText={(speculum) => set({ speculum })} editable={!readOnly} />
      <Input label={t('obgyn.pelvic')} value={form.pelvic} onChangeText={(pelvic) => set({ pelvic })} editable={!readOnly} />
      <Input label={t('obgyn.plan')} value={form.plan} onChangeText={(plan) => set({ plan })} editable={!readOnly} />
      <Input label={t('obgyn.followUp')} value={form.followUpNote} onChangeText={(followUpNote) => set({ followUpNote })} editable={!readOnly} />
      {error ? <Text variant="caption" className="text-status-error">{error}</Text> : null}
      {!readOnly ? (
        <Button
          title={t('obgyn.save')}
          loading={save.isPending}
          onPress={() => {
            const parsed = obgynEncounterSchema.safeParse(form);
            if (!parsed.success) {
              const key = parsed.error.issues[0]?.message ?? 'pregnancyRequired';
              setError(t(`obgyn.errors.${key}`, { defaultValue: key }));
              return;
            }
            setError(undefined);
            save.mutate(toInput(parsed.data));
          }}
        />
      ) : null}
      {imaging.map((request) => (
        <View key={request.id} className="gap-2">
          <Text variant="label">{t('obgyn.ultrasound')} · {request.testName}</Text>
          <UltrasoundEditor labRequestId={request.id} readOnly={readOnly} />
        </View>
      ))}
      <Text variant="bodySm" muted>{t('obgyn.attachHint')}</Text>
      {(attachments.data ?? []).map((file) => (
        <Image key={file.id} source={{ uri: file.dataUrl }} style={{ height: 120, width: '100%' }} resizeMode="contain" />
      ))}
      {!readOnly ? (
        <>
          <Button
            title={patientVisible ? t('obgyn.visibleToPatient') : t('obgyn.attach')}
            variant="outline"
            onPress={() => setPatientVisible((value) => !value)}
          />
          <Button
            title={t('obgyn.attach')}
            variant="outline"
            loading={addAttachment.isPending}
            onPress={() => {
              void pickProfileImage([4, 3]).then((dataUrl) => {
                if (!dataUrl) return;
                addAttachment.mutate({
                  visitId: visit.id,
                  dataUrl,
                  mediaType: 'image/jpeg',
                  patientVisible,
                  pregnancyId: form.pregnancyId || undefined,
                });
              });
            }}
          />
        </>
      ) : null}
    </Card>
  );
}
