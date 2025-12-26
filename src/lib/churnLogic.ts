/**
 * ChurnShield Phase 1 - Core Churn Logic
 * Deterministic classification, recommendations, and priority ordering
 */

// Fixed list of churn reasons - no additions allowed
export type ChurnReason = 
  | 'card_expired'
  | 'insufficient_funds'
  | 'bank_decline'
  | 'no_retry_attempted'
  | 'unknown_failure';

// Human-readable labels for each reason
export const CHURN_REASON_LABELS: Record<ChurnReason, string> = {
  card_expired: 'Card Expired',
  insufficient_funds: 'Insufficient Funds',
  bank_decline: 'Bank Decline',
  no_retry_attempted: 'No Retry Attempted',
  unknown_failure: 'Unknown Failure',
};

// Single recommended action for each reason (display only, no automation)
export const CHURN_RECOMMENDATIONS: Record<ChurnReason, string> = {
  card_expired: 'Ask customer to update payment method',
  insufficient_funds: 'Retry payment in 24 hours',
  bank_decline: 'Send a friendly recovery message',
  no_retry_attempted: 'Enable retry immediately',
  unknown_failure: 'Manual follow-up required',
};

export interface RecoveryCaseWithPriority {
  id: string;
  owner_user_id: string;
  customer_reference: string;
  invoice_reference: string | null;
  amount_at_risk: number;
  currency: string;
  status: 'open' | 'recovered' | 'expired';
  churn_reason: ChurnReason;
  opened_at: string;
  deadline_at: string;
  first_action_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Calculate priority score for ordering
 * Priority = revenue_at_risk × time_remaining (in hours)
 * Lower score = higher urgency (less time, same revenue)
 * We invert for sorting so highest urgency comes first
 */
export function calculatePriorityScore(
  amountAtRisk: number,
  deadlineAt: string
): number {
  const now = new Date();
  const deadline = new Date(deadlineAt);
  const msRemaining = deadline.getTime() - now.getTime();
  
  // If expired, return 0 (lowest priority)
  if (msRemaining <= 0) {
    return 0;
  }
  
  const hoursRemaining = msRemaining / (1000 * 60 * 60);
  
  // Priority formula: revenue / time_remaining
  // Higher revenue + less time = higher priority
  // We use this so that sorting descending gives highest urgency first
  return amountAtRisk / hoursRemaining;
}

/**
 * Sort cases by priority (highest urgency first)
 * Uses: revenue_at_risk × time_remaining formula
 * Score is NOT displayed in UI, only used for ordering
 */
export function sortByPriority<T extends { amount_at_risk: number; deadline_at: string; status: string }>(
  cases: T[]
): T[] {
  return [...cases].sort((a, b) => {
    // Open cases always come before resolved cases
    if (a.status === 'open' && b.status !== 'open') return -1;
    if (a.status !== 'open' && b.status === 'open') return 1;
    
    // Both open: sort by priority score (descending - higher score = more urgent)
    const priorityA = calculatePriorityScore(a.amount_at_risk, a.deadline_at);
    const priorityB = calculatePriorityScore(b.amount_at_risk, b.deadline_at);
    
    return priorityB - priorityA;
  });
}

/**
 * Get the human-readable label for a churn reason
 */
export function getReasonLabel(reason: ChurnReason): string {
  return CHURN_REASON_LABELS[reason] || 'Unknown Failure';
}

/**
 * Get the single recommended action for a churn reason
 */
export function getRecommendation(reason: ChurnReason): string {
  return CHURN_RECOMMENDATIONS[reason] || 'Manual follow-up required';
}
