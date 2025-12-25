import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  plan_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

type SubscriptionStatus = 'loading' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setStatus('none');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError);
        setError('Failed to fetch subscription status');
        setStatus('none');
        return;
      }

      if (data) {
        setSubscription(data);
        
        // Determine status
        if (data.status === 'active') {
          setStatus('active');
        } else if (data.status === 'trialing') {
          setStatus('trialing');
        } else if (data.status === 'past_due') {
          setStatus('past_due');
        } else if (data.status === 'canceled') {
          setStatus('canceled');
        } else {
          setStatus('none');
        }
      } else {
        setSubscription(null);
        setStatus('none');
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
      setError('An unexpected error occurred');
      setStatus('none');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  // Check if user has an active subscription or trial
  const hasActiveSubscription = status === 'active' || status === 'trialing';

  // Check if subscription allows Connect Stripe feature
  const canConnectStripe = hasActiveSubscription;

  // Check if in trial period
  const isTrialing = status === 'trialing';

  // Get days remaining in trial
  const getTrialDaysRemaining = (): number | null => {
    if (!subscription?.trial_end) return null;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return {
    subscription,
    status,
    loading: loading || authLoading,
    error,
    hasActiveSubscription,
    canConnectStripe,
    isTrialing,
    trialDaysRemaining: getTrialDaysRemaining(),
    refetch: fetchSubscription,
  };
}
