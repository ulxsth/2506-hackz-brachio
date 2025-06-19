# Tasks: 単語データ圧縮・事前処理システム実装

## 📋 実装計画概要

### 🎯 目標
現在の29語データをベースに、バイナリ圧縮 + Supabase Storage + 事前インデックス生成システムを実装。開発者が任意のタイミングでファイル生成できる仕組みを構築。

### 🚀 基本実装範囲（Phase 1）
1. Supabase Storageへの静的ファイル配置システム
2. gzip圧縮による基本的な容量削減
3. 文字インデックスの事前生成
4. クライアント側での基本的なキャッシュ・展開機能

## 📁 関連ファイルパス

### 新規作成予定
- `scripts/build-dictionary.js` - 辞書ファイル生成スクリプト
- `scripts/upload-to-storage.js` - Supabase Storageアップロードスクリプト
- `frontend/lib/dictionary-loader.ts` - 辞書データローダー
- `frontend/lib/word-index.ts` - 文字インデックス管理

### 既存ファイル（参照・修正）
- `supabase/seed.sql` - ソースデータ（29語）
- `frontend/lib/database.types.ts` - 型定義
- `frontend/app/game/page.tsx` - ゲームロジック（辞書ローダー統合）

### 設定・環境
- `package.json` - スクリプト追加
- `supabase/config.toml` - Storage設定確認

## 🔧 実装ステップ

### Step 1: 開発用スクリプト作成
**目的**: 開発者が任意のタイミングで辞書ファイルを生成・更新できるシステム

#### 1.1 辞書ファイル生成スクリプト
- **ファイル**: `scripts/build-dictionary.js`
- **機能**:
  - Supabaseから最新のit_termsデータ取得
  - 文字インデックス生成（a-z各文字を含む単語のマッピング）
  - 最適化されたJSONデータ構造作成
  - gzip圧縮適用
  - ローカルdist/ディレクトリに出力

#### 1.2 Supabase Storageアップロードスクリプト
- **ファイル**: `scripts/upload-to-storage.js`
- **機能**:
  - 生成された圧縮ファイルをSupabase Storageにアップロード
  - バージョニング機能（タイムスタンプベース）
  - アップロード結果の確認・ログ出力

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
