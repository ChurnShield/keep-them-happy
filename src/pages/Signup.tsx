import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LeadInputSchema } from "@/lib/leadSchema";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAlreadySignedUp, setIsAlreadySignedUp] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; company?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    // Clear previous errors
    setErrors({});
    
    // Validate with Zod
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
      const { error } = await supabase.from("leads").insert({
        email: result.data.email,
        company: result.data.company,
        plan_interest: "Unknown",
        source: "signup-page",
      });
      
      if (error) throw error;
      
      // Send welcome email
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: { email: result.data.email, company: result.data.company },
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't block signup if email fails
      }
      
      // Redirect to welcome page after successful signup
      navigate("/welcome");
      
      setIsSubmitted(true);
    } catch (error: unknown) {
      const supabaseError = error as { code?: string };
      
      // Handle duplicate email (unique constraint violation) as success
      if (supabaseError?.code === "23505") {
        // User already signed up - still redirect to welcome
        navigate("/welcome");
      } else {
        // Only show error for truly unexpected failures
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {isAlreadySignedUp ? "You're already signed up" : "You're on the list!"}
              </CardTitle>
              <CardDescription className="text-base">
                {isAlreadySignedUp 
                  ? "We'll keep you posted ✅" 
                  : "We'll be in touch shortly to get you started with your risk-free trial."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
