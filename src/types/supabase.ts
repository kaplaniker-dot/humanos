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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_reports: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assessment_id: string
          content_json: Json
          cost_usd: number
          created_at: string
          delivered_at: string | null
          id: string
          input_tokens: number
          mira_version: string
          output_tokens: number
          raw_response: string
          rejected_reason: string | null
          report_prompt_version: string
          status: Database["public"]["Enums"]["ai_report_status"]
          timing_ms: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assessment_id: string
          content_json: Json
          cost_usd: number
          created_at?: string
          delivered_at?: string | null
          id?: string
          input_tokens: number
          mira_version: string
          output_tokens: number
          raw_response: string
          rejected_reason?: string | null
          report_prompt_version: string
          status?: Database["public"]["Enums"]["ai_report_status"]
          timing_ms: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assessment_id?: string
          content_json?: Json
          cost_usd?: number
          created_at?: string
          delivered_at?: string | null
          id?: string
          input_tokens?: number
          mira_version?: string
          output_tokens?: number
          raw_response?: string
          rejected_reason?: string | null
          report_prompt_version?: string
          status?: Database["public"]["Enums"]["ai_report_status"]
          timing_ms?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "life_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      life_assessments: {
        Row: {
          age: number | null
          assessment_path: string
          bloodwork_details: Json
          bloodwork_has_recent: boolean | null
          bloodwork_known_anomalies: string[] | null
          bloodwork_last_test_date: string | null
          bloodwork_uses_medications: boolean | null
          coach_notes: string | null
          coach_reviewed_at: string | null
          completed_at: string | null
          created_at: string
          current_step: number
          deleted_at: string | null
          exercise_details: Json
          exercise_frequency_per_week: number | null
          exercise_intensity: string | null
          exercise_minutes_per_session: number | null
          exercise_primary_type: string | null
          gender: string | null
          general_recommendations: string[] | null
          habits_alcohol_frequency: string | null
          habits_details: Json
          habits_meditation_frequency: string | null
          habits_smoking_status: string | null
          height_cm: number | null
          id: string
          nutrition_details: Json
          nutrition_meals_per_day: number | null
          nutrition_primary_diet: string | null
          nutrition_quality_score: number | null
          nutrition_water_liters: number | null
          selected_dimensions: string[]
          service_type: string | null
          status: string
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          assessment_path: string
          bloodwork_details?: Json
          bloodwork_has_recent?: boolean | null
          bloodwork_known_anomalies?: string[] | null
          bloodwork_last_test_date?: string | null
          bloodwork_uses_medications?: boolean | null
          coach_notes?: string | null
          coach_reviewed_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          deleted_at?: string | null
          exercise_details?: Json
          exercise_frequency_per_week?: number | null
          exercise_intensity?: string | null
          exercise_minutes_per_session?: number | null
          exercise_primary_type?: string | null
          gender?: string | null
          general_recommendations?: string[] | null
          habits_alcohol_frequency?: string | null
          habits_details?: Json
          habits_meditation_frequency?: string | null
          habits_smoking_status?: string | null
          height_cm?: number | null
          id?: string
          nutrition_details?: Json
          nutrition_meals_per_day?: number | null
          nutrition_primary_diet?: string | null
          nutrition_quality_score?: number | null
          nutrition_water_liters?: number | null
          selected_dimensions: string[]
          service_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          assessment_path?: string
          bloodwork_details?: Json
          bloodwork_has_recent?: boolean | null
          bloodwork_known_anomalies?: string[] | null
          bloodwork_last_test_date?: string | null
          bloodwork_uses_medications?: boolean | null
          coach_notes?: string | null
          coach_reviewed_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          deleted_at?: string | null
          exercise_details?: Json
          exercise_frequency_per_week?: number | null
          exercise_intensity?: string | null
          exercise_minutes_per_session?: number | null
          exercise_primary_type?: string | null
          gender?: string | null
          general_recommendations?: string[] | null
          habits_alcohol_frequency?: string | null
          habits_details?: Json
          habits_meditation_frequency?: string | null
          habits_smoking_status?: string | null
          height_cm?: number | null
          id?: string
          nutrition_details?: Json
          nutrition_meals_per_day?: number | null
          nutrition_primary_diet?: string | null
          nutrition_quality_score?: number | null
          nutrition_water_liters?: number | null
          selected_dimensions?: string[]
          service_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          primary_goal: string | null
          timezone: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          primary_goal?: string | null
          timezone?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          primary_goal?: string | null
          timezone?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      soft_delete_assessment: {
        Args: { assessment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ai_report_status: "pending_review" | "approved" | "rejected" | "delivered"
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
      ai_report_status: ["pending_review", "approved", "rejected", "delivered"],
    },
  },
} as const
