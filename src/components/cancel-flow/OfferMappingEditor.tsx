import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Gift, Percent, Pause, X } from 'lucide-react';
import type { OfferSettings, SurveyOptions } from '@/hooks/useCancelFlowConfig';

const PREDEFINED_REASONS: Record<string, string> = {
  too_expensive: 'Too expensive',
  not_using_enough: 'Not using it enough',
  missing_features: 'Missing features I need',
  found_alternative: 'Found an alternative',
  technical_issues: 'Technical issues',
  need_a_break: 'Just need a break',
};

interface OfferMappingEditorProps {
  offerSettings: OfferSettings;
  surveyOptions: SurveyOptions;
  onUpdate: (settings: OfferSettings) => void;
}

export function OfferMappingEditor({ offerSettings, surveyOptions, onUpdate }: OfferMappingEditorProps) {
  const updateReasonMapping = (reason: string, offerType: 'none' | 'discount' | 'pause') => {
    const newMappings = { ...offerSettings.reason_mappings };

    if (offerType === 'none') {
      delete newMappings[reason];
    } else {
      newMappings[reason] = {
        offer_type: offerType,
        discount_percentage: offerSettings.discount_percentage,
        discount_duration_months: offerSettings.discount_duration_months,
        pause_duration_months: offerSettings.pause_duration_months,
      };
    }

    onUpdate({
      ...offerSettings,
      reason_mappings: newMappings,
    });
  };

  const getOfferTypeForReason = (reason: string): 'none' | 'discount' | 'pause' => {
    return offerSettings.reason_mappings[reason]?.offer_type || 'none';
  };

  const enabledReasons = surveyOptions.reasons.filter(r => 
    PREDEFINED_REASONS[r] || r.startsWith('custom_')
  );

  const getReasonLabel = (reason: string): string => {
    if (PREDEFINED_REASONS[reason]) return PREDEFINED_REASONS[reason];
    const customIndex = parseInt(reason.replace('custom_', ''));
    return surveyOptions.custom_reasons[customIndex] || reason;
  };

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Retention Offers
        </CardTitle>
        <CardDescription>
          Configure which offer to present based on the exit reason
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Offer Settings */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <Label className="text-sm font-medium">Default Offer Settings</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Discount Percentage</span>
              <span className="text-sm font-medium">{offerSettings.discount_percentage}%</span>
            </div>
            <Slider
              value={[offerSettings.discount_percentage]}
              onValueChange={([value]) => onUpdate({ ...offerSettings, discount_percentage: value })}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Discount Duration</Label>
              <Select
                value={String(offerSettings.discount_duration_months)}
                onValueChange={(value) => onUpdate({ ...offerSettings, discount_duration_months: parseInt(value) })}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(months => (
                    <SelectItem key={months} value={String(months)}>
                      {months} month{months > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Pause Duration</Label>
              <Select
                value={String(offerSettings.pause_duration_months)}
                onValueChange={(value) => onUpdate({ ...offerSettings, pause_duration_months: parseInt(value) })}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3].map(months => (
                    <SelectItem key={months} value={String(months)}>
                      {months} month{months > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Reason Mappings */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Offer per Exit Reason</Label>
          {enabledReasons.map(reason => (
            <div
              key={reason}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
            >
              <span className="text-sm">{getReasonLabel(reason)}</span>
              <Select
                value={getOfferTypeForReason(reason)}
                onValueChange={(value) => updateReasonMapping(reason, value as 'none' | 'discount' | 'pause')}
              >
                <SelectTrigger className="w-40 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <X className="h-3 w-3" />
                      <span>No offer</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="discount">
                    <div className="flex items-center gap-2">
                      <Percent className="h-3 w-3" />
                      <span>Discount</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pause">
                    <div className="flex items-center gap-2">
                      <Pause className="h-3 w-3" />
                      <span>Pause</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Coming Soon: Downgrade */}
        <div className="p-3 rounded-lg border border-dashed border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Downgrade to lower plan</span>
            <Badge variant="secondary" className="text-xs">Coming soon</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
