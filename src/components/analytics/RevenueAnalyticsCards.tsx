import { TrendingUp, Receipt, PiggyBank, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueAnalyticsCardsProps {
  totalSaved: number;
  totalFees: number;
  totalSavesCount: number;
  monthSavesCount: number;
  loading?: boolean;
}

export function RevenueAnalyticsCards({
  totalSaved,
  totalFees,
  totalSavesCount,
  monthSavesCount,
  loading = false,
}: RevenueAnalyticsCardsProps) {
  const netBenefit = totalSaved - totalFees;
  
  // ROI calculation with edge cases
  let roiText = 'No fees yet';
  if (totalFees > 0) {
    const roi = Math.round((totalSaved / totalFees) * 10) / 10;
    roiText = `${roi}x ROI`;
  } else if (totalSaved > 0) {
    roiText = '∞ ROI';
  }

  const formatCurrency = (amount: number) => 
    amount.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Revenue Saved */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Revenue Saved
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(totalSaved)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Lifetime total
          </p>
        </CardContent>
      </Card>

      {/* Card 2: ChurnShield Fees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            ChurnShield Fees
          </CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(totalFees)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your investment
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Net Benefit */}
      <Card className={netBenefit > 0 ? 'border-green-500/30 bg-green-500/5' : ''}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Benefit
          </CardTitle>
          <PiggyBank className={`h-4 w-4 ${netBenefit > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${netBenefit > 0 ? 'text-green-500' : ''}`}>
            {formatCurrency(netBenefit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {roiText}
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Customers Saved */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Customers Saved
          </CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalSavesCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {monthSavesCount} this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
