import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutSuccess = searchParams.get('checkout') === 'success';

  useEffect(() => {
    // Clear any checkout-related state if needed
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to ChurnShield!
          </h1>
          <p className="text-muted-foreground">
            Your 7-day free trial has started. No charges until your trial ends.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
          <h3 className="font-semibold text-foreground">What's next?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary font-bold">1</span>
              </div>
              <span>Connect your Stripe account to start monitoring</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary font-bold">2</span>
              </div>
              <span>Configure churn risk alerts</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary font-bold">3</span>
              </div>
              <span>Set up automated recovery campaigns</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/connect-stripe')} 
            size="lg" 
            className="w-full group"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Connect Stripe
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            size="lg" 
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Cancel anytime from your account settings. No questions asked.
        </p>
      </div>
    </div>
  );
};

export default Success;
