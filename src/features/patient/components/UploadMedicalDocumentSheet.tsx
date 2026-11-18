import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  useMyVisitLinksQuery,
  useUploadMedicalDocumentMutation,
} from '@/features/patients/hooks/usePatientRecordsQueries';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { compressMedicalImage, pickMedicalImage } from '@/shared/lib/pick-medical-image';
import { formatDisplayDateTime } from '@/shared/lib/datetime';
import { normalizeApiError } from '@/shared/api/client';
import { themeBg } from '@/shared/lib/utils';
import { useLocaleStore } from '@/shared/stores';
import type { MedicalDocumentKind, PatientVisitLink } from '@/shared/types/models/patient';

interface UploadMedicalDocumentSheetProps {
  visible: boolean;
  onClose: () => void;
  initialKind?: MedicalDocumentKind;
}

const KINDS: MedicalDocumentKind[] = ['prescription', 'lab', 'radiology'];

function linkKey(link: PatientVisitLink): string {
  return link.doctorId || `${link.kind}:${link.id}`;
}

function looksLikePersonName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  return !/كشف|متابعة|زيارة|تحليل|أشعة|حجز/i.test(trimmed);
}

function uniqueDoctors(links: PatientVisitLink[]): PatientVisitLink[] {
  const byDoctor = new Map<string, PatientVisitLink>();
  for (const link of links) {
    if (!looksLikePersonName(link.doctorName) && !link.doctorId) continue;
    const key = link.doctorId || link.id;
    const current = byDoctor.get(key);
    if (!current || new Date(link.date).getTime() > new Date(current.date).getTime()) {
      const doctorName = looksLikePersonName(link.doctorName) ? link.doctorName : current?.doctorName || '';
      byDoctor.set(key, { ...link, doctorName: doctorName || link.doctorName });
    } else if (current && looksLikePersonName(link.doctorName) && !looksLikePersonName(current.doctorName)) {
      byDoctor.set(key, { ...current, doctorName: link.doctorName });
    }
  }
  return [...byDoctor.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function UploadMedicalDocumentSheet({
  visible,
  onClose,
  initialKind = 'prescription',
}: UploadMedicalDocumentSheetProps) {
  const { t } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);
  const isDark = useResolvedColorScheme() === 'dark';
  const upload = useUploadMedicalDocumentMutation();
  const visitLinks = useMyVisitLinksQuery(visible);
  const [kind, setKind] = useState<MedicalDocumentKind>(initialKind);
  const [image, setImage] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const links = useMemo(() => uniqueDoctors(visitLinks.data ?? []), [visitLinks.data]);
  const needsDoctor = kind === 'lab' || kind === 'radiology';

  useEffect(() => {
    if (!visible) return;
    setKind(initialKind);
    setImage(null);
    setNote('');
    setSelected('');
    setFormError('');
    setBusy(false);
  }, [visible, initialKind]);

  useEffect(() => {
    if (!visible || selected || links.length === 0) return;
    setSelected(linkKey(links[0]));
  }, [visible, selected, links]);

  const reset = () => {
    setKind(initialKind);
    setImage(null);
    setNote('');
    setSelected('');
    setFormError('');
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const pick = async (source: 'camera' | 'library') => {
    const next = await pickMedicalImage(source);
    if (next) {
      setImage(next);
      setFormError('');
    }
  };

  const submit = () => {
    if (busy || upload.isPending) return;
    if (!image) {
      setFormError(t('records.upload.needPhoto'));
      return;
    }
    const link = links.find((item) => linkKey(item) === selected);
    if (needsDoctor && !link) {
      setFormError(t('records.upload.needVisit'));
      return;
    }
    setFormError('');
    setBusy(true);
    void (async () => {
      try {
        const packed = await compressMedicalImage(image);
        await upload.mutateAsync({
          kind,
          image: packed,
          note: note.trim() || undefined,
          visitId: link?.visitId,
          appointmentId: link?.kind === 'appointment' ? link.appointmentId : undefined,
          labRequestId: link?.labRequestId,
          doctorId: link?.doctorId || undefined,
        });
        Toast.show({ type: 'success', text1: t('records.upload.success') });
        close();
      } catch (error) {
        const apiError = normalizeApiError(error);
        setFormError(
          apiError.code === 'NOT_FOUND' || /404/.test(apiError.message)
            ? t('records.upload.apiMissing')
            : apiError.message || t('records.upload.sendFailed'),
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  const optionClass = (active: boolean) =>
    `items-center justify-center rounded-2xl px-4 py-3 ${
      active ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800')
    }`;

  const doctorLabel = (link: PatientVisitLink) =>
    looksLikePersonName(link.doctorName)
      ? t('records.upload.doctorName', { doctor: link.doctorName })
      : t('records.upload.unknownDoctor');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={close} accessibilityRole="button" />
        <View className={`max-h-[90%] rounded-t-3xl ${themeBg(isDark, 'bg-white', 'bg-slate-900')}`}>
          <ScrollView
            className="p-5"
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
          >
            <Text variant="titleMd" className="mb-1 text-center">
              {t('records.upload.title')}
            </Text>
            <Text variant="bodySm" muted className="mb-4 text-center">
              {t('records.upload.subtitle')}
            </Text>

            <View className="mb-4 flex-row flex-wrap justify-center gap-2">
              {KINDS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setKind(option)}
                  className={`rounded-full px-4 py-2 ${
                    kind === option ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800')
                  }`}
                >
                  <Text variant="caption" className={kind === option ? 'text-center text-white' : 'text-center'}>
                    {t(`records.filters.${option}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {image ? (
              <Image
                source={{ uri: image }}
                className="mb-3 h-40 w-full rounded-2xl bg-slate-100"
                resizeMode="cover"
              />
            ) : null}

            <View className="mb-3 flex-row gap-2">
              <View className="flex-1">
                <Button title={t('records.upload.camera')} variant="outline" onPress={() => void pick('camera')} />
              </View>
              <View className="flex-1">
                <Button title={t('records.upload.gallery')} variant="outline" onPress={() => void pick('library')} />
              </View>
            </View>

            <Input
              label={t('records.upload.note')}
              value={note}
              onChangeText={setNote}
              placeholder={t('records.upload.notePlaceholder')}
            />

            <Text variant="label" className="mb-1 mt-4 text-center">
              {t('records.upload.linkVisit')}
            </Text>
            <Text variant="caption" muted className="mb-3 text-center">
              {t('records.upload.linkVisitHint')}
            </Text>

            {visitLinks.isLoading ? (
              <Spinner />
            ) : (
              <View className="mb-2 gap-2">
                {links.map((link) => {
                  const key = linkKey(link);
                  const active = selected === key;
                  return (
                    <Pressable key={key} onPress={() => setSelected(key)} className={optionClass(active)}>
                      <Text variant="label" className={active ? 'text-center text-white' : 'text-center'}>
                        {doctorLabel(link)}
                      </Text>
                      <Text
                        variant="caption"
                        className={active ? 'mt-0.5 text-center text-white/90' : 'mt-0.5 text-center'}
                        muted={!active}
                      >
                        {t('records.upload.lastVisit', { date: formatDisplayDateTime(link.date, locale) })}
                      </Text>
                    </Pressable>
                  );
                })}
                {links.length === 0 ? (
                  <Text variant="caption" muted className="text-center">
                    {t('records.upload.emptyVisits')}
                  </Text>
                ) : null}
                {!needsDoctor && links.length > 0 ? (
                  <Pressable onPress={() => setSelected('')} className={optionClass(selected === '')}>
                    <Text
                      variant="bodySm"
                      className={selected === '' ? 'text-center text-white' : 'text-center'}
                    >
                      {t('records.upload.noLink')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {formError ? (
              <Text variant="caption" className="mt-2 text-center text-red-600">
                {formError}
              </Text>
            ) : null}

            <View className="mt-4 gap-2 pb-4">
              <Button
                title={needsDoctor ? t('records.upload.sendToDoctor') : t('records.upload.submit')}
                loading={busy || upload.isPending}
                onPress={submit}
              />
              <Button title={t('records.upload.cancel')} variant="ghost" onPress={close} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
