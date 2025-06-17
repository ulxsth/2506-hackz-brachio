import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Room {
  id: string
  host_id: string
  settings: {
    timeLimit: number // 制限時間（分）
    maxPlayers: number // 最大参加人数
    category: string // カテゴリー
  }
  status: 'waiting' | 'playing' | 'finished'
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  name: string
  score: number
  combo: number
  is_host: boolean
  created_at: string
}

export interface GameSession {
  id: string
  room_id: string
  status: 'waiting' | 'playing' | 'finished'
  start_time?: string
  end_time?: string
  created_at: string
}

export interface WordSubmission {
  id: string
  game_session_id: string
  player_id: string
  word: string
  score: number
  is_valid: boolean
  submitted_at: string
}

// Realtime Types
export interface RealtimeRoom extends Room {
  players: Player[]
}

export interface RealtimeGameUpdate {
  type: 'player_joined' | 'player_left' | 'game_started' | 'score_updated' | 'game_ended'
  data: any
}
