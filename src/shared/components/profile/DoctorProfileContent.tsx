import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getBranchByName } from '@/features/admin/lib/branches';
import { DoctorReviewsList } from '@/features/reviews/components/DoctorReviewsList';
import { formatSpecialty } from '@/features/patient/lib/formatters';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { getDoctorPortrait } from '@/shared/lib/doctor-portrait';
import { formatPhoneForDisplay } from '@/shared/lib/phone';
import { useLocaleStore } from '@/shared/stores';
import { Locale } from '@/shared/types/enums';
import type { DoctorProfile } from '@/shared/types/models/doctor';

const LANGUAGE_AR: Record<string, string> = {
  English: 'الإنجليزية',
  Arabic: 'العربية',
  French: 'الفرنسية',
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', direction: 'ltr', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name={rating >= star - 0.25 ? 'star' : 'starOutline'}
          size={18}
          color={rating >= star - 0.25 ? '#F59E0B' : '#CBD5E1'}
        />
      ))}
    </View>
  );
}

function ContactRow({
  icon,
  label,
  value,
  latin = false,
  last = false,
}: {
  icon: 'mail' | 'phone' | 'clinic' | 'doctors' | 'clock' | 'language';
  label: string;
  value: string;
  latin?: boolean;
  last?: boolean;
}) {
  const { rowStyle } = useLayoutDirection();

  return (
    <View
      className={`px-4 py-3 ${last ? '' : 'border-b border-slate-100 dark:border-slate-700'}`}
      style={[rowStyle, { alignItems: 'center', gap: 12 }]}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
        <Icon name={icon} size={18} color="#0D9488" />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="caption" muted>
          {label}
        </Text>
        <Text variant="body" style={{ alignSelf: 'auto', ...(latin ? { writingDirection: 'ltr' } : {}) }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function DoctorProfileContent({ doctor }: { doctor: DoctorProfile }) {
  const { t } = useTranslation('admin');
  const { t: tPatient } = useTranslation('patient');
  const arabic = useLocaleStore((s) => s.locale) === Locale.AR;
  const isActive = doctor.isActive !== false;
  const branch = getBranchByName(doctor.branchName);
  const branchLabel = branch ? t(branch.labelKey) : doctor.branchName;
  const languages = doctor.languages.map((language) => (arabic ? (LANGUAGE_AR[language] ?? language) : language));

  return (
    <View className="gap-4">
      <Card className="overflow-hidden p-0">
        <View
          className="items-center overflow-hidden bg-primary-50 dark:bg-primary-900/20"
          style={{ position: 'relative', paddingTop: 28, paddingBottom: 22 }}
        >
          <View
            style={{
              position: 'absolute',
              width: 78,
              height: 78,
              left: 22,
              top: 58,
              borderRadius: 39,
              backgroundColor: '#99F6E4',
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 64,
              height: 64,
              right: 26,
              top: 46,
              borderRadius: 32,
              backgroundColor: '#5EEAD4',
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 16,
              height: 16,
              right: 40,
              top: 150,
              borderRadius: 8,
              backgroundColor: '#0D9488',
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 12,
              height: 12,
              left: 36,
              top: 28,
              borderRadius: 6,
              backgroundColor: '#2DD4BF',
            }}
          />
          <Image
            source={doctor.avatarUrl ? { uri: doctor.avatarUrl } : getDoctorPortrait(doctor.firstName)}
            style={{
              width: 144,
              height: 144,
              borderRadius: 72,
              borderWidth: 4,
              borderColor: '#FFFFFF',
              marginBottom: 10,
            }}
            accessibilityIgnoresInvertColors
          />
          <View className="items-center gap-1">
            {!isActive ? <Badge label={t('doctors.inactive')} variant="warning" className="self-center" /> : null}
            <RatingStars rating={doctor.rating} />
            <Text variant="titleSm" className="text-center" style={{ writingDirection: 'ltr' }}>
              {doctor.rating.toFixed(1)}
            </Text>
            <Text variant="caption" muted className="text-center">
              {t('doctors.reviews', { count: doctor.reviewCount })}
            </Text>
          </View>
        </View>
      </Card>

      <Card className="gap-0 overflow-hidden p-0">
        <ContactRow
          icon="doctors"
          label={t('doctors.specialtyLabel')}
          value={formatSpecialty(doctor.specialty, tPatient)}
        />
        <ContactRow
          icon="clock"
          label={t('doctors.experience')}
          value={t('doctors.years', { years: doctor.yearsExperience })}
        />
        <ContactRow icon="clinic" label={t('doctors.branch')} value={branchLabel} />
        <ContactRow icon="mail" label={t('doctors.email')} value={doctor.email} latin />
        {doctor.phone ? (
          <ContactRow icon="phone" label={t('doctors.phone')} value={formatPhoneForDisplay(doctor.phone)} latin />
        ) : null}
        <ContactRow
          icon="language"
          label={t('doctors.languages')}
          value={languages.join(arabic ? '، ' : ', ')}
          last
        />
      </Card>

      <DoctorReviewsList doctorId={doctor.id} />

      {doctor.bio ? (
        <Card className="gap-2">
          <Text variant="label">{t('doctors.about')}</Text>
          <Text
            variant="bodySm"
            muted
            style={/[A-Za-z]/.test(doctor.bio) ? { writingDirection: 'ltr' } : undefined}
          >
            {doctor.bio}
          </Text>
        </Card>
      ) : null}
    </View>
  );
}
