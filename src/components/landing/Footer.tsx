import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

type FooterLink = {
  name: string;
  href?: string;
  comingSoon?: boolean;
};

const footerLinks: Record<string, FooterLink[]> = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Integrations", comingSoon: true },
    { name: "API Docs", comingSoon: true },
  ],
  Company: [
    { name: "About", comingSoon: true },
    { name: "Blog", comingSoon: true },
    { name: "Careers", comingSoon: true },
    { name: "Contact", comingSoon: true },
  ],
  Resources: [
    { name: "Documentation", comingSoon: true },
    { name: "Help Center", comingSoon: true },
    { name: "Community", comingSoon: true },
    { name: "Status", comingSoon: true },
  ],
  Legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Security", comingSoon: true },
    { name: "GDPR", comingSoon: true },
  ],
};

function FooterLinkItem({ link }: { link: FooterLink }) {
  if (link.comingSoon) {
    return (
      <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
        {link.name} <span className="text-xs">(coming soon)</span>
      </span>
    );
  }

  // Anchor links for in-page sections
  if (link.href?.startsWith("#")) {
    return (
      <a
        href={link.href}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {link.name}
      </a>
    );
  }

  // Internal routes
  return (
    <Link
      to={link.href || "/"}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {link.name}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Churn<span className="gradient-text">Shield</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Intelligent churn prevention for modern SaaS. 
              Stop losing customers and start saving revenue.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Privacy Statement */}
        <div className="mt-12 pt-6 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            We do not collect analytics, use cookies, or track usage. Everything runs locally in your browser.
          </p>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ChurnShield. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
              <span className="sr-only">Twitter (coming soon)</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </span>
            <span className="text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
              <span className="sr-only">GitHub (coming soon)</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
              <span className="sr-only">LinkedIn (coming soon)</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
