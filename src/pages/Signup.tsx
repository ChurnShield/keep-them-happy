import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Check, Mail, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LeadInputSchema } from "@/lib/leadSchema";
import { toast } from "sonner";
import { LegalLinks } from "@/components/LegalLinks";

interface WelcomeEmailResponse {
  ok: boolean;
  messageId?: string;
  alreadySent?: boolean;
  errorCode?: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAlreadySignedUp, setIsAlreadySignedUp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; company?: string }>({});

  const sendWelcomeEmail = async (userEmail: string, userCompany: string, forceResend = false) => {
    try {
      const { data, error: emailError } = await supabase.functions.invoke<WelcomeEmailResponse>(
        "send-welcome-email",
        { body: { email: userEmail, company: userCompany, forceResend } }
      );
      
      if (emailError) {
        console.error("Welcome email error:", emailError);
        return { ok: false };
      }
      
      return data || { ok: false };
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return { ok: false };
    }
  };

  const handleResendEmail = async () => {
    if (isResending) return;
    
    setIsResending(true);
    const result = await sendWelcomeEmail(email.trim().toLowerCase(), company.trim(), true);
    setIsResending(false);
    
    if (result.ok) {
      toast.success("Email sent! Check your inbox.");
    } else {
      toast.error("Couldn't send email. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setErrors({});
    
    const result = LeadInputSchema.safeParse({
      email: email.trim().toLowerCase(),
      company: company.trim(),
    });
    
    if (!result.success) {
      const fieldErrors: { email?: string; company?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "company") fieldErrors.company = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Try to insert the lead
      const { error: insertError } = await supabase.from("leads").insert({
        email: result.data.email,
        company: result.data.company,
        plan_interest: "Unknown",
        source: "signup-page",
      });
      
      // Check if this is a duplicate signup
      const isDuplicate = insertError?.code === "23505";
      
      if (insertError && !isDuplicate) {
        throw insertError;
      }
      
      // Send welcome email
      await sendWelcomeEmail(result.data.email, result.data.company);
      
      // Set state for UI
      if (isDuplicate) {
        setIsAlreadySignedUp(true);
        setIsSubmitted(true);
      } else {
        navigate("/welcome");
      }
      
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && isAlreadySignedUp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 hero-glow opacity-50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <Card className="max-w-md w-full text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome back!</CardTitle>
              <CardDescription className="text-base">
                Good news — you're already on the list. We've resent your welcome email with everything you need to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate("/welcome")} 
                variant="hero" 
                size="lg"
                className="w-full"
              >
                Continue to Dashboard
              </Button>
              
              <Button 
                onClick={handleResendEmail} 
                variant="outline" 
                className="w-full"
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Welcome Email
                  </>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground pt-2">
                Didn't get the email? Check your spam folder or click resend above.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-glow opacity-50" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Start Your Risk-Free Trial</CardTitle>
            <CardDescription>
              No credit card required. Only pay when we save you revenue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Your Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={errors.company ? "border-destructive" : ""}
                />
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Getting you started..." : "Start Free Trial"}
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              {["No upfront costs", "Cancel anytime", "Pay only for results"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <LegalLinks className="mt-6 pt-4 border-t border-border/50" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
