import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, ArrowLeft, CheckCircle, Mail } from 'lucide-react';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const emailSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp, emailVerified } = useAuth();

  // Check if user just verified their email
  const justVerified = searchParams.get('verified') === 'true';

  // Get the intended destination from location state
  const from = (location.state as { from?: string })?.from || '/welcome';
  const isFromProtectedRoute = location.state?.from != null;

  // Check for password reset flow (user clicked reset link in email)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    
    if (type === 'recovery' && accessToken) {
      setMode('reset');
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (justVerified && !user) {
      setSuccessMessage('Email verified successfully! Please sign in to continue.');
      setMode('login');
    }
  }, [justVerified, user]);

  useEffect(() => {
    // Only redirect if user is fully authenticated and email is verified
    // Don't redirect if in reset mode (user needs to set new password)
    if (!loading && user && emailVerified && mode !== 'reset') {
      navigate(from, { replace: true });
    }
  }, [user, loading, emailVerified, navigate, from, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const validation = authSchema.safeParse({ email, password });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please verify your email before signing in. Check your inbox for the verification link.');
          } else {
            setError(error.message);
          }
        }
      } else if (mode === 'signup') {
        const validation = authSchema.safeParse({ email, password });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          return;
        }

        const { data, error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('An account with this email already exists. Please sign in instead.');
          } else {
            setError(error.message);
          }
        } else if (data?.user && !data.user.email_confirmed_at) {
          setSuccessMessage('Check your email! We sent you a verification link. Click it to activate your account.');
          setEmail('');
          setPassword('');
        }
      } else if (mode === 'forgot') {
        const validation = emailSchema.safeParse({ email });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage('Check your email! We sent you a password reset link.');
          setEmail('');
        }
      } else if (mode === 'reset') {
        const validation = passwordSchema.safeParse({ password });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage('Password updated successfully! Redirecting to dashboard...');
          setPassword('');
          setConfirmPassword('');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome back';
      case 'signup': return 'Create an account';
      case 'forgot': return 'Reset your password';
      case 'reset': return 'Set new password';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': 
        return isFromProtectedRoute ? 'Sign in to continue' : 'Sign in to access your account';
      case 'signup': 
        return isFromProtectedRoute ? 'Create an account to get started.' : 'Sign up to get started';
      case 'forgot': 
        return "Enter your email and we'll send you a reset link";
      case 'reset': 
        return 'Choose a new password for your account';
    }
  };

  const getSubmitText = () => {
    switch (mode) {
      case 'login': return isSubmitting ? 'Signing in...' : 'Sign in';
      case 'signup': return isSubmitting ? 'Creating account...' : 'Create account';
      case 'forgot': return isSubmitting ? 'Sending...' : 'Send reset link';
      case 'reset': return isSubmitting ? 'Updating...' : 'Update password';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 hero-glow opacity-30" />
      <div className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {mode === 'forgot' || mode === 'reset' ? (
                <Mail className="h-6 w-6 text-primary" />
              ) : (
                <Shield className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {getTitle()}
            </CardTitle>
            <CardDescription>
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {successMessage && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email field - shown for login, signup, forgot */}
              {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Password field - shown for login, signup, reset */}
              {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    autoComplete={mode === 'reset' ? 'new-password' : 'current-password'}
                  />
                </div>
              )}

              {/* Confirm password field - shown for reset only */}
              {mode === 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {getSubmitText()}
              </Button>

              {/* Forgot password link - shown for login only */}
              {mode === 'login' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Switch between login/signup */}
              {(mode === 'login' || mode === 'signup') && (
                <div className="text-center text-sm text-muted-foreground">
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              )}

              {/* Back to login - shown for forgot mode */}
              {mode === 'forgot' && (
                <div className="text-center text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
