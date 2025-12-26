import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft, 
  Clock, 
  DollarSign, 
  Copy, 
  Check, 
  MessageSquare, 
  StickyNote,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { 
  useRecoveryCases, 
  useRecoveryActions, 
  getTimeRemaining, 
  isHighRisk, 
  RecoveryActionType,
  getReasonLabel,
  getRecommendation
} from '@/hooks/useRecoveryCases';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

function CountdownDisplay({ deadline_at, status }: { deadline_at: string; status: string }) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(deadline_at));

  useEffect(() => {
    if (status !== 'open') return;
    
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline_at, status]);

  if (status === 'recovered') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Recovered</span>
      </div>
    );
  }

  if (status === 'expired' || timeRemaining.isExpired) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Expired</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-5 w-5 text-primary" />
      <span className="font-mono text-lg">
        {timeRemaining.hours}h {timeRemaining.minutes}m
      </span>
      <span className="text-muted-foreground">remaining</span>
    </div>
  );
}

function ActionTimeline({ caseId }: { caseId: string }) {
  const { actions, loading } = useRecoveryActions(caseId);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic py-4">
        No actions recorded yet.
      </p>
    );
  }

  const getActionIcon = (type: RecoveryActionType) => {
    switch (type) {
      case 'message_sent':
        return <MessageSquare className="h-4 w-4" />;
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      case 'marked_recovered':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'marked_expired':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (type: RecoveryActionType) => {
    switch (type) {
      case 'message_sent':
        return 'Marked as contacted';
      case 'note':
        return 'Note added';
      case 'marked_recovered':
        return 'Marked as recovered';
      case 'marked_expired':
        return 'Marked as expired';
    }
  };

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div key={action.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
          <div className="mt-0.5">{getActionIcon(action.action_type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{getActionLabel(action.action_type)}</p>
            {action.note && (
              <p className="text-sm text-muted-foreground mt-1">{action.note}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(action.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecoveryCaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { getCaseById, loading, updateCaseStatus, setFirstAction, refetch } = useRecoveryCases();
  const { addAction, refetch: refetchActions } = useRecoveryActions(caseId);
  
  const [noteText, setNoteText] = useState('');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const case_ = caseId ? getCaseById(caseId) : undefined;
  const isResolved = case_?.status !== 'open';

  const recoveryMessage = case_ 
    ? `Hi there,

We noticed there was an issue processing your recent payment of ${case_.amount_at_risk.toLocaleString(undefined, {
    style: 'currency',
    currency: case_.currency,
  })}.

Please update your payment method to avoid any interruption to your service.

If you have any questions, just reply to this email and we'll be happy to help.

Thanks!`
    : '';

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(recoveryMessage);
    setCopied(true);
    toast.success('Recovery message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkContacted = async () => {
    if (!caseId) return;
    
    try {
      setIsSubmitting(true);
      await addAction('message_sent');
      await setFirstAction(caseId);
      await refetch();
      await refetchActions();
      toast.success('Marked as contacted');
    } catch (error) {
      toast.error('Failed to record action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!caseId || !noteText.trim()) return;
    
    try {
      setIsSubmitting(true);
      await addAction('note', noteText.trim());
      await refetchActions();
      setNoteText('');
      setIsNoteDialogOpen(false);
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkRecovered = async () => {
    if (!caseId) return;
    
    try {
      setIsSubmitting(true);
      await addAction('marked_recovered');
      await updateCaseStatus(caseId, 'recovered');
      await refetch();
      await refetchActions();
      toast.success('Case marked as recovered');
    } catch (error) {
      toast.error('Failed to update case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkExpired = async () => {
    if (!caseId) return;
    
    try {
      setIsSubmitting(true);
      await addAction('marked_expired');
      await updateCaseStatus(caseId, 'expired');
      await refetch();
      await refetchActions();
      toast.success('Case marked as expired');
    } catch (error) {
      toast.error('Failed to update case');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-48 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!case_) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl py-8">
          <Button 
            variant="ghost" 
            className="mb-8"
            onClick={() => navigate('/recovery')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Button>
          
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Case not found</h2>
              <p className="text-muted-foreground">
                This recovery case doesn't exist or you don't have access to it.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const highRisk = isHighRisk(case_);
  const reasonLabel = getReasonLabel(case_.churn_reason);
  const recommendation = getRecommendation(case_.churn_reason);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8">
        <Button 
          variant="ghost" 
          className="mb-8"
          onClick={() => navigate('/recovery')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>

        {/* Case Summary */}
        <Card className={`mb-6 ${highRisk && !isResolved ? 'border-destructive/50' : ''}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{case_.customer_reference}</CardTitle>
                <CardDescription>
                  Opened {formatDistanceToNow(new Date(case_.opened_at), { addSuffix: true })}
                </CardDescription>
              </div>
              <Badge 
                variant={
                  case_.status === 'recovered' ? 'default' :
                  case_.status === 'expired' ? 'secondary' :
                  highRisk ? 'destructive' : 'outline'
                }
              >
                {case_.status === 'open' && highRisk && 'Urgent'}
                {case_.status === 'open' && !highRisk && 'Open'}
                {case_.status === 'recovered' && 'Recovered'}
                {case_.status === 'expired' && 'Expired'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount at Risk</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {case_.amount_at_risk.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {case_.currency}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
                <CountdownDisplay deadline_at={case_.deadline_at} status={case_.status} />
              </div>
            </div>

            {/* Churn Reason */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Why This Customer Is At Risk</p>
              <Badge variant="outline" className="text-sm">
                {reasonLabel}
              </Badge>
            </div>

            {/* Recommended Action - Prominent Display */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Recommended Next Step</p>
                  <p className="text-foreground">{recommendation}</p>
                </div>
              </div>
            </div>

            {case_.invoice_reference && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Invoice Reference</p>
                <p className="font-mono text-sm">{case_.invoice_reference}</p>
              </div>
            )}

            {!case_.first_action_at && case_.status === 'open' && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">No recovery attempt made yet</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions (only for open cases) */}
        {!isResolved && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Copy recovery message */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">Recovery Message Template</p>
                <pre className="text-sm whitespace-pre-wrap bg-background p-3 rounded border mb-3">
                  {recoveryMessage}
                </pre>
                <Button 
                  variant="outline" 
                  onClick={handleCopyMessage}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy recovery message
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={handleMarkContacted}
                  disabled={isSubmitting}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mark as contacted
                </Button>

                <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <StickyNote className="h-4 w-4 mr-2" />
                      Add internal note
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Internal Note</DialogTitle>
                      <DialogDescription>
                        Add a note to track your progress on this recovery case.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Enter your note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={4}
                    />
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsNoteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddNote}
                        disabled={!noteText.trim() || isSubmitting}
                      >
                        Add Note
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-3">
                <Button 
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleMarkRecovered}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark recovered
                </Button>

                <Button 
                  variant="secondary"
                  onClick={handleMarkExpired}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark expired
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
            <CardDescription>
              History of actions taken on this case
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionTimeline caseId={case_.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
