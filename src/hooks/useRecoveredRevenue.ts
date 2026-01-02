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

      // Query the recovered_revenue_summary view
      const { data, error: fetchError } = await supabase
        .from('recovered_revenue_summary')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching recovered revenue summary:', fetchError);
        setError('Failed to load recovery summary');
        return;
      }

      if (data) {
        setSummary({
          lifetimeRecovered: Number(data.lifetime_recovered) || 0,
          lifetimeCount: Number(data.lifetime_count) || 0,
          currentMonthRecovered: Number(data.current_month_recovered) || 0,
          currentMonthCount: Number(data.current_month_count) || 0,
          lastRecoveredAt: data.last_recovered_at,
        });
      } else {
        setSummary(DEFAULT_SUMMARY);
      }
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
