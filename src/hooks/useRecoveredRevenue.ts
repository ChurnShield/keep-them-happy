import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RecoveredRevenueSummary {
  lifetimeRecovered: number;
  lifetimeCount: number;
  currentMonthRecovered: number;
  currentMonthCount: number;
  lastRecoveredAt: string | null;
}

const DEFAULT_SUMMARY: RecoveredRevenueSummary = {
  lifetimeRecovered: 0,
  lifetimeCount: 0,
  currentMonthRecovered: 0,
  currentMonthCount: 0,
  lastRecoveredAt: null,
};

export function useRecoveredRevenue() {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<RecoveredRevenueSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!user) {
      setSummary(DEFAULT_SUMMARY);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current month start for filtering
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // First, get user's profile ID for saved_customers query
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Query saved_customers (cancel flow saves) via profile_id
      let savedCustomersData: { original_mrr: number; new_mrr: number; created_at: string }[] = [];
      if (profile?.id) {
        const { data: savedData, error: savedError } = await supabase
          .from('saved_customers')
          .select('original_mrr, new_mrr, created_at')
          .eq('profile_id', profile.id);

        if (savedError) {
          console.error('Error fetching saved customers:', savedError);
        } else {
          savedCustomersData = savedData || [];
        }
      }

      // Query recovered_revenue_summary view (payment recovery)
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('recovered_revenue_summary')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (ledgerError) {
        console.error('Error fetching recovered revenue summary:', ledgerError);
      }

      // Calculate saved_customers totals (MRR saved = original - new for each save)
      let cancelFlowLifetimeRecovered = 0;
      let cancelFlowLifetimeCount = 0;
      let cancelFlowCurrentMonthRecovered = 0;
      let cancelFlowCurrentMonthCount = 0;
      let lastCancelFlowSaveAt: string | null = null;

      for (const save of savedCustomersData) {
        const mrr = Number(save.original_mrr) || 0;
        const newMrr = Number(save.new_mrr) || 0;
        // For pause (new_mrr = 0), we save the full MRR
        // For discount, we save the difference
        const savedAmount = mrr - newMrr;
        
        if (savedAmount > 0) {
          cancelFlowLifetimeRecovered += savedAmount;
          cancelFlowLifetimeCount += 1;

          if (save.created_at >= monthStart) {
            cancelFlowCurrentMonthRecovered += savedAmount;
            cancelFlowCurrentMonthCount += 1;
          }

          if (!lastCancelFlowSaveAt || save.created_at > lastCancelFlowSaveAt) {
            lastCancelFlowSaveAt = save.created_at;
          }
        }
      }

      // Combine both sources
      const paymentRecoveryLifetime = Number(ledgerData?.lifetime_recovered) || 0;
      const paymentRecoveryCount = Number(ledgerData?.lifetime_count) || 0;
      const paymentRecoveryCurrentMonth = Number(ledgerData?.current_month_recovered) || 0;
      const paymentRecoveryCurrentMonthCount = Number(ledgerData?.current_month_count) || 0;
      const paymentRecoveryLastAt = ledgerData?.last_recovered_at || null;

      // Determine the most recent recovery date
      let lastRecoveredAt = paymentRecoveryLastAt;
      if (lastCancelFlowSaveAt) {
        if (!lastRecoveredAt || lastCancelFlowSaveAt > lastRecoveredAt) {
          lastRecoveredAt = lastCancelFlowSaveAt;
        }
      }

      setSummary({
        lifetimeRecovered: paymentRecoveryLifetime + cancelFlowLifetimeRecovered,
        lifetimeCount: paymentRecoveryCount + cancelFlowLifetimeCount,
        currentMonthRecovered: paymentRecoveryCurrentMonth + cancelFlowCurrentMonthRecovered,
        currentMonthCount: paymentRecoveryCurrentMonthCount + cancelFlowCurrentMonthCount,
        lastRecoveredAt,
      });
    } catch (err) {
      console.error('Recovered revenue fetch error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSummary();
    }
  }, [authLoading, fetchSummary]);

  return {
    summary,
    loading: loading || authLoading,
    error,
    refetch: fetchSummary,
  };
}
