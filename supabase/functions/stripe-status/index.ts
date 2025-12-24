import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cookie',
  'Access-Control-Allow-Credentials': 'true',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get session ID from cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=');
        return [key, val.join('=')];
      })
    );

    const sessionId = cookies['stripe_session'];

    if (!sessionId) {
      console.log('No stripe_session cookie found');
      return new Response(JSON.stringify({ 
        connected: false,
        message: 'No session found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if session has a connected Stripe account
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data, error } = await supabase
      .from('stripe_connections')
      .select('stripe_user_id, livemode, scope, created_at')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        connected: false,
        error: 'Database error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!data) {
      console.log('No connection found for session:', sessionId);
      return new Response(JSON.stringify({ 
        connected: false,
        message: 'No connection found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Connection found:', data.stripe_user_id);
    return new Response(JSON.stringify({ 
      connected: true,
      stripe_user_id: data.stripe_user_id,
      livemode: data.livemode,
      scope: data.scope,
      connected_at: data.created_at,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in stripe-status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      connected: false,
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
