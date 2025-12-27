export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      churn_risk_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
          severity: number
          stripe_object_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          severity: number
          stripe_object_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          severity?: number
          stripe_object_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      churn_risk_snapshot: {
        Row: {
          score: number
          top_reasons: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          score?: number
          top_reasons?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          score?: number
          top_reasons?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          canceled_at: string | null
          created_at: string
          email: string
          id: string
          last_active_at: string | null
          name: string
          plan_amount: number
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          email: string
          id?: string
          last_active_at?: string | null
          name: string
          plan_amount?: number
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          email?: string
          id?: string
          last_active_at?: string | null
          name?: string
          plan_amount?: number
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          plan_interest: string | null
          source: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          id?: string
          plan_interest?: string | null
          source?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          plan_interest?: string | null
          source?: string | null
        }
        Relationships: []
      }
      payment_recovery: {
        Row: {
          attempt_count: number
          created_at: string
          email: string
          id: string
          last_emailed_at: string | null
          status: Database["public"]["Enums"]["payment_recovery_status"]
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          email: string
          id?: string
          last_emailed_at?: string | null
          status?: Database["public"]["Enums"]["payment_recovery_status"]
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          email?: string
          id?: string
          last_emailed_at?: string | null
          status?: Database["public"]["Enums"]["payment_recovery_status"]
          updated_at?: string
        }
        Relationships: []
      }
      processed_stripe_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_threshold: number | null
          company_name: string | null
          created_at: string
          display_name: string | null
          email_notifications: boolean | null
          id: string
          timezone: string | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          alert_threshold?: number | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          alert_threshold?: number | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      recovery_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["recovery_action_type"]
          created_at: string
          id: string
          note: string | null
          recovery_case_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["recovery_action_type"]
          created_at?: string
          id?: string
          note?: string | null
          recovery_case_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["recovery_action_type"]
          created_at?: string
          id?: string
          note?: string | null
          recovery_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_actions_recovery_case_id_fkey"
            columns: ["recovery_case_id"]
            isOneToOne: false
            referencedRelation: "recovery_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_cases: {
        Row: {
          amount_at_risk: number
          churn_reason: Database["public"]["Enums"]["churn_reason"]
          created_at: string
          currency: string
          customer_reference: string
          deadline_at: string
          first_action_at: string | null
          id: string
          invoice_reference: string | null
          opened_at: string
          owner_user_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["recovery_case_status"]
          updated_at: string
        }
        Insert: {
          amount_at_risk: number
          churn_reason?: Database["public"]["Enums"]["churn_reason"]
          created_at?: string
          currency?: string
          customer_reference: string
          deadline_at?: string
          first_action_at?: string | null
          id?: string
          invoice_reference?: string | null
          opened_at?: string
          owner_user_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["recovery_case_status"]
          updated_at?: string
        }
        Update: {
          amount_at_risk?: number
          churn_reason?: Database["public"]["Enums"]["churn_reason"]
          created_at?: string
          currency?: string
          customer_reference?: string
          deadline_at?: string
          first_action_at?: string | null
          id?: string
          invoice_reference?: string | null
          opened_at?: string
          owner_user_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["recovery_case_status"]
          updated_at?: string
        }
        Relationships: []
      }
      stripe_accounts: {
        Row: {
          connected: boolean | null
          created_at: string
          id: string
          stripe_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connected?: boolean | null
          created_at?: string
          id?: string
          stripe_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connected?: boolean | null
          created_at?: string
          id?: string
          stripe_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          livemode: boolean
          refresh_token: string | null
          scope: string | null
          session_id: string
          stripe_user_id: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          livemode?: boolean
          refresh_token?: string | null
          scope?: string | null
          session_id: string
          stripe_user_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          livemode?: boolean
          refresh_token?: string | null
          scope?: string | null
          session_id?: string
          stripe_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          attempt_count: number | null
          created_at: string
          id: string
          next_payment_attempt: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          attempt_count?: number | null
          created_at?: string
          id?: string
          next_payment_attempt?: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          attempt_count?: number | null
          created_at?: string
          id?: string
          next_payment_attempt?: string | null
          status?: string
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      welcome_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          resend_message_id: string | null
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          resend_message_id?: string | null
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          resend_message_id?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      churn_reason:
        | "card_expired"
        | "insufficient_funds"
        | "bank_decline"
        | "no_retry_attempted"
        | "unknown_failure"
      payment_recovery_status:
        | "needs_payment"
        | "emailed_1"
        | "emailed_2"
        | "resolved"
      recovery_action_type:
        | "message_sent"
        | "note"
        | "marked_recovered"
        | "marked_expired"
      recovery_case_status: "open" | "recovered" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      churn_reason: [
        "card_expired",
        "insufficient_funds",
        "bank_decline",
        "no_retry_attempted",
        "unknown_failure",
      ],
      payment_recovery_status: [
        "needs_payment",
        "emailed_1",
        "emailed_2",
        "resolved",
      ],
      recovery_action_type: [
        "message_sent",
        "note",
        "marked_recovered",
        "marked_expired",
      ],
      recovery_case_status: ["open", "recovered", "expired"],
    },
  },
} as const
