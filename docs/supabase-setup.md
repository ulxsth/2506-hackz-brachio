# Supabase セットアップガイド
## TYPE 2 LIVE - Realtime機能

### 🎯 セットアップ手順

#### 1. Supabaseプロジェクト作成
1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubでサインイン
4. 「New Project」をクリック
5. プロジェクト情報を入力：
   - **Name**: `type2live-game`
   - **Database Password**: 強力なパスワードを設定
   - **Region**: `Northeast Asia (Tokyo)`

#### 2. データベーステーブル作成

詳細なテーブル設計は [db-schema.md](./db-schema.md) を参照してください。

SQL Editorで以下を実行：

```sql
-- Enable Row Level Security
alter table if exists public.rooms enable row level security;
alter table if exists public.players enable row level security;
alter table if exists public.game_sessions enable row level security;
alter table if exists public.word_submissions enable row level security;

-- Create basic tables (詳細は db-schema.md を参照)
create table public.rooms (
  id text primary key,
  host_id text not null,
  settings jsonb not null default '{}',
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.players (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  name text not null,
  score integer not null default 0,
  combo integer not null default 0,
  is_host boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 追加のテーブル作成は db-schema.md のSQLを実行してください

-- Create indexes for better performance
create index idx_players_room_id on public.players(room_id);

-- Set up Row Level Security policies (Allow all for development)
create policy "Allow all operations on rooms" on public.rooms for all using (true);
create policy "Allow all operations on players" on public.players for all using (true);

-- Enable Realtime for tables
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
```

#### 3. 環境変数設定

`.env.local`ファイルを作成：

```bash
# Supabaseプロジェクト設定ページから取得
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### 4. Realtime機能の有効化確認

1. Supabase Dashboard → Settings → API
2. 「Realtime」セクションで以下を確認：
   - ✅ Realtime is enabled
   - ✅ Database tables are replicated

#### 5. 動作確認

```bash
cd frontend
pnpm dev
```

1. `http://localhost:3000` にアクセス
2. メニュー → ルーム作成
3. 別ブラウザでルーム参加
4. リアルタイムでプレイヤーが表示されることを確認

### 🛠️ トラブルシューティング

#### エラー: "Failed to create room"
- [ ] Supabase URL/キーが正しく設定されているか確認
- [ ] テーブルが正しく作成されているか確認
- [ ] RLSポリシーが設定されているか確認

#### エラー: "Realtime subscription failed"
- [ ] Realtimeが有効になっているか確認
- [ ] テーブルがpublicationに追加されているか確認

#### プレイヤーがリアルタイム更新されない
- [ ] Realtime channelが正しく設定されているか確認
- [ ] postgres_changesイベントリスナーが正しく設定されているか確認

### 📊 データベース構造

詳細なテーブル設計、制約、インデックス等については [db-schema.md](./db-schema.md) を参照してください。

#### 基本構造
- **rooms**: ルーム管理（ID、ホスト、設定、状態）
- **players**: プレイヤー管理（ID、名前、スコア、コンボ）
- **game_sessions**: ゲーム進行管理（開始・終了時刻等）
- **word_submissions**: 単語提出履歴（単語、スコア、有効性等）
- **it_terms**: IT用語辞書（用語、カテゴリー、難易度等）

### 🔐 セキュリティ設定（Production用）

本番環境でのセキュリティ強化については [db-schema.md](./db-schema.md) の「Row Level Security (RLS)」セクションを参照してください。

開発環境では全操作を許可していますが、本番環境では以下の制限を追加：
- ルーム更新はホストのみ
- プレイヤー情報の更新は本人のみ  
- IT用語の更新は管理者のみ

がんばルビィ！この手順でSupabase Realtimeを使った部屋立て機能が完成するルビィ～✨
