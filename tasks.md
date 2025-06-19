# 📋 ゲーム画面のホスト専用終了ボタン実装計画

## 🎯 要件
- ゲーム画面にあるデバッグ用の終了ボタンをホスト専用にする
- ボタンを押すと全員に強制終了イベントを配信し、結果画面に遷移させる

## 📁 関連ファイル

### フロントエンド
- `frontend/app/game/page.tsx` - ゲーム画面メイン
- `frontend/hooks/useRoom.ts` - ルーム管理フック
- `frontend/lib/room.ts` - ルーム操作API
- `frontend/lib/supabase-atoms.ts` - 状態管理アトム

### バックエンド
- `supabase/migrations/20250619_unified_schema.sql` - データベーススキーマ

## 🛠️ 実装項目

### 1. ホスト判定機能の追加 🔐
- **ファイル**: `frontend/app/game/page.tsx`
- **内容**: 現在のユーザーがホストかどうかの判定ロジック
- **詳細**: 
  - useRoomフックからホスト情報を取得
  - ホストでない場合はボタンを非表示にする

### 2. 強制終了機能の実装 ⚡
- **ファイル**: `frontend/lib/room.ts`
- **内容**: 強制ゲーム終了の関数追加
- **詳細**:
  - ホストのみ実行可能な権限チェック
  - ルーム状態を'finished'に更新
  - Supabase Realtimeで全プレイヤーに配信

### 3. リアルタイム通信の設定 📡
- **ファイル**: `frontend/hooks/useRoom.ts`
- **内容**: 強制終了イベントの受信処理
- **詳細**:
  - ルーム状態変更のリスナー追加
  - 'finished'状態受信時に結果画面へ遷移

### 4. UI/UXの改善 🎨
- **ファイル**: `frontend/app/game/page.tsx`
- **内容**: ボタンの見た目とアクセシビリティ
- **詳細**:
  - ホスト専用の明確な表示
  - 確認ダイアログの追加
  - デバッグラベルの更新

### 5. エラーハンドリング ⚠️
- **ファイル**: 各関連ファイル
- **内容**: 権限エラーやネットワークエラーの処理
- **詳細**:
  - 非ホストの操作試行時のエラー表示
  - 通信失敗時のリトライ機能

## 🔄 実装順序

1. **ホスト判定** → ボタンの表示制御
2. **強制終了API** → バックエンド機能実装
3. **リアルタイム受信** → 状態変更の通知処理
4. **UI改善** → ユーザー体験の最適化
5. **エラー処理** → 例外ケースの対応

## ✅ 完了条件

- [ ] ホスト以外には終了ボタンが表示されない
- [ ] ホストが終了ボタンを押すと確認ダイアログが表示される
- [ ] 全プレイヤーが同時に結果画面に遷移する
- [ ] 非ホストが不正にAPIを叩いてもエラーが返される
- [ ] ネットワークエラー時も適切な表示がされる

## 🎮 ユーザーストーリー

**ホストの場合**:
1. ゲーム画面で「ゲーム終了」ボタンが表示される 👑
2. ボタンをクリックすると確認ダイアログが出る ❓
3. 確認すると全プレイヤーが結果画面に移動する 🏁

**参加者の場合**:
1. ゲーム画面で終了ボタンは表示されない 👥
2. ホストが終了操作を行うと自動で結果画面に移動する 📱
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
