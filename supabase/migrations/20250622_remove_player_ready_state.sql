-- マイグレーション: player_ready_state テーブルと関連機能の削除
-- 作成日: 2025-06-22
-- 理由: 未使用の複雑なゲーム同期システムを削除してコードベースを簡素化

-- 1. 関連RPC関数の削除
drop function if exists public.update_player_ready_state(text, text, boolean, boolean, boolean, integer);
drop function if exists public.start_game_preparation(text, integer, integer);  
drop function if exists public.start_game_countdown(text);

-- 2. player_ready_states テーブルの削除
drop table if exists public.player_ready_states cascade;

-- 3. 使用されていないゲーム同期関連のコメント追加
comment on table public.rooms is 'ゲームルーム管理テーブル。シンプルな開始方式を採用し、複雑な準備確認システムは不要。';
comment on table public.room_players is 'ルーム参加プレイヤー管理テーブル。リアルタイムスコア更新とランキング表示に使用。';
