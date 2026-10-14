import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge';
import { AppointmentInvoiceCard } from '@/features/billing/components/AppointmentInvoiceCard';
import { useCheckInMutation } from '@/features/billing/hooks/useBillingQueries';
import { QueuePositionCard } from '@/features/queue/components/QueuePositionCard';
import { AppointmentReviewCard } from '@/features/reviews/components/AppointmentReviewCard';
import { AppointmentWhatsAppCard } from '@/features/whatsapp/components/AppointmentWhatsAppCard';
import {
  useAppointmentDetailQuery,
  useCancelAppointmentMutation,
  useConfirmAppointmentMutation,
  useNoShowAppointmentMutation,
  useRescheduleAppointmentMutation,
} from '@/features/appointments/hooks/useAppointmentQueries';
import {
  canAdminCancelAppointment,
  canCancelAppointment,
  canConfirmAppointment,
  canRescheduleAppointment,
  getParticipantName,
  getRescheduleOptions,
} from '@/features/appointments/lib/formatters';
import { formatDisplayDateTime } from '@/shared/lib/datetime';
import { useStartVisitMutation } from '@/features/doctor/hooks';
import { patientsService } from '@/features/patients/services/patients.service';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Header } from '@/shared/components/layout/Header';
import { Row } from '@/shared/components/layout/Row';
import { Screen } from '@/shared/components/layout/Screen';
import { ProfileInfoRow } from '@/shared/components/profile/ProfileInfoRow';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { getDoctorPatientHref, getVisitHref, useRouteIdParam } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import { AppointmentStatus, UserRole } from '@/shared/types/enums';

