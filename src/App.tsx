import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eagerly load landing page for fastest FCP
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const Signup = lazy(() => import("./pages/Signup"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Success = lazy(() => import("./pages/Success"));
const ExampleAlert = lazy(() => import("./pages/ExampleAlert"));
const ChurnRisk = lazy(() => import("./pages/ChurnRisk"));
const Calculator = lazy(() => import("./pages/Calculator"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const ConnectStripe = lazy(() => import("./pages/ConnectStripe"));
const ConnectStripeCallback = lazy(() => import("./pages/ConnectStripeCallback"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Security = lazy(() => import("./pages/Security"));
const FAQ = lazy(() => import("./pages/FAQ"));
const AdminPaymentRecovery = lazy(() => import("./pages/AdminPaymentRecovery"));
const AdminEmailTest = lazy(() => import("./pages/AdminEmailTest"));
const AdminWebhookTests = lazy(() => import("./pages/AdminWebhookTests"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AtRiskCustomers = lazy(() => import("./pages/AtRiskCustomers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const RecoveryInbox = lazy(() => import("./pages/RecoveryInbox"));
const RecoveryCaseDetail = lazy(() => import("./pages/RecoveryCaseDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const CancelFlowBuilder = lazy(() => import("./pages/CancelFlowBuilder"));
const CancelWidget = lazy(() => import("./pages/CancelWidget"));
const IntegrationGuide = lazy(() => import("./pages/IntegrationGuide"));

// Lazy load route components
const AdminRoute = lazy(() => import("./components/AdminRoute").then(m => ({ default: m.AdminRoute })));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));
const StripeConnectionGate = lazy(() => import("./components/StripeConnectionGate").then(m => ({ default: m.StripeConnectionGate })));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/faq" element={<FAQ />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/success" element={<Success />} />
              <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
              
              {/* Public cancel widget - accessible via session token */}
              <Route path="/cancel/:token" element={<CancelWidget />} />
              
              {/* Connect Stripe - protected, requires auth */}
              <Route path="/connect-stripe" element={
                <ProtectedRoute>
                  <ConnectStripe />
                </ProtectedRoute>
              } />
              <Route path="/connect-stripe/callback" element={
                <ProtectedRoute>
                  <ConnectStripeCallback />
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
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/cancel-flow" element={
                <ProtectedRoute>
                  <CancelFlowBuilder />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/integration" element={
                <ProtectedRoute>
                  <IntegrationGuide />
                </ProtectedRoute>
              } />
              
              {/* Churn insights routes - require auth + Stripe connection */}
              <Route path="/churn-risk" element={
                <ProtectedRoute>
                  <StripeConnectionGate feature="churn insights">
                    <ChurnRisk />
                  </StripeConnectionGate>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/at-risk" element={
                <ProtectedRoute>
                  <StripeConnectionGate feature="at-risk customer insights">
                    <AtRiskCustomers />
                  </StripeConnectionGate>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/customer/:userId" element={
                <ProtectedRoute>
                  <StripeConnectionGate feature="customer details">
                    <CustomerDetail />
                  </StripeConnectionGate>
                </ProtectedRoute>
              } />
              
              {/* Recovery routes - require auth + verification */}
              <Route path="/recovery" element={
                import.meta.env.DEV ? <RecoveryInbox /> : (
                  <ProtectedRoute>
                    <RecoveryInbox />
                  </ProtectedRoute>
                )
              } />
              <Route path="/recovery/:caseId" element={
                import.meta.env.DEV ? <RecoveryCaseDetail /> : (
                  <ProtectedRoute>
                    <RecoveryCaseDetail />
                  </ProtectedRoute>
                )
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
              <Route path="/admin/webhook-tests" element={
                <AdminRoute>
                  <AdminWebhookTests />
                </AdminRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
