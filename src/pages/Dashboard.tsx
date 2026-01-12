import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  Loader2,
  ShieldAlert,
  CheckCircle,
  Inbox,
  Activity,
  DollarSign,
  TrendingUp,
  BookOpen,
  PanelRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/useSubscription';
import { useCustomers } from '@/hooks/useCustomers';
import { useRecoveredRevenue } from '@/hooks/useRecoveredRevenue';
import { CustomerList } from '@/components/customers/CustomerList';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedLayout } from '@/components/ProtectedLayout';

// Mock customer data generator
const generateMockCustomers = (userId: string) => [
  {
    user_id: userId,
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    last_active_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    subscription_status: 'active',
    plan_amount: 9900,
  },
  {
    user_id: userId,
    name: 'TechStart Inc',
    email: 'admin@techstart.io',
    last_active_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    subscription_status: 'past_due',
    plan_amount: 4900,
  },
  {
    user_id: userId,
    name: 'Global Solutions',
    email: 'accounts@globalsol.com',
    last_active_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    subscription_status: 'canceled',
    plan_amount: 19900,
    canceled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    user_id: userId,
    name: 'Healthy Business',
    email: 'team@healthybiz.co',
    last_active_at: new Date().toISOString(), // Today
    subscription_status: 'active',
    plan_amount: 9900,
  },
  {
    user_id: userId,
    name: 'Startup Labs',
    email: 'founder@startuplabs.dev',
    last_active_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
    subscription_status: 'past_due',
    plan_amount: 4900,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();
  const { customers, loading, error, stats, refetch, getAtRiskCustomers } = useCustomers();
  const { summary: recoveredRevenue } = useRecoveredRevenue();
  const [isAddingMock, setIsAddingMock] = useState(false);

  const formatCurrency = (amount: number) => 
    amount.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const handleAddMockData = async () => {
    if (!user) return;
    
    setIsAddingMock(true);
    try {
      const mockData = generateMockCustomers(user.id);
      const { error: insertError } = await supabase
        .from('customers')
        .insert(mockData);

      if (insertError) {
        console.error('Error inserting mock data:', insertError);
        toast.error('Failed to add mock customers');
        return;
      }

      toast.success('Mock customers added successfully!');
      refetch();
    } catch (err) {
      console.error('Error adding mock data:', err);
      toast.error('An error occurred');
    } finally {
      setIsAddingMock(false);
    }
  };

  // Show subscription required message
  if (!subLoading && !hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              You need an active subscription to view churn insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const atRiskCustomers = getAtRiskCustomers();

  return (
    <ProtectedLayout
      title="Churn Dashboard"
      subtitle="Monitor and prevent customer churn with real-time insights"
      showLogo
    >

        {/* Recovered Revenue Section */}
        {(recoveredRevenue.lifetimeRecovered > 0 || recoveredRevenue.lifetimeCount > 0) && (
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-2 mb-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue Recovered
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(recoveredRevenue.lifetimeRecovered)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime total
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cases Recovered
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {recoveredRevenue.lifetimeCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {recoveredRevenue.currentMonthCount > 0 
                    ? `${recoveredRevenue.currentMonthCount} this month` 
                    : 'Lifetime total'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Being monitored
              </p>
            </CardContent>
          </Card>

          {/* At-Risk Count */}
          <Card className={stats.atRisk > 0 ? 'border-orange-500/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                At-Risk
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${stats.atRisk > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.atRisk > 0 ? 'text-orange-500' : ''}`}>
                {stats.atRisk}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Need attention
              </p>
            </CardContent>
          </Card>

          {/* High Risk */}
          <Card className={stats.highRisk > 0 ? 'border-red-500/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Risk
              </CardTitle>
              <ShieldAlert className={`h-4 w-4 ${stats.highRisk > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.highRisk > 0 ? 'text-red-500' : ''}`}>
                {stats.highRisk}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Critical priority
              </p>
            </CardContent>
          </Card>

          {/* Healthy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Healthy
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {stats.total - stats.atRisk}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No risk signals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customers Section */}
        <Tabs defaultValue="at-risk" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="at-risk" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                At Risk
                {stats.atRisk > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {stats.atRisk}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Users className="h-4 w-4" />
                All Customers
              </TabsTrigger>
            </TabsList>

            {customers.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddMockData}
                disabled={isAddingMock}
              >
                {isAddingMock ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add More Mock Data'
                )}
              </Button>
            )}
          </div>

          <TabsContent value="at-risk" className="mt-6">
            {atRiskCustomers.length === 0 && stats.total > 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500/50" />
                  <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">
                    None of your customers are showing churn risk signals.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <CustomerList 
                customers={atRiskCustomers} 
                loading={loading} 
                error={error}
                onAddMockData={handleAddMockData}
                isAddingMock={isAddingMock}
              />
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <CustomerList 
              customers={customers} 
              loading={loading} 
              error={error}
              onAddMockData={handleAddMockData}
              isAddingMock={isAddingMock}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        {stats.total > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Navigate to detailed views
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button 
                variant="default"
                onClick={() => navigate('/recovery')}
              >
                <Inbox className="h-4 w-4 mr-2" />
                Recovery Inbox
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/cancel-flow')}
              >
                <PanelRight className="h-4 w-4 mr-2" />
                Cancel Flow Builder
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard/integration')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Integration Guide
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/connect-stripe')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Stripe Connection
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/churn-risk')}
              >
                <Activity className="h-4 w-4 mr-2" />
                Advanced Churn Analysis
              </Button>
            </CardContent>
          </Card>
        )}
    </ProtectedLayout>
  );
}
