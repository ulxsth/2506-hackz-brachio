# 単語データ圧縮・事前処理・Supabase Storage活用調査レポート

## 調査概要
ITタイピングゲームにおける4000語規模の単語辞書データの効率的な管理・配信方式について調査し、最適な実装案を提案する。

## 現在の課題
1. **スケール問題**: 現在29語 → 目標4000語（約138倍の増加）
2. **メモリ負荷**: クライアント側での大容量辞書データ保持
3. **検索性能**: 制約条件（指定文字を含む）に対する高速検索
4. **ネットワーク負荷**: 大容量データの初期ロード時間
5. **データ更新**: 辞書データの追加・修正時の効率的な更新

## 技術要件分析

### 1. データ量見積もり
- **現在**: 29語 × 平均50文字/語 ≈ 1.5KB
- **目標**: 4000語 × 平均50文字/語 ≈ 200KB
- **メタデータ**: 難易度・説明・エイリアス含めて ≈ 400KB
- **総合**: 約600KB（非圧縮時）

### 2. 制約検索の最適化要件
- **制約**: 指定文字を含む単語の高速検索
- **アルファベット26文字**: 各文字ごとの単語インデックス
- **検索時間**: O(1)または O(log n)レベルの性能要求

## 提案する解決方式

### 方式1: バイナリ圧縮 + Supabase Storage
```javascript
// データ構造例
{
  "metadata": {
    "version": "1.0.0",
    "wordCount": 4000,
    "lastUpdated": "2025-01-20T10:00:00Z"
  },
  "letterIndex": {
    "a": [0, 15, 23, 45, ...], // 'a'を含む単語のインデックス
    "b": [2, 18, 34, ...],
    // ... 全26文字分
  },
  "words": [
    {
      "id": 0,
      "text": "algorithm",
      "romaji": "arugorizu", 
      "difficulty": 3,
      "description": "問題解決手順"
    },
    // ... 4000語分
  ]
}
```

**圧縮戦略**:
- gzip圧縮で約70%削減 → 約180KB
- 文字列の重複除去（difficulty名など）
- 数値の効率的エンコーディング

### 方式2: 分割ダウンロード + 遅延読み込み
```javascript
// ファイル分割例
- words-meta.json.gz (20KB) // 基本情報
- words-a-e.json.gz (60KB)  // a-e文字の単語
- words-f-j.json.gz (60KB)  // f-j文字の単語
- words-k-o.json.gz (60KB)  // k-o文字の単語
- words-p-t.json.gz (60KB)  // p-t文字の単語  
- words-u-z.json.gz (40KB)  // u-z文字の単語
```

**利点**:
- 初期ロード時は基本情報のみ（20KB）
- 制約文字に応じて必要な分割ファイルのみダウンロード
- メモリ使用量の動的調整

### 方式3: IndexedDB + キャッシュ戦略
```javascript
// クライアント側キャッシュ
class WordDictionary {
  constructor() {
    this.indexedDB = null;
    this.memoryCache = new Map();
    this.letterIndex = new Map();
  }

  async initialize() {
    // IndexedDBから既存データチェック
    // バージョン確認 → 必要に応じて更新
    // メモリインデックス構築
  }

  async getWordsWithLetter(letter) {
    // 1. メモリキャッシュ確認
    // 2. IndexedDB確認  
    // 3. 必要に応じてStorageからダウンロード
  }
}
```

## Supabase Storageの活用

### 1. ファイル配置戦略
```
supabase-storage/
├── dictionaries/
│   ├── v1.0.0/
│   │   ├── words-full.json.gz      (フル辞書)
│   │   ├── words-meta.json.gz      (メタ情報)
│   │   ├── words-index.json.gz     (文字インデックス)
│   │   └── chunks/
│   │       ├── words-a-e.json.gz
│   │       ├── words-f-j.json.gz
│   │       └── ...
│   └── latest -> v1.0.0/           (シンボリックリンク)
```

### 2. CDN最適化
- Supabase Storage → CDN経由での高速配信
- gzip圧縮 + Brotli圧縮対応
- キャッシュ期間設定（長期キャッシュ + バージョニング）

### 3. 差分更新システム
```javascript
// 更新検出
const currentVersion = localStorage.getItem('dictionaryVersion');
const latestVersion = await fetchLatestVersion();

if (currentVersion !== latestVersion) {
  // 差分ダウンロード または フル更新
  await updateDictionary(currentVersion, latestVersion);
}
```

## 事前処理の設計

