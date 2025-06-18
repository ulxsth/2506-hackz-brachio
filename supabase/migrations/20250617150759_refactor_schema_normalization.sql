-- =============================================
-- スキーマ正規化マイグレーション
-- 1. it_terms テーブルの正規化 (category, difficulty を別テーブルに)
-- 2. players テーブルを room_players にリネーム
-- 3. 関連する外部キー制約の更新
-- =============================================

-- 1. カテゴリーマスターテーブル作成
create table public.categories (
  id serial primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 難易度マスターテーブル作成
create table public.difficulties (
  id serial primary key,
  name text not null unique,
  level integer not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. it_terms テーブルを正規化
-- 既存テーブルから新しいテーブル構造に移行
create table public.it_terms_new (
  id uuid default gen_random_uuid() primary key,
  term text not null,
  category_id integer not null references public.categories(id),
  difficulty_id integer not null references public.difficulties(id),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 既存データがあれば変換（現在は空なので省略）
-- insert into public.it_terms_new (term, category_id, difficulty_id, description)
-- select 
--   term,
--   (select id from categories where name = it_terms.category),
--   (select id from difficulties where level = it_terms.difficulty),
--   description
-- from public.it_terms;

-- 古いテーブルを削除して新しいテーブルをリネーム
drop table if exists public.it_terms;
alter table public.it_terms_new rename to it_terms;

-- 5. players テーブルを room_players にリネーム
-- 関連する外部キー制約を事前に削除
alter table public.word_submissions drop constraint if exists word_submissions_player_id_fkey;

-- テーブルリネーム実行
alter table public.players rename to room_players;

-- 6. 外部キー制約を再作成
alter table public.word_submissions 
  add constraint word_submissions_player_id_fkey 
  foreign key (player_id) references public.room_players(id) on delete cascade;

-- 7. インデックス作成
create index idx_it_terms_category_id on public.it_terms(category_id);
create index idx_it_terms_difficulty_id on public.it_terms(difficulty_id);
create index idx_it_terms_term on public.it_terms(term);
create index idx_room_players_room_id on public.room_players(room_id);

-- 8. RLS (Row Level Security) ポリシー設定
alter table public.categories enable row level security;
alter table public.difficulties enable row level security;
alter table public.it_terms enable row level security;

-- 全てのテーブルに対して全操作を許可（開発用）
create policy "Allow all operations on categories" on public.categories for all using (true);
create policy "Allow all operations on difficulties" on public.difficulties for all using (true);
create policy "Allow all operations on it_terms" on public.it_terms for all using (true);

-- room_players テーブルのポリシーを再作成
drop policy if exists "Allow all operations on players" on public.room_players;
create policy "Allow all operations on room_players" on public.room_players for all using (true);

-- 9. Realtime publication に新しいテーブルを追加
do $$
begin
  -- 各テーブルを条件付きで追加
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'difficulties'
  ) then
    alter publication supabase_realtime add table public.difficulties;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'it_terms'
  ) then
    alter publication supabase_realtime add table public.it_terms;
  end if;

  -- players テーブルがpublicationに存在する場合は削除
  if exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'players'
  ) then
    alter publication supabase_realtime drop table public.players;
  end if;

  -- room_players テーブルを追加（存在しない場合のみ）
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'room_players'
  ) then
    alter publication supabase_realtime add table public.room_players;
  end if;
end $$;

-- 10. コメント追加
comment on table public.categories is 'IT用語のカテゴリーマスター';
comment on table public.difficulties is '難易度レベルマスター';  
comment on table public.it_terms is 'IT用語辞書（正規化版）';
comment on table public.room_players is 'ルーム参加プレイヤー情報';
