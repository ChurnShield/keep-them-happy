import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  User,
  CreditCard,
  TrendingUp,
  Send,
  HelpCircle,
  ArrowLeft,
  Shield,
  X,
} from "lucide-react";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { LegalLinks } from "@/components/LegalLinks";

const ExampleAlert = () => {
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute top-6 left-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/welcome")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg w-full"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex items-center justify-center gap-2 mb-8"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-foreground">Churn</span>
                <span className="text-primary">Shield</span>
              </span>
            </motion.div>

            {/* Alert Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              {/* Alert Header */}
              <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Customer at Risk
                </h2>
              </div>

              {/* Alert Content */}
              <div className="p-6 space-y-4">
                {/* Customer Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="text-foreground font-medium">Alex M.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="text-foreground font-medium">Pro Plan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-muted-foreground">Signal detected:</span>
                    <span className="text-foreground font-medium">
                      Payment failed twice in 48 hours
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-destructive" />
                    <span className="text-muted-foreground">Churn risk:</span>
                    <span className="px-2 py-0.5 bg-destructive/20 text-destructive rounded-full text-sm font-medium">
                      High
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Recommended Action */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                      Recommended Action
                    </span>
                  </div>
                  <p className="text-foreground font-medium mb-2">
                    Send payment recovery email now
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Customers contacted within 24 hours are 43% more likely to recover payment.
                  </p>
                </div>
              </div>

              {/* Alert Actions */}
              <div className="px-6 pb-6 space-y-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => navigate("/how-it-works")}
                  className="w-full group"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send recommended message
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowExplanation(true)}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  View how this was detected
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-6 text-center"
            >
              <LegalLinks />
            </motion.div>
          </motion.div>
        </div>

        {/* Explanation Modal */}
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowExplanation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  How we detect churn signals
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowExplanation(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                We monitor billing events like failed payments, subscription pauses, 
                and retry attempts to identify customers who may be at risk of churning.
              </p>
              <p className="text-muted-foreground text-sm">
                This allows you to take proactive action before a customer is lost — 
                often with a simple, well-timed message.
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default ExampleAlert;
