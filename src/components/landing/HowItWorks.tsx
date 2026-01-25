import { motion } from "framer-motion";
import { Plug, Palette, Code, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <Plug className="w-6 h-6" />,
    title: "Connect Stripe",
    description:
      "One-click OAuth connection to your Stripe account. ChurnShield automatically syncs your subscriptions and customer data. Live in under 10 minutes.",
    highlight: "Quick setup",
  },
  {
    number: "02",
    icon: <Palette className="w-6 h-6" />,
    title: "Build Your Cancel Flow",
    description:
      "Use our visual builder to create exit survey questions and map retention offers to each reason. 'Too expensive?' → Show a discount. 'Need a break?' → Offer a pause.",
    highlight: "Visual builder",
  },
  {
    number: "03",
    icon: <Code className="w-6 h-6" />,
    title: "Embed the Widget",
    description:
      "Add one line of code to your cancel page. When customers click cancel, they see your branded retention flow instead of an instant goodbye.",
    highlight: "One line of code",
  },
  {
    number: "04",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Watch the Saves Roll In",
    description:
      "Every time a customer accepts an offer and stays, you see it in your dashboard and get an email alert. You keep 80% of saved revenue — we take 20%.",
    highlight: "Track every save",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-gradient-to-b from-background to-card text-foreground py-24 md:py-32 border-t border-border/20 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            From cancel click to{" "}
            <span className="gradient-text">saved customer</span> in 4 simple
            steps.
          </h2>
          <p className="text-muted-foreground text-lg">
            No code changes to your app. No complex integrations. Just connect, configure, and start saving.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="relative group"
            >
              <div className="flex gap-5 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-primary/30 hover:bg-white/[0.07] transition-all duration-300 h-full">
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg group-hover:bg-primary/20 transition-colors">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-primary">{step.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                      {step.highlight}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector arrow (hidden on last item and on mobile) */}
              {index < steps.length - 1 && index % 2 === 0 && (
                <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-primary/40">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground">
            Ready to turn cancellations into saves?{" "}
            <a
              href="#pricing"
              className="text-primary hover:underline font-medium"
            >
              See our performance-based pricing →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
