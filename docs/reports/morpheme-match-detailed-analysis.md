# morpheme-match 詳細調査レポート 🔬📝

## 概要 📋

morpheme-matchは、形態素解析結果（kuromojin/kuromoji.jsの出力）を元に、特定のトークンパターンが文章に含まれているかを検出するライブラリです。

- **作者**: azu
- **最新バージョン**: 2.0.4 (6年前にリリース)
- **週間ダウンロード数**: 62,731
- **ライセンス**: MIT
- **サイズ**: 18.5 KB (unpacked)

## 主要機能 🎯

### 1. トークンマッチング機能
- kuromoji.jsの形態素解析結果から特定のパターンを検出
- 品詞情報を含む詳細なマッチング条件指定が可能
- スキップ可能なトークンの指定サポート

### 2. 基本的な使い方

```javascript
import {createTokenMatcher} from "morpheme-match";

// マッチャー作成
const matchToken = createTokenMatcher([
    {
        "surface_form": "かも",
        "pos": "助詞",
        "pos_detail_1": "副助詞",
        "pos_detail_2": "*",
        "pos_detail_3": "*",
        "conjugated_type": "*",
        "conjugated_form": "*",
        "basic_form": "かも",
        "reading": "カモ",
        "pronunciation": "カモ"
    }
]);

// トークン配列に対してマッチング実行
const result = tokens.some(token => {
    const {match} = matchToken(token);
    return match;
});
```

### 3. 高度な機能

#### メタ情報の埋め込み
```javascript
const matchToken = createTokenMatcher([
    {
        "surface_form": "かも",
        "pos": "助詞",
        // メタ情報は_で始める（マッチングに影響しない）
        "_capture": "$1"
    }
]);
```

#### スキップ可能トークン
```javascript
const matchToken = createTokenMatcher([
    {"surface_form": "かも"},
    {
        "surface_form": "、",
        "_skippable": true  // マッチしなくても無視
    },
    {"surface_form": "しれ"}
]);
```

## 関連ライブラリエコシステム 🌐

### 1. morpheme-match-all
- morpheme-matchのラッパーライブラリ
- kuromojinの全トークンを一括比較
- 辞書ベースの一括検証に適している

#### 使用例
```javascript
const kuromojin = require("kuromojin");
const createMatcher = require("morpheme-match-all");

const dictionaries = [
    {
        message: '"することができる"は有害な表現',
        tokens: [/* トークン定義 */]
    }
];

const matchAll = createMatcher(dictionaries);
kuromojin("解析することができます。").then((actualTokens) => {
    const results = matchAll(actualTokens);
    // マッチ結果配列を取得
});
```

### 2. textlint-rule-morpheme-match
- textlint用のルール
- 日本語文章校正での実用例
- 冗長表現の検出、誤用チェックなどに活用

#### 実用例
```javascript
module.exports = [
    {
        message: "\"することが可能$1\"は冗長な表現です",
        tokens: [
            {"surface_form": "する", "pos": "動詞"},
            {"surface_form": "こと", "pos": "名詞"},
            {"surface_form": "が", "pos": "助詞"},
            {"surface_form": "可能", "pos": "名詞"},
            {"pos": "助動詞", "_capture": "$1"}
        ]
    }
];
```

## ゲームプロジェクトでの活用案 🎮

### 1. IT用語の品詞・語彙判定システム

#### A. 特定品詞の抽出
```javascript
// 名詞のIT用語のみを対象とする
const itNounMatcher = createTokenMatcher([
    {
        "pos": "名詞",
        "pos_detail_1": "一般",
        "_category": "IT用語"
    }
]);
```

#### B. 複合語の検出
```javascript
// "データベース管理"のような複合語
const compoundMatcher = createTokenMatcher([
    {"surface_form": "データベース", "pos": "名詞"},
    {"surface_form": "管理", "pos": "名詞"}
]);
```

### 2. 難易度判定システム

#### A. 語彙レベル判定
```javascript
const difficultyMatchers = {
    beginner: createTokenMatcher([
        {"basic_form": "コンピュータ", "_level": 1},
        {"basic_form": "ファイル", "_level": 1}
    ]),
    intermediate: createTokenMatcher([
        {"basic_form": "アルゴリズム", "_level": 2},
        {"basic_form": "データベース", "_level": 2}
    ]),
    advanced: createTokenMatcher([
        {"basic_form": "マイクロサービス", "_level": 3},
        {"basic_form": "コンテナオーケストレーション", "_level": 3}
    ])
};
```

#### B. 専門性判定
```javascript
const specialtyMatcher = createTokenMatcher([
    {
        "pos": "名詞",
        "reading": ".*[A-Z]+.*", // カタカナ英語
        "_specialty": "プログラミング"
    }
]);
```

### 3. ゲームルール強化

#### A. 禁止単語検出
```javascript
const forbiddenMatcher = createTokenMatcher([
    {"surface_form": "こと", "pos": "名詞", "_forbidden": true},
    {"surface_form": "もの", "pos": "名詞", "_forbidden": true}
]);
```

