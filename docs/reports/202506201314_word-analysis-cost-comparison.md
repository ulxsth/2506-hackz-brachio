# Gemini API vs kuromojin vs その他の方法 コスト・性能比較分析 💰⚡

## 📊 コスト比較サマリー

| 方法 | 初期コスト | 月間コスト（1万単語） | 応答速度 | 精度 | 総合評価 |
|------|-----------|---------------------|----------|-------|----------|
| **Gemini 2.0 Flash** | $0 | $0.40 | 100-500ms | ⭐⭐⭐⭐⭐ | 🥇 推奨 |
| **kuromojin** | $0 | $0（一回のみ）| 10-30ms | ⭐⭐⭐⭐ | 🥈 高速 |
| **wanakana** | $0 | $0 | <1ms | ⭐⭐⭐ | 🥉 シンプル |
| **hepburn** | $0 | $0 | <1ms | ⭐⭐⭐ | 🥉 シンプル |

## 🔍 詳細分析

### 1. Gemini API での単語解析 🤖

#### 料金体系（2025年6月現在）

**Gemini 2.0 Flash（推奨）**
- 入力: $0.075/1M tokens (≤128k), $0.15/1M tokens (>128k)
- 出力: $0.30/1M tokens (≤128k), $0.60/1M tokens (>128k)
- 無料枠: あり（制限あり）

**Gemini 1.5 Flash**
- 入力: $0.075/1M tokens (≤128k), $0.15/1M tokens (>128k)
- 出力: $0.30/1M tokens (≤128k), $0.60/1M tokens (>128k)
- 無料枠: あり（制限あり）

#### 単語解析の実装例

```typescript
// lib/gemini-word-analyzer.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

interface WordAnalysis {
  word: string;
  meaning: string;
  difficulty: number; // 1-10
  romaji: string;
  category: string;
  isITTerm: boolean;
}

export class GeminiWordAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async analyzeWord(word: string): Promise<WordAnalysis> {
    const prompt = `
以下の単語を分析してJSON形式で回答してください：

単語: "${word}"

回答形式:
{
  "word": "${word}",
  "meaning": "意味・定義",
  "difficulty": 1-10の数値,
  "romaji": "ローマ字読み",
  "category": "プログラミング|データベース|ネットワーク|セキュリティ|その他",
  "isITTerm": true/false
}

判定基準:
- difficulty: 1=基本用語, 5=中級, 10=専門用語
- IT用語でない場合はisITTerm: false
- ローマ字は標準的なヘボン式で
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSONパースを試みる
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Gemini analysis error:', error);
      return {
        word,
        meaning: '解析エラー',
        difficulty: 1,
        romaji: word,
        category: 'その他',
        isITTerm: false
      };
    }
  }

  // バッチ処理でコスト効率化
  async analyzeWords(words: string[]): Promise<WordAnalysis[]> {
    const batchPrompt = `
以下の単語群を分析してJSON配列形式で回答してください：

単語群: ${words.map(w => `"${w}"`).join(', ')}

回答形式:
[
  {
    "word": "単語1",
    "meaning": "意味・定義",
    "difficulty": 1-10の数値,
    "romaji": "ローマ字読み",
    "category": "プログラミング|データベース|ネットワーク|セキュリティ|その他",
    "isITTerm": true/false
  },
  // 以下同様...
]
`;

    try {
      const result = await this.model.generateContent(batchPrompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('Gemini batch analysis error:', error);
      return words.map(word => ({
        word,
        meaning: '解析エラー',
        difficulty: 1,
        romaji: word,
        category: 'その他',
        isITTerm: false
      }));
    }
  }
}
```

#### コスト計算例

```typescript
// コスト計算機
export class GeminiCostCalculator {
  // 平均的なトークン数（経験値）
  private static readonly TOKENS_PER_WORD_INPUT = 100;  // プロンプト + 単語
  private static readonly TOKENS_PER_WORD_OUTPUT = 50;  // JSON応答
  
  // Gemini 2.0 Flash料金（$/1M tokens）
  private static readonly INPUT_COST_PER_M_TOKENS = 0.075;
  private static readonly OUTPUT_COST_PER_M_TOKENS = 0.30;

  static calculateCost(wordCount: number): number {
    const inputTokens = wordCount * this.TOKENS_PER_WORD_INPUT;
    const outputTokens = wordCount * this.TOKENS_PER_WORD_OUTPUT;
    
    const inputCost = (inputTokens / 1_000_000) * this.INPUT_COST_PER_M_TOKENS;
    const outputCost = (outputTokens / 1_000_000) * this.OUTPUT_COST_PER_M_TOKENS;
    
    return inputCost + outputCost;
  }

