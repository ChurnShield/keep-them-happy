import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import Success from "./pages/Success";
import ExampleAlert from "./pages/ExampleAlert";
import ChurnRisk from "./pages/ChurnRisk";
import Calculator from "./pages/Calculator";
import HowItWorks from "./pages/HowItWorks";
import ConnectStripe from "./pages/ConnectStripe";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Security from "./pages/Security";
import AdminPaymentRecovery from "./pages/AdminPaymentRecovery";
import AdminEmailTest from "./pages/AdminEmailTest";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AtRiskCustomers from "./pages/AtRiskCustomers";
import CustomerDetail from "./pages/CustomerDetail";
import RecoveryInbox from "./pages/RecoveryInbox";
import RecoveryCaseDetail from "./pages/RecoveryCaseDetail";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SubscriptionGate } from "./components/SubscriptionGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
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
            <Route path="/success" element={<Success />} />
            <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
            
            {/* Connect Stripe - protected, requires auth + verification + subscription */}
            <Route path="/connect-stripe" element={
              <ProtectedRoute>
                <SubscriptionGate feature="Stripe Connect">
                  <ConnectStripe />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            <Route path="/verify-stripe" element={<Navigate to="/connect-stripe" replace />} />
            
            {/* Protected routes - require auth + email verification */}
            <Route path="/welcome" element={
              <ProtectedRoute>
                <Welcome />
              </ProtectedRoute>
            } />
            <Route path="/example-alert" element={
              <ProtectedRoute>
                <ExampleAlert />
              </ProtectedRoute>
            } />
            
            {/* Dashboard routes - require auth + verification */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Churn insights routes - require auth + verification + subscription */}
            <Route path="/churn-risk" element={
              <ProtectedRoute>
                <SubscriptionGate feature="churn insights">
                  <ChurnRisk />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/at-risk" element={
              <ProtectedRoute>
                <SubscriptionGate feature="at-risk customer insights">
                  <AtRiskCustomers />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/customer/:userId" element={
              <ProtectedRoute>
                <SubscriptionGate feature="customer details">
                  <CustomerDetail />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            
            {/* Recovery routes - require auth + verification */}
            <Route path="/recovery" element={
              <ProtectedRoute>
                <RecoveryInbox />
              </ProtectedRoute>
            } />
            <Route path="/recovery/:caseId" element={
              <ProtectedRoute>
                <RecoveryCaseDetail />
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
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
