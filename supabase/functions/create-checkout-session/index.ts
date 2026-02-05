import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * DEPRECATED: This edge function previously handled subscription checkout sessions.
 * 
 * ChurnShield now operates on a performance-based pricing model:
 * - No monthly subscription fees
 * - No tiered plans (Starter/Growth/Scale)
 * - No trials
 * - Clients pay 20% of saved revenue only when we prevent churn
 * - Maximum fee capped at $500/month per client
 * 
 * This function is kept as a stub to prevent breaking any existing integrations.
 * It will return an error indicating the new pricing model.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Return error indicating subscription checkout is no longer available
  console.log('DEPRECATED: Subscription checkout attempted');
  return new Response(
    JSON.stringify({ 
      error: 'Subscription checkout is no longer available. ChurnShield uses performance-based pricing - you only pay when we save customers for you.',
      redirect: '/connect-stripe'
    }), 
    {
      status: 410, // Gone
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
