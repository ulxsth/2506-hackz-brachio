# 実装計画 📋

## 概要
段階的な翻訳・認知度評価システムの改良

## 📋 仕様変更: 段階的処理とレジューム機能の実装 🔄

### 🎯 新しい目的
1. **効率化**: 既に処理済みのデータをスキップ
2. **中断対応**: 途中終了しても再開可能  
3. **メモリ最適化**: 定期的な書き出しでメモリを解放
4. **コスト削減**: 不要なAPI呼び出しを削減

---

## ✅ 前回完了: 認知度評価システム実装

### 🎯 目的
- ITタイピングゲームでの難易度調整に使用
- プログラミング言語の知名度に基づく1-4段階評価
- 既存の翻訳パイプラインに統合

### � 関連ファイルパス

#### 修正対象ファイル
- `/scripts/translate-to-japanese/src/types.ts` - 認知度関連の型定義追加
- `/scripts/translate-to-japanese/src/sequential-processor.ts` - 認知度評価処理統合
- `/scripts/translate-to-japanese/src/csv-processor.ts` - CSV出力に認知度カラム追加
- `/scripts/translate-to-japanese/src/output-manager.ts` - 統計情報に認知度情報追加
- `/scripts/translate-to-japanese/.env` - 認知度評価設定追加

#### 新規作成ファイル
- `/scripts/translate-to-japanese/src/difficulty-evaluator.ts` - 認知度評価専用モジュール
- `/scripts/translate-to-japanese/prompts/difficulty-evaluation.md` - プロンプトテンプレート

### 🔄 実装ステップ

#### Phase 1: 型定義とデータモデル
1. **types.ts**: 認知度関連の型定義追加
   - `DifficultyLevel` インターフェース
   - `TranslatedLanguage` に `difficulty` フィールド追加
   - 認知度評価用の警告・エラー型

#### Phase 2: 認知度評価モジュール
2. **difficulty-evaluator.ts**: 認知度評価専用モジュール作成
   - Gemini APIへの認知度評価リクエスト
   - プロンプトテンプレート適用
   - 1-4段階の数値パース処理

3. **prompts/difficulty-evaluation.md**: プロンプト設計
   - 日本語での認知度評価指示
   - 1-4段階の明確な基準提示
   - 安定した出力形式

#### Phase 3: パイプライン統合
4. **sequential-processor.ts**: 認知度評価処理統合
   - 翻訳処理後に認知度評価を実行
   - エラーハンドリング強化
   - 進捗表示対応

5. **.env設定**: 認知度評価の有効/無効設定
   - `DIFFICULTY_EVALUATION_ENABLED` フラグ追加

#### Phase 4: 出力対応
6. **csv-processor.ts**: CSV出力に認知度カラム追加
   - `difficulty` カラム追加
   - ヘッダー更新

7. **output-manager.ts**: 統計情報に認知度データ追加
   - 認知度分布統計
   - 評価成功率

### 🚫 実装制約
- **最小限の変更**: 既存の翻訳機能に影響しない
- **オプション機能**: 設定で有効/無効を切り替え可能
- **エラー継続**: 認知度評価失敗時も翻訳結果は保持
- **レート制限**: 既存のレート制限を維持

### 📊 期待される出力
- CSV出力に `difficulty` カラム（1-4の数値）
- 統計情報に認知度分布データ
- エラーログに認知度評価失敗情報

### 💰 コスト増加分析

#### Gemini API使用量比較
**現在（翻訳のみ）**:
- 612件 × 1回API呼び出し = **612リクエスト**
- 平均入力トークン: ~150トークン/リクエスト
- 平均出力トークン: ~20トークン/リクエスト
- **総計**: 約92,000入力 + 12,000出力トークン

**追加後（翻訳 + 認知度評価）**:
- 612件 × 2回API呼び出し = **1,224リクエスト**
- 翻訳: 612 × (150入力 + 20出力)トークン
- 認知度: 612 × (50入力 + 5出力)トークン
- **総計**: 約125,000入力 + 15,000出力トークン

#### 料金試算（Gemini 1.5 Flash-8B）
**Free Tier**:
- 現在: $0（無料枠内）
- 追加後: $0（無料枠内、RPM制限で処理時間増）

**Paid Tier**:
- 現在: 約$0.01（翻訳のみ）
- 追加後: 約$0.015（+50%増）
- **増加分**: +$0.005（約0.5円）

#### 処理時間比較
**現在**:
- 612件 × 5秒間隔 = **約51分**

