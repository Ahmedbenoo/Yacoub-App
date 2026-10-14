import { Pressable } from 'react-native';

import { Row } from '@/shared/components/layout/Row';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { forwardIconName } = useLayoutDirection();

  return (
    <Row className="w-full items-center justify-between gap-2">
      <Text variant="body" className="min-w-0 flex-1 font-semibold" numberOfLines={1}>
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} className="shrink-0 active:opacity-70">
          <Row className="items-center gap-1">
          <Text variant="label" className="text-primary-600 dark:text-primary-400">
            {actionLabel}
          </Text>
          <Icon name={forwardIconName} size={16} color="#0D9488" />
          </Row>
        </Pressable>
      )}
    </Row>
  );
}
