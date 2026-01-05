import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface SurveyOptions {
  reasons: string[];
  custom_reasons: string[];
  display_order: string[];
}

export interface OfferSettings {
  default_offer: 'none' | 'discount' | 'pause';
  reason_mappings: Record<string, { offer_type: 'none' | 'discount' | 'pause'; discount_percentage?: number; discount_duration_months?: number; pause_duration_months?: number }>;
  discount_percentage: number;
  discount_duration_months: number;
  pause_duration_months: number;
}

export interface Branding {
  primary_color: string;
  logo_url: string | null;
  dark_mode: boolean;
}

export interface WidgetSettings {
  display_mode: 'modal' | 'hosted';
  accept_button_text: string;
  decline_button_text: string;
}

export interface CancelFlowConfig {
  id: string;
  profile_id: string;
  survey_options: SurveyOptions;
  offer_settings: OfferSettings;
  branding: Branding;
  widget_settings: WidgetSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SURVEY_OPTIONS: SurveyOptions = {
  reasons: ['too_expensive', 'not_using_enough', 'missing_features', 'found_alternative', 'technical_issues', 'need_a_break'],
  custom_reasons: [],
  display_order: ['too_expensive', 'not_using_enough', 'missing_features', 'found_alternative', 'technical_issues', 'need_a_break']
};

const DEFAULT_OFFER_SETTINGS: OfferSettings = {
  default_offer: 'none',
  reason_mappings: {},
  discount_percentage: 20,
  discount_duration_months: 3,
  pause_duration_months: 1
};

const DEFAULT_BRANDING: Branding = {
  primary_color: '#14B8A6',
  logo_url: null,
  dark_mode: true
};

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  display_mode: 'modal',
  accept_button_text: 'Accept Offer',
  decline_button_text: 'Continue Cancellation'
};

export function useCancelFlowConfig() {
  const { profile } = useProfile();
  const [config, setConfig] = useState<CancelFlowConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('cancel_flow_config')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          ...data,
          survey_options: data.survey_options as unknown as SurveyOptions,
          offer_settings: data.offer_settings as unknown as OfferSettings,
          branding: data.branding as unknown as Branding,
          widget_settings: data.widget_settings as unknown as WidgetSettings,
        });
      } else {
        // Create default config
        const { data: newConfig, error: createError } = await supabase
          .from('cancel_flow_config')
          .insert([{
            profile_id: profile.id,
            survey_options: DEFAULT_SURVEY_OPTIONS,
            offer_settings: DEFAULT_OFFER_SETTINGS,
            branding: DEFAULT_BRANDING,
            widget_settings: DEFAULT_WIDGET_SETTINGS,
          } as never])
          .select()
          .single();

        if (createError) throw createError;

        setConfig({
          ...newConfig,
          survey_options: newConfig.survey_options as unknown as SurveyOptions,
          offer_settings: newConfig.offer_settings as unknown as OfferSettings,
          branding: newConfig.branding as unknown as Branding,
          widget_settings: newConfig.widget_settings as unknown as WidgetSettings,
        });
      }
    } catch (err) {
      console.error('Error fetching cancel flow config:', err);
      toast.error('Failed to load cancel flow configuration');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      fetchConfig();
    }
  }, [profile?.id, fetchConfig]);

  const updateConfig = useCallback(async (updates: Partial<Pick<CancelFlowConfig, 'survey_options' | 'offer_settings' | 'branding' | 'widget_settings' | 'is_active'>>) => {
    if (!config?.id) return;

    setSaving(true);
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.survey_options !== undefined) dbUpdates.survey_options = updates.survey_options;
      if (updates.offer_settings !== undefined) dbUpdates.offer_settings = updates.offer_settings;
      if (updates.branding !== undefined) dbUpdates.branding = updates.branding;
      if (updates.widget_settings !== undefined) dbUpdates.widget_settings = updates.widget_settings;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;

      const { error } = await supabase
        .from('cancel_flow_config')
        .update(dbUpdates)
        .eq('id', config.id);

      if (error) throw error;

      setConfig(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Configuration saved');
    } catch (err) {
      console.error('Error updating config:', err);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }, [config?.id]);

  const resetToDefaults = useCallback(async () => {
    await updateConfig({
      survey_options: DEFAULT_SURVEY_OPTIONS,
      offer_settings: DEFAULT_OFFER_SETTINGS,
      branding: DEFAULT_BRANDING,
      widget_settings: DEFAULT_WIDGET_SETTINGS,
    });
  }, [updateConfig]);

  return {
    config,
    loading,
    saving,
    updateConfig,
    resetToDefaults,
    refetch: fetchConfig,
  };
}
