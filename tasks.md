# 📋 試合終了後のユーザー結果集計・表示機能実装計画

## 🎯 要件
- 試合終了後にユーザーの結果をデータベースから集計する
- 実際のプレイデータに基づいた結果を表示する機能を実装
- 現在のダミーデータによる表示を実際のDBデータに置き換える

## ✅ 前回完了項目（ホスト専用終了ボタン）
- ✅ ホスト専用のゲーム終了ボタン実装完了
- ✅ 強制終了機能・リアルタイム配信完了
- ✅ 全員への結果画面遷移機能完了

## 📁 関連ファイル

### フロントエンド（結果集計・表示）
- `frontend/app/result/page.tsx` - 結果画面メイン（要修正：ダミーデータ→実データ）
- `frontend/hooks/useRoom.ts` - ルーム管理フック（結果取得API追加）
- `frontend/lib/room.ts` - ルーム操作API（結果集計API追加）
- `frontend/lib/supabase.ts` - Supabase型定義（結果集計型追加）

### バックエンド（データベース）
- `supabase/migrations/20250619_unified_schema.sql` - データベーススキーマ（確認済）

### 利用するテーブル
- `word_submissions` - 単語提出履歴（個人統計の基礎データ）
- `room_players` - プレイヤー情報（スコア・コンボ）
- `game_sessions` - ゲームセッション（ゲーム期間情報）
- `rooms` - ルーム情報（設定・状態）

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

## 📝 テスト項目
1. **基本機能テスト**
   - 複数プレイヤーでの結果表示
   - 個人統計の正確性（スコア、単語数、コンボ、正解率）
   - ランキングの正確性

2. **エラーケーステスト**
   - 提出データなしの場合
   - ネットワークエラーの場合
   - 不正なルームIDの場合

3. **パフォーマンステスト**
   - 大量の単語提出データでの表示速度
   - 複数プレイヤーでの処理時間

## 🚀 実装順序
1. **Phase 1** - API層の実装（結果集計関数）
2. **Phase 2** - 型定義・データ取得ロジック
3. **Phase 3** - UI修正（ダミーデータ削除）
4. **Phase 4** - エラーハンドリング・最適化
5. **Phase 5** - テスト・デバッグ

---

## 📈 既存実装の活用ポイント
- **DB設計**: word_submissions, room_players等の既存テーブル構造は適切
- **型定義**: 既存のPlayerResult型は再利用可能
- **UI/UX**: 現在の結果画面デザインは維持
- **状態管理**: useRoomフックの拡張で対応

## ⚠️ 注意事項
- **データ整合性**: ゲーム終了時点でのデータの確定が重要
- **リアルタイム性**: 全プレイヤーが同じ結果を見ることを保証
- **エラー耐性**: ネットワーク・DBエラー時のフォールバック
- **セキュリティ**: プレイヤーは自分が参加したゲームの結果のみ表示

---

*この計画は前回のホスト専用終了ボタンの実装完了を受けて作成されています* ✅
3. 強制終了の理由が分かる通知が表示される 💬

## 🚀 次のアクション

計画確認後、「実装」の指示で段階的な実装を開始します！

#### 1.3 package.jsonスクリプト追加
```json
{
  "scripts": {
    "build:dictionary": "node scripts/build-dictionary.js",
    "upload:dictionary": "node scripts/upload-to-storage.js",
    "dict:update": "npm run build:dictionary && npm run upload:dictionary"
  }
}
```

### Step 2: データ構造設計

#### 2.1 圧縮辞書ファイル構造
```typescript
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
