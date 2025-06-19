export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      difficulties: {
        Row: {
          created_at: string
          description: string | null
          id: number
          level: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          level: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          level?: number
          name?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          created_at: string
          current_constraints: Json | null
          end_time: string | null
          id: string
          room_id: string
          start_time: string | null
          status: string
        }
        Insert: {
          created_at?: string
          current_constraints?: Json | null
          end_time?: string | null
          id?: string
          room_id: string
          start_time?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          current_constraints?: Json | null
          end_time?: string | null
          id?: string
          room_id?: string
          start_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      it_term_categories: {
        Row: {
          category_id: number
          created_at: string
          it_term_id: string
        }
        Insert: {
          category_id: number
          created_at?: string
          it_term_id: string
        }
        Update: {
          category_id?: number
          created_at?: string
          it_term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_term_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_term_categories_it_term_id_fkey"
            columns: ["it_term_id"]
            isOneToOne: false
            referencedRelation: "it_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      it_terms: {
        Row: {
          aliases: string[] | null
          created_at: string
          description: string | null
          difficulty_id: number
          id: string
          term: string
          updated_at: string
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string
          description?: string | null
          difficulty_id: number
          id?: string
          term: string
          updated_at?: string
        }
        Update: {
          aliases?: string[] | null
          created_at?: string
          description?: string | null
          difficulty_id?: number
          id?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_terms_difficulty_id_fkey"
            columns: ["difficulty_id"]
            isOneToOne: false
            referencedRelation: "difficulties"
            referencedColumns: ["id"]
          },
        ]
      }
      player_ready_states: {
        Row: {
          assets_loaded: boolean
          created_at: string
          last_heartbeat: string | null
          latency_ms: number | null
          network_ready: boolean
          player_id: string
          ready_at: string | null
          room_id: string
          ui_ready: boolean
          updated_at: string
        }
        Insert: {
          assets_loaded?: boolean
          created_at?: string
          last_heartbeat?: string | null
          latency_ms?: number | null
          network_ready?: boolean
          player_id: string
          ready_at?: string | null
          room_id: string
          ui_ready?: boolean
          updated_at?: string
        }
        Update: {
          assets_loaded?: boolean
          created_at?: string
          last_heartbeat?: string | null
          latency_ms?: number | null
          network_ready?: boolean
          player_id?: string
          ready_at?: string | null
          room_id?: string
          ui_ready?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_ready_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "room_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_ready_states_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_players: {
        Row: {
          combo: number
          created_at: string
          id: string
          is_host: boolean
          name: string
          room_id: string
          score: number
        }
        Insert: {
          combo?: number
          created_at?: string
          id: string
          is_host?: boolean
          name: string
          room_id: string
          score?: number
        }
        Update: {
          combo?: number
          created_at?: string
          id?: string
          is_host?: boolean
          name?: string
          room_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          game_state: Json | null
          host_id: string
          id: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_state?: Json | null
          host_id: string
          id: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_state?: Json | null
          host_id?: string
          id?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      word_submissions: {
        Row: {
          combo_at_time: number
          constraints_met: Json | null
          game_session_id: string
          id: string
          is_valid: boolean
          player_id: string
          score: number
          submitted_at: string
          word: string
        }
        Insert: {
          combo_at_time?: number
          constraints_met?: Json | null
          game_session_id: string
          id?: string
          is_valid: boolean
          player_id: string
          score: number
          submitted_at?: string
          word: string
        }
        Update: {
          combo_at_time?: number
          constraints_met?: Json | null
          game_session_id?: string
          id?: string
          is_valid?: boolean
          player_id?: string
          score?: number
          submitted_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_submissions_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_submissions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "room_players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_server_time: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      start_game_countdown: {
        Args: { p_room_id: string }
        Returns: Json
      }
      start_game_preparation: {
        Args: {
          p_room_id: string
          p_preparation_timeout?: number
          p_countdown_duration?: number
        }
        Returns: Json
      }
      start_game_session: {
        Args: { p_room_id: string }
        Returns: Json
      }
      update_player_ready_state: {
        Args: {
          p_assets_loaded?: boolean
          p_latency_ms?: number
          p_ui_ready?: boolean
          p_network_ready?: boolean
          p_room_id: string
          p_player_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