**追加後**:
- 1,224リクエスト × 5秒間隔 = **約102分**
- **増加**: +51分（2倍）

#### リソース使用量
**API使用量**: +100%（リクエスト数2倍）
**処理時間**: +100%（約2倍）
**料金**: +50%（認知度評価は軽量）
**メモリ使用量**: +5%（追加フィールド分のみ）

### 辞書・データ管理
- 現在：Supabaseクエリベース (`it_terms`テーブル)
- 将来：高速化のための事前処理済み辞書ファイル

---

## 🛠️ 実装項目

### Phase 1: データベース拡張 🗄️

#### 1.1 game_sessions テーブル拡張
```sql
-- ターンシステム対応
ALTER TABLE public.game_sessions 
ADD COLUMN current_turn_type text check (current_turn_type in ('typing', 'constraint')) default 'constraint',
ADD COLUMN current_target_word text, -- 通常ターン用の提示単語
ADD COLUMN current_constraint_char char(1), -- 制約ターン用の指定文字
ADD COLUMN turn_start_time timestamp with time zone,
ADD COLUMN turn_sequence_number integer default 0;
```

#### 1.2 word_submissions テーブル拡張
```sql
-- ターン情報とタイミング記録
ALTER TABLE public.word_submissions
ADD COLUMN turn_type text check (turn_type in ('typing', 'constraint')) default 'constraint',
ADD COLUMN target_word text, -- 通常ターン用（提示された単語）
ADD COLUMN constraint_char char(1), -- 制約ターン用（指定文字）
ADD COLUMN typing_start_time timestamp with time zone, -- タイピング開始時刻
ADD COLUMN typing_duration_ms integer, -- タイピング時間（ミリ秒）
ADD COLUMN speed_coefficient decimal default 1.0; -- タイピング速度係数
```

#### 1.3 インデックス追加
```sql
CREATE INDEX idx_game_sessions_turn_type ON public.game_sessions(current_turn_type);
CREATE INDEX idx_word_submissions_turn_type ON public.word_submissions(turn_type);
CREATE INDEX idx_word_submissions_target_word ON public.word_submissions(target_word);
```

## 🚀 実装優先度

### 🔥 Priority 1 (即座に実装)
1. データベーススキーマ拡張
2. ターン管理システム（基本機能）
3. ゲーム画面のターン別表示切り替え

### ⚡ Priority 2 (1週間以内)
4. 得点計算システム更新
5. タイピング測定システム
6. API・データ同期拡張

### 🎯 Priority 3 (安定化・最適化)
7. UI・UXの洗練
8. パフォーマンス最適化
9. 包括的テスト実装

---

## 📋 結果集計・表示機能（既存項目）

### 🎯 要件
- 試合終了後にユーザーの結果をデータベースから集計する
- 実際のプレイデータに基づいた結果を表示する機能を実装
- 現在のダミーデータによる表示を実際のDBデータに置き換える

### ✅ 前回完了項目（ホスト専用終了ボタン）
- ✅ ホスト専用のゲーム終了ボタン実装完了
- ✅ 強制終了機能・リアルタイム配信完了
- ✅ 全員への結果画面遷移機能完了

### 📁 結果集計関連ファイル
- `frontend/app/result/page.tsx` - 結果画面メイン（要修正：ダミーデータ→実データ）
- `frontend/hooks/useRoom.ts` - ルーム管理フック（結果取得API追加）
- `frontend/lib/room.ts` - ルーム操作API（結果集計API追加）
- `frontend/lib/supabase.ts` - Supabase型定義（結果集計型追加）

### 利用するテーブル
- `word_submissions` - 単語提出履歴（個人統計の基礎データ）
- `room_players` - プレイヤー情報（スコア・コンボ）  
- `game_sessions` - ゲームセッション（ゲーム期間情報）
- `rooms` - ルーム情報（設定・状態）

---

## 🛠️ 実装項目

### 1. 結果集計APIの実装 �
- **ファイル**: `frontend/lib/room.ts`
- **内容**: ゲーム終了時の結果集計関数
- **詳細**: 
  - プレイヤー別の総合統計取得（スコア、単語数、コンボ、正解率）
  - ランキング計算（順位付け）
  - word_submissions, room_players, game_sessionsを結合したクエリ
  - エラーハンドリング・型安全性の確保

### 2. 結果表示画面の修正 🎨
- **ファイル**: `frontend/app/result/page.tsx`
- **内容**: ダミーデータを実データに置き換え
- **詳細**:
  - useEffect内のダミーデータ生成を削除
  - ルームIDを取得してAPIから実際の結果を取得
  - ローディング状態・エラー状態の追加
  - レスポンシブデザインの維持

