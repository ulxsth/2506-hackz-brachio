# テーブル再設計計画：カテゴリ機能削除 📋

## 🎯 計画の概要

ユーザーから「カテゴリなくそう」の指示により、現在のカテゴリ機能（`categories`テーブル、`it_term_categories`中間テーブル）を削除し、シンプルなスキーマに再設計します。

## 📊 現在の状況分析

### 関連ファイル・テーブル一覧

#### データベース関連
- `/home/yotu/github/2506-hackz-brachio/supabase/migrations/20250619_unified_schema.sql`
  - `categories` テーブル (L89-95)
  - `it_term_categories` 中間テーブル (L110-116) 
  - インデックス設定 (L397-399)
  - RLS設定 (L416)
  - Realtime設定 (L426)
- `/home/yotu/github/2506-hackz-brachio/supabase/seed.sql`
  - カテゴリマスタデータ (L7-14)
  - 多対多関係データ (L77-272)
- `/home/yotu/github/2506-hackz-brachio/frontend/lib/database.types.ts`
  - TypeScript型定義 (L34-50, L118-140)

#### フロントエンド関連
- `/home/yotu/github/2506-hackz-brachio/frontend/app/create-room/page.tsx`
  - カテゴリ選択機能 (L11, L149-166, L176-182)
- `/home/yotu/github/2506-hackz-brachio/frontend/app/room/page.tsx`
  - カテゴリ表示機能 (L61)
- `/home/yotu/github/2506-hackz-brachio/frontend/lib/supabase.ts`
  - Category型定義 (L20)

### 現在のカテゴリ使用状況
1. **ルーム作成時**: プレイヤーがカテゴリを選択（全分野、Web開発、データベース、AI、セキュリティ、インフラ、プログラミング）
2. **ルーム設定**: 選択したカテゴリがrooms.settingsに保存
3. **制約システム**: カテゴリを基にした制約が適用される想定

## 🎯 削除対象

### テーブル
1. `public.categories` - カテゴリマスタテーブル
2. `public.it_term_categories` - IT用語とカテゴリの中間テーブル

### 関連要素
- インデックス: `idx_it_term_categories_*`
- RLSポリシー: categories, it_term_categories用
- Realtime設定: categories, it_term_categories用
- シードデータ: カテゴリ関連全データ

## 📝 実装手順

### Phase 1: データベーススキーマ修正
1. **新マイグレーション作成**
   ```
   supabase/migrations/20250619_remove_categories.sql
   ```

2. **削除操作**
   - `it_term_categories` テーブル削除（CASCADE）
   - `categories` テーブル削除
   - 関連インデックス削除
   - RLSポリシー削除
   - Realtime publication削除

### Phase 2: シードデータ修正
1. **seed.sql修正**
   - カテゴリマスタデータ削除 (L7-14)
   - 多対多関係データ削除 (L77-272)

### Phase 3: TypeScript型定義更新
1. **database.types.ts再生成**
   ```bash
   cd frontend && npm run db:types
   ```

### Phase 4: フロントエンド修正
1. **create-room/page.tsx**
   - カテゴリ選択UI削除
   - settings からcategory削除

2. **room/page.tsx**
   - カテゴリ表示削除

3. **supabase.ts**
   - Category型削除

## ⚠️ 影響範囲の確認

### 制約システムへの影響
- カテゴリベースの制約が使用できなくなる
- 難易度ベースの制約のみ利用可能
- プレイヤビリティは維持される

### ゲームバランスへの影響
- カテゴリ制約係数が適用されなくなる
- より単純な制約システムに
- ゲームの複雑さが軽減される

## 🔄 代替案・今後の拡張

カテゴリ機能が必要になった場合の復旧方法:
1. `it_terms`テーブルに`tags JSONB`カラム追加
2. タグベースの柔軟な分類システム実装
3. 必要に応じて制約システムでタグ参照

## ✅ 成功条件

- [x] カテゴリ関連テーブル・機能の完全削除
- [x] フロントエンドの正常動作確認
- [x] ゲーム機能の基本動作確認
- [x] データベース型定義の整合性確認

## 🚨 注意事項

- **既存データへの影響**: 開発段階のため、カテゴリ関連データの消失は問題なし
- **コミット戦略**: semantic commit で段階的に実装
- **テスト**: 各フェーズ後に動作確認を実施
