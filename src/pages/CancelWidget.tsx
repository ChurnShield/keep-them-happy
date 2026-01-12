import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CancelWidgetSurvey } from '@/components/cancel-widget/CancelWidgetSurvey';
import { CancelWidgetOffer } from '@/components/cancel-widget/CancelWidgetOffer';
import { CancelWidgetComplete } from '@/components/cancel-widget/CancelWidgetComplete';
import { CancelWidgetLoading } from '@/components/cancel-widget/CancelWidgetLoading';
import { CancelWidgetError } from '@/components/cancel-widget/CancelWidgetError';

interface SurveyOptions {
  reasons: string[];
  custom_reasons: string[];
  display_order: string[];
}

interface OfferSettings {
  default_offer: 'none' | 'discount' | 'pause';
  reason_mappings: Record<string, { offer_type: 'none' | 'discount' | 'pause'; discount_percentage?: number; discount_duration_months?: number; pause_duration_months?: number }>;
  discount_percentage: number;
  discount_duration_months: number;
  pause_duration_months: number;
}

interface Branding {
  primary_color: string;
  logo_url: string | null;
  dark_mode: boolean;
}

interface WidgetSettings {
  display_mode: 'modal' | 'hosted';
  accept_button_text: string;
  decline_button_text: string;
}

interface SessionData {
  id: string;
  status: string;
  exit_reason: string | null;
  offer_type_presented: string | null;
  offer_accepted: boolean | null;
}

interface ConfigData {
  survey_options: SurveyOptions;
  offer_settings: OfferSettings;
  branding: Branding;
  widget_settings: WidgetSettings;
  is_active: boolean;
}

interface OfferDetails {
  type: 'discount' | 'pause';
  percentage?: number;
  duration_months: number;
}

interface TestModeData {
  enabled: boolean;
  customerName?: string;
  customerEmail?: string;
  planName?: string;
  monthlyAmount?: number;
}

type WidgetStep = 'loading' | 'survey' | 'offer' | 'complete' | 'error';

