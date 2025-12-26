import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { RecoveryCase } from '@/hooks/useRecoveryCases';
import { useMemo } from 'react';

interface RecoveryStatsProps {
  cases: RecoveryCase[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  variant: 'default' | 'success' | 'muted' | 'primary';
  delay: number;
}

function StatCard({ icon, label, value, subtext, variant, delay }: StatCardProps) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-primary',
    muted: 'text-muted-foreground',
    primary: 'text-primary',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative p-4 rounded-xl bg-white/[0.03] border border-border/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClasses[variant]}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </motion.div>
  );
}

export function RecoveryStats({ cases }: RecoveryStatsProps) {
  const metrics = useMemo(() => {
    const resolved = cases.filter(c => c.status !== 'open');
    const recovered = cases.filter(c => c.status === 'recovered');
    const expired = cases.filter(c => c.status === 'expired');
    const open = cases.filter(c => c.status === 'open');
    
    const recoveryRate = resolved.length > 0 
      ? Math.round((recovered.length / resolved.length) * 100) 
      : 0;
    
    const revenueRecovered = recovered.reduce((sum, c) => sum + c.amount_at_risk, 0);
    const revenueLost = expired.reduce((sum, c) => sum + c.amount_at_risk, 0);
    const revenueAtRisk = open.reduce((sum, c) => sum + c.amount_at_risk, 0);

    return {
      total: cases.length,
      open: open.length,
      recovered: recovered.length,
      expired: expired.length,
      recoveryRate,
      revenueRecovered,
      revenueLost,
      revenueAtRisk,
    };
  }, [cases]);

  const formatCurrency = (amount: number) => 
    amount.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <StatCard
        icon={<TrendingUp className="h-4 w-4 text-primary" />}
        label="Recovery Rate"
        value={`${metrics.recoveryRate}%`}
        subtext={`${metrics.recovered} of ${metrics.recovered + metrics.expired} resolved`}
        variant={metrics.recoveryRate >= 50 ? 'success' : 'muted'}
        delay={0}
      />
      <StatCard
        icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
        label="Recovered"
        value={formatCurrency(metrics.revenueRecovered)}
        subtext={`${metrics.recovered} case${metrics.recovered !== 1 ? 's' : ''}`}
        variant="success"
        delay={0.1}
      />
      <StatCard
        icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
        label="Lost"
        value={formatCurrency(metrics.revenueLost)}
        subtext={`${metrics.expired} case${metrics.expired !== 1 ? 's' : ''}`}
        variant="muted"
        delay={0.2}
      />
      <StatCard
        icon={<Clock className="h-4 w-4 text-primary" />}
        label="At Risk"
        value={formatCurrency(metrics.revenueAtRisk)}
        subtext={`${metrics.open} open case${metrics.open !== 1 ? 's' : ''}`}
        variant="primary"
        delay={0.3}
      />
    </div>
  );
}
