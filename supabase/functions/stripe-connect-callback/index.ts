import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

// Structured logging helper
function structuredLog(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    function: 'stripe-connect-callback',
    message,
    ...context,
  };
  console[level](JSON.stringify(logEntry));
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Get environment variables
    const APP_URL = Deno.env.get('APP_URL');
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    structuredLog('info', 'connect_callback_received', { 
      has_code: !!code, 
      has_state: !!state,
      has_error: !!error 
    });

    // Handle Stripe OAuth errors (user denied access, etc.)
    if (error) {
      structuredLog('warn', 'OAuth error from Stripe', { error, errorDescription });
      const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
      redirectUrl.searchParams.set('error', 'access_denied');
      redirectUrl.searchParams.set('message', errorDescription || 'You denied access to connect your Stripe account.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Validate required params
    if (!code || !state) {
      structuredLog('error', 'Missing code or state parameter');
      const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
      redirectUrl.searchParams.set('error', 'invalid_request');
      redirectUrl.searchParams.set('message', 'Invalid OAuth callback. Please try again.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Validate environment variables
    if (!STRIPE_SECRET_KEY) {
      structuredLog('error', 'STRIPE_SECRET_KEY not configured');
      const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
      redirectUrl.searchParams.set('error', 'configuration_error');
      redirectUrl.searchParams.set('message', 'Stripe is not properly configured. Please contact support.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate the state and get the user_id
    const { data: stateRecord, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('user_id, expires_at')
      .eq('state', state)
      .single();

    if (stateError || !stateRecord) {
      structuredLog('warn', 'Invalid or missing state', { state: state.substring(0, 10) + '...' });
      const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
      redirectUrl.searchParams.set('error', 'invalid_state');
      redirectUrl.searchParams.set('message', 'Security check failed. Please try connecting again.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Check if state has expired
    if (new Date(stateRecord.expires_at) < new Date()) {
      structuredLog('warn', 'State has expired', { user_id: stateRecord.user_id });
      // Clean up expired state
      await supabaseAdmin.from('oauth_states').delete().eq('state', state);
      
      const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
      redirectUrl.searchParams.set('error', 'state_expired');
      redirectUrl.searchParams.set('message', 'Session expired. Please try connecting again.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    const userId = stateRecord.user_id;
    structuredLog('info', 'State validated successfully', { user_id: userId });

    // Delete the used state to prevent replay attacks
    await supabaseAdmin.from('oauth_states').delete().eq('state', state);

    // Exchange the authorization code for access token
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
    });

    let tokenResponse;
    try {
      tokenResponse = await stripe.oauth.token({
        grant_type: 'authorization_code',
        code: code,
      });
      
      structuredLog('info', 'connect_token_exchange_success', { 
        user_id: userId,
        stripe_user_id: tokenResponse.stripe_user_id,
        livemode: tokenResponse.livemode 
      });
    } catch (stripeError) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error';
      structuredLog('error', 'connect_token_exchange_failure', { 
        user_id: userId, 
        error: errorMessage 
      });
      
      const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
      redirectUrl.searchParams.set('error', 'token_exchange_failed');
      redirectUrl.searchParams.set('message', 'Failed to connect with Stripe. Please try again.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Store the connection in stripe_connections table
    const { error: connectionError } = await supabaseAdmin
      .from('stripe_connections')
      .upsert({
        session_id: userId, // Using user_id as session_id for simplicity
        stripe_user_id: tokenResponse.stripe_user_id!,
        access_token: tokenResponse.access_token!,
        refresh_token: tokenResponse.refresh_token || null,
        livemode: tokenResponse.livemode || false,
        scope: tokenResponse.scope || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id'
      });

    if (connectionError) {
      structuredLog('error', 'connect_db_write_failure', { 
        user_id: userId, 
        table: 'stripe_connections',
        error: connectionError.message 
      });
      
      const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
      redirectUrl.searchParams.set('error', 'database_error');
      redirectUrl.searchParams.set('message', 'Could not save connection. Please try again.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Update or create stripe_accounts record
    const { error: accountError } = await supabaseAdmin
      .from('stripe_accounts')
      .upsert({
        user_id: userId,
        stripe_account_id: tokenResponse.stripe_user_id!,
        connected: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (accountError) {
      structuredLog('error', 'connect_db_write_failure', { 
        user_id: userId, 
        table: 'stripe_accounts',
        error: accountError.message 
      });
      
      const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
      redirectUrl.searchParams.set('error', 'database_error');
      redirectUrl.searchParams.set('message', 'Could not save connection. Please try again.');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    structuredLog('info', 'connect_db_write_success', { 
      user_id: userId,
      stripe_account_id: tokenResponse.stripe_user_id 
    });

    // Redirect to success page
    const successUrl = new URL(`${APP_URL}/connect-stripe/callback`);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('account_id', tokenResponse.stripe_user_id!);
    
    return Response.redirect(successUrl.toString(), 302);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    structuredLog('error', 'Unexpected error in stripe-connect-callback', { error: errorMessage });
    
    const APP_URL = Deno.env.get('APP_URL') || '';
    const redirectUrl = new URL(`${APP_URL}/connect-stripe/callback`);
    redirectUrl.searchParams.set('error', 'internal_error');
    redirectUrl.searchParams.set('message', 'An unexpected error occurred. Please try again.');
    return Response.redirect(redirectUrl.toString(), 302);
  }
});
