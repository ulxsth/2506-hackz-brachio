import { supabase } from './supabase'
import { debugLog } from './logger'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ゲーム同期関連の型定義
export interface PlayerReadyState {
  player_id: string
  room_id: string
  assets_loaded: boolean
  network_ready: boolean
  ui_ready: boolean
  ready_at: string | null
  last_heartbeat: string
  latency_ms: number | null
}

export interface GameSyncState {
  phase: 'waiting' | 'preparing' | 'countdown' | 'playing' | 'finished'
  preparation_start?: string
  preparation_deadline?: string
  countdown_start?: string
  game_start_time?: string
  actual_start_time?: string
  preparation_timeout?: number
  countdown_duration?: number
}

export interface RoomReadySummary {
  ready_count: number
  total_count: number
  all_ready: boolean
}

/**
 * ゲーム同期システムのメインクラス
 * サーバー時刻同期、プレイヤー準備状態管理、ゲーム開始同期を担当
 */
export class GameSyncManager {
  private roomId: string
  private playerId: string
  private channel: RealtimeChannel | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private serverTimeOffset: number = 0 // サーバーとの時差（ms）

  constructor(roomId: string, playerId: string) {
    this.roomId = roomId
    this.playerId = playerId
  }

  /**
   * サーバー時刻同期を実行
   * @returns サーバー時刻
   */
  async synchronizeServerTime(): Promise<Date> {
    try {
      const clientStart = Date.now()
      debugLog('⏰ サーバー時刻同期開始', { clientStart })

      const { data, error } = await supabase.rpc('get_server_time')
      
      if (error) {
        throw error
      }

      const clientEnd = Date.now()
      const networkLatency = clientEnd - clientStart
      const serverTime = new Date(data)
      
      // ネットワーク遅延を考慮してサーバー時刻を補正
      const adjustedServerTime = new Date(serverTime.getTime() + (networkLatency / 2))
      this.serverTimeOffset = adjustedServerTime.getTime() - clientEnd

      debugLog('✅ サーバー時刻同期完了', {
        serverTime: serverTime.toISOString(),
        networkLatency,
        serverTimeOffset: this.serverTimeOffset
      })

      return adjustedServerTime

    } catch (error) {
      debugLog('❌ サーバー時刻同期エラー', error)
      throw error
    }
  }

  /**
   * 現在のサーバー時刻を取得（同期済みオフセット使用）
   */
  getServerTime(): Date {
    return new Date(Date.now() + this.serverTimeOffset)
  }

  /**
   * プレイヤー準備状態を更新
   */
  async updateReadyState(updates: {
    assets_loaded?: boolean
    network_ready?: boolean
    ui_ready?: boolean
    latency_ms?: number
  }): Promise<{ playerState: PlayerReadyState; roomSummary: RoomReadySummary }> {
    try {
      debugLog('🔄 プレイヤー準備状態更新', { playerId: this.playerId, updates })

      const { data, error } = await supabase.rpc('update_player_ready_state', {
        p_player_id: this.playerId,
        p_room_id: this.roomId,
        p_assets_loaded: updates.assets_loaded ?? undefined,
        p_network_ready: updates.network_ready ?? undefined,
        p_ui_ready: updates.ui_ready ?? undefined,
        p_latency_ms: updates.latency_ms ?? undefined
      })

      if (error || !data) {
        throw error || new Error('No data returned')
      }

      debugLog('✅ プレイヤー準備状態更新完了', data)

      const result = data as any // 型キャスト（実際にはより厳密な型定義が必要）
      
      return {
        playerState: result.player_ready_state,
        roomSummary: result.room_ready_summary
      }

    } catch (error) {
      debugLog('❌ プレイヤー準備状態更新エラー', error)
      throw error
    }
  }

