import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_CLIENT_ID = Deno.env.get('STRIPE_CLIENT_ID');
    const APP_URL = Deno.env.get('APP_URL');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_CLIENT_ID || !APP_URL) {
      console.error('Missing STRIPE_CLIENT_ID or APP_URL');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate cryptographically random state for CSRF protection
    const stateArray = new Uint8Array(32);
    crypto.getRandomValues(stateArray);
    const state = Array.from(stateArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate a session ID for this OAuth flow
    const sessionIdArray = new Uint8Array(16);
    crypto.getRandomValues(sessionIdArray);
    const sessionId = Array.from(sessionIdArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Store state temporarily in database for validation
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Create a temporary state record (we'll use stripe_connections table with a placeholder)
    // For now, we'll encode the session_id in the state itself
    const statePayload = `${state}:${sessionId}`;

    // Build Stripe OAuth URL with read_only scope
    // Use the Supabase edge function URL for callback
    const redirectUri = `${SUPABASE_URL}/functions/v1/stripe-callback`;
    const stripeOAuthUrl = new URL('https://connect.stripe.com/oauth/authorize');
    stripeOAuthUrl.searchParams.set('response_type', 'code');
    stripeOAuthUrl.searchParams.set('client_id', STRIPE_CLIENT_ID);
    stripeOAuthUrl.searchParams.set('scope', 'read_only');
    stripeOAuthUrl.searchParams.set('state', statePayload);
    stripeOAuthUrl.searchParams.set('redirect_uri', redirectUri);

    console.log('Redirecting to Stripe OAuth:', stripeOAuthUrl.toString());

    // Return redirect response with session cookie
    return new Response(null, {
      status: 302,
      headers: {
        'Location': stripeOAuthUrl.toString(),
        'Set-Cookie': `stripe_oauth_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error in stripe-connect:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
