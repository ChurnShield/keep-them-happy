import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SavedCustomerRecord {
  id: string;
  profile_id: string;
  cancel_session_id: string;
  save_type: string;
  original_mrr: number;
  new_mrr: number;
  discount_percentage: number | null;
  pause_months: number | null;
  churnshield_fee_per_month: number | null;
  stripe_action_id: string | null;
  created_at: string;
  // Joined from cancel_sessions
  exit_reason: string | null;
  custom_feedback: string | null;
}

export interface RevenueByReason {
  reason: string;
  count: number;
  totalSaved: number;
  avgSaved: number;
}

export interface RevenueByType {
  type: string;
  count: number;
  totalSaved: number;
  avgSaved: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  totalSaved: number;
}

export interface RevenueAnalyticsSummary {
  totalSaved: number;
  totalRecords: number;
  avgSavedPerCustomer: number;
  totalFees: number;
  byReason: RevenueByReason[];
  byType: RevenueByType[];
  monthlyTrend: MonthlyTrend[];
  successfulSaves: number;
  discountSaves: number;
  pauseSaves: number;
}

export function useRevenueAnalytics() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SavedCustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // First get user's profile_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
          setRecords([]);
          setLoading(false);
          return;
        }

        // Fetch saved_customers with joined cancel_sessions data
        const { data: savedCustomers, error: savedError } = await supabase
          .from('saved_customers')
          .select(`
            id,
            profile_id,
            cancel_session_id,
            save_type,
            original_mrr,
            new_mrr,
            discount_percentage,
            pause_months,
            churnshield_fee_per_month,
            stripe_action_id,
            created_at
          `)
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (savedError) throw savedError;

        // Fetch related cancel_sessions for exit reasons
        const sessionIds = savedCustomers?.map(sc => sc.cancel_session_id).filter(Boolean) || [];
        
        let sessionsMap: Record<string, { exit_reason: string | null; custom_feedback: string | null }> = {};
        
        if (sessionIds.length > 0) {
          const { data: sessions, error: sessionsError } = await supabase
            .from('cancel_sessions')
            .select('id, exit_reason, custom_feedback')
            .in('id', sessionIds);

          if (sessionsError) throw sessionsError;

          sessionsMap = (sessions || []).reduce((acc, session) => {
            acc[session.id] = {
              exit_reason: session.exit_reason,
              custom_feedback: session.custom_feedback,
            };
            return acc;
          }, {} as Record<string, { exit_reason: string | null; custom_feedback: string | null }>);
        }

        // Merge the data
        const mergedRecords: SavedCustomerRecord[] = (savedCustomers || []).map(sc => ({
          ...sc,
          exit_reason: sessionsMap[sc.cancel_session_id]?.exit_reason || null,
          custom_feedback: sessionsMap[sc.cancel_session_id]?.custom_feedback || null,
        }));

        setRecords(mergedRecords);
      } catch (err) {
        console.error('Error fetching revenue analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const summary = useMemo<RevenueAnalyticsSummary>(() => {
    // Filter to only records with actual Stripe actions (successful saves)
    const validRecords = records.filter(r => r.stripe_action_id !== null);

    // Calculate saved amount per record
    const calculateSaved = (record: SavedCustomerRecord): number => {
      if (record.save_type === 'pause') {
        // For pause, the full MRR is "saved" since they didn't cancel
        return record.original_mrr;
      }
      // For discount, saved = original - new
      return record.original_mrr - record.new_mrr;
    };

    const totalSaved = validRecords.reduce((sum, r) => sum + calculateSaved(r), 0);
    const totalFees = validRecords.reduce((sum, r) => sum + (r.churnshield_fee_per_month || 0), 0);

    // Group by exit reason
    const reasonGroups = validRecords.reduce((acc, r) => {
      const reason = r.exit_reason || 'unknown';
      if (!acc[reason]) {
        acc[reason] = { count: 0, totalSaved: 0 };
      }
      acc[reason].count++;
      acc[reason].totalSaved += calculateSaved(r);
      return acc;
    }, {} as Record<string, { count: number; totalSaved: number }>);

    const byReason: RevenueByReason[] = Object.entries(reasonGroups)
      .map(([reason, data]) => ({
        reason,
        count: data.count,
        totalSaved: data.totalSaved,
        avgSaved: data.count > 0 ? data.totalSaved / data.count : 0,
      }))
      .sort((a, b) => b.totalSaved - a.totalSaved);

    // Group by save type
    const typeGroups = validRecords.reduce((acc, r) => {
      const type = r.save_type || 'unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, totalSaved: 0 };
      }
      acc[type].count++;
      acc[type].totalSaved += calculateSaved(r);
      return acc;
    }, {} as Record<string, { count: number; totalSaved: number }>);

    const byType: RevenueByType[] = Object.entries(typeGroups)
      .map(([type, data]) => ({
        type,
        count: data.count,
        totalSaved: data.totalSaved,
        avgSaved: data.count > 0 ? data.totalSaved / data.count : 0,
      }))
      .sort((a, b) => b.totalSaved - a.totalSaved);

    // Monthly trend (last 6 months)
    const monthlyGroups = validRecords.reduce((acc, r) => {
      const date = new Date(r.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, totalSaved: 0 };
      }
      acc[monthKey].count++;
      acc[monthKey].totalSaved += calculateSaved(r);
      return acc;
    }, {} as Record<string, { count: number; totalSaved: number }>);

    const monthlyTrend: MonthlyTrend[] = Object.entries(monthlyGroups)
      .map(([month, data]) => ({
        month,
        count: data.count,
        totalSaved: data.totalSaved,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    const discountSaves = validRecords.filter(r => r.save_type === 'discount').length;
    const pauseSaves = validRecords.filter(r => r.save_type === 'pause').length;

    return {
      totalSaved,
      totalRecords: validRecords.length,
      avgSavedPerCustomer: validRecords.length > 0 ? totalSaved / validRecords.length : 0,
      totalFees,
      byReason,
      byType,
      monthlyTrend,
      successfulSaves: validRecords.length,
      discountSaves,
      pauseSaves,
    };
  }, [records]);

  return {
    records,
    summary,
    loading,
    error,
    refetch: () => {
      // Trigger a re-fetch by updating state
      setLoading(true);
    },
  };
}
