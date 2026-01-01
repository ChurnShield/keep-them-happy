import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface StripeAccount {
  id: string;
  user_id: string;
  stripe_account_id: string | null;
  connected: boolean;
  created_at: string;
  updated_at: string;
}

export function useStripeConnection() {
  const { user, loading: authLoading } = useAuth();
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStripeConnection = useCallback(async () => {
    if (!user) {
      setStripeAccount(null);
      setIsConnected(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stripe_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching Stripe connection:', fetchError);
        setError('Failed to fetch Stripe connection status');
        setIsConnected(false);
        return;
      }

      if (data) {
        setStripeAccount(data);
        setIsConnected(data.connected === true);
      } else {
        setStripeAccount(null);
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Stripe connection fetch error:', err);
      setError('An unexpected error occurred');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchStripeConnection();
    }
  }, [authLoading, fetchStripeConnection]);

  const startStripeConnect = async (): Promise<{ url?: string; error?: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { error: 'You must be signed in to connect Stripe' };
      }

      const { data, error: fnError } = await supabase.functions.invoke('stripe-connect-start', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) {
        console.error('Stripe connect start error:', fnError);
        return { error: 'Failed to start Stripe connection. Please try again.' };
      }

      if (data?.error) {
        return { error: data.error };
      }

      if (data?.url) {
        return { url: data.url };
      }

      return { error: 'Invalid response from server' };
    } catch (err) {
      console.error('Stripe connect error:', err);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  return {
    stripeAccount,
    isConnected,
    loading: loading || authLoading,
    error,
    startStripeConnect,
    refetch: fetchStripeConnection,
  };
}
