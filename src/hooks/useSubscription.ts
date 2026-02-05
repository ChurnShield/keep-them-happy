/**
 * DEPRECATED: useSubscription hook
 * 
 * This hook previously checked for active subscriptions before allowing feature access.
 * 
 * ChurnShield now operates on a performance-based pricing model:
 * - No monthly subscription fees
 * - No tiered plans
 * - No trials
 * - Clients pay 20% of saved revenue only when we prevent churn
 * 
 * This hook now returns a passthrough that grants all authenticated users full access.
 * The actual gating is based on Stripe Connect status, not subscription status.
 */

export function useSubscription() {
  // Performance-based pricing: all authenticated users have full access
  // No subscription checks needed - billing is based on saved revenue only
  return {
    subscription: null,
    status: 'active' as const,
    loading: false,
    error: null,
    hasActiveSubscription: true, // Always true - no subscription gating
    canConnectStripe: true, // Always true - any user can connect Stripe
    isTrialing: false, // No trials in performance-based model
    trialDaysRemaining: null,
    refetch: () => Promise.resolve(),
  };
}
