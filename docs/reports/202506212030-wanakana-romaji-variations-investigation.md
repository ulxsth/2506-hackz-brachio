# WanaKanaライブラリによるローマ字ゆらぎ許容機能調査

## 📝 調査概要
- **日時**: 2025年6月21日 20:30
- **目的**: ローマ字のゆらぎを許容する（例：syogi, shogi）機能がwanaKanaで実装可能かを調査
- **対象**: WanaKana JavaScript ライブラリ v5.3.1

## 🎯 調査結果サマリー

### ✅ 結論：**実装可能** 
wanaKanaライブラリは `customKanaMapping` および `customRomajiMapping` オプションを提供しており、これらを使用してローマ字のゆらぎ許容機能を実装できます。

## 📊 詳細分析

### 1. wanaKanaライブラリの基本機能
- **主要機能**: ローマ字⇔ひらがな⇔カタカナの相互変換
- **対応する変換**: 
  - `toKana()`: ローマ字 → かな
  - `toHiragana()`: ローマ字/カタカナ → ひらがな
  - `toKatakana()`: ローマ字/ひらがな → カタカナ
  - `toRomaji()`: かな → ローマ字

### 2. 既存のローマ字ゆらぎサポート
wanaKanaは標準でいくつかのローマ字ゆらぎをサポートしています：

#### ALIASESで定義済みのゆらぎ
```javascript
const ALIASES = {
  sh: 'sy', // sha -> sya
  ch: 'ty', // cho -> tyo
  cy: 'ty', // cyo -> tyo
  chy: 'ty', // chyu -> tyu
  shy: 'sy', // shya -> sya
  j: 'zy', // ja -> zya
  jy: 'zy', // jye -> zye

  // 例外
  shi: 'si',
  chi: 'ti',
  tsu: 'tu',
  ji: 'zi',
  fu: 'hu',
};
```

**これにより以下のようなゆらぎが標準で許容されています**：
- `sha` ↔ `sya` → しゃ
- `chi` ↔ `ti` → ち
- `fu` ↔ `hu` → ふ
- `ji` ↔ `zi` → じ

### 3. カスタムマッピング機能

#### 🎨 customKanaMapping（ローマ字→かな変換時）
```javascript
wanakana.toKana('wanakana', { 
  customKanaMapping: { na: 'に', ka: 'bana' } 
});
// => 'わにbanaに'
```

#### 🎨 customRomajiMapping（かな→ローマ字変換時）
```javascript
wanakana.toRomaji('つじぎり', { 
  customRomajiMapping: { じ: 'zi', つ: 'tu', り: 'li' } 
});
// => 'tuzigili'
```

### 4. 「syogi」「shogi」ゆらぎの実装案

#### 方法1: customKanaMappingを使用
```javascript
const romajiVariationsMapping = {
  // syogi ↔ shogi のゆらぎ
  'syogi': 'しょうぎ',
  'shogi': 'しょうぎ',
  
  // その他のゆらぎパターン
  'syasin': 'しゃしん',
  'shasin': 'しゃしん',
  'syouyu': 'しょうゆ',
  'shouyu': 'しょうゆ',
};

// 使用例
wanakana.toKana('syogi', { customKanaMapping: romajiVariationsMapping });
// => 'しょうぎ'
wanakana.toKana('shogi', { customKanaMapping: romajiVariationsMapping });
// => 'しょうぎ'
```

#### 方法2: 動的マッピング関数の作成
```javascript
function createRomajiVariationMap() {
  const variations = {};
  
  // sy/sh ゆらぎの自動生成
  const syPatterns = ['sya', 'syu', 'syo'];
  const shPatterns = ['sha', 'shu', 'sho'];
  
  syPatterns.forEach((sy, index) => {
    const sh = shPatterns[index];
    // 基本マッピングを取得して両方のパターンを作成
    const kana = wanakana.toKana(sy);
    variations[sy] = kana;
    variations[sh] = kana;
  });
  
  return variations;
}
```

### 5. 実装における注意点

#### ⚠️ 制限事項
1. **完全な単語レベルマッピング**: カスタムマッピングは音節レベルでの動作のため、完全な単語（例："syogi"全体）をマッピングする場合は工夫が必要
2. **双方向変換**: ローマ字→かな と かな→ローマ字 で別々のマッピングが必要
3. **パフォーマンス**: 大量のカスタムマッピングは変換速度に影響する可能性

#### 💡 推奨アプローチ
1. **段階的実装**: まず基本的なゆらぎパターン（sy/sh, ti/chi, zi/ji等）から実装
2. **プリセット提供**: よく使われるゆらぎパターンをプリセットとして提供
3. **ユーザーカスタマイズ**: ユーザーが独自のゆらぎルールを追加できる仕組み

## 🛠️ 実装例

### 基本的なゆらぎ対応
```javascript
const commonRomajiVariations = {
  // sy/sh ゆらぎ
  'sya': wanakana.toKana('sya'),
  'sha': wanakana.toKana('sya'),
  'syu': wanakana.toKana('syu'),
  'shu': wanakana.toKana('syu'),
  'syo': wanakana.toKana('syo'),
  'sho': wanakana.toKana('syo'),
  
  // ti/chi ゆらぎ
  'ti': wanakana.toKana('ti'),
  'chi': wanakana.toKana('ti'),
  
  // zi/ji ゆらぎ
  'zi': wanakana.toKana('zi'),
  'ji': wanakana.toKana('zi'),
};

// 使用関数
function convertWithVariations(input) {
  return wanakana.toKana(input, { 
    customKanaMapping: commonRomajiVariations 
  });
}
```

## 📋 次のアクション

1. **プロトタイプ実装**: 基本的なゆらぎ対応機能の実装
2. **テストケース作成**: 様々なゆらぎパターンのテスト
3. **パフォーマンス検証**: 大量のカスタムマッピング使用時の性能測定
4. **ユーザビリティ検討**: ゲーム内での使い勝手の検証

## 🔗 参考リンク
- [WanaKana公式サイト](https://wanakana.com/)
- [WanaKana GitHub](https://github.com/WaniKani/WanaKana)
- [WanaKana NPM](https://www.npmjs.com/package/wanakana)
- [API Documentation](https://wanakana.com/docs/global.html)
