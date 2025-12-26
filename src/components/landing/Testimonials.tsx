import { Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Lena Hart",
    role: "Head of Growth @ ScaleFlow",
    initials: "LH",
    quote:
      "ChurnShield flipped our retention economics. We only pay when we actually save customers — and that alignment changed everything. It's performance-first pricing done right.",
  },
  {
    name: "Devon Yates",
    role: "Founder @ RevenuePilot",
    initials: "DY",
    quote:
      "Within 30 days, we saw churn drop by nearly 50%. The best part? Zero setup, no fluff, and the most transparent model we've ever seen.",
  },
  {
    name: "Sofia Tran",
    role: "COO @ RetainIQ",
    initials: "ST",
    quote:
      "It's rare to find a retention tool that feels like a true partner. The results-based billing model means we're always on the same side.",
  },
];

const companies = ["ScaleFlow", "RevenuePilot", "RetainIQ", "MetricHQ", "LaunchPad"];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative bg-background text-foreground py-24 md:py-32 border-t border-white/10 overflow-hidden"
    >
      {/* Accent line animation */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent blur-sm animate-pulse-slow" />

      <div className="container mx-auto px-6 max-w-6xl text-center relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Teams who{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              trust ChurnShield
            </span>{" "}
            to retain their revenue.
          </h2>
          <p className="text-muted-foreground text-lg">
            Proven impact. Authentic feedback. Real results from SaaS companies
            aligning growth and retention the right way.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
              className="flex flex-col justify-between bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md hover:border-teal-400/30 transition text-left"
            >
              <Quote className="w-6 h-6 text-teal-400 mb-4" />
              <p className="text-muted-foreground mb-6 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-teal-400/10 border border-white/10 flex items-center justify-center">
                  <span className="text-teal-400 font-semibold text-sm">{t.initials}</span>
                </div>
                <div>
                  <p className="text-foreground font-medium">{t.name}</p>
                  <p className="text-muted-foreground text-sm">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logo strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-8 mt-16 opacity-50"
        >
          {companies.map((company) => (
            <span key={company} className="text-lg font-semibold text-muted-foreground">
              {company}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
