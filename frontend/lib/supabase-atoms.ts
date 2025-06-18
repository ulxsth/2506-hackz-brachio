import { atom } from 'jotai'
import { supabase, type Room, type RoomPlayer, type RealtimeRoom } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// 接続状態
export const connectionStateAtom = atom<'disconnected' | 'connecting' | 'connected'>('disconnected')

// ユーザー情報（id + name/ニックネーム）
export const userAtom = atom<{ id: string; name: string } | null>(null)

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

// ルーム作成
export const createRoomAtom = atom(
  null,
  async (get, set, { roomId, settings }: { 
    roomId: string
    settings: Room['settings']
  }) => {
    try {
      set(connectionStateAtom, 'connecting')
      set(errorAtom, null) // エラークリア
      
      // 既存のユーザー情報を取得
      const currentUser = get(userAtom)
      if (!currentUser?.name) {
        throw new Error('ユーザー情報が見つかりません')
      }
      
      // ルーム作成
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          id: roomId,
          host_id: currentUser.id,
          settings,
          status: 'waiting'
        })
        .select()
        .single()
      
      if (roomError) {
        // 重複するあいことば（Primary Key制約違反）をチェック
        if (roomError.code === '23505' && roomError.message.includes('rooms_pkey')) {
          throw new Error('このあいことばは既に使用されています。別のあいことばを入力してください。')
        }
        throw roomError
      }
      
      // プレイヤー作成（ホスト）
      const { data: playerData, error: playerError } = await supabase
        .from('room_players')
        .insert({
          id: currentUser.id,
          room_id: roomId,
          name: currentUser.name,
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
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload) => {
          const newPlayer = payload.new as RoomPlayer
          set(playersAtom, (prev) => {
            // 重複チェック：既に同じIDのプレイヤーがいる場合は追加しない
            if (prev.some(p => p.id === newPlayer.id)) {
              return prev
            }
            return [...prev, newPlayer]
          })
        }
      )
      
      // プレイヤー退出イベント
      channel.on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set(errorAtom, errorMessage)
      set(connectionStateAtom, 'disconnected')
      return { success: false, error: errorMessage }
    }
  }
)

// ルーム参加
export const joinRoomAtom = atom(
  null,
  async (get, set, { roomId, playerName }: { roomId: string; playerName: string }) => {
    try {
      set(connectionStateAtom, 'connecting')
      set(errorAtom, null) // エラークリア
      
      // 既存のユーザー情報を取得（ただし名前は参加時の名前を使用）
      const currentUser = get(userAtom)
      if (!currentUser) {
        throw new Error('ユーザー情報が見つかりません')
      }
      
      // プレイヤー名でユーザー情報を更新
      const updatedUser = { ...currentUser, name: playerName }
      set(userAtom, updatedUser)
      
      // ルーム存在確認
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*, players:room_players(*)')
        .eq('id', roomId)
        .eq('status', 'waiting')
        .single()
      
      if (roomError || !roomData) {
        if (roomError?.code === 'PGRST116') {
          throw new Error('入力されたあいことばのルームが見つかりません。あいことばを確認してください。')
        }
        throw new Error('ルームが見つからないか、既にゲームが開始されています。')
      }
      
      // 参加人数チェック
      const settings = roomData.settings as { maxPlayers: number; timeLimit: number; category: string }
      if (roomData.players && roomData.players.length >= settings.maxPlayers) {
        throw new Error('ルームの定員に達しています。別のルームに参加してください。')
      }
      
      // プレイヤー追加
      const { data: playerData, error: playerError } = await supabase
        .from('room_players')
        .insert({
          id: updatedUser.id,
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
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload) => {
          const newPlayer = payload.new as RoomPlayer
          set(playersAtom, (prev) => {
            // 重複チェック：既に同じIDのプレイヤーがいる場合は追加しない
            if (prev.some(p => p.id === newPlayer.id)) {
              return prev
            }
            return [...prev, newPlayer]
          })
        }
      )
      
      channel.on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
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
          set(currentRoomAtom, (prev) => prev ? { ...prev, ...payload.new } : null)
        }
      )
      
      await channel.subscribe()
      set(realtimeChannelAtom, channel)
      
      // 状態設定
      const typedPlayerData = playerData as RoomPlayer
      const typedPlayers = roomData.players as RoomPlayer[]
      
      // 重複を避けて新しいプレイヤーを追加
      const uniquePlayers = [...typedPlayers]
      if (!uniquePlayers.some(p => p.id === typedPlayerData.id)) {
        uniquePlayers.push(typedPlayerData)
      }
      
      set(currentRoomAtom, { ...roomData, players: uniquePlayers })
      set(playersAtom, uniquePlayers)
      set(connectionStateAtom, 'connected')
      
      return { success: true, room: roomData }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set(errorAtom, errorMessage)
      set(connectionStateAtom, 'disconnected')
      return { success: false, error: errorMessage }
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set(errorAtom, errorMessage)
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set(errorAtom, errorMessage)
      return { success: false, error: errorMessage }
    }
  }
)
