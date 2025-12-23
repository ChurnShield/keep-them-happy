import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, TrendingDown, PlugZap, FlaskConical, BadgePercent } from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "Failed Payment Recovery",
    description: "Automatically rescue revenue from failed renewals and dunning gaps.",
  },
  {
    icon: ShieldCheck,
    title: "Cancellation Flows",
    description: "Smart offboarding that keeps customers longer with offers and alternatives.",
  },
  {
    icon: TrendingDown,
    title: "Predictive Churn Signals",
    description: "Identify at-risk accounts before they cancel with behavior and billing signals.",
  },
  {
    icon: PlugZap,
    title: "Fast Integration",
    description: "Lightweight setup designed for busy founders with low engineering overhead.",
  },
  {
    icon: FlaskConical,
    title: "A/B Test Retention",
    description: "Experiment with offers and messaging to reduce churn over time.",
  },
  {
    icon: BadgePercent,
    title: "Pay-for-Performance Pricing",
    description: "Only pay when we save revenue. Clear ROI, zero risk.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Features() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
          >
            Everything you need to{" "}
            <span className="gradient-text">stop churn</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            A complete toolkit to recover failed payments, prevent cancellations, and grow recurring revenue.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all hover:border-primary/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
