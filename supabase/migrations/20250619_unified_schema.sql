-- =============================================
-- TYPE 2 LIVE - 統一スキーママイグレーション
-- 既存5つのマイグレーションを統合 + 多対多関係実装
-- Created: 2025-06-19
-- =============================================

-- 必要な拡張機能を有効化
create extension if not exists "pg_trgm";

-- =============================================
-- 1. 基本テーブル作成
-- =============================================

-- 1.1 rooms (ルーム管理)
create table public.rooms (
  id text primary key,                    -- ルームID（あいことば）
  host_id text not null,                  -- ホストプレイヤーID
  settings jsonb not null default '{}',   -- ゲーム設定
  status text not null default 'waiting', -- ルーム状態
  game_state jsonb default '{}',          -- ゲーム状態（追加）
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 制約
  constraint rooms_status_check check (status in ('waiting', 'preparing', 'playing', 'finished'))
);

-- 1.2 room_players (プレイヤー管理) - playersから名前変更
create table public.room_players (
  id text primary key,                    -- プレイヤーID（UUID）
  room_id text not null,                  -- 所属ルームID
  name text not null,                     -- プレイヤー名
  score integer not null default 0,       -- 現在のスコア
  combo integer not null default 0,       -- 現在のコンボ数
  is_host boolean not null default false, -- ホストフラグ
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 外部キー
  constraint room_players_room_id_fkey foreign key (room_id) references public.rooms(id) on delete cascade,
  
  -- 制約
  constraint room_players_score_check check (score >= 0),
  constraint room_players_combo_check check (combo >= 0),
  constraint room_players_name_length check (char_length(name) between 1 and 15)
);

-- 1.3 game_sessions (ゲームセッション管理)
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

-- 1.4 word_submissions (単語提出履歴)
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
  constraint word_submissions_player_id_fkey foreign key (player_id) references public.room_players(id) on delete cascade,
  
  -- 制約
  constraint word_submissions_score_check check (score >= 0),
  constraint word_submissions_combo_check check (combo_at_time >= 0),
  constraint word_submissions_word_length check (char_length(word) >= 1)
);

-- =============================================
-- 2. マスターテーブル作成 (正規化)
-- =============================================

