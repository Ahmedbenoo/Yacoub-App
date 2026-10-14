import { Image, Text as RNText, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  electronicSignatureName,
  prescriptionClinicAddresses,
  prescriptionClinicPhones,
  prescriptionQrDataUri,
} from '@/features/clinical/prescriptions/lib/prescription-document';
import { formatDisplayDate } from '@/shared/lib/datetime';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useLocaleStore } from '@/shared/stores';
import { Locale } from '@/shared/types/enums';
import {
  getPrescriptionDisplayDate,
  localizedMedicationText,
  type Medication,
  type Prescription,
} from '@/shared/types/models/prescription';

function clinicTitle(prescription: Prescription, locale: string) {
  if (locale === Locale.AR) return prescription.clinicNameAr || prescription.clinicName;
  return prescription.clinicName || prescription.clinicNameAr;
}

export function PrescriptionLetter({ prescription }: { prescription: Prescription }) {
  const { t } = useTranslation('patient');
  const locale = useLocaleStore((s) => s.locale);
  const { rowStyle, isRtl } = useLayoutDirection();
  const name = clinicTitle(prescription, locale);

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        gap: 16,
        overflow: 'hidden',
      }}
    >
      <View style={[rowStyle, { alignItems: 'center', justifyContent: 'space-between', gap: 12 }]}>
        <View style={{ flex: 1, gap: 4 }}>
          {name ? (
            <Text variant="titleSm" className="text-slate-900">
              {name}
            </Text>
          ) : null}
          <Text variant="label" className="text-primary-700">
            {prescription.number
              ? t('prescription.number', { value: prescription.number })
              : t('prescription.draftNumber')}
          </Text>
        </View>
        {prescription.clinicLogoUrl ? (
          <Image
            source={{ uri: prescription.clinicLogoUrl }}
            style={{ width: 112, height: 40 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : null}
      </View>

      <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />

      <View style={{ gap: 4 }}>
          <Text variant="bodySm" className="text-slate-500">
          {formatDisplayDate(getPrescriptionDisplayDate(prescription), locale)}
        </Text>
        {prescription.doctorName ? (
          <Text variant="body" className="text-slate-900">
            {t('prescription.doctor')}: {prescription.doctorName}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="label" className="text-slate-500">
          {t('prescription.medications')}
        </Text>
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            overflow: 'hidden',
          }}
        >
          {prescription.medications.map((medication, index) => (
            <MedicationRow
              key={`${medication.name}-${index}`}
              medication={medication}
              index={index}
              divided={index > 0}
              dosageLabel={t('prescription.dosageHeader')}
              frequencyLabel={t('prescription.frequencyHeader')}
              frequencyValue={localizedMedicationText(medication.frequency, medication.frequencyAr, locale)}
              durationLabel={t('prescription.durationHeader')}
              durationValue={localizedMedicationText(medication.duration, medication.durationAr, locale)}
              instructions={localizedMedicationText(medication.instructions, medication.instructionsAr, locale)}
            />
          ))}
        </View>
      </View>

      {localizedMedicationText(prescription.instructions, prescription.instructionsAr, locale) ? (
        <View style={{ gap: 4 }}>
          <Text variant="label" className="text-slate-500">
            {t('prescription.instructions')}
          </Text>
          <Text variant="body" className="text-slate-900">
            {localizedMedicationText(prescription.instructions, prescription.instructionsAr, locale)}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          rowStyle,
          {
            width: '100%',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 8,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
          },
        ]}
      >
        <View
          style={{
            minWidth: 0,
            flex: 1,
            alignItems: 'flex-start',
            gap: 4,
            direction: isRtl ? 'rtl' : 'ltr',
          }}
        >
          <View style={[rowStyle, { alignItems: 'center', gap: 8 }]}>
            <Text variant="caption" className="text-slate-500">
              {`${t('prescription.signature')} :`}
            </Text>
            {prescription.doctorSignatureUrl ? (
              <Image
                source={{ uri: prescription.doctorSignatureUrl }}
                style={{ width: 96, height: 32 }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <RNText
                style={{
                  fontFamily: 'Segoe Script, Brush Script MT, cursive',
                  fontSize: 18,
                  lineHeight: 24,
                  color: '#1e3a5f',
                }}
              >
                {electronicSignatureName(prescription.doctorName)}
              </RNText>
            )}
          </View>
          <View style={[rowStyle, { alignItems: 'flex-start', gap: 6 }]}>
            <Text variant="caption" className="text-slate-500">
              {`${t('prescription.contactLabel')} :`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', direction: isRtl ? 'rtl' : 'ltr' }}>
              {prescriptionClinicPhones().flatMap((phone, index) => [
                index > 0 ? (
                  <Text
                    key={`${phone}-sep`}
                    variant="caption"
                    className="text-slate-500"
                    style={{ alignSelf: 'auto', marginHorizontal: 6 }}
                  >
                    |
                  </Text>
                ) : null,
                <Text
                  key={phone}
                  variant="caption"
                  className="text-slate-500"
                  style={{ writingDirection: 'ltr', alignSelf: 'auto' }}
                >
                  {phone}
                </Text>,
              ])}
            </View>
          </View>
          <View style={[rowStyle, { alignItems: 'flex-start', gap: 6 }]}>
            <Text variant="caption" className="text-slate-500">
              {`${t('prescription.addressLabel')} :`}
            </Text>
            <View style={{ alignItems: 'flex-start', direction: isRtl ? 'rtl' : 'ltr' }}>
              {prescriptionClinicAddresses(locale === Locale.AR).map((address) => (
                <Text key={address} variant="caption" className="text-slate-500">
                  {address}
                </Text>
              ))}
            </View>
          </View>
        </View>
        <Image
          source={{ uri: prescriptionQrDataUri(prescription.id) }}
          style={{ width: 64, height: 64, flexShrink: 0 }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}

function MedicationRow({
  medication,
  index,
  divided,
  dosageLabel,
  frequencyLabel,
  frequencyValue,
  durationLabel,
  durationValue,
  instructions,
}: {
  medication: Medication;
  index: number;
  divided: boolean;
  dosageLabel: string;
  frequencyLabel: string;
  frequencyValue: string;
  durationLabel: string;
  durationValue: string;
  instructions: string;
}) {
  const { rowStyle } = useLayoutDirection();

  return (
    <View
      style={{
        gap: 10,
        padding: 14,
        backgroundColor: '#FFFFFF',
        borderTopWidth: divided ? 1 : 0,
        borderTopColor: '#E2E8F0',
      }}
    >
      <View style={[rowStyle, { alignItems: 'center', gap: 10 }]}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#CCFBF1',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="label" className="text-primary-700">
            {index + 1}
          </Text>
        </View>
        <Text variant="titleSm" className="min-w-0 flex-1 text-slate-900">
          {medication.name}
        </Text>
      </View>
      <View style={[rowStyle, { gap: 8 }]}>
        <MedicationFact label={dosageLabel} value={medication.dosage} latin />
        <MedicationFact label={frequencyLabel} value={frequencyValue} />
        <MedicationFact label={durationLabel} value={durationValue} />
      </View>
      {instructions ? (
        <Text variant="caption" className="text-slate-500">
          {instructions}
        </Text>
      ) : null}
    </View>
  );
}

function MedicationFact({ label, value, latin = false }: { label: string; value: string; latin?: boolean }) {
  return (
    <View style={{ flex: 1, borderRadius: 10, backgroundColor: '#F0FDFA', paddingHorizontal: 8, paddingVertical: 8, gap: 2 }}>
      <Text variant="caption" className="text-slate-500">
        {label}
      </Text>
      <Text
        variant="label"
        className="text-center text-slate-900"
        style={latin ? { writingDirection: 'ltr' } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

