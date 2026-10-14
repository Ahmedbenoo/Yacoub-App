import { Logo } from '@/shared/components/brand/Logo';
import { cn } from '@/shared/lib/utils';
import { TAB_TOP_BAR_METRICS } from '@/shared/navigation/tab-top-bar-metrics';

interface NavBrandProps {
  className?: string;
}

export function NavBrand({ className }: NavBrandProps) {
  return (
    <Logo
      size="nav"
      align="start"
      className={cn(className)}
      maxVisibleHeight={TAB_TOP_BAR_METRICS.logoVisibleHeight}
    />
  );
}
