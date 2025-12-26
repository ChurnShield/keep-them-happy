import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export function RecoveryEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border border-dashed border-border/50 bg-white/[0.02] backdrop-blur-sm p-12"
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-primary/10 p-5 mb-6">
          <Inbox className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-foreground">No open recovery cases</h3>
        <p className="text-muted-foreground max-w-md mb-4 leading-relaxed">
          Recovery cases are created when a customer's payment fails. 
          You have 48 hours to reach out and help them resolve the issue before 
          their subscription is at risk of churning.
        </p>
        <p className="text-sm text-muted-foreground/70">
          When a payment fails, a new case will appear here automatically.
        </p>
      </div>
    </motion.div>
  );
}
