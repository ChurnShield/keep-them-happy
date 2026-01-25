import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SavedCustomerRecord {
  id: string;
  created_at: string;
  save_type: string;
  original_mrr: number;
  new_mrr: number;
  churnshield_fee_per_month: number | null;
  discount_percentage: number | null;
  pause_months: number | null;
  exit_reason: string | null;
  stripe_action_id?: string | null;
}

interface SavedCustomersTableProps {
  records: SavedCustomerRecord[];
  loading?: boolean;
}

export function SavedCustomersTable({ records, loading = false }: SavedCustomersTableProps) {
  const formatCurrency = (amount: number) => 
    amount.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Filter to only show records with actual Stripe actions
  const validRecords = records.filter(r => 
    r.stripe_action_id !== null || r.original_mrr > 0
  );

  if (validRecords.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No saved customers yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            When you retain customers through ChurnShield, they'll appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Saves</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead className="text-right">Saved</TableHead>
              <TableHead className="text-right">Fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validRecords.slice(0, 10).map((save) => {
              const savedAmount = save.save_type === 'pause'
                ? save.original_mrr
                : (save.original_mrr - save.new_mrr);

              const offerText = save.save_type === 'pause'
                ? `Pause${save.pause_months ? `: ${save.pause_months}mo` : ''}`
                : `Discount${save.discount_percentage ? `: ${save.discount_percentage}%` : ''}`;

              const reasonText = save.exit_reason
                ? save.exit_reason
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                : '—';

              return (
                <TableRow key={save.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(save.created_at).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>{reasonText}</TableCell>
                  <TableCell>
                    <Badge variant={save.save_type === 'pause' ? 'secondary' : 'default'}>
                      {offerText}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {formatCurrency(savedAmount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(save.churnshield_fee_per_month || 0)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {validRecords.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Showing 10 of {validRecords.length} saved customers
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
