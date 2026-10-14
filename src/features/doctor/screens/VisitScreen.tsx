import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import {
  useCompleteVisitMutation,
  useCreateLabRequestMutation,
  useCreatePrescriptionMutation,
  useDeletePrescriptionMutation,
  useIssuePrescriptionMutation,
  useLabRequestsQuery,
  usePrescriptionsQuery,
  useUpdatePrescriptionMutation,
  useUpdateVisitMutation,
  useVisitQuery,
  mapVisitFormToPayload,
} from '@/features/doctor/hooks';
import {
  labRequestSchema,
  prescriptionSchema,
  visitNotesSchema,
  type LabRequestFormData,
  type PrescriptionFormData,
  type VisitNotesFormData,
} from '@/features/doctor/schemas/doctor.schemas';
import { ObgynVisitSection } from '@/features/obgyn/components/ObgynVisitSection';
import { isObstetricsGynecology } from '@/features/obgyn/lib/specialty';
import { useDoctorDetailQuery } from '@/features/patient/hooks/useDoctorsQueries';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { FormInput } from '@/shared/components/form/FormInput';
import { FormSelect } from '@/shared/components/form/FormSelect';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { useRouteIdParam } from '@/shared/navigation/routes';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import { PrescriptionStatus, VisitStatus } from '@/shared/types/enums';
import type { Prescription } from '@/shared/types/models/prescription';

