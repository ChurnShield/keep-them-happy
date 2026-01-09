import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Monitor, Smartphone, X, Percent, Pause, Check, ArrowLeft } from 'lucide-react';
import type { CancelFlowConfig, SurveyOptions, OfferSettings, Branding, WidgetSettings } from '@/hooks/useCancelFlowConfig';
const PREDEFINED_REASONS: Record<string, string> = {
  too_expensive: 'Too expensive',
  not_using_enough: 'Not using it enough',
  missing_features: 'Missing features I need',
  found_alternative: 'Found an alternative',
  technical_issues: 'Technical issues',
  need_a_break: 'Just need a break',
};

interface CancelFlowPreviewProps {
  config: {
    survey_options: SurveyOptions;
    offer_settings: OfferSettings;
    branding: Branding;
    widget_settings: WidgetSettings;
  } | null;
}

export function CancelFlowPreview({ config }: CancelFlowPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewStep, setPreviewStep] = useState<'survey' | 'offer'>('survey');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [offerPreviewState, setOfferPreviewState] = useState<'default' | 'success' | 'exit-survey'>('default');

  // Reset offer preview state when switching tabs
  useEffect(() => {
    setOfferPreviewState('default');
  }, [previewStep]);

  const resetOfferPreview = () => setOfferPreviewState('default');

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading preview...
      </div>
    );
  }

  const { survey_options, offer_settings, branding, widget_settings } = config;

  const getReasonLabel = (reason: string): string => {
    if (PREDEFINED_REASONS[reason]) return PREDEFINED_REASONS[reason];
    const customIndex = parseInt(reason.replace('custom_', ''));
    return survey_options.custom_reasons[customIndex] || reason;
  };

  const enabledReasons = survey_options.display_order.filter(r => 
    survey_options.reasons.includes(r)
  );

  const getOfferForReason = (reason: string) => {
    const mapping = offer_settings.reason_mappings[reason];
    if (mapping) return mapping;
    return null;
  };

  // Get preview offer - use selected reason's offer, or show a sample offer
  const getPreviewOffer = () => {
    if (selectedReason) {
      return getOfferForReason(selectedReason);
    }
    
    // Find first configured offer from reason_mappings for preview
    const mappings = offer_settings.reason_mappings || {};
    const firstMappedOffer = Object.values(mappings).find(
      (m: any) => m?.offer_type && m.offer_type !== 'none'
    );
    
    if (firstMappedOffer) {
      return firstMappedOffer;
    }
    
    // Default to showing a sample discount offer for preview
    return {
      offer_type: 'discount' as const,
    };
  };

  const selectedOffer = getPreviewOffer();
  const isShowingSampleOffer = !selectedReason && previewStep === 'offer';

  const bgColor = branding.dark_mode ? '#0F172A' : '#FFFFFF';
  const cardBg = branding.dark_mode ? '#1E293B' : '#F8FAFC';
  const textColor = branding.dark_mode ? '#F8FAFC' : '#0F172A';
  const mutedColor = branding.dark_mode ? '#94A3B8' : '#64748B';

  return (
    <div className="h-full flex flex-col">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">Preview</span>
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
        </div>
      </div>

      {/* Step Toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={previewStep === 'survey' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewStep('survey')}
        >
          Survey
        </Button>
        <Button
          variant={previewStep === 'offer' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewStep('offer')}
        >
          Offer
        </Button>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-center justify-center p-4 rounded-lg bg-muted/30 border border-border/50 overflow-auto">
        <div
          className={`rounded-lg shadow-2xl transition-all flex-shrink-0 ${
            viewMode === 'mobile' ? 'w-[320px]' : 'w-full max-w-[480px]'
          }`}
          style={{ backgroundColor: bgColor }}
        >
          {/* Modal Header */}
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: branding.dark_mode ? '#334155' : '#E2E8F0' }}
          >
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="h-6 w-auto" />
            ) : (
              <span 
                className="font-semibold"
                style={{ color: textColor }}
              >
                Your Company
              </span>
            )}
            <button 
              className="p-1 rounded hover:bg-black/10"
              style={{ color: mutedColor }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {previewStep === 'survey' ? (
              <>
                <h2 
                  className="text-lg font-semibold mb-2"
                  style={{ color: textColor }}
                >
                  We're sorry to see you go
                </h2>
                <p 
                  className="text-sm mb-6"
                  style={{ color: mutedColor }}
                >
                  Before you cancel, please let us know why you're leaving.
                </p>

                <RadioGroup
                  value={selectedReason}
                  onValueChange={setSelectedReason}
                  className="space-y-2"
                >
                  {enabledReasons.slice(0, 5).map(reason => (
                    <label
                      key={reason}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                      style={{ 
                        backgroundColor: selectedReason === reason ? `${branding.primary_color}20` : cardBg,
                        borderWidth: 1,
                        borderColor: selectedReason === reason ? branding.primary_color : 'transparent'
                      }}
                    >
                      <RadioGroupItem value={reason} />
                      <span 
                        className="text-sm"
                        style={{ color: textColor }}
                      >
                        {getReasonLabel(reason)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      if (selectedReason) {
                        setPreviewStep('offer');
                      }
                    }}
                    disabled={!selectedReason}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    Continue
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ 
                      color: mutedColor,
                      backgroundColor: cardBg
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                {offerPreviewState === 'default' && (
                  <>
                    {isShowingSampleOffer && (
                      <div 
                        className="text-xs text-center mb-4 px-2 py-1 rounded-full mx-auto w-fit"
                        style={{ backgroundColor: `${branding.primary_color}20`, color: branding.primary_color }}
                      >
                        Sample Preview
                      </div>
                    )}
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${branding.primary_color}20` }}
                    >
                      {selectedOffer?.offer_type === 'discount' ? (
                        <Percent className="h-8 w-8" style={{ color: branding.primary_color }} />
                      ) : (
                        <Pause className="h-8 w-8" style={{ color: branding.primary_color }} />
                      )}
                    </div>
                    <h2 
                      className="text-lg font-semibold text-center mb-2"
                      style={{ color: textColor }}
                    >
                      {selectedOffer?.offer_type === 'discount' 
                        ? `Get ${offer_settings.discount_percentage}% off for ${offer_settings.discount_duration_months} months`
                        : `Pause your subscription for ${offer_settings.pause_duration_months} month${offer_settings.pause_duration_months > 1 ? 's' : ''}`
                      }
                    </h2>
                    <p 
                      className="text-sm text-center mb-6"
                      style={{ color: mutedColor }}
                    >
                      {selectedOffer?.offer_type === 'discount'
                        ? "We'd love to keep you as a customer. Here's a special offer just for you."
                        : "Need a break? No problem. Your account and data will be here when you return."
                      }
                    </p>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setOfferPreviewState('success')}
                        className="w-full px-4 py-3 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: branding.primary_color }}
                      >
                        {widget_settings.accept_button_text}
                      </button>
                      <button
                        onClick={() => setOfferPreviewState('exit-survey')}
                        className="w-full px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
                        style={{ 
                          color: mutedColor,
                          backgroundColor: cardBg
                        }}
                      >
                        {widget_settings.decline_button_text}
                      </button>
                    </div>
                  </>
                )}

                {offerPreviewState === 'success' && (
                  <div className="animate-fade-in text-center">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${branding.primary_color}20` }}
                    >
                      <Check className="h-8 w-8" style={{ color: branding.primary_color }} />
                    </div>
                    <h2 
                      className="text-lg font-semibold mb-2"
                      style={{ color: textColor }}
                    >
                      You're all set!
                    </h2>
                    <p 
                      className="text-sm mb-6"
                      style={{ color: mutedColor }}
                    >
                      {selectedOffer?.offer_type === 'discount'
                        ? `Your ${offer_settings.discount_percentage}% discount has been applied for ${offer_settings.discount_duration_months} months. Thank you for staying with us!`
                        : `Your subscription is paused for ${offer_settings.pause_duration_months} month${offer_settings.pause_duration_months > 1 ? 's' : ''}. We'll send you a reminder before it resumes. See you soon!`
                      }
                    </p>
                    <button
                      onClick={resetOfferPreview}
                      className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: branding.primary_color }}
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Reset Preview
                    </button>
                  </div>
                )}

                {offerPreviewState === 'exit-survey' && (
                  <div className="animate-fade-in text-center">
                    <h2 
                      className="text-lg font-semibold mb-2"
                      style={{ color: textColor }}
                    >
                      Before you go...
                    </h2>
                    <p 
                      className="text-sm mb-6"
                      style={{ color: mutedColor }}
                    >
                      Help us improve by sharing why you're leaving
                    </p>
                    <div className="space-y-2 mb-6">
                      {enabledReasons.slice(0, 5).map(reason => (
                        <button
                          key={reason}
                          onClick={() => {
                            setSelectedReason(reason);
                            setOfferPreviewState('default');
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg text-sm transition-colors hover:opacity-80"
                          style={{ 
                            color: textColor,
                            backgroundColor: selectedReason === reason ? `${branding.primary_color}20` : cardBg,
                            borderWidth: 1,
                            borderColor: selectedReason === reason ? branding.primary_color : 'transparent'
                          }}
                        >
                          {getReasonLabel(reason)}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={resetOfferPreview}
                      className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: branding.primary_color }}
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Reset Preview
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
