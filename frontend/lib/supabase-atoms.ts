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
      console.log('🚀 createRoomAtom: ルーム作成開始', { roomId, settings })
      set(connectionStateAtom, 'connecting')
      set(errorAtom, null) // エラークリア
      
      // 既存のユーザー情報を取得
      const currentUser = get(userAtom)
      console.log('👤 createRoomAtom: 現在のユーザー情報', currentUser)
      if (!currentUser?.name) {
        throw new Error('ユーザー情報が見つかりません')
      }
      
      // ルーム作成
      console.log('🏠 createRoomAtom: ルーム作成処理開始', { roomId, hostId: currentUser.id })
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
        console.error('❌ createRoomAtom: ルーム作成エラー', roomError)
        // 重複するあいことば（Primary Key制約違反）をチェック
        if (roomError.code === '23505' && roomError.message.includes('rooms_pkey')) {
          throw new Error('このあいことばは既に使用されています。別のあいことばを入力してください。')
        }
        throw roomError
      }
      
      console.log('✅ createRoomAtom: ルーム作成成功', roomData)
      
      // プレイヤー作成（ホスト）
      console.log('👥 createRoomAtom: ホストプレイヤー作成開始', { userId: currentUser.id, roomId })
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
      
      console.log('✅ createRoomAtom: ホストプレイヤー作成成功', playerData)
      
      // Realtimeチャンネルに参加
      console.log('📡 createRoomAtom: Realtimeチャンネル接続開始', `room:${roomId}`)
      const channel = supabase.channel(`room:${roomId}`)
      
      // プレイヤー参加イベント
      console.log('🎯 createRoomAtom: プレイヤー参加イベントリスナー設定')
      channel.on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload) => {
          console.log('👥 realtime: プレイヤー参加イベント受信', payload.new)
          const newPlayer = payload.new as RoomPlayer
          set(playersAtom, (prev) => {
            // 重複チェック：既に同じIDのプレイヤーがいる場合は追加しない
            if (prev.some(p => p.id === newPlayer.id)) {
              console.log('⚠️ realtime: 重複するプレイヤーIDをスキップ', newPlayer.id)
              return prev
            }
            console.log('✅ realtime: プレイヤーを追加', newPlayer.id)
            return [...prev, newPlayer]
          })
        }
      )
      
      // プレイヤー退出イベント
      console.log('🚪 createRoomAtom: プレイヤー退出イベントリスナー設定')
      channel.on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('👋 realtime: プレイヤー退出イベント受信', payload.old)
          set(playersAtom, (prev) => prev.filter(p => p.id !== payload.old.id))
        }
      )
      
      // ルーム状態変更イベント
      console.log('🏠 createRoomAtom: ルーム状態変更イベントリスナー設定')
      channel.on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          console.log('🔄 realtime: ルーム状態変更イベント受信', payload.new)
          set(currentRoomAtom, (prev) => prev ? { ...prev, ...payload.new } : null)
        }
      )
      
      console.log('🔌 createRoomAtom: チャンネル購読開始')
      await channel.subscribe()
      console.log('✅ createRoomAtom: チャンネル購読成功')
      set(realtimeChannelAtom, channel)
      
      // 初期状態設定
      console.log('🎯 createRoomAtom: 初期状態設定', { roomData, playerData })
      set(currentRoomAtom, { ...roomData, players: [playerData] })
      set(playersAtom, [playerData])
      set(connectionStateAtom, 'connected')
      
      console.log('🎉 createRoomAtom: ルーム作成完了')
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
      console.log('🚀 joinRoomAtom: ルーム参加開始', { roomId, playerName })
      set(connectionStateAtom, 'connecting')
      set(errorAtom, null) // エラークリア
      
      // 既存のユーザー情報を取得（ただし名前は参加時の名前を使用）
      const currentUser = get(userAtom)
      console.log('👤 joinRoomAtom: 現在のユーザー情報', currentUser)
      if (!currentUser) {
        throw new Error('ユーザー情報が見つかりません')
      }
      
      // プレイヤー名でユーザー情報を更新
      const updatedUser = { ...currentUser, name: playerName }
      console.log('🔄 joinRoomAtom: ユーザー情報更新', updatedUser)
      set(userAtom, updatedUser)
      
      // ルーム存在確認
      console.log('🔍 joinRoomAtom: ルーム存在確認開始', roomId)
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*, players:room_players(*)')
        .eq('id', roomId)
        .eq('status', 'waiting')
        .single()
      
      if (roomError || !roomData) {
        console.error('❌ joinRoomAtom: ルーム取得エラー', roomError)
        if (roomError?.code === 'PGRST116') {
          throw new Error('入力されたあいことばのルームが見つかりません。あいことばを確認してください。')
        }
        throw new Error('ルームが見つからないか、既にゲームが開始されています。')
      }
      
      console.log('✅ joinRoomAtom: ルーム取得成功', roomData)
      
      // 参加人数チェック
      console.log('👥 joinRoomAtom: 参加人数チェック開始')
      const settings = roomData.settings as { maxPlayers: number; timeLimit: number; category: string }
      if (roomData.players && roomData.players.length >= settings.maxPlayers) {
        console.error('❌ joinRoomAtom: 定員オーバー', { currentPlayers: roomData.players.length, maxPlayers: settings.maxPlayers })
        throw new Error('ルームの定員に達しています。別のルームに参加してください。')
      }
      
      console.log('✅ joinRoomAtom: 参加人数チェック通過', { currentPlayers: roomData.players?.length || 0, maxPlayers: settings.maxPlayers })
      
      // プレイヤー追加
      console.log('👥 joinRoomAtom: プレイヤー追加開始', { userId: updatedUser.id, playerName, roomId })
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
      
      console.log('✅ joinRoomAtom: プレイヤー追加成功', playerData)
      
      // Realtimeチャンネルに参加
      console.log('📡 joinRoomAtom: Realtimeチャンネル接続開始', `room:${roomId}`)
      const channel = supabase.channel(`room:${roomId}`)
      
      // 同じイベントリスナーを設定（ルーム作成時と同じ）
      console.log('🎯 joinRoomAtom: プレイヤー参加イベントリスナー設定')
      channel.on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload) => {
          console.log('👥 realtime: プレイヤー参加イベント受信 (join)', payload.new)
          const newPlayer = payload.new as RoomPlayer
          set(playersAtom, (prev) => {
            // 重複チェック：既に同じIDのプレイヤーがいる場合は追加しない
            if (prev.some(p => p.id === newPlayer.id)) {
              console.log('⚠️ realtime: 重複するプレイヤーIDをスキップ (join)', newPlayer.id)
              return prev
            }
            console.log('✅ realtime: プレイヤーを追加 (join)', newPlayer.id)
            return [...prev, newPlayer]
          })
        }
      )
      
      console.log('🚪 joinRoomAtom: プレイヤー退出イベントリスナー設定')
      channel.on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('👋 realtime: プレイヤー退出イベント受信 (join)', payload.old)
          set(playersAtom, (prev) => prev.filter(p => p.id !== payload.old.id))
        }
      )
      
      console.log('🏠 joinRoomAtom: ルーム状態変更イベントリスナー設定')
      channel.on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          console.log('🔄 realtime: ルーム状態変更イベント受信 (join)', payload.new)
          set(currentRoomAtom, (prev) => prev ? { ...prev, ...payload.new } : null)
        }
      )
      
      console.log('🔌 joinRoomAtom: チャンネル購読開始')
      await channel.subscribe()
      console.log('✅ joinRoomAtom: チャンネル購読成功')
      set(realtimeChannelAtom, channel)
      
      // 状態設定
      const typedPlayerData = playerData as RoomPlayer
      const typedPlayers = roomData.players as RoomPlayer[]
      
      // 重複を避けて新しいプレイヤーを追加
      const uniquePlayers = [...typedPlayers]
      if (!uniquePlayers.some(p => p.id === typedPlayerData.id)) {
        uniquePlayers.push(typedPlayerData)
      }
      
      console.log('🎯 joinRoomAtom: 初期状態設定', { roomData, uniquePlayers })
      set(currentRoomAtom, { ...roomData, players: uniquePlayers })
      set(playersAtom, uniquePlayers)
      set(connectionStateAtom, 'connected')
      
      console.log('🎉 joinRoomAtom: ルーム参加完了')
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
      console.log('🚀 leaveRoomAtom: ルーム退出開始')
      const user = get(userAtom)
      const channel = get(realtimeChannelAtom)
      
      console.log('👤 leaveRoomAtom: 現在のユーザー情報', user)
      console.log('📡 leaveRoomAtom: 現在のチャンネル', channel)
      
      if (user) {
        console.log('🗑️ leaveRoomAtom: プレイヤー削除開始', user.id)
        // プレイヤー削除
        await supabase
          .from('room_players')
          .delete()
          .eq('id', user.id)
        console.log('✅ leaveRoomAtom: プレイヤー削除完了')
      }
      
      if (channel) {
        console.log('🔌 leaveRoomAtom: チャンネル購読解除開始')
        await channel.unsubscribe()
        console.log('✅ leaveRoomAtom: チャンネル購読解除完了')
      }
      
      // 状態リセット
      console.log('🔄 leaveRoomAtom: 状態リセット開始')
      set(currentRoomAtom, null)
      set(playersAtom, [])
      set(realtimeChannelAtom, null)
      set(connectionStateAtom, 'disconnected')
      
      console.log('🎉 leaveRoomAtom: ルーム退出完了')
    } catch (error) {
      console.error('💥 leaveRoomAtom: エラー発生', error)
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
      console.log('🚀 startGameAtom: ゲーム開始処理開始')
      const user = get(userAtom)
      const room = get(currentRoomAtom)
      
      console.log('👤 startGameAtom: 現在のユーザー情報', user)
      console.log('🏠 startGameAtom: 現在のルーム情報', room)
      
      if (!user || !room || room.host_id !== user.id) {
        console.error('❌ startGameAtom: 権限エラー', { userId: user?.id, hostId: room?.host_id })
        throw new Error('Only host can start the game')
      }
      
      // ルーム状態をプレイ中に変更
      console.log('🔄 startGameAtom: ルーム状態をplayingに変更開始', room.id)
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', room.id)
      
      if (error) {
        console.error('❌ startGameAtom: ルーム状態変更エラー', error)
        throw error
      }
      
      console.log('✅ startGameAtom: ルーム状態変更成功')
      console.log('🎉 startGameAtom: ゲーム開始完了')
      return { success: true }
      
    } catch (error) {
      console.error('💥 startGameAtom: エラー発生', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set(errorAtom, errorMessage)
      return { success: false, error: errorMessage }
    }
  }
)
