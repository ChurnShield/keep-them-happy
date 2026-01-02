import { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsDropdown } from '@/components/SettingsDropdown';
import { StripeConnectionIndicator } from '@/components/StripeConnectionIndicator';
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemUI,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItemData {
  label: string;
  href?: string;
}

interface ProtectedLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  showLogo?: boolean;
  headerContent?: ReactNode;
  className?: string;
  breadcrumbs?: BreadcrumbItemData[];
}

export function ProtectedLayout({
  children,
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  showLogo = false,
  headerContent,
  className = '',
  breadcrumbs,
}: ProtectedLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen bg-background relative overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      
      <div className="relative container max-w-6xl py-8 px-4 sm:px-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {backTo && !breadcrumbs && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate(backTo)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {backLabel}
                </Button>
              )}
              
              {showLogo && (
                <div 
                  className="flex items-center gap-2 cursor-pointer" 
                  onClick={() => navigate('/')}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-lg font-bold hidden sm:inline">
                    <span className="text-foreground">Churn</span>
                    <span className="text-primary">Shield</span>
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <StripeConnectionIndicator />
              <SettingsDropdown />
            </div>
          </div>

          {/* Breadcrumbs - only shown on detail pages */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <BreadcrumbItemUI key={index}>
                    {index > 0 && <BreadcrumbSeparator />}
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItemUI>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            
            {headerContent && (
              <div className="flex items-center gap-2">
                {headerContent}
              </div>
            )}
          </div>
        </header>
        
        {/* Main Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}