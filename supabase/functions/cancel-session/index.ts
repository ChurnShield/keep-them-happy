import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function structuredLog(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    function: 'cancel-session',
    message,
    ...context,
  };
  console[level](JSON.stringify(logEntry));
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    structuredLog('error', 'Missing Supabase configuration');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // POST /cancel-session/create - Create a new cancel session (requires auth)
    if (req.method === 'POST' && action === 'create') {
      return await handleCreateSession(req, supabaseAdmin);
    }

    // GET /cancel-session/:token - Get session details (public)
    if (req.method === 'GET' && action !== 'create') {
      const token = action;
      return await handleGetSession(token, supabaseAdmin);
    }

    // POST /cancel-session/:token/survey - Submit survey response
    if (req.method === 'POST' && pathParts.length >= 2) {
      const token = pathParts[pathParts.length - 2];
      const subAction = pathParts[pathParts.length - 1];
      
      if (subAction === 'survey') {
        return await handleSubmitSurvey(req, token, supabaseAdmin);
      }
      
      if (subAction === 'offer') {
        return await handleOfferResponse(req, token, supabaseAdmin);
      }
      
      if (subAction === 'complete') {
        return await handleComplete(req, token, supabaseAdmin);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    structuredLog('error', 'Unexpected error', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Create a new cancel session - requires business auth
async function handleCreateSession(
  req: Request,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify the business user
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get profile_id for this user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    structuredLog('error', 'Profile not found', { user_id: user.id });
    return new Response(
      JSON.stringify({ error: 'Profile not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const { customer_id, subscription_id } = body;

  const sessionToken = generateSessionToken();

  const { data: session, error: sessionError } = await supabase
    .from('cancel_sessions')
    .insert({
      profile_id: profile.id,
      customer_id: customer_id || null,
      subscription_id: subscription_id || null,
      session_token: sessionToken,
      status: 'started',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (sessionError) {
    structuredLog('error', 'Failed to create session', { error: sessionError.message });
    return new Response(
      JSON.stringify({ error: 'Failed to create session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  structuredLog('info', 'Session created', { session_id: session.id, token: sessionToken });

  // Get the app URL for the cancel link
  const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';
  const cancelUrl = `${APP_URL}/cancel/${sessionToken}`;

  return new Response(
    JSON.stringify({ 
      session_token: sessionToken,
      cancel_url: cancelUrl,
      session_id: session.id
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get session details with config - public endpoint
async function handleGetSession(
  token: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  // Get the session
  const { data: session, error: sessionError } = await supabase
    .from('cancel_sessions')
    .select('*, profile_id')
    .eq('session_token', token)
    .single();

  if (sessionError || !session) {
    structuredLog('warn', 'Session not found', { token });
    return new Response(
      JSON.stringify({ error: 'Session not found or expired' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if session is already completed
  if (session.status === 'saved' || session.status === 'cancelled') {
    return new Response(
      JSON.stringify({ error: 'Session already completed', status: session.status }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get the cancel flow config for this business
  const { data: config, error: configError } = await supabase
    .from('cancel_flow_config')
    .select('*')
    .eq('profile_id', session.profile_id)
    .single();

  if (configError) {
    structuredLog('error', 'Config not found', { profile_id: session.profile_id });
    return new Response(
      JSON.stringify({ error: 'Cancel flow not configured' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Return session with config (filtered for public consumption)
  return new Response(
    JSON.stringify({
      session: {
        id: session.id,
        status: session.status,
        exit_reason: session.exit_reason,
        offer_type_presented: session.offer_type_presented,
        offer_accepted: session.offer_accepted,
      },
      config: {
        survey_options: config.survey_options,
        offer_settings: config.offer_settings,
        branding: config.branding,
        widget_settings: config.widget_settings,
        is_active: config.is_active,
      }
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Submit survey response
async function handleSubmitSurvey(
  req: Request,
  token: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const body = await req.json();
  const { exit_reason, custom_feedback } = body;

  if (!exit_reason) {
    return new Response(
      JSON.stringify({ error: 'Exit reason is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('cancel_sessions')
    .select('*, profile_id')
    .eq('session_token', token)
    .single();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get config to determine offer
  const { data: config } = await supabase
    .from('cancel_flow_config')
    .select('offer_settings')
    .eq('profile_id', session.profile_id)
    .single();

  const offerSettings = config?.offer_settings || {};
  const reasonMappings = offerSettings.reason_mappings || {};
  
  // Determine which offer to present based on exit reason
  let offerType = offerSettings.default_offer || 'none';
  if (reasonMappings[exit_reason]) {
    offerType = reasonMappings[exit_reason].offer_type || offerType;
  }

  // Update session with survey response
  const { error: updateError } = await supabase
    .from('cancel_sessions')
    .update({
      exit_reason,
      custom_feedback: custom_feedback || null,
      status: 'survey_completed',
      offer_type_presented: offerType,
    })
    .eq('id', session.id);

  if (updateError) {
    structuredLog('error', 'Failed to update session', { error: updateError.message });
    return new Response(
      JSON.stringify({ error: 'Failed to save response' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get full offer details
  let offerDetails = null;
  if (offerType === 'discount') {
    const mapping = reasonMappings[exit_reason] || {};
    offerDetails = {
      type: 'discount',
      percentage: mapping.discount_percentage || offerSettings.discount_percentage || 20,
      duration_months: mapping.discount_duration_months || offerSettings.discount_duration_months || 3,
    };
  } else if (offerType === 'pause') {
    const mapping = reasonMappings[exit_reason] || {};
    offerDetails = {
      type: 'pause',
      duration_months: mapping.pause_duration_months || offerSettings.pause_duration_months || 1,
    };
  }

  structuredLog('info', 'Survey submitted', { session_id: session.id, exit_reason, offer_type: offerType });

  return new Response(
    JSON.stringify({
      status: 'survey_completed',
      offer: offerDetails,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle offer acceptance/decline
async function handleOfferResponse(
  req: Request,
  token: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const body = await req.json();
  const { accepted } = body;

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('cancel_sessions')
    .select('*')
    .eq('session_token', token)
    .single();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const newStatus = accepted ? 'saved' : 'cancelled';
  
  // Update session
  const { error: updateError } = await supabase
    .from('cancel_sessions')
    .update({
      offer_accepted: accepted,
      status: newStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  if (updateError) {
    structuredLog('error', 'Failed to update session', { error: updateError.message });
    return new Response(
      JSON.stringify({ error: 'Failed to save response' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // If offer accepted, create saved_customers record
  if (accepted && session.offer_type_presented && session.offer_type_presented !== 'none') {
    // Get config for offer details
    const { data: config } = await supabase
      .from('cancel_flow_config')
      .select('offer_settings')
      .eq('profile_id', session.profile_id)
      .single();

    const offerSettings = config?.offer_settings || {};
    const reasonMappings = offerSettings.reason_mappings || {};
    const mapping = reasonMappings[session.exit_reason] || {};

    // Calculate MRR values (placeholder - would need actual subscription data)
    const originalMrr = 100; // Placeholder
    let newMrr = originalMrr;
    let discountPercentage = null;
    let pauseMonths = null;

    if (session.offer_type_presented === 'discount') {
      discountPercentage = mapping.discount_percentage || offerSettings.discount_percentage || 20;
      newMrr = originalMrr * (1 - discountPercentage / 100);
    } else if (session.offer_type_presented === 'pause') {
      pauseMonths = mapping.pause_duration_months || offerSettings.pause_duration_months || 1;
      newMrr = 0; // During pause, MRR is 0
    }

    await supabase
      .from('saved_customers')
      .insert({
        profile_id: session.profile_id,
        cancel_session_id: session.id,
        customer_id: session.customer_id,
        subscription_id: session.subscription_id,
        save_type: session.offer_type_presented,
        original_mrr: originalMrr,
        new_mrr: newMrr,
        discount_percentage: discountPercentage,
        pause_months: pauseMonths,
      });

    structuredLog('info', 'Customer saved', { session_id: session.id, save_type: session.offer_type_presented });
  }

  structuredLog('info', 'Offer response recorded', { 
    session_id: session.id, 
    accepted, 
    status: newStatus 
  });

  return new Response(
    JSON.stringify({ status: newStatus, accepted }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Complete cancellation without offer (or when no offer available)
async function handleComplete(
  req: Request,
  token: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const body = await req.json();
  const { action } = body; // 'cancelled' or 'abandoned'

  const { data: session, error: sessionError } = await supabase
    .from('cancel_sessions')
    .select('*')
    .eq('session_token', token)
    .single();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const newStatus = action === 'abandoned' ? 'abandoned' : 'cancelled';

  const { error: updateError } = await supabase
    .from('cancel_sessions')
    .update({
      status: newStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  if (updateError) {
    return new Response(
      JSON.stringify({ error: 'Failed to complete session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  structuredLog('info', 'Session completed', { session_id: session.id, status: newStatus });

  return new Response(
    JSON.stringify({ status: newStatus }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
