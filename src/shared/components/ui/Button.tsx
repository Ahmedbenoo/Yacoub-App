import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary-600 active:bg-primary-700',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-secondary-500 active:bg-secondary-600',
    text: 'text-white',
  },
  outline: {
    container: 'border border-primary-600 bg-transparent active:bg-primary-50 dark:active:bg-primary-900/20',
    text: 'text-primary-600 dark:text-primary-400',
  },
  ghost: {
    container: 'bg-transparent active:bg-slate-100 dark:active:bg-slate-800',
    text: 'text-primary-600 dark:text-primary-400',
  },
  danger: {
    container: 'bg-status-error active:opacity-90',
    text: 'text-white',
  },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-10 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-8',
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const styles = variantStyles[variant];

  return (
    <Pressable
      className={cn(
        'min-h-[44px] flex-row items-center justify-center rounded-xl',
        sizeStyles[size],
        styles.container,
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? '#0D9488' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text variant="label" className={cn('text-center', styles.text)}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
