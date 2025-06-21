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
          current_constraint_char: string | null
          current_constraints: Json | null
          current_target_word: string | null
          current_turn_type: string | null
          end_time: string | null
          id: string
          room_id: string
          start_time: string | null
          status: string
          turn_metadata: Json | null
          turn_sequence_number: number | null
          turn_start_time: string | null
        }
        Insert: {
          created_at?: string
          current_constraint_char?: string | null
          current_constraints?: Json | null
          current_target_word?: string | null
          current_turn_type?: string | null
          end_time?: string | null
          id?: string
          room_id: string
          start_time?: string | null
          status?: string
          turn_metadata?: Json | null
          turn_sequence_number?: number | null
          turn_start_time?: string | null
        }
        Update: {
          created_at?: string
          current_constraint_char?: string | null
          current_constraints?: Json | null
          current_target_word?: string | null
          current_turn_type?: string | null
          end_time?: string | null
          id?: string
          room_id?: string
          start_time?: string | null
          status?: string
          turn_metadata?: Json | null
          turn_sequence_number?: number | null
          turn_start_time?: string | null
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
      it_terms: {
        Row: {
          created_at: string
          description: string | null
          difficulty_id: number
          display_text: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_id: number
          display_text: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_id?: number
          display_text?: string
          id?: string
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
          constraint_char: string | null
          constraints_met: Json | null
          game_session_id: string
          id: string
          is_valid: boolean
          player_id: string
          score: number
          speed_coefficient: number | null
          submitted_at: string
          target_word: string | null
          turn_type: string | null
          typing_duration_ms: number | null
          typing_start_time: string | null
          word: string
        }
        Insert: {
          combo_at_time?: number
          constraint_char?: string | null
          constraints_met?: Json | null
          game_session_id: string
          id?: string
          is_valid: boolean
          player_id: string
          score: number
          speed_coefficient?: number | null
          submitted_at?: string
          target_word?: string | null
          turn_type?: string | null
          typing_duration_ms?: number | null
          typing_start_time?: string | null
          word: string
        }
        Update: {
          combo_at_time?: number
          constraint_char?: string | null
          constraints_met?: Json | null
          game_session_id?: string
          id?: string
          is_valid?: boolean
          player_id?: string
          score?: number
          speed_coefficient?: number | null
          submitted_at?: string
          target_word?: string | null
          turn_type?: string | null
          typing_duration_ms?: number | null
          typing_start_time?: string | null
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
      end_game_session: {
        Args: { p_room_id: string }
        Returns: Json
      }
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
      start_game_session: {
        Args: { p_room_id: string }
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

