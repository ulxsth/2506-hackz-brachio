# word_submissions データ未保存問題調査レポート

## 🔍 調査結果

### 問題の詳細
- **症状**: `word_submissions` テーブルにデータが保存されない
- **ログ確認**: `getGameResults` で `[]` (空配列) が返される
- **DB更新**: `updatePlayerScore` は成功するが、`submitWord` のログが表示されない

### 根本原因の特定

#### 1. データベーススキーマ拡張
`supabase/migrations/20250620_dual_turn_system.sql` で以下のカラムが追加:
```sql
ALTER TABLE public.word_submissions
ADD COLUMN IF NOT EXISTS turn_type text check (turn_type in ('typing', 'constraint')) default 'constraint',
ADD COLUMN IF NOT EXISTS target_word text,
ADD COLUMN IF NOT EXISTS constraint_char char(1),
ADD COLUMN IF NOT EXISTS typing_start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS typing_duration_ms integer,
ADD COLUMN IF NOT EXISTS speed_coefficient decimal default 1.0;
```

#### 2. submitWord関数の問題
現在の `submitWord` 関数は新しいカラムを設定していない:
```typescript
const { error } = await supabase
  .from('word_submissions')
  .insert({
    game_session_id: params.gameSessionId,
    player_id: params.playerId,
    word: params.word,
    score: params.score,
    combo_at_time: params.comboAtTime,
    constraints_met: params.constraintsMet,
    is_valid: params.isValid
    // ← turn_type, target_word, constraint_char等が設定されていない！
  })
```

#### 3. エラーハンドリングの問題
`submitWord` でエラーが発生してもログが表示されず、無視されている。

## 🛠️ 修正方針

### 1. submitWord関数の拡張
新しいカラムに対応したパラメータを追加:
```typescript
export const submitWord = async (params: {
  gameSessionId: string
  playerId: string
  word: string
  score: number
  comboAtTime: number
  isValid: boolean
  constraintsMet: any[]
  // 新規追加
  turnType: 'typing' | 'constraint'
  targetWord?: string        // 通常ターン用
  constraintChar?: string    // 制約ターン用
  typingStartTime?: Date
  typingDurationMs?: number
  speedCoefficient?: number
}) => { ... }
```

### 2. ゲーム画面でのsubmitWord呼び出し修正
現在のターン情報を含めて呼び出し:
```typescript
await submitWord({
  // 既存パラメータ
  gameSessionId,
  playerId: user.id,
  word: matchedTerm.display_text,
  score: points,
  comboAtTime: newCombo,
  isValid: true,
  constraintsMet: [...],
  // 新規追加
  turnType: currentTurn.type,
  targetWord: currentTurn.type === 'typing' ? currentTurn.targetWord : undefined,
  constraintChar: currentTurn.type === 'constraint' ? currentTurn.constraintChar : undefined,
  typingStartTime: typingTimerData.startTime,
  typingDurationMs: typingTimerData.duration,
  speedCoefficient: coefficient
});
```

### 3. エラーハンドリング強化
失敗時のログ出力とエラー処理を改善

## 📝 実装計画
1. `submitWord` 関数のパラメータ拡張
2. データベースINSERT文の修正
3. ゲーム画面での呼び出し修正
4. エラーハンドリング強化
5. テスト実行でデータ保存確認
