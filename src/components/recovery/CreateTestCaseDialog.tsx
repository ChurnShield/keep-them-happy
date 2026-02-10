import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChurnReason, CreateRecoveryCaseInput } from '@/hooks/useRecoveryCases';
import { toast } from 'sonner';

interface CreateTestCaseDialogProps {
  onCreate: (input: CreateRecoveryCaseInput) => Promise<void>;
}

export function CreateTestCaseDialog({ onCreate }: CreateTestCaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customerRef, setCustomerRef] = useState('');
  const [amount, setAmount] = useState('');
  const [churnReason, setChurnReason] = useState<ChurnReason>('unknown_failure');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!customerRef.trim() || !amount) return;
    
    try {
      setIsSubmitting(true);
      await onCreate({
        customer_reference: customerRef.trim(),
        amount_at_risk: parseFloat(amount),
        currency: 'GBP',
        churn_reason: churnReason,
      });
      toast.success('Test case created');
      setCustomerRef('');
      setAmount('');
      setChurnReason('unknown_failure');
      setIsOpen(false);
    } catch (err) {
      toast.error('Failed to create test case');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/[0.03] border-border/50 hover:border-primary/50 hover:bg-white/[0.05] rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Test Case
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Create Test Recovery Case</DialogTitle>
          <DialogDescription>
            Add a mock recovery case to test the feature. The 48-hour countdown starts now.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer Reference</Label>
            <Input
              id="customer"
              placeholder="e.g., customer@example.com"
              value={customerRef}
              onChange={(e) => setCustomerRef(e.target.value)}
              className="bg-white/[0.03] border-border/50 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount at Risk ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 99.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white/[0.03] border-border/50 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Churn Reason</Label>
            <Select value={churnReason} onValueChange={(v) => setChurnReason(v as ChurnReason)}>
              <SelectTrigger className="bg-white/[0.03] border-border/50 rounded-xl">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card_expired">Card Expired</SelectItem>
                <SelectItem value="insufficient_funds">Insufficient Funds</SelectItem>
                <SelectItem value="bank_decline">Bank Decline</SelectItem>
                <SelectItem value="no_retry_attempted">No Retry Attempted</SelectItem>
                <SelectItem value="unknown_failure">Unknown Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!customerRef.trim() || !amount || isSubmitting}
            className="rounded-xl"
          >
            Create Case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
