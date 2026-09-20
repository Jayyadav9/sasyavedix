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
      crop_plans: {
        Row: {
          area_acres: number | null
          created_at: string
          crop: string
          farmer_id: string
          harvest_date: string | null
          id: string
          notes: string | null
          sowing_date: string
          status: string
          variety: string | null
        }
        Insert: {
          area_acres?: number | null
          created_at?: string
          crop: string
          farmer_id: string
          harvest_date?: string | null
          id?: string
          notes?: string | null
          sowing_date: string
          status?: string
          variety?: string | null
        }
        Update: {
          area_acres?: number | null
          created_at?: string
          crop?: string
          farmer_id?: string
          harvest_date?: string | null
          id?: string
          notes?: string | null
          sowing_date?: string
          status?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_plans_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_tasks: {
        Row: {
          created_at: string
          done: boolean
          done_on: string | null
          due_date: string
          farmer_id: string
          id: string
          kind: string
          plan_id: string
          title_en: string
          title_hi: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          done_on?: string | null
          due_date: string
          farmer_id: string
          id?: string
          kind?: string
          plan_id: string
          title_en: string
          title_hi: string
        }
        Update: {
          created_at?: string
          done?: boolean
          done_on?: string | null
          due_date?: string
          farmer_id?: string
          id?: string
          kind?: string
          plan_id?: string
          title_en?: string
          title_hi?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_tasks_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "crop_plans"
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
      notifications: {
        Row: {
          body_en: string | null
          body_hi: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read: boolean
          title_en: string
          title_hi: string
          user_id: string
        }
        Insert: {
          body_en?: string | null
          body_hi?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title_en: string
          title_hi: string
          user_id: string
        }
        Update: {
          body_en?: string | null
          body_hi?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title_en?: string
          title_hi?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          buyer_id: string
          created_at: string
          farmer_id: string
          id: string
          listing_id: string
          message: string | null
          price_per_quintal: number
          quantity: number
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          farmer_id: string
          id?: string
          listing_id: string
          message?: string | null
          price_per_quintal: number
          quantity: number
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          farmer_id?: string
          id?: string
          listing_id?: string
          message?: string | null
          price_per_quintal?: number
          quantity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "crop_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_note: string | null
          created_at: string
          crop: string
          delivery_date: string | null
          farmer_id: string
          farmer_note: string | null
          id: string
          invoice_no: string | null
          listing_id: string | null
          offer_id: string | null
          payment_method: string | null
          payment_ref: string | null
          pickup_location: string | null
          price_per_quintal: number
          quantity: number
          status: string
          total_amount: number
          updated_at: string
          variety: string | null
        }
        Insert: {
          buyer_id: string
          buyer_note?: string | null
          created_at?: string
          crop: string
          delivery_date?: string | null
          farmer_id: string
          farmer_note?: string | null
          id?: string
          invoice_no?: string | null
          listing_id?: string | null
          offer_id?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          pickup_location?: string | null
          price_per_quintal: number
          quantity: number
          status?: string
          total_amount: number
          updated_at?: string
          variety?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_note?: string | null
          created_at?: string
          crop?: string
          delivery_date?: string | null
          farmer_id?: string
          farmer_note?: string | null
          id?: string
          invoice_no?: string | null
          listing_id?: string | null
          offer_id?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          pickup_location?: string | null
          price_per_quintal?: number
          quantity?: number
          status?: string
          total_amount?: number
          updated_at?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "crop_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          farmer_id: string
          id: string
          method: string
          note: string | null
          order_id: string
          paid_on: string
          reference: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          farmer_id: string
          id?: string
          method?: string
          note?: string | null
          order_id: string
          paid_on?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          farmer_id?: string
          id?: string
          method?: string
          note?: string | null
          order_id?: string
          paid_on?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          active: boolean
          created_at: string
          crop: string
          direction: string
          farmer_id: string
          id: string
          last_notified_on: string | null
          market: string | null
          target_price: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          crop: string
          direction?: string
          farmer_id: string
          id?: string
          last_notified_on?: string | null
          market?: string | null
          target_price: number
        }
        Update: {
          active?: boolean
          created_at?: string
          crop?: string
          direction?: string
          farmer_id?: string
          id?: string
          last_notified_on?: string | null
          market?: string | null
          target_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      soil_tests: {
        Row: {
          created_at: string
          ec: number | null
          farmer_id: string
          id: string
          location: string | null
          nitrogen: number
          notes: string | null
          organic_carbon: number | null
          ph: number
          phosphorus: number
          potassium: number
          sample_date: string
          target_crop: string | null
        }
        Insert: {
          created_at?: string
          ec?: number | null
          farmer_id: string
          id?: string
          location?: string | null
          nitrogen: number
          notes?: string | null
          organic_carbon?: number | null
          ph: number
          phosphorus: number
          potassium: number
          sample_date?: string
          target_crop?: string | null
        }
        Update: {
          created_at?: string
          ec?: number | null
          farmer_id?: string
          id?: string
          location?: string | null
          nitrogen?: number
          notes?: string | null
          organic_carbon?: number | null
          ph?: number
          phosphorus?: number
          potassium?: number
          sample_date?: string
          target_crop?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soil_tests_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "farmer" | "buyer" | "admin"
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
    Enums: {
      app_role: ["farmer", "buyer", "admin"],
    },
  },
} as const
