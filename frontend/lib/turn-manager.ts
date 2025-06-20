// ターン管理システム
// デュアルターンシステム（通常タイピングターン + 制約ターン）の管理

import { supabase } from './supabase'
import { debugLog } from './logger'

// ターンデータの型定義
export interface TurnData {
  type: 'typing' | 'constraint'
  targetWord?: string        // 通常ターン用
  constraintChar?: string    // 制約ターン用
  coefficient: number        // 得点係数
  startTime: Date
  sequenceNumber: number     // ターン連番
  metadata?: any            // 追加情報
}

// 文字係数の定義（制約ターン用）
const LETTER_COEFFICIENTS: Record<string, number> = {
  // 高頻度文字（係数低）
  'a': 2, 'e': 2, 'i': 2, 'o': 2, 'u': 2,
  's': 2, 'r': 2, 't': 2, 'n': 2, 'l': 2,
  'c': 3, 'd': 3, 'h': 3, 'p': 3, 'm': 3,
  
  // 中頻度文字（係数中）
  'b': 4, 'f': 4, 'g': 4, 'k': 4, 'v': 4, 'w': 4, 'y': 4,
  
  // 低頻度文字（係数高）
  'j': 6, 'q': 6, 'x': 7, 'z': 8
}

const RATIO_TYPING_TURN = 90 / 100
const RATIO_CONSTRAINT_TURN = 1 - RATIO_TYPING_TURN

/**
 * ターン管理システムのメインクラス
 */
export class TurnManager {
  private roomId: string
  private currentSequence: number = 0

  constructor(roomId: string) {
    this.roomId = roomId
  }

  /**
   * 次のターンを生成（5:1の比率でランダム）
   */
  async generateNextTurn(previousTurns: TurnData[] = []): Promise<TurnData> {
    this.currentSequence++
    
    const isTypingTurn = Math.random() < RATIO_TYPING_TURN
    
    if (isTypingTurn) {
      return await this.generateTypingTurn()
    } else {
      return this.generateConstraintTurn()
    }
  }

  /**
   * 通常タイピングターンを生成
   */
  private async generateTypingTurn(): Promise<TurnData> {
    debugLog('🎯 通常タイピングターン生成開始')
    
    try {
      const targetWord = await this.selectRandomWord()
      
      const turnData: TurnData = {
        type: 'typing',
        targetWord,
        coefficient: 1.0, // 基本係数（速度係数は後で計算）
        startTime: new Date(),
        sequenceNumber: this.currentSequence
      }
      
      debugLog('✅ 通常タイピングターン生成完了', turnData)
      return turnData
      
    } catch (error) {
      debugLog('❌ 通常タイピングターン生成エラー', error)
      // フォールバック：制約ターンを生成
      return this.generateConstraintTurn()
    }
  }

  /**
   * 制約ターンを生成
   */
  private generateConstraintTurn(): TurnData {
    debugLog('🎯 制約ターン生成開始')
    
    const constraintData = this.generateConstraintChar()
    
    const turnData: TurnData = {
      type: 'constraint',
      constraintChar: constraintData.char,
      coefficient: constraintData.coefficient,
      startTime: new Date(),
      sequenceNumber: this.currentSequence
    }
    
    debugLog('✅ 制約ターン生成完了', turnData)
    return turnData
  }

