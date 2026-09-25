export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string;
          booth_id: number | null;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          festival_id: number;
          id: number;
          is_published: boolean;
          priority: string;
          published_at: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          booth_id?: number | null;
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          festival_id: number;
          id?: never;
          is_published?: boolean;
          priority?: string;
          published_at?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          booth_id?: number | null;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          festival_id?: number;
          id?: never;
          is_published?: boolean;
          priority?: string;
          published_at?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "booths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      booth_members: {
        Row: {
          booth_id: number;
          role: string;
          user_id: string;
        };
        Insert: {
          booth_id: number;
          role?: string;
          user_id: string;
        };
        Update: {
          booth_id?: number;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booth_members_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "booths";
            referencedColumns: ["id"];
          },
        ];
      };
      booths: {
        Row: {
          accent_color: string;
          category_id: number | null;
          concurrent_capacity: number;
          content_blocks: Json;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          estimated_wait_minutes: number;
          festival_id: number;
          id: number;
          location: string | null;
          logo_url: string | null;
          name: string;
          offerings: Json;
          operating_hours: Json;
          queue_enabled: boolean;
          queue_size: number;
          session_minutes: number;
          settings: Json;
          short_description: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          accent_color?: string;
          category_id?: number | null;
          concurrent_capacity?: number;
          content_blocks?: Json;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_wait_minutes?: number;
          festival_id: number;
          id?: never;
          location?: string | null;
          logo_url?: string | null;
          name: string;
          offerings?: Json;
          operating_hours?: Json;
          queue_enabled?: boolean;
          queue_size?: number;
          session_minutes?: number;
          settings?: Json;
          short_description?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          accent_color?: string;
          category_id?: number | null;
          concurrent_capacity?: number;
          content_blocks?: Json;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_wait_minutes?: number;
          festival_id?: number;
          id?: never;
          location?: string | null;
          logo_url?: string | null;
          name?: string;
          offerings?: Json;
          operating_hours?: Json;
          queue_enabled?: boolean;
          queue_size?: number;
          session_minutes?: number;
          settings?: Json;
          short_description?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booths_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booths_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          code: string;
          color: string | null;
          created_at: string;
          description: string | null;
          festival_id: number;
          icon: string | null;
          id: number;
          is_visible: boolean;
          name: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          color?: string | null;
          created_at?: string;
          description?: string | null;
          festival_id: number;
          icon?: string | null;
          id?: never;
          is_visible?: boolean;
          name: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          color?: string | null;
          created_at?: string;
          description?: string | null;
          festival_id?: number;
          icon?: string | null;
          id?: never;
          is_visible?: boolean;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "categories_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      checkins: {
        Row: {
          booth_id: number;
          checked_in_at: string;
          festival_id: number;
          id: number;
          qr_code_id: number | null;
          user_id: string;
        };
        Insert: {
          booth_id: number;
          checked_in_at?: string;
          festival_id: number;
          id?: never;
          qr_code_id?: number | null;
          user_id: string;
        };
        Update: {
          booth_id?: number;
          checked_in_at?: string;
          festival_id?: number;
          id?: never;
          qr_code_id?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checkins_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "booths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_qr_code_id_fkey";
            columns: ["qr_code_id"];
            isOneToOne: false;
            referencedRelation: "qr_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      festival_members: {
        Row: {
          created_at: string;
          custom_permissions: Json;
          festival_id: number;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          custom_permissions?: Json;
          festival_id: number;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          custom_permissions?: Json;
          festival_id?: number;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "festival_members_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      festival_member_roles: {
        Row: { festival_id: number; user_id: string; role: string; granted_at: string; };
        Insert: { festival_id: number; user_id: string; role: string; granted_at?: string; };
        Update: { festival_id?: number; user_id?: string; role?: string; granted_at?: string; };
        Relationships: [
          { foreignKeyName: "festival_member_roles_festival_id_fkey"; columns: ["festival_id"]; isOneToOne: false; referencedRelation: "festivals"; referencedColumns: ["id"]; },
        ];
      };
      festivals: {
        Row: {
          accent_color: string;
          created_at: string;
          created_by: string;
          ends_at: string | null;
          features: Json;
          id: number;
          is_public: boolean;
          logo_url: string | null;
          name: string;
          primary_color: string;
          secondary_color: string;
          slug: string;
          starts_at: string | null;
          status: string;
          terminology: Json;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          accent_color?: string;
          created_at?: string;
          created_by: string;
          ends_at?: string | null;
          features?: Json;
          id?: never;
          is_public?: boolean;
          logo_url?: string | null;
          name?: string;
          primary_color?: string;
          secondary_color?: string;
          slug: string;
          starts_at?: string | null;
          status?: string;
          terminology?: Json;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          accent_color?: string;
          created_at?: string;
          created_by?: string;
          ends_at?: string | null;
          features?: Json;
          id?: never;
          is_public?: boolean;
          logo_url?: string | null;
          name?: string;
          primary_color?: string;
          secondary_color?: string;
          slug?: string;
          starts_at?: string | null;
          status?: string;
          terminology?: Json;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_items: {
        Row: {
          booth_id: number;
          id: number;
          is_visible: boolean;
          low_stock_at: number;
          name: string;
          quantity: number;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          booth_id: number;
          id?: never;
          is_visible?: boolean;
          low_stock_at?: number;
          name: string;
          quantity?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          booth_id?: number;
          id?: never;
          is_visible?: boolean;
          low_stock_at?: number;
          name?: string;
          quantity?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "booths";
            referencedColumns: ["id"];
          },
        ];
      };
      mission_completions: {
        Row: {
          completed_at: string;
          festival_id: number;
          id: number;
          points_awarded: number;
          program_id: number;
          team_id: number | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          festival_id: number;
          id?: never;
          points_awarded: number;
          program_id: number;
          team_id?: number | null;
          user_id: string;
        };
        Update: {
          completed_at?: string;
          festival_id?: number;
          id?: never;
          points_awarded?: number;
          program_id?: number;
          team_id?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mission_completions_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mission_completions_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mission_completions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          student_number: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          student_number?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          student_number?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          booth_id: number | null;
          category_id: number | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          ends_at: string | null;
          festival_id: number;
          id: number;
          kind: string;
          points: number;
          settings: Json;
          starts_at: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          booth_id?: number | null;
          category_id?: number | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          festival_id: number;
          id?: never;
          kind?: string;
          points?: number;
          settings?: Json;
          starts_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          booth_id?: number | null;
          category_id?: number | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          festival_id?: number;
          id?: never;
          kind?: string;
          points?: number;
          settings?: Json;
          starts_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programs_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "booths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_codes: {
        Row: {
          booth_id: number | null;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          festival_id: number;
          id: number;
          is_active: boolean;
          label: string;
          max_uses: number | null;
          program_id: number | null;
          token_hash: string;
          use_count: number;
        };
        Insert: {
          booth_id?: number | null;
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          festival_id: number;
          id?: never;
          is_active?: boolean;
          label: string;
          max_uses?: number | null;
          program_id?: number | null;
          token_hash: string;
          use_count?: number;
        };
        Update: {
          booth_id?: number | null;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          festival_id?: number;
          id?: never;
          is_active?: boolean;
          label?: string;
          max_uses?: number | null;
          program_id?: number | null;
          token_hash?: string;
          use_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "qr_codes_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "booths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qr_codes_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qr_codes_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      queue_entries: {
        Row: {
          booth_id: number;
          called_at: string | null;
          companion_student_numbers: string[];
          completed_at: string | null;
          id: number;
          joined_at: string;
          party_size: number;
          queue_number: number;
          status: string;
          user_id: string;
        };
        Insert: {
          booth_id: number;
          called_at?: string | null;
          companion_student_numbers?: string[];
          completed_at?: string | null;
          id?: never;
          joined_at?: string;
          party_size?: number;
          queue_number: number;
          status?: string;
          user_id: string;
        };
        Update: {
          booth_id?: number;
          called_at?: string | null;
          companion_student_numbers?: string[];
          completed_at?: string | null;
          id?: never;
          joined_at?: string;
          party_size?: number;
          queue_number?: number;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_entries_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "booths";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          assignee_id: string | null;
          booth_id: number | null;
          category: string;
          created_at: string;
          description: string;
          festival_id: number;
          id: number;
          reporter_id: string;
          resolved_at: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          assignee_id?: string | null;
          booth_id?: number | null;
          category: string;
          created_at?: string;
          description: string;
          festival_id: number;
          id?: never;
          reporter_id: string;
          resolved_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assignee_id?: string | null;
          booth_id?: number | null;
          category?: string;
          created_at?: string;
          description?: string;
          festival_id?: number;
          id?: never;
          reporter_id?: string;
          resolved_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "booths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
      score_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          festival_id: number;
          id: number;
          points: number;
          reason: string | null;
          source: string;
          source_id: number | null;
          team_id: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          festival_id: number;
          id?: never;
          points: number;
          reason?: string | null;
          source: string;
          source_id?: number | null;
          team_id: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          festival_id?: number;
          id?: never;
          points?: number;
          reason?: string | null;
          source?: string;
          source_id?: number | null;
          team_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "score_events_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "score_events_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          joined_at: string;
          role: string;
          team_id: number;
          user_id: string;
        };
        Insert: {
          joined_at?: string;
          role?: string;
          team_id: number;
          user_id: string;
        };
        Update: {
          joined_at?: string;
          role?: string;
          team_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          festival_id: number;
          id: number;
          logo_url: string | null;
          member_capacity: number;
          name: string;
          primary_color: string;
          score: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          festival_id: number;
          id?: never;
          logo_url?: string | null;
          member_capacity?: number;
          name: string;
          primary_color?: string;
          score?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          festival_id?: number;
          id?: never;
          logo_url?: string | null;
          member_capacity?: number;
          name?: string;
          primary_color?: string;
          score?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_festival_id_fkey";
            columns: ["festival_id"];
            isOneToOne: false;
            referencedRelation: "festivals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ensure_participant_membership: {
        Args: Record<PropertyKey, never>;
        Returns: number | null;
      };
      create_qr_code_for_actor: {
        Args: {
          actor: string;
          code_label?: string;
          target_booth_id?: number;
          target_festival_id: number;
          target_program_id?: number;
        };
        Returns: string;
      };
      redeem_qr_for_actor: {
        Args: { actor: string; raw_code: string };
        Returns: Json;
      };
      assign_unassigned_students_to_teams: {
        Args: { target_festival_id: number };
        Returns: { assigned_count: number; unassigned_count: number }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
