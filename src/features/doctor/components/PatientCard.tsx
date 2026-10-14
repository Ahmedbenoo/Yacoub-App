import { View } from 'react-native';
import { type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { formatPatientSubtitle, getFullName } from '@/features/doctor/lib/formatters';
import { Row } from '@/shared/components/layout/Row';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import type { PatientProfile } from '@/shared/types/models/patient';

interface PatientCardProps {
  patient: PatientProfile;
  href?: Href;
  onPress?: () => void;
}

export function PatientCard({ patient, href, onPress }: PatientCardProps) {
  const { t } = useTranslation('common');
  const { forwardIconName } = useLayoutDirection();
  const interactive = Boolean(href || onPress);

  const body = (
    <>
      <Row className="items-center gap-3">
        <Avatar
          firstName={patient.firstName}
          lastName={patient.lastName}
          imageUrl={patient.avatarUrl}
          size="md"
        />

        <View className="min-w-0 flex-1 gap-1">
          <Text variant="titleSm" numberOfLines={1}>
            {getFullName(patient.firstName, patient.lastName)}
          </Text>
          <Text variant="bodySm" muted>
            {formatPatientSubtitle(
              patient.dateOfBirth,
              patient.gender,
              patient.bloodType,
              t('patientAgeGender'),
            )}
          </Text>
        </View>

        {interactive && <Icon name={forwardIconName} size={18} color="#94A3B8" />}
      </Row>

      {patient.chronicConditions.length > 0 && (
        <Row className="flex-wrap gap-2">
          {patient.chronicConditions.slice(0, 2).map((condition) => (
            <Badge key={condition} label={condition} variant="info" />
          ))}
          {patient.isActive === false && (
            <Badge label={t('inactive')} variant="warning" />
          )}
        </Row>
      )}
    </>
  );

  if (!interactive) {
    return <Card className="gap-3">{body}</Card>;
  }

  return (
    <Card className="p-0">
      <HrefPressable href={href} onPress={onPress} className="gap-3 self-stretch p-4 active:opacity-80">
        {body}
      </HrefPressable>
    </Card>
  );
}
