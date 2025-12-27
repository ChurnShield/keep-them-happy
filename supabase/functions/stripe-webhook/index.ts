import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Supported event types
const SUPPORTED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.payment_action_required',
];

// Risk event severity mapping
const RISK_SEVERITY: Record<string, number> = {
  'invoice.payment_failed': 5,
  'subscription_past_due': 4,
  'subscription_unpaid': 4,
  'cancel_at_period_end': 4,
  'trial_ending_soon': 3,
  'renewal_soon': 2,
};

// Churn reason enum values (must match DB enum)
type ChurnReason = 'card_expired' | 'insufficient_funds' | 'bank_decline' | 'no_retry_attempted' | 'unknown_failure';

/**
 * Map Stripe payment failure codes to churn_reason enum
 * See: https://stripe.com/docs/declines/codes
 */
function mapStripeFailureToChurnReason(invoice: Stripe.Invoice): ChurnReason {
  // Try to get the decline code from the charge or payment intent
  const chargeId = invoice.charge as string | null;
  const lastPaymentError = (invoice as unknown as { last_payment_error?: { code?: string; decline_code?: string } }).last_payment_error;
  
  const declineCode = lastPaymentError?.decline_code || lastPaymentError?.code || '';
  
  // Map common Stripe decline codes to our churn reasons
  if (declineCode === 'expired_card' || declineCode === 'card_expired') {
    return 'card_expired';
  }
  
  if (declineCode === 'insufficient_funds' || declineCode === 'card_declined' && declineCode.includes('insufficient')) {
    return 'insufficient_funds';
  }
  
  if (
    declineCode === 'do_not_honor' ||
    declineCode === 'generic_decline' ||
    declineCode === 'card_declined' ||
    declineCode === 'issuer_not_available' ||
    declineCode === 'processing_error' ||
    declineCode === 'try_again_later'
  ) {
    return 'bank_decline';
  }
  
  // If no retry has been attempted and this is the first failure
  if (invoice.attempt_count === 1 && !invoice.next_payment_attempt) {
    return 'no_retry_attempted';
  }
  
  return 'unknown_failure';
}

interface LogContext {
  eventId: string;
  eventType: string;
  userId?: string;
  outcome?: string;
  error?: string;
}

