# 単語スキーマ変更計画 📝

## 要件 ✅
単語は表示のためのテキスト（例：スクレイピング）と、それをローマ字に直したもの（例：sukureipingu）が必要になる

## 現状分析 🔍

### 現在の it_terms テーブル構造
```sql
create table public.it_terms (
  id uuid default gen_random_uuid() primary key,
  term text not null unique,              -- 現在：IT用語（英語ベース）
  difficulty_id integer not null,         -- 難易度ID（正規化済み）
  description text,                       -- 説明
  aliases text[] default '{}',            -- エイリアス配列
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 現在のシードデータ例
```sql
-- 現在は全て英語
('React', 2, 'フロントエンドライブラリ', array['ReactJS']),
('JavaScript', 1, 'プログラミング言語', array['JS', 'js']),
('スクレイピング', 2, 'ウェブデータ収集', array['scraping'])
```

## 変更計画 📋

### ステップ1: データベーススキーマ変更
- `term` カラム → `display_text` に変更（表示用日本語テキスト）
- `romaji_text` カラムを新規追加（ローマ字表記）

### ステップ2: 関連ファイル更新
- `/supabase/migrations/20250619_unified_schema.sql` - スキーマ変更
- `/supabase/seed.sql` - サンプルデータ更新
- `/frontend/lib/database.types.ts` - TypeScript型定義更新

### ステップ3: フロントエンド対応
- ゲーム画面での表示ロジック更新
- タイピング入力の判定ロジック更新
- 制約システムの対応

## 詳細仕様 📄

### 新しいテーブル構造
```sql
create table public.it_terms (
  id uuid default gen_random_uuid() primary key,
  display_text text not null,             -- 表示用テキスト（例：スクレイピング）
  romaji_text text not null unique,       -- ローマ字テキスト（例：sukureipingu）
  difficulty_id integer not null,
  description text,
  aliases text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### データ例
```sql
-- 新しいデータ形式
('リアクト', 'riakuto', 2, 'フロントエンドライブラリ', array['React', 'ReactJS']),
('ジャバスクリプト', 'jabasukuriputo', 1, 'プログラミング言語', array['JavaScript', 'JS']),
('スクレイピング', 'sukureipingu', 2, 'ウェブデータ収集', array['scraping'])
```

### ゲーム機能での使い分け
- **表示**: `display_text` を使用（プレイヤーには日本語表示）
- **入力判定**: `romaji_text` でタイピング判定
- **制約システム**: `romaji_text` ベースで制約適用

### 影響範囲
- **データベース**: 
  - `/supabase/migrations/20250619_unified_schema.sql`
  - `/supabase/seed.sql`
- **型定義**: 
  - `/frontend/lib/database.types.ts`
- **ゲームロジック**:
  - `/frontend/app/game/page.tsx`
  - 制約システム関連ファイル（今後作成予定）

## 移行手順 🔄

1. スキーマ変更（ALTER TABLE）
2. 既存データの移行（display_text = term, romaji_text = term の暫定設定）
3. シードデータの更新
4. TypeScript型定義の更新
5. フロントエンドロジックの更新
6. 制約システムの対応確認

## 注意事項 ⚠️
- 既存データの互換性を保つため、段階的に移行
- ローマ字変換は手動で正確性を確保
- インデックスの再作成が必要
- Realtime機能への影響確認が必要

## 完了判定基準 ✅
- [ ] スキーマ変更完了
- [ ] 既存データ移行完了
- [ ] 新規サンプルデータ追加
- [ ] TypeScript型定義更新
- [ ] ゲーム画面での正常動作確認
- [ ] タイピング判定の正常動作確認
