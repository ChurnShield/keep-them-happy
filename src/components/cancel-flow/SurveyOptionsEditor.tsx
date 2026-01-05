import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripVertical, Plus, Trash2, MessageSquare } from 'lucide-react';
import type { SurveyOptions } from '@/hooks/useCancelFlowConfig';

const PREDEFINED_REASONS: Record<string, string> = {
  too_expensive: 'Too expensive',
  not_using_enough: 'Not using it enough',
  missing_features: 'Missing features I need',
  found_alternative: 'Found an alternative',
  technical_issues: 'Technical issues',
  need_a_break: 'Just need a break',
};

interface SurveyOptionsEditorProps {
  surveyOptions: SurveyOptions;
  onUpdate: (options: SurveyOptions) => void;
}

export function SurveyOptionsEditor({ surveyOptions, onUpdate }: SurveyOptionsEditorProps) {
  const [newReason, setNewReason] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const toggleReason = (reason: string) => {
    const isEnabled = surveyOptions.reasons.includes(reason);
    let newReasons: string[];
    let newDisplayOrder: string[];

    if (isEnabled) {
      newReasons = surveyOptions.reasons.filter(r => r !== reason);
      newDisplayOrder = surveyOptions.display_order.filter(r => r !== reason);
    } else {
      newReasons = [...surveyOptions.reasons, reason];
      newDisplayOrder = [...surveyOptions.display_order, reason];
    }

    onUpdate({
      ...surveyOptions,
      reasons: newReasons,
      display_order: newDisplayOrder,
    });
  };

  const addCustomReason = () => {
    if (!newReason.trim() || surveyOptions.custom_reasons.length >= 5) return;

    const reasonKey = `custom_${Date.now()}`;
    onUpdate({
      ...surveyOptions,
      custom_reasons: [...surveyOptions.custom_reasons, newReason.trim()],
      reasons: [...surveyOptions.reasons, reasonKey],
      display_order: [...surveyOptions.display_order, reasonKey],
    });
    setNewReason('');
  };

  const removeCustomReason = (index: number) => {
    const reasonKey = `custom_${index}`;
    onUpdate({
      ...surveyOptions,
      custom_reasons: surveyOptions.custom_reasons.filter((_, i) => i !== index),
      reasons: surveyOptions.reasons.filter(r => r !== reasonKey && !r.startsWith('custom_')),
      display_order: surveyOptions.display_order.filter(r => r !== reasonKey && !r.startsWith('custom_')),
    });
  };

  const handleDragStart = (reason: string) => {
    setDraggedItem(reason);
  };

  const handleDragOver = (e: React.DragEvent, targetReason: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetReason) return;

    const newOrder = [...surveyOptions.display_order];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetReason);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    onUpdate({
      ...surveyOptions,
      display_order: newOrder,
    });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const getReasonLabel = (reason: string): string => {
    if (PREDEFINED_REASONS[reason]) return PREDEFINED_REASONS[reason];
    const customIndex = parseInt(reason.replace('custom_', ''));
    return surveyOptions.custom_reasons[customIndex] || reason;
  };

  const orderedReasons = surveyOptions.display_order.filter(r => 
    surveyOptions.reasons.includes(r) || Object.keys(PREDEFINED_REASONS).includes(r)
  );

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Exit Survey Options
        </CardTitle>
        <CardDescription>
          Configure the reasons customers can select when canceling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Predefined Reasons */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Predefined Reasons</Label>
          {Object.entries(PREDEFINED_REASONS).map(([key, label]) => (
            <div
              key={key}
              draggable
              onDragStart={() => handleDragStart(key)}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                draggedItem === key ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/30'
              } ${surveyOptions.reasons.includes(key) ? '' : 'opacity-50'}`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <span className="text-sm">{label}</span>
              </div>
              <Switch
                checked={surveyOptions.reasons.includes(key)}
                onCheckedChange={() => toggleReason(key)}
              />
            </div>
          ))}
        </div>

        {/* Custom Reasons */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <Label className="text-sm text-muted-foreground">
            Custom Reasons ({surveyOptions.custom_reasons.length}/5)
          </Label>
          {surveyOptions.custom_reasons.map((reason, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
            >
              <span className="text-sm">{reason}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCustomReason(index)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {surveyOptions.custom_reasons.length < 5 && (
            <div className="flex gap-2">
              <Input
                placeholder="Add custom reason..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomReason()}
                className="bg-background/50"
              />
              <Button onClick={addCustomReason} size="icon" variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Other option indicator */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>"Other (free text)" is always enabled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
