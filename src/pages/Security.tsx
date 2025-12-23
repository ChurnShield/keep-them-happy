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
        
        <h1 className="text-4xl font-bold mb-8">Security</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 23, 2024</p>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Our Commitment to Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We take the security of your data seriously. Our platform is built with security-first principles to ensure your business information remains protected at all times.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Data Encryption</h2>
            <p className="text-muted-foreground leading-relaxed">
              All data transmitted between your browser and our servers is encrypted using TLS 1.3. Data at rest is encrypted using AES-256 encryption, ensuring your information remains secure even in storage.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Access Controls</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement strict access controls and follow the principle of least privilege. Only authorized personnel with a legitimate business need can access customer data, and all access is logged and audited.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Infrastructure Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our infrastructure is hosted on industry-leading cloud providers with SOC 2 Type II certification. We employ firewalls, intrusion detection systems, and regular security assessments to protect against threats.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Read-Only Stripe Integration</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Stripe integration uses read-only access tokens. We cannot modify your Stripe data, process payments on your behalf, or access sensitive payment card information. We only read the data necessary to identify failed payments.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Vulnerability Management</h2>
            <p className="text-muted-foreground leading-relaxed">
              We regularly scan our systems for vulnerabilities and apply security patches promptly. We also maintain a responsible disclosure program for security researchers.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any security concerns or wish to report a vulnerability, please contact us at security@example.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Security;