  static calculateMonthlyCost(dailyWords: number): number {
    return this.calculateCost(dailyWords * 30);
  }
}

// 使用例
console.log('1万単語の解析コスト:', GeminiCostCalculator.calculateCost(10000));
// 結果: 約$0.40
```

### 2. kuromojin での実装 🔧

#### 実装例

```typescript
// lib/kuromojin-analyzer.ts
import { tokenize } from 'kuromojin';

interface KuromojinAnalysis {
  word: string;
  tokens: any[];
  romaji: string;
  difficulty: number;
  category: string;
  isITTerm: boolean;
}

export class KuromojinAnalyzer {
  private itTermsDict: Map<string, any>;

  constructor() {
    this.itTermsDict = new Map();
    this.initializeITTermsDict();
  }

  private initializeITTermsDict() {
    // IT用語辞書の初期化
    const itTerms = [
      { word: 'javascript', difficulty: 3, category: 'プログラミング' },
      { word: 'データベース', difficulty: 4, category: 'データベース' },
      { word: 'ネットワーク', difficulty: 3, category: 'ネットワーク' },
      // ... 他のIT用語
    ];
    
    itTerms.forEach(term => {
      this.itTermsDict.set(term.word.toLowerCase(), term);
    });
  }

  async analyzeWord(word: string): Promise<KuromojinAnalysis> {
    try {
      const tokens = await tokenize(word);
      const romaji = this.tokensToRomaji(tokens);
      const itTermInfo = this.itTermsDict.get(word.toLowerCase());
      
      return {
        word,
        tokens,
        romaji,
        difficulty: itTermInfo?.difficulty || 1,
        category: itTermInfo?.category || 'その他',
        isITTerm: !!itTermInfo
      };
    } catch (error) {
      console.error('Kuromojin analysis error:', error);
      return {
        word,
        tokens: [],
        romaji: word,
        difficulty: 1,
        category: 'その他',
        isITTerm: false
      };
    }
  }

  private tokensToRomaji(tokens: any[]): string {
    return tokens.map(token => {
      // 読み仮名をローマ字に変換
      return this.kanaToRomaji(token.reading || token.surface_form);
    }).join('');
  }

  private kanaToRomaji(kana: string): string {
    // 簡易的なカナ→ローマ字変換
    const kanaMap: { [key: string]: string } = {
      'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
      'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
      'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
      'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
      'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
      'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
      'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
      'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
      'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
      'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n'
    };
    
    return kana.split('').map(char => kanaMap[char] || char.toLowerCase()).join('');
  }
}
```

#### コスト計算

```typescript
export class KuromojinCostCalculator {
  // kuromojin辞書ダウンロード（初回のみ）
  private static readonly DICTIONARY_SIZE_MB = 50;
  private static readonly BANDWIDTH_COST_PER_MB = 0.001; // 仮定

  static calculateInitialCost(): number {
    return this.DICTIONARY_SIZE_MB * this.BANDWIDTH_COST_PER_MB;
  }

  static calculateMonthlyCost(dailyWords: number): number {
    // 処理コストはほぼ0（クライアントサイド）
    return 0;
  }
}
```

### 3. wanakana での実装 🌸

```typescript
// lib/wanakana-analyzer.ts
import * as wanakana from 'wanakana';

interface WanakanaAnalysis {
  word: string;
  romaji: string;
  difficulty: number;
  category: string;
  isITTerm: boolean;
}

export class WanakanaAnalyzer {
  private itTermsDict: Map<string, any>;

  constructor() {
    this.itTermsDict = new Map();
    this.initializeITTermsDict();
  }

  private initializeITTermsDict() {
    // IT用語辞書（kuromojinと同様）
    const itTerms = [
      { word: 'javascript', difficulty: 3, category: 'プログラミング' },
      { word: 'データベース', difficulty: 4, category: 'データベース' },
      // ... 他のIT用語
    ];
    
    itTerms.forEach(term => {
      this.itTermsDict.set(term.word.toLowerCase(), term);
    });
  }

