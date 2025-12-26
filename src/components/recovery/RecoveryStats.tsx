import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { RecoveryCase } from '@/hooks/useRecoveryCases';
import { useMemo, useState, createContext, useContext, useEffect } from 'react';

// Hover context to share state between cards and connectors
interface HoverContextType {
  hoveredIndex: number | null;
  trailIndex: number;
}
const HoverContext = createContext<HoverContextType>({ hoveredIndex: null, trailIndex: -1 });

interface RecoveryStatsProps {
  cases: RecoveryCase[];
  onFilterChange?: (filter: string) => void;
  activeFilter?: string;
}

type FilterType = 'all' | 'recovered' | 'expired' | 'open';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  variant: 'default' | 'success' | 'muted' | 'primary';
  delay: number;
  index: number;
  filterKey: FilterType;
  isActiveFilter: boolean;
  onHoverChange: (index: number | null) => void;
  onClick: () => void;
}

function StatCard({ icon, label, value, subtext, variant, delay, index, filterKey, isActiveFilter, onHoverChange, onClick }: StatCardProps) {
  const { hoveredIndex, trailIndex } = useContext(HoverContext);
  const isHighlighted = hoveredIndex !== null && index <= trailIndex;
  
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-primary',
    muted: 'text-muted-foreground',
    primary: 'text-primary',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: isActiveFilter 
          ? '0 0 24px hsl(var(--primary) / 0.5), inset 0 0 0 1px hsl(var(--primary) / 0.5)' 
          : isHighlighted 
            ? '0 0 20px hsl(var(--primary) / 0.3)' 
            : '0 0 0px hsl(var(--primary) / 0)'
      }}
      transition={{ duration: 0.4, delay }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-4 rounded-xl bg-white/[0.03] border backdrop-blur-sm cursor-pointer transition-colors ${
        isActiveFilter 
          ? 'border-primary bg-primary/10' 
          : isHighlighted 
            ? 'border-primary/60' 
            : 'border-border/50 hover:border-primary/30'
      }`}
      onMouseEnter={() => onHoverChange(index)}
      onMouseLeave={() => onHoverChange(null)}
      onClick={onClick}
    >
      {/* Active filter indicator */}
      {isActiveFilter && (
        <motion.div 
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClasses[variant]}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </motion.div>
  );
}

function HorizontalConnector({ delay, connectorIndex }: { delay: number; connectorIndex: number }) {
  const { hoveredIndex, trailIndex } = useContext(HoverContext);
  // Connector i is active if trail has reached card i+1 (connector sits after card i)
  const isActive = hoveredIndex !== null && connectorIndex < trailIndex;
  
  return (
    <div className="hidden lg:flex items-center justify-center">
      <svg width="40" height="24" viewBox="0 0 40 24" className="overflow-visible">
        {/* Glow filter for pulsing effect */}
        <defs>
          <filter id={`glow-h-${connectorIndex}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id={`connector-gradient-h-${connectorIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isActive ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"} />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0 12 Q20 12 40 12"
          fill="none"
          stroke={`url(#connector-gradient-h-${connectorIndex})`}
          strokeWidth={isActive ? 3 : 2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: isActive ? 1 : 0.6,
          }}
          transition={{ duration: 0.6, delay, ease: "easeOut" }}
        />
        <motion.circle
          cx="40"
          cy="12"
          r="3"
          fill="hsl(var(--primary))"
          filter={isActive ? `url(#glow-h-${connectorIndex})` : undefined}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isActive ? [1, 1.4, 1] : 1, 
            opacity: 1,
            r: isActive ? 4 : 3,
          }}
          transition={isActive ? { 
            scale: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.3 },
            r: { duration: 0.2 }
          } : { duration: 0.3, delay: delay + 0.4 }}
        />
        {/* Trail particle */}
        {isActive && (
          <motion.circle
            cx="0"
            cy="12"
            r="2"
            fill="hsl(var(--primary))"
            initial={{ cx: 0, opacity: 0 }}
            animate={{ cx: [0, 40], opacity: [0, 1, 0] }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </svg>
    </div>
  );
}

function VerticalConnector({ delay, connectorIndex }: { delay: number; connectorIndex: number }) {
  const { hoveredIndex, trailIndex } = useContext(HoverContext);
  // For mobile: connector after first row (cards 0,1) activates when trail >= 2
  const isActive = hoveredIndex !== null && connectorIndex < trailIndex;
  
  return (
    <div className="flex lg:hidden items-center justify-center col-span-2 py-1">
      <svg width="24" height="32" viewBox="0 0 24 32" className="overflow-visible">
        {/* Glow filter for pulsing effect */}
        <defs>
          <filter id={`glow-v-${connectorIndex}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id={`connector-gradient-v-${connectorIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isActive ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"} />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <motion.path
          d="M12 0 Q12 16 12 32"
          fill="none"
          stroke={`url(#connector-gradient-v-${connectorIndex})`}
          strokeWidth={isActive ? 3 : 2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: isActive ? 1 : 0.6,
          }}
          transition={{ duration: 0.5, delay, ease: "easeOut" }}
        />
        <motion.circle
          cx="12"
          cy="32"
          r="3"
          fill="hsl(var(--primary))"
          filter={isActive ? `url(#glow-v-${connectorIndex})` : undefined}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isActive ? [1, 1.4, 1] : 1, 
            opacity: 1,
            r: isActive ? 4 : 3,
          }}
          transition={isActive ? { 
            scale: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.3 },
            r: { duration: 0.2 }
          } : { duration: 0.3, delay: delay + 0.3 }}
        />
        {/* Trail particle */}
        {isActive && (
          <motion.circle
            cx="12"
            cy="0"
            r="2"
            fill="hsl(var(--primary))"
            initial={{ cy: 0, opacity: 0 }}
            animate={{ cy: [0, 32], opacity: [0, 1, 0] }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </svg>
    </div>
  );
}

export function RecoveryStats({ cases, onFilterChange, activeFilter = 'all' }: RecoveryStatsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [trailIndex, setTrailIndex] = useState(-1);
  
  const handleFilterClick = (filter: FilterType) => {
    if (onFilterChange) {
      // Toggle off if clicking the same filter
      onFilterChange(activeFilter === filter ? 'all' : filter);
    }
  };
  
  // Animate trail sequentially when hovering
  useEffect(() => {
    if (hoveredIndex === null) {
      setTrailIndex(-1);
      return;
    }
    
    // Reset and start trail animation
    setTrailIndex(0);
    const maxIndex = 3; // 4 cards (0-3)
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex <= maxIndex) {
        setTrailIndex(currentIndex);
      } else {
        clearInterval(interval);
      }
    }, 120); // 120ms between each step
    
    return () => clearInterval(interval);
  }, [hoveredIndex]);
  
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
    <HoverContext.Provider value={{ hoveredIndex, trailIndex }}>
      <div className="mb-8">
        {/* Desktop layout with horizontal connectors */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_40px_1fr_40px_1fr_40px_1fr] gap-3 items-center">
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            label="Recovery Rate"
            value={`${metrics.recoveryRate}%`}
            subtext={`${metrics.recovered} of ${metrics.recovered + metrics.expired} resolved`}
            variant={metrics.recoveryRate >= 50 ? 'success' : 'muted'}
            delay={0}
            index={0}
            filterKey="all"
            isActiveFilter={activeFilter === 'all'}
            onHoverChange={setHoveredIndex}
            onClick={() => handleFilterClick('all')}
          />
          <HorizontalConnector delay={0.15} connectorIndex={1} />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            label="Recovered"
            value={formatCurrency(metrics.revenueRecovered)}
            subtext={`${metrics.recovered} case${metrics.recovered !== 1 ? 's' : ''}`}
            variant="success"
            delay={0.1}
            index={1}
            filterKey="recovered"
            isActiveFilter={activeFilter === 'recovered'}
            onHoverChange={setHoveredIndex}
            onClick={() => handleFilterClick('recovered')}
          />
          <HorizontalConnector delay={0.25} connectorIndex={2} />
          <StatCard
            icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
            label="Lost"
            value={formatCurrency(metrics.revenueLost)}
            subtext={`${metrics.expired} case${metrics.expired !== 1 ? 's' : ''}`}
            variant="muted"
            delay={0.2}
            index={2}
            filterKey="expired"
            isActiveFilter={activeFilter === 'expired'}
            onHoverChange={setHoveredIndex}
            onClick={() => handleFilterClick('expired')}
          />
          <HorizontalConnector delay={0.35} connectorIndex={3} />
          <StatCard
            icon={<Clock className="h-4 w-4 text-primary" />}
            label="At Risk"
            value={formatCurrency(metrics.revenueAtRisk)}
            subtext={`${metrics.open} open case${metrics.open !== 1 ? 's' : ''}`}
            variant="primary"
            delay={0.3}
            index={3}
            filterKey="open"
            isActiveFilter={activeFilter === 'open'}
            onHoverChange={setHoveredIndex}
            onClick={() => handleFilterClick('open')}
          />
        </div>

        {/* Mobile layout with vertical connectors between rows */}
        <div className="grid lg:hidden grid-cols-2 gap-3 items-center">
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            label="Recovery Rate"
            value={`${metrics.recoveryRate}%`}
            subtext={`${metrics.recovered} of ${metrics.recovered + metrics.expired} resolved`}
            variant={metrics.recoveryRate >= 50 ? 'success' : 'muted'}
            delay={0}
            index={0}
            filterKey="all"
            isActiveFilter={activeFilter === 'all'}
            onHoverChange={setHoveredIndex}
            onClick={() => handleFilterClick('all')}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            label="Recovered"
            value={formatCurrency(metrics.revenueRecovered)}
            subtext={`${metrics.recovered} case${metrics.recovered !== 1 ? 's' : ''}`}
            variant="success"
            delay={0.1}
            index={1}
            filterKey="recovered"
            isActiveFilter={activeFilter === 'recovered'}
            onHoverChange={setHoveredIndex}
            onClick={() => handleFilterClick('recovered')}
          />
          <VerticalConnector delay={0.2} connectorIndex={2} />
          <StatCard
            icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
            label="Lost"
            value={formatCurrency(metrics.revenueLost)}
            subtext={`${metrics.expired} case${metrics.expired !== 1 ? 's' : ''}`}
            variant="muted"
            delay={0.25}
            index={2}
            filterKey="expired"
            isActiveFilter={activeFilter === 'expired'}
            onHoverChange={setHoveredIndex}
            onClick={() => handleFilterClick('expired')}
          />
          <StatCard
            icon={<Clock className="h-4 w-4 text-primary" />}
            label="At Risk"
            value={formatCurrency(metrics.revenueAtRisk)}
            subtext={`${metrics.open} open case${metrics.open !== 1 ? 's' : ''}`}
            variant="primary"
            delay={0.3}
            index={3}
            filterKey="open"
            isActiveFilter={activeFilter === 'open'}
            onHoverChange={setHoveredIndex}
            onClick={() => handleFilterClick('open')}
          />
        </div>
      </div>
    </HoverContext.Provider>
  );
}
