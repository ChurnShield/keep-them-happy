import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PanelRight, 
  Inbox, 
  Users, 
  Settings,
  Link2,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useStripeConnection } from '@/hooks/useStripeConnection';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresStripe?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Cancel Flow', href: '/cancel-flow', icon: PanelRight },
  { label: 'Recovery Inbox', href: '/recovery', icon: Inbox, requiresStripe: true },
  { label: 'Customers', href: '/dashboard/at-risk', icon: Users, requiresStripe: true },
  { label: 'Connect Stripe', href: '/connect-stripe', icon: Link2 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { isConnected } = useStripeConnection();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold">
              <span className="text-foreground">Churn</span>
              <span className="text-primary">Shield</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const disabled = item.requiresStripe && !isConnected;
          
          // Hide Connect Stripe link if already connected
          if (item.href === '/connect-stripe' && isConnected) {
            return null;
          }

          return (
            <Button
              key={item.href}
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                collapsed && "justify-center px-2",
                active && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !disabled && navigate(item.href)}
              disabled={disabled}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
