import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings, Monitor, ExternalLink } from 'lucide-react';
import type { WidgetSettings } from '@/hooks/useCancelFlowConfig';

interface WidgetSettingsEditorProps {
  widgetSettings: WidgetSettings;
  onUpdate: (settings: WidgetSettings) => void;
}

export function WidgetSettingsEditor({ widgetSettings, onUpdate }: WidgetSettingsEditorProps) {
  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Widget Settings
        </CardTitle>
        <CardDescription>
          Configure how the cancel flow appears to customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Mode */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Display Mode</Label>
          <RadioGroup
            value={widgetSettings.display_mode}
            onValueChange={(value) => onUpdate({ ...widgetSettings, display_mode: value as 'modal' | 'hosted' })}
            className="grid grid-cols-2 gap-4"
          >
            <label
              htmlFor="modal"
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${
                widgetSettings.display_mode === 'modal' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border/50 bg-muted/30 hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="modal" id="modal" className="sr-only" />
              <Monitor className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Modal Overlay</span>
              <span className="text-xs text-muted-foreground text-center">
                Opens as a popup on your site
              </span>
            </label>
            <label
              htmlFor="hosted"
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${
                widgetSettings.display_mode === 'hosted' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border/50 bg-muted/30 hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="hosted" id="hosted" className="sr-only" />
              <ExternalLink className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Hosted Page</span>
              <span className="text-xs text-muted-foreground text-center">
                Redirects to a ChurnShield page
              </span>
            </label>
          </RadioGroup>
        </div>

        {/* Button Text */}
        <div className="space-y-4">
          <Label className="text-sm text-muted-foreground">Button Labels</Label>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Accept Offer Button</Label>
              <Input
                value={widgetSettings.accept_button_text}
                onChange={(e) => onUpdate({ ...widgetSettings, accept_button_text: e.target.value })}
                placeholder="Accept Offer"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Decline Button</Label>
              <Input
                value={widgetSettings.decline_button_text}
                onChange={(e) => onUpdate({ ...widgetSettings, decline_button_text: e.target.value })}
                placeholder="Continue Cancellation"
                className="bg-background/50"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
