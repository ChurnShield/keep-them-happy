import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, Play, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AdminLayout } from "@/components/AdminLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecoveryCase {
  id: string;
  invoice_reference: string | null;
  customer_reference: string;
  amount_at_risk: number;
  status: string;
  churn_reason: string;
  opened_at: string;
  deadline_at: string;
  resolved_at: string | null;
}

interface ChurnRiskEvent {
  id: string;
  event_type: string;
  severity: number;
  stripe_object_id: string | null;
  occurred_at: string;
}

export default function AdminWebhookTests() {
  const [recoveryCases, setRecoveryCases] = useState<RecoveryCase[]>([]);
  const [churnEvents, setChurnEvents] = useState<ChurnRiskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [simulating, setSimulating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [casesResult, eventsResult] = await Promise.all([
        supabase
          .from("recovery_cases")
          .select("id, invoice_reference, customer_reference, amount_at_risk, status, churn_reason, opened_at, deadline_at, resolved_at")
          .order("opened_at", { ascending: false })
          .limit(20),
        supabase
          .from("churn_risk_events")
          .select("id, event_type, severity, stripe_object_id, occurred_at")
          .order("occurred_at", { ascending: false })
          .limit(20),
      ]);

      if (casesResult.error) throw casesResult.error;
      if (eventsResult.error) throw eventsResult.error;

      setRecoveryCases(casesResult.data || []);
      setChurnEvents(eventsResult.data || []);
      toast({ title: "Data refreshed", description: `${casesResult.data?.length || 0} cases, ${eventsResult.data?.length || 0} events` });
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({ title: "Error fetching data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCases = recoveryCases.filter(c => c.status === 'open');

  const handleSimulateRecovery = async () => {
    if (!selectedCaseId) {
      toast({ title: "Select a case", description: "Please select an open recovery case to simulate", variant: "destructive" });
      return;
    }

    setSimulating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('simulate-recovery-attribution', {
        body: { recovery_case_id: selectedCaseId },
      });

      if (error) throw error;

      toast({
        title: "Recovery simulated!",
        description: `Recovered $${data.amount_recovered} ${data.currency}`,
      });

      setSelectedCaseId("");
      await fetchData();
    } catch (error: any) {
      console.error("Simulation error:", error);
      toast({ 
        title: "Simulation failed", 
        description: error.message || "Unknown error", 
        variant: "destructive" 
      });
    } finally {
      setSimulating(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return format(new Date(date), "MMM d, HH:mm:ss");
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "open": return "default";
      case "recovered": return "secondary";
      case "expired": return "destructive";
      default: return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Webhook E2E Verification</h1>
            <p className="text-muted-foreground text-sm">Admin-only QA page for recovery case + churn event inspection</p>
          </div>
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Manual Recovery Simulation Card */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Simulate Recovery Attribution
            </CardTitle>
            <CardDescription>
              Test the recovery flow without triggering Stripe webhooks. Select an open case to mark as recovered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger className="w-[400px]">
                  <SelectValue placeholder={openCases.length === 0 ? "No open cases available" : "Select an open recovery case..."} />
                </SelectTrigger>
                <SelectContent>
                  {openCases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono text-xs">{c.id.slice(0, 8)}...</span>
                      <span className="ml-2">{c.customer_reference}</span>
                      <span className="ml-2 text-muted-foreground">${Number(c.amount_at_risk).toFixed(2)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSimulateRecovery} 
                disabled={simulating || !selectedCaseId || openCases.length === 0}
              >
                {simulating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Simulate Recovery
              </Button>
            </div>
            {openCases.length === 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                No open recovery cases to simulate. Create a test case first.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recovery Cases Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recovery Cases (latest 20)</CardTitle>
          </CardHeader>
          <CardContent>
            {recoveryCases.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                No recovery cases found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Invoice Ref</TableHead>
                      <TableHead>Customer Ref</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Resolved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recoveryCases.map((rc) => (
                      <TableRow key={rc.id}>
                        <TableCell className="font-mono text-xs">{rc.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-mono text-xs">{rc.invoice_reference || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{rc.customer_reference}</TableCell>
                        <TableCell className="text-right font-medium">${Number(rc.amount_at_risk).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(rc.status)}>{rc.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{rc.churn_reason}</TableCell>
                        <TableCell className="text-xs">{formatDate(rc.opened_at)}</TableCell>
                        <TableCell className="text-xs">{formatDate(rc.deadline_at)}</TableCell>
                        <TableCell className="text-xs">{formatDate(rc.resolved_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Churn Risk Events Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Churn Risk Events (latest 20)</CardTitle>
          </CardHeader>
          <CardContent>
            {churnEvents.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                No churn risk events found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead className="text-center">Severity</TableHead>
                      <TableHead>Stripe Object ID</TableHead>
                      <TableHead>Occurred At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churnEvents.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-mono text-sm">{ev.event_type}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={ev.severity >= 80 ? "destructive" : ev.severity >= 50 ? "default" : "secondary"}>
                            {ev.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{ev.stripe_object_id || "—"}</TableCell>
                        <TableCell className="text-xs">{formatDate(ev.occurred_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