-- 2.1 categories (カテゴリーマスター)
create table public.categories (
  id serial primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.2 difficulties (難易度マスター)
create table public.difficulties (
  id serial primary key,
  name text not null unique,
  level integer not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.3 it_terms (IT用語辞書) - 正規化版
create table public.it_terms (
  id uuid default gen_random_uuid() primary key,
  term text not null unique,
  difficulty_id integer not null references public.difficulties(id),
  description text,
  aliases text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 制約
  constraint it_terms_term_length check (char_length(term) between 1 and 50)
);

-- 2.4 it_term_categories (多対多中間テーブル) - 🎯 新規追加
create table public.it_term_categories (
  it_term_id uuid not null references public.it_terms(id) on delete cascade,
  category_id integer not null references public.categories(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 複合主キー
  primary key (it_term_id, category_id)
);

-- =============================================
-- 3. ゲーム同期システム
-- =============================================

-- 3.1 サーバー時刻取得関数
create or replace function get_server_time()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

-- 3.2 プレイヤー準備状態テーブル
create table public.player_ready_states (
  player_id text primary key,
  room_id text not null,
  assets_loaded boolean not null default false,    -- アセット読み込み完了
  network_ready boolean not null default false,    -- ネットワーク接続確認完了
  ui_ready boolean not null default false,         -- UI準備完了
  ready_at timestamp with time zone,               -- 準備完了時刻
  last_heartbeat timestamp with time zone default now(), -- 最後のハートビート
  latency_ms integer,                              -- クライアント測定レイテンシ
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  -- 外部キー制約
  constraint player_ready_states_player_id_fkey 
    foreign key (player_id) references public.room_players(id) on delete cascade,
  constraint player_ready_states_room_id_fkey 
    foreign key (room_id) references public.rooms(id) on delete cascade,
    
  -- チェック制約
  constraint player_ready_states_latency_check 
    check (latency_ms is null or latency_ms >= 0)
);

-- 3.3 プレイヤー準備状態の更新関数
create or replace function update_player_ready_state(
  p_player_id text,
  p_room_id text,
  p_assets_loaded boolean default null,
  p_network_ready boolean default null,
  p_ui_ready boolean default null,
  p_latency_ms integer default null
)
returns json
language plpgsql
as $$
declare
  ready_state record;
  all_ready boolean;
  ready_count integer;
  total_count integer;
begin
  -- プレイヤー準備状態を更新
  insert into public.player_ready_states (
    player_id, room_id, assets_loaded, network_ready, ui_ready, latency_ms, updated_at
  ) values (
    p_player_id, p_room_id, 
    coalesce(p_assets_loaded, false),
    coalesce(p_network_ready, false), 
    coalesce(p_ui_ready, false),
    p_latency_ms,
    now()
  )
  on conflict (player_id) 
  do update set
    assets_loaded = coalesce(p_assets_loaded, player_ready_states.assets_loaded),
    network_ready = coalesce(p_network_ready, player_ready_states.network_ready),
    ui_ready = coalesce(p_ui_ready, player_ready_states.ui_ready),
    latency_ms = coalesce(p_latency_ms, player_ready_states.latency_ms),
    last_heartbeat = now(),
    updated_at = now(),
    ready_at = case 
      when coalesce(p_assets_loaded, player_ready_states.assets_loaded) 
           and coalesce(p_network_ready, player_ready_states.network_ready)
           and coalesce(p_ui_ready, player_ready_states.ui_ready)
           and player_ready_states.ready_at is null
      then now()
      else player_ready_states.ready_at
    end;

  -- 更新後の状態を取得
  select * into ready_state 
  from public.player_ready_states 
  where player_id = p_player_id;

  -- ルーム内の全プレイヤー準備状況を確認
  select 
    count(*) filter (where assets_loaded and network_ready and ui_ready) as ready_count,
    count(*) as total_count
  into ready_count, total_count
  from public.player_ready_states 
  where room_id = p_room_id;

  all_ready := (ready_count = total_count and total_count > 0);

  return json_build_object(
    'success', true,
    'player_state', row_to_json(ready_state),
    'room_ready_count', ready_count,
    'room_total_count', total_count,
    'all_ready', all_ready
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$$;

-- 3.4 ゲーム準備開始関数
create or replace function start_game_preparation(
  p_room_id text,
  p_preparation_timeout integer default 60,
  p_countdown_duration integer default 5
)
returns json
language plpgsql
as $$
declare
  room_record record;
  preparation_deadline timestamptz;
begin
  -- ルーム情報取得
  select * into room_record from public.rooms where id = p_room_id;
  if not found then
    raise exception 'Room not found: %', p_room_id;
  end if;

  -- 準備フェーズ開始時刻を計算
  preparation_deadline := now() + (p_preparation_timeout || ' seconds')::interval;

  -- ルームのゲーム状態を更新
  update public.rooms 
  set 
    game_state = jsonb_build_object(
      'phase', 'preparing',
      'preparation_start', now(),
      'preparation_deadline', preparation_deadline,
      'preparation_timeout', p_preparation_timeout,
      'countdown_duration', p_countdown_duration
    ),
    status = 'preparing',
    updated_at = now()
  where id = p_room_id;

  -- 既存のプレイヤー準備状態をリセット
  delete from public.player_ready_states where room_id = p_room_id;

  return json_build_object(
    'success', true,
    'phase', 'preparing',
    'preparation_deadline', preparation_deadline,
    'preparation_timeout', p_preparation_timeout
  );
end;
$$;

-- 3.5 カウントダウン開始関数
create or replace function start_game_countdown(
  p_room_id text
)
returns json
language plpgsql
as $$
declare
  room_record record;
  countdown_start timestamptz;
  game_start timestamptz;
  countdown_duration integer;
begin
  -- ルーム情報取得
  select * into room_record from public.rooms where id = p_room_id;
  if not found then
    raise exception 'Room not found: %', p_room_id;
  end if;

  -- ゲーム状態から設定取得
  countdown_duration := coalesce((room_record.game_state->>'countdown_duration')::integer, 5);
  countdown_start := now();
  game_start := countdown_start + (countdown_duration || ' seconds')::interval;

  -- ルームのゲーム状態を更新
  update public.rooms 
  set 
    game_state = room_record.game_state || jsonb_build_object(
      'phase', 'countdown',
      'countdown_start', countdown_start,
      'game_start', game_start
    ),
    updated_at = now()
  where id = p_room_id;

  return json_build_object(
    'success', true,
    'phase', 'countdown',
    'countdown_start', countdown_start,
    'game_start', game_start,
    'countdown_duration', countdown_duration
  );
end;
$$;

-- 3.6 ゲーム開始関数
create or replace function start_game_session(
  p_room_id text
)
returns json
language plpgsql
as $$
declare
  room_record record;
  game_start timestamptz;
begin
  -- ルーム情報取得
  select * into room_record from public.rooms where id = p_room_id;
  if not found then
    raise exception 'Room not found: %', p_room_id;
  end if;

  game_start := now();

  -- ルームのゲーム状態を更新
  update public.rooms 
  set 
    game_state = room_record.game_state || jsonb_build_object(
      'phase', 'playing',
      'actual_start_time', game_start
    ),
    status = 'playing',
    updated_at = now()
  where id = p_room_id;

  return json_build_object(
    'success', true,
    'phase', 'playing',
    'actual_start_time', game_start
  );
end;
$$;

-- =============================================
-- 4. インデックス作成
-- =============================================

-- 基本テーブル用インデックス
create index idx_room_players_room_id on public.room_players(room_id);
create index idx_room_players_host on public.room_players(room_id, is_host) where is_host = true;

create index idx_game_sessions_room_id on public.game_sessions(room_id);
create index idx_game_sessions_status on public.game_sessions(status);
create index idx_game_sessions_active on public.game_sessions(room_id, status) where status = 'playing';

create index idx_word_submissions_game_session_id on public.word_submissions(game_session_id);
create index idx_word_submissions_player_id on public.word_submissions(player_id);
create index idx_word_submissions_game_player on public.word_submissions(game_session_id, player_id);

-- IT用語関連インデックス
create index idx_it_terms_difficulty_id on public.it_terms(difficulty_id);
create index idx_it_terms_term on public.it_terms(term);
create index idx_it_terms_term_trgm on public.it_terms using gin (term gin_trgm_ops);

-- 多対多中間テーブル用インデックス - 🎯 新規追加
create index idx_it_term_categories_it_term_id on public.it_term_categories(it_term_id);
create index idx_it_term_categories_category_id on public.it_term_categories(category_id);

-- ゲーム同期システム用インデックス
create index idx_player_ready_states_room_id on public.player_ready_states(room_id);
create index idx_player_ready_states_ready_at on public.player_ready_states(ready_at);
create index idx_player_ready_states_heartbeat on public.player_ready_states(last_heartbeat);

-- =============================================
-- 5. Row Level Security (RLS) 設定
-- =============================================

-- 全テーブルでRLSを有効化
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_sessions enable row level security;
alter table public.word_submissions enable row level security;
alter table public.categories enable row level security;
alter table public.difficulties enable row level security;
alter table public.it_terms enable row level security;
alter table public.it_term_categories enable row level security;
alter table public.player_ready_states enable row level security;

-- 開発用：全操作許可ポリシー
create policy "Allow all operations on rooms" on public.rooms for all using (true);
create policy "Allow all operations on room_players" on public.room_players for all using (true);
create policy "Allow all operations on game_sessions" on public.game_sessions for all using (true);
create policy "Allow all operations on word_submissions" on public.word_submissions for all using (true);
create policy "Allow all operations on categories" on public.categories for all using (true);
create policy "Allow all operations on difficulties" on public.difficulties for all using (true);
create policy "Allow all operations on it_terms" on public.it_terms for all using (true);
create policy "Allow all operations on it_term_categories" on public.it_term_categories for all using (true);
create policy "Allow all operations on player_ready_states" on public.player_ready_states for all using (true);

-- =============================================
-- 6. Realtime 設定
-- =============================================

-- 全テーブルをRealtimeに追加
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.word_submissions;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.difficulties;
alter publication supabase_realtime add table public.it_terms;
alter publication supabase_realtime add table public.it_term_categories;
alter publication supabase_realtime add table public.player_ready_states;

-- =============================================
-- 7. 特殊設定
-- =============================================

-- room_players テーブルの削除イベント設定
alter table public.room_players replica identity full;

-- =============================================
-- 8. コメント追加
-- =============================================

comment on table public.rooms is 'ゲームルーム管理テーブル';
comment on table public.room_players is 'ルーム参加プレイヤー情報';
comment on table public.game_sessions is 'ゲームセッション管理';
comment on table public.word_submissions is '単語提出履歴';
comment on table public.categories is 'IT用語のカテゴリーマスター';
comment on table public.difficulties is '難易度レベルマスター';
comment on table public.it_terms is 'IT用語辞書（正規化版）';
comment on table public.it_term_categories is 'IT用語とカテゴリーの多対多関係';
comment on table public.player_ready_states is 'プレイヤーのゲーム開始準備状態を管理するテーブル';

comment on function get_server_time() is 'サーバーの現在時刻を取得（クライアント時刻同期用）';
comment on function update_player_ready_state(text, text, boolean, boolean, boolean, integer) is 'プレイヤーの準備状態を更新し、ルーム全体の準備状況を返す';
comment on function start_game_preparation(text, integer, integer) is 'ゲーム準備フェーズを開始する';
comment on function start_game_countdown(text) is 'ゲームカウントダウンを開始する';
comment on function start_game_session(text) is 'ゲームセッションを開始する';
