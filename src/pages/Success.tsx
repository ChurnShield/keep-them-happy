import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Success = () => {
  const navigate = useNavigate();

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

        <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
          <h3 className="font-semibold text-foreground">What's next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Connect your payment data sources</li>
            <li>• Configure churn risk alerts</li>
            <li>• Set up automated recovery campaigns</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/welcome')} size="lg" className="w-full">
            Get Started
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
