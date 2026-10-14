import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDisplayDate } from '@/shared/lib/datetime';
import { Row } from '@/shared/components/layout/Row';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { HrefPressable } from '@/shared/navigation/HrefPressable';
import { getClinicalRecordHref } from '@/shared/navigation/routes';
import { useLocaleStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';
import type { MedicalHistoryEntry } from '@/shared/types/models/patient';

interface MedicalHistoryListProps {
  entries: MedicalHistoryEntry[];
  viewerRole?: UserRole.DOCTOR | UserRole.ADMIN | UserRole.SECRETARY;
}

const typeColors: Record<MedicalHistoryEntry['type'], string> = {
  visit: 'text-primary-600',
  prescription: 'text-cyan-600',
  lab: 'text-orange-600',
};

export function MedicalHistoryList({ entries, viewerRole }: MedicalHistoryListProps) {
  const { t } = useTranslation('doctor');
  const locale = useLocaleStore((s) => s.locale);
  const isRtl = useLocaleStore((s) => s.isRtl);

  if (entries.length === 0) {
    return (
      <Text variant="bodySm" muted>
        {t('patients.historyEmpty')}
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {entries.map((entry) => {
        const href = viewerRole ? getClinicalRecordHref(viewerRole, entry) : null;

        const body = (
          <>
            <Row className="items-center justify-between gap-3">
              <Text variant="label" className={typeColors[entry.type]}>
                {t(`history.types.${entry.type}`)}
              </Text>
              <Row className="items-center gap-2">
                <Text variant="caption" muted>
                  {formatDisplayDate(entry.date, locale)}
                </Text>
                {href ? (
                  <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={16} color="#94A3B8" />
                ) : null}
              </Row>
            </Row>
            <Text variant="titleSm">{entry.title}</Text>
            <Text variant="bodySm" muted>
              {entry.description}
            </Text>
          </>
        );

        if (href) {
          return (
            <Card key={entry.id} className="p-0">
              <HrefPressable href={href} className="gap-1 p-4 active:opacity-80">
                {body}
              </HrefPressable>
            </Card>
          );
        }

        return (
          <Card key={entry.id} className="gap-1">
            {body}
          </Card>
        );
      })}
    </View>
  );
}
