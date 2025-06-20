// タイピング測定システム
// タイピング開始時間記録、完了時間測定、速度係数計算

import { useState, useRef, useCallback } from 'react'
import { debugLog } from '../lib/logger'
import { calculateSpeedCoefficient } from '../lib/scoring'

interface TypingTimerReturn {
  startTimer: () => void
  finishTimer: () => { duration: number; coefficient: number }
  resetTimer: () => void
  getCurrentDuration: () => number
  isTimerRunning: boolean
  startTime: Date | null
}

/**
 * タイピング測定用React Hook
 */
export const useTypingTimer = (): TypingTimerReturn => {
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef<Date | null>(null)

  const startTimer = useCallback(() => {
    const now = new Date()
    setStartTime(now)
    startTimeRef.current = now
    setIsRunning(true)
    
    debugLog('⏰ タイピングタイマー開始', {
      startTime: now.toISOString()
    })
  }, [])

  const finishTimer = useCallback((): { duration: number; coefficient: number } => {
    if (!startTimeRef.current) {
      debugLog('⚠️ タイマー未開始状態で終了が呼ばれました')
      return { duration: 0, coefficient: 1.0 }
    }

    const endTime = new Date()
    const duration = endTime.getTime() - startTimeRef.current.getTime()
    const coefficient = calculateSpeedCoefficient(duration)

    setIsRunning(false)

    debugLog('⏹️ タイピングタイマー終了', {
      startTime: startTimeRef.current.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      coefficient,
      performance: duration <= 1000 ? '素晴らしい!' : 
                  duration <= 3000 ? '良好' : 
                  duration <= 5000 ? '普通' : '要改善'
    })

    return { duration, coefficient }
  }, [])

  const resetTimer = useCallback(() => {
    setStartTime(null)
    startTimeRef.current = null
    setIsRunning(false)
    
    debugLog('🔄 タイピングタイマーリセット')
  }, [])

  const getCurrentDuration = useCallback((): number => {
    if (!startTimeRef.current) {
      return 0
    }
    
    return new Date().getTime() - startTimeRef.current.getTime()
  }, [])

  return {
    startTimer,
    finishTimer,
    resetTimer,
    getCurrentDuration,
    isTimerRunning: isRunning,
    startTime
  }
}

/**
 * タイピング精度測定用Hook
 */
export const useTypingAccuracy = () => {
  const [totalKeystrokes, setTotalKeystrokes] = useState(0)
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  const recordKeystroke = useCallback((isCorrect: boolean, character?: string) => {
    setTotalKeystrokes(prev => prev + 1)
    
    if (isCorrect) {
      setCorrectKeystrokes(prev => prev + 1)
    } else if (character) {
      setErrors(prev => [...prev, character])
    }

    debugLog('⌨️ キーストローク記録', {
      character,
      isCorrect,
      totalKeystrokes: totalKeystrokes + 1,
      accuracy: ((correctKeystrokes + (isCorrect ? 1 : 0)) / (totalKeystrokes + 1) * 100).toFixed(1) + '%'
    })
  }, [totalKeystrokes, correctKeystrokes])

  const getAccuracy = useCallback((): number => {
    if (totalKeystrokes === 0) return 100
    return (correctKeystrokes / totalKeystrokes) * 100
  }, [totalKeystrokes, correctKeystrokes])

  const reset = useCallback(() => {
    setTotalKeystrokes(0)
    setCorrectKeystrokes(0)
    setErrors([])
    debugLog('🔄 タイピング精度リセット')
  }, [])

  return {
    recordKeystroke,
    getAccuracy,
    reset,
    totalKeystrokes,
    correctKeystrokes,
    errors,
    isPerfectTyping: errors.length === 0 && totalKeystrokes > 0
  }
}

/**
 * WPM（Words Per Minute）計算
 */
export const calculateWPM = (wordCount: number, durationMs: number): number => {
  if (durationMs <= 0) return 0
  
  const minutes = durationMs / (1000 * 60)
  const wpm = Math.round(wordCount / minutes)
  
  debugLog('📊 WPM計算', {
    wordCount,
    durationMs,
    minutes: minutes.toFixed(2),
    wpm
  })
  
  return wpm
}

/**
 * タイピング統計を計算
 */
export const calculateTypingStats = (
  wordCount: number, 
  characterCount: number, 
  durationMs: number,
  errors: number = 0
) => {
  const minutes = durationMs / (1000 * 60)
  const wpm = wordCount / minutes
  const cpm = characterCount / minutes
  const accuracy = errors > 0 ? ((characterCount - errors) / characterCount) * 100 : 100

  const stats = {
    wpm: Math.round(wpm),
    cpm: Math.round(cpm),
    accuracy: Math.round(accuracy * 10) / 10, // 小数点1桁
    duration: Math.round(durationMs / 1000), // 秒
    wordCount,
    characterCount,
    errors
  }

  debugLog('📈 タイピング統計計算', stats)
  
  return stats
}

/**
 * タイピングレベルを判定
 */
export const getTypingLevel = (wpm: number): {
  level: string
  description: string
  color: string
} => {
  if (wpm >= 80) {
    return {
      level: 'エキスパート',
      description: '非常に速い！素晴らしいタイピングスキルです',
      color: 'text-purple-600'
    }
  } else if (wpm >= 60) {
    return {
      level: 'アドバンス',
      description: '速いタイピングです！',
      color: 'text-blue-600'
    }
  } else if (wpm >= 40) {
    return {
      level: 'インターミディエイト',
      description: '良いペースです',
      color: 'text-green-600'
    }
  } else if (wpm >= 20) {
    return {
      level: 'ビギナー',
      description: '練習を続けましょう',
      color: 'text-yellow-600'
    }
  } else {
    return {
      level: 'スターター',
      description: 'ゆっくりで大丈夫です',
      color: 'text-gray-600'
    }
  }
}
