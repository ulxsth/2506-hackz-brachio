import { useState, useEffect, useCallback, useRef } from 'react'
import { GameSyncManager, type PlayerReadyState, type GameSyncState, type RoomReadySummary } from '../lib/game-sync'
import { debugLog } from '../lib/logger'

interface UseGameSyncOptions {
  autoStartHeartbeat?: boolean
  onGamePhaseChange?: (phase: GameSyncState['phase']) => void
  onAllPlayersReady?: () => void
  onCountdownStart?: (startTime: Date) => void
  onGameStart?: (startTime: Date) => void
}

interface UseGameSyncReturn {
  // 状態
  gameState: GameSyncState | null
  playerReadyState: PlayerReadyState | null
  roomReadySummary: RoomReadySummary | null
  serverTime: Date | null
  latency: number | null
  isConnected: boolean
  
  // アクション
  synchronizeTime: () => Promise<void>
  updateReadyState: (updates: {
    assets_loaded?: boolean
    network_ready?: boolean
    ui_ready?: boolean
  }) => Promise<void>
  startPreparation: (timeout?: number, countdown?: number) => Promise<void>
  startCountdown: () => Promise<void>
  startGame: () => Promise<void>
  measureLatency: () => Promise<void>
  
  // 状態チェック
  isAllReady: boolean
  isHost: boolean
  timeUntilDeadline: number | null
  timeUntilGameStart: number | null
}

/**
 * ゲーム同期システムのReact Hook
 */
