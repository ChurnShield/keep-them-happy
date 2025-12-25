import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CheckoutFallbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutUrl: string;
}

export function CheckoutFallbackDialog({ open, onOpenChange, checkoutUrl }: CheckoutFallbackDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Paste it in a new browser tab to complete checkout.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please manually copy the link below.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Checkout</DialogTitle>
          <DialogDescription>
            Your browser blocked the checkout popup. Click below to open Stripe Checkout in a new tab.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <Button asChild variant="default" size="lg" className="w-full">
            <a 
              href={checkoutUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => onOpenChange(false)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Stripe Checkout
            </a>
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or copy link</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-xs truncate">
              {checkoutUrl}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
