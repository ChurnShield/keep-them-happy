import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PlanConfig = {
  name: string;
  currency: string;
  unitAmount: number;
  mode: 'subscription' | 'payment';
};

const PLAN_CONFIG: Record<string, PlanConfig> = {
  starter: { name: 'Starter', currency: 'gbp', unitAmount: 4900, mode: 'subscription' },
  growth: { name: 'Growth', currency: 'gbp', unitAmount: 14900, mode: 'subscription' },
  scale: { name: 'Scale', currency: 'gbp', unitAmount: 34900, mode: 'subscription' },
  churnshield: { name: 'Starter', currency: 'gbp', unitAmount: 4900, mode: 'subscription' },
};

async function stripeRequest(endpoint: string, apiKey: string, method = 'GET', body?: Record<string, unknown>) {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const options: RequestInit = { method, headers };
  
  if (body && method !== 'GET') {
    options.body = new URLSearchParams(flattenObject(body)).toString();
  }

  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, options);
  const data = await res.json();
  
  if (!res.ok) {
    console.error('Stripe API error:', data);
    throw new Error(data.error?.message || 'Stripe API error');
  }
  
  return data;
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}[${key}]` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else if (value !== undefined && value !== null) {
      result[newKey] = String(value);
    }
  }
  
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = (Deno.env.get('STRIPE_SECRET_KEY') ?? '').trim();
    const APP_URL = Deno.env.get('APP_URL');

    if (!STRIPE_SECRET_KEY || (!STRIPE_SECRET_KEY.startsWith('sk_test_') && !STRIPE_SECRET_KEY.startsWith('sk_live_'))) {
      console.error('Invalid or missing STRIPE_SECRET_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { planId, email, successUrl, cancelUrl } = await req.json();

    if (!planId) {
      return new Response(JSON.stringify({ error: 'Plan ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedPlanId = String(planId).toLowerCase();
    const config = PLAN_CONFIG[normalizedPlanId];
    
    if (!config) {
      return new Response(JSON.stringify({ error: 'Invalid plan ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating checkout for plan:', normalizedPlanId);

    // Create product
    const product = await stripeRequest('/products', STRIPE_SECRET_KEY, 'POST', {
      name: `ChurnShield ${config.name}`,
      metadata: { plan_id: normalizedPlanId },
    });

    // Create price
    const priceParams: Record<string, unknown> = {
      product: product.id,
      currency: config.currency,
      unit_amount: config.unitAmount,
    };
    
    if (config.mode === 'subscription') {
      priceParams.recurring = { interval: 'month' };
    }

    const price = await stripeRequest('/prices', STRIPE_SECRET_KEY, 'POST', priceParams);

    const baseUrl = APP_URL || 'https://preview--churnshield-saas.lovable.app';

    // Create customer first (required for Stripe Accounts V2 testmode)
    const customerParams: Record<string, unknown> = {
      metadata: { plan_id: normalizedPlanId },
    };
    if (email) {
      customerParams.email = email;
    }
    const customer = await stripeRequest('/customers', STRIPE_SECRET_KEY, 'POST', customerParams);

    // Build checkout session params
    const sessionParams: Record<string, unknown> = {
      mode: config.mode,
      customer: customer.id,
      'payment_method_types[0]': 'card',
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': 1,
      success_url: successUrl || `${baseUrl}/success`,
      cancel_url: cancelUrl || `${baseUrl}/`,
      allow_promotion_codes: true,
    };

    if (config.mode === 'subscription') {
      sessionParams['subscription_data[trial_period_days]'] = 7;
    }

    const session = await stripeRequest('/checkout/sessions', STRIPE_SECRET_KEY, 'POST', sessionParams);

    console.log('Checkout session created:', session.id);
    
    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
