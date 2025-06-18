-- ゲーム同期システム Migration
-- Phase 1: サーバー時刻同期とプレイヤー準備状態管理

-- 1. サーバー時刻取得関数
create or replace function get_server_time()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

-- 2. プレイヤー準備状態テーブル
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

-- 3. rooms テーブルにゲーム状態カラム追加
alter table public.rooms 
add column if not exists game_state jsonb default '{}';

-- ゲーム状態の構造例:
-- {
--   "phase": "waiting" | "preparing" | "countdown" | "playing" | "finished",
--   "start_time": "2025-06-19T10:00:00Z",
--   "countdown_start": "2025-06-19T09:59:55Z", 
--   "preparation_deadline": "2025-06-19T09:59:00Z",
--   "preparation_timeout": 60,
--   "countdown_duration": 5
-- }

-- 4. プレイヤー準備状態の更新関数
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

  -- ルーム内の準備完了状況を確認
  select 
    count(*) filter (where assets_loaded and network_ready and ui_ready) as ready,
    count(*) as total
  into ready_count, total_count
  from public.player_ready_states prs
  where prs.room_id = p_room_id;

  all_ready := (ready_count = total_count and total_count > 0);

  -- 結果を返す
  return json_build_object(
    'player_ready_state', to_json(ready_state),
    'room_ready_summary', json_build_object(
      'ready_count', ready_count,
      'total_count', total_count,
      'all_ready', all_ready
    )
  );
end;
$$;

-- 5. ゲーム準備開始関数
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
  -- ルーム存在確認
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

-- 6. カウントダウン開始関数
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
      'game_start_time', game_start
    ),
    status = 'countdown',
    updated_at = now()
  where id = p_room_id;

  return json_build_object(
    'success', true,
    'phase', 'countdown',
    'countdown_start', countdown_start,
    'game_start_time', game_start,
    'countdown_duration', countdown_duration
  );
end;
$$;

-- 7. ゲーム開始関数
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

-- 8. インデックス作成
create index if not exists player_ready_states_room_id_idx 
  on public.player_ready_states(room_id);

create index if not exists player_ready_states_ready_at_idx 
  on public.player_ready_states(ready_at) 
  where ready_at is not null;

create index if not exists rooms_game_state_phase_idx 
  on public.rooms using gin ((game_state->'phase'));

-- 9. RLS (Row Level Security) ポリシー
alter table public.player_ready_states enable row level security;

-- プレイヤーは自分の準備状態のみ更新可能
create policy "Players can update own ready state" 
  on public.player_ready_states 
  for update 
  using (auth.uid()::text = player_id);

-- 同じルームのメンバーは準備状態を閲覧可能
create policy "Room members can view ready states" 
  on public.player_ready_states 
  for select 
  using (room_id in (
    select room_id from public.room_players 
    where id = auth.uid()::text
  ));

-- プレイヤーは自分の準備状態を挿入可能
create policy "Players can insert own ready state" 
  on public.player_ready_states 
  for insert 
  with check (auth.uid()::text = player_id);

-- 10. Realtime用の発行設定
alter publication supabase_realtime 
  add table public.player_ready_states;

-- コメント追加
comment on table public.player_ready_states is 'プレイヤーのゲーム開始準備状態を管理するテーブル';
comment on function get_server_time() is 'サーバーの現在時刻を取得（クライアント時刻同期用）';
comment on function update_player_ready_state(text, text, boolean, boolean, boolean, integer) is 'プレイヤーの準備状態を更新し、ルーム全体の準備状況を返す';
comment on function start_game_preparation(text, integer, integer) is 'ゲーム準備フェーズを開始する';
comment on function start_game_countdown(text) is 'ゲームカウントダウンを開始する';
comment on function start_game_session(text) is 'ゲームセッションを開始する';
