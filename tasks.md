# WanaKanaベースリアルタイムローマ字入力検証システム実装計画 🎯

## 📝 計画概要
- **作成日**: 2025年6月21日
- **対象**: it_termsテーブルのromaji_text, aliasesカラム削除とWanaKanaベースリアルタイム検証システムの実装
- **目的**: レガシーなローマ字保存システムから動的変換・検証システムへの移行

## 🎯 実装スコープ

### Phase 1: データベーススキーマ変更 🗃️
1. **it_termsテーブルからのカラム削除**
   - `romaji_text` カラムの削除
   - `aliases` カラムの削除
   - 関連するインデックスの削除
   - 制約の更新

### Phase 2: コードベース修正 🔧
1. **型定義の更新**
   - `frontend/lib/database.types.ts` の修正
   - ITTerm型からromaji_text, aliasesフィールドの削除

2. **ターン管理システムの修正**
   - `frontend/lib/turn-manager.ts`: romaji_textへの参照を削除
   - display_textからWanaKanaによる動的変換に変更

3. **ゲーム画面の修正**
   - `frontend/app/game/page.tsx`: romaji_textベースの検証を削除
   - `frontend/app/game/page-backup.tsx`: 同上

### Phase 3: WanaKanaリアルタイム検証実装 🌸
1. **WanaKanaライブラリの導入**
   - パッケージインストール
   - カスタムローマ字ゆらぎマッピングの実装

2. **リアルタイム検証モジュール作成**
   - `frontend/lib/wanakana-validator.ts` の新規作成
   - ローマ字→ひらがな変換 + ゆらぎ許容機能
   - IT用語マッチング機能

3. **タイピングUIのリアルタイム更新**
   - 入力中の文字をリアルタイムでひらがな表示
   - 候補マッチングの表示
   - 入力支援機能

## 📂 影響範囲ファイル

### データベース関連
- `supabase/migrations/20250619_unified_schema.sql`
- 新規マイグレーションファイル作成

### フロントエンド型定義
- `frontend/lib/database.types.ts`
- `frontend/lib/supabase.ts` (型エイリアス)

### ビジネスロジック
- `frontend/lib/turn-manager.ts`
- `frontend/app/game/page.tsx`
- `frontend/app/game/page-backup.tsx`

### 新規作成ファイル
- `frontend/lib/wanakana-validator.ts`
- `frontend/hooks/useWanaKanaValidator.ts`
- `frontend/components/TypingInput.tsx`

## 🛠️ 技術詳細

### WanaKanaカスタムマッピング
```typescript
const customRomajiVariations = {
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
```

### 検証ロジック
```typescript
class WanaKanaValidator {
  validateInput(input: string, targetWord: string): {
    isValid: boolean;
    partialMatch: boolean;
    hiraganaPreview: string;
    suggestions: string[];
  }
}
```

## 🔄 実装手順

1. **調査完了** ✅
   - コードベースの影響範囲特定
   - WanaKana機能調査完了

2. **データベーススキーマ変更**
   - romaji_text, aliasesカラム削除マイグレーション
   - インデックス・制約の調整

3. **型定義・基本ロジック修正**
   - database.types.ts更新
   - ターン管理システム修正
   - ゲーム画面の基本修正

4. **WanaKana検証システム実装**
   - ライブラリ導入
   - バリデーター実装
   - リアルタイムUI実装

5. **テスト・デバッグ**
   - 動作確認
   - パフォーマンス検証
   - ユーザビリティ調整

## 🚨 注意事項

- **データ移行は不要**: romaji_textは動的変換するため既存データ保持不要
- **ゆらぎパターン**: 段階的に実装（基本→応用の順）
- **パフォーマンス**: 大量のカスタムマッピングは性能に影響する可能性
- **ユーザビリティ**: リアルタイム変換による入力支援の実装

## 💾 Gitコミット戦略

1. `feat: remove romaji_text and aliases columns from it_terms schema`
2. `refactor: update types and remove romaji_text references`
3. `feat: add wanakana library and basic validation module`
4. `feat: implement real-time romaji input validation`
5. `test: add comprehensive validation tests`

---

**次のステップ**: 実装フェーズに進む準備完了 🚀