#### B. ボーナス単語検出
```javascript
const bonusMatcher = createTokenMatcher([
    {
        "pos": "名詞",
        "pos_detail_1": "固有",
        "_bonus": "企業名"
    },
    {
        "pos": "名詞",
        "surface_form": /^(JavaScript|Python|React)$/,
        "_bonus": "プログラミング言語"
    }
]);
```

## 実装上の注意点 ⚠️

### 1. パフォーマンス
- 大量のトークン辞書は処理速度に影響
- 事前にトークンを分類・インデックス化推奨

### 2. 依存関係
- kuromojin（またはkuromoji.js）が必須
- 形態素解析結果の形式に依存

### 3. メンテナンス状況
- 6年前が最後のリリース
- 安定しているが新機能追加は期待できない

## 具体的な実装プラン 📋

### Phase 1: 基本実装
1. morpheme-match + kuromojinの導入
2. IT用語辞書の作成
3. 基本的な品詞判定機能

### Phase 2: ゲーム連携
1. 単語提出時の自動検証
2. 難易度・カテゴリ判定
3. スコア計算への反映

### Phase 3: 高度な機能
1. 複合語・専門用語の特別扱い
2. 動的難易度調整
3. 学習履歴に基づく推奨システム

## 実際の実装例 💻

### 1. IT用語検証システム

```typescript
// lib/morpheme-analyzer.ts
import kuromojin from 'kuromojin';
import { createMatcher } from 'morpheme-match-all';

interface ITWordDictionary {
  message: string;
  category: 'programming' | 'database' | 'network' | 'security';
  difficulty: 1 | 2 | 3;
  bonus: number;
  tokens: any[];
}

const itWordDictionaries: ITWordDictionary[] = [
  {
    message: "プログラミング基礎用語",
    category: "programming",
    difficulty: 1,
    bonus: 10,
    tokens: [
      {
        "surface_form": "変数",
        "pos": "名詞",
        "pos_detail_1": "一般",
        "_category": "programming"
      }
    ]
  },
  {
    message: "データベース専門用語",
    category: "database", 
    difficulty: 2,
    bonus: 20,
    tokens: [
      {
        "surface_form": "SQL",
        "pos": "名詞",
        "pos_detail_1": "固有",
        "_category": "database"
      },
      {
        "surface_form": "クエリ",
        "pos": "名詞",
        "pos_detail_1": "一般",
        "_category": "database"
      }
    ]
  },
  {
    message: "高度なアーキテクチャ用語",
    category: "programming",
    difficulty: 3,
    bonus: 50,
    tokens: [
      {
        "surface_form": "マイクロ",
        "pos": "接頭",
        "_category": "architecture"
      },
      {
        "surface_form": "サービス",
        "pos": "名詞",
        "pos_detail_1": "サ変接続",
        "_category": "architecture"
      }
    ]
  }
];

export class MorphemeAnalyzer {
  private matcher: any;

  constructor() {
    this.matcher = createMatcher(itWordDictionaries);
  }

  async analyzeWord(word: string) {
    try {
      // 形態素解析実行
      const tokens = await kuromojin(word);
      
      // パターンマッチング実行
      const results = this.matcher(tokens);
      
      return {
        word,
        tokens,
        matches: results,
        isValid: results.length > 0,
        categories: this.extractCategories(results),
        difficulty: this.calculateDifficulty(results),
        bonusPoints: this.calculateBonus(results)
      };
    } catch (error) {
      console.error('形態素解析エラー:', error);
      return {
        word,
        tokens: [],
        matches: [],
        isValid: false,
        categories: [],
        difficulty: 1,
        bonusPoints: 0
      };
    }
  }

  private extractCategories(results: any[]): string[] {
    return results.map(result => result.dict.category).filter(Boolean);
  }

  private calculateDifficulty(results: any[]): number {
    if (results.length === 0) return 1;
    return Math.max(...results.map(result => result.dict.difficulty));
  }

  private calculateBonus(results: any[]): number {
    return results.reduce((total, result) => total + result.dict.bonus, 0);
  }
}
```

### 2. ゲーム連携での活用

```typescript
// lib/word-validator.ts
import { MorphemeAnalyzer } from './morpheme-analyzer';

export class WordValidator {
  private analyzer: MorphemeAnalyzer;

  constructor() {
    this.analyzer = new MorphemeAnalyzer();
  }

  async validateSubmission(word: string, gameMode: string) {
    const analysis = await this.analyzer.analyzeWord(word);
    
    // 基本検証
    if (!analysis.isValid) {
      return {
        valid: false,
        reason: 'IT用語として認識されませんでした',
        score: 0
      };
    }

    // ゲームモード別検証
    let score = this.calculateBaseScore(word.length);
    
    switch (gameMode) {
      case 'programming':
        if (analysis.categories.includes('programming')) {
          score += analysis.bonusPoints;
        } else {
          return {
            valid: false,
            reason: 'プログラミング用語のみ有効です',
            score: 0
          };
        }
        break;
        
      case 'database':
        if (analysis.categories.includes('database')) {
          score += analysis.bonusPoints;
        } else {
          return {
            valid: false,
            reason: 'データベース用語のみ有効です',
            score: 0
          };
        }
        break;
        
      case 'mixed':
        // 難易度ボーナス
        score += analysis.difficulty * 10;
        score += analysis.bonusPoints;
        break;
    }

    return {
      valid: true,
      score,
      categories: analysis.categories,
      difficulty: analysis.difficulty,
      morphemeInfo: {
        tokens: analysis.tokens,
        matches: analysis.matches
      }
    };
  }

  private calculateBaseScore(length: number): number {
    return Math.max(length * 2, 10);
  }
}
```

