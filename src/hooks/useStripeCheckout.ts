import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CheckoutOptions {
  planId: string;
  email?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  popupBlocked?: boolean;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [showFallbackDialog, setShowFallbackDialog] = useState(false);

  const createCheckoutSession = useCallback(async (options: CheckoutOptions): Promise<CheckoutResult> => {
    setIsLoading(true);
    setFallbackUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: options,
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      const checkoutUrl = data.url;

      // Try to open in new tab first (works best across all contexts)
      const newWindow = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        // Popup opened successfully
        toast({
          title: 'Checkout opened',
          description: 'Complete your purchase in the new tab.',
        });
        return { success: true, url: checkoutUrl };
      }

      // Popup was blocked - show fallback dialog
      console.log('Popup blocked, showing fallback dialog');
      setFallbackUrl(checkoutUrl);
      setShowFallbackDialog(true);
      
      return { success: false, url: checkoutUrl, popupBlocked: true };

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Error',
        description: error instanceof Error ? error.message : 'Failed to start checkout',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeFallbackDialog = useCallback(() => {
    setShowFallbackDialog(false);
    setFallbackUrl(null);
  }, []);

  return {
    createCheckoutSession,
    isLoading,
    fallbackUrl,
    showFallbackDialog,
    closeFallbackDialog,
  };
}
