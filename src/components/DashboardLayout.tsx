import { ReactNode, useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { SettingsDropdown } from '@/components/SettingsDropdown';
import { StripeConnectionIndicator } from '@/components/StripeConnectionIndicator';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerContent?: ReactNode;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  headerContent,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop only */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50">
            <DashboardSidebar />
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="lg:pl-56 transition-all duration-300">
        {/* Background gradient */}
        <div className="fixed inset-0 hero-glow pointer-events-none" />
        
        <div className="relative min-h-screen">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile menu toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
                
                {/* Mobile logo */}
                <div 
                  className="flex items-center gap-2 cursor-pointer lg:hidden" 
                  onClick={() => navigate('/dashboard')}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                </div>

                <div className="hidden sm:block">
                  <h1 className="text-xl font-semibold text-foreground">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                {headerContent}
                <StripeConnectionIndicator />
                <SettingsDropdown />
              </div>
            </div>
            
            {/* Mobile title - shown below header on small screens */}
            <div className="sm:hidden px-4 pb-3">
              <h1 className="text-lg font-semibold text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </header>
          
          {/* Page Content */}
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
