import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, DollarSign, ArrowRight, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RecoveryCase, 
  getTimeRemaining, 
  isHighRisk, 
  getReasonLabel, 
  getRecommendation 
} from '@/hooks/useRecoveryCases';
import { useEffect, useState } from 'react';

interface RecoveryCardProps {
  recoveryCase: RecoveryCase;
  index: number;
}

function CountdownTimer({ deadline_at }: { deadline_at: string }) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(deadline_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline_at));
    }, 60000);
    return () => clearInterval(interval);
  }, [deadline_at]);

  if (timeRemaining.isExpired) {
    return <span className="text-destructive font-medium">Expired</span>;
  }

  return (
    <span className="font-mono text-primary">
      {timeRemaining.hours}h {timeRemaining.minutes}m
    </span>
  );
}

function getStatusBadgeVariant(reason: string, isUrgent: boolean, isExpired: boolean) {
  if (isExpired) return 'secondary';
  if (isUrgent) return 'destructive';
  if (reason === 'bank_decline') return 'secondary';
  return 'outline';
}

export function RecoveryCard({ recoveryCase, index }: RecoveryCardProps) {
  const navigate = useNavigate();
  const highRisk = isHighRisk(recoveryCase);
  const { isExpired } = getTimeRemaining(recoveryCase.deadline_at);
  const reasonLabel = getReasonLabel(recoveryCase.churn_reason);
  const recommendation = getRecommendation(recoveryCase.churn_reason);

  const borderClass = highRisk && !isExpired 
    ? 'border-destructive/30 shadow-[0_0_20px_rgba(255,80,80,0.15)]' 
    : recoveryCase.status === 'recovered'
    ? 'border-primary/30 shadow-[0_0_20px_rgba(0,227,178,0.15)]'
    : 'border-border/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        group relative cursor-pointer rounded-xl p-5
        bg-white/[0.03] backdrop-blur-sm border
        transition-all duration-300
        hover:border-primary/40 hover:bg-white/[0.05]
        ${borderClass}
        ${highRisk && !isExpired ? 'animate-pulse-subtle' : ''}
      `}
      onClick={() => navigate(`/recovery/${recoveryCase.id}`)}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Email & Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground truncate">
              {recoveryCase.customer_reference}
            </span>
            {highRisk && !isExpired && (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </Badge>
            )}
            {isExpired && (
              <Badge variant="secondary" className="text-xs">Expired</Badge>
            )}
          </div>
          
          {/* Status Badge */}
          <Badge 
            variant={getStatusBadgeVariant(recoveryCase.churn_reason, highRisk, isExpired)}
            className="text-xs"
          >
            {reasonLabel}
          </Badge>
          
          {/* Recommended Action */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground leading-relaxed">
              {recommendation}
            </span>
          </div>
          
          {/* Amount & Time */}
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-primary">
                {recoveryCase.amount_at_risk.toLocaleString(undefined, {
                  style: 'currency',
                  currency: recoveryCase.currency,
                })}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <CountdownTimer deadline_at={recoveryCase.deadline_at} />
            </span>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}
