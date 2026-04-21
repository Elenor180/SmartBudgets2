export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      budgets: {
        Row: {
          category_id: string;
          created_at: string;
          id: string;
          limit_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          id?: string;
          limit_amount: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          id?: string;
          limit_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          category_id: string;
          created_at: string;
          current_amount: number;
          id: string;
          name: string;
          notes: string;
          target_amount: number;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          current_amount?: number;
          id?: string;
          name: string;
          notes?: string;
          target_amount: number;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          current_amount?: number;
          id?: string;
          name?: string;
          notes?: string;
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          currency: string;
          email: string;
          full_name: string;
          id: string;
          monthly_income: number;
          setup_complete: boolean;
          started_at: string;
          theme: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          email?: string;
          full_name?: string;
          id: string;
          monthly_income?: number;
          setup_complete?: boolean;
          started_at?: string;
          theme?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          email?: string;
          full_name?: string;
          id?: string;
          monthly_income?: number;
          setup_complete?: boolean;
          started_at?: string;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          active: boolean;
          amount: number | null;
          category_id: string | null;
          created_at: string;
          due_date: string | null;
          id: string;
          kind: string;
          note: string;
          threshold: number | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          amount?: number | null;
          category_id?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          kind: string;
          note?: string;
          threshold?: number | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          amount?: number | null;
          category_id?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          kind?: string;
          note?: string;
          threshold?: number | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          description: string;
          id: string;
          notes: string;
          occurred_on: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          description: string;
          id?: string;
          notes?: string;
          occurred_on: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          notes?: string;
          occurred_on?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_workspace_snapshot: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      replace_workspace_snapshot: {
        Args: {
          p_budgets: Json;
          p_currency: string;
          p_email: string;
          p_full_name: string;
          p_goals: Json;
          p_monthly_income: number;
          p_reminders: Json;
          p_setup_complete: boolean;
          p_started_at: string;
          p_theme: string;
          p_transactions: Json;
        };
        Returns: undefined;
      };
      upsert_profile_settings: {
        Args: {
          p_currency?: string | null;
          p_full_name?: string | null;
          p_monthly_income?: number | null;
          p_setup_complete?: boolean | null;
          p_started_at?: string | null;
          p_theme?: string | null;
        };
        Returns: {
          created_at: string;
          currency: string;
          email: string;
          full_name: string;
          id: string;
          monthly_income: number;
          setup_complete: boolean;
          started_at: string;
          theme: string;
          updated_at: string;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
