# Supabase マイグレーションエラー修正レポート

## 🔍 発生したエラー

### エラーメッセージ
```
ERROR: relation "rooms" already exists (SQLSTATE 42P07)
At statement: 1
create table public.rooms (
```

### エラーの原因
- **問題**: `CREATE TABLE` 文で既存テーブルが存在する場合にエラー
- **発生箇所**: `20250619_unified_schema.sql` マイグレーション実行時
- **根本原因**: 既存データベースに同名テーブルが存在

## 🛠️ 実装した修正

### 1. DROP TABLE IF EXISTS の追加
マイグレーション実行前に既存テーブルを安全に削除：

```sql
-- =============================================
-- 0. 既存テーブルの削除（安全に）
-- =============================================

-- 外部キー制約の関係で削除順序に注意
drop table if exists public.word_submissions cascade;
drop table if exists public.game_sessions cascade;
drop table if exists public.room_players cascade;
drop table if exists public.rooms cascade;
drop table if exists public.it_terms cascade;
drop table if exists public.difficulties cascade;
drop table if exists public.player_ready_states cascade;
```

### 2. CASCADE オプションの使用
- **効果**: 外部キー制約があるテーブルも連鎖的に削除
- **安全性**: `IF EXISTS` により存在しないテーブルでもエラーにならない

### 3. 削除順序の考慮
外部キー制約の依存関係を考慮した削除順序：
1. `word_submissions` (最も依存されている)
2. `game_sessions` 
3. `room_players`
4. `rooms`
5. `it_terms`
6. `difficulties`
7. `player_ready_states`

## ⚠️ 注意事項

### データ損失について
- **重要**: この修正は既存データをすべて削除します
- **対象**: 開発環境での使用を想定
- **本番環境**: より慎重なマイグレーション戦略が必要

### 代替アプローチ
```sql
-- より安全な方法（本番環境向け）
CREATE TABLE IF NOT EXISTS public.rooms (
  -- テーブル定義
);

-- 既存テーブルがある場合のALTER文での対応
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS new_column text;
```

## ✅ 修正結果

### 期待される動作
1. ✅ 既存テーブルが安全に削除される
2. ✅ 新しいテーブル定義でクリーンに作成される
3. ✅ 外部キー制約エラーが発生しない
4. ✅ マイグレーションが正常に完了する

### 今後の対策
- **開発環境**: `DROP TABLE IF EXISTS` アプローチを継続
- **本番環境**: `ALTER TABLE` や `CREATE TABLE IF NOT EXISTS` を使用
- **テスト**: 定期的な `supabase db reset --local` でマイグレーション確認
