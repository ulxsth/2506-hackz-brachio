// 得点計算システム
// ターン別の得点計算ロジック

import { debugLog } from './logger'

// 得点計算パラメータの型定義
export interface ScoringParams {
  turnType: 'typing' | 'constraint';
  word: string;
  difficulty: number;
  coefficient: number;
  combo: number;
}

/**
 * ターン別得点計算
 * @param params 得点計算パラメータ
 * @returns 計算された得点
 */
export const calculateScore = (params: ScoringParams): number => {
  const { turnType, word, difficulty, coefficient, combo } = params

  debugLog('🧮 得点計算開始', {
    turnType,
    word,
    difficulty,
    coefficient,
    combo
  })

  const baseScore = word.length

  let finalScore: number

  switch (turnType) {
    case 'typing':
      // 通常ターン: 単語文字数 × 難易度 × 速度係数 × コンボ
      finalScore = Math.floor(baseScore * difficulty * coefficient * combo)
      debugLog('📊 通常ターン得点計算', {
        baseScore,
        formula: `${baseScore} × ${difficulty} × ${coefficient} × ${combo}`,
        result: finalScore
      })
      break

    case 'constraint':
      // 制約ターン: 単語文字数 × 難易度 × 制約係数 × コンボ
      finalScore = Math.floor(baseScore * difficulty * coefficient * combo)
      debugLog('🎯 制約ターン得点計算', {
        baseScore,
        formula: `${baseScore} × ${difficulty} × ${coefficient} × ${combo}`,
        result: finalScore
      })
      break

    default:
      debugLog('⚠️ 不明なターンタイプ', turnType)
      finalScore = baseScore
  }

  // 最小得点保証（0点以下にならないように）
  finalScore = Math.max(finalScore, 0)

  debugLog('✅ 得点計算完了', {
    params,
    finalScore
  })

  return finalScore
}

/**
 * タイピング速度係数を計算
 * @param duration タイピング時間（ミリ秒）
 * @returns 速度係数（1.0-3.0）
 */
export const calculateSpeedCoefficient = (duration: number): number => {
  debugLog('⚡ 速度係数計算', { duration })

  let coefficient: number

  if (duration <= 1000) {
    coefficient = 3.0 // 1秒以内 → 最高係数
  } else if (duration <= 2000) {
    coefficient = 2.5 // 2秒以内 → 高係数
  } else if (duration <= 3000) {
    coefficient = 2.0 // 3秒以内 → 標準係数
  } else if (duration <= 5000) {
    coefficient = 1.5 // 5秒以内 → やや低い係数
  } else if (duration <= 8000) {
    coefficient = 1.2 // 8秒以内 → 低係数
  } else {
    coefficient = 1.0 // 8秒超過 → 最低係数
  }

  debugLog('✅ 速度係数計算完了', {
    duration,
    coefficient,
    category: duration <= 1000 ? '超高速' : 
              duration <= 2000 ? '高速' :
              duration <= 3000 ? '標準' :
              duration <= 5000 ? '普通' :
              duration <= 8000 ? '遅い' : '超遅い'
  })

  return coefficient
}

/**
 * 制約係数を取得（制約ターン用）
 * @param char 制約文字
 * @returns 制約係数
 */
export const getConstraintCoefficient = (char: string): number => {
  const letterCoefficients: Record<string, number> = {
    // 高頻度文字（係数低）
    'a': 2, 'e': 2, 'i': 2, 'o': 2, 'u': 2,
    's': 2, 'r': 2, 't': 2, 'n': 2, 'l': 2,
    'c': 3, 'd': 3, 'h': 3, 'p': 3, 'm': 3,
    
    // 中頻度文字（係数中）
    'b': 4, 'f': 4, 'g': 4, 'k': 4, 'v': 4, 'w': 4, 'y': 4,
    
    // 低頻度文字（係数高）
    'j': 6, 'q': 6, 'x': 7, 'z': 8
  }

  const coefficient = letterCoefficients[char.toLowerCase()] || 3 // デフォルト係数

  debugLog('🎯 制約係数取得', {
    char,
    coefficient,
    rarity: coefficient <= 2 ? '高頻度' :
            coefficient <= 4 ? '中頻度' :
            coefficient <= 6 ? '低頻度' : '超低頻度'
  })

  return coefficient
}

/**
 * コンボ係数を計算
 * @param combo 現在のコンボ数
 * @returns コンボ係数
 */
export const calculateComboMultiplier = (combo: number): number => {
  // コンボ数をそのまま乗数として使用（最低1倍保証）
  const multiplier = Math.max(combo, 1)

  debugLog('🔥 コンボ係数計算', {
    combo,
    multiplier,
    level: combo >= 10 ? '超高コンボ' :
           combo >= 5 ? '高コンボ' :
           combo >= 3 ? '中コンボ' : '低コンボ'
  })

  return multiplier
}

/**
 * ボーナス得点を計算（特殊条件用）
 * @param params ボーナス計算パラメータ
 * @returns ボーナス得点
 */
export const calculateBonusScore = (params: {
  isFirstCorrect?: boolean    // 最初の正解
  isPerfectTyping?: boolean   // 完璧なタイピング（誤字なし）
  isRareWord?: boolean        // 珍しい単語
  isLongWord?: boolean        // 長い単語（10文字以上）
}): number => {
  let bonus = 0

  if (params.isFirstCorrect) {
    bonus += 50
    debugLog('🎊 初回正解ボーナス', 50)
  }

  if (params.isPerfectTyping) {
    bonus += 100
    debugLog('🎯 完璧タイピングボーナス', 100)
  }

  if (params.isRareWord) {
    bonus += 200
    debugLog('💎 珍しい単語ボーナス', 200)
  }

  if (params.isLongWord) {
    bonus += 150
    debugLog('📏 長単語ボーナス', 150)
  }

  debugLog('✨ ボーナス得点合計', bonus)
  return bonus
}

/**
 * 得点の詳細情報を生成
 * @param params 得点計算パラメータ
 * @returns 得点詳細情報
 */
export const generateScoreBreakdown = (params: ScoringParams) => {
  const { turnType, word, difficulty, coefficient, combo } = params
  const baseScore = word.length
  const finalScore = calculateScore(params)

  return {
    baseScore,
    wordLength: word.length,
    difficulty,
    coefficient,
    combo,
    turnType,
    finalScore,
    breakdown: {
      base: `文字数: ${word.length}`,
      difficulty: `難易度: ×${difficulty}`,
      coefficient: turnType === 'typing' 
        ? `速度係数: ×${coefficient}` 
        : `制約係数: ×${coefficient}`,
      combo: `コンボ: ×${combo}`,
      total: `合計: ${finalScore}点`
    }
  }
}
