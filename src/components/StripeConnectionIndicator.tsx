import { Link } from 'react-router-dom';
import { Link2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStripeConnection } from '@/hooks/useStripeConnection';

export function StripeConnectionIndicator() {
  const { isConnected, loading } = useStripeConnection();

  if (loading) {
    return <Skeleton className="h-6 w-24 rounded-full" />;
  }

  if (isConnected) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/connect-stripe">
            <Badge 
              variant="outline" 
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer gap-1.5"
            >
              <Link2 className="h-3 w-3" />
              <span className="hidden sm:inline">Stripe Connected</span>
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Stripe account connected</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to="/connect-stripe">
          <Badge 
            variant="outline" 
            className="bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer gap-1.5"
          >
            <AlertTriangle className="h-3 w-3" />
            <span className="hidden sm:inline">Connect Stripe</span>
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>Connect your Stripe account</p>
      </TooltipContent>
    </Tooltip>
  );
}
