import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/shared/components/ui/Avatar';
import { Card } from '@/shared/components/ui/Card';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/lib/utils';

interface ProfileHeroCardProps {
  firstName: string;
  lastName: string;
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  avatarUrl?: string;
  tone?: 'default' | 'primary';
}

export function ProfileHeroCard({
  firstName,
  lastName,
  title,
  subtitle,
  badges,
  avatarUrl,
  tone = 'default',
}: ProfileHeroCardProps) {
  const onPrimary = tone === 'primary';

  return (
    <Card
      elevated
      className={cn('items-center gap-3 py-6', onPrimary && 'border-primary-600 bg-primary-600')}
    >
      <Avatar
        firstName={firstName}
        lastName={lastName}
        size="xl"
        imageUrl={avatarUrl}
        className={onPrimary ? 'bg-white' : undefined}
      />
      <Text variant="titleMd" className={cn('text-center', onPrimary && 'text-white')}>
        {title}
      </Text>
      {subtitle && (
        <Text
          variant="bodySm"
          muted={!onPrimary}
          className={cn('text-center', onPrimary && 'text-white')}
        >
          {subtitle}
        </Text>
      )}
      {badges && (
        <View className="flex-row flex-wrap justify-center gap-2">{badges}</View>
      )}
    </Card>
  );
}
