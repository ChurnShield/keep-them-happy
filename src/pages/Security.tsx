import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Security = () => {
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
        
        <h1 className="text-4xl font-bold mb-8">Security & Data Use</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              We know connecting your billing data is a big decision.
              Here's exactly how ChurnShield handles security and access.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Stripe Access: Read-Only</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ChurnShield connects to Stripe using read-only permissions only.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              This means we can:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>View subscription events</li>
              <li>Analyze payment failures</li>
              <li>Estimate churn and recovery opportunities</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We cannot:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Create, modify, or cancel subscriptions</li>
              <li>Charge customers</li>
              <li>Issue refunds</li>
              <li>Access full card or bank details</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Minimization</h2>
            <p className="text-muted-foreground leading-relaxed">
              We only access the minimum data required to deliver insights.
              No unnecessary data. No hidden access.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Infrastructure & Safeguards</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Secure API connections</li>
              <li>Encrypted data in transit</li>
              <li>Limited internal access</li>
              <li>No storage of raw payment credentials</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">You're Always in Control</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can revoke Stripe access at any time directly from your Stripe dashboard.
              If access is revoked, ChurnShield immediately stops data processing.
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

export default Security;