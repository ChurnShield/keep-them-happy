import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "ChurnShield paid for itself in the first week. We've reduced our monthly churn by 38% and recovered thousands in failed payments.",
    author: "Sarah Chen",
    role: "CEO, DataSync",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "The behavioural analytics are incredible. We can now predict which customers are at risk and intervene before they even think about cancelling.",
    author: "Marcus Johnson",
    role: "Head of Product, CloudMetrics",
    avatar: "MJ",
    rating: 5,
  },
  {
    quote: "Finally, a retention tool that doesn't cost a fortune. The ROI was clear from day one, and the setup was surprisingly painless.",
    author: "Emily Rodriguez",
    role: "Founder, TaskFlow",
    avatar: "ER",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
            Loved by{" "}
            <span className="gradient-text">SaaS founders</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join hundreds of companies already reducing churn with ChurnShield.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="relative h-full rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                {/* Quote icon */}
                <Quote className="h-8 w-8 text-primary/30 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logo Cloud */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by innovative companies worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50">
            {["DataSync", "CloudMetrics", "TaskFlow", "ShipFast", "MetricHQ", "LaunchPad"].map((company) => (
              <span key={company} className="text-xl font-bold text-muted-foreground">
                {company}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