### 3. フロントエンドでの統合

```typescript
// hooks/useMorphemeValidator.ts
import { useState, useCallback } from 'react';
import { WordValidator } from '../lib/word-validator';

export const useMorphemeValidator = () => {
  const [validator] = useState(() => new WordValidator());
  const [isValidating, setIsValidating] = useState(false);

  const validateWord = useCallback(async (word: string, gameMode: string) => {
    setIsValidating(true);
    
    try {
      const result = await validator.validateSubmission(word, gameMode);
      return result;
    } catch (error) {
      console.error('単語検証エラー:', error);
      return {
        valid: false,
        reason: '検証中にエラーが発生しました',
        score: 0
      };
    } finally {
      setIsValidating(false);
    }
  }, [validator]);

  return {
    validateWord,
    isValidating
  };
};
```

### 4. ゲーム画面での実装

```typescript
// app/game/page.tsx (部分的な修正)
import { useMorphemeValidator } from '../../hooks/useMorphemeValidator';

export default function GamePage() {
  const { validateWord, isValidating } = useMorphemeValidator();
  // ... 既存のコード

  const handleSubmitWord = async (word: string) => {
    if (isValidating) return;

    // morpheme-matchによる検証
    const validation = await validateWord(word, gameMode);
    
    if (!validation.valid) {
      setErrorMessage(validation.reason);
      return;
    }

    // 従来のAPI呼び出し
    const result = await submitWord(roomId, playerId, word);
    
    if (result.success) {
      // スコアにボーナス加算
      const totalScore = result.score + validation.score;
      
      // 形態素解析情報も保存
      await updatePlayerScore(roomId, playerId, totalScore, {
        morphemeAnalysis: validation.morphemeInfo,
        categories: validation.categories,
        difficulty: validation.difficulty
      });
      
      setCurrentScore(totalScore);
      setSubmittedWords([...submittedWords, {
        word,
        score: totalScore,
        categories: validation.categories,
        difficulty: validation.difficulty
      }]);
    }
  };

  return (
    <div>
      {isValidating && <div>単語を解析中...</div>}
      {/* 既存のUI */}
    </div>
  );
}
```

## パッケージ導入手順 📦

### 1. 必要パッケージのインストール

```bash
cd frontend
npm install kuromojin morpheme-match morpheme-match-all
```

### 2. 型定義の追加

```typescript
// types/morpheme.ts
export interface MorphemeToken {
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading: string;
  pronunciation: string;
}

export interface WordAnalysisResult {
  word: string;
  tokens: MorphemeToken[];
  matches: any[];
  isValid: boolean;
  categories: string[];
  difficulty: number;
  bonusPoints: number;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  reason?: string;
  categories?: string[];
  difficulty?: number;
  morphemeInfo?: {
    tokens: MorphemeToken[];
    matches: any[];
  };
}
```

### 3. 辞書データの管理

```typescript
// data/it-terms-dictionary.ts
export const itTermsDictionary = [
  // プログラミング基礎
  {
    message: "プログラミング基礎用語",
    category: "programming",
    difficulty: 1,
    bonus: 10,
    tokens: [
      { surface_form: "変数", pos: "名詞", pos_detail_1: "一般" },
      { surface_form: "関数", pos: "名詞", pos_detail_1: "一般" },
      { surface_form: "配列", pos: "名詞", pos_detail_1: "一般" }
    ]
  },
  // データベース
  {
    message: "データベース用語",
    category: "database",
    difficulty: 2,
    bonus: 15,
    tokens: [
      { surface_form: "テーブル", pos: "名詞", pos_detail_1: "一般" },
      { surface_form: "インデックス", pos: "名詞", pos_detail_1: "一般" }
    ]
  },
  // 高度な概念
  {
    message: "アーキテクチャ用語",
    category: "architecture",
    difficulty: 3,
    bonus: 25,
    tokens: [
      { surface_form: "マイクロサービス", pos: "名詞", pos_detail_1: "一般" },
      { surface_form: "コンテナ", pos: "名詞", pos_detail_1: "一般" }
    ]
  }
];
```

## まとめ 📝

morpheme-matchは日本語形態素解析結果を活用した高精度なパターンマッチングライブラリです。IT用語ゲームにおける：

✅ **適用メリット**
- 品詞レベルでの精密な判定
- 専門用語の自動分類
- 複合語・派生語の適切な処理

⚠️ **検討事項**
- 初期辞書作成の工数
- パフォーマンスチューニング
- kuromojinとの連携設計

継続的な辞書メンテナンスと、ゲーム体験向上のバランスを取りながら段階的に導入することを推奨します。
