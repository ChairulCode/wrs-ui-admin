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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      about: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          mission: string | null
          school_level: Database["public"]["Enums"]["school_level"]
          title: string
          updated_at: string
          vision: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          mission?: string | null
          school_level: Database["public"]["Enums"]["school_level"]
          title: string
          updated_at?: string
          vision?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mission?: string | null
          school_level?: Database["public"]["Enums"]["school_level"]
          title?: string
          updated_at?: string
          vision?: string | null
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achievement_date: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          image_url: string | null
          school_level: Database["public"]["Enums"]["school_level"]
          title: string
          updated_at: string
        }
        Insert: {
          achievement_date: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          image_url?: string | null
          school_level: Database["public"]["Enums"]["school_level"]
          title: string
          updated_at?: string
        }
        Update: {
          achievement_date?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          image_url?: string | null
          school_level?: Database["public"]["Enums"]["school_level"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_date: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          image_url: string | null
          school_level: Database["public"]["Enums"]["school_level"]
          title: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          image_url?: string | null
          school_level: Database["public"]["Enums"]["school_level"]
          title: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          image_url?: string | null
          school_level?: Database["public"]["Enums"]["school_level"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          announcement_date: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_important: boolean
          school_level: Database["public"]["Enums"]["school_level"]
          title: string
          updated_at: string
        }
        Insert: {
          announcement_date: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_important?: boolean
          school_level: Database["public"]["Enums"]["school_level"]
          title: string
          updated_at?: string
        }
        Update: {
          announcement_date?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_important?: boolean
          school_level?: Database["public"]["Enums"]["school_level"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      carousels: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean
          order_position: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          order_position?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          order_position?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade_promotions: {
        Row: {
          academic_year: string
          created_at: string
          created_by: string | null
          current_grade: string
          id: string
          notes: string | null
          promoted_grade: string
          school_level: Database["public"]["Enums"]["school_level"]
          status: string
          student_name: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          created_by?: string | null
          current_grade: string
          id?: string
          notes?: string | null
          promoted_grade: string
          school_level: Database["public"]["Enums"]["school_level"]
          status?: string
          student_name: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          created_by?: string | null
          current_grade?: string
          id?: string
          notes?: string | null
          promoted_grade?: string
          school_level?: Database["public"]["Enums"]["school_level"]
          status?: string
          student_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          school_level: Database["public"]["Enums"]["school_level"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          school_level?: Database["public"]["Enums"]["school_level"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          school_level?: Database["public"]["Enums"]["school_level"] | null
          updated_at?: string
        }
        Relationships: []
      }
      subject_grades: {
        Row: {
          academic_year: string
          created_at: string
          created_by: string | null
          grade: string
          id: string
          notes: string | null
          school_level: Database["public"]["Enums"]["school_level"]
          score: number
          semester: string
          student_name: string
          subject_name: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          created_by?: string | null
          grade: string
          id?: string
          notes?: string | null
          school_level: Database["public"]["Enums"]["school_level"]
          score: number
          semester: string
          student_name: string
          subject_name: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          created_by?: string | null
          grade?: string
          id?: string
          notes?: string | null
          school_level?: Database["public"]["Enums"]["school_level"]
          score?: number
          semester?: string
          student_name?: string
          subject_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "viewer" | "admin" | "superadmin"
      school_level: "tk" | "sd" | "smp" | "sma"
      user_role: "superadmin" | "admin"
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
      app_role: ["viewer", "admin", "superadmin"],
      school_level: ["tk", "sd", "smp", "sma"],
      user_role: ["superadmin", "admin"],
    },
  },
} as const
