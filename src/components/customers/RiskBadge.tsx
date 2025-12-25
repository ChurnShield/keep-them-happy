import { RiskLevel } from '@/hooks/useCustomers';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

const riskConfig: Record<RiskLevel, {
  label: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  className: string;
  icon: typeof AlertTriangle;
}> = {
  high: {
    label: 'High Risk',
    variant: 'destructive',
    className: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
    icon: ShieldAlert,
  },
  medium: {
    label: 'Medium Risk',
    variant: 'default',
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20',
    icon: AlertTriangle,
  },
  low: {
    label: 'Low Risk',
    variant: 'secondary',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20',
    icon: AlertCircle,
  },
  none: {
    label: 'Healthy',
    variant: 'outline',
    className: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
    icon: CheckCircle,
  },
};

export function RiskBadge({ level, showIcon = true, size = 'default' }: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        size === 'sm' && 'text-xs px-2 py-0.5'
      )}
    >
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {config.label}
    </Badge>
  );
}
