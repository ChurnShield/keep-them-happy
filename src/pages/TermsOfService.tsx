import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-16 px-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2025</p>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using ChurnShield, you agree to these Terms of Service.
              If you do not agree, please do not use the service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              ChurnShield provides tools and insights to help SaaS companies identify and reduce involuntary churn.
              The service may include analytics, estimates, recommendations, and integrations with third-party platforms such as Stripe.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">No Financial Guarantee</h2>
            <p className="text-muted-foreground leading-relaxed">
              ChurnShield provides estimates and insights, not guarantees.
              We do not guarantee revenue recovery amounts, churn reduction percentages, or specific financial outcomes.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              All results depend on your business, customers, and implementation.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide accurate information during signup</li>
              <li>Use the service in compliance with applicable laws</li>
              <li>Not misuse or attempt to reverse-engineer the platform</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              ChurnShield integrates with third-party services such as Stripe.
              Your use of those services remains subject to their own terms.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, ChurnShield is not liable for indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to These Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time.
              Continued use of the service constitutes acceptance of any changes.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a href="mailto:support@churnshield.com" className="text-primary hover:underline">
                support@churnshield.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;