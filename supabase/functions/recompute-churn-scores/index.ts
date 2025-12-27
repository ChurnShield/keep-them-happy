import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration - this function should be called sparingly (e.g., by cron)
const RATE_LIMIT_WINDOW_MS = 300000; // 5 minute window
const MAX_REQUESTS_PER_WINDOW = 2; // 2 requests per 5 minutes (allows for retries)

// In-memory rate limiting (global for this function)
let lastRequestTime = 0;
let requestCount = 0;

function isGlobalRateLimited(): boolean {
  const now = Date.now();
  
  if (now > lastRequestTime + RATE_LIMIT_WINDOW_MS) {
    lastRequestTime = now;
    requestCount = 1;
    return false;
  }
  
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  requestCount++;
  return false;
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  if (isGlobalRateLimited()) {
    console.warn('Rate limited recompute-churn-scores request');
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': '300'
      },
    });
  }

  console.log('Starting scheduled churn score recomputation...');

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase: AnySupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users with active or trialing subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('stripe_subscriptions')
      .select('user_id')
      .in('status', ['active', 'trialing', 'past_due', 'unpaid']);

    if (subError) {
      console.error('Failed to fetch subscriptions:', subError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIds = [...new Set(subscriptions?.map(s => s.user_id) || [])];
    console.log(`Found ${userIds.length} users to recompute scores for`);

    let successCount = 0;
    let errorCount = 0;

    for (const userId of userIds) {
      try {
        await updateChurnRiskScore(supabase, userId);
        successCount++;
      } catch (err) {
        console.error(`Failed to update score for user ${userId}:`, err);
        errorCount++;
      }
    }

    console.log(`Recomputation complete: ${successCount} success, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      received: true, 
      processed: userIds.length,
      success: successCount,
      errors: errorCount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in recompute job:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Risk scoring function (same logic as webhook)
async function updateChurnRiskScore(
  supabase: AnySupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  let score = 0;
  const reasons: string[] = [];

  // Get recent churn events (last 7 days)
  const { data: recentEvents } = await supabase
    .from('churn_risk_events')
    .select('event_type, severity, occurred_at')
    .eq('user_id', userId)
    .gte('occurred_at', sevenDaysAgo.toISOString())
    .order('occurred_at', { ascending: false });

  // Count payment failures in last 7 days
  const paymentFailures = recentEvents?.filter((e: { event_type: string }) => e.event_type === 'invoice.payment_failed') || [];
  if (paymentFailures.length > 0) {
    score += 50;
    reasons.push('Payment failed in the last 7 days');
    
    if (paymentFailures.length >= 2) {
      score += 20;
      reasons.push('Multiple payment failures in the last 7 days');
    }
  }

  // Get current subscription status
  const { data: subscription } = await supabase
    .from('stripe_subscriptions')
    .select('status, cancel_at_period_end, current_period_end, trial_end')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscription) {
    // Check subscription status
    if (subscription.status === 'past_due') {
      score += 40;
      reasons.push('Subscription is past due');
    } else if (subscription.status === 'unpaid') {
      score += 40;
      reasons.push('Subscription is unpaid');
    }

    // Check cancel_at_period_end
    if (subscription.cancel_at_period_end) {
      score += 35;
      reasons.push('Cancellation scheduled at period end');
    }

    // Check trial ending soon
    if (subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      if (trialEnd > now && trialEnd <= fortyEightHoursFromNow) {
        score += 25;
        reasons.push('Trial ends within 48 hours');
      }
    }

    // Check renewal soon (for active/trialing subscriptions)
    if ((subscription.status === 'active' || subscription.status === 'trialing') && subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      if (periodEnd > now && periodEnd <= threeDaysFromNow) {
        score += 15;
        reasons.push('Renewal due within 3 days');
      }
    }
  }

  // Clamp score to 0-100
  score = Math.min(100, Math.max(0, score));

  // Limit to top 5 reasons
  const topReasons = reasons.slice(0, 5);

  // Upsert risk snapshot
  const { error } = await supabase
    .from('churn_risk_snapshot')
    .upsert({
      user_id: userId,
      score,
      top_reasons: topReasons,
      updated_at: now.toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Failed to update risk snapshot: ${error.message}`);
  }
}
