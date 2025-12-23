import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import ChurnRisk from "./pages/ChurnRisk";
import Calculator from "./pages/Calculator";
import StripeVerification from "./pages/StripeVerification";
import VerificationResults from "./pages/VerificationResults";
import HowItWorks from "./pages/HowItWorks";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Security from "./pages/Security";
import AdminPaymentRecovery from "./pages/AdminPaymentRecovery";
import AdminEmailTest from "./pages/AdminEmailTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/churn-risk" element={<ChurnRisk />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/verify-stripe" element={<StripeVerification />} />
          <Route path="/verification-results" element={<VerificationResults />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/security" element={<Security />} />
          <Route path="/admin/payment-recovery" element={<AdminPaymentRecovery />} />
          <Route path="/admin/email-test" element={<AdminEmailTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
