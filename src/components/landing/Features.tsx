import { motion } from "framer-motion";
import { 
  MousePointerClick, 
  CreditCard, 
  Brain, 
  Repeat,
  ArrowRight,
  Sparkles,
  BarChart3,
  Mail
} from "lucide-react";

const features = [
  {
    icon: MousePointerClick,
    title: "Smart Cancel Flows",
    description: "Intercept cancellations with intelligent, customisable flows that present the right offer at the right time.",
    highlights: ["Drag-and-drop builder", "A/B testing", "Dynamic offers", "Exit surveys"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: CreditCard,
    title: "Payment Recovery",
    description: "Recover failed payments automatically with smart retry logic and multi-channel dunning campaigns.",
    highlights: ["Smart retry engine", "Email campaigns", "One-click update", "Compliance built-in"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Behavioural Intelligence",
    description: "Predict churn before it happens with deep user behaviour analysis and health scoring.",
    highlights: ["Churn predictions", "Health scores", "Usage tracking", "Proactive alerts"],
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Repeat,
    title: "Reactivation Campaigns",
    description: "Win back churned customers with targeted, personalised outreach campaigns.",
    highlights: ["One-click reactivation", "Segmented campaigns", "Revenue attribution", "Time-delayed offers"],
    color: "from-orange-500 to-amber-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
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
            <span>Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
            Everything you need to{" "}
            <span className="gradient-text">stop churn</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Four integrated modules working together to maximise customer retention and revenue recovery.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500" 
                   style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
              
              <div className="relative h-full rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg mb-6`}>
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {feature.description}
                </p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {feature.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                {/* Link */}
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {[
            { icon: BarChart3, title: "Advanced Analytics", desc: "Deep insights into churn patterns and retention metrics" },
            { icon: Mail, title: "Email Campaigns", desc: "Automated dunning and win-back email sequences" },
            { icon: Sparkles, title: "AI-Powered", desc: "Machine learning optimises offers automatically" },
          ].map((feat) => (
            <div
              key={feat.title}
              className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/30 p-6 transition-all hover:border-primary/30"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <feat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{feat.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{feat.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
