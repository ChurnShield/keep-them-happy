import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// v2.0 - Production-ready welcome email with idempotency
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  company?: string;
  forceResend?: boolean;
}

interface WelcomeEmailResponse {
  ok: boolean;
  messageId?: string;
  alreadySent?: boolean;
  errorCode?: string;
}

// Simple in-memory rate limiting (per IP, 5 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  record.count++;
  return false;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (data: WelcomeEmailResponse, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    if (isRateLimited(clientIP)) {
      console.warn(`Rate limited: ${clientIP}`);
      return respond({ ok: false, errorCode: "RATE_LIMITED" }, 429);
    }

    // Validate API key
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return respond({ ok: false, errorCode: "SERVICE_UNAVAILABLE" }, 500);
    }

    // Parse and validate input
    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const company = (body.company || "").toString().trim();
    const forceResend = body.forceResend === true;

    if (!email || !isValidEmail(email)) {
      return respond({ ok: false, errorCode: "INVALID_EMAIL" }, 400);
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // IDEMPOTENCY CHECK: Has welcome email already been sent?
    const { data: existingEmail, error: checkError } = await supabase
      .from("welcome_emails")
      .select("id, sent_at")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Database check error:", checkError);
      return respond({ ok: false, errorCode: "DB_ERROR" }, 500);
    }

    // If already sent and not forcing resend, return early
    if (existingEmail && !forceResend) {
      console.log(`Welcome email already sent to ${email} at ${existingEmail.sent_at}`);
      return respond({ ok: true, alreadySent: true });
    }
    
    // If forcing resend, log it
    if (existingEmail && forceResend) {
      console.log(`Resending welcome email to ${email} (forceResend=true)`);
    }

    // Verify email exists in leads table (optional security check)
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!lead) {
      console.warn(`Email not in leads table: ${email}`);
      // Still send - they might have signed up differently
    }

    console.log(`Sending welcome email to: ${email}`);

    // Build email HTML
    const appUrl = "https://keep-them-happy.lovable.app";
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0f1a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #111827 0%, #1a2744 100%); border-radius: 16px; border: 1px solid #1e3a5f; overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hey — Andy from ChurnShield here 👋
              </p>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Thanks for signing up.
              </p>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                ChurnShield helps SaaS teams reduce involuntary churn and recover lost revenue automatically — without dark patterns or heavy setup.
              </p>
              
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">What happens next:</p>
                <ol style="color: #cbd5e1; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>We'll review your signup within 24 hours</li>
                  <li>You'll receive a personalized onboarding call</li>
                  <li>We'll help you start recovering revenue risk-free</li>
                </ol>
              </div>
              
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px;">
                    <a href="${appUrl}/welcome" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
                      View your onboarding steps →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                Questions? Just reply to this email — I read every one.
              </p>
              
              <p style="color: #e2e8f0; font-size: 15px; margin: 0;">
                — Andy<br>
                <span style="color: #64748b;">ChurnShield</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Andy from ChurnShield <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to ChurnShield 👋",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", res.status, errorText);
      return respond({ ok: false, errorCode: "EMAIL_SEND_FAILED" }, 500);
    }

    const resendData = await res.json();
    const messageId = resendData.id;

    console.log(`Email sent successfully. MessageId: ${messageId}`);

    // Log to welcome_emails table for idempotency
    const { error: insertError } = await supabase
      .from("welcome_emails")
      .insert({
        email,
        resend_message_id: messageId,
        status: "sent",
      });

    if (insertError) {
      // Log but don't fail - email was already sent
      console.error("Failed to log welcome email:", insertError);
    }

    return respond({ ok: true, messageId });

  } catch (error) {
    console.error("Unexpected error:", error);
    return respond({ ok: false, errorCode: "INTERNAL_ERROR" }, 500);
  }
};

serve(handler);
