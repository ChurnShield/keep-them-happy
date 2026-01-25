import { ClipboardList, Gift, BarChart3, PoundSterling } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <ClipboardList className="w-6 h-6 text-primary" />,
    title: "Smart Exit Surveys",
    description:
      "When a customer clicks cancel, they see a quick survey asking why. You learn exactly what's driving churn — too expensive, not using it, missing features, or something else.",
  },
  {
    icon: <Gift className="w-6 h-6 text-primary" />,
    title: "Personalized Retention Offers",
    description:
      "Based on their answer, ChurnShield automatically shows the right offer — a discount for price-sensitive customers, a pause for those who need a break, or a feature highlight for the confused.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-primary" />,
    title: "Real-Time Analytics Dashboard",
    description:
      "See every save as it happens. Track which reasons drive churn, which offers work best, and exactly how much revenue you've retained.",
  },
  {
    icon: <PoundSterling className="w-6 h-6 text-primary" />,
    title: "Performance-Based Pricing",
    description:
      "Pay 20% of saved revenue, capped at £500/month. If ChurnShield saves nobody, you pay nothing. Your success is our success.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative bg-background text-foreground py-24 md:py-32 border-t border-border/20 overflow-hidden"
    >
      {/* Animated gradient accent line */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent blur-sm animate-pulse-slow" />

      <div className="container mx-auto px-6 max-w-6xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to{" "}
            <span className="gradient-text">
              save customers who try to cancel.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            ChurnShield intercepts cancellations, learns why customers leave, and presents the right offer to make them stay.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-primary/30 hover:bg-white/[0.07] transition-all duration-300"
            >
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
