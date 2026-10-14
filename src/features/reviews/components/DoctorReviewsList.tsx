import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDoctorReviewsQuery } from '@/features/reviews/hooks/useReviewQueries';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';

export function DoctorReviewsList({ doctorId }: { doctorId: string }) {
  const { t } = useTranslation('patient');
  const { data } = useDoctorReviewsQuery(doctorId);
  const reviews = data ?? [];

  if (!reviews.length) return null;

  return (
    <Card className="gap-3">
      <Text variant="titleSm">{t('reviews.title')}</Text>
      {reviews.map((review) => (
        <View key={review.id} className="gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="label">{review.patientName}</Text>
            <View style={{ flexDirection: 'row', direction: 'ltr', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={review.rating >= star ? 'star' : 'starOutline'}
                  size={14}
                  color="#F59E0B"
                />
              ))}
            </View>
          </View>
          {review.comment ? (
            <Text variant="bodySm" muted>
              {review.comment}
            </Text>
          ) : null}
        </View>
      ))}
    </Card>
  );
}
