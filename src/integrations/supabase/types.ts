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
      crop_analysis: {
        Row: {
          created_at: string
          crop: string | null
          diagnosis: string | null
          estimated_price: number | null
          farmer_id: string
          health_score: number | null
          id: string
          image_url: string | null
          recommendations: Json
          status: string | null
        }
        Insert: {
          created_at?: string
          crop?: string | null
          diagnosis?: string | null
          estimated_price?: number | null
          farmer_id: string
          health_score?: number | null
          id?: string
          image_url?: string | null
          recommendations?: Json
          status?: string | null
        }
        Update: {
          created_at?: string
          crop?: string | null
          diagnosis?: string | null
          estimated_price?: number | null
          farmer_id?: string
          health_score?: number | null
          id?: string
          image_url?: string | null
          recommendations?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_analysis_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_listings: {
        Row: {
          created_at: string
          crop: string
          expected_price: number | null
          farmer_id: string
          harvest_date: string | null
          id: string
          image_url: string | null
          location: string
          notes: string | null
          quality_grade: string | null
          quantity: number
          status: string
          unit: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop: string
          expected_price?: number | null
          farmer_id: string
          harvest_date?: string | null
          id?: string
          image_url?: string | null
          location: string
          notes?: string | null
          quality_grade?: string | null
          quantity: number
          status?: string
          unit?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop?: string
          expected_price?: number | null
          farmer_id?: string
          harvest_date?: string | null
          id?: string
          image_url?: string | null
          location?: string
          notes?: string | null
          quality_grade?: string | null
          quantity?: number
          status?: string
          unit?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_listings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_varieties: {
        Row: {
          created_at: string
          crop: string
          duration_days: number | null
          id: string
          name_en: string
          name_hi: string
          notes_en: string | null
          notes_hi: string | null
          season: string | null
          water_need: string | null
          yield_quintal_per_acre: number | null
        }
        Insert: {
          created_at?: string
          crop: string
          duration_days?: number | null
          id?: string
          name_en: string
          name_hi: string
          notes_en?: string | null
          notes_hi?: string | null
          season?: string | null
          water_need?: string | null
          yield_quintal_per_acre?: number | null
        }
        Update: {
          created_at?: string
          crop?: string
          duration_days?: number | null
          id?: string
          name_en?: string
          name_hi?: string
          notes_en?: string | null
          notes_hi?: string | null
          season?: string | null
          water_need?: string | null
          yield_quintal_per_acre?: number | null
        }
        Relationships: []
      }
      crops: {
        Row: {
          category: string
          created_at: string
          emoji: string
          id: string
          name_en: string
          name_hi: string
          season: string
        }
        Insert: {
          category?: string
          created_at?: string
          emoji?: string
          id?: string
          name_en: string
          name_hi: string
          season?: string
        }
        Update: {
          category?: string
          created_at?: string
          emoji?: string
          id?: string
          name_en?: string
          name_hi?: string
          season?: string
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          created_at: string
          crop: string
          id: string
          location: string
          market: string
          observed_on: string
          price: number
          source: string
          unit: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop: string
          id?: string
          location: string
          market: string
          observed_on?: string
          price: number
          source?: string
          unit?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop?: string
          id?: string
          location?: string
          market?: string
          observed_on?: string
          price?: number
          source?: string
          unit?: string
          variety?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          district: string | null
          full_name: string
          id: string
          land_acres: number | null
          language: string
          phone: string | null
          state: string | null
          village: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          full_name?: string
          id: string
          land_acres?: number | null
          language?: string
          phone?: string | null
          state?: string | null
          village?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          land_acres?: number | null
          language?: string
          phone?: string | null
          state?: string | null
          village?: string | null
        }
        Relationships: []
      }
      schemes: {
        Row: {
          active: boolean
          benefit: string | null
          category: string
          created_at: string
          description_en: string
          description_hi: string
          eligibility: string | null
          id: string
          link: string | null
          name_en: string
          name_hi: string
        }
        Insert: {
          active?: boolean
          benefit?: string | null
          category?: string
          created_at?: string
          description_en: string
          description_hi: string
          eligibility?: string | null
          id?: string
          link?: string | null
          name_en: string
          name_hi: string
        }
        Update: {
          active?: boolean
          benefit?: string | null
          category?: string
          created_at?: string
          description_en?: string
          description_hi?: string
          eligibility?: string | null
          id?: string
          link?: string | null
          name_en?: string
          name_hi?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
