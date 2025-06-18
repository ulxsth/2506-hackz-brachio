import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { type RoomPlayer, type RealtimeRoom } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// 接続状態
export const connectionStateAtom = atom<'disconnected' | 'connecting' | 'connected'>('disconnected')

// ユーザー情報（id + name/ニックネーム）
export const userAtom = atomWithStorage<{ id: string; name: string } | null>('user', null)

// 現在のルーム情報
export const currentRoomAtom = atom<RealtimeRoom | null>(null)

// ルーム内のプレイヤーリスト
export const playersAtom = atom<RoomPlayer[]>([])

// Realtimeチャンネル
export const realtimeChannelAtom = atom<RealtimeChannel | null>(null)

// エラー管理
export const errorAtom = atom<string | null>(null)

// エラークリア
export const clearErrorAtom = atom(
  null,
  (get, set) => {
    set(errorAtom, null)
  }
)
