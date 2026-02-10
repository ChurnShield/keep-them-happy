import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function structuredLog(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    function: 'test-save-notification',
    message,
    ...context,
  };
  console[level](JSON.stringify(logEntry));
}

// Reusable notification sender (same logic as widget-api)
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
): Promise<{ success: boolean; message: string; messageId?: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    return { success: false, message: 'RESEND_API_KEY not configured' };
  }

  // Get profile email and notification preferences
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('email, company_name, email_notifications')
    .eq('id', profileId)
    .single();

  if (profileError || !profile?.email) {
    return { success: false, message: `Could not fetch profile: ${profileError?.message || 'No email found'}` };
  }

  // Respect notification preferences (but allow override for testing)
  if (profile.email_notifications === false) {
    structuredLog('info', 'Email notifications disabled - sending anyway for test', { profileId });
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
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">[TEST EMAIL]</p>
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
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #64748b; font-size: 14px;">Reason given:</span>
                          <span style="color: #f1f5f9; font-size: 14px; float: right;">${reasonFormatted}</span>
                        </td>
                      </tr>
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
        subject: `🎉 [TEST] Customer saved! ${formatCurrency(savedAmount)}/mo retained`,
        html: emailHtml,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      structuredLog('error', 'Resend API error', { result });
      return { success: false, message: `Resend error: ${JSON.stringify(result)}` };
    }
    
    structuredLog('info', 'Test notification email sent', { messageId: result.id, to: profile.email });
    return { success: true, message: `Email sent to ${profile.email}`, messageId: result.id };
  } catch (error) {
    structuredLog('error', 'Failed to send test notification', { error: String(error) });
    return { success: false, message: `Send failed: ${String(error)}` };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse optional test data from request body
    let testData = {
      saveType: 'discount',
      originalMrr: 99,
      newMrr: 74.25,
      exitReason: 'too_expensive',
      discountPercentage: 25,
      pauseMonths: null as number | null,
    };

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        testData = { ...testData, ...body };
      } catch {
        // Use defaults
      }
    }

    structuredLog('info', 'Sending test notification', { 
      userId: user.id, 
      profileId: profile.id,
      testData 
    });

    const result = await sendSaveNotification(supabase, profile.id, testData);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    structuredLog('error', 'Unexpected error', { error: String(error) });
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
