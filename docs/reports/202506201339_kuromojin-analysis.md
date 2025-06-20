# kuromojin 調査レポート 🔍

## 📋 概要

**kuromojin**は、日本語形態素解析ライブラリ`kuromoji.js`の高レベルラッパーライブラリです。

### 🎯 基本情報
- **名前**: kuromojin
- **作者**: azu
- **GitHub**: https://github.com/azu/kuromojin
- **npm**: https://www.npmjs.com/package/kuromojin
- **オンラインプレイグラウンド**: https://kuromojin.netlify.app/

## ✨ 主な特徴

### 1. **Promise ベース API**
- 非同期処理で使いやすい
- async/await 対応

### 2. **キャッシュレイヤー**
- 辞書は一度だけ取得
- 同じテキストに対して同じトークンを返す（パフォーマンス向上）

### 3. **不変性保証**
- 返される配列・オブジェクトは読み取り専用
- キャッシュデータの変更を防止

## 🛠️ インストール

```bash
npm install kuromojin
```

## 📝 基本的な使用方法

### API 概要
kuromojinは2つの主要APIを提供：

1. **`getTokenizer()`**: kuromoji.jsのtokenizerインスタンスを返す
2. **`tokenize(text)`**: 解析済みトークンを返す

### 使用例

```typescript
import { tokenize, getTokenizer } from "kuromojin";

// 基本的な形態素解析
tokenize("黒文字").then(tokens => {
    console.log(tokens);
    /*
    [ {
        word_id: 509800,          // 辞書内での単語ID
        word_type: 'KNOWN',       // 単語タイプ(KNOWN/UNKNOWN)
        word_position: 1,         // 単語の開始位置
        surface_form: '黒文字',    // 表層形
        pos: '名詞',               // 品詞
        pos_detail_1: '一般',      // 品詞細分類1
        pos_detail_2: '*',        // 品詞細分類2
        pos_detail_3: '*',        // 品詞細分類3
        conjugated_type: '*',     // 活用型
        conjugated_form: '*',     // 活用形
        basic_form: '黒文字',      // 基本形
        reading: 'クロモジ',       // 読み
        pronunciation: 'クロモジ'  // 発音
      } ]
    */
});

// 低レベルAPI使用
getTokenizer().then(tokenizer => {
    // kuromoji.jsのtokenizerインスタンス
    const tokens = tokenizer.tokenize("テキスト");
});
```

## 🌐 ブラウザ使用時の設定

### グローバル辞書パス設定
```javascript
// ブラウザでの辞書パス設定
window.kuromojin = {
    dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict"
};

getTokenizer(); // 上記パスを使用
```

### 利用可能な辞書URL
- **CDN**: `https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict`
- **テスト用**: `https://kuromojin.netlify.com/dict/*.dat.gz`

## 🔄 バージョン変更点

### v1.1.0 → v2.0.0
- **v1.1.0**: `tokenize`をデフォルトエクスポート
- **v2.0.0**: デフォルトエクスポートを削除

```typescript
// 非推奨（v1.1.0）
import kuromojin from "kuromojin";

// 推奨（v2.0.0+）
import { tokenize } from "kuromojin";
```

## 💡 TYPE 2 LIVE での活用可能性

### 🎯 適用シナリオ

#### 1. **日本語単語の品詞判定**
```typescript
import { tokenize } from "kuromojin";

const validateJapaneseWord = async (word: string) => {
    const tokens = await tokenize(word);
    
    // 名詞のみ有効とする場合
    return tokens.some(token => 
        token.pos === '名詞' && token.word_type === 'KNOWN'
    );
};
```

#### 2. **読み仮名の自動生成**
```typescript
const getReading = async (kanji: string) => {
    const tokens = await tokenize(kanji);
    return tokens.map(token => token.reading).join('');
};

// 例：「情報技術」→「ジョウホウギジュツ」
```

#### 3. **単語の基本形統一**
```typescript
const normalizeWord = async (word: string) => {
    const tokens = await tokenize(word);
    return tokens.map(token => token.basic_form).join('');
};

// 例：活用形を基本形に統一
```

#### 4. **難易度判定支援**
```typescript
const calculateDifficulty = async (word: string) => {
    const tokens = await tokenize(word);
    
    // 複合語の場合は難易度を上げる
    if (tokens.length > 1) return 'hard';
    
    // 品詞による難易度分類
    const token = tokens[0];
    switch (token.pos) {
        case '名詞': return 'normal';
        case '動詞': return 'medium';
        case '形容詞': return 'hard';
        default: return 'unknown';
    }
};
```

## ⚠️ 注意事項

### 1. **ブラウザ要件**
- `DecompressionStream` 対応ブラウザが必要
- モダンブラウザでの使用推奨

### 2. **辞書サイズ**
- 形態素解析辞書は大きいファイル
- 初回ロード時間を考慮する必要

### 3. **バージョン固定**
- kuromoji.jsのバージョンが固定されている
- 辞書の重複を避けるため

## 🔗 関連ライブラリ

- **[morpheme-match](https://github.com/azu/morpheme-match)**: 形態素とセンテンスのマッチング
- **[kuromoji.js](https://github.com/takuyaa/kuromoji.js)**: ベースとなる形態素解析ライブラリ

## 🚀 実装提案

TYPE 2 LIVEでの日本語IT用語ゲームに活用する場合：

### 段階的導入
1. **Phase 1**: 読み仮名自動生成機能
2. **Phase 2**: 日本語単語の品詞判定
3. **Phase 3**: 複合語・活用形の正規化
4. **Phase 4**: AI難易度判定システム

### パフォーマンス考慮
- 辞書のプリロード
- キャッシュ戦略の最適化
- サーバーサイドでの前処理

---

**結論**: kuromojinは日本語処理に非常に有用で、TYPE 2 LIVEのゲーム品質向上に大きく貢献できるライブラリです！🎉
