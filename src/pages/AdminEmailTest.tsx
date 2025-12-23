import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminEmailTest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-test-email", {
        body: { to: email.trim() },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        if (data.code === "MISSING_API_KEY") {
          setLastResult({
            success: false,
            message: "Missing RESEND_API_KEY in environment settings.",
          });
        } else if (data.code === "RATE_LIMITED") {
          setLastResult({
            success: false,
            message: "Rate limited. Max 3 emails per hour. Please wait and try again.",
          });
        } else if (data.code === "INVALID_EMAIL") {
          setLastResult({
            success: false,
            message: "Invalid email address format.",
          });
        } else {
          setLastResult({
            success: false,
            message: data.error || "Failed to send email.",
          });
        }
        toast.error(data.error);
      } else if (data?.success) {
        setLastResult({
          success: true,
          message: `Test email sent successfully! Check ${email} inbox.`,
        });
        toast.success("Test email sent!");
      }
    } catch (err: any) {
      console.log("Email send error:", err?.message);
      setLastResult({
        success: false,
        message: "Failed to send email. Check if the edge function is deployed.",
      });
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Email Test</CardTitle>
                <CardDescription>
                  Send a test email to verify Resend is configured correctly
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Recipient Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleSendTest}
              disabled={loading || !email.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send test email
                </>
              )}
            </Button>

            {lastResult && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  lastResult.success
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {lastResult.success ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{lastResult.message}</p>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Setup Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• RESEND_API_KEY must be set in Lovable Cloud secrets</li>
                <li>• Uses onboarding@resend.dev sender (no domain needed)</li>
                <li>• Rate limited to 3 emails per hour</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
