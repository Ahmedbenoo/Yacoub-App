import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';

interface ProfileInfoRowProps {
  label: string;
  value: string;
}

export function ProfileInfoRow({ label, value }: ProfileInfoRowProps) {
  return (
    <View className="gap-1 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-700">
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}
