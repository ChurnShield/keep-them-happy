import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CreditCard, Mail, Webhook, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface AdminCounts {
  openRecoveryCases: number;
  recentChurnEvents: number;
  pendingPayments: number;
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

  useEffect(() => {
    const fetchCounts = async () => {
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

        setCounts({
          openRecoveryCases: recoveryCasesResult.count || 0,
          recentChurnEvents: churnEventsResult.count || 0,
          pendingPayments: paymentRecoveryResult.count || 0,
        });
      } catch (error) {
        console.error("Failed to fetch admin counts:", error);
      }
    };

    fetchCounts();
  }, []);

  const adminLinks = [
    { 
      path: "/admin/payment-recovery", 
      label: "Payment Recovery", 
      icon: CreditCard,
      count: counts.pendingPayments,
    },
    { 
      path: "/admin/email-test", 
      label: "Email Test", 
      icon: Mail,
      count: 0,
    },
    { 
      path: "/admin/webhook-tests", 
      label: "Webhook Tests", 
      icon: Webhook,
      count: counts.openRecoveryCases + counts.recentChurnEvents,
    },
  ];

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
                return (
                  <Link
                    key={link.path}
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
                    {link.count > 0 && (
                      <Badge 
                        variant={isActive ? "secondary" : "destructive"} 
                        className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                      >
                        {link.count}
                      </Badge>
                    )}
                  </Link>
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
