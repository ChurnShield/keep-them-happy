import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  Users,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useAtRiskCustomers, getScoreColor } from '@/hooks/useChurnDashboard';
import { useSubscription } from '@/hooks/useSubscription';
import { formatDistanceToNow } from 'date-fns';
import { SettingsDropdown } from '@/components/SettingsDropdown';

export default function AtRiskCustomers() {
  const navigate = useNavigate();
  const { data: customers, isLoading, error } = useAtRiskCustomers();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();

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

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-foreground">At-Risk Customers</h1>
            <p className="text-muted-foreground mt-1">
              Customers with churn risk score of 50 or higher
            </p>
          </div>
          <SettingsDropdown />
        </div>

        {/* Stats */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Customers at risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {customers && customers.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                Sorted by risk score (highest first)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Risk Factors</TableHead>
                    <TableHead>Last Event</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.userId}>
                      <TableCell className="font-medium">
                        {customer.email}
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getScoreColor(customer.score)}`}>
                          {customer.score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {customer.topReasons.slice(0, 2).map((reason, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary"
                              className="text-xs"
                            >
                              {reason}
                            </Badge>
                          ))}
                          {customer.topReasons.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{customer.topReasons.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.lastEventTime ? (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(customer.lastEventTime), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/customer/${customer.userId}`)}
                        >
                          View
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No At-Risk Customers</h3>
              <p className="text-muted-foreground mb-4">
                Great news! None of your customers are currently at high risk of churning.
              </p>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
