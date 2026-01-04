import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, ChevronLeft, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    category: "How It Works",
    questions: [
      {
        question: "What exactly does ChurnShield do?",
        answer:
          "ChurnShield monitors your Stripe account for failed payments and gives you complete visibility into what's at risk, why it failed, and what recovered. When a payment fails (expired card, insufficient funds, bank decline), it appears in your dashboard immediately. You see recommended actions, can reach out to customers, and track exactly how much revenue was saved.",
      },
      {
        question: "Does ChurnShield retry failed payments?",
        answer:
          "No — Stripe handles payment retries automatically. ChurnShield provides the visibility layer that Stripe doesn't: seeing all at-risk payments in one place, understanding failure reasons, tracking what's been recovered, and taking action when automatic retries aren't enough.",
      },
      {
        question: "How does ChurnShield determine it 'saved' a customer?",
        answer:
          "We track attribution automatically through Stripe webhooks. When a payment fails, we create a recovery case. When that same invoice is later paid successfully (whether through Stripe's retry or customer action), we mark it as recovered and credit it to your account. It's straightforward cause-and-effect tracking.",
      },
      {
        question: "Does ChurnShield handle voluntary churn (customers clicking cancel)?",
        answer:
          "Currently, ChurnShield focuses exclusively on involuntary churn — failed payments due to expired cards, insufficient funds, and bank declines. Cancel flow interception for voluntary churn is on our roadmap but not yet available.",
      },
    ],
  },
  {
    category: "Setup & Integration",
    questions: [
      {
        question: "What Stripe permissions does ChurnShield require?",
        answer:
          "ChurnShield requires read-only access to your Stripe account. We can see payment events, invoices, and subscriptions, but we cannot modify anything in your Stripe account. Your payment processing remains completely under your control.",
      },
      {
        question: "How long does setup take?",
        answer:
          "About 2 minutes. You connect your Stripe account with one click (OAuth), and ChurnShield immediately starts monitoring for failed payments. No code changes, no engineering resources, no complex configuration.",
      },
      {
        question: "Do you support payment processors other than Stripe?",
        answer:
          "Currently, ChurnShield is Stripe-only. We're focused on providing the best possible experience for Stripe users before expanding to other payment processors.",
      },
    ],
  },
  {
    category: "Pricing & Billing",
    questions: [
      {
        question: "How does the 20% fee work?",
        answer:
          "You pay 20% of the revenue ChurnShield helps recover. If a $100/month subscription payment fails and is later recovered, you pay $20. If nothing is recovered, you pay nothing. There are no monthly fees, no setup fees, no hidden costs.",
      },
      {
        question: "Is there a cap on the 20% fee per recovery?",
        answer:
          "Currently, there's no cap — you pay 20% of any recovered amount. If you're recovering high-value enterprise subscriptions and a cap would make sense for your situation, reach out and we can discuss custom terms.",
      },
      {
        question: "When is the 20% fee charged?",
        answer:
          "Billing details are still being finalized. We're building toward monthly invoicing for recovered revenue, but the exact billing cycle will be communicated clearly before any charges.",
      },
      {
        question: "Is there a minimum MRR or customer volume to use ChurnShield?",
        answer:
          "No minimums. Whether you have 10 customers or 10,000, ChurnShield works the same way. Our performance-based model means it only makes sense for us to charge when there's actual value being delivered.",
      },
    ],
  },
  {
    category: "Security & Privacy",
    questions: [
      {
        question: "Is my Stripe data secure?",
        answer:
          "Yes. We use Stripe's official OAuth integration with read-only permissions. Your API keys are never exposed, and we only access the data needed to track failed payments and recoveries. All data is encrypted in transit and at rest.",
      },
      {
        question: "Can ChurnShield modify my Stripe account or payments?",
        answer:
          "No. We have read-only access. ChurnShield cannot create charges, modify subscriptions, issue refunds, or make any changes to your Stripe account. We can only observe payment events.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition">
            <ChevronLeft className="w-4 h-4" />
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">ChurnShield</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 border-b border-border/20">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to know about{" "}
              <span className="gradient-text">ChurnShield</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Honest answers about what we do, how it works, and what it costs.
              No marketing fluff.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          {faqs.map((section, sectionIndex) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
              className="mb-12 last:mb-0"
            >
              <h2 className="text-xl font-semibold text-foreground mb-6 pb-2 border-b border-border/40">
                {section.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {section.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${sectionIndex}-${index}`}
                    className="bg-card/50 border border-border/40 rounded-xl px-6 data-[state=open]:border-primary/30"
                  >
                    <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-border/20">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              We're happy to help. Reach out and we'll get back to you quickly.
            </p>
            <a
              href="mailto:hello@churnshield.com"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              Contact Us
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Link to="/privacy" className="hover:text-primary transition">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition">
              Terms of Service
            </Link>
            <Link to="/security" className="hover:text-primary transition">
              Security
            </Link>
          </div>
          <p>© {new Date().getFullYear()} ChurnShield. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