### 3. 型定義の追加・更新 🏷️
- **ファイル**: `frontend/lib/supabase.ts` または新規 `frontend/lib/types.ts`
- **内容**: 結果データの型定義
- **詳細**:
  - PlayerGameResult型（プレイヤー別統計）
  - GameResultsSummary型（ゲーム全体結果）
  - API応答の型定義
  - 既存PlayerResult型との統合

### 4. useRoomフックの拡張 🔗
- **ファイル**: `frontend/hooks/useRoom.ts`
- **内容**: 結果取得機能の追加
- **詳細**:
  - getGameResults関数の追加
  - 結果取得状態の管理（loading、error、data）
  - キャッシュ機能（同じ結果の重複取得防止）
  - リアルタイム更新への対応

### 5. 統計計算ロジックの実装 📈
- **機能**: DBクエリでの統計計算
- **内容**: 複雑な集計ロジックの実装
- **詳細**:
  - 正解率の計算（正解単語数 / 総提出数）
  - 最高コンボの取得（word_submissionsの最大combo_at_time）
  - 平均得点/単語の計算
  - ランキング計算（同点の場合の順位ルール）

### 6. パフォーマンス最適化 ⚡
- **対象**: DB集計クエリの最適化
- **内容**: 効率的なデータ取得
- **詳細**:
  - インデックスの確認・追加検討
  - 必要最小限のデータ取得
  - クエリの最適化（JOINの効率化）
  - 重複データ取得の防止

## 🔧 詳細設計

### 結果集計のデータフロー
```
1. ゲーム終了 (rooms.status = 'finished')
2. 結果画面遷移
3. ルームIDから最新のgame_sessionを取得
4. 各プレイヤーのword_submissionsを集計
5. room_playersの最終スコア・コンボと結合
6. ランキング計算・正解率計算
7. 結果表示
```

## 🔧 既存結果集計機能の実装項目

### 5. 統計計算ロジックの実装 📈
- **機能**: DBクエリでの統計計算
- **内容**: 複雑な集計ロジックの実装
- **詳細**:
  - 正解率の計算（正解単語数 / 総提出数）
  - 最高コンボの取得（word_submissionsの最大combo_at_time）
  - 平均得点/単語の計算
  - ランキング計算（同点の場合の順位ルール）

### 想定する集計クエリ例
```sql
-- プレイヤー別統計の取得
SELECT 
  rp.id,
  rp.name,
  rp.score,
  rp.combo as max_combo,
  COUNT(ws.id) as total_submissions,
  COUNT(ws.id) FILTER (WHERE ws.is_valid = true) as correct_submissions,
  CASE 
    WHEN COUNT(ws.id) > 0 
    THEN ROUND(100.0 * COUNT(ws.id) FILTER (WHERE ws.is_valid = true) / COUNT(ws.id), 1)
    ELSE 0 
  END as accuracy
FROM room_players rp
LEFT JOIN word_submissions ws ON ws.player_id = rp.id 
WHERE rp.room_id = $1
GROUP BY rp.id, rp.name, rp.score, rp.combo
ORDER BY rp.score DESC;
```

## 🎯 成功指標
- ✅ ダミーデータが実際のDBデータに置き換わる
- ✅ 実際のプレイ結果が正確に表示される
- ✅ ランキング・統計が正しく計算される
- ✅ エラーハンドリングが適切に動作する
- ✅ パフォーマンスが許容範囲内（<2秒）

## 📝 統合テスト項目
1. **基本機能テスト**
   - 複数プレイヤーでの結果表示
   - 個人統計の正確性（スコア、単語数、コンボ、正解率）
   - ランキングの正確性

2. **ターンシステムテスト**
   - 通常ターンと制約ターンの切り替え
   - ターン別得点計算の正確性
   - UI表示の適切性

3. **エラーケーステスト**
   - 提出データなしの場合
   - ネットワークエラーの場合
   - 不正なルームIDの場合

4. **パフォーマンステスト**
   - 大量の単語提出データでの表示速度
   - 複数プレイヤーでの処理時間

---

## 🌟 今回のメイン目標

### 最終目標
デュアルターンシステム（通常タイピングターン + 制約ターン）を実装し、5:1の比率でランダム出題する完全に機能するマルチプレイヤーゲームシステムの構築。

