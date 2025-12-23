import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// v1.1 - Force redeploy for secret binding
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return true;
  }
  
  entry.count++;
  return false;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const keyPresent = !!resendApiKey;
    
    console.log(`Diagnostics: keyPresent=${keyPresent}`);
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ ok: false, error: "Email service not configured", code: "MISSING_API_KEY", keyPresent }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";

    // Check rate limit
    if (isRateLimited(clientIP)) {
      console.warn(`Rate limited IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ ok: false, error: "Rate limited. Max 3 emails per hour.", code: "RATE_LIMITED" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to } = await req.json();

    // Validate email
    if (!to || !isValidEmail(to)) {
      console.warn(`Invalid email address provided: ${to}`);
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid email address", code: "INVALID_EMAIL" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending test email to: ${to}`);

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Churnshield <onboarding@resend.dev>",
        to: [to],
        subject: "Churnshield test email",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 16px;">Churnshield</h1>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              This is a test email to confirm Resend is configured correctly.
            </p>
            <p style="color: #888; font-size: 14px; margin-top: 32px;">
              Sent at ${new Date().toISOString()}
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", JSON.stringify(errorData));
      return new Response(
        JSON.stringify({ ok: false, error: errorData.message || "Email failed to send", code: "SEND_FAILED" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`Test email sent successfully. Message ID: ${data.id}`);

    return new Response(
      JSON.stringify({ ok: true, messageId: data.id, message: "Email sent successfully", keyPresent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in send-test-email:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ ok: false, error: "An unexpected error occurred", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
