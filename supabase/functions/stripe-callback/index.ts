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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    const rawStripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const STRIPE_SECRET_KEY = (rawStripeSecret || '').trim();
    const STRIPE_CLIENT_ID = (Deno.env.get('STRIPE_CLIENT_ID') || '').trim();
    const APP_URL = Deno.env.get('APP_URL');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_SECRET_KEY || !STRIPE_CLIENT_ID || !APP_URL) {
      console.error('Missing STRIPE_SECRET_KEY, STRIPE_CLIENT_ID, or APP_URL');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${APP_URL}/verify-stripe?error=config`,
        },
      });
    }

    // Basic sanity checks for common Stripe key issues (do not log the full key)
    if (!STRIPE_SECRET_KEY.startsWith('sk_')) {
      console.error('STRIPE_SECRET_KEY does not look like a standard secret key (expected sk_ prefix).');
    }

    console.log('Stripe OAuth callback config:', {
      clientIdPrefix: STRIPE_CLIENT_ID.slice(0, 6),
      keyPrefix: STRIPE_SECRET_KEY.slice(0, 6),
      keyLength: STRIPE_SECRET_KEY.length,
    });

    // Handle OAuth errors from Stripe
    if (error) {
      console.error('Stripe OAuth error:', error, errorDescription);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${APP_URL}/verify-stripe?error=${encodeURIComponent(error)}`,
        },
      });
    }

    if (!code || !state) {
      console.error('Missing code or state');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${APP_URL}/verify-stripe?error=invalid_request`,
        },
      });
    }

    // Parse state to get session ID
    const stateParts = state.split(':');
    if (stateParts.length !== 2) {
      console.error('Invalid state format');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${APP_URL}/verify-stripe?error=invalid_state`,
        },
      });
    }

    const sessionId = stateParts[1];

    // Validate session cookie matches
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=');
        return [key, val.join('=')];
      })
    );

    if (cookies['stripe_oauth_session'] !== sessionId) {
      console.error('Session mismatch - possible CSRF attack');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${APP_URL}/verify-stripe?error=session_mismatch`,
        },
      });
    }

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    const tokenResponse = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_secret: STRIPE_SECRET_KEY,
        client_id: STRIPE_CLIENT_ID,
      }),
    });

    const tokenText = await tokenResponse.text();
    let tokenData: any = {};
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      console.error('Token exchange returned non-JSON response:', tokenText.slice(0, 500));
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${APP_URL}/verify-stripe?error=server_error`,
        },
      });
    }

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error, tokenData.error_description);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${APP_URL}/verify-stripe?error=${encodeURIComponent(tokenData.error)}`,
        },
      });
    }

    console.log('Token exchange successful, storing connection...');

    // Store connection in database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { error: insertError } = await supabase
      .from('stripe_connections')
      .upsert({
        session_id: sessionId,
        stripe_user_id: tokenData.stripe_user_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        livemode: tokenData.livemode || false,
        scope: tokenData.scope || 'read_only',
      }, {
        onConflict: 'session_id',
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${APP_URL}/verify-stripe?error=db_error`,
        },
      });
    }

    console.log('Connection stored successfully, redirecting to results...');

    // Redirect to verification results with updated session cookie
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${APP_URL}/verification-results`,
        'Set-Cookie': `stripe_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000`,
      },
    });
  } catch (error) {
    console.error('Error in stripe-callback:', error);
    const APP_URL = Deno.env.get('APP_URL') || '';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${APP_URL}/verify-stripe?error=server_error`,
      },
    });
  }
});
