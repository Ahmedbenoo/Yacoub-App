import { View, type ViewProps } from 'react-native';

import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';

interface RowProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export function Row({ className, style, children, ...props }: RowProps) {
  const { rowStyle } = useLayoutDirection();

  return (
    <View className={className} style={[rowStyle, style]} {...props}>
      {children}
    </View>
  );
}
