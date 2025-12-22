import { motion } from "framer-motion";
import { Code2, Palette, Rocket, BarChart } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Code2,
    title: "Integrate in Minutes",
    description: "Add our lightweight widget with a single line of code. Works with React, JavaScript, or any web framework.",
  },
  {
    number: "02",
    icon: Palette,
    title: "Customise Your Flows",
    description: "Use our visual builder to create branded cancellation flows with dynamic offers and exit surveys.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Go Live",
    description: "Deploy your flows instantly. No server restarts, no waiting. Changes go live in seconds.",
  },
  {
    number: "04",
    icon: BarChart,
    title: "Watch Churn Drop",
    description: "Monitor real-time analytics as your save rate climbs and revenue retention improves.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
            Up and running in{" "}
            <span className="gradient-text">under 2 hours</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From signup to your first saved customer—it's that fast.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden md:block" />

            <div className="space-y-12">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-6"
                >
                  {/* Step number/icon */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-primary">{step.number}</span>
                      <div className="h-px flex-1 bg-border max-w-[100px]" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
