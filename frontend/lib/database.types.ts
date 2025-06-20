// Database Types - Updated for Dual Turn System
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          id: string
          room_id: string
          started_at: string | null
          ended_at: string | null
          created_at: string
          // 新しいターンシステム用フィールド
          current_turn_type: 'typing' | 'constraint'
          current_target_word: string | null
          current_constraint_char: string | null
          turn_start_time: string | null
          turn_sequence_number: number
        }
        Insert: {
          id?: string
          room_id: string
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
          // 新しいターンシステム用フィールド
          current_turn_type?: 'typing' | 'constraint'
          current_target_word?: string | null
          current_constraint_char?: string | null
          turn_start_time?: string | null
          turn_sequence_number?: number
        }
        Update: {
          id?: string
          room_id?: string
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
          // 新しいターンシステム用フィールド
          current_turn_type?: 'typing' | 'constraint'
          current_target_word?: string | null
          current_constraint_char?: string | null
          turn_start_time?: string | null
          turn_sequence_number?: number
        }
      }
      word_submissions: {
        Row: {
          id: string
          game_session_id: string
          player_id: string
          word: string
          score: number
          combo_at_time: number
          is_valid: boolean
          constraints_met: Json | null
          submitted_at: string
          // 新しいターンシステム用フィールド
          turn_type: 'typing' | 'constraint'
          target_word: string | null
          constraint_char: string | null
          typing_start_time: string | null
          typing_duration_ms: number | null
          speed_coefficient: number
        }
        Insert: {
          id?: string
          game_session_id: string
          player_id: string
          word: string
          score: number
          combo_at_time: number
          is_valid: boolean
          constraints_met?: Json | null
          submitted_at?: string
          // 新しいターンシステム用フィールド
          turn_type?: 'typing' | 'constraint'
          target_word?: string | null
          constraint_char?: string | null
          typing_start_time?: string | null
          typing_duration_ms?: number | null
          speed_coefficient?: number
        }
        Update: {
          id?: string
          game_session_id?: string
          player_id?: string
          word?: string
          score?: number
          combo_at_time?: number
          is_valid?: boolean
          constraints_met?: Json | null
          submitted_at?: string
          // 新しいターンシステム用フィールド
          turn_type?: 'typing' | 'constraint'
          target_word?: string | null
          constraint_char?: string | null
          typing_start_time?: string | null
          typing_duration_ms?: number | null
          speed_coefficient?: number
        }
      }
      rooms: {
        Row: {
          id: string
          host_id: string
          room_code: string
          status: 'waiting' | 'playing' | 'finished'
          max_players: number
          settings: Json
          game_state: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          room_code: string
          status?: 'waiting' | 'playing' | 'finished'
          max_players?: number
          settings?: Json
          game_state?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          room_code?: string
          status?: 'waiting' | 'playing' | 'finished'
          max_players?: number
          settings?: Json
          game_state?: Json
          created_at?: string
          updated_at?: string
        }
      }
      room_players: {
        Row: {
          id: string
          room_id: string
          name: string
          score: number
          combo: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          score?: number
          combo?: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          score?: number
          combo?: number
          created_at?: string
        }
      }
      it_terms: {
        Row: {
          id: string
          display_text: string
          romaji_text: string
          difficulty_id: number
          category: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          display_text: string
          romaji_text: string
          difficulty_id: number
          category?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_text?: string
          romaji_text?: string
          difficulty_id?: number
          category?: string | null
          description?: string | null
          created_at?: string
        }
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
  }
}

// ゲーム用の型定義
export interface TurnData {
  type: 'typing' | 'constraint'
  targetWord?: string        // 通常ターン用
  constraintChar?: string    // 制約ターン用
  coefficient: number        // 得点係数
  startTime: Date
  sequenceNumber: number
}

export interface TurnSubmissionParams {
  gameSessionId: string
  playerId: string
  word: string
  turnType: 'typing' | 'constraint'
  targetWord?: string
  constraintChar?: string
  typingStartTime?: Date
  typingDuration?: number
  speedCoefficient: number
  score: number
  comboAtTime: number
  isValid: boolean
  constraintsMet?: any[]
}

export interface ScoringParams {
  turnType: 'typing' | 'constraint'
  word: string
  difficulty: number
  coefficient: number // 速度係数 or 制約係数
  combo: number
}
