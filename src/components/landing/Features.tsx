import { CheckCircle, BarChart3, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-teal-400" />,
    title: "Performance-based pricing",
    description:
      "Pay only when we retain your customers — if we don't recover revenue, you don't pay. Your success is our success.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-teal-400" />,
    title: "Real-time churn insights",
    description:
      "Track recoveries and retention in real-time with simple, actionable dashboards designed for clarity.",
  },
  {
    icon: <Zap className="w-6 h-6 text-teal-400" />,
    title: "Instant Stripe integration",
    description:
      "Connect Stripe in seconds — no complex setup, no engineers needed. Start seeing recovery data immediately.",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-teal-400" />,
    title: "Zero-risk guarantee",
    description:
      "No subscriptions, no hidden fees. If we don't deliver results, you owe nothing — ever.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative bg-background text-foreground py-24 md:py-32 border-t border-white/10 overflow-hidden"
    >
      {/* Animated gradient accent line */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent blur-sm animate-pulse-slow" />

      <div className="container mx-auto px-6 max-w-6xl text-center relative z-10">
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              recover lost revenue.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            ChurnShield works silently behind the scenes to retain customers,
            recover at-risk revenue, and align your growth with real results.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-teal-400/30 transition"
            >
              <div className="bg-white/5 p-3 rounded-lg">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
