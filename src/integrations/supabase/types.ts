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
      advanced_strategies: {
        Row: {
          backtest_results: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parameters: Json
          strategy_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backtest_results?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parameters?: Json
          strategy_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backtest_results?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parameters?: Json
          strategy_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key: string
          last_used: string | null
          name: string
          permissions: string[]
          rate_limit: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key: string
          last_used?: string | null
          name: string
          permissions?: string[]
          rate_limit?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key?: string
          last_used?: string | null
          name?: string
          permissions?: string[]
          rate_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      portfolio_performance: {
        Row: {
          created_at: string
          daily_pnl: number
          date: string
          drawdown: number
          id: string
          portfolio_id: string
          total_return: number
          total_value: number
        }
        Insert: {
          created_at?: string
          daily_pnl?: number
          date?: string
          drawdown?: number
          id?: string
          portfolio_id: string
          total_return?: number
          total_value?: number
        }
        Update: {
          created_at?: string
          daily_pnl?: number
          date?: string
          drawdown?: number
          id?: string
          portfolio_id?: string
          total_return?: number
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_performance_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          allocation_strategy: Json
          created_at: string
          description: string | null
          id: string
          name: string
          total_balance: number
          total_equity: number
          total_profit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_strategy?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          total_balance?: number
          total_equity?: number
          total_profit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_strategy?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          total_balance?: number
          total_equity?: number
          total_profit?: number
          updated_at?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          data: Json
          format: string
          generated_at: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          format: string
          generated_at?: string
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          format?: string
          generated_at?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_run: string | null
          next_run: string | null
          report_type: string
          schedule: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          next_run?: string | null
          report_type: string
          schedule: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          next_run?: string | null
          report_type?: string
          schedule?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          event_description: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
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
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
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
      trading_accounts: {
        Row: {
          account_id: string
          account_type: string
          allocation_percentage: number
          balance: number
          broker: string
          created_at: string
          equity: number
          free_margin: number
          id: string
          is_active: boolean
          margin: number
          portfolio_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          account_type: string
          allocation_percentage?: number
          balance?: number
          broker: string
          created_at?: string
          equity?: number
          free_margin?: number
          id?: string
          is_active?: boolean
          margin?: number
          portfolio_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_type?: string
          allocation_percentage?: number
          balance?: number
          broker?: string
          created_at?: string
          equity?: number
          free_margin?: number
          id?: string
          is_active?: boolean
          margin?: number
          portfolio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_accounts_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_preferences: {
        Row: {
          auto_close_at_loss: number
          auto_close_at_profit: number
          created_at: string
          email_alerts: boolean
          forbidden_symbols: string[]
          id: string
          max_daily_volume: number
          max_position_size: number
          notifications_enabled: boolean
          preferred_symbols: string[]
          push_notifications: boolean
          risk_tolerance: string
          sms_alerts: boolean
          timezone: string
          trading_hours_end: string
          trading_hours_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_close_at_loss?: number
          auto_close_at_profit?: number
          created_at?: string
          email_alerts?: boolean
          forbidden_symbols?: string[]
          id?: string
          max_daily_volume?: number
          max_position_size?: number
          notifications_enabled?: boolean
          preferred_symbols?: string[]
          push_notifications?: boolean
          risk_tolerance?: string
          sms_alerts?: boolean
          timezone?: string
          trading_hours_end?: string
          trading_hours_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_close_at_loss?: number
          auto_close_at_profit?: number
          created_at?: string
          email_alerts?: boolean
          forbidden_symbols?: string[]
          id?: string
          max_daily_volume?: number
          max_position_size?: number
          notifications_enabled?: boolean
          preferred_symbols?: string[]
          push_notifications?: boolean
          risk_tolerance?: string
          sms_alerts?: boolean
          timezone?: string
          trading_hours_end?: string
          trading_hours_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          api_access_enabled: boolean
          created_at: string
          failed_login_lockout_duration: number
          id: string
          ip_whitelist: unknown[]
          last_password_change: string | null
          login_notifications: boolean
          max_login_attempts: number
          password_expiry_days: number
          require_2fa_for_trading: boolean
          session_timeout: number
          two_factor_enabled: boolean
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_access_enabled?: boolean
          created_at?: string
          failed_login_lockout_duration?: number
          id?: string
          ip_whitelist?: unknown[]
          last_password_change?: string | null
          login_notifications?: boolean
          max_login_attempts?: number
          password_expiry_days?: number
          require_2fa_for_trading?: boolean
          session_timeout?: number
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_access_enabled?: boolean
          created_at?: string
          failed_login_lockout_duration?: number
          id?: string
          ip_whitelist?: unknown[]
          last_password_change?: string | null
          login_notifications?: boolean
          max_login_attempts?: number
          password_expiry_days?: number
          require_2fa_for_trading?: boolean
          session_timeout?: number
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_activity_log: {
        Row: {
          activity_type: string
          data: Json | null
          id: string
          message: string
          timestamp: string
          user_id: string
        }
        Insert: {
          activity_type: string
          data?: Json | null
          id?: string
          message: string
          timestamp?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          data?: Json | null
          id?: string
          message?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_configs: {
        Row: {
          brain_enabled: boolean
          brain_mode: string
          config_data: Json
          config_name: string
          created_at: string
          id: string
          max_daily_drawdown: number
          max_risk_per_trade: number
          min_confidence: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brain_enabled?: boolean
          brain_mode?: string
          config_data?: Json
          config_name?: string
          created_at?: string
          id?: string
          max_daily_drawdown?: number
          max_risk_per_trade?: number
          min_confidence?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brain_enabled?: boolean
          brain_mode?: string
          config_data?: Json
          config_name?: string
          created_at?: string
          id?: string
          max_daily_drawdown?: number
          max_risk_per_trade?: number
          min_confidence?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_credentials: {
        Row: {
          broker_type: string
          created_at: string
          encrypted_account_id: string
          encrypted_api_key: string
          environment: string
          id: string
          server_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_type: string
          created_at?: string
          encrypted_account_id: string
          encrypted_api_key: string
          environment?: string
          id?: string
          server_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_type?: string
          created_at?: string
          encrypted_account_id?: string
          encrypted_api_key?: string
          environment?: string
          id?: string
          server_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_diagnostics: {
        Row: {
          auto_fixes_applied: Json | null
          component: string
          created_at: string | null
          health_status: string | null
          id: string
          issues_detected: Json | null
          metrics: Json
          user_id: string
        }
        Insert: {
          auto_fixes_applied?: Json | null
          component: string
          created_at?: string | null
          health_status?: string | null
          id?: string
          issues_detected?: Json | null
          metrics: Json
          user_id: string
        }
        Update: {
          auto_fixes_applied?: Json | null
          component?: string
          created_at?: string | null
          health_status?: string | null
          id?: string
          issues_detected?: Json | null
          metrics?: Json
          user_id?: string
        }
        Relationships: []
      }
      wingzero_engine_status: {
        Row: {
          created_at: string
          engine_mode: string
          id: string
          is_running: boolean
          last_cycle: string | null
          last_heartbeat: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          engine_mode?: string
          id?: string
          is_running?: boolean
          last_cycle?: string | null
          last_heartbeat?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          engine_mode?: string
          id?: string
          is_running?: boolean
          last_cycle?: string | null
          last_heartbeat?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_heartbeats: {
        Row: {
          active_positions: number | null
          daily_pnl: number | null
          data: Json | null
          engine_status: string
          heartbeat_time: string
          id: string
          user_id: string
        }
        Insert: {
          active_positions?: number | null
          daily_pnl?: number | null
          data?: Json | null
          engine_status: string
          heartbeat_time?: string
          id?: string
          user_id: string
        }
        Update: {
          active_positions?: number | null
          daily_pnl?: number | null
          data?: Json | null
          engine_status?: string
          heartbeat_time?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_learning_data: {
        Row: {
          action_taken: Json
          confidence_impact: number | null
          created_at: string | null
          id: string
          input_data: Json
          learning_type: string
          lesson_learned: string | null
          outcome: Json
          user_id: string
        }
        Insert: {
          action_taken: Json
          confidence_impact?: number | null
          created_at?: string | null
          id?: string
          input_data: Json
          learning_type: string
          lesson_learned?: string | null
          outcome: Json
          user_id: string
        }
        Update: {
          action_taken?: Json
          confidence_impact?: number | null
          created_at?: string | null
          id?: string
          input_data?: Json
          learning_type?: string
          lesson_learned?: string | null
          outcome?: Json
          user_id?: string
        }
        Relationships: []
      }
      wingzero_market_intelligence: {
        Row: {
          analysis: Json
          content: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          impact_score: number | null
          intelligence_type: string
          sentiment: string | null
          source_url: string | null
          user_id: string
        }
        Insert: {
          analysis: Json
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          impact_score?: number | null
          intelligence_type: string
          sentiment?: string | null
          source_url?: string | null
          user_id: string
        }
        Update: {
          analysis?: Json
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          impact_score?: number | null
          intelligence_type?: string
          sentiment?: string | null
          source_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wingzero_multi_accounts: {
        Row: {
          accounts: Json
          allocation: Json
          created_at: string
          id: string
          name: string
          risk_distribution: string
          strategy: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accounts?: Json
          allocation?: Json
          created_at?: string
          id?: string
          name: string
          risk_distribution?: string
          strategy: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accounts?: Json
          allocation?: Json
          created_at?: string
          id?: string
          name?: string
          risk_distribution?: string
          strategy?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_optimizations: {
        Row: {
          actual_improvement: number | null
          applied_at: string | null
          created_at: string | null
          expected_improvement: number | null
          id: string
          new_config: Json | null
          old_config: Json | null
          optimization_type: string
          status: string | null
          trigger_reason: string
          user_id: string
        }
        Insert: {
          actual_improvement?: number | null
          applied_at?: string | null
          created_at?: string | null
          expected_improvement?: number | null
          id?: string
          new_config?: Json | null
          old_config?: Json | null
          optimization_type: string
          status?: string | null
          trigger_reason: string
          user_id: string
        }
        Update: {
          actual_improvement?: number | null
          applied_at?: string | null
          created_at?: string | null
          expected_improvement?: number | null
          id?: string
          new_config?: Json | null
          old_config?: Json | null
          optimization_type?: string
          status?: string | null
          trigger_reason?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_performance_analytics: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          id: string
          insights: Json
          metrics: Json
          time_period: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insights: Json
          metrics: Json
          time_period: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insights?: Json
          metrics?: Json
          time_period?: string
          updated_at?: string | null
          user_id?: string
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
      wingzero_risk_models: {
        Row: {
          confidence: number
          created_at: string
          id: string
          lookback: number
          name: string
          parameters: Json
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          lookback?: number
          name: string
          parameters?: Json
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          lookback?: number
          name?: string
          parameters?: Json
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wingzero_strategies: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          parameters: Json
          parent_strategy_id: string | null
          performance_metrics: Json | null
          status: string | null
          strategy_name: string
          strategy_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          parameters: Json
          parent_strategy_id?: string | null
          performance_metrics?: Json | null
          status?: string | null
          strategy_name: string
          strategy_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          parameters?: Json
          parent_strategy_id?: string | null
          performance_metrics?: Json | null
          status?: string | null
          strategy_name?: string
          strategy_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wingzero_trading_accounts: {
        Row: {
          balance: number
          broker: string
          created_at: string
          currency: string
          encrypted_credentials: string | null
          environment: string
          equity: number
          id: string
          leverage: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          broker: string
          created_at?: string
          currency?: string
          encrypted_credentials?: string | null
          environment?: string
          equity?: number
          id?: string
          leverage?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          broker?: string
          created_at?: string
          currency?: string
          encrypted_credentials?: string | null
          environment?: string
          equity?: number
          id?: string
          leverage?: number
          name?: string
          updated_at?: string
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
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      insert_ai_strategy: {
        Args: {
          p_user_id: string
          p_strategy_name: string
          p_strategy_type: string
          p_parameters: Json
          p_status?: string
          p_created_by?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "premium"
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
      app_role: ["admin", "user", "premium"],
    },
  },
} as const
