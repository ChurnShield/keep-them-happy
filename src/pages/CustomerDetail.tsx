import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2,
  User,
  CreditCard,
  Calendar,
  Mail,
  DollarSign,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { RiskBadge } from '@/components/customers/RiskBadge';
import { SignalsList } from '@/components/customers/SignalsList';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { enrichCustomerWithRisk, CustomerWithRisk } from '@/hooks/useCustomers';
import { ProtectedLayout } from '@/components/ProtectedLayout';

export default function CustomerDetail() {
  const { userId: customerId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [customer, setCustomer] = useState<CustomerWithRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user || !customerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching customer:', fetchError);
          setError('Failed to load customer');
          return;
        }

        if (!data) {
          setError('Customer not found');
          return;
        }

        setCustomer(enrichCustomerWithRisk(data as Customer));
      } catch (err) {
        console.error('Customer fetch error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchCustomer();
    }
  }, [customerId, user, authLoading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'past_due':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Customer Not Found</CardTitle>
            <CardDescription>
              {error || 'Unable to load customer details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedLayout
      title={customer.name}
      backTo="/dashboard"
      backLabel="Back to Dashboard"
      headerContent={<RiskBadge level={customer.riskLevel} />}
    >
      <div className="flex items-center gap-4 mb-6 -mt-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          <User className="h-7 w-7" />
        </div>
        <p className="text-muted-foreground flex items-center gap-1">
          <Mail className="h-4 w-4" />
          {customer.email}
        </p>
      </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(customer.subscription_status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan Amount</span>
                  <span className="flex items-center gap-1 font-medium">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(customer.plan_amount)}/mo
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Active</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {customer.last_active_at 
                      ? format(new Date(customer.last_active_at), 'MMM d, yyyy')
                      : 'Never'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer Since</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(customer.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                {customer.canceled_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Canceled On</span>
                    <span className="flex items-center gap-1 text-destructive">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(customer.canceled_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Risk Summary
                </CardTitle>
                <CardDescription>
                  {customer.signals.length === 0 
                    ? 'This customer shows no risk signals'
                    : `${customer.signals.length} risk signal${customer.signals.length > 1 ? 's' : ''} detected`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignalsList signals={customer.signals} variant="inline" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Risk Timeline
              </CardTitle>
              <CardDescription>
                Detailed breakdown of churn risk factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignalsList signals={customer.signals} variant="timeline" />
            </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
