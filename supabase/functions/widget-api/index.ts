import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-test-session',
};

interface ErrorResponse {
  error: true;
  code: string;
  message: string;
}

function structuredLog(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    function: 'widget-api',
    message,
    ...context,
  };
  console[level](JSON.stringify(logEntry));
}

function errorResponse(status: number, code: string, message: string): Response {
  const body: ErrorResponse = { error: true, code, message };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function successResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Session token expiry: 30 minutes
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    structuredLog('error', 'Missing Supabase configuration');
    return errorResponse(500, 'SERVER_ERROR', 'Server configuration error');
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!checkRateLimit(clientIp)) {
    structuredLog('warn', 'Rate limit exceeded', { ip: clientIp });
    return errorResponse(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Path format: /widget-api/{endpoint}
    const endpoint = pathParts[pathParts.length - 1];

    // POST /widget-api (with x-test-session header) - Create test cancel session (for previewing)
    // Check this FIRST before other POST handlers
    if (req.method === 'POST' && req.headers.get('x-test-session') === 'true') {
      return await handleCreateTestSession(req, supabase);
    }

    // GET /widget-api/config - Get widget configuration
    if (req.method === 'GET' && endpoint === 'config') {
      return await handleGetConfig(url, supabase);
    }

    // POST /widget-api/session - Create cancel session
    if (req.method === 'POST' && endpoint === 'session') {
      return await handleCreateSession(req, supabase);
    }

    // POST /widget-api/survey - Submit survey response
    if (req.method === 'POST' && endpoint === 'survey') {
      return await handleSurvey(req, supabase);
    }

    // POST /widget-api/offer-response - Record offer acceptance/decline
    if (req.method === 'POST' && endpoint === 'offer-response') {
      return await handleOfferResponse(req, supabase);
    }

    // POST /widget-api/abandon - Record abandonment
    if (req.method === 'POST' && endpoint === 'abandon') {
      return await handleAbandon(req, supabase);
    }

    return errorResponse(404, 'NOT_FOUND', 'Endpoint not found');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    structuredLog('error', 'Unexpected error', { error: errorMessage });
    return errorResponse(500, 'SERVER_ERROR', 'An unexpected error occurred');
  }
});

