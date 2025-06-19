import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  connectionStateAtom,
  userAtom,
  currentRoomAtom,
  playersAtom,
  realtimeChannelAtom,
  errorAtom
} from '../lib/supabase-atoms'
import {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  forceEndGame,
  getGameResults,
  setupRealtimeChannel,
  subscribeChannel
} from '../lib/room'
import type { Room, RoomPlayer, GameResultsSummary } from '../lib/supabase'
import { useState } from 'react'

export const useRoom = () => {
  const [connectionState, setConnectionState] = useAtom(connectionStateAtom)
  const [user, setUser] = useAtom(userAtom)
  const [currentRoom, setCurrentRoom] = useAtom(currentRoomAtom)
  const [players, setPlayers] = useAtom(playersAtom)
  const [realtimeChannel, setRealtimeChannel] = useAtom(realtimeChannelAtom)
  const [error, setError] = useAtom(errorAtom)

  // 結果取得用の状態
  const [gameResults, setGameResults] = useState<GameResultsSummary | null>(null)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [resultsError, setResultsError] = useState<string | null>(null)

  // ルーム作成処理
  const handleCreateRoom = async (params: {
    roomId: string
    settings: Room['settings']
  }) => {
    if (!user) {
      setError('ユーザー情報が見つかりません')
      return { success: false, error: 'ユーザー情報が見つかりません' }
    }

    setConnectionState('connecting')
    setError(null)

    // 毎回新しいユーザーIDを生成してプレイヤー作成の重複を防ぐ
    const freshUser = {
      ...user,
      id: crypto.randomUUID()
    }
    setUser(freshUser)

    const result = await createRoom({
      roomId: params.roomId,
      settings: params.settings,
      currentUser: freshUser
    })

    if (result.success && result.room && result.player) {
      // Realtimeチャンネル設定
      const channel = setupRealtimeChannel({
        roomId: params.roomId,
        onPlayerJoin: (player: RoomPlayer) => {
          setPlayers(prev => {
            if (prev.some(p => p.id === player.id)) {
              return prev
            }
            return [...prev, player]
          })
        },
        onPlayerLeave: (playerId: string) => {
          setPlayers(prev => prev.filter(p => p.id !== playerId))
        },
        onRoomUpdate: (roomData: any) => {
          setCurrentRoom(prev => prev ? { ...prev, ...roomData } : null)
        }
      })

      await subscribeChannel(channel)
      setRealtimeChannel(channel)

      // 初期状態設定
      setCurrentRoom({ ...result.room, players: [result.player] })
      setPlayers([result.player])
      setConnectionState('connected')
    } else {
      setError(result.error || '不明なエラーが発生しました')
      setConnectionState('disconnected')
      // エラー時は状態をクリーンアップ
      setCurrentRoom(null)
      setPlayers([])
      setRealtimeChannel(null)
    }

    return result
  }

  // ルーム参加処理
  const handleJoinRoom = async (params: {
    roomId: string
    playerName: string
  }) => {
    if (!user) {
      setError('ユーザー情報が見つかりません')
      return { success: false, error: 'ユーザー情報が見つかりません' }
    }

    setConnectionState('connecting')
    setError(null)

    // 毎回新しいユーザーIDを生成してプレイヤー作成の重複を防ぐ
    const freshUser = {
      id: crypto.randomUUID(),
      name: params.playerName
    }
    setUser(freshUser)

    const result = await joinRoom({
      roomId: params.roomId,
      playerName: params.playerName,
      currentUser: freshUser
    })

    if (result.success && result.room && result.player) {
      // Realtimeチャンネル設定
      const channel = setupRealtimeChannel({
        roomId: params.roomId,
        onPlayerJoin: (player: RoomPlayer) => {
          setPlayers(prev => {
            if (prev.some(p => p.id === player.id)) {
              return prev
            }
            return [...prev, player]
          })
        },
        onPlayerLeave: (playerId: string) => {
          setPlayers(prev => prev.filter(p => p.id !== playerId))
        },
        onRoomUpdate: (roomData: any) => {
          setCurrentRoom(prev => prev ? { ...prev, ...roomData } : null)
        }
      })

      await subscribeChannel(channel)
      setRealtimeChannel(channel)

      // 状態設定
      const typedPlayers = result.room.players as RoomPlayer[]
      const uniquePlayers = [...typedPlayers]
      if (!uniquePlayers.some(p => p.id === result.player.id)) {
        uniquePlayers.push(result.player)
      }

      setCurrentRoom({ ...result.room, players: uniquePlayers })
      setPlayers(uniquePlayers)
      setConnectionState('connected')
    } else {
      setError(result.error || '不明なエラーが発生しました')
      setConnectionState('disconnected')
    }

    return result
  }

  // ルーム退出処理
  const handleLeaveRoom = async () => {
    if (!user) return { success: false, error: 'ユーザー情報が見つかりません' }

    const result = await leaveRoom({
      userId: user.id,
      channel: realtimeChannel
    })

    // 状態リセット
    setCurrentRoom(null)
    setPlayers([])
    setRealtimeChannel(null)
    setConnectionState('disconnected')

    if (!result.success) {
      setError(result.error || '不明なエラーが発生しました')
    }

    return result
  }

  // ゲーム開始処理
  const handleStartGame = async () => {
    if (!user || !currentRoom) {
      const errorMsg = 'ユーザー情報またはルーム情報が見つかりません'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    const result = await startGame({
      userId: user.id,
      roomId: currentRoom.id,
      hostId: currentRoom.host_id
    })

    if (!result.success) {
      setError(result.error || '不明なエラーが発生しました')
    }

    return result
  }

  // ゲーム強制終了処理（ホスト専用）
  const handleForceEndGame = async () => {
    if (!user || !currentRoom) {
      const errorMsg = 'ユーザー情報またはルーム情報が見つかりません'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    const result = await forceEndGame({
      userId: user.id,
      roomId: currentRoom.id,
      hostId: currentRoom.host_id
    })

    if (!result.success) {
      setError(result.error || '不明なエラーが発生しました')
    }

    return result
  }

  // エラークリア
  const clearError = () => {
    setError(null)
  }

  // ゲーム結果取得処理
  const handleGetGameResults = async (roomId?: string) => {
    const targetRoomId = roomId || currentRoom?.id
    
    if (!targetRoomId) {
      const errorMsg = 'ルームIDが見つかりません'
      setResultsError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setResultsLoading(true)
    setResultsError(null)

    try {
      const result = await getGameResults(targetRoomId)
      
      if (result.success && result.data) {
        setGameResults(result.data)
        setResultsError(null)
        return { success: true, data: result.data }
      } else {
        setResultsError(result.error || '結果の取得に失敗しました')
        setGameResults(null)
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '不明なエラーが発生しました'
      setResultsError(errorMsg)
      setGameResults(null)
      return { success: false, error: errorMsg }
    } finally {
      setResultsLoading(false)
    }
  }

  // 結果エラークリア
  const clearResultsError = () => {
    setResultsError(null)
  }

  return {
    // 状態
    connectionState,
    user,
    currentRoom,
    players,
    error,
    // 結果関連の状態
    gameResults,
    resultsLoading,
    resultsError,
    // アクション
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
    startGame: handleStartGame,
    forceEndGame: handleForceEndGame,
    getGameResults: handleGetGameResults,
    clearError,
    clearResultsError
  }
}