  /**
   * ランダムな単語を選択（通常ターン用）
   */
  private async selectRandomWord(): Promise<string> {
    debugLog('📚 ランダム単語選択開始')
    
    // 適度な長さの単語を優先選択（3-12文字）
    const { data, error } = await supabase
      .from('it_terms')
      .select('romaji_text, display_text')
      .gte('difficulty_id', 1)
      .lte('difficulty_id', 7) // 極端に難しい単語は避ける
      .limit(50) // 候補を50個取得してランダム選択
      
    if (error) {
      debugLog('❌ 単語取得エラー', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error('単語が見つかりません')
    }
    
    // 3-12文字の単語を優先的にフィルタリング
    const preferredWords = data.filter(term => 
      term.romaji_text.length >= 3 && term.romaji_text.length <= 12
    )
    
    const candidateWords = preferredWords.length > 0 ? preferredWords : data
    const selectedWord = candidateWords[Math.floor(Math.random() * candidateWords.length)]
    
    debugLog('✅ ランダム単語選択完了', { 
      word: selectedWord.romaji_text, 
      display: selectedWord.display_text 
    })
    
    return selectedWord.romaji_text
  }

  /**
   * 制約文字を生成（制約ターン用）
   */
  private generateConstraintChar(): { char: string; coefficient: number } {
    const letters = Object.keys(LETTER_COEFFICIENTS)
    const selectedLetter = letters[Math.floor(Math.random() * letters.length)]
    const coefficient = LETTER_COEFFICIENTS[selectedLetter]
    
    debugLog('✅ 制約文字生成完了', { 
      char: selectedLetter, 
      coefficient 
    })
    
    return {
      char: selectedLetter,
      coefficient
    }
  }

  /**
   * タイピング速度から速度係数を計算
   */
  static calculateSpeedCoefficient(durationMs: number): number {
    // タイピング時間（ミリ秒）から係数を計算
    if (durationMs <= 1000) return 3.0      // 1秒以内 → 最高係数
    if (durationMs <= 2000) return 2.5      // 2秒以内 → 高係数
    if (durationMs <= 3000) return 2.0      // 3秒以内 → 標準係数
    if (durationMs <= 5000) return 1.5      // 5秒以内 → 低係数
    return 1.0                              // 5秒超過 → 最低係数
  }

  /**
   * ターンデータをゲームセッションに保存
   */
  async saveTurnToSession(gameSessionId: string, turnData: TurnData): Promise<void> {
    debugLog('💾 ターンデータ保存開始', { gameSessionId, turnData })
    
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          current_turn_type: turnData.type,
          current_target_word: turnData.targetWord || null,
          current_constraint_char: turnData.constraintChar || null,
          turn_start_time: turnData.startTime.toISOString(),
          turn_sequence_number: turnData.sequenceNumber,
          turn_metadata: turnData.metadata || {}
        })
        .eq('id', gameSessionId)
      
      if (error) {
        debugLog('❌ ターンデータ保存エラー', error)
        throw error
      }
      
      debugLog('✅ ターンデータ保存完了')
      
    } catch (error) {
      debugLog('💥 ターンデータ保存失敗', error)
      throw error
    }
  }

  /**
   * 現在のゲームセッションから最新ターンデータを取得
   */
  async getCurrentTurn(gameSessionId: string): Promise<TurnData | null> {
    debugLog('📖 現在ターンデータ取得開始', { gameSessionId })
    
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          current_turn_type,
          current_target_word,
          current_constraint_char,
          turn_start_time,
          turn_sequence_number,
          turn_metadata
        `)
        .eq('id', gameSessionId)
        .single()
      
      if (error) {
        debugLog('❌ ターンデータ取得エラー', error)
        throw error
      }
      
      if (!data || !data.current_turn_type) {
        debugLog('⚠️ ターンデータが存在しません')
        return null
      }
      
      // 制約文字の係数を取得
      let coefficient = 1.0
      if (data.current_turn_type === 'constraint' && data.current_constraint_char) {
        coefficient = LETTER_COEFFICIENTS[data.current_constraint_char] || 1.0
      }
      
      const turnData: TurnData = {
        type: data.current_turn_type as 'typing' | 'constraint',
        targetWord: data.current_target_word || undefined,
        constraintChar: data.current_constraint_char || undefined,
        coefficient,
        startTime: new Date(data.turn_start_time || Date.now()),
        sequenceNumber: data.turn_sequence_number || 0,
        metadata: data.turn_metadata || {}
      }
      
      debugLog('✅ ターンデータ取得完了', turnData)
      return turnData
      
    } catch (error) {
      debugLog('💥 ターンデータ取得失敗', error)
      return null
    }
  }
}

// デフォルトのTurnManagerインスタンス（テスト用）
export const defaultTurnManager = new TurnManager('default')

// 制約文字の係数を取得するヘルパー関数
export const getConstraintCoefficient = (char: string): number => {
  return LETTER_COEFFICIENTS[char.toLowerCase()] || 1.0
}

// ターンタイプの判定ヘルパー
export const isTypingTurn = (turnData: TurnData): boolean => {
  return turnData.type === 'typing'
}

export const isConstraintTurn = (turnData: TurnData): boolean => {
  return turnData.type === 'constraint'
}