export default function CancelWidget() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<WidgetStep>('loading');
  const [testMode, setTestMode] = useState<TestModeData>({ enabled: false });
  const [session, setSession] = useState<SessionData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [finalStatus, setFinalStatus] = useState<'saved' | 'cancelled' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate CSS variables from branding
  const brandingStyles = config?.branding ? {
    '--widget-primary': config.branding.primary_color,
    '--widget-bg': config.branding.dark_mode ? '#0f172a' : '#ffffff',
    '--widget-card': config.branding.dark_mode ? '#1e293b' : '#f8fafc',
    '--widget-text': config.branding.dark_mode ? '#f8fafc' : '#0f172a',
    '--widget-muted': config.branding.dark_mode ? '#94a3b8' : '#64748b',
    '--widget-border': config.branding.dark_mode ? '#334155' : '#e2e8f0',
  } as React.CSSProperties : {};

  useEffect(() => {
    // Check for test mode URL params
    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.get('test') === 'true';
    
    if (isTestMode) {
      setTestMode({
        enabled: true,
        customerName: urlParams.get('name') || 'Test Customer',
        customerEmail: urlParams.get('email') || 'test@example.com',
        planName: urlParams.get('plan') || 'Pro Plan',
        monthlyAmount: Number(urlParams.get('amount')) || 49,
      });
    }

    if (token) {
      fetchSession();
    }
  }, [token]);

  async function fetchSession() {
    try {
      // cancel-session uses path-based routing, so call it via full URL
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-session/${token}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load session');
      }

      const sessionData = await response.json();
      
      setSession(sessionData.session);
      setConfig(sessionData.config);

      // Determine initial step based on session status
      if (!sessionData.config.is_active) {
        setError('This cancel flow is not currently active');
        setStep('error');
      } else if (sessionData.session.status === 'saved' || sessionData.session.status === 'cancelled') {
        setFinalStatus(sessionData.session.status);
        setStep('complete');
      } else if (sessionData.session.status === 'survey_completed' && sessionData.session.offer_type_presented !== 'none') {
        // Resume at offer step
        determineOffer(sessionData.session.exit_reason, sessionData.config.offer_settings);
        setStep('offer');
      } else {
        setStep('survey');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cancel flow');
      setStep('error');
    }
  }

  function determineOffer(exitReason: string | null, offerSettings: OfferSettings) {
    if (!exitReason) return;

    const reasonMappings = offerSettings.reason_mappings || {};
    const mapping = reasonMappings[exitReason];
    const offerType = mapping?.offer_type || offerSettings.default_offer;

    if (offerType === 'discount') {
      setOffer({
        type: 'discount',
        percentage: mapping?.discount_percentage || offerSettings.discount_percentage,
        duration_months: mapping?.discount_duration_months || offerSettings.discount_duration_months,
      });
    } else if (offerType === 'pause') {
      setOffer({
        type: 'pause',
        duration_months: mapping?.pause_duration_months || offerSettings.pause_duration_months,
      });
    }
  }

  async function handleSurveySubmit(exitReason: string, customFeedback?: string) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-session/${token}/survey`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exit_reason: exitReason, custom_feedback: customFeedback }),
        }
      );

      if (!response.ok) throw new Error('Failed to submit survey');

      const data = await response.json();
      
      if (data.offer) {
        setOffer(data.offer);
        setStep('offer');
      } else {
        // No offer to present, complete cancellation
        await handleComplete('cancelled');
      }
    } catch (err) {
      console.error('Survey submit error:', err);
      setError('Failed to submit your response');
      setStep('error');
    }
  }

  async function handleOfferResponse(accepted: boolean) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-session/${token}/offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accepted }),
        }
      );

      if (!response.ok) throw new Error('Failed to process response');

      const data = await response.json();
      setFinalStatus(data.status);
      setStep('complete');
    } catch (err) {
      console.error('Offer response error:', err);
      setError('Failed to process your response');
      setStep('error');
    }
  }

  async function handleComplete(action: 'cancelled' | 'abandoned') {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-session/${token}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) throw new Error('Failed to complete');

      setFinalStatus('cancelled');
      setStep('complete');
    } catch (err) {
      console.error('Complete error:', err);
      setError('Failed to complete cancellation');
      setStep('error');
    }
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        ...brandingStyles,
        backgroundColor: 'var(--widget-bg, #0f172a)',
        color: 'var(--widget-text, #f8fafc)',
      }}
    >
      {/* Test Mode Banner */}
      {testMode.enabled && (
        <div 
          className="w-full max-w-md mb-4 rounded-lg p-3 text-center"
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
          }}
        >
          <p className="text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
            <span>⚠️</span>
            TEST MODE - No real changes will be made
          </p>
          <p className="text-amber-700 text-xs mt-1">
            Customer: {testMode.customerName} • Plan: {testMode.planName} • ${testMode.monthlyAmount}/mo
          </p>
        </div>
      )}

      <div 
        className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--widget-card, #1e293b)',
          border: '1px solid var(--widget-border, #334155)',
        }}
      >
        {/* Logo */}
        {config?.branding.logo_url && (
          <div className="flex justify-center mb-6">
            <img 
              src={config.branding.logo_url} 
              alt="Logo" 
              className="h-8 object-contain"
            />
          </div>
        )}

        {step === 'loading' && <CancelWidgetLoading />}
        
        {step === 'error' && (
          <CancelWidgetError message={error || 'Something went wrong'} />
        )}
        
        {step === 'survey' && config && (
          <CancelWidgetSurvey
            surveyOptions={config.survey_options}
            branding={config.branding}
            onSubmit={handleSurveySubmit}
          />
        )}
        
        {step === 'offer' && config && offer && (
          <CancelWidgetOffer
            offer={offer}
            branding={config.branding}
            widgetSettings={config.widget_settings}
            onAccept={() => handleOfferResponse(true)}
            onDecline={() => handleOfferResponse(false)}
          />
        )}
        
        {step === 'complete' && (
          <CancelWidgetComplete
            status={finalStatus}
            offerAccepted={finalStatus === 'saved'}
          />
        )}
      </div>
    </div>
  );
}
