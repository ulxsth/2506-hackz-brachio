# 📋 デュアルターンシステム実装計画書

## 🎯 概要
通常のタイピングゲームのターン（単語を与え、それをタイピングする）と、制約から単語を与えるターン（制約を与え、それに沿った単語をこたえる）の両方をランダム（感覚的に 5:1 程度）に出すシステムの実装。

## 📊 仕様サマリー
- **通常ターン (83%)**: 提示されたIT用語を正確にタイピング
- **制約ターン (17%)**: 指定文字を含むIT用語を考えて入力
- **ターン切り替え**: 各回答後にランダム決定 (`Math.random() < 0.83`)
- **得点計算の分離**: ターンタイプ別の異なる計算式

---

## 🗂️ 関連ファイルパス

### フロントエンドコア
- `frontend/app/game/page.tsx` - メインゲームロジック
- `frontend/lib/room.ts` - ルーム管理・API処理
- `frontend/hooks/useRoom.ts` - ルーム状態管理フック
- `frontend/lib/game-sync.ts` - ゲーム同期システム
- `frontend/hooks/useGameSync.ts` - ゲーム同期フック

### データベース・スキーマ
- `supabase/migrations/20250619_unified_schema.sql` - 現在のスキーマ
- `frontend/lib/database.types.ts` - 型定義ファイル

### 既存ゲームロジック
- `frontend/lib/supabase.ts` - Supabase設定
- `frontend/app/result/page.tsx` - 結果画面
- `frontend/app/debug/test-data/page.tsx` - テストデータ生成

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

### Phase 2: ゲームロジック拡張 🎮

#### 2.1 ターン管理システム
- **ファイル**: `frontend/lib/turn-manager.ts` (新規作成)
- **機能**: ターンタイプ決定、単語選択、制約生成
- **内容**:
  ```typescript
  export interface TurnData {
    type: 'typing' | 'constraint'
    targetWord?: string        // 通常ターン用
    constraintChar?: string    // 制約ターン用
    coefficient: number        // 得点係数
    startTime: Date
  }
  
  export class TurnManager {
    generateNextTurn(previousTurns: TurnData[]): TurnData
    selectRandomWord(): Promise<string>
    generateConstraintChar(): { char: string; coefficient: number }
    calculateSpeedCoefficient(duration: number): number
  }
  ```

#### 2.2 得点計算システム更新
- **ファイル**: `frontend/lib/scoring.ts` (修正)
- **機能**: ターン別得点計算ロジック
- **内容**:
  ```typescript
  interface ScoringParams {
    turnType: 'typing' | 'constraint'
    word: string
    difficulty: number
    coefficient: number // 速度係数 or 制約係数
    combo: number
  }
  
  export const calculateScore = (params: ScoringParams): number => {
    const baseScore = params.word.length
    
    switch (params.turnType) {
      case 'typing':
        // 通常ターン: 単語文字数 × 難易度 × 速度係数 × コンボ
        return baseScore * params.difficulty * params.coefficient * params.combo
      case 'constraint':
        // 制約ターン: 単語文字数 × 難易度 × 制約係数 × コンボ
        return baseScore * params.difficulty * params.coefficient * params.combo
    }
  }
  ```

#### 2.3 タイピング測定システム
- **ファイル**: `frontend/hooks/useTypingTimer.ts` (新規作成)
- **機能**: タイピング開始時間記録、完了時間測定、速度係数計算
- **内容**:
  ```typescript
  export const useTypingTimer = () => {
    const [startTime, setStartTime] = useState<Date | null>(null)
    
    const startTimer = () => setStartTime(new Date())
    const finishTimer = (): { duration: number; coefficient: number } => {
      if (!startTime) return { duration: 0, coefficient: 1.0 }
      
      const duration = Date.now() - startTime.getTime()
      const coefficient = calculateSpeedCoefficient(duration)
      
      return { duration, coefficient }
    }
  }
  ```

### Phase 3: UI・UX実装 🎨

#### 3.1 ゲーム画面更新
- **ファイル**: `frontend/app/game/page.tsx` (大幅修正)
- **機能**: ターン別UI表示、入力処理分岐
- **変更内容**:
  ```typescript
  // 現在のターン状態管理
  const [currentTurn, setCurrentTurn] = useState<TurnData | null>(null)
  
  // ターン別UI表示
  const renderTurnUI = () => {
    if (!currentTurn) return null
    
    switch (currentTurn.type) {
      case 'typing':
        return <TypingTurnUI targetWord={currentTurn.targetWord} />
      case 'constraint':
        return <ConstraintTurnUI constraintChar={currentTurn.constraintChar} />
    }
  }
  ```

#### 3.2 ターン別UIコンポーネント
- **ファイル**: `frontend/components/TypingTurnUI.tsx` (新規作成)
- **機能**: 通常ターン専用UI（単語表示、タイピング入力）
- **ファイル**: `frontend/components/ConstraintTurnUI.tsx` (新規作成)
- **機能**: 制約ターン専用UI（制約表示、パスボタン）

#### 3.3 フィードバック・結果表示更新
- ターン別の成功・失敗メッセージ
- 得点計算式の表示（透明性向上）
- タイピング速度の可視化

### Phase 4: データ同期・API拡張 🔄

#### 4.1 ルーム状態管理拡張
- **ファイル**: `frontend/lib/room.ts` (修正)
- **機能**: ターンデータの同期、状態更新API
- **新規API**:
  ```typescript
  export const startNewTurn = async (roomId: string, turnData: TurnData)
  export const submitTurnResult = async (params: TurnSubmissionParams)
  export const syncTurnState = async (roomId: string)
  ```

#### 4.2 リアルタイム同期拡張
- **ファイル**: `frontend/lib/game-sync.ts` (修正)
- **機能**: ターン切り替え通知、状態同期
- **拡張内容**:
  - ターン開始イベント
  - プレイヤー回答完了通知
  - 次ターン準備通知

### Phase 5: 辞書・パフォーマンス最適化 ⚡

#### 5.1 単語選択最適化
- **対象**: 通常ターン用の単語選択
- **方式**: 事前に選定された単語プールからランダム選択
- **条件**: 
  - 適切な難易度分布
  - タイピング練習に適した長さ（3-15文字）
  - よく知られたIT用語優先

#### 5.2 制約チェック高速化
- **対象**: 制約ターンの文字包含チェック
- **方式**: 既存のSupabaseクエリ継続使用
- **将来の最適化**: 文字インデックス事前構築

---

## ✅ テスト項目

### 単体テスト
- [ ] ターン生成ロジック（83%:17%の比率確認）
- [ ] 得点計算（両ターンタイプ）
- [ ] タイピング速度測定精度
- [ ] 制約チェック正確性

### 統合テスト
- [ ] ターン切り替えフロー
- [ ] マルチプレイヤー同期
- [ ] データベース一貫性
- [ ] リアルタイム通信

### ユーザビリティテスト
- [ ] UI切り替えのスムーズさ
- [ ] 指示の明確性
- [ ] フィードバックの適切性
- [ ] パフォーマンス（レスポンス時間）

---

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