  /**
   * ゲーム準備フェーズを開始（ホスト専用）
   */
  async startPreparationPhase(
    preparationTimeout: number = 60, 
    countdownDuration: number = 5
  ): Promise<void> {
    try {
      debugLog('🚀 ゲーム準備フェーズ開始', { 
        roomId: this.roomId, 
        preparationTimeout, 
        countdownDuration 
      })

      const { data, error } = await supabase.rpc('start_game_preparation', {
        p_room_id: this.roomId,
        p_preparation_timeout: preparationTimeout,
        p_countdown_duration: countdownDuration
      })

      if (error) {
        throw error
      }

      debugLog('✅ ゲーム準備フェーズ開始完了', data)

    } catch (error) {
      debugLog('❌ ゲーム準備フェーズ開始エラー', error)
      throw error
    }
  }

  /**
   * カウントダウン開始（ホスト専用）
   */
  async startCountdown(): Promise<void> {
    try {
      debugLog('⏱️ カウントダウン開始', { roomId: this.roomId })

      const { data, error } = await supabase.rpc('start_game_countdown', {
        p_room_id: this.roomId
      })

      if (error) {
        throw error
      }

      debugLog('✅ カウントダウン開始完了', data)

    } catch (error) {
      debugLog('❌ カウントダウン開始エラー', error)
      throw error
    }
  }

  /**
   * ゲーム開始（ホスト専用）
   */
  async startGame(): Promise<void> {
    try {
      debugLog('🎮 ゲーム開始', { roomId: this.roomId })

      const { data, error } = await supabase.rpc('start_game_session', {
        p_room_id: this.roomId
      })

      if (error) {
        throw error
      }

      debugLog('✅ ゲーム開始完了', data)

    } catch (error) {
      debugLog('❌ ゲーム開始エラー', error)
      throw error
    }
  }

  /**
   * リアルタイム購読を開始
   */
  async subscribeToGameSync(callbacks: {
    onRoomStateChange?: (payload: any) => void
    onPlayerReadyStateChange?: (payload: any) => void
    onGamePhaseChange?: (payload: any) => void
  }): Promise<void> {
    try {
      debugLog('📡 ゲーム同期リアルタイム購読開始', { roomId: this.roomId })

      this.channel = supabase
        .channel(`game_sync_${this.roomId}`)
        
        // ルーム状態変更の購読
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${this.roomId}`
        }, (payload) => {
          debugLog('🏠 ルーム状態変更', payload)
          callbacks.onRoomStateChange?.(payload)
        })
        
        // プレイヤー準備状態変更の購読
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'player_ready_states',
          filter: `room_id=eq.${this.roomId}`
        }, (payload) => {
          debugLog('👤 プレイヤー準備状態変更', payload)
          callbacks.onPlayerReadyStateChange?.(payload)
        })
        
        // カスタムイベントの購読
        .on('broadcast', {
          event: 'game_phase_change'
        }, (payload) => {
          debugLog('🎯 ゲームフェーズ変更', payload)
          callbacks.onGamePhaseChange?.(payload)
        })
        
        .subscribe()

      // ハートビート開始（30秒間隔）
      this.startHeartbeat()

      debugLog('✅ ゲーム同期リアルタイム購読完了')

    } catch (error) {
      debugLog('❌ ゲーム同期リアルタイム購読エラー', error)
      throw error
    }
  }

  /**
   * ハートビート開始（サーバー時刻同期 + 生存確認）
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        // サーバー時刻同期
        await this.synchronizeServerTime()
        
        // 生存確認として準備状態を更新
        await this.updateReadyState({})
        
      } catch (error) {
        debugLog('⚠️ ハートビートエラー', error)
      }
    }, 30000) // 30秒間隔
  }

  /**
   * リソースのクリーンアップ
   */
  cleanup(): void {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    debugLog('🧹 ゲーム同期マネージャーをクリーンアップ')
  }

  /**
   * レイテンシ測定
   */
  async measureLatency(): Promise<number> {
    const start = Date.now()
    await this.synchronizeServerTime()
    return Date.now() - start
  }
}
