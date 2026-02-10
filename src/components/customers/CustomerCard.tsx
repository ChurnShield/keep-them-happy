import { CustomerWithRisk } from '@/hooks/useCustomers';
import { Card, CardContent } from '@/components/ui/card';
import { RiskBadge } from './RiskBadge';
import { SignalsList } from './SignalsList';
import { User, Mail, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomerCardProps {
  customer: CustomerWithRisk;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={() => navigate(`/dashboard/customer/${customer.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {customer.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{customer.email}</span>
              </div>
            </div>
          </div>
          <RiskBadge level={customer.riskLevel} size="sm" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(customer.plan_amount)}/mo</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Active: {formatDate(customer.last_active_at)}</span>
          </div>
        </div>

        {customer.signals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Risk Signals:</p>
            <SignalsList signals={customer.signals} variant="inline" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
