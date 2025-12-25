import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ChurnRiskSnapshot {
  user_id: string;
  score: number;
  top_reasons: string[] | unknown;
  updated_at: string;
}

interface ChurnRiskEvent {
  id: string;
  user_id: string;
  event_type: string;
  severity: number;
  occurred_at: string;
  stripe_object_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string | null;
  created_at: string;
}

interface StripeSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  trial_end: string | null;
  created_at: string;
}

interface DashboardOverview {
  totalCustomers: number;
  atRiskCount: number;
  topReasonCounts: Record<string, number>;
}

interface AtRiskCustomer {
  userId: string;
  email: string;
  score: number;
  topReasons: string[];
  lastEventTime: string | null;
}

interface CustomerDetail {
  userId: string;
  email: string;
  subscription: StripeSubscription | null;
  riskSnapshot: ChurnRiskSnapshot | null;
  recentEvents: ChurnRiskEvent[];
  recommendedAction: string;
}

// Hook for dashboard overview
export function useDashboardOverview() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['churn-dashboard-overview', user?.id],
    queryFn: async (): Promise<DashboardOverview> => {
      // Get total customers (stripe_customers linked to this user's data)
      // In Phase 1, we're showing the current user's own data
      const { data: customers, error: custError } = await supabase
        .from('stripe_customers')
        .select('user_id');

      if (custError) throw new Error(`Failed to fetch customers: ${custError.message}`);

      const totalCustomers = customers?.length || 0;

      // Get at-risk count (score >= 50)
      const { data: riskSnapshots, error: riskError } = await supabase
        .from('churn_risk_snapshot')
        .select('score');

      if (riskError) throw new Error(`Failed to fetch risk snapshots: ${riskError.message}`);

      const atRiskCount = riskSnapshots?.filter(s => s.score >= 50).length || 0;

      // Get top reason counts from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentEvents, error: eventsError } = await supabase
        .from('churn_risk_events')
        .select('event_type')
        .gte('occurred_at', thirtyDaysAgo.toISOString());

      if (eventsError) throw new Error(`Failed to fetch events: ${eventsError.message}`);

      const topReasonCounts: Record<string, number> = {};
      recentEvents?.forEach(event => {
        topReasonCounts[event.event_type] = (topReasonCounts[event.event_type] || 0) + 1;
      });

      return {
        totalCustomers,
        atRiskCount,
        topReasonCounts,
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
}

// Hook for at-risk customers list
export function useAtRiskCustomers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['at-risk-customers', user?.id],
    queryFn: async (): Promise<AtRiskCustomer[]> => {
      // Get all risk snapshots with score >= 50
      const { data: riskSnapshots, error: riskError } = await supabase
        .from('churn_risk_snapshot')
        .select('user_id, score, top_reasons, updated_at')
        .gte('score', 50)
        .order('score', { ascending: false });

      if (riskError) throw new Error(`Failed to fetch risk snapshots: ${riskError.message}`);

      if (!riskSnapshots || riskSnapshots.length === 0) {
        return [];
      }

      // Get customer emails
      const userIds = riskSnapshots.map(s => s.user_id);
      const { data: customers } = await supabase
        .from('stripe_customers')
        .select('user_id, email')
        .in('user_id', userIds);

      const emailMap = new Map(customers?.map(c => [c.user_id, c.email]) || []);

      // Get latest event time for each user
      const { data: events } = await supabase
        .from('churn_risk_events')
        .select('user_id, occurred_at')
        .in('user_id', userIds)
        .order('occurred_at', { ascending: false });

      const lastEventMap = new Map<string, string>();
      events?.forEach(e => {
        if (!lastEventMap.has(e.user_id)) {
          lastEventMap.set(e.user_id, e.occurred_at);
        }
      });

      return riskSnapshots.map(snapshot => ({
        userId: snapshot.user_id,
        email: emailMap.get(snapshot.user_id) || 'Unknown',
        score: snapshot.score,
        topReasons: (snapshot.top_reasons as string[]) || [],
        lastEventTime: lastEventMap.get(snapshot.user_id) || null,
      }));
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

// Hook for customer detail
export function useCustomerDetail(userId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer-detail', userId],
    queryFn: async (): Promise<CustomerDetail | null> => {
      if (!userId) return null;

      // Get customer email
      const { data: customer } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Get subscription
      const { data: subscription } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get risk snapshot
      const { data: riskSnapshot } = await supabase
        .from('churn_risk_snapshot')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Get recent events (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentEvents } = await supabase
        .from('churn_risk_events')
        .select('*')
        .eq('user_id', userId)
        .gte('occurred_at', thirtyDaysAgo.toISOString())
        .order('occurred_at', { ascending: false })
        .limit(20);

      // Determine recommended action based on events
      let recommendedAction = 'No immediate action required';
      
      if (recentEvents && recentEvents.length > 0) {
        const latestEvent = recentEvents[0];
        switch (latestEvent.event_type) {
          case 'invoice.payment_failed':
            recommendedAction = 'Ask customer to update payment method or resend invoice';
            break;
          case 'cancel_at_period_end':
            recommendedAction = 'Offer support or discount to retain customer';
            break;
          case 'trial_ending_soon':
            recommendedAction = 'Send value recap and onboarding help';
            break;
          case 'subscription_past_due':
          case 'subscription_unpaid':
            recommendedAction = 'Contact customer about payment issue immediately';
            break;
          case 'subscription_canceled':
            recommendedAction = 'Send win-back campaign or exit survey';
            break;
          default:
            recommendedAction = 'Monitor customer activity';
        }
      }

      return {
        userId,
        email: customer?.email || 'Unknown',
        subscription: subscription || null,
        riskSnapshot: riskSnapshot || null,
        recentEvents: (recentEvents || []) as ChurnRiskEvent[],
        recommendedAction,
      };
    },
    enabled: !!user && !!userId,
    staleTime: 30000,
  });
}

// Helper to format event type for display
export function formatEventType(eventType: string): string {
  const map: Record<string, string> = {
    'invoice.payment_failed': 'Payment Failed',
    'invoice.payment_action_required': 'Payment Action Required',
    'cancel_at_period_end': 'Cancellation Scheduled',
    'subscription_past_due': 'Subscription Past Due',
    'subscription_unpaid': 'Subscription Unpaid',
    'subscription_canceled': 'Subscription Canceled',
    'trial_ending_soon': 'Trial Ending Soon',
  };
  return map[eventType] || eventType;
}

// Helper to get severity color
export function getSeverityColor(severity: number): string {
  if (severity >= 5) return 'text-red-500';
  if (severity >= 4) return 'text-orange-500';
  if (severity >= 3) return 'text-yellow-500';
  return 'text-blue-500';
}

// Helper to get score color
export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-red-500';
  if (score >= 50) return 'text-orange-500';
  if (score >= 25) return 'text-yellow-500';
  return 'text-green-500';
}
