import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  useAppointmentReviewQuery,
  useCreateReviewMutation,
} from '@/features/reviews/hooks/useReviewQueries';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';

interface AppointmentReviewCardProps {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
}

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (value: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', direction: 'ltr', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="button"
          disabled={!onChange}
          onPress={() => onChange?.(star)}
        >
          <Icon name={value >= star ? 'star' : 'starOutline'} size={28} color="#F59E0B" />
        </Pressable>
      ))}
    </View>
  );
}

export function AppointmentReviewCard({
  appointmentId,
  doctorId,
  patientId,
  patientName,
}: AppointmentReviewCardProps) {
  const { t } = useTranslation('appointments');
  const reviewQuery = useAppointmentReviewQuery(appointmentId);
  const createReview = useCreateReviewMutation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (reviewQuery.data) {
    return (
      <Card className="gap-2">
        <Text variant="titleSm">{t('review.yours')}</Text>
        <Stars value={reviewQuery.data.rating} />
        {reviewQuery.data.comment ? <Text variant="bodySm">{reviewQuery.data.comment}</Text> : null}
      </Card>
    );
  }

  return (
    <Card className="gap-3">
      <Text variant="titleSm">{t('review.title')}</Text>
      <Text variant="bodySm" muted>
        {t('review.hint')}
      </Text>
      <Stars value={rating} onChange={setRating} />
      <Input
        label={t('review.comment')}
        value={comment}
        onChangeText={setComment}
        placeholder={t('review.commentPlaceholder')}
        multiline
      />
      <Button
        title={t('review.submit')}
        fullWidth
        disabled={rating < 1}
        loading={createReview.isPending}
        onPress={() =>
          createReview.mutate({
            appointmentId,
            doctorId,
            patientId,
            patientName,
            rating,
            comment,
          })
        }
      />
    </Card>
  );
}
