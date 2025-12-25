import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  last_active_at: string | null;
  subscription_status: 'active' | 'canceled' | 'past_due';
  plan_amount: number;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChurnSignal {
  id: string;
  type: 'inactive' | 'past_due' | 'recently_canceled';
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  triggeredAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'none';

export interface CustomerWithRisk extends Customer {
  riskLevel: RiskLevel;
  signals: ChurnSignal[];
}

// Calculate days since a date
function daysSince(dateString: string | null): number | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Determine churn signals for a customer
export function calculateChurnSignals(customer: Customer): ChurnSignal[] {
  const signals: ChurnSignal[] = [];
  const now = new Date();

  // Signal 1: Inactive for > 14 days
  const inactiveDays = daysSince(customer.last_active_at);
  if (inactiveDays !== null && inactiveDays > 14) {
    signals.push({
      id: `${customer.id}-inactive`,
      type: 'inactive',
      label: 'Inactive Customer',
      description: `Last active ${inactiveDays} days ago`,
      severity: inactiveDays > 30 ? 'high' : 'medium',
      triggeredAt: customer.last_active_at!,
    });
  }

  // Signal 2: Payment past due
  if (customer.subscription_status === 'past_due') {
    signals.push({
      id: `${customer.id}-past_due`,
      type: 'past_due',
      label: 'Payment Failed',
      description: 'Subscription payment is past due',
      severity: 'high',
      triggeredAt: customer.updated_at,
    });
  }

  // Signal 3: Recently canceled (within 30 days)
  if (customer.subscription_status === 'canceled' && customer.canceled_at) {
    const daysSinceCanceled = daysSince(customer.canceled_at);
    if (daysSinceCanceled !== null && daysSinceCanceled <= 30) {
      signals.push({
        id: `${customer.id}-recently_canceled`,
        type: 'recently_canceled',
        label: 'Recently Canceled',
        description: `Canceled ${daysSinceCanceled} day${daysSinceCanceled === 1 ? '' : 's'} ago`,
        severity: daysSinceCanceled <= 7 ? 'high' : 'medium',
        triggeredAt: customer.canceled_at,
      });
    }
  }

  return signals;
}

// Determine risk level based on signal count
export function calculateRiskLevel(signals: ChurnSignal[]): RiskLevel {
  if (signals.length === 0) return 'none';
  if (signals.length === 1) return 'low';
  if (signals.length === 2) return 'medium';
  return 'high';
}

// Enrich customer with risk data
export function enrichCustomerWithRisk(customer: Customer): CustomerWithRisk {
  const signals = calculateChurnSignals(customer);
  const riskLevel = calculateRiskLevel(signals);
  return { ...customer, riskLevel, signals };
}

export function useCustomers() {
  const { user, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching customers:', fetchError);
        setError('Failed to load customers');
        return;
      }

      // Enrich each customer with risk data
      const enrichedCustomers = (data || []).map((c) => 
        enrichCustomerWithRisk(c as Customer)
      );

      setCustomers(enrichedCustomers);
    } catch (err) {
      console.error('Customer fetch error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchCustomers();
    }
  }, [authLoading, fetchCustomers]);

  // Get a single customer by ID
  const getCustomerById = useCallback((customerId: string): CustomerWithRisk | undefined => {
    return customers.find((c) => c.id === customerId);
  }, [customers]);

  // Get customers filtered by risk level
  const getAtRiskCustomers = useCallback((): CustomerWithRisk[] => {
    return customers.filter((c) => c.riskLevel !== 'none');
  }, [customers]);

  // Stats
  const stats = {
    total: customers.length,
    atRisk: customers.filter((c) => c.riskLevel !== 'none').length,
    highRisk: customers.filter((c) => c.riskLevel === 'high').length,
    mediumRisk: customers.filter((c) => c.riskLevel === 'medium').length,
    lowRisk: customers.filter((c) => c.riskLevel === 'low').length,
  };

  return {
    customers,
    loading: loading || authLoading,
    error,
    refetch: fetchCustomers,
    getCustomerById,
    getAtRiskCustomers,
    stats,
  };
}