### 期待される成果
1. **ユーザビリティ向上**: 2種類のゲームモードによる飽きにくいゲーム体験
2. **スキル多様化**: タイピング速度と知識・思考力の両方を評価
3. **システム拡張性**: 将来的な新ゲームモード追加の基盤構築
4. **データ分析強化**: ターン別パフォーマンス分析機能

---

## 📞 次のアクション

### すぐに実行可能
1. **「実装」** - Phase 1のデータベース拡張から開始
2. **「調査」** - 既存ゲームロジックの詳細分析・インパクト評価  
3. **「デバッグ」** - 現在の制約ターン動作の検証・修正

どの方向で進めましょうか？ 🚀✨
interface CompressedDictionary {
  metadata: {
    version: string;
    wordCount: number;
    lastUpdated: string;
    compression: 'gzip';
  };
  letterIndex: {
    [letter: string]: number[]; // 該当文字を含む単語のインデックス配列
  };
  words: {
    id: number;
    text: string;
    romaji: string;
    difficulty: number;
    description: string;
    aliases: string[];
  }[];
}
```

#### 2.2 文字インデックス生成ロジック
```typescript
function buildLetterIndex(words: ITTerm[]): Record<string, number[]> {
  const index: Record<string, number[]> = {};
  
  // a-z初期化
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(97 + i); // 'a' to 'z'
    index[letter] = [];
  }
  
  // 各単語の含有文字をインデックス化
  words.forEach((word, wordIndex) => {
    const uniqueLetters = new Set(word.text.toLowerCase().match(/[a-z]/g) || []);
    uniqueLetters.forEach(letter => {
      index[letter].push(wordIndex);
    });
  });
  
  return index;
}
```

### Step 3: クライアント側ローダー実装

#### 3.1 辞書データローダー
- **ファイル**: `frontend/lib/dictionary-loader.ts`
- **機能**:
  - Supabase Storageから圧縮辞書ファイル取得
  - gzip展開
  - メモリキャッシュ管理
  - エラーハンドリング（フォールバック処理）

#### 3.2 文字インデックス管理
- **ファイル**: `frontend/lib/word-index.ts`
- **機能**:
  - 指定文字を含む単語の高速検索（O(1)）
  - 辞書データとの連携
  - 制約チェック機能

### Step 4: ゲームロジック統合

#### 4.1 既存コード修正
- **ファイル**: `frontend/app/game/page.tsx`
- **変更内容**:
  - 現在のSupabase直接クエリを辞書ローダー使用に変更
  - 高速な制約チェック実装
  - メモリ使用量の最適化

#### 4.2 フォールバック処理
- 辞書ファイル読み込み失敗時は既存のSupabaseクエリに自動切り替え
- エラー状態の可視化

## 🗂️ ディレクトリ構造（実装後）

```
scripts/
├── build-dictionary.js      # 辞書生成
├── upload-to-storage.js     # アップロード
└── package.json            # 依存関係

frontend/
├── lib/
│   ├── dictionary-loader.ts # 辞書ローダー
│   ├── word-index.ts       # インデックス管理
│   └── ...existing files...
└── ...existing structure...

dist/                        # 生成ファイル
├── dictionary-v1.0.0.json.gz
├── dictionary-latest.json.gz
└── build-log.txt

supabase-storage://
└── dictionaries/
    ├── v1.0.0-dictionary.json.gz
    └── latest/
        └── dictionary.json.gz
```

### 動作確認
- [ ] スクリプトでの辞書ファイル生成成功
- [ ] gzip圧縮・展開の正常動作
- [ ] Supabase Storageへのアップロード成功
- [ ] クライアント側での圧縮ファイル読み込み成功
- [ ] 文字インデックスによる高速検索動作

## 📝 開発者向け使用方法

### 辞書ファイル更新手順
```bash
# 1. Supabaseのseed.sqlを更新
# 2. データベースに最新データ投入
npm run supabase:reset

# 3. 辞書ファイル生成・アップロード
npm run dict:update

# 4. フロントエンド動作確認
npm run dev
```

### デバッグ・確認コマンド
```bash
# 生成されたファイルサイズ確認
ls -la dist/

# 圧縮率確認
npm run build:dictionary -- --verbose

# Supabase Storage確認
npm run supabase:storage list dictionaries
```

---

## 🎯 今回の作業範囲

**Step 1.1のみ集中実装**: `scripts/build-dictionary.js`の作成と動作確認
- 最小限の機能で動作するバージョンを作成
- 29語データでの検証完了
- 他のステップは動作確認後に順次追加

この計画で進めることで、リスクを最小化しながら段階的に最適化システムを構築できます！
