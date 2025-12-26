import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { 
  useRecoveryCases, 
  isHighRisk,
  RecoveryCase 
} from '@/hooks/useRecoveryCases';
import { RecoveryCard } from '@/components/recovery/RecoveryCard';
import { RecoveryToolbar } from '@/components/recovery/RecoveryToolbar';
import { RecoveryStats } from '@/components/recovery/RecoveryStats';
import { RecoveryEmptyState } from '@/components/recovery/RecoveryEmptyState';
import { CreateTestCaseDialog } from '@/components/recovery/CreateTestCaseDialog';
import { SettingsDropdown } from '@/components/SettingsDropdown';

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-white/[0.03] p-5">
          <div className="space-y-3">
            <Skeleton className="h-5 w-48 bg-white/10" />
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecoveryInbox() {
  const { cases, getOpenCases, loading, error, createCase, refetch } = useRecoveryCases();
  const allOpenCases = getOpenCases();
  
  // Toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Filter and sort cases
  const filteredCases = useMemo(() => {
    let result: RecoveryCase[] = [];

    // Apply status filter
    switch (statusFilter) {
      case 'urgent':
        result = cases.filter(c => c.status === 'open' && isHighRisk(c));
        break;
      case 'open':
        result = cases.filter(c => c.status === 'open');
        break;
      case 'recovered':
        result = cases.filter(c => c.status === 'recovered');
        break;
      case 'expired':
        result = cases.filter(c => c.status === 'expired');
        break;
      default:
        result = [...cases];
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.customer_reference.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortOrder) {
      case 'oldest':
        result.sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());
        break;
      case 'amount-high':
        result.sort((a, b) => b.amount_at_risk - a.amount_at_risk);
        break;
      case 'amount-low':
        result.sort((a, b) => a.amount_at_risk - b.amount_at_risk);
        break;
      default: // newest
        result.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
    }

    return result;
  }, [cases, statusFilter, searchQuery, sortOrder]);

  const handleCreateCase = async (input: Parameters<typeof createCase>[0]) => {
    await createCase(input);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      
      <div className="relative container max-w-6xl py-8 px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-foreground">
              Recovery Inbox
            </h1>
            <p className="text-muted-foreground">
              Monitor and act on revenue recovery opportunities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateTestCaseDialog onCreate={handleCreateCase} />
            <SettingsDropdown />
          </div>
        </motion.div>

        {/* Stats */}
        {!loading && cases.length > 0 && (
          <RecoveryStats cases={cases} onFilterChange={setStatusFilter} activeFilter={statusFilter} />
        )}

        {/* Toolbar */}
        {!loading && cases.length > 0 && (
          <RecoveryToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        )}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 mb-6"
          >
            <p className="text-destructive">{error}</p>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && <LoadingSkeleton />}

        {/* Empty state */}
        {!loading && !error && allOpenCases.length === 0 && cases.length === 0 && (
          <RecoveryEmptyState />
        )}

        {/* No results from filter */}
        {!loading && !error && filteredCases.length === 0 && cases.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No cases match your filters.</p>
          </motion.div>
        )}

        {/* Cases grid */}
        {!loading && !error && filteredCases.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((recoveryCase, index) => (
              <RecoveryCard 
                key={recoveryCase.id} 
                recoveryCase={recoveryCase} 
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
