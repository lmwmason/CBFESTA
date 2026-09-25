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
      booth_members: {
        Row: {
          booth_id: number
          role: string
          user_id: string
        }
        Insert: {
          booth_id: number
          role?: string
          user_id: string
        }
        Update: {
          booth_id?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booth_members_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "booths"
            referencedColumns: ["id"]
          },
        ]
      }
      booths: {
        Row: {
          accent_color: string
          category_id: number | null
          content_blocks: Json
          cover_url: string | null
          created_at: string
          description: string | null
          estimated_wait_minutes: number
          festival_id: number
          id: number
          location: string | null
          logo_url: string | null
          name: string
          offerings: Json
          operating_hours: Json
          queue_size: number
          settings: Json
          short_description: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          category_id?: number | null
          content_blocks?: Json
          cover_url?: string | null
          created_at?: string
          description?: string | null
          estimated_wait_minutes?: number
          festival_id: number
          id?: never
          location?: string | null
          logo_url?: string | null
          name: string
          offerings?: Json
          operating_hours?: Json
          queue_size?: number
          settings?: Json
          short_description?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          category_id?: number | null
          content_blocks?: Json
          cover_url?: string | null
          created_at?: string
          description?: string | null
          estimated_wait_minutes?: number
          festival_id?: number
          id?: never
          location?: string | null
          logo_url?: string | null
          name?: string
          offerings?: Json
          operating_hours?: Json
          queue_size?: number
          settings?: Json
          short_description?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booths_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booths_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          code: string
          color: string | null
          created_at: string
          description: string | null
          festival_id: number
          icon: string | null
          id: number
          is_visible: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          festival_id: number
          icon?: string | null
          id?: never
          is_visible?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          festival_id?: number
          icon?: string | null
          id?: never
          is_visible?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_members: {
        Row: {
          created_at: string
          custom_permissions: Json
          festival_id: number
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_permissions?: Json
          festival_id: number
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_permissions?: Json
          festival_id?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "festival_members_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      festivals: {
        Row: {
          accent_color: string
          created_at: string
          created_by: string
          ends_at: string | null
          features: Json
          id: number
          is_public: boolean
          logo_url: string | null
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          starts_at: string | null
          status: string
          terminology: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          created_by: string
          ends_at?: string | null
          features?: Json
          id?: never
          is_public?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          slug: string
          starts_at?: string | null
          status?: string
          terminology?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          created_by?: string
          ends_at?: string | null
          features?: Json
          id?: never
          is_public?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          slug?: string
          starts_at?: string | null
          status?: string
          terminology?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          booth_id: number | null
          category_id: number | null
          cover_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          festival_id: number
          id: number
          kind: string
          points: number
          settings: Json
          starts_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          booth_id?: number | null
          category_id?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          festival_id: number
          id?: never
          kind?: string
          points?: number
          settings?: Json
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          booth_id?: number | null
          category_id?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          festival_id?: number
          id?: never
          kind?: string
          points?: number
          settings?: Json
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "booths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string
          role: string
          team_id: number
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: string
          team_id: number
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: string
          team_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          festival_id: number
          id: number
          logo_url: string | null
          name: string
          primary_color: string
          score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          festival_id: number
          id?: never
          logo_url?: string | null
          name: string
          primary_color?: string
          score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          festival_id?: number
          id?: never
          logo_url?: string | null
          name?: string
          primary_color?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
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

