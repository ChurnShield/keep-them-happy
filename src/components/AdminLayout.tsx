import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CreditCard, Mail, Webhook, ArrowLeft } from "lucide-react";

const adminLinks = [
  { path: "/admin/payment-recovery", label: "Payment Recovery", icon: CreditCard },
  { path: "/admin/email-test", label: "Email Test", icon: Mail },
  { path: "/admin/webhook-tests", label: "Webhook Tests", icon: Webhook },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

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
