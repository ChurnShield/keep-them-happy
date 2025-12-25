import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import ExampleAlert from "./pages/ExampleAlert";
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
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/security" element={<Security />} />
          <Route path="/calculator" element={<Calculator />} />
          
          {/* Protected routes - require auth + email verification */}
          <Route path="/welcome" element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          } />
          <Route path="/churn-risk" element={
            <ProtectedRoute>
              <ChurnRisk />
            </ProtectedRoute>
          } />
          <Route path="/example-alert" element={
            <ProtectedRoute>
              <ExampleAlert />
            </ProtectedRoute>
          } />
          <Route path="/verify-stripe" element={
            <ProtectedRoute>
              <StripeVerification />
            </ProtectedRoute>
          } />
          <Route path="/verification-results" element={
            <ProtectedRoute>
              <VerificationResults />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/payment-recovery" element={
            <AdminRoute>
              <AdminPaymentRecovery />
            </AdminRoute>
          } />
          <Route path="/admin/email-test" element={
            <AdminRoute>
              <AdminEmailTest />
            </AdminRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
