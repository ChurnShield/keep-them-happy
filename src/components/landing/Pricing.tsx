import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "49",
    period: "/month",
    description: "Perfect for early-stage SaaS",
    mrrLimit: "Up to £5k MRR",
    features: [
      "3 cancel flows",
      "Payment recovery",
      "Basic analytics",
      "Email support",
      "Full API access",
      "Stripe integration",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    price: "149",
    period: "/month",
    description: "For growing SaaS businesses",
    mrrLimit: "Up to £25k MRR",
    features: [
      "Unlimited cancel flows",
      "Payment recovery",
      "A/B testing",
      "Advanced analytics",
      "Priority support",
      "Full API access",
      "All integrations",
      "99.5% SLA",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Scale",
    price: "349",
    period: "/month",
    description: "For scaling operations",
    mrrLimit: "Up to £100k MRR",
    features: [
      "Everything in Growth",
      "Behavioural analytics",
      "Churn predictions",
      "White label option",
      "Dedicated CSM",
      "Custom integrations",
      "99.9% SLA",
      "Phone support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

export function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-background to-card/30" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
            Start saving revenue{" "}
            <span className="gradient-text">today</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            30-day free trial on all plans. No credit card required. Full API access included.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative group ${plan.popular ? "md:-mt-4 md:mb-4" : ""}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30">
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`relative h-full rounded-3xl border p-8 transition-all duration-300 ${
                  plan.popular
                    ? "border-primary/50 bg-card shadow-xl shadow-primary/10"
                    : "border-border/50 bg-card/50 hover:border-primary/30"
                }`}
              >
                {/* Gradient border for popular */}
                {plan.popular && (
                  <div className="absolute inset-0 rounded-3xl gradient-border opacity-50" />
                )}

                <div className="relative">
                  {/* Plan name */}
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

                  {/* Price */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">£</span>
                    <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  <p className="mt-2 text-sm text-primary font-medium">{plan.mrrLimit}</p>

                  {/* CTA */}
                  <Button
                    variant={plan.popular ? "hero" : "outline"}
                    className="w-full mt-8 group"
                    size="lg"
                    onClick={() => navigate('/signup')}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  {/* Features */}
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground">
            Need more than £100k MRR or custom requirements?{" "}
            <a href="#" className="text-primary font-medium hover:underline">
              Contact us for Enterprise pricing
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
