import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

interface ApiResponse {
  ok: boolean;
  messageId?: string;
  message?: string;
  error?: string;
  code?: string;
}

interface RequestResult {
  success: boolean;
  httpStatus: number;
  messageId?: string;
  message: string;
  errorCode?: string;
}

export default function AdminEmailTest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RequestResult | null>(null);

  const handleSendTest = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke<ApiResponse>("send-test-email", {
        body: { to: email.trim() },
      });

      // Supabase client error (network, function not found, etc.)
      if (error) {
        console.error("Supabase invoke error:", error);
        setResult({
          success: false,
          httpStatus: 500,
          message: error.message || "Failed to call edge function",
          errorCode: "INVOKE_ERROR",
        });
        toast.error("Failed to call edge function");
        return;
      }

      // Edge function returned an error response
      if (data && !data.ok) {
        setResult({
          success: false,
          httpStatus: 200,
          message: data.error || "Unknown error",
          errorCode: data.code,
        });
        toast.error(data.error || "Failed to send email");
        return;
      }

      // Success
      if (data?.ok) {
        setResult({
          success: true,
          httpStatus: 200,
          messageId: data.messageId,
          message: data.message || "Email sent successfully",
        });
        toast.success("Test email sent!");
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setResult({
        success: false,
        httpStatus: 0,
        message: "Network error or function not deployed",
        errorCode: "NETWORK_ERROR",
      });
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-xl mx-auto">
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

            {/* Request/Response Display */}
            {result && (
              <div
                className={`p-4 rounded-lg border ${
                  result.success
                    ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{result.message}</p>
                    <div className="text-xs opacity-75 space-y-0.5">
                      <p>HTTP Status: {result.httpStatus}</p>
                      {result.messageId && <p>Message ID: {result.messageId}</p>}
                      {result.errorCode && <p>Error Code: {result.errorCode}</p>}
                    </div>
                  </div>
                </div>
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
    </AdminLayout>
  );
}
