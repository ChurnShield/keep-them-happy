import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StripeOfferResult {
  success: boolean;
  stripeActionId?: string;
  originalMrr: number;
  newMrr: number;
  discountPercentage?: number;
  pauseMonths?: number;
  message: string;
  error?: string;
}

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

function errorResponse(status: number, code: string, message: string): Response {
  structuredLog('error', message, { code, status });
  return new Response(
    JSON.stringify({ error: true, code, message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Monthly fee cap constant (£500/month per client)
const MONTHLY_FEE_CAP = 500;

// Calculate ChurnShield fee: 20% of saved revenue, capped at $500/month
function calculateChurnShieldFee(monthlySavedRevenue: number): number {
  const fee = monthlySavedRevenue * 0.20;
  return Math.min(fee, MONTHLY_FEE_CAP);
}

// Calculate capped ChurnShield fee considering aggregate monthly limit
// This ensures total fees for a client don't exceed £500/month
function calculateCappedFee(
  monthlySavedRevenue: number, 
  totalFeesThisMonth: number
): number {
  const rawFee = monthlySavedRevenue * 0.20;
  const maxAllowedFee = Math.max(0, MONTHLY_FEE_CAP - totalFeesThisMonth);
  // Cap at both per-save limit (500) and remaining monthly allowance
  return Math.min(rawFee, MONTHLY_FEE_CAP, maxAllowedFee);
}

// Get total ChurnShield fees accrued for a profile in the current calendar month (UTC)
// deno-lint-ignore no-explicit-any
async function getMonthlyFeesForProfile(
  supabaseClient: any, 
  profileId: string
): Promise<number> {
  // Get start of current month in UTC
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthStartIso = monthStart.toISOString();
  
  const { data, error } = await supabaseClient
    .from('saved_customers')
    .select('churnshield_fee_per_month')
    .eq('profile_id', profileId)
    .gte('created_at', monthStartIso);
  
  if (error) {
    structuredLog('error', 'Failed to fetch monthly fees', { error: error.message, profileId });
    return 0; // Fail open - don't block saves due to query errors
  }
  
  const totalFees = (data || []).reduce(
    (sum: number, row: { churnshield_fee_per_month: number | null }) => 
      sum + (Number(row.churnshield_fee_per_month) || 0), 
    0
  );
  
  structuredLog('info', 'Monthly fees calculated', { 
    profileId, 
    totalFeesThisMonth: totalFees,
    remainingCap: Math.max(0, MONTHLY_FEE_CAP - totalFees),
    monthStart: monthStartIso 
  });
  
  return totalFees;
}

// Send email notification when a customer is saved
// deno-lint-ignore no-explicit-any
async function sendSaveNotification(
  supabaseClient: any,
  profileId: string,
  saveDetails: {
    saveType: string;
    originalMrr: number;
    newMrr: number;
    exitReason: string | null;
    discountPercentage?: number | null;
    pauseMonths?: number | null;
  }
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    structuredLog('error', 'RESEND_API_KEY not configured - skipping notification', {});
    return;
  }

  // Get profile email and notification preferences
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('email, company_name, email_notifications')
    .eq('id', profileId)
    .single();

  if (profileError || !profile?.email) {
    structuredLog('error', 'Could not fetch profile for notification', { error: profileError?.message });
    return;
  }

  // Respect notification preferences
  if (profile.email_notifications === false) {
    structuredLog('info', 'Email notifications disabled for profile', { profileId });
    return;
  }

  const savedAmount = saveDetails.saveType === 'pause' 
    ? saveDetails.originalMrr 
    : (saveDetails.originalMrr - saveDetails.newMrr);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

  const reasonFormatted = (saveDetails.exitReason || 'Not specified')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const offerText = saveDetails.saveType === 'pause'
    ? `${saveDetails.pauseMonths || 1} month pause`
    : `${saveDetails.discountPercentage || 25}% discount`;

  const appUrl = Deno.env.get('APP_URL') || 'https://churnshield.app';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 32px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Customer Saved!</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                      Great news! ChurnShield just prevented a cancellation${profile.company_name ? ` for ${profile.company_name}` : ''}.
                    </p>
                    <!-- Revenue Saved Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <p style="margin: 0 0 8px 0; color: #14b8a6; font-size: 36px; font-weight: 700;">
                            ${formatCurrency(savedAmount)}
                          </p>
                          <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                            Monthly revenue saved
                          </p>
                        </td>
                      </tr>
                    </table>
                    <!-- Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                      ${saveDetails.saveType === 'discount' ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #64748b; font-size: 14px;">Reason given:</span>
                          <span style="color: #f1f5f9; font-size: 14px; float: right;">${reasonFormatted}</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #64748b; font-size: 14px;">Offer accepted:</span>
                          <span style="color: #f1f5f9; font-size: 14px; float: right;">${offerText}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #64748b; font-size: 14px;">Original MRR:</span>
                          <span style="color: #f1f5f9; font-size: 14px; float: right;">${formatCurrency(saveDetails.originalMrr)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="color: #64748b; font-size: 14px;">New MRR:</span>
                          <span style="color: #f1f5f9; font-size: 14px; float: right;">${formatCurrency(saveDetails.newMrr)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px 32px; text-align: center;">
                    <a href="${appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View Dashboard
                    </a>
                    <p style="margin: 24px 0 0 0; color: #475569; font-size: 12px;">
                      Sent by ChurnShield
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChurnShield <notifications@churnshield.app>',
        to: [profile.email],
        subject: `🎉 Customer saved! ${formatCurrency(savedAmount)}/mo retained`,
        html: emailHtml,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      structuredLog('error', 'Resend API error', { result });
    } else {
      structuredLog('info', 'Save notification email sent', { messageId: result.id, to: profile.email });
    }
  } catch (error) {
    structuredLog('error', 'Failed to send save notification', { error: String(error) });
  }
}

// Check if this is a test session (no real Stripe IDs)
function isTestSession(session: Record<string, unknown>): boolean {
  return !session.customer_id && !session.subscription_id && !session.stripe_subscription_id && !session.stripe_customer_id;
}

// Get Stripe connection for a profile by looking up the user_id through profiles table
async function getStripeConnectionForProfile(
  profileId: string,
  // deno-lint-ignore no-explicit-any
  supabase: any
): Promise<{ accessToken: string; stripeUserId: string } | null> {
  // First, get the user_id from the profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .single();

  if (profileError || !profile?.user_id) {
    structuredLog('warn', 'Could not find profile for Stripe lookup', { 
      profileId, 
      error: profileError?.message 
    });
    return null;
  }

  // Now get the stripe connection using the user_id
  // The stripe_connections table stores user_id in the session_id column
  const { data: connection, error: connectionError } = await supabase
    .from('stripe_connections')
    .select('access_token, stripe_user_id')
    .eq('session_id', profile.user_id)
    .single();

  if (connectionError || !connection?.access_token) {
    structuredLog('warn', 'No Stripe connection found', { 
      profileId, 
      userId: profile.user_id,
      error: connectionError?.message 
    });
    return null;
  }

  structuredLog('info', 'Stripe connection found', { 
    profileId, 
    userId: profile.user_id,
    stripeUserId: connection.stripe_user_id 
  });

  return {
    accessToken: connection.access_token,
    stripeUserId: connection.stripe_user_id,
  };
}

// Calculate MRR from a Stripe subscription
function calculateSubscriptionMrr(subscription: Stripe.Subscription): number {
  let totalMonthlyAmount = 0;

  for (const item of subscription.items.data) {
    const price = item.price;
    const quantity = item.quantity || 1;
    const unitAmount = price.unit_amount || 0;

    let monthlyAmount = 0;
    switch (price.recurring?.interval) {
      case 'month':
        monthlyAmount = unitAmount * quantity / (price.recurring?.interval_count || 1);
        break;
      case 'year':
        monthlyAmount = (unitAmount * quantity) / (12 * (price.recurring?.interval_count || 1));
        break;
      case 'week':
        monthlyAmount = (unitAmount * quantity * 4.33) / (price.recurring?.interval_count || 1);
        break;
      case 'day':
        monthlyAmount = (unitAmount * quantity * 30) / (price.recurring?.interval_count || 1);
        break;
      default:
        monthlyAmount = unitAmount * quantity;
    }
    totalMonthlyAmount += monthlyAmount;
  }

  // Convert from cents to dollars
  return totalMonthlyAmount / 100;
}

// Apply a discount offer to a Stripe subscription
// Handles both standard billing (subscription-level coupon) and flexible billing (item-level discounts)
async function applyDiscountOffer(
  stripe: Stripe,
  subscriptionId: string,
  discountPercent: number,
  durationMonths: number
): Promise<StripeOfferResult> {
  try {
    // Get the subscription first to calculate MRR and check billing mode
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const originalMrr = calculateSubscriptionMrr(subscription);

    // Create a coupon
    const coupon = await stripe.coupons.create({
      percent_off: discountPercent,
      duration: 'repeating',
      duration_in_months: durationMonths,
      name: `CS ${discountPercent}% off ${durationMonths}mo`,
    });

    // Check if this is a flexible billing subscription
    // deno-lint-ignore no-explicit-any
    const billingMode = (subscription as any).billing_mode;
    const isFlexibleBilling = billingMode?.type === 'flexible';

    if (isFlexibleBilling) {
      // For flexible billing, apply discount at item level
      structuredLog('info', 'Applying discount at item level for flexible billing', {
        subscriptionId,
        billingMode,
      });

      // Apply discount to all subscription items
      const itemUpdates = subscription.items.data.map((item: Stripe.SubscriptionItem) => ({
        id: item.id,
        discounts: [{ coupon: coupon.id }],
      }));

      await stripe.subscriptions.update(subscriptionId, {
        items: itemUpdates,
        proration_behavior: 'none',
      });
    } else {
      // For standard billing, apply coupon at subscription level
      await stripe.subscriptions.update(subscriptionId, {
        coupon: coupon.id,
      });
    }

    const newMrr = originalMrr * (1 - discountPercent / 100);

    structuredLog('info', 'Discount offer applied', {
      subscriptionId,
      couponId: coupon.id,
      discountPercent,
      durationMonths,
      originalMrr,
      newMrr,
      isFlexibleBilling,
    });

    return {
      success: true,
      stripeActionId: coupon.id,
      originalMrr,
      newMrr,
      discountPercentage: discountPercent,
      message: `Your ${discountPercent}% discount has been applied for ${durationMonths} months.`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    structuredLog('error', 'Failed to apply discount offer', { subscriptionId, error: errorMessage });
    return {
      success: false,
      originalMrr: 0,
      newMrr: 0,
      message: 'Failed to apply discount',
      error: errorMessage,
    };
  }
}

// Apply a pause offer to a Stripe subscription
async function applyPauseOffer(
  stripe: Stripe,
  subscriptionId: string,
  pauseMonths: number
): Promise<StripeOfferResult> {
  try {
    // Get the subscription first to calculate MRR
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const originalMrr = calculateSubscriptionMrr(subscription);

    // Calculate resume date
    const resumeDate = new Date();
    resumeDate.setMonth(resumeDate.getMonth() + pauseMonths);
    const resumesAt = Math.floor(resumeDate.getTime() / 1000);

    // Pause the subscription
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'void',
        resumes_at: resumesAt,
      },
    });

    structuredLog('info', 'Pause offer applied', {
      subscriptionId,
      pauseMonths,
      resumesAt: new Date(resumesAt * 1000).toISOString(),
      originalMrr,
    });

    return {
      success: true,
      stripeActionId: `pause_${updatedSubscription.id}_${resumesAt}`,
      originalMrr,
      newMrr: 0, // During pause, MRR is 0
      pauseMonths,
      message: `Your subscription has been paused for ${pauseMonths} month${pauseMonths > 1 ? 's' : ''}.`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    structuredLog('error', 'Failed to apply pause offer', { subscriptionId, error: errorMessage });
    return {
      success: false,
      originalMrr: 0,
      newMrr: 0,
      message: 'Failed to pause subscription',
      error: errorMessage,
    };
  }
}

// Simulate offer result for test sessions
function simulateOfferResult(
  offerType: string,
  discountPercent?: number,
  pauseMonths?: number
): StripeOfferResult {
  const mockOriginalMrr = 100; // $100/month test value

  if (offerType === 'pause') {
    return {
      success: true,
      stripeActionId: `test_pause_${Date.now()}`,
      originalMrr: mockOriginalMrr,
      newMrr: 0,
      pauseMonths: pauseMonths || 1,
      message: `[TEST] Your subscription has been paused for ${pauseMonths || 1} month(s).`,
    };
  } else if (offerType === 'discount') {
    const discount = discountPercent || 20;
    return {
      success: true,
      stripeActionId: `test_discount_${Date.now()}`,
      originalMrr: mockOriginalMrr,
      newMrr: mockOriginalMrr * (1 - discount / 100),
      discountPercentage: discount,
      message: `[TEST] Your ${discount}% discount has been applied.`,
    };
  }

  return {
    success: true,
    originalMrr: mockOriginalMrr,
    newMrr: mockOriginalMrr,
    message: '[TEST] Your request has been recorded.',
  };
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
      stripe_subscription_id: subscription_id || null,  // Also store in stripe_subscription_id
      stripe_customer_id: customer_id || null,  // Also store in stripe_customer_id
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
  
  // Update session status
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

  // If offer accepted, apply the offer and create saved_customers record
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

    // Get offer parameters
    const discountPercentage = mapping.discount_percentage || offerSettings.discount_percentage || 20;
    const discountDurationMonths = mapping.discount_duration_months || offerSettings.discount_duration_months || 3;
    const pauseDurationMonths = mapping.pause_duration_months || offerSettings.pause_duration_months || 1;

    // Check if this is a test session
    const isTest = isTestSession(session);
    const stripeSubscriptionId = session.stripe_subscription_id || session.subscription_id;

    let offerResult: StripeOfferResult;

    if (isTest) {
      // Simulate for test sessions
      structuredLog('info', 'Test session - simulating offer', { session_id: session.id });
      offerResult = simulateOfferResult(session.offer_type_presented, discountPercentage, pauseDurationMonths);
    } else {
      // Get Stripe connection for this profile
      const stripeConnection = await getStripeConnectionForProfile(session.profile_id, supabase);
      
      if (!stripeConnection) {
        structuredLog('warn', 'Stripe not connected for profile', { profile_id: session.profile_id });
        // Fall back to simulated result if Stripe not connected
        offerResult = {
          success: true,
          originalMrr: 0,
          newMrr: 0,
          message: 'Your request has been recorded. Please contact support to complete the offer.',
        };
      } else if (!stripeSubscriptionId) {
        // No subscription ID - just record the response
        structuredLog('info', 'No subscription ID - recording response only', { session_id: session.id });
        offerResult = {
          success: true,
          originalMrr: 0,
          newMrr: 0,
          message: 'Your request has been recorded.',
        };
      } else {
        // Initialize Stripe with OAuth access token
        const stripe = new Stripe(stripeConnection.accessToken, {
          apiVersion: '2023-10-16',
        });
        
        structuredLog('info', 'Applying real Stripe action', {
          session_id: session.id,
          stripeSubscriptionId,
          offer_type: session.offer_type_presented,
        });
        
        // Apply real Stripe action
        if (session.offer_type_presented === 'pause') {
          offerResult = await applyPauseOffer(stripe, stripeSubscriptionId, pauseDurationMonths);
        } else {
          offerResult = await applyDiscountOffer(stripe, stripeSubscriptionId, discountPercentage, discountDurationMonths);
        }
        
        if (!offerResult.success) {
          structuredLog('error', 'Stripe action failed', { 
            session_id: session.id, 
            error: offerResult.error 
          });
          // Continue with recording the attempt even if Stripe failed
          offerResult = {
            ...offerResult,
            message: `We encountered an issue applying your offer. Please contact support. Error: ${offerResult.error}`,
          };
        }
      }
    }

    // Calculate fee with aggregate monthly cap
    const monthlySaved = offerResult.originalMrr - offerResult.newMrr;
    const totalFeesThisMonth = await getMonthlyFeesForProfile(supabase, session.profile_id);
    const churnshieldFee = calculateCappedFee(monthlySaved, totalFeesThisMonth);
    
    // Log cap enforcement details
    const rawFee = monthlySaved * 0.20;
    const wasCapped = churnshieldFee < rawFee;
    if (wasCapped) {
      structuredLog('info', 'Fee capped due to monthly limit', {
        sessionId: session.id,
        rawFee,
        cappedFee: churnshieldFee,
        totalFeesThisMonth,
        remainingCap: MONTHLY_FEE_CAP - totalFeesThisMonth,
      });
    }

    // Use upsert to prevent duplicate saves for the same cancel session
    // If a record already exists for this cancel_session_id, update it instead of creating a duplicate
    const { data: upsertData, error: insertError } = await supabase
      .from('saved_customers')
      .upsert({
        profile_id: session.profile_id,
        cancel_session_id: session.id,
        customer_id: session.customer_id,
        subscription_id: session.subscription_id,
        save_type: session.offer_type_presented,
        original_mrr: offerResult.originalMrr,
        new_mrr: offerResult.newMrr,
        discount_percentage: offerResult.discountPercentage || null,
        pause_months: offerResult.pauseMonths || null,
        stripe_action_id: offerResult.stripeActionId || null,
        churnshield_fee_per_month: churnshieldFee,
      }, {
        onConflict: 'cancel_session_id',
        ignoreDuplicates: false, // Update existing record
      })
      .select('id')
      .single();

    if (insertError) {
      // Check if it's a duplicate subscription save in the same month
      if (insertError.code === '23505' && insertError.message?.includes('unique_subscription_save_per_month')) {
        structuredLog('warn', 'Duplicate subscription save detected in same month - skipping', {
          sessionId: session.id,
          subscriptionId: session.subscription_id,
        });
      } else {
        structuredLog('error', 'Failed to insert saved_customers', { error: insertError.message, code: insertError.code });
      }
    } else if (upsertData) {
      structuredLog('info', 'Saved customer record created/updated', { savedCustomerId: upsertData.id });
    }

    structuredLog('info', 'Customer saved', { 
      session_id: session.id, 
      save_type: session.offer_type_presented,
      original_mrr: offerResult.originalMrr,
      new_mrr: offerResult.newMrr,
      monthlySaved,
      churnshieldFee,
      wasCapped,
      totalFeesThisMonth,
      is_test: isTest,
    });

    // Send email notification (non-blocking, skip for test sessions)
    if (!isTest) {
      sendSaveNotification(supabase, session.profile_id, {
        saveType: session.offer_type_presented,
        originalMrr: offerResult.originalMrr,
        newMrr: offerResult.newMrr,
        exitReason: session.exit_reason,
        discountPercentage: offerResult.discountPercentage,
        pauseMonths: offerResult.pauseMonths,
      }).catch(err => structuredLog('error', 'Notification error (non-blocking)', { error: String(err) }));
    }

    return new Response(
      JSON.stringify({ 
        status: newStatus, 
        accepted,
        message: offerResult.message,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
