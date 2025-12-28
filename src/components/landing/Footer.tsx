import { Link } from "react-router-dom";
import { Github, Twitter, Mail, Shield } from "lucide-react";
import { motion } from "framer-motion";

export function Footer() {
  const handleNavClick = (href: string) => {
    console.log("[Footer] Navigation click:", href);
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLinkClick = (linkName: string, destination: string) => {
    console.log("[Footer] Link click:", { linkName, destination });
  };

  const handleExternalClick = (platform: string, url: string) => {
    console.log("[Footer] External link click:", { platform, url });
  };

  return (
    <footer className="relative bg-card border-t border-white/10 text-muted-foreground overflow-hidden">
      {/* Gradient Divider Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent blur-sm animate-pulse-slow" />

      {/* Main Footer Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10"
      >
        {/* Left: Logo + tagline */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
          <Link to="/" onClick={() => handleLinkClick("Logo", "/")} className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-400" />
            <span className="text-foreground font-semibold text-lg tracking-tight">
              ChurnShield
            </span>
          </Link>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            Performance-based retention — only pay when you actually keep
            customers.
          </p>
        </div>

        {/* Center: Navigation */}
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <button 
            onClick={() => handleNavClick("#features")} 
            className="hover:text-teal-300 transition"
          >
            Features
          </button>
          <button 
            onClick={() => handleNavClick("#pricing")} 
            className="hover:text-teal-300 transition"
          >
            Pricing
          </button>
          <button 
            onClick={() => handleNavClick("#testimonials")} 
            className="hover:text-teal-300 transition"
          >
            Testimonials
          </button>
          <button 
            onClick={() => handleNavClick("#how-it-works")} 
            className="hover:text-teal-300 transition"
          >
            How It Works
          </button>
          <Link to="/auth" onClick={() => handleLinkClick("Login", "/auth")} className="hover:text-teal-300 transition">
            Login
          </Link>
        </nav>

        {/* Right: Social Icons */}
        <div className="flex items-center gap-5">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            onClick={() => handleExternalClick("Twitter", "https://twitter.com")}
            className="hover:text-teal-300 transition"
          >
            <Twitter size={18} />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            onClick={() => handleExternalClick("GitHub", "https://github.com")}
            className="hover:text-teal-300 transition"
          >
            <Github size={18} />
          </a>
          <a
            href="mailto:hello@churnshield.com"
            aria-label="Email"
            onClick={() => handleExternalClick("Email", "mailto:hello@churnshield.com")}
            className="hover:text-teal-300 transition"
          >
            <Mail size={18} />
          </a>
        </div>
      </motion.div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className="border-t border-white/5 py-6 text-center text-xs text-muted-foreground/60 relative z-10"
      >
        <div className="flex flex-wrap justify-center items-center gap-4 mb-2">
          <Link to="/privacy" onClick={() => handleLinkClick("Privacy Policy", "/privacy")} className="hover:text-teal-300 transition">
            Privacy Policy
          </Link>
          <Link to="/terms" onClick={() => handleLinkClick("Terms of Service", "/terms")} className="hover:text-teal-300 transition">
            Terms of Service
          </Link>
          <Link to="/security" onClick={() => handleLinkClick("Security", "/security")} className="hover:text-teal-300 transition">
            Security
          </Link>
        </div>
        <p className="mt-2">
          © {new Date().getFullYear()} ChurnShield. All rights reserved.
        </p>
      </motion.div>
    </footer>
  );
}
