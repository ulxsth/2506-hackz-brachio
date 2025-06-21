# 📋 認知度評価システム追加実装計画

**日時**: 2025年6月21日  
**目的**: Gemini APIを使用してプログラミング言語の認知度（difficulty）を評価する機能追加  
**対象システム**: scripts/translate-to-japanese/

---

## 🎯 追加機能概要

### 認知度評価の目的
- **ITタイピングゲーム**でのユーザ体験向上
- 言語の知名度に応じた出題難易度調整
- 初心者から上級者まで適切なレベル分け

### 評価基準設計
```typescript
interface DifficultyLevel {
  level: 1 | 2 | 3 | 4;  // 1=超有名, 4=マニアック
  description: string;
  examples: string[];
}
```

**レベル定義**:
- **Level 1 (超有名)**: JavaScript, Python, Java など
- **Level 2 (有名)**: TypeScript, Go, Rust など  
- **Level 3 (普通)**: Scala, Erlang, F# など
- **Level 4 (専門的)**: Prolog, Forth, APL など
- **Level 5 (マニアック)**: Brainfuck, Malbolge, INTERCAL など

---

## 🔍 関連ファイルパス調査

### 既存ファイル（修正対象）
- `/scripts/translate-to-japanese/src/types.ts` - データ型定義に認知度フィールド追加
- `/scripts/translate-to-japanese/src/gemini-client.ts` - 認知度評価API呼び出し追加
- `/scripts/translate-to-japanese/src/sequential-processor.ts` - 認知度評価処理組み込み
- `/scripts/translate-to-japanese/src/csv-processor.ts` - CSV出力に認知度カラム追加
- `/scripts/translate-to-japanese/.env` - 認知度評価の有効/無効設定

### 新規作成ファイル
- `/scripts/translate-to-japanese/src/difficulty-evaluator.ts` - 認知度評価専用モジュール
- `/scripts/translate-to-japanese/prompts/difficulty-evaluation.md` - プロンプトテンプレート

---

## 🏗️ システム設計

### 1. データ型拡張 (`types.ts`)
```typescript
// 既存型の拡張
export interface TranslatedLanguage extends ProgrammingLanguage {
  japaneseSummary: string;
  difficulty?: DifficultyEvaluation;  // 新規追加
}

// 新規型定義
export interface DifficultyEvaluation {
  level: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  category: 'mainstream' | 'specialized' | 'academic' | 'historical' | 'esoteric';
  userTarget: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'researcher';
}

export interface DifficultyStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level4Count: number;
  level5Count: number;
  averageDifficulty: number;
}
```

### 2. 認知度評価エンジン (`difficulty-evaluator.ts`)
```typescript
export class DifficultyEvaluator {
  constructor(private geminiClient: GeminiClient) {}
  
  async evaluateDifficulty(
    languageName: string, 
    summary: string, 
    year?: number
  ): Promise<DifficultyEvaluation> {
    // プロンプト構築
    const prompt = this.buildDifficultyPrompt(languageName, summary, year);
    
    // Gemini API呼び出し
    const result = await this.geminiClient.generateContent(prompt);
    
    // 結果パース・検証
    return this.parseDifficultyResponse(result);
  }
  
  private buildDifficultyPrompt(name: string, summary: string, year?: number): string {
    // 詳細なプロンプト設計
  }
}
```

### 3. プロンプト設計
```markdown
# プログラミング言語認知度評価プロンプト

以下のプログラミング言語の一般的な認知度・知名度を1-5の5段階で評価してください。

**言語名**: ${languageName}
**説明**: ${summary}
**登場年**: ${year || '不明'}

**評価基準**:
- **Level 1**: 超有名 (一般人でも知っている、求人多数)
- **Level 2**: 有名 (エンジニアなら大体知っている)  
- **Level 3**: 普通 (特定分野では有名、専門知識必要)
- **Level 4**: 専門的 (研究者・専門家向け、限定的用途)
- **Level 5**: マニアック (極めて限定的、実験的・学術的)

**回答形式**:
{
  "level": [1-5の数値],
  "reasoning": "評価理由を1文で",
  "category": "mainstream|specialized|academic|historical|esoteric",
  "userTarget": "beginner|intermediate|advanced|expert|researcher"
}
```

