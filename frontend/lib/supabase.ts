import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 型安全なヘルパー型
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// 使いやすい型エイリアス
export type Room = Tables<'rooms'>
export type RoomPlayer = Tables<'room_players'>
export type GameSession = Tables<'game_sessions'>
export type WordSubmission = Tables<'word_submissions'>
export type ItTerm = Tables<'it_terms'>
export type Difficulty = Tables<'difficulties'>

// Realtime Types - 型安全なリアルタイム通信用
export interface RealtimeRoom extends Room {
  players: RoomPlayer[]
}

export interface RealtimeGameUpdate {
  type: 'player_joined' | 'player_left' | 'game_started' | 'score_updated' | 'game_ended'
  data: any
}
