-- TYPE 2 LIVE - Initial Schema Migration
-- Generated from docs/db-schema.md

-- Enable necessary extensions
create extension if not exists "pg_trgm";

-- 1. rooms (ルーム管理)
create table public.rooms (
  id text primary key,                    -- ルームID（あいことば）
  host_id text not null,                  -- ホストプレイヤーID
  settings jsonb not null default '{}',   -- ゲーム設定
  status text not null default 'waiting', -- ルーム状態
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 制約
  constraint rooms_status_check check (status in ('waiting', 'playing', 'finished'))
);

-- 2. players (プレイヤー管理)
create table public.players (
  id text primary key,                    -- プレイヤーID（UUID）
  room_id text not null,                  -- 所属ルームID
  name text not null,                     -- プレイヤー名
  score integer not null default 0,       -- 現在のスコア
  combo integer not null default 0,       -- 現在のコンボ数
  is_host boolean not null default false, -- ホストフラグ
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 外部キー
  constraint players_room_id_fkey foreign key (room_id) references public.rooms(id) on delete cascade,
  
  -- 制約
  constraint players_score_check check (score >= 0),
  constraint players_combo_check check (combo >= 0),
  constraint players_name_length check (char_length(name) between 1 and 15)
);

-- 3. game_sessions (ゲームセッション管理)
create table public.game_sessions (
  id uuid default gen_random_uuid() primary key, -- セッションID
  room_id text not null,                          -- 対象ルームID
  status text not null default 'waiting',         -- ゲーム状態
  start_time timestamp with time zone,            -- 開始時刻
  end_time timestamp with time zone,              -- 終了時刻
  current_constraints jsonb default '[]',         -- 現在の制約条件
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 外部キー
  constraint game_sessions_room_id_fkey foreign key (room_id) references public.rooms(id) on delete cascade,
  
  -- 制約
  constraint game_sessions_status_check check (status in ('waiting', 'playing', 'finished')),
  constraint game_sessions_time_check check (start_time is null or end_time is null or start_time <= end_time)
);

-- 4. word_submissions (単語提出履歴)
create table public.word_submissions (
  id uuid default gen_random_uuid() primary key,     -- 提出ID
  game_session_id uuid not null,                     -- ゲームセッションID
  player_id text not null,                           -- プレイヤーID
  word text not null,                                -- 提出単語
  score integer not null,                            -- 獲得スコア
  combo_at_time integer not null default 0,          -- 提出時のコンボ数
  constraints_met jsonb default '[]',                -- 満たした制約
  is_valid boolean not null,                         -- 有効性
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 外部キー
  constraint word_submissions_game_session_id_fkey foreign key (game_session_id) references public.game_sessions(id) on delete cascade,
  constraint word_submissions_player_id_fkey foreign key (player_id) references public.players(id) on delete cascade,
  
  -- 制約
  constraint word_submissions_score_check check (score >= 0),
  constraint word_submissions_combo_check check (combo_at_time >= 0),
  constraint word_submissions_word_length check (char_length(word) >= 1)
);

-- 5. it_terms (IT用語辞書)
create table public.it_terms (
  id uuid default gen_random_uuid() primary key, -- 用語ID
  term text not null unique,                     -- IT用語
  category text not null,                        -- カテゴリー
  difficulty integer not null,                   -- 難易度（1-10）
  description text,                              -- 説明
  aliases text[] default '{}',                   -- 別名・表記ゆれ
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 制約
  constraint it_terms_difficulty_check check (difficulty between 1 and 10),
  constraint it_terms_category_check check (category in ('web', 'database', 'ai', 'security', 'infrastructure', 'programming', 'other')),
  constraint it_terms_term_length check (char_length(term) between 1 and 50)
);

-- パフォーマンス最適化用インデックス
-- プレイヤー検索用
create index idx_players_room_id on public.players(room_id);
create index idx_players_host on public.players(room_id, is_host) where is_host = true;

-- ゲームセッション検索用
create index idx_game_sessions_room_id on public.game_sessions(room_id);
create index idx_game_sessions_status on public.game_sessions(status);
create index idx_game_sessions_active on public.game_sessions(room_id, status) where status = 'playing';

-- 単語提出検索用
create index idx_word_submissions_game_session_id on public.word_submissions(game_session_id);
create index idx_word_submissions_player_id on public.word_submissions(player_id);
create index idx_word_submissions_game_player on public.word_submissions(game_session_id, player_id);

-- IT用語検索用
create index idx_it_terms_category on public.it_terms(category);
create index idx_it_terms_difficulty on public.it_terms(difficulty);
create index idx_it_terms_term_trgm on public.it_terms using gin (term gin_trgm_ops);

-- Row Level Security (RLS) - 開発用設定
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.game_sessions enable row level security;
alter table public.word_submissions enable row level security;
alter table public.it_terms enable row level security;

-- 開発用：全操作許可
create policy "Allow all operations on rooms" on public.rooms for all using (true);
create policy "Allow all operations on players" on public.players for all using (true);
create policy "Allow all operations on game_sessions" on public.game_sessions for all using (true);
create policy "Allow all operations on word_submissions" on public.word_submissions for all using (true);
create policy "Allow all operations on it_terms" on public.it_terms for all using (true);

-- Realtime設定
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.word_submissions;
