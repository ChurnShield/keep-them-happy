import { CustomerWithRisk } from '@/hooks/useCustomers';
import { CustomerCard } from './CustomerCard';
import { Users, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerListProps {
  customers: CustomerWithRisk[];
  loading: boolean;
  error: string | null;
  onAddMockData?: () => void;
  isAddingMock?: boolean;
}

export function CustomerList({ customers, loading, error, onAddMockData, isAddingMock }: CustomerListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Failed to Load Customers</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{error}</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">No Customers Yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Connect your Stripe account or add mock data to see your customers and their churn risk.
        </p>
        {onAddMockData && (
          <Button onClick={onAddMockData} className="mt-4" disabled={isAddingMock}>
            {isAddingMock ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Mock Customers'
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {customers.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
}
