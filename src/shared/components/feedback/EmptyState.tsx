import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {icon && <View className="mb-4">{icon}</View>}
      <Text variant="titleSm" className="mb-2 text-center">
        {title}
      </Text>
      {description && (
        <Text variant="bodySm" muted className="mb-6 text-center">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} variant="outline" onPress={onAction} />
      )}
    </View>
  );
}
