import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PlanConfig = {
  name: string;
  currency: 'gbp' | 'usd' | 'eur';
  unitAmount: number; // in minor units (e.g. pence)
  lookupKey: string;
  mode: 'subscription' | 'payment';
};

// Server-controlled pricing (keeps clients from passing arbitrary Stripe price IDs)
const PLAN_CONFIG: Record<string, PlanConfig> = {
  starter: {
    name: 'Starter',
    currency: 'gbp',
    unitAmount: 4900,
    lookupKey: 'churnshield_starter_monthly',
    mode: 'subscription',
  },
  growth: {
    name: 'Growth',
    currency: 'gbp',
    unitAmount: 14900,
    lookupKey: 'churnshield_growth_monthly',
    mode: 'subscription',
  },
  scale: {
    name: 'Scale',
    currency: 'gbp',
    unitAmount: 34900,
    lookupKey: 'churnshield_scale_monthly',
    mode: 'subscription',
  },
  // backwards-compat alias
  churnshield: {
    name: 'Starter',
    currency: 'gbp',
    unitAmount: 4900,
    lookupKey: 'churnshield_starter_monthly',
    mode: 'subscription',
  },
};

async function getOrCreatePriceId(stripe: Stripe, planId: string, config: PlanConfig) {
  const existing = await stripe.prices.list({
    lookup_keys: [config.lookupKey],
    active: true,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  console.log('No price found for lookup_key, creating one:', config.lookupKey);
  const created = await stripe.prices.create({
    currency: config.currency,
    unit_amount: config.unitAmount,
    recurring: config.mode === 'subscription' ? { interval: 'month' } : undefined,
    lookup_key: config.lookupKey,
    nickname: `ChurnShield ${config.name}`,
    product_data: {
      name: `ChurnShield ${config.name}`,
      metadata: { plan_id: planId },
    },
  });

  return created.id;
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawStripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const STRIPE_SECRET_KEY = rawStripeKey.trim();
    const APP_URL = Deno.env.get('APP_URL');

    if (!STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Some secret managers can include trailing newlines/spaces; we trim above.
    if (!STRIPE_SECRET_KEY.startsWith('sk_test_') && !STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      console.error('Invalid STRIPE_SECRET_KEY prefix', {
        prefix: STRIPE_SECRET_KEY.slice(0, 8),
        length: STRIPE_SECRET_KEY.length,
      });
      return new Response(JSON.stringify({ error: 'Invalid Stripe configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { planId, email, successUrl, cancelUrl } = await req.json();

    if (!planId) {
      return new Response(JSON.stringify({ error: 'Plan ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedPlanId = String(planId).toLowerCase();
    const planConfig = PLAN_CONFIG[normalizedPlanId];
    if (!planConfig) {
      return new Response(JSON.stringify({ error: 'Invalid plan ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const priceId = await getOrCreatePriceId(stripe, normalizedPlanId, planConfig);

    const baseUrl = APP_URL || 'http://localhost:5173';

    // Create a customer first (required for some Stripe Accounts V2 testmode setups)
    const customer = await stripe.customers.create({
      ...(email ? { email } : {}),
      metadata: {
        plan_id: normalizedPlanId,
      },
    });

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: planConfig.mode,
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${baseUrl}/success`,
      cancel_url: cancelUrl || `${baseUrl}/pricing`,
      allow_promotion_codes: true,
    };

    // For subscriptions, add 7-day free trial (no charge until trial ends)
    if (planConfig.mode === 'subscription') {
      sessionParams.subscription_data = {
        trial_period_days: 7,
      };
    }

    console.log('Creating checkout session for plan:', planId);
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Checkout session created:', session.id);
    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