### 1. ビルド時処理
```javascript
// scripts/build-dictionary.js
async function buildDictionary() {
  const rawData = await loadFromSupabase();
  
  // 1. 文字インデックス生成
  const letterIndex = buildLetterIndex(rawData);
  
  // 2. 最適化（重複除去、圧縮）
  const optimized = optimizeData(rawData);
  
  // 3. 分割ファイル生成
  const chunks = splitByLetter(optimized);
  
  // 4. 圧縮 & Supabase Storageアップロード
  await uploadToStorage(chunks);
}
```

### 2. 検索インデックス生成
```javascript
function buildLetterIndex(words) {
  const index = {};
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const uniqueLetters = new Set(word.text.toLowerCase());
    
    for (const letter of uniqueLetters) {
      if (!index[letter]) index[letter] = [];
      index[letter].push(i);
    }
  }
  
  return index;
}
```

## パフォーマンス最適化

### 1. メモリ効率化
```javascript
// WeakMapを活用したメモリリーク防止
class OptimizedWordCache {
  constructor() {
    this.wordCache = new WeakMap();
    this.letterCache = new Map();
  }
  
  // 使用頻度の低いデータの自動開放
  cleanupUnusedData() {
    // LRU cache implementation
  }
}
```

### 2. 検索最適化
```javascript
// Bloom Filterによる事前フィルタリング
class BloomFilter {
  // 単語の存在可能性を高速チェック
  // false positiveは許容、false negativeは回避
}

// Trie構造による前方一致検索
class WordTrie {
  // タイピング中のリアルタイム候補表示
}
```

## 実装優先度

### Phase 1: 基本実装 🚀
1. Supabase Storageへの静的ファイル配置
2. gzip圧縮による基本的な容量削減
3. 文字インデックスの事前生成
4. クライアント側での基本的なキャッシュ

### Phase 2: 最適化 ⚡
1. 分割ダウンロード実装
2. IndexedDBによる永続化
3. 差分更新システム
4. CDN最適化

### Phase 3: 高度な最適化 🔥
1. Bloom Filter実装
2. Trie構造による候補表示
3. 機械学習による使用頻度予測
4. 動的データ圧縮

## 技術スタック

### フロントエンド
- **圧縮**: pako (gzip) または brotli-wasm
- **ストレージ**: IndexedDB (Dexie.js)
- **HTTP**: fetch API + Service Worker
- **圧縮**: LZ4 / Snappy (高速圧縮・展開)

### バックエンド/インフラ
- **ストレージ**: Supabase Storage
- **CDN**: Cloudflare (Supabase標準)
- **ビルド**: Node.js scripts
- **圧縮**: gzip, brotli, custom binary format

## 予想される効果

### 1. パフォーマンス改善
- **初期ロード**: 600KB → 180KB (70%削減)
- **検索速度**: O(n) → O(1) (文字インデックス使用)
- **メモリ使用量**: 動的調整により50%削減

### 2. ユーザー体験向上
- **高速起動**: 3秒 → 1秒以下
- **オフライン対応**: IndexedDBキャッシュ
- **段階的ロード**: 必要な分だけダウンロード

### 3. 運用効率化
- **データ更新**: 差分更新により転送量削減
- **スケーラビリティ**: 10万語まで対応可能
- **開発効率**: 自動ビルド・デプロイパイプライン

## リスク・制約事項

### 1. 技術的リスク
- **ブラウザ互換性**: IndexedDB, CompressionStreams
- **メモリ制限**: モバイルデバイスでの制約
- **ネットワーク**: 低速回線での初期ロード

### 2. 運用リスク  
- **データ整合性**: キャッシュとサーバーの同期
- **バージョン管理**: 下位互換性の維持
- **障害対応**: Supabase Storage障害時のフォールバック

## 次のアクション

### 即座に実施可能
1. 現在の29語データでのプロトタイプ実装
2. Supabase Storageセットアップ
3. 基本的な圧縮・展開ロジック実装

### 段階的実施
1. 4000語データの準備・整理
2. 文字インデックス生成スクリプト作成
3. 分割ダウンロード機能実装
4. IndexedDBキャッシュ実装

---

**調査結論**: バイナリ圧縮 + Supabase Storage + 事前インデックス生成の組み合わせにより、4000語規模でも高速・軽量な辞書システムの実現が可能。Phase 1から段階的に実装することで、リスクを最小化しながら最適化を進められる。

**推奨実装**: 方式1（バイナリ圧縮）+ 方式3（IndexedDBキャッシュ）のハイブリッド構成を基本とし、必要に応じて方式2（分割ダウンロード）を追加。
