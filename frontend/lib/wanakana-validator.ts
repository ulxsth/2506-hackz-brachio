/**
 * WanaKana ローマ字入力検証システム
 * 日本語IT用語のローマ字入力をリアルタイムで検証し、ゆらぎを許容
 */

import * as wanakana from 'wanakana';

// ローマ字ゆらぎ許容マッピング
const ROMAJI_VARIATIONS = {
  // sy/sh ゆらぎ
  'sya': 'しゃ',
  'sha': 'しゃ',
  'syu': 'しゅ',
  'shu': 'しゅ',
  'syo': 'しょ',
  'sho': 'しょ',
  
  // ti/chi ゆらぎ
  'ti': 'ち',
  'chi': 'ち',
  
  // zi/ji ゆらぎ
  'zi': 'じ',
  'ji': 'じ',
  
  // si/shi ゆらぎ
  'si': 'し',
  'shi': 'し',
  
  // tu/tsu ゆらぎ
  'tu': 'つ',
  'tsu': 'つ',
  
  // hu/fu ゆらぎ
  'hu': 'ふ',
  'fu': 'ふ',
} as const;

export interface ValidationResult {
  isValid: boolean;
  partialMatch: boolean;
  hiraganaPreview: string;
  suggestions: string[];
  matchedTerm?: string;
}

export interface ITTermData {
  id: string;
  display_text: string;
  difficulty_id: number;
  description?: string | null;  // null許可
}

/**
 * WanaKanaベースのローマ字入力検証システム
 */
export class WanaKanaValidator {
  private itTerms: ITTermData[] = [];
  private hiraganaToTermMap = new Map<string, ITTermData[]>();

  constructor(itTerms: ITTermData[] = []) {
    this.updateTerms(itTerms);
  }

  /**
   * IT用語辞書を更新
   */
  updateTerms(itTerms: ITTermData[]): void {
    console.log('🔍 WanaKanaValidator.updateTerms呼び出し:', {
      newTermsLength: itTerms.length,
      currentTermsLength: this.itTerms.length,
      newTermsFirst3: itTerms.slice(0, 3).map(t => t.display_text)
    });
    
    this.itTerms = itTerms;
    this.buildHiraganaMap();
  }

  /**
   * ひらがな→IT用語のマッピングを構築
   */
  private buildHiraganaMap(): void {
    this.hiraganaToTermMap.clear();
    
    this.itTerms.forEach(term => {
      // display_textをひらがなに変換
      const hiragana = wanakana.toHiragana(term.display_text);
      
      if (!this.hiraganaToTermMap.has(hiragana)) {
        this.hiraganaToTermMap.set(hiragana, []);
      }
      this.hiraganaToTermMap.get(hiragana)!.push(term);
    });

    console.log('📝 ひらがなマッピング構築完了:', this.hiraganaToTermMap.size);
  }

  /**
   * ローマ字入力をリアルタイム検証
   */
  validateInput(input: string, targetWord?: string): ValidationResult {
    if (!input.trim()) {
      return {
        isValid: false,
        partialMatch: false,
        hiraganaPreview: '',
        suggestions: []
      };
    }

    // ローマ字をひらがなに変換（ゆらぎマッピング適用）
    const hiragana = wanakana.toHiragana(input.toLowerCase(), {
      customKanaMapping: ROMAJI_VARIATIONS
    });

    // 部分マッチの候補を取得
    const partialMatches = this.findPartialMatches(hiragana);
    
    // 完全マッチチェック
    const exactMatches = this.hiraganaToTermMap.get(hiragana) || [];
    const isExactMatch = exactMatches.length > 0;

    // ターゲット単語との照合（通常ターン用）
    let isTargetMatch = false;
    let matchedTerm: string | undefined;
    
    if (targetWord) {
      const targetHiragana = wanakana.toHiragana(targetWord);
      isTargetMatch = hiragana === targetHiragana;
      if (isTargetMatch) {
        matchedTerm = targetWord;
      }
    } else if (isExactMatch) {
      // 制約ターン等での一般マッチング
      matchedTerm = exactMatches[0].display_text;
    }

    return {
      isValid: isTargetMatch || isExactMatch,
      partialMatch: partialMatches.length > 0,
      hiraganaPreview: hiragana,
      suggestions: partialMatches.slice(0, 5), // 上位5件
      matchedTerm
    };
  }

  /**
   * 制約文字を含む用語を検索
   */
  findTermsWithConstraint(constraintChar: string): ITTermData[] {
    // 制約文字をひらがなに変換
    const constraintHiragana = wanakana.toHiragana(constraintChar.toLowerCase(), {
      customKanaMapping: ROMAJI_VARIATIONS
    });

    return this.itTerms.filter(term => {
      const termHiragana = wanakana.toHiragana(term.display_text);
      return termHiragana.includes(constraintHiragana);
    });
  }

  /**
   * 部分マッチの候補を検索
   */
  private findPartialMatches(inputHiragana: string): string[] {
    const matches: string[] = [];
    
    this.hiraganaToTermMap.forEach((terms, hiragana) => {
      if (hiragana.startsWith(inputHiragana) && hiragana !== inputHiragana) {
        // 優先度順（短い順、難易度順）でソート
        const sortedTerms = terms.sort((a, b) => {
          const lengthDiff = a.display_text.length - b.display_text.length;
          if (lengthDiff !== 0) return lengthDiff;
          return a.difficulty_id - b.difficulty_id;
        });
        
        matches.push(sortedTerms[0].display_text);
      }
    });

    return matches.slice(0, 10); // 最大10件
  }

  /**
   * 入力支援：次に入力可能な文字を取得
   */
  getNextPossibleChars(input: string): string[] {
    const possibleChars = new Set<string>();
    
    this.hiraganaToTermMap.forEach((terms, hiragana) => {
      const inputHiragana = wanakana.toHiragana(input.toLowerCase(), {
        customKanaMapping: ROMAJI_VARIATIONS
      });
      
      if (hiragana.startsWith(inputHiragana)) {
        const nextChar = hiragana.charAt(inputHiragana.length);
        if (nextChar) {
          possibleChars.add(nextChar);
        }
      }
    });

    return Array.from(possibleChars).sort();
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      totalTerms: this.itTerms.length,
      hiraganaVariations: this.hiraganaToTermMap.size,
      supportedVariations: Object.keys(ROMAJI_VARIATIONS).length
    };
  }
}

/**
 * デフォルトインスタンスをエクスポート
 */
export const wanaKanaValidator = new WanaKanaValidator();
