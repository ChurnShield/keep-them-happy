import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, AlertTriangle, CheckCircle2, Loader2, Bell, Sparkles } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface NotificationResult {
  success: boolean;
  message: string;
  messageId?: string;
}

export default function AdminEmailTest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RequestResult | null>(null);
  
  // Save notification test state
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifResult, setNotifResult] = useState<NotificationResult | null>(null);
  const [saveType, setSaveType] = useState<"discount" | "pause">("discount");
  const [originalMrr, setOriginalMrr] = useState("99");
  const [discountPct, setDiscountPct] = useState("25");
  const [pauseMonths, setPauseMonths] = useState("1");
  const [exitReason, setExitReason] = useState("too_expensive");

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

      if (data?.ok) {
        setResult({
          success: true,
          httpStatus: 200,
          messageId: data.messageId,
          message: data.message || "Email sent successfully",
        });
        toast.success("Test email sent!");
      }
    } catch (err: unknown) {
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

  const handleSendNotification = async () => {
    setNotifLoading(true);
    setNotifResult(null);

    try {
      const mrr = parseFloat(originalMrr) || 99;
      const discount = parseFloat(discountPct) || 25;
      const pause = parseInt(pauseMonths) || 1;
      
      const newMrr = saveType === "pause" ? 0 : mrr * (1 - discount / 100);
      
      const { data, error } = await supabase.functions.invoke<NotificationResult>("test-save-notification", {
        body: {
          saveType,
          originalMrr: mrr,
          newMrr,
          exitReason,
          discountPercentage: saveType === "discount" ? discount : null,
          pauseMonths: saveType === "pause" ? pause : null,
        },
      });

      if (error) {
        console.error("Notification error:", error);
        setNotifResult({
          success: false,
          message: error.message || "Failed to send notification",
        });
        toast.error("Failed to send notification");
        return;
      }

      if (data) {
        setNotifResult(data);
        if (data.success) {
          toast.success("Notification email sent!");
        } else {
          toast.error(data.message);
        }
      }
    } catch (err: unknown) {
      console.error("Unexpected error:", err);
      setNotifResult({
        success: false,
        message: "Network error or function not deployed",
      });
      toast.error("Failed to send notification");
    } finally {
      setNotifLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Save Notification Test Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Save Notification Test
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">New</span>
                  </CardTitle>
                  <CardDescription>
                    Test the "Customer Saved" email with mock data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Save Type</label>
                  <Select value={saveType} onValueChange={(v) => setSaveType(v as "discount" | "pause")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="pause">Pause</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Original MRR (£)</label>
                  <Input
                    type="number"
                    value={originalMrr}
                    onChange={(e) => setOriginalMrr(e.target.value)}
                    placeholder="99"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {saveType === "discount" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount %</label>
                    <Input
                      type="number"
                      value={discountPct}
                      onChange={(e) => setDiscountPct(e.target.value)}
                      placeholder="25"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pause Months</label>
                    <Input
                      type="number"
                      value={pauseMonths}
                      onChange={(e) => setPauseMonths(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exit Reason</label>
                  <Select value={exitReason} onValueChange={setExitReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="too_expensive">Too Expensive</SelectItem>
                      <SelectItem value="not_using_enough">Not Using Enough</SelectItem>
                      <SelectItem value="missing_features">Missing Features</SelectItem>
                      <SelectItem value="found_alternative">Found Alternative</SelectItem>
                      <SelectItem value="need_a_break">Need a Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSendNotification}
                disabled={notifLoading}
                className="w-full"
              >
                {notifLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Send Test Notification
                  </>
                )}
              </Button>

              {notifResult && (
                <div
                  className={`p-4 rounded-lg border ${
                    notifResult.success
                      ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notifResult.success ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{notifResult.message}</p>
                      {notifResult.messageId && (
                        <p className="text-xs opacity-75">Message ID: {notifResult.messageId}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Email will be sent to your account email with "[TEST]" prefix in subject.
              </p>
            </CardContent>
          </Card>

          {/* Original Email Test Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Generic Email Test</CardTitle>
                  <CardDescription>
                    Send a basic test email to verify Resend is configured
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
                variant="secondary"
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
