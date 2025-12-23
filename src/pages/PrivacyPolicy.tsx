import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
        
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2025</p>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              ChurnShield ("we", "our", or "us") respects your privacy and is committed to protecting your information.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              This Privacy Policy explains what data we collect, how we use it, and your rights.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect only the information necessary to operate and improve ChurnShield, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Email address and company name provided during signup</li>
              <li>Basic usage data (such as page visits and feature interactions)</li>
              <li>Aggregated billing and subscription metadata when connected via Stripe (read-only)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not collect credit card numbers, bank details, or customer passwords.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide and operate the ChurnShield service</li>
              <li>Estimate churn risk and revenue recovery opportunities</li>
              <li>Communicate with you about onboarding, updates, or support</li>
              <li>Improve product performance and user experience</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
              We do not sell your data.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Stripe Data Access</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you choose to connect Stripe, ChurnShield only requests read-only access.
              This access is used solely to analyze subscription behavior and payment events.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4 mb-4">
              We cannot:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Modify subscriptions</li>
              <li>Create charges or refunds</li>
              <li>Access full payment details</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
              You remain in full control at all times.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Storage & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We take reasonable technical and organizational measures to protect your data, including secure storage and limited access controls.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may request access to, correction of, or deletion of your data at any time by contacting us.
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

export default PrivacyPolicy;