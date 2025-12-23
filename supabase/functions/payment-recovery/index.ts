import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRecoveryRequest {
  action: "trigger" | "follow_up" | "resolve" | "list";
  email?: string;
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

function sanitizeForLog(value: string): string {
  return value.replace(/[<>&'"]/g, '');
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lovable <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to send email" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Email service error" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, email }: PaymentRecoveryRequest = await req.json();

    // List action - return all recovery records
    if (action === "list") {
      const { data, error } = await supabase
        .from("payment_recovery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Failed to fetch recovery records");
        return new Response(
          JSON.stringify({ error: "Failed to fetch records" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ records: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All other actions require email
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedEmail = sanitizeForLog(email);

    // TRIGGER: Start recovery flow for an email
    if (action === "trigger") {
      // Check if recovery already exists
      const { data: existing } = await supabase
        .from("payment_recovery")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (existing && existing.status !== "resolved") {
        return new Response(
          JSON.stringify({ error: "Recovery already in progress for this email" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If resolved or doesn't exist, create/update new recovery
      const { error: upsertError } = await supabase
        .from("payment_recovery")
        .upsert({
          email,
          status: "needs_payment",
          attempt_count: 0,
          last_emailed_at: null,
        }, { onConflict: "email" });

      if (upsertError) {
        console.log("Failed to create recovery record for:", sanitizedEmail);
        return new Response(
          JSON.stringify({ error: "Failed to create recovery record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send Email #1
      const emailResult = await sendEmail(
        email,
        "Action needed: your payment didn't go through",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">We couldn't process your payment</h1>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              Hi there,
            </p>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              We noticed that your recent payment didn't go through. This can happen for various reasons - an expired card, insufficient funds, or a temporary bank issue.
            </p>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              To keep your account active, please update your payment method:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://example.com/update-payment" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Update Payment Method
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you have any questions, just reply to this email. We're here to help!
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Best regards,<br>The Team
            </p>
          </div>
        `
      );

      if (!emailResult.success) {
        console.log("Failed to send recovery email to:", sanitizedEmail);
        return new Response(
          JSON.stringify({ error: "Failed to send email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update status to emailed_1
      await supabase
        .from("payment_recovery")
        .update({
          status: "emailed_1",
          attempt_count: 1,
          last_emailed_at: new Date().toISOString(),
        })
        .eq("email", email);

      console.log("Recovery email #1 sent to:", sanitizedEmail);

      return new Response(
        JSON.stringify({ success: true, message: "Recovery email #1 sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FOLLOW_UP: Send second email if conditions are met
    if (action === "follow_up") {
      const { data: record } = await supabase
        .from("payment_recovery")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!record) {
        return new Response(
          JSON.stringify({ error: "No recovery record found for this email" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (record.status !== "emailed_1") {
        return new Response(
          JSON.stringify({ error: `Cannot send follow-up. Current status: ${record.status}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (record.attempt_count >= 2) {
        return new Response(
          JSON.stringify({ error: "Maximum email attempts reached (2)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const lastEmailTime = new Date(record.last_emailed_at).getTime();
      const now = Date.now();
      const timeSinceLastEmail = now - lastEmailTime;

      if (timeSinceLastEmail < FORTY_EIGHT_HOURS_MS) {
        const hoursRemaining = Math.ceil((FORTY_EIGHT_HOURS_MS - timeSinceLastEmail) / (60 * 60 * 1000));
        return new Response(
          JSON.stringify({ error: `Must wait ${hoursRemaining} more hours before sending follow-up` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send Email #2
      const emailResult = await sendEmail(
        email,
        "Still having trouble updating your payment?",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">We're still here to help</h1>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              Hi there,
            </p>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              We noticed you haven't updated your payment method yet. We understand things can get busy, so we wanted to send a friendly reminder.
            </p>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              Your account access may be affected if the payment issue isn't resolved soon. Here's the link to update your payment details:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://example.com/update-payment" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Update Payment Method
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you're having any issues or need assistance, please reply to this email. We're happy to help!
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Best regards,<br>The Team
            </p>
          </div>
        `
      );

      if (!emailResult.success) {
        console.log("Failed to send follow-up email to:", sanitizedEmail);
        return new Response(
          JSON.stringify({ error: "Failed to send follow-up email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update status to emailed_2
      await supabase
        .from("payment_recovery")
        .update({
          status: "emailed_2",
          attempt_count: 2,
          last_emailed_at: new Date().toISOString(),
        })
        .eq("email", email);

      console.log("Recovery email #2 sent to:", sanitizedEmail);

      return new Response(
        JSON.stringify({ success: true, message: "Follow-up email sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RESOLVE: Mark as resolved
    if (action === "resolve") {
      const { data: record } = await supabase
        .from("payment_recovery")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!record) {
        return new Response(
          JSON.stringify({ error: "No recovery record found for this email" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (record.status === "resolved") {
        return new Response(
          JSON.stringify({ error: "This record is already resolved" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("payment_recovery")
        .update({ status: "resolved" })
        .eq("email", email);

      console.log("Recovery resolved for:", sanitizedEmail);

      return new Response(
        JSON.stringify({ success: true, message: "Marked as resolved" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: trigger, follow_up, resolve, or list" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch {
    console.log("Payment recovery function error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
