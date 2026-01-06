import { Button } from '@/components/ui/button';
import { Gift, Pause, Check } from 'lucide-react';

interface OfferDetails {
  type: 'discount' | 'pause';
  percentage?: number;
  duration_months: number;
}

interface Branding {
  primary_color: string;
  logo_url: string | null;
  dark_mode: boolean;
}

interface WidgetSettings {
  accept_button_text: string;
  decline_button_text: string;
}

interface CancelWidgetOfferProps {
  offer: OfferDetails;
  branding: Branding;
  widgetSettings: WidgetSettings;
  onAccept: () => void;
  onDecline: () => void;
}

export function CancelWidgetOffer({ 
  offer, 
  branding, 
  widgetSettings, 
  onAccept, 
  onDecline 
}: CancelWidgetOfferProps) {
  const isDiscount = offer.type === 'discount';
  
  return (
    <div className="text-center">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: `${branding.primary_color}20` }}
      >
        {isDiscount ? (
          <Gift className="h-8 w-8" style={{ color: branding.primary_color }} />
        ) : (
          <Pause className="h-8 w-8" style={{ color: branding.primary_color }} />
        )}
      </div>

      <h2 className="text-xl font-semibold mb-2">
        Wait! We have an offer for you
      </h2>

      {isDiscount ? (
        <div className="mb-6">
          <p style={{ color: 'var(--widget-muted, #94a3b8)' }} className="mb-4">
            We'd hate to see you go. How about we give you
          </p>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: branding.primary_color }}
          >
            {offer.percentage}% OFF
          </div>
          <p style={{ color: 'var(--widget-muted, #94a3b8)' }}>
            for the next {offer.duration_months} month{offer.duration_months > 1 ? 's' : ''}
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <p style={{ color: 'var(--widget-muted, #94a3b8)' }} className="mb-4">
            Need a break? We can pause your subscription for
          </p>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: branding.primary_color }}
          >
            {offer.duration_months} MONTH{offer.duration_months > 1 ? 'S' : ''}
          </div>
          <p style={{ color: 'var(--widget-muted, #94a3b8)' }}>
            Your account will be waiting for you when you're ready
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={onAccept}
          className="w-full"
          style={{
            backgroundColor: branding.primary_color,
            color: '#ffffff',
          }}
        >
          <Check className="h-4 w-4 mr-2" />
          {widgetSettings.accept_button_text}
        </Button>
        
        <Button
          onClick={onDecline}
          variant="ghost"
          className="w-full"
          style={{ color: 'var(--widget-muted, #94a3b8)' }}
        >
          {widgetSettings.decline_button_text}
        </Button>
      </div>
    </div>
  );
}