---

## 🔄 実装手順

### Phase 1: 基盤実装 (30分)
1. **型定義追加** - `types.ts` に認知度関連型追加
2. **評価モジュール作成** - `difficulty-evaluator.ts` 実装
3. **プロンプト設計** - 認知度評価用プロンプト作成

### Phase 2: 統合実装 (20分)  
4. **処理統合** - `sequential-processor.ts` に評価処理組み込み
5. **CSV出力拡張** - 認知度カラム追加
6. **統計機能** - 認知度分布の集計・表示

### Phase 3: テスト・調整 (30分)
7. **テスト実行** - 3-5件での動作確認
8. **精度調整** - プロンプト微調整
9. **設定追加** - 認知度評価の有効/無効切り替え

---

## 📊 期待される出力

### CSV出力例
```csv
name,wikipediaTitle,summary,japaneseSummary,difficulty_level,difficulty_reasoning,difficulty_category
JavaScript,JavaScript,高級プログラミング言語...,Webページに動的機能を追加する言語,1,"Web開発で必須、最も普及した言語の一つ",mainstream
Brainfuck,Brainfuck,極限まで小さな言語...,極限まで小さな難解プログラミング言語,5,"実用性皆無、パズル・教育目的のみ",esoteric
```

### 統計出力例
```json
{
  "difficultyDistribution": {
    "level1": { "count": 15, "percentage": 2.5 },
    "level2": { "count": 45, "percentage": 7.4 }, 
    "level3": { "count": 180, "percentage": 29.4 },
    "level4": { "count": 250, "percentage": 40.8 },
    "level5": { "count": 122, "percentage": 19.9 }
  },
  "averageDifficulty": 3.7,
  "categoryDistribution": {
    "mainstream": 60,
    "specialized": 200,
    "academic": 150,
    "historical": 100,
    "esoteric": 102
  }
}
```

---

## ⚡ コスト・時間への影響

### API呼び出し増加
- **現在**: 612件 × 1回 = 612リクエスト
- **追加後**: 612件 × 2回 = 1,224リクエスト
- **時間**: 約51分 → **約102分** (2倍)

### コスト増加
- **現在**: $0.01 (約1円)
- **追加後**: $0.02 (約2円)
- **増加**: +100% (許容範囲)

### 処理効率化案
1. **並列処理**: 翻訳と認知度評価を同時実行
2. **バッチ化**: 複数言語の認知度を一度に評価
3. **選択実行**: 有名言語のみ評価スキップ

---

## 🎯 成功指標

### 品質指標
- **評価精度**: マニュアル検証で90%以上の妥当性
- **一貫性**: 同カテゴリ言語の評価レベル統一
- **分散**: Level 1-5にバランス良く分布

### 技術指標  
- **エラー率**: 5%以下
- **処理時間**: 1言語あたり10秒以内
- **レート制限**: 429エラー0件

---

## 🚀 将来の拡張性

### ゲーム側での活用
- **難易度調整**: ユーザレベルに応じた出題
- **学習モード**: Level別の練習機能
- **プログレス**: 難易度クリア状況の可視化

### データ分析
- **トレンド分析**: 年代別認知度変化
- **カテゴリ分析**: 分野別言語分布
- **相関分析**: 認知度と使用頻度の関係

---

**実装優先度**: 🟡 中 (翻訳機能完了後)  
**影響範囲**: scripts/translate-to-japanese/ 全体 + 新規モジュール  
**期待工数**: 実装80分 + テスト40分 + 本格実行2時間
