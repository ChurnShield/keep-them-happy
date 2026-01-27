import { ReactNode } from 'react';

interface SubscriptionGateProps {
  children: ReactNode;
  /** Feature name shown in the message (kept for future use) */
  feature?: string;
}

/**
 * SubscriptionGate - Passthrough component
 * 
 * Previously gated features behind a subscription check.
 * Now allows all authenticated users through since ChurnShield
 * uses a performance-based pricing model (20% of saved revenue).
 * 
 * Kept as a wrapper for potential future premium tier gating.
 */
export function SubscriptionGate({ children }: SubscriptionGateProps) {
  return <>{children}</>;
}
