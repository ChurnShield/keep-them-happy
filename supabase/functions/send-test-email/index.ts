import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// v1.3 - Added rate limiting
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 3; // 3 test emails per minute per user

// In-memory rate limiting map (keyed by user ID after auth)
const userRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isUserRateLimited(userId: string): boolean {
  const now = Date.now();
  const record = userRateLimitMap.get(userId);
  
  if (!record || now > record.resetTime) {
    userRateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
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
  return emailRegex.test(email);
}

async function verifyAdminAuth(req: Request): Promise<{ userId: string } | { error: string; status: number; code: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401, code: 'NO_AUTH' };
  }

  // Create Supabase client with user's JWT
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    console.log("Auth verification failed:", authError?.message || "No user");
    return { error: 'Invalid token', status: 401, code: 'INVALID_TOKEN' };
  }

  // Check admin role
  const { data: roleData, error: roleError } = await supabaseAuth
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError || !roleData) {
    console.log("Admin role check failed for user:", user.id);
    return { error: 'Admin access required', status: 403, code: 'FORBIDDEN' };
  }

  return { userId: user.id };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if ('error' in authResult) {
      return new Response(
        JSON.stringify({ ok: false, error: authResult.error, code: authResult.code }),
        { status: authResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check (per authenticated user)
    if (isUserRateLimited(authResult.userId)) {
      console.warn(`Rate limited send-test-email request from user: ${authResult.userId}`);
      return new Response(
        JSON.stringify({ ok: false, error: "Too many requests. Please try again later.", code: "RATE_LIMITED" }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "60"
          } 
        }
      );
    }

    console.log("Admin authenticated:", authResult.userId);

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