const emptyRxForm: PrescriptionFormData = {
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

export function VisitScreen() {
  const id = useRouteIdParam();
  const { t } = useTranslation('doctor');
  const { t: tc } = useTranslation('common');
  const isDark = useResolvedColorScheme() === 'dark';

  const { data: visit, isLoading, isError, refetch } = useVisitQuery(id ?? '');
  const { data: prescriptions } = usePrescriptionsQuery(id ?? '');
  const { data: labRequests } = useLabRequestsQuery(id ?? '');
  const doctor = useDoctorDetailQuery(visit?.doctorId ?? '');
  const isObgyn = isObstetricsGynecology(doctor.data?.specialty);

  const updateVisit = useUpdateVisitMutation();
  const completeVisit = useCompleteVisitMutation();
  const createPrescription = useCreatePrescriptionMutation();
  const updatePrescription = useUpdatePrescriptionMutation();
  const issuePrescription = useIssuePrescriptionMutation();
  const deletePrescription = useDeletePrescriptionMutation();
  const createLabRequest = useCreateLabRequestMutation();

  const [editingRxId, setEditingRxId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const notesForm = useForm<VisitNotesFormData>({
    resolver: zodResolver(visitNotesSchema),
    defaultValues: {
      chiefComplaint: '',
      symptoms: '',
      diagnosis: '',
      notes: '',
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
    },
  });

  const rxForm = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: emptyRxForm,
  });

  const labForm = useForm<LabRequestFormData>({
    resolver: zodResolver(labRequestSchema),
    defaultValues: { type: 'lab', testName: '', priority: 'routine', notes: '' },
  });

  useEffect(() => {
    if (!visit) return;
    notesForm.reset({
      chiefComplaint: visit.chiefComplaint ?? '',
      symptoms: visit.symptoms ?? '',
      diagnosis: visit.diagnosis ?? '',
      notes: visit.notes ?? '',
      bloodPressure: visit.vitals?.bloodPressure ?? '',
      heartRate: visit.vitals?.heartRate?.toString() ?? '',
      temperature: visit.vitals?.temperature?.toString() ?? '',
      weight: visit.vitals?.weight?.toString() ?? '',
    });
  }, [visit, notesForm]);

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (isError || !visit) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('visit.error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const isCompleted = visit.status === VisitStatus.COMPLETED;

  const handleSaveNotes = notesForm.handleSubmit((data) => {
    updateVisit.mutate({ id: visit.id, payload: mapVisitFormToPayload(data) });
  });

  const resetRxEditor = () => {
    setEditingRxId(null);
    rxForm.reset(emptyRxForm);
  };

  const handleSavePrescription = rxForm.handleSubmit((data) => {
    if (editingRxId) {
      updatePrescription.mutate(
        { id: editingRxId, visitId: visit.id, data },
        { onSuccess: resetRxEditor },
      );
      return;
    }

    createPrescription.mutate({ visitId: visit.id, data }, { onSuccess: resetRxEditor });
  });

  const startEdit = (rx: Prescription) => {
    const first = rx.medications[0];
    setEditingRxId(rx.id);
    rxForm.reset({
      name: first?.name ?? '',
      dosage: first?.dosage ?? '',
      frequency: first?.frequency ?? '',
      duration: first?.duration ?? '',
      instructions: first?.instructions ?? rx.instructions ?? '',
    });
  };

  const handleAddLabRequest = labForm.handleSubmit((data) => {
    createLabRequest.mutate(
      { visitId: visit.id, data },
      { onSuccess: () => labForm.reset({ type: 'lab', testName: '', priority: 'routine', notes: '' }) },
    );
  });

  const canIssue = (rx: Prescription) =>
    rx.status === PrescriptionStatus.DRAFT || rx.status === PrescriptionStatus.FINALIZED;

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={t('visit.title')} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 pb-10">
        <Card className="gap-1">
          <Text variant="label" muted>
            {t('visit.status')}
          </Text>
          <Text variant="titleSm">
            {isCompleted ? t('visit.completed') : t('visit.inProgress')}
          </Text>
        </Card>

        <Card className="gap-3">
          <Text variant="titleSm">{t('visit.clinicalNotes')}</Text>
          <FormInput control={notesForm.control} name="chiefComplaint" label={t('visit.chiefComplaint')} />
          <FormInput control={notesForm.control} name="symptoms" label={t('visit.symptoms')} />
          <FormInput control={notesForm.control} name="diagnosis" label={t('visit.diagnosis')} />
          <FormInput control={notesForm.control} name="notes" label={t('visit.notes')} />
          <Text variant="label" className="mt-2">
            {t('visit.vitals')}
          </Text>
          <FormInput control={notesForm.control} name="bloodPressure" label={t('visit.bloodPressure')} placeholder={t('visit.bloodPressurePlaceholder')} />
          <FormInput control={notesForm.control} name="heartRate" label={t('visit.heartRate')} keyboardType="number-pad" />
          <FormInput control={notesForm.control} name="temperature" label={t('visit.temperature')} keyboardType="number-pad" />
          <FormInput control={notesForm.control} name="weight" label={t('visit.weight')} keyboardType="number-pad" />
          {!isCompleted && (
            <Button title={t('visit.saveNotes')} onPress={handleSaveNotes} loading={updateVisit.isPending} fullWidth />
          )}
        </Card>

        {isObgyn ? (
          <ObgynVisitSection visit={visit} labRequests={labRequests ?? []} readOnly={isCompleted} />
        ) : null}

        <Card className="gap-3">
          <Text variant="titleSm">{t('visit.prescriptions')}</Text>
          {prescriptions?.map((rx) => (
            <View key={rx.id} className={`gap-3 rounded-xl p-3 ${themeBg(isDark, 'bg-slate-50', 'bg-slate-800')}`}>
              <View className="flex-row items-center justify-between gap-2">
                <Badge
                  label={
                    rx.status === PrescriptionStatus.ISSUED
                      ? t('visit.prescriptionStatus.issued')
                      : t('visit.prescriptionStatus.draft')
                  }
                  variant={rx.status === PrescriptionStatus.ISSUED ? 'success' : 'warning'}
                />
              </View>
              {rx.medications.map((med, index) => (
                <Text key={`${rx.id}-${index}`} variant="bodySm">
                  {med.name} {med.dosage} — {med.frequency} ({med.duration})
                </Text>
              ))}
              <View className="gap-2">
                {canIssue(rx) && (
                  <Button
                    title={t('visit.issuePrescription')}
                    onPress={() => issuePrescription.mutate({ id: rx.id, visitId: visit.id })}
                    loading={issuePrescription.isPending && issuePrescription.variables?.id === rx.id}
                    fullWidth
                  />
                )}
                <View className="flex-row gap-2">
                  <Button
                    title={t('visit.editPrescription')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onPress={() => startEdit(rx)}
                  />
                  <Button
                    title={t('visit.deletePrescription')}
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onPress={() => setPendingDeleteId(rx.id)}
                  />
                </View>
              </View>
            </View>
          ))}
          <FormInput control={rxForm.control} name="name" label={t('visit.medName')} />
          <FormInput control={rxForm.control} name="dosage" label={t('visit.dosage')} />
          <FormInput control={rxForm.control} name="frequency" label={t('visit.frequency')} />
          <FormInput control={rxForm.control} name="duration" label={t('visit.duration')} />
          <FormInput control={rxForm.control} name="instructions" label={t('visit.rxInstructions')} />
          <Button
            title={editingRxId ? t('visit.savePrescription') : t('visit.addPrescription')}
            variant="outline"
            onPress={handleSavePrescription}
            loading={editingRxId ? updatePrescription.isPending : createPrescription.isPending}
            fullWidth
          />
          {editingRxId ? (
            <Button title={tc('cancel')} variant="ghost" onPress={resetRxEditor} fullWidth />
          ) : null}
        </Card>

        <Card className="gap-3">
          <Text variant="titleSm">{t('visit.labRequests')}</Text>
          {labRequests?.map((req) => (
            <View key={req.id} className={`rounded-xl p-3 ${themeBg(isDark, 'bg-slate-50', 'bg-slate-800')}`}>
              <Text variant="bodySm">
                [{req.type}] {req.testName} — {req.priority}
              </Text>
            </View>
          ))}
          {!isCompleted && (
            <>
              {isObgyn ? (
                <FormSelect
                  control={labForm.control}
                  name="type"
                  label={t('obgyn.requestType')}
                  options={[
                    { value: 'lab', label: t('obgyn.lab') },
                    { value: 'imaging', label: t('obgyn.imaging') },
                  ]}
                />
              ) : null}
              <FormInput control={labForm.control} name="testName" label={t('visit.testName')} />
              <FormInput control={labForm.control} name="notes" label={t('visit.requestNotes')} />
              <Button
                title={t('visit.addLabRequest')}
                variant="outline"
                onPress={handleAddLabRequest}
                loading={createLabRequest.isPending}
                fullWidth
              />
            </>
          )}
        </Card>

        {!isCompleted && (
          <Button
            title={t('visit.completeVisit')}
            onPress={() =>
              completeVisit.mutate(visit.id, {
                onSuccess: () => router.back(),
              })
            }
            loading={completeVisit.isPending}
            fullWidth
            size="lg"
          />
        )}
      </ScrollView>

      <ConfirmDialog
        visible={Boolean(pendingDeleteId)}
        title={t('visit.deletePrescriptionTitle')}
        message={t('visit.deletePrescriptionMessage')}
        confirmLabel={t('visit.deletePrescription')}
        destructive
        loading={deletePrescription.isPending}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return;
          deletePrescription.mutate(
            { id: pendingDeleteId, visitId: visit.id },
            {
              onSuccess: () => {
                if (editingRxId === pendingDeleteId) resetRxEditor();
                setPendingDeleteId(null);
              },
            },
          );
        }}
      />
    </Screen>
  );
}
