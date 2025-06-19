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
    
    // start_game_session RPCを呼び出し（ルーム状態変更とgame_sessions作成を同時実行）
    debugLog('🎮 startGame: start_game_session RPC呼び出し開始', roomId)
    const { data, error } = await supabase.rpc('start_game_session', {
      p_room_id: roomId
    })
    
    if (error) {
      debugLog('❌ startGame: start_game_session RPC エラー', error)
      throw error
    }
    
    debugLog('✅ startGame: start_game_session RPC 成功', data)
    debugLog('🎉 startGame: ゲーム開始完了（ルーム状態変更＋game_sessions作成）')
    return { success: true }
    
  } catch (error) {
    debugLog('💥 startGame: エラー発生', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// ゲーム強制終了（ホスト専用）
export const forceEndGame = async (params: {
  userId: string
  roomId: string
  hostId: string
}) => {
  const { userId, roomId, hostId } = params
  
  try {
    debugLog('🚀 forceEndGame: ゲーム強制終了処理開始')
    debugLog('👤 forceEndGame: ユーザーID', userId)
    debugLog('🏠 forceEndGame: ルームID', roomId)
    debugLog('👑 forceEndGame: ホストID', hostId)
    
    if (userId !== hostId) {
      debugLog('❌ forceEndGame: 権限エラー', { userId, hostId })
      throw new Error('Only host can force end the game')
    }
    
    // end_game_session RPCを呼び出し（ルーム状態変更とgame_sessions終了を同時実行）
    debugLog('🏁 forceEndGame: end_game_session RPC呼び出し開始', roomId)
    const { data, error } = await supabase.rpc('end_game_session', {
      p_room_id: roomId
    })
    
    if (error) {
      debugLog('❌ forceEndGame: end_game_session RPC エラー', error)
      throw error
    }
    
    debugLog('✅ forceEndGame: end_game_session RPC 成功', data)
    debugLog('🎉 forceEndGame: ゲーム強制終了完了（ルーム状態変更＋game_sessions終了）')
    return { success: true }
    
  } catch (error) {
    debugLog('💥 forceEndGame: エラー発生', error)
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

// ゲーム結果の集計
export const getGameResults = async (roomId: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> => {
  try {
    debugLog('📊 getGameResults: 結果集計開始', { roomId })
    
    if (!roomId) {
      throw new Error('Room ID is required')
    }

    // 1. ルーム情報とゲームセッション情報を取得
    debugLog('🏠 getGameResults: ルーム・セッション情報取得開始')
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        *,
        game_sessions (
          id,
          start_time,
          end_time,
          status
        )
      `)
      .eq('id', roomId)
      .eq('status', 'finished')
      .single()

    if (roomError || !roomData) {
      debugLog('❌ getGameResults: ルーム取得エラー', roomError)
      throw new Error('ゲーム結果が見つかりません')
    }

    debugLog('✅ getGameResults: ルーム・セッション情報取得成功', roomData)

    // 最新のゲームセッションを取得
    const latestSession = roomData.game_sessions?.[0]
    if (!latestSession) {
      throw new Error('ゲームセッション情報が見つかりません')
    }

    // 2. プレイヤー別統計を取得
    debugLog('👥 getGameResults: プレイヤー統計取得開始')
    const { data: playersData, error: playersError } = await supabase
      .from('room_players')
      .select(`
        id,
        name,
        score,
        combo
      `)
      .eq('room_id', roomId)
      .order('score', { ascending: false })

    if (playersError) {
      debugLog('❌ getGameResults: プレイヤー取得エラー', playersError)
      throw playersError
    }

    debugLog('✅ getGameResults: プレイヤー統計取得成功', playersData)

    // 3. 各プレイヤーの単語提出統計を取得
    debugLog('📝 getGameResults: 単語提出統計取得開始')
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('word_submissions')
      .select(`
        player_id,
        is_valid,
        combo_at_time
      `)
      .eq('game_session_id', latestSession.id)

    if (submissionsError) {
      debugLog('❌ getGameResults: 単語提出統計取得エラー', submissionsError)
      throw submissionsError
    }

    debugLog('✅ getGameResults: 単語提出統計取得成功', submissionsData)

    // 4. プレイヤー別の統計を計算
    debugLog('🧮 getGameResults: 統計計算開始')
    const playerResults = playersData.map((player, index) => {
      const playerSubmissions = submissionsData.filter(s => s.player_id === player.id)
      const totalSubmissions = playerSubmissions.length
      const correctSubmissions = playerSubmissions.filter(s => s.is_valid).length
      const accuracy = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100 * 10) / 10 : 0
      const maxCombo = Math.max(player.combo, ...playerSubmissions.map(s => s.combo_at_time))

      return {
        id: player.id,
        name: player.name,
        score: player.score,
        rank: index + 1, // スコア順でソート済みなのでインデックス+1が順位
        wordCount: correctSubmissions,
        maxCombo: maxCombo,
        accuracy: accuracy,
        totalSubmissions: totalSubmissions,
        correctSubmissions: correctSubmissions
      }
    })

    debugLog('✅ getGameResults: 統計計算完了', playerResults)

    // 5. ゲーム時間の計算
    const gameDuration = latestSession.start_time && latestSession.end_time 
      ? Math.round((new Date(latestSession.end_time).getTime() - new Date(latestSession.start_time).getTime()) / 1000)
      : null

    // 6. トップパフォーマーの特定
    const topPerformers = {
      highestScore: playerResults.reduce((prev, current) => prev.score > current.score ? prev : current),
      mostWords: playerResults.reduce((prev, current) => prev.wordCount > current.wordCount ? prev : current),
      bestCombo: playerResults.reduce((prev, current) => prev.maxCombo > current.maxCombo ? prev : current),
      bestAccuracy: playerResults.reduce((prev, current) => prev.accuracy > current.accuracy ? prev : current)
    }

    // 7. 結果サマリーの構築
    const resultsSummary = {
      roomId: roomId,
      gameSessionId: latestSession.id,
      totalPlayers: playerResults.length,
      gameDuration: gameDuration,
      results: playerResults,
      topPerformers: topPerformers
    }

    debugLog('🎉 getGameResults: 結果集計完了', resultsSummary)
    return { success: true, data: resultsSummary }

  } catch (error) {
    debugLog('💥 getGameResults: エラー発生', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// 単語提出処理
export const submitWord = async (params: {
  gameSessionId: string
  playerId: string
  word: string
  score: number
  comboAtTime: number
  isValid: boolean
  constraintsMet: any[]
}): Promise<{ success: boolean; error?: string }> => {
  try {
    debugLog('📝 submitWord: 単語提出開始', params)
    
    const { error } = await supabase
      .from('word_submissions')
      .insert({
        game_session_id: params.gameSessionId,
        player_id: params.playerId,
        word: params.word,
        score: params.score,
        combo_at_time: params.comboAtTime,
        constraints_met: params.constraintsMet,
        is_valid: params.isValid
      })

    if (error) {
      debugLog('❌ submitWord: エラー', error)
      throw error
    }

    debugLog('✅ submitWord: 単語提出成功')
    return { success: true }

  } catch (error) {
    debugLog('💥 submitWord: エラー発生', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// プレイヤースコア更新処理
export const updatePlayerScore = async (params: {
  playerId: string
  roomId: string
  scoreToAdd: number
  newCombo: number
}): Promise<{ success: boolean; error?: string }> => {
  try {
    debugLog('🎯 updatePlayerScore: スコア更新開始', params)
    
    // 現在のスコアを取得
    const { data: currentPlayer, error: fetchError } = await supabase
      .from('room_players')
      .select('score')
      .eq('id', params.playerId)
      .eq('room_id', params.roomId)
      .single()

    if (fetchError || !currentPlayer) {
      throw fetchError || new Error('プレイヤーが見つかりません')
    }

    // 新しいスコアで更新
    const { error } = await supabase
      .from('room_players')
      .update({
        score: currentPlayer.score + params.scoreToAdd,
        combo: params.newCombo
      })
      .eq('id', params.playerId)
      .eq('room_id', params.roomId)

    if (error) {
      debugLog('❌ updatePlayerScore: エラー', error)
      throw error
    }

    debugLog('✅ updatePlayerScore: スコア更新成功')
    return { success: true }

  } catch (error) {
    debugLog('💥 updatePlayerScore: エラー発生', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
