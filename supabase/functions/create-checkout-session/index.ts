import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ChurnShield subscription price (TEST MODE)
const CHURNSHIELD_PRICE_ID = 'price_1SiDB0I94SrMi3IbveIokX3Y';

const PRICE_CONFIG: Record<string, { priceId: string; mode: 'subscription' | 'payment' }> = {
  churnshield: { priceId: CHURNSHIELD_PRICE_ID, mode: 'subscription' },
  starter: { priceId: CHURNSHIELD_PRICE_ID, mode: 'subscription' },
  growth: { priceId: CHURNSHIELD_PRICE_ID, mode: 'subscription' },
  scale: { priceId: CHURNSHIELD_PRICE_ID, mode: 'subscription' },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const APP_URL = Deno.env.get('APP_URL');

    if (!STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!STRIPE_SECRET_KEY.startsWith('sk_')) {
      console.error('STRIPE_SECRET_KEY should start with sk_test_ or sk_live_');
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

    const planConfig = PRICE_CONFIG[planId.toLowerCase()];
    if (!planConfig) {
      return new Response(JSON.stringify({ error: 'Invalid plan ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = APP_URL || 'http://localhost:5173';

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: planConfig.mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${baseUrl}/success`,
      cancel_url: cancelUrl || `${baseUrl}/pricing`,
      allow_promotion_codes: true,
    };

    // Add customer email if provided
    if (email) {
      sessionParams.customer_email = email;
    }

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
