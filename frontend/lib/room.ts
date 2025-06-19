import { debugLog } from './logger'
import { supabase, type Room, type RoomPlayer } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ルーム作成
export const createRoom = async (params: {
  roomId: string
  settings: Room['settings']
  currentUser: { id: string; name: string }
}) => {
  const { roomId, settings, currentUser } = params
  
  try {
    debugLog('🚀 createRoom: ルーム作成開始', { roomId, settings })
    
    if (!currentUser?.name) {
      throw new Error('ユーザー情報が見つかりません')
    }
    
    // ルーム作成
    debugLog('🏠 createRoom: ルーム作成処理開始', { roomId, hostId: currentUser.id })
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
      debugLog('❌ createRoom: ルーム作成エラー', roomError)
      // 重複するあいことば（Primary Key制約違反）をチェック
      if (roomError.code === '23505' && roomError.message.includes('rooms_pkey')) {
        throw new Error('このあいことばは既に使用されています。別のあいことばを入力してください。')
      }
      throw roomError
    }
    
    debugLog('✅ createRoom: ルーム作成成功', roomData)
    
    // プレイヤー作成（ホスト）
    debugLog('👥 createRoom: ホストプレイヤー作成開始', { userId: currentUser.id, roomId })
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
    
    if (playerError) {
      debugLog('❌ createRoom: プレイヤー作成エラー', playerError)
      // プレイヤーID重複エラーをチェック
      if (playerError.code === '23505' && playerError.message.includes('players_pkey')) {
        throw new Error('プレイヤー作成に失敗しました。もう一度お試しください。')
      }
      throw playerError
    }
    
    debugLog('✅ createRoom: ホストプレイヤー作成成功', playerData)
    debugLog('🎉 createRoom: ルーム作成完了')
    
    return { success: true, room: roomData, player: playerData }
    
  } catch (error) {
    debugLog('💥 createRoom: エラー発生', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// ルーム参加
export const joinRoom = async (params: {
  roomId: string
  playerName: string
  currentUser: { id: string; name: string }
}) => {
  const { roomId, playerName, currentUser } = params
  
  try {
    debugLog('🚀 joinRoom: ルーム参加開始', { roomId, playerName })
    
    if (!currentUser) {
      throw new Error('ユーザー情報が見つかりません')
    }
    
    // ルーム存在確認
    debugLog('🔍 joinRoom: ルーム存在確認開始', roomId)
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*, players:room_players(*)')
      .eq('id', roomId)
      .eq('status', 'waiting')
      .single()
    
    if (roomError || !roomData) {
      debugLog('❌ joinRoom: ルーム取得エラー', roomError)
      if (roomError?.code === 'PGRST116') {
        throw new Error('入力されたあいことばのルームが見つかりません。あいことばを確認してください。')
      }
      throw new Error('ルームが見つからないか、既にゲームが開始されています。')
    }
    
    debugLog('✅ joinRoom: ルーム取得成功', roomData)
    
    // 参加人数チェック
    debugLog('👥 joinRoom: 参加人数チェック開始')
    const settings = roomData.settings as { maxPlayers: number; timeLimit: number; category: string }
    if (roomData.players && roomData.players.length >= settings.maxPlayers) {
      debugLog('❌ joinRoom: 定員オーバー', { currentPlayers: roomData.players.length, maxPlayers: settings.maxPlayers })
      throw new Error('ルームの定員に達しています。別のルームに参加してください。')
    }
    
    debugLog('✅ joinRoom: 参加人数チェック通過', { currentPlayers: roomData.players?.length || 0, maxPlayers: settings.maxPlayers })
    
    // プレイヤー追加
    debugLog('👥 joinRoom: プレイヤー追加開始', { userId: currentUser.id, playerName, roomId })
    const { data: playerData, error: playerError } = await supabase
      .from('room_players')
      .insert({
        id: currentUser.id,
        room_id: roomId,
        name: playerName,
        score: 0,
        combo: 0,
        is_host: false
      })
      .select()
      .single()
    
    if (playerError) {
      debugLog('❌ joinRoom: プレイヤー追加エラー', playerError)
      // プレイヤーID重複エラーをチェック
      if (playerError.code === '23505' && playerError.message.includes('players_pkey')) {
        throw new Error('参加に失敗しました。もう一度お試しください。')
      }
      throw playerError
    }
    
    debugLog('✅ joinRoom: プレイヤー追加成功', playerData)
    debugLog('🎉 joinRoom: ルーム参加完了')
    
    return { success: true, room: roomData, player: playerData }
    
  } catch (error) {
    debugLog('💥 joinRoom: エラー発生', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// ルーム退出
export const leaveRoom = async (params: {
  userId: string
  channel?: RealtimeChannel | null
}) => {
  const { userId, channel } = params
  
  try {
    debugLog('🚀 leaveRoom: ルーム退出開始')
    debugLog('👤 leaveRoom: ユーザーID', userId)
    debugLog('📡 leaveRoom: 現在のチャンネル', channel)
    
    if (userId) {
      debugLog('🗑️ leaveRoom: プレイヤー削除開始', userId)
      // プレイヤー削除
      const { data, error } = await supabase
        .from('room_players')
        .delete()
        .eq('id', userId)
        .select()
      
      if (error) {
        debugLog('❌ leaveRoom: プレイヤー削除エラー', error)
        throw error
      }
      debugLog('✅ leaveRoom: プレイヤー削除完了', { deletedData: data })
    }
    
    debugLog('🎉 leaveRoom: ルーム退出完了')
    return { success: true }
    
  } catch (error) {
    debugLog('💥 leaveRoom: エラー発生', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// ゲーム開始（ホストのみ）
export const startGame = async (params: {
  userId: string
  roomId: string
  hostId: string
}) => {
  const { userId, roomId, hostId } = params
  
  try {
    debugLog('🚀 startGame: ゲーム開始処理開始')
    debugLog('👤 startGame: ユーザーID', userId)
    debugLog('🏠 startGame: ルームID', roomId)
    debugLog('👑 startGame: ホストID', hostId)
    
    if (userId !== hostId) {
      debugLog('❌ startGame: 権限エラー', { userId, hostId })
      throw new Error('Only host can start the game')
    }
    
    // ルーム状態をプレイ中に変更
    debugLog('🔄 startGame: ルーム状態をplayingに変更開始', roomId)
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'playing' })
      .eq('id', roomId)
    
    if (error) {
      debugLog('❌ startGame: ルーム状態変更エラー', error)
      throw error
    }
    
    debugLog('✅ startGame: ルーム状態変更成功')
    debugLog('🎉 startGame: ゲーム開始完了')
    return { success: true }
    
  } catch (error) {
    debugLog('💥 startGame: エラー発生', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Realtimeチャンネルの設定
export const setupRealtimeChannel = (params: {
  roomId: string
  onPlayerJoin: (player: RoomPlayer) => void
  onPlayerLeave: (playerId: string) => void
  onRoomUpdate: (roomData: any) => void
}) => {
  const { roomId, onPlayerJoin, onPlayerLeave, onRoomUpdate } = params
  
  debugLog('📡 setupRealtimeChannel: Realtimeチャンネル設定開始', `room:${roomId}`)
  const channel = supabase.channel(`room:${roomId}`)
  
  // プレイヤー参加イベント
  debugLog('🎯 setupRealtimeChannel: プレイヤー参加イベントリスナー設定')
  channel.on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'room_players',
      filter: `room_id=eq.${roomId}`
    }, 
    (payload) => {
      debugLog('👥 realtime: プレイヤー参加イベント受信', payload.new)
      const newPlayer = payload.new as RoomPlayer
      onPlayerJoin(newPlayer)
    }
  )
  
  // プレイヤー退出イベント
  debugLog('🚪 setupRealtimeChannel: プレイヤー退出イベントリスナー設定')
  channel.on('postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'room_players',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      debugLog('👋 realtime: プレイヤー退出イベント受信', payload.old)
      onPlayerLeave(payload.old.id)
    }
  )
  
  // ルーム状態変更イベント
  debugLog('🏠 setupRealtimeChannel: ルーム状態変更イベントリスナー設定')
  channel.on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
      filter: `id=eq.${roomId}`
    },
    (payload) => {
      debugLog('🔄 realtime: ルーム状態変更イベント受信', payload.new)
      onRoomUpdate(payload.new)
    }
  )
  
  return channel
}

// チャンネル購読
export const subscribeChannel = async (channel: RealtimeChannel) => {
  debugLog('🔌 subscribeChannel: チャンネル購読開始')
  await channel.subscribe()
  debugLog('✅ subscribeChannel: チャンネル購読成功')
}