export const useGameSync = (
  roomId: string,
  playerId: string,
  isHost: boolean = false,
  options: UseGameSyncOptions = {}
): UseGameSyncReturn => {
  
  // 状態管理
  const [gameState, setGameState] = useState<GameSyncState | null>(null)
  const [playerReadyState, setPlayerReadyState] = useState<PlayerReadyState | null>(null)
  const [roomReadySummary, setRoomReadySummary] = useState<RoomReadySummary | null>(null)
  const [serverTime, setServerTime] = useState<Date | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // GameSyncManager のインスタンス
  const managerRef = useRef<GameSyncManager | null>(null)
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  // 計算された状態
  const isAllReady = roomReadySummary?.all_ready ?? false
  const timeUntilDeadline = gameState?.preparation_deadline ? 
    new Date(gameState.preparation_deadline).getTime() - (serverTime?.getTime() ?? 0) : null
  const timeUntilGameStart = gameState?.game_start_time ?
    new Date(gameState.game_start_time).getTime() - (serverTime?.getTime() ?? 0) : null

  // GameSyncManager 初期化
  useEffect(() => {
    if (!roomId || !playerId) return

    const manager = new GameSyncManager(roomId, playerId)
    managerRef.current = manager

    // リアルタイム購読開始
    const initializeManager = async () => {
      try {
        debugLog('🔧 useGameSync: マネージャー初期化開始', { roomId, playerId, isHost })

        // サーバー時刻同期
        const syncedTime = await manager.synchronizeServerTime()
        setServerTime(syncedTime)

        // リアルタイム購読
        await manager.subscribeToGameSync({
          onRoomStateChange: (payload) => {
            debugLog('🏠 ルーム状態変更受信', payload)
            if (payload.new?.game_state) {
              setGameState(payload.new.game_state as GameSyncState)
              
              // フェーズ変更の通知
              const newPhase = payload.new.game_state.phase
              if (newPhase !== gameState?.phase) {
                options.onGamePhaseChange?.(newPhase)
                
                // 特定フェーズでのコールバック
                if (newPhase === 'countdown' && payload.new.game_state.countdown_start) {
                  options.onCountdownStart?.(new Date(payload.new.game_state.countdown_start))
                }
                if (newPhase === 'playing' && payload.new.game_state.actual_start_time) {
                  options.onGameStart?.(new Date(payload.new.game_state.actual_start_time))
                }
              }
            }
          },

          onPlayerReadyStateChange: (payload) => {
            debugLog('👤 プレイヤー準備状態変更受信', payload)
            
            // 自分の状態更新
            if (payload.new?.player_id === playerId) {
              setPlayerReadyState(payload.new as PlayerReadyState)
            }

            // ルーム全体の準備状況を再計算（簡易版）
            // 実際のプロダクションでは、別途ルーム状況取得APIを呼ぶ
          }
        })

        setIsConnected(true)
        debugLog('✅ useGameSync: マネージャー初期化完了')

      } catch (error) {
        debugLog('❌ useGameSync: マネージャー初期化エラー', error)
        setIsConnected(false)
      }
    }

    initializeManager()

    // クリーンアップ
    return () => {
      manager.cleanup()
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current)
      }
    }
  }, [roomId, playerId])

  // サーバー時刻の定期更新
  useEffect(() => {
    if (!managerRef.current || !isConnected) return

    timeUpdateInterval.current = setInterval(() => {
      if (managerRef.current) {
        setServerTime(managerRef.current.getServerTime())
      }
    }, 1000) // 1秒間隔で更新

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current)
      }
    }
  }, [isConnected])

  // サーバー時刻同期
  const synchronizeTime = useCallback(async () => {
    if (!managerRef.current) return

    try {
      const syncedTime = await managerRef.current.synchronizeServerTime()
      setServerTime(syncedTime)
      debugLog('⏰ 手動時刻同期完了', { syncedTime })
    } catch (error) {
      debugLog('❌ 手動時刻同期エラー', error)
    }
  }, [])

  // プレイヤー準備状態更新
  const updateReadyState = useCallback(async (updates: {
    assets_loaded?: boolean
    network_ready?: boolean
    ui_ready?: boolean
  }) => {
    if (!managerRef.current) return

    try {
      const latencyStart = Date.now()
      const result = await managerRef.current.updateReadyState({
        ...updates,
        latency_ms: latency ?? undefined
      })
      
      setPlayerReadyState(result.playerState)
      setRoomReadySummary(result.roomSummary)

      // 全員準備完了の通知
      if (result.roomSummary.all_ready && !isAllReady) {
        options.onAllPlayersReady?.()
      }

      debugLog('✅ プレイヤー準備状態更新完了', result)
    } catch (error) {
      debugLog('❌ プレイヤー準備状態更新エラー', error)
    }
  }, [latency, isAllReady, options])

  // 準備フェーズ開始（ホスト専用）
  const startPreparation = useCallback(async (timeout = 60, countdown = 5) => {
    if (!managerRef.current || !isHost) return

    try {
      await managerRef.current.startPreparationPhase(timeout, countdown)
      debugLog('✅ 準備フェーズ開始完了')
    } catch (error) {
      debugLog('❌ 準備フェーズ開始エラー', error)
    }
  }, [isHost])

  // カウントダウン開始（ホスト専用）
  const startCountdown = useCallback(async () => {
    if (!managerRef.current || !isHost) return

    try {
      await managerRef.current.startCountdown()
      debugLog('✅ カウントダウン開始完了')
    } catch (error) {
      debugLog('❌ カウントダウン開始エラー', error)
    }
  }, [isHost])

  // ゲーム開始（ホスト専用）
  const startGame = useCallback(async () => {
    if (!managerRef.current || !isHost) return

    try {
      await managerRef.current.startGame()
      debugLog('✅ ゲーム開始完了')
    } catch (error) {
      debugLog('❌ ゲーム開始エラー', error)
    }
  }, [isHost])

  // レイテンシ測定
  const measureLatency = useCallback(async () => {
    if (!managerRef.current) return

    try {
      const measuredLatency = await managerRef.current.measureLatency()
      setLatency(measuredLatency)
      debugLog('📊 レイテンシ測定完了', { latency: measuredLatency })
    } catch (error) {
      debugLog('❌ レイテンシ測定エラー', error)
    }
  }, [])

  return {
    // 状態
    gameState,
    playerReadyState,
    roomReadySummary,
    serverTime,
    latency,
    isConnected,

    // アクション
    synchronizeTime,
    updateReadyState,
    startPreparation,
    startCountdown,
    startGame,
    measureLatency,

    // 計算された状態
    isAllReady,
    isHost,
    timeUntilDeadline,
    timeUntilGameStart
  }
}