function isAppointmentToday(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

interface AppointmentDetailScreenProps {
  viewerRole: UserRole;
}

export function AppointmentDetailScreen({ viewerRole }: AppointmentDetailScreenProps) {
  const id = useRouteIdParam();
  const { t } = useTranslation('appointments');
  const { t: td } = useTranslation('doctor');
  const locale = useLocaleStore((s) => s.locale);
  const isDark = useResolvedColorScheme() === 'dark';
  const [showRescheduleOptions, setShowRescheduleOptions] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: appointment, isLoading, isError, refetch } = useAppointmentDetailQuery(id ?? '');
  const cancelMutation = useCancelAppointmentMutation();
  const confirmMutation = useConfirmAppointmentMutation();
  const noShowMutation = useNoShowAppointmentMutation();
  const rescheduleMutation = useRescheduleAppointmentMutation();
  const startVisit = useStartVisitMutation();
  const checkIn = useCheckInMutation();

  if (isLoading) {
    return (
      <Screen>
        <Header showBack />
        <Spinner fullScreen message={t('title')} />
      </Screen>
    );
  }

  if (isError || !appointment) {
    return (
      <Screen>
        <Header showBack />
        <ErrorState message={t('error')} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const isDoctor = viewerRole === UserRole.DOCTOR;
  const isPatient = viewerRole === UserRole.PATIENT;
  const isAdmin = viewerRole === UserRole.ADMIN || viewerRole === UserRole.SECRETARY;
  const showPatientActions = isPatient && canCancelAppointment(appointment.status);
  const showAdminActions =
    isAdmin &&
    (canConfirmAppointment(appointment.status) || canAdminCancelAppointment(appointment.status));
  const showDoctorManagementActions = isDoctor && canAdminCancelAppointment(appointment.status);
  const showDoctorClinicalActions =
    isDoctor &&
    [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS].includes(
      appointment.status,
    );

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    cancelMutation.mutate(appointment.id, {
      onSuccess: () => {
        setShowCancelConfirm(false);
        if (isPatient) {
          router.back();
        }
      },
    });
  };

  const handleConfirm = () => {
    confirmMutation.mutate(appointment.id);
  };

  const handleReschedule = (scheduledAt: string) => {
    rescheduleMutation.mutate(
      {
        id: appointment.id,
        payload: { scheduledAt, by: isPatient ? 'patient' : 'secretary' },
      },
      {
        onSuccess: () => {
          setShowRescheduleOptions(false);
        },
      },
    );
  };

  const handleViewPatient = async () => {
    try {
      const patient = await patientsService.getById(appointment.patient.id);
      router.push(getDoctorPatientHref(patient.id));
    } catch {
      Toast.show({ type: 'error', text1: t('patientLookupFailed') });
    }
  };

  const handleStartVisit = async () => {
    try {
      const patient = await patientsService.getById(appointment.patient.id);
      startVisit.mutate(
        {
          patientId: patient.id,
          appointmentId: appointment.id,
          chiefComplaint: appointment.reason,
        },
        {
          onSuccess: (visit) => router.push(getVisitHref(UserRole.DOCTOR, visit.id)),
        },
      );
    } catch {
      Toast.show({ type: 'error', text1: t('patientLookupFailed') });
    }
  };

  return (
    <Screen scroll padded={false} className="px-5">
      <Header showBack title={t('detailTitle')} />

      <View className="gap-4 pb-10">
        <Card className="gap-4">
          <Row className="items-center gap-3">
            <Avatar
              firstName={isPatient ? appointment.doctor.firstName : appointment.patient.firstName}
              lastName={isPatient ? appointment.doctor.lastName : appointment.patient.lastName}
              size="lg"
            />
            <View className="min-w-0 flex-1 gap-1">
              <Text variant="titleSm" numberOfLines={2}>
                {isPatient
                  ? getParticipantName(appointment.doctor.firstName, appointment.doctor.lastName)
                  : getParticipantName(appointment.patient.firstName, appointment.patient.lastName)}
              </Text>
              <Text variant="caption" muted>
                {isPatient ? t('doctor') : t('patient')}
              </Text>
            </View>
            <AppointmentStatusBadge status={appointment.status} />
          </Row>

          <View className="gap-0 border-t border-slate-100 pt-1 dark:border-slate-700">
            <ProfileInfoRow
              label={t('dateTime')}
              value={formatDisplayDateTime(appointment.scheduledAt, locale)}
            />
            <ProfileInfoRow label={t('branch')} value={appointment.branchName} />
            <ProfileInfoRow
              label={t('duration')}
              value={t('minutes', { count: appointment.durationMinutes })}
            />
            {isPatient && appointment.doctor.specialty ? (
              <ProfileInfoRow label={t('specialty')} value={appointment.doctor.specialty} />
            ) : null}
            {appointment.reason ? <ProfileInfoRow label={t('reason')} value={appointment.reason} /> : null}
            {appointment.notes ? <ProfileInfoRow label={t('notes')} value={appointment.notes} /> : null}
            {appointment.awaiting === 'secretary' ? (
              <ProfileInfoRow label={t('waiting')} value={t('awaitingSecretary')} />
            ) : null}
            {appointment.awaiting === 'patient' ? (
              <ProfileInfoRow label={t('waiting')} value={t('awaitingPatient')} />
            ) : null}
          </View>
        </Card>

        {showAdminActions && (
          <View className="gap-3">
            {canConfirmAppointment(appointment.status, appointment.awaiting) && (
              <Button
                title={confirmMutation.isPending ? t('confirming') : t('confirm')}
                testID="appointment-confirm"
                onPress={handleConfirm}
                loading={confirmMutation.isPending}
                fullWidth
                size="lg"
              />
            )}
            {canRescheduleAppointment(appointment.status) && (
              <Button
                title={t('propose')}
                variant="outline"
                onPress={() => setShowRescheduleOptions((value) => !value)}
                loading={rescheduleMutation.isPending}
                fullWidth
              />
            )}
            {showRescheduleOptions ? (
              <Card className="gap-2">
                <Text variant="label">{t('selectNewTime')}</Text>
                {getRescheduleOptions().map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => handleReschedule(slot)}
                    className={`rounded-xl px-4 py-3 ${themeBg(isDark, 'bg-slate-100', 'bg-slate-700')}`}
                  >
                    <Text variant="bodySm">{formatDisplayDateTime(slot, locale)}</Text>
                  </Pressable>
                ))}
              </Card>
            ) : null}
            {appointment.status === AppointmentStatus.CONFIRMED &&
            !appointment.queue &&
            isAppointmentToday(appointment.scheduledAt) ? (
              <Button
                title={t('queue.checkIn')}
                onPress={() => checkIn.mutate(appointment.id)}
                loading={checkIn.isPending}
                fullWidth
              />
            ) : null}
            {appointment.status === AppointmentStatus.CONFIRMED && !appointment.queue && (
              <Button
                title={noShowMutation.isPending ? t('noShowPending') : t('noShow')}
                variant="outline"
                onPress={() => noShowMutation.mutate(appointment.id)}
                loading={noShowMutation.isPending}
                fullWidth
              />
            )}
            {canAdminCancelAppointment(appointment.status) && (
              <Button
                title={cancelMutation.isPending ? t('cancelling') : t('cancel')}
                variant="danger"
                onPress={handleCancel}
                loading={cancelMutation.isPending}
                fullWidth
              />
            )}
          </View>
        )}

        {showDoctorManagementActions && (
          <View className="gap-3">
            {canAdminCancelAppointment(appointment.status) && (
              <Button
                title={cancelMutation.isPending ? t('cancelling') : t('cancel')}
                variant="danger"
                onPress={handleCancel}
                loading={cancelMutation.isPending}
                fullWidth
              />
            )}
          </View>
        )}

        {showDoctorClinicalActions && (
          <View className="gap-3">
            <Button
              title={td('patients.viewProfile')}
              variant="outline"
              onPress={handleViewPatient}
              fullWidth
            />
            <Button
              title={td('visit.startVisit')}
              testID="appointment-start-visit"
              onPress={handleStartVisit}
              loading={startVisit.isPending}
              fullWidth
              size="lg"
            />
          </View>
        )}

        {isPatient ? <QueuePositionCard appointment={appointment} /> : null}

        <AppointmentInvoiceCard
          appointmentId={appointment.id}
          canManage={isAdmin}
          canSeeShare={viewerRole === UserRole.DOCTOR || viewerRole === UserRole.ADMIN}
          canIssue={
            isAdmin &&
            [AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED].includes(
              appointment.status,
            )
          }
        />
        <AppointmentWhatsAppCard appointmentId={appointment.id} />

        {isPatient && appointment.status === AppointmentStatus.COMPLETED ? (
          <AppointmentReviewCard
            appointmentId={appointment.id}
            doctorId={appointment.doctorId}
            patientId={appointment.patientId}
            patientName={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
          />
        ) : null}

        {showPatientActions && (
          <View className="gap-3">
            {appointment.awaiting === 'patient' ? (
              <Button
                title={t('acceptTime')}
                onPress={() => handleReschedule(appointment.scheduledAt)}
                loading={rescheduleMutation.isPending}
                fullWidth
                size="lg"
              />
            ) : null}
            {canRescheduleAppointment(appointment.status) && (
              <>
                <Button
                  title={t('reschedule')}
                  variant="outline"
                  testID="appointment-reschedule"
                  onPress={() => setShowRescheduleOptions((value) => !value)}
                  loading={rescheduleMutation.isPending}
                  fullWidth
                />

                {showRescheduleOptions && (
                  <Card className="gap-2">
                    <Text variant="label">{t('selectNewTime')}</Text>
                    {getRescheduleOptions().map((slot) => (
                      <Pressable
                        key={slot}
                        onPress={() => handleReschedule(slot)}
                        className={`rounded-xl px-4 py-3 ${themeBg(isDark, 'bg-slate-100', 'bg-slate-700')}`}
                      >
                        <Text variant="bodySm">
                          {formatDisplayDateTime(slot, locale)}
                        </Text>
                      </Pressable>
                    ))}
                  </Card>
                )}
              </>
            )}

            <Button
              title={cancelMutation.isPending ? t('cancelling') : t('cancel')}
              variant="danger"
              testID="appointment-cancel"
              onPress={handleCancel}
              loading={cancelMutation.isPending}
              fullWidth
            />
          </View>
        )}
      </View>

      <ConfirmDialog
        visible={showCancelConfirm}
        title={t('cancel')}
        message={t('confirmCancel')}
        confirmLabel={t('confirmCancelYes')}
        cancelLabel={t('confirmCancelNo')}
        destructive
        loading={cancelMutation.isPending}
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </Screen>
  );
}
