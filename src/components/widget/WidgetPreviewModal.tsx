import { useState, useEffect } from 'react';
import { X, Monitor, Smartphone, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SurveyOptions, OfferSettings, Branding, WidgetSettings } from '@/hooks/useCancelFlowConfig';

interface WidgetPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: {
    survey_options: SurveyOptions;
    offer_settings: OfferSettings;
    branding: Branding;
    widget_settings: WidgetSettings;
  } | null;
}

type PreviewStep = 'survey' | 'offer' | 'complete-saved' | 'complete-cancelled';

const REASON_LABELS: Record<string, string> = {
  too_expensive: "It's too expensive",
  not_using_enough: "I'm not using it enough",
  missing_features: "Missing features I need",
  found_alternative: "Found a better alternative",
  technical_issues: "Technical issues",
  need_a_break: "I just need a break",
  other: "Other reason",
};

export function WidgetPreviewModal({ open, onOpenChange, config }: WidgetPreviewModalProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [step, setStep] = useState<PreviewStep>('survey');
  const [selectedReason, setSelectedReason] = useState<string>('');

  useEffect(() => {
    if (open) {
      setStep('survey');
      setSelectedReason('');
    }
  }, [open]);

  if (!config) return null;

  const { survey_options, offer_settings, branding, widget_settings } = config;

  const bgColor = branding.dark_mode ? '#0F172A' : '#FFFFFF';
  const cardBg = branding.dark_mode ? '#1E293B' : '#F8FAFC';
  const textColor = branding.dark_mode ? '#F8FAFC' : '#0F172A';
  const mutedColor = branding.dark_mode ? '#94A3B8' : '#64748B';
  const borderColor = branding.dark_mode ? '#334155' : '#E2E8F0';

  const displayReasons = survey_options.display_order.length > 0
    ? survey_options.display_order.filter(r => survey_options.reasons.includes(r))
    : survey_options.reasons;

  const allReasons = [...displayReasons, ...(survey_options.custom_reasons || []), 'other'];

  const getOfferForReason = (reason: string) => {
    const mapping = offer_settings.reason_mappings?.[reason];
    if (mapping && mapping.offer_type !== 'none') {
      return {
        type: mapping.offer_type,
        percentage: mapping.discount_percentage || offer_settings.discount_percentage,
        duration_months: mapping.offer_type === 'discount' 
          ? (mapping.discount_duration_months || offer_settings.discount_duration_months)
          : (mapping.pause_duration_months || offer_settings.pause_duration_months),
      };
    }
    if (offer_settings.default_offer !== 'none') {
      return {
        type: offer_settings.default_offer,
        percentage: offer_settings.discount_percentage,
        duration_months: offer_settings.default_offer === 'discount'
          ? offer_settings.discount_duration_months
          : offer_settings.pause_duration_months,
      };
    }
    return null;
  };

  const currentOffer = selectedReason ? getOfferForReason(selectedReason) : null;

  const handleContinue = () => {
    if (currentOffer) {
      setStep('offer');
    } else {
      setStep('complete-cancelled');
    }
  };

  const handleAcceptOffer = () => {
    setStep('complete-saved');
  };

  const handleDeclineOffer = () => {
    setStep('complete-cancelled');
  };

  const handleReset = () => {
    setStep('survey');
    setSelectedReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Widget Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('desktop')}
                className="h-8 w-8"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('mobile')}
                className="h-8 w-8"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-muted/30 flex items-center justify-center">
          <div
            className={`rounded-xl shadow-2xl transition-all ${
              viewMode === 'mobile' ? 'w-[360px]' : 'w-full max-w-[480px]'
            }`}
            style={{ backgroundColor: cardBg }}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor }}
            >
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="h-6 w-auto" />
              ) : (
                <span className="font-semibold" style={{ color: textColor }}>
                  Your Company
                </span>
              )}
              <button 
                className="p-1 rounded hover:opacity-70"
                style={{ color: mutedColor }}
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'survey' && (
                <>
                  <h2 className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>
                    We're sorry to see you go
                  </h2>
                  <p className="text-sm text-center mb-6" style={{ color: mutedColor }}>
                    Before you cancel, please let us know why you're leaving
                  </p>

                  <div className="space-y-2">
                    {allReasons.map(reason => (
                      <button
                        key={reason}
                        className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left"
                        style={{
                          backgroundColor: selectedReason === reason ? `${branding.primary_color}20` : 'transparent',
                          border: `1px solid ${selectedReason === reason ? branding.primary_color : borderColor}`,
                        }}
                        onClick={() => setSelectedReason(reason)}
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: selectedReason === reason ? branding.primary_color : borderColor }}
                        >
                          {selectedReason === reason && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: branding.primary_color }}
                            />
                          )}
                        </div>
                        <span className="text-sm" style={{ color: textColor }}>
                          {REASON_LABELS[reason] || reason}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    className="w-full mt-6 px-4 py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: branding.primary_color }}
                    disabled={!selectedReason}
                    onClick={handleContinue}
                  >
                    Continue
                  </button>
                </>
              )}

              {step === 'offer' && currentOffer && (
                <>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${branding.primary_color}20` }}
                  >
                    {currentOffer.type === 'discount' ? (
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={branding.primary_color} strokeWidth="2">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={branding.primary_color} strokeWidth="2">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    )}
                  </div>

                  <h2 className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>
                    Wait! We have an offer for you
                  </h2>
                  
                  <p className="text-sm text-center mb-4" style={{ color: mutedColor }}>
                    {currentOffer.type === 'discount' 
                      ? "We'd hate to see you go. How about we give you"
                      : "Need a break? We can pause your subscription for"
                    }
                  </p>

                  <div className="text-4xl font-bold text-center mb-2" style={{ color: branding.primary_color }}>
                    {currentOffer.type === 'discount' 
                      ? `${currentOffer.percentage}% OFF`
                      : `${currentOffer.duration_months} MONTH${currentOffer.duration_months > 1 ? 'S' : ''}`
                    }
                  </div>

                  <p className="text-sm text-center mb-6" style={{ color: mutedColor }}>
                    {currentOffer.type === 'discount'
                      ? `for the next ${currentOffer.duration_months} month${currentOffer.duration_months > 1 ? 's' : ''}`
                      : "Your account will be waiting for you when you're ready"
                    }
                  </p>

                  <button
                    className="w-full px-4 py-3 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: branding.primary_color }}
                    onClick={handleAcceptOffer}
                  >
                    {widget_settings.accept_button_text}
                  </button>
                  
                  <button
                    className="w-full mt-2 px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: mutedColor }}
                    onClick={handleDeclineOffer}
                  >
                    {widget_settings.decline_button_text}
                  </button>
                </>
              )}

              {step === 'complete-saved' && (
                <div className="text-center py-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2" style={{ color: textColor }}>
                    Great! Your offer has been applied
                  </h2>
                  <p className="text-sm mb-6" style={{ color: mutedColor }}>
                    Thank you for staying with us. Your discount has been applied to your account.
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: branding.primary_color }}
                    onClick={handleReset}
                  >
                    ← Reset Preview
                  </button>
                </div>
              )}

              {step === 'complete-cancelled' && (
                <div className="text-center py-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)' }}
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2" style={{ color: textColor }}>
                    Your subscription has been cancelled
                  </h2>
                  <p className="text-sm mb-6" style={{ color: mutedColor }}>
                    We're sorry to see you go. You'll continue to have access until the end of your billing period.
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: branding.primary_color }}
                    onClick={handleReset}
                  >
                    ← Reset Preview
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
