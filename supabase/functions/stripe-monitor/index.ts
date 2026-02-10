import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cookie',
  'Access-Control-Allow-Credentials': 'true',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per session

// In-memory rate limiting map (keyed by session ID)
const sessionRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isSessionRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const record = sessionRateLimitMap.get(sessionId);
  
  if (!record || now > record.resetTime) {
    sessionRateLimitMap.set(sessionId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  record.count++;
  return false;
}

// Zod schema for stripe monitor request body
const StripeMonitorRequestSchema = z.object({
  alert_email: z.string()
    .max(255, "Email too long")
    .email("Invalid email format")
    .optional(),
  session_id: z.string()
    .max(500, "Session ID too long")
    .optional(),
});

interface FailedPayment {
  id: string;
  amount: number;
  currency: string;
  created: number;
  failure_message?: string;
  customer_email?: string;
}

async function sendAlertEmail(
  to: string,
  failedPayments: FailedPayment[],
  totalAmount: number,
  currency: string
): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const formatCurrency = (cents: number, curr: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(cents / 100);
  };

  const failedPaymentsList = failedPayments.slice(0, 5).map(p => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(p.created * 1000).toLocaleDateString()}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(p.amount, p.currency)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${p.failure_message || 'Unknown reason'}</td>
    </tr>
  `).join('');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChurnShield <notifications@churnshield.app>',
        to: [to],
        subject: `⚠️ ${failedPayments.length} failed payment(s) detected - ${formatCurrency(totalAmount, currency)} at risk`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h1 style="color: #92400e; font-size: 24px; margin: 0 0 8px 0;">⚠️ Failed Payments Alert</h1>
              <p style="color: #a16207; margin: 0; font-size: 16px;">
                We detected <strong>${failedPayments.length} failed payment(s)</strong> in the last 24 hours
              </p>
            </div>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">Total at risk</p>
              <p style="color: #111827; margin: 0; font-size: 36px; font-weight: bold;">${formatCurrency(totalAmount, currency)}</p>
            </div>

            <h2 style="color: #1a1a1a; font-size: 18px; margin-bottom: 16px;">Recent Failed Payments</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Date</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Amount</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Reason</th>
                </tr>
              </thead>
              <tbody>
                ${failedPaymentsList}
              </tbody>
            </table>

            ${failedPayments.length > 5 ? `<p style="color: #6b7280; font-size: 14px; text-align: center;">...and ${failedPayments.length - 5} more</p>` : ''}

            <div style="text-align: center; margin: 32px 0;">
              <a href="${Deno.env.get('APP_URL') || 'https://example.com'}/verification-results" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                View Recovery Dashboard
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; border-top: 1px solid #e5e7eb; padding-top: 24px;">
              This is an automated alert from your payment recovery system. You can configure alert settings in your dashboard.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Email service error' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Parse and validate request body
    let alertEmail: string | undefined;
    let sessionId: string | undefined;

    if (req.method === 'POST') {
      try {
        const rawBody = await req.json();
        const parseResult = StripeMonitorRequestSchema.safeParse(rawBody);
        
        if (!parseResult.success) {
          const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          console.error('Validation failed:', errors);
          return new Response(JSON.stringify({ 
            error: `Validation failed: ${errors}`
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        alertEmail = parseResult.data.alert_email;
        sessionId = parseResult.data.session_id;
      } catch {
        // No body provided, try to get session from cookie
      }
    }

    // If no session_id in body, try cookie
    if (!sessionId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [key, ...val] = c.trim().split('=');
          return [key, val.join('=')];
        })
      );
      sessionId = cookies['stripe_session'];
    }

    if (!sessionId) {
      return new Response(JSON.stringify({ 
        error: 'No session found. Please connect Stripe first.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting check (per session)
    if (isSessionRateLimited(sessionId)) {
      console.warn(`Rate limited stripe-monitor request for session: ${sessionId.substring(0, 8)}...`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later.'
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        },
      });
    }

    // Get the Stripe access token for this session
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: connection, error: dbError } = await supabase
      .from('stripe_connections')
      .select('access_token, stripe_user_id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (dbError || !connection) {
      console.error('No Stripe connection found');
      return new Response(JSON.stringify({ 
        error: 'No Stripe connection found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Monitoring Stripe account:', connection.stripe_user_id);

    // Check for failed payments in the last 24 hours
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);

    const chargesResponse = await fetch(
      `https://api.stripe.com/v1/charges?limit=100&created[gte]=${twentyFourHoursAgo}`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Stripe-Account': connection.stripe_user_id,
        },
      }
    );

    if (!chargesResponse.ok) {
      const errorData = await chargesResponse.json();
      console.error('Stripe API error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch Stripe data',
        details: errorData.error?.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const chargesData = await chargesResponse.json();
    
    // Filter failed charges
    const failedCharges: FailedPayment[] = (chargesData.data || [])
      .filter((charge: any) => charge.status === 'failed' || charge.paid === false)
      .map((charge: any) => ({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        created: charge.created,
        failure_message: charge.failure_message,
        customer_email: charge.receipt_email,
      }));

    console.log(`Found ${failedCharges.length} failed charges in last 24 hours`);

    const totalFailedAmount = failedCharges.reduce((sum, c) => sum + c.amount, 0);
    const currency = failedCharges[0]?.currency || 'usd';

    // If alert_email is provided and there are failed payments, send alert
    if (alertEmail && failedCharges.length > 0) {
      console.log(`Sending alert email to ${alertEmail}`);
      const emailResult = await sendAlertEmail(alertEmail, failedCharges, totalFailedAmount, currency);
      
      if (!emailResult.success) {
        console.error('Failed to send alert email:', emailResult.error);
      } else {
        console.log('Alert email sent successfully');
      }

      return new Response(JSON.stringify({
        failedPayments: failedCharges.length,
        totalAmount: totalFailedAmount,
        currency,
        alertSent: emailResult.success,
        alertEmail,
        message: emailResult.success 
          ? `Alert sent to ${alertEmail}` 
          : `Failed to send alert: ${emailResult.error}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return monitoring data without sending email
    return new Response(JSON.stringify({
      failedPayments: failedCharges.length,
      totalAmount: totalFailedAmount,
      currency,
      failedCharges: failedCharges.slice(0, 10),
      message: failedCharges.length > 0 
        ? `${failedCharges.length} failed payment(s) detected`
        : 'No failed payments in the last 24 hours',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in stripe-monitor:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