// Validate widget token and get profile
async function validateWidgetToken(
  token: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<{ valid: boolean; profileId?: string; error?: Response }> {
  // Widget token is stored in cancel_flow_config or profiles
  // For now, we use profile_id as the token (simplified approach)
  // In production, you'd have a dedicated widget_tokens table
  
  const { data: config, error } = await supabase
    .from('cancel_flow_config')
    .select('profile_id, is_active')
    .eq('profile_id', token)
    .single();

  if (error || !config) {
    return { 
      valid: false, 
      error: errorResponse(401, 'INVALID_TOKEN', 'Invalid or expired widget token') 
    };
  }

  if (!config.is_active) {
    return { 
      valid: false, 
      error: errorResponse(403, 'WIDGET_DISABLED', 'Cancel flow is currently disabled') 
    };
  }

  return { valid: true, profileId: config.profile_id };
}

// Validate session token and check expiry
async function validateSessionToken(
  sessionToken: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<{ valid: boolean; session?: Record<string, unknown>; error?: Response }> {
  const { data: session, error } = await supabase
    .from('cancel_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (error || !session) {
    return { 
      valid: false, 
      error: errorResponse(401, 'INVALID_SESSION', 'Invalid or expired session') 
    };
  }

  // Check session expiry (30 minutes from creation)
  const createdAt = new Date(session.created_at).getTime();
  if (Date.now() - createdAt > SESSION_EXPIRY_MS) {
    return { 
      valid: false, 
      error: errorResponse(401, 'SESSION_EXPIRED', 'Session has expired. Please start again.') 
    };
  }

  // Check if already completed
  if (['saved', 'cancelled', 'abandoned'].includes(session.status)) {
    return { 
      valid: false, 
      error: errorResponse(400, 'SESSION_COMPLETED', 'This session has already been completed') 
    };
  }

  return { valid: true, session };
}

// GET /widget-api/config
async function handleGetConfig(
  url: URL,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const token = url.searchParams.get('token');
  const customerId = url.searchParams.get('customer_id');
  const subscriptionId = url.searchParams.get('subscription_id');

  if (!token) {
    return errorResponse(400, 'MISSING_TOKEN', 'Widget token is required');
  }

  // Validate widget token
  const tokenValidation = await validateWidgetToken(token, supabase);
  if (!tokenValidation.valid) {
    return tokenValidation.error!;
  }

  // Get full config
  const { data: config, error: configError } = await supabase
    .from('cancel_flow_config')
    .select('*')
    .eq('profile_id', tokenValidation.profileId)
    .single();

  if (configError || !config) {
    return errorResponse(404, 'CONFIG_NOT_FOUND', 'Widget configuration not found');
  }

  // If customer_id provided, verify it exists in Stripe connection
  // (Simplified - in production you'd check against stripe_customers table)
  let customerName = null;
  let subscriptionDetails = null;

  if (customerId) {
    const { data: customer } = await supabase
      .from('customers')
      .select('name, email, subscription_status, plan_amount')
      .eq('id', customerId)
      .single();

    if (customer) {
      customerName = customer.name;
      subscriptionDetails = {
        status: customer.subscription_status,
        planAmount: customer.plan_amount,
      };
    }
  }

  structuredLog('info', 'Config fetched', { 
    profileId: tokenValidation.profileId, 
    customerId,
    subscriptionId 
  });

  return successResponse({
    survey_options: config.survey_options,
    branding: config.branding,
    widget_settings: config.widget_settings,
    customer_name: customerName,
    subscription_details: subscriptionDetails,
  });
}

// POST /widget-api/session
async function handleCreateSession(
  req: Request,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const body = await req.json();
  const { token, customer_id, subscription_id } = body;

  if (!token) {
    return errorResponse(400, 'MISSING_TOKEN', 'Widget token is required');
  }

  // Validate widget token
  const tokenValidation = await validateWidgetToken(token, supabase);
  if (!tokenValidation.valid) {
    return tokenValidation.error!;
  }

  // Generate unique session token
  const sessionToken = generateSessionToken();

  // Create cancel session
  const { data: session, error: sessionError } = await supabase
    .from('cancel_sessions')
    .insert({
      profile_id: tokenValidation.profileId,
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
    return errorResponse(500, 'SESSION_CREATE_FAILED', 'Failed to create session');
  }

  // Get customer details for display
  let customerName = null;
  let subscriptionDetails = null;

  if (customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('name, email, subscription_status, plan_amount')
      .eq('id', customer_id)
      .single();

    if (customer) {
      customerName = customer.name;
      subscriptionDetails = {
        status: customer.subscription_status,
        planAmount: customer.plan_amount,
      };
    }
  }

  structuredLog('info', 'Session created', { 
    sessionId: session.id, 
    profileId: tokenValidation.profileId,
    customerId: customer_id 
  });

  return successResponse({
    session_token: sessionToken,
    session_id: session.id,
    customer_name: customerName,
    subscription_details: subscriptionDetails,
  });
}

// POST /widget-api (with x-test-session header) - Create test cancel session
async function handleCreateTestSession(
  req: Request,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const body = await req.json();
  const { profile_id } = body;

  if (!profile_id) {
    return errorResponse(400, 'MISSING_PROFILE', 'Profile ID is required');
  }

  // Verify the profile exists and has a cancel_flow_config
  const { data: config, error: configError } = await supabase
    .from('cancel_flow_config')
    .select('profile_id, is_active')
    .eq('profile_id', profile_id)
    .single();

  if (configError || !config) {
    return errorResponse(404, 'CONFIG_NOT_FOUND', 'No cancel flow configuration found for this profile');
  }

  // Generate unique session token
  const sessionToken = generateSessionToken();

  // Create test cancel session with null customer_id and subscription_id
  const { data: session, error: sessionError } = await supabase
    .from('cancel_sessions')
    .insert({
      profile_id: profile_id,
      customer_id: null, // null indicates test session
      subscription_id: null, // null indicates test session
      session_token: sessionToken,
      status: 'started',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (sessionError) {
    structuredLog('error', 'Failed to create test session', { error: sessionError.message });
    return errorResponse(500, 'SESSION_CREATE_FAILED', 'Failed to create test session');
  }

  // Build the test URL
  const appUrl = Deno.env.get('APP_URL') || 'https://rdstyfaveeokocztayri.lovableproject.com';
  const testUrl = `${appUrl}/cancel/${sessionToken}`;

  structuredLog('info', 'Test session created', { 
    sessionId: session.id, 
    profileId: profile_id,
    testUrl,
  });

  return successResponse({
    session_token: sessionToken,
    session_id: session.id,
    test_url: testUrl,
    expires_in_minutes: 30,
  });
}

// POST /widget-api/survey
async function handleSurvey(
  req: Request,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const body = await req.json();
  const { session_token, reason_selected, custom_reason, free_text_feedback } = body;

  if (!session_token) {
    return errorResponse(400, 'MISSING_SESSION', 'Session token is required');
  }

  if (!reason_selected) {
    return errorResponse(400, 'MISSING_REASON', 'Exit reason is required');
  }

  // Validate session
  const sessionValidation = await validateSessionToken(session_token, supabase);
  if (!sessionValidation.valid) {
    return sessionValidation.error!;
  }

  const session = sessionValidation.session!;

  // Get config to determine matched offer
  const { data: config } = await supabase
    .from('cancel_flow_config')
    .select('offer_settings')
    .eq('profile_id', session.profile_id)
    .single();

  const offerSettings = config?.offer_settings || {};
  const reasonMappings = offerSettings.reason_mappings || {};

  // Determine matched offer based on reason-to-offer mapping
  let matchedOffer = null;
  let offerType = 'none';

  if (reasonMappings[reason_selected]) {
    const mapping = reasonMappings[reason_selected];
    offerType = mapping.offer_type || 'none';
    
    if (offerType === 'discount') {
      matchedOffer = {
        type: 'discount',
        percentage: mapping.discount_percentage || offerSettings.discount_percentage || 20,
        duration_months: mapping.discount_duration_months || offerSettings.discount_duration_months || 3,
      };
    } else if (offerType === 'pause') {
      matchedOffer = {
        type: 'pause',
        duration_months: mapping.pause_duration_months || offerSettings.pause_duration_months || 1,
      };
    }
  } else if (offerSettings.default_offer && offerSettings.default_offer !== 'none') {
    // Use default offer if no specific mapping
    offerType = offerSettings.default_offer;
    
    if (offerType === 'discount') {
      matchedOffer = {
        type: 'discount',
        percentage: offerSettings.discount_percentage || 20,
        duration_months: offerSettings.discount_duration_months || 3,
      };
    } else if (offerType === 'pause') {
      matchedOffer = {
        type: 'pause',
        duration_months: offerSettings.pause_duration_months || 1,
      };
    }
  }

  // Determine the actual exit reason text
  const exitReason = reason_selected === 'other' && custom_reason 
    ? `other: ${custom_reason}` 
    : reason_selected;

  // Update cancel session with survey response
  const { error: updateError } = await supabase
    .from('cancel_sessions')
    .update({
      exit_reason: exitReason,
      custom_feedback: free_text_feedback || null,
      status: 'survey_completed',
      offer_type_presented: offerType,
    })
    .eq('id', session.id);

  if (updateError) {
    structuredLog('error', 'Failed to update session', { error: updateError.message });
    return errorResponse(500, 'UPDATE_FAILED', 'Failed to save survey response');
  }

  structuredLog('info', 'Survey submitted', { 
    sessionId: session.id, 
    reason: reason_selected,
    offerType 
  });

  return successResponse({
    matched_offer: matchedOffer,
    offer_details: matchedOffer,
  });
}

// POST /widget-api/offer-response
async function handleOfferResponse(
  req: Request,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const body = await req.json();
  const { session_token, accepted } = body;

  if (!session_token) {
    return errorResponse(400, 'MISSING_SESSION', 'Session token is required');
  }

  if (typeof accepted !== 'boolean') {
    return errorResponse(400, 'MISSING_ACCEPTED', 'Accepted field is required');
  }

  // Validate session
  const sessionValidation = await validateSessionToken(session_token, supabase);
  if (!sessionValidation.valid) {
    return sessionValidation.error!;
  }

  const session = sessionValidation.session!;
  const newStatus = accepted ? 'saved' : 'cancelled';

  // If offer was declined, just update the session and return
  if (!accepted) {
    const { error: updateError } = await supabase
      .from('cancel_sessions')
      .update({
        offer_accepted: false,
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      structuredLog('error', 'Failed to update session', { error: updateError.message });
      return errorResponse(500, 'UPDATE_FAILED', 'Failed to record response');
    }

    structuredLog('info', 'Offer declined', { sessionId: session.id });

    return successResponse({
      success: true,
      message: 'Your subscription has been cancelled.',
    });
  }

  // Offer was accepted - need to apply the Stripe action
  const { data: config } = await supabase
    .from('cancel_flow_config')
    .select('offer_settings')
    .eq('profile_id', session.profile_id)
    .single();

  const offerSettings = config?.offer_settings || {};
  const reasonMappings = offerSettings.reason_mappings || {};
  const exitReason = session.exit_reason as string;
  const mapping = reasonMappings[exitReason] || {};

  // Determine offer details
  const offerType = session.offer_type_presented || 'discount';
  const discountPercentage = mapping.discount_percentage || offerSettings.discount_percentage || 20;
  const discountDurationMonths = mapping.discount_duration_months || offerSettings.discount_duration_months || 3;
  const pauseDurationMonths = mapping.pause_duration_months || offerSettings.pause_duration_months || 1;

  // Get Stripe connection for this profile
  const { data: stripeConnection } = await supabase
    .from('stripe_connections')
    .select('access_token, stripe_user_id')
    .eq('session_id', session.profile_id)
    .single();

  let stripeActionId: string | null = null;
  let originalMrr = 0;
  let newMrr = 0;
  let appliedDiscountPercentage: number | null = null;
  let appliedPauseMonths: number | null = null;
  let successMessage = 'Your subscription has been updated.';

  // If we have Stripe connection and subscription, apply the actual action
  if (stripeConnection?.access_token && session.subscription_id) {
    try {
      const stripe = new Stripe(stripeConnection.access_token, {
        apiVersion: '2023-10-16',
      });

      // Get current subscription to calculate MRR
      const subscription = await stripe.subscriptions.retrieve(session.subscription_id);

      // Calculate original MRR (convert to dollars)
      const monthlyAmount = subscription.items.data.reduce((sum: number, item: Stripe.SubscriptionItem) => {
        const price = item.price;
        let amount = price.unit_amount || 0;

        // Convert to monthly if needed
        if (price.recurring?.interval === 'year') {
          amount = Math.round(amount / 12);
        } else if (price.recurring?.interval === 'week') {
          amount = Math.round(amount * 4.33);
        }

        return sum + (amount * (item.quantity || 1));
      }, 0);

      originalMrr = monthlyAmount / 100; // Convert cents to dollars

      if (offerType === 'pause') {
        // Pause the subscription
        const resumeDate = new Date();
        resumeDate.setMonth(resumeDate.getMonth() + pauseDurationMonths);

        await stripe.subscriptions.update(session.subscription_id, {
          pause_collection: {
            behavior: 'void',
            resumes_at: Math.floor(resumeDate.getTime() / 1000),
          },
        });

        stripeActionId = `pause_${subscription.id}_${Date.now()}`;
        appliedPauseMonths = pauseDurationMonths;
        newMrr = 0; // During pause, MRR is 0
        successMessage = `Your subscription has been paused for ${pauseDurationMonths} month${pauseDurationMonths !== 1 ? 's' : ''}. We'll see you soon!`;

        structuredLog('info', 'Subscription paused via Stripe', {
          subscriptionId: session.subscription_id,
          pauseMonths: pauseDurationMonths,
          resumeDate: resumeDate.toISOString(),
        });

      } else if (offerType === 'discount') {
        // Create a coupon and apply it
        const coupon = await stripe.coupons.create({
          percent_off: discountPercentage,
          duration: 'repeating',
          duration_in_months: discountDurationMonths,
          name: `ChurnShield Retention - ${discountPercentage}% off for ${discountDurationMonths} months`,
        });

        // Apply the coupon to the subscription
        await stripe.subscriptions.update(session.subscription_id, {
          coupon: coupon.id,
        });

        stripeActionId = coupon.id;
        appliedDiscountPercentage = discountPercentage;
        newMrr = originalMrr * (1 - discountPercentage / 100);
        successMessage = `Great news! We've applied a ${discountPercentage}% discount to your subscription for the next ${discountDurationMonths} month${discountDurationMonths !== 1 ? 's' : ''}.`;

        structuredLog('info', 'Discount applied via Stripe', {
          subscriptionId: session.subscription_id,
          couponId: coupon.id,
          discountPercentage,
          durationMonths: discountDurationMonths,
        });
      }

    } catch (stripeError) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error';
      structuredLog('error', 'Stripe action failed', { error: errorMessage, subscriptionId: session.subscription_id });

      return errorResponse(500, 'STRIPE_ERROR', 'We couldn\'t apply the offer right now. Please try again or contact support.');
    }
  } else {
    // No Stripe connection - demo mode, just record the acceptance
    structuredLog('warn', 'No Stripe connection for offer acceptance - demo mode', { sessionId: session.id });

    // Use placeholder values for demo
    originalMrr = 100;
    if (offerType === 'discount') {
      appliedDiscountPercentage = discountPercentage;
      newMrr = originalMrr * (1 - discountPercentage / 100);
      successMessage = `Your ${discountPercentage}% discount has been applied!`;
    } else if (offerType === 'pause') {
      appliedPauseMonths = pauseDurationMonths;
      newMrr = 0;
      successMessage = `Your subscription has been paused for ${pauseDurationMonths} month${pauseDurationMonths !== 1 ? 's' : ''}.`;
    }
  }

  // Update session status
  const { error: updateError } = await supabase
    .from('cancel_sessions')
    .update({
      offer_accepted: true,
      status: 'saved',
      completed_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  if (updateError) {
    structuredLog('error', 'Failed to update session', { error: updateError.message });
    return errorResponse(500, 'UPDATE_FAILED', 'Failed to record response');
  }

  // Create saved_customers record
  if (session.offer_type_presented && session.offer_type_presented !== 'none') {
    const { error: savedError } = await supabase
      .from('saved_customers')
      .insert({
        profile_id: session.profile_id,
        cancel_session_id: session.id,
        customer_id: session.customer_id,
        subscription_id: session.subscription_id,
        save_type: offerType,
        original_mrr: originalMrr,
        new_mrr: newMrr,
        discount_percentage: appliedDiscountPercentage,
        pause_months: appliedPauseMonths,
        stripe_action_id: stripeActionId,
      });

    if (savedError) {
      structuredLog('error', 'Failed to create saved_customers record', { error: savedError.message });
      // Don't fail the request - the Stripe action succeeded
    }

    structuredLog('info', 'Customer saved', {
      sessionId: session.id,
      saveType: offerType,
      originalMrr,
      newMrr,
      stripeActionId,
    });
  }

  return successResponse({
    success: true,
    message: successMessage,
    save_type: offerType,
    stripe_action_id: stripeActionId,
  });
}

// POST /widget-api/abandon
async function handleAbandon(
  req: Request,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<Response> {
  const body = await req.json();
  const { session_token, abandoned_at_step } = body;

  if (!session_token) {
    return errorResponse(400, 'MISSING_SESSION', 'Session token is required');
  }

  // Get session (don't use validateSessionToken as we allow completed sessions)
  const { data: session, error: sessionError } = await supabase
    .from('cancel_sessions')
    .select('*')
    .eq('session_token', session_token)
    .single();

  if (sessionError || !session) {
    return errorResponse(404, 'SESSION_NOT_FOUND', 'Session not found');
  }

  // Only update if not already in a final state
  if (!['saved', 'cancelled', 'abandoned'].includes(session.status)) {
    const { error: updateError } = await supabase
      .from('cancel_sessions')
      .update({
        status: 'abandoned',
        completed_at: new Date().toISOString(),
        custom_feedback: abandoned_at_step ? `Abandoned at: ${abandoned_at_step}` : null,
      })
      .eq('id', session.id);

    if (updateError) {
      structuredLog('error', 'Failed to update session', { error: updateError.message });
      return errorResponse(500, 'UPDATE_FAILED', 'Failed to record abandonment');
    }
  }

  structuredLog('info', 'Session abandoned', { 
    sessionId: session.id, 
    abandonedAt: abandoned_at_step 
  });

  return successResponse({
    success: true,
    message: 'Abandonment recorded',
  });
}
