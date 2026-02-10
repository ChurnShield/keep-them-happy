import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
  ChurnReason, 
  sortByPriority, 
  getReasonLabel, 
  getRecommendation 
} from '@/lib/churnLogic';

export type RecoveryCaseStatus = 'open' | 'recovered' | 'expired';
export type RecoveryActionType = 'message_sent' | 'note' | 'marked_recovered' | 'marked_expired';

export interface RecoveryCase {
  id: string;
  owner_user_id: string;
  customer_reference: string;
  invoice_reference: string | null;
  amount_at_risk: number;
  currency: string;
  status: RecoveryCaseStatus;
  churn_reason: ChurnReason;
  opened_at: string;
  deadline_at: string;
  first_action_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecoveryAction {
  id: string;
  recovery_case_id: string;
  action_type: RecoveryActionType;
  note: string | null;
  created_at: string;
}

export interface CreateRecoveryCaseInput {
  customer_reference: string;
  invoice_reference?: string;
  amount_at_risk: number;
  currency?: string;
  churn_reason?: ChurnReason;
}

// Re-export churn logic utilities for convenience
export { getReasonLabel, getRecommendation } from '@/lib/churnLogic';
export type { ChurnReason } from '@/lib/churnLogic';

// Calculate time remaining until deadline
export function getTimeRemaining(deadline_at: string): { 
  hours: number; 
  minutes: number; 
  isExpired: boolean;
  totalMs: number;
} {
  const deadline = new Date(deadline_at);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, isExpired: true, totalMs: 0 };
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, isExpired: false, totalMs: diffMs };
}

// Determine if case needs urgent attention (for visual highlighting only)
export function isHighRisk(case_: RecoveryCase): boolean {
  const { totalMs } = getTimeRemaining(case_.deadline_at);
  const hoursRemaining = totalMs / (1000 * 60 * 60);
  
  // High Risk: ≤24h remaining AND no action taken yet
  return hoursRemaining <= 24 && !case_.first_action_at;
}

export function useRecoveryCases() {
  const { user, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    if (!user) {
      setCases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('recovery_cases')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('opened_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching recovery cases:', fetchError);
        setError('Failed to load recovery cases');
        return;
      }

      setCases((data || []) as RecoveryCase[]);
    } catch (err) {
      console.error('Recovery cases fetch error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchCases();
    }
  }, [authLoading, fetchCases]);

  // Get only open cases, sorted by priority (highest urgency first)
  const getOpenCases = useCallback((): RecoveryCase[] => {
    const openCases = cases.filter((c) => c.status === 'open');
    return sortByPriority(openCases);
  }, [cases]);

  // Get a single case by ID
  const getCaseById = useCallback((caseId: string): RecoveryCase | undefined => {
    return cases.find((c) => c.id === caseId);
  }, [cases]);

  // Create a new recovery case
  const createCase = useCallback(async (input: CreateRecoveryCaseInput): Promise<RecoveryCase | null> => {
    if (!user) return null;

    const { data, error: insertError } = await supabase
      .from('recovery_cases')
      .insert({
        owner_user_id: user.id,
        customer_reference: input.customer_reference,
        invoice_reference: input.invoice_reference || null,
        amount_at_risk: input.amount_at_risk,
        currency: input.currency || 'GBP',
        churn_reason: input.churn_reason || 'unknown_failure',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating recovery case:', insertError);
      throw new Error('Failed to create recovery case');
    }

    await fetchCases();
    return data as RecoveryCase;
  }, [user, fetchCases]);

  // Update case status (with validation)
  const updateCaseStatus = useCallback(async (
    caseId: string, 
    newStatus: 'recovered' | 'expired'
  ): Promise<boolean> => {
    const existingCase = cases.find(c => c.id === caseId);
    
    if (!existingCase) {
      throw new Error('Case not found');
    }
    
    if (existingCase.status !== 'open') {
      throw new Error('Cannot update status of a resolved case');
    }

    const { error: updateError } = await supabase
      .from('recovery_cases')
      .update({
        status: newStatus,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    if (updateError) {
      console.error('Error updating case status:', updateError);
      throw new Error('Failed to update case status');
    }

    await fetchCases();
    return true;
  }, [cases, fetchCases]);

  // Set first action timestamp
  const setFirstAction = useCallback(async (caseId: string): Promise<boolean> => {
    const existingCase = cases.find(c => c.id === caseId);
    
    if (!existingCase || existingCase.first_action_at) {
      return false; // Already has first action or case not found
    }

    const { error: updateError } = await supabase
      .from('recovery_cases')
      .update({
        first_action_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    if (updateError) {
      console.error('Error setting first action:', updateError);
      return false;
    }

    await fetchCases();
    return true;
  }, [cases, fetchCases]);

  // Stats
  const stats = {
    total: cases.length,
    open: cases.filter((c) => c.status === 'open').length,
    recovered: cases.filter((c) => c.status === 'recovered').length,
    expired: cases.filter((c) => c.status === 'expired').length,
  };

  return {
    cases,
    loading: loading || authLoading,
    error,
    refetch: fetchCases,
    getOpenCases,
    getCaseById,
    createCase,
    updateCaseStatus,
    setFirstAction,
    stats,
  };
}

export function useRecoveryActions(caseId: string | undefined) {
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    if (!caseId) {
      setActions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('recovery_actions')
        .select('*')
        .eq('recovery_case_id', caseId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching recovery actions:', fetchError);
        setError('Failed to load actions');
        return;
      }

      setActions((data || []) as RecoveryAction[]);
    } catch (err) {
      console.error('Recovery actions fetch error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // Add an action
  const addAction = useCallback(async (
    actionType: RecoveryActionType,
    note?: string
  ): Promise<RecoveryAction | null> => {
    if (!caseId) return null;

    const { data, error: insertError } = await supabase
      .from('recovery_actions')
      .insert({
        recovery_case_id: caseId,
        action_type: actionType,
        note: note || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding action:', insertError);
      throw new Error('Failed to add action');
    }

    await fetchActions();
    return data as RecoveryAction;
  }, [caseId, fetchActions]);

  return {
    actions,
    loading,
    error,
    refetch: fetchActions,
    addAction,
  };
}
