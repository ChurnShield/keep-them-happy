import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  company: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, company }: WelcomeEmailRequest = await req.json();
    
    console.log(`Sending welcome email to ${email} from ${company}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ChurnShield <onboarding@resend.dev>",
        to: [email],
        subject: "You're on the ChurnShield waitlist! 🛡️",
        html: `
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
                  <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #111827 0%, #1a2744 100%); border-radius: 16px; border: 1px solid #1e3a5f; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 40px 30px 40px; text-align: center;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; margin: 0 auto 24px;">
                          <span style="font-size: 28px; line-height: 60px;">🛡️</span>
                        </div>
                        <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Welcome to ChurnShield!</h1>
                        <p style="color: #94a3b8; font-size: 16px; margin: 0;">You're on the list for early access</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Hey there! 👋
                        </p>
                        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                          Thanks for signing up <strong style="color: #22c55e;">${company}</strong> for ChurnShield's risk-free trial. We're excited to help you reduce churn and keep more customers.
                        </p>
                        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                          We'll be in touch shortly with next steps to get you started. In the meantime, here's what you can expect:
                        </p>
                        <ul style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                          <li>✅ No upfront costs – only pay when we save you revenue</li>
                          <li>✅ Early detection of at-risk customers</li>
                          <li>✅ Actionable insights to reduce churn</li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #1e3a5f;">
                        <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                          Questions? Just reply to this email.<br>
                          <span style="color: #475569;">— The ChurnShield Team</span>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${errorData}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
