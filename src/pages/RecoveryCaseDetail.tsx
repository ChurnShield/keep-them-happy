import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Copy, 
  Check, 
  MessageSquare, 
  StickyNote,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  FileText
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
import { ProtectedLayout } from '@/components/ProtectedLayout';

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
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 text-primary"
      >
        <CheckCircle2 className="h-6 w-6" />
        <span className="text-xl font-semibold">Recovered</span>
      </motion.div>
    );
  }

  if (status === 'expired' || timeRemaining.isExpired) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <XCircle className="h-6 w-6" />
        <span className="text-xl font-semibold">Expired</span>
      </div>
    );
  }

  const seconds = Math.floor((timeRemaining.totalMs / 1000) % 60);
  
  return (
    <div className="flex items-center gap-2">
      <Clock className="h-6 w-6 text-primary" />
      <span className="font-mono text-xl font-bold text-foreground">
        {timeRemaining.hours}h {timeRemaining.minutes}m {seconds}s
      </span>
    </div>
  );
}

function ActionTimeline({ caseId }: { caseId: string }) {
  const { actions, loading } = useRecoveryActions(caseId);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full bg-white/5" />
        <Skeleton className="h-16 w-full bg-white/5" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No actions recorded yet</p>
      </div>
    );
  }

  const getActionIcon = (type: RecoveryActionType) => {
    switch (type) {
      case 'message_sent':
        return <MessageSquare className="h-4 w-4" />;
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      case 'marked_recovered':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
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
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-border/50 to-transparent" />
      
      <div className="space-y-4">
        {actions.map((action, index) => (
          <motion.div 
            key={action.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4 pl-10"
          >
            {/* Timeline dot */}
            <div className="absolute left-2 top-3 w-4 h-4 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            
            <div className="flex-1 p-4 rounded-xl bg-white/[0.03] border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                {getActionIcon(action.action_type)}
                <span className="text-sm font-medium text-foreground">{getActionLabel(action.action_type)}</span>
              </div>
              {action.note && (
                <p className="text-sm text-muted-foreground mt-2 pl-6">{action.note}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2 pl-6">
                {format(new Date(action.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
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
      <ProtectedLayout
        title="Loading..."
        breadcrumbs={[
          { label: 'Recovery Inbox', href: '/recovery' },
          { label: 'Loading...' }
        ]}
      >
        <Skeleton className="h-64 w-full mb-6 bg-white/5" />
        <Skeleton className="h-48 w-full bg-white/5" />
      </ProtectedLayout>
    );
  }

  if (!case_) {
    return (
      <ProtectedLayout
        title="Case Not Found"
        breadcrumbs={[
          { label: 'Recovery Inbox', href: '/recovery' },
          { label: 'Not Found' }
        ]}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-sm p-8 text-center"
        >
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">Case not found</h2>
          <p className="text-muted-foreground">
            This recovery case doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </motion.div>
      </ProtectedLayout>
    );
  }

  const highRisk = isHighRisk(case_);
  const reasonLabel = getReasonLabel(case_.churn_reason);
  const recommendation = getRecommendation(case_.churn_reason);

  const getBorderClass = () => {
    if (case_.status === 'recovered') return 'border-primary/50 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]';
    if (case_.status === 'expired') return 'border-border/50';
    if (highRisk) return 'border-destructive/50 shadow-[0_0_30px_-5px_hsl(var(--destructive)/0.3)] animate-pulse-subtle';
    return 'border-border/50';
  };

  return (
    <ProtectedLayout
      title={case_.customer_reference}
      subtitle={`Opened ${formatDistanceToNow(new Date(case_.opened_at), { addSuffix: true })}`}
      breadcrumbs={[
        { label: 'Recovery Inbox', href: '/recovery' },
        { label: case_.customer_reference }
      ]}
      className="max-w-4xl"
      headerContent={
        <Badge 
          className={`px-3 py-1 text-sm font-medium ${
            case_.status === 'recovered' 
              ? 'bg-primary/20 text-primary border-primary/30' 
              : case_.status === 'expired'
                ? 'bg-muted text-muted-foreground border-border'
                : highRisk 
                  ? 'bg-destructive/20 text-destructive border-destructive/30'
                  : 'bg-white/10 text-foreground border-border'
          }`}
        >
          {case_.status === 'open' && highRisk && 'Urgent'}
          {case_.status === 'open' && !highRisk && 'Open'}
          {case_.status === 'recovered' && 'Recovered'}
          {case_.status === 'expired' && 'Expired'}
        </Badge>
      }
    >

        {/* Case Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl bg-white/[0.03] border backdrop-blur-sm p-6 sm:p-8 mb-6 ${getBorderClass()}`}
        >

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <TrendingUp className="h-4 w-4" />
                Amount at Risk
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {case_.amount_at_risk.toLocaleString(undefined, {
                  style: 'currency',
                  currency: case_.currency,
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <Clock className="h-4 w-4" />
                Time Remaining
              </div>
              <CountdownDisplay deadline_at={case_.deadline_at} status={case_.status} />
            </div>
          </div>

          {/* Churn Reason */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Why This Customer Is At Risk</p>
            <Badge variant="outline" className="bg-white/5 border-border/50">
              {reasonLabel}
            </Badge>
          </div>

          {/* Recommended Action */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full shrink-0">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary mb-1">Recommended Next Step</p>
                <p className="text-foreground">{recommendation}</p>
              </div>
            </div>
          </motion.div>

          {case_.invoice_reference && (
            <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <FileText className="h-4 w-4" />
                Invoice Reference
              </div>
              <p className="font-mono text-sm text-foreground">{case_.invoice_reference}</p>
            </div>
          )}

          {!case_.first_action_at && case_.status === 'open' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm">No recovery attempt made yet</span>
            </motion.div>
          )}
        </motion.div>

        {/* Actions (only for open cases) */}
        {!isResolved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/[0.03] border border-border/50 backdrop-blur-sm p-6 sm:p-8 mb-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Actions</h2>
            
            {/* Copy recovery message */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border/30 mb-4">
              <p className="text-sm text-muted-foreground mb-3">Recovery Message Template</p>
              <pre className="text-sm whitespace-pre-wrap bg-background/50 p-4 rounded-lg border border-border/30 mb-4 text-foreground/80">
                {recoveryMessage}
              </pre>
              <Button 
                variant="outline" 
                onClick={handleCopyMessage}
                className="w-full bg-white/5 border-border/50 hover:bg-white/10 hover:border-primary/50 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-primary" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Button 
                variant="outline"
                onClick={handleMarkContacted}
                disabled={isSubmitting}
                className="bg-white/5 border-border/50 hover:bg-white/10 hover:border-primary/50 transition-all"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Mark as contacted
              </Button>

              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="bg-white/5 border-border/50 hover:bg-white/10 hover:border-primary/50 transition-all"
                  >
                    <StickyNote className="h-4 w-4 mr-2" />
                    Add internal note
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background/95 backdrop-blur-lg border-border/50">
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
                    className="bg-white/5 border-border/50"
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

            <div className="border-t border-border/30 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={handleMarkRecovered}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark recovered
              </Button>

              <Button 
                variant="secondary"
                onClick={handleMarkExpired}
                disabled={isSubmitting}
                className="bg-white/5 hover:bg-white/10 border border-border/50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark expired
              </Button>
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/[0.03] border border-border/50 backdrop-blur-sm p-6 sm:p-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-2">Timeline</h2>
          <p className="text-sm text-muted-foreground mb-6">
            History of actions taken on this case
          </p>
          <ActionTimeline caseId={case_.id} />
        </motion.div>
    </ProtectedLayout>
  );
}