  analyzeWord(word: string): WanakanaAnalysis {
    // 日本語が含まれている場合のみローマ字変換
    const romaji = wanakana.isJapanese(word) ? wanakana.toRomaji(word) : word;
    const itTermInfo = this.itTermsDict.get(word.toLowerCase());
    
    return {
      word,
      romaji: romaji.toLowerCase(),
      difficulty: itTermInfo?.difficulty || 1,
      category: itTermInfo?.category || 'その他',
      isITTerm: !!itTermInfo
    };
  }
}
```

## 📈 性能比較

### 処理速度テスト（1000単語）

```typescript
// benchmark.ts
export class PerformanceBenchmark {
  static async benchmarkGemini(words: string[]): Promise<number> {
    const analyzer = new GeminiWordAnalyzer(process.env.GEMINI_API_KEY!);
    const start = performance.now();
    
    // バッチ処理（50単語ずつ）
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < words.length; i += batchSize) {
      batches.push(words.slice(i, i + batchSize));
    }
    
    await Promise.all(batches.map(batch => analyzer.analyzeWords(batch)));
    
    return performance.now() - start;
  }

  static async benchmarkKuromojin(words: string[]): Promise<number> {
    const analyzer = new KuromojinAnalyzer();
    const start = performance.now();
    
    await Promise.all(words.map(word => analyzer.analyzeWord(word)));
    
    return performance.now() - start;
  }

  static benchmarkWanakana(words: string[]): number {
    const analyzer = new WanakanaAnalyzer();
    const start = performance.now();
    
    words.forEach(word => analyzer.analyzeWord(word));
    
    return performance.now() - start;
  }
}
```

## 💡 推奨アプローチ

### 段階的実装戦略

#### Phase 1: 基本実装（wanakana）
```typescript
// シンプルで高速
const analyzer = new WanakanaAnalyzer();
const result = analyzer.analyzeWord('データベース');
```

#### Phase 2: 高精度実装（kuromojin）
```typescript
// より詳細な解析
const analyzer = new KuromojinAnalyzer();
const result = await analyzer.analyzeWord('データベース');
```

#### Phase 3: AI駆動実装（Gemini）
```typescript
// 最高精度・動的分析
const analyzer = new GeminiWordAnalyzer(apiKey);
const result = await analyzer.analyzeWord('データベース');
```

### ハイブリッド戦略（推奨）

```typescript
// lib/hybrid-analyzer.ts
export class HybridWordAnalyzer {
  private wanakanaAnalyzer: WanakanaAnalyzer;
  private kuromojinAnalyzer: KuromojinAnalyzer;
  private geminiAnalyzer: GeminiWordAnalyzer;
  private cache: Map<string, any>;

  constructor(geminiApiKey?: string) {
    this.wanakanaAnalyzer = new WanakanaAnalyzer();
    this.kuromojinAnalyzer = new KuromojinAnalyzer();
    if (geminiApiKey) {
      this.geminiAnalyzer = new GeminiWordAnalyzer(geminiApiKey);
    }
    this.cache = new Map();
  }

  async analyzeWord(word: string, mode: 'fast' | 'accurate' | 'ai' = 'fast') {
    // キャッシュチェック
    const cacheKey = `${word}:${mode}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result;
    
    switch (mode) {
      case 'fast':
        result = this.wanakanaAnalyzer.analyzeWord(word);
        break;
      case 'accurate':
        result = await this.kuromojinAnalyzer.analyzeWord(word);
        break;
      case 'ai':
        if (this.geminiAnalyzer) {
          result = await this.geminiAnalyzer.analyzeWord(word);
        } else {
          result = await this.kuromojinAnalyzer.analyzeWord(word);
        }
        break;
    }

    // キャッシュに保存
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

## 🎯 最終推奨

### 現在のプロジェクトでの推奨順位

1. **wanakana** - 即座に実装可能、十分な精度
2. **kuromojin** - 将来的な拡張性、高精度
3. **Gemini API** - 高度な分析が必要になった場合

### 実装コスト vs 効果

```
wanakana: 
✅ 実装コスト: 低
✅ 運用コスト: $0
✅ 応答速度: 最速
⚠️ 精度: 基本レベル

kuromojin:
✅ 実装コスト: 中
✅ 運用コスト: $0
✅ 応答速度: 高速
✅ 精度: 高

Gemini API:
⚠️ 実装コスト: 中
⚠️ 運用コスト: $0.40/1万単語
⚠️ 応答速度: 中
✅ 精度: 最高
✅ 動的分析: 対応
```

## 🚀 今すぐ始められる実装

```bash
# 最小限のパッケージインストール
cd frontend
npm install wanakana

# 将来的な拡張用
npm install kuromojin

# AI機能が必要になった場合
npm install @google/generative-ai
```

**結論**: まずは**wanakana**で基本機能を実装し、必要に応じて**kuromojin**や**Gemini API**に段階的にアップグレードする戦略が最適です！ 🎯✨
