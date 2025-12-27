import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CreditCard, Mail, Webhook, ArrowLeft, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

interface AdminCounts {
  openRecoveryCases: number;
  recentChurnEvents: number;
  pendingPayments: number;
}

interface RecentActivity {
  paymentRecovery: Array<{ id: string; email: string; status: string; created_at: string }>;
  recoveryCases: Array<{ id: string; customer_reference: string; amount_at_risk: number; opened_at: string }>;
  churnEvents: Array<{ id: string; event_type: string; severity: number; occurred_at: string }>;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [counts, setCounts] = useState<AdminCounts>({
    openRecoveryCases: 0,
    recentChurnEvents: 0,
    pendingPayments: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    paymentRecovery: [],
    recoveryCases: [],
    churnEvents: [],
  });
  const [animatingBadges, setAnimatingBadges] = useState<Set<string>>(new Set());
  const prevCountsRef = useRef<AdminCounts | null>(null);
  const isInitialLoad = useRef(true);

  const fetchCounts = useCallback(async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [recoveryCasesResult, churnEventsResult, paymentRecoveryResult] = await Promise.all([
        supabase
          .from("recovery_cases")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        supabase
          .from("churn_risk_events")
          .select("id", { count: "exact", head: true })
          .gte("occurred_at", oneDayAgo),
        supabase
          .from("payment_recovery")
          .select("id", { count: "exact", head: true })
          .neq("status", "resolved"),
      ]);

      const newCounts = {
        openRecoveryCases: recoveryCasesResult.count || 0,
        recentChurnEvents: churnEventsResult.count || 0,
        pendingPayments: paymentRecoveryResult.count || 0,
      };

      // Detect which badges changed (skip on initial load)
      if (!isInitialLoad.current && prevCountsRef.current) {
        const changedBadges = new Set<string>();
        
        if (prevCountsRef.current.pendingPayments !== newCounts.pendingPayments) {
          changedBadges.add("/admin/payment-recovery");
        }
        
        const prevWebhookCount = prevCountsRef.current.openRecoveryCases + prevCountsRef.current.recentChurnEvents;
        const newWebhookCount = newCounts.openRecoveryCases + newCounts.recentChurnEvents;
        if (prevWebhookCount !== newWebhookCount) {
          changedBadges.add("/admin/webhook-tests");
        }

        if (changedBadges.size > 0) {
          setAnimatingBadges(changedBadges);
          setTimeout(() => setAnimatingBadges(new Set()), 1000);
        }
      }

      prevCountsRef.current = newCounts;
      isInitialLoad.current = false;
      setCounts(newCounts);
    } catch (error) {
      console.error("Failed to fetch admin counts:", error);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [paymentResult, casesResult, eventsResult] = await Promise.all([
        supabase
          .from("payment_recovery")
          .select("id, email, status, created_at")
          .neq("status", "resolved")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("recovery_cases")
          .select("id, customer_reference, amount_at_risk, opened_at")
          .eq("status", "open")
          .order("opened_at", { ascending: false })
          .limit(5),
        supabase
          .from("churn_risk_events")
          .select("id, event_type, severity, occurred_at")
          .gte("occurred_at", oneDayAgo)
          .order("occurred_at", { ascending: false })
          .limit(5),
      ]);

      setRecentActivity({
        paymentRecovery: paymentResult.data || [],
        recoveryCases: casesResult.data || [],
        churnEvents: eventsResult.data || [],
      });
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchRecentActivity();

    const channel = supabase
      .channel("admin-counts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recovery_cases" },
        () => { fetchCounts(); fetchRecentActivity(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "churn_risk_events" },
        () => { fetchCounts(); fetchRecentActivity(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_recovery" },
        () => { fetchCounts(); fetchRecentActivity(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCounts, fetchRecentActivity]);

  const adminLinks = [
    { 
      path: "/admin/payment-recovery", 
      label: "Payment Recovery", 
      icon: CreditCard,
      count: counts.pendingPayments,
      activityKey: "payment" as const,
    },
    { 
      path: "/admin/email-test", 
      label: "Email Test", 
      icon: Mail,
      count: 0,
      activityKey: null,
    },
    { 
      path: "/admin/webhook-tests", 
      label: "Webhook Tests", 
      icon: Webhook,
      count: counts.openRecoveryCases + counts.recentChurnEvents,
      activityKey: "webhook" as const,
    },
  ];

  const renderActivityDropdown = (activityKey: "payment" | "webhook" | null) => {
    if (activityKey === "payment") {
      const items = recentActivity.paymentRecovery;
      if (items.length === 0) {
        return <p className="text-sm text-muted-foreground p-2">No pending payments</p>;
      }
      return (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Pending Payments</p>
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
              <DollarSign className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.email}</p>
                <p className="text-xs text-muted-foreground">
                  {item.status} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activityKey === "webhook") {
      const cases = recentActivity.recoveryCases;
      const events = recentActivity.churnEvents;
      
      if (cases.length === 0 && events.length === 0) {
        return <p className="text-sm text-muted-foreground p-2">No recent activity</p>;
      }
      
      return (
        <div className="space-y-3">
          {cases.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Recovery Cases</p>
              {cases.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.customer_reference}</p>
                    <p className="text-xs text-muted-foreground">
                      ${Number(item.amount_at_risk).toFixed(2)} · {formatDistanceToNow(new Date(item.opened_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {events.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Churn Events (24h)</p>
              {events.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.event_type}</p>
                    <p className="text-xs text-muted-foreground">
                      Severity {item.severity} · {formatDistanceToNow(new Date(item.occurred_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Navigation Bar */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm font-semibold text-foreground">Admin Panel</span>
            </div>
            <div className="flex items-center gap-1">
              {adminLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                const isAnimating = animatingBadges.has(link.path);
                const hasBadge = link.count > 0;
                const hasDropdown = link.activityKey && hasBadge;

                return (
                  <div key={link.path} className="flex items-center">
                    <Link
                      to={link.path}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                    {hasBadge && (
                      hasDropdown ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className="ml-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Badge 
                                variant={isActive ? "secondary" : "destructive"} 
                                className={cn(
                                  "h-5 min-w-5 px-1.5 text-xs transition-all cursor-pointer hover:opacity-80",
                                  isAnimating && "animate-pulse ring-2 ring-destructive/50 ring-offset-1"
                                )}
                              >
                                {link.count}
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-72 p-3 bg-popover border border-border shadow-lg z-50" 
                            align="end"
                            sideOffset={8}
                          >
                            {renderActivityDropdown(link.activityKey)}
                            <div className="mt-3 pt-2 border-t">
                              <Link 
                                to={link.path}
                                className="text-xs text-primary hover:underline"
                              >
                                View all →
                              </Link>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Badge 
                          variant={isActive ? "secondary" : "destructive"} 
                          className={cn(
                            "ml-1 h-5 min-w-5 px-1.5 text-xs transition-all",
                            isAnimating && "animate-pulse ring-2 ring-destructive/50 ring-offset-1"
                          )}
                        >
                          {link.count}
                        </Badge>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {children}
    </div>
  );
}
