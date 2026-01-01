import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Structured logging helper
function structuredLog(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    function: 'stripe-connect-start',
    message,
    ...context,
  };
  console[level](JSON.stringify(logEntry));
}

// Generate a secure random state string
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required environment variables
    const STRIPE_CLIENT_ID = Deno.env.get('STRIPE_CLIENT_ID');
    const APP_URL = Deno.env.get('APP_URL');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_CLIENT_ID) {
      structuredLog('error', 'STRIPE_CLIENT_ID not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe not configured. Please contact support.', 
          code: 'STRIPE_NOT_CONFIGURED' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!APP_URL) {
      structuredLog('error', 'APP_URL not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Application URL not configured. Please contact support.', 
          code: 'APP_URL_NOT_CONFIGURED' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      structuredLog('warn', 'Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for database operations
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create user client to verify the JWT
    const supabaseUser = createClient(
      SUPABASE_URL!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      structuredLog('warn', 'Invalid or expired token', { error: userError?.message });
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session. Please sign in again.', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    structuredLog('info', 'connect_start', { user_id: user.id });

    // Generate a unique state for CSRF protection
    const state = generateState();
    
    // Store the state in the database with expiration
    const { error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state: state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (stateError) {
      structuredLog('error', 'Failed to store OAuth state', { 
        user_id: user.id, 
        error: stateError.message 
      });
      return new Response(
        JSON.stringify({ error: 'Failed to initialize connection. Please try again.', code: 'STATE_STORAGE_FAILED' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the Stripe Connect OAuth URL
    const redirectUri = `${SUPABASE_URL}/functions/v1/stripe-connect-callback`;
    
    const stripeOAuthUrl = new URL('https://connect.stripe.com/oauth/authorize');
    stripeOAuthUrl.searchParams.set('response_type', 'code');
    stripeOAuthUrl.searchParams.set('client_id', STRIPE_CLIENT_ID);
    stripeOAuthUrl.searchParams.set('scope', 'read_write');
    stripeOAuthUrl.searchParams.set('redirect_uri', redirectUri);
    stripeOAuthUrl.searchParams.set('state', state);

    structuredLog('info', 'connect_redirect_generated', { 
      user_id: user.id,
      redirect_uri: redirectUri
    });

    return new Response(
      JSON.stringify({ 
        url: stripeOAuthUrl.toString(),
        message: 'Redirect to Stripe to complete authorization'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    structuredLog('error', 'Unexpected error in stripe-connect-start', { error: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.', 
        code: 'INTERNAL_ERROR' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
