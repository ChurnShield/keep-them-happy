import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Send, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

interface RecoveryRecord {
  id: string;
  email: string;
  status: "needs_payment" | "emailed_1" | "emailed_2" | "resolved";
  last_emailed_at: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  needs_payment: { label: "Needs Payment", variant: "destructive" as const, icon: AlertCircle },
  emailed_1: { label: "Email #1 Sent", variant: "default" as const, icon: Mail },
  emailed_2: { label: "Email #2 Sent", variant: "secondary" as const, icon: Mail },
  resolved: { label: "Resolved", variant: "outline" as const, icon: CheckCircle },
};

export default function AdminPaymentRecovery() {
  const [records, setRecords] = useState<RecoveryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggerEmail, setTriggerEmail] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("payment-recovery", {
        body: { action: "list" },
      });

      if (error) throw error;
      setRecords(data.records || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch recovery records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleTrigger = async () => {
    if (!triggerEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setActionLoading("trigger");
    try {
      const { data, error } = await supabase.functions.invoke("payment-recovery", {
        body: { action: "trigger", email: triggerEmail.trim() },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Cannot trigger",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Recovery email #1 sent successfully",
      });
      setTriggerEmail("");
      fetchRecords();
    } catch {
      toast({
        title: "Error",
        description: "Failed to trigger recovery flow",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFollowUp = async (email: string) => {
    setActionLoading(email + "-followup");
    try {
      const { data, error } = await supabase.functions.invoke("payment-recovery", {
        body: { action: "follow_up", email },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Cannot send follow-up",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Follow-up email sent successfully",
      });
      fetchRecords();
    } catch {
      toast({
        title: "Error",
        description: "Failed to send follow-up email",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (email: string) => {
    setActionLoading(email + "-resolve");
    try {
      const { data, error } = await supabase.functions.invoke("payment-recovery", {
        body: { action: "resolve", email },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Cannot resolve",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Marked as resolved",
      });
      fetchRecords();
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark as resolved",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const canSendFollowUp = (record: RecoveryRecord): boolean => {
    if (record.status !== "emailed_1") return false;
    if (record.attempt_count >= 2) return false;
    if (!record.last_emailed_at) return false;

    const hoursSinceLastEmail = (Date.now() - new Date(record.last_emailed_at).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastEmail >= 48;
  };

  const getTimeUntilFollowUp = (record: RecoveryRecord): string | null => {
    if (record.status !== "emailed_1" || !record.last_emailed_at) return null;
    
    const hoursSinceLastEmail = (Date.now() - new Date(record.last_emailed_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastEmail >= 48) return null;
    
    const hoursRemaining = Math.ceil(48 - hoursSinceLastEmail);
    return `${hoursRemaining}h until follow-up allowed`;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Recovery</h1>
            <p className="text-muted-foreground mt-1">Manage failed payment recovery emails</p>
          </div>
          <Button onClick={fetchRecords} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Trigger New Recovery */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Simulate Failed Payment</CardTitle>
            <CardDescription>
              Trigger a recovery flow for a test email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter email address"
                value={triggerEmail}
                onChange={(e) => setTriggerEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleTrigger} 
                disabled={actionLoading === "trigger"}
              >
                {actionLoading === "trigger" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Trigger Recovery
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recovery Records</CardTitle>
            <CardDescription>
              {records.length} total records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recovery records yet. Trigger a recovery above to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {records.map((record) => {
                  const config = statusConfig[record.status];
                  const StatusIcon = config.icon;
                  const timeUntilFollowUp = getTimeUntilFollowUp(record);

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{record.email}</span>
                          <Badge variant={config.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Attempts: {record.attempt_count}/2
                          {record.last_emailed_at && (
                            <> · Last email: {new Date(record.last_emailed_at).toLocaleString()}</>
                          )}
                          {timeUntilFollowUp && (
                            <span className="ml-2 text-amber-600">({timeUntilFollowUp})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {record.status === "emailed_1" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFollowUp(record.email)}
                            disabled={!canSendFollowUp(record) || actionLoading === record.email + "-followup"}
                          >
                            {actionLoading === record.email + "-followup" ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              "Send Follow-up"
                            )}
                          </Button>
                        )}
                        {record.status !== "resolved" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleResolve(record.email)}
                            disabled={actionLoading === record.email + "-resolve"}
                          >
                            {actionLoading === record.email + "-resolve" ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <><CheckCircle className="h-4 w-4 mr-1" /> Resolve</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
