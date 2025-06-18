import { atom } from 'jotai'
import { supabase, type Room, type RoomPlayer, type RealtimeRoom } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// 接続状態
export const connectionStateAtom = atom<'disconnected' | 'connecting' | 'connected'>('disconnected')

// ユーザー情報
export const userAtom = atom<{ id: string; name: string } | null>(null)

// 現在のルーム情報
export const currentRoomAtom = atom<RealtimeRoom | null>(null)

// ルーム内のプレイヤーリスト
export const playersAtom = atom<RoomPlayer[]>([])

// Realtimeチャンネル
export const realtimeChannelAtom = atom<RealtimeChannel | null>(null)

// ルーム作成
export const createRoomAtom = atom(
  null,
  async (get, set, { roomId, settings }: { 
    roomId: string
    settings: Room['settings']
  }) => {
    try {
      set(connectionStateAtom, 'connecting')
      
      // ユーザー作成
      const user = { id: crypto.randomUUID(), name: 'Host' }
      set(userAtom, user)
      
      // ルーム作成
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          id: roomId,
          host_id: user.id,
          settings,
          status: 'waiting'
        })
        .select()
        .single()
      
      if (roomError) throw roomError
      
      // プレイヤー作成（ホスト）
      const { data: playerData, error: playerError } = await supabase
        .from('room_players')
        .insert({
          id: user.id,
          room_id: roomId,
          name: user.name,
          score: 0,
          combo: 0,
          is_host: true
        })
        .select()
        .single()
      
      if (playerError) throw playerError
      
      // Realtimeチャンネルに参加
      const channel = supabase.channel(`room:${roomId}`)
      
      // プレイヤー参加イベント
      channel.on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'players',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload) => {
          console.log('New player joined:', payload.new)
          set(playersAtom, (prev) => [...prev, payload.new as RoomPlayer])
        }
      )
      
      // プレイヤー退出イベント
      channel.on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Player left:', payload.old)
          set(playersAtom, (prev) => prev.filter(p => p.id !== payload.old.id))
        }
      )
      
      // ルーム状態変更イベント
      channel.on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          console.log('Room updated:', payload.new)
          set(currentRoomAtom, (prev) => prev ? { ...prev, ...payload.new } : null)
        }
      )
      
      await channel.subscribe()
      set(realtimeChannelAtom, channel)
      
      // 初期状態設定
      set(currentRoomAtom, { ...roomData, players: [playerData] })
      set(playersAtom, [playerData])
      set(connectionStateAtom, 'connected')
      
      return { success: true, room: roomData }
      
    } catch (error) {
      console.error('Failed to create room:', error)
      set(connectionStateAtom, 'disconnected')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
)

// ルーム参加
export const joinRoomAtom = atom(
  null,
  async (get, set, { roomId, playerName }: { roomId: string; playerName: string }) => {
    try {
      set(connectionStateAtom, 'connecting')
      
      // ルーム存在確認
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*, players:room_players(*)')
        .eq('id', roomId)
        .eq('status', 'waiting')
        .single()
      
      if (roomError || !roomData) {
        throw new Error('Room not found or already started')
      }
      
      // 参加人数チェック
      const settings = roomData.settings as { maxPlayers: number; timeLimit: number; category: string }
      if (roomData.players && roomData.players.length >= settings.maxPlayers) {
        throw new Error('Room is full')
      }
      
      // ユーザー作成
      const user = { id: crypto.randomUUID(), name: playerName }
      set(userAtom, user)
      
      // プレイヤー追加
      const { data: playerData, error: playerError } = await supabase
        .from('room_players')
        .insert({
          id: user.id,
          room_id: roomId,
          name: playerName,
          score: 0,
          combo: 0,
          is_host: false
        })
        .select()
        .single()
      
      if (playerError) throw playerError
      
      // Realtimeチャンネルに参加
      const channel = supabase.channel(`room:${roomId}`)
      
      // 同じイベントリスナーを設定（ルーム作成時と同じ）
      channel.on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'players',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload) => {
          console.log('New player joined:', payload.new)
          set(playersAtom, (prev) => [...prev, payload.new as RoomPlayer])
        }
      )
      
      channel.on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Player left:', payload.old)
          set(playersAtom, (prev) => prev.filter(p => p.id !== payload.old.id))
        }
      )
      
      channel.on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          console.log('Room updated:', payload.new)
          set(currentRoomAtom, (prev) => prev ? { ...prev, ...payload.new } : null)
        }
      )
      
      await channel.subscribe()
      set(realtimeChannelAtom, channel)
      
      // 状態設定
      const typedPlayerData = playerData as RoomPlayer
      const typedPlayers = roomData.players as RoomPlayer[]
      set(currentRoomAtom, { ...roomData, players: [...typedPlayers, typedPlayerData] })
      set(playersAtom, [...typedPlayers, typedPlayerData])
      set(connectionStateAtom, 'connected')
      
      return { success: true, room: roomData }
      
    } catch (error) {
      console.error('Failed to join room:', error)
      set(connectionStateAtom, 'disconnected')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
)

// ルーム退出
export const leaveRoomAtom = atom(
  null,
  async (get, set) => {
    try {
      const user = get(userAtom)
      const channel = get(realtimeChannelAtom)
      
      if (user) {
        // プレイヤー削除
        await supabase
          .from('room_players')
          .delete()
          .eq('id', user.id)
      }
      
      if (channel) {
        await channel.unsubscribe()
      }
      
      // 状態リセット
      set(currentRoomAtom, null)
      set(playersAtom, [])
      set(realtimeChannelAtom, null)
      set(connectionStateAtom, 'disconnected')
      
    } catch (error) {
      console.error('Failed to leave room:', error)
    }
  }
)

// ゲーム開始（ホストのみ）
export const startGameAtom = atom(
  null,
  async (get, set) => {
    try {
      const user = get(userAtom)
      const room = get(currentRoomAtom)
      
      if (!user || !room || room.host_id !== user.id) {
        throw new Error('Only host can start the game')
      }
      
      // ルーム状態をプレイ中に変更
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', room.id)
      
      if (error) throw error
      
      return { success: true }
      
    } catch (error) {
      console.error('Failed to start game:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
)
