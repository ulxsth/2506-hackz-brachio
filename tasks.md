# IT用語とカテゴリの多対多関係修正計画 📝

## � 計画変更: 統一マイグレーション戦略

### 現在の状況
- 移行データがほとんど存在しない（開発初期段階）
- 5つのマイグレーションファイルが複雑に依存している
- マイグレーション管理のオーバーヘッドが発生

### 🎯 新しい戦略: 単一マイグレーション統合

#### メリット
- ✅ シンプルなスキーマ管理
- ✅ 1回のマイグレーションで完全なスキーマ構築
- ✅ 複雑な依存関係の解消
- ✅ 開発効率の向上

## 実装計画 🚀

### Phase 1: 統一マイグレーション作成
1. **新しい統一ファイル作成**
   - `20250619_unified_schema.sql` として統合
   - 既存5つのマイグレーションの内容を統合
   - it_terms と categories の多対多関係も同時実装

2. **統合内容**
   - 基本テーブル作成（rooms, room_players, game_sessions, word_submissions）
   - カテゴリー・難易度正規化
   - **多対多関係実装** (`it_term_categories` テーブル)
   - ゲーム同期システム（player_ready_states等）
   - インデックス・制約・RLS設定
   - Realtime設定

### Phase 2: 既存マイグレーション削除
1. **既存ファイル削除**
   - `20250617142304_initial_schema.sql`
   - `20250617150759_refactor_schema_normalization.sql`
   - `20250618015925_auto_delete_empty_rooms.sql`
   - `20250618130000_enable_realtime_delete_events.sql`
   - `20250618221134_add_game_sync_system.sql`

### Phase 3: 検証・更新
1. **DB再構築**
   - ローカルDB リセット & 新マイグレーション適用
   - TypeScript型定義の再生成
   - 動作確認

## 多対多関係の詳細設計 �

### 中間テーブル: `it_term_categories`
```sql
create table public.it_term_categories (
  it_term_id uuid not null references public.it_terms(id) on delete cascade,
  category_id integer not null references public.categories(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  primary key (it_term_id, category_id)
);
```

### 変更点
- `it_terms` テーブルから `category_id` カラムを削除
- 1つのIT用語が複数カテゴリに属することが可能
- 柔軟な検索・フィルタリングが可能

## 期待される結果 ✨
- 🎯 **シンプルなマイグレーション管理**
- 🔗 **柔軟な多対多関係**
- 🚀 **開発効率の向上**
- 📈 **スケーラブルなスキーマ設計**
