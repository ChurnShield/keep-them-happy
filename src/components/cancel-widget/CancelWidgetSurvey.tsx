import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface SurveyOptions {
  reasons: string[];
  custom_reasons: string[];
  display_order: string[];
}

interface Branding {
  primary_color: string;
  logo_url: string | null;
  dark_mode: boolean;
}

interface CancelWidgetSurveyProps {
  surveyOptions: SurveyOptions;
  branding: Branding;
  onSubmit: (exitReason: string, customFeedback?: string) => void;
}

const REASON_LABELS: Record<string, string> = {
  too_expensive: "It's too expensive",
  not_using_enough: "I'm not using it enough",
  missing_features: "Missing features I need",
  found_alternative: "Found a better alternative",
  technical_issues: "Technical issues",
  need_a_break: "I just need a break",
  other: "Other reason",
};

export function CancelWidgetSurvey({ surveyOptions, branding, onSubmit }: CancelWidgetSurveyProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build the list of reasons to display
  const displayReasons = surveyOptions.display_order.length > 0 
    ? surveyOptions.display_order.filter(r => surveyOptions.reasons.includes(r))
    : surveyOptions.reasons;
  
  // Add custom reasons
  const allReasons = [...displayReasons, ...surveyOptions.custom_reasons, 'other'];

  async function handleSubmit() {
    if (!selectedReason) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(
        selectedReason, 
        selectedReason === 'other' ? customFeedback : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-center">
        We're sorry to see you go
      </h2>
      <p 
        className="text-center mb-6"
        style={{ color: 'var(--widget-muted, #94a3b8)' }}
      >
        Before you cancel, please let us know why you're leaving
      </p>

      <RadioGroup
        value={selectedReason}
        onValueChange={setSelectedReason}
        className="space-y-3"
      >
        {allReasons.map((reason) => (
          <div
            key={reason}
            className="flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: selectedReason === reason 
                ? `${branding.primary_color}20` 
                : 'transparent',
              border: `1px solid ${selectedReason === reason ? branding.primary_color : 'var(--widget-border, #334155)'}`,
            }}
            onClick={() => setSelectedReason(reason)}
          >
            <RadioGroupItem 
              value={reason} 
              id={reason}
              style={{
                borderColor: selectedReason === reason ? branding.primary_color : undefined,
              }}
            />
            <Label 
              htmlFor={reason} 
              className="flex-1 cursor-pointer font-normal"
            >
              {REASON_LABELS[reason] || reason}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selectedReason === 'other' && (
        <div className="mt-4">
          <Textarea
            placeholder="Please tell us more..."
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value)}
            className="min-h-[100px]"
            style={{
              backgroundColor: 'var(--widget-bg, #0f172a)',
              borderColor: 'var(--widget-border, #334155)',
            }}
          />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!selectedReason || isSubmitting}
        className="w-full mt-6"
        style={{
          backgroundColor: branding.primary_color,
          color: '#ffffff',
        }}
      >
        {isSubmitting ? 'Processing...' : 'Continue'}
      </Button>
    </div>
  );
}
