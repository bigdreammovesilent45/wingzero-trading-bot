export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          balance: number | null
          broker_name: string | null
          created_at: string
          equity: number | null
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number | null
          broker_name?: string | null
          created_at?: string
          equity?: number | null
          is_active?: boolean | null
          user_id?: string
        }
        Update: {
          account_number?: string | null
          balance?: number | null
          broker_name?: string | null
          created_at?: string
          equity?: number | null
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          current_price: number | null
          id: string
          open_price: number | null
          opened_at: string | null
          position_type: string | null
          stop_loss: number | null
          symbol: string | null
          take_profit: number | null
          unrealized_pnl: number | null
          updated_at: string | null
          user_id: string | null
          volume: number | null
        }
        Insert: {
          current_price?: number | null
          id?: string
          open_price?: number | null
          opened_at?: string | null
          position_type?: string | null
          stop_loss?: number | null
          symbol?: string | null
          take_profit?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string | null
          volume?: number | null
        }
        Update: {
          current_price?: number | null
          id?: string
          open_price?: number | null
          opened_at?: string | null
          position_type?: string | null
          stop_loss?: number | null
          symbol?: string | null
          take_profit?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          close_price: number | null
          closed_at: string | null
          created_at: string | null
          id: string
          open_price: number | null
          opened_at: string | null
          profit: number | null
          status: string | null
          symbol: string | null
          trade_type: string | null
          user_id: string
          volume: number | null
        }
        Insert: {
          close_price?: number | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          open_price?: number | null
          opened_at?: string | null
          profit?: number | null
          status?: string | null
          symbol?: string | null
          trade_type?: string | null
          user_id?: string
          volume?: number | null
        }
        Update: {
          close_price?: number | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          open_price?: number | null
          opened_at?: string | null
          profit?: number | null
          status?: string | null
          symbol?: string | null
          trade_type?: string | null
          user_id?: string
          volume?: number | null
        }
        Relationships: []
      }
      wingzero_positions: {
        Row: {
          comment: string | null
          commission: number | null
          created_at: string
          current_price: number
          id: string
          open_price: number
          opened_at: string
          order_id: string
          position_type: string
          status: string
          stop_loss: number | null
          strategy: string | null
          swap: number
          symbol: string
          take_profit: number | null
          ticket: number
          unrealized_pnl: number
          updated_at: string | null
          user_id: string | null
          volume: number
        }
        Insert: {
          comment?: string | null
          commission?: number | null
          created_at?: string
          current_price: number
          id?: string
          open_price: number
          opened_at?: string
          order_id?: string
          position_type?: string
          status?: string
          stop_loss?: number | null
          strategy?: string | null
          swap: number
          symbol?: string
          take_profit?: number | null
          ticket: number
          unrealized_pnl: number
          updated_at?: string | null
          user_id?: string | null
          volume: number
        }
        Update: {
          comment?: string | null
          commission?: number | null
          created_at?: string
          current_price?: number
          id?: string
          open_price?: number
          opened_at?: string
          order_id?: string
          position_type?: string
          status?: string
          stop_loss?: number | null
          strategy?: string | null
          swap?: number
          symbol?: string
          take_profit?: number | null
          ticket?: number
          unrealized_pnl?: number
          updated_at?: string | null
          user_id?: string | null
          volume?: number
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
    Enums: {},
  },
} as const
