import { useState } from 'react';
import { Loader2, RotateCcw, Eye, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { useCancelFlowConfig } from '@/hooks/useCancelFlowConfig';
import { SurveyOptionsEditor } from '@/components/cancel-flow/SurveyOptionsEditor';
import { OfferMappingEditor } from '@/components/cancel-flow/OfferMappingEditor';
import { BrandingEditor } from '@/components/cancel-flow/BrandingEditor';
import { WidgetSettingsEditor } from '@/components/cancel-flow/WidgetSettingsEditor';
import { CancelFlowPreview } from '@/components/cancel-flow/CancelFlowPreview';
import { TestLinkGenerator } from '@/components/cancel-flow/TestLinkGenerator';
import { WidgetEmbedCode } from '@/components/widget/WidgetEmbedCode';
import { WidgetPreviewModal } from '@/components/widget/WidgetPreviewModal';
import { useProfile } from '@/hooks/useProfile';

export default function CancelFlowBuilder() {
  const { config, loading, saving, updateConfig, resetToDefaults } = useCancelFlowConfig();
  const { profile } = useProfile();
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedLayout
      title="Cancel Flow Builder"
      subtitle="Design your voluntary churn prevention experience"
      showLogo
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Switch
            id="flow-active"
            checked={config?.is_active ?? true}
            onCheckedChange={(checked) => updateConfig({ is_active: checked })}
          />
          <Label htmlFor="flow-active" className="text-sm">
            {config?.is_active ? 'Flow active' : 'Flow inactive'}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewModalOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Full Preview
          </Button>
          <TestLinkGenerator profileId={profile?.id ?? null} />
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="design" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="design" className="gap-2">
            <Eye className="h-4 w-4" />
            Design Flow
          </TabsTrigger>
          <TabsTrigger value="embed" className="gap-2">
            <Code2 className="h-4 w-4" />
            Embed Widget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design">
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-3 space-y-6">
              {config && (
                <>
                  <SurveyOptionsEditor
                    surveyOptions={config.survey_options}
                    onUpdate={(options) => updateConfig({ survey_options: options })}
                  />
                  <OfferMappingEditor
                    offerSettings={config.offer_settings}
                    surveyOptions={config.survey_options}
                    onUpdate={(settings) => updateConfig({ offer_settings: settings })}
                  />
                  <BrandingEditor
                    branding={config.branding}
                    onUpdate={(branding) => updateConfig({ branding })}
                  />
                  <WidgetSettingsEditor
                    widgetSettings={config.widget_settings}
                    onUpdate={(settings) => updateConfig({ widget_settings: settings })}
                  />
                </>
              )}
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <div className="h-[calc(100vh-16rem)] rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
                  <CancelFlowPreview
                    config={config ? {
                      survey_options: config.survey_options,
                      offer_settings: config.offer_settings,
                      branding: config.branding,
                      widget_settings: config.widget_settings,
                    } : null}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="embed">
          {profile?.id && (
            <WidgetEmbedCode profileId={profile.id} />
          )}
        </TabsContent>
      </Tabs>

      {/* Full Preview Modal */}
      <WidgetPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        config={config ? {
          survey_options: config.survey_options,
          offer_settings: config.offer_settings,
          branding: config.branding,
          widget_settings: config.widget_settings,
        } : null}
      />
    </ProtectedLayout>
  );
}