function structuredLog(level: 'info' | 'warn' | 'error', message: string, context: LogContext) {
  const log = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  console.log(JSON.stringify(log));
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const eventId = 'unknown';
  const eventType = 'unknown';

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      structuredLog('error', 'Missing Stripe configuration', { eventId, eventType, error: 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET' });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      structuredLog('error', 'Missing Supabase configuration', { eventId, eventType, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      structuredLog('error', 'Missing stripe-signature header', { eventId, eventType, error: 'No signature' });
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      structuredLog('error', 'Webhook signature verification failed', { eventId, eventType, error: errorMessage });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentEventId = event.id;
    const currentEventType = event.type;

    structuredLog('info', 'Received webhook event', { eventId: currentEventId, eventType: currentEventType });

    // Check if event is supported
    if (!SUPPORTED_EVENTS.includes(currentEventType)) {
      structuredLog('info', 'Ignoring unsupported event type', { eventId: currentEventId, eventType: currentEventType, outcome: 'ignored' });
      return new Response(JSON.stringify({ received: true, status: 'ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase: AnySupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Idempotency check - see if we've already processed this event
    const { data: existingEvent, error: checkError } = await supabase
      .from('processed_stripe_events')
      .select('id')
      .eq('stripe_event_id', currentEventId)
      .maybeSingle();

    if (checkError) {
      structuredLog('error', 'Failed to check idempotency', { eventId: currentEventId, eventType: currentEventType, error: checkError.message });
      return new Response(JSON.stringify({ error: 'Database error during idempotency check' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingEvent) {
      structuredLog('info', 'Event already processed (idempotent)', { eventId: currentEventId, eventType: currentEventType, outcome: 'duplicate' });
      return new Response(JSON.stringify({ received: true, status: 'already_processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process the event
    let userId: string | null = null;
    const outcome = 'processed';

    try {
      switch (currentEventType) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          userId = await handleCheckoutCompleted(supabase, stripe, session, currentEventId, currentEventType);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          userId = await handleSubscriptionChange(supabase, stripe, subscription, currentEventId, currentEventType);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          userId = await handleSubscriptionDeleted(supabase, stripe, subscription, currentEventId, currentEventType);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          userId = await handleInvoicePaymentSucceeded(supabase, stripe, invoice, currentEventId, currentEventType);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          userId = await handleInvoicePaymentFailed(supabase, stripe, invoice, currentEventId, currentEventType);
          break;
        }

        case 'invoice.payment_action_required': {
          const invoice = event.data.object as Stripe.Invoice;
          userId = await handleInvoicePaymentActionRequired(supabase, stripe, invoice, currentEventId, currentEventType);
          break;
        }
      }

      // Mark event as processed
      const { error: insertError } = await supabase
        .from('processed_stripe_events')
        .insert({
          stripe_event_id: currentEventId,
          event_type: currentEventType,
        });

      if (insertError) {
        structuredLog('warn', 'Failed to mark event as processed', { eventId: currentEventId, eventType: currentEventType, userId: userId || undefined, error: insertError.message });
      }

      // Update risk score if we have a user
      if (userId) {
        await updateChurnRiskScore(supabase, userId);
      }

      structuredLog('info', 'Event processed successfully', { eventId: currentEventId, eventType: currentEventType, userId: userId || undefined, outcome });

    } catch (processingError) {
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
      structuredLog('error', 'Error processing event', { eventId: currentEventId, eventType: currentEventType, userId: userId || undefined, error: errorMessage });
      return new Response(JSON.stringify({ error: 'Failed to process event', details: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ received: true, status: outcome, userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    structuredLog('error', 'Unexpected error in webhook handler', { eventId, eventType, error: message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper: Find or create user by customer email
async function findOrCreateUserByCustomer(
  supabase: AnySupabaseClient,
  stripe: Stripe,
  customerId: string
): Promise<{ userId: string | null; customerEmail: string | null }> {
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = 'email' in customer ? customer.email : null;

  if (!customerEmail) {
    return { userId: null, customerEmail: null };
  }

  // Try to find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  // deno-lint-ignore no-explicit-any
  const matchingUser = users?.users?.find((u: any) => u.email === customerEmail);
  const userId = matchingUser?.id || null;

  // Upsert stripe_customers record
  if (userId) {
    await supabase
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        email: customerEmail,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }

  return { userId, customerEmail };
}

// Handler: checkout.session.completed
async function handleCheckoutCompleted(
  supabase: AnySupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventId: string,
  eventType: string
): Promise<string | null> {
  structuredLog('info', 'Processing checkout completed', { eventId, eventType });

  if (!session.customer || !session.subscription) {
    return null;
  }

  const { userId } = await findOrCreateUserByCustomer(supabase, stripe, session.customer as string);

  // The subscription.created event will handle the actual subscription data
  // Just log for tracking
  structuredLog('info', 'Checkout completed for subscription', { 
    eventId, 
    eventType, 
    userId: userId || undefined,
    outcome: 'subscription_will_be_handled_by_sub_event' 
  });

  return userId;
}

// Handler: subscription created/updated
async function handleSubscriptionChange(
  supabase: AnySupabaseClient,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  eventId: string,
  eventType: string
): Promise<string | null> {
  const { userId } = await findOrCreateUserByCustomer(supabase, stripe, subscription.customer as string);

  if (!userId) {
    structuredLog('warn', 'No user found for subscription', { eventId, eventType, error: 'No matching user for customer' });
    return null;
  }

  // Upsert stripe_subscriptions
  const { error: subError } = await supabase
    .from('stripe_subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' });

  if (subError) {
    throw new Error(`Failed to upsert subscription: ${subError.message}`);
  }

  // Also update the legacy subscriptions table for backward compatibility
  await supabase
    .from('subscriptions')
    .upsert({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      user_id: userId,
      status: subscription.status,
      plan_id: subscription.items.data[0]?.price?.id || null,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' });

  // Create churn risk events based on subscription state
  const riskEvents: Array<{ event_type: string; severity: number; metadata: Record<string, unknown> }> = [];

  // Check for cancel_at_period_end
  if (subscription.cancel_at_period_end) {
    riskEvents.push({
      event_type: 'cancel_at_period_end',
      severity: RISK_SEVERITY['cancel_at_period_end'],
      metadata: { subscription_id: subscription.id },
    });
  }

  // Check for past_due or unpaid status
  if (subscription.status === 'past_due') {
    riskEvents.push({
      event_type: 'subscription_past_due',
      severity: RISK_SEVERITY['subscription_past_due'],
      metadata: { subscription_id: subscription.id, status: subscription.status },
    });
  } else if (subscription.status === 'unpaid') {
    riskEvents.push({
      event_type: 'subscription_unpaid',
      severity: RISK_SEVERITY['subscription_unpaid'],
      metadata: { subscription_id: subscription.id, status: subscription.status },
    });
  }

  // Check for trial ending soon (within 48 hours)
  if (subscription.trial_end) {
    const trialEndTime = subscription.trial_end * 1000;
    const now = Date.now();
    const hoursUntilTrialEnd = (trialEndTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilTrialEnd > 0 && hoursUntilTrialEnd <= 48) {
      riskEvents.push({
        event_type: 'trial_ending_soon',
        severity: RISK_SEVERITY['trial_ending_soon'],
        metadata: { 
          subscription_id: subscription.id, 
          trial_end: new Date(trialEndTime).toISOString(),
          hours_remaining: Math.round(hoursUntilTrialEnd),
        },
      });
    }
  }

  // Insert risk events
  for (const riskEvent of riskEvents) {
    await supabase
      .from('churn_risk_events')
      .insert({
        user_id: userId,
        event_type: riskEvent.event_type,
        severity: riskEvent.severity,
        stripe_object_id: subscription.id,
        metadata: riskEvent.metadata,
        occurred_at: new Date().toISOString(),
      });
  }

  structuredLog('info', 'Subscription upserted', { 
    eventId, 
    eventType, 
    userId, 
    outcome: `status=${subscription.status}, risk_events=${riskEvents.length}` 
  });

  return userId;
}

// Handler: subscription deleted
async function handleSubscriptionDeleted(
  supabase: AnySupabaseClient,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  eventId: string,
  eventType: string
): Promise<string | null> {
  const { userId } = await findOrCreateUserByCustomer(supabase, stripe, subscription.customer as string);

  // Update stripe_subscriptions status
  await supabase
    .from('stripe_subscriptions')
    .update({ 
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Also update legacy subscriptions table
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Add churn event for cancellation
  if (userId) {
    await supabase
      .from('churn_risk_events')
      .insert({
        user_id: userId,
        event_type: 'subscription_canceled',
        severity: 5,
        stripe_object_id: subscription.id,
        metadata: { subscription_id: subscription.id },
        occurred_at: new Date().toISOString(),
      });
  }

  structuredLog('info', 'Subscription marked as canceled', { eventId, eventType, userId: userId || undefined });

  return userId;
}

// Handler: invoice payment succeeded
async function handleInvoicePaymentSucceeded(
  supabase: AnySupabaseClient,
  stripe: Stripe,
  invoice: Stripe.Invoice,
  eventId: string,
  eventType: string
): Promise<string | null> {
  if (!invoice.customer) return null;

  const { userId } = await findOrCreateUserByCustomer(supabase, stripe, invoice.customer as string);

  if (!userId) {
    structuredLog('warn', 'No user found for invoice', { eventId, eventType });
    return null;
  }

  // Upsert invoice record
  const { error: invError } = await supabase
    .from('stripe_invoices')
    .upsert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: (invoice.subscription as string) || null,
      status: invoice.status || 'paid',
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      attempt_count: invoice.attempt_count || 0,
      next_payment_attempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_invoice_id' });

  if (invError) {
    throw new Error(`Failed to upsert invoice: ${invError.message}`);
  }

  // ========== RECOVERY CASE RESOLUTION ==========
  // Mark matching open recovery case as recovered
  await resolveRecoveryCaseFromInvoice(supabase, invoice.id, eventId, eventType, userId);

  structuredLog('info', 'Invoice payment succeeded recorded', { eventId, eventType, userId });

  return userId;
}

/**
 * Resolve a recovery case when payment succeeds (idempotent)
 * Only updates cases with status = 'open'
 */
async function resolveRecoveryCaseFromInvoice(
  supabase: AnySupabaseClient,
  invoiceId: string,
  eventId: string,
  eventType: string,
  userId: string
): Promise<void> {
  // Find open recovery case for this invoice
  const { data: openCase, error: findError } = await supabase
    .from('recovery_cases')
    .select('id, status')
    .eq('invoice_reference', invoiceId)
    .eq('status', 'open')
    .maybeSingle();

  if (findError) {
    structuredLog('error', 'Failed to find recovery case for resolution', { 
      eventId, 
      eventType, 
      userId, 
      error: findError.message 
    });
    return;
  }

  if (!openCase) {
    structuredLog('info', 'No open recovery case found for this invoice', { 
      eventId, 
      eventType, 
      userId 
    });
    return;
  }

  // Update to recovered
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('recovery_cases')
    .update({
      status: 'recovered',
      resolved_at: now,
      updated_at: now,
    })
    .eq('id', openCase.id)
    .eq('status', 'open'); // Double-check status to prevent race conditions

  if (updateError) {
    structuredLog('error', 'Failed to mark recovery case as recovered', { 
      eventId, 
      eventType, 
      userId, 
      error: updateError.message 
    });
    return;
  }

  structuredLog('info', 'Recovery case marked as recovered', { 
    eventId, 
    eventType, 
    userId, 
    outcome: `case_id=${openCase.id}` 
  });
}

// Handler: invoice payment failed
async function handleInvoicePaymentFailed(
  supabase: AnySupabaseClient,
  stripe: Stripe,
  invoice: Stripe.Invoice,
  eventId: string,
  eventType: string
): Promise<string | null> {
  if (!invoice.customer) {
    structuredLog('warn', 'Invoice has no customer, skipping', { eventId, eventType });
    return null;
  }

  const { userId } = await findOrCreateUserByCustomer(supabase, stripe, invoice.customer as string);

  if (!userId) {
    structuredLog('warn', 'No user found for failed invoice', { eventId, eventType });
    return null;
  }

  // Upsert invoice record
  await supabase
    .from('stripe_invoices')
    .upsert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: (invoice.subscription as string) || null,
      status: invoice.status || 'open',
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      attempt_count: invoice.attempt_count || 0,
      next_payment_attempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_invoice_id' });

  // Add high-severity churn risk event
  await supabase
    .from('churn_risk_events')
    .insert({
      user_id: userId,
      event_type: 'invoice.payment_failed',
      severity: RISK_SEVERITY['invoice.payment_failed'],
      stripe_object_id: invoice.id,
      metadata: {
        invoice_id: invoice.id,
        amount_due: invoice.amount_due,
        attempt_count: invoice.attempt_count,
      },
      occurred_at: new Date().toISOString(),
    });

  // Update subscription status if applicable
  if (invoice.subscription) {
    await supabase
      .from('stripe_subscriptions')
      .update({ 
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);

    await supabase
      .from('subscriptions')
      .update({ 
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);
  }

  // ========== RECOVERY CASE CREATION ==========
  // Only create recovery case if invoice is linked to a subscription
  if (invoice.subscription) {
    await createRecoveryCaseFromInvoice(supabase, userId, invoice, eventId, eventType);
  } else {
    structuredLog('info', 'Skipping recovery case - invoice not linked to subscription', { eventId, eventType, userId });
  }

  structuredLog('info', 'Invoice payment failed recorded', { eventId, eventType, userId });

  return userId;
}

/**
 * Create a recovery case from a failed invoice (idempotent)
 * Will NOT create duplicate cases for the same invoice
 */
async function createRecoveryCaseFromInvoice(
  supabase: AnySupabaseClient,
  userId: string,
  invoice: Stripe.Invoice,
  eventId: string,
  eventType: string
): Promise<void> {
  const invoiceRef = invoice.id;
  const customerRef = invoice.customer as string;

  // Check if a recovery case already exists for this invoice (any status)
  const { data: existingCase, error: checkError } = await supabase
    .from('recovery_cases')
    .select('id, status')
    .eq('invoice_reference', invoiceRef)
    .maybeSingle();

  if (checkError) {
    structuredLog('error', 'Failed to check existing recovery case', { 
      eventId, 
      eventType, 
      userId, 
      error: checkError.message 
    });
    return;
  }

  if (existingCase) {
    structuredLog('info', 'Recovery case already exists for invoice, skipping creation', { 
      eventId, 
      eventType, 
      userId, 
      outcome: `existing_case_id=${existingCase.id}, status=${existingCase.status}` 
    });
    return;
  }

  // Map Stripe failure to churn reason
  const churnReason = mapStripeFailureToChurnReason(invoice);
  
  // Calculate deadline (now + 48 hours)
  const now = new Date();
  const deadlineAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Create the recovery case
  const { data: newCase, error: insertError } = await supabase
    .from('recovery_cases')
    .insert({
      owner_user_id: userId,
      invoice_reference: invoiceRef,
      customer_reference: customerRef,
      amount_at_risk: invoice.amount_due / 100, // Convert from cents to currency units
      currency: invoice.currency?.toUpperCase() || 'USD',
      status: 'open',
      churn_reason: churnReason,
      opened_at: now.toISOString(),
      deadline_at: deadlineAt.toISOString(),
      first_action_at: null,
      resolved_at: null,
    })
    .select('id')
    .single();

  if (insertError) {
    // Check for unique constraint violation (duplicate insert race condition)
    if (insertError.code === '23505') {
      structuredLog('info', 'Recovery case creation skipped (concurrent insert)', { 
        eventId, 
        eventType, 
        userId 
      });
      return;
    }
    
    structuredLog('error', 'Failed to create recovery case', { 
      eventId, 
      eventType, 
      userId, 
      error: insertError.message 
    });
    return;
  }

  structuredLog('info', 'Recovery case created successfully', { 
    eventId, 
    eventType, 
    userId, 
    outcome: `case_id=${newCase?.id}, churn_reason=${churnReason}, amount=${invoice.amount_due / 100} ${invoice.currency?.toUpperCase()}` 
  });
}

// Handler: invoice payment action required
async function handleInvoicePaymentActionRequired(
  supabase: AnySupabaseClient,
  stripe: Stripe,
  invoice: Stripe.Invoice,
  eventId: string,
  eventType: string
): Promise<string | null> {
  if (!invoice.customer) return null;

  const { userId } = await findOrCreateUserByCustomer(supabase, stripe, invoice.customer as string);

  if (!userId) {
    structuredLog('warn', 'No user found for action required invoice', { eventId, eventType });
    return null;
  }

  // Upsert invoice record
  await supabase
    .from('stripe_invoices')
    .upsert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: (invoice.subscription as string) || null,
      status: 'requires_action',
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      attempt_count: invoice.attempt_count || 0,
      next_payment_attempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_invoice_id' });

  // Add churn risk event
  await supabase
    .from('churn_risk_events')
    .insert({
      user_id: userId,
      event_type: 'invoice.payment_action_required',
      severity: 4,
      stripe_object_id: invoice.id,
      metadata: {
        invoice_id: invoice.id,
        amount_due: invoice.amount_due,
      },
      occurred_at: new Date().toISOString(),
    });

  structuredLog('info', 'Invoice payment action required recorded', { eventId, eventType, userId });

  return userId;
}

// Risk scoring function
async function updateChurnRiskScore(
  supabase: AnySupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  let score = 0;
  const reasons: string[] = [];

  // Get recent churn events (last 7 days)
  const { data: recentEvents } = await supabase
    .from('churn_risk_events')
    .select('event_type, severity, occurred_at')
    .eq('user_id', userId)
    .gte('occurred_at', sevenDaysAgo.toISOString())
    .order('occurred_at', { ascending: false });

  // Count payment failures in last 7 days
  const paymentFailures = recentEvents?.filter((e: { event_type: string }) => e.event_type === 'invoice.payment_failed') || [];
  if (paymentFailures.length > 0) {
    score += 50;
    reasons.push('Payment failed in the last 7 days');
    
    if (paymentFailures.length >= 2) {
      score += 20;
      reasons.push('Multiple payment failures in the last 7 days');
    }
  }

  // Get current subscription status
  const { data: subscription } = await supabase
    .from('stripe_subscriptions')
    .select('status, cancel_at_period_end, current_period_end, trial_end')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscription) {
    // Check subscription status
    if (subscription.status === 'past_due') {
      score += 40;
      reasons.push('Subscription is past due');
    } else if (subscription.status === 'unpaid') {
      score += 40;
      reasons.push('Subscription is unpaid');
    }

    // Check cancel_at_period_end
    if (subscription.cancel_at_period_end) {
      score += 35;
      reasons.push('Cancellation scheduled at period end');
    }

    // Check trial ending soon
    if (subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      if (trialEnd > now && trialEnd <= fortyEightHoursFromNow) {
        score += 25;
        reasons.push('Trial ends within 48 hours');
      }
    }

    // Check renewal soon (for active/trialing subscriptions)
    if ((subscription.status === 'active' || subscription.status === 'trialing') && subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      if (periodEnd > now && periodEnd <= threeDaysFromNow) {
        score += 15;
        reasons.push('Renewal due within 3 days');
      }
    }
  }

  // Clamp score to 0-100
  score = Math.min(100, Math.max(0, score));

  // Limit to top 5 reasons
  const topReasons = reasons.slice(0, 5);

  // Upsert risk snapshot
  const { error } = await supabase
    .from('churn_risk_snapshot')
    .upsert({
      user_id: userId,
      score,
      top_reasons: topReasons,
      updated_at: now.toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to update risk snapshot:', error.message);
  }
}
